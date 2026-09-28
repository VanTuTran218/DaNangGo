import type { LoginPayload, RegisterPayload, AuthResponse, User } from '@/types/user';
import { _setMockUser, _getMockUser } from './me';

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  await delay(1200); 

  if (!payload.identifier || !payload.password) {
    return { success: false, error: 'Vui lòng nhập đầy đủ thông tin.' };
  }
  
  const mockUser: User = {
    id: 'mock-1',
    name: 'Khách DanangGo',
    email: payload.identifier,
    createdAt: new Date().toISOString(),
    membership: {
      isVip: false,
      tier: 'None',
      points: 0,
      nextTierPoints: 1000,
    }
  };

  _setMockUser(mockUser);

  return { success: true, user: mockUser };
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  await delay(1400);

  if (!payload.name || !payload.identifier || !payload.password) {
    return { success: false, error: 'Vui lòng nhập đầy đủ thông tin.' };
  }
  if (payload.password !== payload.confirmPassword) {
    return { success: false, error: 'Mật khẩu xác nhận không khớp.' };
  }

  const mockUser: User = {
    id: 'mock-2',
    name: payload.name,
    email: payload.identifier,
    createdAt: new Date().toISOString(),
    membership: {
      isVip: false,
      tier: 'None',
      points: 0,
      nextTierPoints: 1000,
    }
  };

  _setMockUser(mockUser);

  return { success: true, user: mockUser };
}

export async function registerVip(): Promise<AuthResponse> {
  await delay(1200);
  
  // TODO: Real API call here
  
  const currentUser = _getMockUser();
  if (!currentUser) return { success: false, error: 'Chưa đăng nhập' };
  
  const updatedUser: User = {
    ...currentUser,
    membership: {
      isVip: true,
      tier: 'Silver',
      points: 0,
      nextTierPoints: 1000,
      joinedAt: new Date().toISOString()
    }
  };
  
  _setMockUser(updatedUser);
  return { success: true, user: updatedUser };
}
