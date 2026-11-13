'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Bookmark, Heart, RefreshCw } from 'lucide-react';
import { validPlaceId } from '@/lib/favorites-store';
import { useFavorites } from '@/contexts/FavoritesContext';
import { SPRING } from '@/lib/motion-tokens';

interface HeartButtonProps { placeId?: number; variant?: 'heart' | 'bookmark'; showLabel?: boolean; placeName?: string }

export default function HeartButton({ placeId, variant = 'heart', showLabel = false, placeName }: HeartButtonProps) {
  const { ready, status, error, isAuthenticated, canUseFavorites, isFavorite, isPending, toggle, reload } = useFavorites();
  const reducedMotion = useReducedMotion();
  const valid = typeof placeId === 'number' && validPlaceId(placeId);
  const saved = valid ? isFavorite(placeId) : false;
  const pending = valid ? isPending(placeId) : false;
  const Icon = variant === 'bookmark' ? Bookmark : Heart;
  const blocked = !valid || (isAuthenticated && (!canUseFavorites || !ready));

  // Chỉ chạy hiệu ứng burst nhỏ (<250ms) khi trạng thái saved thực sự chuyển từ false -> true sau khi hệ thống xác nhận
  const prevSavedRef = useRef<boolean>(saved);
  const userClickedRef = useRef<boolean>(false);
  const [burstKey, setBurstKey] = useState<number>(0);

  useEffect(() => {
    if (!prevSavedRef.current && saved && userClickedRef.current && !reducedMotion) {
      setBurstKey(Date.now());
      userClickedRef.current = false;
    }
    prevSavedRef.current = saved;
  }, [saved, reducedMotion]);

  return (
    <span className="relative inline-flex items-center gap-1">
      <motion.button
        type="button"
        whileHover={blocked || pending || reducedMotion ? undefined : { scale: 1.06 }}
        whileTap={blocked || pending || reducedMotion ? undefined : { scale: 0.9 }}
        transition={SPRING.snappy}
        aria-label={!valid ? 'Địa điểm chưa liên kết dữ liệu để lưu' : isAuthenticated && !ready ? 'Đang chờ trạng thái yêu thích' : saved ? 'Bỏ lưu địa điểm yêu thích' : 'Lưu địa điểm yêu thích'}
        aria-description={placeName ? `Địa điểm: ${placeName}` : undefined}
        aria-pressed={saved}
        aria-busy={pending}
        disabled={pending || blocked}
        title={!valid ? 'Địa điểm chưa có ID dữ liệu thật để lưu' : !canUseFavorites && isAuthenticated ? 'Yêu thích dành cho người dùng và đối tác' : error ?? undefined}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (valid && !pending && !blocked) {
            userClickedRef.current = true;
            void toggle(placeId);
          }
        }}
        className={`relative inline-flex items-center justify-center gap-2 shadow-md transition-colors duration-200 disabled:cursor-wait disabled:opacity-70 ${
          showLabel
            ? `rounded-2xl border px-4 py-2 text-xs font-semibold sm:text-sm ${
                saved ? 'border-red-300 bg-red-50 text-red-600' : 'border-gray-200 bg-white text-gray-700 hover:border-teal-300'
              }`
            : 'rounded-full bg-white/95 hover:bg-white p-2'
        }`}
      >
        {/* Micro-burst 240ms khi lưu thành công */}
        <AnimatePresence>
          {burstKey > 0 && (
            <motion.span
              key={burstKey}
              initial={{ scale: 0.6, opacity: 0.85 }}
              animate={{ scale: 1.65, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              onAnimationComplete={() => setBurstKey(0)}
              className="pointer-events-none absolute inset-0 rounded-full border-2 border-rose-400"
              aria-hidden="true"
            />
          )}
        </AnimatePresence>

        <motion.span
          key={saved ? 'saved' : 'unsaved'}
          initial={reducedMotion ? false : { scale: saved ? 0.75 : 0.9 }}
          animate={{ scale: 1 }}
          transition={SPRING.snappy}
          className="inline-flex"
        >
          <Icon
            size={showLabel ? 16 : 20}
            strokeWidth={2}
            className={`transition-colors duration-200 ${saved ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
          />
        </motion.span>
        {showLabel && <span>{pending ? 'Đang cập nhật…' : saved ? 'Đã lưu địa điểm' : 'Lưu địa điểm'}</span>}
      </motion.button>

      {canUseFavorites && status === 'error' && (
        <button
          type="button"
          aria-label="Tải lại trạng thái yêu thích"
          title={error ?? 'Thử lại'}
          className="rounded-full bg-white p-2 text-teal-700 shadow hover:bg-teal-50 transition-colors"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void reload();
          }}
        >
          <RefreshCw size={15} />
        </button>
      )}
    </span>
  );
}
