# Bước 3 — Thu thập phản hồi để kiểm chứng AI

Ngày kiểm tra: 05/11/2026. Database hiện có **0 đánh giá, 0 phiếu khảo sát SUBMITTED**, hai bộ câu hỏi FULL/QUICK. Đây là trạng thái thiếu phản hồi thực tế, không phải AI đã phân tích thành công ý kiến thật của du khách.

## Luồng sử dụng

1. Admin mở `/admin/ai`, mục **Phản hồi cho AI: còn thiếu dữ liệu gì?**, bấm **Kiểm tra dữ liệu**.
2. Chọn khảo sát đang mở hoặc địa điểm mà người được mời đã trải nghiệm. Sao chép liên kết; hệ thống không tự gửi lời mời.
3. Mời người dùng tự trả lời, không điền hộ, không yêu cầu cho điểm tốt. Người dùng khảo sát cần đồng ý chia sẻ dữ liệu trước khi gửi. Đánh giá địa điểm cần tài khoản khách du lịch.
4. Admin vào `/admin/danh-gia` đọc đánh giá chờ duyệt. AI chỉ hỗ trợ gắn cờ, quyết định duyệt/ẩn vẫn thuộc Admin. Không duyệt chỉ nhằm đạt số lượng.
5. Có ít nhất 5 đánh giá đã duyệt tại **cùng một địa điểm công khai** thì thử tóm tắt ở trang chi tiết. Tổng 5 đánh giá rải rác ở nhiều địa điểm không đáp ứng điều kiện này.
6. Để thử nháp trả lời, cần ít nhất một đánh giá đã duyệt ở cơ sở có đối tác đã được duyệt. Đối tác mở `/partner/danh-gia`; tạo nháp chưa gửi/lưu phản hồi.
7. Người dùng gửi khảo sát tại `/khao-sat` hoặc bản nhanh `/khao-sat?mode=quick`. Admin vào `/admin/khao-sat` chọn khảo sát và phân tích. Phiếu chỉ có điểm/lựa chọn vẫn có thống kê; AI cần câu văn bản để nhóm chủ đề.
8. Trở lại `/admin/ai` làm mới để xem dữ liệu còn thiếu. “Có dữ liệu” nghĩa là đủ điều kiện chạy tính năng, không phải kết luận mẫu khảo sát đại diện cho toàn bộ du khách.

Nếu chạy localhost, liên kết chỉ có tác dụng trên máy đang chạy website. Để mời người khác trên Internet, mở trang quản trị qua địa chỉ đã triển khai rồi sao chép liên kết. Không đưa địa chỉ quản trị hoặc tài khoản/khóa truy cập vào lời mời.

## API bổ sung

`GET /api/ai/admin/feedback-readiness`, chỉ dành cho ADMIN, không gọi model.

- Số đánh giá APPROVED/PENDING ở địa điểm ACTIVE, số địa điểm đạt ngưỡng 5 và số đánh giá thuộc đối tác đã duyệt.
- Số phiếu SUBMITTED và câu tự do đúng loại TEXT, có nội dung, không trộn câu trả lời số. Không tính phiếu SENT.
- Bốn trạng thái tính năng và điều kiện cụ thể, tối đa 50 địa điểm công khai kèm số đánh giá còn thiếu.
- Danh sách khảo sát kèm trạng thái mở/hết hạn và liên kết biểu mẫu phù hợp cho FULL, QUICK, CUSTOM. Khảo sát đã lưu trữ không xuất hiện.
- Không trả tên/email người trả lời, nội dung đánh giá hoặc góp ý trong bảng theo dõi này. Số liệu là bản ghi SQL; hệ thống chưa xác minh danh tính người trả lời ẩn danh.

Không thêm API key hoặc dịch vụ trả phí cho bước này.

## Kiểm chứng

Từ `backend`:

```sh
npm run test:feedback
npm test
npm run build
```

`test:feedback` tạo các danh tính và nội dung có nhãn KIỂM THỬ trong **transaction không commit**, dùng SQL thật và các hàm AI thực tế ở chế độ dự phòng không gọi nhà cung cấp. Luôn rollback và so sánh số lượng/địa điểm/khảo sát trước-sau. Không tạo phản hồi giả lưu lâu dài hoặc gửi nháp ra ngoài. Chỉ chạy trên database development.

Các trường hợp: 4 đánh giá chưa đủ, 5 đánh giá phân bố 2 tích cực/1 trung lập/2 chưa hài lòng, nháp trả lời đúng sở hữu, không tự lưu nháp, kiểm duyệt giữ trạng thái PENDING, khảo sát chỉ lấy SUBMITTED, loại khảo sát hết hạn khỏi liên kết mời và địa điểm ẩn khỏi tình trạng công khai.

Chưa có phản hồi thật để chứng minh chất lượng nội dung model trên trải nghiệm thực tế; bộ kiểm thử transaction không thay thế được việc thu thập phản hồi của người dùng. Nhóm có thể bắt đầu mời trả lời qua các liên kết trên, sau đó nghiệm thu lại bằng từng vai trò User/Partner/Admin.

Kết quả đợt triển khai: 82 kiểm thử backend, 27 kiểm thử frontend và build hai phía đạt. Đã mở liên kết khảo sát nhanh trên trình duyệt và xác nhận vào đúng biểu mẫu 5 câu, không gửi một phản hồi giả để tạo số liệu. Giao diện Admin với tài khoản thật cần nhóm kiểm tra sau khi đăng nhập; quyền API, truy vấn SQL và điều kiện trạng thái đã được kiểm chứng bằng bộ kiểm thử.
