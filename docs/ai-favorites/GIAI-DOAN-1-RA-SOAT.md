# Giai đoạn 1 — Rà soát yêu thích để tích hợp vào trợ lý Gô

Ngày thực hiện: 06/11/2026, múi giờ Việt Nam. Mã nguồn nền: `ee90b7ab` trên `main`.

**Trạng thái: hoàn thành khảo sát giai đoạn 1. Chưa triển khai giai đoạn 2.**

## 1. Kết luận

Có thể dùng lại module yêu thích hiện có. Không cần tạo danh sách hoặc bảng yêu thích riêng cho chatbot.

Tuy nhiên, database local được kiểm tra **chưa có `dbo.favorites` mà repository đang truy vấn**. Chỉ có bảng cũ `dbo.user_favorites`. Đường đọc hiện tại tái hiện lỗi SQL số **208**. Đây là điều kiện phải xử lý trước khi kiểm thử luồng yêu thích đăng nhập hoặc tích hợp nút tim vào Gô.

Migration `database/migrations/009_create_favorites.sql` đã có sẵn để tạo bảng chuẩn và sao chép dữ liệu cũ còn thiếu. Giai đoạn này chỉ kiểm tra đọc, **không chạy migration, không seed hoặc sửa dữ liệu tài khoản/yêu thích**.

## 2. Phạm vi và bằng chứng

Đã đọc router, service, repository, migration, client gọi API, context, nút tim, trang cá nhân và các vị trí hiển thị thẻ địa điểm trong chat.

Đã chạy hai kiểm tra riêng:

| Kiểm tra | Cách thực hiện | Kết quả |
|---|---|---|
| Cấu trúc SQL local | SELECT metadata, số liệu tổng hợp và đường đọc repository với chủ thể âm không dùng trong dữ liệu | Thiếu bảng chuẩn; repository lỗi 208 |
| Quyền khách chưa đăng nhập | Mount router trong Express kiểm thử riêng, không kết nối SQL và không gửi cookie/token | Cả bốn API trả 401 |

Bằng chứng máy đọc được:

- [Kiểm tra DB](../ai-knowledge/favorites-stage1-db-audit.json).
- [Kiểm tra API guest](../ai-knowledge/favorites-stage1-api-audit.json).

Chưa thử giao diện bằng tài khoản thật; chưa thử thêm/xóa, gửi đồng thời hoặc cách ly giữa hai tài khoản trên SQL. Các rủi ro frontend phía dưới là kết quả đọc code, không được coi là lỗi đã tái hiện qua trình duyệt.

## 3. Dữ liệu chuẩn có thể dùng lại

### 3.1. Schema dự kiến sau migration 009

| Cột | Kiểu | Vai trò |
|---|---|---|
| `id` | INT IDENTITY | Khóa chính |
| `user_id` | INT | FK tới `dbo.users.user_id` |
| `place_id` | INT | FK tới `dbo.places.place_id` |
| `created_at` | DATETIME2(7) | Thời điểm lưu |

Migration định nghĩa unique `(user_id, place_id)`, khóa ngoại và chỉ mục theo `user_id`. Các ràng buộc này có trong file thiết kế migration, **chưa được xác nhận tồn tại trong bảng mới trên môi trường local vì bảng chưa được tạo**.

### 3.2. Thực tế tại SQL local

- `dbo.favorites`: không tồn tại.
- `dbo.user_favorites`: tồn tại, có `user_id`, `place_id`, `created_at`.
- Số dòng yêu thích cũ: 0; cặp trùng: 0; dòng mồ côi theo kiểm tra users/places: 0 tại thời điểm audit.
- Số liệu trên chỉ mô tả local, không suy ra trạng thái database của thành viên hoặc production.
- Chưa thấy lệnh migration favorites riêng trong scripts của package; `migrate:ai` không tự chạy migration 009.

Giai đoạn 2 cần có cách chạy migration rõ ràng, kiểm tra ràng buộc sau chạy, và không xóa bảng/dữ liệu cũ chỉ để làm API hoạt động.

## 4. Hợp đồng API hiện có

Các route được mount dưới `/api/favorites`. Toàn router dùng `requireAuth('USER')` và cho phép vai trò `USER`, `PARTNER`; `ADMIN` không nằm trong danh sách vai trò được phép của module này.

| Phương thức | Endpoint | Đầu vào | Đầu ra chính |
|---|---|---|---|
| GET | `/api/favorites/ids` | Danh tính từ phiên xác thực | `{ success: true, data: number[] }` |
| GET | `/api/favorites` | `type`, `page`, `limit` | Danh sách và metadata phân trang |
| POST | `/api/favorites` | `{ "place_id": 123 }` | Trả ID sau khi thao tác thành công |
| DELETE | `/api/favorites/:placeId` | ID địa điểm trên URL | Thông báo bỏ lưu |

`123` chỉ minh họa cấu trúc, không phải địa điểm để kiểm thử ghi dữ liệu.

### 4.1. Những điểm tốt nên giữ

- Backend lấy `user_id` từ xác thực, không lấy từ body.
- Body POST là schema strict, không chấp nhận trường giả như `userId`.
- Truy vấn đọc/xóa đều có điều kiện `user_id = @userId`.
- Truy vấn được tham số hóa.
- Service thêm mới kiểm tra địa điểm `ACTIVE`.
- Repository có xử lý trùng và migration có unique cặp user/place.
- DELETE có tính chất idempotent ở mức xóa bản ghi đúng chủ thể; không cần địa điểm vẫn ACTIVE mới được bỏ lưu.
- Danh sách có bộ lọc `ALL`, `RESTAURANT`, `ACCOMMODATION`, `ATTRACTION`; mặc định 12 dòng, tối đa 100 dòng/trang.

### 4.2. Điểm cần chốt trước khi Gô đọc danh sách

- `/ids` hiện trả ID đã lưu mà không join trạng thái địa điểm.
- `/` chỉ trả địa điểm `ACTIVE`.
- Hai hành vi có thể dùng cho hai mục đích khác nhau; không tự coi `/ids` là danh sách địa điểm công khai còn hợp lệ.
- DTO danh sách yêu thích chưa có đầy đủ menu, nguồn giá, tọa độ hoặc dữ kiện lập lịch. Gô phải đọc dữ liệu cần thiết từ backend theo các ID thuộc đúng tài khoản.
- Danh sách có phân trang; không gọi trang đầu rồi tuyên bố đã đọc toàn bộ danh sách.
- `place_id` và số trang được kiểm tra dương nhưng chưa giới hạn trên theo kiểu SQL INT/offset. Giai đoạn 2 cần bổ sung kiểm tra giới hạn trước truy vấn.

## 5. Giao diện và trạng thái dùng chung

`FavoritesProvider` đã nằm dưới `AuthProvider` ở root layout, bao quanh cả nội dung trang và widget chat. Có thể tái sử dụng context, không cần dựng provider riêng cho Gô.

Context hiện cung cấp `ready`, `isAuthenticated`, `isFavorite(placeId)` và `toggle(placeId)`. `toggle()` trả boolean cho biết thao tác có thành công, **không phải trạng thái đã lưu mới**.

### 5.1. Những nơi đang dùng được thành phần chung

| Vị trí | Hiện trạng theo code |
|---|---|
| Danh bạ địa điểm `PlaceDirectory` | Dùng `HeartButton` với `place_id` |
| Hero chi tiết `PlaceHero` | Dùng `HeartButton` |
| Trang ẩm thực | Dùng `HeartButton` với ID địa điểm |
| Thẻ điểm du lịch `StoryCard` | Dùng nút chung khi có `data.placeId`; nhánh dự phòng vẫn dùng trạng thái được truyền vào |
| Trang cá nhân | Có tab “Địa điểm đã lưu”, lọc loại, phân trang và nút bỏ lưu |

### 5.2. Những nơi chưa đồng bộ

| Vị trí | Hiện trạng |
|---|---|
| Trang chủ | `likedCards` trong `useState`; bấm tim chỉ đổi trạng thái của trang |
| Trang lưu trú | `likedHotels` trong `useState`; chưa dùng context chung |
| Thẻ kết quả chat toàn trang | Chưa nối `HeartButton` hoặc `useFavorites` |
| Widget chat | Chưa nối yêu thích |
| Lịch trong chat, nhóm gợi ý và bảng so sánh | Chưa nối trạng thái yêu thích |

Trang chủ và lưu trú có cả dữ liệu API lẫn các thẻ fallback. **Không lấy ID của thẻ tĩnh làm `place_id` thật.** Cần truy vết nguồn ID hoặc không cho lưu thẻ chưa có liên kết DB rõ ràng, tránh bấm yêu thích một khách sạn nhưng lại lưu một bản ghi khác trùng số.

## 6. Danh sách vấn đề và mức ưu tiên

| Mã | Ưu tiên | Phát hiện | Bằng chứng | Hướng xử lý |
|---|---|---|---|---|
| FAV-01 | Chặn triển khai | Thiếu `dbo.favorites` trong SQL local | Metadata và lỗi repository 208 đã tái hiện | Chạy migration 009 theo luồng có kiểm tra |
| FAV-02 | Cao | Tải IDs lỗi vẫn `setReady(true)` trên tập rỗng | `FavoritesContext` catch/finally | Phân biệt loading/ready/error, retry; không toggle dựa trên trạng thái chưa biết |
| FAV-03 | Cao | Khi đổi tài khoản, rollback của mutation cũ có thể cập nhật context mới | `toggle` không có owner/version guard cho phản hồi cũ | Chặn áp dụng kết quả sai tài khoản/phiên |
| FAV-04 | Cao | Nhiều nút cùng địa điểm không có khóa pending dùng chung | Pending chỉ nằm ở từng `HeartButton` | Khóa thao tác theo placeId trong context; xử lý thứ tự phản hồi |
| FAV-05 | Cao | Trang chủ/lưu trú có tim riêng và fallback ID | `likedCards`, `likedHotels`, dữ liệu tĩnh | Dùng cùng nguồn trạng thái, chỉ thao tác trên ID DB đã biết |
| FAV-06 | Cao | “Bỏ lưu” ở trang cá nhân đang dùng toggle | `FavoritePlacesTab.handleRemove` | Dùng thao tác bỏ lưu rõ ràng, không đảo thành thêm khi context sai/cũ |
| FAV-07 | Vừa | Danh sách cá nhân chưa tự tải lại khi context thay đổi từ nơi khác | Effect chỉ theo page/type/refreshKey | Có tín hiệu revision hoặc cơ chế invalidate/reload theo chủ thể |
| FAV-08 | Vừa | Dữ liệu giữa các tab trình duyệt không có cơ chế đồng bộ rõ ràng | Không thấy BroadcastChannel/focus refresh ở context | Chốt phạm vi; ưu tiên đồng bộ trong app, bổ sung focus refresh nếu cần |
| FAV-09 | Vừa | Context coi mọi user đăng nhập là được dùng, router chỉ cho USER/PARTNER | Boolean user so với danh sách role backend | Thống nhất khả năng hiển thị/thao tác theo quyền |
| FAV-10 | Vừa | ID/số trang chưa chặn đầy đủ ngưỡng SQL INT | Schema route chỉ kiểm tra dương | Chặn input quá lớn trước query |
| FAV-11 | Kiểm thử | Chưa tìm thấy suite favorites chuyên biệt được đưa vào lệnh test chuẩn | Rà package scripts và tests | Bổ sung test quyền, chống trùng, trạng thái lỗi và đồng bộ ở giai đoạn 2/7 |

FAV-03/FAV-04 là rủi ro đồng thời từ đọc code, chưa được tái hiện qua tài khoản thật trong giai đoạn này. Effect tải IDs ban đầu đã có cờ `active` để bỏ kết quả tải cũ; cần bảo vệ tương tự cho mutation, không kết luận toàn bộ cơ chế đổi tài khoản đang thiếu bảo vệ.

`FavoritePlacesTab` cũng cần kiểm tra lại vòng đời khi đổi tài khoản mà component còn được giữ lại. Không khẳng định rò dữ liệu đã xảy ra; đây là điều kiện cần test khi triển khai.

## 7. Điểm nối vào Gô

### 7.1. ID đã phù hợp cho thẻ chat

`ChatPlaceCard.placeId` trỏ tới public `dbo.places.place_id`, phù hợp khóa ngoại của yêu thích. Có thể bổ sung nút tim từ context dựa trên ID này mà không thay đổi DTO đã lưu của từng tin nhắn.

Trạng thái tim phải được đọc từ context hiện tại, không đóng băng `isFavorite` trong lịch sử chat. Khi cùng một nơi xuất hiện ở nhiều tin nhắn/thành phần, chúng cần cùng phản ánh trạng thái đã xác nhận.

### 7.2. Các vị trí cần xử lý ở giai đoạn 3

- `components/chat/page/MessageBubble.tsx`: thẻ kết quả trang chat.
- `components/chat/ChatBox.tsx`: thẻ trong widget.
- `components/chat/ResponseDetails.tsx`: nhóm nhiều nhu cầu.
- `components/chat/page/ItineraryCard.tsx`: địa điểm trong lịch.
- `components/chat/ComparisonTable.tsx`: địa điểm trong bảng so sánh.

Không đặt button tim bên trong button/link tương tác có sẵn. Nút tim phải ngăn việc bấm nhầm mở chi tiết/chỉ đường khi chỉ muốn lưu, có nhãn và `aria-pressed`, trạng thái pending/error phù hợp.

### 7.3. Những việc không nên làm

- Không tạo `ai_favorites` hoặc danh sách local riêng cho chatbot.
- Không trộn địa điểm yêu thích với `ai_user_preferences` như “thích cay”, “đi taxi”.
- Không tự suy khẩu vị lâu dài chỉ vì khách lưu một quán.
- Không đọc userId từ câu hỏi/body để truy vấn favorites.
- Không để model tự sinh hoặc tự chọn ID chưa được truy xuất theo quyền.
- Không tự lưu hoặc xóa nơi yêu thích chỉ vì một câu tư vấn nhắc tới địa điểm đó.

### 7.4. Lưu ý cho giai đoạn 4–5

Backend cần nhận biết yêu cầu rõ như “Xem nơi tôi đã thích”, lấy đúng chủ thể, xử lý khách, danh sách rỗng, phân trang và nơi không còn công khai.

`dbo.places.place_id` **khác namespace** với `dbo.itinerary_catalog_places.id`. Không gán một favorite placeId vào catalogPlaceId chỉ vì cùng là số. Luồng chuyển lịch từ chat hiện đã có chú thích về khác biệt này trong `chat.saved-plan.ts`.

Khi lập lịch từ nơi yêu thích cần tiếp tục hỏi số ngày/khách/ngân sách/giờ còn thiếu, đọc dữ liệu giá đúng nguồn và thông báo nơi chưa xếp được. Không xóa khỏi favorites chỉ vì một nơi không vừa lịch.

## 8. Phạm vi đề xuất cho giai đoạn 2

Thứ tự thực hiện sau khi người dùng yêu cầu chuyển giai đoạn:

1. Chuẩn bị lệnh migration favorites và kiểm tra dữ liệu cũ; áp dụng migration 009 trên môi trường được cấu hình.
2. Kiểm tra bảng mới, unique/FK, thêm lặp và bỏ lặp đúng tài khoản trong test có kiểm soát.
3. Chuẩn hóa trạng thái context: chủ thể, loading/error/ready, pending theo địa điểm và retry.
4. Cung cấp thao tác rõ `setFavorite(placeId, saved)` hoặc add/remove; giữ toggle để tương thích nếu phù hợp.
5. Bảo vệ phản hồi cũ khi logout/đổi tài khoản; tải lại từ server khi cần.
6. Cập nhật trang cá nhân dùng bỏ lưu rõ ràng và invalidate dữ liệu theo thay đổi.
7. Chặn input ngoài giới hạn; chốt vai trò được phép và quy tắc cho địa điểm không ACTIVE.
8. Test cơ chế chung trước khi thêm nút tim vào chat ở giai đoạn 3.

Chữ ký context ở bước 4 là đề xuất, chưa được thêm vào code trong giai đoạn 1.

## 9. Tiêu chí kiểm tra cho các giai đoạn tiếp theo

| Mã | Tình huống | Mong đợi |
|---|---|---|
| FAV-T01 | Khách gọi các endpoint | 401, không ghi dữ liệu |
| FAV-T02 | User A lưu một nơi hai lần | Chỉ một cặp user/place |
| FAV-T03 | User A bỏ nơi chỉ B đã lưu | Không ảnh hưởng B |
| FAV-T04 | Thêm nơi không ACTIVE/không tồn tại | Lỗi phù hợp, không tạo favorite |
| FAV-T05 | Tải IDs lỗi | Có error/retry; không coi là danh sách rỗng đã xác nhận |
| FAV-T06 | API thêm/xóa lỗi | Không báo thành công; UI phục hồi hoặc đồng bộ lại đúng trạng thái |
| FAV-T07 | Hai nút cùng một nơi được bấm nhanh | Không lệch trạng thái do request trùng/thứ tự phản hồi |
| FAV-T08 | A đổi sang B trong lúc mutation A còn chạy | Kết quả A không cập nhật state/toast dữ liệu của B |
| FAV-T09 | Cùng nơi ở trang chi tiết/chat/lịch | Tim phản ánh cùng nguồn trạng thái |
| FAV-T10 | Bỏ nơi cuối một trang phân trang | Số lượng/trang hợp lệ, lấy đủ dữ liệu trang còn lại |
| FAV-T11 | Thẻ fallback không có ID DB xác thực | Không lưu nhầm bản ghi khác |
| FAV-T12 | UserId giả trong body | Không được dùng để truy cập danh sách người khác |
| FAV-T13 | ID vượt giới hạn, page/offset quá lớn | 400, không đẩy lỗi kiểu dữ liệu xuống SQL |
| FAV-T14 | Địa điểm đã lưu bị ẩn | Không được Gô trình bày như địa điểm công khai đang hợp lệ |
| FAV-T15 | Lập lịch từ favorites nhiều hơn một trang | Có giới hạn/phân trang rõ; không âm thầm bỏ các nơi còn lại |
| FAV-T16 | Favorite public ID trùng số catalog ID khác | Không ánh xạ nhầm địa điểm |

Hiện mới FAV-T01 được kiểm tra qua router thực thi, kèm xác nhận thiếu bảng bằng SQL đọc. Các dòng còn lại là tiêu chí dự kiến, không gắn nhãn đã đạt.

## 10. Tham chiếu mã nguồn

- [Migration chuẩn](../../database/migrations/009_create_favorites.sql).
- [Router và quyền](../../backend/src/modules/favorites/favorites.routes.ts).
- [Service](../../backend/src/modules/favorites/favorites.service.ts).
- [Repository](../../backend/src/modules/favorites/favorites.repository.ts).
- [Client API](../../frontend/lib/api/favorites.ts).
- [Context](../../frontend/contexts/FavoritesContext.tsx).
- [Nút tim](../../frontend/components/HeartButton.tsx).
- [Trang yêu thích cá nhân](../../frontend/components/profile/FavoritePlacesTab.tsx).
- [Trang chủ](../../frontend/app/(main)/page.tsx).
- [Trang lưu trú](../../frontend/app/(main)/luutru/page.tsx).
- [Chuyển lịch chat](../../backend/src/modules/chat/chat.saved-plan.ts).
- [Theo dõi 7 giai đoạn](TIEN-DO.md).
