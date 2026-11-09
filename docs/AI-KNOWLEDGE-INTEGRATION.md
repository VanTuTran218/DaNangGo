# Áp dụng tài liệu tri thức Gô — Phần 01–03

**Cập nhật sau đợt nền tảng:** đã bổ sung bảng so sánh có dữ liệu thật và thao tác thêm/bỏ/thay/chuyển theo ngày/buổi. Kết quả kiểm tra hiện tại: backend 166/166, frontend 29/29, 12 lượt tích hợp mới đạt. Xem [báo cáo kiểm thử chi tiết](AI-ADVANCED-TEST-REPORT.md). Các bảng bên dưới ghi lại phạm vi của đợt nền tảng trước khi bổ sung các thao tác này.

Nguồn: `Bộ tài liệu tri thức và hội thoại cho trợ lý Gô (DaNangGo).docx` do chủ dự án cung cấp. File tự ghi rõ chỉ hoàn thành Phần 01–03; Phần 04–14 chưa có. Không chứa dữ liệu cơ sở kinh doanh đã xác minh. Các mô tả “hiện trạng đã biết” trong tài liệu không được coi là bằng chứng tính năng đã triển khai.

## Dữ liệu đã tiếp nhận

- `ai-knowledge/intent-catalog.json`: 113 mã ý định, mục tiêu, câu hỏi mẫu và biến thể được trích từ Phần 02, không bổ sung địa điểm/giá/nguồn giả.
- Nhãn `SYNTHETIC`, mục đích `DESIGN_AND_TEST_ONLY`: đây là câu hỏi thiết kế, không phải lời nói của khách thật. Không nhập vào bảng đánh giá/khảo sát, không dùng làm dữ liệu thống kê.
- Danh mục phục vụ thiết kế và kiểm thử; không phải 113 tính năng đã hoạt động, cũng không phải huấn luyện lại mô hình.

## Hành vi được bổ sung vào API chat hiện có

| Nhóm trong tài liệu | Phần đã áp dụng | Giới hạn còn lại |
|---|---|---|
| 1. Chuyến đi tổng thể | Tách tiền và phạm vi tổng/mỗi người/mỗi ngày; hỏi tối đa 3 câu khi thiếu; không đưa tổng trước khi rõ; dự phòng mặc định dự kiến 8%, ưu tiên số khách yêu cầu | Phạm vi gồm/không gồm vé máy bay, ăn uống… vẫn cần xác nhận; chưa phân bổ riêng mọi khoản |
| 2. Lịch trình | Giữ giờ đến/về, trẻ em, phương tiện của luồng cũ; hỏi đêm lưu trú cho chuyến 1 ngày; báo mâu thuẫn ngày/đêm; giữ dự phòng; loại điểm có tên trong danh mục; cho phép thêm/bỏ/thay/chuyển từng mục theo mã, tên, ngày và buổi | Chỉ sửa được mục xác định duy nhất; không tự sửa khi có nhiều mục khớp hoặc buổi đích không đủ thời gian |
| 3. Ẩm thực | Từ khóa ăn chay/dị ứng/kiêng được giữ riêng qua nhiều lượt; không đưa thẻ quán như kết quả đáp ứng khi thành phần chưa được xác minh | Chưa có nguồn thành phần/dị ứng nên chặn gợi ý phù hợp thay vì cam kết an toàn; chưa tính số món cho cả bữa |
| 4. Lưu trú | Không thay phòng qua đêm cho nghỉ ban ngày; ghi nhận đã có khách sạn; không tiếp tục gợi ý khách sạn trong lịch; không khẳng định còn phòng | Chưa có giá theo giờ, tồn phòng trực tiếp; nhận sớm/trả muộn/gửi hành lý cần cơ sở xác nhận |
| 5. Tham quan | Đúng loại ATTRACTION; null không thành 0; loại Bà Nà/Cầu Rồng… khi khách nêu rõ đã đi/bỏ; giữ giới hạn thời gian từ luồng cũ | Giá vé 0 trong catalog chưa đồng nghĩa đối chiếu theo ngày; chưa có xác minh tiếp cận đầy đủ |
| 6. Bản đồ | Dẫn `/bando` ngay trong web; không tự nhận tâm thành phố là vị trí khách; thiếu GPS/điểm mốc thì hỏi; nhãn chim bay và định tuyến được giữ | Chat chưa tính tuyến A–B hay cước/lịch xe buýt; không hứa nhập điểm đầu nếu UI chưa hỗ trợ |
| 7. So sánh/thay thế | Hỏi đối tượng khi mơ hồ; hiển thị bảng so sánh từ dữ liệu công khai; giữ ô thiếu là chưa biết; thay đúng một mục theo itemRef/tên và không quay lại khách sạn đã bị loại khi hết lựa chọn | Chưa có xếp hạng tự động theo ưu tiên chủ quan; dữ liệu so sánh phụ thuộc nguồn đã có trong catalog |
| 8. Ngữ cảnh | Phạm vi tiền, số tiền gốc, dự phòng, đêm, nhu cầu nghỉ ban ngày/đã có khách sạn vào state nội bộ; loại trừ và điều kiện ăn kiêng giữ riêng; “Bắt đầu lại” xóa điều kiện cũ | Loại trừ theo tên hiện có danh mục hữu hạn, chưa giải quyết mọi tên tự do/chi nhánh; chưa hỗ trợ mọi câu viết tắt |
| 9. Tin cậy/phản hồi | Dẫn khảo sát nhanh; phân biệt khảo sát tổng thể với đánh giá cơ sở; không nói kiểm duyệt là xác minh khách thật; tóm tắt dùng ngưỡng thực tế 5 mẫu | Chat chưa tạo phiếu báo sai dữ liệu. Top Ranking là luồng khác; không lấy ngưỡng ranking thay ngưỡng tóm tắt |
| 10. Dữ liệu trực tiếp | Quy tắc trả lời trung thực cho thời tiết, giá hôm nay, còn phòng/vé, kẹt xe, độ đông, sự kiện, giờ diễn, đang mở | Chưa tích hợp nguồn trực tiếp mới. Không cần thêm API key cho các quy tắc này |

## Quyết định và cách tính

- `chat.budget.ts` giữ **amount** gốc và **scope**; tính tổng bằng code chỉ khi đủ số khách/ngày tương ứng. Thay số tiền mà không nói phạm vi sẽ hỏi lại. Các khoản dự phòng không được nhận nhầm thành ngân sách mới.
- 3 triệu cho hai người nhưng chưa rõ tổng/mỗi người: chưa tạo lịch mới. Khi xác nhận tổng 3 triệu/2 người/0 đêm: tạo lịch một ngày, không tự thêm khách sạn.
- Nếu yêu cầu giữ 500k: số khả dụng là 2.500.000đ; `remaining = budget - reserve - knownSubtotal`. Ăn uống gợi ý dựa trên số khả dụng, luôn mang nhãn dự kiến. Chưa biết giá vẫn giữ null; số còn lại không khẳng định đủ tiền trọn chuyến.
- Nếu không nêu dự phòng: dùng 8% tổng ngân sách như quy tắc đề xuất trong tài liệu, hiển thị rõ là dự kiến. Người dùng vẫn có thể sửa trong luồng dự trù hiện có.
- Các chi phí người dùng tự ước tính trong công cụ dự trù sẽ cập nhật lại số còn lại. Không gọi đó là tiền đã chi hoặc dịch vụ đã đặt.
- Trường có giá trong DB chưa tự trở thành giá đã xác minh theo ngày; nguồn công bố/hiệu lực lưu trú vẫn qua cơ chế provenance trước đó.
- Trạng thái riêng chỉ đi kèm lượt AI của đúng phiên sở hữu; được bỏ khỏi nội dung DTO công khai. Không lấy marker do người dùng gửi làm state.

## Kiểm thử và cách chạy

Từ thư mục `backend`:

```sh
npm test
npm run build
npm run test:knowledge
npm run test:trip-preferences
```

Từ thư mục `frontend`:

```sh
npm test
npm run build
```

`test:knowledge` dùng SQL catalog thật ở chế độ chỉ đọc, tắt provider trong tiến trình test để chứng minh các hành vi không phụ thuộc Gemini. Phiên thử là khách trong bộ nhớ, không tạo người dùng/đánh giá/khảo sát trong DB. Kết quả 24 lượt có trong `ai-knowledge/integration-results.json`, gồm câu hỏi, câu trả lời, việc tạo lịch và thời gian từng lượt. Không phải dữ liệu khách thật và không dùng làm thống kê thị trường.

Chuỗi kiểm thử trực tiếp trên `/chat`: hỏi “Có 3 triệu đi 1 ngày, ăn ngon, chụp ảnh, có chỗ nghỉ” → hỏi số khách/phạm vi tiền/qua đêm → “2 người, tổng 3 triệu, không qua đêm, giữ 500k dự phòng” → lịch một ngày, không có lưu trú, phần dự phòng 500k.

## Các dữ liệu phải bổ sung tiếp

1. Giá vé theo người lớn/trẻ em, điều kiện miễn phí, ngày hiệu lực và nguồn.
2. Món–quán, giá kèm đơn vị/khẩu phần, thành phần/dị ứng có xác nhận, giờ phục vụ.
3. Hạng phòng, khách bao gồm trong giá, sức chứa theo độ tuổi, thuế/phụ thu; chính sách nghỉ ban ngày nếu có.
4. Giờ thường lệ, ngoại lệ ngày lễ, thời lượng, đặc tính trong/ngoài trời và tiếp cận có nguồn.
5. Các nguồn trực tiếp (thời tiết, lịch diễn, tồn phòng/vé) cần lựa chọn nhà cung cấp, điều khoản và key tùy dịch vụ; tài liệu hiện chưa cung cấp.

Không dùng dữ liệu giả lấp các khoảng trống trên. Phần 04–14 của file gốc và các nguồn đã xác minh có thể bổ sung sau để mở rộng tiếp, nhưng chúng không có sẵn trong tài liệu lần này.

Kết quả nghiệm thu đợt này: backend 140/140 kiểm thử; frontend 28/28; build backend và frontend thành công. Bộ tích hợp tri thức 24 lượt và bộ tích hợp giờ/nhóm khách 5 nhóm tình huống đều đạt. Đã sửa thêm việc xếp lại cùng Cầu Rồng buổi chiều và tối, nút đổi khách sạn trên chuyến không lưu trú, dấu đầu dòng bị lặp và nhãn tiền còn lại.


## Khung Gô nhiều nhu cầu (2026-11-05)

Đã tích hợp prompt mới, ngữ cảnh nhiều nhu cầu và sở thích có xác nhận. Xem [báo cáo triển khai](AI-GO-POLICY-IMPLEMENTATION.md) và [kết quả tích hợp SQL](ai-knowledge/go-policy-test-results.json). Bộ kiểm thử hiện đạt 176 backend / 30 frontend; không thay các giới hạn dữ liệu live thành khẳng định đã có API.
