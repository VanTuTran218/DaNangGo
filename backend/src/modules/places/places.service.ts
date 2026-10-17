import { getPool, sql } from '../../config/db';

// Kiểu dữ liệu (tùy chỉnh theo bảng trong DB của bạn)
export interface Place {
  place_id: number;
  name: string;
  description?: string;
  address?: string;
  category?: string;
  rating?: number;
  created_at?: Date;
}

/**
 * Lấy tất cả địa điểm
 */
export async function getAllPlaces(): Promise<Place[]> {
  const pool = getPool();
  const result = await pool.request().query('SELECT * FROM Places');
  return result.recordset;
}

/**
 * Lấy địa điểm theo ID
 */
export async function getPlaceById(id: number): Promise<Place | null> {
  const pool = getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, id)
    .query('SELECT * FROM Places WHERE place_id = @id');

  return result.recordset[0] || null;
}

/**
 * Tạo địa điểm mới
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

export type PlaceType = 'RESTAURANT' | 'ACCOMMODATION' | 'ATTRACTION';
export type PlaceStatus = 'ACTIVE' | 'HIDDEN' | 'PENDING' | 'LOCKED';

export interface CreatePlaceCommonDto {
  place_type: PlaceType;
  name: string;
  description?: string | null;
  address?: string | null;
  district_id?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  website?: string | null;
  booking_url?: string | null;
  partner_id?: number | null;
  promo_label?: string | null;
  status?: PlaceStatus;
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
  const executor = runner ?? getPool();
  const request = executor.request();

  const status = data.status ?? 'ACTIVE';

  const result = await request
    .input('place_type', sql.VarChar(20), data.place_type)
    .input('name', sql.NVarChar(200), data.name.trim())
    .input('description', sql.NVarChar(sql.MAX), data.description ?? null)
    .input('address', sql.NVarChar(255), data.address ? data.address.trim() : null)
    .input('district_id', sql.Int, data.district_id ?? null)
    .input('latitude', sql.Decimal(9, 6), data.latitude ?? null)
    .input('longitude', sql.Decimal(9, 6), data.longitude ?? null)
    .input('phone', sql.VarChar(20), data.phone ? data.phone.trim() : null)
    .input('website', sql.VarChar(255), data.website ? data.website.trim() : null)
    .input('booking_url', sql.NVarChar(500), data.booking_url ? data.booking_url.trim() : null)
    .input('partner_id', sql.Int, data.partner_id ?? null)
    .input('promo_label', sql.NVarChar(50), data.promo_label ?? null)
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

