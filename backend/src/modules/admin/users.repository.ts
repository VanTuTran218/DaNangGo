import { getPool, sql } from '../../config/db';

export interface AdminUserRecord {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: Date;
}

export async function listUsers(input: {
  page: number; limit: number; role?: string; status?: string; search?: string;
}): Promise<{ data: AdminUserRecord[]; total: number }> {
  const pool = getPool();
  const where = ["(@role IS NULL OR UPPER(r.role_name) = UPPER(@role))", "(@status IS NULL OR UPPER(u.status) = UPPER(@status))", "(@search IS NULL OR u.full_name LIKE @search OR u.email LIKE @search)"];
  const bind = (request: ReturnType<typeof pool.request>) => request
    .input('role', sql.VarChar(30), input.role ?? null)
    .input('status', sql.VarChar(30), input.status ?? null)
    .input('search', sql.NVarChar(205), input.search ? `%${input.search}%` : null);
  const count = await bind(pool.request()).query<{ total: number }>(`
    SELECT COUNT(*) AS total FROM dbo.users u JOIN dbo.roles r ON r.role_id = u.role_id
    WHERE ${where.join(' AND ')}`);
  const result = await bind(pool.request())
    .input('offset', sql.Int, (input.page - 1) * input.limit)
    .input('limit', sql.Int, input.limit)
    .query<AdminUserRecord>(`
      SELECT u.user_id AS id, u.full_name AS name, u.email, UPPER(r.role_name) AS role,
        u.status, u.created_at AS createdAt
      FROM dbo.users u JOIN dbo.roles r ON r.role_id = u.role_id
      WHERE ${where.join(' AND ')}
      ORDER BY u.created_at DESC, u.user_id DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`);
  return { data: result.recordset, total: count.recordset[0]?.total ?? 0 };
}

export async function getUserForStatusChange(id: number): Promise<{ id: number; role: string } | null> {
  const result = await getPool().request().input('id', sql.Int, id).query<{ id: number; role: string }>(`
    SELECT u.user_id AS id, r.role_name AS role FROM dbo.users u
    JOIN dbo.roles r ON r.role_id = u.role_id WHERE u.user_id = @id`);
  return result.recordset[0] ?? null;
}

export async function updateUserStatus(id: number, status: 'ACTIVE' | 'LOCKED'): Promise<AdminUserRecord | null> {
  const result = await getPool().request()
    .input('id', sql.Int, id).input('status', sql.VarChar(20), status)
    .query<AdminUserRecord>(`
      UPDATE dbo.users SET status = @status, updated_at = SYSDATETIME() WHERE user_id = @id;
      SELECT u.user_id AS id, u.full_name AS name, u.email, UPPER(r.role_name) AS role,
        u.status, u.created_at AS createdAt
      FROM dbo.users u JOIN dbo.roles r ON r.role_id = u.role_id WHERE u.user_id = @id;`);
  return result.recordset[0] ?? null;
}
