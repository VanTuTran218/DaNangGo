export type Tier = 'Silver' | 'Gold' | 'Diamond' | 'None';
export type UserRole = 'USER' | 'PARTNER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
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
  role: 'USER' | 'PARTNER';
  name: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
  agreedToTerms: boolean;
  partner?: {
    businessName: string;
    serviceType: 'STAY' | 'TABLE' | 'TICKET';
    taxCode?: string;
    address?: string;
  };
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
}
