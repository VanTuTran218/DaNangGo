import { apiRequest } from './client';

export interface PlaceDetail {
  place_id: number;
  place_type: string;
  name: string;
  description: string | null;
  address: string | null;
  cover_image: string | null;
  avg_rating: number;
  review_count: number;
  status: string;
}

export type PlaceListItem = Pick<PlaceDetail, 'place_id' | 'place_type' | 'name' | 'address' | 'cover_image' | 'avg_rating' | 'review_count' | 'status'>;

export async function getPlaces(): Promise<PlaceListItem[]> {
  const response = await apiRequest<PlaceListItem[]>('/api/places');
  return response.data!;
}

export async function getPlace(placeId: string): Promise<PlaceDetail> {
  const response = await apiRequest<PlaceDetail>(`/api/places/${encodeURIComponent(placeId)}`);
  return response.data!;
}
