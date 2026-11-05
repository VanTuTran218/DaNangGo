# Kiểm tra các tính năng AI DaNangGo

## Chuẩn bị

- Khởi động SQL Server với database của dự án.
- Trong `backend/.env`, cấu hình `GEMINI_API_KEY`, `GEMINI_MODEL` và tùy chọn `GEMINI_EMBEDDING_MODEL=gemini-embedding-001`. Không đặt khóa vào frontend hoặc biến `NEXT_PUBLIC_*`.
- Chạy `npm run migrate:ai` trong thư mục `backend` một lần khi lấy mã mới. Script có thể chạy lại: chỉ tạo bảng còn thiếu, giữ nguyên dữ liệu hiện có.
- Khởi động backend và frontend như bình thường. `NEXT_PUBLIC_API_URL` phải trỏ đúng cổng backend. Phiên kiểm tra hiện tại dùng frontend **3001**, backend **8001**.
- Chuẩn bị tài khoản khách du lịch, đối tác đã được duyệt và quản trị viên để kiểm tra đúng từng vùng quyền.

## Các luồng cần thử

### Tư vấn và lên lịch ngay trong chat

Có thể nhập các câu sau vào widget hoặc `/chat`, không cần mở wizard:

1. `Gợi ý các điểm tham quan miễn phí ở Đà Nẵng.` → Chỉ trả ATTRACTION có giá vé 0; giá chưa rõ không được coi là miễn phí, không đổi sang quán ăn.
2. `Đi 3N2Đ cùng bạn gái, thích biển và hải sản, tổng ngân sách 5tr5, khởi hành ngày mai.` → Có lịch 3 ngày/2 khách/5.500.000đ, từng ngày chia Sáng–Trưa–Chiều–Tối, kèm thẻ địa điểm, nhóm check-in/ẩm thực/lưu trú và dự trù các khoản đã có giá.
3. Nhắn tiếp `Đổi sang các điểm tham quan miễn phí` → Giữ số ngày, số khách, ngày khởi hành và ngân sách; đổi bộ điểm tham quan.
4. Nhắn tiếp `Đổi khách sạn tiết kiệm hơn` → Chọn cơ sở khác trong dữ liệu khi có phương án thay thế, không chỉ lặp lại cùng thẻ.
5. `Có chỗ nào rẻ hơn không?` sau một câu tìm khách sạn → Giữ chủ đề/khu vực của lượt trước và ưu tiên giá thấp; chuyển sang câu tham quan rõ ràng thì không kéo theo điều kiện quán ăn cũ.

Lịch trong chat là bản tư vấn, chưa tự lưu hay đặt dịch vụ. Giờ trong lịch là giờ gợi ý; điểm có thời lượng tham quan từ 4 giờ trong dữ liệu được dành riêng ngày, không xếp vào buổi chiều sau một điểm khác. Không ghép thêm điểm cách quá 15 km theo đường chim bay vào cùng ngày; khoảng cách này chỉ hỗ trợ gom cụm, chưa phải tuyến đường thực tế.

Tiền phòng được so theo số khách/sức chứa và số đêm; giá món không được nhân thành giá một bữa. Phần “Cộng các khoản đã có giá” chưa bao gồm ăn uống, di chuyển và các khoản thiếu giá. Chat hỏi thêm thông tin khi chưa rõ, không tự chốt ngày hay số khách.

| Mục | Nơi thử | Thao tác và kết quả mong đợi |
| --- | --- | --- |
| A1 – Trợ lý Gô | `/chat`, nút chat nổi | Hỏi “Quán mì Quảng dưới 100k ở Hải Châu”. Thẻ lấy tên, giá, ID từ địa điểm ACTIVE trong SQL; link đi đúng chi tiết. Giá nhà hàng tính từ các món đang bán. Hai giao diện dùng chung component và lịch sử theo tài khoản. |
| A7 – Điền lịch trình | `/lich-trinh/tao-moi`, mở wizard AI | Nhập “Đi 3N2Đ cùng bạn gái, thích biển và hải sản, tổng ngân sách 5tr5, khởi hành ngày mai”. Bấm **Phân tích mô tả**: xem trước 3 ngày, 2 khách, 5.500.000đ và ngày mai. Chỉ bấm **Xác nhận điền vào biểu mẫu** mới đổi form; vẫn cần xem lịch trình và tự lưu ở các bước tiếp theo. |
| A7 – Thiếu dữ liệu | Cùng wizard | Nhập “Đi biển 2 ngày”. Ngân sách, số khách và ngày khởi hành còn thiếu phải được yêu cầu bổ sung. Không tự đoán chi phí hay lưu lịch trình. Hệ thống hỗ trợ 1–3 ngày. |
| A4 – Tổng hợp đánh giá | `/places/{id}` | Bấm **Tóm tắt đánh giá**. Chỉ đọc đánh giá APPROVED, tối đa 100 đánh giá gần nhất. Dưới 5 đánh giá: báo chưa đủ dữ liệu. Số tích cực/trung lập/tiêu cực được code đếm; mỗi điểm khen/chê cần ít nhất 2 lượt nhắc. Không cố tạo đủ 3 ưu/nhược điểm khi không có bằng chứng. |
| A5 – Nháp trả lời | `/partner/danh-gia` | Chọn đánh giá thuộc cơ sở của đối tác, bấm trả lời và **Gợi ý trả lời**. **Dùng bản nháp này** chỉ điền ô văn bản. Chỉnh sửa rồi bấm **Gửi phản hồi** mới lưu SQL. Tải lại trang và trang chi tiết cơ sở để kiểm tra phản hồi đã hiện. |
| A6 – Hỗ trợ kiểm duyệt | `/admin/danh-gia` | Lọc danh sách rồi bấm kiểm tra các đánh giá đang lọc (tối đa 50). Thẻ chỉ gắn cờ Spam/Quảng cáo/Xúc phạm/Thông tin cá nhân... Quản trị viên vẫn tự đọc và tự quyết định; nút AI không duyệt, ẩn hay xóa đánh giá. |
| A9 – Soạn mô tả | Form tạo/sửa cơ sở của đối tác hoặc admin | Điền tên và vài thông tin có thật vào **Gô hỗ trợ viết mô tả**. Soạn nháp, đọc lại rồi **Áp dụng vào ô mô tả**. Chỉ thao tác lưu/gửi duyệt của form mới ghi dữ liệu. Không tự thêm giá, tiện ích hoặc cam kết hoàn tiền vào ghi chú. |
| A8 – Báo cáo khảo sát | `/admin/khao-sat` | Trong khu vực **Gô phân tích khảo sát từ database**, chọn khảo sát thật. Chỉ phân tích câu trả lời của phiếu SUBMITTED; tối đa 100 câu tự do gần nhất. Số phiếu, số câu chấm điểm và trung bình lấy từ SQL; lượt nhắc chủ đề đếm theo ID hợp lệ. Tên và thông tin liên hệ được lọc trước khi gửi model. |
| A2 – Hiểu lại từ khóa | `/tim-kiem` | Gõ “hai san” hoặc “homstay”; chọn danh mục và khoảng giá, bấm **Gô hiểu lại từ khóa**. Chỉ **Dùng gợi ý** mới thay từ khóa; danh mục và khoảng giá vẫn giữ nguyên. Đổi từ khóa trong lúc đang phân tích phải hủy kết quả cũ. |
| A3 – Địa điểm tương tự | `/places/{id}` | Gợi ý là địa điểm ACTIVE cùng loại, loại chính địa điểm đang xem; link, hình, giá và đánh giá đều lấy từ DB. Chưa có embedding vẫn có so khớp dữ liệu. Không hiển thị các thẻ quán viết cứng. |
| Vận hành AI | `/admin/ai` | Xem trạng thái cấu hình khóa (không hiện giá trị), lượt gọi, lỗi dự phòng, cache và thời gian. Bấm **Cập nhật dữ liệu gợi ý** để tạo embedding cho địa điểm mới/thay đổi; có tiến độ từng lô. Bấm lại không gọi model cho nội dung đã đồng bộ. Khi lỗi quota, phần đã lưu được giữ lại để thử tiếp. |

Cập nhật khảo sát: trang Admin đã dùng API và SQL thật; User trả lời tại `/khao-sat` hoặc liên kết khảo sát riêng. Chạy `npm run migrate:surveys` để chuẩn bị hai bộ câu hỏi FULL/QUICK. Trong khung AI, tải lại danh sách để chọn khảo sát vừa tạo. Nếu chưa có phản hồi đã gửi, báo cáo giữ trạng thái chưa có dữ liệu. Xem `SURVEYS.md` để kiểm tra gửi, thống kê và phân tích.

## Kiểm tra lỗi và quyền

1. Mở cửa sổ ẩn danh: xem địa điểm, tìm kiếm, chat khách vẫn hoạt động. API lịch trình cần đăng nhập; API đối tác và quản trị cần đúng vai trò.
2. Đối tác B không đọc hoặc phản hồi được đánh giá của đối tác A bằng cách sửa ID trong URL. Quyền sở hữu được kiểm tra lại trong câu lệnh lưu.
3. Đăng xuất tài khoản A và vào B: lịch sử chat được tách theo tài khoản. Khách không được truy cập session SQL của người dùng.
4. Tạm để trống `GEMINI_API_KEY` trên môi trường kiểm thử rồi khởi động lại backend: chat, hiểu từ khóa, điền lịch trình và các phần tổng hợp vẫn có phương án theo quy tắc/DB, có nhãn dự phòng. Cập nhật embedding sẽ báo chưa thể thực hiện, gợi ý tương tự vẫn hoạt động.
5. API Gemini timeout/429/503 không được làm trang treo. Yêu cầu sinh văn bản có thời hạn, tối đa một lần retry; có cooldown khi nhà cung cấp quá tải. Không hiện lỗi chứa khóa hoặc prompt ra giao diện.
6. Không gửi chuỗi dài quá giới hạn; payload kèm `userId` giả hoặc sai schema phải bị từ chối. AI không tự động gửi phản hồi, lưu mô tả hay thay trạng thái kiểm duyệt.

## Lệnh xác minh

Trong `backend`: `npm run test` và `npm run build`.

Trong `frontend`: `npm run test` và `npm run build`.

Các kiểm thử AI dùng SQL/provider giả lập, không sửa đánh giá hoặc khảo sát thật, không tốn quota Gemini. Kiểm thử bảo vệ ID, schema, quyền đăng nhập, dữ liệu thiếu, ngân sách/ngày, nháp không hợp lệ, cache và embedding sai chiều.

## Ghi chú kỹ thuật

- Các API mới nằm dưới `/api/ai`; chat vẫn ở `/api/chat`.
- Migration thêm `partner_review_replies` và `ai_place_vectors`. Phản hồi gắn với chủ cơ sở hiện tại; dữ liệu tổng hợp không đổi trạng thái review.
- Cache băm theo nội dung và ngày/dữ liệu đầu vào, tối đa 300 mục, TTL 5–10 phút. Kết quả dự phòng chỉ cache tối đa 30 giây. Giá và trạng thái gợi ý được đọc lại từ DB. Cache/metrics/cooldown nằm trong từng tiến trình và được xóa khi khởi động lại; chưa dùng Redis để chia sẻ giữa nhiều instance.
- Embedding dùng nội dung địa điểm công khai, 768 chiều và hash kiểm tra thay đổi. Vector cũ bị bỏ qua nếu nội dung hoặc model thay đổi. Danh sách gợi ý giới hạn 200 ứng viên cùng loại và trả tối đa 6 địa điểm. Đồng bộ bằng nút quản trị, mỗi lượt API kiểm tra 40 địa điểm, gọi model theo lô 10.
- Model embedding mặc định là `gemini-embedding-001`, theo [tài liệu Google](https://ai.google.dev/gemini-api/docs/embeddings). Cần khóa có quyền/quota cho model này để hoàn thành đồng bộ.


## Công cụ trò chuyện vừa bổ sung

Thực hiện tại `/chat`, đăng nhập trước khi kiểm tra lưu lâu dài.

1. Gửi `Đi 2 ngày cho 2 người, ngân sách 5 triệu, khởi hành ngày mai, thích biển.` → lịch theo buổi. Bấm **Cuộc trò chuyện mới**, gửi câu khác → sidebar có các hội thoại thật trong **Hôm nay**; mở lại hội thoại cũ phải giữ thẻ/lịch trình.
2. Bấm **Hữu ích** hoặc **Chưa hữu ích**, mở lại hội thoại → giữ lựa chọn. Bấm lại → bỏ đánh giá.
3. Gửi `Gợi ý món ăn thanh đạm ở Đà Nẵng` hoặc `Quán ăn có món cay` → chỉ lấy quán có món đang bán gắn nhãn tương ứng. Dữ liệu trống phải báo không có kết quả; không tự nới lọc.
4. Bấm **Quanh vị trí tôi** và tự cho phép vị trí → chọn 2/5/10 km, gửi `Quán ăn quanh vị trí tôi`. Từ chối quyền → thông báo nhập quận; không tạo tọa độ giả. **Tắt vị trí** → không gửi GPS nữa.
5. Trong lịch trình, mở **Dự trù chi phí**, nhập ăn uống, di chuyển và % dự phòng → tổng dự kiến đúng; `Cộng các khoản đã có giá` không đổi. Mở lại hội thoại → giữ các giá trị.
6. **Lưu lịch trình này** → sau đăng nhập và đủ thông tin, mở bản nháp tại `/lich-trinh/:id`. Không tự đặt phòng hoặc thanh toán. Thiếu ngày/số khách/ngân sách → yêu cầu bổ sung. Khách chưa đăng nhập → dẫn tới luồng đăng nhập.
7. **Đổi khách sạn** → điền câu hỏi, gửi đi để nhận phương án mới. Bản đã lưu chỉ chỉnh sửa qua trang Lịch trình, không bị chat tự ghi đè.
8. Xem mẹo đổi sau 12 giây, bấm **Dừng đổi mẹo**; bật giảm chuyển động của hệ điều hành → không tự xoay.

Lịch sử khách giữ tạm trong RAM (tối đa 1 giờ không hoạt động), mất khi backend khởi động lại. Lịch sử tài khoản lưu SQL và tách với khách. Bộ lọc GPS được kiểm tra bằng tọa độ công khai của trung tâm Đà Nẵng trong kiểm thử, không tự xin/lấy vị trí thật của người kiểm tra.


Báo cáo lần tự kiểm tra toàn bộ: [AI-AUDIT-REPORT.md](AI-AUDIT-REPORT.md). Chạy `npm run audit:ai` để thử từng câu với SQL và Gemini; `npm run audit:ai:http` để thử API local bằng phiên khách riêng. Các mục thiếu dữ liệu được đánh dấu riêng, không tự tạo đánh giá/khảo sát giả.
