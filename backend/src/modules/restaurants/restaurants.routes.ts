import { Router } from 'express';
import { verifyToken, requireRole } from '../../middleware/auth';
import * as controller from './restaurants.controller';

const router = Router();

/**
 * GET /api/restaurants
 * Lấy danh sách nhà hàng (công khai, không cần đăng nhập)
 * Query: ?page=1&limit=10&district_id=1&cuisine_id=2&keyword=bún
 */
router.get('/', controller.getAll);

/**
 * GET /api/restaurants/:id
 * Lấy chi tiết 1 nhà hàng (công khai)
 */
router.get('/:id', controller.getOne);

/**
 * POST /api/restaurants
 * Tạo nhà hàng mới — chỉ Partner hoặc Admin
 */
router.post('/', verifyToken, requireRole('PARTNER', 'ADMIN'), controller.create);

/**
 * PUT /api/restaurants/:id
 * Cập nhật nhà hàng — chỉ Partner sở hữu hoặc Admin
 */
router.put('/:id', verifyToken, requireRole('PARTNER', 'ADMIN'), controller.update);

/**
 * DELETE /api/restaurants/:id
 * Xóa mềm (status = HIDDEN) — chỉ Partner sở hữu hoặc Admin
 */
router.delete('/:id', verifyToken, requireRole('PARTNER', 'ADMIN'), controller.remove);

export default router;
