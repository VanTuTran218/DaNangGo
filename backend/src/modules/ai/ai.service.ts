import {
  buildItineraryParsePrompt,
  ItineraryRequestSchema,
  buildReviewSummaryPrompt,
  ReviewSummarySchema,
  buildReviewReplyPrompt,
  ReplyDraftSchema,
  buildModerationPrompt,
  ModerationSchema,
  buildDescriptionDraftPrompt,
  DescriptionDraftSchema,
  buildSurveySummaryPrompt,
  SurveySummarySchema,
  buildQueryRewritePrompt,
  QueryRewriteSchema,
  type ItineraryRequest,
  type PlaceType,
} from "../../Ai/promt";
import {
  cached,
  structured,
  fingerprint,
  aiMetrics,
  runEmbedding,
} from "../../Ai/runtime";
import {
  parseTrip,
  finalizeTrip,
  todayVietnam,
  validDate,
  redact,
  anonymize,
  moderateRules,
  normalize,
  safeDraft,
  cosine,
  safeRewrite,
} from "./ai.rules";
import * as repo from "./ai.repository";
import { searchPlacesForChat } from "../chat/chat.repository";

export class AiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function itinerary(text: string) {
  const today = todayVietnam();
  const fallback = parseTrip(text, today);
  if (fallback.off_topic)
    return {
      mode: "fallback",
      request: fallback,
      notice: "Hãy mô tả chuyến du lịch Đà Nẵng bạn muốn lên kế hoạch.",
    };
  return cached("itinerary", [text, today], 5 * 60_000, async () => {
    const ai = await structured(
      "itinerary",
      buildItineraryParsePrompt(redact(text), today),
      ItineraryRequestSchema,
    );
    const hasMoney =
      fallback.budget !== null ||
      /trieu|\btr\b|ngan sach|\b\d+[kđd]\b|dong|vnd|nghin|ngan/.test(
        normalize(text),
      );
    const hasDate =
      /\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}|hom nay|ngay mai|cuoi tuan|thu (hai|ba|tu|nam|sau|bay)|chu nhat/.test(
        normalize(text),
      );
    const explicitDays = normalize(text).match(/(\d+)\s*(?:ngay|n\s*\d+\s*d)/);
    const unsupportedDays =
      explicitDays &&
      (Number(explicitDays[1]) < 1 || Number(explicitDays[1]) > 3);
    const unresolvedUnit =
      fallback.budget === null &&
      /(?:moi|\/|mot)\s*(?:nguoi|khach|ngay)/.test(normalize(text));
    const explicitDate = text.match(/\d{4}-\d{2}-\d{2}/)?.[0];
    const request = finalizeTrip(
      ai
        ? {
            ...ai,
            budget:
              hasMoney && !unresolvedUnit
                ? (fallback.budget ?? ai.budget)
                : null,
            days: unsupportedDays ? null : (fallback.days ?? ai.days),
            guests: fallback.guests ?? ai.guests,
            start_date: explicitDate
              ? validDate(explicitDate)
              : hasDate
                ? (fallback.start_date ?? ai.start_date)
                : null,
          }
        : fallback,
      today,
    );
    return {
      mode: ai ? "ai" : "fallback",
      request,
      notice:
        "Kiểm tra và xác nhận các trường đã điền. Hệ thống hỗ trợ tối đa 3 ngày; AI chưa tạo hoặc lưu lịch trình.",
    };
  });
}
const topicRules: Record<string, RegExp> = {
  gia: /\b(gia|dat|re|tien)\b/,
  phuc_vu: /\b(phuc vu|nhan vien|cho lau|cham|than thien)\b/,
  ve_sinh: /\b(ve sinh|sach|ban thiu|mui)\b/,
  huong_vi: /\b(ngon|vi|mon an|do an|man|nhat)\b/,
  khong_gian: /\b(khong gian|view|rong|chat|on)\b/,
  vi_tri: /\b(vi tri|dia chi|duong di|gan|xa)\b/,
};
const topicLabels: Record<string, string> = {
  gia: "giá cả",
  phuc_vu: "phục vụ",
  ve_sinh: "vệ sinh",
  huong_vi: "hương vị",
  khong_gian: "không gian",
  vi_tri: "vị trí",
  khac: "trải nghiệm chung",
};
export async function reviewSummary(id: number) {
  const place = await repo.place(id);
  if (!place) throw new AiError(404, "Không tìm thấy địa điểm công khai.");
  const { rows, total } = await repo.approvedReviews(id);
  if (rows.length < 5)
    return {
      mode: "insufficient",
      totalReviews: total,
      sampleCount: rows.length,
      summary: "Cần ít nhất 5 đánh giá đã duyệt để tổng hợp.",
      strengths: [],
      weaknesses: [],
      sentiment: { positive: 0, neutral: 0, negative: 0 },
    };
  return cached("reviewSummary", [id, rows], 10 * 60_000, async () => {
    const reviews = rows.map((row) => ({
      id: row.review_id,
      rating: row.rating,
      content: anonymize(row.comment),
    }));
    const ai = await structured(
      "reviewSummary",
      buildReviewSummaryPrompt(place.name, reviews),
      ReviewSummarySchema,
    );
    const grouped: Record<string, { positive: number; negative: number }> = {};
    const sentiment = { positive: 0, neutral: 0, negative: 0 };
    for (const review of reviews) {
      const label = ai?.labels.find((l) => l.review_id === review.id);
      const tone =
        label?.sentiment ??
        (review.rating >= 4
          ? "positive"
          : review.rating <= 2
            ? "negative"
            : "neutral");
      sentiment[tone]++;
      const topics = [
        ...new Set(
          label?.topics ??
            Object.keys(topicRules).filter((topic) =>
              topicRules[topic]!.test(normalize(review.content)),
            ),
        ),
      ];
      for (const topic of topics) {
        grouped[topic] ??= { positive: 0, negative: 0 };
        if (tone !== "neutral") grouped[topic]![tone]++;
      }
    }
    const strengths = Object.entries(grouped)
      .filter(([, v]) => v.positive >= 2)
      .sort((a, b) => b[1].positive - a[1].positive)
      .slice(0, 3)
      .map(
        ([t, v]) =>
          `${v.positive} đánh giá tích cực nhắc tới ${topicLabels[t] ?? "trải nghiệm"}.`,
      );
    const weaknesses = Object.entries(grouped)
      .filter(([, v]) => v.negative >= 2)
      .sort((a, b) => b[1].negative - a[1].negative)
      .slice(0, 3)
      .map(
        ([t, v]) =>
          `${v.negative} đánh giá chưa hài lòng nhắc tới ${topicLabels[t] ?? "trải nghiệm"}.`,
      );
    return {
      mode: ai ? "ai" : "fallback",
      totalReviews: total,
      sampleCount: reviews.length,
      strengths,
      weaknesses,
      sentiment,
      summary: `Tổng hợp ${reviews.length} đánh giá đã duyệt gần nhất trong ${total} đánh giá. Có ${sentiment.positive} phản hồi tích cực, ${sentiment.neutral} trung lập và ${sentiment.negative} chưa hài lòng trong mẫu này.`,
    };
  });
}
export async function replyDraft(id: number, userId: number) {
  const review = await repo.ownedReview(id, userId);
  if (!review)
    throw new AiError(404, "Không tìm thấy đánh giá thuộc cơ sở của bạn.");
  const fallback =
    review.rating >= 4
      ? "Chúng tôi cảm ơn quý khách đã chia sẻ trải nghiệm. Rất mong có dịp đón tiếp quý khách lần sau!"
      : "Chúng tôi cảm ơn quý khách đã chia sẻ và rất tiếc về trải nghiệm chưa như mong đợi. Chúng tôi ghi nhận ý kiến để xem xét cải thiện dịch vụ.";
  const result = await structured(
    "reply",
    buildReviewReplyPrompt({
      placeName: redact(review.name),
      rating: review.rating,
      review: anonymize(review.comment),
    }),
    ReplyDraftSchema,
  );
  const draft = result && safeDraft(result.draft) ? result.draft : fallback;
  return {
    mode: draft === fallback ? "fallback" : "ai",
    draft,
    notice:
      "Bản nháp chưa được gửi. Bạn hãy đọc, chỉnh sửa và bấm Gửi phản hồi.",
  };
}
export async function moderation(ids: number[]) {
  const rows = await repo.moderationReviews(ids);
  const reviews = rows.map((r) => ({
    id: r.review_id,
    rating: r.rating,
    content: r.comment,
  }));
  const local = moderateRules(reviews);
  const ai = await structured(
    "moderation",
    buildModerationPrompt(
      reviews.map((r) => ({ ...r, content: anonymize(r.content) })),
    ),
    ModerationSchema,
  );
  const allowed = new Set(rows.map((r) => r.review_id));
  const byId = new Map(local.items.map((item) => [item.review_id, item]));
  for (const item of ai?.items ?? [])
    if (allowed.has(item.review_id) && item.flags.length) {
      const old = byId.get(item.review_id);
      byId.set(item.review_id, {
        ...item,
        flags: [...new Set([...(old?.flags ?? []), ...item.flags])],
        reason:
          "Có dấu hiệu cần xem xét. Hãy đối chiếu nội dung gốc trước khi quyết định.",
      });
    }
  return {
    mode: ai ? "ai" : "fallback",
    items: [...byId.values()],
    analyzedCount: rows.length,
    notice: "Chỉ là cờ hỗ trợ; chưa có đánh giá nào được duyệt, ẩn hoặc xóa.",
  };
}
export async function description(
  name: string,
  type: PlaceType,
  notes: string,
) {
  const clean = redact(notes);
  const fallback = clean
    .split(/\n+/)
    .map((s) => s.replace(/^[-•]\s*/, "").trim())
    .filter(Boolean)
    .join(". ")
    .slice(0, 600);
  const ai = await structured(
    "description",
    buildDescriptionDraftPrompt({
      placeName: redact(name),
      type,
      notes: clean,
    }),
    DescriptionDraftSchema,
  );
  const accepted = ai && safeDraft(ai.description, clean) ? ai : null;
  return {
    mode: accepted ? "ai" : "fallback",
    description: accepted?.description ?? fallback,
    missingInfo: accepted?.missing_info ?? [
      "Kiểm tra thông tin trước khi gửi duyệt.",
    ],
    notice: "Bản nháp chưa được lưu. Chỉ áp dụng khi bạn xác nhận.",
  };
}
export async function rewrite(query: string) {
  return cached("rewrite", query, 5 * 60_000, async () => {
    const ai = await structured(
      "rewrite",
      buildQueryRewritePrompt(redact(query)),
      QueryRewriteSchema,
    );
    const fixes: Record<string, string> = {
      "khach sang": "khách sạn",
      "khach san": "khách sạn",
      "hai sang": "hải sản",
      "hai san": "hải sản",
      "mi quang": "mì Quảng",
      homstay: "homestay",
      "ca phe": "cà phê",
      "my khe": "Mỹ Khê",
    };
    let fallback = normalize(query);
    for (const [from, to] of Object.entries(fixes))
      fallback = fallback.split(from).join(to);
    let candidate = ai?.query ?? fallback;
    // Không thay đổi con số hoặc thêm mức giá/khu vực mới qua gợi ý viết lại.
    if (!safeRewrite(query, candidate)) candidate = fallback;
    return {
      mode: ai && candidate === ai.query ? "ai" : "fallback",
      original: query,
      query: candidate,
      notice:
        "Chỉ thay từ khóa khi bạn bấm sử dụng gợi ý; bộ lọc khác được giữ nguyên.",
    };
  });
}
export async function surveyReport(id: number) {
  const data = await repo.surveyAnswers(id);
  if (!data) throw new AiError(404, "Không tìm thấy khảo sát.");
  const answers = data.answers.map((row) => ({
    id: row.answer_id,
    text: anonymize(`${row.content}: ${row.answer_text}`).slice(0, 400),
  }));
  if (!answers.length)
    return {
      mode: "insufficient",
      title: data.title,
      choiceStats: data.choiceStats ?? [],
      stats: data.stats,
      sampleCount: 0,
      themes: [],
      topIssues: [],
      overview:
        "Chưa có góp ý bằng văn bản đã gửi để AI nhóm chủ đề. Số phiếu, điểm đánh giá và lựa chọn vẫn được thống kê từ database.",
    };
  return cached("survey", [id, answers, data.stats], 10 * 60_000, async () => {
    const ai = await structured(
      "survey",
      buildSurveySummaryPrompt(answers),
      SurveySummarySchema,
    );
    const allowed = new Set(answers.map((a) => a.id));
    const themes = (
      ai?.themes ??
      Object.entries(topicRules).map(([key, rule]) => ({
        name: topicLabels[key]!,
        sentiment: "mixed",
        summary: "",
        answer_ids: answers
          .filter((a) => rule.test(normalize(a.text)))
          .map((a) => a.id),
      }))
    )
      .map((theme) => ({
        name: anonymize(theme.name),
        sentiment: theme.sentiment,
        answerIds: [
          ...new Set(theme.answer_ids.filter((id) => allowed.has(id))),
        ],
      }))
      .filter((theme) => theme.answerIds.length)
      .map((theme) => ({ ...theme, mentions: theme.answerIds.length }))
      .sort((a, b) => b.mentions - a.mentions);
    return {
      mode: ai ? "ai" : "fallback",
      title: data.title,
      choiceStats: data.choiceStats ?? [],
      stats: data.stats,
      sampleCount: answers.length,
      themes,
      topIssues: themes
        .filter((t) => ["negative", "mixed"].includes(t.sentiment))
        .slice(0, 5)
        .map((t) => t.name),
      overview: `Đã nhóm ${answers.length} câu trả lời tự do gần nhất. Số lượt nhắc được tính từ mã câu trả lời; một câu có thể thuộc nhiều chủ đề.`,
    };
  });
}
const embeddingModel = () =>
  process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";
const document = (place: {
  name: string;
  place_type: string;
  description: string | null;
  district_id: number | null;
}) =>
  `${place.place_type}\n${place.name}\n${place.description?.slice(0, 1600) ?? ""}\n${place.district_id ?? ""}`;
export async function syncEmbeddings(afterId = 0) {
  const all = await repo.embeddingPlaces();
  const batch = all.filter((p) => p.place_id > afterId).slice(0, 40);
  const stored = await repo.vectors();
  const model = embeddingModel();
  const needed = batch.filter(
    (p) =>
      !stored.some(
        (v) =>
          v.place_id === p.place_id &&
          v.model === model &&
          v.content_hash === fingerprint(document(p)),
      ),
  );
  let saved = 0;
  if (needed.length) {
    for (let i = 0; i < needed.length; i += 10) {
      const group = needed.slice(i, i + 10);
      const result = await runEmbedding(model, group.map(document));
      if (!result)
        throw new AiError(
          503,
          "Chưa thể cập nhật embedding (thiếu khóa, hết hạn ngạch hoặc dịch vụ bận). Gợi ý theo dữ liệu vẫn hoạt động.",
        );
      if (result.embeddings?.length !== group.length)
        throw new AiError(
          503,
          "Dịch vụ embedding chưa trả đủ dữ liệu. Bạn có thể thử lại.",
        );
      for (let j = 0; j < group.length; j++) {
        const vector = result.embeddings[j].values as number[];
        if (
          !Array.isArray(vector) ||
          vector.length !== 768 ||
          !vector.every(Number.isFinite)
        )
          throw new AiError(503, "Embedding không hợp lệ.");
        const p = group[j]!;
        await repo.saveVector(
          p.place_id,
          fingerprint(document(p)),
          model,
          vector,
        );
        saved++;
      }
    }
  }
  const nextAfterId = batch[batch.length - 1]?.place_id ?? afterId;
  return {
    saved,
    processed: batch.length,
    total: all.length,
    nextAfterId,
    hasMore: all.some((p) => p.place_id > nextAfterId),
  };
}
export async function similar(id: number) {
  const source = await repo.place(id);
  if (!source) throw new AiError(404, "Không tìm thấy địa điểm công khai.");
  const rows = (
    await searchPlacesForChat({ placeType: source.place_type, limit: 200 })
  ).filter((p) => p.placeId !== id);
  let vectors: Array<Awaited<ReturnType<typeof repo.vectors>>[number]> = [];
  try {
    vectors = await repo.vectors();
  } catch {
    /* migration not ready: catalog fallback */
  }
  const all = await repo.embeddingPlaces();
  const fresh = new Map<number, number[]>();
  for (const row of all) {
    const value = vectors.find(
      (v) =>
        v.place_id === row.place_id &&
        v.model === embeddingModel() &&
        v.content_hash === fingerprint(document(row)),
    );
    if (value) {
      try {
        const vector = JSON.parse(value.embedding_json);
        if (
          Array.isArray(vector) &&
          vector.length === 768 &&
          vector.every(
            (n: unknown) => typeof n === "number" && Number.isFinite(n),
          )
        )
          fresh.set(row.place_id, vector);
      } catch {}
    }
  }
  const sourceVector = fresh.get(id);
  const words = new Set(
    normalize(`${source.name} ${source.description ?? ""}`).match(
      /[a-z0-9]{2,}/g,
    ) ?? [],
  );
  const ranked = rows
    .map((row) => {
      const vector = fresh.get(row.placeId);
      const useVector = Boolean(sourceVector && vector);
      const tokens = new Set(
        normalize(`${row.name} ${row.description ?? ""}`).match(
          /[a-z0-9]{2,}/g,
        ) ?? [],
      );
      const score = useVector
        ? cosine(sourceVector!, vector!)
        : [...words].filter((word) => tokens.has(word)).length /
          Math.max(1, words.size);
      const { priceMin, priceMax, description, ...card } = row;
      return {
        ...card,
        score,
        method: useVector ? "embedding" : "catalog",
        reason: useVector
          ? "Nội dung và loại trải nghiệm tương đồng."
          : "Cùng loại địa điểm, so khớp thông tin trong dữ liệu.",
      };
    })
    .sort((a, b) => b.score - a.score || b.rating - a.rating)
    .slice(0, 6);
  return {
    items: ranked,
    method: ranked.some((p) => p.method === "embedding") ? "hybrid" : "catalog",
  };
}
export { aiMetrics };
