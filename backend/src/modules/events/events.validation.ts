import { z } from "zod";

export const EVENT_STATUSES = [
  "DRAFT",
  "PUBLISHED",
  "RESCHEDULED",
  "POSTPONED",
  "CANCELLED",
] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const EVENT_CATEGORIES = [
  "FESTIVAL",
  "MUSIC",
  "FOOD",
  "SPORTS",
  "EXHIBITION",
  "WORKSHOP",
  "FAMILY",
] as const;
export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export const TICKET_TYPES = [
  "FREE_OPEN",
  "FREE_REGISTRATION",
  "PAID",
  "UNANNOUNCED",
] as const;
export type TicketType = (typeof TICKET_TYPES)[number];

export const SUBMISSION_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export class EventError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors?: Array<{ path: string[]; message: string }>,
  ) {
    super(message);
    this.name = "EventError";
  }
}

export function isHttpUrl(value: string): boolean {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

/**
 * Chuẩn hóa chuỗi ngày giờ từ Client (DATETIME2 local Đà Nẵng hoặc ISO) sang chuỗi DATETIME2 lưu SQL
 * hoặc trả về timestamp (ms UTC) để so sánh khoảng thời gian.
 */
export function parseDanangDateTimeToMs(value?: string | null): number | null {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim().replace(" ", "T");
  if (!trimmed) return null;
  const hasZone = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(trimmed);
  const date = new Date(hasZone ? trimmed : `${trimmed}+07:00`);
  const ms = date.getTime();
  return Number.isFinite(ms) ? ms : null;
}

/**
 * Chuyển đổi chuỗi ngày giờ hợp lệ sang chuỗi DATETIME2 theo giờ Đà Nẵng (UTC+7): YYYY-MM-DDTHH:mm:ss
 */
export function toDanangSqlDateTimeString(value?: string | null): string | null {
  const ms = parseDanangDateTimeToMs(value);
  if (ms === null) return null;
  return new Date(ms + 7 * 3600 * 1000)
    .toISOString()
    .slice(0, 19);
}

const nullableUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => !v || isHttpUrl(v), "URL không hợp lệ (cần bắt đầu bằng http:// hoặc https://).")
  .nullable()
  .optional();

const nullableDateTime = z
  .string()
  .trim()
  .refine(
    (v) => !v || parseDanangDateTimeToMs(v) !== null,
    "Thời gian không hợp lệ.",
  )
  .nullable()
  .optional();

export const eventInputSchema = z.object({
  title: z
    .string({ error: "Vui lòng nhập tên sự kiện." })
    .trim()
    .min(1, "Vui lòng nhập tên sự kiện.")
    .max(200, "Tên sự kiện tối đa 200 ký tự."),
  cover_image: nullableUrl,
  short_description: z.string().trim().max(500).nullable().optional(),
  description: z.string().trim().max(20000).nullable().optional(),
  category: z
    .string()
    .trim()
    .refine(
      (v) => !v || (EVENT_CATEGORIES as readonly string[]).includes(v),
      "Loại sự kiện không hợp lệ.",
    )
    .nullable()
    .optional(),
  start_time: nullableDateTime,
  end_time: nullableDateTime,
  is_all_day: z.boolean().optional().default(false),
  place_id: z.number().int().positive().nullable().optional(),
  location_name: z.string().trim().max(200).nullable().optional(),
  address: z.string().trim().max(300).nullable().optional(),
  district: z.string().trim().max(100).nullable().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  ticket_type: z.enum(TICKET_TYPES).optional().default("FREE_OPEN"),
  ticket_price_display: z.string().trim().max(100).nullable().optional(),
  ticket_url: nullableUrl,
  registration_deadline: nullableDateTime,
  organizer_name: z.string().trim().max(200).nullable().optional(),
  organizer_contact: z.string().trim().max(255).nullable().optional(),
  source_url: nullableUrl,
  is_featured: z.boolean().optional().default(false),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional().default("DRAFT"),
});

export type EventInputPayload = z.infer<typeof eventInputSchema>;

/**
 * Kiểm tra các trường bắt buộc khi sự kiện ở trạng thái công bố (khác DRAFT)
 */
export function validateEventPublishRequirements(
  data: EventInputPayload,
  targetStatus: EventStatus,
): Array<{ path: string[]; message: string }> {
  const issues: Array<{ path: string[]; message: string }> = [];

  const startMs = parseDanangDateTimeToMs(data.start_time ?? null);
  const endMs = parseDanangDateTimeToMs(data.end_time ?? null);
  if (startMs !== null && endMs !== null && endMs <= startMs) {
    issues.push({
      path: ["end_time"],
      message: "Giờ kết thúc phải sau giờ bắt đầu.",
    });
  }

  if (targetStatus === "DRAFT") {
    return issues;
  }

  if (!data.cover_image?.trim()) {
    issues.push({ path: ["cover_image"], message: "Vui lòng nhập URL ảnh bìa." });
  }
  if (!data.short_description?.trim()) {
    issues.push({
      path: ["short_description"],
      message: "Vui lòng nhập mô tả ngắn.",
    });
  }
  if (!data.category?.trim()) {
    issues.push({ path: ["category"], message: "Vui lòng chọn loại sự kiện." });
  }
  if (startMs === null) {
    issues.push({
      path: ["start_time"],
      message: "Vui lòng chọn thời gian bắt đầu.",
    });
  }
  if (endMs === null) {
    issues.push({
      path: ["end_time"],
      message: "Vui lòng chọn thời gian kết thúc.",
    });
  }
  if (!data.location_name?.trim()) {
    issues.push({
      path: ["location_name"],
      message: "Vui lòng nhập tên địa điểm.",
    });
  }
  if (!data.address?.trim()) {
    issues.push({ path: ["address"], message: "Vui lòng nhập địa chỉ." });
  }
  if (!data.district?.trim()) {
    issues.push({ path: ["district"], message: "Vui lòng nhập quận/huyện." });
  }
  if (data.ticket_type === "FREE_REGISTRATION" && !data.ticket_url?.trim()) {
    issues.push({
      path: ["ticket_url"],
      message: "Vui lòng nhập link đăng ký cho sự kiện miễn phí cần đăng ký.",
    });
  }

  return issues;
}

export const statusPatchSchema = z.object({
  status: z.enum(["PUBLISHED", "RESCHEDULED", "POSTPONED", "CANCELLED"]),
  reschedule_notice: z.string().trim().max(500).optional(),
  start_time: nullableDateTime,
  end_time: nullableDateTime,
});

export type StatusPatchPayload = z.infer<typeof statusPatchSchema>;

export const submissionReviewSchema = z
  .object({
    status: z.enum(["APPROVED", "REJECTED"]),
    rejection_reason: z.string().trim().max(500).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.status === "REJECTED" && !val.rejection_reason?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["rejection_reason"],
        message: "Vui lòng nhập lý do từ chối đề xuất.",
      });
    }
  });

export const publicSubmissionCreateSchema = z.object({
  title: z.string().trim().min(3, "Vui lòng nhập tên sự kiện.").max(200),
  organizer_name: z.string().trim().min(2, "Vui lòng nhập tên ban tổ chức.").max(200),
  organizer_contact: z.string().trim().max(255).optional(),
  category: z.enum(EVENT_CATEGORIES).optional().default("FESTIVAL"),
  short_description: z.string().trim().max(500).optional(),
  description: z.string().trim().max(10000).optional(),
  location_name: z.string().trim().max(200).optional(),
  address: z.string().trim().max(300).optional(),
  district: z.string().trim().max(100).optional(),
  start_time: nullableDateTime,
  end_time: nullableDateTime,
  source_url: nullableUrl,
  cover_image: nullableUrl,
});

export const eventReminderSchema = z.object({
  recipient_email: z
    .string()
    .trim()
    .email("Địa chỉ email nhận nhắc lịch không hợp lệ.")
    .max(160)
    .optional(),
  recipient_name: z.string().trim().max(120).optional(),
});

export type EventReminderInput = z.infer<typeof eventReminderSchema>;
