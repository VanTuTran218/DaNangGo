// Kiểu dữ liệu cho hai trang Admin: Địa điểm và Đánh giá (khớp với backend /api/admin/places và /api/admin/reviews)
export type ContentPlaceStatus = 'ACTIVE' | 'PENDING' | 'HIDDEN' | 'LOCKED';
export type ContentPlaceCategory = 'luutru' | 'amthuc' | 'diemdulich';
export type ContentReviewStatus = 'PENDING' | 'APPROVED' | 'HIDDEN';

export interface ContentPlaceItem {
  id: string;
  name: string;
  category: ContentPlaceCategory;
  address: string;
  districtName: string;
  partnerName: string;
  priceText: string;
  status: ContentPlaceStatus;
  rating: number;
  reviewCount: number;
  viewCount: number;
  imageUrl: string | null;
  createdAt: string;
}

export interface ContentReviewItem {
  id: string;
  placeId: string;
  placeName: string;
  userName: string;
  rating: number;
  comment: string;
  status: ContentReviewStatus;
  createdAt: string;
}
