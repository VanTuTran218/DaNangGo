# Báo cáo tự kiểm tra AI DaNangGo

Thời điểm chạy: 2026-11-04T13:12:12.667Z. Môi trường local frontend 3001/backend 8001, SQL Server thật và nhà cung cấp Gemini được cấu hình.

Kết quả: **23 tình huống thực tế: 19 đạt, 4 chưa đủ dữ liệu**. Thêm **10/10 nhóm kiểm tra HTTP đạt**, **66/66 kiểm thử backend**, **25/25 kiểm thử frontend**, **5/5 ca của lệnh test:ai**. Build frontend và backend đạt. Các con số là các bộ kiểm tra khác nhau, không cộng thành một tỷ lệ đạt chung.

## Lỗi đã tìm thấy và sửa

| Lỗi trước khi sửa | Vị trí | Sửa và kiểm tra lại |
|---|---|---|
| Tìm khách sạn gần Mỹ Khê chỉ so khớp chữ, bỏ sót khách sạn có tọa độ gần nhưng tên/địa chỉ không chứa Mỹ Khê | chat.repository.ts, chat.service.ts | Lấy tọa độ điểm Mỹ Khê từ địa điểm ACTIVE, lọc 2 km. Có 1 cơ sở trong SQL cách 1,54 km; giữ nhãn [Mẫu] theo dữ liệu. UI ghi khoảng cách từ biển, không nhầm là từ GPS người dùng. |
| Mất số ngày/số khách/ngân sách sau nhiều lượt chỉnh lịch | chat.advisor-state.ts, chat.intent.ts, chat.service.ts | Giữ bản tóm tắt thông tin chuyến đi trong state nội bộ; nhận diện “ưu tiên” và không coi câu đổi lịch là bắt đầu chuyến mới. Chạy hơn 8 lượt vẫn giữ 3 ngày/2 khách/5.500.000đ. |
| Yêu cầu 7 ngày bị âm thầm tạo lịch 1 ngày | chat.intent.ts, chat.service.ts | Từ chối tạo lịch vượt 1–3 ngày và hỏi lại, không sinh lịch sai. |
| Cooldown model chat chặn cả embedding | Ai/runtime.ts | Cooldown theo model. Embedding trả 768 chiều ngay cả khi chat vào cooldown; có kiểm thử giả lập 429 riêng. |

Cải thiện thêm: câu hỏi thời tiết nêu rõ chưa tích hợp dự báo trực tiếp; sửa công cụ test CLI thiếu guestId, bỏ yêu cầu phải bịa giờ sự kiện, trả exit code khác 0 khi có ca lỗi. Không tự cập nhật lịch biểu diễn hoặc thời tiết từ nguồn chưa xác minh.

## Kết quả từng tình huống thực tế

| Test | Yêu cầu/đầu vào | Kết quả thực tế sau sửa | Kết luận | Thời gian |
|---|---|---|---|---|
| 1. Tham quan miễn phí | Gợi ý các điểm tham quan miễn phí ở Đà Nẵng | Bãi Biển Mỹ Khê (Miễn phí); Bán Đảo Sơn Trà & Chùa Linh Ứng (Miễn phí); Cầu Rồng & Cầu Tình Yêu Đà Nẵng (Miễn phí) | Đạt | 2464 ms |
| 2. Ẩm thực/quận/giá | Quán hải sản Sơn Trà dưới 300k | Hải Sản Bé Mặn (70.000–180.000đ/món) | Đạt | 1559 ms |
| 3. Khẩu vị | Gợi ý món ăn thanh đạm | Bún Chả Cá Hờn (40.000–45.000đ/món); Cơm Niêu Nhà Đỏ Đà Nẵng (35.000–95.000đ/món) | Đạt | 1838 ms |
| 4. Khách sạn | Khách sạn gần biển Mỹ Khê | [Mẫu] Khách sạn Biển Xanh (Từ 630.000đ/đêm, 1.54 km) | Đạt | 1883 ms |
| 5. Lịch trình đầy đủ | Đi 3N2Đ cùng bạn gái, thích biển và hải sản, tổng ngân sách 5tr5, khởi hành ngày mai. | 3 ngày, 2 khách, ngân sách 5500000, ngày 2026-11-05; các buổi: Sáng/Trưa/Chiều/Tối. | Đạt | 105 ms |
| 6. Đổi khách sạn giữ ngữ cảnh | Đổi khách sạn tiết kiệm hơn | 3 ngày, 2 khách, ngân sách 5500000, ngày 2026-11-05; các buổi: Sáng/Trưa/Chiều/Tối. | Đạt | 16 ms |
| 7. Nhớ lịch trình sau nhiều lượt | 8 lần điều chỉnh liên tiếp rồi đổi khách sạn | 3 ngày, 2 khách, ngân sách 5500000, ngày 2026-11-05; các buổi: Sáng/Trưa/Chiều/Tối. | Đạt | 50 ms |
| 8. Lịch thiếu thông tin | Tôi muốn đi biển 2 ngày | 2 ngày, chưa rõ số khách, ngân sách chưa rõ, ngày chưa chốt; các buổi: Sáng/Trưa/Chiều/Tối. | Đạt | 3 ms |
| 9. Vượt phạm vi 3 ngày | Lên lịch trình 7 ngày cho 2 người | Gô hiện hỗ trợ lịch trình từ 1 đến 3 ngày. Bạn muốn lên trước lịch 3 ngày, hay chọn 1–2 ngày? Mình chưa tạo lịch cho yêu cầu vượt phạm vi này. | Đạt | 1 ms |
| 10. GPS chưa cấp | Quán ăn quanh vị trí tôi | Bạn bấm Quanh vị trí tôi và cho phép truy cập vị trí để Gô tìm địa điểm gần bạn nhé. Bạn cũng có thể cho Gô biết quận muốn đến. | Đạt | 0 ms |
| 11. GPS dùng tọa độ công khai | Quán ăn quanh vị trí tôi, tâm Đà Nẵng, 2km | Bánh Xèo Bà Dưỡng (60.000–75.000đ/món, 1.80 km); Bánh Xèo Bà Ba (chưa cập nhật giá, 1.92 km); Cơm Niêu Nhà Đỏ Đà Nẵng (35.000–95.000đ/món, 1.14 km); Mì Hoành Thánh Tàu Bay (chưa cập nhật giá, 1.82 km) | Đạt | 1942 ms |
| 12. Ngoài chủ đề | Viết hàm Python giải Dijkstra | Mình chỉ hỗ trợ các câu hỏi về du lịch, ăn uống và lưu trú tại Đà Nẵng nhé. Bạn muốn tìm quán ăn, chỗ ở hay điểm tham quan nào? | Đạt | 0 ms |
| 13. Không bịa dữ liệu trực tiếp | Thời tiết Đà Nẵng hôm nay thế nào? | Gô chưa tích hợp dữ liệu thời tiết trực tiếp nên chưa thể xác nhận dự báo hôm nay. Bạn nên kiểm tra dự báo địa phương trước khi đi. Nếu muốn, mình có thể gợi ý lịch có điểm trong nhà để bạn dự phòng khi trời mưa. | Đạt | 1086 ms |
| 14. Hiểu lại từ khóa | homstay Mỹ Khê dưới 500k | homestay Mỹ Khê dưới 500k; chế độ ai | Đạt | 2085 ms |
| 15. Wizard điền lịch trình | Đi 3N2Đ cùng bạn gái, ngân sách 5tr5 ngày mai | {"days": 3, "guests": 2, "budget": 5500000, "start_date": "2026-11-05", "needs": [], "interests": [], "missing": [], "off_topic": false} | Đạt | 3 ms |
| 16. Nháp mô tả | Quán kiểm thử, bán mì Quảng, không gian nhỏ, có chỗ ngồi trong nhà. | Bán mì Quảng. Không gian nhỏ. Có chỗ ngồi trong nhà.; chế độ fallback | Đạt | 1 ms |
| 17. Tổng hợp đánh giá | Địa điểm #331 | Chưa có ít nhất 5 đánh giá đã duyệt để kiểm tra tổng hợp thật | Chưa đủ dữ liệu | 23 ms |
| 18. Địa điểm tương tự | Địa điểm #331 | 4 địa điểm, phương pháp catalog; loại đúng và không tự đề xuất chính nó. | Đạt | 22 ms |
| 19. Nháp trả lời đối tác | Đọc đánh giá thuộc đối tác, không gửi phản hồi | Không có đánh giá gắn đối tác để thử dữ liệu thật | Chưa đủ dữ liệu | 0 ms |
| 20. Kiểm duyệt không tự đổi trạng thái | Phân tích 1 đánh giá có sẵn | Chưa có dữ liệu đánh giá gắn đối tác | Chưa đủ dữ liệu | 0 ms |
| 21. Khảo sát thật | Đọc danh sách và báo cáo khảo sát | Không có khảo sát SQL để phân tích | Chưa đủ dữ liệu | 13 ms |
| 22. Embedding nhà cung cấp | Một văn bản công khai, không lưu vector SQL | Nhà cung cấp trả vector 768 chiều; không ghi vector thử vào SQL. | Đạt | 412 ms |
| 23. Lịch sử khách cách ly | Người khác không đọc được phiên thử | {"ownConversations": 1, "otherConversations": 0} | Đạt | 0 ms |

## Kiểm tra HTTP thật

| Kiểm tra | Kết quả | Chi tiết |
|---|---|---|
| HTTP tạo lịch 2 ngày | PASS | {"days": 2, "guests": 2} |
| Lịch sử là dữ liệu thật | PASS | {"conversations": 1} |
| Feedback và đọc lại | PASS | {"feedback": "helpful"} |
| Dự trù và đọc lại | PASS | {"known": 420000, "total": 2442000} |
| Khách khác không đọc phiên | PASS | {"http": 404} |
| Chưa đăng nhập không lưu lịch trình | PASS | {"http": 401} |
| Giả userId bị chặn | PASS | {"http": 400} |
| GPS sai tọa độ bị chặn | PASS | {"http": 400} |
| Admin/đối tác/wizard yêu cầu đúng quyền | PASS | [{"url": "/ai/admin/metrics", "http": 401}, {"url": "/ai/partner/description", "http": 401}, {"url": "/ai/itinerary", "http": 401}] |
| SSE trả lịch giữ ngữ cảnh, không lộ state nội bộ | PASS | {"events": ["status", "status", "result"], "days": 2} |

## Kiểm tra lưu SQL và an toàn dữ liệu

`check-chat-tools.ts` đã chạy với SQL thật: lọc GPS/khẩu vị, tạo bản nháp và liên kết tin nhắn trong cùng transaction; rollback toàn bộ dữ liệu thử. Kiểm tra không gửi phản hồi đối tác, không đổi trạng thái đánh giá, không đặt dịch vụ, không tạo tài khoản mới hoặc bật đồng bộ embedding hàng loạt. GPS được thử bằng tọa độ công khai của tâm Đà Nẵng, không lấy vị trí cá nhân.

## Những điểm chưa thể xác nhận bằng dữ liệu thật

- Tổng hợp đánh giá: địa điểm được chọn có 0 đánh giá APPROVED; giao diện/API báo cần ít nhất 5. Logic đếm và lọc ID đã có kiểm thử bằng dữ liệu kiểm thử, chưa thay thế được xác nhận với đánh giá thật.
- Nháp phản hồi đối tác và kiểm duyệt: không có đánh giá APPROVED gắn cơ sở đối tác để thử đầy đủ. Quyền, ID và logic nháp được kiểm thử giả lập; không gửi phản hồi thật.
- Khảo sát: SQL không có khảo sát để phân tích. Không coi dữ liệu mẫu trong UI quản trị là khảo sát thật.
- Nhiều lưu trú trong SQL đang là [Mẫu]. Kết quả tư vấn đúng dữ liệu nhưng chưa tương đương danh bạ khách sạn thật đã xác minh. Các mức giá tham khảo không xác nhận phòng trống.
- Đăng nhập/lưu/mở/chỉnh sửa với từng tài khoản thật chưa thao tác UI bằng thông tin đăng nhập của người dùng trong đợt này. Đã thử quyền API, lưu SQL trong transaction rollback và kiểm thử sở hữu bằng bộ kiểm thử.
- Chưa thử cấp quyền GPS thật trên điện thoại, mọi trình duyệt hoặc mạng yếu dài hạn. Không khẳng định AI đã hoàn thiện tuyệt đối.

## Chạy lại

Từ thư mục backend:

```sh
npm run audit:ai
npm run audit:ai:http
npm run test:ai
npm run test
npm run build
npx tsx src/scripts/check-chat-tools.ts
```

`audit:ai:http` mặc định trỏ localhost:8001/api; có thể đặt biến AI_AUDIT_API_URL cho môi trường kiểm tra khác. Từ frontend chạy `npm run test` và `npm run build`. Báo cáo JSON chứa phản hồi đầy đủ ở mức đã chọn, kết quả trước sửa lưu riêng trong AI-AUDIT-BEFORE-FIXES.json.
