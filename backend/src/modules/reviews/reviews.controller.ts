import type { Request, Response } from "express";
import * as service from "./reviews.service";

function getPlaceId(req: Request, res: Response): number | null {
  const id = Number(req.params["id"]);
  if (!Number.isSafeInteger(id) || id < 1) {
    res
      .status(400)
      .json({ success: false, message: "ID địa điểm không hợp lệ." });
    return null;
  }
  return id;
}

function handleError(res: Response, error: unknown) {
  if (error instanceof service.ReviewError) {
    res.status(error.status).json({ success: false, message: error.message });
    return;
  }
  console.error("Lỗi xử lý đánh giá:", error);
  res.status(500).json({
    success: false,
    message: "Đã xảy ra lỗi máy chủ. Vui lòng thử lại sau.",
  });
}

export async function list(req: Request, res: Response) {
  const placeId = getPlaceId(req, res);
  if (placeId === null) return;
  try {
    const data = await service.listReviews(
      placeId,
      req.query as Record<string, unknown>,
    );
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
    res
      .status(401)
      .json({ success: false, message: "Vui lòng đăng nhập để tiếp tục." });
    return;
  }
  try {
    const data = await service.createReview(
      placeId,
      userId,
      req.body,
      req.reviewImages ?? [],
    );
    res.status(201).json({
      success: true,
      message:
        "Đánh giá của bạn đang chờ phê duyệt. Sau khi admin duyệt, đánh giá sẽ hiển thị trên trang chi tiết địa điểm.",
      data,
    });
  } catch (error) {
    handleError(res, error);
  }
}

export async function reviewImage(req: Request, res: Response) {
  const placeId = Number(req.params["id"]);
  const reviewId = Number(req.params["reviewId"]);
  const imageId = Number(req.params["imageId"]);
  if (
    ![placeId, reviewId, imageId].every(
      (value) => Number.isSafeInteger(value) && value > 0,
    )
  ) {
    res
      .status(400)
      .json({ success: false, message: "Đường dẫn ảnh không hợp lệ." });
    return;
  }
  try {
    const image = await service.getApprovedReviewImage(
      placeId,
      reviewId,
      imageId,
    );
    if (!image) {
      res.status(404).json({ success: false, message: "Không tìm thấy ảnh." });
      return;
    }
    res.set({
      "Content-Type": image.mime_type,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    });
    res.send(image.image_data);
  } catch (error) {
    handleError(res, error);
  }
}

async function sendPrivateReviewImage(
  res: Response,
  image: Awaited<ReturnType<typeof service.getAdminReviewImage>>,
) {
  if (!image) {
    res.status(404).json({ success: false, message: "Không tìm thấy ảnh." });
    return;
  }
  res.set({
    "Content-Type": image.mime_type,
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "private, no-store",
  });
  res.send(image.image_data);
}

export async function ownReviewImage(req: Request, res: Response) {
  const reviewId = Number(req.params["reviewId"]);
  const imageId = Number(req.params["imageId"]);
  if (
    ![reviewId, imageId].every(
      (value) => Number.isSafeInteger(value) && value > 0,
    )
  ) {
    res
      .status(400)
      .json({ success: false, message: "Đường dẫn ảnh không hợp lệ." });
    return;
  }
  try {
    await sendPrivateReviewImage(
      res,
      await service.getUserReviewImage(
        reviewId,
        imageId,
        res.locals.authUserId!,
      ),
    );
  } catch (error) {
    handleError(res, error);
  }
}

export async function adminReviewImage(req: Request, res: Response) {
  const reviewId = Number(req.params["reviewId"]);
  const imageId = Number(req.params["imageId"]);
  if (
    ![reviewId, imageId].every(
      (value) => Number.isSafeInteger(value) && value > 0,
    )
  ) {
    res
      .status(400)
      .json({ success: false, message: "Đường dẫn ảnh không hợp lệ." });
    return;
  }
  try {
    await sendPrivateReviewImage(
      res,
      await service.getAdminReviewImage(reviewId, imageId),
    );
  } catch (error) {
    handleError(res, error);
  }
}

export async function myReviews(_req: Request, res: Response) {
  try {
    const data = await service.listUserReviews(res.locals.authUserId!);
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function eligibility(req: Request, res: Response) {
  const placeId = getPlaceId(req, res);
  if (placeId === null) return;
  try {
    const data = await service.getReviewEligibility(placeId, res.locals.authUserId!);
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
}

function getReviewId(req: Request, res: Response, param = "id"): number | null {
  const id = Number(req.params[param]);
  if (!Number.isSafeInteger(id) || id < 1) {
    res
      .status(400)
      .json({ success: false, message: "ID đánh giá không hợp lệ." });
    return null;
  }
  return id;
}

export async function adminList(req: Request, res: Response) {
  try {
    const data = await service.listAdminReviews(
      req.query as Record<string, unknown>,
    );
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function adminModerate(req: Request, res: Response) {
  const reviewId = getReviewId(req, res);
  if (reviewId === null) return;
  try {
    const data = await service.moderateReview(
      reviewId,
      res.locals.authUserId!,
      req.body,
    );
    res.json({
      success: true,
      data,
      message:
        data.status === "APPROVED"
          ? "Đã duyệt đánh giá."
          : "Đã từ chối/ẩn đánh giá.",
    });
  } catch (error) {
    handleError(res, error);
  }
}

export async function adminDelete(req: Request, res: Response) {
  const reviewId = getReviewId(req, res);
  if (reviewId === null) return;
  // clearCooldown=true cho phép admin xóa cooldown của user (ví dụ: review bị xóa do lỗi hệ thống)
  // để user có thể review lại địa điểm ngay lập tức. Mặc định: false (cooldown vẫn còn hiệu lực).
  const clearCooldown = req.query["clearCooldown"] === "true";
  try {
    await service.removeReview(reviewId, { clearCooldown });
    res.json({
      success: true,
      message: clearCooldown
        ? "Đã xóa đánh giá và đặt lại thời gian chờ của người dùng."
        : "Đã xóa đánh giá.",
    });
  } catch (error) {
    handleError(res, error);
  }
}

export async function adminEdit(req: Request, res: Response) {
  const reviewId = getReviewId(req, res);
  if (reviewId === null) return;
  try {
    await service.editReview(reviewId, req.body);
    res.json({ success: true, message: "Đã chỉnh sửa đánh giá." });
  } catch (error) {
    handleError(res, error);
  }
}
