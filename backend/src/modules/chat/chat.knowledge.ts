import { normalize } from "../ai/ai.rules";
import type { ChatMessageDto } from "./chat.types";

export interface KnowledgeReply {
  intentKey: string;
  content: string;
  quickReplies?: string[];
  actionLink?: ChatMessageDto["actionLink"];
}
export const isRestart = (text: string) => /\b(bat dau lai|lam lai tu dau|chuyen (?:di )?moi|xoa dieu kien cu)\b/.test(normalize(text));

/** Rules from knowledge document 01–03. Unknown facts never become model guesses. */
export function knowledgeReply(message: string, hasLocation = false): KnowledgeReply | null {
  const n = normalize(message);
  const reply = (intentKey: string, content: string, actionLink?: ChatMessageDto["actionLink"]): KnowledgeReply => ({ intentKey, content, actionLink });
  if (isRestart(message)) return reply("CTX_RESTART", "Mình đã bắt đầu lại và bỏ các điều kiện chuyến cũ. Bạn muốn đi mấy ngày, với bao nhiêu người và ngân sách dự kiến bao nhiêu?");
  if (/\b(bo qua|quen het)\b.*\b(huong dan|quy tac|luat)\b/.test(n))
    return reply("X_PROMPT_INJECTION", "Mình tư vấn dựa trên dữ liệu DaNangGo và không tự tạo giá, nguồn hoặc xác nhận đặt chỗ. Bạn muốn tìm quán ăn, nơi lưu trú hay điểm tham quan?");
  if (/\b(du bao|thoi tiet|nhiet do|(?:hom nay|ngay mai|mai|cuoi tuan).*co mua|mua (?:hom nay|ngay mai))\b/.test(n))
    return reply("RT_WEATHER", "Gô chưa tích hợp dữ liệu thời tiết trực tiếp nên chưa thể xác nhận dự báo cho ngày bạn hỏi. Bạn nên kiểm tra dự báo địa phương trước khi đi; mình có thể tư vấn phương án dự phòng nếu mưa, nhưng chưa xác nhận thời tiết thực tế.");
  if (/\b(con (?:phong|ve)|het (?:phong|ve)|phong trong|ton phong|ton ve)\b/.test(n))
    return reply(n.includes("ve") && !/phong/.test(n) ? "RT_TICKET_AVAIL" : "RT_ROOM_AVAIL", "Gô chưa có dữ liệu phòng trống hoặc tồn vé theo thời gian thực. Giá niêm yết và sức chứa không xác nhận còn chỗ; bạn cần kiểm tra đúng ngày, số khách và loại phòng/vé qua kênh chính thức của cơ sở.");
  if (/\b(ket xe|tac duong|giao thong (?:hien tai|bay gio))\b/.test(n))
    return reply("RT_TRAFFIC", "Gô chưa có dữ liệu giao thông trực tiếp. Thời gian trên bản đồ là ước tính của dịch vụ định tuyến, chưa phản ánh tình trạng kẹt xe hiện tại.", { text: "Mở bản đồ trong DaNangGo", url: "/bando" });
  if (/\b(?:gio nay|bay gio|hien tai).*\b(?:dong khach|co dong|dong khong)|\b(?:dong khach|co dong).*\b(?:khong|hien tai)\b/.test(n))
    return reply("RT_CROWD", "Mình chưa có dữ liệu lượng khách hiện tại nên không thể xác nhận nơi đó đang đông hay vắng. Bạn nên hỏi trực tiếp cơ sở; mình có thể giúp cân nhắc điểm thay thế.");
  if (/\b(le hoi|su kien|lich bieu dien|may gio.*bieu dien|phun lua|phun nuoc)\b/.test(n))
    return reply("RT_EVENT", "Gô chưa có lịch sự kiện hoặc biểu diễn theo ngày đã được đối chiếu. Mình chưa thể xác nhận giờ diễn; bạn hãy kiểm tra thông báo chính thức của đơn vị tổ chức cho đúng ngày đi.");
  if (/\b(gia (?:hom nay|hien tai|bay gio)|gia ngay mai)\b/.test(n))
    return reply("RT_PRICE_NOW", "Mình chưa có báo giá trực tiếp theo ngày. Giá trong dữ liệu hoặc bảng giá niêm yết có điều kiện áp dụng và ngày đối chiếu riêng, không phải xác nhận giá hôm nay. Bạn muốn kiểm tra cơ sở nào?");
  if (/\b(dang mo|con mo|gio nay.*di dau|mo cua bay gio|mo cua hien tai)\b/.test(n))
    return reply("SIGHT_OPEN_NOW", "Mình chưa xác minh trạng thái mở cửa hiện tại hoặc lịch ngày lễ của cơ sở. Giờ thường lệ trong dữ liệu không bảo đảm đang mở; bạn muốn kiểm tra địa điểm nào để liên hệ trước khi đi?");
  if (/\b(nhan phong som|tra phong muon|gui hanh ly|den sau nua dem)\b/.test(n))
    return reply("STAY_TIMING", "Bạn muốn hỏi cơ sở nào? Giờ nhận/trả phòng công bố không xác nhận được nhận sớm, trả muộn, gửi hành lý hoặc nhận sau nửa đêm; cần hỏi cơ sở về điều kiện, phụ thu và khả năng đáp ứng đúng ngày.");
  if (/\b(co nguon|nguon dau|cap nhat khi nao|xac minh khi nao)\b/.test(n))
    return reply("COMPARE_SOURCE", "Các thẻ có mục Thông tin đối chiếu sẽ hiển thị liên kết nguồn và ngày đối chiếu theo từng trường. Trường không có nguồn/ngày xác minh vẫn là chưa xác minh trực tiếp. Bạn muốn kiểm tra thông tin của cơ sở nào?");
  if (/\b(dat|book|mua|goi)\s+(?:giup|dum|ho)\b|\b(?:dat phong|dat ban|mua ve|goi xe)\s+cho (?:toi|minh)\b/.test(n))
    return reply("X_BOOKING_REQUEST", "Gô có thể gợi ý và hướng dẫn liên hệ, chưa thực hiện đặt phòng, đặt bàn, mua vé hoặc gọi xe thay bạn. Bạn muốn liên hệ cơ sở nào? Mình sẽ chỉ dùng kênh có trong dữ liệu.");
  if (/\b(nghi ban ngay|nghi (?:vai|\d+) (?:gio|tieng)|phong theo gio)\b/.test(n) && !/\b(lich trinh|ke hoach|\d+\s*(?:ngay|n\d+d))\b/.test(n))
    return reply("STAY_DAYUSE", "Dữ liệu hiện chưa xác minh cơ sở nhận khách nghỉ ban ngày hoặc giá phòng theo giờ. Mình không dùng giá qua đêm thay cho nhu cầu này. Bạn cần liên hệ cơ sở để xác nhận thời gian nhận/trả, giá và phụ thu.");
  if (/\b(chi duong|duong di|khong ra duong|khong tim (?:duoc )?tuyen|khong (?:muon )?cap gps)\b/.test(n))
    return reply("MOVE_DIRECTIONS_IN_SITE", "Bạn mở Bản đồ trong DaNangGo, chọn địa điểm rồi bấm Chỉ đường để xem tuyến ngay trong web. Nếu không cấp GPS, bạn cho Gô biết điểm xuất phát để làm rõ yêu cầu. Bản đồ có thể dùng tâm thành phố làm điểm dự phòng; đó không phải vị trí thật của bạn. Tuyến và thời gian là ước tính, chưa xác nhận giá cước hoặc tình trạng giao thông.", { text: "Mở bản đồ trong DaNangGo", url: "/bando" });
  if (!hasLocation && /\b(gan toi|gan day|quanh day|quanh vi tri|gan khach san (?:toi|minh)|quanh khach san)\b/.test(n))
    return reply("MOVE_NO_GPS", "Mình chưa biết điểm xuất phát của bạn. Bạn có thể dùng Quanh vị trí tôi và cấp quyền vị trí, hoặc cho biết tên khách sạn/địa điểm hay khu vực. Mình không tự coi tâm Đà Nẵng là vị trí của bạn.");
  if (/\b(gop y|lam khao sat|phan hoi trai nghiem)\b/.test(n))
    return reply("TRUST_FEEDBACK", "Bạn có thể làm khảo sát để góp ý chuyến đi tổng thể. Nếu muốn đánh giá một cơ sở, hãy mở đúng trang địa điểm và viết đánh giá tại đó; hai loại phản hồi được lưu riêng.", { text: "Góp ý qua khảo sát", url: "/khao-sat?mode=quick" });
  if (/\b(review|danh gia)\b.*\b(nguoi that|that khong|that ko|xac thuc)\b/.test(n))
    return reply("TRUST_VERIFIED_USER", "DaNangGo có kiểm duyệt nội dung đánh giá. Việc đánh giá được duyệt không chứng minh danh tính hay việc người viết đã sử dụng dịch vụ; Gô không khẳng định tất cả là khách đã được xác thực.");
  if (/\b(danh gia the nao|khach.*khen|khach.*che|du danh gia|diem cao.*it (?:review|danh gia))\b/.test(n))
    return reply("TRUST_RATING_SUMMARY", "Bạn muốn xem đánh giá của địa điểm nào? Trên trang chi tiết, Tóm tắt đánh giá chỉ dùng các đánh giá đã duyệt của đúng cơ sở và cần ít nhất 5 mẫu; khi chưa đủ, Gô sẽ báo thiếu dữ liệu.");
  if (/\b(bao (?:sai|loi)|thong tin.*sai|gio mo cua sai)\b/.test(n))
    return reply("TRUST_REPORT_WRONG_INFO", "Bạn cho biết địa điểm, trường thông tin bị sai và nguồn đối chiếu nhé. Chat chưa có luồng gửi báo lỗi dữ liệu cho quản trị viên; mình chưa ghi nhận thành phiếu hay tự sửa thông tin cơ sở.");
  if (/\b(so sanh)\b/.test(n))
    return reply("COMPARE_TWO", "Bạn muốn so sánh chính xác hai cơ sở/điểm nào và ưu tiên giá, khu vực hay tiện ích? Hiện chat chưa có bảng so sánh tự động; bạn có thể mở trang chi tiết từng nơi. Trường chưa có dữ liệu cần giữ là chưa biết.");
  if (/\b(chuyen .*sang ngay|giu ngay .*sua|chi sua ngay|chuyen .*sang buoi)\b/.test(n))
    return reply("COMPARE_PARTIAL_EDIT", "Chat hiện chưa hỗ trợ chuyển hoặc sửa riêng từng mục theo ngày/buổi. Bạn có thể lưu bản nháp rồi chỉnh trong công cụ lịch trình; mình chưa thay đổi toàn bộ lịch để tránh làm mất phần bạn muốn giữ.", { text: "Mở lịch trình của bạn", url: "/lich-trinh" });
  if (/^\s*(re hon|gan hon|cho khac|bo cai do|bo cho do)[.!?\s]*$/.test(n))
    return reply("CTX_SHORT_REFINE", "Bạn muốn điều chỉnh quán ăn, chỗ ở hay điểm tham quan nào? Cho mình tên cụ thể để giữ các phần còn lại và tránh đổi nhầm.");
  return null;
}

/** Ingredient/taste tags do not prove absence of allergens or dietary suitability. */
export function dietaryConcern(text: string) {
  return /\b(di ung|an chay|thuan chay|khong an|kieng|khong cay|it cay|tranh (?:hai san|dau phong|sua|trung))\b/.test(normalize(text));
}
export const dietaryNotice = "Dữ liệu hiện chưa xác minh đầy đủ thành phần, dị ứng, món chay hoặc mức cay. Mình chưa có món/quán đủ căn cứ để xác nhận đáp ứng điều kiện này, nên chưa đưa thẻ gợi ý phù hợp. Bạn cần hỏi trực tiếp quán về thành phần và nguy cơ lẫn nguyên liệu trước khi gọi món; không suy món an toàn từ tên hoặc nhãn khẩu vị.";
