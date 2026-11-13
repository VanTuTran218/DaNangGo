# Giai đoạn 6 — Tư vấn tiếp từ danh sách yêu thích

Ngày: 06/11/2026. Phạm vi: so sánh hai nơi đã lưu, tìm gần và gợi ý lựa chọn thay thế trong yêu thích. Dùng giao diện thẻ địa điểm/bảng so sánh của giai đoạn 3, không tạo danh sách riêng cho AI.

## Các câu hỏi để thử

Thay tên ví dụ bằng tên hoặc chi nhánh thực sự đã bấm tim trong tài khoản.

| Tình huống | Câu hỏi | Kết quả |
|---|---|---|
| So sánh | So sánh Khách sạn A và Khách sạn B trong danh sách yêu thích của tôi | Bảng so sánh đúng hai nơi đang được lưu và công khai |
| Giá | Nơi nào rẻ hơn? | Đọc lại cặp ID; so mức giá thấp nhất khi cùng loại và đủ giá, ghi rõ chưa chắc cùng món/hạng phòng |
| Khoảng cách của cặp | Nơi nào gần hơn? | Nếu có GPS và tọa độ cả hai, tính từ cùng mốc GPS; thiếu mốc thì hỏi lại |
| Tìm quán gần mốc | Tìm quán ăn yêu thích gần Khách sạn A 5km | Chỉ quán ăn đã yêu thích, đủ tọa độ và trong bán kính |
| Tìm các nơi gần mốc | Tìm địa điểm yêu thích gần Khách sạn A 2km | Kết quả theo khoảng cách tăng dần, không gồm chính mốc |
| Tìm gần GPS | Tìm địa điểm yêu thích quanh vị trí tôi 2km | Chỉ dùng GPS trong input do người dùng đã chia sẻ; chưa có thì mời dùng nút định vị |
| Thay thế | Tìm nơi thay thế Khách sạn A trong yêu thích | Các nơi cùng loại, trừ chính A; chưa sửa lịch |
| Thay thế giá thấp hơn | Tìm nơi thay thế Khách sạn A rẻ hơn trong yêu thích | Có đủ giá mốc, cùng loại và mức giá thấp nhất thấp hơn mốc |
| Thêm lựa chọn | Còn lựa chọn khác? / Xem tiếp | Trong ngữ cảnh tìm gần/thay thế, đọc mới và loại các ID đã hiển thị gần đây |

Sau khi vừa xem danh sách hoặc lập lịch từ yêu thích, có thể dùng câu so sánh/tìm gần/thay thế không lặp chữ “yêu thích”. Một câu trả lời thông thường kết thúc ngữ cảnh tư vấn này. Không dùng ngữ cảnh để đoán một cặp tên hoặc một mốc còn mơ hồ.

## Quy tắc dữ liệu

- `chat.favorite-consult.ts` chạy trước nhánh lập lịch/xem danh sách khi nhận đúng yêu cầu tư vấn. Câu lập lịch hoặc đổi ngân sách không bị nhầm thành tìm gần chỉ vì có từ “gần”.
- USER/PARTNER chỉ đọc favorites của tài khoản xác thực. Khách nhận lời mời đăng nhập; ADMIN/thiếu vai trò và yêu cầu xem người khác không được đọc.
- Mỗi lần tư vấn gọi lại `searchPlacesForChat` với `favoriteUserId` nội bộ. SQL dùng EXISTS theo chủ danh sách và chỉ lấy địa điểm ACTIVE, đúng public ID; không lấy chủ thể từ ID hoặc chỉ dẫn trong câu hỏi.
- Cặp so sánh và mốc được phân giải từ những nơi hiện còn trong nguồn yêu thích. Tên trùng/thiếu chi nhánh/cùng một ID/nơi bị bỏ lưu hoặc bị ẩn thì hỏi lại, không chọn một cơ sở khác thay thế ngầm.
- Không tự mở rộng ra ngoài favorites. Nếu yêu cầu rõ “ngoài yêu thích”, Gô giải thích phạm vi và hướng dẫn hỏi tìm địa điểm công khai riêng; không tự thêm tim hoặc thay lịch.
- Trên 500 ứng viên: báo giới hạn và chưa tư vấn từ một phần danh sách như thể đã đọc toàn bộ. Tối đa 6 thẻ mỗi lượt; trạng thái theo dõi ID đã hiện giới hạn 500 để tránh tăng vô hạn.
- Metadata nội bộ chỉ giữ mode, ID mốc/cặp, bộ lọc/bán kính và ID đã hiện; không lưu tọa độ GPS vào cursor. Lượt tiếp phải nhận GPS từ input hiện tại nếu cần dùng GPS.
- Lỗi đọc DB không đồng nghĩa danh sách trống và không fallback sang kết quả công khai khác. Nhánh này không gọi mô hình hoặc gửi danh sách riêng đến nhà cung cấp AI.

## So sánh có căn cứ

Giữ bảng so sánh hiện có: loại, khu vực, địa chỉ, giá có trong dữ liệu, điểm/số đánh giá, thời lượng và giờ nhận/trả phòng có nguồn. Ô thiếu dữ liệu giữ nguyên trạng thái thiếu.

“Rẻ hơn” chỉ diễn đạt mức giá thấp nhất ghi nhận khi hai nơi cùng loại và đủ giá. Không so giá vé với giá món/đêm, không nhận định chất lượng chỉ từ điểm sao và không hứa cùng món/hạng phòng, hóa đơn hoặc giá theo ngày đi.

Nếu hỏi “gần hơn”, cần một mốc chung. Có GPS cùng tọa độ hợp lệ của hai nơi thì so khoảng cách đường chim bay; thiếu dữ liệu thì mời chia sẻ mốc, không thay bằng tâm quận.

## Tìm gần

- Haversine với bán kính Trái Đất 6371km, hỗ trợ 2/5/10km.
- Tọa độ phải hữu hạn và nằm trong giới hạn vĩ/kinh độ; 0 là tọa độ hợp lệ. Thiếu tọa độ thì không đưa vào phép tính, thông báo số nơi chưa xét nếu có.
- Kết quả được sắp xếp theo khoảng cách tăng dần. Chỉ số này là đường chim bay, không phải tuyến OSRM, thời gian lái xe hay dữ liệu giao thông.
- Mốc tên phải nằm trong yêu thích hiện tại. GPS chỉ dùng khi đã được người dùng chia sẻ; không suy vị trí từ địa chỉ/quận.

## Thay thế và điều kiện ăn uống

- Chỉ gợi ý nơi cùng loại với mốc. Chính mốc không nằm trong các thẻ thay thế.
- Giá chưa biết không được thay bằng 0đ để lọc rẻ hơn. Các lựa chọn theo giá vẫn có lời nhắc về đơn vị và điều kiện khác nhau.
- Hạn chế ăn uống từ profile hoặc ngữ cảnh vẫn được kiểm tra. Khi chưa có dữ liệu thành phần/kiêng ăn đủ, không khẳng định quán đã lưu là an toàn. Lỗi đọc profile khiến Gô tạm không gợi ý quán ăn và báo lý do; vẫn có thể tư vấn nơi thuộc loại khác.
- Đây là gợi ý để cân nhắc. Chưa tự thay hoạt động, đặt phòng, lưu bản nháp mới, thêm/bỏ tim hoặc đặt dịch vụ. Luồng lập lại lịch từ yêu thích của giai đoạn 5 tiếp tục được dùng khi cần dựng lịch mới.

## Kiểm thử và bằng chứng

12 bài kiểm thử mới trong `backend/tests/chat-favorite-consult.test.ts` bao phủ:

1. Nhận diện tư vấn và không chiếm planner/tìm kiếm chung/đổi ngân sách.
2. Khách/admin/yêu cầu tài khoản khác không đọc dữ liệu riêng.
3. So sánh đúng cặp, hỏi giá/khoảng cách tiếp và truy vấn mới theo owner.
4. Tên trùng/cùng ID/đã bỏ lưu/bị ẩn không tự so nơi khác.
5. Không kết luận giá khi khác loại hoặc thiếu giá.
6. Haversine đúng đơn vị, tọa độ trùng trả 0, sắp xếp đúng và loại nơi thiếu tọa độ.
7. Bán kính không hỗ trợ, mốc thiếu tọa độ hoặc không xác định được được xử lý rõ.
8. GPS chỉ từ input; cursor không chứa tọa độ.
9. Thay thế cùng loại/giá thấp hơn, không sửa lịch, hỏi tiếp không lặp thẻ.
10. Bộ lọc quán gần mốc và bảo vệ điều kiện ăn uống.
11. Danh sách rỗng/lỗi DB/quá 500 nơi, không mở rộng nguồn ngầm.
12. Luồng `processUserMessage` qua lịch sử sở hữu cặp ID và giữ scope SQL khi hỏi tiếp.

Bộ test backend **233/233 đạt**, gồm 12 test mới; build backend đạt; `git diff --check` đạt. Sau bổ sung kiểm tra tránh nhầm câu đổi ngân sách, bộ 12 test chức năng và build được chạy lại thành công. Không sửa code frontend ở giai đoạn này.

SQL local thật: so sánh hai nơi đã lưu, hỏi tiếp giá, thay thế cùng loại, kết quả tìm gần thực sự nằm trong 10km, loại nơi bị ẩn, bỏ lưu làm cặp cũ hết hiệu lực và tài khoản khác không dùng lại cặp bằng cursor. Toàn bộ liên kết thử nằm trong transaction rollback; IDs/count ban đầu được bảo toàn.

Bằng chứng: [favorites-stage6-sql-tests.json](../ai-knowledge/favorites-stage6-sql-tests.json).

HTTP thật: POST yêu cầu so sánh yêu thích bằng phiên khách nhận đúng lời mời và link đăng nhập; không trả bảng so sánh giả. Backend local được khởi động để thực hiện kiểm tra này.

Chưa thực hiện kiểm thử thủ công toàn bộ luồng đăng nhập trên trình duyệt trong đợt này; kiểm thử có dữ liệu sử dụng service/SQL và HTTP giả lập trong bộ test. Giai đoạn 7 dành cho kiểm thử giao diện và bàn giao toàn luồng.

```sh
cd backend
npm run test:favorite-consult
npm run test:favorite-consult:integration
npm test
npm run build
```

Không cần API key, migration hay dữ liệu học mới. Dữ liệu tư vấn được lấy trực tiếp từ favorites và thông tin địa điểm hiện có theo tài khoản xác thực.
