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

export async function getFavoriteIds(): Promise<number[]> {
  const response = await apiRequest<number[]>('/api/favorites/ids');
  return response.data ?? [];
}

export async function addFavorite(placeId: number): Promise<void> {
  await apiRequest('/api/favorites', {
    method: 'POST',
    body: JSON.stringify({ place_id: placeId }),
  });
}

export async function removeFavorite(placeId: number): Promise<void> {
  await apiRequest(`/api/favorites/${placeId}`, { method: 'DELETE' });
}

export async function getFavorites(input: {
  type: FavoriteType;
  page: number;
  limit: number;
}): Promise<FavoritePage> {
  const params = new URLSearchParams({
    type: input.type,
    page: String(input.page),
    limit: String(input.limit),
  });
  const response = await apiRequest<FavoritePlace[]>(`/api/favorites?${params.toString()}`);
  return {
    data: response.data ?? [],
    pagination: response.pagination ?? { page: input.page, limit: input.limit, total: 0, totalPages: 0 },
  };
}
