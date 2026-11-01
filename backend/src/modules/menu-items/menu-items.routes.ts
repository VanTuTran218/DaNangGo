import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import * as controller from './menu-items.controller';

const router = Router();

/**
 * GET /api/menu-items/:id
 * Lấy chi tiết 1 món ăn
 */
router.get('/:id', controller.getOne);

/**
 * PUT /api/menu-items/:id
 * Cập nhật món ăn (Partner sở hữu hoặc Admin)
 */
router.put('/:id', requireAuth('USER'), requireRole('PARTNER', 'ADMIN'), controller.update);

/**
 * DELETE /api/menu-items/:id
 * Ẩn món ăn khỏi thực đơn (Partner sở hữu hoặc Admin)
 */
router.delete('/:id', requireAuth('USER'), requireRole('PARTNER', 'ADMIN'), controller.remove);

export default router;
