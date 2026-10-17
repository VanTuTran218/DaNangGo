import { apiRequest } from './client';

export type TravelMode = 'WALK' | 'MOTORBIKE' | 'CAR' | 'TAXI' | 'BUS';

export interface TravelOption {
  mode: TravelMode;
  distanceKm: number;
  durationMinutes: number;
  estimatedCost: number;
  cached: boolean;
}

export interface RouteQuery {
  fromPlaceId?: number;
  toPlaceId?: number;
  from?: string; // Tọa độ dạng "lat,lng" (ví dụ: "16.06,108.22")
  to?: string;   // Tọa độ dạng "lat,lng"
  modes?: string; // Danh sách mode cách nhau bằng dấu phẩy, mặc định "WALK,MOTORBIKE,CAR,TAXI,BUS"
}

/**
 * Lấy tùy chọn lộ trình, quãng đường, thời gian và ước tính chi phí di chuyển
 * Gọi tới API GET /api/routes
 */
export async function getRouteDirections(query: RouteQuery): Promise<TravelOption[]> {
  const params = new URLSearchParams();
  if (query.fromPlaceId) params.set('fromPlaceId', String(query.fromPlaceId));
  if (query.toPlaceId) params.set('toPlaceId', String(query.toPlaceId));
  if (query.from) params.set('from', query.from);
  if (query.to) params.set('to', query.to);
  if (query.modes) params.set('modes', query.modes);

  const res = await apiRequest<TravelOption[]>(`/api/routes?${params.toString()}`);
  return res.data || [];
}
