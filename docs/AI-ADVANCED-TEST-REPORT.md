# Kiểm tra phần AI vừa bổ sung

Phạm vi: so sánh địa điểm và chỉnh lịch qua chat; kiểm tra hồi quy luồng AI đã có. Dữ liệu thử từ SQL catalog thật, provider bị tắt riêng trong tiến trình integration để xác nhận không lệ thuộc Gemini. Phiên thử trong bộ nhớ; không tạo review/khảo sát giả hoặc đặt dịch vụ.

## Kết quả tự động

- Backend: 166/166 kiểm thử đạt (26 ca mới về so sánh/chỉnh lịch).
- Frontend: 29/29 kiểm thử đạt, có kiểm tra SSE giữ comparison/revision/mã mục/giá chưa biết.
- Build backend và frontend thành công.
- Bộ tích hợp mới: 12 lượt đạt; quyền sở hữu phiên, lịch sử, xuất bản nháp được xác nhận thêm bằng assertion.
- Bộ tích hợp tri thức trước đó: 24 lượt vẫn đạt.

## Từng ca với SQL thật

| # | Ca thử | Đầu vào | Kết quả thực tế |
|---|---|---|---|
| 1 | So sánh cơ sở thật, không bịa giá | So sánh Hilton với Furama | Mình so sánh Hilton Da Nang và Furama Resort Danang từ dữ liệu DaNangGo. Ô còn thiếu giữ nguyên là chưa có dữ liệu. Bạn ưu tiên giá, khu vực hay thời lượng để mình giúp cân nhắc? |
| 2 | So sánh tham chiếu hai cơ sở ở lượt trước | So sánh hai chỗ này | Mình so sánh Hilton Da Nang và Furama Resort Danang từ dữ liệu DaNangGo. Ô còn thiếu giữ nguyên là chưa có dữ liệu. Bạn ưu tiên giá, khu vực hay thời lượng để mình giúp cân nhắc? |
| 3 | Tên không tồn tại không tạo địa điểm | So sánh Khách Sạn Không Tồn Tại với Hilton | Mình chưa xác định duy nhất cả hai địa điểm trong dữ liệu công khai. Bạn nêu tên đầy đủ/chi nhánh; mình chưa dựng bảng để tránh so nhầm cơ sở. |
| 4 | Lập lịch nền từ SQL thật | Đi 3N2Đ cho 2 người, tổng ngân sách 6 triệu, khởi hành 2026-12-01, đến 8h, về 22h, giữ 500k dự phòng | Mình lên trước lịch 3 ngày cho 2 người, tổng ngân sách bạn đưa ra 6.000.000đ. Các buổi được cân đối theo giờ đến/về và nhịp đi bạn đã cung cấp; buổi không còn thời gian sẽ không xếp hoạt động.<br><br>Để chỉnh lịch sát hơn, bạn bổ sung giúp mình:<br>• Bạn di chuyển bằng ô tô, xe máy, taxi, xe buýt hay đi bộ? |
| 5 | Bỏ mục ngày 2, giữ nguyên ngày 1 và 3 | Giữ ngày 1, bỏ Danh Thắng Ngũ Hành Sơn ngày 2 | Đã bỏ Danh Thắng Ngũ Hành Sơn khỏi ngày 2. Các mục khác được giữ nguyên; mình đã tính lại chi phí vé, khoản dự phòng vẫn giữ. |
| 6 | Đổi phương tiện không làm lại lịch đã chỉnh | Đi taxi | Đã cập nhật giờ/phương tiện và giữ các chỉnh sửa trước đó. Chưa tự thêm điểm để lấp giờ trống. |
| 7 | Chỉ thay bữa trưa ngày 2 | Thay quán ăn ngày 2 buổi trưa bằng quán khác | Đã thay Hải Sản Tươi Sống Mỹ Khê bằng Bánh Xèo Bà Ba vào ngày 2, buổi trưa. Những mục khác giữ nguyên. Chi phí vé được tính lại từ dữ liệu đã biết; các khoản chưa biết vẫn để chưa xác định. |
| 8 | Chuyển mục cụ thể sang buổi trống | Chuyển Bãi Biển Mỹ Khê từ ngày 1 sang ngày 2 buổi sáng | Đã chuyển Bãi Biển Mỹ Khê sang ngày 2, buổi sáng. Các ngày và mục khác được giữ nguyên; thời gian này vẫn là đề xuất, cần kiểm tra giờ hoạt động. |
| 9 | Tham chiếu mơ hồ phải hỏi lại | Bỏ cái đó | Bạn muốn điều chỉnh quán ăn, chỗ ở hay điểm tham quan nào? Cho mình tên cụ thể để giữ các phần còn lại và tránh đổi nhầm. |
| 10 | Ngày ngoài phạm vi không sửa lịch | Thêm Mỹ Khê ngày 9 buổi chiều | Lịch hiện có 3 ngày; ngày cần sửa chưa hợp lệ. Mình giữ nguyên lịch. |
| 11 | Reset bỏ điều kiện/chỉnh sửa cũ | Bắt đầu lại | Mình đã bắt đầu lại và bỏ các điều kiện chuyến cũ. Bạn muốn đi mấy ngày, với bao nhiêu người và ngân sách dự kiến bao nhiêu? |
| 12 | Sau reset chưa có lịch mới để chỉnh | Bỏ Cầu Rồng ngày 2 | Cuộc trò chuyện này chưa có lịch trình để chỉnh. Bạn cho biết số ngày, số người và ngân sách để mình lập bản nháp trước nhé. |

## Lỗi phát hiện và đã sửa

1. Chọn nhầm số ngày ở mệnh đề “giữ ngày 1” thay vì ngày cần sửa → chỉ phân tích phần thao tác sau “giữ”.
2. Tách sai từ “sáng” trong câu chuyển sang buổi sáng → dùng điểm phân tách đầu tiên và giữ nguyên cụm đích.
3. Chèn mục có thể đè giờ nghỉ hoặc mục khác → tìm khoảng trống theo thời lượng và kiểm tra giao nhau khi thay.
4. Đổi phương tiện sau khi sửa có thể tạo lại toàn bộ lịch → phiên bản lịch đã chỉnh được giữ, chỉ cập nhật thuộc tính; đổi giờ chỉ bỏ mục ngoài khung mới và nêu rõ.
5. Reset có thể đọc lại lịch cũ trong DTO lịch sử → chỉ tra cứu các lượt sau lệnh bắt đầu lại.
6. Bộ test quy tắc cũ coi so sánh là câu không cần DB → tách ca truy xuất SQL mới, giữ kiểm tra các câu dữ liệu trực tiếp không gọi DB/LLM để đoán.
7. Ca integration từng giả định ngày 3 có điểm tham quan ngắn → dùng đúng mục có thể chuyển trong catalog hiện có; không tạo địa điểm giả để ép test qua.

8. Nhận nhầm “đi bộ” thành lệnh “bỏ” sau khi bỏ dấu tiếng Việt → tách phân tích phương tiện khỏi từ khóa thao tác. Bộ tích hợp giờ/nhóm khách 5 nhóm tình huống đã chạy lại và đạt.

## Giới hạn còn lại

- Một lượt một thao tác thêm/bỏ/thay/chuyển; khi có nhiều mục hoặc tên/chi nhánh chưa rõ, hỏi lại.
- Thời gian và khả năng di chuyển là đề xuất, chưa phải tuyến OSRM gắn vào từng chặng hay xác nhận giờ hoạt động.
- So sánh chỉ dùng các trường hiện có; chưa có giá theo ngày hoặc mẫu đánh giá đủ thì không suy ra cơ sở tốt nhất.
- Thời tiết, sự kiện theo ngày và tồn phòng/vé trực tiếp chưa được tích hợp trong đợt kiểm tra này. Chưa nhập thêm dữ liệu địa điểm đã nghiên cứu.
- Sau khi lưu một bản nháp, chỉnh trong chat tạo bản mới; không tự ghi đè lịch đã lưu.

## Chạy lại

Trong backend: `npm test`, `npm run build`, `npm run test:advanced`, `npm run test:knowledge`. Trong frontend: `npm test`, `npm run build`.

Báo cáo JSON chi tiết: `ai-knowledge/advanced-test-results.json`.

Đã thử trực tiếp trên trang /chat: bảng Hilton–Furama hiển thị đúng hai cơ sở và các ô chưa có dữ liệu; lệnh “Bỏ Cầu Rồng ngày 1 buổi chiều” tạo lịch mới với buổi chiều trống, giữ bữa ăn và ngày 2. Ảnh bằng chứng: danang-ai-comparison-tested.png và danang-ai-edit-tested.png trong thư mục artifacts của phiên làm việc.
