import { getPool, sql } from '../../config/db';
import type { SearchPlacesQuery, PlaceType } from './places.validation';

export interface PlaceImage {
  image_id: number;
  place_id: number;
  image_url: string;
  is_cover: boolean;
}

export interface PlaceOpeningHour {
  opening_id: number;
  place_id: number;
  day_of_week: number;
  open_time: string;
  close_time: string;
}

export interface PlaceSearchItem {
  place_id: number;
  place_type: PlaceType;
  name: string;
  description: string | null;
  address: string | null;
  district_id: number | null;
  district_name: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  website: string | null;
  booking_url: string | null;
  avg_rating: number;
  review_count: number;
  view_count: number;
  promo_label: string | null;
  status: string;
  created_at: Date;
  updated_at: Date | null;
  cover_image: string | null;

  // Thuộc tính mở rộng & phân loại
  category_name: string | null;
  price_min: number | null;
  price_max: number | null;
  ticket_price?: number | null;
  is_open: boolean;
  today_hours: string | null;

  // Thông tin chuyên biệt từng loại
  cuisine_id?: number | null;
  cuisine_name?: string | null;
  category_id?: number | null;
  category_name_attraction?: string | null;
  accommodation_type?: string | null;
  star_rating?: number | null;
}

export interface SearchPlacesResult {
  items: PlaceSearchItem[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface PlaceDetail extends PlaceSearchItem {
  images: PlaceImage[];
  opening_hours: PlaceOpeningHour[];
  visit_duration_minutes?: number | null;
  check_in_time?: string | null;
  check_out_time?: string | null;
  partner_id?: number | null;
}

/**
 * Điểm nối mở rộng (Extension Hook) dành cho thành viên phụ trách Lưu trú (Tin).
 * Khi Tin triển khai chức năng lọc riêng cho cơ sở lưu trú (tiện ích, số sao, phòng trống...),
 * chỉ cần đăng ký hook này mà không cần sửa đổi câu truy vấn gốc.
 */
export type AccommodationFilterHook = (
  req: sql.Request,
  whereClauses: string[],
  filters: SearchPlacesQuery
) => void;

let accommodationFilterHook: AccommodationFilterHook | null = null;

export function setAccommodationFilterHook(hook: AccommodationFilterHook | null): void {
  accommodationFilterHook = hook;
}

/**
 * Tìm kiếm và lọc danh sách địa điểm (Dùng chung cho cả Nhà hàng, Điểm du lịch, Lưu trú)
 * Hỗ trợ tìm kiếm tiếng Việt không dấu (Latin1_General_CI_AI), lọc đa tiêu chí, phân trang an toàn.
 */
export async function searchPlaces(
  filters: SearchPlacesQuery,
  includeHidden: boolean = false
): Promise<SearchPlacesResult> {
  const pool = getPool();
  const page = filters.page > 0 ? filters.page : 1;
  const limit = filters.limit > 0 ? filters.limit : 10;
  const offset = (page - 1) * limit;

  // Danh sách các điều kiện WHERE
  const whereClauses: string[] = [];

  // 1. Trạng thái địa điểm
  if (!includeHidden) {
    whereClauses.push("p.status = 'ACTIVE'");
  }

  // 2. Loại địa điểm (RESTAURANT | ATTRACTION | ACCOMMODATION)
  if (filters.type) {
    whereClauses.push('p.place_type = @type');
  }

  // 3. Quận / huyện
  if (filters.district_id) {
    whereClauses.push('p.district_id = @district_id');
  }

  // 4. Từ khóa tìm kiếm không dấu (tìm theo tên quán, địa chỉ, hoặc món ăn phục vụ)
  if (filters.q) {
    whereClauses.push(`(
      p.name COLLATE Latin1_General_CI_AI LIKE @keyword
      OR p.address COLLATE Latin1_General_CI_AI LIKE @keyword
      OR EXISTS (
        SELECT 1 FROM menu_items mi
        WHERE mi.place_id = p.place_id
          AND mi.name COLLATE Latin1_General_CI_AI LIKE @keyword
          AND mi.is_available = 1
      )
    )`);
  }

  // 5. Đánh giá tối thiểu
  if (filters.min_rating !== undefined) {
    whereClauses.push('p.avg_rating >= @min_rating');
  }

  // 6. Ẩm thực (cuisine_id - dành cho RESTAURANT)
  if (filters.cuisine_id) {
    whereClauses.push('r.cuisine_id = @cuisine_id');
  }

  // 7. Khẩu vị món ăn (taste_id - tìm nhà hàng có món theo khẩu vị)
  if (filters.taste_id) {
    whereClauses.push(`EXISTS (
      SELECT 1 FROM menu_items mi
      INNER JOIN menu_item_tastes mit ON mit.menu_item_id = mi.menu_item_id
      WHERE mi.place_id = p.place_id
        AND mit.taste_id = @taste_id
        AND mi.is_available = 1
    )`);
  }

  // 8. Danh mục điểm du lịch (category_id - dành cho ATTRACTION)
  if (filters.category_id) {
    whereClauses.push('a.category_id = @category_id');
  }

  // 9. Khoảng giá (min_price, max_price) - Xử lý thông minh cho từng loại địa điểm
  if (filters.min_price !== undefined) {
    whereClauses.push(`(
      (p.place_type = 'RESTAURANT' AND (r.price_max IS NULL OR r.price_max >= @min_price))
      OR
      (p.place_type = 'ATTRACTION' AND a.ticket_price >= @min_price)
      OR
      (p.place_type = 'ACCOMMODATION' AND EXISTS (
        SELECT 1 FROM room_types rt
        WHERE rt.place_id = p.place_id AND rt.status = 'ACTIVE' AND rt.price_per_night >= @min_price
      ))
    )`);
  }

  if (filters.max_price !== undefined) {
    whereClauses.push(`(
      (p.place_type = 'RESTAURANT' AND (r.price_min IS NULL OR r.price_min <= @max_price))
      OR
      (p.place_type = 'ATTRACTION' AND a.ticket_price <= @max_price)
      OR
      (p.place_type = 'ACCOMMODATION' AND EXISTS (
        SELECT 1 FROM room_types rt
        WHERE rt.place_id = p.place_id AND rt.status = 'ACTIVE' AND rt.price_per_night <= @max_price
      ))
    )`);
  }

  // 10. Trạng thái đang mở cửa (open_now)
  if (filters.open_now === true) {
    whereClauses.push(`EXISTS (
      SELECT 1 FROM opening_hours oh
      WHERE oh.place_id = p.place_id
        AND oh.day_of_week = DATEPART(dw, GETDATE())
        AND (
          (oh.open_time <= oh.close_time AND CAST(GETDATE() AS time) BETWEEN oh.open_time AND oh.close_time)
          OR
          (oh.open_time > oh.close_time AND (CAST(GETDATE() AS time) >= oh.open_time OR CAST(GETDATE() AS time) <= oh.close_time))
        )
    )`);
  } else if (filters.open_now === false) {
    whereClauses.push(`NOT EXISTS (
      SELECT 1 FROM opening_hours oh
      WHERE oh.place_id = p.place_id
        AND oh.day_of_week = DATEPART(dw, GETDATE())
        AND (
          (oh.open_time <= oh.close_time AND CAST(GETDATE() AS time) BETWEEN oh.open_time AND oh.close_time)
          OR
          (oh.open_time > oh.close_time AND (CAST(GETDATE() AS time) >= oh.open_time OR CAST(GETDATE() AS time) <= oh.close_time))
        )
    )`);
  }

  // Tiêu chí sắp xếp an toàn từ whitelist
  const sortMap: Record<string, string> = {
    rating_desc: 'p.avg_rating DESC, p.review_count DESC, p.place_id DESC',
    rating_asc: 'p.avg_rating ASC, p.place_id ASC',
    price_asc:
      "COALESCE(r.price_min, a.ticket_price, (SELECT MIN(price_per_night) FROM room_types rt WHERE rt.place_id = p.place_id AND rt.status = 'ACTIVE'), 0) ASC, p.place_id DESC",
    price_desc:
      "COALESCE(r.price_max, a.ticket_price, (SELECT MAX(price_per_night) FROM room_types rt WHERE rt.place_id = p.place_id AND rt.status = 'ACTIVE'), 0) DESC, p.place_id DESC",
    views_desc: 'p.view_count DESC, p.place_id DESC',
    newest: 'p.created_at DESC, p.place_id DESC',
  };
  const orderClause = sortMap[filters.sort || 'newest'] || sortMap['newest'];

  // Helper bind parameters vào request
  const bindParameters = (req: sql.Request) => {
    if (filters.type) req.input('type', sql.VarChar(20), filters.type);
    if (filters.district_id) req.input('district_id', sql.Int, filters.district_id);
    if (filters.q) req.input('keyword', sql.NVarChar(200), `%${filters.q.trim()}%`);
    if (filters.min_rating !== undefined) req.input('min_rating', sql.Decimal(2, 1), filters.min_rating);
    if (filters.cuisine_id) req.input('cuisine_id', sql.Int, filters.cuisine_id);
    if (filters.taste_id) req.input('taste_id', sql.Int, filters.taste_id);
    if (filters.category_id) req.input('category_id', sql.Int, filters.category_id);
    if (filters.min_price !== undefined) req.input('min_price', sql.Decimal(18, 0), filters.min_price);
    if (filters.max_price !== undefined) req.input('max_price', sql.Decimal(18, 0), filters.max_price);
  };

  // 1. Tạo request đếm tổng số
  const countReq = pool.request();
  bindParameters(countReq);

  // Hook riêng cho Lưu trú nếu có đăng ký
  if (accommodationFilterHook) {
    accommodationFilterHook(countReq, whereClauses, filters);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countQuery = `
    SELECT COUNT(DISTINCT p.place_id) AS total
    FROM places p
    LEFT JOIN districts d ON d.district_id = p.district_id
    LEFT JOIN restaurants r ON r.place_id = p.place_id
    LEFT JOIN cuisines c ON c.cuisine_id = r.cuisine_id
    LEFT JOIN attractions a ON a.place_id = p.place_id
    LEFT JOIN attraction_categories ac ON ac.category_id = a.category_id
    LEFT JOIN accommodations acc ON acc.place_id = p.place_id
    ${whereSql}
  `;

  const countRes = await countReq.query<{ total: number }>(countQuery);
  const total = countRes.recordset[0]?.total ?? 0;

  // 2. Tạo request lấy dữ liệu phân trang
  const dataReq = pool.request();
  bindParameters(dataReq);
  dataReq.input('offset', sql.Int, offset);
  dataReq.input('limit', sql.Int, limit);

  if (accommodationFilterHook) {
    accommodationFilterHook(dataReq, whereClauses, filters);
  }

  const dataQuery = `
    SELECT
      p.place_id,
      p.place_type,
      p.name,
      p.description,
      p.address,
      p.district_id,
      d.name AS district_name,
      p.latitude,
      p.longitude,
      p.phone,
      p.website,
      p.booking_url,
      CAST(p.avg_rating AS float) AS avg_rating,
      p.review_count,
      p.view_count,
      p.promo_label,
      p.status,
      p.created_at,
      p.updated_at,
      (SELECT TOP 1 image_url FROM place_images WHERE place_id = p.place_id AND is_cover = 1) AS cover_image,
      COALESCE(c.name, ac.name, acc.accommodation_type) AS category_name,
      r.cuisine_id,
      c.name AS cuisine_name,
      a.category_id,
      ac.name AS category_name_attraction,
      acc.accommodation_type,
      acc.star_rating,
      CAST(COALESCE(r.price_min, a.ticket_price, (SELECT MIN(price_per_night) FROM room_types rt WHERE rt.place_id = p.place_id AND rt.status = 'ACTIVE')) AS float) AS price_min,
      CAST(COALESCE(r.price_max, a.ticket_price, (SELECT MAX(price_per_night) FROM room_types rt WHERE rt.place_id = p.place_id AND rt.status = 'ACTIVE')) AS float) AS price_max,
      CAST(a.ticket_price AS float) AS ticket_price,
      (SELECT TOP 1 CONVERT(varchar(5), open_time, 108) + ' - ' + CONVERT(varchar(5), close_time, 108) 
       FROM opening_hours WHERE place_id = p.place_id AND day_of_week = DATEPART(dw, GETDATE())) AS today_hours,
      (CASE WHEN EXISTS (
        SELECT 1 FROM opening_hours oh
        WHERE oh.place_id = p.place_id
          AND oh.day_of_week = DATEPART(dw, GETDATE())
          AND (
            (oh.open_time <= oh.close_time AND CAST(GETDATE() AS time) BETWEEN oh.open_time AND oh.close_time)
            OR
            (oh.open_time > oh.close_time AND (CAST(GETDATE() AS time) >= oh.open_time OR CAST(GETDATE() AS time) <= oh.close_time))
          )
      ) THEN 1 ELSE 0 END) AS is_open
    FROM places p
    LEFT JOIN districts d ON d.district_id = p.district_id
    LEFT JOIN restaurants r ON r.place_id = p.place_id
    LEFT JOIN cuisines c ON c.cuisine_id = r.cuisine_id
    LEFT JOIN attractions a ON a.place_id = p.place_id
    LEFT JOIN attraction_categories ac ON ac.category_id = a.category_id
    LEFT JOIN accommodations acc ON acc.place_id = p.place_id
    ${whereSql}
    ORDER BY ${orderClause}
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `;

  const dataRes = await dataReq.query(dataQuery);

  const items: PlaceSearchItem[] = dataRes.recordset.map((row: any) => ({
    place_id: row.place_id,
    place_type: row.place_type,
    name: row.name,
    description: row.description ?? null,
    address: row.address ?? null,
    district_id: row.district_id ?? null,
    district_name: row.district_name ?? null,
    latitude: row.latitude !== null ? Number(row.latitude) : null,
    longitude: row.longitude !== null ? Number(row.longitude) : null,
    phone: row.phone ?? null,
    website: row.website ?? null,
    booking_url: row.booking_url ?? null,
    avg_rating: Number(row.avg_rating || 0),
    review_count: Number(row.review_count || 0),
    view_count: Number(row.view_count || 0),
    promo_label: row.promo_label ?? null,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at ?? null,
    cover_image: row.cover_image ?? null,
    category_name: row.category_name ?? null,
    price_min: row.price_min !== null ? Number(row.price_min) : null,
    price_max: row.price_max !== null ? Number(row.price_max) : null,
    ticket_price: row.ticket_price !== null ? Number(row.ticket_price) : null,
    today_hours: row.today_hours ?? null,
    is_open: Boolean(row.is_open),
    cuisine_id: row.cuisine_id ?? null,
    cuisine_name: row.cuisine_name ?? null,
    category_id: row.category_id ?? null,
    category_name_attraction: row.category_name_attraction ?? null,
    accommodation_type: row.accommodation_type ?? null,
    star_rating: row.star_rating !== null ? Number(row.star_rating) : null,
  }));

  const total_pages = Math.ceil(total / limit) || 1;

  return {
    items,
    total,
    page,
    limit,
    total_pages,
  };
}

/**
 * Lấy thông tin chi tiết một địa điểm theo ID (kèm ảnh và giờ mở cửa)
 */
export async function findPlaceById(place_id: number): Promise<PlaceDetail | null> {
  const pool = getPool();

  const query = `
    SELECT
      p.place_id,
      p.place_type,
      p.name,
      p.description,
      p.address,
      p.district_id,
      d.name AS district_name,
      p.latitude,
      p.longitude,
      p.phone,
      p.website,
      p.booking_url,
      p.partner_id,
      CAST(p.avg_rating AS float) AS avg_rating,
      p.review_count,
      p.view_count,
      p.promo_label,
      p.status,
      p.created_at,
      p.updated_at,
      (SELECT TOP 1 image_url FROM place_images WHERE place_id = p.place_id AND is_cover = 1) AS cover_image,
      COALESCE(c.name, ac.name, acc.accommodation_type) AS category_name,
      r.cuisine_id,
      c.name AS cuisine_name,
      a.category_id,
      ac.name AS category_name_attraction,
      a.visit_duration_minutes,
      acc.accommodation_type,
      acc.star_rating,
      acc.check_in_time,
      acc.check_out_time,
      CAST(COALESCE(r.price_min, a.ticket_price, (SELECT MIN(price_per_night) FROM room_types rt WHERE rt.place_id = p.place_id AND rt.status = 'ACTIVE')) AS float) AS price_min,
      CAST(COALESCE(r.price_max, a.ticket_price, (SELECT MAX(price_per_night) FROM room_types rt WHERE rt.place_id = p.place_id AND rt.status = 'ACTIVE')) AS float) AS price_max,
      CAST(a.ticket_price AS float) AS ticket_price,
      (SELECT TOP 1 CONVERT(varchar(5), open_time, 108) + ' - ' + CONVERT(varchar(5), close_time, 108) 
       FROM opening_hours WHERE place_id = p.place_id AND day_of_week = DATEPART(dw, GETDATE())) AS today_hours,
      (CASE WHEN EXISTS (
        SELECT 1 FROM opening_hours oh
        WHERE oh.place_id = p.place_id
          AND oh.day_of_week = DATEPART(dw, GETDATE())
          AND (
            (oh.open_time <= oh.close_time AND CAST(GETDATE() AS time) BETWEEN oh.open_time AND oh.close_time)
            OR
            (oh.open_time > oh.close_time AND (CAST(GETDATE() AS time) >= oh.open_time OR CAST(GETDATE() AS time) <= oh.close_time))
          )
      ) THEN 1 ELSE 0 END) AS is_open
    FROM places p
    LEFT JOIN districts d ON d.district_id = p.district_id
    LEFT JOIN restaurants r ON r.place_id = p.place_id
    LEFT JOIN cuisines c ON c.cuisine_id = r.cuisine_id
    LEFT JOIN attractions a ON a.place_id = p.place_id
    LEFT JOIN attraction_categories ac ON ac.category_id = a.category_id
    LEFT JOIN accommodations acc ON acc.place_id = p.place_id
    WHERE p.place_id = @place_id
  `;

  const placeRes = await pool.request().input('place_id', sql.Int, place_id).query(query);
  const row = placeRes.recordset[0];
  if (!row) return null;

  // Lấy danh sách ảnh
  const imagesRes = await pool
    .request()
    .input('place_id', sql.Int, place_id)
    .query<PlaceImage>(`
      SELECT image_id, place_id, image_url, is_cover
      FROM place_images
      WHERE place_id = @place_id
      ORDER BY is_cover DESC, image_id ASC
    `);

  // Lấy lịch mở cửa trong tuần
  const hoursRes = await pool
    .request()
    .input('place_id', sql.Int, place_id)
    .query(`
      SELECT
        opening_id,
        place_id,
        day_of_week,
        CONVERT(varchar(5), open_time, 108) AS open_time,
        CONVERT(varchar(5), close_time, 108) AS close_time
      FROM opening_hours
      WHERE place_id = @place_id
      ORDER BY day_of_week ASC
    `);

  const detail: PlaceDetail = {
    place_id: row.place_id,
    place_type: row.place_type,
    name: row.name,
    description: row.description ?? null,
    address: row.address ?? null,
    district_id: row.district_id ?? null,
    district_name: row.district_name ?? null,
    latitude: row.latitude !== null ? Number(row.latitude) : null,
    longitude: row.longitude !== null ? Number(row.longitude) : null,
    phone: row.phone ?? null,
    website: row.website ?? null,
    booking_url: row.booking_url ?? null,
    partner_id: row.partner_id ?? null,
    avg_rating: Number(row.avg_rating || 0),
    review_count: Number(row.review_count || 0),
    view_count: Number(row.view_count || 0),
    promo_label: row.promo_label ?? null,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at ?? null,
    cover_image: row.cover_image ?? null,
    category_name: row.category_name ?? null,
    price_min: row.price_min !== null ? Number(row.price_min) : null,
    price_max: row.price_max !== null ? Number(row.price_max) : null,
    ticket_price: row.ticket_price !== null ? Number(row.ticket_price) : null,
    today_hours: row.today_hours ?? null,
    is_open: Boolean(row.is_open),
    cuisine_id: row.cuisine_id ?? null,
    cuisine_name: row.cuisine_name ?? null,
    category_id: row.category_id ?? null,
    category_name_attraction: row.category_name_attraction ?? null,
    visit_duration_minutes: row.visit_duration_minutes ?? null,
    accommodation_type: row.accommodation_type ?? null,
    star_rating: row.star_rating !== null ? Number(row.star_rating) : null,
    check_in_time: row.check_in_time ? String(row.check_in_time) : null,
    check_out_time: row.check_out_time ? String(row.check_out_time) : null,
    images: imagesRes.recordset.map((img) => ({
      ...img,
      is_cover: Boolean(img.is_cover),
    })),
    opening_hours: hoursRes.recordset.map((h: any) => ({
      opening_id: h.opening_id,
      place_id: h.place_id,
      day_of_week: Number(h.day_of_week),
      open_time: String(h.open_time),
      close_time: String(h.close_time),
    })),
  };

  return detail;
}

/**
 * Tăng lượt xem (view_count) của địa điểm (fire-and-forget)
 */
export function incrementPlaceViewCount(place_id: number): void {
  const pool = getPool();
  pool
    .request()
    .input('place_id', sql.Int, place_id)
    .query('UPDATE places SET view_count = view_count + 1 WHERE place_id = @place_id')
    .catch((err) => {
      console.error('Lỗi tăng view_count địa điểm:', err);
    });
}
