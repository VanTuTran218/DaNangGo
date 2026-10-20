import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import * as controller from "./reviews.controller";
import { parseReviewUpload } from "./reviews.upload";

const router = Router({ mergeParams: true });

router.get("/", controller.list);
router.get("/:reviewId/images/:imageId", controller.reviewImage);
router.post(
  "/",
  requireAuth("USER"),
  requireRole("USER"),
  parseReviewUpload,
  controller.create,
);

export const userReviewsRouter = Router();
userReviewsRouter.use(requireAuth("USER"), requireRole("USER"));
userReviewsRouter.get("/me", controller.myReviews);
userReviewsRouter.get("/:reviewId/images/:imageId", controller.ownReviewImage);
userReviewsRouter.put("/:reviewId", parseReviewUpload, controller.updateOwn);
userReviewsRouter.delete("/:reviewId", controller.deleteOwn);

export default router;

export const adminReviewsRouter = Router();
adminReviewsRouter.use(requireAuth("ADMIN"), requireRole("ADMIN"));
adminReviewsRouter.get("/", controller.adminList);
adminReviewsRouter.get(
  "/:reviewId/images/:imageId",
  controller.adminReviewImage,
);
adminReviewsRouter.patch("/:id/status", controller.adminModerate);
adminReviewsRouter.delete("/:id", controller.adminDelete);
