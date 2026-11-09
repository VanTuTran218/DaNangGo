import { Router, type RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import * as repo from "./surveys.repository";
import {
  submissionSchema,
  adminSurveySchema,
  SurveyError,
} from "./surveys.validation";
const idSchema = z.coerce.number().int().positive().max(2147483647);
const wrap =
  (work: RequestHandler): RequestHandler =>
  async (req, res, next) => {
    try {
      await work(req, res, next);
    } catch (e) {
      if (e instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message:
            "Thông tin khảo sát không hợp lệ. Vui lòng kiểm tra các câu trả lời.",
        });
        return;
      }
      if (e instanceof SurveyError) {
        res.status(e.status).json({ success: false, message: e.message });
        return;
      }
      console.warn("[Surveys] Không xử lý được yêu cầu.");
      res.status(503).json({
        success: false,
        message:
          "Chưa lưu được khảo sát. Bạn vui lòng thử lại; phản hồi chưa được ghi nhận.",
      });
    }
  };
export const surveysRouter = Router();
surveysRouter.use((_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
for (const [route, type] of [
  ["/submit", "FULL"],
  ["/quick", "QUICK"],
  ["/respond", "CUSTOM"],
])
  surveysRouter.post(
    route,
    rateLimit({
      windowMs: 15 * 60_000,
      limit: 15,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: {
        success: false,
        message: "Bạn gửi khảo sát quá nhanh. Vui lòng thử lại sau.",
      },
    }),
    wrap(async (req, res) => {
      const input = submissionSchema.parse(req.body);
      if (input.survey_type !== type)
        throw new SurveyError(400, "Sai loại khảo sát.");
      const data = await repo.submitSurvey(input);
      res.json({
        success: true,
        message: "Đã lưu khảo sát. Cảm ơn bạn đã chia sẻ!",
        data,
      });
    }),
  );
surveysRouter.get(
  "/",
  wrap(async (_req, res) => {
    res.json({ success: true, data: await repo.publicList() });
  }),
);
surveysRouter.get(
  "/:id",
  wrap(async (req, res) => {
    res.json({
      success: true,
      data: await repo.publicSurvey(idSchema.parse(req.params.id)),
    });
  }),
);
export const adminSurveysRouter = Router();
adminSurveysRouter.use(requireAuth("ADMIN"), requireRole("ADMIN"));
adminSurveysRouter.use((_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
adminSurveysRouter.get(
  "/",
  wrap(async (_req, res) => {
    res.json({ success: true, data: await repo.adminList() });
  }),
);
adminSurveysRouter.post(
  "/",
  wrap(async (req, res) => {
    const id = await repo.saveAdminSurvey(
      adminSurveySchema.parse(req.body),
      res.locals.authUserId!,
    );
    res.status(201).json({ success: true, data: { id } });
  }),
);
adminSurveysRouter.put(
  "/:id",
  wrap(async (req, res) => {
    const id = await repo.saveAdminSurvey(
      adminSurveySchema.parse(req.body),
      res.locals.authUserId!,
      idSchema.parse(req.params.id),
    );
    res.json({ success: true, data: { id } });
  }),
);
adminSurveysRouter.delete(
  "/:id",
  wrap(async (req, res) => {
    await repo.archiveSurvey(idSchema.parse(req.params.id));
    res.json({
      success: true,
      message: "Đã lưu trữ khảo sát, giữ nguyên các phản hồi.",
    });
  }),
);
