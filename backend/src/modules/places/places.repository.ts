import { getPool, sql } from '../../config/db';
import type {
  SearchPlacesQuery,
  PlaceType,
  PlaceDetailResponseDto,
  MenuItemDetailDto,
  MenuItemTasteDto,
  PlaceImageDto,
  PlaceOpeningHourDto,
  AccommodationRoomTypeDto,
  AccommodationAmenityDto,
} from './places.validation';

export type PlaceImage = PlaceImageDto;
export type PlaceOpeningHour = PlaceOpeningHourDto;
export type PlaceDetail = PlaceDetailResponseDto;

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
 * Điểm nối mở rộng lấy chi tiết lưu trú (loại phòng & tiện nghi) do Tín phụ trách
 */
export type AccommodationDetailHook = (
  place_id: number,
  req: sql.Request
) => Promise<{
  room_types?: AccommodationRoomTypeDto[];
  amenities?: AccommodationAmenityDto[];
}>;

let accommodationDetailHook: AccommodationDetailHook | null = null;

export function setAccommodationDetailHook(hook: AccommodationDetailHook | null): void {
  accommodationDetailHook = hook;
}

/**
 * Tìm kiếm và lọc danh sách địa điểm (Dùng chung cho cả Nhà hàng, Điểm du lịch, Lưu trú)
 * Hỗ trợ tìm kiếm tiếng Việt không dấu (Latin1_General_CI_AI), lọc đa tiêu chí, phân trang an toàn.
 */
export async function searchPlaces(
  filters: SearchPlacesQuery,
  includeHidden: boolean = false,
  minimumReviewCount?: number
): Promise<SearchPlacesResult> {
  const pool = getPool();
  const page = filters.page > 0 ? filters.page : 1;
  const limit = filters.limit > 0 ? filters.limit : 10;
  const offset = (page - 1) * limit;

  // Danh sách các điều kiện WHERE
  const whereClauses: string[] = [];
  if (minimumReviewCount !== undefined) {
    whereClauses.push('p.review_count >= @minimum_review_count');
  }

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
    if (minimumReviewCount !== undefined) req.input('minimum_review_count', sql.Int, minimumReviewCount);
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
 * Lấy thứ trong tuần (1: Chủ Nhật ... 7: Thứ Bảy) và giờ hiện tại theo múi giờ Việt Nam (Asia/Ho_Chi_Minh - UTC+7)
 */
export function getVietnamTime(date: Date = new Date()): {
  dayOfWeek: number;
  currentTimeString: string;
} {
  const vnFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hourCycle: 'h23',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const parts = vnFormatter.formatToParts(date);
  const getPart = (type: string) => parts.find((p) => p.type === type)?.value || '00';

  const weekdayMap: Record<string, number> = {
    Sun: 1,
    Mon: 2,
    Tue: 3,
    Wed: 4,
    Thu: 5,
    Fri: 6,
    Sat: 7,
  };

  const weekday = getPart('weekday');
  const dayOfWeek = weekdayMap[weekday] ?? 1;
  const hour = getPart('hour');
  const minute = getPart('minute');
  const second = getPart('second');

  return {
    dayOfWeek,
    currentTimeString: `${hour}:${minute}:${second}`,
  };
}

/**
 * Tính trạng thái mở cửa (isOpenNow) chuẩn xác theo giờ Việt Nam
 * Hỗ trợ cả trường hợp mở xuyên đêm qua ngày hôm sau (ví dụ 20:00 - 02:00)
 */
export function calculateIsOpenNow(
  hours: PlaceOpeningHourDto[],
  vnTime = getVietnamTime()
): boolean {
  if (!hours || hours.length === 0) return false;

  const currentDay = vnTime.dayOfWeek;
  const prevDay = currentDay === 1 ? 7 : currentDay - 1;
  const nowTime = vnTime.currentTimeString.slice(0, 5); // 'HH:mm'

  // 1. Kiểm tra khung giờ của ngày hôm nay
  const todayHours = hours.filter((h) => h.day_of_week === currentDay);
  for (const h of todayHours) {
    const open = h.open_time.slice(0, 5);
    const close = h.close_time.slice(0, 5);

    if (open <= close) {
      if (nowTime >= open && nowTime <= close) return true;
    } else {
      // Mở xuyên đêm (ví dụ: 20:00 - 02:00)
      if (nowTime >= open || nowTime <= close) return true;
    }
  }

  // 2. Kiểm tra khung giờ mở xuyên đêm từ ngày hôm qua kéo dài sang sáng hôm nay
  const prevHours = hours.filter((h) => h.day_of_week === prevDay);
  for (const h of prevHours) {
    const open = h.open_time.slice(0, 5);
    const close = h.close_time.slice(0, 5);
    if (open > close && nowTime <= close) {
      return true;
    }
  }

  return false;
}

/**
 * Lấy thông tin chi tiết một địa điểm theo ID (kèm ảnh, giờ mở cửa, thực đơn/khẩu vị, giá vé, lưu trú)
 * Theo đúng 7 yêu cầu của Task 6
 */
export async function findPlaceById(place_id: number): Promise<PlaceDetailResponseDto | null> {
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
      CAST(r.price_min AS float) AS restaurant_price_min,
      CAST(r.price_max AS float) AS restaurant_price_max,
      a.category_id,
      ac.name AS category_name_attraction,
      CAST(a.ticket_price AS float) AS ticket_price,
      a.visit_duration_minutes,
      acc.accommodation_type,
      acc.star_rating,
      CONVERT(varchar(5), acc.check_in_time, 108) AS check_in_time,
      CONVERT(varchar(5), acc.check_out_time, 108) AS check_out_time,
      acc.accepts_cash,
      acc.accepts_bank_transfer,
      CAST(COALESCE(r.price_min, a.ticket_price, (SELECT MIN(price_per_night) FROM room_types rt WHERE rt.place_id = p.place_id AND rt.status = 'ACTIVE')) AS float) AS price_min,
      CAST(COALESCE(r.price_max, a.ticket_price, (SELECT MAX(price_per_night) FROM room_types rt WHERE rt.place_id = p.place_id AND rt.status = 'ACTIVE')) AS float) AS price_max
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

  // 1. Lấy danh sách ảnh
  const imagesRes = await pool
    .request()
    .input('place_id', sql.Int, place_id)
    .query<{ image_id: number; place_id: number; image_url: string; is_cover: boolean }>(`
      SELECT image_id, place_id, image_url, is_cover
      FROM place_images
      WHERE place_id = @place_id
      ORDER BY is_cover DESC, image_id ASC
    `);

  const images: PlaceImageDto[] = imagesRes.recordset.map((img) => ({
    image_id: img.image_id,
    place_id: img.place_id,
    image_url: img.image_url,
    is_cover: Boolean(img.is_cover),
  }));

  // 2. Lấy lịch mở cửa trong tuần
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

  const opening_hours: PlaceOpeningHourDto[] = hoursRes.recordset.map((h: any) => ({
    opening_id: h.opening_id,
    place_id: h.place_id,
    day_of_week: Number(h.day_of_week),
    open_time: String(h.open_time),
    close_time: String(h.close_time),
  }));

  // 3. Tính giờ mở cửa hôm nay & trạng thái isOpenNow theo múi giờ Việt Nam (Asia/Ho_Chi_Minh - UTC+7)
  const vnTime = getVietnamTime();
  const todayHourRecord = opening_hours.find((h) => h.day_of_week === vnTime.dayOfWeek);
  const today_hours = todayHourRecord
    ? `${todayHourRecord.open_time} - ${todayHourRecord.close_time}`
    : null;
  const isOpenNow = calculateIsOpenNow(opening_hours, vnTime);

  // 4. Khởi tạo đối tượng chi tiết địa điểm
  const detail: PlaceDetailResponseDto = {
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
    images,
    opening_hours,
    today_hours,
    isOpenNow,
    is_open: isOpenNow,
  };

  // 5. Lấy dữ liệu chuyên biệt theo loại địa điểm
  if (row.place_type === 'RESTAURANT') {
    detail.cuisine_id = row.cuisine_id ?? null;
    detail.cuisine_name = row.cuisine_name ?? null;
    detail.price_min = row.restaurant_price_min !== null ? Number(row.restaurant_price_min) : null;
    detail.price_max = row.restaurant_price_max !== null ? Number(row.restaurant_price_max) : null;

    // Lấy danh sách món ăn đang bán (is_available = 1) kèm khẩu vị (tastes)
    const menuRes = await pool
      .request()
      .input('place_id', sql.Int, place_id)
      .query(`
        SELECT
          mi.menu_item_id,
          mi.place_id,
          mi.name,
          mi.description,
          CAST(mi.price AS float) AS price,
          mi.image_url,
          mi.is_available,
          t.taste_id,
          t.name AS taste_name
        FROM menu_items mi
        LEFT JOIN menu_item_tastes mit ON mit.menu_item_id = mi.menu_item_id
        LEFT JOIN tastes t ON t.taste_id = mit.taste_id
        WHERE mi.place_id = @place_id AND mi.is_available = 1
        ORDER BY mi.menu_item_id ASC, t.taste_id ASC
      `);

    const menuMap = new Map<number, MenuItemDetailDto>();
    for (const mRow of menuRes.recordset) {
      if (!menuMap.has(mRow.menu_item_id)) {
        menuMap.set(mRow.menu_item_id, {
          menu_item_id: mRow.menu_item_id,
          place_id: mRow.place_id,
          name: mRow.name,
          description: mRow.description ?? null,
          price: Number(mRow.price),
          image_url: mRow.image_url ?? null,
          is_available: Boolean(mRow.is_available),
          tastes: [],
        });
      }
      if (mRow.taste_id && mRow.taste_name) {
        menuMap.get(mRow.menu_item_id)!.tastes.push({
          taste_id: Number(mRow.taste_id),
          name: String(mRow.taste_name),
        });
      }
    }
    detail.menu_items = Array.from(menuMap.values());
  } else if (row.place_type === 'ATTRACTION') {
    detail.category_id = row.category_id ?? null;
    detail.category_name = row.category_name_attraction ?? null;
    detail.ticket_price = row.ticket_price !== null ? Number(row.ticket_price) : null;
    detail.visit_duration_minutes = row.visit_duration_minutes ?? null;
  } else if (row.place_type === 'ACCOMMODATION') {
    detail.accommodation_type = row.accommodation_type ?? null;
    detail.star_rating = row.star_rating !== null ? Number(row.star_rating) : null;
    detail.check_in_time = row.check_in_time ? String(row.check_in_time) : null;
    detail.check_out_time = row.check_out_time ? String(row.check_out_time) : null;
    detail.accepts_cash = row.accepts_cash !== null ? Boolean(row.accepts_cash) : undefined;
    detail.accepts_bank_transfer =
      row.accepts_bank_transfer !== null ? Boolean(row.accepts_bank_transfer) : undefined;

    // Gọi hook của Tín nếu có, nếu chưa thì fallback an toàn query bảng room_types và amenities
    if (accommodationDetailHook) {
      try {
        const extra = await accommodationDetailHook(place_id, pool.request());
        if (extra.room_types) detail.room_types = extra.room_types;
        if (extra.amenities) detail.amenities = extra.amenities;
      } catch (err) {
        console.error('Lỗi khi thực thi accommodationDetailHook:', err);
      }
    } else {
      // Fallback query danh sách loại phòng còn hoạt động
      const roomTypesRes = await pool
        .request()
        .input('place_id', sql.Int, place_id)
        .query<AccommodationRoomTypeDto>(`
          SELECT
            room_type_id,
            place_id,
            name,
            capacity,
            CAST(price_per_night AS float) AS price_per_night,
            CAST(original_price AS float) AS original_price,
            status
          FROM room_types
          WHERE place_id = @place_id AND status = 'ACTIVE'
          ORDER BY price_per_night ASC
        `);
      detail.room_types = roomTypesRes.recordset;

      // Fallback query danh sách tiện nghi
      const amenitiesRes = await pool
        .request()
        .input('place_id', sql.Int, place_id)
        .query<AccommodationAmenityDto>(`
          SELECT a.amenity_id, a.name, a.icon
          FROM accommodation_amenities aa
          JOIN amenities a ON a.amenity_id = aa.amenity_id
          WHERE aa.place_id = @place_id
          ORDER BY a.amenity_id ASC
        `);
      detail.amenities = amenitiesRes.recordset;
    }
  }

  return detail;
}

/**
 * Tăng lượt xem (view_count) của địa điểm (fire-and-forget)
 * Theo đúng yêu cầu Task 6: Tuyệt đối không để lỗi cộng lượt xem làm hỏng việc xem chi tiết
 */
export function incrementPlaceViewCount(place_id: number): void {
  const pool = getPool();
  pool
    .request()
    .input('place_id', sql.Int, place_id)
    .query('UPDATE places SET view_count = view_count + 1 WHERE place_id = @place_id')
    .catch((err) => {
      console.error(`[Fire-and-forget] Lỗi tăng view_count cho place_id ${place_id}:`, err);
    });
}

