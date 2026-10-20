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
export async function createPlace(data: Omit<Place, 'place_id' | 'created_at'>, partnerProfileId: number): Promise<Place> {
  const pool = getPool();
  const placeType = data.category === 'luutru'
    ? 'ACCOMMODATION'
    : data.category === 'amthuc'
      ? 'RESTAURANT'
      : data.category === 'diemdulich'
        ? 'ATTRACTION'
        : null;
  if (!placeType) throw new Error('Loại hình địa điểm không hợp lệ.');
  const result = await pool
    .request()
    .input('name', sql.NVarChar(100), data.name)
    .input('description', sql.NVarChar(sql.MAX), data.description || null)
    .input('address', sql.NVarChar(255), data.address || null)
    .input('placeType', sql.VarChar(20), placeType)
    .input('partnerId', sql.Int, partnerProfileId)
    .query(`
      INSERT INTO dbo.places
        (place_type, name, description, address, partner_id, avg_rating, review_count, view_count, status, created_at)
      OUTPUT INSERTED.*
      VALUES (@placeType, @name, @description, @address, @partnerId, 0, 0, 0, 'PENDING', SYSUTCDATETIME())
    `);

  return result.recordset[0];
}
