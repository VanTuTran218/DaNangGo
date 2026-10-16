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
    if (!partner || partner.approval_status !== 'PENDING_APPROVAL') {
      await transaction.rollback();
      return false;
    }

    await new sql.Request(transaction)
      .input('partnerId', sql.Int, partnerId)
      .input('adminUserId', sql.Int, adminUserId)
      .query(`
        UPDATE dbo.partner_profiles
        SET approval_status = 'ACTIVE',
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
