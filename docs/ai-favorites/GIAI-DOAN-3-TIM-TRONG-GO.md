# Giai đoạn 3 — Lưu địa điểm ngay trong Gô

Ngày: 06/11/2026.

## Đã triển khai

| Vị trí | Component | Hành vi |
|---|---|---|
| Thẻ địa điểm ở `/chat` | `page/MessageBubble.tsx` | Nút “Lưu địa điểm” cạnh chỉ đường, tách khỏi nút mở chi tiết |
| Thẻ địa điểm trong widget | `ChatBox.tsx` | Tim cạnh chỉ đường; Enter ở nút con không kích hoạt mở chi tiết của thẻ cha |
| Nhóm gợi ý ăn uống/tham quan/lưu trú | `ResponseDetails.tsx` | Tim cạnh tên mỗi nơi; dùng chung cho chat và widget |
| Bảng so sánh | `ComparisonTable.tsx` | Tim riêng dưới tên mỗi địa điểm |
| Lịch trình AI ở `/chat` | `page/ItineraryCard.tsx` | Tim ở mỗi `PlanPlace`, gồm timeline và nhóm thêm lựa chọn |
| Lịch trình AI trong widget | `TravelPlan.tsx` | Tim ở mỗi `PlaceLink`, gồm từng buổi và các nhóm đề xuất |

Tất cả dùng `HeartButton` và `FavoritesProvider` của giai đoạn 2. Cùng một ID ở nhiều câu trả lời hoặc nhóm lựa chọn cùng đọc trạng thái hiện tại của tài khoản. Không thêm bản sao yêu thích vào DTO, localStorage hay nội dung AI, nên mở lại hội thoại không phục hồi một trạng thái tim đã lỗi thời.

Nút có trạng thái đã lưu, đang xử lý, khóa khi tải hoặc lỗi và thử lại theo cơ chế chung. Bổ sung mô tả tên địa điểm cho công cụ hỗ trợ tiếp cận. Footer thẻ chat xuống dòng khi thiếu chiều ngang.

## Quy tắc dữ liệu

- Truyền trực tiếp `ChatPlaceCard.placeId`, được backend ánh xạ từ `dbo.places.place_id`.
- Không dùng `menuItems.id`, ID hoạt động của lịch, tên địa điểm hoặc chỉ số mảng để lưu.
- ID thiếu/không hợp lệ bị nút dùng chung chặn; API tiếp tục kiểm tra nơi ACTIVE và quyền tài khoản.
- Không thêm tim vào hoạt động không có địa điểm như nghỉ trưa/đến sân bay, hoặc các ứng viên tạm thời trong lúc stream chưa hoàn tất.
- Không sửa wizard catalog riêng, không suy ra public ID từ catalog ID.
- Bấm tim chỉ thêm/bỏ địa điểm; không đặt dịch vụ hoặc lưu cả lịch trình.

## Kiểm chứng

- Frontend `npm run build`: thành công.
- Frontend `npm test`: 42/42 đạt, bao gồm 12 bài kiểm tra trạng thái favorites từ giai đoạn 2 (không phải 42 test mới).
- `git diff --check`: đạt.
- Trình duyệt local: lịch sử lịch trình đã hiển thị tim ở món ăn/điểm tham quan; khách bấm tim nhận yêu cầu đăng nhập và vẫn ở `/chat`.
- Hội thoại mới với câu “Gợi ý quán mì Quảng ở Hải Châu”: thẻ Mì Quảng 1A Hải Phòng có nút lưu; nhấn Enter nhận yêu cầu đăng nhập, không mở chi tiết.
- Câu “So sánh Mì Quảng 1A Hải Phòng và Bánh Xèo Bà Dưỡng”: cả hai cột có tim; bấm tim vẫn giữ bảng so sánh, hiện thông báo đăng nhập.
- Mở widget ở `/places/1`: lịch sử gợi ý và bảng so sánh đều có tim. Nhấn Enter vào tim trên thẻ Mì Quảng 1A không chuyển đến `/places/93`; trang giữ `/places/1` và hiện thông báo đăng nhập.
- Khi kiểm tra gặp phiên khách cũ hết hạn: dùng thao tác “Cuộc trò chuyện mới” rồi hỏi lại thành công. Không đổi cơ chế hết hạn phiên trong đợt này.

Giới hạn: chưa kiểm thử thủ công thao tác thêm/bỏ bằng tài khoản đã đăng nhập ở mọi vị trí trên trình duyệt; phần đồng bộ, pending và cách ly tài khoản được kiểm tra ở store/API/SQL trong giai đoạn 2. Giai đoạn 7 sẽ kiểm thử luồng tích hợp đầy đủ.

## Cách tự kiểm tra

1. Đăng nhập USER hoặc PARTNER, mở `/chat`, hỏi một quán ăn rồi bấm tim.
2. Hỏi so sánh quán đó với nơi khác: tim của cùng địa điểm phải thể hiện đã lưu.
3. Mở trang chi tiết và tab yêu thích trong hồ sơ: cùng một nơi phải được lưu; bỏ lưu tại một chỗ thì các nút cùng ID trong cùng phiên cập nhật.
4. Hỏi lịch trình: có tim ở từng địa điểm thật, không có tim ở mục nghỉ ngơi thuần văn bản.
5. Mở widget ở một trang khác: kiểm tra thẻ gợi ý/lịch trình, dùng Tab rồi Enter/Space trên tim; thao tác lưu không được mở chi tiết.
6. Đăng xuất: dữ liệu yêu thích trước đó không còn hiển thị; bấm lưu được yêu cầu đăng nhập.

## Tiếp theo

Giai đoạn 4 mới cho Gô đọc danh sách yêu thích theo yêu cầu. Giai đoạn 3 chỉ bổ sung thao tác lưu địa điểm trên giao diện, không sửa prompt để tuyên bố AI đã đọc danh sách.
