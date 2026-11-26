'use client';

import { motion } from 'framer-motion';
import {
  Navigation,
  ExternalLink,
  Phone,
  Globe,
  ShieldCheck,
  Clock,
  Sparkles,
  MapPin,
  CalendarCheck,
} from 'lucide-react';
import type { PlaceDetail } from '@/lib/api/places';

interface BookingSidebarProps {
  place: PlaceDetail;
  onOpenMap: () => void;
}

export default function BookingSidebar({ place, onOpenMap }: BookingSidebarProps) {
  const directionLabel =
    place.place_type === 'ACCOMMODATION'
      ? 'Chỉ đường đến nơi lưu trú'
      : place.place_type === 'ATTRACTION'
        ? 'Chỉ đường đến điểm tham quan'
        : 'Chỉ đường đến quán';

  const bookingLabel =
    place.place_type === 'ACCOMMODATION'
      ? 'Đặt phòng trực tiếp'
      : place.place_type === 'ATTRACTION'
        ? 'Đặt vé trực tuyến'
        : 'Đặt bàn trực tiếp';

  return (
    <>
      {/* DESKTOP / TABLET STICKY CONCIERGE SIDEBAR (Four Seasons Deep Ocean Dark Card) */}
      <aside className="w-full">
        <div className="relative rounded-[18px] bg-[#091E27] p-6 sm:p-7 border border-[#E6D9B7]/32 sticky top-24 space-y-6 shadow-[0_24px_60px_rgba(8,22,28,0.2)] overflow-hidden">
          {/* Subtle top Champagne rim reflection */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#E6D9B7]/55 to-transparent"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 80% 55% at 80% 10%, rgba(230,217,183,0.11) 0%, rgba(33,107,112,0.14) 45%, transparent 78%)',
            }}
          />

          {/* Header Sidebar */}
          <div className="relative z-10 pb-4 border-b border-[#E6D9B7]/20">
            <div className="flex items-center gap-2 mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[#E6D9B7]">
              <Sparkles size={12.5} className="text-[#E87B39]" />
              <span>Tiện ích &amp; Dịch vụ</span>
            </div>
            <h3 className="home-serif text-xl sm:text-[22px] font-semibold text-[#FFFDF5] leading-snug">
              Thông tin liên hệ &amp; Đặt chỗ
            </h3>
          </div>

          {/* NHÓM NÚT HÀNH ĐỘNG CHÍNH */}
          <div className="relative z-10 space-y-3">
            {/* 1. NÚT CHỈ ĐƯỜNG (Luminous Pearl Ivory Luxury Pill CTA) */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={onOpenMap}
              className="luxury-btn-sweep relative w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-full bg-[#FFF8E9] hover:bg-white text-[#102832] border border-[#E6D9B7]/75 font-semibold uppercase tracking-[0.12em] text-xs shadow-[0_10px_28px_rgba(4,14,20,0.4)] transition-all group cursor-pointer"
            >
              <Navigation
                size={15}
                className="text-[#0F4C5C] transition-transform group-hover:translate-x-0.5"
              />
              <span className="relative z-10">{directionLabel}</span>
            </motion.button>

            {/* 2. NÚT ĐẶT BÀN / ĐẶT PHÒNG / ĐẶT VÉ (NẾU CÓ BOOKING_URL) */}
            {place.booking_url ? (
              <motion.a
                whileTap={{ scale: 0.98 }}
                href={place.booking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="luxury-btn-sweep w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-full bg-[#CB712D] hover:bg-[#D97A32] border border-[#F6C89F]/40 text-white font-semibold uppercase tracking-[0.12em] text-xs shadow-[0_10px_24px_rgba(203,113,45,0.35)] transition-all text-center"
              >
                <CalendarCheck size={15} />
                <span>{bookingLabel}</span>
                <ExternalLink size={13} className="opacity-85" />
              </motion.a>
            ) : null}

            {/* 3. NÚT XEM VỊ TRÍ TRÊN GOOGLE MAPS */}
            <button
              type="button"
              onClick={onOpenMap}
              className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-full border border-[#E6D9B7]/30 hover:border-[#E6D9B7]/70 bg-white/[0.06] hover:bg-white/[0.12] text-[#FFFDF5] font-semibold uppercase tracking-[0.1em] text-xs transition-all cursor-pointer"
            >
              <MapPin size={15} className="text-[#E6D9B7]" />
              <span>Xem vị trí trên Google Maps</span>
            </button>
          </div>

          {/* DANH SÁCH THÔNG TIN LIÊN LẠC CHI TIẾT */}
          {(place.phone || place.website) && (
            <div className="relative z-10 space-y-2.5 pt-4 border-t border-[#E6D9B7]/20 text-sm">
              {place.phone ? (
                <a
                  href={`tel:${place.phone}`}
                  className="flex items-center gap-3 p-3.5 rounded-[12px] bg-white/[0.06] hover:bg-white/[0.11] border border-[#E6D9B7]/20 hover:border-[#E6D9B7]/50 transition-all text-[#FFFDF5] font-medium group"
                >
                  <div className="w-9 h-9 rounded-full bg-[#FFF8E9]/10 border border-[#E6D9B7]/25 flex items-center justify-center text-[#E87B39] shrink-0">
                    <Phone size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-[#E6D9B7]/75 font-semibold uppercase tracking-[0.14em]">
                      Điện thoại
                    </p>
                    <p className="font-semibold text-[#FFFDF5] group-hover:text-[#F5E6C4] truncate">
                      {place.phone}
                    </p>
                  </div>
                </a>
              ) : null}

              {place.website ? (
                <a
                  href={place.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3.5 rounded-[12px] bg-white/[0.06] hover:bg-white/[0.11] border border-[#E6D9B7]/20 hover:border-[#E6D9B7]/50 transition-all text-[#FFFDF5] font-medium group"
                >
                  <div className="w-9 h-9 rounded-full bg-[#FFF8E9]/10 border border-[#E6D9B7]/25 flex items-center justify-center text-[#E6D9B7] shrink-0">
                    <Globe size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-[#E6D9B7]/75 font-semibold uppercase tracking-[0.14em]">
                      Website
                    </p>
                    <p className="font-semibold text-[#FFFDF5] group-hover:text-[#F5E6C4] truncate">
                      {place.website.replace(/^https?:\/\//, '')}
                    </p>
                  </div>
                  <ExternalLink size={13} className="text-[#CBD9DA]/75 mr-1 shrink-0" />
                </a>
              ) : null}
            </div>
          )}

          {/* CAM KẾT & XÁC THỰC CỦA HỆ THỐNG */}
          <div className="relative z-10 pt-4 border-t border-[#E6D9B7]/20 space-y-2.5 text-xs text-[#CBD9DA]/85">
            <div className="flex items-center gap-2.5">
              <ShieldCheck size={15} className="text-[#69A5A3] shrink-0" />
              <span className="font-medium">Thông tin đã được xác minh bởi DaNangGo</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Clock size={15} className="text-[#E87B39] shrink-0" />
              <span className="font-medium">Giờ mở cửa theo chuẩn giờ Việt Nam (UTC+7)</span>
            </div>
          </div>
        </div>
      </aside>

      {/* MOBILE BOTTOM CTA BAR */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#091E27]/95 backdrop-blur-md border-t border-[#E6D9B7]/25 px-4 py-3 shadow-[0_-12px_32px_rgba(4,14,20,0.35)] flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMap}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-[#FFF8E9] active:scale-95 text-[#102832] font-semibold uppercase tracking-[0.1em] text-xs"
        >
          <Navigation size={15} className="text-[#0F4C5C]" />
          <span>Chỉ đường</span>
        </button>

        {place.booking_url ? (
          <a
            href={place.booking_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-[#CB712D] active:scale-95 text-white font-semibold uppercase tracking-[0.1em] text-xs text-center"
          >
            <span>{place.place_type === 'ACCOMMODATION' ? 'Đặt phòng' : 'Đặt chỗ'}</span>
            <ExternalLink size={13} />
          </a>
        ) : place.phone ? (
          <a
            href={`tel:${place.phone}`}
            className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-full border border-[#E6D9B7]/35 text-[#FFFDF5] font-semibold text-xs bg-white/10"
          >
            <Phone size={14} className="text-[#E87B39]" />
            <span>Gọi ngay</span>
          </a>
        ) : null}
      </div>
    </>
  );
}
