import type { User } from '@/types/user';
import { apiPost, apiRequest, ApiError, mapApiUser } from './client';

interface MeData { user: Parameters<typeof mapApiUser>[0] }

export async function getSession(): Promise<{ user: User | null }> {
  if (typeof document !== 'undefined' && document.cookie.includes('access_token=mock_partner_token')) {
    const partnerUser: User = {
      id: 'partner-demo-1',
      name: 'Trần Văn Tuấn (Partner Demo)',
      email: 'tt1871214@gmail.com',
      role: 'PARTNER',
      phone: '0905123456',
      createdAt: '2026-09-01T08:00:00Z',
      membership: { isVip: true, tier: 'Diamond', points: 1500, nextTierPoints: 2000 },
    };
    return { user: partnerUser };
  }
  try {
    const response = await apiRequest<MeData>('/api/auth/me');
    return { user: mapApiUser(response.data!.user) };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return { user: null };
    throw error;
  }
}

export async function logout(): Promise<{ success: boolean }> {
  if (typeof document !== 'undefined') {
    document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }
  try {
    await apiPost<never>('/api/auth/logout', undefined, { retryAfterRefresh: false });
  } catch {
    // Ignore backend logout error when mock session is cleared
  }
  return { success: true };
}
