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

export async function updatePlaceReview(
  reviewId: number,
  rating: number,
  comment: string,
  keepImageIds?: number[],
  images: File[] = [],
) {
  let body: BodyInit;
  // JSON giữ nguyên hợp đồng sửa review cũ; multipart chỉ cần khi danh sách ảnh thay đổi.
  if (keepImageIds === undefined) body = JSON.stringify({ rating, comment });
  else {
    const form = new FormData();
    form.set("rating", String(rating));
    form.set("comment", comment);
    form.set("keepImageIds", JSON.stringify(keepImageIds));
    for (const image of images) form.append("images", image);
    body = form;
  }
  const response = await apiRequest<{ review_id: number; status: "PENDING" }>(
    `/api/reviews/${encodeURIComponent(String(reviewId))}`,
    {
      method: "PUT",
      body,
    },
  );
  return response.message ?? "Đánh giá đã được cập nhật.";
}

export async function deletePlaceReview(reviewId: number) {
  const response = await apiRequest<void>(
    `/api/reviews/${encodeURIComponent(String(reviewId))}`,
    { method: "DELETE" },
  );
  return response.message ?? "Đã xóa đánh giá.";
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
