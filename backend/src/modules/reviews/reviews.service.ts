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
  findApprovedReviewImage,
  findUserReviewImage,
  findAdminReviewImage,
  findReviewRetryAfterMs,
  editReviewComment,
} from "./reviews.repository";
import type { ReviewImageUpload } from "./reviews.upload";

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

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
    images,
  );
  if ("retryAfterMs" in result) {
    const totalMinutes = Math.ceil(result.retryAfterMs / 60000);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;
    const parts: string[] = [];
    if (days > 0) parts.push(`${days} ngày`);
    if (hours > 0) parts.push(`${hours} giờ`);
    if (minutes > 0 && days === 0) parts.push(`${minutes} phút`);
    const wait = parts.join(" ") || "ít phút";
    throw new ReviewError(
      429,
      `Bạn cần chờ đủ 7 ngày kể từ lần đánh giá trước để gửi tiếp. Còn khoảng ${wait}.`,
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

export async function getReviewEligibility(placeId: number, userId: number) {
  return { retry_after_ms: await findReviewRetryAfterMs(userId, placeId) };
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

export async function removeReview(
  reviewId: number,
  opts: { clearCooldown?: boolean } = {},
) {
  const deleted = await deleteReviewTx(reviewId, opts);
  if (!deleted) throw new ReviewError(404, "Không tìm thấy đánh giá.");
}

export async function editReview(reviewId: number, body: unknown) {
  const input = reviewSchema.pick({ comment: true }).safeParse(body);
  if (!input.success)
    throw new ReviewError(400, input.error.issues[0]?.message ?? "Dữ liệu đánh giá không hợp lệ.");
  if (!(await editReviewComment(reviewId, input.data.comment)))
    throw new ReviewError(404, "Không tìm thấy đánh giá.");
}
