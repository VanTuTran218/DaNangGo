import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import * as controller from "./reviews.controller";
import { parseReviewUpload } from "./reviews.upload";

const router = Router({ mergeParams: true });

router.get("/", controller.list);
router.get("/eligibility", requireAuth("USER"), requireRole("USER"), controller.eligibility);
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

export default router;

export const adminReviewsRouter = Router();
adminReviewsRouter.use(requireAuth("ADMIN"), requireRole("ADMIN"));
adminReviewsRouter.get("/", controller.adminList);
adminReviewsRouter.get(
  "/:reviewId/images/:imageId",
  controller.adminReviewImage,
);
adminReviewsRouter.patch("/:id/status", controller.adminModerate);
adminReviewsRouter.patch("/:id/content", controller.adminEdit);
adminReviewsRouter.delete("/:id", controller.adminDelete);
