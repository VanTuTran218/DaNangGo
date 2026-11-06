import { DISTRICTS } from "../../Ai/promt";
import { parseTrip, todayVietnam, validDate } from "../ai/ai.rules";
import { tripBudget } from "./chat.budget";
import { conversationalText, requestedNeeds, type Need } from "./chat.language";
import { emptyContext, preferenceLabels, type Dialogue, type PreferenceKey } from "./chat.contract";
import { explicitPreferences, mergePreferences } from "./chat.profile";
import { tripPreferences } from "./chat.trip-preferences";
import { isRestart } from "./chat.knowledge";

export function understand(message: string, previous?: Dialogue, saved: PreferenceKey[] = [], today = todayVietnam()): Dialogue {
  const text = conversationalText(message);
  const restart = isRestart(message);
  const newTrip = /\b(?:len lich trinh|lap lich trinh|len ke hoach|toi muon di|di)\b.*\b\d+\s*(?:ngay|n\s*\d+\s*d)\b/.test(text)
    && Boolean(previous && !previous.pendingQuestions.length) && !/\b(doi|thay|them|bot|giu|rut)\b/.test(text);
  const base = restart || newTrip ? undefined : previous;
  const context = structuredClone(base?.context ?? emptyContext());
  const ignoreSaved = /\b(khong (?:dung|su dung) so thich cu|chi dung.*chuyen nay)\b/.test(text) ? true : /\b(?:dung|su dung) so thich (?:cu|da luu|cua toi)\b/.test(text) ? false : base?.ignoreSaved ?? false;
  const updates = explicitPreferences(message);
  const sessionPreferences = mergePreferences(base?.sessionPreferences ?? [], updates);
  context.preferences = mergePreferences(ignoreSaved ? [] : saved, sessionPreferences);
  context.dietaryRestrictions = context.preferences.filter(key => /^(?:allergy_|avoid_seafood|avoid_gluten|vegetarian|vegan|food_mild)/.test(key));
  const trip = parseTrip(text, today);
  if (trip.days !== null) context.days = trip.days;
  if (trip.guests !== null) context.guests = trip.guests;
  if (trip.start_date !== null) context.startDate = trip.start_date;
  const relative = /\b(ngay kia|ngay mot)\b/.test(text) || /mốt/i.test(message) ? 2 : /\bngay mai\b/.test(text) ? 1 : /\bhom nay\b/.test(text) ? 0 : null;
  if (!validDate(message.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? null) && relative !== null) {
    const date = new Date(today + "T00:00:00Z"); date.setUTCDate(date.getUTCDate() + relative); context.startDate = date.toISOString().slice(0, 10);
  }
  const oldMoney = context.budget !== null ? `${context.budget} đồng${context.budgetScope === "total" ? " tổng" : context.budgetScope === "perPerson" ? " mỗi người" : context.budgetScope === "perDay" ? " mỗi ngày" : context.budgetScope === "perRoomPerNight" ? " mỗi phòng mỗi đêm" : ""}` : "";
  const financial = tripBudget([oldMoney, text]);
  if (financial.amount !== null) { context.budget = financial.amount; context.budgetScope = financial.scope; }
  if (oldMoney.includes("mỗi phòng mỗi đêm") && !/\d[\d.,]*\s*(?:trieu|tr|k|nghin|dong|vnd)\b/.test(text)) context.budgetScope = "perRoomPerNight";
  if (/\b(?:moi phong|\/phong).*dem\b|\b(?:phong|khach san).*\/(?:dem)\b/.test(text) && context.budget !== null) context.budgetScope = "perRoomPerNight";
  if (financial.nights !== null) context.nights = financial.nights;
  if (financial.reserve !== null) context.reserve = financial.reserve;
  if (financial.hasLodging) context.hasLodging = true;
  if (financial.dayUse) context.dayUse = true;
  if (/\bchua (?:co|dat) (?:khach san|cho o)\b/.test(text)) context.hasLodging = false;
  const district = DISTRICTS.find(name => text.includes(conversationalText(name)));
  if (district) context.district = district;
  const timePreferences = tripPreferences([text]).value;
  if (timePreferences.transport) context.transport = timePreferences.transport;
  if (timePreferences.arrivalTime) context.arrivalTime = timePreferences.arrivalTime;
  if (timePreferences.departureTime) context.departureTime = timePreferences.departureTime;
  if (timePreferences.adults !== undefined && timePreferences.children !== undefined) context.guests = timePreferences.adults + timePreferences.children;
  let needs: Need[] = requestedNeeds(message);
  const followup = !needs.length || /\b(giu|doi|thay|them|bo|uu tien|van vay|tong van|ca nhom)\b/.test(text);
  if (base && followup) needs = [...new Set([...base.needs, ...needs])];
  if (!needs.length && /\b(lich trinh|ke hoach|\d+\s*n\s*\d+\s*d)\b/.test(text)) needs = ["sight", "food"];
  if (/\b(?:khong can|bo) (?:an uong|am thuc)\b/.test(text)) needs = needs.filter(need => need !== "food");
  if (/\b(?:khong can|da (?:co|dat)) (?:khach san|luu tru|cho o)\b/.test(text)) needs = needs.filter(need => need !== "stay");
  const pendingQuestions: string[] = [];
  if (context.budget !== null && needs.length > 1) {
    if (!context.guests) pendingQuestions.push("Bạn đi mấy người?");
    if (!context.budgetScope && !(context.guests === 1 && context.days === 1)) pendingQuestions.push("Ngân sách bạn nêu là tổng cho cả nhóm hay cho mỗi người?");
    if (!context.days) pendingQuestions.push("Bạn đi mấy ngày, có qua đêm không?");
    else if (context.nights === null && !context.hasLodging && !context.dayUse) pendingQuestions.push("Bạn ở mấy đêm, hay chỉ đi trong ngày?");
  }
  return { context, needs, pendingQuestions: pendingQuestions.slice(0, 3), profilePending: updates.length ? [] : base?.profilePending ?? [], sessionPreferences, ignoreSaved };
}
export function planningText(dialogue: Dialogue) {
  const c = dialogue.context;
  return [
    "Lịch trình", c.days ? `${c.days} ngày` : "", c.nights !== null ? `${c.nights} đêm` : "", c.guests ? `cho ${c.guests} người` : "",
    c.budget ? `${c.budget} đồng ${c.budgetScope === "total" ? "tổng ngân sách" : c.budgetScope === "perPerson" ? "mỗi người" : c.budgetScope === "perDay" ? "mỗi ngày" : "ngân sách chưa rõ phạm vi"}` : "",
    c.startDate ? `khởi hành ${c.startDate}` : "", c.arrivalTime ? `đến ${c.arrivalTime}` : "", c.departureTime ? `về ${c.departureTime}` : "",
    c.reserve !== null ? `giữ ${c.reserve} đồng dự phòng` : "", c.hasLodging ? "đã có khách sạn" : "", c.dayUse ? "nghỉ ban ngày" : "",
    c.transport ? `đi ${({ car: "ô tô", motorbike: "xe máy", taxi: "taxi", walk: "đi bộ", bus: "xe buýt" })[c.transport]}` : "",
    dialogue.needs.map(need => ({ food: "ăn uống", sight: "tham quan", stay: "lưu trú" })[need]).join(", "),
    c.preferences.filter(key => !c.transport || !["taxi", "motorbike", "walk"].includes(key)).map(key => preferenceLabels[key]).join(", "),
  ].filter(Boolean).join(", ");
}
