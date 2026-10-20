'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, Info, ChevronDown, ChevronUp } from 'lucide-react';
import type { PlaceDetail } from '@/lib/api/places';

interface PlaceInfoProps {
  place: PlaceDetail;
  onOpenMap: () => void;
}

export default function PlaceInfo({ place, onOpenMap }: PlaceInfoProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const fullDescription =
    place.description ||
    `${place.name} là điểm hẹn ẩm thực trứ danh tại Đà Nẵng, nổi bật với nguồn nguyên liệu tươi ngon được tuyển chọn mỗi ngày từ các chợ đầu mối và vùng biển địa phương. Không gian ấm cúng, phong cách phục vụ chu đáo, mang đến trải nghiệm hương vị khó quên cho du khách thập phương và người dân bản địa.`;

  const isLongDescription = fullDescription.length > 220;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 mb-8 space-y-6">
      {/* 2 Ô CÂN ĐỐI: ĐỊA CHỈ & GIỜ MỞ CỬA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Ô 1: ĐỊA CHỈ */}
        <motion.div
          whileHover={{ y: -2 }}
          onClick={onOpenMap}
          className="p-4 sm:p-5 rounded-2xl bg-cyan-50/50 hover:bg-cyan-50 border border-cyan-100/60 hover:border-cyan-200 transition-all cursor-pointer group flex items-start gap-3.5"
        >
          <div className="w-10 h-10 rounded-2xl bg-cyan-500 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
            <MapPin size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-cyan-700 mb-1">
              Vị trí & Địa chỉ
            </p>
            <p className="text-sm font-bold text-[#0f2942] leading-snug line-clamp-2">
              {place.address ? `${place.address}, ` : ''}
              {place.district_name ? `${place.district_name}, ` : ''}
              Đà Nẵng
            </p>
            <p className="text-xs text-cyan-600 font-medium mt-1 group-hover:underline">
              Bấm để xem trên Google Maps →
            </p>
          </div>
        </motion.div>

        {/* Ô 2: GIỜ MỞ CỬA */}
        <motion.div
          whileHover={{ y: -2 }}
          className="p-4 sm:p-5 rounded-2xl bg-orange-50/50 hover:bg-orange-50 border border-orange-100/60 hover:border-orange-200 transition-all flex items-start gap-3.5"
        >
          <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Clock size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-orange-700">
                Khung giờ hôm nay
              </p>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  place.isOpenNow
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                {place.isOpenNow ? 'Đang mở cửa' : 'Đã đóng cửa'}
              </span>
            </div>
            <p className="text-base font-extrabold text-[#0f2942]">
              {place.today_hours || '08:00 – 22:00'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Theo múi giờ Việt Nam (Asia/Ho_Chi_Minh - UTC+7)
            </p>
          </div>
        </motion.div>
      </div>

      {/* MÔ TẢ GIỚI THIỆU */}
      <div className="pt-2">
        <div className="flex items-center gap-2 mb-3">
          <span className="p-1.5 bg-gray-100 text-gray-700 rounded-lg">
            <Info size={16} />
          </span>
          <h2 className="text-lg font-bold text-[#0f2942]">Giới thiệu không gian & Ẩm thực</h2>
        </div>

        <div className="relative text-gray-600 text-sm sm:text-base leading-relaxed">
          <p className={`${!isExpanded && isLongDescription ? 'line-clamp-3' : ''}`}>
            {fullDescription}
          </p>

          {isLongDescription && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2.5 inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-cyan-600 hover:text-cyan-700 transition-colors"
            >
              <span>{isExpanded ? 'Thu gọn nội dung' : 'Đọc thêm giới thiệu'}</span>
              {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
