# 🌴 DaNangGo – Website gợi ý Lưu trú · Ẩm thực · Du lịch Đà Nẵng

Các tiện ích AI A2–A9 đã được nối vào tìm kiếm, lịch trình, chi tiết địa điểm, dashboard đối tác và quản trị. Khi lấy mã mới, chạy `npm run migrate:ai` trong `backend` để chuẩn bị bảng phản hồi và embedding. Xem [hướng dẫn tự kiểm tra AI](docs/AI-SELF-TEST.md) cho từng luồng và cấu hình vận hành `/admin/ai`.

Chat AI Gô: widget và `/chat` dùng chung `ChatBox`, cùng lịch sử và thẻ địa điểm. API `POST /api/chat/message?stream=1` trả SSE (status → candidates từ SQL → result đã kiểm tra schema/ID); bỏ query `stream` vẫn nhận JSON như cũ. Chữ chạy bắt đầu sau khi kiểm tra câu trả lời, không hiển thị JSON/token Gemini chưa xác thực.

Phiên chat: người đăng nhập chỉ được đọc/ghi `chat_sessions` thuộc user đã xác thực. Khách dùng cookie HttpOnly và lịch sử tạm trong bộ nhớ (hết hạn sau 1 giờ không hoạt động, tối đa 500 phiên, 12 tin ngữ cảnh và 100 tin hiển thị/phiên; có giới hạn bộ nhớ toàn kho), không gán vào tài khoản khác. Khởi động lại backend sẽ hết hạn phiên khách; giao diện báo tạo hội thoại mới. Khi chạy nhiều backend cần chuyển kho phiên khách và rate limit sang kho dùng chung. Cache trình duyệt tách theo user; đổi tài khoản sẽ hủy request đang chạy và nạp đúng lịch sử.

Chat giới hạn 20 tin/phút/IP, một yêu cầu đang xử lý mỗi danh tính và tối đa 50 yêu cầu đồng thời. Tên, giá, địa chỉ trên thẻ lấy từ DB; lời nhắn/lý do gợi ý được dựng từ dữ liệu đã lọc. AI dùng để phân tích ý định và chọn thứ tự các ID hợp lệ, không đưa prose tự do chứa thông tin chưa xác minh ra giao diện.

Giá nhà hàng lấy MIN/MAX các món `menu_items.is_available = 1`, đơn vị đ/món; không suy ra giá một bữa ăn. Khi lọc ngân sách, địa điểm chưa có giá bị loại. Không dùng địa điểm viết sẵn khi API lỗi. Cache chỉ lưu intent hợp lệ trong 5 phút, tối đa 200 câu hỏi; mỗi lượt vẫn truy vấn SQL mới để không giữ giá cũ. Khóa Gemini nằm trong `backend/.env`, không đưa vào biến `NEXT_PUBLIC_*`.

Nền tảng website tổng hợp giúp khách du lịch và người dân tại Đà Nẵng dễ dàng tìm **chỗ ở**, **quán ăn ngon** và **điểm du lịch**, đồng thời hỗ trợ chỉ đường thông minh, lên lịch trình/chọn món theo ngân sách, chương trình khách hàng VIP và kết nối dữ liệu khảo sát với cơ quan quản lý du lịch địa phương.

---

## 🎯 Mục tiêu

- Tập trung thông tin lưu trú – ẩm thực – điểm đến tại Đà Nẵng vào một nền tảng duy nhất
- Giúp khách du lịch tiết kiệm thời gian tìm kiếm và di chuyển
- Hỗ trợ khách lên kế hoạch chi tiêu hợp lý theo ngân sách thực tế
- Xây dựng hệ sinh thái dịch vụ khép kín (ăn – ở – chơi – di chuyển)
- Tạo nguồn dữ liệu khảo sát hữu ích cho công tác quản lý và phát triển du lịch địa phương

---

## 👥 Đối tượng người dùng

| Nhóm | Đặc điểm | Nhu cầu |
|------|----------|---------|
| Khách du lịch tự túc | Phượt, gia đình, nhóm bạn | Tra cứu nhanh, tiết kiệm chi phí, đi lại thuận tiện |
| Người mới đến Đà Nẵng | Chuyển đến sinh sống/làm việc | Làm quen khu vực, tìm chỗ ở dài hạn |
| Dân địa phương | Sinh sống tại Đà Nẵng | Khám phá quán ăn/địa điểm mới |
| Khách VIP | Sử dụng nhiều dịch vụ, chi tiêu cao | Ưu đãi riêng, trải nghiệm cao cấp, hỗ trợ tận tình |
| Sở Du lịch địa phương | Cơ quan quản lý | Dữ liệu khảo sát, phân tích xu hướng du lịch |

---

## ✨ Tính năng

### 🏨 Lưu trú

- Danh sách khách sạn/homestay theo khu vực (Mỹ Khê, trung tâm, Sơn Trà...)
- Lọc theo giá, đánh giá, tiện ích
- Gợi ý theo ngân sách hiện có của khách

### 🍜 Ẩm thực

- Gợi ý quán ăn theo loại món (hải sản, mì Quảng, bún chả cá...)
- Gợi ý theo khẩu vị, vị trí hiện tại (GPS)
- Gợi ý theo thời gian (sáng/trưa/tối, ngày thường/cuối tuần)
- Gợi ý theo ngân sách hiện có
- Xếp hạng phổ biến (top quán được đánh giá cao, xem nhiều)

### 🏖️ Điểm du lịch

- Danh sách điểm tham quan (Bà Nà Hills, Ngũ Hành Sơn, Cầu Rồng, Sơn Trà...)
- Mô tả, giờ mở cửa, giá vé
- Gợi ý theo loại hình (biển, núi, văn hóa, chụp ảnh)

### 🗺️ Bản đồ & chỉ đường

- Bản đồ tương tác hiển thị vị trí tất cả địa điểm
- Tìm đường đi ngắn nhất đến một địa điểm
- So sánh thời gian di chuyển: đi bộ / xe máy / ô tô / taxi
- Ghép nhiều điểm thành lộ trình tối ưu (bài toán TSP)
- Cảnh báo giờ cao điểm/kẹt xe

### ⭐ Đánh giá & lịch trình

- Đánh giá & review (sao + bình luận)
- Gợi ý lịch trình tự động 1–3 ngày dựa trên sở thích
- **Lên lịch trình theo ngân sách:** nhập số tiền đang có, hệ thống đề xuất lịch trình phù hợp (điểm chơi + quán ăn + di chuyển) sao cho tổng chi phí không vượt ngân sách
- **Chọn món ăn theo ngân sách:** nhập số tiền hiện có, hệ thống gợi ý món/quán ăn phù hợp khoảng giá
- Cảnh báo vượt ngân sách và gợi ý phương án thay thế rẻ hơn

### 💎 Hạng khách VIP

- Tích điểm theo lượt sử dụng dịch vụ
- Ưu đãi độc quyền tại đối tác liên kết (nhà hàng, khách sạn)
- Trợ lý cá nhân hóa (concierge ảo), hỗ trợ 24/7
- Ưu tiên đặt chỗ dịp lễ/sự kiện đông khách
- Combo trọn gói (lưu trú + ăn uống + tour), giá tốt hơn mua lẻ
- Phân hạng thành viên: Bạc – Vàng – Kim Cương theo mức chi tiêu

### 📝 Khảo sát khách hàng

- Form khảo sát sau khi sử dụng dịch vụ (quán ăn, khách sạn, điểm du lịch)
- Gửi tự động qua email/thông báo sau chuyến đi
- Câu hỏi dạng thang điểm + góp ý tự do

### 🏛️ API cho Sở Du lịch địa phương

- Chuẩn hóa dữ liệu khảo sát (ẩn danh, bảo mật thông tin cá nhân)
- API truy xuất số liệu: mức độ hài lòng, xu hướng khách theo khu vực/mùa
- Xuất báo cáo dạng biểu đồ/thống kê định kỳ (tuần/tháng/quý)
- Phân quyền truy cập riêng cho đối tác nhà nước

---

## 🧭 Cấu trúc trang web

- Trang chủ (nổi bật theo mùa/sự kiện)
- Trang Lưu trú / Ẩm thực / Điểm du lịch
- Trang chi tiết địa điểm (ảnh, mô tả, bản đồ, giờ, giá, review)
- Trang lên lịch trình theo ngân sách
- Trang thành viên VIP
- Trang khảo sát khách hàng
- Trang dành cho đối tác Sở Du lịch (API/báo cáo)

---

## 🛠️ Công nghệ sử dụng

| Thành phần | Công nghệ |
|------------|-----------|
| Frontend | Next.js (React), TailwindCSS |
| Backend | Node.js + Express |
| Database | SQL Server (mssql) |

---

## 🚀 Cài đặt & chạy thử

### 1. Clone dự án

```bash
git clone https://github.com/VanTuTran218/DaNangGo.git
cd DaNangGo
```

### 2. Cài thư viện

```bash
npm install
```

### 3. Chạy môi trường phát triển

```bash
npm run dev
```

Mở trình duyệt tại [http://localhost:3000](http://localhost:3000).

> **Lưu ý:** Tạo file `.env.local` để cấu hình biến môi trường (thông tin kết nối database, API key...). Không đưa file này lên Git.

### Bản đồ và chỉ đường trong web (`/bando`)

- Địa điểm lấy từ `GET /api/places`, tải đủ các trang (50 bản ghi/trang), giữ ID thật và chỉ ghim địa điểm công khai có tọa độ hợp lệ. Không dùng danh sách mẫu khi API lỗi; giao diện có trạng thái tải, thông báo lỗi và nút thử lại. Ảnh trong `public/` dùng frontend, ảnh `/uploads/` dùng backend.
- Đặt `NEXT_PUBLIC_API_URL` trong `frontend/.env.local` trỏ đến backend đang chạy. Cần SQL Server hoạt động trước khi khởi động backend. Những địa điểm chưa có tọa độ sẽ được đếm riêng; bổ sung tọa độ trong quản lý địa điểm để hiển thị lên bản đồ.
- **Vị trí tôi**: xin quyền GPS sau khi bấm; bán kính 2/5/10 km tính theo vị trí này, hoặc tâm Đà Nẵng khi chưa định vị. Cần HTTPS khi triển khai (localhost vẫn dùng được).
- Chọn ghim hoặc địa điểm trong danh sách, rồi bấm **Chỉ đường**: OSRM tính tuyến ô tô, quãng đường theo đường giao thông và thời gian dự kiến. Có nút đóng tuyến, thử lại và mở Google Maps. Đây là tuyến tham khảo, chưa có hướng dẫn rẽ từng chặng hoặc dữ liệu giao thông trực tiếp.
- Bộ lọc bán kính dùng Haversine (đường chim bay); vòng tròn trên bản đồ dùng khoảng cách theo mét, không dùng kích thước pixel minh họa.
- **Lớp bản đồ** chuyển giữa đường phố và ảnh vệ tinh Esri. Bản đồ đường phố ưu tiên CARTO Voyager khi có khóa; nếu chưa cấu hình khóa hoặc CARTO báo lỗi tải tile, dùng Esri World Street Map dự phòng.

CARTO hiện yêu cầu API key cho raster tiles ([hướng dẫn chính thức](https://www.carto.com/basemaps/apikey/index.html)). Để bật Voyager, thêm vào `frontend/.env.local` rồi build lại:

```dotenv
NEXT_PUBLIC_CARTO_API_KEY=your_carto_basemap_key
```

Đây là khóa dùng trên trình duyệt; cấu hình giới hạn tên miền tại CARTO. Không dùng khóa quản trị hoặc khóa bí mật cho biến `NEXT_PUBLIC_*`. Chưa có khóa vẫn có thể dùng bản đồ đường phố dự phòng và lớp vệ tinh.

Kiểm tra frontend từ thư mục `frontend/`:

```bash
npm test      # Node.js 22.18+ hoặc 24+, không cần cài thêm test runner
npm run build
```

---

## 🔮 Hướng phát triển

- Đặt phòng/đặt bàn trực tiếp qua website
- AI gợi ý cá nhân hóa chuyên sâu
- Đa ngôn ngữ
- Ứng dụng di động (iOS/Android)

---

## 👤 Tác giả

Dự án thực hiện bởi:

- Trần Văn Tú
- Trần Văn Tuấn
- Trần Văn Long
- Trần Văn Tin
- Trần Văn Phúc


## Bổ sung công cụ AI trong trang `/chat`

- Danh sách hội thoại thật theo tài khoản hoặc cookie khách, nhóm Hôm nay/Trước đó theo giờ Việt Nam. Tối đa 50 hội thoại, 200 tin gần nhất cho tài khoản; khách giữ tối đa 100 tin trong RAM và hết hạn khi backend khởi động lại.
- Đánh giá hữu ích/chưa hữu ích, bấm lại để bỏ đánh giá. API kiểm tra chủ sở hữu và chỉ nhận tin AI.
- Nút “Quanh vị trí tôi” xin GPS khi bấm; bán kính 2/5/10 km. Gửi vị trí trong yêu cầu tìm quanh đây, không lưu tọa độ vào lịch sử/localStorage và không gửi tọa độ sang Gemini. Khoảng cách hiển thị là đường chim bay.
- Khẩu vị Cay/Mặn/Béo/Ngọt/Thanh đạm lọc theo nhãn món đang bán. Chưa xác minh thành phần/dị ứng/ăn chay; người dùng cần xác nhận với quán.
- Mẹo đổi sau 12 giây khi trang hiển thị, có nút dừng và tự tắt chuyển khi hệ điều hành yêu cầu giảm chuyển động.
- Dự trù ăn uống, di chuyển và dự phòng do người dùng nhập. Không thay đổi `knownSubtotal`; khoản chưa có giá chưa được tính.
- “Lưu lịch trình này” lưu chính bản Gô tạo vào luồng quản lý `/lich-trinh/:id`; yêu cầu đăng nhập và đủ ngày, số khách, ngân sách. Bấm lưu lại không tạo bản trùng trong một tiến trình. Lưu bản nháp và liên kết tin nhắn trong cùng transaction. Chỉnh sửa bản đã lưu qua trang Lịch trình; đặt dịch vụ qua trang chi tiết/luồng hiện có, không tự đặt hoặc thanh toán.
- Khách và tài khoản có lịch sử riêng. Để lưu lâu dài, đăng nhập trước khi tạo lịch trình; không tự gộp cuộc trò chuyện khách vào tài khoản.

Chạy `npm run migrate:ai` trong `backend` trước khi khởi động backend mới. Runner bổ sung `chat_messages.dto_json` và migration `013_chat_planner_storage.sql` và `014_planner_catalog_preferences.sql`. Schema `planner` giữ riêng cấu trúc bản nháp web khi database dùng schema lịch trình cũ (`itinerary_id`); database đã có cấu trúc web dùng view trỏ tới bảng hiện có. Không sửa/xóa bảng cũ, không nạp dữ liệu mẫu. Catalog riêng chưa có dữ liệu sẽ trả danh sách trống.

Kiểm tra SQL local không lưu dữ liệu thử: `npx tsx src/scripts/check-chat-tools.ts` trong `backend` (thực hiện rồi rollback transaction). Khi chạy nhiều backend cần kho phiên/rate limit/khóa thao tác dùng chung.


## Khảo sát người dùng phục vụ AI

Đã nối biểu mẫu đầy đủ/nhanh và quản trị khảo sát với SQL. Chạy `npm run migrate:surveys` trong backend trước khi dùng API mới. Hướng dẫn API, dữ liệu ẩn danh, thống kê và kiểm tra: [docs/SURVEYS.md](docs/SURVEYS.md). Không nạp phản hồi mẫu vào dữ liệu thống kê thật.
