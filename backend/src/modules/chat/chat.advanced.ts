import { normalize } from "../ai/ai.rules";
import { conversationMessages } from "./chat.history";
import { comparisonNames, comparePlaces, resolvePlaceName } from "./chat.compare";
import { editTravelPlan, isPlanEdit } from "./chat.plan-edit";
import { searchPlacesForChat } from "./chat.repository";
import type { SendMessageInput, ChatComparison, ChatTravelPlan } from "./chat.types";

export interface AdvancedReply {
  content: string;
  comparison?: ChatComparison;
  travelPlan?: ChatTravelPlan;
}
export async function advancedReply(
  message: string,
  sessionId: number,
  owner: Pick<SendMessageInput, "guestId" | "userId">,
  constraints: { dietaryRestricted?: boolean; excludedIds?: number[]; excludedNames?: string[] },
): Promise<AdvancedReply | null> {
  const n = normalize(message);
  if (/\bso sanh\b/.test(n)) {
    let names = comparisonNames(message);
    if (!names && /hai (?:cho|diem|quan|khach san)/.test(n)) {
      const recent = [...await conversationMessages(sessionId, owner)].reverse().find(turn => turn.places?.length === 2 || turn.comparison);
      const places = recent?.comparison?.places ?? recent?.places;
      if (places?.length === 2) names = [places[0]!.name, places[1]!.name];
    }
    if (!names) return { content: "Bạn muốn so sánh chính xác hai địa điểm nào? Ví dụ: So sánh Hilton với Furama. Mình sẽ dùng dữ liệu và nguồn hiện có, không tự điền ô còn thiếu." };
    const rows = await Promise.all(names.map(name => searchPlacesForChat({ keywords: [name], strictKeywords: true, limit: 40 })));
    const matches = names.map((name, index) => resolvePlaceName(name, rows[index]!));
    if (matches.some(match => match.length !== 1)) return { content: "Mình chưa xác định duy nhất cả hai địa điểm trong dữ liệu công khai. Bạn nêu tên đầy đủ/chi nhánh; mình chưa dựng bảng để tránh so nhầm cơ sở." };
    const a = matches[0]![0]!, b = matches[1]![0]!;
    if (a.placeId === b.placeId) return { content: "Hai tên đang trỏ tới cùng một địa điểm. Bạn chọn thêm một cơ sở khác để so sánh nhé." };
    return { content: `Mình so sánh ${a.name} và ${b.name} từ dữ liệu DaNangGo. Ô còn thiếu giữ nguyên là chưa có dữ liệu. Bạn ưu tiên giá, khu vực hay thời lượng để mình giúp cân nhắc?`, comparison: comparePlaces([a, b]) };
  }
  const targeted = isPlanEdit(message) && /\b(bo|xoa|chuyen|bang|ngay\s*(?:\d+|mot|hai|ba)|buoi\s*(?:sang|trua|chieu|toi))\b/.test(n);
  if (!targeted) return null;
  const latest = [...await conversationMessages(sessionId, owner)].reverse().find(turn => turn.travelPlan);
  if (!latest?.travelPlan) return { content: "Cuộc trò chuyện này chưa có lịch trình để chỉnh. Bạn cho biết số ngày, số người và ngân sách để mình lập bản nháp trước nhé." };
  const catalog = await searchPlacesForChat({ limit: 500 });
  const edited = editTravelPlan(latest.travelPlan, message, catalog, constraints);
  return { content: edited.content, travelPlan: edited.plan };
}
