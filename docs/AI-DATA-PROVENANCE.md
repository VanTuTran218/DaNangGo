# Mục 1 — Hồ sơ lưu trú công khai phục vụ AI

Cập nhật mục 2 ngày 05/11/2026: đã bổ sung một phần tọa độ, giờ lưu trú, sức chứa và giá niêm yết có điều kiện. Xem [dữ liệu lưu trú chi tiết](AI-STAY-DETAILS.md). Kết quả dưới đây mô tả thời điểm hoàn thành mục 1.

Đối chiếu ngày 04/11/2026. Phạm vi đợt này là thay nguồn lưu trú `[Mẫu]` trong kết quả công khai và AI, không phải xác minh toàn bộ địa điểm/nhà hàng trong database.

| Hồ sơ | Nguồn chính thức |
| --- | --- |
| Furama Resort Danang | https://furamavietnam.com/the-resort/contact-us/ |
| Hilton Da Nang | https://www.hilton.com/en/hotels/daddvhi-hilton-da-nang/ |
| Hyatt Regency Danang Resort and Spa | https://www.hyatt.com/hyatt-regency/en-US/danhr-hyatt-regency-danang-resort-and-spa/hotel-info |
| HAIAN Beach Hotel & Spa | https://haianbeachhotelspa.com/vi/trang-chu/ |
| Sala Danang Beach Hotel | https://salahotelgroup.com/en/contact/ |

Tên, địa chỉ và điện thoại lấy từ nguồn chính thức. Mô tả ngắn được viết lại theo thông tin công khai. Manifest lưu nguồn và ngày đối chiếu từng hồ sơ tại `database/seeds/verified-ai-stays.json`; bảng `public_place_provenance` lưu các trường đã/chưa xác minh. Ảnh chỉ dùng ba file đã có đúng cơ sở, với URL gốc và ngày đối chiếu ảnh riêng; hai cơ sở còn lại không gán ảnh địa điểm khác.

Không sao chép giá, điểm đánh giá, phòng hay sức chứa của dữ liệu mẫu sang tên cơ sở thật. Giá, tọa độ, sức chứa, phòng trống, giờ nhận/trả phòng và phương thức thanh toán chưa xác minh được để NULL. Các hồ sơ này chưa phải đối tác và không xác nhận đặt phòng được. Danh mục quận cũ chỉ phục vụ bộ lọc hiện tại; địa chỉ giữ tên phường theo nguồn.

## Thực hiện trên database development

Chạy từ thư mục `backend`, với cấu hình SQL development hiện có:

```sh
npm run sync:verified-stays
npm run test:verified-stays
npm test
npm run build
```

Lệnh đồng bộ tự chạy migration 016, nhập theo `reference_key` duy nhất trong transaction và có thể chạy lặp. Từ chối ghi đè nếu trùng tên hồ sơ khác hoặc cơ sở đã có đối tác quản lý. Chỉ ẩn đúng 5 ID 330–334 nếu tên mẫu, trạng thái và chủ sở hữu vẫn khớp; không xóa phòng hay các liên kết cũ. `public_catalog_change_log` ghi trạng thái trước/sau cùng mã đợt để kiểm tra và khôi phục khi cần. Trên database local hiện tại, 5 hồ sơ mới có ID 370–374; ID ở máy khác có thể khác.

Không dùng `seed:ranking:real` để thực hiện bước này: script cũ phục vụ dữ liệu demo xếp hạng và có thể giữ các giá/đánh giá giả lập khi gắn tên khách sạn thật.

Đội nhóm chỉ cần schema có thể chạy `npm run migrate:ai` để áp dụng migration 016 trước khi dùng nhánh mã này. Không tự chạy đồng bộ trên production.

## Kết quả kiểm chứng

- Đồng bộ hai lần vẫn giữ đúng 5 ID, không trùng hồ sơ.
- 5 hồ sơ tham khảo không có phòng hoặc đánh giá tự sinh; 5 hồ sơ mẫu bị ẩn vẫn giữ nguyên 15 hạng phòng cũ.
- Hỏi khách sạn Mỹ Khê nhận HAIAN/Sala theo mô tả chính thức và thông báo chưa đủ tọa độ tính khoảng cách. Không ghi số km giả. Điều này chỉ là tìm theo khu vực, không áp dụng nới bán kính GPS của khách.
- Hỏi lưu trú dưới 500.000đ không nhận cơ sở chưa biết giá là phù hợp ngân sách.
- Lịch 3N2Đ dùng cơ sở thật, chi phí lưu trú chưa biết giữ NULL, không tính là miễn phí.

Script kiểm chứng dùng SQL thật, không gọi model trả phí và không tạo phản hồi/đánh giá giả của người dùng. Nó chạy đồng bộ manifest development, không dành cho production.

Bước tiếp theo: đối chiếu tọa độ, giá theo ngày/loại phòng, sức chứa và điều kiện dịch vụ trước khi AI dùng để tính khoảng cách, ngân sách và khả năng đặt dịch vụ. Năm hồ sơ hiện tại chưa đại diện đủ phân khúc lưu trú bình dân/homestay.
