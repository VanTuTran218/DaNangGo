import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import * as controller from './reviews.controller';

const router = Router({ mergeParams: true });

router.get('/', controller.list);
router.post('/', requireAuth('USER'), requireRole('USER'), controller.create);

export const userReviewsRouter = Router();
userReviewsRouter.use(requireAuth('USER'), requireRole('USER'));
userReviewsRouter.get('/me', controller.myReviews);
userReviewsRouter.put('/:reviewId', controller.updateOwn);
userReviewsRouter.delete('/:reviewId', controller.deleteOwn);

export default router;

export const adminReviewsRouter = Router();
adminReviewsRouter.use(requireAuth('ADMIN'), requireRole('ADMIN'));
adminReviewsRouter.get('/', controller.adminList);
adminReviewsRouter.patch('/:id/status', controller.adminModerate);
adminReviewsRouter.delete('/:id', controller.adminDelete);
