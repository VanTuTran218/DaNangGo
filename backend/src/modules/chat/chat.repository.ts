import { getPool, sql } from "../../config/db";
import type { ChatMessageDto, ChatPlaceCard, ChatSender } from "./chat.types";
import { publicStayFacts } from "./chat.stay-facts";

export async function createChatSession(userId: number): Promise<number> {
  const result = await getPool().request().input("userId", sql.Int, userId)
    .query<{ session_id: number }>(`
      INSERT INTO dbo.chat_sessions (user_id, started_at)
      OUTPUT INSERTED.session_id VALUES (@userId, SYSUTCDATETIME())
    `);
  const id = result.recordset[0]?.session_id;
  if (!id) throw new Error("Không thể tạo phiên trò chuyện.");
  return id;
}

export async function ownsChatSession(
  sessionId: number,
  userId: number,
): Promise<boolean> {
  const result = await getPool()
    .request()
    .input("sessionId", sql.Int, sessionId)
    .input("userId", sql.Int, userId)
    .query(
      `SELECT session_id FROM dbo.chat_sessions WHERE session_id = @sessionId AND user_id = @userId`,
    );
  return result.recordset.length === 1;
}

export async function saveChatMessage(
  sessionId: number,
  userId: number,
  sender: ChatSender,
  content: string,
  placeIds?: number[],
  dto?: ChatMessageDto,
): Promise<bigint | null> {
  try {
    const pool = getPool();
    const res = await pool
      .request()
      .input("sessionId", sql.Int, sessionId)
      .input("userId", sql.Int, userId)
      .input("dto", sql.NVarChar(sql.MAX), dto ? JSON.stringify(dto) : null)
      .input("sender", sql.VarChar(10), sender)
      .input("content", sql.NVarChar(sql.MAX), content).query<{
      message_id: bigint;
    }>(`
        INSERT INTO dbo.chat_messages (session_id, sender, content, created_at, dto_json)
        OUTPUT INSERTED.message_id
        SELECT session_id, @sender, @content, SYSUTCDATETIME(), @dto
        FROM dbo.chat_sessions WHERE session_id = @sessionId AND user_id = @userId
      `);

    const messageId = res.recordset[0]?.message_id;

    if (messageId && placeIds && placeIds.length > 0) {
      for (const placeId of placeIds) {
        await pool
          .request()
          .input("messageId", sql.BigInt, messageId)
          .input("placeId", sql.Int, placeId).query(`
            IF NOT EXISTS (
              SELECT 1 FROM dbo.chat_message_places 
              WHERE message_id = @messageId AND place_id = @placeId
            )
            BEGIN
              INSERT INTO dbo.chat_message_places (message_id, place_id)
              VALUES (@messageId, @placeId)
            END
          `);
      }
    }

    if (!messageId)
      throw new Error("Không thể lưu tin nhắn vào phiên của bạn.");
    return messageId;
  } catch (error) {
    console.warn("[ChatRepository] Không thể lưu tin nhắn.");
    throw new Error("Không thể lưu lịch sử lúc này. Bạn vui lòng thử lại.");
  }
}

export async function findPlacesByKeywords(
  keywords: string[],
  placeType?: "ACCOMMODATION" | "RESTAURANT" | "ATTRACTION",
  limit: number = 3,
): Promise<ChatPlaceCard[]> {
  try {
    const pool = getPool();
    const request = pool.request();
    request.input("limit", sql.Int, limit);

    let whereClause = "WHERE p.status = 'ACTIVE'";
    if (placeType) {
      request.input("placeType", sql.VarChar(20), placeType);
      whereClause += " AND p.place_type = @placeType";
    }

    if (keywords.length > 0) {
      const keywordConditions = keywords.map((k, index) => {
        const param = `kw_${index}`;
        request.input(param, sql.NVarChar(100), `%${k}%`);
        return `(p.name LIKE @${param} OR p.description LIKE @${param} OR p.address LIKE @${param})`;
      });
      whereClause += ` AND (${keywordConditions.join(" OR ")})`;
    }

    const query = `
      SELECT TOP (@limit)
        p.place_id,
        p.name,
        p.place_type,
        p.address,
        d.name AS district_name,
        CAST(ISNULL(p.avg_rating, 5.0) AS FLOAT) AS avg_rating,
        ISNULL(p.review_count, 0) AS review_count,
        (
          SELECT TOP 1 pi.image_url 
          FROM dbo.place_images pi 
          WHERE pi.place_id = p.place_id 
          ORDER BY pi.is_cover DESC, pi.image_id ASC
        ) AS image_url,
        CASE 
          WHEN p.place_type = 'ACCOMMODATION' THEN (
            SELECT TOP 1 CAST(MIN(rt.price_per_night) AS VARCHAR) + 'đ/đêm'
            FROM dbo.room_types rt
            WHERE rt.place_id = p.place_id AND rt.status = 'ACTIVE'
          )
          WHEN p.place_type = 'ATTRACTION' THEN (
            SELECT TOP 1 
              CASE WHEN att.ticket_price > 0 THEN CAST(att.ticket_price AS VARCHAR) + 'đ'
                   ELSE N'Miễn phí' END
            FROM dbo.attractions att
            WHERE att.place_id = p.place_id
          )
          ELSE N'Từ 35.000đ'
        END AS price_text
      FROM dbo.places p
      LEFT JOIN dbo.districts d ON d.district_id = p.district_id
      ${whereClause}
      ORDER BY p.avg_rating DESC, p.review_count DESC, p.place_id DESC
    `;

    const result = await request.query<{
      place_id: number;
      name: string;
      place_type: "ACCOMMODATION" | "RESTAURANT" | "ATTRACTION";
      address: string | null;
      district_name: string | null;
      avg_rating: number;
      review_count: number;
      image_url: string | null;
      price_text: string | null;
    }>(query);

    return result.recordset.map((row) => ({
      placeId: row.place_id,
      name: row.name,
      placeType: row.place_type,
      address: row.address,
      districtName: row.district_name,
      rating: Number(row.avg_rating.toFixed(1)),
      reviewCount: row.review_count,
      imageUrl: row.image_url,
      priceText: row.price_text,
      detailUrl: `/places/${row.place_id}`,
    }));
  } catch (error) {
    console.warn(
      "[ChatRepository] findPlacesByKeywords fallback to empty:",
      error,
    );
    return [];
  }
}

/** Hàng dữ liệu địa điểm phục vụ RAG (A1) – đủ trường để dựng PlaceContext và ChatPlaceCard. */
export interface PlaceSearchRow extends ChatPlaceCard {
  priceMin: number | null;
  priceMax: number | null;
  description: string | null;
  latitude?: number | null;
  longitude?: number | null;
  roomCapacity?: number | null;
  visitDurationMinutes?: number | null;
}

/**
 * Tìm địa điểm ACTIVE theo điều kiện trích từ intent (loại, quận, ngân sách, từ khóa).
 * Nếu lọc theo từ khóa không ra kết quả, thử lại chỉ với loại + quận + ngân sách.
 */
export async function searchPlacesForChat(args: {
  placeType?: "ACCOMMODATION" | "RESTAURANT" | "ATTRACTION";
  district?: string | null;
  budget?: number | null;
  keywords?: string[];
  limit?: number;
  strictKeywords?: boolean;
  referenceOnly?: boolean;
  cheapestFirst?: boolean;
  partySize?: number | null;
  tastes?: string[];
  distanceOriginName?: string;
  location?: import("./chat.types").ChatLocation;
}): Promise<PlaceSearchRow[]> {
  const run = async (useKeywords: boolean): Promise<PlaceSearchRow[]> => {
    const pool = getPool();
    const request = pool.request();
    request.input("limit", sql.Int, args.limit ?? 10);
    request.input("partySize", sql.Int, args.partySize ?? null);

    const where: string[] = ["p.status = 'ACTIVE'"];
    if (args.referenceOnly) {
      where.push(
        "p.reference_key IS NOT NULL AND p.reference_checked_at IS NOT NULL",
      );
    }
    if (args.placeType) {
      request.input("placeType", sql.VarChar(20), args.placeType);
      where.push("p.place_type = @placeType");
    }
    if (args.district) {
      request.input("district", sql.NVarChar(100), `%${args.district}%`);
      where.push("d.name LIKE @district");
    }
    let distanceSql = "CAST(NULL AS float)";
    if (args.location) {
      request
        .input("lat", sql.Float, args.location.latitude)
        .input("lng", sql.Float, args.location.longitude)
        .input("radius", sql.Float, args.location.radiusKm);
      distanceSql = `CASE WHEN p.latitude BETWEEN -90 AND 90 AND p.longitude BETWEEN -180 AND 180 THEN geography::Point(p.latitude,p.longitude,4326).STDistance(geography::Point(@lat,@lng,4326))/1000.0 END`;
    }
    for (const [i, taste] of (args.tastes ?? []).entries()) {
      request.input(`taste${i}`, sql.NVarChar(50), taste);
      where.push(
        `EXISTS (SELECT 1 FROM dbo.menu_items mi JOIN dbo.menu_item_tastes mit ON mit.menu_item_id=mi.menu_item_id JOIN dbo.tastes t ON t.taste_id=mit.taste_id WHERE mi.place_id=p.place_id AND mi.is_available=1 AND t.name=@taste${i})`,
      );
    }
    const keywords = useKeywords
      ? (args.keywords ?? []).filter(Boolean).slice(0, 8)
      : [];
    if (keywords.length > 0) {
      const conds = keywords.map((k, i) => {
        request.input(`kw_${i}`, sql.NVarChar(100), `%${k}%`);
        return `(p.name COLLATE Latin1_General_CI_AI LIKE @kw_${i} OR p.description COLLATE Latin1_General_CI_AI LIKE @kw_${i} OR p.address COLLATE Latin1_General_CI_AI LIKE @kw_${i})`;
      });
      where.push(`(${conds.join(" OR ")})`);
    }

    const query = `
      SELECT * FROM (
        SELECT
          p.place_id, p.name, p.place_type, p.address, p.description, p.latitude, p.longitude, ${distanceSql} AS distance_km,
          psd.facts_json AS stay_facts_json,
          (SELECT TOP 1 a.visit_duration_minutes FROM dbo.attractions a WHERE a.place_id=p.place_id) AS visit_duration_minutes,
          (SELECT TOP 1 rt.capacity FROM dbo.room_types rt WHERE rt.place_id=p.place_id AND rt.status='ACTIVE' AND (@partySize IS NULL OR rt.capacity>0) ORDER BY CASE WHEN @partySize IS NULL THEN rt.price_per_night ELSE CEILING(CAST(@partySize AS decimal(18,2))/NULLIF(rt.capacity,0))*rt.price_per_night END,rt.room_type_id) AS room_capacity,
          d.name AS district_name,
          CAST(ISNULL(p.avg_rating, 0) AS FLOAT) AS avg_rating,
          ISNULL(p.review_count, 0) AS review_count,
          (SELECT TOP 1 pi.image_url FROM dbo.place_images pi
             WHERE pi.place_id = p.place_id ORDER BY pi.is_cover DESC, pi.image_id ASC) AS image_url,
          CASE
            WHEN p.place_type = 'ACCOMMODATION' THEN
              (SELECT TOP 1 rt.price_per_night FROM dbo.room_types rt WHERE rt.place_id=p.place_id AND rt.status='ACTIVE' AND (@partySize IS NULL OR rt.capacity>0) ORDER BY CASE WHEN @partySize IS NULL THEN rt.price_per_night ELSE CEILING(CAST(@partySize AS decimal(18,2))/NULLIF(rt.capacity,0))*rt.price_per_night END,rt.room_type_id)
            WHEN p.place_type = 'RESTAURANT' THEN
              (SELECT MIN(mi.price) FROM dbo.menu_items mi WHERE mi.place_id = p.place_id AND mi.is_available = 1)
            WHEN p.place_type = 'ATTRACTION' THEN
              (SELECT TOP 1 att.ticket_price FROM dbo.attractions att WHERE att.place_id = p.place_id)
            ELSE NULL
          END AS price_min,
          CASE
            WHEN p.place_type = 'ACCOMMODATION' THEN
              (SELECT MAX(rt.price_per_night) FROM dbo.room_types rt WHERE rt.place_id = p.place_id AND rt.status = 'ACTIVE')
            WHEN p.place_type = 'RESTAURANT' THEN
              (SELECT MAX(mi.price) FROM dbo.menu_items mi WHERE mi.place_id = p.place_id AND mi.is_available = 1)
            WHEN p.place_type = 'ATTRACTION' THEN
              (SELECT TOP 1 att.ticket_price FROM dbo.attractions att WHERE att.place_id = p.place_id)
            ELSE NULL
          END AS price_max
        FROM dbo.places p
        LEFT JOIN dbo.districts d ON d.district_id = p.district_id
        LEFT JOIN dbo.public_stay_details psd ON psd.place_id = p.place_id
        WHERE ${where.join(" AND ")}
      ) x
      WHERE ${[...(args.budget != null ? ["x.price_min <= @budget"] : []), ...(args.location ? ["x.distance_km <= @radius"] : [])].join(" AND ") || "1=1"}
      ORDER BY ${args.location ? "x.distance_km ASC," : ""} ${args.cheapestFirst ? "CASE WHEN x.price_min IS NULL THEN 1 ELSE 0 END,x.price_min ASC," : ""} x.avg_rating DESC, x.review_count DESC, x.place_id ASC
      OFFSET 0 ROWS FETCH NEXT @limit ROWS ONLY
    `;
    if (args.budget != null)
      request.input("budget", sql.Decimal(18, 2), args.budget);

    const result = await request.query<{
      place_id: number;
      name: string;
      place_type: "ACCOMMODATION" | "RESTAURANT" | "ATTRACTION";
      address: string | null;
      description: string | null;
      district_name: string | null;
      avg_rating: number;
      review_count: number;
      image_url: string | null;
      price_min: number | null;
      price_max: number | null;
      distance_km?: number | null;
      latitude: number | null;
      longitude: number | null;
      room_capacity: number | null;
      visit_duration_minutes: number | null;
      stay_facts_json?: string | null;
    }>(query);

    return result.recordset.map((row) => {
      const priceMin = row.price_min == null ? null : Number(row.price_min);
      const priceMax = row.price_max == null ? null : Number(row.price_max);
      let priceText: string | null = null;
      if (row.place_type === "ATTRACTION" && priceMin === 0)
        priceText = "Miễn phí";
      else if (row.place_type === "RESTAURANT" && priceMin != null) {
        priceText =
          priceMax != null && priceMax !== priceMin
            ? `${priceMin.toLocaleString("vi-VN")}–${priceMax.toLocaleString("vi-VN")}đ/món`
            : `${priceMin.toLocaleString("vi-VN")}đ/món`;
      } else if (priceMin != null) {
        priceText = `Từ ${priceMin.toLocaleString("vi-VN")}đ${row.place_type === "ACCOMMODATION" ? "/đêm" : ""}`;
      }
      return {
        ...(args.distanceOriginName
          ? { distanceOriginName: args.distanceOriginName }
          : {}),
        ...(row.distance_km != null
          ? { distanceKm: Number(row.distance_km) }
          : {}),
        placeId: row.place_id,
        name: row.name,
        placeType: row.place_type,
        address: row.address,
        districtName: row.district_name,
        rating: Number((row.avg_rating ?? 0).toFixed(1)),
        reviewCount: row.review_count,
        imageUrl: row.image_url,
        priceText,
        ...(row.place_type === "ACCOMMODATION"
          ? { stayFacts: publicStayFacts(row.stay_facts_json) }
          : {}),
        detailUrl: `/places/${row.place_id}`,
        priceMin,
        priceMax,
        description: row.description,
        latitude: row.latitude == null ? null : Number(row.latitude),
        longitude: row.longitude == null ? null : Number(row.longitude),
        visitDurationMinutes:
          row.visit_duration_minutes == null
            ? null
            : Number(row.visit_duration_minutes),
        roomCapacity:
          row.room_capacity == null ? null : Number(row.room_capacity),
      };
    });
  };

  try {
    const withKeywords = await run(true);
    if (
      withKeywords.length > 0 ||
      !args.keywords?.length ||
      args.strictKeywords
    )
      return withKeywords;
    return await run(false);
  } catch (error) {
    console.warn("[ChatRepository] Không thể tra cứu địa điểm.");
    throw new Error("Không thể tra cứu dữ liệu lúc này.");
  }
}

/** Lấy các tin nhắn gần nhất của phiên chat (cũ → mới) để làm lịch sử hội thoại. */
export async function getRecentChatMessages(
  sessionId: number,
  limit: number,
  userId: number,
): Promise<{ sender: ChatSender; content: string }[]> {
  try {
    const res = await getPool()
      .request()
      .input("sessionId", sql.Int, sessionId)
      .input("limit", sql.Int, limit)
      .input("userId", sql.Int, userId).query<{
      sender: ChatSender;
      content: string;
    }>(`
        SELECT sender, content FROM (
          SELECT TOP (@limit) sender, content, message_id
          FROM dbo.chat_messages WHERE session_id = @sessionId
            AND EXISTS (SELECT 1 FROM dbo.chat_sessions s WHERE s.session_id = @sessionId AND s.user_id = @userId)
          ORDER BY message_id DESC
        ) t ORDER BY message_id ASC
      `);
    return res.recordset;
  } catch {
    return [];
  }
}

export async function findChatAnchor(
  name: string,
): Promise<{ latitude: number; longitude: number } | null> {
  const result = await getPool()
    .request()
    .input("name", sql.NVarChar(100), `%${name}%`).query<{
    latitude: number;
    longitude: number;
  }>(`
 SELECT TOP(1) latitude,longitude FROM dbo.places
 WHERE status='ACTIVE' AND place_type='ATTRACTION' AND name COLLATE Latin1_General_CI_AI LIKE @name
 AND latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180 ORDER BY place_id`);
  const value = result.recordset[0];
  return value
    ? { latitude: Number(value.latitude), longitude: Number(value.longitude) }
    : null;
}
