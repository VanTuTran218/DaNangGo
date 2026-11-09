'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Compass, Sparkles, ArrowRight, X, Clock, Award } from 'lucide-react';
import Link from 'next/link';
import { canShowSurveyInvite, recordSurveyDismiss } from '@/lib/api/surveys';

interface SurveyInviteCardProps {
  itineraryId: string | number;
  itineraryTitle: string;
  onOpenQuickSheet?: () => void;
  className?: string;
}

export default function SurveyInviteCard({
  itineraryId,
  itineraryTitle,
  onOpenQuickSheet,
  className = '',
}: SurveyInviteCardProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Kiểm tra quy tắc tần suất hiển thị (tối đa 1 lần / 30 ngày, chỉ 1 lần / lịch trình)
    const allowed = canShowSurveyInvite(itineraryId);
    setVisible(allowed);
  }, [itineraryId]);

  if (!visible) return null;

  const handleDismiss = (action: 'LATER' | 'NEVER') => {
    recordSurveyDismiss(action, itineraryId);
    setVisible(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-orange-500/10 border border-teal-200/80 p-5 sm:p-6 shadow-sm ${className}`}
    >
      {/* Nút đóng nhanh góc trên */}
      <button
        type="button"
        onClick={() => handleDismiss('LATER')}
        title="Để sau"
        aria-label="Để sau"
        className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-white/80 transition-colors cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Nội dung lời mời */}
        <div className="flex items-start gap-3.5 max-w-xl">
          <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-teal-600/20">
            <Compass className="w-6 h-6 stroke-[2]" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-orange-600 bg-orange-100/80 px-2 py-0.5 rounded-md">
                <Sparkles className="w-3 h-3" /> Mời đánh giá chuyến đi
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 bg-teal-100/80 px-2 py-0.5 rounded-md">
                <Award className="w-3 h-3" /> Tặng 50 điểm VIP
              </span>
            </div>

            <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
              Chuyến đi &quot;{itineraryTitle}&quot; của bạn thế nào?
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Hãy dành 3 phút chia sẻ trải nghiệm để giúp DaNangGo hoàn thiện lịch trình và đóng góp ý kiến nâng tầm du lịch thành phố.
            </p>
          </div>
        </div>

        {/* Các nút bấm hành động */}
        <div className="flex flex-wrap sm:flex-col items-center sm:items-end gap-2 shrink-0">
          <Link
            href={`/khao-sat?itineraryId=${itineraryId}`}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-teal-600/20 transition-all text-center"
          >
            Đánh giá chuyến đi
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          {onOpenQuickSheet && (
            <button
              type="button"
              onClick={onOpenQuickSheet}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Clock className="w-3 h-3 text-cyan-600" />
              Khảo sát nhanh (30s)
            </button>
          )}

          <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
            <button
              type="button"
              onClick={() => handleDismiss('LATER')}
              className="hover:text-slate-600 underline cursor-pointer"
            >
              Để sau
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => handleDismiss('NEVER')}
              className="hover:text-slate-600 underline cursor-pointer"
            >
              Không hỏi lại
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
