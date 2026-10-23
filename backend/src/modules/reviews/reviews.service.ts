import { z } from "zod";
import {
  findApprovedReviews,
  findAdminReviews,
  findPlaceSummary,
  insertPendingReview,
  isActivePlace,
  updateReviewStatusTx,
  deleteReviewTx,
  findUserReviews,
  findReviewOwner,
  updateOwnReviewTx,
  deleteOwnReviewTx,
  findApprovedReviewImage,
  findUserReviewImage,
  findAdminReviewImage,
} from "./reviews.repository";
import type { ReviewImageUpload } from "./reviews.upload";

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
const REVIEW_COOLDOWN_MINUTES = 5;

const reviewSchema = z.object({
  rating: z
    .number()
    .int()
    .min(1, "Điểm đánh giá phải từ 1 đến 5.")
    .max(5, "Điểm đánh giá phải từ 1 đến 5."),
  comment: z
    .string()
    .transform((value) =>
      value
        .replace(/<[^>]*>/g, "")
        .replace(/[\u0000-\u001F\u007F]/g, "")
        .trim(),
    )
    .pipe(
      z
        .string()
        .min(1, "Vui lòng nhập nội dung đánh giá.")
        .max(1000, "Nội dung không được vượt quá 1000 ký tự."),
    ),
});

const adminReviewQuerySchema = z.object({
  rating: z.coerce.number().int().min(1).max(5).optional(),
  status: z.enum(["PENDING", "APPROVED", "HIDDEN"]).optional(),
});
const adminReviewStatusSchema = z.object({
  status: z.enum(["APPROVED", "HIDDEN"]),
});

export class ReviewError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function listReviews(
  placeId: number,
  query: Record<string, unknown>,
) {
  const pagination = paginationSchema.safeParse(query);
  if (!pagination.success)
    throw new ReviewError(
      400,
      pagination.error.issues[0]?.message ?? "Tham số phân trang không hợp lệ.",
    );

  const place = await findPlaceSummary(placeId);
  if (!place) throw new ReviewError(404, "Không tìm thấy địa điểm.");

  const { page, limit } = pagination.data;
  const { rows, total } = await findApprovedReviews(
    placeId,
    (page - 1) * limit,
    limit,
  );
  return {
    reviews: rows,
    avg_rating: place.avg_rating,
    review_count: place.review_count,
    pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
  };
}

export async function createReview(
  placeId: number,
  userId: number,
  body: unknown,
  images: ReviewImageUpload[],
) {
  if (!(await isActivePlace(placeId)))
    throw new ReviewError(404, "Không tìm thấy địa điểm đang hoạt động.");
  if (images.length > 5)
    throw new ReviewError(400, "Mỗi đánh giá chỉ được đính kèm tối đa 5 ảnh.");
  const input = reviewSchema.safeParse(body);
  if (!input.success)
    throw new ReviewError(
      400,
      input.error.issues[0]?.message ?? "Dữ liệu đánh giá không hợp lệ.",
    );
  const result = await insertPendingReview(
    placeId,
    userId,
    input.data.rating,
    input.data.comment,
    REVIEW_COOLDOWN_MINUTES,
    images,
  );
  if ("retryAfterSeconds" in result) {
    const minutes = Math.floor(result.retryAfterSeconds / 60);
    const seconds = result.retryAfterSeconds % 60;
    const wait = [
      minutes ? `${minutes} phút` : "",
      seconds ? `${seconds} giây` : "",
    ]
      .filter(Boolean)
      .join(" ");
    throw new ReviewError(
      429,
      `Bạn hãy chờ thêm ${wait} rồi gửi đánh giá tiếp theo.`,
    );
  }
  return { review_id: result.reviewId };
}

export async function getApprovedReviewImage(
  placeId: number,
  reviewId: number,
  imageId: number,
) {
  return findApprovedReviewImage(placeId, reviewId, imageId);
}

export async function getUserReviewImage(
  reviewId: number,
  imageId: number,
  userId: number,
) {
  return findUserReviewImage(reviewId, imageId, userId);
}

export async function getAdminReviewImage(reviewId: number, imageId: number) {
  return findAdminReviewImage(reviewId, imageId);
}

export async function listUserReviews(userId: number) {
  return findUserReviews(userId);
}

export async function updateOwnReview(
  reviewId: number,
  userId: number,
  body: unknown,
  images: ReviewImageUpload[] = [],
) {
  const review = await findReviewOwner(reviewId);
  if (!review) throw new ReviewError(404, "Không tìm thấy đánh giá.");
  if (review.user_id !== userId)
    throw new ReviewError(403, "Bạn không có quyền sửa đánh giá này.");
  const input = reviewSchema
    .extend({
      keepImageIds: z
        .array(z.number().int().min(1).max(2147483647))
        .max(5)
        .optional(),
    })
    .safeParse(body);
  if (!input.success)
    throw new ReviewError(
      400,
      input.error.issues[0]?.message ?? "Dữ liệu đánh giá không hợp lệ.",
    );
  if (
    input.data.keepImageIds &&
    new Set(input.data.keepImageIds).size !== input.data.keepImageIds.length
  )
    throw new ReviewError(400, "Danh sách ảnh giữ lại bị trùng.");
  if (
    input.data.keepImageIds &&
    input.data.keepImageIds.length + images.length > 5
  )
    throw new ReviewError(400, "Mỗi đánh giá chỉ được đính kèm tối đa 5 ảnh.");
  const result = await updateOwnReviewTx(
    reviewId,
    userId,
    input.data.rating,
    input.data.comment,
    input.data.keepImageIds,
    images,
  );
  if (result === "missing")
    throw new ReviewError(404, "Không tìm thấy đánh giá.");
  if (result === "forbidden")
    throw new ReviewError(403, "Bạn không có quyền sửa đánh giá này.");
  if (result === "invalidImages")
    throw new ReviewError(
      400,
      "Danh sách ảnh không thuộc đánh giá này. Vui lòng tải lại trang và thử lại.",
    );
  return { review_id: reviewId, status: "PENDING" as const };
}

export async function deleteOwnReview(reviewId: number, userId: number) {
  const review = await findReviewOwner(reviewId);
  if (!review) throw new ReviewError(404, "Không tìm thấy đánh giá.");
  if (review.user_id !== userId)
    throw new ReviewError(403, "Bạn không có quyền xóa đánh giá này.");
  const result = await deleteOwnReviewTx(reviewId, userId);
  if (result === "missing")
    throw new ReviewError(404, "Không tìm thấy đánh giá.");
  if (result === "forbidden")
    throw new ReviewError(403, "Bạn không có quyền xóa đánh giá này.");
}

export async function listAdminReviews(query: Record<string, unknown>) {
  const parsed = adminReviewQuerySchema.safeParse(query);
  if (!parsed.success)
    throw new ReviewError(400, "Bộ lọc đánh giá không hợp lệ.");
  return findAdminReviews(parsed.data.rating, parsed.data.status);
}

export async function moderateReview(
  reviewId: number,
  moderatorId: number,
  body: unknown,
) {
  const parsed = adminReviewStatusSchema.safeParse(body);
  if (!parsed.success)
    throw new ReviewError(400, "Trạng thái kiểm duyệt không hợp lệ.");
  const updated = await updateReviewStatusTx(
    reviewId,
    parsed.data.status,
    moderatorId,
  );
  if (!updated) throw new ReviewError(404, "Không tìm thấy đánh giá.");
  return { status: parsed.data.status };
}

export async function removeReview(reviewId: number) {
  const deleted = await deleteReviewTx(reviewId);
  if (!deleted) throw new ReviewError(404, "Không tìm thấy đánh giá.");
}
