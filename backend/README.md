# Backend - DaNangGo Dự Án

## 1. Mục đích các thư mục
- `src/config/`: Chứa các cấu hình chung (kết nối DB, biến môi trường, logger).
- `src/middleware/`: Các middleware dùng chung (auth, error handler, rate limit).
- `src/modules/`: Phân chia code theo từng domain nghiệp vụ (chức năng).
- `src/utils/`: Các hàm tiện ích dùng chung (format ngày tháng, mã hóa, xử lý chuỗi).
- `tests/`: Chứa code kiểm thử (unit test, integration test).
- `uploads/`: Thư mục lưu trữ tạm các tệp tải lên (cần được đưa vào `.gitignore`).

## 2. Quy ước kiến trúc mỗi module (Layered Architecture)
Mỗi module bên trong `src/modules/<tên-module>/` sẽ bao gồm các file sau:
- `*.routes`: Định nghĩa các API endpoint và gắn middleware tương ứng.
- `*.controller`: Tầng giao tiếp HTTP. **Chỉ** nhận request, gọi service, và trả về response (không chứa logic nghiệp vụ).
- `*.service`: Chứa toàn bộ logic nghiệp vụ, tính toán (VD: tính ngân sách FIT/OVER, kiểm tra điều kiện).
- `*.repository`: Tầng giao tiếp với cơ sở dữ liệu (chứa các câu truy vấn SQL).
- `*.validation`: Các rule kiểm tra dữ liệu đầu vào (VD: dùng Joi, Zod).

## 3. Bảng ánh xạ Module -> Bảng Database chính
| Module | Bảng Database (Tables) |
| :--- | :--- |
| **auth, users** | `users`, `roles`, `partner_profiles`, `user_preferences` |
| **places** | `places`, `accommodations`, `restaurants`, `attractions`, `room_types`, `menu_items`, `opening_hours`, `place_images`, `amenities` |
| **reviews, favorites** | `reviews`, `user_favorites` |
| **routes** | `route_cache`, `transport_modes` |
| **itineraries, recommendations** | `itineraries`, `itinerary_days`, `itinerary_items`, `itinerary_alternatives` |
| **vip** | `vip_tiers`, `user_memberships`, `vip_offers` |
| **surveys** | `surveys`, `survey_questions`, `survey_responses`, `survey_answers` |
| **chat** | `chat_sessions`, `chat_messages` |
| **partner, admin** | Dành cho quản lý dịch vụ và kiểm duyệt (sử dụng lại/bổ sung bảng liên quan). |

## 4. Gợi ý chia việc (Phân công nhóm)
Để tránh conflict khi code chung, khuyến khích chia task theo module. Mỗi thành viên sẽ nhận một hoặc một cụm module liên quan để code trọn vẹn từ Routes -> Controller -> Service -> Repository.
- Thành viên 1: `auth`, `users`, `vip`
- Thành viên 2: `places` (core dữ liệu)
- Thành viên 3: `itineraries`, `recommendations`, `routes`
- Thành viên 4: `reviews`, `favorites`, `surveys`
- Thành viên 5: `chat`, `partner`, `admin`
