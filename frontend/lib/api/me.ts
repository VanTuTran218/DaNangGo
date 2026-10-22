import type { User } from '@/types/user';
import { apiPost, apiRequest, ApiError, mapApiUser } from './client';

interface MeData { user: Parameters<typeof mapApiUser>[0] }

export async function getSession(): Promise<{ user: User | null }> {
  try {
    const response = await apiRequest<MeData>('/api/auth/me');
    return { user: mapApiUser(response.data!.user) };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return { user: null };
    throw error;
  }
}

export async function logout(): Promise<{ success: boolean }> {
  // Remove any legacy script-readable token; real HttpOnly cookies are cleared by the API.
  if (typeof document !== 'undefined') {
    document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }
  try {
    await apiPost<never>('/api/auth/logout', undefined, { retryAfterRefresh: false });
  } catch {
    // Logout remains best-effort when the session has already expired.
  }
  return { success: true };
}
