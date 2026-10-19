import { apiPost, apiRequest } from './client';

export interface PlaceReview {
  review_id: number;
  reviewer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface MyReview {
  review_id: number;
  place_id: number;
  place_name: string;
  rating: number;
  comment: string | null;
  status: 'PENDING' | 'APPROVED' | 'HIDDEN';
  created_at: string;
}

export async function getMyReviews() {
  const response = await apiRequest<MyReview[]>('/api/reviews/me');
  return response.data ?? [];
}

export async function updatePlaceReview(reviewId: number, rating: number, comment: string) {
  const response = await apiRequest<{ review_id: number; status: 'PENDING' }>(`/api/reviews/${encodeURIComponent(String(reviewId))}`, {
    method: 'PUT', body: JSON.stringify({ rating, comment }),
  });
  return response.message ?? 'Đánh giá đã được cập nhật.';
}

export async function deletePlaceReview(reviewId: number) {
  const response = await apiRequest<void>(`/api/reviews/${encodeURIComponent(String(reviewId))}`, { method: 'DELETE' });
  return response.message ?? 'Đã xóa đánh giá.';
}

export interface PlaceReviewsResponse {
  reviews: PlaceReview[];
  avg_rating: number;
  review_count: number;
  pagination: { page: number; limit: number; total: number; total_pages: number };
}

export async function getPlaceReviews(placeId: string, page = 1, limit = 10) {
  const response = await apiRequest<PlaceReviewsResponse>(
    `/api/places/${encodeURIComponent(placeId)}/reviews?page=${page}&limit=${limit}`,
  );
  return response.data!;
}

export async function createPlaceReview(placeId: string, rating: number, comment: string) {
  const response = await apiPost<{ review_id: number }>(
    `/api/places/${encodeURIComponent(placeId)}/reviews`,
    { rating, comment },
  );
  return { reviewId: response.data!.review_id, message: response.message };
}
