import { getPool, sql } from '../../config/db';
import type { CreateRestaurantDto, UpdateRestaurantDto } from './restaurants.validation';

// ─── Kiểu dữ liệu trả về ─────────────────────────────────────────────────────

export interface RestaurantRow {
  place_id: number;
  name: string;
  description: string | null;
  address: string | null;
  district_id: number | null;
  district_name: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  website: string | null;
  partner_id: number | null;
  avg_rating: number;
  review_count: number;
  view_count: number;
  promo_label: string | null;
  status: string;
  created_at: Date;
  updated_at: Date | null;
  cuisine_id: number | null;
  cuisine_name: string | null;
  price_min: number | null;
  price_max: number | null;
  cover_image: string | null;
}

// ─── 1. Kiểm tra sự tồn tại của FK ──────────────────────────────────────────

export const checkDistrictExists = async (district_id: number): Promise<boolean> => {
  const pool = getPool();
  const result = await pool
    .request()
    .input('district_id', sql.Int, district_id)
    .query('SELECT 1 AS found FROM districts WHERE district_id = @district_id');
  return (result.recordset[0] as { found?: number } | undefined)?.found === 1;
};

export const checkCuisineExists = async (cuisine_id: number): Promise<boolean> => {
  const pool = getPool();
  const result = await pool
    .request()
    .input('cuisine_id', sql.Int, cuisine_id)
    .query('SELECT 1 AS found FROM cuisines WHERE cuisine_id = @cuisine_id');
  return (result.recordset[0] as { found?: number } | undefined)?.found === 1;
};

// ─── 2. Tạo nhà hàng (Transaction 2 bảng) ───────────────────────────────────

export const createRestaurantTx = async (
  data: CreateRestaurantDto,
  partner_id: number
): Promise<RestaurantRow> => {
  const pool = getPool();
  const transaction = pool.transaction();
  await transaction.begin();

  try {
    // Bước 1: INSERT vào places
    const placeResult = await transaction
      .request()
      .input('name', sql.NVarChar(200), data.name.trim())
      .input('description', sql.NVarChar(sql.MAX), data.description ?? null)
      .input('address', sql.NVarChar(255), data.address.trim())
      .input('district_id', sql.Int, data.district_id)
      .input('latitude', sql.Decimal(9, 6), data.latitude ?? null)
      .input('longitude', sql.Decimal(9, 6), data.longitude ?? null)
      .input('phone', sql.VarChar(20), data.phone ?? null)
      .input('website', sql.VarChar(255), data.website ?? null)
      .input('partner_id', sql.Int, partner_id)
      .input('promo_label', sql.NVarChar(50), data.promo_label ?? null)
      .query(`
        INSERT INTO places
          (place_type, name, description, address, district_id, latitude, longitude,
           phone, website, partner_id, avg_rating, review_count, view_count,
           promo_label, status, created_at)
        OUTPUT INSERTED.place_id
        VALUES
          ('RESTAURANT', @name, @description, @address, @district_id, @latitude, @longitude,
           @phone, @website, @partner_id, 0, 0, 0,
           @promo_label, 'ACTIVE', GETDATE())
      `);

    const place_id = (placeResult.recordset[0] as { place_id: number }).place_id;

    // Bước 2: INSERT vào restaurants
    await transaction
      .request()
      .input('place_id', sql.Int, place_id)
      .input('cuisine_id', sql.Int, data.cuisine_id ?? null)
      .input('price_min', sql.Decimal(18, 0), data.price_min ?? null)
      .input('price_max', sql.Decimal(18, 0), data.price_max ?? null)
      .query(`
        INSERT INTO restaurants (place_id, place_type, cuisine_id, price_min, price_max)
        VALUES (@place_id, 'RESTAURANT', @cuisine_id, @price_min, @price_max)
      `);

    await transaction.commit();

    // Trả về bản ghi vừa tạo
    const created = await findRestaurantById(place_id);
    return created!;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

// ─── 3. Tìm nhà hàng theo ID ─────────────────────────────────────────────────

export const findRestaurantById = async (
  place_id: number
): Promise<RestaurantRow | null> => {
  const pool = getPool();
  const result = await pool
    .request()
    .input('place_id', sql.Int, place_id)
    .query(`
      SELECT
        p.place_id, p.name, p.description, p.address,
        p.district_id, d.name AS district_name,
        p.latitude, p.longitude, p.phone, p.website,
        p.partner_id, p.avg_rating, p.review_count, p.view_count,
        p.promo_label, p.status, p.created_at, p.updated_at,
        r.cuisine_id, c.name AS cuisine_name,
        r.price_min, r.price_max,
        (SELECT TOP 1 image_url FROM place_images
         WHERE place_id = p.place_id AND is_cover = 1) AS cover_image
      FROM places p
      JOIN restaurants r ON r.place_id = p.place_id
      LEFT JOIN districts d ON d.district_id = p.district_id
      LEFT JOIN cuisines c ON c.cuisine_id = r.cuisine_id
      WHERE p.place_id = @place_id AND p.place_type = 'RESTAURANT'
    `);

  return (result.recordset[0] as RestaurantRow | undefined) ?? null;
};

// ─── 4. Danh sách nhà hàng (có phân trang) ───────────────────────────────────

export const findAllRestaurants = async (
  offset: number,
  limit: number,
  district_id?: number,
  cuisine_id?: number,
  keyword?: string
): Promise<{ rows: RestaurantRow[]; total: number }> => {
  const pool = getPool();

  const baseWhere = `
    WHERE p.place_type = 'RESTAURANT'
      AND p.status != 'HIDDEN'
      ${district_id ? 'AND p.district_id = @district_id' : ''}
      ${cuisine_id ? 'AND r.cuisine_id = @cuisine_id' : ''}
      ${keyword ? 'AND p.name LIKE @keyword' : ''}
  `;

  const req = pool.request()
    .input('offset', sql.Int, offset)
    .input('limit', sql.Int, limit);

  if (district_id) req.input('district_id', sql.Int, district_id);
  if (cuisine_id) req.input('cuisine_id', sql.Int, cuisine_id);
  if (keyword) req.input('keyword', sql.NVarChar(200), `%${keyword}%`);

  const countResult = await req.query(`
    SELECT COUNT(*) AS total
    FROM places p
    JOIN restaurants r ON r.place_id = p.place_id
    ${baseWhere}
  `);
  const total = (countResult.recordset[0] as { total: number }).total;

  const dataReq = pool.request()
    .input('offset', sql.Int, offset)
    .input('limit', sql.Int, limit);

  if (district_id) dataReq.input('district_id', sql.Int, district_id);
  if (cuisine_id) dataReq.input('cuisine_id', sql.Int, cuisine_id);
  if (keyword) dataReq.input('keyword', sql.NVarChar(200), `%${keyword}%`);

  const dataResult = await dataReq.query(`
    SELECT
      p.place_id, p.name, p.description, p.address,
      p.district_id, d.name AS district_name,
      p.latitude, p.longitude, p.phone, p.website,
      p.partner_id, p.avg_rating, p.review_count, p.view_count,
      p.promo_label, p.status, p.created_at, p.updated_at,
      r.cuisine_id, c.name AS cuisine_name,
      r.price_min, r.price_max,
      (SELECT TOP 1 image_url FROM place_images
       WHERE place_id = p.place_id AND is_cover = 1) AS cover_image
    FROM places p
    JOIN restaurants r ON r.place_id = p.place_id
    LEFT JOIN districts d ON d.district_id = p.district_id
    LEFT JOIN cuisines c ON c.cuisine_id = r.cuisine_id
    ${baseWhere}
    ORDER BY p.created_at DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `);

  return { rows: dataResult.recordset as RestaurantRow[], total };
};

// ─── 5. Cập nhật nhà hàng ────────────────────────────────────────────────────

export const updateRestaurantTx = async (
  place_id: number,
  data: UpdateRestaurantDto
): Promise<void> => {
  const pool = getPool();
  const transaction = pool.transaction();
  await transaction.begin();

  try {
    await transaction
      .request()
      .input('place_id', sql.Int, place_id)
      .input('name', sql.NVarChar(200), data.name ?? null)
      .input('description', sql.NVarChar(sql.MAX), data.description ?? null)
      .input('address', sql.NVarChar(255), data.address ?? null)
      .input('district_id', sql.Int, data.district_id ?? null)
      .input('latitude', sql.Decimal(9, 6), data.latitude ?? null)
      .input('longitude', sql.Decimal(9, 6), data.longitude ?? null)
      .input('phone', sql.VarChar(20), data.phone ?? null)
      .input('website', sql.VarChar(255), data.website ?? null)
      .input('promo_label', sql.NVarChar(50), data.promo_label ?? null)
      .query(`
        UPDATE places SET
          name        = COALESCE(@name, name),
          description = COALESCE(@description, description),
          address     = COALESCE(@address, address),
          district_id = COALESCE(@district_id, district_id),
          latitude    = COALESCE(@latitude, latitude),
          longitude   = COALESCE(@longitude, longitude),
          phone       = COALESCE(@phone, phone),
          website     = COALESCE(@website, website),
          promo_label = COALESCE(@promo_label, promo_label),
          updated_at  = GETDATE()
        WHERE place_id = @place_id
      `);

    await transaction
      .request()
      .input('place_id', sql.Int, place_id)
      .input('cuisine_id', sql.Int, data.cuisine_id ?? null)
      .input('price_min', sql.Decimal(18, 0), data.price_min ?? null)
      .input('price_max', sql.Decimal(18, 0), data.price_max ?? null)
      .query(`
        UPDATE restaurants SET
          cuisine_id = COALESCE(@cuisine_id, cuisine_id),
          price_min  = COALESCE(@price_min, price_min),
          price_max  = COALESCE(@price_max, price_max)
        WHERE place_id = @place_id
      `);

    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

// ─── 6. Xóa mềm ─────────────────────────────────────────────────────────────

export const softDeleteRestaurant = async (place_id: number): Promise<void> => {
  const pool = getPool();
  await pool
    .request()
    .input('place_id', sql.Int, place_id)
    .query(`
      UPDATE places
      SET status = 'HIDDEN', updated_at = GETDATE()
      WHERE place_id = @place_id
    `);
};

// ─── 7. Tăng view_count (fire-and-forget) ───────────────────────────────────

export const incrementViewCount = (place_id: number): void => {
  const pool = getPool();
  pool
    .request()
    .input('place_id', sql.Int, place_id)
    .query('UPDATE places SET view_count = view_count + 1 WHERE place_id = @place_id')
    .catch((err) => console.error('Lỗi tăng view_count:', err));
};
