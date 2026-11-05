import { Router, type RequestHandler } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import * as service from "./ai.service";
import * as repo from "./ai.repository";
import { feedbackReadiness } from "./ai.feedback-readiness";

export const aiRouter = Router();
const integer = z.coerce.number().int().positive().max(2147483647);
const messageSchema = z
  .object({ message: z.string().trim().min(3).max(500) })
  .strict();
const descriptionSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    type: z.enum(["food", "stay", "sight"]),
    notes: z.string().trim().min(10).max(800),
  })
  .strict();
const idsSchema = z
  .object({ ids: z.array(z.number().int().positive()).min(1).max(50) })
  .strict();
const wrap =
  (work: RequestHandler): RequestHandler =>
  async (req, res, next) => {
    try {
      await work(req, res, next);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: "Thông tin gửi lên không hợp lệ. Vui lòng kiểm tra lại.",
        });
        return;
      }
      if (error instanceof service.AiError) {
        res
          .status(error.status)
          .json({ success: false, message: error.message });
        return;
      }
      res.status(503).json({
        success: false,
        message: "Chưa thể xử lý dữ liệu AI lúc này. Vui lòng thử lại.",
      });
    }
  };
const ok = (res: Parameters<RequestHandler>[1], data: unknown) => {
  res.json({ success: true, data });
};
aiRouter.use(
  rateLimit({
    windowMs: 60000,
    limit: 30,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      success: false,
      message: "Bạn đang dùng AI quá nhanh. Vui lòng thử lại sau một phút.",
    },
  }),
);
aiRouter.post(
  "/itinerary",
  requireAuth("USER"),
  wrap(async (req, res) => {
    ok(res, await service.itinerary(messageSchema.parse(req.body).message));
  }),
);
aiRouter.post(
  "/rewrite",
  wrap(async (req, res) => {
    ok(res, await service.rewrite(messageSchema.parse(req.body).message));
  }),
);
aiRouter.get(
  "/places/:id/review-summary",
  wrap(async (req, res) => {
    ok(res, await service.reviewSummary(integer.parse(req.params.id)));
  }),
);
aiRouter.get(
  "/places/:id/similar",
  wrap(async (req, res) => {
    ok(res, await service.similar(integer.parse(req.params.id)));
  }),
);

aiRouter.use("/partner", requireAuth("USER"), requireRole("PARTNER"));
aiRouter.get(
  "/partner/reviews",
  wrap(async (req, res) => {
    const rating = req.query.rating
      ? z.coerce.number().int().min(1).max(5).parse(req.query.rating)
      : undefined;
    ok(res, await repo.partnerReviews(res.locals.authUserId!, rating));
  }),
);
aiRouter.post(
  "/partner/reviews/:id/draft",
  wrap(async (req, res) => {
    ok(
      res,
      await service.replyDraft(
        integer.parse(req.params.id),
        res.locals.authUserId!,
      ),
    );
  }),
);
aiRouter.post(
  "/partner/reviews/:id/reply",
  wrap(async (req, res) => {
    const id = integer.parse(req.params.id);
    const { content } = z
      .object({ content: z.string().trim().min(1).max(800) })
      .strict()
      .parse(req.body);
    const review = await repo.ownedReview(id, res.locals.authUserId!);
    if (!review)
      throw new service.AiError(
        404,
        "Không tìm thấy đánh giá thuộc cơ sở của bạn.",
      );
    if (review.approval_status !== "APPROVED")
      throw new service.AiError(
        403,
        "Hồ sơ đối tác cần được duyệt trước khi gửi phản hồi.",
      );
    if (!(await repo.saveReply(id, review.partner_id, content)))
      throw new service.AiError(
        404,
        "Đánh giá không còn thuộc cơ sở của bạn hoặc chưa được duyệt.",
      );
    ok(res, { message: "Đã lưu phản hồi đánh giá." });
  }),
);
aiRouter.post(
  "/partner/description",
  wrap(async (req, res) => {
    const body = descriptionSchema.parse(req.body);
    ok(res, await service.description(body.name, body.type, body.notes));
  }),
);

aiRouter.use("/admin", requireAuth("ADMIN"), requireRole("ADMIN"));
aiRouter.get(
  "/admin/feedback-readiness",
  wrap(async (_req, res) => {
    ok(res, await feedbackReadiness());
  }),
);
aiRouter.post(
  "/admin/moderation",
  wrap(async (req, res) => {
    ok(
      res,
      await service.moderation([...new Set(idsSchema.parse(req.body).ids)]),
    );
  }),
);
aiRouter.post(
  "/admin/description",
  wrap(async (req, res) => {
    const body = descriptionSchema.parse(req.body);
    ok(res, await service.description(body.name, body.type, body.notes));
  }),
);
aiRouter.get(
  "/admin/surveys",
  wrap(async (_req, res) => {
    ok(res, await repo.surveys());
  }),
);
aiRouter.get(
  "/admin/surveys/:id/report",
  wrap(async (req, res) => {
    ok(res, await service.surveyReport(integer.parse(req.params.id)));
  }),
);
aiRouter.get(
  "/admin/metrics",
  wrap(async (_req, res) => {
    ok(res, service.aiMetrics());
  }),
);
let syncing = false;
aiRouter.post(
  "/admin/embeddings/sync",
  wrap(async (req, res) => {
    const { afterId } = z
      .object({ afterId: z.number().int().min(0).default(0) })
      .strict()
      .parse(req.body);
    if (syncing)
      throw new service.AiError(
        409,
        "Đang cập nhật dữ liệu gợi ý. Vui lòng đợi lượt trước hoàn tất.",
      );
    syncing = true;
    try {
      ok(res, await service.syncEmbeddings(afterId));
    } finally {
      syncing = false;
    }
  }),
);
