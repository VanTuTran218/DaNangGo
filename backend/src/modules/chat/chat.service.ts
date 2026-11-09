import { randomUUID } from "node:crypto";
// Trợ lý chat du lịch (A1 – RAG) theo src/Ai/promt.ts:
//   1. Phân tích ý định (buildIntentPrompt → IntentSchema)
//   2. Truy xuất địa điểm từ SQL Server theo intent (DB là nguồn sự thật)
//   3. Gemini trả lời dựa trên <PLACES> (buildChatPrompt → ChatAnswerSchema)
//   4. Lọc id không có trong danh sách đã truy xuất (filterChatAnswer – chống bịa quán)
// Mọi bước lỗi đều có phương án dự phòng (FALLBACK_MESSAGES), không làm sập chat.

import {
  buildChatPrompt,
  buildIntentPrompt,
  ChatAnswerSchema,
  DEFAULT_INTENT,
  DISTRICTS,
  FALLBACK_MESSAGES,
  IntentSchema,
  safeParseJson,
  sanitizeText,
  MAX_USER_MESSAGE,
  toGeminiContents,
  type ChatTurn,
  type Intent,
  type PlaceContext,
  type PlaceType,
  type PromptBundle,
} from "../../Ai/promt";
import {
  searchPlacesForChat,
  findChatAnchor,
  chatMenus,
  type PlaceSearchRow,
} from "./chat.repository";
import { openChatConversation } from "./chat.sessions";
import { groundChatAnswer } from "./chat.safety";
import type {
  ChatMessageDto,
  ChatPlaceCard,
  SendMessageInput,
  SendMessageResponse,
} from "./chat.types";

import {
  readAdvisorTurn,
  writeAdvisorTurn,
  type AdvisorState,
} from "./chat.advisor-state";
import { runPrompt } from "../../Ai/runtime";
import { normalize } from "../ai/ai.rules";
import { knowledgeReply, dietaryConcern, dietaryNotice, isRestart } from "./chat.knowledge";
import { excludedNames, isExcluded } from "./chat.exclusions";
import { tripBudget } from "./chat.budget";
import { understand, planningText } from "./chat.understanding";
import { conversationalText } from "./chat.language";
import { readProfile, explicitPreferences, profileSuggestions } from "./chat.profile";
import { profileCommand } from "./chat.profile-command";
import { multiNeedReply } from "./chat.multineed";
import type { PreferenceKey, ResponseMetadata } from "./chat.contract";
import { preferenceContext } from "./chat.trip-preferences";
import { advancedReply } from "./chat.advanced";
import { attachPlanCosts } from "./chat.plan-edit";
import {
  ruleIntent,
  resolveChatRequest,
  tripBrief,
  tripContext,
  unsupportedTripDays,
} from "./chat.intent";
import {
  buildTravelPlan,
  consultationText,
  planIntroduction,
  placeCard,
} from "./chat.advisor";

// ─────────────────────────────────────────────────────────────────────────────
// Ánh xạ kiểu dữ liệu
// ─────────────────────────────────────────────────────────────────────────────
const CATEGORY_TO_DB: Record<
  PlaceType,
  "ACCOMMODATION" | "RESTAURANT" | "ATTRACTION"
> = {
  stay: "ACCOMMODATION",
  food: "RESTAURANT",
  sight: "ATTRACTION",
};
const DB_TO_TYPE: Record<string, PlaceType> = {
  ACCOMMODATION: "stay",
  RESTAURANT: "food",
  ATTRACTION: "sight",
};

function toPlaceContext(row: PlaceSearchRow): PlaceContext {
  return {
    id: row.placeId,
    name: row.name,
    type: DB_TO_TYPE[row.placeType] ?? "sight",
    district: row.districtName ?? "không rõ",
    priceMin: row.priceMin,
    priceMax: row.priceMax,
    rating: row.reviewCount > 0 ? row.rating : null,
    reviewCount: row.reviewCount,
    openHours: null,
    description: [
      row.description,
      row.stayFacts ? JSON.stringify(row.stayFacts) : "",
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

const toCard = placeCard;

// ─────────────────────────────────────────────────────────────────────────────
// Phân tích ý định dự phòng (khi Gemini không khả dụng) – rule-based đơn giản
// ─────────────────────────────────────────────────────────────────────────────
const normalizeText = normalize;
export const fallbackIntent = ruleIntent;

const intentCache = new Map<string, { value: Intent; expires: number }>();
const intentPending = new Map<string, Promise<Intent>>();

export async function analyzeIntent(
  message: string,
  deadline = Date.now() + 8000,
): Promise<Intent> {
  const key = normalizeText(message).replace(/\s+/g, " ");
  const cached = intentCache.get(key);
  if (cached && cached.expires > Date.now())
    return structuredClone(cached.value);
  if (intentPending.has(key))
    return structuredClone(await intentPending.get(key)!);
  const pending = analyzeFreshIntent(message, deadline).finally(() =>
    intentPending.delete(key),
  );
  intentPending.set(key, pending);
  return structuredClone(await pending);
}

async function analyzeFreshIntent(
  message: string,
  deadline: number,
): Promise<Intent> {
  const raw = await runPrompt(
    buildIntentPrompt(message),
    Math.min(deadline, Date.now() + 8000),
    "intent",
  );
  if (raw) {
    try {
      const parsed = safeParseJson(IntentSchema, raw);
      const rules = fallbackIntent(message);
      const intent = {
        ...parsed,
        category: rules.category !== "other" ? rules.category : parsed.category,
        budget: rules.budget ?? parsed.budget,
        budget_scope: rules.budget !== null ? rules.budget_scope : parsed.budget_scope,
        district: rules.district ?? parsed.district,
      };
      if (intentCache.size >= 200)
        intentCache.delete(intentCache.keys().next().value!);
      intentCache.set(normalizeText(message).replace(/\s+/g, " "), {
        value: intent,
        expires: Date.now() + 5 * 60_000,
      });
      return intent;
    } catch (e) {
      console.warn("[ChatService] Intent JSON không hợp lệ, dùng rule-based.");
    }
  }
  return fallbackIntent(message);
}

// ─────────────────────────────────────────────────────────────────────────────
// Gợi ý nhanh & liên kết hành động theo loại
// ─────────────────────────────────────────────────────────────────────────────
function getCategoryMeta(category: Intent["category"]): {
  quickReplies: string[];
  actionLink?: { text: string; url: string };
} {
  switch (category) {
    case "food":
      return {
        quickReplies: [
          "Quán hải sản giá bình dân",
          "Mì Quảng ở Hải Châu",
          "Quán ăn vặt buổi tối",
        ],
        actionLink: { text: "Khám phá ẩm thực Đà Nẵng", url: "/amthuc" },
      };
    case "stay":
      return {
        quickReplies: [
          "Khách sạn gần biển Mỹ Khê",
          "Homestay dưới 500k/đêm",
          "Resort cho gia đình",
        ],
        actionLink: { text: "Khám phá chỗ ở Đà Nẵng", url: "/luutru" },
      };
    case "sight":
      return {
        quickReplies: [
          "Điểm check-in đẹp",
          "Địa điểm miễn phí vé",
          "Tham quan ở Sơn Trà",
        ],
        actionLink: { text: "Xem tất cả điểm du lịch", url: "/diemdulich" },
      };
    default:
      return {
        quickReplies: [
          "🍜 Quán Mì Quảng ngon",
          "🏖️ Khách sạn gần biển Mỹ Khê",
          "🌉 Điểm tham quan nổi bật",
          "✨ Lập lịch trình 3N2Đ",
        ],
        actionLink: {
          text: "Lập lịch trình thông minh",
          url: "/lich-trinh/tao-moi",
        },
      };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main handler
// ─────────────────────────────────────────────────────────────────────────────
export type ChatProgress =
  | { type: "status"; text: string }
  | { type: "candidates"; places: ChatPlaceCard[] };

export async function processUserMessage(
  input: SendMessageInput,
  onProgress?: (event: ChatProgress) => void,
): Promise<SendMessageResponse> {
  const deadline = Date.now() + 25_000;
  const prompt = (bundle: PromptBundle) => runPrompt(bundle, deadline);
  onProgress?.({ type: "status", text: "Gô đang tìm hiểu yêu cầu của bạn…" });
  const conversation = await openChatConversation(input);
  const sessionId = conversation.id;
  const rawMsg = sanitizeText(input.message, MAX_USER_MESSAGE);
  const analysisText = conversationalText(rawMsg);
  let advisorState: AdvisorState | undefined;
  const history: ChatTurn[] = (await conversation.history()).map((m) => {
    if (m.sender === "AI") {
      const saved = readAdvisorTurn(m.content);
      if (saved.state) advisorState = saved.state;
      return { role: "assistant", content: saved.content };
    }
    return { role: "user", content: m.content };
  });
  await conversation.save("USER", rawMsg);

  // 1. Phân tích ý định
  const previousUserMessages = history
    .filter((turn) => turn.role === "user")
    .map((turn) => turn.content);
  if (advisorState?.tripContext)
    previousUserMessages.unshift(advisorState.tripContext);
  const resetAt = previousUserMessages.map(isRestart).lastIndexOf(true);
  if (resetAt >= 0) previousUserMessages.splice(0, resetAt + 1);
  let savedPreferences: PreferenceKey[] = [];
  const metadataWarnings: string[] = [];
  if (input.userId) {
    try { savedPreferences = await readProfile(input.userId); }
    catch { metadataWarnings.push("Chưa tải được sở thích đã lưu; Gô chỉ dùng điều kiện trong phiên, chưa xác nhận dữ liệu ghi nhớ lâu dài."); }
  }
  const dialogue = understand(rawMsg, isRestart(rawMsg) ? undefined : advisorState?.dialogue, savedPreferences);
  const profileAnswer = await profileCommand(rawMsg, input.userId, dialogue, savedPreferences, metadataWarnings.length === 0);
  let knowledge = knowledgeReply(rawMsg, Boolean(input.location));
  // A live-data limitation does not discard a separate, answerable request.
  const liveNotice = knowledge?.intentKey.startsWith("RT_") && dialogue.needs.length > 0 && /\b(goi y|tim|len lich|lap lich|len ke hoach)\b/.test(analysisText) ? knowledge : null;
  if (liveNotice) { metadataWarnings.push(liveNotice.content); knowledge = null; }
  if (isRestart(rawMsg)) advisorState = {
    stayId: null,
    excludedStayIds: [],
    dietaryRestricted: false,
    excludedNames: [],
  };
  const request = resolveChatRequest(analysisText, previousUserMessages);
  if (dietaryConcern(rawMsg)) advisorState = {
    ...advisorState,
    stayId: advisorState?.stayId ?? null,
    excludedStayIds: advisorState?.excludedStayIds ?? [],
    dietaryRestricted: true,
  };
  const priorUnknownDiet = Boolean(advisorState?.dietaryRestricted && !advisorState?.dialogue?.context.dietaryRestrictions.length && !profileAnswer);
  const dietRestricted = dialogue.context.dietaryRestrictions.length > 0 || priorUnknownDiet || dietaryConcern(rawMsg);
  const exclusions = excludedNames([rawMsg], advisorState?.excludedNames);
  if (exclusions.length) advisorState = {
    ...advisorState,
    stayId: advisorState?.stayId ?? null,
    excludedStayIds: advisorState?.excludedStayIds ?? [],
    excludedNames: exclusions,
  };
  dialogue.context.excludedPlaces = exclusions;
  const advanced = !knowledge || ["COMPARE_TWO", "COMPARE_PARTIAL_EDIT"].includes(knowledge.intentKey) ? await advancedReply(rawMsg, sessionId, input, {
    dietaryRestricted: dietRestricted,
    excludedNames: exclusions,
    excludedIds: advisorState?.excludedStayIds,
  }) : null;
  if (advanced) knowledge = null;
  const localIntent = request.intent;
  const analyzed =
    profileAnswer || advanced || knowledge || localIntent.category !== "other" && (dialogue.needs.length > 1 || !/\b(va|vua|ket hop|dong thoi)\b/.test(analysisText)) || request.trip
      ? localIntent
      : await analyzeIntent(request.text, deadline);
  const intent: Intent = {
    ...analyzed,
    category:
      localIntent.category !== "other"
        ? localIntent.category
        : analyzed.category,
    budget: localIntent.budget ?? analyzed.budget,
    district: localIntent.district ?? analyzed.district,
    keywords: localIntent.keywords.length
      ? localIntent.keywords
      : analyzed.keywords,
    party_size: localIntent.party_size ?? analyzed.party_size,
    budget_scope: localIntent.budget !== null ? localIntent.budget_scope : analyzed.budget_scope,
  };
  if (analyzed.categories?.length && !profileAnswer && !knowledge) dialogue.needs = [...new Set([...dialogue.needs, ...analyzed.categories])];
  const multiple = dialogue.needs.length > 1 && !profileAnswer && !knowledge && !advanced && intent.category !== "off_topic";
  const multiPlanning = multiple && !dialogue.pendingQuestions.length && dialogue.context.days !== null && dialogue.context.guests !== null && dialogue.context.budget !== null && (["total", "perPerson", "perDay"].includes(dialogue.context.budgetScope ?? "") || dialogue.context.guests === 1 && dialogue.context.days === 1);
  if (multiPlanning) request.trip = true;
  let travelPlan: ChatMessageDto["travelPlan"];
  let recommendationGroups: ChatMessageDto["recommendationGroups"];
  let responseQuestions: string[] = [];

  let replyContent: string = FALLBACK_MESSAGES.noResult;
  let locationNotice = "";
  let cards: ChatPlaceCard[] = [];
  let planningIssue = false;

  const missingLocation =
    /quanh|gần đây|gần tôi|gần vị trí|lân cận/i.test(rawMsg) && !input.location;
  const unsupportedDays = request.trip && unsupportedTripDays(rawMsg);
  const weather = !liveNotice && /thoi tiet|du bao|nhiet do|mua hom nay/.test(
    normalize(rawMsg),
  );
  if (profileAnswer) {
    replyContent = profileAnswer.content;
  } else if (advanced) {
    replyContent = advanced.content;
    travelPlan = advanced.travelPlan;
  } else if (knowledge) {
    replyContent = knowledge.content;
  } else if (unsupportedDays) {
    replyContent =
      "Gô hiện hỗ trợ lịch trình từ 1 đến 3 ngày. Bạn muốn lên trước lịch 3 ngày, hay chọn 1–2 ngày? Mình chưa tạo lịch cho yêu cầu vượt phạm vi này.";
  } else if (weather) {
    replyContent =
      "Gô chưa tích hợp dữ liệu thời tiết trực tiếp nên chưa thể xác nhận dự báo hôm nay. Bạn nên kiểm tra dự báo địa phương trước khi đi. Nếu muốn, mình có thể gợi ý lịch có điểm trong nhà để bạn dự phòng khi trời mưa.";
  } else if (missingLocation) {
    replyContent =
      "Bạn bấm Quanh vị trí tôi và cho phép truy cập vị trí để Gô tìm địa điểm gần bạn nhé. Bạn cũng có thể cho Gô biết quận muốn đến.";
  } else if (intent.category === "off_topic") {
    // Câu hỏi ngoài phạm vi → từ chối cố định, không gọi LLM thêm
    replyContent = FALLBACK_MESSAGES.refuse;
  } else if (multiple && !multiPlanning) {
    const result = dialogue.pendingQuestions.length ? { content: `Gô sẽ phối hợp ${dialogue.needs.map(need => ({ food: "ăn uống", sight: "tham quan", stay: "lưu trú" })[need]).join(", ")}. Để gợi ý đúng ngân sách và thời gian, bạn xác nhận giúp Gô:\n${dialogue.pendingQuestions.map(question => "• " + question.replace("tổng cả nhóm", "tổng cho cả nhóm")).join("\n")}`, groups: [], questions: dialogue.pendingQuestions, warnings: [] } : await multiNeedReply(dialogue, rawMsg, input.location);
    replyContent = result.content;
    recommendationGroups = result.groups;
    responseQuestions = result.questions;
    metadataWarnings.push(...result.warnings);
  } else if (request.trip) {
    onProgress?.({
      type: "status",
      text: "Gô đang ghép lịch sáng–trưa–chiều–tối và đối chiếu giá, địa điểm…",
    });
    const originalBrief = tripBrief(analysisText, previousUserMessages);
    // Parse the canonical facts once: repeating a child's age in the same text
    // would incorrectly count the child twice. Raw wording is retained for search.
    const brief = multiPlanning
      ? tripBrief(planningText(dialogue) + ". " + preferenceContext(originalBrief.preferences), previousUserMessages)
      : originalBrief;
    if (multiPlanning) {
      brief.fresh = originalBrief.fresh;
      brief.freeOnly = originalBrief.freeOnly;
      brief.issues = [...new Set([...brief.issues, ...originalBrief.issues])];
      brief.request.interests = originalBrief.request.interests;
      brief.text += ". " + analysisText;
    }
    advisorState = {
      stayId: brief.fresh ? null : advisorState?.stayId ?? null,
      excludedStayIds: brief.fresh ? [] : advisorState?.excludedStayIds ?? [],
      tripContext: tripContext(brief),
      dietaryRestricted: brief.fresh ? dietaryConcern(brief.text) : dietRestricted,
      excludedNames: brief.fresh ? excludedNames([rawMsg]) : exclusions,
    };
    if (brief.issues.length) {
      planningIssue = true;
      replyContent =
        brief.issues.join("\n\n") +
        "\n\nMình chưa tạo lịch mới để tránh xếp sai điều kiện của chuyến đi.";
    } else if (brief.questions.length) {
      responseQuestions = brief.questions;
      planningIssue = true;
      replyContent = "Để không hiểu sai ngân sách hoặc tính nhầm đêm lưu trú, bạn xác nhận giúp mình:\n" + brief.questions.map(q => "• " + q).join("\n");
    } else {
      const changeStay =
        /\b(doi|thay)\b.*\b(khach san|luu tru|cho o|homestay)\b/.test(
          normalize(rawMsg),
        );
      const excludedStayIds = brief.fresh
        ? []
        : [
            ...new Set([
              ...(advisorState?.excludedStayIds ?? []),
              ...(changeStay && advisorState?.stayId
                ? [advisorState.stayId]
                : []),
            ]),
          ].slice(-60);
      const [sights, food, stays] = await Promise.all([
        searchPlacesForChat({
          placeType: "ATTRACTION",
          limit: 100,
          budget: brief.freeOnly ? 0 : null,
        }),
        searchPlacesForChat({
          placeType: "RESTAURANT",
          limit: 100,
          tastes: intent.tastes,
        }),
        searchPlacesForChat({
          placeType: "ACCOMMODATION",
          limit: 60,
          cheapestFirst: true,
          partySize: brief.request.guests,
        }),
      ]);
      travelPlan = buildTravelPlan(
        brief.request,
        brief.text,
        {
          sights: sights.filter(p => !isExcluded(p.name, advisorState?.excludedNames ?? [])),
          food: food.filter(p => !isExcluded(p.name, advisorState?.excludedNames ?? [])),
          stays: stays.filter(p => !isExcluded(p.name, advisorState?.excludedNames ?? [])),
        },
        {
          freeOnly: brief.freeOnly,
          excludeStayIds: excludedStayIds,
          preferences: brief.preferences,
          dietaryRestricted: advisorState.dietaryRestricted,
        },
      );
      travelPlan = attachPlanCosts(travelPlan, [...sights, ...food, ...stays]);
      advisorState = {
        stayId:
          travelPlan.groups.find((group) => group.title.startsWith("Lưu trú"))
            ?.places[0]?.placeId ?? null,
        excludedStayIds,
        tripContext: tripContext(brief),
        dietaryRestricted: advisorState.dietaryRestricted,
        excludedNames: advisorState.excludedNames,
      };
      replyContent = planIntroduction(travelPlan);
    }
  } else if (intent.category === "stay" && tripBudget([rawMsg]).hasLodging) {
    planningIssue = true;
    replyContent = "Mình ghi nhận bạn đã có hoặc không cần chỗ ở, nên chưa gợi ý khách sạn khác. Nếu muốn dùng nơi ở làm điểm mốc, bạn cho biết tên cơ sở nhé; mình chưa mặc định biết vị trí của khách sạn.";
  } else if (intent.category === "food" && dietRestricted) {
    replyContent = dietaryNotice;
  } else if (intent.budget !== null && intent.budget > 0 && intent.budget_scope === null && intent.party_size !== 1) {
    planningIssue = true;
    replyContent = "Ngân sách bạn nêu là cho mỗi người, mỗi phòng mỗi đêm hay tổng cả nhóm? Bạn cho biết số người và phạm vi giá để Gô lọc đúng nhé.";
  } else if (intent.category === "other") {
    replyContent =
      "👋 Mình là Gô, trợ lý du lịch DaNangGo. Bạn muốn tìm quán ăn, chỗ ở hay điểm tham quan? Hãy cho mình biết khu vực và ngân sách nhé!";
  } else {
    // 2. Truy xuất địa điểm từ DB theo intent
    const placeType =
      intent.category in CATEGORY_TO_DB
        ? CATEGORY_TO_DB[intent.category as PlaceType]
        : undefined;
    const budget = request.freeOnly
      ? 0
      : intent.budget != null &&
          intent.budget_scope === "total" &&
          intent.party_size
        ? Math.floor(intent.budget / intent.party_size)
        : intent.budget;
    onProgress?.({
      type: "status",
      text: "Đang tìm địa điểm phù hợp trong dữ liệu DaNangGo…",
    });
    const nearMyKhe =
      !/quanh|gần đây|gần tôi|gần vị trí|lân cận/i.test(rawMsg) &&
      placeType === "ACCOMMODATION" &&
      intent.keywords.some((k) => normalize(k) === "my khe") &&
      /gan|bien/.test(normalize(rawMsg));
    const anchor = nearMyKhe ? await findChatAnchor("Mỹ Khê") : null;
    let retrieved = await searchPlacesForChat({
      placeType,
      district: intent.district,
      budget,
      keywords: anchor
        ? intent.keywords.filter((k) => normalize(k) !== "my khe")
        : intent.keywords,
      limit: 10,
      strictKeywords: true,
      cheapestFirst: request.cheap,
      tastes: placeType === "RESTAURANT" ? intent.tastes : [],
      location: /quanh|gần đây|gần tôi|gần vị trí|lân cận/i.test(rawMsg)
        ? input.location
        : anchor
          ? {
              latitude: anchor.latitude,
              longitude: anchor.longitude,
              radiusKm: 2,
            }
          : undefined,
      distanceOriginName: anchor ? "biển Mỹ Khê" : undefined,
    });
    // A locality mentioned in an official description is not a measured GPS distance.
    // This fallback never applies to requests around the user's current location.
    if (nearMyKhe && anchor && retrieved.length === 0) {
      retrieved = await searchPlacesForChat({
        placeType,
        district: intent.district,
        budget,
        keywords: intent.keywords,
        limit: 10,
        strictKeywords: true,
        referenceOnly: true,
        cheapestFirst: request.cheap,
      });
      if (retrieved.length) {
        locationNotice =
          "\n\nNguồn chính thức mô tả các cơ sở này thuộc khu vực Mỹ Khê. Chưa đủ tọa độ để tính khoảng cách; bạn hãy kiểm tra địa chỉ trước khi đi.";
      }
    }
    // Recheck category and budget even when a repository/provider returns unexpected data.
    const rows = retrieved.filter(
      (row) =>
        (!placeType || row.placeType === placeType) &&
        !isExcluded(row.name, exclusions) &&
        (budget == null || (row.priceMin !== null && row.priceMin <= budget)),
    );
    const byId = new Map(rows.map((r) => [r.placeId, r]));
    onProgress?.({
      type: "candidates",
      places: rows.slice(0, 3).map((r) => toCard(r)),
    });
    onProgress?.({
      type: "status",
      text: "Đã tra cứu dữ liệu, Gô đang soạn câu trả lời…",
    });

    // 3. Gemini trả lời dựa trên <PLACES>
    const raw = await prompt(
      buildChatPrompt({
        message: rawMsg,
        places: rows.map(toPlaceContext),
        history,
        intent,
      }),
    );

    let answered = false;
    if (raw) {
      try {
        // 4. Kiểm tra schema + lọc id ngoài danh sách
        const answer = groundChatAnswer(
          safeParseJson(ChatAnswerSchema, raw),
          rows,
          intent,
        );
        replyContent = answer.message;
        cards = answer.places.map((p) => toCard(byId.get(p.id)!, p.reason));
        answered = answer.places.length > 0 || rows.length === 0;
        console.log("[ChatService] Gemini trả lời thành công");
      } catch (e) {
        console.warn("[ChatService] Chat JSON không hợp lệ, dùng dữ liệu DB.");
      }
    }

    if (!answered) {
      // Dự phòng: hiện thẳng kết quả DB, không qua LLM
      if (rows.length > 0) {
        replyContent = FALLBACK_MESSAGES.fallback;
        cards = rows.slice(0, 3).map((r) => toCard(r));
      } else {
        replyContent = FALLBACK_MESSAGES.noResult;
      }
      console.log("[ChatService] Dùng phương án dự phòng");
    }
  }

  if (
    !planningIssue &&
    !profileAnswer && !recommendationGroups &&
    !advanced &&
    !knowledge &&
    !unsupportedDays &&
    !weather &&
    !travelPlan &&
    cards.length &&
    intent.category !== "off_topic"
  ) {
    // Rich, factual counselling is available even if the model is unavailable.
    const facts = cards.map((card) => ({
      ...card,
      priceMin: null,
      priceMax: null,
      description: null,
    }));
    replyContent = consultationText(
      facts,
      intent.category,
      request.freeOnly,
      request.cheap,
    );
  } else if (
    !planningIssue &&
    !profileAnswer && !recommendationGroups &&
    !advanced &&
    !knowledge &&
    !unsupportedDays &&
    !weather &&
    !missingLocation &&
    !(intent.category === "food" && dietRestricted) &&
    !travelPlan &&
    !cards.length &&
    !["other", "off_topic"].includes(intent.category)
  ) {
    replyContent = consultationText(
      [],
      intent.category,
      request.freeOnly,
      request.cheap,
    );
  }
  replyContent += locationNotice;
  if (liveNotice) replyContent = liveNotice.content + "\n\n" + replyContent;
  replyContent = replyContent.replace(/mình/gi, "Gô");
  if (!missingLocation && intent.category === "food" && intent.tastes.length)
    replyContent += `\n\nKhẩu vị: ${intent.tastes.join(", ")} (theo nhãn món ăn trong dữ liệu). Bạn nên xác nhận cách nêm nếm với quán trước khi gọi món.`;
  if (
    intent.category === "food" &&
    /dị ứng|ăn chay|không cay|ít cay/i.test(rawMsg)
  )
    replyContent +=
      "\n\nDữ liệu chưa xác minh đầy đủ thành phần, dị ứng hoặc mức cay. Bạn cần hỏi trực tiếp quán; Gô chưa thể bảo đảm các tiêu chí này.";
  const meta = getCategoryMeta(intent.category);
  const quickReplies = profileAnswer ? [] : recommendationGroups
    ? responseQuestions.length ? [] : dialogue.needs.flatMap(need => need === "food" ? ["Gợi ý món ăn địa phương"] : need === "sight" ? ["Ưu tiên điểm tham quan miễn phí"] : ["Tìm lưu trú gần biển"])
    : advanced && !travelPlan
    ? []
    : knowledge
    ? knowledge.quickReplies ?? []
    : planningIssue
    ? []
    : travelPlan
      ? [
          "Đổi sang các điểm tham quan miễn phí",
          "Ưu tiên điểm check-in chụp hình",
          ...(travelPlan.groups.some(group => group.title.startsWith("Lưu trú")) ? ["Đổi khách sạn tiết kiệm hơn"] : []),
        ]
      : meta.quickReplies;
  const actionLink = planningIssue
    ? undefined
    : knowledge
    ? knowledge.actionLink
    : travelPlan
    ? { text: "Mở công cụ tạo và lưu lịch trình", url: "/lich-trinh/tao-moi" }
    : meta.actionLink;

  if (!responseQuestions.length && travelPlan?.questions?.length) responseQuestions = travelPlan.questions.slice(0, 3);
  if (!responseQuestions.length && !recommendationGroups) responseQuestions = (replyContent.match(/[^\n.!?]+\?/g) ?? []).map(question => question.trim()).filter(question => question.length <= 250).slice(0, 3);
  const newlyStated = explicitPreferences(rawMsg);
  const suggestions = !profileAnswer && input.userId && responseQuestions.length < 3
    ? profileSuggestions(newlyStated.filter(key => !savedPreferences.includes(key))) : [];
  if (suggestions.length) dialogue.profilePending = suggestions.map(item => item.key);
  const kind: ResponseMetadata["intent"] = profileAnswer ? "PROFILE" : advanced?.comparison ? "COMPARE" : advanced?.travelPlan ? "MODIFY_ITINERARY"
    : knowledge?.intentKey === "RT_WEATHER" ? "WEATHER" : knowledge?.intentKey === "RT_EVENT" ? "EVENT" : knowledge?.intentKey.startsWith("MOVE_") ? "DIRECTIONS"
    : intent.category === "off_topic" ? "OFF_TOPIC" : request.trip || multiple && dialogue.context.budget !== null ? "ITINERARY" : "SEARCH";
  const allCards = [...cards, ...(recommendationGroups?.flatMap(group => group.places) ?? []), ...(travelPlan?.groups.flatMap(group => group.places) ?? []), ...(travelPlan?.days.flatMap(day => day.periods.flatMap(period => period.items.flatMap(item => item.place ? [item.place] : []))) ?? []), ...(advanced?.comparison?.places ?? [])];
  const foodIds = allCards.filter(card => card.placeType === "RESTAURANT").map(card => card.placeId);
  if (foodIds.length) {
    try { const menus = await chatMenus(foodIds); for (const card of allCards) if (card.placeType === "RESTAURANT") card.menuItems = menus.get(card.placeId) ?? []; }
    catch { metadataWarnings.push("Chưa tải được tên món trong menu; Gô không tự tạo món hoặc giá món."); }
  }
  const sources = allCards.flatMap(card => [card.stayFacts?.hours, ...(card.stayFacts?.rooms ?? []), ...(card.stayFacts?.publicRates ?? [])].flatMap(fact => fact ? [{ url: fact.sourceUrl, checkedOn: fact.checkedOn, label: card.name, scope: "Thông tin lưu trú công bố; chưa xác nhận giá hoặc phòng theo ngày" }] : []));
  const metadata: ResponseMetadata = { intent: kind, secondaryIntents: [...dialogue.needs.map(need => ({ food: "FOOD", sight: "SIGHT", stay: "STAY" })[need]), ...(liveNotice ? [liveNotice.intentKey === "RT_WEATHER" ? "WEATHER" : liveNotice.intentKey === "RT_EVENT" ? "EVENT" : "LIVE_DATA"] : [])], needsClarification: responseQuestions.length > 0, questions: responseQuestions,
    confirmedContext: dialogue.context, profileSuggestions: suggestions, sources: [...new Map(sources.map(source => [source.url + source.checkedOn, source])).values()], warnings: metadataWarnings };
  advisorState = { stayId: null, excludedStayIds: [], ...advisorState, dietaryRestricted: dietRestricted, dialogue };

  const aiMessage: ChatMessageDto = {
    id: `ai_${randomUUID()}`,
    sender: "AI",
    content: replyContent!,
    ...metadata,
    places: cards.length > 0 ? cards : undefined,
    travelPlan,
    ...(recommendationGroups ? { recommendationGroups } : {}),
    ...(advanced?.comparison ? { comparison: advanced.comparison } : {}),
    quickReplies,
    actionLink: intent.category === "off_topic" || recommendationGroups || profileAnswer ? undefined : actionLink,
    createdAt: new Date().toISOString(),
  };

  await conversation.save(
    "AI",
    advisorState
      ? writeAdvisorTurn(replyContent!, advisorState)
      : replyContent!,
    cards.map((c) => c.placeId),
    aiMessage,
  );

  return { sessionId, message: aiMessage };
}
