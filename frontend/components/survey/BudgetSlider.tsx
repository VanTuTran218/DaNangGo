'use client';

import { useId } from 'react';
import { motion } from 'framer-motion';

interface BudgetSliderProps {
  value: number; // VNĐ
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export default function BudgetSlider({
  value,
  onChange,
  min = 500000,
  max = 10000000,
  step = 250000,
}: BudgetSliderProps) {
  const sliderId = useId();
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  const PRESETS = [
    { label: 'Tiết kiệm', amount: 800000 },
    { label: 'Phổ thông', amount: 1500000 },
    { label: 'Thoải mái', amount: 3000000 },
    { label: 'Cao cấp', amount: 6000000 },
  ];

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num) + ' đ';
  };

  const getBudgetText = (num: number) => {
    if (num <= 1000000) return 'Dưới 1 triệu / ngày (Phù hợp du lịch tự túc, sinh viên, khám phá đường phố)';
    if (num <= 2500000) return 'Từ 1 – 2.5 triệu / ngày (Khách sạn 3–4 sao, ăn uống đặc sản đa dạng)';
    if (num <= 5000000) return 'Từ 2.5 – 5 triệu / ngày (Resort ven biển, nhà hàng hải sản cao cấp)';
    return 'Trên 5 triệu / ngày (Kỳ nghỉ thượng lưu, trải nghiệm trọn gói 5 sao)';
  };

  return (
    <div className="space-y-4">
      {/* Hiển thị số tiền to rõ nổi bật */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-orange-500/10 border border-teal-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span className="text-xs font-semibold text-slate-500">
            Ước tính trung bình mỗi người:
          </span>
          <div className="text-2xl sm:text-3xl font-black text-teal-800 tracking-tight flex items-baseline gap-1.5">
            {formatVND(value)}
            <span className="text-xs font-bold text-slate-500 font-sans">
              / ngày
            </span>
          </div>
        </div>
        <p className="text-xs font-medium text-teal-700 max-w-xs leading-relaxed">
          {getBudgetText(value)}
        </p>
      </div>

      {/* Thanh trượt Slider tùy biến cao cấp */}
      <div className="relative pt-2 pb-1">
        <label htmlFor={sliderId} className="sr-only">
          Chọn mức chi tiêu ước tính mỗi ngày
        </label>

        {/* Background track */}
        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden relative">
          <motion.div
            className="h-full bg-gradient-to-r from-teal-500 via-cyan-500 to-orange-400 rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Input range native overlay */}
        <input
          id={sliderId}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-8 opacity-0 cursor-pointer"
        />

        {/* Thumb giả lập mượt mà */}
        <div
          className="absolute top-1/2 -translate-y-1/2 pointer-events-none w-6 h-6 rounded-full bg-white border-2 border-teal-600 shadow-md flex items-center justify-center"
          style={{ left: `calc(${percentage}% - 12px)` }}
        >
          <div className="w-2 h-2 rounded-full bg-teal-600" />
        </div>
      </div>

      {/* Nhãn 2 đầu mốc */}
      <div className="flex justify-between text-[11px] font-semibold text-slate-400">
        <span>Tối thiểu: {formatVND(min)}</span>
        <span>Mức cao: {formatVND(max)}+</span>
      </div>

      {/* Phím tắt chọn nhanh các mốc phổ biến */}
      <div className="pt-1">
        <span className="block text-xs font-bold text-slate-600 mb-2">
          Chọn nhanh mức chi tiêu:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PRESETS.map((preset) => {
            const isMatch = Math.abs(value - preset.amount) < step;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => onChange(preset.amount)}
                className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer ${
                  isMatch
                    ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-teal-400 hover:bg-teal-50/50'
                }`}
              >
                <div className="font-bold">{preset.label}</div>
                <div
                  className={`text-[10px] mt-0.5 ${
                    isMatch ? 'text-teal-100' : 'text-slate-400'
                  }`}
                >
                  {formatVND(preset.amount)}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
