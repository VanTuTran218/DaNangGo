import { Router, type RequestHandler } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { getAccountAuthDetails, verifyAccessToken } from '../auth/auth.service';
import * as controller from './attractions.controller';

const router = Router();

/**
 * Middleware tùy chọn xác thực:
 * - Nếu có cookie access_token hoặc admin_access thì giải mã để gắn req.user (cho phép ADMIN xem điểm HIDDEN).
 * - Nếu không có token hoặc token không hợp lệ thì vẫn tiếp tục bình thường như khách vãng lai.
 */
const optionalAuth: RequestHandler = async (req, res, next) => {
  const cookies = req.cookies as Record<string, string> | undefined;
  const token = cookies?.admin_access || cookies?.access_token;
  if (!token) return next();

  try {
    const sessionType = cookies?.admin_access ? 'ADMIN' : 'USER';
    const userId = await verifyAccessToken(token, sessionType);
    const authDetails = await getAccountAuthDetails(userId);
    if (authDetails) {
      res.locals.authUserId = userId;
      res.locals.authRole = authDetails.role;
      req.user = {
        user_id: userId,
        role: authDetails.role,
        ...(authDetails.partnerId ? { partner_id: authDetails.partnerId } : {}),
      };
    }
  } catch {
    // Bỏ qua lỗi token ở route công khai, coi như khách vãng lai
  }
  next();
};

/**
 * GET /api/attractions
 * Lấy danh sách điểm du lịch (công khai, không bắt buộc đăng nhập)
 * Query params: ?page=1&limit=10&district_id=1&category_id=2&keyword=Sơn Trà
 */
router.get('/', optionalAuth, controller.getAll);

/**
 * GET /api/attractions/:id
 * Lấy chi tiết 1 điểm du lịch (công khai)
 * Điểm trạng thái HIDDEN chỉ ADMIN có token hợp lệ mới xem được
 */
router.get('/:id', optionalAuth, controller.getOne);

/**
 * POST /api/attractions
 * Tạo mới điểm du lịch — chỉ Quản trị viên (ADMIN)
 */
router.post('/', requireAuth('USER'), requireRole('ADMIN'), controller.create);

/**
 * PUT /api/attractions/:id
 * Cập nhật thông tin điểm du lịch — chỉ Quản trị viên (ADMIN)
 */
router.put('/:id', requireAuth('USER'), requireRole('ADMIN'), controller.update);

/**
 * DELETE /api/attractions/:id
 * Ẩn điểm du lịch (Soft delete, status = 'HIDDEN') — chỉ Quản trị viên (ADMIN)
 */
router.delete('/:id', requireAuth('USER'), requireRole('ADMIN'), controller.remove);

export default router;
