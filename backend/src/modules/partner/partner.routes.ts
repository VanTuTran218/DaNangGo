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

    if (phone !== undefined && phone !== null && String(phone).trim() !== '') {
      const cleanedPhone = String(phone).trim().replace(/\s+/g, '');
      if (!/^\d{10}$/.test(cleanedPhone)) {
        return badRequest(res, 'Số điện thoại liên hệ không hợp lệ (chỉ gồm 10 chữ số).');
      }
    }

    if (taxCode !== undefined && taxCode !== null && String(taxCode).trim() !== '') {
      const cleanedTax = String(taxCode).trim().replace(/\s+/g, '');
      if (!/^\d+$/.test(cleanedTax)) {
        return badRequest(res, 'Mã số thuế không hợp lệ (chỉ gồm chữ số).');
      }
    }

    const updated = await service.updatePartnerProfile(userId, {
      businessName,
      serviceType,
      taxCode: taxCode !== undefined ? String(taxCode).trim() : undefined,
      address,
      contactPhone: phone !== undefined ? String(phone).trim() : undefined,
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

/**
 * GET /api/partner/stats
 * Lấy thống kê tổng quan cho đối tác đang đăng nhập
 */
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const userId = res.locals.authUserId as number;
    const stats = await service.getDashboardStats(userId);
    return ok(res, stats, 'Lấy thống kê tổng quan thành công');
  } catch (error) {
    return serverError(res, error);
  }
});

/**
 * GET /api/partner/stats/bookings-chart
 * Lấy biểu đồ lượt đơn đặt trong 7 ngày qua
 */
router.get('/stats/bookings-chart', async (_req: Request, res: Response) => {
  try {
    const userId = res.locals.authUserId as number;
    const chartData = await service.getDailyBookings(userId);
    return ok(res, chartData, 'Lấy dữ liệu biểu đồ đơn đặt thành công');
  } catch (error) {
    return serverError(res, error);
  }
});

/**
 * GET /api/partner/bookings
 * Lấy danh sách đơn đặt chỗ thuộc các cơ sở của đối tác đang đăng nhập
 */
router.get('/bookings', async (req: Request, res: Response) => {
  try {
    const userId = res.locals.authUserId as number;
    const status = typeof req.query.status === 'string' ? req.query.status : null;
    const search = typeof req.query.search === 'string' ? req.query.search : null;
    const bookings = await service.getBookings(userId, status, search);
    return ok(res, bookings, 'Lấy danh sách đơn đặt thành công');
  } catch (error) {
    return serverError(res, error);
  }
});

/**
 * PATCH /api/partner/bookings/:id/status
 * Cập nhật trạng thái đơn đặt chỗ thuộc cơ sở của đối tác
 */
router.patch('/bookings/:id/status', async (req: Request, res: Response) => {
  try {
    const userId = res.locals.authUserId as number;
    const bookingId = parseInt(String(req.params.id), 10);
    if (isNaN(bookingId) || bookingId <= 0) {
      return badRequest(res, 'ID đơn đặt không hợp lệ');
    }
    const status = String(req.body?.status || '').toUpperCase().trim();
    if (!['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].includes(status)) {
      return badRequest(res, 'Trạng thái đơn đặt không hợp lệ');
    }

    const updated = await service.updateBookingStatus(userId, bookingId, status);
    if (!updated) {
      return notFound(res, 'Không tìm thấy đơn đặt thuộc cơ sở của bạn');
    }

    return ok(res, { id: String(bookingId), status }, `Cập nhật đơn đặt DNG-${String(bookingId).padStart(6, '0')} thành công.`);
  } catch (error) {
    return serverError(res, error);
  }
});

export default router;
