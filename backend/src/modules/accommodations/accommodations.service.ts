import { z } from "zod";
import { getPool, sql } from "../../config/db";
import { AuthError } from "../auth/auth.errors";
import { assertCanManage, type Actor } from "./accommodations.access";

/** TODO chốt với nhóm: ACTIVE hay PENDING khi mới tạo. */
const INITIAL_STATUS = "ACTIVE";

const httpUrl = z
  .string()
  .trim()
  .max(255)
  .refine(
    (v) => /^https?:\/\//i.test(v),
    "Link phải bắt đầu bằng http:// hoặc https://",
  );
const timeStr = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Giờ phải có dạng HH:mm");

export const roomSchema = z
  .object({
    name: z.string().trim().min(1, "Tên loại phòng là bắt buộc.").max(100),
    capacity: z.coerce.number().int().min(1).max(255),
    pricePerNight: z.coerce.number().min(0, "Giá không được âm."),
    originalPrice: z.coerce.number().min(0).nullish(),
    roomCount: z.coerce.number().int().min(1).default(1),
  })
  .refine(
    (r) => r.originalPrice == null || r.originalPrice >= r.pricePerNight,
    {
      message: "Giá gốc không được thấp hơn giá bán.",
      path: ["originalPrice"],
    },
  );

const baseSchema = z.object({
  name: z.string().trim().min(1, "Tên là bắt buộc.").max(200),
  description: z.string().trim().max(10000).nullish(),
  address: z.string().trim().min(1, "Địa chỉ là bắt buộc.").max(255),
  districtId: z.coerce.number().int().min(1, "Quận là bắt buộc."),
  latitude: z.coerce.number().min(-90).max(90).nullish(),
  longitude: z.coerce.number().min(-180).max(180).nullish(),
  phone: z.string().trim().max(20).nullish(),
  website: z.string().trim().max(255).nullish(),
  bookingUrl: httpUrl.nullish(),
  accommodationType: z.enum(["HOTEL", "HOMESTAY", "RESORT"]),
  starRating: z.coerce.number().int().min(1).max(5).nullish(),
  checkInTime: timeStr.nullish(),
  checkOutTime: timeStr.nullish(),
  amenityIds: z.array(z.coerce.number().int().min(1)).default([]),
  images: z.array(z.string().trim().min(1).max(255)).max(20).default([]),
});

export const createSchema = baseSchema.extend({
  rooms: z.array(roomSchema).default([]),
});
export const updateSchema = baseSchema.partial();
export type CreateInput = z.infer<typeof createSchema>;
export type UpdateInput = z.infer<typeof updateSchema>;

function bindPlaceFields(req: sql.Request, d: UpdateInput) {
  return req
    .input("name", sql.NVarChar(200), d.name ?? null)
    .input("description", sql.NVarChar(sql.MAX), d.description ?? null)
    .input("address", sql.NVarChar(255), d.address ?? null)
    .input("districtId", sql.Int, d.districtId ?? null)
    .input("lat", sql.Decimal(9, 6), d.latitude ?? null)
    .input("lng", sql.Decimal(9, 6), d.longitude ?? null)
    .input("phone", sql.VarChar(20), d.phone ?? null)
    .input("website", sql.VarChar(255), d.website ?? null)
    .input("bookingUrl", sql.VarChar(255), d.bookingUrl ?? null);
}

async function replaceAmenities(
  tx: sql.Transaction,
  placeId: number,
  ids: number[],
) {
  await new sql.Request(tx)
    .input("pid", sql.Int, placeId)
    .query("DELETE FROM dbo.accommodation_amenities WHERE place_id = @pid");
  for (const id of [...new Set(ids)]) {
    await new sql.Request(tx)
      .input("pid", sql.Int, placeId)
      .input("aid", sql.Int, id)
      .query(
        "INSERT INTO dbo.accommodation_amenities (place_id, amenity_id) VALUES (@pid, @aid)",
      );
  }
}

async function replaceImages(
  tx: sql.Transaction,
  placeId: number,
  urls: string[],
) {
  await new sql.Request(tx)
    .input("pid", sql.Int, placeId)
    .query("DELETE FROM dbo.place_images WHERE place_id = @pid");
  for (let i = 0; i < urls.length; i++) {
    await new sql.Request(tx)
      .input("pid", sql.Int, placeId)
      .input("url", sql.VarChar(255), urls[i])
      .input("cover", sql.Bit, i === 0)
      .query(
        "INSERT INTO dbo.place_images (place_id, image_url, is_cover) VALUES (@pid, @url, @cover)",
      );
  }
}

async function insertRoom(
  tx: sql.Transaction,
  placeId: number,
  r: z.infer<typeof roomSchema>,
) {
  const res = await new sql.Request(tx)
    .input("pid", sql.Int, placeId)
    .input("name", sql.NVarChar(100), r.name)
    .input("cap", sql.TinyInt, r.capacity)
    .input("price", sql.Decimal(18, 0), r.pricePerNight)
    .input("orig", sql.Decimal(18, 0), r.originalPrice ?? null)
    .input("cnt", sql.Int, r.roomCount).query<{ room_type_id: number }>(`
      INSERT INTO dbo.room_types (place_id, name, capacity, price_per_night, original_price, room_count)
      OUTPUT INSERTED.room_type_id
      VALUES (@pid, @name, @cap, @price, @orig, @cnt)`);
  return res.recordset[0].room_type_id;
}

async function inTransaction<T>(
  fn: (tx: sql.Transaction) => Promise<T>,
): Promise<T> {
  const tx = new sql.Transaction(getPool());
  await tx.begin();
  try {
    const out = await fn(tx);
    await tx.commit();
    return out;
  } catch (e) {
    await tx.rollback();
    throw e;
  }
}

export async function createAccommodation(
  actor: Actor,
  d: CreateInput,
): Promise<number> {
  return inTransaction(async (tx) => {
    const placeRes = await bindPlaceFields(new sql.Request(tx), d)
      .input("partnerId", sql.Int, actor.partnerId) // lấy từ phiên đăng nhập, không lấy từ body
      .input("status", sql.VarChar(20), INITIAL_STATUS).query<{
      place_id: number;
    }>(`
        INSERT INTO dbo.places (place_type, name, description, address, district_id, latitude, longitude,
                                phone, website, booking_url, partner_id, status)
        OUTPUT INSERTED.place_id
        VALUES ('ACCOMMODATION', @name, @description, @address, @districtId, @lat, @lng,
                @phone, @website, @bookingUrl, @partnerId, @status)`);
    const placeId = placeRes.recordset[0].place_id;

    await new sql.Request(tx)
      .input("pid", sql.Int, placeId)
      .input("type", sql.VarChar(20), d.accommodationType)
      .input("star", sql.TinyInt, d.starRating ?? null)
      .input("ci", sql.VarChar(5), d.checkInTime ?? null)
      .input("co", sql.VarChar(5), d.checkOutTime ?? null).query(`
        INSERT INTO dbo.accommodations (place_id, place_type, accommodation_type, star_rating, check_in_time, check_out_time)
        VALUES (@pid, 'ACCOMMODATION', @type, @star, CAST(@ci AS time), CAST(@co AS time))`);

    for (const room of d.rooms) await insertRoom(tx, placeId, room);
    await replaceAmenities(tx, placeId, d.amenityIds);
    await replaceImages(tx, placeId, d.images);
    return placeId;
  });
}

export async function updateAccommodation(
  actor: Actor,
  placeId: number,
  d: UpdateInput,
): Promise<void> {
  await assertCanManage(actor, placeId);
  await inTransaction(async (tx) => {
    await bindPlaceFields(new sql.Request(tx), d).input("pid", sql.Int, placeId)
      .query(`
      UPDATE dbo.places SET
        name = COALESCE(@name, name), description = COALESCE(@description, description),
        address = COALESCE(@address, address), district_id = COALESCE(@districtId, district_id),
        latitude = COALESCE(@lat, latitude), longitude = COALESCE(@lng, longitude),
        phone = COALESCE(@phone, phone), website = COALESCE(@website, website),
        booking_url = COALESCE(@bookingUrl, booking_url), updated_at = SYSDATETIME()
      WHERE place_id = @pid`);
    await new sql.Request(tx)
      .input("pid", sql.Int, placeId)
      .input("type", sql.VarChar(20), d.accommodationType ?? null)
      .input("star", sql.TinyInt, d.starRating ?? null)
      .input("ci", sql.VarChar(5), d.checkInTime ?? null)
      .input("co", sql.VarChar(5), d.checkOutTime ?? null).query(`
        UPDATE dbo.accommodations SET
          accommodation_type = COALESCE(@type, accommodation_type), star_rating = COALESCE(@star, star_rating),
          check_in_time = COALESCE(CAST(@ci AS time), check_in_time), check_out_time = COALESCE(CAST(@co AS time), check_out_time)
        WHERE place_id = @pid`);
    if (d.amenityIds) await replaceAmenities(tx, placeId, d.amenityIds);
    if (d.images) await replaceImages(tx, placeId, d.images);
  });
}

export async function hideAccommodation(
  actor: Actor,
  placeId: number,
): Promise<void> {
  await assertCanManage(actor, placeId);
  await getPool()
    .request()
    .input("pid", sql.Int, placeId)
    .query(
      "UPDATE dbo.places SET status = 'HIDDEN', updated_at = SYSDATETIME() WHERE place_id = @pid",
    );
}

export async function listMine(actor: Actor) {
  const r = await getPool()
    .request()
    .input("partnerId", sql.Int, actor.partnerId).query(`
    SELECT p.place_id, p.name, p.status, p.view_count, p.avg_rating, p.review_count,
           MIN(rt.price_per_night) AS price_from
    FROM dbo.places p LEFT JOIN dbo.room_types rt ON rt.place_id = p.place_id AND rt.status = 'ACTIVE'
    WHERE p.place_type = 'ACCOMMODATION' AND (@partnerId IS NULL OR p.partner_id = @partnerId)
    GROUP BY p.place_id, p.name, p.status, p.view_count, p.avg_rating, p.review_count
    ORDER BY p.place_id DESC`);
  return r.recordset;
}

// ---------- Loại phòng ----------
async function assertRoomBelongs(placeId: number, roomId: number) {
  const r = await getPool()
    .request()
    .input("pid", sql.Int, placeId)
    .input("rid", sql.Int, roomId)
    .query(
      "SELECT 1 AS ok FROM dbo.room_types WHERE room_type_id = @rid AND place_id = @pid",
    );
  if (!r.recordset[0]) throw new AuthError(404, "Không tìm thấy loại phòng.");
}

export async function addRoom(
  actor: Actor,
  placeId: number,
  room: z.infer<typeof roomSchema>,
) {
  await assertCanManage(actor, placeId);
  return inTransaction((tx) => insertRoom(tx, placeId, room));
}

export async function updateRoom(
  actor: Actor,
  placeId: number,
  roomId: number,
  room: z.infer<typeof roomSchema>,
) {
  await assertCanManage(actor, placeId);
  await assertRoomBelongs(placeId, roomId);
  await getPool()
    .request()
    .input("rid", sql.Int, roomId)
    .input("name", sql.NVarChar(100), room.name)
    .input("cap", sql.TinyInt, room.capacity)
    .input("price", sql.Decimal(18, 0), room.pricePerNight)
    .input("orig", sql.Decimal(18, 0), room.originalPrice ?? null)
    .input("cnt", sql.Int, room.roomCount)
    .query(`UPDATE dbo.room_types SET name=@name, capacity=@cap, price_per_night=@price,
            original_price=@orig, room_count=@cnt, updated_at=SYSDATETIME() WHERE room_type_id=@rid`);
}

/** Ẩn thay vì xóa: itinerary_items.room_type_id có khóa ngoại tới bảng này. */
export async function hideRoom(actor: Actor, placeId: number, roomId: number) {
  await assertCanManage(actor, placeId);
  await assertRoomBelongs(placeId, roomId);
  await getPool()
    .request()
    .input("rid", sql.Int, roomId)
    .query(
      "UPDATE dbo.room_types SET status='HIDDEN', updated_at=SYSDATETIME() WHERE room_type_id=@rid",
    );
}

/** Thông tin đầy đủ của một lưu trú (dùng để trả "dữ liệu mới" sau khi sửa). */
export async function getAccommodationFull(placeId: number) {
  const r = await getPool().request().input("pid", sql.Int, placeId).query(`
    SELECT place_id, name, description, address, district_id, latitude, longitude, phone, website,
           booking_url, status, avg_rating, review_count, view_count, partner_id
    FROM dbo.places WHERE place_id = @pid AND place_type = 'ACCOMMODATION'`);
  if (!r.recordset[0]) throw new AuthError(404, "Không tìm thấy lưu trú.");
  const images = await getPool()
    .request()
    .input("pid", sql.Int, placeId)
    .query(
      "SELECT image_url, is_cover FROM dbo.place_images WHERE place_id = @pid ORDER BY is_cover DESC, image_id",
    );
  return {
    ...r.recordset[0],
    images: images.recordset,
    ...(await getAccommodationDetail(placeId)),
  };
}

// ---------- Cho Tú gọi trong GET /places/:id ----------
export async function getAccommodationDetail(placeId: number) {
  const pool = getPool();
  const base = await pool.request().input("pid", sql.Int, placeId).query(`
    SELECT a.accommodation_type, a.star_rating,
           CONVERT(varchar(5), a.check_in_time, 108) AS check_in_time,
           CONVERT(varchar(5), a.check_out_time, 108) AS check_out_time,
           p.booking_url
    FROM dbo.accommodations a JOIN dbo.places p ON p.place_id = a.place_id WHERE a.place_id = @pid`);
  const rooms = await pool.request().input("pid", sql.Int, placeId).query(`
    SELECT room_type_id, name, capacity, price_per_night, original_price, room_count
    FROM dbo.room_types WHERE place_id = @pid AND status = 'ACTIVE' ORDER BY price_per_night`);
  const amenities = await pool.request().input("pid", sql.Int, placeId).query(`
    SELECT am.amenity_id, am.name, am.icon FROM dbo.accommodation_amenities aa
    JOIN dbo.amenities am ON am.amenity_id = aa.amenity_id WHERE aa.place_id = @pid ORDER BY am.name`);
  return {
    ...base.recordset[0],
    rooms: rooms.recordset,
    amenities: amenities.recordset,
  };
}

// ---------- Cho Tú ghép vào GET /places?type=ACCOMMODATION ----------
export const accommodationFilterSchema = z.object({
  min_price: z.coerce.number().min(0).optional(),
  max_price: z.coerce.number().min(0).optional(),
  capacity: z.coerce.number().int().min(1).optional(),
  amenity_ids: z
    .string()
    .optional()
    .transform((v) =>
      v
        ? v
            .split(",")
            .map(Number)
            .filter((n) => Number.isInteger(n) && n > 0)
        : [],
    ),
  accommodation_type: z.enum(["HOTEL", "HOMESTAY", "RESORT"]).optional(),
});

/**
 * Trả về các điều kiện WHERE (alias bảng places là `p`) và gắn tham số vào request.
 * Tú dùng: const conds = applyAccommodationFilter(request, req.query); rồi nối conds.join(' AND ').
 */
export function applyAccommodationFilter(
  request: sql.Request,
  query: unknown,
): string[] {
  const f = accommodationFilterSchema.parse(query);
  const conds: string[] = [];
  const roomConds = ["rt.place_id = p.place_id", "rt.status = 'ACTIVE'"];
  if (f.min_price !== undefined) {
    request.input("accMinPrice", sql.Decimal(18, 0), f.min_price);
    roomConds.push("rt.price_per_night >= @accMinPrice");
  }
  if (f.max_price !== undefined) {
    request.input("accMaxPrice", sql.Decimal(18, 0), f.max_price);
    roomConds.push("rt.price_per_night <= @accMaxPrice");
  }
  if (f.capacity !== undefined) {
    request.input("accCapacity", sql.Int, f.capacity);
    roomConds.push("rt.capacity >= @accCapacity");
  }
  if (roomConds.length > 2)
    conds.push(
      `EXISTS (SELECT 1 FROM dbo.room_types rt WHERE ${roomConds.join(" AND ")})`,
    );

  if (f.accommodation_type) {
    request.input("accType", sql.VarChar(20), f.accommodation_type);
    conds.push(
      "EXISTS (SELECT 1 FROM dbo.accommodations a WHERE a.place_id = p.place_id AND a.accommodation_type = @accType)",
    );
  }
  if (f.amenity_ids.length) {
    // phải có TẤT CẢ tiện nghi được chọn
    const names = f.amenity_ids.map((id, i) => {
      request.input(`accAm${i}`, sql.Int, id);
      return `@accAm${i}`;
    });
    conds.push(`(SELECT COUNT(DISTINCT aa.amenity_id) FROM dbo.accommodation_amenities aa
                 WHERE aa.place_id = p.place_id AND aa.amenity_id IN (${names.join(",")})) = ${f.amenity_ids.length}`);
  }
  return conds;
}

/** Biểu thức sắp xếp theo giá thấp nhất của lưu trú. */
export const ACCOMMODATION_MIN_PRICE_SQL =
  "(SELECT MIN(rt.price_per_night) FROM dbo.room_types rt WHERE rt.place_id = p.place_id AND rt.status = 'ACTIVE')";
