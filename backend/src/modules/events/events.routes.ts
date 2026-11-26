import { Router, type RequestHandler } from "express";
import { z } from "zod";
import {
  optionalAuth,
  requireAuth,
  requireRole,
} from "../../middleware/auth.middleware";
import * as repo from "./events.repository";
import {
  EventError,
  eventInputSchema,
  eventReminderSchema,
  statusPatchSchema,
  submissionReviewSchema,
} from "./events.validation";

const idParamSchema = z.coerce.number().int().positive().max(2147483647);

const wrap =
  (work: RequestHandler): RequestHandler =>
  async (req, res, next) => {
    try {
      await work(req, res, next);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors = err.issues.map((issue) => ({
          path: issue.path.map(String),
          message: issue.message,
        }));
        res.status(400).json({
          success: false,
          message: errors[0]?.message ?? "Dữ liệu sự kiện không hợp lệ.",
          errors,
        });
        return;
      }
      if (err instanceof EventError) {
        res.status(err.status).json({
          success: false,
          message: err.message,
          ...(err.errors ? { errors: err.errors } : {}),
        });
        return;
      }
      console.error("[Events] Lỗi xử lý yêu cầu:", err);
      res.status(500).json({
        success: false,
        message: "Không thể xử lý dữ liệu sự kiện lúc này. Vui lòng thử lại.",
      });
    }
  };

// ============================================================================
// 1. PUBLIC EVENTS ROUTER (/api/events)
// ============================================================================
export const publicEventsRouter = Router();

publicEventsRouter.use((_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

publicEventsRouter.get(
  "/",
  wrap(async (_req, res) => {
    const items = await repo.listPublicEvents();
    res.json({
      success: true,
      data: { items, total: items.length },
    });
  }),
);

publicEventsRouter.get(
  "/home",
  wrap(async (req, res) => {
    const limit = Math.max(1, Math.min(12, Number(req.query.limit) || 4));
    const data = await repo.getHomeEventsSummary(limit);
    res.json({
      success: true,
      data,
    });
  }),
);

publicEventsRouter.get(
  "/map",
  wrap(async (_req, res) => {
    const items = await repo.listEventsForMap();
    res.json({
      success: true,
      data: { items, total: items.length },
    });
  }),
);

publicEventsRouter.get(
  "/upcoming-alerts",
  wrap(async (req, res) => {
    const hours = Math.max(1, Math.min(336, Number(req.query.hours) || 72));
    const items = await repo.listUpcomingEventAlerts(hours);
    res.json({
      success: true,
      data: { items, total: items.length },
    });
  }),
);

publicEventsRouter.get(
  "/:idOrSlug/nearby-places",
  wrap(async (req, res) => {
    const rawKey = String(req.params.idOrSlug ?? "").trim();
    if (!rawKey) throw new EventError(400, "Thiếu mã sự kiện.");
    const radiusKm = Number(req.query.radius_km || req.query.radius) || 3;
    const placeType = typeof req.query.place_type === "string" ? req.query.place_type : undefined;
    const limit = Number(req.query.limit) || 6;
    const items = await repo.getNearbyPlacesForEvent(rawKey, radiusKm, placeType, limit);
    res.json({
      success: true,
      data: { items, total: items.length },
    });
  }),
);

publicEventsRouter.get(
  "/:idOrSlug/calendar/ics",
  wrap(async (req, res) => {
    const rawKey = String(req.params.idOrSlug ?? "").trim();
    if (!rawKey) throw new EventError(400, "Thiếu mã sự kiện.");
    const { filename, content } = await repo.generateEventIcs(rawKey);
    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(content);
  }),
);

publicEventsRouter.get(
  "/:idOrSlug/calendar/links",
  wrap(async (req, res) => {
    const rawKey = String(req.params.idOrSlug ?? "").trim();
    if (!rawKey) throw new EventError(400, "Thiếu mã sự kiện.");
    const data = await repo.getEventCalendarLinks(rawKey);
    res.json({
      success: true,
      data,
    });
  }),
);

publicEventsRouter.post(
  "/:idOrSlug/remind",
  optionalAuth("USER"),
  wrap(async (req, res) => {
    const rawKey = String(req.params.idOrSlug ?? "").trim();
    if (!rawKey) throw new EventError(400, "Thiếu mã sự kiện.");
    const input = eventReminderSchema.parse(req.body ?? {});
    const result = await repo.subscribeEventReminder(
      rawKey,
      input,
      res.locals.authUserId,
    );
    res.json({
      success: true,
      message: result.alreadySubscribed
        ? `Bạn đã bật thông báo nhắc lịch cho sự kiện "${result.eventTitle}" rồi.`
        : `Đã bật thông báo nhắc lịch cho "${result.eventTitle}" (${result.maskedEmail})!`,
      data: result,
    });
  }),
);

publicEventsRouter.get(
  "/:idOrSlug",
  wrap(async (req, res) => {
    const rawKey = String(req.params.idOrSlug ?? "").trim();
    if (!rawKey) throw new EventError(400, "Thiếu mã sự kiện.");
    const event = await repo.getPublicEventByIdOrSlug(rawKey);
    if (!event) throw new EventError(404, "Không tìm thấy sự kiện.");
    res.json({
      success: true,
      data: event,
    });
  }),
);

// ============================================================================
// 2. ADMIN EVENTS ROUTER (/api/admin/events)
// ============================================================================
export const adminEventsRouter = Router();

adminEventsRouter.use(requireAuth("ADMIN"), requireRole("ADMIN"));
adminEventsRouter.use((_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

adminEventsRouter.get(
  "/",
  wrap(async (req, res) => {
    const status = typeof req.query.status === "string" ? req.query.status : "ALL";
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const result = await repo.listAdminEvents({ status, page, limit });
    res.json({
      success: true,
      data: result,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  }),
);

adminEventsRouter.get(
  "/:id",
  wrap(async (req, res) => {
    const id = idParamSchema.parse(req.params.id);
    const event = await repo.getAdminEventById(id);
    res.json({ success: true, data: event });
  }),
);

adminEventsRouter.post(
  "/",
  wrap(async (req, res) => {
    const input = eventInputSchema.parse(req.body);
    const created = await repo.createAdminEvent(input, res.locals.authUserId);
    res.status(201).json({
      success: true,
      message:
        created.status === "PUBLISHED"
          ? "Đã tạo và đăng sự kiện thành công."
          : "Đã lưu bản nháp sự kiện.",
      data: created,
    });
  }),
);

adminEventsRouter.put(
  "/:id",
  wrap(async (req, res) => {
    const id = idParamSchema.parse(req.params.id);
    const input = eventInputSchema.parse(req.body);
    const updated = await repo.updateAdminEvent(id, input);
    res.json({
      success: true,
      message: "Đã cập nhật sự kiện thành công.",
      data: updated,
    });
  }),
);

adminEventsRouter.patch(
  "/:id/status",
  wrap(async (req, res) => {
    const id = idParamSchema.parse(req.params.id);
    const patch = statusPatchSchema.parse(req.body);
    const updated = await repo.changeAdminEventStatus(id, patch);
    res.json({
      success: true,
      message: "Đã cập nhật trạng thái sự kiện.",
      data: updated,
    });
  }),
);

adminEventsRouter.delete(
  "/:id",
  wrap(async (req, res) => {
    const id = idParamSchema.parse(req.params.id);
    await repo.deleteAdminEvent(id);
    res.json({
      success: true,
      message: "Đã xóa sự kiện thành công.",
    });
  }),
);

// ============================================================================
// 3. ADMIN EVENT SUBMISSIONS ROUTER (/api/admin/event-submissions)
// ============================================================================
export const adminEventSubmissionsRouter = Router();

adminEventSubmissionsRouter.use(requireAuth("ADMIN"), requireRole("ADMIN"));
adminEventSubmissionsRouter.use((_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

adminEventSubmissionsRouter.get(
  "/",
  wrap(async (req, res) => {
    const status =
      typeof req.query.status === "string" ? req.query.status : "PENDING";
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await repo.listEventSubmissions({ status, page, limit });
    res.json({
      success: true,
      data: result,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  }),
);

adminEventSubmissionsRouter.get(
  "/:id",
  wrap(async (req, res) => {
    const id = idParamSchema.parse(req.params.id);
    const submission = await repo.getEventSubmissionById(id);
    res.json({ success: true, data: submission });
  }),
);

adminEventSubmissionsRouter.patch(
  "/:id/status",
  wrap(async (req, res) => {
    const id = idParamSchema.parse(req.params.id);
    const parsed = submissionReviewSchema.parse(req.body);
    const result = await repo.reviewEventSubmission(
      id,
      parsed.status,
      parsed.rejection_reason,
      res.locals.authUserId,
    );
    res.json({
      success: true,
      message:
        parsed.status === "APPROVED"
          ? "Đã duyệt đề xuất và tạo bản nháp sự kiện."
          : "Đã từ chối đề xuất sự kiện.",
      data: result.submission,
    });
  }),
);
