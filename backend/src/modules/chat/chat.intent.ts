import { DEFAULT_INTENT, DISTRICTS, TASTES, type Intent } from "../../Ai/promt";
import { normalize, parseTrip, todayVietnam } from "../ai/ai.rules";
import { tripPreferences, preferenceContext } from "./chat.trip-preferences";
import { tripBudget, totalBudget, budgetContext, budgetQuestions } from "./chat.budget";
import { isRestart } from "./chat.knowledge";

export const isTripRequest = (text: string) =>
  /\b(lich trinh|ke hoach|\d+\s*n\s*\d+\s*d|\d+\s*ngay|tour)\b/.test(
    normalize(text),
  );
export const isFreeRequest = (text: string) =>
  !/\b(khong can mien phi|co phi|tra phi)\b/.test(normalize(text)) &&
  /\b(mien phi|khong mat (phi|tien)|khong ton (phi|tien)|0\s*(dong|d|vnd))\b/.test(
    normalize(text),
  );

/** Match complete phrases: “tham quan” must never match “quán ăn”. */
export function explicitCategory(message: string): Intent["category"] {
  const n = normalize(message).replace(/-/g, " ");
  if (
    /\b(viet code|lap trinh|giai toan|chinh tri|lam bai tap|python|javascript|thuat toan|viet ham|viet script)\b/.test(
      n,
    )
  )
    return "off_topic";
  if (
    /\b(khach san|ks|hotel|homestay|homstay|resort|luu tru|cho o|dat phong|phong nghi|nghi ban ngay)\b/.test(
      n,
    )
  )
    return "stay";
  if (
    /\b(quan an|quan hai san|quan mi|quan bun|quan banh|an uong|mon an|am thuc|an gi|an chay|thuan chay|di ung|khong cay|it cay|khong an|mi quang|hai san|banh xeo|bun cha|bun bo|cafe|ca phe|nha hang|an sang|an trua|an toi|an vat|quan ngon)\b/.test(
      n,
    )
  )
    return "food";
  if (/\b(furama|hilton|hyatt|haian|sala)\b/.test(n)) return "stay";
  if (
    /\b(tham quan|diem du lich|diem den|dia diem|cau rong|ba na|ngu hanh son|bien|check in|checkin|chup (anh|hinh)|vui choi|diem mien phi)\b/.test(
      n,
    )
  )
    return "sight";
  return "other";
}

export function ruleIntent(message: string): Intent {
  const n = normalize(message),
    category = explicitCategory(message);
  if (category === "off_topic") return { ...DEFAULT_INTENT, category };
  const amount = n.match(
    /(?:duoi|toi da|ngan sach|tam|khoang|gia)\s*(?:la\s*)?([\d.,]+)\s*(trieu|tr|k|nghin|ngan|dong|vnd|d)?/,
  );
  const unit = amount?.[2] ?? "";
  const number = amount
    ? Number(
        /^(trieu|tr)$/.test(unit)
          ? amount[1]!.replace(",", ".")
          : amount[1]!.replace(/[.,]/g, ""),
      )
    : null;
  const budget = isFreeRequest(message)
    ? 0
    : number === null
      ? null
      : number *
        (/^(trieu|tr)$/.test(unit)
          ? 1_000_000
          : /^(k|nghin|ngan)$/.test(unit)
            ? 1000
            : 1);
  const keywords = [
    "Mì Quảng",
    "hải sản",
    "bánh xèo",
    "bún chả cá",
    "cafe",
    "Cầu Rồng",
    "Bà Nà",
    "Mỹ Khê",
    "Furama",
    "Hilton",
    "Hyatt",
    "HAIAN",
    "Sala",
  ].filter((k) => n.includes(normalize(k)));
  // Sơn Trà / Ngũ Hành Sơn alone may mean a district, not the name of an attraction.
  const district = DISTRICTS.find((d) => n.includes(normalize(d))) ?? null;
  const guests = n.match(/(\d+)\s*(nguoi|khach)/);
  return {
    ...DEFAULT_INTENT,
    category,
    budget,
    district,
    keywords,
    tastes: TASTES.filter(
      (t) =>
        new RegExp(`\\b${normalize(t)}\\b`).test(n) &&
        !new RegExp(`(?:khong|it|tranh)\\s+(?:an\\s+)?${normalize(t)}\\b`).test(
          n,
        ),
    ),
    party_size: guests ? Number(guests[1]) : null,
    budget_scope:
      budget === null
        ? null
        : /tong|cho \d+ nguoi/.test(n)
          ? "total"
          : /moi nguoi|\/nguoi|\/ng\b/.test(n)
            ? "per_person"
          : category === "stay" && /dem|phong/.test(n)
            ? "per_night"
            : null,
  };
}

export function resolveChatRequest(message: string, previous: string[]) {
  const resetAt = previous.map(isRestart).lastIndexOf(true);
  if (resetAt >= 0) previous = previous.slice(resetAt + 1);
  const current = ruleIntent(message);
  const prior = [...previous].reverse();
  const followup =
    /\b(con|khac|re hon|dat hon|uu tien|doi|thay|them|bot|bo|khong|chi|vay|nguoi|ngan sach|trieu|tong|giu|du phong|qua dem|khoi hanh|ngay mai|mien phi|co phi|tra phi|duoc|den|toi luc|ve|roi|ha canh|o to|xe may|taxi|grab|xe buyt|di bo|tre em|tre nho|be|ong ba)\b/.test(
      normalize(message),
    );
  const lastTrip = prior.find(isTripRequest);
  const trip =
    isTripRequest(message) ||
    Boolean(
      lastTrip &&
      followup &&
      (current.category === "other" ||
        /\b(doi|thay|them|bot|bo|uu tien|da co|da dat)\b/.test(normalize(message))),
    );
  const previousRelevant = prior.find(
    (text) =>
      !["other", "off_topic"].includes(ruleIntent(text).category) ||
      isTripRequest(text),
  );
  const inherited =
    followup && previousRelevant
      ? ruleIntent(previousRelevant)
      : DEFAULT_INTENT;
  const category =
    current.category === "other" && followup
      ? inherited.category
      : current.category;
  const sameCategory = category === inherited.category;
  const cheap = /\b(re hon|tiet kiem|binh dan|gia re)\b/.test(
    normalize(message),
  );
  const text =
    followup && previousRelevant && (sameCategory || trip)
      ? `${previousRelevant}. ${message}`
      : message;
  const context = {
    ...current,
    category,
    budget: current.budget ?? (sameCategory ? inherited.budget : null),
    budget_scope:
      current.budget_scope ?? (sameCategory ? inherited.budget_scope : null),
    district: current.district ?? (sameCategory ? inherited.district : null),
    keywords: current.keywords.length
      ? current.keywords
      : sameCategory
        ? inherited.keywords
        : [],
    party_size: current.party_size ?? inherited.party_size,
    tastes: current.tastes.length
      ? current.tastes
      : sameCategory
        ? inherited.tastes
        : [],
  };
  if (
    /\b(khong can mien phi|co phi|tra phi)\b/.test(normalize(message)) &&
    current.budget === null
  )
    context.budget = null;
  return {
    trip,
    text,
    intent: context,
    cheap,
    freeOnly:
      isFreeRequest(message) ||
      Boolean(
        sameCategory &&
        followup &&
        isFreeRequest(previousRelevant ?? "") &&
        !/\b(co phi|tra phi|khong can mien phi)\b/.test(normalize(message)),
      ),
    previousRelevant,
  };
}

/** Merge explicit fields across user turns only. A new trip starts a fresh brief. */
export function tripBrief(
  message: string,
  previous: string[],
  today = todayVietnam(),
) {
  const resetAt = previous.map(isRestart).lastIndexOf(true);
  if (resetAt >= 0) previous = previous.slice(resetAt + 1);
  const start = previous
    .map(
      (text) =>
        isTripRequest(text) &&
        !/\b(doi|thay|them|bot|rut)\b|^giu\b/.test(normalize(text)),
    )
    .lastIndexOf(true);
  const fresh =
    isTripRequest(message) &&
    !/\b(doi|thay|them|bot|vay|con|chi|rut)\b|^giu\b/.test(normalize(message));
  const texts =
    fresh || start < 0 ? [message] : [...previous.slice(start), message];
  const preferences = tripPreferences(texts);
  const totalFromComposition =
    preferences.value.adults !== undefined &&
    preferences.value.children !== undefined
      ? preferences.value.adults + preferences.value.children
      : null;
  let result = parseTrip("", today);
  for (const text of texts) {
    // A senior count in a follow-up describes the group; it is not a new total.
    const parseText =
      result.guests !== null
        ? normalize(text).replace(
            /\d+\s*(?:nguoi lon tuoi|nguoi cao tuoi)\b/g,
            "nguoi lon tuoi",
          )
        : text;
    const item = parseTrip(
      totalFromComposition && /moi\s*(nguoi|khach)/.test(normalize(text))
        ? `Cho ${totalFromComposition} người, ${parseText}`
        : parseText,
      today,
    );
    if (item.days !== null) result.days = item.days;
    if (item.guests !== null) result.guests = item.guests;
    if (item.budget !== null) result.budget = item.budget;
    if (item.start_date !== null) result.start_date = item.start_date;
    if (item.interests.length)
      result.interests = [...new Set([...result.interests, ...item.interests])];
    if (item.needs.length)
      result.needs = [...new Set([...result.needs, ...item.needs])];
  }
  if (totalFromComposition !== null) {
    if (totalFromComposition > 100)
      preferences.issues.push(
        "Tổng số khách vượt phạm vi 100 người của công cụ; bạn xác nhận lại nhé.",
      );
    const explicitTotal = [...texts]
      .reverse()
      .map((text) =>
        normalize(text).match(/(\d+)\s*(?:nguoi|khach)(?!\s*(?:lon|cao tuoi))/),
      )
      .find(Boolean);
    if (explicitTotal && Number(explicitTotal[1]) !== totalFromComposition)
      preferences.issues.push(
        "Tổng số khách chưa khớp số người lớn và trẻ em. Bạn xác nhận lại thành phần nhóm nhé.",
      );
    result.guests = totalFromComposition;
  }
  if (
    result.days === 1 &&
    preferences.value.arrivalTime &&
    preferences.value.departureTime &&
    preferences.value.arrivalTime >= preferences.value.departureTime
  )
    preferences.issues.push(
      "Giờ về phải sau giờ đến trong lịch một ngày. Bạn xác nhận lại giờ hoặc số ngày nhé.",
    );
  result.off_topic = false;
  const financial = tripBudget(texts);
  result.budget = totalBudget(financial, result.guests, result.days);
  const questions = budgetQuestions(financial, result.guests, result.days);
  if (financial.reserve !== null && result.budget !== null && financial.reserve >= result.budget)
    preferences.issues.push("Khoản dự phòng phải nhỏ hơn tổng ngân sách. Bạn muốn đổi ngân sách hay khoản dự phòng?");
  if (financial.nights !== null && result.days !== null && financial.nights !== Math.max(0, result.days - 1))
    preferences.issues.push("Số ngày và số đêm chưa khớp phạm vi lịch trình. Lịch một ngày hiện hỗ trợ 0 đêm; bạn xác nhận lại số ngày/đêm nhé.");
  const freeOnly = texts.reduce(
    (free, text) =>
      /\b(co phi|tra phi|khong can mien phi)\b/.test(normalize(text))
        ? false
        : isFreeRequest(text)
          ? true
          : free,
    false,
  );
  return {
    request: result,
    text: texts.join(". "),
    freeOnly,
    fresh: fresh || start < 0,
    preferences: preferences.value,
    financial,
    questions,
    issues: preferences.issues,
  };
}

/** Preserve validated trip facts, without copying personal details into internal state. */
export function tripContext(brief: ReturnType<typeof tripBrief>) {
  const r = brief.request;
  return [
    r.days ? `Lịch trình ${r.days} ngày` : "Lịch trình",
    r.guests ? `cho ${r.guests} người` : "",
    budgetContext(brief.financial),
    r.start_date ? `khởi hành ${r.start_date}` : "",
    r.interests.join(", "),
    preferenceContext(brief.preferences),
    brief.freeOnly ? "điểm tham quan miễn phí" : "",
    /khong (can|o|dat) (khach san|luu tru|phong)|khong can cho o|da (co|dat) (khach san|cho o)/.test(
      normalize(brief.text),
    )
      ? "không cần khách sạn"
      : "",
    /khong can (an uong|am thuc)|bo an uong/.test(normalize(brief.text))
      ? "không cần ăn uống"
      : "",
  ]
    .filter(Boolean)
    .join(", ")
    .slice(0, 2000);
}
export function unsupportedTripDays(message: string) {
  const match = normalize(message).match(/(\d+)\s*(?:ngay|n\s*\d+\s*d)/);
  return Boolean(match && (Number(match[1]) < 1 || Number(match[1]) > 3));
}
