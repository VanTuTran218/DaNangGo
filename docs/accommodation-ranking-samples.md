# Dữ liệu mẫu đối tác lưu trú / Top ranking

Bộ dữ liệu development tạo bởi `backend/src/scripts/seed-accommodation-ranking.ts`:

- 15 tài khoản PARTNER ACTIVE, email đã xác thực; hồ sơ STAY/APPROVED, có người và thời điểm duyệt.
- 15 bài giới thiệu cơ sở trong `places` + `accommodations`, trạng thái ACTIVE, có mô tả, ảnh minh họa và `verified_at`.
- 30 loại phòng ACTIVE (phòng đôi và phòng gia đình).
- 10 tài khoản USER mẫu, tạo tổng cộng 81 review APPROVED. Summary được tính bằng `recalculatePlaceReviewSummary`, không gán điểm tổng hợp giả.
- Tên cơ sở có tiền tố `[Mẫu Ranking]`; email thuộc miền thử nghiệm `ranking.dananggo.test`. Không gửi email, không tạo giao dịch thanh toán.

## Chạy trên database development

1. Áp dụng `database/migrations/009_accommodation_ranking_samples_support.sql` bằng SQL Server trên database của backend. Migration mở rộng loại lưu trú và bổ sung `room_count` nếu thiếu; không sửa migration cũ.
2. Từ thư mục `backend`, đặt `$env:SEED_RANKING_PASSWORD` thành mật khẩu thử nghiệm ít nhất 12 ký tự, rồi chạy `npm run seed:ranking`.
3. Chạy lại sẽ bỏ qua bộ dữ liệu đầy đủ, không đổi mật khẩu hoặc tạo trùng. Nếu chỉ tồn tại một phần, script báo lỗi để kiểm tra; mọi lần tạo mới chạy trong một transaction.

Script từ chối `NODE_ENV=production`. Cần có roles USER/PARTNER, một ADMIN ACTIVE và districts. Migration 009 nên chạy sau các migration lưu trú cũ (006).

## Tài khoản và thứ tự kỳ vọng ban đầu

Email có dạng `stayNN@ranking.dananggo.test`, với NN trong bảng. Mật khẩu là giá trị `SEED_RANKING_PASSWORD` khi tạo lần đầu.

| NN | Cơ sở mẫu | Loại | Điểm | Review đã duyệt |
|---|---|---|---|---|
| 01 | Resort Biển Ngọc | RESORT | 5.0 | 8 |
| 02 | Resort Sơn Trà | RESORT | 5.0 | 3 |
| 03 | Resort Cát Trắng | RESORT | 4.8 | 10 |
| 04 | Hostel Balo Xanh | HOSTEL | 4.8 | 5 |
| 05 | Hostel Cầu Rồng | HOSTEL | 4.7 | 6 |
| 06 | Hostel Phố Biển | HOSTEL | 4.7 | 3 |
| 07 | Homestay Nắng Sớm | HOMESTAY | 4.5 | 8 |
| 08 | Homestay Vườn Nhỏ | HOMESTAY | 4.5 | 4 |
| 09 | Homestay Sông Hàn | HOMESTAY | 4.4 | 5 |
| 10 | Apartment An Thượng | APARTMENT | 4.3 | 6 |
| 11 | Apartment Mỹ Khê | APARTMENT | 4.3 | 3 |
| 12 | Apartment Bạch Đằng | APARTMENT | 4.2 | 5 |
| 13 | Hotel Bình Minh | HOTEL | 4.0 | 7 |
| 14 | Hotel Hải Âu | HOTEL | 4.0 | 3 |
| 15 | Hotel Thành Phố | HOTEL | 3.6 | 5 |

`/places` → Top lưu trú hiển thị tối đa 10 nơi. API `GET /api/places/top?type=ACCOMMODATION&limit=50` trả cả 15 nơi ban đầu. Thứ tự có thể thay đổi khi bổ sung/ẩn/sửa đánh giá hoặc địa điểm.

Admin `/admin/doi-tac`: chọn **Đang hoạt động** hoặc **Tất cả** (tab mặc định Chờ duyệt không chứa các đối tác này). `/admin/dia-diem` hiển thị 15 bài giới thiệu đã duyệt.

Kiểm tra ngưỡng 3 review: trên cơ sở có đúng 3 đánh giá, ẩn một đánh giá qua admin; cơ sở sẽ rời Top. Duyệt lại review để khôi phục. Chạy lại seed không tự khôi phục những thay đổi thử nghiệm này.
