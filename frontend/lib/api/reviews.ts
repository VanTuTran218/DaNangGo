import { apiPost, apiRequest } from './client';

export interface PlaceReview {
  review_id: number;
  reviewer_name: string;
  rating: number;
  comment: string;
  created_at: string;
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
