# Giai đoạn 2 — Hoàn thiện DB/API và trạng thái yêu thích

Ngày: 06/11/2026. Phạm vi: nền tảng yêu thích dùng chung; chưa thêm nút tim hoặc công cụ đọc yêu thích cho Gô.

## Cơ sở dữ liệu

- Đã chạy migration 009 trên SQL local, tạo bảng chuẩn `dbo.favorites`. Không xóa bảng cũ `dbo.user_favorites`.
- Runner kiểm tra dữ liệu cũ trùng hoặc mất liên kết trước khi chuyển đổi; gặp lỗi sẽ dừng và rollback thay vì âm thầm loại dữ liệu.
- Xác nhận unique theo `user_id/place_id` và hai khóa ngoại đang bật, được SQL tin cậy.
- Chạy lại migration không làm mất danh sách. Kiểm thử chuyển một dòng dữ liệu cũ sang bảng chuẩn trong transaction rồi rollback thành công.
- Không tạo tài khoản hoặc yêu thích giả lưu lâu dài.

Mỗi môi trường khác cần tự áp dụng migration bằng cấu hình DB của môi trường đó:

```sh
cd backend
npm run migrate:favorites
```

## API và quyền

Giữ nguyên bốn endpoint: GET `/api/favorites/ids`, GET `/api/favorites`, POST `/api/favorites`, DELETE `/api/favorites/:placeId`.

- Khách nhận 401; USER/PARTNER được dùng; ADMIN nhận 403. Chủ danh sách luôn lấy từ phiên đã xác thực.
- POST chỉ nhận `place_id`; không cho truyền chủ danh sách qua body. ID phải là số nguyên dương trong giới hạn SQL INT; kiểm tra cả giới hạn offset phân trang.
- Thêm lặp không tạo dòng trùng; bỏ lặp không chuyển thành thêm. Chỉ thêm địa điểm ACTIVE, kiểm tra cả tại thời điểm ghi SQL.
- Phản hồi có `Cache-Control: no-store`. Client kiểm tra cấu trúc IDs/phân trang; lỗi máy chủ không được diễn giải thành danh sách rỗng thành công.
- Header tùy chọn `X-Favorites-Owner` là điều kiện kiểm tra tài khoản dự kiến, không phải thông tin xác thực. So sánh với public ID của người dùng đã xác thực; không khớp trả 409. Điều này ngăn tab còn hiển thị A lưu nhầm vào B sau khi cookie đổi tài khoản ở tab khác. Trường hợp này cần tải lại trang để cập nhật phiên hiển thị.
- `/ids` giữ các ID đã lưu, kể cả nơi sau đó bị ẩn; danh sách chi tiết chỉ trả địa điểm ACTIVE. Bỏ lưu ID cũ vẫn được hỗ trợ.

## Trạng thái và giao diện hiện có

- `FavoritesStore` dùng chung với trạng thái tải/lỗi/sẵn sàng, chỉ cập nhật tim sau xác nhận từ server. Có pending theo từng địa điểm để nhiều nút không gửi trùng.
- Đổi tài khoản hoặc đăng xuất hủy yêu cầu và bỏ dữ liệu cũ. Phản hồi muộn không ghi đè tài khoản mới, kể cả đăng xuất rồi đăng nhập lại cùng tài khoản.
- Nếu mất phản hồi sau khi server có thể đã ghi, đọc lại trước khi cho thao tác tiếp. Refresh khi đang ghi được hoãn; kết quả tải cũ không ghi đè lần tải mới.
- Tab yêu thích dùng lệnh bỏ lưu rõ ràng, tải lại theo phiên/thay đổi dữ liệu và quay về trang hợp lệ khi xóa hết mục cuối trang.
- Tim trang chủ/lưu trú và thẻ tham quan dùng cùng provider. Địa điểm dự phòng không có ID thật được vô hiệu hóa nút lưu, không dùng vị trí phần tử làm ID.
- Khi tab được focus/hiển thị trở lại, tải lại trạng thái. Chưa có đồng bộ tức thì bằng BroadcastChannel.
- Khách bấm lưu nhận thông báo đăng nhập; lỗi tải có thao tác thử lại.

## Kiểm thử và bằng chứng

| Nhóm | Kết quả/phạm vi |
|---|---|
| Backend build | `npm run build` thành công |
| Frontend build | `npm run build` thành công |
| Backend test | 197/197 đạt trong bộ Node test chung, có test favorites HTTP; hai script auth/upload chạy trước cũng thành công |
| Frontend test | 42/42 đạt, trong đó 12 test trạng thái favorites |
| HTTP favorites | Khách, quyền, ID/offset sai, giả chủ danh sách, lệch tài khoản dự kiến, thêm/bỏ lặp và lỗi SQL |
| SQL local | Unique/FK, migration chạy lại, chuyển dữ liệu cũ, thêm trùng, cách ly hai chủ danh sách, bỏ lặp, đọc DTO, từ chối nơi không ACTIVE; rollback bảo toàn dữ liệu |
| Trình duyệt | Khách bấm lưu ở trang chi tiết nhận thông báo đăng nhập, tim không tự chuyển thành đã lưu |

Bằng chứng SQL: [favorites-stage2-sql-tests.json](../ai-knowledge/favorites-stage2-sql-tests.json).

Lệnh chạy lại:

```sh
cd backend
npm test
npm run test:favorites
npm run test:favorites:integration
npm run build
cd ../frontend
npm test
npm run build
```

Kiểm thử HTTP dùng JWT và truy vấn SQL giả lập; kiểm thử SQL riêng chạy trên DB local bằng transaction rollback. Chưa kiểm thử thủ công CRUD bằng hai tài khoản đăng nhập trên trình duyệt. Các kiểm tra này không gọi mô hình AI và không chứng minh chất lượng tư vấn của Gô.

## Bước tiếp theo

Giai đoạn 3: thêm nút tim trong chat/widget/so sánh/lịch trình dựa trên nền tảng này; chỉ ánh xạ ID địa điểm công khai thật. Chưa thực hiện giai đoạn 3 trong đợt này.
