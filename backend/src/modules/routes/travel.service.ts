import { z } from "zod";
import { getPool, sql } from "../../config/db";
import { AuthError } from "../auth/auth.errors";

export const MODE_CODES = ["WALK", "MOTORBIKE", "CAR", "TAXI", "BUS"] as const;
export type ModeCode = (typeof MODE_CODES)[number];

const BUS_FARE = 7000; // giá vé cố định (đ). Có thể chuyển sang system_settings
const CACHE_TTL_MS = 7 * 24 * 3600 * 1000; // route_cache không có cột hạn, tự định nghĩa TTL
const OSRM_URL = process.env.OSRM_URL || "https://router.project-osrm.org";

interface Point {
  placeId?: number;
  lat: number;
  lng: number;
}
export interface TravelResult {
  mode: ModeCode;
  distanceKm: number;
  durationMinutes: number;
  estimatedCost: number;
  cached: boolean;
}

const coord = z
  .string()
  .regex(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/, "Tọa độ phải có dạng lat,lng");
export const routeQuerySchema = z.object({
  fromPlaceId: z.coerce.number().int().min(1).optional(),
  toPlaceId: z.coerce.number().int().min(1).optional(),
  from: coord.optional(),
  to: coord.optional(),
  modes: z.string().default("WALK,MOTORBIKE,CAR,TAXI,BUS"),
});

function parseCoord(s: string): Point {
  const [lat, lng] = s.split(",").map(Number);
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180)
    throw new AuthError(400, "Tọa độ không hợp lệ.");
  return { lat, lng };
}

async function loadPlacePoint(placeId: number): Promise<Point> {
  const r = await getPool()
    .request()
    .input("id", sql.Int, placeId)
    .query<{
      latitude: number | null;
      longitude: number | null;
    }>("SELECT latitude, longitude FROM dbo.places WHERE place_id = @id");
  const row = r.recordset[0];
  if (!row) throw new AuthError(404, `Không tìm thấy địa điểm ${placeId}.`);
  if (row.latitude == null || row.longitude == null)
    throw new AuthError(400, `Địa điểm ${placeId} chưa có tọa độ.`);
  return { placeId, lat: Number(row.latitude), lng: Number(row.longitude) };
}

async function loadModes(codes: ModeCode[]) {
  const r = await getPool()
    .request()
    .query<{
      mode_id: number;
      code: ModeCode;
      cost_per_km: number;
    }>("SELECT mode_id, code, cost_per_km FROM dbo.transport_modes");
  return r.recordset.filter((m) => codes.includes(m.code));
}

async function fetchOsrmDrivingKm(
  a: Point,
  b: Point,
): Promise<{ km: number; minutes: number }> {
  const url = `${OSRM_URL}/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=false`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`OSRM ${res.status}`);
  const json = (await res.json()) as {
    routes?: { distance: number; duration: number }[];
  };
  const route = json.routes?.[0];
  if (!route) throw new Error("OSRM không trả về tuyến đường");
  return { km: route.distance / 1000, minutes: route.duration / 60 };
}

/** Một lần gọi OSRM (lái xe), suy ra các phương tiện còn lại. Máy chủ demo chỉ hỗ trợ profile driving. */
function deriveByMode(
  code: ModeCode,
  drive: { km: number; minutes: number },
  costPerKm: number,
) {
  const round1000 = (n: number) => Math.round(n / 1000) * 1000;
  switch (code) {
    case "WALK":
      return {
        km: drive.km,
        minutes: Math.round((drive.km / 5) * 60),
        cost: 0,
      };
    case "MOTORBIKE":
      return {
        km: drive.km,
        minutes: Math.round(drive.minutes * 0.9),
        cost: round1000(drive.km * costPerKm),
      };
    case "CAR":
    case "TAXI":
      return {
        km: drive.km,
        minutes: Math.round(drive.minutes),
        cost: round1000(drive.km * costPerKm),
      };
    case "BUS":
      return {
        km: drive.km,
        minutes: Math.round(drive.minutes * 1.6 + 10),
        cost: BUS_FARE,
      };
  }
}

async function readCache(from: number, to: number, modeIds: number[]) {
  const r = await getPool()
    .request()
    .input("f", sql.Int, from)
    .input("t", sql.Int, to)
    .query<{
      mode_id: number;
      distance_km: number;
      duration_minutes: number;
      estimated_cost: number;
      cached_at: Date;
    }>("SELECT mode_id, distance_km, duration_minutes, estimated_cost, cached_at FROM dbo.route_cache WHERE from_place_id=@f AND to_place_id=@t");
  return new Map(
    r.recordset
      .filter((x) => modeIds.includes(x.mode_id))
      .map((x) => [x.mode_id, x]),
  );
}

async function writeCache(
  from: number,
  to: number,
  modeId: number,
  km: number,
  minutes: number,
  cost: number,
) {
  await getPool()
    .request()
    .input("f", sql.Int, from)
    .input("t", sql.Int, to)
    .input("m", sql.Int, modeId)
    .input("km", sql.Decimal(8, 2), km)
    .input("min", sql.Int, minutes)
    .input("cost", sql.Decimal(18, 0), cost).query(`
      MERGE dbo.route_cache WITH (HOLDLOCK) AS t
      USING (SELECT @f AS f, @t AS t, @m AS m) AS s
        ON t.from_place_id = s.f AND t.to_place_id = s.t AND t.mode_id = s.m
      WHEN MATCHED THEN UPDATE SET distance_km=@km, duration_minutes=@min, estimated_cost=@cost, cached_at=SYSDATETIME()
      WHEN NOT MATCHED THEN INSERT (from_place_id, to_place_id, mode_id, distance_km, duration_minutes, estimated_cost)
        VALUES (@f, @t, @m, @km, @min, @cost);`);
}

export async function getRouteOptions(
  a: Point,
  b: Point,
  codes: ModeCode[],
): Promise<TravelResult[]> {
  if (a.placeId && b.placeId && a.placeId === b.placeId)
    throw new AuthError(400, "Điểm đi và điểm đến phải khác nhau.");
  const modes = await loadModes(codes);
  const canCache = Boolean(a.placeId && b.placeId);
  const cache = canCache
    ? await readCache(
        a.placeId!,
        b.placeId!,
        modes.map((m) => m.mode_id),
      )
    : new Map();

  const fresh = (c?: { cached_at: Date }) =>
    c && Date.now() - new Date(c.cached_at).getTime() < CACHE_TTL_MS;
  const fromCache = (
    m: (typeof modes)[number],
    c: NonNullable<ReturnType<typeof cache.get>>,
  ): TravelResult => ({
    mode: m.code,
    distanceKm: Number(c.distance_km),
    durationMinutes: c.duration_minutes,
    estimatedCost: Number(c.estimated_cost),
    cached: true,
  });

  if (modes.every((m) => fresh(cache.get(m.mode_id))))
    return modes.map((m) => fromCache(m, cache.get(m.mode_id)!));

  try {
    const drive = await fetchOsrmDrivingKm(a, b);
    const out: TravelResult[] = [];
    for (const m of modes) {
      const d = deriveByMode(m.code, drive, Number(m.cost_per_km));
      if (canCache)
        await writeCache(
          a.placeId!,
          b.placeId!,
          m.mode_id,
          d.km,
          d.minutes,
          d.cost,
        );
      out.push({
        mode: m.code,
        distanceKm: Math.round(d.km * 100) / 100,
        durationMinutes: d.minutes,
        estimatedCost: d.cost,
        cached: false,
      });
    }
    return out;
  } catch (error) {
    // Dịch vụ bản đồ lỗi: dùng cache cũ nếu đủ, không thì báo lỗi rõ ràng
    if (modes.length && modes.every((m) => cache.has(m.mode_id))) {
      return modes.map((m) => fromCache(m, cache.get(m.mode_id)!));
    }
    console.error("Lỗi dịch vụ bản đồ:", error);
    throw new AuthError(
      502,
      "Dịch vụ bản đồ tạm thời không khả dụng. Vui lòng thử lại sau.",
    );
  }
}

/** Hàm dùng chung cho Phúc (lịch trình): import trực tiếp, không cần gọi HTTP nội bộ. */
export async function getTravelInfo(
  fromPlaceId: number,
  toPlaceId: number,
  mode: ModeCode,
): Promise<TravelResult> {
  const [from, to] = await Promise.all([
    loadPlacePoint(fromPlaceId),
    loadPlacePoint(toPlaceId),
  ]);
  return (await getRouteOptions(from, to, [mode]))[0];
}

export async function resolveRouteQuery(q: z.infer<typeof routeQuerySchema>) {
  const codes = [
    ...new Set(q.modes.split(",").map((s) => s.trim().toUpperCase())),
  ];
  const bad = codes.filter(
    (c) => !(MODE_CODES as readonly string[]).includes(c),
  );
  if (!codes.length || bad.length)
    throw new AuthError(
      400,
      `Phương tiện không hợp lệ: ${bad.join(", ") || "(trống)"}.`,
    );

  const from = q.fromPlaceId
    ? await loadPlacePoint(q.fromPlaceId)
    : q.from
      ? parseCoord(q.from)
      : null;
  const to = q.toPlaceId
    ? await loadPlacePoint(q.toPlaceId)
    : q.to
      ? parseCoord(q.to)
      : null;
  if (!from || !to)
    throw new AuthError(
      400,
      "Cần điểm đi và điểm đến (fromPlaceId/from và toPlaceId/to).",
    );
  return { from, to, codes: codes as ModeCode[] };
}
