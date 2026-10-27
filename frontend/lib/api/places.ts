import { apiRequest } from './client';

export type PlaceType = 'RESTAURANT' | 'ACCOMMODATION' | 'ATTRACTION';

export type PlaceSortOption =
  | 'rating_desc'
  | 'rating_asc'
  | 'price_asc'
  | 'price_desc'
  | 'views_desc'
  | 'newest';

export interface PlaceImage {
  image_id: number;
  place_id?: number;
  image_url: string;
  is_cover: boolean;
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
  created_at: string;
  updated_at: string | null;
  cover_image: string | null;
  image_url?: string | null;
  images?: PlaceImage[];

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

export interface MenuItemTaste {
  taste_id: number;
  name: string;
}

export interface MenuItemDetail {
  menu_item_id: number;
  place_id: number;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  tastes: MenuItemTaste[];
}

export interface AccommodationRoomType {
  room_type_id: number;
  place_id: number;
  name: string;
  capacity: number | null;
  price_per_night: number;
  original_price: number | null;
  status: string;
}

export interface AccommodationAmenity {
  amenity_id: number;
  name: string;
  icon: string | null;
}

export interface PlaceDetail extends PlaceSearchItem {
  images: PlaceImage[];
  opening_hours: PlaceOpeningHour[];
  isOpenNow: boolean;
  visit_duration_minutes?: number | null;
  check_in_time?: string | null;
  check_out_time?: string | null;
  partner_id?: number | null;
  menu_items?: MenuItemDetail[];
  room_types?: AccommodationRoomType[];
  rooms?: PlaceRoomType[];
  amenities?: PlaceAmenity[];
  accepts_cash?: boolean;
  accepts_bank_transfer?: boolean;
}

export interface PlacesFilterParams {
  type?: string;
  category?: string;
  district_id?: number | string;
  min_price?: number | string;
  max_price?: number | string;
  capacity?: number | string;
  amenity_ids?: string;
  accommodation_type?: string;
  min_rating?: number | string;
  q?: string;
  sort?: string;
  limit?: number;
  page?: number;
}

export type PlaceListItem = Pick<
  PlaceDetail,
  | 'place_id'
  | 'place_type'
  | 'name'
  | 'address'
  | 'cover_image'
  | 'avg_rating'
  | 'review_count'
  | 'status'
  | 'price_min'
  | 'price_max'
  | 'accommodation_type'
  | 'star_rating'
>;

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
  page?: number;
  limit?: number;
}

export interface PaginatedPlacesResult {
  items: PlaceSearchItem[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

/**
 * Tìm kiếm và lọc danh sách địa điểm (Công khai)
 * GET /api/places
 */
export async function getPlaces(
  query: SearchPlacesQuery = {}
): Promise<PaginatedPlacesResult> {
  const params = new URLSearchParams();

  if (query.q && query.q.trim()) params.append('q', query.q.trim());
  if (query.type) params.append('type', query.type);
  if (query.district_id) params.append('district_id', String(query.district_id));
  if (query.min_price !== undefined) params.append('min_price', String(query.min_price));
  if (query.max_price !== undefined) params.append('max_price', String(query.max_price));
  if (query.min_rating !== undefined) params.append('min_rating', String(query.min_rating));
  if (query.cuisine_id) params.append('cuisine_id', String(query.cuisine_id));
  if (query.taste_id) params.append('taste_id', String(query.taste_id));
  if (query.category_id) params.append('category_id', String(query.category_id));
  if (query.open_now !== undefined) params.append('open_now', String(query.open_now));
  if (query.sort) params.append('sort', query.sort);
  if (query.page) params.append('page', String(query.page));
  if (query.limit) params.append('limit', String(query.limit));

  const queryString = params.toString() ? `?${params.toString()}` : '';
  const res = await apiRequest<PaginatedPlacesResult>(`/api/places${queryString}`);

  return res.data || {
    items: [],
    total: 0,
    page: 1,
    limit: 10,
    total_pages: 0,
  };
}

/**
 * Lấy chi tiết 1 địa điểm theo ID (Công khai)
 * GET /api/places/:id
 */
export async function getPlaceDetail(placeId: number | string): Promise<PlaceDetail | null> {
  const res = await apiRequest<PlaceDetail>(`/api/places/${placeId}`);
  return res.data || null;
}

export const getPlaceById = getPlaceDetail;

export async function getTopPlaces(type: PlaceType, limit = 10): Promise<PlaceSearchItem[]> {
  const params = new URLSearchParams({ type, limit: String(limit) });
  const res = await apiRequest<PlaceSearchItem[]>(`/api/places/top?${params}`);
  return res.data || [];
}

export async function getPlace(placeId: string): Promise<PlaceDetail> {
  const response = await apiRequest<PlaceDetail>(
    `/api/places/${encodeURIComponent(placeId)}`
  );
  return response.data!;
}

/**
 * Cập nhật trạng thái địa điểm (Yêu cầu đăng nhập Partner / Admin)
 * PATCH /api/places/:id/status
 */
export async function updatePlaceStatus(
  placeId: number,
  status: 'ACTIVE' | 'HIDDEN' | 'PENDING' | 'LOCKED'
): Promise<{ success: boolean; message: string }> {
  const res = await apiRequest<{ success: boolean; message: string }>(
    `/api/places/${placeId}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }
  );
  return res.data || { success: true, message: res.message || 'Cập nhật trạng thái thành công' };
}
