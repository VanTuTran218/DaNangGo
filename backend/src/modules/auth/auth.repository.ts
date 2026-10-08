import { getPool, sql } from '../../config/db';

export type AccountRole = 'USER' | 'PARTNER' | 'ADMIN';

export interface AuthAccountRecord {
  user_id: number;
  public_id: string;
  role_id: number;
  role_name: string;
  full_name: string;
  email: string;
  phone: string | null;
  password_hash: string;
  status: string;
  email_verified: boolean;
  failed_login_count: number;
  locked_until: Date | null;
  created_at: Date;
  approval_status: string | null;
}

export interface ExistingAdminAccount {
  role_id: number;
  role_name: string;
  public_id: string;
}

export interface ResetAccount {
  user_id: number;
  role_name: string;
  email: string;
  full_name: string;
}

const accountSelect = `
  SELECT u.user_id, u.public_id, u.role_id, r.role_name, u.full_name,
    u.email, u.phone, u.password_hash, u.status, u.email_verified,
    u.failed_login_count, u.locked_until, u.created_at,
    pp.approval_status
  FROM dbo.users AS u
  INNER JOIN dbo.roles AS r ON r.role_id = u.role_id
  LEFT JOIN dbo.partner_profiles AS pp ON pp.user_id = u.user_id
`;

function normalizeRole(roleName: string): AccountRole {
  return roleName.toUpperCase() as AccountRole;
}

export async function findRoleId(roleName: string): Promise<number | null> {
  const result = await getPool().request()
    .input('roleName', sql.VarChar(30), roleName)
    .query<{ role_id: number }>(`
      SELECT role_id FROM dbo.roles WHERE UPPER(role_name) = UPPER(@roleName)
    `);
  return result.recordset[0]?.role_id ?? null;
}

export async function findAccountByEmail(email: string): Promise<ExistingAdminAccount | null> {
  const result = await getPool().request()
    .input('email', sql.VarChar(150), email)
    .query<ExistingAdminAccount>(`
      SELECT u.role_id, r.role_name, u.public_id
      FROM dbo.users AS u
      INNER JOIN dbo.roles AS r ON r.role_id = u.role_id
      WHERE u.email = @email
    `);
  return result.recordset[0] ?? null;
}

export async function findResetAccountByEmail(email: string): Promise<ResetAccount | null> {
  const result = await getPool().request()
    .input('email', sql.VarChar(150), email)
    .query<ResetAccount>(`
      SELECT u.user_id, r.role_name, u.email, u.full_name
      FROM dbo.users AS u
      INNER JOIN dbo.roles AS r ON r.role_id = u.role_id
      WHERE u.email = @email
    `);
  return result.recordset[0] ?? null;
}

export async function findAccountByIdentifier(identifier: string): Promise<AuthAccountRecord | null> {
  const result = await getPool().request()
    .input('identifier', sql.VarChar(150), identifier)
    .query<AuthAccountRecord>(`${accountSelect}
      WHERE u.email = @identifier OR u.phone = @identifier
    `);
  return result.recordset[0] ?? null;
}

export async function findAccountByUserId(userId: number): Promise<AuthAccountRecord | null> {
  const result = await getPool().request()
    .input('userId', sql.Int, userId)
    .query<AuthAccountRecord>(`${accountSelect} WHERE u.user_id = @userId`);
  return result.recordset[0] ?? null;
}

export async function publicIdExists(publicId: string): Promise<boolean> {
  const result = await getPool().request()
    .input('publicId', sql.NVarChar(20), publicId)
    .query<{ found: number }>(`
      SELECT TOP (1) 1 AS found FROM dbo.users WHERE public_id = @publicId
    `);
  return result.recordset.length > 0;
}

export async function createAccount(input: {
  publicId: string;
  roleId: number;
  role: Exclude<AccountRole, 'ADMIN'>;
  name: string;
  email: string;
  phone: string | null;
  passwordHash: string;
  partner?: { businessName: string; serviceType: string; taxCode: string | null; address: string | null };
}): Promise<AuthAccountRecord> {
  const transaction = new sql.Transaction(getPool());
  await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  try {
    const inserted = await new sql.Request(transaction)
      .input('publicId', sql.NVarChar(20), input.publicId)
      .input('roleId', sql.Int, input.roleId)
      .input('name', sql.NVarChar(50), input.name)
      .input('email', sql.VarChar(150), input.email)
      .input('phone', sql.VarChar(20), input.phone)
      .input('passwordHash', sql.VarChar(255), input.passwordHash)
      .query<{ user_id: number }>(`
        INSERT INTO dbo.users
          (public_id, role_id, full_name, email, phone, password_hash, status, email_verified, failed_login_count)
        OUTPUT INSERTED.user_id
        VALUES (@publicId, @roleId, @name, @email, @phone, @passwordHash, 'ACTIVE', 0, 0)
      `);
    const userId = inserted.recordset[0]?.user_id;
    if (!userId) throw new Error('Không nhận được user_id vừa tạo.');

    if (input.role === 'PARTNER' && input.partner) {
      await new sql.Request(transaction)
        .input('userId', sql.Int, userId)
        .input('businessName', sql.NVarChar(75), input.partner.businessName)
        .input('serviceType', sql.NVarChar(10), input.partner.serviceType)
        .input('taxCode', sql.NVarChar(20), input.partner.taxCode)
        .input('address', sql.NVarChar(125), input.partner.address)
        .query(`
          INSERT INTO dbo.partner_profiles
            (user_id, business_name, service_type, tax_code, address, approval_status)
          VALUES
            (@userId, @businessName, @serviceType, @taxCode, @address, 'PENDING')
        `);
    }

    await transaction.commit();
    const account = await findAccountByUserId(userId);
    if (!account) throw new Error('Không tải được tài khoản vừa tạo.');
    return account;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function insertAdminAccount(input: {
  publicId: string;
  roleId: number;
  name: string;
  email: string;
  passwordHash: string;
}): Promise<void> {
  await getPool().request()
    .input('publicId', sql.NVarChar(20), input.publicId)
    .input('roleId', sql.Int, input.roleId)
    .input('name', sql.NVarChar(50), input.name)
    .input('email', sql.VarChar(150), input.email)
    .input('passwordHash', sql.VarChar(255), input.passwordHash)
    .query(`
      INSERT INTO dbo.users
        (public_id, role_id, full_name, email, password_hash, status, email_verified, failed_login_count)
      VALUES
        (@publicId, @roleId, @name, @email, @passwordHash, 'ACTIVE', 1, 0)
    `);
}

export async function recordFailedLogin(userId: number): Promise<number> {
  const result = await getPool().request()
    .input('userId', sql.Int, userId)
    .query<{ failed_login_count: number }>(`
      UPDATE dbo.users
      SET failed_login_count = failed_login_count + 1,
          status = CASE WHEN failed_login_count + 1 >= 5 THEN 'LOCKED' ELSE status END,
          locked_until = CASE WHEN failed_login_count + 1 >= 5 THEN DATEADD(MINUTE, 15, SYSUTCDATETIME()) ELSE locked_until END
      OUTPUT INSERTED.failed_login_count
      WHERE user_id = @userId
    `);
  return result.recordset[0]?.failed_login_count ?? 0;
}

export async function resetLoginStateAndRecordSuccess(userId: number): Promise<void> {
  await getPool().request()
    .input('userId', sql.Int, userId)
    .query(`
      UPDATE dbo.users
      SET failed_login_count = 0, locked_until = NULL, status = 'ACTIVE', last_login_at = SYSUTCDATETIME()
      WHERE user_id = @userId
    `);
}

export async function unlockExpiredAccount(userId: number): Promise<void> {
  await getPool().request()
    .input('userId', sql.Int, userId)
    .query(`
      UPDATE dbo.users
      SET status = 'ACTIVE', failed_login_count = 0, locked_until = NULL
      WHERE user_id = @userId AND status = 'LOCKED' AND locked_until <= SYSUTCDATETIME()
    `);
}

export async function insertRefreshToken(input: {
  userId: number; tokenHash: string; expiresAt: Date; userAgent: string | null; ip: string | null;
}): Promise<void> {
  await getPool().request()
    .input('userId', sql.Int, input.userId)
    .input('tokenHash', sql.Char(64), input.tokenHash)
    .input('expiresAt', sql.DateTime2, input.expiresAt)
    .input('userAgent', sql.NVarChar(255), input.userAgent)
    .input('ip', sql.NVarChar(45), input.ip)
    .query(`
      INSERT INTO dbo.refresh_tokens (user_id, token_hash, expires_at, user_agent, ip)
      VALUES (@userId, @tokenHash, @expiresAt, @userAgent, @ip)
    `);
}

export async function rotateRefreshToken(input: {
  oldTokenHash: string; newTokenHash: string; expiresAt: Date; userAgent: string | null; ip: string | null;
}): Promise<AuthAccountRecord | null> {
  const transaction = new sql.Transaction(getPool());
  await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  try {
    const selected = await new sql.Request(transaction)
      .input('tokenHash', sql.Char(64), input.oldTokenHash)
      .query<{ token_id: number; user_id: number }>(`
        SELECT TOP (1) token_id, user_id
        FROM dbo.refresh_tokens WITH (UPDLOCK, HOLDLOCK)
        WHERE token_hash = @tokenHash AND revoked_at IS NULL AND expires_at > SYSUTCDATETIME()
      `);
    const session = selected.recordset[0];
    if (!session) {
      await transaction.rollback();
      return null;
    }

    const revoked = await new sql.Request(transaction)
      .input('tokenId', sql.BigInt, session.token_id)
      .query(`UPDATE dbo.refresh_tokens SET revoked_at = SYSUTCDATETIME() WHERE token_id = @tokenId AND revoked_at IS NULL`);
    if (revoked.rowsAffected[0] !== 1) {
      await transaction.rollback();
      return null;
    }

    await new sql.Request(transaction)
      .input('userId', sql.Int, session.user_id)
      .input('tokenHash', sql.Char(64), input.newTokenHash)
      .input('expiresAt', sql.DateTime2, input.expiresAt)
      .input('userAgent', sql.NVarChar(255), input.userAgent)
      .input('ip', sql.NVarChar(45), input.ip)
      .query(`
        INSERT INTO dbo.refresh_tokens (user_id, token_hash, expires_at, user_agent, ip)
        VALUES (@userId, @tokenHash, @expiresAt, @userAgent, @ip)
      `);
    await transaction.commit();
    return findAccountByUserId(session.user_id);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function revokeRefreshToken(tokenHash: string): Promise<void> {
  await getPool().request()
    .input('tokenHash', sql.Char(64), tokenHash)
    .query(`UPDATE dbo.refresh_tokens SET revoked_at = SYSUTCDATETIME() WHERE token_hash = @tokenHash AND revoked_at IS NULL`);
}

export async function revokeAllRefreshTokens(userId: number, exceptTokenHash?: string): Promise<void> {
  const request = getPool().request().input('userId', sql.Int, userId);
  if (exceptTokenHash) {
    request.input('exceptTokenHash', sql.Char(64), exceptTokenHash);
    await request.query(`
      UPDATE dbo.refresh_tokens SET revoked_at = SYSUTCDATETIME()
      WHERE user_id = @userId AND revoked_at IS NULL AND token_hash <> @exceptTokenHash
    `);
  } else {
    await request.query(`
      UPDATE dbo.refresh_tokens SET revoked_at = SYSUTCDATETIME()
      WHERE user_id = @userId AND revoked_at IS NULL
    `);
  }
}

export async function createPasswordResetToken(userId: number, tokenHash: string, expiresAt: Date): Promise<void> {
  const transaction = new sql.Transaction(getPool());
  await transaction.begin();
  try {
    await new sql.Request(transaction)
      .input('userId', sql.Int, userId)
      .query(`UPDATE dbo.password_reset_tokens SET used_at = SYSUTCDATETIME() WHERE user_id = @userId AND used_at IS NULL`);
    await new sql.Request(transaction)
      .input('userId', sql.Int, userId)
      .input('tokenHash', sql.Char(64), tokenHash)
      .input('expiresAt', sql.DateTime2, expiresAt)
      .query(`
        INSERT INTO dbo.password_reset_tokens (user_id, token_hash, expires_at)
        VALUES (@userId, @tokenHash, @expiresAt)
      `);
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function findAccountByResetTokenHash(tokenHash: string): Promise<AuthAccountRecord | null> {
  const result = await getPool().request()
    .input('tokenHash', sql.Char(64), tokenHash)
    .query<AuthAccountRecord>(`
      ${accountSelect.replace('FROM dbo.users AS u', 'FROM dbo.password_reset_tokens AS prt INNER JOIN dbo.users AS u ON u.user_id = prt.user_id')}
      WHERE prt.token_hash = @tokenHash AND prt.used_at IS NULL AND prt.expires_at > SYSUTCDATETIME()
    `);
  return result.recordset[0] ?? null;
}

export async function resetPasswordByTokenHash(tokenHash: string, passwordHash: string): Promise<boolean> {
  const transaction = new sql.Transaction(getPool());
  await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  try {
    const selected = await new sql.Request(transaction)
      .input('tokenHash', sql.Char(64), tokenHash)
      .query<{ user_id: number }>(`
        SELECT TOP (1) user_id FROM dbo.password_reset_tokens WITH (UPDLOCK, HOLDLOCK)
        WHERE token_hash = @tokenHash AND used_at IS NULL AND expires_at > SYSUTCDATETIME()
      `);
    const row = selected.recordset[0];
    if (!row) {
      await transaction.rollback();
      return false;
    }
    await new sql.Request(transaction)
      .input('userId', sql.Int, row.user_id)
      .input('passwordHash', sql.VarChar(255), passwordHash)
      .query(`
        UPDATE dbo.users SET password_hash = @passwordHash, status = 'ACTIVE',
          failed_login_count = 0, locked_until = NULL
        WHERE user_id = @userId
      `);
    await new sql.Request(transaction)
      .input('tokenHash', sql.Char(64), tokenHash)
      .query(`UPDATE dbo.password_reset_tokens SET used_at = SYSUTCDATETIME() WHERE token_hash = @tokenHash`);
    await new sql.Request(transaction)
      .input('userId', sql.Int, row.user_id)
      .query(`UPDATE dbo.refresh_tokens SET revoked_at = SYSUTCDATETIME() WHERE user_id = @userId AND revoked_at IS NULL`);
    await transaction.commit();
    return true;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function changePassword(
  userId: number,
  passwordHash: string,
  currentRefreshHash: string | null,
): Promise<void> {
  const transaction = new sql.Transaction(getPool());
  await transaction.begin();
  try {
    await new sql.Request(transaction)
      .input('userId', sql.Int, userId)
      .input('passwordHash', sql.VarChar(255), passwordHash)
      .query(`UPDATE dbo.users SET password_hash = @passwordHash, failed_login_count = 0, locked_until = NULL WHERE user_id = @userId`);
    const tokenRequest = new sql.Request(transaction).input('userId', sql.Int, userId);
    if (currentRefreshHash) {
      tokenRequest.input('currentHash', sql.Char(64), currentRefreshHash);
      await tokenRequest.query(`
        UPDATE dbo.refresh_tokens SET revoked_at = SYSUTCDATETIME()
        WHERE user_id = @userId AND revoked_at IS NULL AND token_hash <> @currentHash
      `);
    } else {
      await tokenRequest.query(`UPDATE dbo.refresh_tokens SET revoked_at = SYSUTCDATETIME() WHERE user_id = @userId AND revoked_at IS NULL`);
    }
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export function mapRoleName(roleName: string): AccountRole {
  return normalizeRole(roleName);
}
