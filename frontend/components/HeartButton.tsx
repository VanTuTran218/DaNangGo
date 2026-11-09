'use client';

import { useState } from 'react';
import { Bookmark, Heart } from 'lucide-react';
import { useFavorites } from '@/contexts/FavoritesContext';

interface HeartButtonProps {
  placeId: number;
  variant?: 'heart' | 'bookmark';
  showLabel?: boolean;
}

export default function HeartButton({ placeId, variant = 'heart', showLabel = false }: HeartButtonProps) {
  const { ready, isAuthenticated, isFavorite, toggle } = useFavorites();
  const [pending, setPending] = useState(false);
  const saved = isFavorite(placeId);
  const Icon = variant === 'bookmark' ? Bookmark : Heart;

  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (pending || (isAuthenticated && !ready)) return;
    setPending(true);
    try {
      await toggle(placeId);
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      aria-label={saved ? 'Bỏ lưu địa điểm yêu thích' : 'Lưu địa điểm yêu thích'}
      aria-pressed={saved}
      disabled={pending || (isAuthenticated && !ready)}
      onClick={handleClick}
      className={`inline-flex items-center justify-center gap-2 shadow-md transition hover:scale-105 disabled:cursor-wait disabled:opacity-70 ${
        showLabel
          ? `rounded-2xl border px-4 py-2 text-xs font-semibold sm:text-sm ${saved ? 'border-red-300 bg-red-50 text-red-600' : 'border-gray-200 bg-white text-gray-700'}`
          : 'rounded-full bg-white/95 p-2'
      }`}
    >
      <Icon
        size={showLabel ? 16 : 20}
        strokeWidth={2}
        className={saved ? 'fill-red-500 text-red-500' : 'text-gray-600'}
      />
      {showLabel && <span>{saved ? 'Đã lưu địa điểm' : 'Lưu địa điểm'}</span>}
    </button>
  );
}
