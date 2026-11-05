import { normalize } from "../ai/ai.rules";
import { placeCard } from "./chat.advisor";
import type { PlaceSearchRow } from "./chat.repository";
import type { ChatComparison } from "./chat.types";

const aliases: Record<string, string[]> = {
  "ba na": ["ba na"], "my khe": ["bai bien my khe", "bien my khe"],
  "cau rong": ["cau rong"], "son tra": ["ban dao son tra"],
  "ngu hanh son": ["danh thang ngu hanh son", "nui ngu hanh son"],
};
export function resolvePlaceName(query: string, rows: PlaceSearchRow[]) {
  const n = normalize(query).replace(/[?.!,]+$/g, "").trim();
  const exact = rows.filter(row => normalize(row.name) === n);
  if (exact.length) return exact;
  const terms = aliases[n] ?? [n];
  return n.length < 2 ? [] : rows.filter(row => terms.some(term => normalize(row.name).includes(term)));
}
export function comparisonNames(message: string): [string, string] | null {
  const n = message.replace(/^.*?so sánh\s*/iu, "").replace(/^.*?so sanh\s*/i, "");
  const parts = n.split(/\s+(?:với|và|hay|vs\.?|voi|va)\s+/i);
  return parts.length === 2 && parts.every(part => part.trim().length >= 2)
    ? [parts[0]!.trim(), parts[1]!.replace(/\s+(?:giúp|giup|cho)\s+(?:tôi|toi|mình|minh).*$/i, "").trim()]
    : null;
}
export function comparePlaces(rows: [PlaceSearchRow, PlaceSearchRow]): ChatComparison {
  const labels = { ATTRACTION: "Tham quan", RESTAURANT: "Ẩm thực", ACCOMMODATION: "Lưu trú" };
  return {
    places: rows.map(row => placeCard(row)),
    rows: [
      { label: "Loại", values: rows.map(row => labels[row.placeType]) },
      { label: "Khu vực", values: rows.map(row => row.districtName ?? "Chưa có dữ liệu") },
      { label: "Địa chỉ", values: rows.map(row => row.address ?? "Chưa có dữ liệu") },
      { label: "Giá trong catalog", values: rows.map(row => row.priceText ?? "Chưa có dữ liệu") },
      { label: "Đánh giá trong hệ thống", values: rows.map(row => row.reviewCount > 0 ? `${row.rating}/5 · ${row.reviewCount} đánh giá` : "Chưa có đánh giá") },
      { label: "Thời lượng tham quan dự kiến", values: rows.map(row => row.placeType === "ATTRACTION" && row.visitDurationMinutes ? `${row.visitDurationMinutes} phút` : "Chưa có dữ liệu / không áp dụng") },
      { label: "Giờ nhận/trả phòng có nguồn", values: rows.map(row => row.stayFacts?.hours ? `${row.stayFacts.hours.checkIn} / ${row.stayFacts.hours.checkOut} · đối chiếu ${row.stayFacts.hours.checkedOn}` : "Chưa có dữ liệu / không áp dụng") },
    ],
    notices: [
      "Chỉ so các thông tin có trong dữ liệu DaNangGo. Giá món, vé và giá một phòng/đêm có đơn vị khác nhau; không so trực tiếp thành giá cả chuyến.",
      "Giá/giờ niêm yết không xác nhận tồn phòng, vé hoặc trạng thái mở cửa hiện tại. Đánh giá ít mẫu chưa đủ để kết luận nơi nào tốt hơn.",
      ...(rows[0].placeType !== rows[1].placeType ? ["Hai lựa chọn khác loại; bạn nên chọn theo mục đích, không xếp hạng chung."] : []),
    ],
  };
}
