import { Router, type Request, type Response } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import * as service from './partner.service';
import { ok, notFound, badRequest, serverError } from '../../utils/response';

const router = Router();

// Yêu cầu xác thực với vai trò PARTNER hoặc ADMIN
router.use(requireAuth('USER'), requireRole('PARTNER', 'ADMIN'));

/**
 * GET /api/partner/profile
 * Lấy hồ sơ đối tác của tài khoản đang đăng nhập
 */
router.get('/profile', async (req: Request, res: Response) => {
  try {
    const userId = res.locals.authUserId as number;
    const profile = await service.getPartnerProfile(userId);

    if (!profile) {
      return notFound(res, 'Chưa tìm thấy hồ sơ đối tác cho tài khoản này.');
    }

    return ok(res, profile, 'Lấy hồ sơ đối tác thành công');
  } catch (error) {
    return serverError(res, error);
  }
});

/**
 * PUT /api/partner/profile
 * Cập nhật thông tin hồ sơ đối tác
 */
router.put('/profile', async (req: Request, res: Response) => {
  try {
    const userId = res.locals.authUserId as number;
    const { businessName, serviceType, taxCode, address, phone } = req.body;

    const updated = await service.updatePartnerProfile(userId, {
      businessName,
      serviceType,
      taxCode,
      address,
      contactPhone: phone,
    });

    return ok(res, updated, 'Cập nhật hồ sơ đối tác thành công');
  } catch (error) {
    return serverError(res, error);
  }
});

/**
 * GET /api/partner/places
 * Lấy danh sách quán thuộc sở hữu của đối tác
 */
router.get('/places', async (req: Request, res: Response) => {
  try {
    const userId = res.locals.authUserId as number;
    const status = typeof req.query.status === 'string' ? req.query.status : null;
    const places = await service.getPlaces(userId, status);
    return ok(res, places, 'Lấy danh sách cơ sở thành công');
  } catch (error) {
    return serverError(res, error);
  }
});

/**
 * GET /api/partner/places/:id
 * Lấy chi tiết 1 cơ sở thuộc sở hữu của đối tác
 */
router.get('/places/:id', async (req: Request, res: Response) => {
  try {
    const userId = res.locals.authUserId as number;
    const placeId = parseInt(String(req.params.id));
    if (isNaN(placeId) || placeId <= 0) {
      return badRequest(res, 'ID cơ sở không hợp lệ (phải là số nguyên dương)');
    }

    const place = await service.getPlaceById(userId, placeId);
    if (!place) {
      return notFound(res, 'Không tìm thấy cơ sở dịch vụ');
    }

    return ok(res, place, 'Lấy thông tin cơ sở thành công');
  } catch (error) {
    return serverError(res, error);
  }
});

export default router;
