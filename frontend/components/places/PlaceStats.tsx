'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { Star, Eye, Tag } from 'lucide-react';
import { formatPriceRange } from '@/lib/mappers/place.mapper';
import type { PlaceType } from '@/lib/api/places';

interface PlaceStatsProps {
  avgRating: number;
  reviewCount: number;
  viewCount: number;
  priceMin: number | null;
  priceMax: number | null;
  ticketPrice?: number | null;
  placeType?: PlaceType;
}

function useCountUp(
  target: number,
  durationMs: number = 1200,
  startNow: boolean = false,
  skipAnimation: boolean = false
) {
  const [count, setCount] = useState(skipAnimation ? target : 0);

  useEffect(() => {
    if (skipAnimation) {
      setCount(target);
      return;
    }
    if (!startNow) return;
    let rafId = 0;
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(eased * target));
      if (progress < 1) {
        rafId = window.requestAnimationFrame(step);
      } else {
        setCount(target);
      }
    };
    rafId = window.requestAnimationFrame(step);
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [target, durationMs, startNow, skipAnimation]);

  return count;
}

export default function PlaceStats({
  avgRating,
  reviewCount,
  viewCount,
  priceMin,
  priceMax,
  ticketPrice,
  placeType,
}: PlaceStatsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = Boolean(useReducedMotion());
  const isInView = useInView(ref, { once: true, margin: '-40px' });

  const animatedReviews = useCountUp(reviewCount, 1100, isInView, reducedMotion);
  const animatedViews = useCountUp(viewCount, 1250, isInView, reducedMotion);

  const priceSubnote =
    placeType === 'ACCOMMODATION'
      ? 'Mức giá tham khảo mỗi đêm'
      : placeType === 'ATTRACTION'
        ? 'Chi phí tham quan dự kiến'
        : 'Phù hợp mọi nhu cầu thực khách';

  return (
    <motion.div
      ref={ref}
      initial={reducedMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="relative rounded-[16px] bg-[#091E27] p-6 sm:p-7 border border-[#E6D9B7]/30 shadow-[0_20px_52px_rgba(8,22,28,0.16)] mb-8 overflow-hidden"
    >
      {/* Subtle Champagne top rim + coastal radial light */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#E6D9B7]/55 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 80% at 88% 20%, rgba(230,217,183,0.10) 0%, rgba(33,107,112,0.14) 48%, transparent 78%)',
        }}
      />

      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#E6D9B7]/18">
        {/* 1. Ô ĐÁNH GIÁ (RATING) */}
        <div className="flex items-center gap-4 py-3.5 sm:py-0 sm:pr-6">
          <div className="w-12 h-12 rounded-[12px] bg-[#FFF8E9]/8 border border-[#E6D9B7]/28 flex items-center justify-center text-[#E87B39] shrink-0">
            <Star size={21} className="fill-[#E87B39] text-[#E87B39]" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="home-serif text-3xl sm:text-[34px] font-semibold text-[#FFFDF5] leading-none">
                {avgRating.toFixed(1)}
              </span>
              <span className="text-xs text-[#CBD9DA]/75 font-medium">/ 5.0</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <motion.div
                    key={s}
                    initial={reducedMotion ? false : { opacity: 0, scale: 0.6 }}
                    animate={isInView || reducedMotion ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.28, delay: s * 0.06 }}
                  >
                    <Star
                      size={11.5}
                      className={
                        s <= Math.round(avgRating)
                          ? 'fill-[#E87B39] text-[#E87B39]'
                          : 'text-white/20'
                      }
                    />
                  </motion.div>
                ))}
              </div>
              <span className="text-xs text-[#CBD9DA]/80 font-medium">
                ({animatedReviews.toLocaleString('vi-VN')} đánh giá)
              </span>
            </div>
          </div>
        </div>

        {/* 2. Ô KHOẢNG GIÁ (PRICE RANGE) */}
        <div className="flex items-center gap-4 py-3.5 sm:py-0 sm:px-6">
          <div className="w-12 h-12 rounded-[12px] bg-[#FFF8E9]/8 border border-[#E6D9B7]/28 flex items-center justify-center text-[#E6D9B7] shrink-0">
            <Tag size={19} className="text-[#E6D9B7]" />
          </div>
          <div className="min-w-0">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#E6D9B7]/85 mb-1">
              Mức giá tham khảo
            </p>
            <p className="home-serif text-base sm:text-[17px] font-semibold text-[#F5E4BC] tracking-tight leading-snug break-words">
              {formatPriceRange(priceMin, priceMax, ticketPrice)}
            </p>
            <p className="text-[11px] text-[#CBD9DA]/75 mt-0.5 truncate">
              {priceSubnote}
            </p>
          </div>
        </div>

        {/* 3. Ô LƯỢT XEM (VIEWS COUNT) */}
        <div className="flex items-center gap-4 py-3.5 sm:py-0 sm:pl-6">
          <div className="w-12 h-12 rounded-[12px] bg-[#FFF8E9]/8 border border-[#E6D9B7]/28 flex items-center justify-center text-[#69A5A3] shrink-0">
            <Eye size={19} className="text-[#69A5A3]" />
          </div>
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#E6D9B7]/85 mb-1">
              Lượt quan tâm
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="home-serif text-3xl sm:text-[34px] font-semibold text-[#FFFDF5] leading-none">
                {animatedViews.toLocaleString('vi-VN')}
              </span>
              <span className="text-xs text-[#CBD9DA]/75 font-medium">lượt xem</span>
            </div>
            <p className="text-[11px] text-[#A8D5D3] font-medium flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E87B39]" />
              Đang được tìm kiếm nhiều
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
