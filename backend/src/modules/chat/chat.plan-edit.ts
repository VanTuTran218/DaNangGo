import { createHash, randomUUID } from "node:crypto";
import { normalize } from "../ai/ai.rules";
import { clock, minutes, tripPreferences, preferenceContext, transportLabels } from "./chat.trip-preferences";
import { placeCard } from "./chat.advisor";
import { resolvePlaceName } from "./chat.compare";
import type { PlaceSearchRow } from "./chat.repository";
import type { ChatPlanItem, ChatTravelPlan } from "./chat.types";

const slots = ["Sáng", "Trưa", "Chiều", "Tối"];
const slotWindows = [[450, 690], [720, 870], [900, 1080], [1110, 1260]];
const dayNumber = (text: string) => {
  const match = normalize(text).match(/ngay\s*(\d+|mot|hai|ba)\b/);
  return match ? ({ mot: 1, hai: 2, ba: 3 }[match[1]!] ?? Number(match[1])) : undefined;
};
const slotNumber = (text: string) => {
  const n = normalize(text);
  return ["sang", "trua", "chieu", "toi"].findIndex(name => new RegExp(`\\b(?:buoi |vao )?${name}\\b`).test(n.replace(/\b(?:toi muon|cho toi|giup toi)\b/g, "")));
};
// Unaccented “đi bộ” contains “bo”, but it is a transport preference, not “bỏ”.
const commandText = (text: string) => normalize(text).replace(/\bdi bo\b/g, "di __");
export const isPlanEdit = (text: string) => /\b(bo|xoa|chuyen|thay|doi|them|chi sua|giu ngay)\b/.test(commandText(text));
function mentionedPlaces(text: string, catalog: PlaceSearchRow[]) {
  return catalog.filter(row => {
    if (text.includes(normalize(row.name))) return true;
    return ["ba na", "my khe", "cau rong", "son tra", "ngu hanh son"].some(alias => new RegExp(`\\b${alias}\\b`).test(text) && resolvePlaceName(alias, [row]).length > 0);
  });
}

export function withPlanItemIds(plan: ChatTravelPlan): ChatTravelPlan {
  const output = structuredClone(plan);
  for (const day of output.days)
    day.periods.forEach((period, pi) => period.items.forEach((item, ii) => {
      item.id ??= "item_" + createHash("sha256").update(`${day.day}/${pi}/${ii}/${item.title}/${item.place?.placeId ?? ""}`).digest("hex").slice(0, 16);
    }));
  return output;
}
export function attachPlanCosts(plan: ChatTravelPlan, rows: PlaceSearchRow[]) {
  const output = withPlanItemIds(plan);
  const byId = new Map(rows.map(row => [row.placeId, row]));
  for (const item of output.days.flatMap(day => day.periods.flatMap(period => period.items))) {
    if (!item.place) continue;
    const row = byId.get(item.place.placeId);
    item.durationMinutes = row?.placeType === "ATTRACTION" ? row.visitDurationMinutes ?? 90 : 60;
    item.estimatedCost = row ? itemCost(row, output) : null;
  }
  return output;
}
function itemCost(row: PlaceSearchRow, plan: ChatTravelPlan) {
  return row.placeType !== "ATTRACTION" ? null : row.priceMin === 0 ? 0
    : row.priceMin !== null && plan.guestCount && !plan.preferences?.hasChildren ? row.priceMin * plan.guestCount : null;
}
function windowFor(plan: ChatTravelPlan, day: number, slot: number) {
  const range = slotWindows[slot]!;
  return {
    start: Math.max(range[0]!, day === 1 && plan.preferences?.arrivalTime ? minutes(plan.preferences.arrivalTime) + 60 : 0),
    end: Math.min(range[1]!, day === plan.dayCount && plan.preferences?.departureTime ? minutes(plan.preferences.departureTime) - 90 : 1440),
  };
}
function durationOf(item: ChatPlanItem) {
  return item.durationMinutes ?? (item.kind === "rest" || item.place?.placeType === "ATTRACTION" ? 90 : 60);
}
function gapStart(items: ChatPlanItem[], window: { start: number; end: number }, duration: number) {
  let start = window.start;
  for (const item of [...items].sort((a, b) => a.title.localeCompare(b.title))) {
    const at = minutes(item.title.slice(0, 5));
    if (start + duration <= at) return start;
    if (start < at + durationOf(item)) start = at + durationOf(item) + 30;
  }
  return start + duration <= window.end ? start : null;
}
function recompute(plan: ChatTravelPlan, affected: Set<number>) {
  plan.revision = (plan.revision ?? 0) + 1;
  const all = plan.days.flatMap(day => day.periods.flatMap(period => period.items));
  const attractions = [...new Map(all.filter(item => item.place?.placeType === "ATTRACTION").map(item => [item.place!.placeId, item])).values()];
  const tickets = attractions.every(item => item.estimatedCost !== null && item.estimatedCost !== undefined)
    ? attractions.reduce((total, item) => total + item.estimatedCost!, 0) : null;
  const knownSubtotal = plan.costs.accommodation === null && tickets === null ? null : (plan.costs.accommodation ?? 0) + (tickets ?? 0);
  const reserve = plan.costs.contingencyAllowance ?? 0;
  plan.costs.tickets = tickets;
  plan.costs.knownSubtotal = knownSubtotal;
  if (plan.costs.projectedSubtotal !== undefined) plan.costs.projectedSubtotal = (knownSubtotal ?? 0) + (plan.costs.foodAllowance ?? 0) + (plan.costs.transportAllowance ?? 0) + reserve;
  plan.costs.remaining = plan.budget === null || knownSubtotal === null ? null
    : plan.budget - (plan.costs.projectedSubtotal ?? knownSubtotal + reserve);
  const stays = plan.groups.filter(group => group.places.some(place => place.placeType === "ACCOMMODATION"));
  plan.groups = [
    { title: "Điểm tham quan & check-in", places: attractions.map(item => item.place!) },
    { title: "Ẩm thực gợi ý", places: [...new Map(all.filter(item => item.place?.placeType === "RESTAURANT").map(item => [item.place!.placeId, item.place!])).values()] },
    ...stays,
  ].filter(group => group.places.length);
  for (const day of plan.days.filter(day => affected.has(day.day))) {
    day.area = [...new Set(day.periods.flatMap(period => period.items.flatMap(item => item.place?.districtName ? [item.place.districtName] : [])))].join(" → ") || "Chưa xếp địa điểm";
    day.periods.forEach((period, pi) => {
      period.items.sort((a, b) => a.title.localeCompare(b.title));
      const first = period.items[0];
      period.time = first ? `${first.title.slice(0, 5)}–${clock(Math.max(minutes(period.items[period.items.length - 1]!.title.slice(0, 5)), windowFor(plan, day.day, pi).end))}` : "Không xếp hoạt động";
    });
  }
  return plan;
}

/** Keep manual edits when the next turn only changes transport or arrival/departure. */
export function updateEditedPlanPreferences(original: ChatTravelPlan, message: string): PlanEditResult {
  const parsed = tripPreferences([original.preferences ? preferenceContext(original.preferences) : "", message]);
  if (parsed.issues.length) return { content: parsed.issues.join("\n") + " Mình giữ nguyên lịch vừa chỉnh." };
  const plan = structuredClone(original);
  const old = plan.preferences;
  plan.preferences = parsed.value;
  if (plan.dayCount === 1 && plan.preferences.arrivalTime && plan.preferences.departureTime && plan.preferences.arrivalTime >= plan.preferences.departureTime)
    return { content: "Giờ về phải sau giờ đến trong chuyến một ngày. Mình giữ nguyên lịch trước khi bạn xác nhận lại." };
  const affected = new Set<number>();
  if (old?.arrivalTime !== plan.preferences.arrivalTime) affected.add(1);
  if (old?.departureTime !== plan.preferences.departureTime) affected.add(plan.dayCount);
  const removed: string[] = [];
  for (const day of plan.days.filter(day => affected.has(day.day))) {
    day.periods.forEach((period, pi) => {
      const window = windowFor(plan, day.day, pi);
      period.items = period.items.filter(item => {
        if (item.kind === "arrival" || item.kind === "departure") return false;
        const at = minutes(item.title.slice(0, 5));
        const fits = at >= window.start && at + durationOf(item) <= window.end;
        if (!fits && item.place) removed.push(item.place.name);
        return fits;
      });
    });
    const index = (time: string) => minutes(time) < 720 ? 0 : minutes(time) < 900 ? 1 : minutes(time) < 1080 ? 2 : 3;
    if (day.day === 1 && plan.preferences.arrivalTime) day.periods[index(plan.preferences.arrivalTime)]!.items.push({ id: `item_arrival_${day.day}`, kind: "arrival", title: `${plan.preferences.arrivalTime} · Đến Đà Nẵng`, detail: "Chừa dự kiến 60 phút cho thủ tục và di chuyển, chưa phải thời gian tuyến thực tế." });
    if (day.day === plan.dayCount && plan.preferences.departureTime) {
      const time = clock(Math.max(0, minutes(plan.preferences.departureTime) - 90));
      day.periods[index(time)]!.items.push({ id: `item_departure_${day.day}`, kind: "departure", title: `${time} · Chuẩn bị rời Đà Nẵng`, detail: `Giờ về ${plan.preferences.departureTime}; chừa dự kiến 90 phút, cần kiểm tra với nhà vận chuyển.` });
    }
  }
  if (plan.preferences.transport) {
    plan.notes = plan.notes.filter(note => !note.startsWith("Phương tiện dự kiến:"));
    plan.notes.push(`Phương tiện dự kiến: ${transportLabels[plan.preferences.transport]}. Chưa xác nhận thời gian tuyến, giá cước hoặc giao thông; các mục đã chỉnh vẫn được giữ.`);
  }
  return { content: `Đã cập nhật giờ/phương tiện và giữ các chỉnh sửa trước đó.${removed.length ? ` Các mục không còn vừa khung giờ mới đã được bỏ: ${[...new Set(removed)].join(", ")}.` : ""} Chưa tự thêm điểm để lấp giờ trống.`, plan: recompute(plan, affected) };
}

export type PlanEditResult = { content: string; plan?: ChatTravelPlan };
/** Copy-on-write: only the explicitly selected day/slot/items change. */
export function editTravelPlan(
  original: ChatTravelPlan,
  message: string,
  catalog: PlaceSearchRow[],
  options: { dietaryRestricted?: boolean; excludedIds?: number[]; excludedNames?: string[] } = {},
): PlanEditResult {
  let n = normalize(message);
  const command = commandText(message);
  const action = /\b(chuyen)\b/.test(command) ? "move" : /\b(thay|doi)\b/.test(command) ? "replace" : /\b(bo|xoa)\b/.test(command) ? "remove" : /\bthem\b/.test(command) ? "add" : null;
  if (!action) return { content: "Bạn muốn sửa mục nào ở ngày nào: thêm, bỏ, thay hay chuyển sang buổi khác? Mình sẽ giữ nguyên những phần bạn không yêu cầu đổi." };
  if ([...command.matchAll(/\b(chuyen|thay|doi|bo|xoa|them)\b/g)].length > 1) return { content: "Bạn gửi mỗi lượt một thao tác thêm, bỏ, thay hoặc chuyển nhé để mình xác nhận chính xác từng thay đổi; lịch hiện tại được giữ nguyên." };
  n = n.slice(command.search(/\b(chuyen|thay|doi|bo|xoa|them)\b/));
  const plan = withPlanItemIds(original);
  const separator = n.match(/\bsang\s+(?=ngay|buoi|sang|trua|chieu|toi)/);
  const targetText = action === "move" && separator ? n.slice(separator.index! + separator[0].length) : n;
  const sourceText = action === "move" && separator ? n.slice(0, separator.index) : n.split(/\bbang\b/)[0]!;
  const sourceDay = dayNumber(sourceText);
  const sourceSlot = slotNumber(sourceText);
  const targetDay = dayNumber(targetText) ?? (action === "move" ? sourceDay : undefined);
  const targetSlot = slotNumber(targetText);
  if (sourceDay !== undefined && (sourceDay < 1 || sourceDay > plan.dayCount)) return { content: `Lịch hiện có ${plan.dayCount} ngày; ngày cần sửa chưa hợp lệ. Mình giữ nguyên lịch.` };
  const named = mentionedPlaces(sourceText, catalog);
  const entries = plan.days.flatMap(day => day.periods.flatMap((period, pi) => period.items.map(item => ({ day, pi, period, item }))));
  const id = message.match(/\bitem_[a-zA-Z0-9_-]+\b/)?.[0];
  const type = /\b(quan an|an sang|an trua|an toi|mon an|bua an)\b/.test(sourceText) ? "RESTAURANT" : /\b(diem|tham quan|check.in)\b/.test(sourceText) ? "ATTRACTION" : null;
  const matches = entries.filter(entry => (sourceDay === undefined || entry.day.day === sourceDay) && (sourceSlot < 0 || entry.pi === sourceSlot)
    && (id ? entry.item.id === id : named.length ? named.some(row => row.placeId === entry.item.place?.placeId) : type ? entry.item.place?.placeType === type : false));
  if (action !== "add" && !matches.length) return { content: "Mình chưa xác định được mục trong lịch cần sửa. Bạn nêu tên địa điểm (hoặc mã mục), ngày và buổi nhé; lịch hiện tại được giữ nguyên." };
  if ((action !== "add" && new Set(matches.map(entry => entry.item.place?.placeId ?? entry.item.id)).size > 1) || (action === "move" && matches.length > 1))
    return { content: "Có nhiều mục khớp yêu cầu. Bạn chỉ rõ tên địa điểm, ngày và buổi để mình sửa đúng một mục nhé." };
  const affected = new Set<number>();
  if (action === "remove") {
    for (const entry of matches) {
      entry.period.items = entry.period.items.filter(item => item.id !== entry.item.id);
      affected.add(entry.day.day);
    }
    return { content: `Đã bỏ ${matches[0]!.item.place?.name ?? matches[0]!.item.title} khỏi ${[...affected].map(day => `ngày ${day}`).join(", ")}. Các mục khác được giữ nguyên; mình đã tính lại chi phí vé, khoản dự phòng vẫn giữ.`, plan: recompute(plan, affected) };
  }
  const dayNo = action === "replace" ? matches[0]!.day.day : targetDay;
  const slotNo = action === "replace" ? matches[0]!.pi : targetSlot;
  if (!dayNo || slotNo < 0) return { content: "Bạn muốn đặt mục này vào ngày nào, buổi sáng/trưa/chiều/tối? Mình chưa đổi lịch khi chưa rõ vị trí." };
  const day = plan.days.find(day => day.day === dayNo);
  const period = day?.periods[slotNo];
  if (!day || !period) return { content: `Lịch hiện có ${plan.dayCount} ngày. Bạn chọn ngày nằm trong lịch hiện tại nhé.` };
  const window = windowFor(plan, dayNo, slotNo);
  if (window.end <= window.start) return { content: "Buổi này nằm ngoài khung giờ đến/về của bạn, nên mình chưa chuyển hoặc thêm mục. Bạn chọn buổi khác nhé." };
  if (action === "move") {
    const entry = matches[0]!;
    if (entry.day.day === dayNo && entry.pi === slotNo) return { content: "Mục này đã ở đúng ngày và buổi bạn yêu cầu; mình giữ nguyên lịch." };
    const duration = durationOf(entry.item);
    const start = gapStart(period.items, window, duration);
    if (start === null) return { content: "Buổi đích không đủ thời gian trống để chuyển mục này. Mình giữ nguyên lịch; bạn có thể chọn buổi khác hoặc bỏ một mục trước." };
    if (entry.item.place?.placeType === "ATTRACTION" && (plan.preferences?.pace === "gentle" || plan.preferences?.avoidWalking || plan.preferences?.hasChildren || plan.preferences?.seniors)
      && day.periods.some(period => period.items.some(item => item.place?.placeType === "ATTRACTION" && item.id !== entry.item.id))) return { content: "Ngày đích đã có điểm tham quan chính. Mình giữ giới hạn lịch nhẹ của nhóm, chưa chuyển thêm điểm." };
    entry.period.items = entry.period.items.filter(item => item.id !== entry.item.id);
    period.items.push({ ...entry.item, title: `${clock(start)}${entry.item.title.slice(5)}` });
    affected.add(entry.day.day); affected.add(dayNo);
    return { content: `Đã chuyển ${entry.item.place?.name ?? entry.item.title} sang ngày ${dayNo}, buổi ${slots[slotNo]!.toLowerCase()}. Các ngày và mục khác được giữ nguyên; thời gian này vẫn là đề xuất, cần kiểm tra giờ hoạt động.`, plan: recompute(plan, affected) };
  }
  const originalItem = action === "replace" ? matches[0]!.item : undefined;
  const requestedType = originalItem?.place?.placeType ?? type ?? "ATTRACTION";
  if (requestedType === "RESTAURANT" && options.dietaryRestricted) return { content: "Nhóm có điều kiện ăn kiêng/dị ứng đang được giữ. Mình chưa thay hoặc thêm quán khi chưa có xác minh thành phần phù hợp; các mục còn lại giữ nguyên." };
  const used = new Set(entries.flatMap(entry => entry.item.place ? [entry.item.place.placeId] : []));
  const replacementText = action === "replace" ? message.split(/\s+bằng\s+|\s+bang\s+/i)[1] : undefined;
  const explicitReplacement = replacementText ? mentionedPlaces(normalize(replacementText), catalog) : [];
  if (explicitReplacement.length > 1 || (replacementText && !/\b(diem mien phi|quan khac|diem khac|re hon|mien phi)\b/.test(normalize(replacementText)) && explicitReplacement.length !== 1))
    return { content: "Tên địa điểm thay thế chưa khớp duy nhất với dữ liệu công khai. Bạn nêu tên cụ thể hoặc mở trang chi tiết để xác nhận nhé." };
  const namedAdd = action === "add" && named.length ? named : null;
  if (action === "add" && !namedAdd && !/\b(diem (?:check.in|chup|tham quan|mien phi|khac)|quan an|bua an)\b/.test(n)) return { content: "Tên địa điểm muốn thêm chưa khớp dữ liệu công khai. Bạn nêu tên cụ thể hoặc yêu cầu một điểm tham quan/quán ăn, kèm ngày và buổi nhé." };
  const availableRows = explicitReplacement.length ? explicitReplacement : namedAdd ?? catalog;
  const originalStart = originalItem ? minutes(originalItem.title.slice(0, 5)) : null;
  const candidateStart = (row: PlaceSearchRow) => {
    const duration = row.placeType === "ATTRACTION" ? row.visitDurationMinutes ?? 90 : 60;
    if (originalStart === null) return gapStart(period.items, window, duration);
    if (originalStart < window.start || originalStart + duration > window.end) return null;
    return period.items.some(item => item.id !== originalItem?.id && originalStart < minutes(item.title.slice(0, 5)) + durationOf(item) && originalStart + duration > minutes(item.title.slice(0, 5))) ? null : originalStart;
  };
  let candidates = availableRows.filter(row => row.placeType === requestedType && !used.has(row.placeId)
    && !options.excludedIds?.includes(row.placeId) && !options.excludedNames?.some(term => normalize(row.name).includes(normalize(term)))
    && (!/mien phi/.test(n) || row.priceMin === 0)
    && candidateStart(row) !== null);
  if (plan.preferences?.avoidWalking || plan.preferences?.pace === "gentle" || plan.preferences?.seniors || plan.preferences?.hasChildren) {
    candidates = candidates.filter(row => (row.visitDurationMinutes ?? 90) < 240 && !/bac thang|leo nui|trekking|duong doc/.test(normalize(`${row.name} ${row.description ?? ""}`)));
    if (action === "add" && requestedType === "ATTRACTION" && day.periods.some(period => period.items.some(item => item.place?.placeType === "ATTRACTION"))) return { content: "Ngày này đã có điểm tham quan chính; mình giữ nhịp nhẹ của nhóm, chưa thêm điểm." };
  }
  if (!candidates.length) return { content: "Chưa có địa điểm thay thế/thêm mới đúng loại, điều kiện loại trừ và thời gian trống. Mình giữ nguyên lịch; bạn có thể chọn buổi khác hoặc nới điều kiện cụ thể." };
  if (matches.length > 1) return { content: "Địa điểm này kéo dài qua nhiều buổi. Bạn chỉ rõ buổi cần thay; mình chưa sửa để tránh giữ lại nửa lịch ở điểm cũ." };
  const selected = candidates[0]!;
  const start = candidateStart(selected)!;
  const newItem: ChatPlanItem = {
    id: originalItem?.id ?? `item_${randomUUID()}`,
    title: originalItem?.title ?? `${clock(start)} · ${requestedType === "RESTAURANT" ? "Ăn uống" : "Tham quan & check-in"}`,
    detail: `Địa điểm được chọn từ dữ liệu công khai. Cần xác nhận giờ hoạt động và thời gian di chuyển. ${selected.priceText ?? "Chưa có giá"}`,
    place: placeCard(selected), durationMinutes: selected.placeType === "ATTRACTION" ? selected.visitDurationMinutes ?? 90 : 60,
    estimatedCost: itemCost(selected, plan),
  };
  if (originalItem) period.items = period.items.map(item => item.id === originalItem.id ? newItem : item);
  else period.items.push(newItem);
  affected.add(dayNo);
  return { content: `Đã ${action === "replace" ? "thay " + originalItem?.place?.name + " bằng " : "thêm "}${selected.name} vào ngày ${dayNo}, buổi ${slots[slotNo]!.toLowerCase()}. Những mục khác giữ nguyên. Chi phí vé được tính lại từ dữ liệu đã biết; các khoản chưa biết vẫn để chưa xác định.`, plan: recompute(plan, affected) };
}
