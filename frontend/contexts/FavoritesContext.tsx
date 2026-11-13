'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ToastNotification, { type ToastItem } from '@/components/ui/ToastNotification';
import { addFavorite, getFavoriteIds, removeFavorite } from '@/lib/api/favorites';
import { FavoritesStore, initialFavorites, type FavoriteStatus } from '@/lib/favorites-store';

interface FavoritesContextValue {
  ownerId: string | null;
  ready: boolean;
  status: FavoriteStatus;
  error: string | null;
  revision: number;
  isAuthenticated: boolean;
  canUseFavorites: boolean;
  isFavorite: (placeId: number) => boolean;
  isPending: (placeId: number) => boolean;
  reload: () => Promise<boolean>;
  setFavorite: (placeId: number, saved: boolean) => Promise<boolean>;
  toggle: (placeId: number) => Promise<boolean>;
}
const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [store] = useState(() => {
    const instance = new FavoritesStore({
      getIds: signal => getFavoriteIds({ signal, ownerId: instance.getSnapshot().owner ?? undefined }),
      set: (id, saved, signal) => {
        const options = { signal, ownerId: instance.getSnapshot().owner ?? undefined };
        return saved ? addFavorite(id, options) : removeFavorite(id, options);
      },
    });
    return instance;
  });
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, () => initialFavorites);
  const canUseFavorites = !authLoading && !!user && (user.role === 'USER' || user.role === 'PARTNER');
  const ownerId = canUseFavorites ? user!.id : null;
  const currentOwner = useRef(ownerId);
  currentOwner.current = ownerId;
  const [toast, setToast] = useState<(ToastItem & { owner: string | null }) | null>(null);
  const current = snapshot.owner === ownerId;
  const ready = !authLoading && current && snapshot.status === 'ready' && !snapshot.error;

  useEffect(() => {
    store.changeOwner(ownerId);
    if (ownerId) void store.reload();
    return () => store.changeOwner(null);
  }, [ownerId, store]);

  useEffect(() => {
    if (!ownerId) return;
    const refresh = () => { if (document.visibilityState === 'visible') void store.reload(); };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => { window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, [ownerId, store]);

  const setFavorite = useCallback(async (placeId: number, saved: boolean) => {
    if (!user) {
      setToast({ owner: null, type: 'info', title: 'Cần đăng nhập', message: 'Vui lòng đăng nhập để lưu địa điểm yêu thích.', action: { label: 'Đăng nhập', href: '/dang-nhap' } });
      return false;
    }
    if (!canUseFavorites) {
      setToast({ owner: null, type: 'info', title: 'Chưa hỗ trợ tài khoản này', message: 'Yêu thích dành cho tài khoản người dùng và đối tác.' });
      return false;
    }
    if (store.getSnapshot().owner !== ownerId || !ready || store.getSnapshot().pending.has(placeId)) return false;
    const session = store.getSession();
    const succeeded = await store.setFavorite(placeId, saved);
    if (!succeeded && store.getSession() === session && currentOwner.current === ownerId && store.getSnapshot().owner === ownerId) {
      setToast({ owner: ownerId, type: 'error', title: 'Chưa cập nhật được yêu thích', message: 'Bạn kiểm tra trạng thái sau khi tải lại và thử lại nhé.' });
    }
    return succeeded && currentOwner.current === ownerId;
  }, [user, canUseFavorites, store, ownerId, ready]);
  const toggle = useCallback((placeId: number) => setFavorite(placeId, !store.getSnapshot().ids.has(placeId)), [setFavorite, store]);
  const value = useMemo(() => ({
    ownerId, ready, status: authLoading || !current ? 'loading' as const : snapshot.status,
    error: current ? snapshot.error : null, revision: current ? snapshot.revision : 0,
    isAuthenticated: !!user, canUseFavorites,
    isFavorite: (id: number) => !!ownerId && current && snapshot.ids.has(id),
    isPending: (id: number) => current && snapshot.pending.has(id),
    reload: () => ownerId && store.getSnapshot().owner === ownerId ? store.reload() : Promise.resolve(false),
    setFavorite, toggle,
  }), [ownerId, ready, authLoading, current, snapshot, user, canUseFavorites, store, setFavorite, toggle]);
  return <FavoritesContext.Provider value={value}>
    {children}
    <ToastNotification toast={toast?.owner === ownerId ? toast : null} onClose={() => setToast(null)} />
  </FavoritesContext.Provider>;
}
export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error('useFavorites must be used within FavoritesProvider');
  return context;
}
