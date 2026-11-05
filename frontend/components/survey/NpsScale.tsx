'use client';

import { motion } from 'framer-motion';

interface NpsScaleProps {
  value: number | null; // 0 - 10
  onChange: (score: number) => void;
}

export default function NpsScale({ value, onChange }: NpsScaleProps) {
  const getBadgeStyle = (num: number, isSelected: boolean) => {
    if (!isSelected) {
      return 'bg-white border-slate-200 text-slate-700 hover:border-teal-400 hover:bg-teal-50/40';
    }
    if (num <= 6) {
      return 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20 ring-2 ring-rose-200';
    }
    if (num <= 8) {
      return 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20 ring-2 ring-amber-200';
    }
    return 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20 ring-2 ring-emerald-200';
  };

  const getScoreSummary = (score: number | null) => {
    if (score === null) return 'Vui lòng chọn một mức từ 0 đến 10';
    if (score <= 6) return `${score}/10: Rất tiếc vì chuyến đi chưa đạt kỳ vọng của bạn`;
    if (score <= 8) return `${score}/10: Cảm ơn bạn! Đà Nẵng sẽ nỗ lực nâng tầm dịch vụ hơn nữa`;
    return `${score}/10: Tuyệt vời! Cảm ơn bạn đã yêu quý và sẵn lòng giới thiệu Đà Nẵng`;
  };

  return (
    <div className="space-y-3">
      {/* 11 ô bấm từ 0 đến 10 */}
      <div
        role="radiogroup"
        aria-label="Mức độ sẵn sàng giới thiệu Đà Nẵng từ 0 đến 10"
        className="grid grid-cols-6 sm:grid-cols-11 gap-1.5 sm:gap-2"
      >
        {Array.from({ length: 11 }, (_, i) => i).map((score) => {
          const isSelected = value === score;

          return (
            <motion.button
              key={score}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(score)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              className={`h-11 sm:h-12 rounded-xl text-xs sm:text-sm font-extrabold border transition-all duration-150 flex items-center justify-center cursor-pointer outline-hidden focus-visible:ring-2 focus-visible:ring-teal-500 ${getBadgeStyle(
                score,
                isSelected,
              )}`}
            >
              {score}
            </motion.button>
          );
        })}
      </div>

      {/* Nhãn giải thích hai đầu */}
      <div className="flex items-center justify-between text-[11px] sm:text-xs font-semibold text-slate-500 px-1">
        <span className="flex items-center gap-1 text-slate-500">
          👈 0 - Chắc chắn không
        </span>
        <span className="flex items-center gap-1 text-teal-700 font-bold">
          10 - Chắc chắn sẽ giới thiệu 👉
        </span>
      </div>

      {/* Thông điệp phản hồi nhẹ tương ứng với điểm số */}
      {value !== null && (
        <motion.p
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-xs font-semibold text-center pt-1 ${
            value <= 6
              ? 'text-rose-600'
              : value <= 8
              ? 'text-amber-700'
              : 'text-emerald-700'
          }`}
        >
          {getScoreSummary(value)}
        </motion.p>
      )}
    </div>
  );
}
