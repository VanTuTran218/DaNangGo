import { getPool, sql } from "../../config/db";
import {
  getAccommodationDetail,
  applyAccommodationFilter,
  ACCOMMODATION_MIN_PRICE_SQL,
} from "../accommodations/accommodations.service";

export interface PlaceImage {
  image_id: number;
  image_url: string;
  is_cover: boolean;
  caption?: string | null;
}

export interface PlaceRoomType {
  room_type_id: number;
  name: string;
  capacity: number;
  price_per_night: number;
  original_price: number | null;
  room_count: number;
}

export interface PlaceAmenity {
  amenity_id: number;
  name: string;
  icon?: string | null;
}

export interface AccommodationDetail {
  accommodation_type: string;
  star_rating: number | null;
  check_in_time: string | null;
  check_out_time: string | null;
  booking_url: string | null;
  rooms: PlaceRoomType[];
  amenities: PlaceAmenity[];
}

export interface Place {
  place_id: number;
  place_type: string;
  name: string;
  description?: string | null;
  address?: string | null;
  district_id?: number | null;
  district_name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  website?: string | null;
  booking_url?: string | null;
  cover_image?: string | null;
  images?: PlaceImage[];
  status: string;
  avg_rating: number;
  review_count: number;
  view_count: number;
  price_min?: number | null;
  price_max?: number | null;
  created_at?: Date;
  accommodation?: AccommodationDetail;
  // Trải phẳng các trường của lưu trú cho client tiện sử dụng
  rooms?: PlaceRoomType[];
  amenities?: PlaceAmenity[];
  accommodation_type?: string;
  star_rating?: number | null;
  check_in_time?: string | null;
  check_out_time?: string | null;
}

export interface PlacesQueryParams {
  type?: string;
  place_type?: string;
  category?: string;
  district_id?: string | number;
  districtId?: string | number;
  min_rating?: string | number;
  minRating?: string | number;
  min_price?: string | number;
  max_price?: string | number;
  capacity?: string | number;
  amenity_ids?: string;
  accommodation_type?: string;
  q?: string;
  search?: string;
  status?: string;
  sort?: string;
  page?: string | number;
  limit?: string | number;
}

/**
 * Lấy danh sách địa điểm (hỗ trợ lọc lưu trú, ẩm thực, điểm du lịch, theo quận, giá, tiện nghi, sắp xếp)
 */
export async function getAllPlaces(
  query: PlacesQueryParams = {},
): Promise<Place[]> {
  const pool = getPool();
  const request = pool.request();
  const conditions: string[] = [];

  // 1. Phân giải loại địa điểm (type hoặc category)
  let resolvedType = query.type || query.place_type;
  if (!resolvedType && query.category) {
    const cat = query.category.toLowerCase();
    if (cat === "luutru") resolvedType = "ACCOMMODATION";
    else if (cat === "amthuc") resolvedType = "RESTAURANT";
    else if (cat === "diemdulich") resolvedType = "ATTRACTION";
  }
  if (resolvedType === "ALL") resolvedType = undefined;

  if (resolvedType) {
    request.input("placeType", sql.VarChar(20), resolvedType);
    conditions.push("p.place_type = @placeType");
  }

  // 2. Trạng thái (mặc định lấy ACTIVE cho khách)
  const status = query.status || "ACTIVE";
  if (status !== "ALL") {
    request.input("status", sql.VarChar(20), status);
    conditions.push("p.status = @status");
  }

  // 3. Quận
  const district = query.district_id ?? query.districtId;
  if (district && district !== "ALL") {
    request.input("districtId", sql.Int, Number(district));
    conditions.push("p.district_id = @districtId");
  }

  // 4. Đánh giá tối thiểu
  const minRating = query.min_rating ?? query.minRating;
  if (minRating && minRating !== "ALL") {
    request.input("minRating", sql.Decimal(3, 2), Number(minRating));
    conditions.push("p.avg_rating >= @minRating");
  }

  // 5. Tìm kiếm từ khóa (tên hoặc địa chỉ)
  const keyword = (query.q ?? query.search)?.trim();
  if (keyword) {
    request.input("keyword", sql.NVarChar(100), `%${keyword}%`);
    conditions.push("(p.name LIKE @keyword OR p.address LIKE @keyword)");
  }

  // 6. Áp dụng bộ lọc riêng của Lưu trú (giá phòng, tiện nghi, sức chứa, loại phòng/loại lưu trú)
  if (
    resolvedType === "ACCOMMODATION" ||
    query.min_price !== undefined ||
    query.max_price !== undefined ||
    query.capacity !== undefined ||
    query.amenity_ids ||
    query.accommodation_type
  ) {
    try {
      const accConds = applyAccommodationFilter(request, query);
      conditions.push(...accConds);
    } catch {
      // Bỏ qua nếu tham số lọc không đúng format
    }
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  // 7. Sắp xếp
  let orderBy = "p.place_id DESC";
  if (query.sort === "price_asc") {
    orderBy = `CASE WHEN p.place_type = 'ACCOMMODATION' THEN ${ACCOMMODATION_MIN_PRICE_SQL} WHEN p.place_type = 'RESTAURANT' THEN r.price_min ELSE a.ticket_price END ASC`;
  } else if (query.sort === "price_desc") {
    orderBy = `CASE WHEN p.place_type = 'ACCOMMODATION' THEN ${ACCOMMODATION_MIN_PRICE_SQL} WHEN p.place_type = 'RESTAURANT' THEN r.price_min ELSE a.ticket_price END DESC`;
  } else if (query.sort === "rating_desc") {
    orderBy = "p.avg_rating DESC, p.review_count DESC";
  } else if (query.sort === "popular") {
    orderBy = "p.view_count DESC, p.avg_rating DESC";
  } else if (query.sort === "newest") {
    orderBy = "p.created_at DESC";
  }

  // 8. Phân trang
  let paginationSql = "";
  if (query.limit) {
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const page = Math.max(1, Number(query.page) || 1);
    const offset = (page - 1) * limit;
    request.input("offset", sql.Int, offset);
    request.input("limit", sql.Int, limit);
    paginationSql = "OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY";
  }

  const result = await request.query<Place>(`
    SELECT p.place_id, p.place_type, p.name, p.description, p.address, p.district_id,
           d.name AS district_name, p.latitude, p.longitude, p.phone, p.website, p.booking_url,
           p.status, p.avg_rating, p.review_count, p.view_count, p.created_at,
           (SELECT TOP 1 image_url
            FROM dbo.place_images
            WHERE place_id = p.place_id
            ORDER BY is_cover DESC, image_id ASC) AS cover_image,
           CASE p.place_type
             WHEN 'ACCOMMODATION' THEN (SELECT MIN(rt.price_per_night) FROM dbo.room_types rt
                                        WHERE rt.place_id = p.place_id AND rt.status = 'ACTIVE')
             WHEN 'RESTAURANT' THEN r.price_min
             ELSE a.ticket_price END AS price_min,
           CASE p.place_type
             WHEN 'ACCOMMODATION' THEN (SELECT MAX(rt.price_per_night) FROM dbo.room_types rt
                                        WHERE rt.place_id = p.place_id AND rt.status = 'ACTIVE')
             WHEN 'RESTAURANT' THEN r.price_max
             ELSE a.ticket_price END AS price_max,
           acc.accommodation_type,
           acc.star_rating,
           COUNT(*) OVER() AS total_count
    FROM dbo.places p
    LEFT JOIN dbo.districts d ON d.district_id = p.district_id
    LEFT JOIN dbo.restaurants r ON r.place_id = p.place_id
    LEFT JOIN dbo.attractions a ON a.place_id = p.place_id
    LEFT JOIN dbo.accommodations acc ON acc.place_id = p.place_id
    ${whereClause}
    ORDER BY ${orderBy}
    ${paginationSql}
  `);

  return result.recordset;
}

/**
 * Lấy chi tiết địa điểm theo ID (kèm thông tin lưu trú, danh sách phòng, tiện nghi nếu là ACCOMMODATION)
 */
export async function getPlaceById(id: number): Promise<Place | null> {
  const pool = getPool();
  const result = await pool.request().input("id", sql.Int, id).query(`
      SELECT p.*,
        d.name AS district_name,
        (SELECT TOP 1 image_url
         FROM dbo.place_images
         WHERE place_id = p.place_id
         ORDER BY is_cover DESC, image_id ASC) AS cover_image
      FROM dbo.places p
      LEFT JOIN dbo.districts d ON d.district_id = p.district_id
      WHERE p.place_id = @id
    `);

  const place = result.recordset[0];
  if (!place) return null;

  // Lấy toàn bộ danh sách ảnh
  const imagesResult = await pool.request().input("id", sql.Int, id)
    .query<PlaceImage>(`
      SELECT image_id, image_url, is_cover
      FROM dbo.place_images
      WHERE place_id = @id
      ORDER BY is_cover DESC, image_id ASC
    `);
  place.images = imagesResult.recordset;

  // Tăng view_count ở background
  pool
    .request()
    .input("id", sql.Int, id)
    .query(
      "UPDATE dbo.places SET view_count = ISNULL(view_count, 0) + 1 WHERE place_id = @id",
    )
    .catch(() => {});

  // Nếu là cơ sở lưu trú (ACCOMMODATION), gọi phần chi tiết của Tin: phòng, tiện nghi, checkin/checkout, booking_url
  if (place.place_type === "ACCOMMODATION") {
    try {
      const accDetail = await getAccommodationDetail(id);
      return {
        ...place,
        ...accDetail,
        accommodation: accDetail,
      };
    } catch (err) {
      console.error(`Không thể lấy chi tiết lưu trú cho place_id ${id}:`, err);
    }
  }

  return place;
}

/**
 * Tạo địa điểm mới
 */
export async function createPlace(data: {
  name: string;
  description?: string | null;
  address?: string | null;
  category?: string | null;
  district_id?: number | null;
}): Promise<Place> {
  const pool = getPool();
  const result = await pool
    .request()
    .input("name", sql.NVarChar(255), data.name)
    .input("description", sql.NVarChar(sql.MAX), data.description || null)
    .input("address", sql.NVarChar(500), data.address || null)
    .input("districtId", sql.Int, data.district_id || null).query(`
      INSERT INTO dbo.places (name, description, address, district_id, status)
      OUTPUT INSERTED.*
      VALUES (@name, @description, @address, @districtId, 'ACTIVE')
    `);

  return result.recordset[0];
}
