'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface FormSectionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
  badge?: string;
  isHighlight?: boolean;
}

export default function FormSection({
  icon,
  title,
  description,
  children,
  badge,
  isHighlight = false,
}: FormSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`rounded-3xl p-6 sm:p-8 bg-white border transition-shadow shadow-xs hover:shadow-md ${
        isHighlight
          ? 'border-orange-300/80 bg-gradient-to-br from-white to-orange-50/20 ring-4 ring-orange-100/50'
          : 'border-slate-200/80'
      }`}
    >
      <div className="flex items-start justify-between gap-4 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
              isHighlight
                ? 'bg-orange-100 text-orange-600 border-orange-200'
                : 'bg-teal-50 text-teal-600 border-teal-100'
            }`}
          >
            {icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900">{title}</h3>
              {badge && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700">
                  {badge}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          </div>
        </div>
      </div>

      <div className="pt-6">{children}</div>
    </motion.section>
  );
}
