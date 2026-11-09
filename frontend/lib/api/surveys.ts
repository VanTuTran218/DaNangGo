import { apiPost } from "./client";
import type {
  FullSurveyFormData,
  QuickSurveyFormData,
} from "@/constants/survey";

const DRAFT_STORAGE_KEY = "dananggo_survey_full_draft_v1";
const INVITE_META_KEY = "dananggo_survey_invite_meta_v1";

export interface SurveyInviteMeta {
  lastShownAt?: number;
  snoozedUntil?: number;
  neverAskAgain?: boolean;
  completedItineraries: (string | number)[];
}

/**
 * Lấy dữ liệu nháp từ sessionStorage (luôn bọc try/catch, SSR-safe)
 */
export function loadSurveyDraft(): FullSurveyFormData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null) {
      return parsed as FullSurveyFormData;
    }
  } catch (error) {
    console.warn("[Survey] Không thể đọc bản nháp từ sessionStorage", error);
  }
  return null;
}

/**
 * Lưu dữ liệu nháp vào sessionStorage (luôn bọc try/catch)
 * Không lưu thông tin nhạy cảm.
 */
export function saveSurveyDraft(data: FullSurveyFormData): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn("[Survey] Không thể lưu bản nháp vào sessionStorage", error);
  }
}

/**
 * Xóa bản nháp sau khi đã gửi thành công
 */
export function clearSurveyDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch (error) {
    console.warn("[Survey] Không thể xóa bản nháp", error);
  }
}

/**
 * Đọc cài đặt hiển thị lời mời khảo sát từ localStorage
 */
export function getSurveyInviteMeta(): SurveyInviteMeta {
  if (typeof window === "undefined") {
    return { completedItineraries: [] };
  }
  try {
    const raw = window.localStorage.getItem(INVITE_META_KEY);
    if (!raw) return { completedItineraries: [] };
    const parsed = JSON.parse(raw);
    return {
      lastShownAt: parsed.lastShownAt,
      snoozedUntil: parsed.snoozedUntil,
      neverAskAgain: Boolean(parsed.neverAskAgain),
      completedItineraries: Array.isArray(parsed.completedItineraries)
        ? parsed.completedItineraries
        : [],
    };
  } catch {
    return { completedItineraries: [] };
  }
}

/**
 * Kiểm tra xem có đủ điều kiện hiển thị lời mời khảo sát không:
 * - Không bao giờ hiện nếu người dùng chọn "Không hỏi lại"
 * - Không hiện nếu đang trong thời gian "Để sau" (7 ngày)
 * - Tối đa 1 lời mời mỗi 30 ngày
 * - Nếu gắn với một lịch trình cụ thể, chỉ mời 1 lần cho lịch trình đó
 */
export function canShowSurveyInvite(itineraryId?: string | number): boolean {
  if (typeof window === "undefined") return false;
  try {
    const meta = getSurveyInviteMeta();
    if (meta.neverAskAgain) return false;

    const now = Date.now();
    if (meta.snoozedUntil && meta.snoozedUntil > now) return false;

    // Tối đa 1 lời mời mỗi 30 ngày (30 * 24 * 60 * 60 * 1000)
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    if (meta.lastShownAt && now - meta.lastShownAt < thirtyDaysMs) {
      return false;
    }

    if (
      itineraryId !== undefined &&
      meta.completedItineraries.includes(String(itineraryId))
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Ghi nhận hành động đóng/hoãn lời mời khảo sát
 */
export function recordSurveyDismiss(
  action: "LATER" | "NEVER",
  itineraryId?: string | number,
): void {
  if (typeof window === "undefined") return;
  try {
    const meta = getSurveyInviteMeta();
    const now = Date.now();
    meta.lastShownAt = now;

    if (action === "NEVER") {
      meta.neverAskAgain = true;
    } else if (action === "LATER") {
      // Ẩn trong 7 ngày
      meta.snoozedUntil = now + 7 * 24 * 60 * 60 * 1000;
    }

    if (itineraryId !== undefined) {
      const idStr = String(itineraryId);
      if (!meta.completedItineraries.includes(idStr)) {
        meta.completedItineraries.push(idStr);
      }
    }

    window.localStorage.setItem(INVITE_META_KEY, JSON.stringify(meta));
  } catch (error) {
    console.warn(
      "[Survey] Không thể ghi nhận trạng thái từ chối khảo sát",
      error,
    );
  }
}

/**
 * Ghi nhận đã hoàn thành khảo sát (không nhắc lại cho lịch trình này)
 */
export function recordSurveyCompleted(itineraryId?: string | number): void {
  if (typeof window === "undefined") return;
  try {
    const meta = getSurveyInviteMeta();
    const now = Date.now();
    meta.lastShownAt = now;
    // Sau khi làm khảo sát thì không hiện lời mời trong 30 ngày tới
    meta.snoozedUntil = now + 30 * 24 * 60 * 60 * 1000;

    if (itineraryId !== undefined) {
      const idStr = String(itineraryId);
      if (!meta.completedItineraries.includes(idStr)) {
        meta.completedItineraries.push(idStr);
      }
    }

    window.localStorage.setItem(INVITE_META_KEY, JSON.stringify(meta));
    clearSurveyDraft();
  } catch (error) {
    console.warn("[Survey] Không thể ghi nhận hoàn thành khảo sát", error);
  }
}

/**
 * Ánh xạ phản hồi khảo sát sang cấu trúc dòng chuẩn của bảng `dbo.survey_answers`
 * để sẵn sàng tương thích khi backend triển khai endpoint thu thập:
 *   - question_id (số hoặc mã định danh)
 *   - answer_score (1-5 sao đối với STAR/RATING)
 *   - answer_text (nội dung text đối với TEXT/Góp ý)
 *   - option_id (lựa chọn đối với CHOICE)
 */
export interface SurveyAnswerPayloadItem {
  question_code: string;
  answer_score?: number;
  answer_number?: number;
  answer_text?: string;
  option_codes?: string[];
}

export interface SurveySubmitPayload {
  survey_type: "FULL" | "QUICK" | "CUSTOM";
  survey_id?: number;
  itinerary_id?: number;
  place_id?: number;
  answers: SurveyAnswerPayloadItem[];
  metadata?: Record<string, unknown>;
}

export function buildSurveyPayload(
  data: FullSurveyFormData,
  itineraryId?: string | number,
): SurveySubmitPayload {
  const answers: SurveyAnswerPayloadItem[] = [
    { question_code: "TRIP_PURPOSE", option_codes: [data.tripPurpose] },
    { question_code: "STAY_DURATION", option_codes: [data.stayDuration] },
    { question_code: "TRAVEL_COMPANION", option_codes: [data.travelCompanion] },
    { question_code: "ORIGIN_PROVINCE", option_codes: [data.originProvince] },
    { question_code: "VISIT_FREQUENCY", option_codes: [data.visitFrequency] },
    { question_code: "INFO_CHANNELS", option_codes: data.informationChannels },
    { question_code: "DAILY_BUDGET", answer_number: data.dailyBudget },
    { question_code: "TOP_EXPENSES", option_codes: data.topExpenses },
    {
      question_code: "OVERALL_SATISFACTION",
      answer_score: data.overallSatisfaction,
    },
    { question_code: "NPS_SCORE", answer_number: data.npsScore ?? undefined },
    { question_code: "ISSUES_FACED", option_codes: data.issuesFaced },
    { question_code: "FEEDBACK_TEXT", answer_text: data.feedbackText },
  ];

  // Thêm các hạng mục trải nghiệm vào danh sách câu trả lời
  Object.entries(data.experienceRatings)
    .filter(([, score]) => score !== 0)
    .forEach(([categoryKey, score]) => {
      answers.push({
        question_code: `EXP_${categoryKey.toUpperCase()}`,
        answer_score: score > 0 ? score : undefined,
        answer_text: score === -1 ? "CHUA_SU_DUNG" : undefined,
      });
    });

  if (data.ageGroup) {
    answers.push({ question_code: "AGE_GROUP", option_codes: [data.ageGroup] });
  }
  if (data.mostUsefulFeature) {
    answers.push({
      question_code: "DANANGGO_FEATURE",
      option_codes: [data.mostUsefulFeature],
    });
  }
  if (data.itineraryAccuracy) {
    answers.push({
      question_code: "DANANGGO_ACCURACY",
      option_codes: [data.itineraryAccuracy],
    });
  }

  return {
    survey_type: "FULL",
    answers,
    metadata: {
      request_id: getSurveyRequestId("FULL", itineraryId, JSON.stringify(data)),
      client_timestamp: new Date().toISOString(),
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      consent_agreed: data.consentAgreed,
    },
  };
}

/** Success is shown only after the backend confirms a committed response. */
export async function submitFullSurvey(
  data: FullSurveyFormData,
  itineraryId?: string | number,
): Promise<{ success: boolean; message: string }> {
  const res = await apiPost<{ responseId: number }>(
    "/api/surveys/submit",
    buildSurveyPayload(data, itineraryId),
  );
  if (!res.data?.responseId)
    throw new Error("Máy chủ chưa xác nhận lưu khảo sát. Vui lòng thử lại.");
  recordSurveyCompleted(itineraryId);
  clearSurveyRequestId("FULL", itineraryId);
  return {
    success: true,
    message: res.message || "Đã lưu khảo sát. Cảm ơn bạn!",
  };
}

/**
 * Gửi khảo sát nhanh 30 giây (QuickSheet)
 */
export async function submitQuickSurvey(
  data: QuickSurveyFormData,
  itineraryId?: string | number,
): Promise<{ success: boolean; message: string }> {
  const answers: SurveyAnswerPayloadItem[] = [
    {
      question_code: "OVERALL_SATISFACTION",
      answer_score: data.overallSatisfaction,
    },
    { question_code: "BEST_LIKES", option_codes: data.bestLikes },
    { question_code: "IMPROVEMENTS", option_codes: data.improvements },
    { question_code: "NPS_SCORE", answer_number: data.npsScore ?? undefined },
    { question_code: "FEEDBACK_TEXT", answer_text: data.quickFeedback },
  ];

  const payload: SurveySubmitPayload = {
    survey_type: "QUICK",
    answers,
    metadata: {
      request_id: getSurveyRequestId(
        "QUICK",
        itineraryId,
        JSON.stringify(data),
      ),
      consent_agreed: data.consentAgreed,
      client_timestamp: new Date().toISOString(),
    },
  };

  const res = await apiPost<{ responseId: number }>(
    "/api/surveys/quick",
    payload,
  );
  if (!res.data?.responseId)
    throw new Error("Máy chủ chưa xác nhận lưu khảo sát. Vui lòng thử lại.");
  recordSurveyCompleted(itineraryId);
  clearSurveyRequestId("QUICK", itineraryId);
  return {
    success: true,
    message: res.message || "Đã lưu khảo sát nhanh. Cảm ơn bạn!",
  };
}

export function getSurveyRequestId(
  type: string,
  itineraryId?: string | number,
  signature = "",
) {
  const key = `dananggo_survey_request:${type}:${itineraryId ?? "general"}`;
  const existing = sessionStorage.getItem(key);
  if (existing) {
    try {
      const value = JSON.parse(existing);
      if (value.signature === signature && typeof value.id === "string")
        return value.id as string;
    } catch {}
  }
  const id = crypto.randomUUID();
  sessionStorage.setItem(key, JSON.stringify({ id, signature }));
  return id;
}
export function clearSurveyRequestId(
  type: string,
  itineraryId?: string | number,
) {
  sessionStorage.removeItem(
    `dananggo_survey_request:${type}:${itineraryId ?? "general"}`,
  );
}
