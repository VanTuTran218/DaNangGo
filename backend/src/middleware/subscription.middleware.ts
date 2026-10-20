import type { RequestHandler } from 'express';
import { AuthError } from '../modules/auth/auth.errors';
import { hasActiveSubscription } from '../modules/subscriptions/subscriptions.service';

/**
 * Middleware kiểm tra gói đăng ký hoạt động trực tiếp từ SQL Server.
 * Chặn các thao tác tạo/quản lý dịch vụ khi gói đã hết hạn hoặc chưa kích hoạt thanh toán.
 */
export const requireActiveSubscription: RequestHandler = async (_req, res, next) => {
  const partnerProfileId = res.locals.partnerProfileId;
  if (!partnerProfileId) {
    next(new AuthError(403, 'Tài khoản đối tác chưa được Admin duyệt hoặc không tồn tại.'));
    return;
  }

  try {
    const isActive = await hasActiveSubscription(partnerProfileId);
    if (!isActive) {
      next(
        new AuthError(
          403,
          'Gói dịch vụ của bạn chưa được kích hoạt hoặc đã hết hạn. Vui lòng đăng ký hoặc gia hạn gói hoạt động để tiếp tục quản lý cơ sở và dịch vụ.'
        )
      );
      return;
    }
    next();
  } catch (error) {
    next(error);
  }
};
