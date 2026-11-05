import { getPool, sql } from "../../config/db";
import {
  listConversations,
  conversationMessages,
  updateMessage,
  estimatePlan,
} from "./chat.history";
import { saveChatPlan } from "./chat.saved-plan";
import { Router } from "express";
import { processUserMessage } from "./chat.service";
import {
  chatIdentity,
  createChatRateLimit,
  acquireChatSlot,
} from "./chat.middleware";
import { ChatSessionError } from "./chat.sessions";
import { z } from "zod";

export const chatInputSchema = z
  .object({
    message: z.string().trim().min(1).max(500),
    location: z
      .object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        radiusKm: z.union([z.literal(2), z.literal(5), z.literal(10)]),
      })
      .strict()
      .optional(),
    sessionId: z
      .number()
      .int()
      .positive()
      .max(2147483647)
      .nullable()
      .optional(),
  })
  .strict();

const chatRouter = Router();
chatRouter.use((_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

// Gửi tin nhắn đến AI Assistant
chatRouter.post(
  "/message",
  createChatRateLimit(),
  chatIdentity,
  async (req, res, next) => {
    let release: (() => void) | undefined;
    try {
      const parsed = chatInputSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: "Tin nhắn tối đa 500 ký tự và mã hội thoại phải hợp lệ.",
        });
        return;
      }
      const { message, sessionId, location } = parsed.data;

      // Lấy userId từ auth nếu có
      const userId = req.user?.user_id ?? null;
      const guestId = res.locals.chatGuestId as string | undefined;
      const slot = acquireChatSlot(
        userId ? `user:${userId}` : `guest:${guestId}`,
      );
      if (!slot) {
        res.status(429).json({
          error: "Gô đang xử lý tin nhắn trước. Bạn đợi một chút nhé.",
          code: "CHAT_BUSY",
        });
        return;
      }
      release = slot;

      const streaming = req.query.stream === "1";
      const emit = (event: unknown) => {
        if (!res.destroyed && !res.writableEnded)
          res.write(`data: ${JSON.stringify(event)}\n\n`);
      };
      let heartbeat: ReturnType<typeof setInterval> | undefined;
      if (streaming) {
        res.set({
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          "X-Accel-Buffering": "no",
        });
        res.flushHeaders();
        heartbeat = setInterval(() => {
          if (!res.destroyed) res.write(": keep-alive\n\n");
        }, 10_000);
        res.on("close", () => clearInterval(heartbeat));
      }
      let result;
      try {
        result = await processUserMessage(
          {
            message: message.trim(),
            sessionId: sessionId ? Number(sessionId) : null,
            userId,
            guestId,
            location,
          },
          streaming ? emit : undefined,
        );
      } catch (error) {
        if (!streaming) throw error;
        emit({
          type: "error",
          text:
            error instanceof ChatSessionError
              ? error.message
              : "Không thể tra cứu dữ liệu lúc này. Bạn vui lòng thử lại.",
          code:
            error instanceof ChatSessionError ? error.code : "CHAT_UNAVAILABLE",
        });
        res.end();
        return;
      } finally {
        clearInterval(heartbeat);
      }

      // Chỉ gửi câu trả lời sau khi parse schema và lọc ID; không stream JSON thô của Gemini.
      if (streaming) {
        emit({ type: "result", result });
        res.end();
      } else res.json(result);
    } catch (error) {
      if (error instanceof ChatSessionError) {
        res.status(404).json({ error: error.message, code: error.code });
        return;
      }
      next(error);
    } finally {
      release?.();
    }
  },
);

const sessionIdSchema = z.coerce.number().int().positive().max(2147483647);
chatRouter.get(
  "/sessions",
  createChatRateLimit(120),
  chatIdentity,
  async (req, res, next) => {
    try {
      res.json(
        await listConversations({
          userId: req.user?.user_id,
          guestId: res.locals.chatGuestId,
        }),
      );
    } catch (e) {
      next(e);
    }
  },
);
chatRouter.get(
  "/sessions/:id",
  createChatRateLimit(120),
  chatIdentity,
  async (req, res, next) => {
    const id = sessionIdSchema.safeParse(req.params.id);
    if (!id.success) {
      res.status(400).json({ error: "Mã hội thoại không hợp lệ." });
      return;
    }
    try {
      res.json(
        await conversationMessages(id.data, {
          userId: req.user?.user_id,
          guestId: res.locals.chatGuestId,
        }),
      );
    } catch (e) {
      if (e instanceof ChatSessionError) {
        res.status(404).json({ error: e.message });
        return;
      }
      next(e);
    }
  },
);
const mutationSchema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("feedback"),
      vote: z.enum(["helpful", "unhelpful"]).nullable(),
    })
    .strict(),
  z
    .object({
      action: z.literal("costs"),
      food: z.number().finite().min(0).max(1e9),
      transport: z.number().finite().min(0).max(1e9),
      contingencyPercent: z.number().finite().min(0).max(50),
    })
    .strict(),
  z.object({ action: z.literal("save") }).strict(),
]);
chatRouter.patch(
  "/sessions/:id/messages/:messageId",
  createChatRateLimit(60),
  chatIdentity,
  async (req, res, next) => {
    const id = sessionIdSchema.safeParse(req.params.id),
      body = mutationSchema.safeParse(req.body);
    if (
      !id.success ||
      !body.success ||
      String(req.params.messageId).length > 100
    ) {
      res.status(400).json({ error: "Dữ liệu không hợp lệ." });
      return;
    }
    const owner = {
      userId: req.user?.user_id,
      guestId: res.locals.chatGuestId,
    };
    const release = acquireChatSlot(
      owner.userId ? `user:${owner.userId}` : `guest:${owner.guestId}`,
    );
    if (!release) {
      res.status(409).json({ error: "Bạn đợi thao tác trước hoàn tất nhé." });
      return;
    }
    try {
      const messages = await conversationMessages(id.data, owner),
        message = messages.find(
          (m) => m.id === req.params.messageId && m.sender === "AI",
        );
      if (!message) throw new ChatSessionError();
      if (body.data.action === "feedback") message.feedback = body.data.vote;
      else {
        if (!message.travelPlan) {
          res.status(400).json({ error: "Tin nhắn này không có lịch trình." });
          return;
        }
        if (body.data.action === "costs") {
          if (message.savedItineraryId) {
            res.status(409).json({
              error:
                "Bản này đã lưu. Bạn mở trang Lịch trình để chỉnh sửa nhé.",
            });
            return;
          }
          message.travelPlan = estimatePlan(message.travelPlan, body.data);
        } else {
          if (!owner.userId) {
            res.status(401).json({
              error: "Bạn đăng nhập để lưu lịch trình vào tài khoản nhé.",
            });
            return;
          }
          if (!message.savedItineraryId) {
            if (
              !message.travelPlan.startDate ||
              !message.travelPlan.guestCount ||
              !message.travelPlan.budget
            ) {
              res.status(400).json({
                error:
                  "Cần đủ ngày khởi hành, số khách và ngân sách trước khi lưu.",
              });
              return;
            }
            const transaction = new sql.Transaction(getPool());
            await transaction.begin();
            try {
              message.savedItineraryId = (
                await saveChatPlan(
                  message.travelPlan,
                  owner.userId,
                  transaction,
                )
              ).itineraryId;
              await updateMessage(id.data, owner, message, transaction);
              await transaction.commit();
              res.json(message);
              return;
            } catch (e) {
              await transaction.rollback();
              throw e;
            }
          }
        }
      }
      await updateMessage(id.data, owner, message);
      res.json(message);
    } catch (e) {
      if (e instanceof ChatSessionError) {
        res.status(404).json({ error: e.message });
        return;
      }
      next(e);
    } finally {
      release();
    }
  },
);

// Lấy danh sách câu hỏi gợi ý nhanh ban đầu
chatRouter.get("/suggestions", (_req, res) => {
  res.json({
    suggestions: [
      { id: "1", text: "🍜 Quán Mì Quảng ngon nhất Đà Nẵng" },
      { id: "2", text: "🏖️ Khách sạn gần biển Mỹ Khê giá tốt" },
      { id: "3", text: "🌉 Cầu Rồng phun lửa lúc mấy giờ?" },
      { id: "4", text: "✨ Gợi ý lịch trình 3N2Đ tiết kiệm" },
      { id: "5", text: "🦞 Quán hải sản tươi ngon, giá bình dân" },
      { id: "6", text: "🏔️ Kinh nghiệm đi Bà Nà Hills trong ngày" },
    ],
  });
});

export default chatRouter;
