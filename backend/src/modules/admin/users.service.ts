import { AuthError } from '../auth/auth.errors';
import { getUserForStatusChange, listUsers, updateUserStatus } from './users.repository';

export async function adminListUsers(input: {
  page: number; limit: number; role?: string; status?: string; search?: string;
}) {
  const result = await listUsers(input);
  return { ...result, totalPages: Math.ceil(result.total / input.limit) };
}

export async function adminChangeUserStatus(id: number, adminId: number, status: 'ACTIVE' | 'LOCKED') {
  const user = await getUserForStatusChange(id);
  if (!user) throw new AuthError(404, 'Không tìm thấy người dùng.');
  if (user.role.toUpperCase() === 'ADMIN') {
    if (user.id === adminId) throw new AuthError(403, 'Bạn không thể khóa hoặc mở khóa chính tài khoản Admin của mình.');
    throw new AuthError(403, 'Không thể thay đổi trạng thái tài khoản Admin khác.');
  }
  const updated = await updateUserStatus(id, status);
  if (!updated) throw new AuthError(404, 'Không tìm thấy người dùng.');
  return updated;
}
