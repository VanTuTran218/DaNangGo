'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Calendar } from 'lucide-react';

interface DataPoint {
  date: string;
  count: number;
}

interface PartnerColumnChartProps {
  data: DataPoint[];
  title?: string;
  subtitle?: string;
}

export default function PartnerColumnChart({
  data,
  title = 'Lượt đơn đặt trong 7 ngày qua',
  subtitle = 'Thống kê khách đặt chỗ qua website DaNangGo',
}: PartnerColumnChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const totalInPeriod = data.reduce((sum, item) => sum + item.count, 0);

  // Tạo các mức gridline thực tế theo maxCount
  const gridSteps = [1, 0.75, 0.5, 0.25, 0];

  return (
    <div className="bg-white rounded-[20px] border border-[#E2ECEC] p-6 shadow-xs flex flex-col justify-between h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-[#E2ECEC]/70">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E9F8F5] border border-[#BDE8E0] text-[#008F89] flex items-center justify-center shrink-0 mt-0.5">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-[17px] font-bold text-[#14233B] leading-snug">{title}</h3>
            {subtitle && <p className="text-xs text-[#68798A] mt-0.5">{subtitle}</p>}
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F6FAFA] border border-[#E2ECEC] self-start sm:self-auto">
          <Calendar className="w-3.5 h-3.5 text-[#008F89]" />
          <span className="text-xs text-[#68798A] font-medium">Tổng 7 ngày:</span>
          <span className="text-xs font-extrabold text-[#14233B]">{totalInPeriod} đơn</span>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="h-56 flex flex-col items-center justify-center text-center text-[#68798A] text-xs bg-[#F6FAFA]/60 rounded-2xl border border-dashed border-[#E2ECEC]">
          <BarChart3 className="w-7 h-7 text-[#68798A]/50 mb-2" />
          <span>Chưa có dữ liệu thống kê đặt chỗ trong giai đoạn này.</span>
        </div>
      ) : (
        <div className="relative pt-6 pb-2">
          {/* Gridlines nền */}
          <div className="relative h-52 flex flex-col justify-between pointer-events-none">
            {gridSteps.map((step, i) => {
              const val = Math.round(maxCount * step);
              return (
                <div key={i} className="flex items-center gap-3 w-full">
                  <span className="w-6 text-right text-[11px] font-medium text-[#68798A]/70 select-none">
                    {val}
                  </span>
                  <div className="flex-1 border-b border-dashed border-[#E2ECEC]" />
                </div>
              );
            })}
          </div>

          {/* Các cột biểu đồ */}
          <div className="absolute inset-x-0 top-6 bottom-2 pl-9 pr-2 flex items-end justify-between gap-2 sm:gap-4">
            {data.map((item, index) => {
              const ratio = item.count / maxCount;
              const heightPercent = item.count === 0 ? 4 : Math.max(12, Math.round(ratio * 100));
              const isHovered = hoveredIdx === index;

              return (
                <div
                  key={index}
                  onMouseEnter={() => setHoveredIdx(index)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className="relative flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                >
                  {/* Tooltip chỉ hiển thị dữ liệu thật */}
                  <div
                    className={`absolute -top-9 z-20 px-2.5 py-1 rounded-lg bg-[#14233B] text-white text-[11px] font-bold whitespace-nowrap shadow-md transition-all duration-150 pointer-events-none ${
                      isHovered
                        ? 'opacity-100 -translate-y-0.5 scale-100'
                        : 'opacity-0 translate-y-1 scale-95'
                    }`}
                  >
                    <span>{item.count} đơn</span>
                    <div className="absolute left-1/2 -translate-x-1/2 top-full border-4 border-transparent border-t-[#14233B]" />
                  </div>

                  {/* Khung cột */}
                  <div className="w-full max-w-[42px] h-full bg-[#F6FAFA] group-hover:bg-[#E9F8F5]/70 rounded-t-xl flex items-end overflow-hidden p-0.5 transition-colors border border-transparent group-hover:border-[#BDE8E0]/60">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPercent}%` }}
                      transition={{ duration: 0.55, delay: index * 0.06, ease: 'easeOut' }}
                      className={`w-full rounded-t-lg transition-all duration-200 ${
                        item.count === 0
                          ? 'bg-slate-200'
                          : isHovered
                          ? 'bg-gradient-to-t from-[#073B3A] via-[#008F89] to-[#14B8A6] shadow-sm'
                          : 'bg-gradient-to-t from-[#008F89] to-[#14B8A6]'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Nhãn ngày bên dưới */}
          <div className="pl-9 pr-2 pt-3 flex items-center justify-between gap-2 sm:gap-4">
            {data.map((item, index) => {
              const isHovered = hoveredIdx === index;
              return (
                <div key={index} className="flex-1 text-center">
                  <span
                    className={`text-xs font-semibold transition-colors whitespace-nowrap ${
                      isHovered ? 'text-[#008F89] font-bold' : 'text-[#68798A]'
                    }`}
                  >
                    {item.date}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
