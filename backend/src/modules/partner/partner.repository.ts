import { getPool, sql } from '../../config/db';

export interface PartnerProfileRow {
  partner_id: number;
  user_id: number;
  business_name: string;
  service_type: string | null;
  tax_code: string | null;
  address: string | null;
  contact_phone: string | null;
  approval_status: string;
  approved_by: number | null;
  approved_at: Date | null;
  rejection_reason: string | null;
  created_at: Date;
  email: string;
  full_name: string;
}

export interface PartnerPlaceRow {
  place_id: number;
  place_type?: string | null;
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
  accommodation_type?: string | null;
  star_rating?: number | null;
  acc_price_from?: number | null;
  images?: string[];
}

/** Lấy hồ sơ đối tác theo user_id */
export async function findPartnerProfileByUserId(userId: number): Promise<PartnerProfileRow | null> {
  const pool = getPool();
  const result = await pool
    .request()
    .input('userId', sql.Int, userId)
    .query<PartnerProfileRow>(`
      SELECT 
        pp.partner_id,
        pp.user_id,
        pp.business_name,
        pp.service_type,
        pp.tax_code,
        pp.address,
        pp.contact_phone,
        pp.approval_status,
        pp.approved_by,
        pp.approved_at,
        pp.rejection_reason,
        pp.created_at,
        u.email,
        u.full_name
      FROM dbo.partner_profiles pp
      JOIN dbo.users u ON u.user_id = pp.user_id
      WHERE pp.user_id = @userId
    `);

  return result.recordset[0] ?? null;
}

/** Lấy hồ sơ đối tác theo partner_id */
export async function findPartnerProfileById(partnerId: number): Promise<PartnerProfileRow | null> {
  const pool = getPool();
  const result = await pool
    .request()
    .input('partnerId', sql.Int, partnerId)
    .query<PartnerProfileRow>(`
      SELECT 
        pp.partner_id,
        pp.user_id,
        pp.business_name,
        pp.service_type,
        pp.tax_code,
        pp.address,
        pp.contact_phone,
        pp.approval_status,
        pp.approved_by,
        pp.approved_at,
        pp.rejection_reason,
        pp.created_at,
        u.email,
        u.full_name
      FROM dbo.partner_profiles pp
      JOIN dbo.users u ON u.user_id = pp.user_id
      WHERE pp.partner_id = @partnerId
    `);

  return result.recordset[0] ?? null;
}

/** Cập nhật thông tin hồ sơ doanh nghiệp */
export async function updatePartnerProfile(
  userId: number,
  data: {
    businessName?: string;
    serviceType?: string;
    taxCode?: string;
    address?: string;
    contactPhone?: string;
  }
): Promise<void> {
  const pool = getPool();
  const req = pool.request().input('userId', sql.Int, userId);

  const updates: string[] = [];
  if (data.businessName !== undefined) {
    req.input('businessName', sql.NVarChar(150), data.businessName);
    updates.push('business_name = @businessName');
  }
  if (data.serviceType !== undefined) {
    req.input('serviceType', sql.NVarChar(10), data.serviceType);
    updates.push('service_type = @serviceType');
  }
  if (data.taxCode !== undefined) {
    req.input('taxCode', sql.NVarChar(20), data.taxCode);
    updates.push('tax_code = @taxCode');
  }
  if (data.address !== undefined) {
    req.input('address', sql.NVarChar(255), data.address);
    updates.push('address = @address');
  }
  if (data.contactPhone !== undefined) {
    req.input('contactPhone', sql.VarChar(20), data.contactPhone);
    updates.push('contact_phone = @contactPhone');
  }

  if (updates.length === 0) return;

  await req.query(`
    UPDATE dbo.partner_profiles
    SET ${updates.join(', ')},
        approval_status = CASE WHEN approval_status = 'REJECTED' THEN 'PENDING' ELSE approval_status END,
        rejection_reason = CASE WHEN approval_status = 'REJECTED' THEN NULL ELSE rejection_reason END
    WHERE user_id = @userId
  `);
}

/** Lấy danh sách quán thuộc sở hữu của đối tác */
export async function findPlacesByPartnerId(
  partnerId: number,
  statusFilter?: string | null
): Promise<PartnerPlaceRow[]> {
  const pool = getPool();
  const req = pool.request().input('partnerId', sql.Int, partnerId);

  let statusClause = '';
  if (statusFilter && statusFilter !== 'ALL') {
    req.input('status', sql.VarChar(20), statusFilter);
    statusClause = 'AND p.status = @status';
  }

  const result = await req.query<PartnerPlaceRow>(`
    SELECT 
      p.place_id,
      p.place_type,
      p.name,
      p.description,
      p.address,
      p.district_id,
      d.name AS district_name,
      p.latitude,
      p.longitude,
      p.phone,
      p.website,
      p.booking_url,
      p.partner_id,
      p.avg_rating,
      p.review_count,
      p.view_count,
      p.promo_label,
      p.status,
      p.created_at,
      p.updated_at,
      r.cuisine_id,
      c.name AS cuisine_name,
      r.price_min,
      r.price_max,
      a.accommodation_type,
      a.star_rating,
      (SELECT MIN(rt.price_per_night) FROM dbo.room_types rt WHERE rt.place_id = p.place_id AND rt.status = 'ACTIVE') AS acc_price_from
    FROM places p
    LEFT JOIN restaurants r ON r.place_id = p.place_id
    LEFT JOIN accommodations a ON a.place_id = p.place_id
    LEFT JOIN districts d ON d.district_id = p.district_id
    LEFT JOIN cuisines c ON c.cuisine_id = r.cuisine_id
    WHERE p.partner_id = @partnerId
      ${statusClause}
    ORDER BY p.created_at DESC
  `);

  const places = result.recordset;
  if (places.length === 0) return [];

  // Lấy danh sách ảnh tương ứng
  const placeIds = places.map((p) => p.place_id);
  const imgResult = await pool.request().query<{ place_id: number; image_url: string }>(`
    SELECT place_id, image_url
    FROM place_images
    WHERE place_id IN (${placeIds.join(',')})
    ORDER BY is_cover DESC, image_id ASC
  `);

  const imageMap = new Map<number, string[]>();
  for (const img of imgResult.recordset) {
    const list = imageMap.get(img.place_id) || [];
    list.push(img.image_url);
    imageMap.set(img.place_id, list);
  }

  return places.map((p) => ({
    ...p,
    images: imageMap.get(p.place_id) || [],
  }));
}

/** Lấy chi tiết 1 cơ sở thuộc đối tác */
export async function findPlaceByPartnerAndPlaceId(
  partnerId: number,
  placeId: number
): Promise<PartnerPlaceRow | null> {
  const pool = getPool();
  const result = await pool
    .request()
    .input('partnerId', sql.Int, partnerId)
    .input('placeId', sql.Int, placeId)
    .query<PartnerPlaceRow>(`
      SELECT 
        p.place_id,
        p.place_type,
        p.name,
        p.description,
        p.address,
        p.district_id,
        d.name AS district_name,
        p.latitude,
        p.longitude,
        p.phone,
        p.website,
        p.booking_url,
        p.partner_id,
        p.avg_rating,
        p.review_count,
        p.view_count,
        p.promo_label,
        p.status,
        p.created_at,
        p.updated_at,
        r.cuisine_id,
        c.name AS cuisine_name,
        r.price_min,
        r.price_max,
        a.accommodation_type,
        a.star_rating,
        (SELECT MIN(rt.price_per_night) FROM dbo.room_types rt WHERE rt.place_id = p.place_id AND rt.status = 'ACTIVE') AS acc_price_from
      FROM places p
      LEFT JOIN restaurants r ON r.place_id = p.place_id
      LEFT JOIN accommodations a ON a.place_id = p.place_id
      LEFT JOIN districts d ON d.district_id = p.district_id
      LEFT JOIN cuisines c ON c.cuisine_id = r.cuisine_id
      WHERE p.partner_id = @partnerId AND p.place_id = @placeId
    `);

  const place = result.recordset[0];
  if (!place) return null;

  const imgResult = await pool
    .request()
    .input('placeId', sql.Int, placeId)
    .query<{ image_url: string }>(`
      SELECT image_url
      FROM place_images
      WHERE place_id = @placeId
      ORDER BY is_cover DESC, image_id ASC
    `);

  return {
    ...place,
    images: imgResult.recordset.map((r) => r.image_url),
  };
}

export interface PartnerDashboardStatsRow {
  totalPlaces: number;
  totalViews: number;
  totalBookings: number;
  avgRating: number;
}

export async function getPartnerDashboardStatsByPartnerId(partnerId: number): Promise<PartnerDashboardStatsRow> {
  const pool = getPool();
  const result = await pool
    .request()
    .input('partnerId', sql.Int, partnerId)
    .query<{
      total_places: number;
      total_views: number;
      total_bookings: number;
      avg_rating: number | null;
    }>(`
      SELECT
        (SELECT COUNT(*) FROM dbo.places WHERE partner_id = @partnerId) AS total_places,
        (SELECT COALESCE(SUM(view_count), 0) FROM dbo.places WHERE partner_id = @partnerId) AS total_views,
        (
          SELECT COUNT(*)
          FROM dbo.bookings b
          INNER JOIN dbo.places p ON p.place_id = b.place_id
          WHERE p.partner_id = @partnerId
        ) AS total_bookings,
        (
          SELECT AVG(CAST(r.rating AS FLOAT))
          FROM dbo.reviews r
          INNER JOIN dbo.places p ON p.place_id = r.place_id
          WHERE p.partner_id = @partnerId AND r.status = 'APPROVED'
        ) AS avg_rating
    `);

  const row = result.recordset[0];
  return {
    totalPlaces: Number(row?.total_places ?? 0),
    totalViews: Number(row?.total_views ?? 0),
    totalBookings: Number(row?.total_bookings ?? 0),
    avgRating: row?.avg_rating !== null && row?.avg_rating !== undefined ? Number(Number(row.avg_rating).toFixed(1)) : 0,
  };
}

export async function getPartnerDailyBookingsByPartnerId(
  partnerId: number
): Promise<{ date: string; count: number }[]> {
  const pool = getPool();
  const result = await pool
    .request()
    .input('partnerId', sql.Int, partnerId)
    .query<{ day_key: string; booking_count: number }>(`
      SELECT
        CONVERT(char(10), CAST(b.created_at AS date), 23) AS day_key,
        COUNT(*) AS booking_count
      FROM dbo.bookings b
      INNER JOIN dbo.places p ON p.place_id = b.place_id
      WHERE p.partner_id = @partnerId
        AND b.created_at >= DATEADD(DAY, -6, CAST(GETDATE() AS date))
      GROUP BY CAST(b.created_at AS date)
    `);

  const countMap = new Map<string, number>();
  for (const row of result.recordset) {
    countMap.set(row.day_key, Number(row.booking_count ?? 0));
  }

  const days: { date: string; count: number }[] = [];
  const now = new Date();
  for (let offset = 6; offset >= 0; offset -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - offset);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const key = `${yyyy}-${mm}-${dd}`;
    days.push({
      date: `${dd}/${mm}`,
      count: countMap.get(key) ?? 0,
    });
  }
  return days;
}

export interface PartnerBookingRow {
  booking_id: number;
  place_id: number;
  place_name: string;
  contact_name: string;
  contact_phone: string;
  user_email: string | null;
  total_amount: number;
  status: string;
  created_at: Date;
  visit_date: Date | null;
  num_guests: number | null;
  payment_method: string | null;
}

export async function findBookingsByPartnerId(
  partnerId: number,
  statusFilter?: string | null,
  search?: string | null
): Promise<PartnerBookingRow[]> {
  const pool = getPool();
  const req = pool.request().input('partnerId', sql.Int, partnerId);

  let whereClause = 'WHERE p.partner_id = @partnerId';
  if (statusFilter && statusFilter !== 'ALL') {
    req.input('status', sql.NVarChar(20), statusFilter);
    whereClause += ' AND UPPER(b.status) = UPPER(@status)';
  }
  if (search && search.trim()) {
    req.input('search', sql.NVarChar(120), `%${search.trim()}%`);
    whereClause += ` AND (
      b.contact_name LIKE @search
      OR b.contact_phone LIKE @search
      OR CONCAT('DNG-', RIGHT(CONCAT('000000', CAST(b.booking_id AS VARCHAR(20))), 6)) LIKE @search
    )`;
  }

  const result = await req.query<PartnerBookingRow>(`
    SELECT
      b.booking_id,
      b.place_id,
      p.name AS place_name,
      b.contact_name,
      b.contact_phone,
      u.email AS user_email,
      b.total_amount,
      b.status,
      b.created_at,
      (
        SELECT TOP (1) COALESCE(bi.check_in, bi.visit_date)
        FROM dbo.booking_items bi
        WHERE bi.booking_id = b.booking_id
        ORDER BY bi.item_id ASC
      ) AS visit_date,
      (
        SELECT TOP (1) COALESCE(bi.party_size, bi.quantity, 1)
        FROM dbo.booking_items bi
        WHERE bi.booking_id = b.booking_id
        ORDER BY bi.item_id ASC
      ) AS num_guests,
      (
        SELECT TOP (1) pay.method
        FROM dbo.payments pay
        WHERE pay.booking_id = b.booking_id
        ORDER BY pay.payment_id DESC
      ) AS payment_method
    FROM dbo.bookings b
    INNER JOIN dbo.places p ON p.place_id = b.place_id
    LEFT JOIN dbo.users u ON u.user_id = b.user_id
    ${whereClause}
    ORDER BY b.created_at DESC, b.booking_id DESC
  `);

  return result.recordset;
}

export async function updateBookingStatusByPartner(
  partnerId: number,
  bookingId: number,
  changedByUserId: number,
  nextStatus: string
): Promise<boolean> {
  const pool = getPool();
  const check = await pool
    .request()
    .input('partnerId', sql.Int, partnerId)
    .input('bookingId', sql.Int, bookingId)
    .query<{ booking_id: number; status: string }>(`
      SELECT b.booking_id, b.status
      FROM dbo.bookings b
      INNER JOIN dbo.places p ON p.place_id = b.place_id
      WHERE b.booking_id = @bookingId AND p.partner_id = @partnerId
    `);

  const row = check.recordset[0];
  if (!row) return false;

  await pool
    .request()
    .input('bookingId', sql.Int, bookingId)
    .input('nextStatus', sql.NVarChar(20), nextStatus)
    .query(`
      UPDATE dbo.bookings
      SET status = @nextStatus, updated_at = GETDATE()
      WHERE booking_id = @bookingId
    `);

  await pool
    .request()
    .input('bookingId', sql.Int, bookingId)
    .input('oldStatus', sql.NVarChar(20), row.status)
    .input('newStatus', sql.NVarChar(20), nextStatus)
    .input('changedBy', sql.Int, changedByUserId)
    .query(`
      INSERT INTO dbo.booking_status_logs (booking_id, old_status, new_status, changed_by, changed_at)
      VALUES (@bookingId, @oldStatus, @newStatus, @changedBy, GETDATE())
    `);

  return true;
}

