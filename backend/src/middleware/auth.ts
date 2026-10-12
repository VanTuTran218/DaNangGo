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
 * MOCK — Giả lập user đã đăng nhập (Partner).
 * ⚠️ Thay bằng JWT thật khi module auth hoàn thành.
 */
export const verifyToken = (req: Request, _res: Response, next: NextFunction) => {
  req.user = {
    user_id: 1,
    role: 'PARTNER',
    partner_id: 1,
  };
  next();
};

/**
 * Kiểm tra role của user.
 * Truyền vào danh sách các role được phép.
 */
export const requireRole = (...roles: Array<'USER' | 'PARTNER' | 'ADMIN'>) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: 'Không có quyền thực hiện' });
      return;
    }
    next();
  };
