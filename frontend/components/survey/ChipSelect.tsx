'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { ChoiceOption } from '@/constants/survey';

interface ChipSelectProps {
  name: string;
  options: ChoiceOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  maxSelect?: number;
}

export default function ChipSelect({
  name,
  options,
  selectedValues,
  onChange,
  maxSelect,
}: ChipSelectProps) {
  const handleToggle = (id: string) => {
    // Nếu chọn chip 'none' ("Không gặp vấn đề nào"), bỏ chọn các vấn đề khác
    if (id === 'none') {
      if (selectedValues.includes('none')) {
        onChange([]);
      } else {
        onChange(['none']);
      }
      return;
    }

    // Nếu đang chọn vấn đề khác mà 'none' đang được chọn thì bỏ 'none'
    let next = selectedValues.filter((v) => v !== 'none');

    if (next.includes(id)) {
      next = next.filter((v) => v !== id);
    } else {
      if (maxSelect && next.length >= maxSelect) {
        // Nếu đã đủ giới hạn chọn
        return;
      }
      next.push(id);
    }

    onChange(next);
  };

  return (
    <div role="group" aria-label={name} className="flex flex-wrap gap-2.5">
      {options.map((option) => {
        const isSelected = selectedValues.includes(option.id);

        return (
          <motion.button
            key={option.id}
            type="button"
            role="checkbox"
            aria-checked={isSelected}
            onClick={() => handleToggle(option.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className={`min-h-[44px] px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-2 border select-none cursor-pointer outline-hidden focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 ${
              isSelected
                ? 'bg-teal-50 border-teal-500 text-teal-900 shadow-xs ring-1 ring-teal-500'
                : 'bg-white border-slate-200/90 text-slate-700 hover:border-teal-300 hover:bg-slate-50'
            }`}
          >
            {option.icon && <span>{option.icon}</span>}
            <span>{option.label}</span>

            {isSelected && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                className="w-4 h-4 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0 ml-0.5"
              >
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </motion.span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
