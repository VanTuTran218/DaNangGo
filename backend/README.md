# DaNangGo Backend

## Yêu cầu
- Node.js 18+
- SQL Server Express (localhost\SQLEXPRESS)

## Cài đặt

### 1. Cài dependencies
```bash
npm install
```

### 2. Tạo file .env
```bash
# Sao chép file mẫu
copy .env.example .env
```
Mở `.env` và điền password: `DB_PASS=TuTran@123`

### 3. Setup database
Mở SSMS và chạy file:
```
database/migrations/001_setup_login.sql
```

> Lưu ý: Đảm bảo SQL Server đã bật **Mixed Mode Authentication** và **TCP/IP port 1433**

### 4. Chạy server
```bash
npm run dev
```

Server chạy tại: `http://localhost:5000`

### Tạo lịch trình theo ngân sách

Chạy lần lượt `database/migrations/003_create_itinerary_training_data.sql` và `database/migrations/004_create_itinerary_catalog.sql` trong SQL Server. Migration `004` tạo catalog và nạp dữ liệu mẫu cho 17 lựa chọn lưu trú, 15 quán ăn và 14 điểm tham quan. Chạy migration bằng tài khoản quản trị database; SQL Login ứng dụng chỉ cần quyền đọc catalog và ghi mẫu lịch trình. Các mức giá là dữ liệu tham khảo cần được kiểm tra/cập nhật trước khi dùng thực tế.

Để bật lưu lịch nháp, chạy thêm `005_create_saved_itineraries.sql` rồi `006_extend_itineraries_for_authenticated_drafts.sql` theo thứ tự.

```http
GET /api/health
```

Tạo lịch nháp bằng:

```http
POST /api/itineraries
Authorization: Bearer <JWT>
Content-Type: application/json
```

JWT do dịch vụ xác thực cung cấp phải dùng HS256, có `sub` là ID người dùng dạng số và `exp`; cấu hình cùng secret trong `JWT_SECRET` (tối thiểu 32 ký tự). Backend chưa có API đăng nhập và không phát hành token.

Body yêu cầu `budget` (VND), `days` (1–3), `guestCount`, `startDate` (`YYYY-MM-DD`), ít nhất một `needs` trong `accommodation`, `food`, `attractions`; `prefs` có thể rỗng. `accType` và `stars` là tùy chọn. API đọc địa điểm đang hoạt động, tạo lịch trạng thái `DRAFT`, lưu chi tiết và ngân sách trong cùng transaction, đồng thời trả `itineraryId`, lịch theo ngày và `budgetStatus`. ID chủ sở hữu luôn lấy từ JWT.

`GET /api/itineraries/preferences` trả về các sở thích chủ đề đã lưu cho `user_id` trong bảng `user_itinerary_preferences`; frontend đọc token từ `localStorage.accessToken` để gọi API. Bảng và API này hiện hỗ trợ các nhãn sở thích chủ đề có trong catalog; loại món/khẩu vị chi tiết chưa có dữ liệu chuẩn hóa.

Ngân sách thấp hoặc thiếu lựa chọn catalog không chặn việc tạo bản nháp; phản hồi kèm cảnh báo. Các cột giờ mở cửa/thời lượng/tọa độ hiện được thêm bằng migration `006` nhưng dữ liệu catalog chưa được điền. API chỉ đường nội bộ cũng chưa được cung cấp; vì vậy thời gian và chi phí di chuyển hiện là ước tính theo ngày, không phải tuyến đường thực tế. Khi các dữ liệu/API đó sẵn sàng, cần tích hợp trước khi coi lịch là lịch trình đã tối ưu.

Đây là chức năng tư vấn/xem trước, không đặt phòng, đặt bàn, mua vé hoặc thanh toán. Người dùng có thể đóng form, bỏ qua gợi ý, tự thay đổi kế hoạch hoặc thêm lựa chọn dù dự toán vượt ngân sách.

Mỗi lần tạo thành công, lịch nháp, chi tiết, ngân sách và mẫu `itinerary_training_data` được ghi trong cùng transaction. Lịch trình vẫn được sinh bằng quy tắc, chưa gọi hay huấn luyện mô hình AI.
