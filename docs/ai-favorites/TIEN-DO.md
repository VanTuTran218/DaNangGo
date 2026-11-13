# Theo dõi tích hợp yêu thích vào trợ lý Gô

Cập nhật: 06/11/2026. Phạm vi đã triển khai: **giai đoạn 1–6**.

| Giai đoạn | Nội dung | Trạng thái | Đầu ra |
|---|---|---|---|
| 1 | Rà chức năng hiện có, dữ liệu, API, quyền và đồng bộ | **Hoàn thành rà soát** | [Báo cáo và tiêu chí kiểm tra](GIAI-DOAN-1-RA-SOAT.md) |
| 2 | Hoàn thiện DB/API và trạng thái dùng chung | **Hoàn thành** | [Triển khai và kiểm thử](GIAI-DOAN-2-TRIEN-KHAI.md) |
| 3 | Nút tim trong chat, widget, so sánh và lịch | **Hoàn thành** | [Giao diện lưu địa điểm trong Gô](GIAI-DOAN-3-TIM-TRONG-GO.md) |
| 4 | Gô xem danh sách yêu thích theo yêu cầu | **Hoàn thành** | [Đọc danh sách riêng và kiểm thử](GIAI-DOAN-4-DOC-YEU-THICH.md) |
| 5 | Lập lịch từ nơi yêu thích | **Hoàn thành** | [Planner từ nguồn yêu thích](GIAI-DOAN-5-LICH-TU-YEU-THICH.md) |
| 6 | Tư vấn tiếp từ danh sách đã lưu | **Hoàn thành** | [So sánh, tìm gần và gợi ý thay thế](GIAI-DOAN-6-TU-VAN-TIEP.md) |
| 7 | Kiểm thử và bàn giao đầy đủ | Chưa triển khai | Báo cáo test, giới hạn và hướng dẫn demo |

## Kết quả giai đoạn 1

- Dùng lại module `favorites`, `FavoritesProvider`, `HeartButton` và tab cá nhân; không tạo danh sách AI riêng.
- **Điểm chặn:** SQL local thiếu bảng `dbo.favorites`; có bảng cũ `dbo.user_favorites`. Đường đọc tái hiện lỗi SQL 208.
- Migration chuyển đổi đã có nhưng chưa chạy trong giai đoạn 1. Bảng cũ hiện có 0 dòng ở local; không suy trạng thái môi trường khác.
- Bốn endpoint đều trả 401 cho khách trong kiểm tra router riêng, không kết nối DB và không ghi dữ liệu.
- Cần xử lý lỗi tải IDs, thao tác đang chờ khi đổi tài khoản, khóa thao tác theo địa điểm, các tim cục bộ và ID fallback.
- Chỉ thêm tài liệu/bằng chứng audit. Chưa thay đổi code tính năng, chưa tạo bảng, chưa sửa dữ liệu và chưa nối tim vào Gô.

## Kết quả giai đoạn 2

- Điểm chặn SQL ở giai đoạn 1 đã được xử lý: migration 009 đã áp dụng trên local; có unique theo tài khoản/địa điểm và hai khóa ngoại hợp lệ.
- API kiểm tra quyền, ID, phân trang và tài khoản dự kiến; trạng thái dùng chung có khóa thao tác, hủy yêu cầu cũ, lỗi và thử lại.
- Tim hiện có trên trang chủ/lưu trú dùng chung dữ liệu thật; địa điểm dự phòng thiếu ID không được lưu bằng ID giả.
- Tại cuối giai đoạn 2 chưa thêm tim vào Gô; phần này đã được thực hiện ở giai đoạn 3 bên dưới.

## Kết quả giai đoạn 3

- Thêm tim vào thẻ gợi ý trang chat/widget, nhóm gợi ý, bảng so sánh và các địa điểm trong lịch trình AI.
- Mọi nút dùng chung `HeartButton`/`FavoritesProvider`, không lưu trạng thái tim trong lịch sử hội thoại.
- Chỉ truyền `ChatPlaceCard.placeId`; không dùng ID món ăn, hoạt động hoặc catalog của wizard lịch trình.
- Bấm tim không mở trang chi tiết; widget xử lý riêng Enter từ chính thẻ và từ nút con.
- Tại cuối giai đoạn 3 chưa đọc danh sách qua chat; phần này đã thực hiện ở giai đoạn 4 bên dưới.

## Kết quả giai đoạn 4

- Gô đọc danh sách bấm tim theo tài khoản xác thực, tách khỏi khẩu vị/sở thích tư vấn.
- Hỗ trợ tất cả/quán ăn/lưu trú/tham quan, 6 nơi mỗi trang và xem tiếp theo ngữ cảnh.
- Truy vấn mới mỗi yêu cầu, chỉ trả nơi ACTIVE; lỗi DB không giả danh sách rỗng.
- Khách được mời đăng nhập; ADMIN không được đọc module yêu thích; không lấy ID chủ danh sách từ lời nhắn.
- Tại cuối giai đoạn 4 chưa lập lịch từ yêu thích; phần này đã thực hiện ở giai đoạn 5 bên dưới.

## Kết quả giai đoạn 5

- Lập lịch 1–3 ngày từ nguồn địa điểm yêu thích hiện tại của đúng tài khoản; không chỉ giới hạn trang vừa xem và không tự bù bằng nơi ngoài danh sách.
- Hỏi điều kiện còn thiếu, giữ brief, hạn chế ăn uống và loại trừ qua nhiều lượt.
- Tách nơi chưa xếp, báo thiếu quán/lưu trú và dữ liệu giá; dự trù không được gọi là khoản đã chi.
- Tại cuối giai đoạn 5 chưa triển khai tư vấn tiếp; phần này đã thực hiện ở giai đoạn 6 bên dưới.

## Kết quả giai đoạn 6

- So sánh hai nơi đang yêu thích, giữ cặp ID để hỏi tiếp về giá/khoảng cách, nhưng luôn đọc lại dữ liệu và quyền theo tài khoản hiện tại.
- Tìm gần một nơi đã lưu hoặc GPS được chia sẻ; Haversine 2/5/10km, ghi rõ đường chim bay và nơi thiếu tọa độ.
- Gợi ý thay thế cùng loại trong yêu thích, có lọc mức giá thấp hơn; không tự sửa lịch hoặc mở rộng ra ngoài danh sách.
- “Còn lựa chọn khác?”/“Xem tiếp” trong tư vấn tránh lặp các ID vừa hiển thị.
- Test backend 233/233 đạt, build đạt, kiểm tra SQL thật đạt và rollback dữ liệu thử.
- Giai đoạn 7 chưa triển khai: kiểm thử toàn bộ luồng giao diện và bàn giao đầy đủ.
