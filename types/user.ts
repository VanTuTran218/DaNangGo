export type Tier = 'Silver' | 'Gold' | 'Diamond' | 'None';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  birthday?: string;
  avatarUrl?: string;
  createdAt: string;
  membership: {
    isVip: boolean;
    tier: Tier;
    points: number;
    nextTierPoints?: number;
    joinedAt?: string;
  };
}

export interface LoginPayload {
  identifier: string; // email or phone
  password: string;
  rememberMe?: boolean;
}

export interface RegisterPayload {
  name: string;
  identifier: string;
  password: string;
  confirmPassword: string;
  agreedToTerms: boolean;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
}
