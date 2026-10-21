import type { RequestHandler } from 'express';
import { AuthError } from '../modules/auth/auth.errors';
import { getAccountAuthDetails, verifyAccessToken, refreshSession } from '../modules/auth/auth.service';
import type { AccountRole } from '../modules/auth/auth.repository';

declare global {
  namespace Express {
    interface Locals {
      authUserId?: number;
      authRole?: AccountRole;
      authPartnerId?: number;
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
    const authHeader = req.headers.authorization;
    const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined;
    let effectiveSession = sessionType;
    let token: string | undefined;

    // Cho phép Admin (admin_access) được ưu tiên gọi các API dùng chung kể cả khi còn cookie access_token cũ
    if (cookies?.admin_access) {
      token = cookies.admin_access;
      effectiveSession = 'ADMIN';
    } else if (cookies?.[sessionType === 'ADMIN' ? 'admin_access' : 'access_token']) {
      token = cookies?.[sessionType === 'ADMIN' ? 'admin_access' : 'access_token'];
    } else if (headerToken) {
      token = headerToken;
    }

    // Tự động làm mới phiên đăng nhập nếu access cookie hết hạn nhưng vẫn còn refresh cookie
    if (!token && (cookies?.admin_refresh || cookies?.refresh_token)) {
      try {
        const refreshCookie = cookies.admin_refresh || cookies.refresh_token;
        const refType = cookies.admin_refresh ? 'ADMIN' : 'USER';
        const newSession = await refreshSession(refreshCookie, refType, {
          userAgent: req.get('user-agent') ?? null,
          ip: req.ip ?? null,
        });
        token = newSession.accessToken;
        effectiveSession = refType;
        const accessName = refType === 'ADMIN' ? 'admin_access' : 'access_token';
        const refreshName = refType === 'ADMIN' ? 'admin_refresh' : 'refresh_token';
        const isProd = process.env.NODE_ENV === 'production';
        const accessMaxAge = isProd ? 15 * 60 * 1000 : 24 * 60 * 60 * 1000;
        res.cookie(accessName, newSession.accessToken, { httpOnly: true, sameSite: 'lax', secure: isProd, path: '/', maxAge: accessMaxAge });
        res.cookie(refreshName, newSession.refreshToken, { httpOnly: true, sameSite: 'lax', secure: isProd, path: '/' });
      } catch {
        // Bỏ qua lỗi refresh và tiếp tục kiểm tra token
      }
    }

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
      let userId: number;
      try {
        userId = await verifyAccessToken(token, effectiveSession);
      } catch (err) {
        if (headerToken) {
          // Thử phiên đối ứng nếu dùng headerToken
          const fallbackSession = effectiveSession === 'ADMIN' ? 'USER' : 'ADMIN';
          userId = await verifyAccessToken(token, fallbackSession);
          effectiveSession = fallbackSession;
        } else if (cookies?.admin_refresh || cookies?.refresh_token) {
          // Token cookie đã hết hạn -> tự động dùng refresh token lấy token mới
          const refreshCookie = cookies.admin_refresh || cookies.refresh_token;
          const refType = cookies.admin_refresh ? 'ADMIN' : 'USER';
          const newSession = await refreshSession(refreshCookie, refType, {
            userAgent: req.get('user-agent') ?? null,
            ip: req.ip ?? null,
          });
          userId = await verifyAccessToken(newSession.accessToken, refType);
          effectiveSession = refType;
          const accessName = refType === 'ADMIN' ? 'admin_access' : 'access_token';
          const refreshName = refType === 'ADMIN' ? 'admin_refresh' : 'refresh_token';
          const isProd = process.env.NODE_ENV === 'production';
          const accessMaxAge = isProd ? 15 * 60 * 1000 : 24 * 60 * 60 * 1000;
          res.cookie(accessName, newSession.accessToken, { httpOnly: true, sameSite: 'lax', secure: isProd, path: '/', maxAge: accessMaxAge });
          res.cookie(refreshName, newSession.refreshToken, { httpOnly: true, sameSite: 'lax', secure: isProd, path: '/' });
        } else {
          throw err;
        }
      }
      const authDetails = await getAccountAuthDetails(userId);
      if (!authDetails) throw new AuthError(401, 'Phiên đăng nhập không còn hiệu lực.');
      res.locals.authUserId = userId;
      res.locals.authRole = authDetails.role;
      if (authDetails.partnerId) {
        res.locals.authPartnerId = authDetails.partnerId;
      }
      req.user = {
        user_id: userId,
        role: authDetails.role,
        ...(authDetails.partnerId ? { partner_id: authDetails.partnerId } : {}),
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
