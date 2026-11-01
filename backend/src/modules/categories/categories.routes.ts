import { Router } from 'express';
import * as controller from './categories.controller';

const router = Router();

/**
 * Các API danh mục dùng chung (Master Data)
 * Hoàn toàn công khai, không cần đăng nhập.
 */
router.get('/districts', controller.getDistricts);
router.get('/cuisines', controller.getCuisines);
router.get('/tastes', controller.getTastes);
router.get('/attraction-categories', controller.getAttractionCategories);

export default router;
