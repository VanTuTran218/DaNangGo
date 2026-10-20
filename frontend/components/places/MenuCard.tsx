'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Sparkles, Utensils } from 'lucide-react';
import type { MenuItemDetail } from '@/lib/api/places';
import { formatCurrency } from '@/lib/mappers/place.mapper';

const BLUR_PLACEHOLDER =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

interface MenuCardProps {
  item: MenuItemDetail;
  index: number;
}

/**
 * Định nghĩa màu sắc và gradient riêng biệt cho từng khẩu vị
 */
export const TASTE_CONFIG: Record<
  string,
  { bg: string; text: string; border: string; gradient: string }
> = {
  Cay: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    gradient: 'from-rose-500 via-red-500 to-amber-500',
  },
  'Cay nồng': {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    gradient: 'from-red-600 to-orange-500',
  },
  Béo: {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    gradient: 'from-amber-400 via-orange-400 to-yellow-500',
  },
  Ngọt: {
    bg: 'bg-pink-50',
    text: 'text-pink-700',
    border: 'border-pink-200',
    gradient: 'from-pink-400 via-rose-400 to-amber-300',
  },
  Mặn: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    gradient: 'from-blue-500 to-teal-400',
  },
  'Đậm đà': {
    bg: 'bg-orange-50',
    text: 'text-orange-800',
    border: 'border-orange-200',
    gradient: 'from-orange-500 via-amber-600 to-red-600',
  },
  'Thanh đạm': {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    gradient: 'from-emerald-400 via-teal-500 to-cyan-500',
  },
  Chua: {
    bg: 'bg-lime-50',
    text: 'text-lime-800',
    border: 'border-lime-200',
    gradient: 'from-lime-400 to-emerald-500',
  },
  'Giòn rụm': {
    bg: 'bg-yellow-50',
    text: 'text-yellow-800',
    border: 'border-yellow-200',
    gradient: 'from-yellow-400 to-amber-500',
  },
};

export const DEFAULT_TASTE_STYLE = {
  bg: 'bg-gray-100',
  text: 'text-gray-700',
  border: 'border-gray-200',
  gradient: 'from-slate-400 via-gray-500 to-zinc-600',
};

export default function MenuCard({ item, index }: MenuCardProps) {
  // Xác định khẩu vị nổi bật đầu tiên để tạo placeholder gradient nếu thiếu ảnh
  const primaryTaste = item.tastes?.[0]?.name || 'Đặc sắc';
  const style = TASTE_CONFIG[primaryTaste] || DEFAULT_TASTE_STYLE;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35, delay: (index % 6) * 0.06 }}
      whileHover={{ y: -4 }}
      className="group bg-white rounded-2xl p-4 border border-gray-100 hover:border-orange-200 hover:shadow-xl transition-all duration-300 flex flex-col h-full"
    >
      <div className="flex gap-4 items-start">
        {/* Ảnh món ăn hoặc Placeholder Gradient theo khẩu vị */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shrink-0 shadow-inner">
          {item.image_url ? (
            <Image
              src={item.image_url}
              alt={item.name}
              fill
              className="object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
              placeholder="blur"
              blurDataURL={BLUR_PLACEHOLDER}
              sizes="112px"
            />
          ) : (
            // Placeholder gradient độc bản theo khẩu vị (tránh lặp 1 ảnh cho mọi món)
            <div
              className={`w-full h-full bg-gradient-to-br ${style.gradient} flex flex-col items-center justify-center text-white p-2 text-center group-hover:scale-105 transition-transform duration-500`}
            >
              <Utensils size={24} className="mb-1 text-white/90 drop-shadow-sm" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/95 line-clamp-1">
                {primaryTaste}
              </span>
            </div>
          )}
        </div>

        {/* Thông tin tên & mô tả (ghim line-clamp-2 chuẩn) */}
        <div className="flex-1 min-w-0">
          <h4 className="font-extrabold text-sm sm:text-base text-[#0f2942] group-hover:text-orange-500 transition-colors leading-snug line-clamp-1 mb-1">
            {item.name}
          </h4>

          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-2">
            {item.description ||
              `Món ngon hấp dẫn với hương vị đậm đà, được chế biến từ nguyên liệu tươi mới mỗi ngày tại nhà hàng.`}
          </p>
        </div>
      </div>

      {/* ĐÁY THẺ: GIÁ TIỀN & TAG KHẨU VỊ (LUÔN GHIM Ở ĐÁY mt-auto) */}
      <div className="mt-auto pt-3 border-t border-gray-50 flex flex-wrap items-end justify-between gap-2">
        {/* Giá tiền cam đậm nổi bật */}
        <div>
          <span className="text-base sm:text-lg font-extrabold text-orange-500 tracking-tight">
            {formatCurrency(item.price)}
          </span>
          <span className="text-[10px] text-gray-400 block font-medium">/ phần</span>
        </div>

        {/* Tag khẩu vị */}
        {item.tastes && item.tastes.length > 0 && (
          <div className="flex flex-wrap gap-1 justify-end">
            {item.tastes.map((taste) => {
              const tasteStyle = TASTE_CONFIG[taste.name] || DEFAULT_TASTE_STYLE;
              return (
                <span
                  key={taste.taste_id}
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${tasteStyle.bg} ${tasteStyle.text} ${tasteStyle.border}`}
                >
                  <Sparkles size={10} className="shrink-0" />
                  <span>{taste.name}</span>
                </span>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
