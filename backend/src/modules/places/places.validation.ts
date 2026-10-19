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
