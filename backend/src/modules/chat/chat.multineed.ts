import { searchPlacesForChat } from "./chat.repository";
import { placeCard } from "./chat.advisor";
import { dietaryNotice } from "./chat.knowledge";
import { isExcluded } from "./chat.exclusions";
import type { Dialogue } from "./chat.contract";
import type { ChatMessageDto, ChatLocation } from "./chat.types";
import { conversationalText } from "./chat.language";

export async function multiNeedReply(dialogue: Dialogue, message: string, location?: ChatLocation): Promise<{ content: string; groups: NonNullable<ChatMessageDto["recommendationGroups"]>; questions: string[]; warnings: string[] }> {
  const c = dialogue.context;
  const labels = { food: "Ẩm thực & món ăn", sight: "Tham quan & check-in", stay: "Lưu trú" };
  const dbTypes = { food: "RESTAURANT", sight: "ATTRACTION", stay: "ACCOMMODATION" } as const;
  const n = conversationalText(message);
  const groups = await Promise.all(dialogue.needs.map(async category => {
    const restricted = category === "food" && c.dietaryRestrictions.length > 0;
    const budget = c.budgetScope === "perPerson" && category !== "stay" || c.budgetScope === "perRoomPerNight" && category === "stay" ? c.budget : null;
    const rows = restricted ? [] : await searchPlacesForChat({ placeType: dbTypes[category], limit: 20, district: c.district,
      budget, location: /gan toi|gan day|quanh day/.test(n) ? location : undefined,
      keywords: category === "food" ? ["Mì Quảng", "hải sản", "bánh xèo", "cà phê", "cơm niêu", "bún chả cá"].filter(word => n.includes(conversationalText(word))) : [], strictKeywords: true,
    });
    const places = rows.filter(row => row.placeType === dbTypes[category] && !isExcluded(row.name, c.excludedPlaces)).slice(0, 3)
      .map(row => placeCard(row, `${labels[category]}${row.districtName ? ` · ${row.districtName}` : ""} · ${row.priceText ?? "Chưa cập nhật giá"}`));
    return { category, title: labels[category], places, notice: restricted ? dietaryNotice : places.length ? category === "food"
      ? "Giá là giá món trong catalog, không phải tổng hóa đơn một bữa. Tên quán/món không xác minh thành phần hoặc giờ đang phục vụ; xem menu tại trang chi tiết."
      : category === "stay" ? "Chưa xác nhận giá theo ngày, số phòng phù hợp hoặc phòng trống." : "Giá vé, thời lượng và giờ hoạt động cần đối chiếu trước khi đi."
      : "Gô chưa có kết quả đúng loại và các điều kiện đã xác nhận; không thay sang nhóm địa điểm khác." };
  }));
  const content = `Gô hiểu bạn muốn kết hợp ${dialogue.needs.map(need => ({ food: "ăn uống", sight: "tham quan", stay: "lưu trú" })[need]).join(", ")}${c.budget !== null ? ` với số tiền ${c.budget.toLocaleString("vi-VN")}đ${c.budgetScope ? " theo phạm vi bạn cung cấp" : " chưa rõ là tổng nhóm hay mỗi người"}` : ""}. Gô tách từng nhóm bên dưới để giữ đủ nhu cầu. Đây là các lựa chọn tham khảo; chưa phải lịch trình hoặc xác nhận đủ tiền cả chuyến.`;
  return { content, groups, questions: dialogue.pendingQuestions, warnings: ["Các nhóm tham khảo chưa phải gói dịch vụ, báo giá theo ngày hoặc xác nhận đặt chỗ.", ...groups.filter(group => !group.places.length).map(group => `${group.title}: ${group.notice}`)] };
}
