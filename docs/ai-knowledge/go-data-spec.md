# Đặc tả dữ liệu cho Gô

Bảng đề xuất bao phủ 11 nhóm. Các trường dưới đây là yêu cầu thu thập và tiêu chí nghiệm thu. Ưu tiên được giữ theo bảng người dùng cung cấp.

| Nhóm | Ưu tiên | Trường và cách sử dụng | Ca nghiệm thu |
|---|---|---|---|
| Địa điểm tham quan | Rất cao | ID ổn định, tên, tọa độ, mô tả, phân loại, thời lượng, ảnh, giờ thường lệ và ngoại lệ theo ngày | Khi thiếu giờ ngày lễ, Gô nêu giờ thường lệ có điều kiện và nói rõ giờ lễ chưa xác minh. |
| Giá vé tham quan | Rất cao | ID địa điểm, giá và đơn vị theo hạng khách, tuổi/chiều cao nếu áp dụng, ưu đãi, ngày hiệu lực và nguồn | Thiếu mức giá trẻ em thì nêu phần tính được và khoản còn thiếu. |
| Quán ăn, nhà hàng | Cao | ID, tên, địa chỉ, loại hình, món, giá theo đơn vị/khẩu phần, giờ phục vụ | Phân biệt giá một món và chi phí cả bữa. |
| Bản đồ và giao thông | Rất cao | Tọa độ từ danh mục. Tuyến, khoảng cách và thời gian lấy theo điểm đi, điểm đến và phương tiện | Có khoảng cách đường chim bay thì ghi đúng loại khoảng cách. |
| Ngân sách | Rất cao | Tính từ vé, ăn uống, phương tiện, lưu trú và dự phòng. Giữ phạm vi tổng, mỗi người hoặc mỗi ngày | Khi người dùng đổi từ mỗi người sang tổng, tính lại và giữ khoản dự phòng đã xác nhận. |
| Lịch trình | Rất cao | Sinh theo khung giờ, độ dài chuyến, sở thích, giới hạn tiền, giờ hoạt động và thời gian di chuyển | Khi đổi một mục, kiểm tra lại khung giờ và giữ các mục ngoài yêu cầu. |
| Thời tiết | Cao | Dự báo và cảnh báo theo khu vực, ngày/giờ, nguồn và thời điểm cập nhật | Khi thiếu dự báo cho khung giờ được hỏi, báo thiếu dữ liệu. |
| Khách sạn | Trung bình | ID, vị trí, khoảng giá và đơn vị, tiện nghi, liên hệ, liên kết đặt phòng | Chỉ xác nhận phòng trống khi có dữ liệu tương ứng với ngày đi. |
| Sự kiện | Trung bình | Ngày giờ, múi giờ, địa điểm, trạng thái tổ chức, giá và điều kiện vé | Nếu chưa có trạng thái cập nhật, nói rõ khi trả lời sự kiện còn diễn ra hay không. |
| Khách hàng | Cao | Ngôn ngữ, sở thích, ngân sách, số người và lịch lưu theo quyền truy cập và phạm vi đồng ý | Khách chưa đăng nhập dùng ngữ cảnh phiên. Chỉ xác nhận lưu lâu dài sau khi hệ thống báo thành công. |
| Hỗ trợ hệ thống | Cao | FAQ đã duyệt cho đăng nhập, bản đồ, quyền truy cập và chính sách dữ liệu. Ghi phiên bản hoặc ngày cập nhật | Khi báo lỗi đăng nhập, hỏi thông báo lỗi mà không yêu cầu mật khẩu hay OTP. |

Dữ liệu công khai cần nguồn, ngày kiểm tra và phạm vi áp dụng ở cấp bản ghi. Giá trị thiếu để trống. Giá 0 cần nguồn xác nhận miễn phí. Các ca trên dùng làm tiêu chí kiểm thử hành vi. Bảng đầu vào chưa cung cấp bản ghi thực tế để nhập vào danh mục.
