# HƯỚNG DẪN TÍCH HỢP HÀM DÙNG CHUNG `createPlaceCommon`
### Dành cho Tín (Module Lưu trú / Accommodations) - Dự án DaNangGo

> **Mục tiêu**: Tái sử dụng bảng cha `places` để ghi thông tin chung (tên, địa chỉ, quận, tọa độ GPS, số điện thoại, website, trạng thái...) khi tạo cơ sở lưu trú (Khách sạn / Homestay), tránh viết lặp code, đảm bảo tính toàn vẹn và hỗ trợ Transaction liên bảng.

---

## 1. Import hàm và kiểu dữ liệu

Tín có thể import trực tiếp từ module `places`:

```typescript
import { createPlaceCommon, CreatePlaceCommonDto } from '../places';
// Hoặc import từ service:
// import { createPlaceCommon, CreatePlaceCommonDto } from '../places/places.service';
import { getPool, sql } from '../../config/db';
```

---

## 2. Đặc tả các trường trong `CreatePlaceCommonDto`

| Trường | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc |
| :--- | :--- | :---: | :--- |
| `place_type` | `string` | **Có** | Luôn truyền `'ACCOMMODATION'` cho module Lưu trú. |
| `name` | `string` | **Có** | Tên khách sạn/homestay (tối đa 200 ký tự, không được để trống). |
| `description`| `string \| null` | Không | Giới thiệu chi tiết cơ sở lưu trú. |
| `address` | `string \| null` | Không | Địa chỉ số nhà, tên đường. |
| `district_id`| `number \| null` | Không | ID quận/huyện tại Đà Nẵng (1: Hải Châu, 2: Thanh Khê, 3: Sơn Trà, 4: Ngũ Hành Sơn, 5: Liên Chiểu, 6: Cẩm Lệ, 7: Hòa Vang, 8: Hoàng Sa). |
| `latitude` | `number \| null` | Không | Tọa độ vĩ độ GPS (-90 đến 90, vd: `16.0594`). |
| `longitude` | `number \| null` | Không | Tọa độ kinh độ GPS (-180 đến 180, vd: `108.2443`). |
| `phone` | `string \| null` | Không | Số điện thoại liên hệ (vd: `'02363999888'`). |
| `website` | `string \| null` | Không | Website đặt phòng hoặc fanpage. |
| `booking_url`| `string \| null` | Không | Link đặt phòng trực tuyến (phải bắt đầu bằng `http://` hoặc `https://`). |
| `partner_id` | `number \| null` | Không | ID của đối tác sở hữu (tài khoản Partner). |
| `promo_label`| `string \| null` | Không | Nhãn nổi bật (vd: `'Khách sạn 5 sao'`, `'Gần biển Mỹ Khê'`). |
| `status` | `string` | Không | Trạng thái (`'ACTIVE'`, `'HIDDEN'`, `'PENDING'`, `'LOCKED'`). Mặc định là `'ACTIVE'`. |

---

## 3. Cách sử dụng

### Cách 1: Sử dụng kèm `sql.Transaction` (Khuyến nghị chuẩn 100%)
Khi tạo cơ sở lưu trú, cần ghi vào 2 bảng:
1. Bảng cha: `places` (thông qua `createPlaceCommon`)
2. Bảng con: `accommodations` (thông qua Transaction)

Nếu bảng `accommodations` gặp lỗi, toàn bộ thao tác sẽ được `rollback()`, không sinh ra bản ghi "rác" trong bảng `places`.

```typescript
import { getPool, sql } from '../../config/db';
import { createPlaceCommon, CreatePlaceCommonDto } from '../places';

export interface CreateAccommodationDto extends CreatePlaceCommonDto {
  accommodation_type: 'HOTEL' | 'HOMESTAY';
  star_rating?: number; // 1 đến 5 sao
  check_in_time?: string; // vd: '14:00'
  check_out_time?: string; // vd: '12:00'
  accepts_cash?: boolean;
  accepts_bank_transfer?: boolean;
}

export async function createAccommodationTx(dto: CreateAccommodationDto): Promise<number> {
  const pool = getPool();
  const tx = new sql.Transaction(pool);

  await tx.begin();

  try {
    // Bước 1: Ghi vào bảng cha places bằng hàm dùng chung
    const place_id = await createPlaceCommon(
      {
        place_type: 'ACCOMMODATION',
        name: dto.name,
        description: dto.description,
        address: dto.address,
        district_id: dto.district_id,
        latitude: dto.latitude,
        longitude: dto.longitude,
        phone: dto.phone,
        website: dto.website,
        booking_url: dto.booking_url,
        partner_id: dto.partner_id,
        promo_label: dto.promo_label,
        status: dto.status ?? 'ACTIVE',
      },
      tx // <--- QUAN TRỌNG: Truyền đối tượng tx vào đây
    );

    // Bước 2: Ghi vào bảng con accommodations
    await tx
      .request()
      .input('place_id', sql.Int, place_id)
      .input('place_type', sql.VarChar(20), 'ACCOMMODATION')
      .input('accommodation_type', sql.VarChar(20), dto.accommodation_type)
      .input('star_rating', sql.TinyInt, dto.star_rating ?? null)
      .input('check_in_time', sql.VarChar(10), dto.check_in_time ?? '14:00')
      .input('check_out_time', sql.VarChar(10), dto.check_out_time ?? '12:00')
      .input('accepts_cash', sql.Bit, dto.accepts_cash !== false ? 1 : 0)
      .input('accepts_bank_transfer', sql.Bit, dto.accepts_bank_transfer ? 1 : 0)
      .query(`
        INSERT INTO accommodations
          (place_id, place_type, accommodation_type, star_rating, check_in_time, check_out_time, accepts_cash, accepts_bank_transfer)
        VALUES
          (@place_id, @place_type, @accommodation_type, @star_rating, @check_in_time, @check_out_time, @accepts_cash, @accepts_bank_transfer)
      `);

    // Commit toàn bộ giao dịch
    await tx.commit();
    return place_id;
  } catch (error) {
    // Nếu có bất kỳ lỗi nào, hoàn tác ngay lập tức
    await tx.rollback();
    throw error;
  }
}
```

---

### Cách 2: Sử dụng Đơn giản (Standalone - không cần transaction)
Nếu bạn chỉ muốn tạo nhanh một địa điểm mà không cần quản lý Transaction:

```typescript
const place_id = await createPlaceCommon({
  place_type: 'ACCOMMODATION',
  name: 'Khách sạn DaNang Seaside Luxury',
  address: '120 Võ Nguyên Giáp, Sơn Trà',
  district_id: 3,
  status: 'ACTIVE'
});
console.log('Tạo thành công với place_id:', place_id);
```

---

## 4. Ràng buộc & Xử lý ngoại lệ (Validation)

Hàm `createPlaceCommon` đã được tích hợp bộ kiểm tra phòng thủ:
- Nếu `name` rỗng hoặc chỉ có khoảng trắng ➔ Báo lỗi `Tên địa điểm (name) là bắt buộc và không được để trống`.
- Nếu `place_type` không nằm trong `RESTAURANT`, `ATTRACTION`, `ACCOMMODATION` ➔ Báo lỗi `Loại địa điểm không hợp lệ`.
- Nếu `status` truyền giá trị lạ ➔ Báo lỗi `Trạng thái (status) không hợp lệ`.
- Nếu `latitude` ngoài [-90, 90] hoặc `longitude` ngoài [-180, 180] ➔ Báo lỗi tọa độ.
- Nếu `booking_url` không bắt đầu bằng `http://` hoặc `https://` ➔ Báo lỗi định dạng URL.
