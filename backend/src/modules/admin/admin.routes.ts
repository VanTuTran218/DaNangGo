import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { adminApprovePartner, adminListPartners, adminRejectPartner } from './admin.service';
import * as placesController from '../places/places.controller';

const adminPartnersRouter = Router();

// Tất cả routes đều yêu cầu đăng nhập admin
adminPartnersRouter.use(requireAuth('ADMIN'), requireRole('ADMIN'));

/** GET /api/admin/partners?status=PENDING_APPROVAL&limit=50&offset=0 */
adminPartnersRouter.get('/', async (req, res) => {
  const status = typeof req.query.status === 'string' ? req.query.status : null;
  const limit = Number(req.query.limit) || 50;
  const offset = Number(req.query.offset) || 0;
  const { records, total } = await adminListPartners(status, limit, offset);
  res.json({ success: true, data: { partners: records, total, limit, offset } });
});

/** POST /api/admin/partners/:id/approve */
adminPartnersRouter.post('/:id/approve', async (req, res) => {
  const partnerId = z.coerce.number().int().positive().parse(req.params.id);
  const adminUserId = res.locals.authUserId as number;
  const ok = await adminApprovePartner(partnerId, adminUserId);
  if (!ok) {
    res.status(404).json({ success: false, message: 'Không tìm thấy hoặc đối tác không ở trạng thái chờ duyệt.' });
    return;
  }
  res.json({ success: true, message: 'Đã phê duyệt tài khoản đối tác và gửi email thông báo.' });
});

/** POST /api/admin/partners/:id/reject */
adminPartnersRouter.post('/:id/reject', async (req, res) => {
  const partnerId = z.coerce.number().int().positive().parse(req.params.id);
  const adminUserId = res.locals.authUserId as number;
  const ok = await adminRejectPartner(partnerId, adminUserId);
  if (!ok) {
    res.status(404).json({ success: false, message: 'Không tìm thấy đối tác.' });
    return;
  }
  res.json({ success: true, message: 'Đã từ chối tài khoản đối tác và gửi email thông báo.' });
});

export const adminPlacesRouter = Router();
adminPlacesRouter.use(requireAuth('ADMIN'), requireRole('ADMIN'));
adminPlacesRouter.patch('/:id/status', placesController.updateStatus);
adminPlacesRouter.put('/:id/status', placesController.updateStatus);

export default adminPartnersRouter;
