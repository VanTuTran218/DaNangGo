import type { RequestHandler } from 'express';
import { AuthError } from '../modules/auth/auth.errors';
import { getApprovedPartnerProfileId } from '../modules/partners/partners.service';

declare global {
  namespace Express {
    interface Locals {
      partnerProfileId?: number;
    }
  }
}

export const requireApprovedPartner: RequestHandler = async (_req, res, next) => {
  const userId = res.locals.authUserId;
  if (!userId) {
    next(new AuthError(401, 'Vui lòng đăng nhập để tiếp tục.'));
    return;
  }
  try {
    const partnerProfileId = await getApprovedPartnerProfileId(userId);
    if (!partnerProfileId) {
      next(new AuthError(403, 'Tài khoản đối tác chưa được Admin duyệt, đã bị từ chối hoặc đang bị khóa.'));
      return;
    }
    res.locals.partnerProfileId = partnerProfileId;
    next();
  } catch (error) {
    next(error);
  }
};
