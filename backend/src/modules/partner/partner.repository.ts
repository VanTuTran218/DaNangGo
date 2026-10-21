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
  created_at: Date;
  email: string;
  full_name: string;
}

export interface PartnerPlaceRow {
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
    SET ${updates.join(', ')}
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
      r.price_max
    FROM places p
    LEFT JOIN restaurants r ON r.place_id = p.place_id
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
        r.price_max
      FROM places p
      LEFT JOIN restaurants r ON r.place_id = p.place_id
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
