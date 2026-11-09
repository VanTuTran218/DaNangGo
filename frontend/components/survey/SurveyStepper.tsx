'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface Step {
  number: number;
  title: string;
  shortTitle: string;
}

const STEPS: Step[] = [
  { number: 1, title: 'Chuyến đi của bạn', shortTitle: 'Chuyến đi' },
  { number: 2, title: 'Chi tiêu du lịch', shortTitle: 'Chi tiêu' },
  { number: 3, title: 'Đánh giá trải nghiệm', shortTitle: 'Trải nghiệm' },
  { number: 4, title: 'Tổng thể & Góp ý', shortTitle: 'Tổng thể' },
];

interface SurveyStepperProps {
  currentStep: number; // 1 -> 4
  onStepClick?: (step: number) => void;
}

export default function SurveyStepper({ currentStep, onStepClick }: SurveyStepperProps) {
  const percentage = Math.round(((currentStep - 1) / (STEPS.length - 1)) * 100);

  return (
    <div className="w-full pb-6 border-b border-slate-100">
      {/* Mobile view (< sm): Rút gọn thành "Bước X/4" + Progress Bar */}
      <div className="sm:hidden space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-extrabold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
            Bước {currentStep}/{STEPS.length}
          </span>
          <span className="font-bold text-slate-800">
            {STEPS[currentStep - 1]?.title}
          </span>
          <span className="font-extrabold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-md">
            {percentage}%
          </span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-teal-500 via-cyan-500 to-orange-400"
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Desktop & Tablet view (>= sm): 4 Chấm bước đầy đủ với thanh tiến độ mượt */}
      <div className="hidden sm:block">
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600">
              Tiến độ khảo sát
            </span>
            <h2 className="text-lg font-bold text-slate-900">
              Bước {currentStep}: {STEPS[currentStep - 1]?.title}
            </h2>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold text-slate-400">Đã hoàn thành</span>
            <p className="text-sm font-extrabold text-orange-500">{percentage}%</p>
          </div>
        </div>

        {/* Dots và connecting line */}
        <div className="relative flex items-center justify-between mt-4">
          {/* Background track line */}
          <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-slate-100 rounded-full z-0" />

          {/* Active progress track line */}
          <motion.div
            className="absolute left-6 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full z-0"
            initial={{ width: 0 }}
            animate={{
              width: `calc(${percentage}% * (100% - 48px) / 100)`,
            }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />

          {STEPS.map((step) => {
            const isCompleted = step.number < currentStep;
            const isCurrent = step.number === currentStep;

            return (
              <button
                key={step.number}
                type="button"
                disabled={!isCompleted && !isCurrent}
                onClick={() => isCompleted && onStepClick?.(step.number)}
                className={`relative z-10 flex flex-col items-center group focus:outline-hidden ${
                  isCompleted ? 'cursor-pointer' : 'cursor-default'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                    isCompleted
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/25 ring-4 ring-white'
                      : isCurrent
                      ? 'bg-white border-2 border-teal-500 text-teal-700 font-extrabold shadow-lg shadow-teal-500/20 ring-4 ring-teal-50 scale-110'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 text-white stroke-[2.5]" />
                  ) : (
                    step.number
                  )}
                </div>

                <span
                  className={`mt-2 text-xs font-semibold transition-colors text-center ${
                    isCurrent
                      ? 'text-teal-700 font-bold'
                      : isCompleted
                      ? 'text-slate-600 group-hover:text-teal-600'
                      : 'text-slate-400'
                  }`}
                >
                  {step.shortTitle}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
