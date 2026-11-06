import { normalize } from "../ai/ai.rules";
import { conversationalText } from "./chat.language";

export type BudgetScope = "total" | "perPerson" | "perDay";
export interface TripBudget {
  amount: number | null;
  scope: BudgetScope | null;
  reserve: number | null;
  nights: number | null;
  dayUse: boolean;
  hasLodging: boolean;
}
const moneyPattern = /(\d+(?:[.,]\d+)*)\s*(trieu|tr|cu|k|nghin|ngan|dong|vnd)(\d)?\b/g;
export function moneyValue(value: string, unit: string, tail?: string) {
  const million = /^(trieu|tr|cu)$/.test(unit);
  const number = Number(million ? value.replace(",", ".") : value.replace(/[.,]/g, ""));
  const result = number * (million ? 1_000_000 : /^(k|nghin|ngan)$/.test(unit) ? 1000 : 1)
    + (million && tail ? Number(tail) * 100_000 : 0);
  return Number.isSafeInteger(result) && result >= 0 && result <= 1_000_000_000 ? result : null;
}

/** Budget and reserve are separate slots: “giữ 500k” never replaces 3 million. */
export function tripBudget(texts: string[]): TripBudget {
  const result: TripBudget = { amount: null, scope: null, reserve: null, nights: null, dayUse: false, hasLodging: false };
  for (const text of texts) {
    const n = conversationalText(text);
    const amounts = [...n.matchAll(moneyPattern)];
    let budgetInTurn = false;
    for (const match of amounts) {
      const start = match.index!;
      const before = n.slice(Math.max(0, start - 45), start);
      const after = n.slice(start + match[0].length, start + match[0].length + 30);
      const reserve = /(?:giu(?: lai)?|de(?: lai| danh)?|du phong)\s*$/.test(before)
        || /^\s*(?:de\s+)?du phong\b/.test(after);
      const value = moneyValue(match[1]!, match[2]!, match[3]);
      if (reserve) result.reserve = value;
      else if (!budgetInTurn) {
        result.amount = value;
        // A changed amount without an explicit basis needs confirmation again.
        result.scope = null;
        budgetInTurn = true;
      }
    }
    if (/\b(tong(?!\s*so)|ca nhom|ca chuyen)\b/.test(n) && result.amount !== null) result.scope = "total";
    else if (/\b(moi|mot)\s*(nguoi|khach|dua)\b|\/\s*(nguoi|ng)\b/.test(n)) result.scope = "perPerson";
    else if (/\bmoi\s*ngay\b|\/\s*ngay\b/.test(n)) result.scope = "perDay";
    const nights = n.match(/(?:\d+\s*n\s*(\d+)\s*d\b)|(\d+)\s*dem\b/);
    if (nights) result.nights = Number(nights[1] ?? nights[2]);
    if (/\b(khong|ko)\s*(?:o\s*)?qua dem\b/.test(n)) result.nights = 0;
    if (/\b(nghi ban ngay|nghi (?:vai|\d+) (?:gio|tieng)|phong theo gio)\b/.test(n)) result.dayUse = true;
    if (/\b(da (?:co|dat) (?:khach san|ks|cho o)|khong can (?:khach san|luu tru|cho o))\b/.test(n)) result.hasLodging = true;
    if (/\b(chua (?:co|dat) (?:khach san|ks|cho o)|can tim (?:khach san|cho o))\b/.test(n)) result.hasLodging = false;
  }
  return result;
}
export function totalBudget(budget: TripBudget, guests: number | null, days: number | null) {
  if (budget.amount === null) return null;
  const multiplier = budget.scope === "perPerson" ? guests : budget.scope === "perDay" ? days : budget.scope === "total" || guests === 1 ? 1 : null;
  const total = multiplier === null ? null : budget.amount * multiplier;
  return total !== null && Number.isSafeInteger(total) && total > 0 && total <= 1_000_000_000 ? total : null;
}
export function budgetQuestions(budget: TripBudget, guests: number | null, days: number | null) {
  const questions: string[] = [];
  if (budget.amount !== null && !guests) questions.push("Nhóm bạn có bao nhiêu người?");
  if (budget.amount !== null && budget.scope === null && guests !== 1)
    questions.push("Số tiền bạn nêu là tổng cho cả nhóm hay cho mỗi người?");
  if (budget.amount !== null && !days) questions.push("Bạn đi mấy ngày, mấy đêm (hỗ trợ 1–3 ngày)?");
  if (days === 1 && budget.nights === null && !budget.hasLodging && !budget.dayUse)
    questions.push("Chuyến một ngày của bạn có qua đêm hay chỉ đi trong ngày?");
  return questions.slice(0, 3);
}
export function budgetContext(budget: TripBudget) {
  return [
    budget.amount !== null ? `${budget.amount} đồng${budget.scope === "total" ? " tổng ngân sách" : budget.scope === "perPerson" ? " mỗi người" : budget.scope === "perDay" ? " mỗi ngày" : " ngân sách chưa rõ phạm vi"}` : "",
    budget.reserve !== null ? `giữ ${budget.reserve} đồng dự phòng` : "",
    budget.nights !== null ? `${budget.nights} đêm` : "",
    budget.dayUse ? "nghỉ ban ngày" : "",
    budget.hasLodging ? "đã có khách sạn" : "",
  ].filter(Boolean).join(", ");
}
