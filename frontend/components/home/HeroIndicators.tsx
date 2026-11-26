"use client";

import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { HERO_SLIDES } from "./hero-data";

interface HeroIndicatorsProps {
  activeIndex: number;
  isPaused: boolean;
  reducedMotion: boolean;
  onSelectSlide?: (index: number) => void;
  onTogglePause?: () => void;
}

export default function HeroIndicators({
  activeIndex,
  isPaused,
  reducedMotion,
  onSelectSlide,
  onTogglePause,
}: HeroIndicatorsProps) {
  const totalSlides = HERO_SLIDES.length;

  const handlePrev = () => {
    const prevIdx = (activeIndex - 1 + totalSlides) % totalSlides;
    onSelectSlide?.(prevIdx);
  };

  const handleNext = () => {
    const nextIdx = (activeIndex + 1) % totalSlides;
    onSelectSlide?.(nextIdx);
  };

  return (
    <div
      className="mt-6 sm:mt-8 flex items-center justify-between sm:justify-start gap-5 text-[#F8F8F4]"
      aria-label="Điều hướng slide trang chủ"
    >
      {/* ── Minimal Cinematic Pagination Pills (Default 8px -> Active 26px, height 3px, smooth 400ms transition — Phần 08.3) ── */}
      <div className="flex items-center gap-1" role="tablist" aria-label="Danh sách slide">
        {HERO_SLIDES.map((slide, index) => {
          const isActive = activeIndex === index;
          return (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-current={isActive ? "true" : undefined}
              aria-label={`Xem slide ${index + 1}: ${slide.locationName}`}
              title={`${slide.locationName} (${slide.metaTag})`}
              onClick={() => onSelectSlide?.(index)}
              className="group py-2.5 px-1 flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 rounded-[2px]"
            >
              <span
                className={`block h-[3px] rounded-full transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  isActive
                    ? "w-7 bg-[#F8F8F4] opacity-100"
                    : "w-2 bg-[#F8F8F4] opacity-40 group-hover:opacity-75"
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Subtle separator */}
      <span className="h-3 w-[1px] bg-white/25" aria-hidden="true" />

      {/* ── Compact Minimal Controls: Prev / Play-Pause / Next + Subtle Active Location Label (Phần 08.4) ── */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Slide trước"
          title="Slide trước"
          className="w-7 h-7 rounded-full text-[#F8F8F4]/70 hover:text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 flex items-center justify-center transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5 stroke-[1.75]" />
        </button>

        {onTogglePause && !reducedMotion && (
          <button
            type="button"
            onClick={onTogglePause}
            title={
              isPaused ? "Tiếp tục chuyển ảnh tự động" : "Tạm dừng để đọc"
            }
            aria-label={
              isPaused ? "Tiếp tục chuyển ảnh tự động" : "Tạm dừng để đọc"
            }
            className="w-7 h-7 rounded-full text-[#F8F8F4]/70 hover:text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 flex items-center justify-center transition-colors cursor-pointer"
          >
            {isPaused ? (
              <Play className="w-3 h-3 fill-current" />
            ) : (
              <Pause className="w-3 h-3 fill-current" />
            )}
          </button>
        )}

        <button
          type="button"
          onClick={handleNext}
          aria-label="Slide tiếp theo"
          title="Slide tiếp theo"
          className="w-7 h-7 rounded-full text-[#F8F8F4]/70 hover:text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 flex items-center justify-center transition-colors cursor-pointer"
        >
          <ChevronRight className="w-3.5 h-3.5 stroke-[1.75]" />
        </button>

        <span className="hidden sm:inline-block ml-2 text-[11px] font-medium tracking-[0.06em] text-[#F8F8F4]/75">
          {HERO_SLIDES[activeIndex]?.locationName}
        </span>
      </div>
    </div>
  );
}
