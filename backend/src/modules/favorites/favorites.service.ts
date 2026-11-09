import { AuthError } from '../auth/auth.errors';
import {
  deleteFavorite as deleteFavoriteRecord,
  insertFavorite,
  isActivePlace,
  listFavoriteIds as listFavoriteIdsRecord,
  listFavorites as listFavoritesRecord,
  type FavoritePlaceType,
} from './favorites.repository';

export function listFavoriteIds(userId: number): Promise<number[]> {
  return listFavoriteIdsRecord(userId);
}

export async function addFavorite(userId: number, placeId: number): Promise<void> {
  if (!(await isActivePlace(placeId))) {
    throw new AuthError(404, 'Không tìm thấy địa điểm đang hoạt động.');
  }
  try {
    await insertFavorite(userId, placeId);
  } catch (error) {
    if ((error as { number?: number }).number === 547) {
      throw new AuthError(404, 'Không tìm thấy địa điểm đang hoạt động.');
    }
    throw error;
  }
}

export function removeFavorite(userId: number, placeId: number): Promise<void> {
  return deleteFavoriteRecord(userId, placeId);
}

export async function listFavorites(input: {
  userId: number;
  type?: FavoritePlaceType;
  page: number;
  limit: number;
}) {
  const result = await listFavoritesRecord(input);
  return {
    ...result,
    page: input.page,
    limit: input.limit,
    totalPages: Math.ceil(result.total / input.limit),
  };
}
