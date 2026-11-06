# Gô — triển khai khung tư vấn và nhiều nhu cầu

Ngày kiểm tra: 2026-11-05.

## Nguồn yêu cầu

- `ai-knowledge/go-system-prompt.md`: giữ nguyên prompt người dùng cung cấp.
- `ai-knowledge/go-question-examples.md`: giữ bộ nhóm câu hỏi làm ví dụ thiết kế/kiểm thử, không phải whitelist hoặc lịch sử người dùng thật.
- `backend/src/Ai/go-policy.ts`: chính sách nghiệp vụ dùng chung cho công cụ phân tích ý định và công cụ diễn giải. Các thao tác lưu/xóa, truy vấn, chọn ID và ghép JSON do backend kiểm soát.

## Thay đổi

- Hiểu nhiều nhóm nhu cầu food/sight/stay; không ép “đi ăn và tham quan” thành một category. Phân biệt “khách sạn gần biển” với yêu cầu tham quan riêng.
- Chuẩn hóa một số cách viết thông dụng, số bằng chữ, 500k/5tr5/2 triệu rưỡi, mai/mốt. Câu khó hoặc chưa nhận ra dùng công cụ phân tích ngữ nghĩa khi provider khả dụng. Khi provider lỗi/tắt, chỉ dùng quy tắc đã kiểm chứng và hỏi lại; không đảm bảo mọi lỗi chính tả đều được hiểu.
- Tách số tiền khỏi phạm vi tổng nhóm/mỗi người/mỗi ngày/mỗi phòng đêm; không coi tổng tiền chuyến là giá tối đa của mỗi món. Giữ số ngày, khách, ngày đi, phương tiện, giờ, dự phòng và điều kiện lưu trú qua lượt sau.
- Câu nhiều nhu cầu thiếu điều kiện ngân sách quan trọng hỏi tối đa ba câu trước khi dựng lịch. Một khách/một ngày có thể dùng cùng số tiền đó làm dự trù mà không tự gán một phạm vi tiền mới vào confirmedContext.
- Gợi ý nhiều nhóm có tiêu đề, địa điểm đúng loại, cảnh báo và liên kết chi tiết/bản đồ. Lịch trình giữ sáng/trưa/chiều/tối và các luồng chỉnh từng mục cũ.
- Tên món và giá lấy từ `menu_items` đang có của địa điểm ACTIVE; không tự tạo món. Chưa có menu ghi rõ. Menu không xác minh dị ứng, mức cay hay tình trạng phục vụ trực tiếp.
- Bỏ các địa điểm mang tiền tố `[Mẫu]`, `[Test]`, `[Demo]` trong truy vấn gợi ý; ACTIVE không đồng nghĩa giá hoặc chính sách đã được kiểm chứng ngoài hệ thống.
- Câu kết hợp hỏi thời tiết/sự kiện với gợi ý địa điểm giữ cả thông báo thiếu API trực tiếp và phần nhu cầu có thể trả lời.
- Bổ sung metadata công khai: intent, secondaryIntents, needsClarification, questions, confirmedContext, profileSuggestions, sources, warnings, recommendationGroups.
- Giữ hợp đồng API hiện có `{ sessionId, message: { content, ... } }` để trang chat, widget, SSE và lịch sử không hỏng. `content` tương ứng `message` dạng chuỗi trong mẫu prompt; places/travelPlan/comparison chỉ có khi có kết quả tương ứng.

## Sở thích có xác nhận

Bảng mới `dbo.ai_user_preferences` được tạo qua migration 018 (đã chạy trên SQL local). Không seed sở thích, người dùng, khảo sát hoặc đánh giá giả.

- `GET /api/chat/profile`: xem sở thích của chủ thể đăng nhập.
- `PATCH /api/chat/profile`: `{ "keys": ["beach"], "consent": true }`.
- `DELETE /api/chat/profile`: `{ "keys": ["beach"] }` hoặc `{ "all": true }`.
- Chủ tài khoản lấy từ middleware xác thực; không nhận userId/guestId trong body.
- Chỉ lưu các khóa sở thích cho phép, có nguồn đồng ý và thời điểm. Thay sở thích đối nghịch trong transaction.
- “Tôi thích biển” dùng trong phiên; nút đồng ý hoặc “Hãy lưu tôi thích biển” mới ghi lâu dài. “Đồng ý” chỉ có hiệu lực khi có đề nghị lưu đang chờ.
- Phiên khách không lưu hồ sơ lâu dài. Thông tin dị ứng có nhắc riêng trước khi người dùng đồng ý.
- Giao diện Sở thích đã lưu xem và xóa từng ưu tiên/tất cả. Sửa ưu tiên qua chat với lệnh lưu mới. Kết quả cũ không được đưa sang tài khoản vừa chuyển.
- Xóa sở thích lâu dài không phải xóa lịch sử chat. Điều kiện người dùng đã nói rõ trong chuyến hiện tại vẫn là ngữ cảnh phiên; có thể bắt đầu chuyến mới để bỏ điều kiện cũ.

## Kết quả kiểm thử

| Kiểm tra | Kết quả |
|---|---|
| Backend `npm test` | 176/176 test đạt, kèm kiểm thử auth/upload hiện có |
| Frontend `npm test` | 30/30 test đạt |
| Backend `npm run build` | Đạt |
| Frontend `npm run build` | Đạt |
| `npm run test:go-policy` | Đạt: nhiều nhu cầu, ngân sách, menu từ SQL, guest, SQL ownership, xác nhận lưu và rollback |
| `npm run test:knowledge` | 24 lượt đạt |
| `npm run test:advanced` | 12 trường hợp đạt |
| `npm run test:trip-preferences` | 5 nhóm kiểm tra đạt |
| Trình duyệt `/chat`, màn hình nhỏ | Đã thử câu 4 triệu → xác nhận → lịch có tham quan và món trong menu; mở/đóng mục sở thích của khách thành công |

Các kiểm thử tích hợp SQL tắt Gemini để kiểm tra đúng tính quyết định, không đo chất lượng trả lời live của mọi câu hỏi mới. Kiểm thử HTTP hồ sơ dùng chủ thể xác thực thay thế trong ứng dụng test riêng; middleware đăng nhập thật có bộ kiểm thử riêng. Ghi hồ sơ trong kiểm thử SQL nằm trong transaction rollback; đã đối chiếu dữ liệu trước/sau, không lưu dữ liệu thử.

Chi tiết câu hỏi/kết quả: `ai-knowledge/go-policy-test-results.json`.

Các lỗi tìm thấy và sửa trong đợt này: callback chuẩn hóa “mai”, truy vấn quá sớm khi ngân sách chưa rõ, đếm trùng tuổi bé do ghép hai bản ngữ cảnh, ưu tiên taxi cũ lấn phương tiện mới, và nhánh thời tiết làm mất yêu cầu tìm quán. Lượt mới nhất luôn được ưu tiên khi ghép ngữ cảnh.

## Giới hạn dữ liệu hiện tại

- Không có API live thời tiết/sự kiện/tồn phòng/tồn vé/giao thông; câu trả lời nêu rõ giới hạn, không tạo dữ liệu thay thế.
- Không cam kết đủ ngân sách khi thiếu giá bữa ăn, phòng theo ngày hoặc phương tiện.
- Một số quán chưa có menu hoặc thành phần được xác minh. Không suy món phù hợp dị ứng chỉ từ tên.
- Lập lịch chi tiết hiện theo phạm vi công cụ 1–3 ngày. Câu nửa ngày/câu thiếu thời gian có thể được tư vấn lựa chọn và cần làm rõ trước khi chốt giờ; chưa phải bộ tối ưu lịch tự do mọi thời lượng.
- Đây là tích hợp chính sách và dữ liệu truy vấn, không phải huấn luyện/fine-tune mô hình từ những câu hỏi mẫu.
