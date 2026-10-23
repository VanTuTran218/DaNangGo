import { Router, type RequestHandler } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { getAccountAuthDetails, verifyAccessToken } from '../auth/auth.service';
import reviewsRouter from '../reviews/reviews.routes';
import * as controller from './places.controller';

const router = Router();

router.use('/:id/reviews', reviewsRouter);

/**
 * Middleware tùy chọn xác thực:
 * - Hỗ trợ cả Cookie (admin_access, access_token) và Header Authorization: Bearer <token>
 * - Nếu có token hợp lệ: giải mã và gắn req.user + res.locals.
 * - Nếu không có token hoặc token không hợp lệ: tiếp tục bình thường như khách vãng lai.
 */
const optionalAuth: RequestHandler = async (req, res, next) => {
  const cookies = req.cookies as Record<string, string> | undefined;
  const authHeader = req.headers.authorization;
  const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined;
  const token = cookies?.admin_access || cookies?.access_token || headerToken;
  if (!token) return next();
  try {
    const sessionType = cookies?.admin_access ? 'ADMIN' : 'USER';
    let userId: number;
    try {
      userId = await verifyAccessToken(token, sessionType);
    } catch {
      // Fallback kiểm tra loại session còn lại nếu dùng headerToken
      userId = await verifyAccessToken(token, sessionType === 'ADMIN' ? 'USER' : 'ADMIN');
    }

    const authDetails = await getAccountAuthDetails(userId);
    if (authDetails) {
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
    }
  } catch {
    // Bỏ qua lỗi token ở route công khai, tiếp tục xử lý như khách vãng lai
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
