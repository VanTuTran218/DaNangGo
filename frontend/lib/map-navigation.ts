export type Coordinates = [lat: number, lng: number];
export type MapLayer = 'street' | 'satellite';
export type MapCategory = 'luutru' | 'amthuc' | 'diemdulich' | 'cafe';

export interface MapPlace {
  id: number;
  name: string;
  category: MapCategory;
  lat: number;
  lng: number;
}

export interface DrivingRoute {
  coordinates: Coordinates[];
  distanceKm: number;
  durationMinutes: number;
}

export const DANANG_CENTER: Coordinates = [16.0544, 108.2022];

/** Khoảng cách đường chim bay (km), dùng cho bộ lọc bán kính. */
export function haversineDistance(from: Coordinates, to: Coordinates): number {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const dLat = radians(to[0] - from[0]);
  const dLng = radians(to[1] - from[1]);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(radians(from[0])) * Math.cos(radians(to[0])) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, a))));
}

export function googleMapsDirections(destination: Coordinates, origin?: Coordinates): string {
  const params = new URLSearchParams({ api: '1', destination: destination.join(','), travelmode: 'driving' });
  if (origin) params.set('origin', origin.join(','));
  return `https://www.google.com/maps/dir/?${params}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isCoordinate(value: unknown): value is [number, number] {
  return Array.isArray(value) && value.length >= 2
    && typeof value[0] === 'number' && Number.isFinite(value[0]) && Math.abs(value[0]) <= 180
    && typeof value[1] === 'number' && Number.isFinite(value[1]) && Math.abs(value[1]) <= 90;
}

/** OSRM trả GeoJSON theo [lng, lat]; Leaflet nhận [lat, lng]. */
export async function fetchDrivingRoute(
  from: Coordinates,
  to: Coordinates,
  signal?: AbortSignal,
): Promise<DrivingRoute> {
  const timeout = AbortSignal.timeout(12_000);
  const response = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`,
    { signal: signal ? AbortSignal.any([signal, timeout]) : timeout },
  );
  if (!response.ok) throw new Error('Dịch vụ chỉ đường đang bận. Vui lòng thử lại hoặc mở Google Maps.');

  const data: unknown = await response.json();
  if (isRecord(data) && (data.code === 'NoRoute' || data.code === 'NoSegment')) {
    throw new Error('Không tìm thấy tuyến đường ô tô phù hợp đến địa điểm này.');
  }
  const route: unknown = isRecord(data) && data.code === 'Ok' && Array.isArray(data.routes) ? data.routes[0] : null;
  if (!isRecord(route) || !isRecord(route.geometry) || route.geometry.type !== 'LineString'
    || !Array.isArray(route.geometry.coordinates) || route.geometry.coordinates.length < 2
    || !route.geometry.coordinates.every(isCoordinate)
    || typeof route.distance !== 'number' || !Number.isFinite(route.distance) || route.distance < 0
    || typeof route.duration !== 'number' || !Number.isFinite(route.duration) || route.duration < 0) {
    throw new Error('Dữ liệu tuyến đường không hợp lệ. Vui lòng thử lại hoặc mở Google Maps.');
  }
  return {
    coordinates: route.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]),
    distanceKm: route.distance / 1000,
    durationMinutes: Math.max(1, Math.ceil(route.duration / 60)),
  };
}
