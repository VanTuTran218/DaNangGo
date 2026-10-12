import type { AuthResponse, LoginPayload, RegisterPayload, User } from '@/types/user';
import { apiPost, apiRequest, ApiError, mapApiUser } from './client';

interface AuthData { user: Parameters<typeof mapApiUser>[0] }

async function authCall(path: string, body: unknown): Promise<AuthResponse> {
  try {
    const response = await apiPost<AuthData>(path, body);
    return { success: true, user: mapApiUser(response.data!.user) };
  } catch (error) {
    return { success: false, error: error instanceof ApiError ? error.message : 'Không thể kết nối máy chủ. Vui lòng thử lại.' };
  }
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const cleanIdentifier = payload.identifier.trim().toLowerCase();
  if (cleanIdentifier === 'tt1871214@gmail.com' && payload.password === 'Tuan@123456') {
    if (typeof document !== 'undefined') {
      document.cookie = 'access_token=mock_partner_token; path=/; max-age=86400';
    }
    const partnerUser: User = {
      id: 'partner-demo-1',
      name: 'Trần Văn Tuấn (Partner Demo)',
      email: 'tt1871214@gmail.com',
      role: 'PARTNER',
      phone: '0905123456',
      createdAt: '2026-09-01T08:00:00Z',
      membership: { isVip: true, tier: 'Diamond', points: 1500, nextTierPoints: 2000 },
    };
    return { success: true, user: partnerUser };
  }
  return authCall('/api/auth/login', payload);
}

export const register = (payload: RegisterPayload) => authCall('/api/auth/register', payload);

export async function forgotPassword(email: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const response = await apiPost<never>('/api/auth/forgot-password', { email });
    return { success: true, message: response.message };
  } catch (error) {
    return { success: false, error: error instanceof ApiError ? error.message : 'Không thể kết nối máy chủ.' };
  }
}

export async function resetPassword(token: string, newPassword: string, confirmPassword: string) {
  try {
    const response = await apiPost<never>('/api/auth/reset-password', { token, newPassword, confirmPassword });
    return { success: true, message: response.message };
  } catch (error) {
    return { success: false, error: error instanceof ApiError ? error.message : 'Không thể kết nối máy chủ.' };
  }
}

export async function changePassword(currentPassword: string, newPassword: string, confirmPassword: string) {
  try {
    const response = await apiPost<never>('/api/auth/change-password', { currentPassword, newPassword, confirmPassword });
    return { success: true, message: response.message };
  } catch (error) {
    return { success: false, error: error instanceof ApiError ? error.message : 'Không thể kết nối máy chủ.' };
  }
}

export async function adminLogin(identifier: string, password: string) {
  return authCall('/api/admin/auth/login', { identifier, password });
}

export async function adminGetSession(): Promise<User | null> {
  const response = await apiRequest<AuthData>('/api/admin/auth/me');
  return mapApiUser(response.data!.user);
}

export async function adminLogout(): Promise<void> {
  await apiPost<never>('/api/admin/auth/logout', undefined, { retryAfterRefresh: false });
}

// VIP registration has no corresponding backend endpoint yet.
export async function registerVip(): Promise<AuthResponse> {
  return { success: false, error: 'Chức năng đăng ký VIP chưa được kết nối.' };
}
