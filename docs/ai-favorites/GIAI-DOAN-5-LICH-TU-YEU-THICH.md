# Giai đoạn 5 — Lập lịch từ địa điểm yêu thích

Ngày: 06/11/2026. Phạm vi: tạo bản nháp lịch 1–3 ngày từ nguồn yêu thích hiện tại của tài khoản, dùng lại planner và giao diện lịch AI hiện có.

## Luồng sử dụng

1. Đăng nhập USER/PARTNER, bấm tim các điểm tham quan/quán ăn/lưu trú mong muốn.
2. Trong chat hoặc widget, gửi: **“Lập lịch từ địa điểm yêu thích của tôi”**. Nếu vừa xem danh sách, có thể nói **“Lên lịch từ danh sách này”**.
3. Gô hỏi các điều kiện còn thiếu, tối đa 3 câu mỗi lượt: số ngày, số khách, tổng ngân sách/phạm vi tiền, ngày đi và ngày/đêm chưa rõ. Chỉ tạo lịch sau khi đủ điều kiện bắt buộc, không tự mặc định số khách hoặc phạm vi tiền.
4. Đọc dữ liệu mới từ SQL, chỉ nơi ACTIVE thuộc favorites của tài khoản xác thực. Dùng public `places.place_id`, không dùng ID catalog wizard hoặc ID món ăn.
5. Planner chia ngày/buổi theo thời gian, phương tiện, nhịp đi, ngân sách và điều kiện. Không thêm nơi ngoài yêu thích để lấp lịch.
6. Những nơi chưa được xếp vào từng buổi được tách riêng; thêm lưu ý khi thiếu quán/chỗ ở phù hợp, giá hoặc điều kiện chưa xác minh.

Ví dụ đầy đủ:

> Lập lịch từ địa điểm yêu thích của tôi 2 ngày 1 đêm, 2 người, tổng ngân sách 3 triệu, khởi hành ngày mai, đến 08:00, về 21:00, đi taxi.

Ví dụ nhiều lượt:

> Lập lịch từ yêu thích của tôi.
>
> 2 ngày 1 đêm, 2 người, tổng ngân sách 3 triệu.
>
> Khởi hành ngày mai.

Sau khi bỏ lưu/thêm tim, gửi **“Lập lại lịch từ yêu thích của tôi”** để giữ brief đã xác nhận nhưng đọc lại danh sách hiện tại. Có thể đổi ngân sách, giờ đến/về hoặc phương tiện rồi dựng lại lịch. Lập một yêu cầu mới đầy đủ sẽ dùng điều kiện mới.

## Nguồn dữ liệu và bảo vệ quyền

- Route chat lấy chủ thể và vai trò từ middleware xác thực; không parse chủ danh sách từ câu hỏi.
- `searchPlacesForChat` có điều kiện nội bộ `favoriteUserId`: SQL dùng `EXISTS` theo `favorites.user_id` và `places.place_id`, cùng điều kiện ACTIVE/dữ liệu công khai của catalog hiện có. Không gọi API tìm kiếm chung rồi coi kết quả đó là đã yêu thích.
- Khách được mời đăng nhập; ADMIN/thiếu vai trò không được đọc favorites. Yêu cầu dùng danh sách người khác bị từ chối.
- Không ghi/xóa favorites trong planner. Không tạo tài khoản hay địa điểm mới. Không cần API key hoặc migration mới.
- Giới hạn 500 địa điểm đủ điều kiện cho một lần lập lịch. Truy vấn tối đa 501 để phát hiện vượt giới hạn, khi vượt sẽ báo chưa lập lịch, không âm thầm lấy một phần rồi gọi là toàn bộ danh sách.
- Lỗi DB và danh sách không có nơi đủ điều kiện là hai trạng thái khác nhau. Không fallback sang các địa điểm ngoài danh sách.

## Điều kiện và chi phí

- Tái sử dụng quy tắc planner hiện có về giờ đến/về, nghỉ trưa, giới hạn thời lượng, khoảng cách và tọa độ khi đi bộ. Đây chưa phải tối ưu đường đi bằng dữ liệu giao thông trực tiếp.
- Khẩu vị/hạn chế ăn uống đã lưu được đọc theo tài khoản. Khi có dị ứng/điều kiện chưa xác minh, không xếp quán như thể đã bảo đảm phù hợp. Nếu đọc profile lỗi, tạm không xếp quán và báo nguyên nhân.
- Hạn chế ăn uống được nói trong câu đầu và các địa điểm yêu cầu loại khỏi chuyến được giữ qua lượt bổ sung. Chúng không bị mất khi người dùng trả lời số ngày/tiền ở lượt sau.
- Chưa đủ giá vé/phòng/sức chứa: giữ trạng thái chưa đủ dữ liệu. `knownSubtotal` chỉ là cộng khoản đã có giá, không phải tiền đã chi hoặc tổng chuyến.
- Khi cộng được khoản đã biết, `projectedSubtotal` cộng thêm khoản ăn uống/di chuyển/dự phòng dự kiến có sẵn; `remaining` trừ theo khoản dự trù này. Không phát sinh giá di chuyển giả nếu dữ liệu không có.
- Nếu chỉ khoản đã biết đã vượt ngân sách: không trả lịch như phương án phù hợp. Nếu tổng dự trù vượt, ghi cảnh báo trong lời trả lời và lưu ý của bản nháp.
- Chỉ hiển thị tối đa 20 nơi chưa xếp, kèm số lượng nếu còn nhiều hơn. Phần này là nơi chưa xếp vào buổi cụ thể, có thể gồm phương án lưu trú thay thế; không kết luận chắc chắn mọi nơi đều đi được hoặc đều không đi được.

## Tích hợp

- `chat.favorite-plan.ts` xử lý yêu cầu/brief và giới hạn nguồn; chạy trước nhánh xem danh sách yêu thích và nhánh AI chung.
- DTO lịch có `source: 'FAVORITES'`, dùng lại các thẻ lịch, nút tim, chỉ đường, dự trù và luồng lưu bản nháp đã có.
- Trạng thái nội bộ của lượt AI lưu brief, pending, cờ hạn chế ăn uống và tên loại trừ; không lưu bản sao catalog để lập lại.
- Nhánh sửa lịch chung không được âm thầm thay nơi trong lịch FAVORITES bằng catalog chung. Yêu cầu thay/chuyển từng hoạt động đang được hướng dẫn lập lại lịch từ yêu thích; chỉnh sửa chi tiết có ràng buộc nguồn thuộc phần tiếp theo.
- Trong đợt này chưa triển khai chế độ tự bù quán/khách sạn ngoài danh sách, so sánh/tìm gần yêu thích hoặc đặt dịch vụ. Giai đoạn 6 sẽ mở rộng tư vấn tiếp có căn cứ.

## Kiểm thử

14 test mới trong `backend/tests/chat-favorite-plan.test.ts`:

| Nhóm | Kết quả |
|---|---|
| Nhận diện lập lịch/tham chiếu danh sách, không chiếm câu xem danh sách | Đạt |
| Khách/admin/thiếu vai trò/người khác không đọc dữ liệu riêng | Đạt |
| Hỏi thiếu thông tin, giữ brief qua nhiều lượt | Đạt |
| Nguồn yêu thích toàn danh sách, public ID/URL đúng | Đạt |
| Rỗng, lỗi DB, hơn 500 nơi không fallback/không tạo lịch giả | Đạt |
| Thiếu giá/quán/lưu trú giữ thông báo trung thực | Đạt |
| Giới hạn đi bộ/tọa độ/thời lượng/loại trừ/nơi chưa xếp | Đạt |
| Vượt ngân sách đã biết, quá 3 ngày, ngày/đêm không khớp | Đạt |
| Lập lại đọc dữ liệu mới; không lén sửa bằng nguồn ngoài | Đạt |
| SQL có EXISTS theo chủ thể và chặn owner không hợp lệ | Đạt |
| Luồng chat khách mời đăng nhập | Đạt |
| Tổng dự trù và tiền còn lại nhất quán | Đạt |
| Hạn chế ăn uống đã lưu/lỗi profile/dị ứng qua nhiều lượt | Đạt |
| Luồng chat xác thực qua lịch sử trả DTO ITINERARY thực sự | Đạt |

Bộ kiểm thử backend: **221/221 đạt** (gồm 14 test mới); build backend thành công; `git diff --check` đạt. Không sửa code frontend trong giai đoạn này.

SQL local thật: dựng lịch 2 ngày bằng dữ liệu giá/vị trí/thời lượng của các địa điểm hiện có; tất cả ID trong buổi và nhóm lựa chọn thuộc favorites của đúng chủ thể; nơi chỉ tài khoản khác lưu không xuất hiện; nơi bị ẩn bị loại; bỏ lưu rồi lập lại không dùng dữ liệu cũ. Liên kết favorites để kiểm thử nằm trong transaction đã rollback; IDs/count ban đầu được giữ nguyên.

Bằng chứng: [favorites-stage5-sql-tests.json](../ai-knowledge/favorites-stage5-sql-tests.json).

HTTP thật ở backend local: POST yêu cầu lập lịch từ yêu thích bằng phiên khách nhận đúng lời mời và link đăng nhập, không trả lịch giả. Phát hiện backend local còn chạy mã cũ (chat 404), đã khởi động lại đúng tiến trình của dự án bằng `npm run dev` và xác nhận route hoạt động.

Chưa kiểm thử thủ công đăng nhập/tim/lưu bản nháp trên trình duyệt trong đợt này. Kiểm thử có dữ liệu dùng service và SQL transaction; đây không phải dữ liệu hành vi/yêu thích thật của khách du lịch. Giai đoạn 7 sẽ kiểm tra toàn luồng trên giao diện.

```sh
cd backend
npm run test:favorite-plan
npm run test:favorite-plan:integration
npm test
npm run build
```
