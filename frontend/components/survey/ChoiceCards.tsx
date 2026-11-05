'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { ChoiceOption } from '@/constants/survey';

interface ChoiceCardsProps {
  name: string;
  options: ChoiceOption[];
  selectedValue: string;
  onChange: (value: string) => void;
  columns?: 1 | 2 | 3;
}

export default function ChoiceCards({
  name,
  options,
  selectedValue,
  onChange,
  columns = 2,
}: ChoiceCardsProps) {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  }[columns];

  return (
    <div
      role="radiogroup"
      aria-label={name}
      className={`grid gap-2.5 sm:gap-3 ${gridClasses}`}
    >
      {options.map((option) => {
        const isSelected = selectedValue === option.id;

        return (
          <motion.div
            key={option.id}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.15 }}
          >
            <label
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  onChange(option.id);
                }
              }}
              onClick={() => onChange(option.id)}
              className={`relative flex items-center justify-between p-3.5 sm:p-4 min-h-[52px] rounded-2xl cursor-pointer transition-all duration-200 border text-left select-none outline-hidden focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 ${
                isSelected
                  ? 'border-teal-500 bg-white ring-2 ring-teal-500/20 shadow-md shadow-teal-500/10'
                  : 'border-slate-200/80 bg-white hover:border-teal-300 hover:bg-slate-50/50 shadow-xs'
              }`}
            >
              <div className="flex items-center gap-3 pr-2">
                {option.icon && (
                  <span className="text-xl shrink-0" aria-hidden="true">
                    {option.icon}
                  </span>
                )}
                <div>
                  <p
                    className={`text-xs sm:text-sm font-bold transition-colors ${
                      isSelected ? 'text-teal-900' : 'text-slate-800'
                    }`}
                  >
                    {option.label}
                  </p>
                  {option.desc && (
                    <p className="text-[11px] text-slate-500 mt-0.5 font-medium leading-snug">
                      {option.desc}
                    </p>
                  )}
                </div>
              </div>

              {/* Dấu tick đã chọn + hiệu ứng nảy nhẹ */}
              <div
                className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center transition-all duration-200 ${
                  isSelected
                    ? 'bg-teal-500 text-white shadow-xs scale-105'
                    : 'border-2 border-slate-200 bg-slate-50'
                }`}
              >
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </motion.div>
                )}
              </div>
            </label>
          </motion.div>
        );
      })}
    </div>
  );
}
