# Bộ test case và kết quả kiểm thử Gô

Ngày kiểm tra: 2026-11-05. Từng câu được thực thi tuần tự qua `processUserMessage` trên SQL local với provider tắt, không tạo dữ liệu người dùng giả. Đây là kiểm thử tích hợp service; các route/schema/auth/SSE có bộ kiểm thử riêng. Không coi kết quả dự phòng là model live đã đạt.

## Kết quả

- **423/423 câu gốc đã chạy**: 314 PASS, 109 DATA_LIMIT, 0 GAP, 0 FAIL theo các assertion tự động hiện có.
- **194/194 test backend** đạt, kèm các bước auth và upload riêng trong `npm test`.
- **30/30 test frontend** đạt.
- Build backend và frontend đạt.
- Các suite hội thoại SQL: 24 lượt tri thức/ngân sách, 12 trường hợp so sánh/chỉnh lịch, 5 nhóm giờ/phương tiện/khách; suite hồ sơ kiểm tra consent, sở hữu tài khoản và rollback đạt.
- 12 case gọi công cụ intent với Gemini live: **PROVIDER_UNAVAILABLE**; key có cấu hình, provider trả lỗi được phân loại **RATE_LIMITED**, kích hoạt cooldown. Không case live nào được báo PASS. Cooldown có nghĩa không phải cả 12 case đều gửi được request mạng; xem metrics trong báo cáo.

PASS nghĩa là các kiểm tra hợp đồng JSON, nhóm địa điểm, nguồn DB/menu, phạm vi ngữ cảnh hoặc điều kiện đã định nghĩa cho case đạt. **Không có nghĩa mọi tiêu chí trải nghiệm, lời văn, độ gần, chất lượng cơ sở hay mọi cách diễn đạt đều được đánh giá đầy đủ.** DATA_LIMIT nghĩa là câu trả lời nêu dữ liệu/kết quả chưa có; không tính là đã cung cấp đủ dịch vụ người dùng muốn. Thiếu dữ liệu live hoặc dữ liệu cơ sở vẫn cần bổ sung, không được tạo dữ liệu giả để làm test xanh.

## Toàn bộ từng dòng

- [Bảng 423 câu: mã, tiền điều kiện, mong đợi, thực tế, trạng thái](AI-ACCEPTANCE-RULES.md).
- [Fixture 423 câu để chạy lại](../backend/tests/fixtures/go-acceptance-cases.json).
- [Kết quả JSON đầy đủ, gồm thẻ địa điểm, món, lịch và thời gian](ai-knowledge/acceptance-rules.json).
- [Kết quả công cụ intent live và mã lỗi provider](ai-knowledge/intent-live-results.json).
- [Log lần đầu để đối chiếu trước khi sửa](ai-knowledge/acceptance-initial.log).

Câu ngắn phụ thuộc ngữ cảnh có `setup` rõ ràng: ví dụ câu hỏi tiện nghi/phòng sau khi tìm Hilton, hoặc câu chỉnh ngày sau một lịch 3 ngày. Mỗi case dùng danh tính khách riêng và khởi tạo lại tiền điều kiện, không để lệnh trước làm sai kết quả lệnh sau. Câu thiếu đối tượng vẫn phải làm rõ; fixture không tự thêm tọa độ GPS hoặc dữ liệu phòng/menu không tồn tại.

| Nhóm | Nội dung | Đã chạy | PASS | DATA_LIMIT | Lỗi/GAP |
|---|---|---|---|---|---|
| 1 | Hỏi chung về Đà Nẵng | 20 | 17 | 3 | 0 |
| 2 | Tìm địa điểm tham quan | 30 | 27 | 3 | 0 |
| 3 | Hỏi về biển và thiên nhiên | 20 | 20 | 0 | 0 |
| 4 | Hỏi về ẩm thực Đà Nẵng | 30 | 26 | 4 | 0 |
| 5 | Món ăn cụ thể | 20 | 13 | 7 | 0 |
| 6 | Sở thích ăn uống | 40 | 24 | 16 | 0 |
| 7 | Lưu trú | 46 | 29 | 17 | 0 |
| 8 | So sánh địa điểm | 20 | 1 | 19 | 0 |
| 9 | Lên lịch trình | 44 | 42 | 2 | 0 |
| 10 | Chỉnh sửa lịch trình | 29 | 29 | 0 | 0 |
| 11 | Ngân sách và chi phí | 24 | 23 | 1 | 0 |
| 12 | Di chuyển và bản đồ | 23 | 18 | 5 | 0 |
| 13 | Thời tiết và dữ liệu trực tiếp | 20 | 7 | 13 | 0 |
| 14 | Đánh giá và độ tin cậy | 18 | 2 | 16 | 0 |
| 15 | Tài khoản và ghi nhớ sở thích | 19 | 18 | 1 | 0 |
| 16 | Các câu hỏi kết hợp nhiều nhu cầu | 20 | 18 | 2 | 0 |

## Những lỗi phát hiện và sửa

| Vị trí | Trường hợp | Thay đổi |
|---|---|---|
| `chat.intent.ts`, `chat.language.ts` | Quán/điểm tham quan gần khách sạn bị đổi sang tìm chỗ ở | Phân biệt dịch vụ cần tìm và điểm mốc; giữ loại của câu tiếp nối |
| `chat.knowledge.ts` | Câu hỏi mùa đi, đánh giá, nguồn, thông tin sai hoặc tiện nghi trả lời chào chung | Nhận đúng nhu cầu, hỏi đối tượng còn thiếu và nêu dữ liệu chưa xác minh |
| `chat.repository.ts`, `chat.food-match.ts` | Lẩu khớp lâu đời, chè khớp chế biến, kem khớp kèm | Kiểm tra từ trọn vẹn và dấu cho tên món ngắn; truy vấn thêm tên món trong menu |
| `chat.knowledge.ts` | “Xóa điều kiện của chuyến trước” chưa bỏ ngân sách/giờ | Mở rộng cách nói reset và kiểm thử trên phiên đã có lịch |
| `chat.advanced.ts` | Câu “Nơi nào…?” sau bảng so sánh mất cặp địa điểm | Giữ và tra lại đúng hai nơi, không tự suy tiêu chí chưa có dữ liệu |
| `promt.ts` | Prompt hướng dẫn tự ép lịch trên 3 ngày về 3 ngày | Trả days null/missing và báo giới hạn, không đổi nhu cầu |
| `promt.ts` | Quy tắc “mọi số phải sao chép” xung đột việc chuẩn hóa tiền/ngày; QUESTION bị coi toàn bộ là lệnh không được làm theo | Phân biệt yêu cầu tư vấn hợp lệ với lệnh ghi đè chính sách; cho phép chuẩn hóa có căn cứ |
| `promt.ts` | Địa danh tự gán thành quận, schema công cụ không đồng bộ | Không tự gán Mỹ Khê/Cầu Rồng thành quận; cả 10 builder đều có schema JSON rõ ràng |
| `runtime.ts` | Không biết provider lỗi loại nào, dễ nhầm fallback là live | Thêm mã lỗi đã lọc và thời điểm; không lưu raw lỗi SDK, key hoặc câu người dùng vào diagnostics |

Lần đầu có 65 GAP không đồng nghĩa 65 bug độc lập: có lỗi chung ảnh hưởng nhiều câu, cũng có tiền điều kiện của testcase chưa rõ. Đã sửa code, làm rõ fixture và tăng assertion cho món ăn, reset và cặp so sánh, thay vì hạ điều kiện để báo PASS.

## Chạy lại

Từ thư mục `backend`:

```sh
npm run test:ai:complete
npm run test:acceptance
npm run test:acceptance -- --group=5
npm run test:intent:live
npm run build
```

`test:ai:complete` chạy unit/API/prompt rồi 423 case và các suite SQL đã nêu. `test:intent:live` chạy riêng; trả exit code khác 0 khi provider không khả dụng hoặc kết quả sai, không được đưa vào CI bắt buộc khi quota chưa sẵn sàng. Tùy chọn `npm run test:acceptance -- --live` chạy lại toàn bộ với provider cấu hình và có thể phát sinh chi phí; **đợt kiểm tra này không chạy 423 câu với model live**.

Từ thư mục `frontend`:

```sh
npm test
npm run build
```

## Những phần còn cần dữ liệu hoặc đánh giá tiếp

- Gemini cần khôi phục quota/khả năng truy cập trước khi đánh giá ngữ nghĩa live; không thể kết luận chất lượng model từ các case offline.
- 109 DATA_LIMIT có chi tiết trong bảng: ví dụ chưa có kết quả đúng món, tiện nghi/chính sách, giá theo ngày, thời tiết/sự kiện/tồn phòng hoặc tiêu chí so sánh chưa có nguồn.
- Xếp hạng “ngon nhất”, phù hợp từng đối tượng, mức đông, khả năng tiếp cận, tối ưu khoảng cách và độ tự nhiên của câu trả lời cần tiêu chí/dữ liệu riêng và đánh giá thủ công thêm.
- Bộ case không seed nhận xét/khảo sát/đặt phòng giả. Test hồ sơ SQL dùng transaction rollback; lịch thử dùng bộ nhớ khách tạm.
