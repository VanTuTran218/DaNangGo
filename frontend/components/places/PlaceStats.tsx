'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Star, Eye, Tag } from 'lucide-react';
import { formatPriceRange } from '@/lib/mappers/place.mapper';

interface PlaceStatsProps {
  avgRating: number;
  reviewCount: number;
  viewCount: number;
  priceMin: number | null;
  priceMax: number | null;
  ticketPrice?: number | null;
}

/**
 * Hook Count-Up chạy số từ 0 đến target khi lọt vào tầm mắt
 */
function useCountUp(target: number, durationMs: number = 1200, startNow: boolean = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!startNow) return;
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / durationMs, 1);
      // Easing easeOutQuart
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(eased * target));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(target);
      }
    };
    window.requestAnimationFrame(step);
  }, [target, durationMs, startNow]);

  return count;
}

export default function PlaceStats({
  avgRating,
  reviewCount,
  viewCount,
  priceMin,
  priceMax,
  ticketPrice,
}: PlaceStatsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  // Animated counts
  const animatedReviews = useCountUp(reviewCount, 1200, isInView);
  const animatedViews = useCountUp(viewCount, 1400, isInView);

  return (
    <div
      ref={ref}
      className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-gray-100 mb-8"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
        {/* 1. Ô ĐÁNH GIÁ (RATING) */}
        <div className="flex items-center gap-4 py-3 sm:py-0 sm:pr-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 shrink-0 shadow-sm">
            <Star size={24} className="fill-amber-400 text-amber-400" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#0f2942]">
                {avgRating.toFixed(1)}
              </span>
              <span className="text-xs text-gray-400 font-semibold">/ 5.0</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <motion.div
                    key={s}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.3, delay: s * 0.08 }}
                  >
                    <Star
                      size={13}
                      className={
                        s <= Math.round(avgRating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-gray-200'
                      }
                    />
                  </motion.div>
                ))}
              </div>
              <span className="text-xs text-gray-500 font-medium">
                ({animatedReviews.toLocaleString('vi-VN')} đánh giá)
              </span>
            </div>
          </div>
        </div>

        {/* 2. Ô KHOẢNG GIÁ (PRICE RANGE) */}
        <div className="flex items-center gap-4 py-3 sm:py-0 sm:px-6">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500 shrink-0 shadow-sm">
            <Tag size={22} className="text-orange-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
              Mức giá tham khảo
            </p>
            <p className="text-lg sm:text-2xl font-extrabold text-orange-500 tracking-tight">
              {formatPriceRange(priceMin, priceMax, ticketPrice)}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Phù hợp mọi nhu cầu thực khách
            </p>
          </div>
        </div>

        {/* 3. Ô LƯỢT XEM (VIEWS COUNT) */}
        <div className="flex items-center gap-4 py-3 sm:py-0 sm:pl-6">
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 flex items-center justify-center text-cyan-600 shrink-0 shadow-sm">
            <Eye size={22} className="text-cyan-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
              Lượt quan tâm
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#0f2942]">
                {animatedViews.toLocaleString('vi-VN')}
              </span>
              <span className="text-xs text-gray-400 font-medium">lượt xem</span>
            </div>
            <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Đang được tìm kiếm nhiều
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
