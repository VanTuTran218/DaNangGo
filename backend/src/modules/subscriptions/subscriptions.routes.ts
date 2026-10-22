import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { requireApprovedPartner } from '../../middleware/partner-approval.middleware';
import {
  createSubscriptionService,
  getActivePackagesService,
  getPartnerCurrentSubscriptionService,
  getPartnerSubscriptionsHistoryService,
  submitPaymentProofService,
} from './subscriptions.service';

const router = Router();

const registerBodySchema = z.object({
  packageId: z.number().int().positive('ID gói không hợp lệ.'),
  isRenewal: z.boolean().optional().default(false),
});

const paymentProofBodySchema = z.object({
  paymentReference: z.string().trim().max(100, 'Mã tham chiếu tối đa 100 ký tự.').optional(),
  paymentProofNote: z.string().trim().max(500, 'Ghi chú tối đa 500 ký tự.').optional(),
});

const subscriptionIdParam = z.string().regex(/^[1-9]\d*$/, 'ID đăng ký không hợp lệ.').transform(Number);

/**
 * GET /api/subscriptions/packages
 * Xem danh sách các gói đăng ký đang mở (1 tháng, 6 tháng, 1 năm...) từ SQL Server
 */
router.get('/packages', async (_req, res, next) => {
  try {
    const packages = await getActivePackagesService();
    res.json({
      success: true,
      data: packages,
      message: 'Lấy danh sách gói thành công.',
    });
  } catch (error) {
    next(error);
  }
});

// Các API bên dưới yêu cầu đăng nhập với role PARTNER và hồ sơ đã được Admin APPROVED
router.use(requireAuth('USER'), requireRole('PARTNER'), requireApprovedPartner);

/**
 * GET /api/subscriptions/current
 * Xem gói đang hoạt động của đối tác hiện tại, thời hạn còn lại và cảnh báo sắp hết hạn
 */
router.get('/current', async (_req, res, next) => {
  try {
    const partnerProfileId = res.locals.partnerProfileId!;
    const data = await getPartnerCurrentSubscriptionService(partnerProfileId);
    res.json({
      success: true,
      data,
      message: 'Lấy thông tin gói hiện tại thành công.',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/subscriptions/my-subscriptions
 * Xem toàn bộ lịch sử đăng ký, giá tiền snapshot, ngày bắt đầu/kết thúc của chính đối tác
 */
router.get('/my-subscriptions', async (_req, res, next) => {
  try {
    const partnerProfileId = res.locals.partnerProfileId!;
    const history = await getPartnerSubscriptionsHistoryService(partnerProfileId);
    res.json({
      success: true,
      data: history,
      message: 'Lấy lịch sử đăng ký gói thành công.',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/subscriptions/register
 * Tạo yêu cầu đăng ký gói mới hoặc gia hạn gói với mã giao dịch duy nhất
 */
router.post('/register', async (req, res, next) => {
  try {
    const partnerProfileId = res.locals.partnerProfileId!;
    const body = registerBodySchema.parse(req.body);

    const result = await createSubscriptionService(
      partnerProfileId,
      body.packageId,
      body.isRenewal
    );

    res.status(201).json({
      success: true,
      data: result,
      message: result.subscription.automaticConfirmationEnabled
        ? 'Đã tạo yêu cầu đăng ký gói. Vui lòng chuyển đúng số tiền và nội dung; hệ thống sẽ tự xác nhận khi SePay báo nhận tiền.'
        : 'Đã tạo yêu cầu đăng ký gói. Vui lòng chuyển đúng số tiền và nội dung; giao dịch sẽ chờ Admin đối soát và xác nhận.',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/subscriptions/:id/payment-proof
 * Gửi thông tin chuyển khoản / mã tham chiếu ngân hàng sau khi đã chuyển khoản
 */
router.post('/:id/payment-proof', async (req, res, next) => {
  try {
    const partnerProfileId = res.locals.partnerProfileId!;
    const subscriptionId = subscriptionIdParam.parse(req.params.id);
    const body = paymentProofBodySchema.parse(req.body);

    const updated = await submitPaymentProofService(subscriptionId, partnerProfileId, {
      paymentReference: body.paymentReference,
      paymentProofNote: body.paymentProofNote ?? null,
    });

    res.json({
      success: true,
      data: updated,
      message: 'Đã gửi thông tin chuyển khoản. Ban quản trị DaNangGo sẽ đối soát và kích hoạt gói sớm nhất.',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
