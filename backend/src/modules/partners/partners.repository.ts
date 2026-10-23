import { getPool, sql } from '../../config/db';

export type PartnerApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface PartnerProfileRow {
  partner_id: number;
  user_id: number;
  full_name: string;
  email: string;
  user_phone: string | null;
  business_name: string;
  service_type: string | null;
  tax_code: string | null;
  contact_phone: string | null;
  address: string | null;
  approval_status: PartnerApprovalStatus;
  created_at: Date;
  approved_by: number | null;
  reviewer_name: string | null;
  approved_at: Date | null;
  rejection_reason: string | null;
  account_status: string;
  admin_locked: boolean;
}

export async function listPartnerProfiles(status?: PartnerApprovalStatus): Promise<PartnerProfileRow[]> {
  const result = await getPool().request()
    .input('status', sql.VarChar(20), status ?? null)
    .query<PartnerProfileRow>(`
      SELECT pp.partner_id, pp.user_id, u.full_name, u.email, u.phone AS user_phone,
        pp.business_name, pp.service_type, pp.tax_code, pp.contact_phone, pp.address,
        pp.approval_status, pp.created_at, pp.approved_by,
        reviewer.full_name AS reviewer_name, pp.approved_at, pp.rejection_reason,
        u.status AS account_status, u.admin_locked
      FROM dbo.partner_profiles AS pp
      INNER JOIN dbo.users AS u ON u.user_id = pp.user_id
      LEFT JOIN dbo.users AS reviewer ON reviewer.user_id = pp.approved_by
      WHERE @status IS NULL OR pp.approval_status = @status
      ORDER BY CASE WHEN pp.approval_status = 'PENDING' THEN 0 ELSE 1 END,
        CASE WHEN pp.approval_status = 'PENDING' THEN pp.created_at END ASC,
        pp.created_at DESC;
    `);
  return result.recordset;
}

export type ReviewResult =
  | { outcome: 'NOT_FOUND' }
  | { outcome: 'NOT_PENDING'; currentStatus: string }
  | { outcome: 'UPDATED'; status: PartnerApprovalStatus; reviewedAt: Date };

export async function reviewPendingPartnerProfile(input: {
  partnerId: number;
  adminUserId: number;
  status: 'APPROVED' | 'REJECTED';
  reason: string | null;
}): Promise<ReviewResult> {
  const transaction = new sql.Transaction(getPool());
  await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  let finished = false;
  try {
    const selected = await new sql.Request(transaction)
      .input('partnerId', sql.Int, input.partnerId)
      .query<{ approval_status: string }>(`
        SELECT approval_status FROM dbo.partner_profiles WITH (UPDLOCK, HOLDLOCK)
        WHERE partner_id = @partnerId;
      `);
    const current = selected.recordset[0];
    if (!current) {
      await transaction.rollback();
      finished = true;
      return { outcome: 'NOT_FOUND' };
    }
    if (current.approval_status !== 'PENDING') {
      await transaction.rollback();
      finished = true;
      return { outcome: 'NOT_PENDING', currentStatus: current.approval_status };
    }

    const updated = await new sql.Request(transaction)
      .input('partnerId', sql.Int, input.partnerId)
      .input('adminUserId', sql.Int, input.adminUserId)
      .input('status', sql.VarChar(20), input.status)
      .input('reason', sql.NVarChar(500), input.reason)
      .query<{ approval_status: PartnerApprovalStatus; approved_at: Date }>(`
        UPDATE pp
        SET approval_status = @status,
            approved_by = @adminUserId,
            approved_at = SYSUTCDATETIME(),
            rejection_reason = @reason
        OUTPUT INSERTED.approval_status, INSERTED.approved_at
        FROM dbo.partner_profiles AS pp
        WHERE pp.partner_id = @partnerId AND pp.approval_status = 'PENDING';

        IF @status = 'APPROVED'
          UPDATE u SET status = CASE WHEN u.admin_locked = 1 THEN 'LOCKED' ELSE 'ACTIVE' END,
            failed_login_count = 0, locked_until = NULL
          FROM dbo.users AS u
          INNER JOIN dbo.partner_profiles AS profile ON profile.user_id = u.user_id
          WHERE profile.partner_id = @partnerId;

        IF @status = 'REJECTED'
          UPDATE u SET status = 'LOCKED', locked_until = NULL,
            failed_login_count = 0
          FROM dbo.users AS u
          INNER JOIN dbo.partner_profiles AS profile ON profile.user_id = u.user_id
          WHERE profile.partner_id = @partnerId;

        IF @status = 'REJECTED'
          UPDATE rt SET revoked_at = SYSUTCDATETIME()
          FROM dbo.refresh_tokens AS rt
          INNER JOIN dbo.partner_profiles AS profile ON profile.user_id = rt.user_id
          WHERE profile.partner_id = @partnerId AND rt.revoked_at IS NULL;
      `);
    const row = updated.recordset[0];
    if (!row) {
      await transaction.rollback();
      finished = true;
      return { outcome: 'NOT_PENDING', currentStatus: 'PROCESSED' };
    }
    await transaction.commit();
    finished = true;
    return { outcome: 'UPDATED', status: row.approval_status, reviewedAt: row.approved_at };
  } catch (error) {
    if (!finished) {
      try { await transaction.rollback(); } catch { /* keep the database error */ }
    }
    throw error;
  }
}

export type PartnerLockResult = { outcome: 'NOT_FOUND' } | { outcome: 'UPDATED'; accountStatus: 'ACTIVE' | 'LOCKED'; adminLocked: boolean };

export async function setPartnerAdminLock(partnerId: number, locked: boolean): Promise<PartnerLockResult> {
  const result = await getPool().request()
    .input('partnerId', sql.Int, partnerId)
    .input('locked', sql.Bit, locked)
    .query<{ user_id: number; account_status: 'ACTIVE' | 'LOCKED'; admin_locked: boolean }>(`
      UPDATE u
      SET admin_locked = @locked,
          status = CASE
            WHEN @locked = 1 THEN 'LOCKED'
            WHEN pp.approval_status = 'APPROVED' THEN 'ACTIVE'
            ELSE 'LOCKED'
          END,
          locked_until = NULL,
          failed_login_count = 0
      OUTPUT INSERTED.user_id, INSERTED.status AS account_status, INSERTED.admin_locked
      FROM dbo.users AS u
      INNER JOIN dbo.partner_profiles AS pp ON pp.user_id = u.user_id
      WHERE pp.partner_id = @partnerId;

      IF @locked = 1
        UPDATE rt SET revoked_at = SYSUTCDATETIME()
        FROM dbo.refresh_tokens AS rt
        INNER JOIN dbo.partner_profiles AS pp ON pp.user_id = rt.user_id
        WHERE pp.partner_id = @partnerId AND rt.revoked_at IS NULL;
    `);
  const row = result.recordset[0];
  return row
    ? { outcome: 'UPDATED', accountStatus: row.account_status, adminLocked: row.admin_locked }
    : { outcome: 'NOT_FOUND' };
}

export async function findApprovedPartnerProfileId(userId: number): Promise<number | null> {
  const result = await getPool().request()
    .input('userId', sql.Int, userId)
    .query<{ partner_id: number }>(`
      SELECT TOP (1) pp.partner_id
      FROM dbo.partner_profiles AS pp
      INNER JOIN dbo.users AS u ON u.user_id = pp.user_id
      WHERE pp.user_id = @userId AND pp.approval_status = 'APPROVED'
        AND u.status = 'ACTIVE' AND u.admin_locked = 0;
    `);
  return result.recordset[0]?.partner_id ?? null;
}
