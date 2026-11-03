import type { UserRole } from '../types/user';

/** Điểm chuyển trang duy nhất sau khi AuthContext nhận phiên đăng nhập. */
export function getAuthRedirect(role: UserRole, redirectTo: string, intent?: string | null): string {
  const safe = redirectTo.startsWith('/') && !redirectTo.startsWith('//')
    && !/[\\\u0000-\u0020]/.test(redirectTo) ? redirectTo : '/';
  if (role === 'PARTNER') {
    return /^\/partner(?:\/|\?|#|$)/.test(safe) ? safe : '/partner';
  }
  if (intent === 'vip') return '/vip?action=register-vip';
  return safe;
}
