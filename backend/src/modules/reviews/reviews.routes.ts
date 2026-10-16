import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import * as controller from './reviews.controller';

const router = Router({ mergeParams: true });

router.get('/', controller.list);
router.post('/', requireAuth('USER'), requireRole('USER'), controller.create);

export default router;

export const adminReviewsRouter = Router();
adminReviewsRouter.use(requireAuth('ADMIN'), requireRole('ADMIN'));
adminReviewsRouter.get('/', controller.adminList);
adminReviewsRouter.patch('/:id/status', controller.adminModerate);
adminReviewsRouter.delete('/:id', controller.adminDelete);
