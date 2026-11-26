'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { MapPin, Clock, Info, ChevronDown, ChevronUp, ArrowUpRight } from 'lucide-react';
import type { PlaceDetail } from '@/lib/api/places';
import { formatPlaceAddress } from '@/lib/mappers/place.mapper';

interface PlaceInfoProps {
  place: PlaceDetail;
  onOpenMap: () => void;
}

export default function PlaceInfo({ place, onOpenMap }: PlaceInfoProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const reducedMotion = useReducedMotion();

  const placeTypeStr = String(place.place_type);
  const introHeading =
    placeTypeStr === 'ACCOMMODATION'
      ? 'Giới thiệu không gian & Lưu trú'
      : placeTypeStr === 'ATTRACTION'
        ? 'Giới thiệu điểm đến & Trải nghiệm'
        : placeTypeStr === 'CAFE'
          ? 'Giới thiệu không gian & Cà phê'
          : 'Giới thiệu không gian & Ẩm thực';

  const fullDescription =
    place.description ||
    `${place.name} là điểm hẹn nổi bật tại Đà Nẵng, được du khách yêu thích nhờ không gian tinh tế, dịch vụ chu đáo và vị trí thuận tiện để khám phá thành phố biển.`;

  const isLongDescription = fullDescription.length > 220;

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="bg-[#FFFDF9] rounded-[16px] p-6 sm:p-8 border border-[#E5DAC8] shadow-[0_14px_38px_rgba(16,40,50,0.05)] mb-8 space-y-6"
    >
      {/* 2 Ô CÂN ĐỐI: ĐỊA CHỈ & GIỜ MỞ CỬA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Ô 1: ĐỊA CHỈ */}
        <button
          type="button"
          onClick={onOpenMap}
          className="text-left p-5 rounded-[12px] bg-[#F7F2E8] hover:bg-[#F2EAD9] border border-[#E5DAC8] hover:border-[#C9B580] transition-all duration-250 cursor-pointer group flex items-start gap-3.5"
        >
          <div className="w-10 h-10 rounded-full bg-[#091E27] text-[#E6D9B7] flex items-center justify-center shrink-0 shadow-xs">
            <MapPin size={17} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#216B70] mb-1">
              Vị trí &amp; Địa chỉ
            </p>
            <p className="text-sm font-semibold text-[#102832] leading-snug line-clamp-2">
              {formatPlaceAddress(place.address, place.district_name)}
            </p>
            <p className="inline-flex items-center gap-1 text-xs text-[#216B70] font-semibold mt-2 group-hover:text-[#102832] transition-colors">
              <span>Xem đường đi trên bản đồ</span>
              <ArrowUpRight size={13} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </p>
          </div>
        </button>

        {/* Ô 2: GIỜ MỞ CỬA */}
        <div className="p-5 rounded-[12px] bg-[#F7F2E8] border border-[#E5DAC8] flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-full bg-[#091E27] text-[#E87B39] flex items-center justify-center shrink-0 shadow-xs">
            <Clock size={17} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#216B70]">
                Khung giờ hôm nay
              </p>
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                  place.isOpenNow
                    ? 'bg-[#216B70]/12 text-[#175458] border-[#216B70]/30'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {place.isOpenNow ? 'Đang mở cửa' : 'Đã đóng cửa'}
              </span>
            </div>
            <p className="home-serif text-lg font-semibold text-[#102832]">
              {place.today_hours || '08:00 – 22:00'}
            </p>
            <p className="text-xs text-[#4E5E63] mt-1">
              Theo múi giờ Việt Nam (UTC+7)
            </p>
          </div>
        </div>
      </div>

      {/* MÔ TẢ GIỚI THIỆU */}
      <div className="pt-5 border-t border-[#E8DDCF]">
        <div className="flex items-center gap-3 mb-3.5">
          <span className="w-8 h-8 rounded-full bg-[#F6EFE2] border border-[#E5DAC8] text-[#216B70] flex items-center justify-center shrink-0">
            <Info size={15} />
          </span>
          <h2 className="home-serif text-xl sm:text-2xl font-semibold text-[#102832] tracking-[-0.01em]">
            {introHeading}
          </h2>
        </div>

        <div className="relative text-[#3E4E54] text-sm sm:text-[15.5px] leading-[1.78]">
          <p className={`${!isExpanded && isLongDescription ? 'line-clamp-3' : ''}`}>
            {fullDescription}
          </p>

          {isLongDescription && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-3.5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#216B70] hover:text-[#102832] transition-colors cursor-pointer"
            >
              <span>{isExpanded ? 'Thu gọn nội dung' : 'Đọc thêm giới thiệu'}</span>
              {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
