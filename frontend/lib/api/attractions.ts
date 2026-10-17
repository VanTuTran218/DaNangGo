import { apiRequest } from './client';

export interface Attraction {
  place_id: number;
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
  category_id: number | null;
  category_name: string | null;
  ticket_price: number;
  visit_duration_minutes: number | null;
  cover_image: string | null;
}

export interface AttractionFilterQuery {
  page?: number;
  limit?: number;
  district_id?: number;
  category_id?: number;
  keyword?: string;
}

export interface PaginatedAttractions {
  data: Attraction[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface CreateAttractionInput {
  name: string;
  address: string;
  district_id: number;
  category_id?: number;
  ticket_price?: number;
  visit_duration_minutes?: number;
  description?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  website?: string;
  booking_url?: string;
  promo_label?: string;
}

export interface UpdateAttractionInput {
  name?: string;
  address?: string;
  district_id?: number;
  category_id?: number | null;
  ticket_price?: number;
  visit_duration_minutes?: number | null;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  website?: string | null;
  booking_url?: string | null;
  promo_label?: string | null;
}

/**
 * Lấy danh sách điểm du lịch có lọc và phân trang (Công khai)
 */
export async function getAttractions(
  query: AttractionFilterQuery = {}
): Promise<PaginatedAttractions> {
  const params = new URLSearchParams();

  if (query.page) params.append('page', String(query.page));
  if (query.limit) params.append('limit', String(query.limit));
  if (query.district_id) params.append('district_id', String(query.district_id));
  if (query.category_id) params.append('category_id', String(query.category_id));
  if (query.keyword && query.keyword.trim()) params.append('keyword', query.keyword.trim());

  const queryString = params.toString() ? `?${params.toString()}` : '';
  const res = await apiRequest<PaginatedAttractions>(`/api/attractions${queryString}`);

  return res.data || {
    data: [],
    total: 0,
    page: 1,
    limit: 10,
    total_pages: 0,
  };
}

/**
 * Lấy thông tin chi tiết 1 điểm du lịch theo ID (Công khai)
 */
export async function getAttractionById(placeId: number): Promise<Attraction | null> {
  const res = await apiRequest<Attraction>(`/api/attractions/${placeId}`);
  return res.data || null;
}

/**
 * Tạo mới điểm du lịch (Chỉ Quản trị viên ADMIN)
 */
export async function createAttraction(
  data: CreateAttractionInput
): Promise<Attraction> {
  const res = await apiRequest<Attraction>('/api/attractions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.data!;
}

/**
 * Cập nhật thông tin điểm du lịch (Chỉ Quản trị viên ADMIN)
 */
export async function updateAttraction(
  placeId: number,
  data: UpdateAttractionInput
): Promise<Attraction> {
  const res = await apiRequest<Attraction>(`/api/attractions/${placeId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.data!;
}

/**
 * Ẩn điểm du lịch (Soft delete, status = 'HIDDEN', chỉ Quản trị viên ADMIN)
 */
export async function deleteAttraction(
  placeId: number
): Promise<{ place_id: number; status: string; message: string }> {
  const res = await apiRequest<{ place_id: number; status: string; message: string }>(
    `/api/attractions/${placeId}`,
    {
      method: 'DELETE',
    }
  );
  return res.data!;
}
