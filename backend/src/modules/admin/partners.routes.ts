import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { listAdminPartners, reviewPartner, setPartnerLock } from '../partners/partners.service';

const router = Router();
const statusQuery = z.enum(['ALL', 'PENDING', 'APPROVED', 'REJECTED']).optional();
const partnerIdParam = z.string().regex(/^[1-9]\d*$/, 'ID hồ sơ đối tác không hợp lệ.').transform(Number);
const reviewBody = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  reason: z.string().optional(),
});
const lockBody = z.object({ locked: z.boolean() });

router.use(requireAuth('ADMIN'), requireRole('ADMIN'));

router.get('/', async (req, res) => {
  const status = statusQuery.parse(req.query.status);
  const data = await listAdminPartners(status);
  res.json({ success: true, data, message: 'Lấy danh sách đối tác thành công.' });
});

router.patch('/:id/approval', async (req, res) => {
  const partnerId = partnerIdParam.parse(req.params.id);
  const body = reviewBody.parse(req.body);
  const data = await reviewPartner({
    partnerId,
    adminUserId: res.locals.authUserId!,
    status: body.status,
    reason: body.reason,
  });
  res.json({
    success: true,
    data,
    message: data.status === 'APPROVED' ? 'Đã duyệt hồ sơ đối tác.' : 'Đã từ chối hồ sơ đối tác.',
  });
});

router.patch('/:id/lock', async (req, res) => {
  const partnerId = partnerIdParam.parse(req.params.id);
  const { locked } = lockBody.parse(req.body);
  const data = await setPartnerLock({ partnerId, locked });
  res.json({
    success: true,
    data,
    message: locked ? 'Đã khóa tài khoản đối tác.' : 'Đã mở khóa tài khoản đối tác.',
  });
});

export default router;
