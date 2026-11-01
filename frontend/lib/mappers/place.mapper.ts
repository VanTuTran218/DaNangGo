import type { PlaceSearchItem, PlaceDetail } from '../api/places';

/**
 * Định dạng số tiền sang định dạng tiền tệ Việt Nam (VNĐ)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + '₫';
}

/**
 * Định dạng khoảng giá hiển thị cho thẻ địa điểm
 */
export function formatPriceRange(
  price_min: number | null,
  price_max: number | null,
  ticket_price?: number | null
): string {
  if (ticket_price !== undefined && ticket_price !== null) {
    if (ticket_price === 0) return 'Miễn phí';
    return formatCurrency(ticket_price);
  }

  if (price_min !== null && price_max !== null) {
    if (price_min === price_max) return formatCurrency(price_min);
    return `${formatCurrency(price_min)} – ${formatCurrency(price_max)}`;
  }

  if (price_min !== null) return `Từ ${formatCurrency(price_min)}`;
  if (price_max !== null) return `Đến ${formatCurrency(price_max)}`;

  return 'Đang cập nhật';
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
    img: place.cover_image || 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600&q=80',
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

