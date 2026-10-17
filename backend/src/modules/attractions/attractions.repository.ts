import { getPool, sql } from '../../config/db';
import type { CreateAttractionDto, UpdateAttractionDto } from './attractions.validation';
import { createPlaceCommon } from '../places/places.service';

export interface AttractionRow {
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
  booking_url: string | null;
  avg_rating: number;
  review_count: number;
  view_count: number;
  promo_label: string | null;
  status: string;
  created_at: Date;
  updated_at: Date | null;
  category_id: number | null;
  category_name: string | null;
  ticket_price: number;
  visit_duration_minutes: number | null;
  cover_image: string | null;
}

/**
 * Kiểm tra district_id có tồn tại trong bảng districts
 */
export const checkDistrictExists = async (district_id: number): Promise<boolean> => {
  const pool = getPool();
  const result = await pool
    .request()
    .input('district_id', sql.Int, district_id)
    .query('SELECT 1 AS found FROM districts WHERE district_id = @district_id');
  return (result.recordset[0] as { found?: number } | undefined)?.found === 1;
};

/**
 * Kiểm tra category_id có tồn tại trong bảng attraction_categories
 */
export const checkCategoryExists = async (category_id: number): Promise<boolean> => {
  const pool = getPool();
  const result = await pool
    .request()
    .input('category_id', sql.Int, category_id)
    .query('SELECT 1 AS found FROM attraction_categories WHERE category_id = @category_id');
  return (result.recordset[0] as { found?: number } | undefined)?.found === 1;
};

/**
 * Tạo mới điểm du lịch (Transaction 2 bảng: places + attractions)
 * Tái sử dụng hàm dùng chung createPlaceCommon
 */
export const createAttractionTx = async (
  data: CreateAttractionDto
): Promise<AttractionRow> => {
  const pool = getPool();
  const transaction = pool.transaction();
  await transaction.begin();

  try {
    // Bước 1: Ghi vào bảng places bằng hàm dùng chung createPlaceCommon
    const place_id = await createPlaceCommon(
      {
        place_type: 'ATTRACTION',
        name: data.name,
        description: data.description,
        address: data.address,
        district_id: data.district_id,
        latitude: data.latitude,
        longitude: data.longitude,
        phone: data.phone,
        website: data.website,
        booking_url: data.booking_url,
        promo_label: data.promo_label,
        partner_id: null, // Điểm du lịch là tài nguyên công cộng của thành phố, do Admin quản lý
        status: 'ACTIVE',
      },
      transaction
    );

    // Bước 2: Ghi vào bảng attractions
    await transaction
      .request()
      .input('place_id', sql.Int, place_id)
      .input('category_id', sql.Int, data.category_id ?? null)
      .input('ticket_price', sql.Decimal(18, 0), data.ticket_price ?? 0)
      .input('visit_duration_minutes', sql.Int, data.visit_duration_minutes ?? null)
      .query(`
        INSERT INTO attractions (place_id, place_type, category_id, ticket_price, visit_duration_minutes)
        VALUES (@place_id, 'ATTRACTION', @category_id, @ticket_price, @visit_duration_minutes)
      `);

    await transaction.commit();

    const created = await findAttractionById(place_id);
    return created!;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

/**
 * Tìm 1 điểm du lịch theo ID (kèm thông tin quận và loại danh mục)
 */
export const findAttractionById = async (
  place_id: number
): Promise<AttractionRow | null> => {
  const pool = getPool();
  const result = await pool
    .request()
    .input('place_id', sql.Int, place_id)
    .query(`
      SELECT
        p.place_id, p.name, p.description, p.address,
        p.district_id, d.name AS district_name,
        p.latitude, p.longitude, p.phone, p.website, p.booking_url,
        p.avg_rating, p.review_count, p.view_count,
        p.promo_label, p.status, p.created_at, p.updated_at,
        a.category_id, ac.name AS category_name,
        a.ticket_price, a.visit_duration_minutes,
        (SELECT TOP 1 image_url FROM place_images
         WHERE place_id = p.place_id AND is_cover = 1) AS cover_image
      FROM places p
      INNER JOIN attractions a ON a.place_id = p.place_id
      LEFT JOIN districts d ON d.district_id = p.district_id
      LEFT JOIN attraction_categories ac ON ac.category_id = a.category_id
      WHERE p.place_id = @place_id AND p.place_type = 'ATTRACTION'
    `);

  const row = result.recordset[0] as AttractionRow | undefined;
  if (!row) return null;

  return {
    ...row,
    ticket_price: Number(row.ticket_price),
    avg_rating: Number(row.avg_rating),
  };
};

/**
 * Lấy danh sách điểm du lịch có lọc và phân trang
 */
export const findAllAttractions = async (
  offset: number,
  limit: number,
  district_id?: number,
  category_id?: number,
  keyword?: string,
  includeHidden: boolean = false
): Promise<{ rows: AttractionRow[]; total: number }> => {
  const pool = getPool();

  const baseWhere = `
    WHERE p.place_type = 'ATTRACTION'
      ${includeHidden ? '' : "AND p.status = 'ACTIVE'"}
      ${district_id ? 'AND p.district_id = @district_id' : ''}
      ${category_id ? 'AND a.category_id = @category_id' : ''}
      ${keyword ? 'AND (p.name LIKE @keyword OR p.address LIKE @keyword)' : ''}
  `;

  // 1. Đếm tổng số bản ghi
  const countReq = pool.request();
  if (district_id) countReq.input('district_id', sql.Int, district_id);
  if (category_id) countReq.input('category_id', sql.Int, category_id);
  if (keyword) countReq.input('keyword', sql.NVarChar(200), `%${keyword.trim()}%`);

  const countResult = await countReq.query(`
    SELECT COUNT(*) AS total
    FROM places p
    INNER JOIN attractions a ON a.place_id = p.place_id
    ${baseWhere}
  `);
  const total = (countResult.recordset[0] as { total: number }).total;

  // 2. Lấy dữ liệu phân trang
  const dataReq = pool
    .request()
    .input('offset', sql.Int, offset)
    .input('limit', sql.Int, limit);

  if (district_id) dataReq.input('district_id', sql.Int, district_id);
  if (category_id) dataReq.input('category_id', sql.Int, category_id);
  if (keyword) dataReq.input('keyword', sql.NVarChar(200), `%${keyword.trim()}%`);

  const dataResult = await dataReq.query(`
    SELECT
      p.place_id, p.name, p.description, p.address,
      p.district_id, d.name AS district_name,
      p.latitude, p.longitude, p.phone, p.website, p.booking_url,
      p.avg_rating, p.review_count, p.view_count,
      p.promo_label, p.status, p.created_at, p.updated_at,
      a.category_id, ac.name AS category_name,
      a.ticket_price, a.visit_duration_minutes,
      (SELECT TOP 1 image_url FROM place_images
       WHERE place_id = p.place_id AND is_cover = 1) AS cover_image
    FROM places p
    INNER JOIN attractions a ON a.place_id = p.place_id
    LEFT JOIN districts d ON d.district_id = p.district_id
    LEFT JOIN attraction_categories ac ON ac.category_id = a.category_id
    ${baseWhere}
    ORDER BY p.place_id DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `);

  const rows = (dataResult.recordset as AttractionRow[]).map((r) => ({
    ...r,
    ticket_price: Number(r.ticket_price),
    avg_rating: Number(r.avg_rating),
  }));

  return { rows, total };
};

/**
 * Cập nhật điểm du lịch (Transaction 2 bảng)
 */
export const updateAttractionTx = async (
  place_id: number,
  data: UpdateAttractionDto
): Promise<AttractionRow> => {
  const pool = getPool();
  const transaction = pool.transaction();
  await transaction.begin();

  try {
    // 1. Cập nhật bảng places
    const placeReq = transaction.request().input('place_id', sql.Int, place_id);
    const placeSets: string[] = ['updated_at = GETDATE()'];

    if (data.name !== undefined) {
      placeReq.input('name', sql.NVarChar(200), data.name.trim());
      placeSets.push('name = @name');
    }
    if (data.description !== undefined) {
      placeReq.input('description', sql.NVarChar(sql.MAX), data.description ? data.description.trim() : null);
      placeSets.push('description = @description');
    }
    if (data.address !== undefined) {
      placeReq.input('address', sql.NVarChar(255), data.address.trim());
      placeSets.push('address = @address');
    }
    if (data.district_id !== undefined) {
      placeReq.input('district_id', sql.Int, data.district_id);
      placeSets.push('district_id = @district_id');
    }
    if (data.latitude !== undefined) {
      placeReq.input('latitude', sql.Decimal(9, 6), data.latitude ?? null);
      placeSets.push('latitude = @latitude');
    }
    if (data.longitude !== undefined) {
      placeReq.input('longitude', sql.Decimal(9, 6), data.longitude ?? null);
      placeSets.push('longitude = @longitude');
    }
    if (data.phone !== undefined) {
      placeReq.input('phone', sql.VarChar(20), data.phone ? data.phone.trim() : null);
      placeSets.push('phone = @phone');
    }
    if (data.website !== undefined) {
      placeReq.input('website', sql.VarChar(255), data.website ? data.website.trim() : null);
      placeSets.push('website = @website');
    }
    if (data.booking_url !== undefined) {
      placeReq.input('booking_url', sql.NVarChar(500), data.booking_url ? data.booking_url.trim() : null);
      placeSets.push('booking_url = @booking_url');
    }
    if (data.promo_label !== undefined) {
      placeReq.input('promo_label', sql.NVarChar(50), data.promo_label ? data.promo_label.trim() : null);
      placeSets.push('promo_label = @promo_label');
    }

    await placeReq.query(`
      UPDATE places
      SET ${placeSets.join(', ')}
      WHERE place_id = @place_id AND place_type = 'ATTRACTION'
    `);

    // 2. Cập nhật bảng attractions
    const attrReq = transaction.request().input('place_id', sql.Int, place_id);
    const attrSets: string[] = [];

    if (data.category_id !== undefined) {
      attrReq.input('category_id', sql.Int, data.category_id ?? null);
      attrSets.push('category_id = @category_id');
    }
    if (data.ticket_price !== undefined) {
      attrReq.input('ticket_price', sql.Decimal(18, 0), data.ticket_price);
      attrSets.push('ticket_price = @ticket_price');
    }
    if (data.visit_duration_minutes !== undefined) {
      attrReq.input('visit_duration_minutes', sql.Int, data.visit_duration_minutes ?? null);
      attrSets.push('visit_duration_minutes = @visit_duration_minutes');
    }

    if (attrSets.length > 0) {
      await attrReq.query(`
        UPDATE attractions
        SET ${attrSets.join(', ')}
        WHERE place_id = @place_id
      `);
    }

    await transaction.commit();

    const updated = await findAttractionById(place_id);
    return updated!;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

/**
 * Ẩn điểm du lịch (Soft Delete: đổi status = HIDDEN, không xóa thật)
 */
export const softDeleteAttraction = async (place_id: number): Promise<void> => {
  const pool = getPool();
  await pool
    .request()
    .input('place_id', sql.Int, place_id)
    .query(`
      UPDATE places
      SET status = 'HIDDEN', updated_at = GETDATE()
      WHERE place_id = @place_id AND place_type = 'ATTRACTION'
    `);
};

/**
 * Tăng lượt xem (view_count) điểm du lịch (fire-and-forget)
 */
export const incrementAttractionViewCount = (place_id: number): void => {
  const pool = getPool();
  pool
    .request()
    .input('place_id', sql.Int, place_id)
    .query(`
      UPDATE places
      SET view_count = view_count + 1
      WHERE place_id = @place_id AND place_type = 'ATTRACTION'
    `)
    .catch((err) => {
      console.error('Lỗi tăng view_count điểm du lịch:', err);
    });
};
