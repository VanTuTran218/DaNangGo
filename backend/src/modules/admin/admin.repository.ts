import { getPool, sql } from '../../config/db';

export interface AdminPartnerRecord {
  partner_id: number;
  user_id: number;
  public_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  business_name: string;
  service_type: string;
  tax_code: string | null;
  address: string | null;
  approval_status: 'PENDING_APPROVAL' | 'ACTIVE' | 'REJECTED' | 'LOCKED';
  created_at: Date;
  approved_at: Date | null;
}

/** Lấy danh sách partner theo approval_status (null = tất cả) */
export async function listPartners(
  status: string | null,
  limit = 50,
  offset = 0,
): Promise<{ records: AdminPartnerRecord[]; total: number }> {
  const pool = getPool();

  const whereClause = status
    ? `WHERE pp.approval_status = @status`
    : `WHERE 1=1`;

  const countResult = await pool
    .request()
    .input('status', sql.VarChar(30), status)
    .query<{ total: number }>(`
      SELECT COUNT(*) AS total
      FROM dbo.partner_profiles pp
      JOIN dbo.users u ON u.user_id = pp.user_id
      ${whereClause}
    `);

  const records = await pool
    .request()
    .input('status', sql.VarChar(30), status)
    .input('limit', sql.Int, limit)
    .input('offset', sql.Int, offset)
    .query<AdminPartnerRecord>(`
      SELECT
        pp.partner_id,
        pp.user_id,
        u.public_id,
        u.full_name,
        u.email,
        u.phone,
        pp.business_name,
        pp.service_type,
        pp.tax_code,
        pp.address,
        pp.approval_status,
        pp.created_at,
        pp.approved_at
      FROM dbo.partner_profiles pp
      JOIN dbo.users u ON u.user_id = pp.user_id
      ${whereClause}
      ORDER BY pp.created_at DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

  return {
    records: records.recordset,
    total: countResult.recordset[0]?.total ?? 0,
  };
}

/** Duyệt partner: đặt approval_status = ACTIVE, users.status = ACTIVE */
export async function approvePartner(
  partnerId: number,
  adminUserId: number,
): Promise<boolean> {
  const transaction = new sql.Transaction(getPool());
  await transaction.begin();
  try {
    // Lấy user_id của partner
    const partnerResult = await new sql.Request(transaction)
      .input('partnerId', sql.Int, partnerId)
      .query<{ user_id: number; approval_status: string }>(
        `SELECT user_id, approval_status FROM dbo.partner_profiles WHERE partner_id = @partnerId`,
      );

    const partner = partnerResult.recordset[0];
    if (!partner || (partner.approval_status !== 'PENDING_APPROVAL' && partner.approval_status !== 'PENDING')) {
      await transaction.rollback();
      return false;
    }

    await new sql.Request(transaction)
      .input('partnerId', sql.Int, partnerId)
      .input('adminUserId', sql.Int, adminUserId)
      .query(`
        UPDATE dbo.partner_profiles
        SET approval_status = 'APPROVED',
            approved_by = @adminUserId,
            approved_at = GETDATE()
        WHERE partner_id = @partnerId
      `);

    await new sql.Request(transaction)
      .input('userId', sql.Int, partner.user_id)
      .query(`UPDATE dbo.users SET status = 'ACTIVE' WHERE user_id = @userId`);

    await transaction.commit();
    return true;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

/** Từ chối partner: đặt approval_status = REJECTED, users.status = REJECTED */
export async function rejectPartner(
  partnerId: number,
  adminUserId: number,
): Promise<boolean> {
  const transaction = new sql.Transaction(getPool());
  await transaction.begin();
  try {
    const partnerResult = await new sql.Request(transaction)
      .input('partnerId', sql.Int, partnerId)
      .query<{ user_id: number; approval_status: string }>(
        `SELECT user_id, approval_status FROM dbo.partner_profiles WHERE partner_id = @partnerId`,
      );

    const partner = partnerResult.recordset[0];
    if (!partner) {
      await transaction.rollback();
      return false;
    }

    await new sql.Request(transaction)
      .input('partnerId', sql.Int, partnerId)
      .input('adminUserId', sql.Int, adminUserId)
      .query(`
        UPDATE dbo.partner_profiles
        SET approval_status = 'REJECTED',
            approved_by = @adminUserId,
            approved_at = GETDATE()
        WHERE partner_id = @partnerId
      `);

    await new sql.Request(transaction)
      .input('userId', sql.Int, partner.user_id)
      .query(`UPDATE dbo.users SET status = 'REJECTED' WHERE user_id = @userId`);

    await transaction.commit();
    return true;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

/** Lấy email và tên user theo partner_id (để gửi email thông báo) */
export async function getPartnerContact(
  partnerId: number,
): Promise<{ email: string; full_name: string; business_name: string } | null> {
  const result = await getPool()
    .request()
    .input('partnerId', sql.Int, partnerId)
    .query<{ email: string; full_name: string; business_name: string }>(`
      SELECT u.email, u.full_name, pp.business_name
      FROM dbo.partner_profiles pp
      JOIN dbo.users u ON u.user_id = pp.user_id
      WHERE pp.partner_id = @partnerId
    `);
  return result.recordset[0] ?? null;
}

export interface AdminPlaceItemRecord {
  id: string;
  name: string;
  category: 'luutru' | 'amthuc' | 'diemdulich';
  partnerId?: string;
  partnerName?: string;
  address: string;
  priceText: string;
  status: 'PENDING' | 'APPROVED' | 'ACTIVE' | 'REJECTED' | 'HIDDEN' | 'LOCKED';
  createdAt: string;
  rating: number;
  reviewCount: number;
  imageUrl: string;
}

/** Lấy danh sách địa điểm cho Admin Portal (kèm đối tác sở hữu và ảnh đại diện) */
export async function listAdminPlaces(params: {
  category?: string;
  status?: string;
  search?: string;
}): Promise<AdminPlaceItemRecord[]> {
  const pool = getPool();
  const whereClauses: string[] = ['1=1'];
  const request = pool.request();

  if (params.search && params.search.trim() !== '') {
    whereClauses.push('(p.name LIKE @search OR p.address LIKE @search)');
    request.input('search', sql.NVarChar(200), `%${params.search.trim()}%`);
  }

  if (params.category && params.category !== 'ALL') {
    if (params.category === 'amthuc') {
      whereClauses.push("p.place_type = 'RESTAURANT'");
    } else if (params.category === 'luutru') {
      whereClauses.push("p.place_type = 'ACCOMMODATION'");
    } else if (params.category === 'diemdulich') {
      whereClauses.push("p.place_type = 'ATTRACTION'");
    }
  }

  if (params.status && params.status !== 'ALL') {
    if (params.status === 'APPROVED' || params.status === 'ACTIVE') {
      whereClauses.push("p.status IN ('ACTIVE', 'APPROVED')");
    } else if (params.status === 'PENDING') {
      whereClauses.push("p.status = 'PENDING'");
    } else if (params.status === 'HIDDEN') {
      whereClauses.push("p.status = 'HIDDEN'");
    } else if (params.status === 'LOCKED') {
      whereClauses.push("p.status = 'LOCKED'");
    }
  }

  const query = `
    SELECT 
      p.place_id,
      p.name,
      p.place_type,
      p.address,
      p.status,
      p.partner_id,
      p.avg_rating,
      p.review_count,
      p.created_at,
      pp.business_name AS partner_name,
      r.price_min,
      r.price_max,
      (
        SELECT TOP 1 image_url 
        FROM place_images 
        WHERE place_id = p.place_id 
        ORDER BY is_cover DESC, image_id ASC
      ) AS image_url
    FROM places p
    LEFT JOIN partner_profiles pp ON p.partner_id = pp.partner_id
    LEFT JOIN restaurants r ON p.place_id = r.place_id
    WHERE ${whereClauses.join(' AND ')}
    ORDER BY p.created_at DESC, p.place_id DESC
  `;

  const result = await request.query<any>(query);

  return result.recordset.map((row) => {
    let cat: 'luutru' | 'amthuc' | 'diemdulich' = 'amthuc';
    if (row.place_type === 'ACCOMMODATION') cat = 'luutru';
    else if (row.place_type === 'ATTRACTION') cat = 'diemdulich';

    let priceText = 'Liên hệ';
    if (row.price_min && row.price_max) {
      priceText = `${Number(row.price_min).toLocaleString('vi-VN')} - ${Number(row.price_max).toLocaleString('vi-VN')} VNĐ`;
    } else if (row.price_min) {
      priceText = `Từ ${Number(row.price_min).toLocaleString('vi-VN')} VNĐ`;
    }

    return {
      id: String(row.place_id),
      name: row.name,
      category: cat,
      partnerId: row.partner_id ? String(row.partner_id) : undefined,
      partnerName: row.partner_name || 'Hệ thống DanangGo',
      address: row.address || 'Đà Nẵng',
      priceText,
      status: (row.status === 'ACTIVE' ? 'APPROVED' : row.status) as any,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      rating: Number(row.avg_rating) || 5.0,
      reviewCount: Number(row.review_count) || 0,
      imageUrl: row.image_url || (cat === 'luutru' 
        ? 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80'
        : 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80'),
    };
  });
}

/** Xóa mềm địa điểm cho Admin */
export async function deleteAdminPlace(placeId: number): Promise<boolean> {
  const pool = getPool();
  await pool.request().input('id', sql.Int, placeId).query(`
    UPDATE places SET status = 'HIDDEN', updated_at = GETDATE() WHERE place_id = @id
  `);
  return true;
}
