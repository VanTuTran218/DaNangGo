# Mục 2 — Dữ liệu lưu trú có nguồn, điều kiện và thời hạn

Đối chiếu ngày 05/11/2026. Thông tin bổ sung được lưu riêng trong `public_stay_details`, không tạo tồn phòng hay chuyển giá niêm yết thành giá có thể đặt.

| Cơ sở | Dữ liệu đã bổ sung | Còn cần xác nhận |
| --- | --- | --- |
| Furama | Nhận 14:00, trả 11:00; Garden Superior niêm yết 8.186.000đ/phòng/đêm, gồm 2 khách trong giá, hiệu lực năm 2026 | Tọa độ ghim; sức chứa tối đa; báo giá theo ngày và phòng trống |
| Hilton | Vị trí tòa nhà tham khảo; nhận 15:00, trả 12:00 | Giá, sức chứa từng hạng phòng và phòng trống |
| Hyatt | Vị trí khu nghỉ dưỡng tham khảo; phòng tiêu chuẩn 2 người lớn + 1 trẻ dưới 12 tuổi | Giờ lưu trú, giá theo hạng phòng và phòng trống |
| HAIAN | Tọa độ ghim từ liên kết bản đồ trên website cơ sở | Giờ lưu trú do nguồn mâu thuẫn; giá, sức chứa và phòng trống |
| Sala | Superior Partial Sea View tối đa 2 khách; Family Suite Panaromic View tối đa 4 khách | Tọa độ ghim, giờ lưu trú, giá và phòng trống |

## Nguồn và phạm vi

- Furama: https://furamavietnam.com/rack-rate-public-rate/ . Giá niêm yết gồm phí phục vụ 5% và VAT, có thể có phụ thu/ngày không áp dụng/bữa tối bắt buộc dịp lễ. Hai khách gồm trong giá không có nghĩa là sức chứa tối đa. Không lấy giá phòng bán trực tiếp từ bảng niêm yết này.
- Hilton: https://www.hilton.com/en/hotels/daddvhi-hilton-da-nang/ . Vị trí tham khảo từ https://mapcarta.com/36332298 (OSM way 655921406), đối chiếu tên/địa chỉ với website cơ sở.
- Hyatt: https://www.hyatt.com/hyatt-regency/en-US/danhr-hyatt-regency-danang-resort-and-spa/faqs . Vị trí tham khảo từ https://mapcarta.com/32900158 (OSM way 164333086), khớp số 5 Trường Sa. Vị trí khuôn viên không xác nhận là cổng đón khách.
- HAIAN: https://haianbeachhotelspa.com/vi/khach-san-view-bien/ . Lấy tọa độ ghim `!3d16.0530442!4d108.2475282`, không lấy tâm khung nhìn `@...`. Trang điều khoản chứa mẫu chưa hoàn chỉnh và giờ khác với các kênh khác nên chưa dùng làm giờ chuẩn.
- Sala: https://salahotelgroup.com/rooms/superior-partial-sea-view/ và https://salahotelgroup.com/rooms/family-suite-panaromic-view/ . Không lấy tâm iframe bản đồ làm ghim khách sạn.

Tọa độ Hilton/Hyatt: © OpenStreetMap contributors, dữ liệu theo ODbL, tham khảo qua Mapcarta. https://www.openstreetmap.org/copyright . Các điểm này phục vụ đo khoảng cách đường chim bay và định vị tham khảo, không phải cam kết vị trí cổng hoặc thời gian di chuyển.

Không sử dụng kết quả Furama trên Mapcarta có vị trí Hải Châu vì không khớp địa chỉ khu nghỉ dưỡng ven biển. Không điền giá từ các kết quả khuyến mãi ngân hàng/đại lý thiếu ngày ở, điều kiện hoặc hiệu lực rõ ràng.

## API và AI

Các thẻ `ChatPlaceCard` có thêm `stayFacts` (tùy chọn): `hours`, `rooms`, `publicRates`, `notices`. Mỗi dữ kiện có `sourceUrl` và `checkedOn`; giá có thêm `validFrom`, `validTo`, `includedGuests`, `conditions`. API chat và luồng SSE hiện tại truyền dữ kiện này vào thẻ gợi ý, nhóm lưu trú và lịch sử. Không cần API key mới cho bộ dữ liệu đã đối chiếu này.

AI nhận diện được tên Furama/Hilton/Hyatt/HAIAN/Sala và truy xuất đúng cơ sở khi hỏi giờ, sức chứa hoặc giá. Câu trả lời dự phòng vẫn trình bày dữ kiện ngay cả khi model không khả dụng. Nguồn và điều kiện có thể mở ở thẻ “Thông tin lưu trú & nguồn” trên `/chat`, widget và thẻ lịch trình.

`priceMin`/`priceMax` và `roomCapacity` dùng cho tính tiền vẫn chỉ lấy từ hạng phòng bán trong dữ liệu có sẵn. Dữ kiện công khai về số người gồm trong giá hoặc tiêu chuẩn người lớn/trẻ em không tự biến thành sức chứa hạng phòng để chia tiền. Giá niêm yết không được dùng như báo giá chắc chắn để kết luận phù hợp ngân sách. Chi phí lưu trú của lịch trình vẫn chưa xác định nếu chưa có giá theo ngày và hạng phòng tương ứng.

Giá bị ẩn khi ngoài thời hạn hoặc quá 30 ngày từ lần đối chiếu; giờ/sức chứa bị ẩn khi quá 180 ngày. Dữ liệu tương lai và sai schema không được dùng. Giao diện cũng kiểm tra lại thời hạn cho thẻ trong lịch sử cũ. Nội dung tin nhắn cũ vẫn giữ nguyên như bản ghi lịch sử và có thời gian gửi; chỉ thẻ dữ kiện được lọc lại.

## Đồng bộ và kiểm tra

Từ thư mục `backend`, trên SQL development:

```sh
npm run sync:verified-stays
npm run sync:stay-details
npm run test:verified-stays
npm run test:stay-details
npm test
npm run build
```

Từ thư mục `frontend`:

```sh
npm test
npm run build
```

Migration 017 có trong `npm run migrate:ai`; lệnh `sync:stay-details` cũng tự áp dụng migration này. Đồng bộ chạy trong transaction, theo mã nguồn tham khảo, từ chối ghi đè cơ sở đã có đối tác hoặc tọa độ/giờ đã được sửa riêng ngoài dữ liệu nhập trước đó. Không tự xóa phòng hoặc tạo đánh giá. Manifest: `database/seeds/verified-stay-details.json`.

Kiểm chứng tích hợp gồm: đồng bộ lặp; không tạo tồn phòng; GPS trong 2km và loại cơ sở thiếu tọa độ; giờ Hilton; sức chứa Sala; điều kiện trẻ em Hyatt; giá Furama đúng số tiền và nhãn tham khảo; không gán cơ sở chưa biết giá cho yêu cầu dưới 500k. Kiểm thử đơn vị gồm thời hạn, độ mới, ngày tương lai, dữ liệu/URL sai và nhận diện đúng cơ sở.

Phần dữ liệu còn thiếu trong bảng cần được bổ sung bằng nguồn rõ ràng hoặc xác nhận từ cơ sở. Để có giá/phòng trống trực tiếp theo ngày cần thêm nguồn cung cấp hoặc API đối tác có quyền truy cập; bước này chưa kết nối một API tồn phòng trực tiếp.
