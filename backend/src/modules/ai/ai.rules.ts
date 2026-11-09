import {
  DEFAULT_INTENT,
  type ItineraryRequest,
  type ReviewInput,
  type ModerationResult,
} from "../../Ai/promt";

export const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase();
export function redact(text: string): string {
  return text
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, "[đã ẩn email]")
    .replace(/https?:\/\/\S+|www\.\S+/gi, "[đã ẩn liên kết]")
    .replace(/(?:\+?84|0)[\d\s().-]{8,15}\d/g, "[đã ẩn số liên hệ]")
    .replace(
      /(?:địa chỉ|số tài khoản|cccd|cmnd)\s*[:：]?[^\n.!?]+/gi,
      "[đã ẩn thông tin cá nhân]",
    );
}
export function anonymize(text: string) {
  return redact(text).replace(
    /(?<!\p{L})\p{Lu}\p{Ll}*(?:\s+\p{Lu}\p{Ll}*){1,3}(?!\p{L})/gu,
    "[đã ẩn tên]",
  );
}
export function todayVietnam() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = (type: string) => parts.find(part => part.type === type)!.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}
export function validDate(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(value + "T00:00:00Z");
  return Number.isFinite(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
    ? value
    : null;
}
export function parseTrip(
  text: string,
  today = todayVietnam(),
): ItineraryRequest {
  const n = normalize(text);
  const daysMatch = n.match(/(\d+)\s*(?:ngay|n\s*\d+\s*d)/);
  const guests = n.match(/(\d+)\s*(?:nguoi|khach|thanh vien)/);
  const money = n.match(
    /(\d+(?:[.,]\d+)?)\s*(trieu|tr|k|nghin|ngan|dong|vnd)(\d)?/,
  );
  let budget = money
    ? Number(
        /^(tr|trieu)$/.test(money[2]!)
          ? money[1]!.replace(",", ".")
          : money[1]!.replace(/[.,]/g, ""),
      ) *
      (/^(tr|trieu)$/.test(money[2]!)
        ? 1000000
        : /^(k|nghin|ngan)$/.test(money[2]!)
          ? 1000
          : 1)
    : null;
  if (money?.[3] && /^(tr|trieu)$/.test(money[2]!))
    budget = (budget || 0) + Number(money[3]) * 100000;
  const days = daysMatch ? Number(daysMatch[1]) : null;
  const count = guests
    ? Number(guests[1])
    : /cung (?:ban gai|ban trai|vo|chong)/.test(n)
      ? 2
      : null;
  if (budget && /(?:moi|\/|mot)\s*(?:nguoi|khach)/.test(n))
    budget = count ? budget * count : null;
  if (budget && /(?:moi|\/)\s*ngay/.test(n))
    budget = days ? budget * days : null;
  let start = validDate(text.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? null);
  const relative = n.includes("ngay mai")
    ? 1
    : n.includes("hom nay")
      ? 0
      : null;
  if (!start && relative !== null) {
    const date = new Date(today + "T00:00:00Z");
    date.setUTCDate(date.getUTCDate() + relative);
    start = date.toISOString().slice(0, 10);
  }
  const needs: ItineraryRequest["needs"] = [];
  if (/khach san|homestay|resort|luu tru|cho o/.test(n)) needs.push("stay");
  if (/an uong|am thuc|hai san|mon an/.test(n)) needs.push("food");
  if (/tham quan|bien|chup anh|du lich/.test(n)) needs.push("sight");
  const interests = [
    ["bien", "Biển & Nghỉ dưỡng"],
    ["chup anh", "Check-in sống ảo"],
    ["van hoa", "Di sản & Văn hoá"],
    ["hai san", "Ẩm thực địa phương"],
    ["am thuc", "Ẩm thực địa phương"],
  ]
    .filter(([key]) => n.includes(key!))
    .map(([, label]) => label!);
  const trip: ItineraryRequest = {
    days,
    guests: count,
    budget,
    start_date: start,
    needs,
    interests: [...new Set(interests)],
    missing: [],
    off_topic:
      /viet code|giai toan|chinh tri/.test(n) ||
      !/di|du lich|ngay|nghi|lich trinh|bien|khach san|3n2d|2n1d/.test(n),
  };
  return finalizeTrip(trip, today);
}
export function finalizeTrip(
  trip: ItineraryRequest,
  today = todayVietnam(),
): ItineraryRequest {
  const next = {
    ...trip,
    days:
      trip.days &&
      Number.isInteger(trip.days) &&
      trip.days >= 1 &&
      trip.days <= 3
        ? trip.days
        : null,
    guests:
      trip.guests &&
      Number.isInteger(trip.guests) &&
      trip.guests > 0 &&
      trip.guests <= 100
        ? trip.guests
        : null,
    budget:
      trip.budget &&
      Number.isSafeInteger(trip.budget) &&
      trip.budget > 0 &&
      trip.budget <= 1000000000
        ? trip.budget
        : null,
    start_date: validDate(trip.start_date),
    missing: [] as ItineraryRequest["missing"],
  };
  if (next.start_date && next.start_date < today) next.start_date = null;
  if (!next.days) next.missing.push("days");
  if (!next.guests) next.missing.push("guests");
  if (!next.budget) next.missing.push("budget");
  if (!next.start_date) next.missing.push("start_date");
  return next;
}
export function moderateRules(reviews: ReviewInput[]): ModerationResult {
  return {
    items: reviews.flatMap((review) => {
      const n = normalize(review.content);
      const flags: ModerationResult["items"][number]["flags"] = [];
      if (
        /(?:\+?84|0)[\d\s().-]{8,15}\d|[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(
          review.content,
        )
      )
        flags.push("personal_info");
      if (/https?:\/\/|www\.|lien he|khuyen mai|mua ngay|quang cao/.test(n))
        flags.push("advertising");
      if (/(.)\1{9,}/.test(n) || n.trim().length < 3) flags.push("spam");
      if (/do ngu|con cho|lua dao chet|dit me|du ma/.test(n))
        flags.push("abusive");
      return flags.length
        ? [
            {
              review_id: review.id,
              flags,
              confidence: 0.85,
              reason: flags.includes("personal_info")
                ? "Có dấu hiệu thông tin liên hệ cá nhân."
                : "Có dấu hiệu cần kiểm duyệt; quản trị viên cần đọc nội dung gốc.",
              priority:
                flags.includes("personal_info") || flags.includes("abusive")
                  ? ("high" as const)
                  : ("medium" as const),
            },
          ]
        : [];
    }),
  };
}
export function safeDraft(draft: string, notes = "") {
  if (/https?:\/\/|\b0\d{8,10}\b|[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(draft))
    return false;
  const n = normalize(draft),
    source = normalize(notes);
  for (const claim of [
    "hoan tien",
    "boi thuong",
    "giam gia",
    "tang qua",
    "mien phi",
    "ngon nhat",
    "so 1",
    "duy nhat",
    "chung nhan",
    "giai thuong",
    "view bien",
    "ho boi",
    "bai do xe",
  ])
    if (n.includes(claim) && !source.includes(claim)) return false;
  for (const number of draft.match(/\d+(?:[.,]\d+)*/g) ?? [])
    if (!notes.includes(number)) return false;
  return true;
}
export function cosine(a: number[], b: number[]) {
  if (
    a.length !== b.length ||
    !a.length ||
    !a.every(Number.isFinite) ||
    !b.every(Number.isFinite)
  )
    return 0;
  const dot = a.reduce((sum, n, i) => sum + n * b[i]!, 0);
  const na = Math.hypot(...a),
    nb = Math.hypot(...b);
  return na && nb ? dot / na / nb : 0;
}
export const fallbackIntentDefaults = DEFAULT_INTENT;

/** Reject rewritten queries that introduce a district, a number, or a new constraint. */
export function safeRewrite(original: string, candidate: string) {
  const from = normalize(original),
    to = normalize(candidate);
  if (
    (to.match(/\d+/g) ?? []).join(",") !== (from.match(/\d+/g) ?? []).join(",")
  )
    return false;
  const constraints = [
    "hai chau",
    "son tra",
    "thanh khe",
    "lien chieu",
    "ngu hanh son",
    "cam le",
    "hoa vang",
    "hoang sa",
    "my khe",
    "ba na",
    "hoi an",
    "gan bien",
    "view bien",
    "mien phi",
    "5 sao",
    "4 sao",
    "3 sao",
    "gia re",
    "cao cap",
    "duoi",
    "tren",
  ];
  return constraints.every(
    (term) =>
      !to.includes(term) ||
      from.includes(term) ||
      (term === "gia re" && /\bre\b/.test(from)),
  );
}
