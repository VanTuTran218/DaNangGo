import { apiRequest } from './client';

export type CatalogPlaceKind = 'STAY' | 'FOOD' | 'ATTRACTION' | 'ENTERTAINMENT';

export interface CatalogSearchItem {
  id: number;
  slug: string;
  kind: CatalogPlaceKind;
  name: string;
  description: string;
  address: string;
  price: number;
  accommodationType: string | null;
  stars: number | null;
  mealPeriod: string | null;
  imageUrl: string;
  preferences: string[];
  openingTime: string | null;
  closingTime: string | null;
  visitDurationMinutes: number | null;
  roomType: string | null;
  roomCapacity: number | null;
  priceBasis: 'PER_PERSON' | 'PER_ROOM';
}

export interface CatalogSearchResponse {
  items: CatalogSearchItem[];
  suggestions: string[];
}

export async function searchCatalog(
  filters: {
    query: string;
    kind: CatalogPlaceKind | '';
    minPrice: number | undefined;
    maxPrice: number | undefined;
  },
  signal?: AbortSignal,
): Promise<CatalogSearchResponse> {
  const params = new URLSearchParams();
  if (filters.query.trim()) params.set('q', filters.query.trim());
  if (filters.kind) params.set('type', filters.kind);
  if (filters.minPrice !== undefined) params.set('minPrice', String(filters.minPrice));
  if (filters.maxPrice !== undefined) params.set('maxPrice', String(filters.maxPrice));

  const response = await apiRequest<CatalogSearchResponse>(
    `/api/itineraries/search?${params.toString()}`,
    { signal },
    { retryAfterRefresh: false },
  );
  if (!response.data) throw new Error('Không nhận được dữ liệu tìm kiếm từ máy chủ.');
  return response.data;
}
