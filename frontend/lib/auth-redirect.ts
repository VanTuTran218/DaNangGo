import type { UserRole } from '../types/user';

export function shouldRedirectPartner(role: UserRole | undefined, pathname: string): boolean {
  return role === 'PARTNER' &&
    !/^\/(?:admin|partner|dang-nhap|chinh-sach|dieu-khoan)(?:\/|$)/.test(pathname);
}

/** Điểm chuyển trang duy nhất sau khi AuthContext nhận phiên đăng nhập. */
export function getAuthRedirect(role: UserRole, redirectTo: string, intent?: string | null): string {
  const safe = redirectTo.startsWith('/') && !redirectTo.startsWith('//')
    && !/[\\\u0000-\u0020]/.test(redirectTo) ? redirectTo : '/';
  // Phiên quản trị được kiểm tra riêng khi truy cập khu vực admin.
  if (/^\/admin(?:\/|\?|#|$)/.test(safe)) return safe;
  if (role === 'PARTNER') {
    return /^\/partner(?:\/|\?|#|$)/.test(safe) ? safe : '/partner';
  }
  if (intent === 'vip') return '/vip?action=register-vip';
  return safe;
}
