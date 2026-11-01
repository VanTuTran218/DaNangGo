# DaNangGo Backend

## Yêu cầu
- Node.js 18+
- SQL Server Express (localhost\SQLEXPRESS)

## Cài đặt

### 1. Cài dependencies
```bash
npm install
```

### 2. Cấu hình .env
Sao chép `.env.example` thành `.env` và điền thông tin:
```bash
copy .env.example .env
```
Thiết lập các biến môi trường chính:
- `DB_SERVER`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS`: Kết nối SQL Server
- `JWT_ACCESS_SECRET` / `JWT_SECRET`: Khóa ký access token HS256 (tối thiểu 32 ký tự)
- `JWT_REFRESH_SECRET`: Khóa ký refresh token (tối thiểu 32 ký tự)
- `FRONTEND_URL`: `http://localhost:3000`

### 3. Setup database trong SSMS
Mở SSMS và thực thi các migration theo thứ tự:
1. `database/migrations/001_setup_login.sql`
2. `database/migrations/002_create_booking_tables.sql`
3. `database/migrations/003_auth_upgrade.sql` (Nâng cấp bảng users, refresh tokens)
4. `database/migrations/003b_create_itinerary_training_data.sql` (Bảng training dataset)
5. `database/migrations/004_create_itinerary_catalog.sql` (Catalog địa điểm Đà Nẵng)
6. `database/migrations/005_create_saved_itineraries.sql` (Bảng lưu lịch trình và ngân sách)
7. `database/migrations/006_extend_itineraries_for_authenticated_drafts.sql` (Bổ sung user_id, nhu cầu, sở thích và catalog mở rộng)

### 4. Chạy server
```bash
# Development
npm run dev

# Chạy test
npm test

# Seed tài khoản quản trị (cần ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME trong .env)
npm run seed:admin
```

Server chạy tại: `http://localhost:5000`

---

## Các API chính

### 1. Xác thực (Authentication)
- `POST /api/auth/register`: Đăng ký tài khoản (khách du lịch `USER` hoặc đối tác `PARTNER`)
- `POST /api/auth/login`: Đăng nhập (tạo HTTP cookie `access_token` và `refresh_token`)
- `POST /api/auth/refresh`: Làm mới phiên đăng nhập
- `POST /api/auth/logout`: Đăng xuất và thu hồi refresh token
- `GET /api/auth/me`: Lấy thông tin tài khoản hiện tại (yêu cầu đăng nhập)
- `POST /api/auth/forgot-password`: Quên mật khẩu
- `POST /api/auth/reset-password`: Đặt lại mật khẩu theo token

### 2. Lịch trình du lịch (Itineraries)
- `GET /api/itineraries/preferences`: Lấy danh sách sở thích đã lưu của người dùng đăng nhập.
- `POST /api/itineraries`: Tạo và lưu bản nháp lịch trình du lịch thông minh theo ngân sách, số ngày (1–3), số người, ngày bắt đầu và các nhu cầu/sở thích.
  - Hỗ trợ cả HTTP cookie `access_token` và header `Authorization: Bearer <token>`.
  - Toàn bộ lịch trình, chi tiết các ngày, bảng dự toán và mẫu huấn luyện thuật toán được ghi trong 1 transaction an toàn.
  - Chi phí được tính theo số người và sức chứa phòng thực tế của danh mục địa điểm.
