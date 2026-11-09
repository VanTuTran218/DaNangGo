import type { ChatAnswer, Intent } from '../../Ai/promt';
import type { PlaceSearchRow } from './chat.repository';

/** Các trường thực tế luôn được dựng từ DB; không in prose/reason tự do của LLM. */
export function groundChatAnswer(answer: ChatAnswer, rows: PlaceSearchRow[], intent: Intent) {
  const byId = new Map(rows.map(row => [row.placeId, row]));
  const seen = new Set<number>();
  const places = answer.places.flatMap(place => {
    const row = byId.get(place.id);
    if (!row || seen.has(place.id)) return [];
    seen.add(place.id);
    const reasons = [row.districtName, row.priceText ? `Giá trong dữ liệu: ${row.priceText}` : 'Chưa cập nhật giá'];
    return [{ id: place.id, reason: reasons.filter(Boolean).join(' · ') }];
  }).slice(0, 5);
  const category = intent.category === 'food' ? 'quán ăn' : intent.category === 'stay' ? 'chỗ ở' : 'địa điểm tham quan';
  return {
    message: places.length ? `Mình gợi ý ${places.length} ${category} từ dữ liệu DaNangGo. Bạn xem giá và thông tin chi tiết ở các thẻ bên dưới nhé!`
      : 'Mình chưa tìm thấy địa điểm phù hợp. Bạn thử đổi khu vực, ngân sách hoặc mô tả rõ hơn nhé.',
    places,
  };
}
