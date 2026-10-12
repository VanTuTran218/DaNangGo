# Cơ sở dữ liệu - DaNangGo

Backend hiện sử dụng Microsoft SQL Server (`mssql`). Các migration trong thư mục này là T-SQL và cần chạy bằng SQL Server Management Studio (SSMS), không chạy bằng MySQL.

## Ý nghĩa các thư mục
- **`schema/`**: Chứa các file SQL khởi tạo cấu trúc bảng ban đầu (CREATE TABLE).
- **`migrations/`**: Chứa các file SQL cập nhật cấu trúc DB (ALTER TABLE, thêm/sửa cột). Mỗi thay đổi là một file mới được đánh số tiền tố (VD: `003_add_status.sql`, `004_update_price.sql`). **TUYỆT ĐỐI KHÔNG sửa lại file migration cũ đã chạy.**
- **`seeds/`**: Chứa các file SQL chèn dữ liệu mẫu ban đầu (INSERT INTO). Được đánh số thứ tự để chạy đúng logic khóa ngoại (VD: `010_roles.sql`, `020_users.sql`, `030_places.sql`).
- **`diagrams/`**: Chứa các file thiết kế cơ sở dữ liệu (VD: file `.dbml`, ảnh ERD).

## Chạy migration bằng SSMS

1. Tạo database `DaNangGo` trên đúng SQL Server instance mà backend sẽ kết nối.
2. Mở từng file `migrations/*.sql` trong SSMS và thực thi bằng **Execute** (F5), theo thứ tự số.
3. Để bật chức năng tạo lịch trình lấy dữ liệu từ database, cần chạy tối thiểu (bằng tài khoản quản trị database có quyền tạo bảng):
   - `001_setup_login.sql` để tạo/cấp quyền SQL Login cho backend.
   - `003_create_itinerary_training_data.sql` để lưu các cặp input/output lịch trình.
   - `004_create_itinerary_catalog.sql` để tạo catalog và nạp địa điểm lưu trú, ăn uống, tham quan.
4. Cấu hình `backend/.env` với đúng host, port, database, SQL Login và mật khẩu.

`004_create_itinerary_catalog.sql` có thể chạy lại an toàn: bảng chỉ được tạo khi chưa tồn tại, các địa điểm và nhãn sở thích được thêm theo `slug`/cặp duy nhất, không nhân bản dữ liệu đã seed.

`005_create_saved_itineraries.sql` là migration bổ sung, tạo schema lưu lịch trình (trạng thái nháp/đã lưu/đã lưu trữ), các hoạt động theo ngày và dự toán ngân sách; không bắt buộc để chạy API tạo lịch hiện tại. API hiện chưa ghi lịch vào các bảng này. Migration lưu nội dung hoạt động như ảnh chụp tại thời điểm tạo để lịch cũ không đổi khi catalog cập nhật giá hoặc thông tin địa điểm.

`006_extend_itineraries_for_authenticated_drafts.sql` phụ thuộc vào migration `005`; nó bổ sung chủ sở hữu, ngày/số ngày/số người/nhu cầu, giá đơn vị, bảng sở thích người dùng và trường loại phòng/sức chứa/giờ mở cửa/thời lượng/tọa độ trong catalog. Chạy lần lượt `005` rồi `006` nếu muốn dùng API tạo lịch nháp mới. Các trường catalog mới cần được điền bằng dữ liệu đã xác minh trước khi dùng để xếp lịch và báo giá thực tế.

Backend chưa triển khai đăng ký/đăng nhập. Endpoint tạo lịch yêu cầu JWT HS256 do dịch vụ xác thực cung cấp, `sub` phải là ID người dùng dạng số, token phải có `exp`, và backend cần `JWT_SECRET` trùng với secret ký token. Cột `user_id` trong migration hiện cho phép NULL để giữ tương thích dữ liệu cũ; endpoint mới luôn ghi ID lấy từ token, không nhận ID từ body.
