# Khảo sát người dùng và dữ liệu cho AI

Luồng đã nối: **Admin → khảo sát trong SQL → User gửi → thống kê → AI phân tích**.

## Chuẩn bị

Trong `backend` chạy `npm run migrate:surveys`, rồi khởi động lại backend. Script chạy lại an toàn, thêm cấu trúc còn thiếu và hai bộ câu hỏi `FULL_V1`, `QUICK_V1` khớp biểu mẫu hiện có. Không tạo phản hồi giả. Bộ câu hỏi hệ thống do hệ thống quản lý (`created_by` NULL); khảo sát Admin tạo vẫn gắn với tài khoản quản trị đã xác thực.

## API

| API | Chức năng |
|---|---|
| GET `/api/surveys` | Danh sách khảo sát riêng đang mở cho người dùng |
| GET `/api/surveys/:id` | Đọc câu hỏi khảo sát riêng; từ chối khảo sát đóng/hết hạn |
| POST `/api/surveys/submit` | Gửi khảo sát đầy đủ |
| POST `/api/surveys/quick` | Gửi khảo sát nhanh |
| POST `/api/surveys/respond` | Gửi khảo sát do Admin tạo |
| GET/POST `/api/admin/surveys` | Danh sách, thống kê và tạo khảo sát; chỉ ADMIN |
| PUT/DELETE `/api/admin/surveys/:id` | Sửa/đóng hoặc lưu trữ khảo sát; chỉ ADMIN |
| GET `/api/ai/admin/surveys` | Danh sách khảo sát SQL cho AI |
| GET `/api/ai/admin/surveys/:id/report` | Thống kê SQL và phân tích các góp ý đã gửi |

Khảo sát Admin tạo hiện hỗ trợ câu hỏi sao và văn bản theo giao diện quản trị. Người dùng mở qua `/khao-sat?surveyId=:id`; trang khảo sát chính cũng có danh sách khảo sát đang mở. Hai bộ hệ thống giữ nguyên mã và cấu trúc để không lệch với wizard/quick sheet; Admin có thể đổi tiêu đề/mô tả, mở hoặc đóng. Không cho sửa cấu trúc khi khảo sát đã có phản hồi; cần tạo khảo sát mới. Xóa khảo sát riêng chỉ lưu trữ/đóng, giữ phản hồi.

## Dữ liệu và tính chính xác

- Gửi thành công chỉ khi transaction SQL đã commit và API trả `responseId`. Lỗi không tạo màn hình cảm ơn, không xóa nháp, không ghi hoàn thành vào localStorage.
- `request_id` UUID được giữ cho lần gửi lại cùng nội dung; SQL kiểm tra hash và unique index để tránh ghi hai phiếu khi retry. Sửa nội dung tạo request ID mới. Đây không phải cơ chế xác minh một người chỉ được trả lời một lần.
- Phản hồi gửi ẩn danh: không ghi tài khoản, itinerary ID, place ID, IP hoặc user agent vào bản ghi khảo sát. Thông tin itinerary chỉ dùng trong trình duyệt để quản lý lời mời. Không nhận `userId` từ client.
- Cần đồng ý chia sẻ dữ liệu trước khi gửi cả FULL, QUICK và CUSTOM. API kiểm tra câu bắt buộc, mã câu hỏi/phương án hợp lệ, giá trị và loại dữ liệu.
- Điểm hài lòng/trải nghiệm dùng `answer_score` 1–5. Chưa dùng được lưu NULL điểm với dấu `CHUA_SU_DUNG`, không tự biến thành 0 hoặc 4 sao. Ô chưa trả lời khác với ô chưa sử dụng.
- Điểm giới thiệu 0–10 và ngân sách dùng `answer_number`, không trộn vào trung bình sao. Điểm giới thiệu hiển thị là **trung bình /10**, chưa gọi là chỉ số NPS phần trăm.
- Một câu có nhiều lựa chọn dùng một `survey_answers` và nhiều dòng `survey_answer_options`, giữ ràng buộc một câu/một phiếu. Thống kê lựa chọn lấy từ SQL.
- AI chỉ lấy các câu văn bản thuộc phiếu SUBMITTED, cùng khảo sát và không có `answer_number`. Điểm số, số phiếu và số lượt chọn do SQL tính; nội dung được ẩn thông tin liên hệ/tên theo bộ lọc trước khi gửi model. Không đủ câu tự do vẫn có thống kê, không tự tạo góp ý.
- Lưu trữ backend không có định danh tài khoản; văn bản tự do vẫn có thể chứa thông tin người dùng tự nhập. Bộ lọc trước AI không thay cho kiểm tra dữ liệu riêng tư khi xuất/chia sẻ dữ liệu.

## Kiểm tra

- `npm run test` trong backend: kiểm tra schema, phân quyền, giới hạn điểm, lựa chọn và trạng thái chưa sử dụng.
- `npx tsx src/scripts/check-surveys.ts`: kiểm tra SQL thật với dữ liệu tạm có nhãn, tự dọn đúng các phiếu và khảo sát được tạo khi kiểm tra. Kiểm tra FULL/QUICK/CUSTOM, retry không trùng, sửa cấu trúc sau phản hồi, khảo sát đóng, thống kê và AI dự phòng. Không gửi dữ liệu thử đến Gemini.
- Trong frontend: `npm run test`, `npm run build`.
- Thử User tại `/khao-sat`, Admin tại `/admin/khao-sat`. Sau khi có phản hồi thật, tải lại danh sách trong khung AI rồi chọn khảo sát để phân tích.

Giới hạn hiện tại: khảo sát ẩn danh có rate limit theo IP và chống trùng lần gửi; chưa có xác minh danh tính/người trả lời hay chống bot chuyên sâu. Giao diện Admin chưa có xuất Excel hay giao diện khôi phục khảo sát đã lưu trữ.


## Kết quả kiểm tra lần triển khai

- 72 kiểm thử trong bộ backend (có cả kiểm thử API client không giả thành công khi 404/500/offline), 25 kiểm thử frontend và build hai phần đạt.
- SQL thật: FULL, QUICK, CUSTOM; chống trùng; NPS 0 và 10; đa lựa chọn; thống kê Admin; AI nhóm góp ý; từ chối sửa câu hỏi sau phản hồi và từ chối khảo sát đóng.
- Gửi FULL qua trình duyệt đã lưu SUBMITTED với 12 dòng trả lời, user_id/itinerary_id NULL và consent_agreed=1; màn cảm ơn xuất hiện sau xác nhận SQL.
- Đã dọn riêng các dữ liệu kiểm thử. Giữ 2 bộ hệ thống: FULL_V1 (23 câu) và QUICK_V1 (5 câu), không giữ phiếu giả trong thống kê.
