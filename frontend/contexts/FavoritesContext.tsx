'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ToastNotification, { type ToastItem } from '@/components/ui/ToastNotification';
import { addFavorite, getFavoriteIds, removeFavorite } from '@/lib/api/favorites';

interface FavoritesContextValue {
  ready: boolean;
  isAuthenticated: boolean;
  isFavorite: (placeId: number) => boolean;
  toggle: (placeId: number) => Promise<boolean>;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(() => new Set());
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<ToastItem | null>(null);
  const userId = user?.id;

  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      setFavoriteIds(new Set());
      setReady(true);
      return;
    }
    let active = true;
    setFavoriteIds(new Set());
    setReady(false);
    getFavoriteIds()
      .then((ids) => {
        if (active) setFavoriteIds(new Set(ids));
      })
      .catch((error: unknown) => {
        if (active) {
          setToast({
            type: 'error',
            title: 'Không tải được địa điểm yêu thích',
            message: error instanceof Error ? error.message : 'Vui lòng thử tải lại trang.',
          });
        }
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => { active = false; };
  }, [authLoading, userId]);

  const isFavorite = useCallback((placeId: number) => favoriteIds.has(placeId), [favoriteIds]);

  const toggle = useCallback(async (placeId: number): Promise<boolean> => {
    if (!user) {
      setToast({
        type: 'info',
        title: 'Cần đăng nhập',
        message: 'Vui lòng đăng nhập để lưu địa điểm yêu thích.',
        action: { label: 'Đăng nhập', href: '/dang-nhap' },
      });
      return false;
    }
    if (!ready) return false;

    const wasFavorite = favoriteIds.has(placeId);
    setFavoriteIds((current) => {
      const next = new Set(current);
      if (wasFavorite) next.delete(placeId);
      else next.add(placeId);
      return next;
    });

    try {
      if (wasFavorite) await removeFavorite(placeId);
      else await addFavorite(placeId);
      return true;
    } catch (error) {
      setFavoriteIds((current) => {
        const restored = new Set(current);
        if (wasFavorite) restored.add(placeId);
        else restored.delete(placeId);
        return restored;
      });
      setToast({
        type: 'error',
        title: 'Không cập nhật được yêu thích',
        message: error instanceof Error ? error.message : 'Vui lòng thử lại.',
      });
      return false;
    }
  }, [favoriteIds, ready, user]);

  const value = useMemo(() => ({
    ready,
    isAuthenticated: Boolean(user),
    isFavorite,
    toggle,
  }), [isFavorite, ready, toggle, user]);

  return (
    <FavoritesContext.Provider value={value}>
      {children}
      <ToastNotification toast={toast} onClose={() => setToast(null)} />
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error('useFavorites must be used within FavoritesProvider');
  return context;
}
