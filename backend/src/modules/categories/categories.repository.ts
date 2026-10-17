import { getPool } from '../../config/db';

export interface CategoryItem {
  id: number;
  name: string;
}

/**
 * Lấy danh sách quận/huyện, sắp xếp theo tên
 */
export async function findDistricts(): Promise<CategoryItem[]> {
  const pool = getPool();
  const result = await pool.request().query(`
    SELECT district_id AS id, name
    FROM districts
    ORDER BY name ASC
  `);
  return result.recordset as CategoryItem[];
}

/**
 * Lấy danh sách loại hình ẩm thực, sắp xếp theo tên
 */
export async function findCuisines(): Promise<CategoryItem[]> {
  const pool = getPool();
  const result = await pool.request().query(`
    SELECT cuisine_id AS id, name
    FROM cuisines
    ORDER BY name ASC
  `);
  return result.recordset as CategoryItem[];
}

/**
 * Lấy danh sách khẩu vị món ăn, sắp xếp theo tên
 */
export async function findTastes(): Promise<CategoryItem[]> {
  const pool = getPool();
  const result = await pool.request().query(`
    SELECT taste_id AS id, name
    FROM tastes
    ORDER BY name ASC
  `);
  return result.recordset as CategoryItem[];
}

/**
 * Lấy danh mục điểm du lịch/tham quan, sắp xếp theo tên
 */
export async function findAttractionCategories(): Promise<CategoryItem[]> {
  const pool = getPool();
  const result = await pool.request().query(`
    SELECT category_id AS id, name
    FROM attraction_categories
    ORDER BY name ASC
  `);
  return result.recordset as CategoryItem[];
}
