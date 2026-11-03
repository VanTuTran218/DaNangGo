import type { PlaceSearchItem, PaginatedPlacesResult, SearchPlacesQuery } from './api/places';
import type { MapPlace } from './map-navigation';

export interface MapLocation extends MapPlace {
  rating: number;
  reviews: number;
  address: string;
  img: string;
  distance: string;
}

export const PLACE_PLACEHOLDER = '/images/place-placeholder.svg';

export function mapApiPlace(place: PlaceSearchItem, apiBase: string): MapLocation | null {
  if (place.status !== 'ACTIVE' || !Number.isFinite(place.latitude) || !Number.isFinite(place.longitude)
    || place.latitude === null || place.longitude === null
    || Math.abs(place.latitude) > 90 || Math.abs(place.longitude) > 180) return null;
  const categoryText = `${place.category_name ?? ''} ${place.cuisine_name ?? ''} ${place.name}`
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const category = place.place_type === 'ACCOMMODATION' ? 'luutru'
    : place.place_type === 'ATTRACTION' ? 'diemdulich'
      : place.place_type === 'RESTAURANT' ? (/\b(cafe|ca phe|coffee)\b/.test(categoryText) ? 'cafe' : 'amthuc') : null;
  if (!category) return null;
  let img = PLACE_PLACEHOLDER;
  const source = place.cover_image || place.image_url;
  if (source) {
    try {
      // Ảnh trong public/ thuộc frontend; ảnh upload thuộc backend.
      const url = new URL(source, `${apiBase.replace(/\/$/, '')}/`);
      if (url.protocol === 'https:' || url.protocol === 'http:') {
        img = source.startsWith('/') && !source.startsWith('//') && !source.startsWith('/uploads/') ? source : url.href;
      }
    } catch { /* Ảnh thiếu hoặc không hợp lệ dùng ảnh dự phòng. */ }
  }
  return {
    id: place.place_id, name: place.name, category,
    lat: place.latitude, lng: place.longitude,
    rating: Number.isFinite(place.avg_rating) ? place.avg_rating : 0,
    reviews: Number.isFinite(place.review_count) ? place.review_count : 0,
    address: place.address || place.district_name || 'Đà Nẵng', img, distance: '',
  };
}

/** Tải đủ các trang trước khi lọc bán kính, tránh bỏ sót điểm ở trang sau. */
export async function loadMapPlaces(
  loadPage: (query: SearchPlacesQuery, signal?: AbortSignal) => Promise<PaginatedPlacesResult>,
  signal: AbortSignal,
): Promise<PlaceSearchItem[]> {
  const places = new Map<number, PlaceSearchItem>();
  let totalPages = 1;
  for (let page = 1; page <= totalPages; page++) {
    signal.throwIfAborted();
    const result = await loadPage({ page, limit: 50, sort: 'newest' }, signal);
    signal.throwIfAborted();
    if (!Array.isArray(result.items) || !Number.isInteger(result.total_pages) || result.total_pages < 0) {
      throw new Error('Dữ liệu địa điểm không hợp lệ. Vui lòng thử lại.');
    }
    totalPages = result.total_pages;
    for (const place of result.items) places.set(place.place_id, place);
  }
  return [...places.values()];
}
