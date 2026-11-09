"use client";

import {
  Hotel,
  Utensils,
  Compass,
  Car,
  ShieldCheck,
  Sparkles,
  BadgeCheck,
  HeartHandshake,
  HelpCircle,
} from "lucide-react";
import RatingStars from "./RatingStars";
import {
  EXPERIENCE_CATEGORIES,
  type ExperienceCategory,
} from "@/constants/survey";

interface RatingMatrixProps {
  values: Record<string, number>; // categoryId -> score (0: chưa dùng, 1-5: sao)
  onChange: (categoryId: string, score: number) => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Hotel,
  Utensils,
  Compass,
  Car,
  ShieldCheck,
  Sparkles,
  BadgeCheck,
  HeartHandshake,
};

export default function RatingMatrix({ values, onChange }: RatingMatrixProps) {
  return (
    <div className="space-y-3">
      {EXPERIENCE_CATEGORIES.map((cat: ExperienceCategory) => {
        const IconComponent = ICON_MAP[cat.iconName] || HelpCircle;
        const currentScore = values[cat.id] ?? 0;
        const isNotUsed = currentScore === -1;

        return (
          <div
            key={cat.id}
            className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 ${
              isNotUsed
                ? "bg-slate-50/70 border-slate-200/70"
                : "bg-white border-teal-200/80 shadow-xs ring-1 ring-teal-500/10"
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Cột trái: Icon + Tiêu đề + Mô tả */}
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                    isNotUsed
                      ? "bg-slate-100 text-slate-500"
                      : "bg-teal-50 text-teal-600 ring-2 ring-teal-500/20"
                  }`}
                >
                  <IconComponent className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    {cat.label}
                    {currentScore > 0 && (
                      <span className="text-[10px] font-extrabold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                        {currentScore}/5
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                    {cat.desc}
                  </p>
                </div>
              </div>

              {/* Cột phải: Chấm sao + Nút "Chưa sử dụng" */}
              <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                <div className={isNotUsed ? "opacity-40 grayscale" : ""}>
                  <RatingStars
                    value={currentScore}
                    onChange={(star) => onChange(cat.id, star)}
                    size="md"
                  />
                </div>

                {/* Nút Chưa sử dụng */}
                <button
                  type="button"
                  onClick={() => onChange(cat.id, isNotUsed ? 0 : -1)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer select-none ${
                    isNotUsed
                      ? "bg-slate-200 text-slate-700 border-slate-300 font-bold shadow-2xs"
                      : "bg-white text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-700"
                  }`}
                >
                  {isNotUsed ? "Đã đánh dấu: Chưa dùng" : "Chưa sử dụng"}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
