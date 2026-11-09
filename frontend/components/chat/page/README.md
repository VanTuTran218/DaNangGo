# Giao diện riêng cho trang /chat

Các component trong thư mục này chỉ trình bày dữ liệu được truyền từ `ChatExperience`. Giao diện widget vẫn dùng JSX cũ, `TravelPlan.tsx` cũ và cùng logic hội thoại như trước.

## File tạo và sửa

Sửa:

- `frontend/app/(main)/chat/page.tsx`: nền trang, chiều cao theo viewport, bỏ Footer khỏi riêng /chat.
- `frontend/components/chat/ChatBox.tsx`: nối nhánh giao diện page vào state/handler có sẵn. Ref ô nhập hỗ trợ thêm textarea; input của widget giữ nguyên.

Tạo trong thư mục này:

| File | Trách nhiệm |
| --- | --- |
| `ChatPageView.tsx` | Ghép UI; state trình bày cho panel, drawer và ngày đang xem |
| `ChatShell.tsx` | Bố cục ba vùng, cuộn độc lập |
| `ChatSidebar.tsx` | Làm mới, lối tắt và mẹo tĩnh |
| `QuickStartList.tsx` | Trình bày lại đúng các câu gợi ý đã có |
| `ChatHeader.tsx` | Gô, trạng thái xử lý, nút panel và làm mới |
| `EmptyState.tsx` | Lời chào và các thẻ bắt đầu nhanh |
| `MessageBubble.tsx` | Tin nhắn, thẻ địa điểm, sao chép, TypingIndicator |
| `ChatComposer.tsx` | Ô nhập tự giãn, giới hạn 500 ký tự, SuggestionChips |
| `ItineraryCard.tsx` | DayTabs, Timeline, ảnh địa điểm, BudgetBar |
| `TripSummaryPanel.tsx` | Tóm tắt từ lịch trình gần nhất, nút xem từng ngày |
| `TripInvitation.tsx` | Panel trống dạng postcard Cầu Rồng; CTA điền câu mẫu hiện có |
| `ChatDrawer.tsx` | Native dialog có quản lý focus; bottom sheet kéo đóng trên mobile |
| `ChatPage.module.css` | Style cô lập, màu từ theme hiện có, responsive và reduced motion |

## Phạm vi bảo toàn

Không thay đổi endpoint, payload, timeout, SSE, abort, xử lý lỗi, session, tên khóa storage, prompt, types hay cấu trúc tin nhắn/lịch trình. Các handler `send`, `resetChat`, `goToPlace` và các effect/state hội thoại trong ChatBox giữ nguyên. Public prop `variant` giữ nguyên.

Các khác biệt chỉ phục vụ UI đã được người dùng đồng ý: textarea/ref tương ứng, chọn ngày, mở/đóng panel, drawer, sao chép Clipboard và focus/scroll khi thao tác các panel. Câu gợi ý được truyền nguyên văn vào handler cũ; nút postcard chỉ điền ô nhập, không tự gửi.

Navbar, RootLayout, Footer dùng chung, globals.css, BotLogo dùng chung, types, các file API và backend không bị sửa trong đợt thiết kế UI này. Chỉ bỏ Footer khỏi page /chat, không xóa component Footer khỏi dự án.

## Dữ liệu và tính năng chưa thêm

- Không có danh sách nhiều cuộc hội thoại nên không tạo nhóm Hôm nay/Trước đó hoặc lịch sử giả.
- Không có handler đánh giá hữu ích/chưa hữu ích nên không hiển thị nút thích/không thích.
- Không thêm geolocation; không có nút định vị quanh người dùng.
- Không thêm chế độ tư vấn khẩu vị riêng hoặc câu prompt mới. Các thẻ khởi đầu dùng đúng `QUICK_STARTS` hiện có.
- Mẹo là nội dung tĩnh; không thêm timer xoay vòng.
- Không dựng các khoản di chuyển/dự phòng khi dữ liệu không có. `foodAllowance` luôn ghi là dự kiến; `knownSubtotal` không được gọi là tiền đã chi thực tế.
- Không thêm API lưu, đặt dịch vụ, điều chỉnh lịch trình hoặc tài khoản. Các thao tác đó tiếp tục đi qua luồng cũ.

Đề xuất sau này, khi có yêu cầu nghiệp vụ riêng: API danh sách hội thoại, handler đánh giá câu trả lời và dữ liệu chi phí chi tiết. Chưa triển khai các phần này trong đợt UI.

## Xác minh

Chạy `npm run test` và `npm run build` trong `frontend`.

Kiểm tra giao diện: thẻ bắt đầu chỉ điền ô nhập; chip tiếp theo dùng handler gửi cũ; nút làm mới dùng reset cũ; panel chọn đúng ngày trong lịch; thu gọn panel; drawer mobile đóng/mở và trả focus về ô nhập. Chỉ các trường tồn tại trong dữ liệu thật mới được đưa lên thẻ.
