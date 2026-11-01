import type { User, UserRole } from '@/types/user';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  createdAt: string;
  approvalStatus?: string;
  avatarUrl?: string;
  birthday?: string;
  membership?: User['membership'];
}

export function mapApiUser(user: ApiUser): User {
  const mapped: User = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    membership: user.membership ?? { isVip: false, tier: 'None', points: 0, nextTierPoints: 1000 },
  };
  if (user.phone) mapped.phone = user.phone;
  if (user.avatarUrl) mapped.avatarUrl = user.avatarUrl;
  if (user.birthday) mapped.birthday = user.birthday;
  return mapped;
}

function apiUrl(path: string): string {
  return `${API_BASE_URL.replace(/\/$/, '')}${path}`;
}

async function readEnvelope<T>(response: Response): Promise<ApiEnvelope<T>> {
  try {
    return await response.json() as ApiEnvelope<T>;
  } catch {
    return { success: false, message: 'Phản hồi từ máy chủ không hợp lệ.' };
  }
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  options: { retryAfterRefresh?: boolean } = {},
): Promise<ApiEnvelope<T>> {
  const requestInit: RequestInit = {
    ...init,
    credentials: 'include',
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  };
  let response = await fetch(apiUrl(path), requestInit);
  let envelope = await readEnvelope<T>(response);
  const canRefresh = options.retryAfterRefresh !== false
    && response.status === 401
    && path !== '/api/auth/refresh'
    && path !== '/api/admin/auth/refresh';

  if (canRefresh) {
    const isAdminRequest = path.startsWith('/api/admin/');
    const refreshPath = isAdminRequest ? '/api/admin/auth/refresh' : '/api/auth/refresh';
    const refreshResponse = await fetch(apiUrl(refreshPath), { method: 'POST', credentials: 'include' });
    if (refreshResponse.ok) {
      response = await fetch(apiUrl(path), requestInit);
      envelope = await readEnvelope<T>(response);
    }
  }

  if (!response.ok || !envelope.success) {
    throw new ApiError(envelope.message || 'Không thể kết nối máy chủ. Vui lòng thử lại.', response.status);
  }
  return envelope;
}

export function apiPost<T>(path: string, body?: unknown, options?: { retryAfterRefresh?: boolean }): Promise<ApiEnvelope<T>> {
  return apiRequest<T>(path, {
    method: 'POST',
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }, options);
}
