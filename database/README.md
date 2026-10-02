# Cơ sở dữ liệu - DaNangGo

Thư mục này quản lý toàn bộ cấu trúc và dữ liệu mẫu của cơ sở dữ liệu MySQL.

## Ý nghĩa các thư mục
- **`schema/`**: Chứa các file SQL khởi tạo cấu trúc bảng ban đầu (CREATE TABLE).
- **`migrations/`**: Chứa các file SQL cập nhật cấu trúc DB (ALTER TABLE, thêm/sửa cột). Mỗi thay đổi là một file mới được đánh số tiền tố (VD: `003_add_status.sql`, `004_update_price.sql`). **TUYỆT ĐỐI KHÔNG sửa lại file migration cũ đã chạy.**
- **`seeds/`**: Chứa các file SQL chèn dữ liệu mẫu ban đầu (INSERT INTO). Được đánh số thứ tự để chạy đúng logic khóa ngoại (VD: `010_roles.sql`, `020_users.sql`, `030_places.sql`).
- **`diagrams/`**: Chứa các file thiết kế cơ sở dữ liệu (VD: file `.dbml`, ảnh ERD).

## Cách chạy các file SQL
Để nạp dữ liệu vào database, bạn mở Terminal và chạy lần lượt các file bằng lệnh sau (đảm bảo đã tạo database `danangogo` trước):

```bash
# Nạp schema ban đầu
mysql -u <user> -p danangogo < schema/001_init.sql

# Nạp các file migration
mysql -u <user> -p danangogo < migrations/003_add_status.sql

# Nạp dữ liệu mẫu
mysql -u <user> -p danangogo < seeds/010_roles.sql
```
*(Thay `<user>` bằng username MySQL của bạn, thường là `root`)*
