"use client";

import { motion } from "framer-motion";
import { HERO_SLIDES, INTERVAL_MS } from "./hero-data";

interface HeroIndicatorsProps {
  activeIndex: number;
  isPaused: boolean;
  reducedMotion: boolean;
}

export default function HeroIndicators({
  activeIndex,
  isPaused,
  reducedMotion,
}: HeroIndicatorsProps) {
  if (reducedMotion) return null;

  return (
    <div
      className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-20 hidden md:flex flex-col gap-3 pointer-events-none"
      aria-hidden="true"
    >
      {HERO_SLIDES.map((slide, index) => {
        const isActive = activeIndex === index;
        const isPast = activeIndex > index;

        return (
          <div
            key={slide.id}
            className="relative w-1 h-8 rounded-full bg-white/25 overflow-hidden"
          >
            {isActive ? (
              <motion.div
                key={`active-indicator-${index}-${isPaused}`}
                className="w-full bg-cyan-400 rounded-full"
                initial={{ height: "0%" }}
                animate={{ height: isPaused ? "0%" : "100%" }}
                transition={{
                  duration: INTERVAL_MS / 1000,
                  ease: "linear",
                }}
              />
            ) : (
              <div
                className={`w-full h-full rounded-full ${
                  isPast ? "bg-white/60" : "bg-transparent"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
