import type { RequestHandler } from 'express';
import { AuthError } from '../modules/auth/auth.errors';
import { getAccountRole, verifyAccessToken } from '../modules/auth/auth.service';
import type { AccountRole } from '../modules/auth/auth.repository';

declare global {
  namespace Express {
    interface Locals {
      authUserId?: number;
      authRole?: AccountRole;
    }
  }
}

export function requireAuth(sessionType: 'USER' | 'ADMIN' = 'USER'): RequestHandler {
  return async (req, res, next) => {
    const cookies = req.cookies as Record<string, string> | undefined;
    const cookieName = sessionType === 'ADMIN' ? 'admin_access' : 'access_token';
    const token = cookies?.[cookieName];
    if (!token) {
      if (sessionType === 'ADMIN' && cookies?.access_token) {
        try {
          await verifyAccessToken(cookies.access_token, 'USER');
          next(new AuthError(403, 'Bạn không có quyền truy cập khu vực quản trị.'));
          return;
        } catch (error) {
          if (error instanceof AuthError && error.statusCode === 403) {
            next(error);
            return;
          }
        }
      }
      next(new AuthError(401, 'Vui lòng đăng nhập để tiếp tục.'));
      return;
    }
    try {
      const userId = await verifyAccessToken(token, sessionType);
      const role = await getAccountRole(userId);
      if (!role) throw new AuthError(401, 'Phiên đăng nhập không còn hiệu lực.');
      res.locals.authUserId = userId;
      res.locals.authRole = role;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireRole(...roles: AccountRole[]): RequestHandler {
  return (_req, res, next) => {
    const role = res.locals.authRole;
    if (!role) {
      next(new AuthError(401, 'Vui lòng đăng nhập để tiếp tục.'));
      return;
    }
    if (!roles.includes(role)) {
      next(new AuthError(403, 'Bạn không có quyền thực hiện thao tác này.'));
      return;
    }
    next();
  };
}
