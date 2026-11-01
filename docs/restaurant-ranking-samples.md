# Dữ liệu test Top nhà hàng

`npm run seed:ranking:restaurants` (chạy trong `backend/`) tạo 15 tài khoản PARTNER `food01`–`food15@restaurant-ranking.dananggo.test`, hồ sơ `TABLE/APPROVED`, 15 địa điểm `RESTAURANT/ACTIVE` và 81 review `APPROVED` để thử Top ranking. Tất cả đều nằm trong một transaction. Chạy lại sẽ không tạo trùng, đổi mật khẩu hoặc khôi phục review đã chỉnh để test; thiếu tài khoản hay nhà hàng sẽ báo lỗi.

Trước khi chạy, bật SQL Server development của project và đặt `SEED_RANKING_PASSWORD` ít nhất 12 ký tự. Script từ chối `NODE_ENV=production`; cần có roles `USER/PARTNER`, một `ADMIN/ACTIVE` và districts 1 (Hải Châu), 2 (Sơn Trà), 4 (Thanh Khê). Mật khẩu chỉ lấy từ biến môi trường, không lưu trong repo.

Tên, địa chỉ và ảnh của 14 địa điểm đầu được đối chiếu với [danh sách cơ sở ăn uống của cổng du lịch Đà Nẵng](https://danangfantasticity.com/ru/am-thuc/co-so-an-uong-dat-chuan-phuc-vuc-khach-du-lich-tai-dia-ban-thanh-pho-da-nang); địa điểm thứ 15 theo [bài về Bếp Hên](https://danangfantasticity.com/en/kham-pha/bep-hen). URL ảnh gốc lưu trong `database/seeds/danang-real-restaurants.json`; file ảnh tải về nằm ở `frontend/public/places/real-restaurants/`, đường dẫn tương ứng lưu tại `place_images` trong DB. Các nguồn này mô tả địa điểm tại thời điểm xuất bản (2019–2020), không xác nhận địa điểm còn mở cửa hoặc địa chỉ hiện tại.

Tài khoản đối tác, trạng thái duyệt và review là **giả lập** để test. Địa điểm không có giá, giờ mở cửa hay tọa độ vì các nguồn trên không xác nhận dữ liệu hiện tại. Mô tả mỗi bài đăng ghi rõ nguồn và tính giả lập; bộ seed không gửi email hoặc tạo giao dịch.

Kiểm tra: `/admin/doi-tac` ở tab **Đang hoạt động** hoặc **Tất cả**; `/admin/dia-diem` ở nhóm Ẩm thực; `GET /api/places/top?type=RESTAURANT&limit=50` sẽ có cả 15 địa điểm nếu trạng thái/review chưa bị thay đổi. Top mặc định chỉ hiển thị 10. Có thể ẩn một review ở cơ sở có đúng 3 review để thử ngưỡng rồi duyệt lại.
