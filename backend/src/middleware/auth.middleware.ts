import type { RequestHandler } from 'express';
import { AuthError } from '../modules/auth/auth.errors';
import { getAccountRecord, verifyAccessToken } from '../modules/auth/auth.service';
import { mapRoleName, type AccountRole } from '../modules/auth/auth.repository';

declare global {
  namespace Express {
    interface Locals {
      authUserId?: number;
      authRole?: AccountRole;
    }
    interface Request {
      user?: {
        user_id: number;
        role: AccountRole;
        partner_id?: number;
      };
    }
  }
}

export function requireAuth(sessionType: 'USER' | 'ADMIN' = 'USER'): RequestHandler {
  return async (req, res, next) => {
    const cookies = req.cookies as Record<string, string> | undefined;
    const cookieName = sessionType === 'ADMIN' ? 'admin_access' : 'access_token';
    const bearerToken = req.header('authorization')?.match(/^Bearer\s+([^\s]+)$/i)?.[1];
    const token = cookies?.[cookieName] || (sessionType === 'USER' ? bearerToken : undefined);
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
      const account = await getAccountRecord(userId);
      if (!account) throw new AuthError(401, 'Phiên đăng nhập không còn hiệu lực.');
      const role = mapRoleName(account.role_name);
      res.locals.authUserId = userId;
      res.locals.authRole = role;
      req.authenticatedUser = { id: userId };
      req.user = {
        user_id: userId,
        role,
        ...(account.partner_id ? { partner_id: account.partner_id } : {}),
      };
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
