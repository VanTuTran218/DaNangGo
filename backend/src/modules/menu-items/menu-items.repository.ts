import { getPool, sql } from '../../config/db';
import type { CreateMenuItemDto, UpdateMenuItemDto } from './menu-items.validation';

export interface TasteItem {
  taste_id: number;
  name: string;
}

export interface MenuItemRow {
  menu_item_id: number;
  place_id: number;
  name: string;
  description: string | null;
  price: number;
  is_available: boolean;
  image_url: string | null;
  updated_at: Date | null;
  tastes: TasteItem[];
}

export interface MenuItemContext {
  menu_item_id: number;
  place_id: number;
  price: number;
  is_available: boolean;
  partner_id: number | null;
  place_status: string;
}

/**
 * Lấy danh sách món ăn theo nhà hàng (place_id)
 * @param place_id ID của nhà hàng
 * @param onlyAvailable true: chỉ lấy món đang bán, false: lấy tất cả
 */
export async function findMenuItemsByPlaceId(
  place_id: number,
  onlyAvailable: boolean = true
): Promise<MenuItemRow[]> {
  const pool = getPool();
  const request = pool.request().input('place_id', sql.Int, place_id);

  let query = `
    SELECT menu_item_id, place_id, name, description, price, is_available, image_url, updated_at
    FROM menu_items
    WHERE place_id = @place_id
  `;
  if (onlyAvailable) {
    query += ' AND is_available = 1';
  }
  query += ' ORDER BY menu_item_id ASC';

  const result = await request.query(query);
  const items = result.recordset as Omit<MenuItemRow, 'tastes'>[];

  if (items.length === 0) return [];

  // Lấy danh sách khẩu vị cho tất cả các món ăn vừa tìm thấy
  const itemIds = items.map((i) => i.menu_item_id);
  const tastesResult = await pool.request().query<{
    menu_item_id: number;
    taste_id: number;
    taste_name: string;
  }>(`
    SELECT mit.menu_item_id, t.taste_id, t.name AS taste_name
    FROM menu_item_tastes mit
    INNER JOIN tastes t ON t.taste_id = mit.taste_id
    WHERE mit.menu_item_id IN (${itemIds.join(',')})
    ORDER BY t.name ASC
  `);

  const tasteMap = new Map<number, TasteItem[]>();
  for (const row of tastesResult.recordset) {
    if (!tasteMap.has(row.menu_item_id)) {
      tasteMap.set(row.menu_item_id, []);
    }
    tasteMap.get(row.menu_item_id)!.push({
      taste_id: row.taste_id,
      name: row.taste_name,
    });
  }

  return items.map((item) => ({
    ...item,
    price: Number(item.price),
    is_available: Boolean(item.is_available),
    tastes: tasteMap.get(item.menu_item_id) || [],
  }));
}

/**
 * Tìm 1 món ăn theo ID kèm danh sách khẩu vị
 */
export async function findMenuItemById(menu_item_id: number): Promise<MenuItemRow | null> {
  const pool = getPool();
  const result = await pool
    .request()
    .input('menu_item_id', sql.Int, menu_item_id)
    .query(`
      SELECT menu_item_id, place_id, name, description, price, is_available, image_url, updated_at
      FROM menu_items
      WHERE menu_item_id = @menu_item_id
    `);

  const item = result.recordset[0];
  if (!item) return null;

  const tastesResult = await pool
    .request()
    .input('menu_item_id', sql.Int, menu_item_id)
    .query<{ taste_id: number; name: string }>(`
      SELECT t.taste_id, t.name
      FROM menu_item_tastes mit
      INNER JOIN tastes t ON t.taste_id = mit.taste_id
      WHERE mit.menu_item_id = @menu_item_id
      ORDER BY t.name ASC
    `);

  return {
    ...item,
    price: Number(item.price),
    is_available: Boolean(item.is_available),
    tastes: tastesResult.recordset,
  };
}

/**
 * Lấy thông tin ngữ cảnh của món ăn (thuộc quán nào, chủ sở hữu là ai, trạng thái quán)
 */
export async function findMenuItemContext(menu_item_id: number): Promise<MenuItemContext | null> {
  const pool = getPool();
  const result = await pool
    .request()
    .input('menu_item_id', sql.Int, menu_item_id)
    .query<MenuItemContext>(`
      SELECT mi.menu_item_id, mi.place_id, mi.price, mi.is_available,
             p.partner_id, p.status AS place_status
      FROM menu_items mi
      INNER JOIN places p ON p.place_id = mi.place_id
      WHERE mi.menu_item_id = @menu_item_id
    `);

  return result.recordset[0] || null;
}

/**
 * Kiểm tra các taste_ids có tồn tại trong DB không
 */
export async function checkTastesExist(taste_ids: number[]): Promise<boolean> {
  if (!taste_ids || taste_ids.length === 0) return true;
  const pool = getPool();
  const result = await pool.request().query<{ total: number }>(`
    SELECT COUNT(taste_id) AS total
    FROM tastes
    WHERE taste_id IN (${taste_ids.join(',')})
  `);
  return result.recordset[0]?.total === taste_ids.length;
}

/**
 * 🔥 TỰ ĐỘNG TÍNH LẠI KHOẢNG GIÁ: Cập nhật price_min và price_max của nhà hàng từ các món còn bán
 */
export async function recalculateRestaurantPriceRange(
  place_id: number,
  runner?: sql.Transaction | sql.ConnectionPool
): Promise<{ min_price: number | null; max_price: number | null }> {
  const executor = runner ?? getPool();

  // 1. Quét tìm MIN và MAX từ các món is_available = 1
  const rangeResult = await executor
    .request()
    .input('place_id', sql.Int, place_id)
    .query<{ min_price: number | null; max_price: number | null }>(`
      SELECT MIN(price) AS min_price, MAX(price) AS max_price
      FROM menu_items
      WHERE place_id = @place_id AND is_available = 1
    `);

  const min_price = rangeResult.recordset[0]?.min_price !== null ? Number(rangeResult.recordset[0]?.min_price) : null;
  const max_price = rangeResult.recordset[0]?.max_price !== null ? Number(rangeResult.recordset[0]?.max_price) : null;

  // 2. Cập nhật lại vào bảng restaurants
  await executor
    .request()
    .input('place_id', sql.Int, place_id)
    .input('price_min', sql.Decimal(18, 0), min_price)
    .input('price_max', sql.Decimal(18, 0), max_price)
    .query(`
      UPDATE restaurants
      SET price_min = @price_min, price_max = @price_max
      WHERE place_id = @place_id
    `);

  return { min_price, max_price };
}

/**
 * Thêm món ăn mới kèm khẩu vị và tự động tính lại khoảng giá của nhà hàng
 */
export async function createMenuItemTx(
  place_id: number,
  data: CreateMenuItemDto
): Promise<MenuItemRow> {
  const pool = getPool();
  const tx = pool.transaction();
  await tx.begin();

  try {
    const is_available = data.is_available !== undefined ? (data.is_available ? 1 : 0) : 1;

    // 1. INSERT vào menu_items
    const insertResult = await tx
      .request()
      .input('place_id', sql.Int, place_id)
      .input('name', sql.NVarChar(150), data.name.trim())
      .input('description', sql.NVarChar(500), data.description ? data.description.trim() : null)
      .input('price', sql.Decimal(18, 0), data.price)
      .input('is_available', sql.Bit, is_available)
      .input('image_url', sql.VarChar(255), data.image_url ? data.image_url.trim() : null)
      .query<{ menu_item_id: number }>(`
        INSERT INTO menu_items (place_id, name, description, price, is_available, image_url, updated_at)
        OUTPUT INSERTED.menu_item_id
        VALUES (@place_id, @name, @description, @price, @is_available, @image_url, GETDATE())
      `);

    const menu_item_id = insertResult.recordset[0].menu_item_id;

    // 2. INSERT vào bảng nối menu_item_tastes nếu có
    if (data.taste_ids && data.taste_ids.length > 0) {
      for (const taste_id of data.taste_ids) {
        await tx
          .request()
          .input('menu_item_id', sql.Int, menu_item_id)
          .input('taste_id', sql.Int, taste_id)
          .query(`
            INSERT INTO menu_item_tastes (menu_item_id, taste_id)
            VALUES (@menu_item_id, @taste_id)
          `);
      }
    }

    // 3. Tự động tính lại khoảng giá của nhà hàng
    await recalculateRestaurantPriceRange(place_id, tx);

    await tx.commit();

    const created = await findMenuItemById(menu_item_id);
    return created!;
  } catch (err) {
    await tx.rollback();
    throw err;
  }
}

/**
 * Cập nhật món ăn và tự động tính lại khoảng giá
 */
export async function updateMenuItemTx(
  menu_item_id: number,
  place_id: number,
  data: UpdateMenuItemDto
): Promise<MenuItemRow> {
  const pool = getPool();
  const tx = pool.transaction();
  await tx.begin();

  try {
    // 1. Cập nhật các trường thông tin của món
    const req = tx.request().input('menu_item_id', sql.Int, menu_item_id);
    const setClauses: string[] = ['updated_at = GETDATE()'];

    if (data.name !== undefined) {
      req.input('name', sql.NVarChar(150), data.name.trim());
      setClauses.push('name = @name');
    }
    if (data.description !== undefined) {
      req.input('description', sql.NVarChar(500), data.description ? data.description.trim() : null);
      setClauses.push('description = @description');
    }
    if (data.price !== undefined) {
      req.input('price', sql.Decimal(18, 0), data.price);
      setClauses.push('price = @price');
    }
    if (data.is_available !== undefined) {
      req.input('is_available', sql.Bit, data.is_available ? 1 : 0);
      setClauses.push('is_available = @is_available');
    }
    if (data.image_url !== undefined) {
      req.input('image_url', sql.VarChar(255), data.image_url ? data.image_url.trim() : null);
      setClauses.push('image_url = @image_url');
    }

    await req.query(`
      UPDATE menu_items
      SET ${setClauses.join(', ')}
      WHERE menu_item_id = @menu_item_id
    `);

    // 2. Cập nhật khẩu vị nếu có truyền
    if (data.taste_ids !== undefined) {
      await tx
        .request()
        .input('menu_item_id', sql.Int, menu_item_id)
        .query('DELETE FROM menu_item_tastes WHERE menu_item_id = @menu_item_id');

      for (const taste_id of data.taste_ids) {
        await tx
          .request()
          .input('menu_item_id', sql.Int, menu_item_id)
          .input('taste_id', sql.Int, taste_id)
          .query(`
            INSERT INTO menu_item_tastes (menu_item_id, taste_id)
            VALUES (@menu_item_id, @taste_id)
          `);
      }
    }

    // 3. Tự động tính lại khoảng giá của nhà hàng
    await recalculateRestaurantPriceRange(place_id, tx);

    await tx.commit();

    const updated = await findMenuItemById(menu_item_id);
    return updated!;
  } catch (err) {
    await tx.rollback();
    throw err;
  }
}

/**
 * Ẩn món ăn (soft delete: is_available = 0) và tự động tính lại khoảng giá
 */
export async function softDeleteMenuItemTx(
  menu_item_id: number,
  place_id: number
): Promise<void> {
  const pool = getPool();
  const tx = pool.transaction();
  await tx.begin();

  try {
    await tx
      .request()
      .input('menu_item_id', sql.Int, menu_item_id)
      .query(`
        UPDATE menu_items
        SET is_available = 0, updated_at = GETDATE()
        WHERE menu_item_id = @menu_item_id
      `);

    // Tự động tính lại khoảng giá từ các món còn bán
    await recalculateRestaurantPriceRange(place_id, tx);

    await tx.commit();
  } catch (err) {
    await tx.rollback();
    throw err;
  }
}
