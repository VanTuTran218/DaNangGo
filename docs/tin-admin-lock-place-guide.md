# HƯỚNG DẪN TÍCH HỢP HÀM ĐỔI TRẠNG THÁI & KHÓA QUÁN DÀNH CHO TÍN (TASK 8)

> **Dành cho:** Tín (Phụ trách Admin Dashboard & Quản lý Cơ sở / Khóa quán)  
> **Người biên soạn:** Tú (Backend / Core Places Module)  
> **Phiên bản:** Migration 006 / Task 8 (Trạng thái `LOCKED`, cột `booking_url` & Hàm quản trị trạng thái địa điểm)

---

## 1. Tổng quan & Ràng buộc bảo mật (RBAC Rules)

Bảng `places` trong SQL Server hiện tại chấp nhận 4 trạng thái:
- `'ACTIVE'`: Địa điểm đang hoạt động bình thường, hiển thị công khai trên ứng dụng.
- `'HIDDEN'`: Địa điểm tạm ẩn (chưa đón khách hoặc tạm đóng cửa).
- `'PENDING'`: Địa điểm mới tạo / chờ Quản trị viên duyệt.
- `'LOCKED'`: Địa điểm bị Quản trị viên khóa vi phạm hoặc tạm đình chỉ hoạt động.

### 🛡️ Ràng buộc bảo mật bắt buộc:
1. **Quán đang `LOCKED`**: **CHỈ CÓ ADMIN MỚI ĐƯỢC GỠ KHÓA** (chuyển sang `ACTIVE` hoặc `HIDDEN`). Nếu Đối tác (Partner) cố tình gọi API gỡ khóa, hệ thống sẽ trả về mã lỗi **403 Forbidden**:
   ```json
   { "success": false, "message": "Địa điểm đang bị khóa (LOCKED), chỉ Quản trị viên mới có quyền mở khóa" }
   ```
2. **Khóa quán (`status = 'LOCKED'`)**: **CHỈ CÓ ADMIN MỚI ĐƯỢC KHÓA**. Nếu Partner cố tình khóa quán, hệ thống chặn với mã lỗi **403 Forbidden**:
   ```json
   { "success": false, "message": "Chỉ Quản trị viên mới có quyền khóa địa điểm" }
   ```
3. **Phân quyền Đối tác (Partner)**: Partner chỉ có quyền chuyển đổi trạng thái giữa `ACTIVE` và `HIDDEN` đối với **địa điểm thuộc quyền sở hữu của chính mình** (`place.partner_id === user.partner_id`). Partner không được sửa quán của người khác.
4. **Khách hàng thông thường (USER)**: Không có quyền truy cập vào các hàm hoặc API đổi trạng thái (chặn 403 Forbidden).

---

## 2. Cách 1: Gọi hàm TypeScript trực tiếp trong Backend (Service-to-Service)

Nếu Tín viết code backend xử lý logic nghiệp vụ trong server Express:

### Import hàm:
```typescript
import { updatePlaceStatus, type PlaceStatus, type UpdatePlaceStatusResult } from '../places';
// Hoặc import trực tiếp từ places.service:
// import { updatePlaceStatus } from '../places/places.service';
```

### Signature của hàm:
```typescript
export async function updatePlaceStatus(
  place_id: number,
  new_status: PlaceStatus, // 'ACTIVE' | 'HIDDEN' | 'PENDING' | 'LOCKED'
  user: { role: string; partner_id?: number }
): Promise<UpdatePlaceStatusResult>
```

### Ví dụ 1: Admin khóa quán vi phạm
```typescript
try {
  const result = await updatePlaceStatus(
    15, // place_id
    'LOCKED',
    { role: 'ADMIN' } // User payload của Admin
  );

  console.log(result.message); // "Khóa địa điểm \"Khách sạn Biển Đông\" thành công"
  console.log(result.data.status); // "LOCKED"
} catch (error: any) {
  console.error('Lỗi khóa quán:', error.message);
}
```

### Ví dụ 2: Admin mở khóa quán đã bị khóa
```typescript
const result = await updatePlaceStatus(
  15,
  'ACTIVE',
  { role: 'ADMIN' }
);
```

### Ví dụ 3: Partner tạm ẩn / mở lại cơ sở của mình
```typescript
const result = await updatePlaceStatus(
  15,
  'HIDDEN', // Hoặc 'ACTIVE'
  { role: 'PARTNER', partner_id: 3 } // Partner sở hữu cơ sở
);
```

---

## 3. Cách 2: Gọi qua HTTP REST API (Cho Frontend / Postman)

Hệ thống đã hỗ trợ cả 2 endpoint tương đương:

### Endpoint dành riêng cho Admin Dashboard:
- **Phương thức:** `PATCH` hoặc `PUT`
- **Đường dẫn:** `/api/admin/places/:id/status`
- **Header xác thực:**
  - Qua Cookie: `admin_access` (tự động đính kèm khi đăng nhập qua trình duyệt)
  - Hoặc qua Header: `Authorization: Bearer <admin_token>`

### Endpoint dùng chung (Admin & Partner):
- **Phương thức:** `PATCH` hoặc `PUT`
- **Đường dẫn:** `/api/places/:id/status`
- **Header xác thực:**
  - Qua Cookie: `admin_access` hoặc `access_token`
  - Hoặc qua Header: `Authorization: Bearer <token>`

### Request Body:
```json
{
  "status": "LOCKED"
}
```
*(Chấp nhận: `"ACTIVE"`, `"HIDDEN"`, `"PENDING"`, `"LOCKED"`)*

### Response thành công (HTTP 200 OK):
```json
{
  "success": true,
  "message": "Khóa địa điểm \"Bà Nà Hills\" thành công",
  "data": {
    "place_id": 1,
    "name": "Bà Nà Hills",
    "previous_status": "ACTIVE",
    "status": "LOCKED",
    "updated_at": "2026-10-20T14:50:00.000Z"
  }
}
```

### Response lỗi thường gặp:
- **HTTP 401 Unauthorized**: Chưa đăng nhập hoặc token hết hạn.
- **HTTP 403 Forbidden**: Partner cố gỡ quán `LOCKED`, hoặc Partner cố khóa quán, hoặc sửa quán người khác.
- **HTTP 404 Not Found**: ID địa điểm không tồn tại.
- **HTTP 400 Bad Request**: Trạng thái không nằm trong whitelist 4 trạng thái cho phép.

---

## 4. Cách 3: Tích hợp vào Frontend Next.js (Admin Dashboard)

Hàm client-side đã được tích hợp sẵn trong:
- [`frontend/lib/api/admin.ts`](file:///Users/tranvantu218/Documents/DANANGGOSMART/frontend/lib/api/admin.ts): `updateAdminPlaceStatus(placeId, status)`
- [`frontend/lib/api/places.ts`](file:///Users/tranvantu218/Documents/DANANGGOSMART/frontend/lib/api/places.ts): `updatePlaceStatus(placeId, status)`

### Code mẫu nút Khóa / Mở khóa trong React component:
```tsx
import { updateAdminPlaceStatus } from '@/lib/api/admin';

// Hàm xử lý khi Admin bấm nút "Khóa quán"
async function handleLockPlace(placeId: string) {
  try {
    const res = await updateAdminPlaceStatus(placeId, 'LOCKED');
    alert(res.message); // "Khóa địa điểm thành công"
    // reload danh sách
  } catch (err: any) {
    alert(err.message || 'Không thể khóa địa điểm');
  }
}

// Hàm xử lý khi Admin bấm nút "Mở khóa"
async function handleUnlockPlace(placeId: string) {
  try {
    const res = await updateAdminPlaceStatus(placeId, 'ACTIVE');
    alert(res.message); // "Kích hoạt địa điểm thành công"
  } catch (err: any) {
    alert(err.message || 'Không thể mở khóa');
  }
}
```

---

## 5. Tóm tắt nhanh thông số kỹ thuật

| Tiêu chí | Giá trị |
|---|---|
| **File Service** | `backend/src/modules/places/places.service.ts` |
| **Tên hàm** | `updatePlaceStatus(place_id, new_status, user)` |
| **Export tập trung** | `backend/src/modules/places/index.ts` |
| **Endpoint Admin** | `PATCH /api/admin/places/:id/status` |
| **Endpoint Partner** | `PATCH /api/places/:id/status` |
| **Ràng buộc khóa** | Địa điểm đang `LOCKED` chỉ Admin mới có quyền gỡ (Chặn Partner 403) |
