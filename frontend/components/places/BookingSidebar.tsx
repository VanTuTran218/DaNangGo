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
  return (
    <>
      {/* DESKTOP / TABLET STICKY SIDEBAR (4 CỘT) */}
      <aside className="w-full">
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-md border border-gray-100 sticky top-24 space-y-6">
          {/* Header Sidebar */}
          <div>
            <div className="flex items-center gap-2 mb-1 text-xs font-bold text-orange-600 uppercase tracking-wider">
              <Sparkles size={14} />
              <span>Tiện ích & Dịch vụ</span>
            </div>
            <h3 className="text-lg font-extrabold text-[#0f2942]">
              Thông tin liên hệ & Đặt chỗ
            </h3>
          </div>

          {/* NHÓM NÚT HÀNH ĐỘNG CHÍNH */}
          <div className="space-y-3">
            {/* 1. NÚT CHỈ ĐƯỜNG ĐẾN QUÁN VỚI HIỆU ỨNG ÁNH SÁNG QUÉT NGANG (SHINE EFFECT) */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onOpenMap}
              className="relative w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#0f2942] to-[#1a4267] hover:from-[#133454] hover:to-[#225585] text-white font-extrabold text-sm shadow-md overflow-hidden group cursor-pointer"
            >
              {/* Hiệu ứng ánh sáng quét ngang (Shine shimmer) */}
              <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

              <Navigation size={17} className="transition-transform group-hover:scale-110" />
              <span className="relative z-10">Chỉ đường đến quán</span>
            </motion.button>

            {/* 2. NÚT ĐẶT BÀN / ĐẶT CHỖ (NẾU CÓ BOOKING_URL) */}
            {place.booking_url ? (
              <motion.a
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href={place.booking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-sm shadow-lg shadow-orange-500/25 transition-all text-center"
              >
                <CalendarCheck size={17} />
                <span>Đặt bàn trực tiếp</span>
                <ExternalLink size={14} className="opacity-80" />
              </motion.a>
            ) : null}

            {/* 3. NÚT XEM VỊ TRÍ TRÊN GOOGLE MAPS (DẠNG OUTLINE SANG TRỌNG) */}
            <button
              onClick={onOpenMap}
              className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-2xl border-2 border-gray-200 hover:border-cyan-500 hover:bg-cyan-50/40 text-gray-700 hover:text-cyan-700 font-bold text-xs sm:text-sm transition-all"
            >
              <MapPin size={16} className="text-cyan-600" />
              <span>Xem vị trí trên Google Maps</span>
            </button>
          </div>

          {/* DANH SÁCH THÔNG TIN LIÊN LẠC CHI TIẾT */}
          <div className="space-y-2.5 pt-2 border-t border-gray-100 text-sm">
            {/* Số điện thoại */}
            {place.phone ? (
              <a
                href={`tel:${place.phone}`}
                className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 hover:bg-orange-50 hover:text-orange-600 transition-all text-gray-700 font-medium group"
              >
                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm text-orange-500 group-hover:scale-110 transition-transform shrink-0">
                  <Phone size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-gray-400 font-semibold uppercase">Điện thoại</p>
                  <p className="font-bold text-gray-800 group-hover:text-orange-600 truncate">
                    {place.phone}
                  </p>
                </div>
              </a>
            ) : null}

            {/* Website quán */}
            {place.website ? (
              <a
                href={place.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 hover:bg-cyan-50 hover:text-cyan-600 transition-all text-gray-700 font-medium group"
              >
                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm text-cyan-600 group-hover:scale-110 transition-transform shrink-0">
                  <Globe size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-gray-400 font-semibold uppercase">Website</p>
                  <p className="font-bold text-gray-800 group-hover:text-cyan-600 truncate">
                    {place.website.replace(/^https?:\/\//, '')}
                  </p>
                </div>
                <ExternalLink size={13} className="text-gray-400 mr-1 shrink-0" />
              </a>
            ) : null}
          </div>

          {/* CAM KẾT & XÁC THỰC CỦA HỆ THỐNG */}
          <div className="pt-4 border-t border-gray-100 space-y-2.5 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
              <span className="font-medium">Thông tin đã được xác minh bởi DaNangGo</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-cyan-500 shrink-0" />
              <span className="font-medium">Dữ liệu giờ mở cửa theo chuẩn giờ Việt Nam (UTC+7)</span>
            </div>
          </div>
        </div>
      </aside>

      {/* MOBILE BOTTOM CTA BAR (CỐ ĐỊNH DƯỚI ĐÁY MÀN HÌNH TRÊN MOBILE) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 px-4 py-3 shadow-2xl flex items-center gap-3">
        <button
          onClick={onOpenMap}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#0f2942] active:scale-95 text-white font-extrabold text-sm shadow-md"
        >
          <Navigation size={16} />
          <span>Chỉ đường</span>
        </button>

        {place.booking_url ? (
          <a
            href={place.booking_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-orange-500 active:scale-95 text-white font-extrabold text-sm shadow-md text-center"
          >
            <span>Đặt bàn</span>
            <ExternalLink size={14} />
          </a>
        ) : place.phone ? (
          <a
            href={`tel:${place.phone}`}
            className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl border border-gray-200 text-gray-800 font-bold text-sm bg-gray-50"
          >
            <Phone size={15} className="text-orange-500" />
            <span>Gọi ngay</span>
          </a>
        ) : null}
      </div>
    </>
  );
}
