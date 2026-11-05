# Cơ sở dữ liệu - DaNangGo

Backend hiện sử dụng Microsoft SQL Server (`mssql`). Các migration trong thư mục này là T-SQL và cần chạy bằng SQL Server Management Studio (SSMS), không chạy bằng MySQL.

## Ý nghĩa các thư mục
- **`schema/`**: Chứa các file SQL khởi tạo cấu trúc bảng ban đầu (CREATE TABLE).
- **`migrations/`**: Chứa các file SQL cập nhật cấu trúc DB (ALTER TABLE, thêm/sửa cột). Mỗi thay đổi là một file mới được đánh số tiền tố (VD: `003_add_status.sql`, `004_update_price.sql`). **TUYỆT ĐỐI KHÔNG sửa lại file migration cũ đã chạy.**
- **`seeds/`**: Chứa các file SQL chèn dữ liệu mẫu ban đầu (INSERT INTO). Được đánh số thứ tự để chạy đúng logic khóa ngoại (VD: `010_roles.sql`, `020_users.sql`, `030_places.sql`).
- **`diagrams/`**: Chứa các file thiết kế cơ sở dữ liệu (VD: file `.dbml`, ảnh ERD).

## Thứ tự chạy migration bằng SSMS

1. Tạo database `DaNangGo` trên đúng SQL Server instance mà backend sẽ kết nối.
2. Mở từng file `migrations/*.sql` trong SSMS và thực thi bằng **Execute** (F5), theo đúng thứ tự:
   - `001_setup_login.sql`: Tạo/cấp quyền SQL Login cho backend.
   - `002_create_booking_tables.sql`: Tạo bảng bookings, booking_items, payments, booking_status_logs.
   - `003_auth_upgrade.sql`: Nâng cấp schema bảng users (public_id, email_verified, khóa tài khoản, refresh_tokens, password_reset_tokens) cho hệ thống xác thực.
   - `003b_create_itinerary_training_data.sql`: Tạo bảng lưu các cặp input/output huấn luyện thuật toán lịch trình.
   - `004_create_itinerary_catalog.sql`: Tạo catalog và nạp danh mục địa điểm lưu trú, ăn uống, tham quan. (Chạy lại an toàn mà không nhân bản dữ liệu).
   - `005_create_saved_itineraries.sql`: Tạo bảng lưu lịch trình (itineraries, itinerary_items, itinerary_budgets).
   - `006_extend_itineraries_for_authenticated_drafts.sql`: Bổ sung người sở hữu, ngày bắt đầu, số người, nhu cầu, bảng sở thích người dùng và các trường năng lực phòng/tọa độ/giờ mở cửa catalog.
   - `007_add_snack_meal_period.sql`: Cho phép phân loại món ăn nhẹ buổi chiều và bổ sung các gợi ý ăn vặt.
   - `008_itinerary_management.sql`: Hỗ trợ quản lý lịch trình đã lưu và lưu chi phí giải trí trong dự toán.
3. Cấu hình `backend/.env` với đúng host, port, database, SQL Login và secret xác thực (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_SECRET`).

## Xác thực và lưu trữ lịch trình
Hệ thống xác thực đã hoàn thiện với JWT HS256 (`sub` là numeric ID người dùng). Khi người dùng đã đăng nhập, API tạo lịch (`POST /api/itineraries`) và tải sở thích (`GET /api/itineraries/preferences`) tự động nhận diện người dùng qua HTTP cookie `access_token` hoặc header `Authorization: Bearer <token>`, lưu bản nháp và liên kết trực tiếp với `user_id` trong cơ sở dữ liệu.


## Lịch sử AI và tương thích lưu lịch trình

Chạy `npm run migrate:ai` trong `backend` để thêm cột DTO hội thoại và thực thi `013_chat_planner_storage.sql` và `014_planner_catalog_preferences.sql`. Migration giữ nguyên schema lịch trình gốc. Kho bản nháp web dùng namespace `planner`; nếu các bảng `dbo` đã có đúng cấu trúc web thì namespace này dùng view trỏ tới dữ liệu đó. Nếu `dbo.itineraries` vẫn có khóa `itinerary_id` của schema gốc thì tạo bảng bản nháp mới trong `planner`, không đổi tên/xóa hay tự chuyển dữ liệu cũ. Không chạy seed mẫu trong thao tác này.


Migration khảo sát: chạy `npm run migrate:surveys` trong backend để áp dụng `015_survey_submission.sql` và khởi tạo hai bộ câu hỏi hệ thống. Script không tạo phiếu/câu trả lời giả; giữ nguyên dữ liệu có sẵn. Xem `docs/SURVEYS.md` để biết cách lưu ẩn danh, đa lựa chọn và thang điểm riêng.
