import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import {
  adminConfirmPaymentService,
  adminExportCsvService,
  adminGetRevenueStatsService,
  adminGetSubscriptionDetailService,
  adminListSubscriptionsService,
  adminRejectPaymentService,
  getAllPackagesAdminService,
  updatePackageAdminService,
} from '../subscriptions/subscriptions.service';

const router = Router();

// Yêu cầu xác thực Admin cho toàn bộ route
router.use(requireAuth('ADMIN'), requireRole('ADMIN'));

const subscriptionIdParam = z.string().regex(/^[1-9]\d*$/, 'ID đăng ký không hợp lệ.').transform(Number);
const packageIdParam = z.string().regex(/^[1-9]\d*$/, 'ID gói không hợp lệ.').transform(Number);

const filterQuerySchema = z.object({
  status: z.string().optional(),
  packageId: z.string().regex(/^\d+$/).transform(Number).optional(),
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const rejectBodySchema = z.object({
  reason: z.string().trim().min(3, 'Vui lòng nhập lý do từ chối giao dịch.').max(500, 'Lý do tối đa 500 ký tự.'),
});

const updatePackageBodySchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/admin/subscriptions/packages
 * Xem toàn bộ danh sách gói dịch vụ
 */
router.get('/packages', async (_req, res, next) => {
  try {
    const packages = await getAllPackagesAdminService();
    res.json({ success: true, data: packages });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/admin/subscriptions/packages/:id
 * Cập nhật trạng thái bật/tắt hoặc thông tin gói
 */
router.patch('/packages/:id', async (req, res, next) => {
  try {
    const packageId = packageIdParam.parse(req.params.id);
    const body = updatePackageBodySchema.parse(req.body);
    const updated = await updatePackageAdminService(packageId, body);
    res.json({ success: true, data: updated, message: 'Cập nhật gói dịch vụ thành công.' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/subscriptions/revenue-stats
 * Thống kê doanh thu CHỈ từ phí gói đối tác DaNangGo
 */
router.get('/revenue-stats', async (req, res, next) => {
  try {
    const filters = filterQuerySchema.parse(req.query);
    const stats = await adminGetRevenueStatsService(filters);
    res.json({ success: true, data: stats, message: 'Lấy thống kê doanh thu thành công.' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/subscriptions/export-csv
 * Xuất dữ liệu giao dịch phí gói ra file CSV
 */
router.get('/export-csv', async (req, res, next) => {
  try {
    const filters = filterQuerySchema.parse(req.query);
    const csvData = await adminExportCsvService(filters);
    const filename = `dananggo-subscription-revenue-${Date.now()}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvData);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/subscriptions
 * Danh sách đăng ký gói của đối tác kèm bộ lọc
 */
router.get('/', async (req, res, next) => {
  try {
    const filters = filterQuerySchema.parse(req.query);
    const data = await adminListSubscriptionsService(filters);
    res.json({ success: true, data, message: 'Lấy danh sách đăng ký gói thành công.' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/subscriptions/:id
 * Chi tiết 1 giao dịch đăng ký gói
 */
router.get('/:id', async (req, res, next) => {
  try {
    const subscriptionId = subscriptionIdParam.parse(req.params.id);
    const data = await adminGetSubscriptionDetailService(subscriptionId);
    res.json({ success: true, data, message: 'Lấy chi tiết đăng ký thành công.' });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/admin/subscriptions/:id/confirm
 * Xác nhận thanh toán hợp lệ và kích hoạt thời hạn gói
 */
router.patch('/:id/confirm', async (req, res, next) => {
  try {
    const subscriptionId = subscriptionIdParam.parse(req.params.id);
    const adminUserId = res.locals.authUserId!;
    const confirmed = await adminConfirmPaymentService(subscriptionId, adminUserId);
    res.json({
      success: true,
      data: confirmed,
      message: 'Xác nhận thanh toán thành công. Gói dịch vụ đã được kích hoạt cho đối tác.',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/admin/subscriptions/:id/reject
 * Từ chối giao dịch thanh toán kèm lý do
 */
router.patch('/:id/reject', async (req, res, next) => {
  try {
    const subscriptionId = subscriptionIdParam.parse(req.params.id);
    const adminUserId = res.locals.authUserId!;
    const body = rejectBodySchema.parse(req.body);
    const rejected = await adminRejectPaymentService(subscriptionId, adminUserId, body.reason);
    res.json({
      success: true,
      data: rejected,
      message: 'Đã từ chối giao dịch đăng ký gói.',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
