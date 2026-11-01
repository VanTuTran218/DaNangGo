# HƯỚNG DẪN SỬ DỤNG VÀ PHÁT TRIỂN FRONTEND ADMIN & PARTNER (DANANGGO)

Tài liệu này hướng dẫn chi tiết về cấu trúc, cách vận hành, luồng dữ liệu và hướng dẫn tích hợp API cho phần Frontend dành cho vai trò **ADMIN** (Quản trị viên) và **PARTNER** (Đối tác dịch vụ) thuộc dự án DaNangGo.

---

## 1. TỔNG QUAN KIẾN TRÚC & CÔNG NGHỆ

- **Framework**: Next.js (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4 (`@import "tailwindcss"` trong `globals.css`)
- **Animation & Icons**: `framer-motion`, `lucide-react`
- **Map Component**: Leaflet (`react-leaflet` + dynamic import `ssr: false` qua `MapWrapper`)
- **Tone màu chủ đạo**: Teal-500/600 (Chủ đạo), Orange-500 (Nút hành động chính), Background Gray-50, Card trắng bo góc `rounded-xl` / `rounded-2xl` viền `border-gray-100`.

---

## 2. CẤU TRÚC THƯ MỤC VÀ TỆP TIN DỰ ÁN

```text
frontend/
├── app/
│   ├── admin/
│   │   ├── (dashboard)/            # Layout riêng có Sidebar & Header cho Admin
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx            # /admin - Dashboard tổng quan
│   │   │   ├── nguoi-dung/page.tsx # /admin/nguoi-dung - Quản lý người dùng
│   │   │   ├── doi-tac/page.tsx    # /admin/doi-tac - Quản lý đối tác
│   │   │   ├── dia-diem/page.tsx   # /admin/dia-diem - Quản lý nội dung
│   │   │   ├── danh-gia/page.tsx   # /admin/danh-gia - Kiểm duyệt review
│   │   │   └── khao-sat/page.tsx   # /admin/khao-sat - Quản lý khảo sát
│   │   └── login/page.tsx          # /admin/login - Trang đăng nhập quản trị
│   └── partner/
│       └── (dashboard)/            # Layout riêng bảo vệ theo role PARTNER
│           ├── layout.tsx
│           ├── page.tsx            # /partner - Dashboard đối tác
│           ├── co-so/
│           │   ├── page.tsx        # /partner/co-so - Danh sách cơ sở
│           │   ├── tao-moi/page.tsx# /partner/co-so/tao-moi - Thêm cơ sở
│           │   └── [id]/sua/page.tsx# /partner/co-so/[id]/sua - Sửa cơ sở
│           ├── don-dat/page.tsx    # /partner/don-dat - Quản lý đơn đặt
│           ├── danh-gia/page.tsx   # /partner/danh-gia - Đánh giá & Phản hồi
│           └── ho-so/page.tsx      # /partner/ho-so - Hồ sơ doanh nghiệp
├── components/
│   ├── admin/                      # AdminSidebar, AdminHeader
│   ├── partner/                    # PartnerSidebar, PartnerHeader, PlaceForm
│   └── ui/                         # DataTable, StatusBadge, ConfirmDialog, EmptyState, SkeletonTable, ColumnChart
├── hooks/
│   └── useAsyncData.ts             # Custom hook quản lý 4 trạng thái dữ liệu (loading, error, empty, data)
├── lib/
│   ├── api/
│   │   ├── admin.ts                # Tầng API service Admin (có sẵn comment TODO endpoint)
│   │   └── partner.ts              # Tầng API service Partner (có sẵn comment TODO endpoint)
│   └── mock/
│       ├── admin.ts                # Mock data in-memory Admin
│       └── partner.ts              # Mock data in-memory Partner
├── types/
│   ├── admin.ts                    # TypeScript types Admin
│   └── partner.ts                  # TypeScript types Partner
└── proxy.ts                        # Middleware bảo vệ route /admin/*, /partner/*, /ca-nhan/*
```

---

## 3. LUỒNG BẢO VỆ VÀ PHÂN QUYỀN (AUTHENTICATION & AUTHORIZATION)

1. **Bảo vệ bằng Proxy Middleware (`proxy.ts`)**:
   - Truy cập `/admin/*` (trừ `/admin/login`): Kiểm tra cookie `admin_access`. Nếu chưa có -> redirect về `/admin/login`.
   - Truy cập `/partner/*`, `/ca-nhan/*`, `/lich-trinh/*`, `/vip/*`: Kiểm tra cookie `access_token`. Nếu chưa có -> redirect về `/dang-nhap?redirect=...`.
2. **Kiểm tra Vai trò trong Layout Partner (`app/partner/(dashboard)/layout.tsx`)**:
   - Kiểm tra thông tin `user` từ `AuthContext`.
   - Nếu `user.role !== 'PARTNER'` -> tự động chuyển hướng về trang chủ `/`.
3. **Menu dành cho Partner trên Navbar chính (`components/layout/Navbar.tsx`)**:
   - Nếu tài khoản đăng nhập có `role === 'PARTNER'`, menu thả xuống ở Avatar và Mobile Menu sẽ xuất hiện thêm mục **"Quản lý cơ sở"** điều hướng trực tiếp đến `/partner`.

---

## 4. TÍNH NĂNG VÀ HƯỚNG DẪN KIỂM THỬ THỰC TẾ

### A. KHU VỰC QUẢN TRỊ ADMIN (`/admin`)

1. **Trang Đăng Nhập Quản Trị (`/admin/login`)**:
   - Nhập thông tin tài khoản admin -> gọi `adminLogin()` lưu cookie `admin_access` và chuyển hướng đến `/admin`.
2. **Dashboard (`/admin`)**:
   - Xem 6 thẻ thống kê hệ thống (Người dùng, Đối tác, Đối tác chờ duyệt, Địa điểm, Đánh giá, Khảo sát).
   - Biểu đồ cột SVG thống kê lượng người dùng mới trong 7 ngày.
   - Khối **"Việc cần xử lý"** liệt kê các đối tác chờ duyệt hoặc review bị báo cáo với nút chuyển tới trang xử lý tương ứng.
3. **Quản Lý Người Dùng (`/admin/nguoi-dung`)**:
   - Bảng danh sách tài khoản với ô tìm kiếm tên/email, bộ lọc Vai trò (Người dùng, Đối tác, Quản trị) và Trạng thái (Hoạt động, Đã khóa).
   - Phân trang tự động. Nút **Eye** xem chi tiết drawer/modal, nút **Lock/Unlock** mở dialog xác nhận để khóa/mở khóa tài khoản.
4. **Quản Lý Đối Tác (`/admin/doi-tac`)**:
   - 5 Tab trạng thái: *Chờ duyệt / Đang hoạt động / Bị từ chối / Bị khóa / Tất cả*.
   - Nút **Duyệt** chuyển trạng thái đối tác thành Đang hoạt động.
   - Nút **Từ chối** mở dialog bắt buộc nhập lý do từ chối.
   - Nút **Khóa** tạm ngưng tài khoản đối tác vi phạm.
5. **Quản Lý Nội Dung Địa Điểm (`/admin/dia-diem`)**:
   - Lọc địa điểm theo loại hình (*Lưu trú, Ẩm thực, Điểm du lịch*) và trạng thái (*Đang hiển thị, Chờ duyệt, Đã ẩn*).
   - Duyệt địa điểm mới gửi từ đối tác, ẩn/hiện địa điểm trên website, xóa vĩnh viễn địa điểm.
6. **Kiểm Duyệt Đánh Giá (`/admin/danh-gia`)**:
   - Lọc nhận xét theo số sao (1 đến 5 sao) và checkbox **"Chỉ hiện bị báo cáo"**.
   - Xem lý do báo cáo vi phạm, ẩn nhận xét hoặc xóa vĩnh viễn nhận xét vi phạm.
7. **Quản Lý Khảo Sát (`/admin/khao-sat`)**:
   - Tạo khảo sát mới với tiêu đề, mô tả và danh sách câu hỏi dạng **Chọn sao (1-5)** hoặc **Nhập văn bản**.
   - Bật/Tắt trạng thái nhận phản hồi của khảo sát.
   - Xem tổng hợp kết quả (điểm trung bình sao, mẫu câu trả lời văn bản).

---

### B. KHU VỰC ĐỐI TÁC PARTNER (`/partner`)

1. **Dashboard Partner (`/partner`)**:
   - Thẻ thống kê: Số cơ sở, Tổng lượt xem, Tổng đơn đặt, Điểm đánh giá trung bình.
   - Biểu đồ cột lượt đơn đặt trong 7 ngày và danh sách nhận xét mới nhất.
   - **ĐẶC BIỆT**: Nếu hồ sơ đối tác đang ở trạng thái **CHỜ DUYỆT** hoặc **BỊ TỪ CHỐI**, màn hình sẽ hiển thị Banner cảnh báo nổi bật kèm lý do (nếu bị từ chối) và **khóa các nút Thêm/Sửa cơ sở**.
2. **Danh Sách Cơ Sở Dịch Vụ (`/partner/co-so`)**:
   - Hiển thị danh sách khách sạn, nhà hàng, tour thuộc sở hữu của đối tác.
   - Lọc theo loại hình và trạng thái hiển thị.
3. **Thêm / Sửa Cơ Sở (`/partner/co-so/tao-moi` và `/partner/co-so/[id]/sua`)**:
   - Form nhiều bước **`PlaceForm`**:
     - *Bước 1*: Thông tin cơ bản (Tên, Loại hình, Mô tả, Địa chỉ, Quận/Huyện).
     - *Bước 2*: Giá & Giờ mở cửa (Khoảng giá, Đơn vị tính, Giờ mở/đóng, Ngày hoạt động).
     - *Bước 3*: Tiện ích & Hình ảnh (Chọn/nhập tiện ích, dán nhiều URL ảnh xem trước thumbnail, xóa ảnh).
     - *Bước 4*: Vị trí tọa độ Lat/Lng tương tác trên bản đồ Leaflet mini.
   - Validate lỗi chi tiết từng trường. Hỗ trợ nút **Lưu nháp** (trạng thái Đã ẩn) và **Gửi duyệt** (trạng thái Chờ duyệt).
4. **Quản Lý Đơn Đặt (`/partner/don-dat`)**:
   - Theo dõi danh sách khách đặt chỗ, thông tin liên hệ, ngày dịch vụ, tổng tiền và hình thức thanh toán (Tiền mặt / Chuyển khoản).
   - Quy trình đổi trạng thái: *Chờ xác nhận -> Đã xác nhận -> Hoàn thành / Hủy đơn*.
5. **Đánh Giá & Phản Hồi (`/partner/danh-gia`)**:
   - Lọc nhận xét của khách theo số sao.
   - Gửi phản hồi hoặc chỉnh sửa phản hồi trực tiếp cho từng nhận xét của khách hàng.
6. **Hồ Sơ Doanh Nghiệp (`/partner/ho-so`)**:
   - Cập nhật tên doanh nghiệp, loại dịch vụ chính, mã số thuế, địa chỉ ĐKKD, số điện thoại và email.

---

## 5. TẦNG DỮ LIỆU VÀ HƯỚNG DẪN KẾT NỐI API THẬT (BACKEND INTEGRATION)

Hiện tại toàn bộ dữ liệu đang đọc/ghi thông qua biến in-memory có giả lập delay 400ms. Để kết nối tới Backend thật, team chỉ cần thay phần thân các hàm trong 2 file Service dưới đây mà **KHÔNG CẦN SỬA CODE COMPONENT GIAO DIỆN**:

- `frontend/lib/api/admin.ts`
- `frontend/lib/api/partner.ts`

### Bảng Tổng Hợp 31 API Endpoints Cần Có Bên Backend:

#### 1. Admin Endpoints (`/api/admin/...`)

| HTTP Method | Route Endpoint | Mục đích | Parameter / Body | Phản hồi kỳ vọng (`ApiEnvelope<T>`) |
|---|---|---|---|---|
| `GET` | `/api/admin/stats` | Thống kê dashboard admin | - | `{ success: true, data: AdminDashboardStats }` |
| `GET` | `/api/admin/stats/users-chart` | Thống kê user mới 7 ngày | - | `{ success: true, data: DailyUserStat[] }` |
| `GET` | `/api/admin/todos` | Việc cần xử lý | - | `{ success: true, data: AdminTodoItem[] }` |
| `GET` | `/api/admin/users` | Danh sách người dùng | `?search=&role=&status=` | `{ success: true, data: AdminUserItem[] }` |
| `PATCH` | `/api/admin/users/:id/status` | Khóa / Mở khóa người dùng | `{ status: 'ACTIVE' \| 'LOCKED' }` | `{ success: true, message: string }` |
| `GET` | `/api/admin/partners` | Danh sách đối tác | `?status=&search=` | `{ success: true, data: AdminPartnerItem[] }` |
| `POST` | `/api/admin/partners/:id/approve` | Duyệt đối tác | - | `{ success: true, message: string }` |
| `POST` | `/api/admin/partners/:id/reject` | Từ chối đối tác | `{ reason: string }` | `{ success: true, message: string }` |
| `PATCH` | `/api/admin/partners/:id/status` | Cập nhật trạng thái đối tác | `{ status: PartnerApprovalStatus }` | `{ success: true, message: string }` |
| `GET` | `/api/admin/places` | Danh sách địa điểm | `?category=&status=&search=` | `{ success: true, data: AdminPlaceItem[] }` |
| `PATCH` | `/api/admin/places/:id/status` | Duyệt / Ẩn / Hiện địa điểm | `{ status: PlaceStatus }` | `{ success: true, message: string }` |
| `DELETE` | `/api/admin/places/:id` | Xóa địa điểm | - | `{ success: true, message: string }` |
| `GET` | `/api/admin/reviews` | Danh sách review | `?rating=&isReportedOnly=` | `{ success: true, data: AdminReviewItem[] }` |
| `PATCH` | `/api/admin/reviews/:id/status` | Ẩn / Hiện review | `{ status: 'ACTIVE' \| 'HIDDEN' }` | `{ success: true, message: string }` |
| `DELETE` | `/api/admin/reviews/:id` | Xóa review vi phạm | - | `{ success: true, message: string }` |
| `GET` | `/api/admin/surveys` | Danh sách khảo sát | - | `{ success: true, data: AdminSurveyItem[] }` |
| `POST` | `/api/admin/surveys` | Tạo khảo sát mới | `{ title, description, questions }` | `{ success: true, data: AdminSurveyItem }` |
| `PUT` | `/api/admin/surveys/:id` | Sửa khảo sát / Bật tắt | `{ title, description, questions, isActive }` | `{ success: true, data: AdminSurveyItem }` |
| `DELETE` | `/api/admin/surveys/:id` | Xóa khảo sát | - | `{ success: true, message: string }` |

#### 2. Partner Endpoints (`/api/partner/...`)

| HTTP Method | Route Endpoint | Mục đích | Parameter / Body | Phản hồi kỳ vọng (`ApiEnvelope<T>`) |
|---|---|---|---|---|
| `GET` | `/api/partner/profile` | Lấy hồ sơ doanh nghiệp partner | - | `{ success: true, data: PartnerProfile }` |
| `PUT` | `/api/partner/profile` | Cập nhật hồ sơ doanh nghiệp | `{ businessName, serviceType, taxCode, address, phone, email }` | `{ success: true, data: PartnerProfile }` |
| `GET` | `/api/partner/stats` | Thống kê dashboard partner | - | `{ success: true, data: PartnerDashboardStats }` |
| `GET` | `/api/partner/stats/bookings-chart` | Lượt đặt 7 ngày | - | `{ success: true, data: DailyBookingStat[] }` |
| `GET` | `/api/partner/places` | Danh sách cơ sở của tôi | `?category=&status=` | `{ success: true, data: PartnerPlace[] }` |
| `GET` | `/api/partner/places/:id` | Chi tiết cơ sở | - | `{ success: true, data: PartnerPlace }` |
| `POST` | `/api/partner/places` | Tạo cơ sở mới | `{ name, category, description, address, area, priceMin, priceMax, priceUnit, openHours, openDays, amenities, images, lat, lng }` + `isSubmitForReview` | `{ success: true, data: PartnerPlace }` |
| `PUT` | `/api/partner/places/:id` | Sửa cơ sở | `{ ...payload, isSubmitForReview }` | `{ success: true, data: PartnerPlace }` |
| `GET` | `/api/partner/bookings` | Danh sách đơn đặt chỗ | `?status=&search=` | `{ success: true, data: PartnerBooking[] }` |
| `PATCH` | `/api/partner/bookings/:id/status` | Đổi trạng thái đơn đặt | `{ status: BookingStatus }` | `{ success: true, message: string }` |
| `GET` | `/api/partner/reviews` | Đánh giá về cơ sở của tôi | `?rating=` | `{ success: true, data: PartnerReview[] }` |
| `POST` | `/api/partner/reviews/:id/reply` | Phản hồi review khách | `{ content: string }` | `{ success: true, message: string }` |

### Ví Dụ Mẫu Chuyển Đổi Một Hàm Trong `lib/api/admin.ts`:

```typescript
// Trước (Mock In-Memory):
export async function getAdminUsers(params?: { search?: string; role?: string; status?: string }): Promise<AdminUserItem[]> {
  await delay();
  let result = [...mockAdminUsers];
  // ...
  return result;
}

// Sau khi có Backend thật:
import { apiRequest } from './client';

export async function getAdminUsers(params?: { search?: string; role?: string; status?: string }): Promise<AdminUserItem[]> {
  const query = new URLSearchParams(params as Record<string, string>).toString();
  const response = await apiRequest<AdminUserItem[]>(`/api/admin/users?${query}`);
  return response.data || [];
}
```

---

## 6. QUY TRÌNH BUILD VÀ ĐÓNG GÓI DỰ ÁN

Để thực hiện build sản phẩm cho môi trường Production:

```bash
cd frontend
npm run build
```

Sau khi chạy lệnh trên, Next.js sẽ biên dịch và kiểm tra kiểu mã nguồn. Đảm bảo toàn bộ 27 đường dẫn tĩnh và động được tạo thành công không có lỗi.


---

## 7. GHI CHÚ VỀ TÀI KHOẢN DEMO PARTNER VÀ TÍNH AN TOÀN KHI KẾT NỐI BACKEND SAU NÀY

### A. Thông tin tài khoản Demo Partner
Để phục vụ việc test/demo luồng đăng nhập Partner trực tiếp từ giao diện `/dang-nhap`:
- **Email**: `tt1871214@gmail.com`
- **Mật khẩu**: `Tuan@123456`
- **Vai trò (Role)**: `PARTNER`
- **Trạng thái phê duyệt (Status)**: `APPROVED` (Đã duyệt, không cần Admin thao tác duyệt, mở khóa 100% tính năng quản lý cơ sở, đặt chỗ, đánh giá).

### B. Cam kết về tính an toàn và không ảnh hưởng đến dự án về sau
- **Không có tác động tiêu cực đến Backend/Database**: Toàn bộ luồng dữ liệu, mock login, và quản lý đối tác chỉ được cài đặt thuần túy ở phía Frontend.
- **Không bị xung đột hay hư hỏng code giao diện**:
  1. Khi phát triển Backend thật sau này, bạn chỉ cần xóa nhánh điều kiện mock login trong `frontend/lib/api/auth.ts` và `frontend/lib/api/me.ts` (hoặc tạo tài khoản `tt1871214@gmail.com` thật trong Database với role `PARTNER`).
  2. Toàn bộ giao diện người dùng (UI Component, Form nhiều bước, Map Leaflet, DataTable, Dialog xác nhận...) **giữ nguyên 100% không cần sửa lại bất kỳ dòng code nào**.
  3. Mọi thao tác kết nối Backend sau này chỉ diễn ra tại 2 file Service (`lib/api/admin.ts` và `lib/api/partner.ts`).
