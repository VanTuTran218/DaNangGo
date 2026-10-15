import type { Request, Response, NextFunction } from 'express';

// Mở rộng kiểu Request để gắn thêm thông tin user sau khi xác thực
declare global {
  namespace Express {
    interface Request {
      user?: {
        user_id: number;
        role: 'USER' | 'PARTNER' | 'ADMIN';
        partner_id?: number;
      };
    }
  }
}

/**
 * Authentication Middleware
 * Sử dụng auth.middleware thật từ hệ thống JWT/Cookie
 */
export { requireAuth, requireRole } from './auth.middleware';
