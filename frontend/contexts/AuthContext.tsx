'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '@/types/user';
import { getSession, logout as apiLogout } from '@/lib/api/me';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User) => void;
  logout: () => Promise<void>;
  logoutTo: (path: string) => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkSession() {
      try {
        const { user } = await getSession();
        setUser(user);
      } catch (error) {
        console.error('Failed to get session', error);
      } finally {
        setLoading(false);
      }
    }
    checkSession();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
  };

  const endSession = async (redirectTo: string) => {
    try {
      await apiLogout();
    } finally {
      setUser(null);
      router.push(redirectTo);
    }
  };

  const logout = () => endSession('/');
  const logoutTo = (path: string) => endSession(path);

  const updateUser = (updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates, membership: { ...prev.membership, ...(updates.membership || {}) } };
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, logoutTo, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
