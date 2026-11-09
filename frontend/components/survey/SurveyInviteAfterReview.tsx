'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquareHeart, ArrowRight, X } from 'lucide-react';

interface SurveyInviteAfterReviewProps {
  onOpenQuickSheet: () => void;
  placeName?: string;
  className?: string;
}

export default function SurveyInviteAfterReview({
  onOpenQuickSheet,
  placeName,
  className = '',
}: SurveyInviteAfterReviewProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className={`mt-3 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-teal-50 via-cyan-50 to-orange-50/50 border border-teal-200/80 flex items-start sm:items-center justify-between gap-3 text-xs sm:text-sm text-slate-800 ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
          <MessageSquareHeart className="w-5 h-5" />
        </div>
        <div>
          <p className="font-bold text-slate-900 leading-snug">
            Bạn có 30 giây? Góp ý nhanh về trải nghiệm Đà Nẵng
          </p>
          <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5 leading-relaxed">
            {placeName
              ? `Vừa đánh giá ${placeName}! Hãy chia sẻ thêm một chút về chuyến đi của bạn nhé.`
              : 'Ý kiến của bạn sẽ giúp du lịch Đà Nẵng nâng cao chất lượng phục vụ du khách.'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onOpenQuickSheet}
          className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-all cursor-pointer whitespace-nowrap"
        >
          Khảo sát nhanh (30s)
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          title="Bỏ qua"
          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white/60 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
