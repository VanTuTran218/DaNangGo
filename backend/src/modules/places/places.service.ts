import { getPool, sql } from '../../config/db';
import * as placesRepo from './places.repository';
import type { SearchPlacesQuery, PlaceType, PlaceDetailResponseDto } from './places.validation';
import type {
  PlaceSearchItem,
  SearchPlacesResult,
  PlaceDetail,
  PlaceImage,
  PlaceOpeningHour,
  AccommodationFilterHook,
} from './places.repository';

export type { PlaceType, PlaceDetailResponseDto } from './places.validation';
export type {
  PlaceSearchItem,
  SearchPlacesResult,
  PlaceDetail,
  PlaceImage,
  PlaceOpeningHour,
  AccommodationFilterHook,
} from './places.repository';
export { setAccommodationFilterHook } from './places.repository';


export type PlaceStatus = 'ACTIVE' | 'HIDDEN' | 'PENDING' | 'LOCKED';

// Interface tương thích ngược
export interface Place {
  place_id: number;
  name: string;
  description?: string;
  address?: string;
  category?: string;
  rating?: number;
  created_at?: Date;
}

export interface CreatePlaceCommonDto {
  /** Loại địa điểm: Bắt buộc ('RESTAURANT' | 'ATTRACTION' | 'ACCOMMODATION') */
  place_type: PlaceType;
  /** Tên địa điểm: Bắt buộc (tối đa 200 ký tự) */
  name: string;
  /** Mô tả chi tiết */
  description?: string | null;
  /** Địa chỉ chi tiết */
  address?: string | null;
  /** ID quận/huyện thuộc Đà Nẵng (1..8) */
  district_id?: number | null;
  /** Tọa độ vĩ độ (-90 đến 90) */
  latitude?: number | null;
  /** Tọa độ kinh độ (-180 đến 180) */
  longitude?: number | null;
  /** Số điện thoại liên hệ */
  phone?: string | null;
  /** Website chính thức */
  website?: string | null;
  /** URL đặt bàn / đặt phòng trực tuyến (phải bắt đầu bằng http:// hoặc https://) */
  booking_url?: string | null;
  /** ID đối tác sở hữu (nếu là đối tác tạo) */
  partner_id?: number | null;
  /** Nhãn khuyến mãi / nổi bật (ví dụ: 'Đặc sản số 1', 'Khách sạn ven biển') */
  promo_label?: string | null;
  /** Trạng thái hiển thị (Mặc định: 'ACTIVE') */
  status?: PlaceStatus;
}

/**
 * Lấy danh sách địa điểm có lọc, tìm kiếm và phân trang
 * (API dùng chung cho cả Nhà hàng, Lưu trú, Điểm du lịch)
 */
export async function getPlaces(
  query: SearchPlacesQuery,
  includeHidden: boolean = false
): Promise<SearchPlacesResult> {
  return await placesRepo.searchPlaces(query, includeHidden);
}

export interface CurrentUserPayload {
  id?: number;
  role: string;
  partner_id?: number;
}

/**
 * Lấy chi tiết 1 địa điểm theo ID (kèm ảnh, lịch mở cửa, thực đơn/khẩu vị, giá vé, lưu trú)
 * Theo đúng 7 yêu cầu Task 6:
 * - Nếu không tồn tại hoặc ở trạng thái HIDDEN, LOCKED, PENDING với người dùng thường -> trả về 404 Not Found
 * - Admin hoặc Partner sở hữu cơ sở được phép xem địa điểm ở mọi trạng thái
 * - Tự động tăng lượt xem (view_count) theo cơ chế fire-and-forget
 */
export async function getPlaceDetail(
  id: number,
  user?: CurrentUserPayload
): Promise<PlaceDetail> {
  const place = await placesRepo.findPlaceById(id);
  if (!place) {
    throw { status: 404, message: 'Không tìm thấy địa điểm' };
  }

  // Kiểm tra quyền xem theo trạng thái:
  // Nếu địa điểm không ở trạng thái ACTIVE (tức HIDDEN, LOCKED, PENDING):
  // Chỉ Admin hoặc Partner sở hữu quán mới có quyền xem. Người dùng thường/khách nhận 404.
  if (place.status !== 'ACTIVE') {
    const isAdmin = user?.role === 'ADMIN';
    const isOwnerPartner =
      user?.role === 'PARTNER' &&
      user.partner_id !== undefined &&
      user.partner_id !== null &&
      place.partner_id !== null &&
      user.partner_id === place.partner_id;

    if (!isAdmin && !isOwnerPartner) {
      throw { status: 404, message: 'Không tìm thấy địa điểm' };
    }
  }

  // Tăng lượt xem (fire-and-forget, không làm gián đoạn response)
  placesRepo.incrementPlaceViewCount(id);

  return place;
}


/**
 * Lấy tất cả địa điểm (hàm tương thích ngược với code cũ)
 */
export async function getAllPlaces(): Promise<PlaceSearchItem[]> {
  const result = await placesRepo.searchPlaces({ page: 1, limit: 50 }, true);
  return result.items;
}

/**
 * Lấy địa điểm theo ID (hàm tương thích ngược với code cũ)
 */
export async function getPlaceById(id: number): Promise<PlaceDetail | null> {
  return await placesRepo.findPlaceById(id);
}

/**
 * Tạo địa điểm mới (hàm tương thích ngược với code cũ)
 */
export async function createPlace(data: Omit<Place, 'place_id' | 'created_at'>): Promise<Place> {
  const pool = getPool();
  const result = await pool
    .request()
    .input('name', sql.NVarChar(255), data.name)
    .input('description', sql.NVarChar(sql.MAX), data.description || null)
    .input('address', sql.NVarChar(500), data.address || null)
    .input('category', sql.NVarChar(100), data.category || null)
    .query(`
      INSERT INTO places (place_type, name, description, address, status, created_at)
      OUTPUT INSERTED.place_id, INSERTED.name, INSERTED.description, INSERTED.address, INSERTED.status, INSERTED.created_at
      VALUES ('ATTRACTION', @name, @description, @address, 'ACTIVE', GETDATE())
    `);

  return result.recordset[0];
}

/**
 * Hàm ghi `places` dùng chung cho tất cả các loại địa điểm (Nhà hàng, Lưu trú, Điểm du lịch)
 * - Hỗ trợ truyền sql.Transaction để dùng trong transaction liên bảng (places + restaurants, places + accommodations...)
 * - Nếu không truyền runner, sẽ dùng getPool() mặc định.
 * - Trả về place_id vừa tạo.
 */
export async function createPlaceCommon(
  data: CreatePlaceCommonDto,
  runner?: sql.Transaction | sql.ConnectionPool
): Promise<number> {
  // 1. Kiểm tra validation phòng thủ trước khi ghi vào Database
  if (!data || typeof data !== 'object') {
    throw new Error('Dữ liệu địa điểm không hợp lệ (data is required)');
  }

  const trimmedName = data.name ? data.name.trim() : '';
  if (!trimmedName) {
    throw new Error('Tên địa điểm (name) là bắt buộc và không được để trống');
  }

  if (!data.place_type || !['RESTAURANT', 'ATTRACTION', 'ACCOMMODATION'].includes(data.place_type)) {
    throw new Error(
      `Loại địa điểm (place_type) không hợp lệ: "${data.place_type}". Phải là RESTAURANT, ATTRACTION hoặc ACCOMMODATION.`
    );
  }

  const validStatuses: PlaceStatus[] = ['ACTIVE', 'HIDDEN', 'PENDING', 'LOCKED'];
  const status: PlaceStatus = data.status ?? 'ACTIVE';
  if (!validStatuses.includes(status)) {
    throw new Error(
      `Trạng thái (status) không hợp lệ: "${status}". Phải là một trong: ${validStatuses.join(', ')}.`
    );
  }

  if (data.latitude !== undefined && data.latitude !== null) {
    if (data.latitude < -90 || data.latitude > 90) {
      throw new Error(`Tọa độ vĩ độ (latitude) phải nằm trong [-90, 90]. Nhận được: ${data.latitude}`);
    }
  }

  if (data.longitude !== undefined && data.longitude !== null) {
    if (data.longitude < -180 || data.longitude > 180) {
      throw new Error(`Tọa độ kinh độ (longitude) phải nằm trong [-180, 180]. Nhận được: ${data.longitude}`);
    }
  }

  if (data.booking_url && !data.booking_url.startsWith('http://') && !data.booking_url.startsWith('https://')) {
    throw new Error('URL đặt chỗ (booking_url) phải bắt đầu bằng http:// hoặc https://');
  }

  // 2. Thực thi ghi dữ liệu vào bảng places
  const executor = runner ?? getPool();
  const request = executor.request();

  const result = await request
    .input('place_type', sql.VarChar(20), data.place_type)
    .input('name', sql.NVarChar(200), trimmedName)
    .input('description', sql.NVarChar(sql.MAX), data.description ? data.description.trim() : null)
    .input('address', sql.NVarChar(255), data.address ? data.address.trim() : null)
    .input('district_id', sql.Int, data.district_id ?? null)
    .input('latitude', sql.Decimal(9, 6), data.latitude ?? null)
    .input('longitude', sql.Decimal(9, 6), data.longitude ?? null)
    .input('phone', sql.VarChar(20), data.phone ? data.phone.trim() : null)
    .input('website', sql.VarChar(255), data.website ? data.website.trim() : null)
    .input('booking_url', sql.NVarChar(500), data.booking_url ? data.booking_url.trim() : null)
    .input('partner_id', sql.Int, data.partner_id ?? null)
    .input('promo_label', sql.NVarChar(50), data.promo_label ? data.promo_label.trim() : null)
    .input('status', sql.VarChar(20), status)
    .query<{ place_id: number }>(`
      INSERT INTO places
        (place_type, name, description, address, district_id, latitude, longitude,
         phone, website, booking_url, partner_id, avg_rating, review_count, view_count,
         promo_label, status, created_at)
      OUTPUT INSERTED.place_id
      VALUES
        (@place_type, @name, @description, @address, @district_id, @latitude, @longitude,
         @phone, @website, @booking_url, @partner_id, 0, 0, 0,
         @promo_label, @status, GETDATE())
    `);

  return result.recordset[0].place_id;
}

/**
 * Cập nhật trạng thái địa điểm (dùng cho Admin và Partner/Tin)
 * - Địa điểm đang LOCKED chỉ Admin mới được gỡ.
 * - Chỉ Admin mới có quyền đổi sang trạng thái LOCKED.
 * - Partner chỉ được đổi trạng thái địa điểm của mình (khi không bị LOCKED).
 */
export async function updatePlaceStatus(
  place_id: number,
  new_status: PlaceStatus,
  user: { role: string; partner_id?: number }
): Promise<{ success: boolean; message: string }> {
  const pool = getPool();

  const existingRes = await pool
    .request()
    .input('place_id', sql.Int, place_id)
    .query('SELECT place_id, partner_id, status FROM places WHERE place_id = @place_id');

  const place = existingRes.recordset[0];
  if (!place) {
    throw { status: 404, message: 'Không tìm thấy địa điểm' };
  }

  // Quán đang LOCKED chỉ Admin mới được gỡ
  if (place.status === 'LOCKED' && user.role !== 'ADMIN') {
    throw { status: 403, message: 'Địa điểm đang bị khóa (LOCKED), chỉ Quản trị viên mới có quyền mở khóa' };
  }

  // Chỉ Admin mới được set sang LOCKED
  if (new_status === 'LOCKED' && user.role !== 'ADMIN') {
    throw { status: 403, message: 'Chỉ Quản trị viên mới có quyền khóa địa điểm' };
  }

  // Partner chỉ được sửa địa điểm của mình
  if (user.role !== 'ADMIN' && place.partner_id !== user.partner_id) {
    throw { status: 403, message: 'Bạn không có quyền thay đổi trạng thái địa điểm này' };
  }

  await pool
    .request()
    .input('place_id', sql.Int, place_id)
    .input('status', sql.VarChar(20), new_status)
    .query('UPDATE places SET status = @status, updated_at = GETDATE() WHERE place_id = @place_id');

  return { success: true, message: `Cập nhật trạng thái địa điểm thành ${new_status} thành công` };
}
