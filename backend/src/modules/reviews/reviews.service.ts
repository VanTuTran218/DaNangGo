import { z } from 'zod';
import {
  findApprovedReviews,
  findAdminReviews,
  findUserReviewStatus,
  findPlaceSummary,
  insertPendingReview,
  isActivePlace,
  isUniqueConstraintError,
  updateReviewStatusTx,
  deleteReviewTx,
} from './reviews.repository';

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

const reviewSchema = z.object({
  rating: z.number().int()
    .min(1, 'Điểm đánh giá phải từ 1 đến 5.')
    .max(5, 'Điểm đánh giá phải từ 1 đến 5.'),
  comment: z.string()
    .transform((value) => value.replace(/<[^>]*>/g, '').replace(/[\u0000-\u001F\u007F]/g, '').trim())
    .pipe(z.string().min(1, 'Vui lòng nhập nội dung đánh giá.').max(1000, 'Nội dung không được vượt quá 1000 ký tự.')),
});

const adminReviewQuerySchema = z.object({
  rating: z.coerce.number().int().min(1).max(5).optional(),
  status: z.enum(['PENDING', 'APPROVED', 'HIDDEN']).optional(),
});
const adminReviewStatusSchema = z.object({ status: z.enum(['APPROVED', 'HIDDEN']) });

export class ReviewError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

export async function listReviews(placeId: number, query: Record<string, unknown>) {
  const pagination = paginationSchema.safeParse(query);
  if (!pagination.success) throw new ReviewError(400, pagination.error.issues[0]?.message ?? 'Tham số phân trang không hợp lệ.');

  const place = await findPlaceSummary(placeId);
  if (!place) throw new ReviewError(404, 'Không tìm thấy địa điểm.');

  const { page, limit } = pagination.data;
  const { rows, total } = await findApprovedReviews(placeId, (page - 1) * limit, limit);
  return {
    reviews: rows,
    avg_rating: place.avg_rating,
    review_count: place.review_count,
    pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
  };
}

export async function createReview(placeId: number, userId: number, body: unknown) {
  if (!(await isActivePlace(placeId))) throw new ReviewError(404, 'Không tìm thấy địa điểm đang hoạt động.');
  const input = reviewSchema.safeParse(body);
  if (!input.success) throw new ReviewError(400, input.error.issues[0]?.message ?? 'Dữ liệu đánh giá không hợp lệ.');
  const existingStatus = await findUserReviewStatus(placeId, userId);
  if (existingStatus) throw duplicateReviewError(existingStatus);

  try {
    const reviewId = await insertPendingReview(placeId, userId, input.data.rating, input.data.comment);
    return { review_id: reviewId };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const currentStatus = await findUserReviewStatus(placeId, userId);
      throw currentStatus ? duplicateReviewError(currentStatus) : new ReviewError(409, 'Bạn đã đánh giá địa điểm này.');
    }
    throw error;
  }
}

function duplicateReviewError(status: 'PENDING' | 'APPROVED' | 'HIDDEN'): ReviewError {
  if (status === 'PENDING') return new ReviewError(409, 'Đánh giá của bạn đang chờ phê duyệt.');
  if (status === 'APPROVED') return new ReviewError(409, 'Bạn đã đánh giá địa điểm này và đánh giá đã được duyệt.');
  return new ReviewError(409, 'Bạn đã gửi đánh giá này nhưng hiện không hiển thị.');
}

export async function listAdminReviews(query: Record<string, unknown>) {
  const parsed = adminReviewQuerySchema.safeParse(query);
  if (!parsed.success) throw new ReviewError(400, 'Bộ lọc đánh giá không hợp lệ.');
  return findAdminReviews(parsed.data.rating, parsed.data.status);
}

export async function moderateReview(reviewId: number, moderatorId: number, body: unknown) {
  const parsed = adminReviewStatusSchema.safeParse(body);
  if (!parsed.success) throw new ReviewError(400, 'Trạng thái kiểm duyệt không hợp lệ.');
  const updated = await updateReviewStatusTx(reviewId, parsed.data.status, moderatorId);
  if (!updated) throw new ReviewError(404, 'Không tìm thấy đánh giá.');
  return { status: parsed.data.status };
}

export async function removeReview(reviewId: number) {
  const deleted = await deleteReviewTx(reviewId);
  if (!deleted) throw new ReviewError(404, 'Không tìm thấy đánh giá.');
}
