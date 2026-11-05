import { apiRequest } from "./client";
import type { ChatPlaceCard } from "@/types/chat";
export type AiMode = "ai" | "fallback" | "insufficient";
export interface FeedbackReadinessReport {
  checkedAt: string;
  counts: {
    approvedReviews: number;
    pendingReviews: number;
    summaryReadyPlaces: number;
    partnerReplyReviews: number;
    submittedResponses: number;
    textAnswers: number;
    placesTotal: number;
  };
  features: {
    key: string;
    label: string;
    ready: boolean;
    available: number;
    unit: string;
    requirement: string;
    href: string;
  }[];
  places: {
    id: number;
    name: string;
    partnerApproved: boolean;
    approved: number;
    pending: number;
    remaining: number;
    href: string;
  }[];
  surveys: {
    id: number;
    title: string;
    canCollect: boolean;
    submitted: number;
    textAnswers: number;
    href: string;
  }[];
}
export interface TripRequest {
  days: number | null;
  guests: number | null;
  start_date: string | null;
  budget: number | null;
  needs: ("stay" | "food" | "sight" | "entertainment")[];
  interests: string[];
  missing: string[];
  off_topic: boolean;
}
export interface TripResult {
  mode: AiMode;
  request: TripRequest;
  notice: string;
}
export interface SummaryResult {
  mode: AiMode;
  totalReviews: number;
  sampleCount: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  sentiment: { positive: number; neutral: number; negative: number };
}
export interface DraftResult {
  mode: AiMode;
  draft: string;
  notice: string;
}
export interface DescriptionResult {
  mode: AiMode;
  description: string;
  missingInfo: string[];
  notice: string;
}
export interface ModerationItem {
  review_id: number;
  flags: string[];
  confidence: number;
  reason: string;
  priority: string;
}
export interface ModerationResult {
  mode: AiMode;
  items: ModerationItem[];
  analyzedCount: number;
  notice: string;
}
export interface SurveyListItem {
  survey_id: number;
  title: string;
  response_count: number;
}
export interface SurveyReport {
  mode: AiMode;
  title: string;
  overview: string;
  sampleCount: number;
  choiceStats?: { question: string; option: string; count: number }[];
  stats: {
    responses: number;
    rating_count: number;
    nps_count?: number;
    nps_average?: number | null;
    average_score: number | null;
  };
  themes: {
    name: string;
    sentiment: string;
    mentions: number;
    answerIds: number[];
  }[];
  topIssues: string[];
}
export interface AiMetrics {
  model: string;
  keyConfigured: boolean;
  activeRequests: number;
  cooldownSeconds: number;
  cacheEntries: number;
  tasks: Record<
    string,
    {
      calls: number;
      success: number;
      fallback: number;
      retries: number;
      cacheHits: number;
      durationMs: number;
    }
  >;
}
export interface SyncResult {
  saved: number;
  processed: number;
  total: number;
  nextAfterId: number;
  hasMore: boolean;
}
export function aiRequest<T>(
  path: string,
  body?: unknown,
  signal?: AbortSignal,
) {
  const timeout = AbortSignal.timeout(75_000);
  return apiRequest<T>(
    `/api/ai${path}`,
    {
      method: body === undefined ? "GET" : "POST",
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    },
    { retryAfterRefresh: false },
  ).then((response) => {
    if (response.data === undefined)
      throw new Error("Không nhận được dữ liệu AI.");
    return response.data;
  });
}
export const parseItinerary = (message: string, signal?: AbortSignal) =>
  aiRequest<TripResult>("/itinerary", { message }, signal);
export const getReviewSummary = (id: number, signal?: AbortSignal) =>
  aiRequest<SummaryResult>(`/places/${id}/review-summary`, undefined, signal);
export const draftReply = (id: string, signal?: AbortSignal) =>
  aiRequest<DraftResult>(
    `/partner/reviews/${encodeURIComponent(id)}/draft`,
    {},
    signal,
  );
export const draftDescription = (
  name: string,
  type: "food" | "stay" | "sight",
  notes: string,
  admin: boolean,
  signal?: AbortSignal,
) =>
  aiRequest<DescriptionResult>(
    `/${admin ? "admin" : "partner"}/description`,
    { name, type, notes },
    signal,
  );
export const scanReviews = (ids: number[], signal?: AbortSignal) =>
  aiRequest<ModerationResult>("/admin/moderation", { ids }, signal);
export const rewriteSearch = (message: string, signal?: AbortSignal) =>
  aiRequest<{ mode: AiMode; query: string; notice: string }>(
    "/rewrite",
    { message },
    signal,
  );
export const similarPlaces = (id: number, signal?: AbortSignal) =>
  aiRequest<{
    items: (ChatPlaceCard & { method: string; reason: string })[];
    method: string;
  }>(`/places/${id}/similar`, undefined, signal);
