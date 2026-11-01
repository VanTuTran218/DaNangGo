import { Router } from 'express';
import { requireAuth, requireRole, optionalAuth } from '../../middleware/auth.middleware';
import * as controller from './restaurants.controller';
import * as menuController from '../menu-items/menu-items.controller';

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
 * GET /api/restaurants/:id/menu-items
 * Lấy danh sách món ăn của nhà hàng (công khai, nếu là Partner sở hữu hoặc Admin thì thấy cả món đã ẩn)
 */
router.get('/:id/menu-items', optionalAuth(), menuController.getByRestaurant);

/**
 * POST /api/restaurants/:id/menu-items
 * Thêm món ăn mới vào thực đơn — chỉ Partner sở hữu hoặc Admin
 */
router.post('/:id/menu-items', requireAuth('USER'), requireRole('PARTNER', 'ADMIN'), menuController.create);

/**
 * POST /api/restaurants
 * Tạo nhà hàng mới — chỉ Partner hoặc Admin
 */
router.post('/', requireAuth('USER'), requireRole('PARTNER', 'ADMIN'), controller.create);

/**
 * PUT /api/restaurants/:id
 * Cập nhật nhà hàng — chỉ Partner sở hữu hoặc Admin
 */
router.put('/:id', requireAuth('USER'), requireRole('PARTNER', 'ADMIN'), controller.update);

/**
 * DELETE /api/restaurants/:id
 * Xóa mềm (status = HIDDEN) — chỉ Partner sở hữu hoặc Admin
 */
router.delete('/:id', requireAuth('USER'), requireRole('PARTNER', 'ADMIN'), controller.remove);

export default router;
