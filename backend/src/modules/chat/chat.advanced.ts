import { isTomorrowPreparation, prepareTomorrow } from "./chat.prepare";
import { airportTimingAnswer } from "./chat-airport-timing";
import { normalize } from "../ai/ai.rules";
import { conversationMessages } from "./chat.history";
import { comparisonNames, comparePlaces, resolvePlaceName } from "./chat.compare";
import { editTravelPlan, isPlanEdit, updateEditedPlanPreferences } from "./chat.plan-edit";
import { searchPlacesForChat, type PlaceSearchRow } from "./chat.repository";
import { isRestart } from "./chat.knowledge";
import type { SendMessageInput, ChatComparison, ChatTravelPlan, ChatMessageDto } from "./chat.types";

export interface AdvancedReply {
  content: string;
  sources?: ChatMessageDto["sources"];
  comparison?: ChatComparison;
  travelPlan?: ChatTravelPlan;
}

export function comparisonConclusion(message: string, rows: [PlaceSearchRow, PlaceSearchRow]): string | null {
  const n = normalize(message);
  const [a, b] = rows;
  if (/\b(re hon|gia tot hon|gia phong tot hon|uu tien gia|tiet kiem)\b/.test(n)
    && a.placeType === b.placeType && a.priceMin != null && b.priceMin != null) {
    const format = (row: PlaceSearchRow) => row.priceText ?? `${row.priceMin!.toLocaleString("vi-VN")}đ`;
    if (a.priceMin === b.priceMin) return `Hai nơi đang có cùng mức giá từ trong danh mục (${format(a)}). Đây chưa phải xác nhận giá theo ngày hoặc tình trạng còn chỗ.`;
    const lower = a.priceMin < b.priceMin ? a : b;
    const higher = lower === a ? b : a;
    const unitNote = a.placeType === "ACCOMMODATION"
      ? " Đây là giá phòng từ catalog; loại phòng, sức chứa, ngày ở và phụ phí có thể khác nhau."
      : a.placeType === "RESTAURANT"
        ? " Đây là mức giá món thấp nhất trong catalog, không phải tổng hóa đơn."
        : " Đây là giá vé trong catalog; điều kiện áp dụng có thể khác nhau.";
    return `Theo mức giá từ đang hiển thị, ${lower.name} có giá thấp hơn (${format(lower)} so với ${format(higher)}).${unitNote} Gô chưa xác nhận giá theo ngày.`;
  }
  if (/\b(nhieu danh gia hon|nhieu review hon)\b/.test(n) && a.reviewCount >= 0 && b.reviewCount >= 0) {
    if (a.reviewCount === b.reviewCount) return `DaNangGo đang ghi nhận cùng số đánh giá cho hai nơi: ${a.reviewCount}. Số đánh giá không tự cho biết chất lượng.`;
    const more = a.reviewCount > b.reviewCount ? a : b;
    const less = more === a ? b : a;
    return `DaNangGo đang ghi nhận ${more.reviewCount} đánh giá cho ${more.name} và ${less.reviewCount} cho ${less.name}. Số lượng nhiều hơn không tự khẳng định chất lượng tốt hơn.`;
  }
  return null;
}

export async function advancedReply(
  message: string,
  sessionId: number,
  owner: Pick<SendMessageInput, "guestId" | "userId">,
  constraints: { dietaryRestricted?: boolean; excludedIds?: number[]; excludedNames?: string[] },
  weatherOptions?: Parameters<typeof prepareTomorrow>[1],
): Promise<AdvancedReply | null> {
  const n = normalize(message);
  const scopedMessages = async () => {
    const messages = await conversationMessages(sessionId, owner);
    const reset = messages.map(turn => turn.sender === "USER" && isRestart(turn.content)).lastIndexOf(true);
    return messages.slice(reset + 1);
  };
  if (isTomorrowPreparation(n)) {
    const latest = [...await scopedMessages()].reverse().find(turn => turn.travelPlan);
    return prepareTomorrow(latest?.travelPlan, weatherOptions);
  }
  if (airportTimingAnswer(n)) {
    const latest = [...await scopedMessages()].reverse().find(turn => turn.travelPlan);
    return { content: airportTimingAnswer(n, latest?.travelPlan)! };
  }
  const comparative = /\b(noi nao|cho nao|toi uu tien (?:gia|vi tri|trai nghiem)|gan bien hon|re hon)\b/.test(n);
  const lastPair = comparative ? [...await scopedMessages()].reverse().find(turn => turn.comparison)?.comparison?.places : undefined;
  if (/\bso sanh\b/.test(n) || lastPair?.length === 2) {
    let names: [string, string] | null = lastPair?.length === 2 ? [lastPair[0]!.name, lastPair[1]!.name] : comparisonNames(message);
    if (!names && /hai (?:cho|diem|quan|khach san)/.test(n)) {
      const recent = [...await scopedMessages()].reverse().find(turn => turn.places?.length === 2 || turn.comparison);
      const places = recent?.comparison?.places ?? recent?.places;
      if (places?.length === 2) names = [places[0]!.name, places[1]!.name];
    }
    if (!names) return { content: "Bạn muốn so sánh chính xác hai địa điểm nào? Ví dụ: So sánh Hilton với Furama. Mình sẽ dùng dữ liệu và nguồn hiện có, không tự điền ô còn thiếu." };
    const rows = await Promise.all(names.map(name => searchPlacesForChat({ keywords: [name], strictKeywords: true, limit: 40 })));
    const matches = names.map((name, index) => resolvePlaceName(name, rows[index]!));
    if (matches.some(match => match.length !== 1)) return { content: "Mình chưa xác định duy nhất cả hai địa điểm trong dữ liệu công khai. Bạn nêu tên đầy đủ/chi nhánh; mình chưa dựng bảng để tránh so nhầm cơ sở." };
    const a = matches[0]![0]!, b = matches[1]![0]!;
    if (a.placeId === b.placeId) return { content: "Hai tên đang trỏ tới cùng một địa điểm. Bạn chọn thêm một cơ sở khác để so sánh nhé." };
    const conclusion = lastPair ? comparisonConclusion(message, [a, b]) : null;
    return { content: `Gô so sánh ${a.name} và ${b.name} từ dữ liệu DaNangGo. Ô còn thiếu vẫn được để trống. ${lastPair ? conclusion ?? "Gô giữ đúng hai nơi bạn đang cân nhắc. Tiêu chí vừa hỏi chưa có đủ số liệu tương ứng để xếp hạng; Gô chưa chọn nơi tốt hơn." : "Bạn ưu tiên giá, khu vực hay thời lượng để Gô giúp cân nhắc?"}`, comparison: comparePlaces([a, b]) };
  }
  const targeted = isPlanEdit(message) && /\b(bo|xoa|chuyen|bang|ngay\s*(?:\d+|mot|hai|ba)|buoi\s*(?:sang|trua|chieu|toi))\b/.test(n);
  const preferenceChange = /\b(den\s+(?:luc\s*)?\d|gio den|gio ve|ve\s+(?:luc\s*)?\d|taxi|o to|xe may|di bo|xe buyt)\b/.test(n) && !/\b\d+\s*(?:ngay|n\s*\d+\s*d)\b/.test(n);
  if (!targeted && !preferenceChange) return null;
  const latest = [...await scopedMessages()].reverse().find(turn => turn.travelPlan);
  if (latest?.travelPlan?.source === 'FAVORITES') return {content:'Lịch này lấy từ yêu thích. Bạn yêu cầu lập lại lịch từ yêu thích kèm điều kiện mới để Gô đọc danh sách hiện tại; Gô chưa tự thay bằng địa điểm ngoài danh sách.'};
  if (!targeted) {
    if (!latest?.travelPlan?.revision) return null;
    const result = updateEditedPlanPreferences(latest.travelPlan, message);
    return { content: result.content, travelPlan: result.plan };
  }
  if (!latest?.travelPlan) return { content: "Cuộc trò chuyện này chưa có lịch trình để chỉnh. Bạn cho biết số ngày, số người và ngân sách để mình lập bản nháp trước nhé." };
  const catalog = await searchPlacesForChat({ limit: 500 });
  const edited = editTravelPlan(latest.travelPlan, message, catalog, constraints);
  return { content: edited.content, travelPlan: edited.plan };
}
