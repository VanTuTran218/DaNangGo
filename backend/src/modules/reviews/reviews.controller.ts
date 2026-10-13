import type { Request, Response } from 'express';
import * as service from './reviews.service';

function getPlaceId(req: Request, res: Response): number | null {
  const id = Number(req.params['id']);
  if (!Number.isSafeInteger(id) || id < 1) {
    res.status(400).json({ success: false, message: 'ID địa điểm không hợp lệ.' });
    return null;
  }
  return id;
}

function handleError(res: Response, error: unknown) {
  if (error instanceof service.ReviewError) {
    res.status(error.status).json({ success: false, message: error.message });
    return;
  }
  console.error('Lỗi xử lý đánh giá:', error);
  res.status(500).json({ success: false, message: 'Đã xảy ra lỗi máy chủ. Vui lòng thử lại sau.' });
}

export async function list(req: Request, res: Response) {
  const placeId = getPlaceId(req, res);
  if (placeId === null) return;
  try {
    const data = await service.listReviews(placeId, req.query as Record<string, unknown>);
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function create(req: Request, res: Response) {
  const placeId = getPlaceId(req, res);
  if (placeId === null) return;
  const userId = res.locals.authUserId;
  if (!userId) {
    res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để tiếp tục.' });
    return;
  }
  try {
    const data = await service.createReview(placeId, userId, req.body);
    res.status(201).json({
      success: true,
      message: 'Đánh giá của bạn đang chờ phê duyệt. Sau khi admin duyệt, đánh giá sẽ hiển thị trên trang chi tiết địa điểm.',
      data,
    });
  } catch (error) {
    handleError(res, error);
  }
}

function getReviewId(req: Request, res: Response): number | null {
  const id = Number(req.params['id']);
  if (!Number.isSafeInteger(id) || id < 1) {
    res.status(400).json({ success: false, message: 'ID đánh giá không hợp lệ.' });
    return null;
  }
  return id;
}

export async function adminList(req: Request, res: Response) {
  try {
    const data = await service.listAdminReviews(req.query as Record<string, unknown>);
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function adminModerate(req: Request, res: Response) {
  const reviewId = getReviewId(req, res);
  if (reviewId === null) return;
  try {
    const data = await service.moderateReview(reviewId, res.locals.authUserId!, req.body);
    res.json({ success: true, data, message: data.status === 'APPROVED' ? 'Đã duyệt đánh giá.' : 'Đã từ chối/ẩn đánh giá.' });
  } catch (error) {
    handleError(res, error);
  }
}

export async function adminDelete(req: Request, res: Response) {
  const reviewId = getReviewId(req, res);
  if (reviewId === null) return;
  try {
    await service.removeReview(reviewId);
    res.json({ success: true, message: 'Đã xóa đánh giá.' });
  } catch (error) {
    handleError(res, error);
  }
}
