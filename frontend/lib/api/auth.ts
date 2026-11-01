import type { AuthResponse, LoginPayload, RegisterPayload, User } from '@/types/user';
import { apiPost, apiRequest, ApiError, mapApiUser } from './client';

interface AuthData { user: Parameters<typeof mapApiUser>[0] }

interface RegisterData { email: string; maskedEmail: string }

async function authCall(path: string, body: unknown): Promise<AuthResponse> {
  try {
    const response = await apiPost<AuthData>(path, body);
    return { success: true, user: mapApiUser(response.data!.user) };
  } catch (error) {
    return { success: false, error: error instanceof ApiError ? error.message : 'Không thể kết nối máy chủ. Vui lòng thử lại.' };
  }
}

export async function login(payload: LoginPayload): Promise<AuthResponse & { code?: string; maskedEmail?: string }> {
  try {
    const response = await apiPost<AuthData>('/api/auth/login', payload);
    return { success: true, user: mapApiUser(response.data!.user) };
  } catch (error) {
    if (error instanceof ApiError) {
      // Xử lý tài khoản chưa xác thực email
      const raw = error.raw as { code?: string; maskedEmail?: string } | undefined;
      if (error.status === 403 && raw?.code === 'EMAIL_NOT_VERIFIED') {
        return { success: false, error: error.message, code: 'EMAIL_NOT_VERIFIED', maskedEmail: raw.maskedEmail };
      }
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Không thể kết nối máy chủ. Vui lòng thử lại.' };
  }
}

export async function register(payload: RegisterPayload): Promise<{ success: boolean; email?: string; maskedEmail?: string; error?: string; code?: string }> {
  try {
    const response = await apiPost<RegisterData>('/api/auth/register', payload);
    return { success: true, email: response.data?.email, maskedEmail: response.data?.maskedEmail };
  } catch (error) {
    if (error instanceof ApiError) {
      const raw = error.raw as { code?: string } | undefined;
      return { success: false, error: error.message, code: raw?.code };
    }
    return { success: false, error: 'Không thể kết nối máy chủ. Vui lòng thử lại.' };
  }
}

export async function verifyEmail(email: string, code: string): Promise<{ success: boolean; error?: string }> {
  try {
    await apiPost<never>('/api/auth/verify-email', { email, code });
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof ApiError ? error.message : 'Không thể kết nối máy chủ. Vui lòng thử lại.' };
  }
}

export async function resendCode(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    await apiPost<never>('/api/auth/resend-code', { email });
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof ApiError ? error.message : 'Không thể kết nối máy chủ. Vui lòng thử lại.' };
  }
}

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

/** OTP reset: Bước 2 — xác thực OTP trước khi đặt mật khẩu */
export async function verifyResetOtp(email: string, code: string): Promise<{ success: boolean; error?: string }> {
  try {
    await apiPost<never>('/api/auth/verify-reset-otp', { email, code });
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof ApiError ? error.message : 'Không thể kết nối máy chủ.' };
  }
}

/** OTP reset: Bước 3 — đặt mật khẩu mới */
export async function resetPasswordOtp(
  email: string,
  code: string,
  newPassword: string,
  confirmPassword: string,
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const response = await apiPost<never>('/api/auth/reset-password-otp', { email, code, newPassword, confirmPassword });
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
