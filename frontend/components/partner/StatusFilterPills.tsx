'use client';

import { motion } from 'framer-motion';

export type StatusFilterValue = 'ALL' | 'ACTIVE' | 'HIDDEN' | 'PENDING' | 'LOCKED';

interface StatusFilterPillsProps {
  current: string;
  onChange: (value: StatusFilterValue) => void;
  counts?: Partial<Record<StatusFilterValue, number>>;
}

const FILTER_OPTIONS: { id: StatusFilterValue; label: string; dotColor?: string }[] = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'ACTIVE', label: 'Đang hoạt động', dotColor: 'bg-emerald-500' },
  { id: 'HIDDEN', label: 'Đã ẩn', dotColor: 'bg-slate-400' },
  { id: 'PENDING', label: 'Chờ duyệt', dotColor: 'bg-amber-500' },
  { id: 'LOCKED', label: 'Bị khóa', dotColor: 'bg-rose-500' },
];

export default function StatusFilterPills({
  current,
  onChange,
  counts,
}: StatusFilterPillsProps) {
  return (
    <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 border border-slate-200/80 rounded-2xl overflow-x-auto max-w-full scrollbar-none">
      {FILTER_OPTIONS.map((opt) => {
        const isSelected = current === opt.id;
        const count = counts?.[opt.id];

        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`relative px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 z-10 ${
              isSelected ? 'text-teal-900' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isSelected && (
              <motion.div
                layoutId="activeFilterPill"
                className="absolute inset-0 bg-white rounded-xl shadow-xs border border-slate-200/60 -z-10"
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
              />
            )}
            {opt.dotColor && (
              <span className={`w-2 h-2 rounded-full ${opt.dotColor} ${opt.id === 'ACTIVE' && isSelected ? 'animate-pulse' : ''}`} />
            )}
            <span>{opt.label}</span>
            {count !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected ? 'bg-teal-50 text-teal-700' : 'bg-slate-200/70 text-slate-500'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
