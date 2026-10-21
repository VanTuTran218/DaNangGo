import type { User } from '@/types/user';
import { apiPost, apiRequest, ApiError, mapApiUser } from './client';

interface MeData { user: Parameters<typeof mapApiUser>[0] }

export async function getSession(): Promise<{ user: User | null }> {
  try {
    const response = await apiRequest<MeData>('/api/auth/me');
    return { user: mapApiUser(response.data!.user) };
  } catch {
    return { user: null };
  }
}

export async function logout(): Promise<{ success: boolean }> {
  try {
    await apiPost<never>('/api/auth/logout', undefined, { retryAfterRefresh: false });
  } catch {
    // Ignore backend logout error if already unauthenticated
  }
  return { success: true };
}
