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
      INSERT INTO Places (name, description, address, category)
      OUTPUT INSERTED.*
      VALUES (@name, @description, @address, @category)
    `);

  return result.recordset[0];
}
