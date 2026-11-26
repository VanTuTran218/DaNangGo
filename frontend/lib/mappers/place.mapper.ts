import type { PlaceSearchItem, PlaceDetail } from '../api/places';

/**
 * Chuyển đổi an toàn giá trị số (tránh undefined/NaN bị in thành "NaN₫")
 */
function toFinitePrice(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Định dạng số tiền sang định dạng tiền tệ Việt Nam (VNĐ)
 */
export function formatCurrency(amount: number): string {
  const safe = toFinitePrice(amount);
  if (safe === null) return 'Đang cập nhật';
  return new Intl.NumberFormat('vi-VN').format(safe) + '₫';
}

/**
 * Định dạng khoảng giá hiển thị cho thẻ địa điểm
 */
export function formatPriceRange(
  price_min: number | null | undefined,
  price_max: number | null | undefined,
  ticket_price?: number | null
): string {
  const ticket = toFinitePrice(ticket_price);
  if (ticket !== null) {
    if (ticket === 0) return 'Miễn phí';
    return formatCurrency(ticket);
  }

  const min = toFinitePrice(price_min);
  const max = toFinitePrice(price_max);

  if (min !== null && max !== null) {
    if (min === max) return formatCurrency(min);
    return `${formatCurrency(min)} – ${formatCurrency(max)}`;
  }

  if (min !== null) return `Từ ${formatCurrency(min)}`;
  if (max !== null) return `Đến ${formatCurrency(max)}`;

  return 'Đang cập nhật';
}

/**
 * Chuẩn hóa địa chỉ hiển thị, tránh lặp tên quận hoặc "Đà Nẵng" khi địa chỉ gốc đã có sẵn
 */
export function formatPlaceAddress(
  address?: string | null,
  districtName?: string | null
): string {
  const parts: string[] = [];
  const rawAddr = address?.trim() || '';
  const rawDistrict = districtName?.trim() || '';

  if (rawAddr) parts.push(rawAddr);

  const addrNorm = rawAddr.toLocaleLowerCase('vi');
  const hasCity = addrNorm.includes('đà nẵng') || addrNorm.includes('da nang');

  if (rawDistrict && !hasCity && !addrNorm.includes(rawDistrict.toLocaleLowerCase('vi'))) {
    parts.push(rawDistrict);
  }
  if (!hasCity) {
    parts.push('Đà Nẵng');
  }

  return parts.join(', ');
}

export interface PlaceCardViewModel {
  id: number;
  name: string;
  type: string;
  category: string;
  location: string;
  rating: number;
  reviews: number;
  priceRange: string;
  isOpen: boolean;
  hours: string;
  img: string;
  badge: string | null;
  bookingUrl: string | null;
}

export function upgradeUnsplashImage(
  url?: string | null,
  fallback = 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1600&q=90&auto=format&fit=crop'
): string {
  if (!url) return fallback;
  if (url.includes('images.unsplash.com')) {
    return url
      .replace(/([?&])w=\d+/g, '$1w=1600')
      .replace(/([?&])q=\d+/g, '$1q=90');
  }
  return url;
}

/**
 * Ánh xạ PlaceSearchItem sang ViewModel phục vụ hiển thị các Card trên giao diện
 */
export function mapPlaceToCard(place: PlaceSearchItem): PlaceCardViewModel {
  return {
    id: place.place_id,
    name: place.name,
    type: place.place_type,
    category: place.category_name || (place.place_type === 'RESTAURANT' ? 'Ẩm thực' : place.place_type === 'ATTRACTION' ? 'Điểm tham quan' : 'Lưu trú'),
    location: place.district_name ? `${place.district_name}, Đà Nẵng` : (place.address || 'Đà Nẵng'),
    rating: place.avg_rating,
    reviews: place.review_count,
    priceRange: formatPriceRange(place.price_min, place.price_max, place.ticket_price),
    isOpen: place.is_open,
    hours: place.today_hours || '08:00 – 22:00',
    img: upgradeUnsplashImage(place.cover_image),
    badge: place.promo_label,
    bookingUrl: place.booking_url,
  };
}

export function getDayOfWeekName(day: number): string {

  const map: Record<number, string> = {
    1: 'Chủ Nhật',
    2: 'Thứ Hai',
    3: 'Thứ Ba',
    4: 'Thứ Tư',
    5: 'Thứ Năm',
    6: 'Thứ Sáu',
    7: 'Thứ Bảy',
  };
  return map[day] || `Thứ ${day}`;
}

export function formatDuration(minutes: number | null | undefined): string {
  if (!minutes || minutes <= 0) return 'Tự do';
  if (minutes < 60) return `${minutes} phút`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (remaining === 0) return `${hours} giờ`;
  return `${hours} giờ ${remaining} phút`;
}

