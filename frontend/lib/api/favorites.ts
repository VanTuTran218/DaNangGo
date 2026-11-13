import { apiRequest } from './client';

export type FavoriteType = 'ALL' | 'RESTAURANT' | 'ACCOMMODATION' | 'ATTRACTION';

export interface FavoritePlace {
  place_id: number;
  place_type: Exclude<FavoriteType, 'ALL'>;
  name: string;
  address: string | null;
  avg_rating: number;
  review_count: number;
  cover_image: string | null;
  favorited_at: string;
}

export interface FavoritePage {
  data: FavoritePlace[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export async function getFavoriteIds(options: { signal?: AbortSignal; ownerId?: string } = {}): Promise<number[]> {
  const response = await apiRequest<number[]>('/api/favorites/ids', { headers: options.ownerId ? { 'X-Favorites-Owner': options.ownerId } : undefined, signal: options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000) });
  if (!Array.isArray(response.data) || !response.data.every(id => Number.isInteger(id) && id > 0 && id <= 2147483647)) throw new Error('Danh sách yêu thích từ máy chủ không hợp lệ.');
  return response.data;
}

export async function addFavorite(placeId: number, options: { signal?: AbortSignal; ownerId?: string } = {}): Promise<void> {
  await apiRequest('/api/favorites', {
    method: 'POST',
    headers: options.ownerId ? { 'X-Favorites-Owner': options.ownerId } : undefined,
    signal: options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000),
    body: JSON.stringify({ place_id: placeId }),
  });
}

export async function removeFavorite(placeId: number, options: { signal?: AbortSignal; ownerId?: string } = {}): Promise<void> {
  await apiRequest(`/api/favorites/${placeId}`, { method: 'DELETE', headers: options.ownerId ? { 'X-Favorites-Owner': options.ownerId } : undefined, signal: options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000) });
}

export async function getFavorites(input: {
  type: FavoriteType;
  page: number;
  limit: number;
  signal?: AbortSignal;
  ownerId?: string;
}): Promise<FavoritePage> {
  const params = new URLSearchParams({
    type: input.type,
    page: String(input.page),
    limit: String(input.limit),
  });
  const response = await apiRequest<FavoritePlace[]>(`/api/favorites?${params.toString()}`, { headers: input.ownerId ? { 'X-Favorites-Owner': input.ownerId } : undefined, signal: input.signal ? AbortSignal.any([input.signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000) });
  const pagination = response.pagination;
  if (!Array.isArray(response.data) || !pagination || !Number.isInteger(pagination.total) || pagination.total < 0 || !Number.isInteger(pagination.page) || pagination.page < 1 || !Number.isInteger(pagination.limit) || pagination.limit < 1 || !Number.isInteger(pagination.totalPages) || pagination.totalPages < 0) throw new Error('Phản hồi danh sách yêu thích không hợp lệ.');
  return { data: response.data, pagination };
}
