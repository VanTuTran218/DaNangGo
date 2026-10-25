export type PlaceType = 'RESTAURANT' | 'ACCOMMODATION' | 'ATTRACTION';

export const ALLOWED_PLACE_TYPES: PlaceType[] = [
  'RESTAURANT',
  'ACCOMMODATION',
  'ATTRACTION',
];

export type PlaceSortOption =
  | 'rating_desc'
  | 'rating_asc'
  | 'price_asc'
  | 'price_desc'
  | 'views_desc'
  | 'newest';

export const ALLOWED_SORT_OPTIONS: PlaceSortOption[] = [
  'rating_desc',
  'rating_asc',
  'price_asc',
  'price_desc',
  'views_desc',
  'newest',
];

export interface SearchPlacesQuery {
  q?: string;
  type?: PlaceType;
  district_id?: number;
  min_price?: number;
  max_price?: number;
  min_rating?: number;
  cuisine_id?: number;
  taste_id?: number;
  category_id?: number;
  open_now?: boolean;
  sort?: PlaceSortOption;
  page: number;
  limit: number;
}

export interface ValidationResult<T> {
  error: string | null;
  data?: T;
}

export interface TopPlacesQuery {
  type: PlaceType;
  limit: number;
}

export function validateTopPlacesQuery(query: Record<string, unknown>): ValidationResult<TopPlacesQuery> {
  const type = typeof query.type === 'string' ? query.type.trim().toUpperCase() : '';
  if (!ALLOWED_PLACE_TYPES.includes(type as PlaceType)) {
    return { error: `type là bắt buộc (chỉ chấp nhận: ${ALLOWED_PLACE_TYPES.join(', ')})` };
  }
  const limit = query.limit === undefined ? 10 : Number(query.limit);
  if ((query.limit !== undefined && (typeof query.limit !== 'string' || !/^\d+$/.test(query.limit))) ||
      !Number.isInteger(limit) || limit < 1 || limit > 50) {
    return { error: 'limit phải là số nguyên từ 1 đến 50' };
  }
  return { error: null, data: { type: type as PlaceType, limit } };
}

/**
 * Validate và chuẩn hóa query parameters cho API tìm kiếm / lọc địa điểm
 * GET /api/places
 */
export function validateSearchPlacesQuery(
  query: Record<string, unknown>
): ValidationResult<SearchPlacesQuery> {
  const result: SearchPlacesQuery = {
    page: 1,
    limit: 10,
  };

  // 1. Từ khóa tìm kiếm (q)
  if (
    query['q'] !== undefined &&
    query['q'] !== null &&
    String(query['q']).trim() !== ''
  ) {
    const q = String(query['q']).trim();
    if (q.length > 200) {
      return { error: 'Từ khóa tìm kiếm (q) không được vượt quá 200 ký tự' };
    }
    result.q = q;
  }

  // 2. Loại địa điểm (type)
  if (
    query['type'] !== undefined &&
    query['type'] !== null &&
    String(query['type']).trim() !== ''
  ) {
    const rawType = String(query['type']).trim().toUpperCase();
    if (!ALLOWED_PLACE_TYPES.includes(rawType as PlaceType)) {
      return {
        error: `Loại địa điểm không hợp lệ (chỉ chấp nhận: ${ALLOWED_PLACE_TYPES.join(', ')})`,
      };
    }
    result.type = rawType as PlaceType;
  }

  // 3. Quận / Huyện (district_id)
  if (
    query['district_id'] !== undefined &&
    query['district_id'] !== null &&
    String(query['district_id']).trim() !== ''
  ) {
    const districtId = Number(query['district_id']);
    if (isNaN(districtId) || districtId <= 0 || !Number.isInteger(districtId)) {
      return { error: 'district_id phải là số nguyên dương hợp lệ' };
    }
    result.district_id = districtId;
  }

  // 4. Khoảng giá (min_price, max_price)
  if (
    query['min_price'] !== undefined &&
    query['min_price'] !== null &&
    String(query['min_price']).trim() !== ''
  ) {
    const minPrice = Number(query['min_price']);
    if (isNaN(minPrice) || minPrice < 0) {
      return { error: 'min_price phải là số không âm (>= 0)' };
    }
    result.min_price = minPrice;
  }

  if (
    query['max_price'] !== undefined &&
    query['max_price'] !== null &&
    String(query['max_price']).trim() !== ''
  ) {
    const maxPrice = Number(query['max_price']);
    if (isNaN(maxPrice) || maxPrice < 0) {
      return { error: 'max_price phải là số không âm (>= 0)' };
    }
    result.max_price = maxPrice;
  }

  if (
    result.min_price !== undefined &&
    result.max_price !== undefined &&
    result.min_price > result.max_price
  ) {
    return { error: 'min_price không được lớn hơn max_price' };
  }

  // 5. Đánh giá tối thiểu (min_rating: 0.0 - 5.0)
  if (
    query['min_rating'] !== undefined &&
    query['min_rating'] !== null &&
    String(query['min_rating']).trim() !== ''
  ) {
    const minRating = Number(query['min_rating']);
    if (isNaN(minRating) || minRating < 0 || minRating > 5) {
      return { error: 'min_rating phải là số từ 0.0 đến 5.0' };
    }
    result.min_rating = minRating;
  }

  // 6. Loại ẩm thực (cuisine_id - dành cho RESTAURANT)
  if (
    query['cuisine_id'] !== undefined &&
    query['cuisine_id'] !== null &&
    String(query['cuisine_id']).trim() !== ''
  ) {
    const cuisineId = Number(query['cuisine_id']);
    if (isNaN(cuisineId) || cuisineId <= 0 || !Number.isInteger(cuisineId)) {
      return { error: 'cuisine_id phải là số nguyên dương hợp lệ' };
    }
    result.cuisine_id = cuisineId;
  }

  // 7. Khẩu vị món ăn (taste_id - dành cho RESTAURANT)
  if (
    query['taste_id'] !== undefined &&
    query['taste_id'] !== null &&
    String(query['taste_id']).trim() !== ''
  ) {
    const tasteId = Number(query['taste_id']);
    if (isNaN(tasteId) || tasteId <= 0 || !Number.isInteger(tasteId)) {
      return { error: 'taste_id phải là số nguyên dương hợp lệ' };
    }
    result.taste_id = tasteId;
  }

  // 8. Danh mục điểm du lịch (category_id - dành cho ATTRACTION)
  if (
    query['category_id'] !== undefined &&
    query['category_id'] !== null &&
    String(query['category_id']).trim() !== ''
  ) {
    const categoryId = Number(query['category_id']);
    if (isNaN(categoryId) || categoryId <= 0 || !Number.isInteger(categoryId)) {
      return { error: 'category_id phải là số nguyên dương hợp lệ' };
    }
    result.category_id = categoryId;
  }

  // 9. Đang mở cửa (open_now: boolean)
  if (
    query['open_now'] !== undefined &&
    query['open_now'] !== null &&
    String(query['open_now']).trim() !== ''
  ) {
    const rawOpenNow = String(query['open_now']).trim().toLowerCase();
    if (rawOpenNow === 'true' || rawOpenNow === '1') {
      result.open_now = true;
    } else if (rawOpenNow === 'false' || rawOpenNow === '0') {
      result.open_now = false;
    } else {
      return { error: 'open_now phải là giá trị boolean (true/false hoặc 1/0)' };
    }
  }

  // 10. Sắp xếp (sort)
  if (
    query['sort'] !== undefined &&
    query['sort'] !== null &&
    String(query['sort']).trim() !== ''
  ) {
    const rawSort = String(query['sort']).trim().toLowerCase();
    if (!ALLOWED_SORT_OPTIONS.includes(rawSort as PlaceSortOption)) {
      return {
        error: `Tiêu chí sắp xếp không hợp lệ (hỗ trợ: ${ALLOWED_SORT_OPTIONS.join(', ')})`,
      };
    }
    result.sort = rawSort as PlaceSortOption;
  } else {
    result.sort = 'newest';
  }

  // 11. Phân trang: page (default: 1)
  if (
    query['page'] !== undefined &&
    query['page'] !== null &&
    String(query['page']).trim() !== ''
  ) {
    const page = Number(query['page']);
    if (isNaN(page) || page < 1 || !Number.isInteger(page)) {
      return { error: 'page phải là số nguyên dương (>= 1)' };
    }
    result.page = page;
  }

  // 12. Phân trang: limit (default: 10, max: 50)
  if (
    query['limit'] !== undefined &&
    query['limit'] !== null &&
    String(query['limit']).trim() !== ''
  ) {
    const limit = Number(query['limit']);
    if (isNaN(limit) || limit < 1 || limit > 50 || !Number.isInteger(limit)) {
      return { error: 'limit phải là số nguyên từ 1 đến 50' };
    }
    result.limit = limit;
  }

  return { error: null, data: result };
}

/**
 * Validate tham số ID địa điểm từ URL params (/api/places/:id)
 */
export function validatePlaceId(param: unknown): ValidationResult<number> {
  if (param === undefined || param === null || String(param).trim() === '') {
    return { error: 'ID địa điểm là bắt buộc' };
  }
  const id = Number(param);
  if (isNaN(id) || id <= 0 || !Number.isInteger(id)) {
    return { error: 'ID địa điểm không hợp lệ (phải là số nguyên dương)' };
  }
  return { error: null, data: id };
}

export const ALLOWED_PLACE_STATUSES = ['ACTIVE', 'HIDDEN', 'PENDING', 'LOCKED'] as const;
export type ValidPlaceStatus = (typeof ALLOWED_PLACE_STATUSES)[number];

/**
 * Validate body khi cập nhật trạng thái địa điểm
 * PATCH /api/places/:id/status
 */
export function validateUpdatePlaceStatus(
  body: Record<string, unknown>
): ValidationResult<{ status: ValidPlaceStatus }> {
  if (!body || typeof body !== 'object') {
    return { error: 'Dữ liệu yêu cầu không hợp lệ' };
  }
  const status = body['status'];
  if (!status || typeof status !== 'string') {
    return { error: 'Trạng thái (status) là bắt buộc' };
  }
  const upperStatus = status.trim().toUpperCase() as ValidPlaceStatus;
  if (!ALLOWED_PLACE_STATUSES.includes(upperStatus)) {
    return {
      error: `Trạng thái không hợp lệ: "${status}". Chỉ chấp nhận: ${ALLOWED_PLACE_STATUSES.join(', ')}`,
    };
  }
  return { error: null, data: { status: upperStatus } };
}

// ─────────────────────────────────────────────────────────────────────────────
// CÁC DTO ĐỊNH NGHĨA DỮ LIỆU CHI TIẾT ĐỊA ĐIỂM (TASK 6)
// ─────────────────────────────────────────────────────────────────────────────

export interface MenuItemTasteDto {
  taste_id: number;
  name: string;
}

export interface MenuItemDetailDto {
  menu_item_id: number;
  place_id: number;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  tastes: MenuItemTasteDto[];
}

export interface PlaceImageDto {
  image_id: number;
  place_id: number;
  image_url: string;
  is_cover: boolean;
}

export interface PlaceOpeningHourDto {
  opening_id: number;
  place_id: number;
  day_of_week: number;
  open_time: string;
  close_time: string;
}

export interface AccommodationRoomTypeDto {
  room_type_id: number;
  place_id: number;
  name: string;
  capacity: number | null;
  price_per_night: number;
  original_price: number | null;
  status: string;
}

export interface AccommodationAmenityDto {
  amenity_id: number;
  name: string;
  icon: string | null;
}

/**
 * DTO dữ liệu trả về cho API xem chi tiết địa điểm (GET /api/places/:id)
 * Bao gồm đầy đủ thông tin chung, giờ Việt Nam, và chi tiết theo từng loại (Nhà hàng, Du lịch, Lưu trú)
 */
export interface PlaceDetailResponseDto {
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
  partner_id: number | null;
  avg_rating: number;
  review_count: number;
  view_count: number;
  promo_label: string | null;
  status: string;
  created_at: Date | string;
  updated_at: Date | string | null;
  cover_image: string | null;

  // Ảnh & Lịch mở cửa
  images: PlaceImageDto[];
  opening_hours: PlaceOpeningHourDto[];

  // Giờ mở cửa hôm nay & trạng thái tính theo giờ Việt Nam (UTC+7)
  today_hours: string | null;
  isOpenNow: boolean;
  is_open?: boolean; // Tương thích ngược với hệ thống cũ

  // 1. Phân loại Nhà hàng (RESTAURANT)
  cuisine_id?: number | null;
  cuisine_name?: string | null;
  price_min?: number | null;
  price_max?: number | null;
  menu_items?: MenuItemDetailDto[];

  // 2. Phân loại Điểm du lịch (ATTRACTION)
  category_id?: number | null;
  category_name?: string | null;
  ticket_price?: number | null;
  visit_duration_minutes?: number | null;

  // 3. Phân loại Cơ sở lưu trú (ACCOMMODATION - phần Tín phụ trách)
  accommodation_type?: string | null;
  star_rating?: number | null;
  check_in_time?: string | null;
  check_out_time?: string | null;
  accepts_cash?: boolean;
  accepts_bank_transfer?: boolean;
  room_types?: AccommodationRoomTypeDto[];
  amenities?: AccommodationAmenityDto[];
}

