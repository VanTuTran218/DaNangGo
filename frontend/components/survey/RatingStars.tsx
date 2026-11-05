'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';

interface RatingStarsProps {
  value: number; // 0: chưa chọn / chưa dùng, 1-5: số sao
  onChange: (score: number) => void;
  showEmojiText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

const EMOJI_MAP: Record<number, { emoji: string; label: string; color: string }> = {
  1: { emoji: '😠', label: 'Rất tệ', color: 'text-rose-600' },
  2: { emoji: '🙁', label: 'Chưa tốt', color: 'text-orange-500' },
  3: { emoji: '😐', label: 'Bình thường', color: 'text-amber-500' },
  4: { emoji: '😊', label: 'Hài lòng', color: 'text-teal-600' },
  5: { emoji: '🤩', label: 'Rất tuyệt vời', color: 'text-emerald-600' },
};

export default function RatingStars({
  value,
  onChange,
  showEmojiText = true,
  size = 'md',
  disabled = false,
}: RatingStarsProps) {
  const [hoveredScore, setHoveredScore] = useState<number | null>(null);

  const activeScore = hoveredScore !== null ? hoveredScore : value;
  const currentEmoji = EMOJI_MAP[activeScore];

  const starSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6 sm:w-7 sm:h-7',
    lg: 'w-8 h-8 sm:w-9 sm:h-9',
  }[size];

  const handleKeyDown = (e: React.KeyboardEvent, star: number) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange(star);
    } else if (e.key === 'ArrowRight' && star < 5) {
      e.preventDefault();
      onChange(star + 1);
    } else if (e.key === 'ArrowLeft' && star > 1) {
      e.preventDefault();
      onChange(star - 1);
    }
  };

  return (
    <div className="inline-flex items-center gap-3 select-none">
      {/* 5 ngôi sao */}
      <div
        role="radiogroup"
        aria-label="Đánh giá từ 1 đến 5 sao"
        className="flex items-center gap-1 sm:gap-1.5"
        onMouseLeave={() => setHoveredScore(null)}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = activeScore >= star;
          const isSelected = value === star;

          return (
            <motion.button
              key={star}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${star} sao - ${EMOJI_MAP[star].label}`}
              disabled={disabled}
              onClick={() => onChange(star)}
              onMouseEnter={() => setHoveredScore(star)}
              onKeyDown={(e) => handleKeyDown(e, star)}
              whileHover={{ scale: disabled ? 1 : 1.2 }}
              whileTap={{ scale: disabled ? 1 : 0.9 }}
              className={`p-1 rounded-xl cursor-pointer transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-teal-500 ${
                disabled ? 'cursor-not-allowed opacity-40' : ''
              }`}
            >
              <Star
                className={`${starSizes} transition-colors duration-150 ${
                  isFilled
                    ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                    : 'fill-slate-100 text-slate-300 hover:text-amber-300'
                }`}
              />
            </motion.button>
          );
        })}
      </div>

      {/* Emoji phóng to khi chọn + nhãn chữ */}
      {showEmojiText && (
        <div className="min-w-[110px] flex items-center gap-1.5">
          <AnimatePresence mode="wait">
            {currentEmoji ? (
              <motion.div
                key={activeScore}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                className="flex items-center gap-1.5"
              >
                <span className="text-xl sm:text-2xl" aria-hidden="true">
                  {currentEmoji.emoji}
                </span>
                <span className={`text-xs sm:text-sm font-bold ${currentEmoji.color}`}>
                  {currentEmoji.label}
                </span>
              </motion.div>
            ) : (
              <span className="text-xs text-slate-400 font-medium">Chưa chấm</span>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
