# Giai đoạn 4 — Gô đọc danh sách địa điểm yêu thích

Ngày: 06/11/2026. Phạm vi: đọc danh sách theo yêu cầu trong trang chat và widget. Chưa thực hiện lập lịch từ yêu thích hoặc tư vấn so sánh/địa điểm gần dựa trên toàn danh sách.

## Cách hoạt động

1. Route chat kiểm tra phiên như trước, lấy `userId` và vai trò từ middleware; JSON client không cung cấp chủ danh sách hoặc vai trò.
2. `chat.favorites.ts` nhận diện yêu cầu xem những nơi đã lưu/bấm tim. Chạy trước luồng sở thích khẩu vị, tìm catalog và gọi mô hình.
3. USER/PARTNER được đọc danh sách của chính mình. Khách nhận lời mời đăng nhập; ADMIN hoặc thiếu vai trò không truy vấn favorites. Yêu cầu đọc tài khoản khác bị từ chối; số ID trong lời nhắn không thay đổi chủ thể truy vấn.
4. Dùng service/repository favorites có sẵn: tham số hóa chủ thể, loại, offset/limit; chỉ join nơi ACTIVE, thứ tự lưu mới nhất, mỗi trang 6 nơi.
5. Trả `ChatPlaceCard` với ID công khai, tên/địa chỉ/ảnh/đánh giá từ SQL. Có tim và chỉ đường nhờ giao diện giai đoạn 3. Menu quán ăn được đọc riêng bằng API nội bộ SQL hiện có; lỗi menu không làm Gô bịa món/giá.
6. Trạng thái loại/trang được giữ trong metadata nội bộ của lượt AI thuộc hội thoại đã kiểm tra quyền; không đọc metadata từ lời nhắn người dùng. Câu trả lời thông thường kết thúc ngữ cảnh phân trang yêu thích. Không lưu lại một bản sao danh sách để dùng cho lần đọc tiếp.

Địa điểm yêu thích khác với khẩu vị/sở thích tư vấn. “Tôi thích ăn cay” hoặc “Xem sở thích đã lưu” vẫn đi qua luồng tư vấn/profile cũ. Bổ sung quy tắc phân biệt trong `backend/src/Ai/promt.ts`.

## Những câu có thể thử

| Câu hỏi | Kết quả mong đợi |
|---|---|
| Xem danh sách địa điểm yêu thích của tôi | Trang đầu, tối đa 6 nơi đang công khai và tổng số nơi hiển thị được |
| Tôi đã lưu những địa điểm nào? | Đọc cùng danh sách bấm tim |
| Xem các quán tôi đã lưu | Lọc quán ăn |
| Xem quán ăn yêu thích của tôi | Lọc RESTAURANT |
| Xem lưu trú yêu thích của tôi | Lọc ACCOMMODATION |
| Xem điểm tham quan yêu thích của tôi | Lọc ATTRACTION |
| Xem tiếp | Trang tiếp theo khi đang xem yêu thích, giữ bộ lọc |
| Xem trang trước | Trang trước khi đang xem yêu thích |
| Chỉ quán ăn | Đổi bộ lọc trong ngữ cảnh yêu thích, bắt đầu trang 1 |
| Xem trang 2 danh sách lưu trú yêu thích của tôi | Trang 2 của bộ lọc lưu trú |
| Xem tất cả địa điểm yêu thích của tôi | Bỏ lọc loại, bắt đầu trang 1 |

## Rỗng, lỗi và quyền riêng tư

- Không có nơi ACTIVE phù hợp: báo chưa có nơi đang công khai trong danh sách/bộ lọc này. Không kết luận bảng favorites rỗng nếu người dùng vẫn lưu nơi đã bị ẩn.
- Nơi bị ẩn/ngừng hoạt động không xuất hiện trong thẻ hoặc tổng số hiển thị; thông báo nêu giới hạn này, không tiết lộ tên/ID nơi bị ẩn.
- Trang vượt dữ liệu hiện tại: báo tổng trang và cho nút về trang hợp lệ. Số trang âm, bằng 0, thập phân hoặc quá giới hạn bị chặn.
- Count và dữ liệu thay đổi giữa hai truy vấn: nếu còn tổng nhưng trang không có dòng, mời tải lại thay vì giả danh sách rỗng.
- Lỗi đọc DB: báo lỗi truy cập và có câu thử lại; không tìm các quán công khai khác rồi gắn nhãn đã lưu.
- Danh sách hiển thị là những nơi đã lưu; không suy ra người dùng đã đến, đã đặt hoặc đã thanh toán. Không tự điền giá/giờ còn thiếu.
- Câu yêu cầu thêm/xóa yêu thích được hướng dẫn dùng nút tim. Giai đoạn này chỉ đọc, không tự ghi từ ngôn ngữ tự nhiên.
- Nội dung trả lời và DTO trong lịch sử là bản ghi của thời điểm trả lời; hỏi lại sẽ đọc dữ liệu mới. Thẻ lịch sử không phải cam kết nơi vẫn công khai hay còn trong danh sách hôm nay.

## Kiểm thử

10 bài kiểm thử mới trong `backend/tests/chat-favorites.test.ts` bao phủ:

1. Nhận diện danh sách, không nhầm khẩu vị; lọc đúng loại, giữ bộ lọc khi xem tiếp.
2. Khách/admin/thiếu vai trò không đọc dữ liệu riêng.
3. Chủ thể SQL lấy từ danh tính xác thực, không lấy `userId` trong prompt; public ID và URL thẻ đúng.
4. PARTNER đọc chính mình; từ chối yêu cầu xem người khác.
5. Rỗng/ẩn và lỗi DB được phân biệt, không lộ lỗi SQL nội bộ.
6. Kiểm tra trang âm/0/thập phân/quá lớn; trang mất sau bỏ lưu và dữ liệu thay đổi.
7. Không ghi yêu thích qua lời nói, không tự nhận đã lập lịch.
8. Cursor nội bộ giữ ngữ cảnh chuyến đi sẵn có.
9. Luồng `processUserMessage` cho khách không gọi DB/mô hình.
10. Luồng chat xác thực qua nhiều lượt, phân trang từ lịch sử, đọc mới sau thay đổi, không thay bằng kết quả catalog.

Kết quả: bộ test backend 207/207 đạt (gồm 10 bài mới); build backend thành công. Các test HTTP/xác thực cũ vẫn chạy trong bộ hồi quy. Không sửa code frontend trong giai đoạn này; giao diện được dùng lại từ giai đoạn 3.

Kiểm tra SQL local riêng: 7 nơi chia 2 trang không trùng, cách ly hai chủ danh sách USER/PARTNER, lọc loại, loại nơi đã bị ẩn khỏi count/thẻ và phản ánh lần bỏ lưu sau đó. Mọi liên kết favorites dùng để thử nằm trong transaction đã rollback; xác nhận IDs/count ban đầu được giữ nguyên. Không tạo tài khoản hoặc yêu thích giả lâu dài, không gọi mô hình.

Bằng chứng: [favorites-stage4-sql-tests.json](../ai-knowledge/favorites-stage4-sql-tests.json).

Trình duyệt: gửi “Xem danh sách địa điểm yêu thích của tôi” trong widget với phiên khách mới, nhận đúng lời mời và link đăng nhập; không hiển thị danh sách của tài khoản nào. Chưa kiểm thử thủ công luồng tài khoản đăng nhập trên trình duyệt ở đợt này; luồng có dữ liệu được kiểm tra bằng service và SQL transaction.

```sh
cd backend
npm run test:chat-favorites
npm run test:chat-favorites:integration
npm test
npm run build
```

## API và dữ liệu

Không cần API key mới, migration mới hoặc dữ liệu học mới. Route chat `/api/chat/message` (kể cả stream) gọi service favorites nội bộ; không để mô hình tự gọi endpoint tùy ý hoặc quyết định chủ danh sách. Nhánh đọc yêu thích không gửi danh sách này tới nhà cung cấp mô hình. Cơ chế lưu lịch sử có sẵn vẫn lưu lại câu trả lời trong hội thoại của chủ tài khoản.

Tiếp theo: giai đoạn 5 — lập lịch từ các địa điểm đã yêu thích, sau khi xác nhận điều kiện chuyến đi, dữ liệu giá và ánh xạ ID.
