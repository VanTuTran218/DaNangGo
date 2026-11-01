# Hướng dẫn chức năng duyệt tài khoản đối tác — DaNangGo

Tài liệu này mô tả phần xác thực và xét duyệt Partner vừa triển khai, các file liên quan, dữ liệu được lưu trong SQL Server và cách chạy/kiểm tra. Trang Admin đối tác hiện đọc và ghi dữ liệu thật qua backend; không dùng mock cho chức năng này.

## 1. Trọng tâm đã làm

1. Khi khách đăng ký với vai trò **Đối tác**, backend tạo tài khoản ở trạng thái chưa hoạt động và tạo hồ sơ trong `dbo.partner_profiles` ở trạng thái `PENDING`. Chưa cấp session/cookie đăng nhập cho Partner.
2. Admin đã đăng nhập có thể xem danh sách hồ sơ, lọc trạng thái, xem chi tiết, duyệt, từ chối kèm lý do, khóa và mở khóa tài khoản.
3. Khi Admin duyệt, hồ sơ chuyển sang `APPROVED`; tài khoản được hoạt động nếu Admin chưa khóa nó. Khi từ chối, lý do và người/thời điểm xét duyệt được lưu, tài khoản bị khóa và session refresh hiện có bị thu hồi.
4. Khi Partner đăng nhập hoặc làm mới session, backend kiểm tra trạng thái hiện tại từ database. Hồ sơ chưa duyệt, bị từ chối, tài khoản bị khóa hoặc không hoạt động sẽ không được cấp quyền đăng nhập.
5. API tạo địa điểm `POST /api/places` yêu cầu tài khoản là Partner đã duyệt và đang hoạt động. Backend kiểm tra quyền từ database ở mỗi request, không tin trạng thái do giao diện gửi.

## 2. Luồng hoạt động

```text
Đăng ký vai trò Đối tác
        │
        ├─ SQL Server tạo users + partner_profiles (PENDING)
        └─ Không cấp cookie/session; giao diện báo đang chờ Admin duyệt
                         │
                         ▼
Admin xem /admin/doi-tac ──► Duyệt hoặc từ chối + lý do
                         │
             ┌───────────┴─────────────┐
             ▼                         ▼
         APPROVED                  REJECTED
   users.status ACTIVE       users bị LOCKED, lưu lý do
             │
             ▼
Partner đăng nhập được; API tạo địa điểm được phép khi còn ACTIVE và không bị Admin khóa
```

Trạng thái xét duyệt hồ sơ (`PENDING`, `APPROVED`, `REJECTED`) tách biệt với trạng thái khóa tài khoản (`admin_locked`). Tab “Bị khóa” hiển thị các hồ sơ đã duyệt nhưng đang bị Admin khóa.

## 3. API đã triển khai

Các API Admin cần cookie phiên Admin hợp lệ:

| Method và đường dẫn | Chức năng |
|---|---|
| `GET /api/admin/partners?status=PENDING` | Danh sách hồ sơ. Hỗ trợ `PENDING`, `APPROVED`, `REJECTED`, `ALL`; bỏ `status` để lấy tất cả. |
| `PATCH /api/admin/partners/:id/approval` | Duyệt với `{ "status": "APPROVED" }`; từ chối với `{ "status": "REJECTED", "reason": "Lý do cụ thể" }`. |
| `PATCH /api/admin/partners/:id/lock` | Khóa/mở khóa với `{ "locked": true }` hoặc `{ "locked": false }`. |

Chỉ hồ sơ `PENDING` được xét duyệt. Từ chối bắt buộc có lý do sau khi trim, tối đa 500 ký tự. Cập nhật trạng thái xét duyệt dùng transaction và khóa bản ghi để hai Admin không thể cùng xử lý một hồ sơ chờ duyệt. Backend lấy ID Admin từ session đã xác thực.

API đăng ký đối tác nằm tại `POST /api/auth/register`. Backend trả `requiresApproval: true` và không cấp cookie đăng nhập cho Partner mới. API tạo địa điểm `POST /api/places` được bảo vệ bằng xác thực, role Partner và trạng thái duyệt hiện tại.

## 4. Các file đã tạo hoặc chỉnh sửa

### Backend

| File | Vai trò |
|---|---|
| `backend/src/modules/admin/partners.routes.ts` *(mới)* | Khai báo ba API Admin; xác thực Admin, kiểm tra tham số, query và body; đóng gói response. |
| `backend/src/modules/partners/partners.service.ts` *(mới)* | Xử lý quy tắc nghiệp vụ: trạng thái lọc, điều kiện duyệt/từ chối, lý do, lỗi không tìm thấy/đã xử lý và gọi repository. |
| `backend/src/modules/partners/partners.repository.ts` *(mới)* | Toàn bộ truy vấn SQL Server cho danh sách hồ sơ, xét duyệt, khóa/mở khóa và tìm hồ sơ Partner đã duyệt. Có transaction/khóa bản ghi khi xét duyệt. |
| `backend/src/middleware/partner-approval.middleware.ts` *(mới)* | Đọc trạng thái Partner hiện thời từ database, chỉ cho phép Partner đã duyệt, ACTIVE và không bị Admin khóa tiếp tục. |
| `backend/src/index.ts` *(sửa)* | Đăng ký router mới tại `/api/admin/partners`. |
| `backend/src/modules/auth/auth.routes.ts` *(sửa)* | Nhận đăng ký Partner, trả `requiresApproval`, không tạo session cho hồ sơ chờ duyệt. |
| `backend/src/modules/auth/auth.service.ts` *(sửa)* | Đăng ký Partner ở trạng thái chờ; từ chối login/refresh khi chưa duyệt, bị từ chối hoặc bị khóa. |
| `backend/src/modules/auth/auth.repository.ts` *(sửa)* | Đọc trạng thái hồ sơ Partner cùng user; tạo user và hồ sơ Partner trong cùng luồng database; hỗ trợ cập nhật trạng thái và thu hồi refresh token. |
| `backend/src/modules/places/places.routes.ts` *(sửa)* | Chặn `POST /api/places` nếu người gửi không phải Partner đã được duyệt. |
| `backend/src/modules/places/places.service.ts` *(sửa)* | Tạo địa điểm bằng câu SQL parameterized và gắn địa điểm với hồ sơ Partner sở hữu. |

### Frontend

| File | Vai trò |
|---|---|
| `frontend/app/admin/(dashboard)/doi-tac/page.tsx` *(sửa)* | Hiển thị dữ liệu API thật; lọc trạng thái, xem thông tin hồ sơ, duyệt, từ chối, khóa và mở khóa; hiển thị loading/lỗi và cập nhật danh sách sau thao tác. |
| `frontend/lib/api/admin.ts` *(sửa)* | Chuyển riêng các hàm danh sách/xét duyệt/khóa Partner từ mock sang `GET`/`PATCH` API thật. Các chức năng Admin khác trong file chưa được chuyển đổi. |
| `frontend/components/auth/RegisterForm.tsx` *(sửa)* | Hiển thị thông báo chờ duyệt sau đăng ký Partner; không đưa Partner pending vào AuthContext hoặc tự điều hướng như tài khoản đã đăng nhập. |
| `frontend/lib/api/auth.ts` *(sửa)* | Truyền `requiresApproval` từ response backend đến form; bỏ tài khoản đăng nhập Partner demo hardcode để mọi lần login đều qua backend. |
| `frontend/types/admin.ts` *(sửa)* | Bổ sung kiểu dữ liệu hồ sơ thật, các trường nullable và trạng thái khóa riêng với trạng thái duyệt. |
| `frontend/types/user.ts` *(sửa)* | Bổ sung `requiresApproval` trong kiểu response Auth. |

### Database

| File | Vai trò |
|---|---|
| `database/migrations/004_partner_account_controls.sql` *(mới)* | Bổ sung `users.admin_locked` và `partner_profiles.rejection_reason` nếu thiếu. Migration phải chạy thủ công trong đúng database; không bị backend tự chạy. Người vận hành đã chạy migration này theo xác nhận trong hội thoại. |

Schema hồ sơ, các cột xét duyệt như `approval_status`, `approved_by`, `approved_at` và bảng `partner_profiles` được dùng theo schema migration hiện có; migration 004 không tạo bảng hồ sơ thứ hai.

## 5. Trang Admin đang lấy dữ liệu thật

Mở `http://localhost:3000/admin/doi-tac` sau khi đăng nhập Admin. Frontend gọi backend tại `http://localhost:5000` (hoặc URL cấu hình qua `NEXT_PUBLIC_API_URL`). Backend truy vấn `dbo.partner_profiles`, kết hợp `dbo.users` và user Admin xét duyệt để trả thông tin hồ sơ. Response không trả password/hash/token.

Nếu trang không có hồ sơ, hãy kiểm tra dữ liệu thật trong SSMS:

```sql
USE DaNangGo;
GO

SELECT
    pp.partner_id,
    pp.user_id,
    u.full_name,
    u.email,
    pp.business_name,
    pp.approval_status,
    pp.created_at
FROM dbo.partner_profiles AS pp
INNER JOIN dbo.users AS u
    ON u.user_id = pp.user_id
ORDER BY pp.created_at ASC;
```

Truy vấn này chỉ đọc dữ liệu. Nếu không có dòng, SQL Server chưa có hồ sơ để hiển thị; không nên tạo dữ liệu giả. Hãy đăng ký tài khoản loại **Đối tác** bằng phiên bản ứng dụng đã cập nhật, sau đó kiểm tra lại.

## 6. Cách chạy và kiểm tra

Mở hai terminal tại thư mục dự án:

```powershell
cd backend
npm run dev
```

```powershell
cd frontend
npm run dev
```

Kiểm tra theo thứ tự:

1. Đăng ký tài khoản mới, chọn **Đối tác**, nhập thông tin doanh nghiệp. Giao diện phải báo chờ duyệt và không tự đăng nhập.
2. Đăng nhập Admin, vào `/admin/doi-tac`, chọn tab “Chờ duyệt”. Hồ sơ mới phải xuất hiện.
3. Thử từ chối khi lý do trống rồi nhập lý do hợp lệ; hoặc duyệt hồ sơ. Danh sách được tải lại sau khi thành công.
4. Partner pending/rejected không thể đăng nhập; sau khi được duyệt, Partner có thể đăng nhập.
5. Admin khóa Partner đã duyệt thì login/session và thao tác được bảo vệ bị từ chối. Mở khóa cho phép tài khoản hoạt động lại nếu hồ sơ vẫn `APPROVED`.
6. Gọi `POST /api/places` bằng Partner đã duyệt để kiểm tra quyền tạo địa điểm.

Lệnh build đã chạy thành công trong lượt triển khai:

```powershell
cd backend
npm run build
```

```powershell
cd frontend
npx tsc --noEmit
npm run build
```

`git diff --check` cũng chạy sạch. Chưa chạy test tự động hoặc kiểm thử tích hợp trực tiếp với SQL Server trong lượt này.

## 7. Phạm vi và giới hạn cần biết

- Backend hiện có route tạo địa điểm `POST /api/places`; middleware duyệt mới được áp dụng trực tiếp cho thao tác này. Những API Partner sửa/xóa địa điểm, quản lý booking, đánh giá hoặc hồ sơ chưa được nối và bảo vệ đầy đủ bằng backend trong phần thay đổi này.
- Các trang/hàm Admin khác ngoài danh sách và thao tác Partner vẫn có thể dùng mock. Chỉ luồng Admin đối tác được nối thật ở `frontend/lib/api/admin.ts`.
- Nếu tài khoản Partner cũ được tạo trước khi luồng đăng ký này ghi `partner_profiles`, hồ sơ đó không tự xuất hiện. Cần đối chiếu các dòng thực trong SQL Server; không tự suy ra tên doanh nghiệp hoặc tạo hồ sơ thay người dùng.
- Việc khóa bằng `admin_locked` được lưu riêng với trạng thái duyệt và thu hồi refresh token đang hoạt động. Cột này giúp phân biệt khóa của Admin với khóa tạm thời do đăng nhập sai.


---

# Hướng dẫn chức năng Quản lý Gói hoạt động Đối tác & Doanh thu đăng ký — DaNangGo

Tài liệu này mô tả chi tiết chức năng đăng ký gói hoạt động trả phí dành cho **Đối tác (PARTNER)**, quản lý thời hạn sử dụng theo lịch, gia hạn gói và theo dõi thống kê **Doanh thu phí đăng ký gói dành cho Quản trị viên (ADMIN)**. 

Toàn bộ nghiệp vụ đọc/ghi dữ liệu thực tế từ **Microsoft SQL Server**, không dùng mock data, không dùng `localStorage`, không dùng dữ liệu giả lập.

## 8. Trọng tâm và Quy tắc nghiệp vụ

1. **Ranh giới nghiệp vụ (Scope Boundaries)**:
   - **CHỈ** quản lý phí đăng ký nền tảng định kỳ của đối tác (1 tháng, 6 tháng, 1 năm).
   - **TUYỆT ĐỐI KHÔNG** xây dựng hay can thiệp thanh toán đơn đặt phòng, tour, ăn uống hay doanh thu bán dịch vụ của đối tác.
2. **Bảng giá và snapshot lịch sử**:
   - Gói 1 tháng: **500.000 VNĐ** (thời hạn 1 tháng).
   - Gói 6 tháng: **2.500.000 VNĐ** (thời hạn 6 tháng - tiết kiệm 500.000 VNĐ).
   - Gói 1 năm: **4.500.000 VNĐ** (thời hạn 12 tháng - tiết kiệm 1.500.000 VNĐ).
   - Giá được lưu dạng **số nguyên VND** (`INT`), không dùng số thực floating-point.
   - **Giá và thời hạn được đọc trực tiếp từ SQL Server**, backend không nhận giá do frontend gửi lên.
   - Lưu **snapshot** tên gói, thời hạn và giá tại thời điểm đăng ký (`package_name`, `duration_months`, `price`) để bảo toàn lịch sử giao dịch và doanh thu khi giá gói gốc thay đổi trong tương lai.
3. **Mã giao dịch duy nhất**:
   - Mỗi yêu cầu đăng ký sinh một mã giao dịch duy nhất có định dạng: `DNG-SUB-[TIMESTAMP]-[RANDOM]` (ví dụ: `DNG-SUB-MM2A8Z-4K9P`).
4. **Quy trình thanh toán & đối soát chuyển khoản thủ công**:
   - Đối tác chuyển khoản theo thông tin ngân hàng hiển thị (MB Bank, STK: `999988886868`, Cú pháp: `DANANGGO [MÃ_GIAO_DỊCH]`).
   - Đối tác gửi mã giao dịch ngân hàng / mã tham chiếu (`payment_reference`) để Admin đối soát.
   - Chỉ Admin mới có quyền xác nhận thanh toán hợp lệ hoặc từ chối kèm lý do.
5. **Cơ chế gia hạn và tính toán thời hạn theo lịch**:
   - Nếu gói cũ **đang còn hạn**: Ngày hết hạn mới được **nối tiếp** từ ngày hết hạn của gói hiện tại (`DATEADD(month, duration_months, current_end_date)`).
   - Nếu gói cũ **đã hết hạn hoặc đăng ký lần đầu**: Ngày bắt đầu tính từ thời điểm Admin duyệt, ngày kết thúc là `DATEADD(month, duration_months, GETDATE())`.
   - Xử lý chính xác ngày cuối tháng theo chuẩn lịch SQL Server (ví dụ ngày 31/01 cộng 1 tháng sẽ là ngày 28/02).
6. **Chống duyệt trùng lặp (Anti Double-Approval & Idempotency)**:
   - Thao tác duyệt của Admin dùng transaction với mức cô lập `SERIALIZABLE` và khóa hàng `WITH (UPDLOCK)`.
   - Chỉ cho phép duyệt khi trạng thái là `PENDING`. Thao tác lặp lại (double-click hoặc race condition) sẽ bị chặn ngay với mã lỗi 409 Conflict.
7. **Kiểm soát quyền vận hành cơ sở (Middleware Protection)**:
   - Middleware `requireActiveSubscription` kiểm tra trực tiếp từ SQL Server: đối tác chưa có gói hoặc gói đã hết hạn sẽ bị chặn tạo cơ sở dịch vụ mới (`POST /api/places`).
   - Giao diện Dashboard và trang Tạo cơ sở hiển thị banner cảnh báo thông minh khi chưa có gói hoặc khi gói sắp hết hạn ($\le 7$ ngày).
8. **Dashboard Doanh thu Admin**:
   - 4 thẻ KPI: Tổng doanh thu (VNĐ), Giao dịch đã duyệt, Giao dịch chờ xử lý, Giao dịch bị từ chối.
   - **Doanh thu CHỈ tính từ các giao dịch có `payment_status = 'PAID'`**. Tuyệt đối không tính các giao dịch `PENDING` hoặc `REJECTED`.
   - Phân bổ doanh thu theo từng gói đăng ký và biểu đồ doanh thu theo ngày/tháng.
   - Nút xuất file CSV tích hợp tiền tố **UTF-8 BOM** (`\uFEFF`) để mở bằng Excel tiếng Việt không bị lỗi font.

---

## 9. Luồng hoạt động gói đăng ký

```text
Đối tác xem /partner/goi-dich-vu (Bảng giá từ SQL Server)
                 │
                 ▼
       Chọn gói & Đăng ký
                 │
                 ├─ SQL Server tạo partner_subscriptions:
                 │  - transaction_code: DNG-SUB-... (Duy nhất)
                 │  - snapshot: package_name, duration_months, price
                 │  - subscription_status: PENDING
                 │  - payment_status: PENDING
                 │
                 ▼
Đối tác chuyển khoản (MB Bank 999988886868)
& Gửi mã tham chiếu ngân hàng (paymentReference)
                 │
                 ▼
Admin kiểm tra /admin/doanh-thu-goi (Tab "Duyệt thanh toán")
                 │
        ┌────────┴────────────────────────┐
        ▼                                 ▼
   [XÁC NHẬN]                         [TỪ CHỐI]
(SERIALIZABLE + UPDLOCK)         (Bắt buộc nhập lý do)
        │                                 │
        ├─ payment_status: PAID           ├─ payment_status: REJECTED
        ├─ subscription_status: ACTIVE    ├─ subscription_status: REJECTED
        ├─ Tính thời hạn (Nối tiếp / Mới) └─ Ghi log lý do & Admin từ chối
        ├─ confirmed_by, confirmed_at
        ├─ Ghi nhật ký status_logs
        └─ CỘNG VÀO DOANH THU ADMIN
                 │
                 ▼
Đối tác được cấp quyền tạo cơ sở mới (POST /api/places)
Đếm ngược ngày hết hạn; Cảnh báo trước 7 ngày khi sắp hết hạn
```

---

## 10. Danh sách API đã triển khai

### API dành cho Đối tác (Yêu cầu Cookie Partner đã duyệt):

| Method và Endpoint | Chức năng |
|---|---|
| `GET /api/subscriptions/packages` | Lấy danh sách gói giá đang hoạt động (Public / Partner). |
| `GET /api/subscriptions/current` | Lấy gói hiện tại của đối tác, số ngày còn lại, cờ `isExpiringSoon` ($\le 7$ ngày). |
| `GET /api/subscriptions/my-subscriptions` | Xem lịch sử các lần đăng ký gói của chính đối tác. |
| `POST /api/subscriptions/register` | Đăng ký gói (body: `{ "packageId": number, "isRenewal"?: boolean }`). Backend tự đọc giá từ SQL Server. |
| `POST /api/subscriptions/:id/payment-proof` | Gửi mã giao dịch ngân hàng / ghi chú đối soát (body: `{ "paymentReference": string, "paymentProofNote"?: string }`). |

### API dành cho Admin (Yêu cầu Cookie Admin):

| Method và Endpoint | Chức năng |
|---|---|
| `GET /api/admin/subscriptions/packages` | Xem danh sách tất cả các gói đăng ký kèm trạng thái kích hoạt. |
| `PATCH /api/admin/subscriptions/packages/:id` | Bật/tắt trạng thái kinh doanh của gói (`isActive: boolean`). |
| `GET /api/admin/subscriptions/revenue-stats` | Thống kê doanh thu: tổng thu, số lượng theo trạng thái, nhóm theo gói, nhóm theo ngày/tháng. |
| `GET /api/admin/subscriptions/export-csv` | Xuất file báo cáo giao dịch CSV chuẩn UTF-8 BOM cho Excel. |
| `GET /api/admin/subscriptions` | Danh sách đăng ký có lọc (`status`, `packageId`, `search`, `startDate`, `endDate`). |
| `GET /api/admin/subscriptions/:id` | Xem chi tiết giao dịch đăng ký gói. |
| `PATCH /api/admin/subscriptions/:id/confirm` | Xác nhận thanh toán hợp lệ (chống double-approval, kích hoạt gói, nối tiếp thời hạn). |
| `PATCH /api/admin/subscriptions/:id/reject` | Từ chối thanh toán (body: `{ "reason": string }`). |

---

## 11. Các file đã tạo hoặc chỉnh sửa

### Database
| File | Vai trò |
|---|---|
| `database/migrations/005_partner_subscriptions.sql` *(mới)* | Script SQL Server idempotent tạo các bảng `dbo.subscription_packages` (khởi tạo 3 gói), `dbo.partner_subscriptions`, `dbo.subscription_status_logs` và 3 chỉ mục tối ưu truy vấn. |

### Backend
| File | Vai trò |
|---|---|
| `backend/src/modules/subscriptions/subscriptions.repository.ts` *(mới)* | Tầng truy vấn SQL Server: lấy danh mục gói, tạo đơn đăng ký, gửi thông tin đối soát, transaction duyệt thanh toán `SERIALIZABLE + UPDLOCK` chống click trùng, tự động nối hạn, thống kê doanh thu nghiêm ngặt chỉ từ `PAID`. |
| `backend/src/modules/subscriptions/subscriptions.service.ts` *(mới)* | Tầng xử lý nghiệp vụ: sinh mã giao dịch duy nhất, tính số ngày còn lại, snapshot giá, định dạng ngày tháng ISO, xuất CSV kèm UTF-8 BOM. |
| `backend/src/modules/subscriptions/subscriptions.routes.ts` *(mới)* | Router API phía Đối tác: xem gói, đăng ký, gửi mã ngân hàng, xem lịch sử và gói hiện tại. |
| `backend/src/modules/admin/subscriptions.routes.ts` *(mới)* | Router API phía Admin: thống kê doanh thu, quản lý gói, duyệt/từ chối thanh toán, xuất báo cáo CSV. |
| `backend/src/middleware/subscription.middleware.ts` *(mới)* | Middleware `requireActiveSubscription` truy vấn trực tiếp SQL Server kiểm tra gói còn hạn. |
| `backend/src/modules/places/places.routes.ts` *(sửa)* | Áp dụng `requireActiveSubscription` bảo vệ `POST /api/places` (chặn đăng cơ sở khi chưa có gói hoặc gói hết hạn). |
| `backend/src/index.ts` *(sửa)* | Đăng ký route `/api/subscriptions` và `/api/admin/subscriptions`. |
| `backend/tests/subscriptions.test.ts` *(mới)* | Bộ kiểm thử tự động gồm 18 ca test cho: tính toán ngày hết hạn, snapshot giá, chống duyệt trùng, ranh giới doanh thu, xuất CSV UTF-8 BOM. |
| `backend/package.json` *(sửa)* | Bổ sung lệnh chạy test `npm test`. |
| `backend/tsconfig.json` *(sửa)* | Cấu hình include/exclude chuẩn xác cho build TypeScript. |

### Frontend
| File | Vai trò |
|---|---|
| `frontend/types/subscription.ts` *(mới)* | Khai báo kiểu TypeScript: `SubscriptionPackage`, `PartnerSubscriptionItem`, `RevenueStats`, `BankTransferInfo`. |
| `frontend/lib/api/subscription.ts` *(mới)* | API Client gọi toàn bộ endpoint Partner & Admin phía backend. |
| `frontend/app/partner/(dashboard)/goi-dich-vu/page.tsx` *(mới)* | Giao diện Đối tác: xem gói đang kích hoạt, cảnh báo hết hạn, bảng giá 3 gói từ SQL Server, pop-up chuyển khoản 1-click copy, form gửi mã đối soát, bảng lịch sử đăng ký. |
| `frontend/app/admin/(dashboard)/doanh-thu-goi/page.tsx` *(mới)* | Giao diện Admin: Dashboard 4 thẻ KPI doanh thu, biểu đồ ngày/tháng, cơ cấu gói, bảng duyệt/từ chối giao dịch kèm lý do, bật/tắt gói, nút tải CSV. |
| `frontend/components/partner/PartnerSidebar.tsx` *(sửa)* | Thêm mục "Gói hoạt động" (`/partner/goi-dich-vu`). |
| `frontend/components/admin/AdminSidebar.tsx` *(sửa)* | Thêm mục "Doanh thu & Gói đối tác" (`/admin/doanh-thu-goi`). |
| `frontend/app/partner/(dashboard)/page.tsx` *(sửa)* | Thêm banner thông minh cảnh báo chưa có gói hoạt động hoặc gói sắp hết hạn ($\le 7$ ngày). |
| `frontend/app/partner/(dashboard)/co-so/tao-moi/page.tsx` *(sửa)* | Thêm cảnh báo yêu cầu gói hoạt động còn hiệu lực trước khi gửi cơ sở mới. |
| `frontend/components/ui/StatusBadge.tsx` *(sửa)* | Bổ sung badge hiển thị trạng thái `PAID` và `EXPIRED`. |
| `frontend/lib/api/partner.ts` *(sửa)* | Kết nối `createPartnerPlace` tới API thật `POST /api/places`. |

---

## 12. Script Migration SQL Server (Chạy trong SSMS)

File migration: `database/migrations/005_partner_subscriptions.sql`.

Mở **SQL Server Management Studio (SSMS)**, chọn database `DaNangGo` và thực thi script:

```sql
USE DaNangGo;
GO

-- 1. BẢNG DANH MỤC GÓI ĐĂNG KÝ
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'subscription_packages' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.subscription_packages (
        package_id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        package_code VARCHAR(50) NOT NULL CONSTRAINT UQ_subscription_packages_code UNIQUE,
        name NVARCHAR(100) NOT NULL,
        duration_months INT NOT NULL CONSTRAINT CK_package_duration CHECK (duration_months > 0),
        price INT NOT NULL CONSTRAINT CK_package_price CHECK (price >= 0),
        description NVARCHAR(500) NULL,
        is_active BIT NOT NULL CONSTRAINT DF_subscription_packages_active DEFAULT 1,
        sort_order INT NOT NULL CONSTRAINT DF_subscription_packages_sort DEFAULT 0,
        created_at DATETIME2(0) NOT NULL CONSTRAINT DF_subscription_packages_created DEFAULT GETDATE(),
        updated_at DATETIME2(0) NULL
    );
END;

-- Khởi tạo 3 gói mặc định nếu chưa tồn tại
IF NOT EXISTS (SELECT 1 FROM dbo.subscription_packages WHERE package_code = 'PKG_1M')
    INSERT INTO dbo.subscription_packages (package_code, name, duration_months, price, description, sort_order)
    VALUES ('PKG_1M', N'Gói 1 tháng', 1, 500000, N'Gói cơ bản trải nghiệm nền tảng DaNangGo trong 1 tháng', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.subscription_packages WHERE package_code = 'PKG_6M')
    INSERT INTO dbo.subscription_packages (package_code, name, duration_months, price, description, sort_order)
    VALUES ('PKG_6M', N'Gói 6 tháng', 6, 2500000, N'Gói đối tác tiêu chuẩn 6 tháng - Tiết kiệm 500.000 VNĐ', 2);

IF NOT EXISTS (SELECT 1 FROM dbo.subscription_packages WHERE package_code = 'PKG_1Y')
    INSERT INTO dbo.subscription_packages (package_code, name, duration_months, price, description, sort_order)
    VALUES ('PKG_1Y', N'Gói 1 năm', 12, 4500000, N'Gói đối tác cao cấp 1 năm - Tiết kiệm 1.500.000 VNĐ', 3);

-- 2. BẢNG LỊCH SỬ ĐĂNG KÝ VÀ THANH TOÁN GÓI
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'partner_subscriptions' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.partner_subscriptions (
        subscription_id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        transaction_code VARCHAR(50) NOT NULL CONSTRAINT UQ_partner_subscriptions_tx UNIQUE,
        partner_id INT NOT NULL,
        package_id INT NOT NULL,
        package_name NVARCHAR(100) NOT NULL,
        duration_months INT NOT NULL,
        price INT NOT NULL CONSTRAINT CK_sub_price CHECK (price >= 0),
        subscription_status VARCHAR(20) NOT NULL CONSTRAINT DF_sub_status DEFAULT 'PENDING'
            CONSTRAINT CK_sub_status CHECK (subscription_status IN ('PENDING', 'ACTIVE', 'EXPIRED', 'REJECTED', 'CANCELLED')),
        payment_status VARCHAR(20) NOT NULL CONSTRAINT DF_sub_payment_status DEFAULT 'PENDING'
            CONSTRAINT CK_sub_payment_status CHECK (payment_status IN ('PENDING', 'PAID', 'REJECTED')),
        payment_method VARCHAR(30) NOT NULL CONSTRAINT DF_sub_payment_method DEFAULT 'BANK_TRANSFER',
        payment_reference NVARCHAR(100) NULL,
        payment_proof_note NVARCHAR(500) NULL,
        payment_submitted_at DATETIME2(0) NULL,
        start_date DATETIME2(0) NULL,
        end_date DATETIME2(0) NULL,
        created_at DATETIME2(0) NOT NULL CONSTRAINT DF_sub_created DEFAULT GETDATE(),
        confirmed_by INT NULL,
        confirmed_at DATETIME2(0) NULL,
        rejection_reason NVARCHAR(500) NULL,
        is_renewal BIT NOT NULL CONSTRAINT DF_sub_renewal DEFAULT 0,
        renewed_from_id INT NULL,
        CONSTRAINT FK_partner_subscriptions_partner FOREIGN KEY (partner_id) REFERENCES dbo.partner_profiles(partner_id),
        CONSTRAINT FK_partner_subscriptions_package FOREIGN KEY (package_id) REFERENCES dbo.subscription_packages(package_id),
        CONSTRAINT FK_partner_subscriptions_confirmed_by FOREIGN KEY (confirmed_by) REFERENCES dbo.users(user_id),
        CONSTRAINT FK_partner_subscriptions_renewed_from FOREIGN KEY (renewed_from_id) REFERENCES dbo.partner_subscriptions(subscription_id)
    );
END;

-- 3. BẢNG NHẬT KÝ THAY ĐỔI TRẠNG THÁI (AUDIT LOGS)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'subscription_status_logs' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.subscription_status_logs (
        log_id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        subscription_id INT NOT NULL,
        previous_status VARCHAR(20) NULL,
        new_status VARCHAR(20) NOT NULL,
        action_by_user_id INT NULL,
        note NVARCHAR(500) NULL,
        created_at DATETIME2(0) NOT NULL CONSTRAINT DF_sub_log_created DEFAULT GETDATE(),
        CONSTRAINT FK_sub_logs_sub FOREIGN KEY (subscription_id) REFERENCES dbo.partner_subscriptions(subscription_id) ON DELETE CASCADE,
        CONSTRAINT FK_sub_logs_user FOREIGN KEY (action_by_user_id) REFERENCES dbo.users(user_id)
    );
END;

-- 4. TẠO CÁC CHỈ MỤC TỐI ƯU TRUY VẤN
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_partner_subscriptions_partner' AND object_id = OBJECT_ID('dbo.partner_subscriptions'))
    CREATE NONCLUSTERED INDEX IX_partner_subscriptions_partner ON dbo.partner_subscriptions (partner_id, subscription_status, end_date);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_partner_subscriptions_revenue' AND object_id = OBJECT_ID('dbo.partner_subscriptions'))
    CREATE NONCLUSTERED INDEX IX_partner_subscriptions_revenue ON dbo.partner_subscriptions (payment_status, confirmed_at) INCLUDE (price, package_id);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_partner_subscriptions_created' AND object_id = OBJECT_ID('dbo.partner_subscriptions'))
    CREATE NONCLUSTERED INDEX IX_partner_subscriptions_created ON dbo.partner_subscriptions (created_at DESC);
GO
```

---

## 13. Hướng dẫn chạy và kiểm tra chức năng gói & doanh thu

### Bước 1: Khởi động hệ thống
Mở 2 terminal:
```powershell
# Terminal 1: Backend
cd backend
npm run dev
```

```powershell
# Terminal 2: Frontend
cd frontend
npm run dev
```

### Bước 2: Kiểm thử tự động (Unit & Integration Tests)
Chạy bộ test tự động tại `backend/`:
```powershell
cd backend
npm test
```
*Kết quả mong đợi*: 18/18 test case passed với thời gian thực thi $< 2$ giây.

### Bước 3: Kiểm thử luồng Đối tác (PARTNER)
1. Đăng nhập với tài khoản Đối tác đã được Admin duyệt.
2. Truy cập menu **"Gói hoạt động"** trên sidebar (`/partner/goi-dich-vu`).
3. Kiểm tra danh sách 3 gói tải từ SQL Server: 1 tháng (500k), 6 tháng (2.5tr), 1 năm (4.5tr).
4. Bấm **"Đăng ký gói"** ở một gói mong muốn:
   - Hệ thống tạo mã giao dịch duy nhất dạng `DNG-SUB-...`.
   - Hiển thị pop-up thông tin tài khoản MB Bank kèm cú pháp chuyển khoản sao chép 1-click.
5. Nhập mã giao dịch ngân hàng vào ô đối soát và bấm **"Gửi xác nhận chuyển khoản"**.
6. Kiểm tra bảng lịch sử: Giao dịch hiển thị trạng thái `Chờ duyệt`, phương thức `Chuyển khoản ngân hàng`.

### Bước 4: Kiểm thử luồng Quản trị viên (ADMIN)
1. Đăng nhập với tài khoản Quản trị viên (`ADMIN`).
2. Truy cập menu **"Doanh thu & Gói đối tác"** (`/admin/doanh-thu-goi`).
3. Chuyển sang tab **"Duyệt thanh toán"**:
   - Giao dịch của đối tác vừa gửi xuất hiện với trạng thái `PENDING`.
   - Xem chi tiết: Mã giao dịch, tên cơ sở, số điện thoại, mã tham chiếu ngân hàng do đối tác cung cấp.
4. Bấm **"Xác nhận thanh toán"**:
   - Hệ thống cập nhật giao dịch sang `PAID` và gói sang `ACTIVE`.
   - Tính ngày bắt đầu và ngày kết thúc chuẩn theo lịch.
   - Chống click đúp: Thao tác lần 2 trên cùng giao dịch sẽ bị chặn với mã 409 Conflict.
5. Chuyển sang tab **"Tổng quan doanh thu"**:
   - Thẻ **"Tổng doanh thu gói"** được cộng đúng số tiền gói vừa duyệt.
   - Biểu đồ phân bổ theo gói và doanh thu theo ngày/tháng được cập nhật.
6. Thử bấm **"Xuất báo cáo CSV"**:
   - Trình duyệt tải về file `bao-cao-doanh-thu-dananggo-[ngay].csv`.
   - Mở file bằng Microsoft Excel: hiển thị đầy đủ tiếng Việt có dấu, không lỗi font nhờ UTF-8 BOM.

### Bước 5: Kiểm tra gia hạn & Kiểm soát quyền tạo địa điểm
1. Đối tác có gói `ACTIVE`: thử vào trang `/partner/co-so/tao-moi` để tạo cơ sở mới $\rightarrow$ API `POST /api/places` cho phép tạo thành công.
2. Đối tác quay lại `/partner/goi-dich-vu` bấm **"Gia hạn gói"**:
   - Khi Admin duyệt gói gia hạn: Ngày kết thúc mới được tự động **cộng dồn nối tiếp** vào ngày kết thúc cũ.
3. Khi đối tác chưa có gói hoặc gói hết hạn:
   - Dashboard đối tác hiển thị banner cảnh báo màu vàng yêu cầu kích hoạt gói.
   - Thao tác gửi cơ sở `POST /api/places` bị backend chặn với mã lỗi 403 `NO_ACTIVE_SUBSCRIPTION`.

---

# Tổng hợp cập nhật: duyệt tài khoản, quản lý người dùng và hồ sơ cá nhân

Phần này ghi lại các chức năng đã được triển khai trong codebase để tiện tra cứu. Các API bên dưới dùng prefix `/api`; những route Admin yêu cầu phiên Admin hợp lệ.

## 14. Duyệt tài khoản đối tác

Luồng đăng ký và xét duyệt đối tác được mô tả chi tiết ở phần **Hướng dẫn chức năng duyệt tài khoản đối tác** phía trên. Tóm tắt:

- Đăng ký Partner tạo user và hồ sơ đối tác trong SQL Server với trạng thái chờ duyệt; tài khoản chưa được đăng nhập như Partner đã hoạt động.
- Admin xem danh sách, duyệt hoặc từ chối kèm lý do; trạng thái xét duyệt và thông tin người/thời điểm xét duyệt được lưu trong database.
- Backend kiểm tra trạng thái tài khoản/hồ sơ trước khi cấp phiên và trước khi cho Partner tạo địa điểm.
- Các API chính: `GET /api/admin/partners`, `PATCH /api/admin/partners/:id/approval`, `PATCH /api/admin/partners/:id/lock`.

## 15. Admin quản lý người dùng

Các API được đăng ký tại `backend/src/modules/admin/users.routes.ts` và được bảo vệ bằng xác thực cùng role `ADMIN`.

| API | Chức năng |
|---|---|
| `GET /api/admin/users?page=1&limit=10&role=USER&status=ACTIVE&search=ten` | Phân trang, lọc vai trò/trạng thái và tìm theo tên/email. Query SQL dùng tham số; response chỉ gồm thông tin công khai và phân trang. |
| `PATCH /api/admin/users/:id/status` với `{ "status": "LOCKED" }` hoặc `{ "status": "ACTIVE" }` | Khóa/mở khóa tài khoản. Trả 404 nếu không có user; không cho Admin khóa hoặc mở khóa chính mình hay thay đổi trạng thái Admin khác. |

File liên quan: `backend/src/modules/admin/users.routes.ts`, `users.service.ts`, `users.repository.ts`; giao diện danh sách tại `frontend/app/admin/(dashboard)/nguoi-dung/page.tsx` và lời gọi API trong `frontend/lib/api/admin.ts`. Trạng thái hợp lệ hiện dùng là `ACTIVE` và `LOCKED`.

## 16. Hồ sơ cá nhân và ảnh đại diện

Trang hồ sơ lấy thông tin user từ API phiên đăng nhập, không còn giả lập lưu thành công ở trình duyệt.

| API | Chức năng |
|---|---|
| `GET /api/auth/me` | Lấy user hiện tại từ database. |
| `PATCH /api/auth/me` | Lưu họ tên, số điện thoại và ngày sinh vào `dbo.users`; email/role không nằm trong allowlist cập nhật. |
| `POST /api/auth/me/avatar` | Tải ảnh JPG/PNG/WebP tối đa 5 MB lên; backend kiểm tra nội dung file, lưu ảnh và cập nhật đường dẫn trong database. |
| `DELETE /api/auth/me/avatar` | Xóa ảnh đại diện hiện tại và xóa đường dẫn ảnh khỏi hồ sơ. |
| `POST /api/auth/change-password` | Đổi mật khẩu theo flow có sẵn, yêu cầu mật khẩu hiện tại và mật khẩu mới/xác nhận. |

Sau khi đổi mật khẩu thành công, backend thu hồi các refresh token và xóa cookie phiên hiện tại. Giao diện xóa user khỏi AuthContext rồi chuyển tới `/dang-nhap`, vì vậy người dùng phải đăng nhập lại bằng mật khẩu mới.

Các route hồ sơ yêu cầu đăng nhập; cập nhật hồ sơ và ảnh cho role `USER` hoặc `PARTNER`. SQL Server đã có các cột `full_name`, `phone`, `date_of_birth`, `avatar_url` trong `dbo.users`, nên phần hồ sơ này **không cần migration**. File ảnh lưu trên máy backend tại `backend/uploads/avatars`; trường `avatar_url` chỉ lưu đường dẫn để hiển thị ảnh.

File liên quan:

- Backend: `backend/src/modules/auth/auth.routes.ts`, `auth.service.ts`, `auth.repository.ts`, `avatar-upload.ts` (mới), `backend/src/index.ts` (phục vụ file ảnh tĩnh).
- Frontend: `frontend/components/profile/BasicInfoForm.tsx`, `AvatarUploader.tsx`, `ChangePasswordForm.tsx`, `frontend/lib/api/me.ts`, `frontend/lib/api/client.ts`, `frontend/components/layout/Navbar.tsx`.
- Trong form đổi mật khẩu có nút hiện/ẩn riêng cho mật khẩu hiện tại, mật khẩu mới và ô xác nhận.

### File sửa thêm cho luồng đăng nhập lại sau khi đổi mật khẩu

| File | Thay đổi cụ thể |
|---|---|
| `backend/src/modules/auth/auth.service.ts` | Sau khi kiểm tra mật khẩu hiện tại và lưu hash mới, thu hồi toàn bộ refresh token thay vì giữ phiên đang dùng. |
| `backend/src/modules/auth/auth.routes.ts` | Sau khi đổi mật khẩu thành công, xóa cookie access/refresh và trả thông báo yêu cầu đăng nhập lại. |
| `frontend/contexts/AuthContext.tsx` | Thêm hàm `logoutTo(path)` để xóa user khỏi giao diện và điều hướng tới đường dẫn chỉ định; các nút đăng xuất cũ vẫn về trang chủ. |
| `frontend/components/profile/ChangePasswordForm.tsx` | Khi API đổi mật khẩu báo thành công, gọi `logoutTo('/dang-nhap')`. |

## 17. Cách chạy và kiểm tra nhanh

Khởi động backend và frontend ở hai terminal:

```powershell
cd backend
npm run dev
```

```powershell
cd frontend
npm run dev
```

Đăng nhập tài khoản phù hợp rồi mở `/admin/doi-tac`, `/admin/nguoi-dung` hoặc trang `/ca-nhan`. Thay đổi hồ sơ sẽ được ghi vào database; ảnh được lưu trên đĩa backend. Khi triển khai backend trên nhiều máy hoặc môi trường có ổ đĩa tạm, cần chuyển file ảnh sang dịch vụ lưu trữ dùng chung để ảnh tồn tại ổn định giữa các máy.
