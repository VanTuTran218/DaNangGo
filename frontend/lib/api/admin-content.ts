import { apiRequest } from '@/lib/api/client';
import type {
  ContentPlaceCategory, ContentPlaceItem, ContentPlaceStatus,
  ContentReviewItem, ContentReviewStatus,
} from '@/types/admin-content';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '');

interface Paged<T> { items: T[]; total: number; page: number; limit: number }

interface PlaceRow {
  place_id: number; place_type: 'ACCOMMODATION' | 'RESTAURANT' | 'ATTRACTION'; name: string; address: string | null;
  status: ContentPlaceStatus; district_name: string | null; partner_name: string | null;
  avg_rating: number; review_count: number; view_count: number; created_at: string;
  cover_image: string | null; price_min: number | null; price_max: number | null;
}

interface ReviewRow {
  review_id: number; place_id: number; place_name: string; author: string;
  rating: number; comment: string | null; status: ContentReviewStatus; created_at: string;
}

const TYPE_TO_CATEGORY: Record<PlaceRow['place_type'], ContentPlaceCategory> = {
  ACCOMMODATION: 'luutru', RESTAURANT: 'amthuc', ATTRACTION: 'diemdulich',
};
const CATEGORY_TO_TYPE: Record<ContentPlaceCategory, string> = {
  luutru: 'ACCOMMODATION', amthuc: 'RESTAURANT', diemdulich: 'ATTRACTION',
};

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

function priceText(row: PlaceRow): string {
  const { price_min: min, price_max: max } = row;
  if (min == null && max == null) return 'Chưa có giá';
  const suffix = row.place_type === 'ACCOMMODATION' ? '/đêm' : '';
  const lo = Number(min ?? max);
  const hi = Number(max ?? min);
  if (lo === 0 && hi === 0) return 'Miễn phí';
  return lo === hi ? `${fmt(lo)}đ${suffix}` : `${fmt(lo)} - ${fmt(hi)}đ${suffix}`;
}

function imageUrl(u: string | null): string | null {
  if (!u) return null;
  return /^https?:\/\//i.test(u) ? u : `${API_BASE}${u.startsWith('/') ? '' : '/'}${u}`;
}

/** Backend giới hạn 50 dòng/trang, nên gom tất cả các trang (tối đa 20 trang). */
async function fetchAll<T>(path: string, query: URLSearchParams): Promise<T[]> {
  const rows: T[] = [];
  for (let page = 1; page <= 20; page++) {
    query.set('page', String(page));
    query.set('limit', '50');
    const res = await apiRequest<Paged<T>>(`${path}?${query.toString()}`);
    const data = res.data;
    if (!data || data.items.length === 0) break;
    rows.push(...data.items);
    if (rows.length >= data.total) break;
  }
  return rows;
}

export async function getContentPlaces(params: {
  category?: ContentPlaceCategory | 'ALL'; status?: ContentPlaceStatus | 'ALL';
} = {}): Promise<ContentPlaceItem[]> {
  const q = new URLSearchParams();
  if (params.category && params.category !== 'ALL') q.set('type', CATEGORY_TO_TYPE[params.category]);
  if (params.status && params.status !== 'ALL') q.set('status', params.status);
  const rows = await fetchAll<PlaceRow>('/api/admin/places', q);
  return rows.map((r) => ({
    id: String(r.place_id),
    name: r.name,
    category: TYPE_TO_CATEGORY[r.place_type],
    address: r.address ?? '',
    districtName: r.district_name ?? '',
    partnerName: r.partner_name ?? '',
    priceText: priceText(r),
    status: r.status,
    rating: Number(r.avg_rating),
    reviewCount: r.review_count,
    viewCount: r.view_count,
    imageUrl: imageUrl(r.cover_image),
    createdAt: r.created_at,
  }));
}

export async function lockContentPlace(placeId: string, reason: string): Promise<string> {
  const res = await apiRequest<unknown>(`/api/admin/places/${placeId}/lock`, {
    method: 'PATCH', body: JSON.stringify({ reason }),
  });
  return res.message || 'Đã khóa địa điểm.';
}

export async function unlockContentPlace(placeId: string): Promise<string> {
  const res = await apiRequest<unknown>(`/api/admin/places/${placeId}/unlock`, { method: 'PATCH' });
  return res.message || 'Đã mở khóa địa điểm.';
}

export async function getContentReviews(params: {
  status?: ContentReviewStatus | 'ALL'; rating?: number | 'ALL';
} = {}): Promise<ContentReviewItem[]> {
  const q = new URLSearchParams();
  q.set('status', params.status ?? 'PENDING');
  if (params.rating && params.rating !== 'ALL') q.set('rating', String(params.rating));
  const rows = await fetchAll<ReviewRow>('/api/admin/reviews', q);
  return rows.map((r) => ({
    id: String(r.review_id),
    placeId: String(r.place_id),
    placeName: r.place_name,
    userName: r.author,
    rating: r.rating,
    comment: r.comment ?? '',
    status: r.status,
    createdAt: r.created_at,
  }));
}

export async function moderateContentReview(reviewId: string, action: 'APPROVE' | 'HIDE'): Promise<string> {
  const res = await apiRequest<unknown>(`/api/admin/reviews/${reviewId}`, {
    method: 'PATCH', body: JSON.stringify({ action }),
  });
  return res.message || (action === 'APPROVE' ? 'Đã duyệt đánh giá.' : 'Đã ẩn đánh giá.');
}
