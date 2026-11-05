'use client';

import { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

interface QuestionCardProps {
  id?: string;
  title: string;
  description?: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
  className?: string;
}

export default function QuestionCard({
  id,
  title,
  description,
  required = false,
  error,
  children,
  className = '',
}: QuestionCardProps) {
  const prefersReduced = useReducedMotion();

  // Shake animation khi có lỗi validation
  const shakeVariants = {
    idle: { x: 0 },
    error: {
      x: prefersReduced ? 0 : [0, -8, 8, -6, 6, -3, 3, 0],
      transition: { duration: 0.4 },
    },
  };

  return (
    <motion.fieldset
      id={id}
      variants={shakeVariants}
      animate={error ? 'error' : 'idle'}
      className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 ${
        error
          ? 'border-rose-300 bg-rose-50/30 ring-2 ring-rose-100 shadow-sm'
          : 'border-slate-100 bg-slate-50/50 hover:border-slate-200 hover:bg-slate-50/80'
      } ${className}`}
    >
      <legend className="block w-full float-left mb-2">
        <span className="text-sm sm:text-base font-bold text-slate-900 inline-flex items-center gap-1.5 flex-wrap">
          {title}
          {required && (
            <span
              className="text-rose-500 font-extrabold text-sm"
              title="Câu hỏi bắt buộc"
              aria-label="Bắt buộc"
            >
              *
            </span>
          )}
        </span>
        {description && (
          <span className="block text-xs text-slate-500 mt-0.5 font-normal leading-relaxed">
            {description}
          </span>
        )}
      </legend>

      {/* Question inputs */}
      <div className="clear-both pt-1">{children}</div>

      {/* Lỗi hiện ngay dưới câu hỏi bằng chữ đỏ và rung nhẹ */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          role="alert"
          aria-live="polite"
          className="flex items-center gap-1.5 mt-2.5 text-xs font-semibold text-rose-600"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}
    </motion.fieldset>
  );
}
