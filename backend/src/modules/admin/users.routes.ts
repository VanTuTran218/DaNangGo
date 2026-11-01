import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { AuthError } from '../auth/auth.errors';
import { adminChangeUserStatus, adminListUsers } from './users.service';

const router = Router();
router.use(requireAuth('ADMIN'), requireRole('ADMIN'));

router.get('/', async (req, res) => {
  const query = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    role: z.string().trim().optional(), status: z.string().trim().optional(),
    search: z.string().trim().optional(),
  }).safeParse(req.query);
  if (!query.success) throw new AuthError(400, 'Tham số phân trang không hợp lệ.');
  const result = await adminListUsers(query.data);
  res.json({ data: result.data, pagination: { page: query.data.page, limit: query.data.limit, total: result.total, totalPages: result.totalPages } });
});

router.patch('/:id/status', async (req, res) => {
  const id = z.coerce.number().int().positive().safeParse(req.params.id);
  const body = z.object({ status: z.enum(['ACTIVE', 'LOCKED']) }).safeParse(req.body);
  if (!id.success || !body.success) throw new AuthError(400, 'ID hoặc trạng thái không hợp lệ.');
  const user = await adminChangeUserStatus(id.data, res.locals.authUserId as number, body.data.status);
  res.json({ data: user });
});

export default router;
