# HƯỚNG DẪN IMPORT VÀ CHẠY POSTMAN COLLECTION — TASK 10 (KIỂM THỬ HỆ THỐNG)

> **Người thực hiện:** Tú  
> **Dành cho:** Tín, QA & Toàn đội ngũ phát triển DaNangGo  
> **Bộ tài liệu:**
> - Postman Collection v2.1.0: `backend/postman/DaNangGo_Task10_Collection.postman_collection.json`
> - Environment JSON: `backend/postman/DaNangGo_Task10_Environment.postman_environment.json`

---

## 1. Tổng quan bộ Collection (34 Endpoints — 7 Nhóm chức năng)

Bộ sưu tập Postman đã được thiết kế chuẩn hóa theo **Postman Collection Format v2.1.0**, tích hợp sẵn:
1. **Auto-Token Capture Script:** Tự động bắt JWT Access Token khi thực hiện request Login (Partner & Admin) và lưu thẳng vào biến môi trường `partnerToken` / `adminToken` mà không cần copy-paste thủ công.
2. **Auto-ID Propagation Script:** Tự động lưu `testPlaceId` và `testMenuItemId` khi tạo mới hoặc truy vấn danh sách, giúp các request cập nhật, xóa, duyệt phía sau chạy liền mạch.
3. **Assertion Tests:** Mỗi endpoint đều có các bài kiểm thử tự động kiểm tra HTTP Status (200, 201, 400, 401, 403), cấu trúc JSON và dữ liệu trả về.

### Cấu trúc 7 thư mục:
| STT | Thư mục | Số Request | Mô tả chức năng |
|:---:|:---|:---:|:---|
| 1 | `1. Authentication & Session` | 4 | Đăng nhập Partner, Admin, lấy thông tin phiên (`/me`) và tự động nạp Token. |
| 2 | `2. Categories & Master Data` | 4 | Danh mục quận/huyện (`/districts`), ẩm thực (`/cuisines`), khẩu vị (`/tastes`), điểm tham quan. |
| 3 | `3. Public Search & Discovery` | 4 | Tìm kiếm tiếng Việt không dấu (`mi quang`), lọc theo quận và khoảng giá, xem chi tiết quán. |
| 4 | `4. Partner Place Management` | 7 | Quản lý cơ sở của đối tác: Danh sách, Chi tiết, Tạo mới, Sửa, Ẩn/Hiện (`PATCH /status`), Hồ sơ đối tác. |
| 5 | `5. Menu Items & Price Sync` | 5 | Quản lý thực đơn: Danh sách món, Thêm món, Chi tiết món, Cập nhật giá, Xóa mềm món ăn. |
| 6 | `6. Admin Portal Management` | 5 | Phê duyệt cơ sở (`APPROVED`), Khóa cơ sở vi phạm (`LOCKED`), Mở khóa, Xem danh sách đăng ký đối tác. |
| 7 | `7. Security & Edge Case Tests` | 5 | Kiểm thử bảo mật & lỗi: Phân trang `limit > 50` (400), Không có token (401), Giá âm (400), Tọa độ sai (400), Partner cố ý set LOCKED (403). |

---

## 2. Hướng dẫn Import vào Postman

### Bước 1: Khởi động Postman
Mở ứng dụng **Postman** trên máy tính (hoặc sử dụng Postman Web).

### Bước 2: Import Collection & Environment
1. Nhấn nút **Import** ở góc trên cùng bên trái màn hình Postman.
2. Kéo thả hoặc duyệt chọn 2 file từ thư mục dự án:
   - `backend/postman/DaNangGo_Task10_Collection.postman_collection.json`
   - `backend/postman/DaNangGo_Task10_Environment.postman_environment.json`
3. Nhấn **Import**.

### Bước 3: Chọn Environment hoạt động
Ở góc trên cùng bên phải giao diện Postman, trong ô thả xuống chọn Environment:
- Chọn: **`DaNangGo - Local Development Environment`**.

Các biến môi trường mặc định đã được cấu hình sẵn:
- `baseUrl`: `http://localhost:8000` (hoặc cổng backend đang chạy)
- `partnerEmail`: `partner@dananggo.vn`
- `partnerPassword`: `Password123@`
- `adminEmail`: `admin@dananggo.vn`
- `adminPassword`: `Password123@`
- `testPlaceId`: `1`
- `testMenuItemId`: `1`

---

## 3. Quy trình thực hiện Test theo luồng tự động

Để toàn bộ các request kế thừa token và ID chính xác, khuyến nghị chạy theo thứ tự sau:

```
[1.1 Partner Login]  --->  Tự động lưu {{partnerToken}}
        ↓
[1.3 Admin Login]    --->  Tự động lưu {{adminToken}}
        ↓
[4.1 Partner Places] --->  Tự động cập nhật {{testPlaceId}}
        ↓
[5.1 Menu Items]     --->  Tự động cập nhật {{testMenuItemId}}
        ↓
[Chạy các request còn lại tùy ý hoặc chạy Run Collection toàn bộ]
```

### Chạy tự động toàn bộ Collection (Postman Collection Runner)
1. Nhấp chuột phải vào Collection **`DaNangGo - All API Endpoints & Test Suite (Task 10)`**.
2. Chọn **Run collection**.
3. Chọn tất cả các folder và đảm bảo Environment **`DaNangGo - Local Development Environment`** được chọn.
4. Nhấn **Run DaNangGo...**. Toàn bộ 34 bài test sẽ tự động thực thi và hiển thị kết quả Passed màu xanh lá.

---

## 4. Chạy kiểm thử tự động qua CLI (Newman)

Nếu bạn muốn tích hợp CI/CD hoặc chạy nhanh qua terminal không cần mở giao diện Postman:

```bash
# Cài đặt newman (nếu chưa có)
npm install -g newman

# Chạy toàn bộ collection với environment
newman run backend/postman/DaNangGo_Task10_Collection.postman_collection.json \
  -e backend/postman/DaNangGo_Task10_Environment.postman_environment.json
```

---

## 5. Danh sách các tài khoản kiểm thử mặc định

| Vai trò | Email đăng nhập | Mật khẩu | Quyền hạn |
|:---|:---|:---|:---|
| **Partner (Đối tác ẩm thực)** | `partner@dananggo.vn` | `Password123@` | Quản lý quán của chính mình, thêm/sửa món ăn, đổi trạng thái Ẩn/Hiện |
| **Admin (Quản trị hệ thống)** | `admin@dananggo.vn` | `Password123@` | Toàn quyền kiểm soát, phê duyệt địa điểm, khóa vi phạm, duyệt đăng ký đối tác |
| **User (Khách du lịch)** | `testuser@dananggo.vn` | `Password123@` | Tìm kiếm, xem chi tiết, đánh giá |
