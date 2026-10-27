import { apiPost, apiRequest } from "./client";

export interface PlaceReview {
  review_id: number;
  reviewer_name: string;
  rating: number;
  comment: string;
  created_at: string;
  images: { image_id: number; image_url: string }[];
}

export interface MyReview {
  review_id: number;
  place_id: number;
  place_name: string;
  rating: number;
  comment: string | null;
  status: "PENDING" | "APPROVED" | "HIDDEN";
  created_at: string;
  images: { image_id: number; image_url: string }[];
}

export async function getMyReviews() {
  const response = await apiRequest<MyReview[]>("/api/reviews/me");
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  return (response.data ?? []).map((review) => ({
    ...review,
    images: (review.images ?? []).map((image) => ({
      ...image,
      image_url: `${apiBase.replace(/\/$/, "")}${image.image_url}`,
    })),
  }));
}

export async function getReviewEligibility(placeId: string) {
  const response = await apiRequest<{ retry_after_ms: number }>(
    `/api/places/${encodeURIComponent(placeId)}/reviews/eligibility`,
  );
  return response.data!;
}

export interface PlaceReviewsResponse {
  reviews: PlaceReview[];
  avg_rating: number;
  review_count: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export async function getPlaceReviews(placeId: string, page = 1, limit = 10) {
  const response = await apiRequest<PlaceReviewsResponse>(
    `/api/places/${encodeURIComponent(placeId)}/reviews?page=${page}&limit=${limit}`,
  );
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  return {
    ...response.data!,
    reviews: response.data!.reviews.map((review) => ({
      ...review,
      images: (review.images ?? []).map((image) => ({
        ...image,
        image_url: `${apiBase.replace(/\/$/, "")}${image.image_url}`,
      })),
    })),
  };
}

export async function createPlaceReview(
  placeId: string,
  rating: number,
  comment: string,
) {
  const response = await apiPost<{ review_id: number }>(
    `/api/places/${encodeURIComponent(placeId)}/reviews`,
    { rating, comment },
  );
  return { reviewId: response.data!.review_id, message: response.message };
}

export async function createPlaceReviewWithImages(
  placeId: string,
  rating: number,
  comment: string,
  images: File[],
) {
  const body = new FormData();
  body.set("rating", String(rating));
  body.set("comment", comment);
  for (const image of images) body.append("images", image);
  const response = await apiRequest<{ review_id: number }>(
    `/api/places/${encodeURIComponent(placeId)}/reviews`,
    { method: "POST", body },
  );
  return { reviewId: response.data!.review_id, message: response.message };
}
