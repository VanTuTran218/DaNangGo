'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Calendar,
  MapPin,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { EVENT_TYPES, STATUS_LABELS, TICKET_TYPES, type Event } from '@/types/event';
import { formatEventCardDate, isMultiDayEvent } from '@/lib/api/events';
import { SpotlightCard } from '@/components/ui/MotionPrimitives';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1200&q=85&auto=format&fit=crop';

const CATEGORY_BADGE_BG: Record<string, string> = {
  FESTIVAL: 'bg-rose-500',
  MUSIC: 'bg-purple-600',
  FOOD: 'bg-orange-500',
  SPORTS: 'bg-sky-600',
  EXHIBITION: 'bg-indigo-600',
  WORKSHOP: 'bg-teal-600',
  FAMILY: 'bg-emerald-600',
};

const CATEGORY_PILL_LIGHT: Record<string, string> = {
  FESTIVAL: 'bg-rose-50 text-rose-700 border-rose-100',
  MUSIC: 'bg-purple-50 text-purple-700 border-purple-100',
  FOOD: 'bg-orange-50 text-orange-700 border-orange-100',
  SPORTS: 'bg-sky-50 text-sky-700 border-sky-100',
  EXHIBITION: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  WORKSHOP: 'bg-teal-50 text-teal-700 border-teal-100',
  FAMILY: 'bg-emerald-50 text-emerald-700 border-emerald-100',
};

const STATUS_BADGE_STYLES: Record<string, string> = {
  RESCHEDULED: 'bg-amber-500 text-white',
  POSTPONED: 'bg-orange-600 text-white',
  CANCELLED: 'bg-red-600 text-white',
};

export interface EventCardProps {
  event: Event;
  priority?: boolean;
}

export default function EventCard({ event, priority = false }: EventCardProps) {
  const [imgError, setImgError] = useState(false);

  const detailHref = `/su-kien/${encodeURIComponent(event.slug || event.id || '')}`;
  const categoryLabel =
    EVENT_TYPES[event.eventType as keyof typeof EVENT_TYPES] || event.eventType || 'Sự kiện';
  const topBadgeBg = CATEGORY_BADGE_BG[event.eventType] || 'bg-teal-600';
  const lightPillClass =
    CATEGORY_PILL_LIGHT[event.eventType] || 'bg-teal-50 text-teal-700 border-teal-100';

  const multiDay = isMultiDayEvent(event);
  const hasSpecialStatus =
    event.status === 'RESCHEDULED' || event.status === 'POSTPONED' || event.status === 'CANCELLED';

  const ticketHeadline =
    event.ticketType === 'PAID'
      ? event.ticketPriceDisplay || 'Có phí'
      : event.ticketType === 'FREE_REGISTRATION'
        ? 'Miễn phí'
        : event.ticketType === 'FREE_OPEN'
          ? 'Miễn phí'
          : TICKET_TYPES[event.ticketType] || 'Đang cập nhật';

  const ticketSubnote =
    event.ticketType === 'PAID'
      ? '/vé tham dự'
      : event.ticketType === 'FREE_REGISTRATION'
        ? 'Cần đăng ký trước'
        : event.ticketType === 'FREE_OPEN'
          ? 'Vào cửa tự do'
          : '';

  const isFree = event.ticketType === 'FREE_OPEN' || event.ticketType === 'FREE_REGISTRATION';

  return (
    <motion.div
      layout="position"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25 }}
      className="h-full"
    >
      <SpotlightCard className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 ease-out border border-gray-100 hover:border-teal-300/80 flex flex-col h-full">
        {/* Ảnh bìa sự kiện (đồng bộ chiều cao h-52 với trang Lưu trú & Ẩm thực) */}
        <Link
          href={detailHref}
          className="block relative h-52 overflow-hidden shrink-0 bg-slate-100"
        >
          <Image
            src={imgError || !event.imageUrl ? FALLBACK_IMAGE : event.imageUrl}
            alt={event.name}
            fill
            priority={priority}
            unoptimized
            onError={() => setImgError(true)}
            className="object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent opacity-80" />

          {/* Badge góc trên trái */}
          <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 max-w-[85%]">
            {hasSpecialStatus ? (
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full shadow-sm ${
                  STATUS_BADGE_STYLES[event.status] || 'bg-slate-700 text-white'
                }`}
              >
                <AlertTriangle className="w-3 h-3 shrink-0" />
                {STATUS_LABELS[event.status]}
              </span>
            ) : (
              <span
                className={`inline-flex items-center gap-1 ${topBadgeBg} text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm ${
                  event.isFeatured ? 'animate-[pulse_2.2s_ease-in-out_infinite]' : ''
                }`}
              >
                {event.isFeatured && <Sparkles className="w-3 h-3 shrink-0" />}
                {event.isFeatured ? `Nổi bật · ${categoryLabel}` : categoryLabel}
              </span>
            )}
          </div>

          {/* Chip nhiều ngày góc trên phải */}
          {multiDay && (
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center gap-1 bg-black/55 backdrop-blur-md text-white text-[10px] font-semibold px-2.5 py-1 rounded-full border border-white/20">
                <Clock className="w-3 h-3 text-cyan-300 shrink-0" />
                Nhiều ngày
              </span>
            </div>
          )}

          {/* Thời gian sự kiện góc dưới ảnh — glass pill */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full backdrop-blur-md bg-black/55 text-white border border-white/15 truncate">
              <Calendar className="w-3 h-3 text-cyan-300 shrink-0" />
              <span className="truncate">
                {formatEventCardDate(event.startAt, event.endAt, event.isAllDay)}
              </span>
            </span>
          </div>
        </Link>

        {/* Nội dung Card */}
        <div className="p-5 flex flex-col flex-1 justify-between">
          <div>
            {/* Danh mục + Quận/Huyện */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${lightPillClass}`}
              >
                {categoryLabel}
              </span>
              {event.district && (
                <span className="text-xs text-gray-400 font-medium truncate">
                  {event.district}, Đà Nẵng
                </span>
              )}
            </div>

            <Link href={detailHref}>
              <h3 className="font-bold text-[#0f2942] group-hover:text-teal-600 transition-colors text-base leading-snug line-clamp-2 mb-1.5">
                {event.name}
              </h3>
            </Link>

            {/* Địa điểm */}
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2.5">
              <MapPin size={13} className="text-teal-600 shrink-0" />
              <span className="truncate font-medium text-gray-700">
                {event.locationName || event.address || 'Đà Nẵng'}
              </span>
            </div>

            {/* Mô tả ngắn */}
            <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed mb-3">
              {event.shortDescription}
            </p>

            {/* Thông báo đổi lịch / tạm hoãn / đã hủy */}
            {hasSpecialStatus && event.changeNote && (
              <div
                className={`mb-3 rounded-xl px-3 py-2 text-[11px] leading-snug border ${
                  event.status === 'CANCELLED'
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <p className="font-semibold line-clamp-2">{event.changeNote}</p>
              </div>
            )}
          </div>

          {/* Giá vé + Nút "Xem chi tiết" đồng bộ với Lưu trú & Ẩm thực */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p
                className={`font-bold text-sm leading-tight truncate ${
                  isFree ? 'text-emerald-600' : 'text-orange-600'
                }`}
              >
                {ticketHeadline}
              </p>
              {ticketSubnote && (
                <p className="text-[10px] text-gray-400 truncate">{ticketSubnote}</p>
              )}
            </div>

            <Link
              href={detailHref}
              className="btn-ripple inline-flex items-center gap-1.5 bg-[#0f2942] hover:bg-teal-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs group-hover:scale-105 shrink-0"
            >
              <span>Xem chi tiết</span>
              <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </SpotlightCard>
    </motion.div>
  );
}
