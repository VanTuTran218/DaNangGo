import { getPool, sql } from '../../config/db';

export type OtpPurpose = 'verify_email' | 'reset_password';

export interface EmailVerificationRecord {
  id: number;
  user_id: number;
  code_hash: string;
  expires_at: Date;
  attempts: number;
  last_sent_at: Date;
  sent_count: number;
  window_start: Date;
  purpose: OtpPurpose;
}

/** Tìm bản ghi xác thực theo userId và purpose */
export async function findVerificationByUserId(
  userId: number,
  purpose: OtpPurpose = 'verify_email',
): Promise<EmailVerificationRecord | null> {
  const result = await getPool()
    .request()
    .input('userId', sql.Int, userId)
    .input('purpose', sql.VarChar(20), purpose)
    .query<EmailVerificationRecord>(`
      SELECT id, user_id, code_hash, expires_at, attempts,
             last_sent_at, sent_count, window_start, purpose
      FROM dbo.email_verifications
      WHERE user_id = @userId AND purpose = @purpose
    `);
  return result.recordset[0] ?? null;
}

/** Tìm userId theo email (dùng cho verify-email và resend-code) */
export async function findUserIdByEmail(
  email: string,
): Promise<{ user_id: number; full_name: string; email_verified: boolean } | null> {
  const result = await getPool()
    .request()
    .input('email', sql.VarChar(150), email)
    .query<{ user_id: number; full_name: string; email_verified: boolean }>(`
      SELECT user_id, full_name, email_verified
      FROM dbo.users
      WHERE email = @email
    `);
  return result.recordset[0] ?? null;
}

/**
 * Upsert bản ghi xác thực theo userId + purpose:
 * - Nếu chưa có: INSERT mới
 * - Nếu đã có: UPDATE code mới, reset attempts, cập nhật sent_count
 */
export async function upsertVerification(input: {
  userId: number;
  codeHash: string;
  expiresAt: Date;
  now: Date;
  purpose: OtpPurpose;
}): Promise<void> {
  await getPool()
    .request()
    .input('userId', sql.Int, input.userId)
    .input('codeHash', sql.VarChar(255), input.codeHash)
    .input('expiresAt', sql.DateTime2, input.expiresAt)
    .input('now', sql.DateTime2, input.now)
    .input('purpose', sql.VarChar(20), input.purpose)
    .query(`
      MERGE dbo.email_verifications AS target
      USING (SELECT @userId AS user_id, @purpose AS purpose) AS src
        ON target.user_id = src.user_id AND target.purpose = src.purpose
      WHEN MATCHED THEN
        UPDATE SET
          code_hash    = @codeHash,
          expires_at   = @expiresAt,
          attempts     = 0,
          last_sent_at = @now,
          window_start = CASE
            WHEN DATEDIFF(MINUTE, target.window_start, @now) >= 60
            THEN @now
            ELSE target.window_start
          END,
          sent_count = CASE
            WHEN DATEDIFF(MINUTE, target.window_start, @now) >= 60
            THEN 1
            ELSE target.sent_count + 1
          END
      WHEN NOT MATCHED THEN
        INSERT (user_id, code_hash, expires_at, attempts, last_sent_at, sent_count, window_start, purpose)
        VALUES (@userId, @codeHash, @expiresAt, 0, @now, 1, @now, @purpose);
    `);
}

/** Tăng số lần nhập sai */
export async function incrementAttempts(userId: number, purpose: OtpPurpose = 'verify_email'): Promise<number> {
  const result = await getPool()
    .request()
    .input('userId', sql.Int, userId)
    .input('purpose', sql.VarChar(20), purpose)
    .query<{ attempts: number }>(`
      UPDATE dbo.email_verifications
      SET attempts = attempts + 1
      OUTPUT INSERTED.attempts
      WHERE user_id = @userId AND purpose = @purpose
    `);
  return result.recordset[0]?.attempts ?? 0;
}

/** Xác thực email thành công: set email_verified = 1 và xóa bản ghi OTP */
export async function markEmailVerified(userId: number): Promise<void> {
  const transaction = new sql.Transaction(getPool());
  await transaction.begin();
  try {
    await new sql.Request(transaction)
      .input('userId', sql.Int, userId)
      .query(`UPDATE dbo.users SET email_verified = 1 WHERE user_id = @userId`);

    await new sql.Request(transaction)
      .input('userId', sql.Int, userId)
      .query(`DELETE FROM dbo.email_verifications WHERE user_id = @userId AND purpose = 'verify_email'`);

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

/** Xóa bản ghi OTP theo purpose (khi mã bị khóa do nhập sai quá nhiều) */
export async function deleteVerification(userId: number, purpose: OtpPurpose = 'verify_email'): Promise<void> {
  await getPool()
    .request()
    .input('userId', sql.Int, userId)
    .input('purpose', sql.VarChar(20), purpose)
    .query(`DELETE FROM dbo.email_verifications WHERE user_id = @userId AND purpose = @purpose`);
}
