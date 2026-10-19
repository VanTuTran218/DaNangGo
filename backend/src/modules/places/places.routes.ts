import { Router, type RequestHandler } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { getAccountAuthDetails, verifyAccessToken } from '../auth/auth.service';
import * as controller from './places.controller';

const router = Router();

/**
 * Middleware tùy chọn xác thực:
 * - Nếu có cookie access_token hoặc admin_access thì giải mã để gắn req.user.
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
 * GET /api/places
 * Tìm kiếm và lọc danh sách địa điểm (Công khai, hỗ trợ đa tiêu chí và phân trang)
 * Query params: ?q=...&type=RESTAURANT&district_id=1&min_price=10000&max_price=200000&sort=rating_desc&page=1&limit=10
 */
router.get('/', optionalAuth, controller.getAll);

/**
 * GET /api/places/:id
 * Lấy chi tiết 1 địa điểm theo ID (kèm danh sách ảnh và giờ mở cửa)
 */
router.get('/:id', optionalAuth, controller.getOne);

/**
 * PATCH /api/places/:id/status
 * PUT /api/places/:id/status
 * Cập nhật trạng thái địa điểm (ACTIVE, HIDDEN, LOCKED)
 * Quyền: PARTNER (chỉ cơ sở của mình) hoặc ADMIN (quản trị toàn hệ thống)
 */
router.patch('/:id/status', requireAuth('USER'), controller.updateStatus);
router.put('/:id/status', requireAuth('USER'), controller.updateStatus);

/**
 * POST /api/places
 * Tạo địa điểm mới (tương thích ngược với endpoint cũ)
 */
router.post('/', requireAuth('USER'), requireRole('PARTNER', 'ADMIN'), controller.create);

export default router;
