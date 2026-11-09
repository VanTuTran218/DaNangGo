# Bước 4 — Lịch trình theo giờ và nhóm khách

Triển khai ngày 05/11/2026, áp dụng cho lịch 1–3 ngày trong widget và `/chat`.

## Thay đổi

- Đọc giờ đến ngày đầu và giờ về ngày cuối, ví dụ `đến 18:30, về 9h`, `đến 6h chiều`. Các giờ theo Đà Nẵng, UTC+7.
- Giữ thông tin giờ, phương tiện, thành phần nhóm và tuổi bé qua các lượt chỉnh lịch và phần tóm tắt ngữ cảnh nội bộ. Chuyến mới có mô tả lịch mới sẽ bắt đầu lại các thông tin này.
- Hỗ trợ phương tiện: ô tô, xe máy, taxi/Grab, xe buýt và đi bộ. Chưa có giá cước, lịch xe hoặc thời gian di chuyển trực tiếp.
- Hiểu mẫu `2 người lớn và 1 bé 6 tuổi` là 3 khách; tuổi không phải số khách. Mẫu `1 bé 6 tháng` giữ tuổi 0,5. Khi tổng khách và thành phần nhóm mâu thuẫn, hỏi lại trước khi tạo lịch mới.
- Khi chưa có giờ/nhóm khách/phương tiện/tuổi bé, nêu câu hỏi cụ thể. Các trường còn thiếu vẫn chưa được coi là đã xác nhận; lịch hiện ra là bản phác thảo.
- Giờ sai như 25h hoặc 18:75, hoặc giờ về trước giờ đến trong chuyến một ngày, không được sử dụng để tạo lịch mới. Sửa lại giờ hợp lệ có thể tiếp tục ngay.

## Quy tắc xếp lịch

- Chừa dự kiến 60 phút sau giờ đến, 90 phút trước giờ về. Đây là **giả định lập lịch**, không phải thời gian tuyến đường hoặc quy định làm thủ tục của nhà vận chuyển. Người dùng cần đối chiếu với vé và vị trí sân bay/ga.
- Chọn địa điểm sau khi biết khoảng thời gian còn lại, không chọn rồi chỉ ẩn thẻ trên giao diện. Điểm không được xếp không bị cộng vé vào tổng đã biết.
- Bốn nhãn sáng/trưa/chiều/tối vẫn được giữ; buổi không có thời gian có danh sách hoạt động rỗng. Giờ đến và chuẩn bị về hiển thị thành mục riêng. Đến 23:30 không tự thêm ăn tối/điểm tham quan vào ngày đầu.
- Mặc định nhịp nhẹ khi có trẻ em, người lớn tuổi hoặc hạn chế đi bộ: tối đa một điểm tham quan chính/ngày, có nghỉ trưa, không ghép thêm dạo tối; loại điểm có thời lượng từ 4 giờ hoặc mô tả leo/bậc thang. Có thể yêu cầu `đi nhẹ nhàng` hoặc `đi nhiều điểm`; hạn chế đi bộ đã nói rõ vẫn được giữ.
- Chưa xác minh đầy đủ xe lăn, thang máy, độ dốc hoặc khả năng tiếp cận của mọi cơ sở. Nhịp nhẹ không có nghĩa là mọi địa điểm đã được chứng nhận phù hợp cho từng người.
- Khi đi bộ, chỉ ghép thêm điểm trong 2km đường chim bay có tọa độ, quán ăn trong 1,5km. Không suy khoảng cách 1km chỉ vì cùng quận. Chưa xác nhận lối đi thực tế hoặc điểm xuất phát của khách.
- Có trẻ em: không tự nhân giá vé người lớn hoặc suy số phòng từ sức chứa chung để cho ra chi phí chắc chắn khi thiếu chính sách tuổi/giường. Khoản tương ứng giữ chưa xác định. Các điểm có vé 0đ vẫn tính đúng 0đ.
- Dữ kiện giờ lưu trú có nguồn tiếp tục nằm trong thẻ cơ sở; nghỉ trưa không đồng nghĩa được nhận phòng sớm.

## API và lưu lịch trình

`ChatTravelPlan` bổ sung trường tùy chọn `preferences` và `questions`. Các mục lịch có thể có `kind: arrival | departure | rest`. JSON và SSE giữ nguyên thông tin này; lịch sử tiếp tục gắn đúng chủ sở hữu.

Khi chuyển sang bản nháp, giờ đến/về được giữ, các mục đến/chuẩn bị rời thành phố là loại di chuyển. Không tự chèn mục lưu trú lúc 14:00 hoặc khoản dự trù lúc 08:00 trước giờ đến ngày đầu. Thông tin nhóm khách và câu hỏi còn thiếu đi cùng ghi chú bản nháp. Cần đủ ngày khởi hành, số khách và ngân sách như luồng lưu hiện có.

## Thử thủ công

1. `Đi 3N2Đ, 2 người lớn và 1 bé 6 tuổi, ngân sách 6 triệu, khởi hành ngày mai, đến 18h30, về 9h, đi taxi.` → 3 khách; ngày đầu không xếp buổi sáng, ngày cuối không xếp buổi tối; có nhãn giờ và nhóm khách.
2. `Đổi giờ đến 20h, đi ô tô.` → giữ 3 ngày, 3 khách, tuổi bé và ngân sách.
3. `Có người lớn tuổi, hạn chế đi bộ.` → lịch nhẹ; không khẳng định đã kiểm chứng khả năng tiếp cận.
4. `Đổi giờ đến 25h.` → hỏi lại, không tạo lịch mới. Sau đó `Đổi giờ đến 19h.` → tiếp tục được.
5. `Lên lịch trình 1 ngày cho 1 người, ngân sách 1 triệu, khởi hành ngày mai.` → không kéo thông tin trẻ/người lớn tuổi và giờ cũ sang chuyến mới; hỏi giờ và phương tiện.

## Kiểm chứng

Từ thư mục `backend`:

```sh
npm run test:trip-preferences
npm test
npm run build
```

Script kiểm chứng dùng SQL thật để truy xuất địa điểm và phiên khách tạm trong bộ nhớ, không tạo tài khoản hoặc lưu ý kiến giả. Thử hơn 10 lượt chỉnh, giờ sai/sửa lại, lịch sử, chuyến mới và chuyển bản nháp giữ giới hạn giờ. Kiểm thử đơn vị kiểm tra phân loại giờ, khách/tuổi, điểm xa/thiếu tọa độ, chi phí chưa biết và lịch nhẹ. Frontend kiểm tra SSE giữ cả các buổi rỗng và thông tin nhóm khách.

Giới hạn: các quy tắc nhận diện hiện hỗ trợ các cách diễn đạt được nêu trên, chưa bao phủ mọi câu tự nhiên. Chưa tự chuyển đổi múi giờ, xác nhận vé máy bay, giao thông, thời tiết hoặc quy định trẻ em của nhà cung cấp. Không cần API key mới hay migration database cho bước này.

Kết quả triển khai: 95 kiểm thử backend, 28 kiểm thử frontend và build hai phía đạt. Luồng SQL thực tế qua hơn 10 lượt chỉnh đạt; kiểm tra trên web xác nhận 3 khách, đến 18:30/về 09:00, thông tin Taxi/2 người lớn/1 bé 6 tuổi và các buổi không xếp hoạt động.
