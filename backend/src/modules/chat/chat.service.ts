import { editTravelPlan, updateEditedPlanPreferences, withPlanItemIds } from "./chat.plan-edit";
import { clock, minutes as clockMinutes } from "./chat.trip-preferences";
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
import { favoritesReply } from "./chat.favorites";
import { favoritePlanReply, isFavoritePlanRequest } from "./chat.favorite-plan";
import { favoriteConsultReply, isFavoriteConsultRequest } from "./chat.favorite-consult";
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
import { conversationMessages } from "./chat.history";
import { handleWeatherChat, isWeatherQuestion, type WeatherChatResult } from "./chat.weather";
import type { WeatherFetcher } from "../weather/weather.service";
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
  options?: { weatherFetcher?: WeatherFetcher; now?: Date },
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

  // Explicit private-list reads bypass taste memory, catalog search and the model.
  const favoriteSafety: {dietaryRestricted?:boolean;notice?:string} = {
    dietaryRestricted: !!advisorState?.dialogue?.context.dietaryRestrictions.length,
  };
  if ((isFavoritePlanRequest(rawMsg, !!advisorState?.favorites) || advisorState?.favoritePlan || isFavoriteConsultRequest(rawMsg, !!(advisorState?.favorites || advisorState?.favoriteConsult))) && input.userId && (input.userRole === 'USER' || input.userRole === 'PARTNER')) {
    try {
      const preferences = await readProfile(input.userId);
      favoriteSafety.dietaryRestricted ||= preferences.some(key=>key.startsWith('allergy_') || ['vegetarian','vegan','avoid_seafood','avoid_gluten'].includes(key));
    } catch {
      favoriteSafety.dietaryRestricted = true;
      favoriteSafety.notice = 'Chưa tải được khẩu vị/điều kiện ăn uống đã lưu; Gô chưa xếp quán ăn để tránh bỏ sót hạn chế của bạn.';
    }
  }
  const favoriteConsultAnswer = await favoriteConsultReply(rawMsg,input,advisorState?.favoriteConsult,!!(advisorState?.favorites || advisorState?.favoritePlan),undefined,favoriteSafety);
  const favoritePlanAnswer = favoriteConsultAnswer ? null : await favoritePlanReply(rawMsg, input, advisorState?.favoritePlan, !!advisorState?.favorites, undefined, favoriteSafety);
  const favoriteAnswer = favoriteConsultAnswer ? {
    content:favoriteConsultAnswer.content,places:favoriteConsultAnswer.places,cursor:undefined,
    quickReplies:favoriteConsultAnswer.quickReplies ?? [],actionLink:!input.userId?{text:'Đăng nhập để tư vấn từ yêu thích',url:'/dang-nhap?redirect=%2Fchat'}:undefined,
  } : favoritePlanAnswer ? {
    content: favoritePlanAnswer.content, places: undefined, cursor: undefined,
    quickReplies: [], actionLink: !input.userId ? {text:'Đăng nhập để lập lịch từ yêu thích',url:'/dang-nhap?redirect=%2Fchat'} : undefined,
  } : await favoritesReply(rawMsg, input, advisorState?.favorites);
  if (favoriteAnswer) {
    const warnings: string[] = [];
    const places = favoriteAnswer.places ?? [];
    const plan = favoritePlanAnswer?.travelPlan;
    const allPlaces = [...places, ...(favoriteConsultAnswer?.comparison?.places ?? []), ...(plan?.groups.flatMap(group=>group.places) ?? []), ...(plan?.days.flatMap(day=>day.periods.flatMap(period=>period.items.flatMap(item=>item.place?[item.place]:[]))) ?? [])];
    const foodIds = [...new Set(allPlaces.filter(place => place.placeType === 'RESTAURANT').map(place => place.placeId))];
    if (foodIds.length) {
      try {
        const menus = await chatMenus(foodIds);
        for (const place of allPlaces) if (place.placeType === 'RESTAURANT') place.menuItems = menus.get(place.placeId) ?? [];
      } catch { warnings.push('Chưa tải được menu hiện tại; Gô không tự thêm món hoặc giá.'); }
    }
    const message: ChatMessageDto = {
      id: `ai_${randomUUID()}`, sender: 'AI', content: favoriteAnswer.content,
      intent: plan ? 'ITINERARY' : favoriteConsultAnswer?.comparison ? 'COMPARE' : 'FAVORITES', ...(places.length ? { places } : {}),
      ...(favoriteConsultAnswer?.comparison ? {comparison:favoriteConsultAnswer.comparison}:{}),
      ...(plan ? {travelPlan:plan} : {}),
      ...(favoritePlanAnswer?.questions?.length ? {questions:favoritePlanAnswer.questions,needsClarification:true} : {}),
      quickReplies: favoriteAnswer.quickReplies, actionLink: favoriteAnswer.actionLink,
      warnings, createdAt: new Date().toISOString(),
    };
    const state: AdvisorState = {
      stayId: null, excludedStayIds: [], ...advisorState, favorites: favoriteAnswer.cursor,
      favoritePlan: favoritePlanAnswer ? favoritePlanAnswer.state : advisorState?.favoritePlan,
      favoriteConsult:favoriteConsultAnswer?.state,
    };
    await conversation.save('AI', writeAdvisorTurn(message.content, state), [...new Set(allPlaces.map(place => place.placeId))], message);
    return { sessionId, message };
  }

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
  if (knowledge && (knowledge.intentKey === "RT_WEATHER" || knowledge.intentKey === "TRAVEL_SEASON") && isWeatherQuestion(rawMsg)) {
    knowledge = null;
  }
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
  let rescuePreview: AdvisorState["rescuePreview"];
  let weatherResult: WeatherChatResult | null = null;
  if (!profileAnswer && !advanced && !knowledge && !liveNotice && isWeatherQuestion(rawMsg)) {
    const scopedMessages = await (async () => {
      const messages = await conversationMessages(sessionId, { guestId: input.guestId, userId: input.userId });
      const reset = messages.map((turn) => turn.sender === "USER" && isRestart(turn.content)).lastIndexOf(true);
      return messages.slice(reset + 1);
    })();
    const latestWeatherPlan = [...scopedMessages].reverse().find((turn) => turn.travelPlan);
    const latestTravelPlan = latestWeatherPlan?.travelPlan;
    weatherResult = await handleWeatherChat({
      rawMsg,
      hasOtherNeeds: dialogue.needs.length > 0,
      advisorState,
      latestTravelPlan,
      constraints: {
        dietaryRestricted: dietRestricted,
        excludedIds: advisorState?.excludedStayIds,
        excludedNames: exclusions,
      },
      now: options?.now,
      weatherFetcher: options?.weatherFetcher,
    });
    if (weatherResult) {
      if (weatherResult.rescueChange && latestWeatherPlan) rescuePreview = { ...weatherResult.rescueChange, planKey: String(latestWeatherPlan.id) };
      metadataWarnings.push(...weatherResult.warnings);
      if (weatherResult.nextWeatherContext) {
        advisorState = {
          stayId: advisorState?.stayId ?? null,
          excludedStayIds: advisorState?.excludedStayIds ?? [],
          ...advisorState,
          weatherContext: weatherResult.nextWeatherContext,
        };
      }
    }
  }
  const applyRescue = analysisText === "ap dung phuong an cuu lich";
  const closedRescue = /\bdong cua\b/.test(analysisText) && /\b(trong lich|cuu lich)\b/.test(analysisText);
  if ((applyRescue || closedRescue) && !profileAnswer) {
    const messages = await conversationMessages(sessionId, { guestId: input.guestId, userId: input.userId });
    const reset = messages.map(turn => turn.sender === "USER" && isRestart(turn.content)).lastIndexOf(true);
    const latest = messages.slice(reset + 1).reverse().find(turn => turn.travelPlan);
    const plan = latest?.travelPlan;
    const pending = advisorState?.rescuePreview;
    if (plan && latest && applyRescue && pending?.planKey === String(latest.id)) {
      const results = await Promise.all(pending.placeIds.map(placeId => searchPlacesForChat({ placeId, limit: 1 })));
      const edited = editTravelPlan(plan, pending.command, results.flat(), { dietaryRestricted: dietRestricted, excludedNames: exclusions });
      travelPlan = edited.plan;
      replyContent = edited.content;
    } else if (plan && latest && closedRescue) {
      const items = withPlanItemIds(plan).days.flatMap(day => day.periods.flatMap(period =>
        period.items.filter(item => item.place && analysisText.includes(normalize(item.place.name)))));
      const item = items.length === 1 ? items[0] : undefined;
      if (item) {
        const command = `Bỏ ${item.id}`;
        const edited = editTravelPlan(plan, command, []);
        if (edited.plan) {
          rescuePreview = { command, placeIds: [], planKey: String(latest.id) };
          const tickets = edited.plan.costs.tickets;
          replyContent = `Xem trước: bỏ ${item.place!.name} khỏi lịch vì bạn báo điểm này đã đóng cửa. Giữ các mục còn lại. Tiền vé sau khi bỏ: ${tickets == null ? "chưa xác định" : tickets.toLocaleString("vi-VN") + "đ"}. Bạn muốn áp dụng không?`;
        }
      } else replyContent = "Bạn nhập tên đầy đủ của một địa điểm đang đóng cửa trong lịch nhé?";
    } else replyContent = applyRescue ? "Bản xem trước đã hết hiệu lực. Bạn yêu cầu Gô xem lại lịch nhé?" : "Bạn cần tạo lịch trong cuộc trò chuyện này trước.";
  }
  const delay = analysisText.match(/\bden (?:tre|muon)\s*(\d+)\s*(gio|tieng|phut)\b/);
  const applyArrival = analysisText === "ap dung gio den moi";
  const arrivalRescue = Boolean(delay || applyArrival);
  let arrivalPreview: AdvisorState["arrivalPreview"];
  const addRequest = analysisText.match(/^xem truoc them diem #(\d{1,10})(?: ngay (\d{1,2}) buoi (sang|trua|chieu|toi))?$/);
  const applyPlace = analysisText === "ap dung them vao lich";
  const addingPlace = Boolean(addRequest || applyPlace);
  let addPlacePreview: AdvisorState["addPlacePreview"];
  let addPlaceReplies: string[] = [];
  if (addingPlace && !profileAnswer) {
    const messages = await conversationMessages(sessionId, { guestId: input.guestId, userId: input.userId });
    const reset = messages.map(turn => turn.sender === "USER" && isRestart(turn.content)).lastIndexOf(true);
    const scoped = messages.slice(reset + 1);
    const latest = [...scoped].reverse().find(turn => turn.travelPlan);
    const plan = latest?.travelPlan;
    const pending = advisorState?.addPlacePreview;
    const placeId = applyPlace ? pending?.placeId : Number(addRequest?.[1]);
    const day = applyPlace ? pending?.day : Number(addRequest?.[2]);
    const slot = applyPlace ? pending?.slot : addRequest?.[3] as NonNullable<AdvisorState["addPlacePreview"]>["slot"] | undefined;
    const offered = scoped.some(turn => turn.sender === "AI" && turn.places?.some(place => place.placeId === placeId && place.routeOrigin));
    if (!plan || !latest) {
      replyContent = "Bạn cần tạo lịch trong cuộc trò chuyện này trước khi thêm địa điểm.";
    } else if (!offered || !placeId || (applyPlace && pending?.planKey !== String(latest.id))) {
      replyContent = "Bạn mở lại thẻ gợi ý và chọn Thêm vào lịch để xem trước nhé.";
    } else if (!day || !slot) {
      replyContent = "Bạn muốn thêm địa điểm vào ngày và buổi nào?";
      addPlaceReplies = plan.days.flatMap(entry => ["sáng", "trưa", "chiều", "tối"].map(period =>
        `Xem trước thêm điểm #${placeId} ngày ${entry.day} buổi ${period}`));
    } else {
      const rows = await searchPlacesForChat({ placeId, placeType: "ATTRACTION", limit: 1 });
      const row = rows[0];
      if (!row) {
        replyContent = "Địa điểm này hiện chưa có trong danh mục tham quan.";
      } else {
        const result = editTravelPlan(plan, `Thêm điểm tham quan ngày ${day} buổi ${slot}`, rows, {
          dietaryRestricted: dietRestricted, excludedNames: exclusions,
        });
        if (!result.plan) {
          replyContent = result.content;
        } else if (applyPlace) {
          travelPlan = result.plan;
          replyContent = result.content;
        } else {
          addPlacePreview = { placeId, day, slot, planKey: String(latest.id) };
          const item = result.plan.days.flatMap(entry => entry.periods.flatMap(period => period.items)).find(entry => entry.place?.placeId === placeId);
          const price = item?.estimatedCost;
          replyContent = `Xem trước: ${row.name}, ngày ${day}${item ? ` lúc ${item.title.slice(0, 5)}` : ""}. Tiền vé phát sinh ${price == null ? "chưa xác định" : price.toLocaleString("vi-VN") + "đ"}. Giờ tham quan và chi phí đi lại cần kiểm tra thêm. Bạn muốn áp dụng không?`;
          addPlaceReplies = ["Áp dụng thêm vào lịch"];
        }
      }
    }
  }
  if (arrivalRescue && !profileAnswer) {
    const messages = await conversationMessages(sessionId, { guestId: input.guestId, userId: input.userId });
    const reset = messages.map(turn => turn.sender === "USER" && isRestart(turn.content)).lastIndexOf(true);
    const latest = messages.slice(reset + 1).reverse().find(turn => turn.travelPlan);
    const plan = latest?.travelPlan;
    const pending = advisorState?.arrivalPreview;
    const oldTime = plan?.preferences?.arrivalTime;
    const delayMinutes = delay ? Number(delay[1]) * (delay[2] === "phut" ? 1 : 60) : 0;
    const newMinutes = oldTime ? clockMinutes(oldTime) + delayMinutes : null;
    const time = applyArrival
      ? pending?.planKey === String(latest?.id) ? pending?.time : undefined
      : newMinutes !== null && newMinutes < 1440 && delayMinutes > 0 ? clock(newMinutes) : undefined;
    if (!plan || !time) {
      replyContent = applyArrival
        ? "Bản xem trước không còn khả dụng. Bạn cho Gô biết mức trễ để xem lại nhé?"
        : !plan ? "Bạn cần có lịch trình trong cuộc trò chuyện để Gô kiểm tra các mục bị ảnh hưởng."
        : "Bạn cho Gô biết giờ đến mới và ngày đến để tính lại lịch nhé?";
    } else {
      const result = updateEditedPlanPreferences(plan, `Đến Đà Nẵng lúc ${time}`);
      if (!result.plan || result.plan.preferences?.arrivalTime !== time) {
        replyContent = "Gô chưa thể áp dụng giờ đến này. Bạn kiểm tra lại giờ đến và giờ về nhé?";
      } else if (applyArrival) {
        replyContent = `Đã đổi giờ đến trong lịch chat sang ${time}. ${result.content}`;
        travelPlan = result.plan;
      } else {
        arrivalPreview = { time, planKey: String(latest.id) };
        const remainingIds = new Set(result.plan.days.flatMap(day => day.periods.flatMap(period => period.items.map(item => item.id ?? item.title))));
        const removed = plan.days.flatMap(day => day.periods.flatMap(period => period.items.filter(item => !item.kind && !remainingIds.has(item.id ?? item.title)).map(item => item.place?.name ?? item.title)));
        const dinner = result.plan.days[0]?.periods.find(period => period.label === "Tối")?.items
          .filter(item => item.place?.placeType === "RESTAURANT").map(item => item.place!.name) ?? [];
        replyContent = `Xem trước giờ đến mới ${time}. ${removed.length ? `Bỏ khỏi lịch: ${removed.join(", ")}. ` : "Các điểm tham quan và ăn uống vẫn vừa khung giờ. "}${dinner.length ? `Giữ bữa tối tại ${dinner.join(", ")}. ` : ""}Bạn có muốn áp dụng giờ đến mới không?`;
      }
    }
  }
  const previousNearby = advisorState?.nearbyContext;
  const areaMatch = /\b(?:gan|dang o) (cau rong|my khe)\b/.exec(analysisText);
  const area = areaMatch?.[1] === "cau rong" ? "Cầu Rồng" : areaMatch ? "Mỹ Khê" : undefined;
  const selectingRestaurant = previousNearby && /\b(chon|lay|an o|den quan)\b/.test(analysisText)
    ? previousNearby.offered.filter(name => analysisText.includes(normalize(name)))
    : [];
  const closer = /\b(xa qua|gan hon)\b/.test(analysisText);
  const alternative = /\b(dong cua roi|cho khac|doi cho khac)\b/.test(analysisText);
  const namedNearby = previousNearby?.shown?.filter(place => analysisText.includes(normalize(place.name))) ?? [];
  const walking = /\bdi bo\b/.test(analysisText);
  const indoor = /\b(trong nha|neu mua thi sao)\b/.test(analysisText);
  const moved = area && /\bdang o\b/.test(analysisText);
  const coffeeNearby = previousNearby && /\b(ca phe|cafe)\b/.test(analysisText) && /\b(gan day|gan do|quanh day)\b/.test(analysisText);
  const minutesMatch = /\b(\d{1,4})\s*phut\b/.exec(analysisText);
  const minutes = minutesMatch ? Number(minutesMatch[1]) : 0;
  const remainingMinutes = minutes > 0 && minutes <= 1440 ? minutes : undefined;
  const needsNearby = Boolean(previousNearby?.checkin && (closer || alternative || walking || indoor));
  const nearbyCheckin = previousNearby && !area && !request.trip && (
    /\b(an xong|tam xong)\b.*\b(check[ -]in|chup|di dau|ghe dau)\b/.test(analysisText) ||
    /\b(di dau tiep|ghe dau tiep)\b/.test(analysisText) ||
    needsNearby || previousNearby.checkin && remainingMinutes !== undefined || previousNearby.checkin && /^(?:cho nao|cho |mien phi|buoi toi|view dep)/.test(analysisText)
      && /\b(mien phi|buoi toi|view dep)\b/.test(analysisText)
  );
  let nearbyContext: AdvisorState["nearbyContext"];
  if (profileAnswer) {
    replyContent = profileAnswer.content;
  } else if (arrivalRescue || addingPlace || applyRescue || closedRescue) {
    // The preview or confirmed edit was prepared from the latest chat plan above.
  } else if (moved) {
    nearbyContext = { area, offered: [], checkin: false, free: false, evening: false };
    replyContent = `Gô sẽ dùng ${area} làm mốc cho lượt tìm tiếp theo.`;
  } else if (coffeeNearby) {
    nearbyContext = previousNearby;
    const coordinates = await findChatAnchor(nearbyContext.area);
    const rows = coordinates ? await searchPlacesForChat({
      placeType: "RESTAURANT", keywords: ["cà phê"], strictKeywords: true,
      location: { ...coordinates, radiusKm: 2 }, distanceOriginName: nearbyContext.area, limit: 3,
    }) : [];
    cards = rows.filter(row => !isExcluded(row.name, exclusions)).map(row => toCard(row));
    replyContent = cards.length
      ? `Quán cà phê quanh ${nearbyContext.area}: ${cards.map(card => card.name).join(", ")}.`
      : `Gô chưa tìm được quán cà phê có dữ liệu phù hợp quanh ${nearbyContext.area}.`;
  } else if (advanced && !needsNearby) {
    replyContent = advanced.content;
    travelPlan = advanced.travelPlan;
  } else if (knowledge && !needsNearby) {
    replyContent = knowledge.content;
  } else if (unsupportedDays) {
    replyContent =
      "Gô hiện hỗ trợ lịch trình từ 1 đến 3 ngày. Bạn muốn lên trước lịch 3 ngày, hay chọn 1–2 ngày? Mình chưa tạo lịch cho yêu cầu vượt phạm vi này.";
  } else if (weatherResult && !weatherResult.multiNeedPrefix && !needsNearby) {
    replyContent = weatherResult.content;
    if (weatherResult.places?.length) cards = weatherResult.places;
    if (weatherResult.travelPlan) travelPlan = weatherResult.travelPlan;
  } else if (missingLocation && !needsNearby) {
    replyContent =
      "Bạn bấm Quanh vị trí tôi và cho phép truy cập vị trí để Gô tìm địa điểm gần bạn nhé. Bạn cũng có thể cho Gô biết quận muốn đến.";
  } else if (intent.category === "off_topic") {
    // Câu hỏi ngoài phạm vi → từ chối cố định, không gọi LLM thêm
    replyContent = FALLBACK_MESSAGES.refuse;
  } else if (previousNearby && selectingRestaurant.length === 1 && !nearbyCheckin) {
    nearbyContext = { ...previousNearby, restaurant: selectingRestaurant[0]!, checkin: false, free: false, evening: false };
    replyContent = `Gô sẽ dùng ${nearbyContext.restaurant} làm mốc nếu bạn muốn tìm điểm ghé tiếp.`;
  } else if (nearbyCheckin && walking) {
    nearbyContext = previousNearby;
    replyContent = `Gô đang dùng ${previousNearby.restaurant ?? previousNearby.area} làm mốc. Khoảng cách đã hiển thị là đường chim bay. Bạn chọn điểm đến trên bản đồ và xem tuyến đi bộ để kiểm tra.`;
  } else if (nearbyCheckin && alternative && (previousNearby.shown?.length ?? 0) > 1 && namedNearby.length !== 1 && !/\bcho khac\b/.test(analysisText)) {
    nearbyContext = previousNearby;
    replyContent = "Bạn cho Gô tên điểm đang đóng cửa để Gô bỏ đúng điểm nhé?";
  } else if (nearbyCheckin) {
    nearbyContext = {
      ...previousNearby,
      checkin: true,
      minutes: remainingMinutes ?? previousNearby.minutes,
      indoor: previousNearby.indoor || indoor,
      budget: intent.budget ?? previousNearby.budget,
      rejected: [...new Set([...(previousNearby.rejected ?? []), ...(alternative ? (namedNearby.length === 1 ? namedNearby : previousNearby.shown ?? []).map(place => place.id) : [])])].slice(-60),
      free: previousNearby.free || /\bmien phi\b/.test(analysisText),
      evening: previousNearby.evening || /\b(buoi toi|toi nay)\b/.test(analysisText),
    };
    const origin = nearbyContext.restaurant ?? nearbyContext.area;
    const coordinates = await findChatAnchor(origin, Boolean(nearbyContext.restaurant));
    const rows = coordinates ? await searchPlacesForChat({
      placeType: "ATTRACTION",
      budget: nearbyContext.free ? 0 : nearbyContext.budget,
      location: { ...coordinates, radiusKm: 2 },
      distanceOriginName: origin,
      limit: 10,
    }) : [];
    const previousDistances = (previousNearby.shown ?? []).flatMap(place => place.km === null ? [] : [place.km]);
    const closerThan = previousDistances.length ? Math.min(...previousDistances) : null;
    const context = nearbyContext;
    const matches = rows.filter(row =>
      !isExcluded(row.name, exclusions) &&
      !context.rejected?.includes(row.placeId) &&
      (!context.free || row.priceMin === 0) &&
      (!closer || (closerThan !== null && row.distanceKm != null && row.distanceKm < closerThan)) &&
      (context.minutes === undefined || row.visitDurationMinutes == null || row.visitDurationMinutes <= context.minutes) &&
      (!context.indoor || /\btrong nha\b/.test(normalize(row.description ?? "")))
    ).slice(0, 2);
    if (matches.length) context.shown = matches.map(row => ({ id: row.placeId, name: row.name.slice(0, 200), km: row.distanceKm ?? null }));
    cards = matches.map((row, index) => {
      const facts = [index === 0 ? "Gợi ý chính" : "Phương án dự phòng"];
      if (row.distanceKm != null) facts.push(`${row.distanceKm.toLocaleString("vi-VN", { maximumFractionDigits: 2 })} km đường chim bay từ ${origin}`);
      if (context.free) facts.push("Giá 0đ theo danh mục");
      if (row.visitDurationMinutes != null) facts.push(`Tham quan khoảng ${row.visitDurationMinutes} phút theo danh mục`);
      return { ...toCard(row, facts.join(" · ")), ...(coordinates ? { routeOrigin: { name: origin, ...coordinates } } : {}) };
    });
    const timeNotice = context.minutes === undefined ? "" : ` Bạn còn ${context.minutes} phút. Gô chưa xác minh thời gian di chuyển và giờ mở cửa, nên chưa thể nói chắc bạn sẽ kịp.`;
    const eveningNotice = nearbyContext.evening ? " Gô chưa xác minh các điểm này phù hợp hoặc mở cửa buổi tối." : "";
    const freeNotice = nearbyContext.free ? " Mức 0đ là giá trong danh mục; bạn nên kiểm tra điều kiện áp dụng." : "";
    replyContent = cards.length
      ? `Đi đâu tiếp quanh ${origin}? Gô gợi ý ${cards[0]!.name}.${cards[1] ? ` Dự phòng: ${cards[1].name}.` : ""}${timeNotice}${freeNotice}${eveningNotice}${context.budget !== undefined ? " Gô chỉ lọc theo giá điểm tham quan; các khoản khác cần tính riêng." : ""}`
      : `Gô chưa tìm được điểm ${closer ? "gần hơn" : context.indoor ? "trong nhà" : "check-in phù hợp"} trong dữ liệu quanh ${origin}${context.minutes === undefined ? "" : ` với ${context.minutes} phút còn lại`}. Bạn muốn mở rộng khu vực không?`;
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
    const foodArea = placeType === "RESTAURANT" ? area : undefined;
    const anchorName = foodArea ?? (nearMyKhe ? "Mỹ Khê" : undefined);
    const anchor = anchorName ? await findChatAnchor(anchorName) : null;
    if (foodArea) nearbyContext = { area: foodArea, offered: [], checkin: false, free: false, evening: false };
    let retrieved = await searchPlacesForChat({
      placeType,
      district: intent.district,
      budget,
      keywords: anchor
        ? intent.keywords.filter((k) => normalize(k) !== normalize(anchorName ?? ""))
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
      distanceOriginName: anchor ? (nearMyKhe ? "biển Mỹ Khê" : anchorName) : undefined,
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
    !applyRescue && !closedRescue && !addingPlace && !arrivalRescue && !nearbyCheckin && !coffeeNearby && !moved && selectingRestaurant.length !== 1 &&
    !planningIssue &&
    !profileAnswer && !recommendationGroups &&
    !advanced &&
    !knowledge &&
    !unsupportedDays &&
    !(weatherResult && !weatherResult.multiNeedPrefix) &&
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
    !applyRescue && !closedRescue && !addingPlace && !arrivalRescue && !nearbyCheckin && !coffeeNearby && !moved && selectingRestaurant.length !== 1 &&
    !planningIssue &&
    !profileAnswer && !recommendationGroups &&
    !advanced &&
    !knowledge &&
    !unsupportedDays &&
    !(weatherResult && !weatherResult.multiNeedPrefix) &&
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
  if (weatherResult?.multiNeedPrefix) replyContent = weatherResult.multiNeedPrefix + "\n\n" + replyContent;
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
  const weatherDirect = weatherResult && !weatherResult.multiNeedPrefix ? weatherResult : null;
  const quickReplies = profileAnswer ? [] : rescuePreview ? ["Áp dụng phương án cứu lịch"] : addingPlace ? addPlaceReplies : arrivalRescue ? arrivalPreview ? ["Áp dụng giờ đến mới"] : [] : nearbyContext?.checkin ? cards.length ? ["Tìm chỗ khác", "Chỗ đó đi bộ được không?"] : [] : weatherDirect
    ? weatherDirect.quickReplies
    : recommendationGroups
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
    : weatherDirect
    ? weatherDirect.actionLink
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
  const kind: ResponseMetadata["intent"] = profileAnswer ? "PROFILE" : weatherDirect ? weatherDirect.intent : advanced?.comparison ? "COMPARE" : applyRescue || closedRescue || addingPlace || arrivalRescue || advanced?.travelPlan ? "MODIFY_ITINERARY"
    : knowledge?.intentKey === "RT_WEATHER" ? "WEATHER" : knowledge?.intentKey === "RT_EVENT" ? "EVENT" : knowledge?.intentKey.startsWith("MOVE_") ? "DIRECTIONS"
    : intent.category === "off_topic" ? "OFF_TOPIC" : request.trip || multiple && dialogue.context.budget !== null ? "ITINERARY" : "SEARCH";
  const allCards = [...cards, ...(recommendationGroups?.flatMap(group => group.places) ?? []), ...(travelPlan?.groups.flatMap(group => group.places) ?? []), ...(travelPlan?.days.flatMap(day => day.periods.flatMap(period => period.items.flatMap(item => item.place ? [item.place] : []))) ?? []), ...(advanced?.comparison?.places ?? [])];
  const foodIds = allCards.filter(card => card.placeType === "RESTAURANT").map(card => card.placeId);
  if (foodIds.length) {
    try { const menus = await chatMenus(foodIds); for (const card of allCards) if (card.placeType === "RESTAURANT") card.menuItems = menus.get(card.placeId) ?? []; }
    catch { metadataWarnings.push("Chưa tải được tên món trong menu; Gô không tự tạo món hoặc giá món."); }
  }
  const staySources = allCards.flatMap(card => [card.stayFacts?.hours, ...(card.stayFacts?.rooms ?? []), ...(card.stayFacts?.publicRates ?? [])].flatMap(fact => fact ? [{ url: fact.sourceUrl, checkedOn: fact.checkedOn, label: card.name, scope: "Thông tin lưu trú công bố; chưa xác nhận giá hoặc phòng theo ngày" }] : []));
  const sources = [...staySources, ...(weatherResult?.sources ?? [])];
  const metadata: ResponseMetadata = { intent: kind, secondaryIntents: [...dialogue.needs.map(need => ({ food: "FOOD", sight: "SIGHT", stay: "STAY" })[need]), ...(liveNotice ? [liveNotice.intentKey === "RT_WEATHER" ? "WEATHER" : liveNotice.intentKey === "RT_EVENT" ? "EVENT" : "LIVE_DATA"] : []), ...(weatherResult?.multiNeedPrefix ? ["WEATHER"] : [])], needsClarification: responseQuestions.length > 0, questions: responseQuestions,
    confirmedContext: dialogue.context, profileSuggestions: suggestions, sources: [...new Map(sources.map(source => [source.url + source.checkedOn, source])).values()], warnings: metadataWarnings };
  if (nearbyContext && area && !nearbyContext.checkin) {
    nearbyContext.offered = cards.filter(card => card.placeType === "RESTAURANT" && card.name.length <= 200).map(card => card.name).slice(0, 10);
  }
  advisorState = { stayId: null, excludedStayIds: [], ...advisorState, favorites: undefined, favoritePlan: undefined, favoriteConsult:undefined, dietaryRestricted: dietRestricted, dialogue, nearbyContext: addingPlace ? previousNearby : nearbyContext, arrivalPreview, addPlacePreview, rescuePreview };

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
