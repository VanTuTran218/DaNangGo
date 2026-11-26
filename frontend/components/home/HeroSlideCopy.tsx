"use client";

import { motion, AnimatePresence, type Variants } from "framer-motion";
import { HERO_SLIDES } from "./hero-data";

interface HeroSlideCopyProps {
  activeIndex: number;
  reducedMotion: boolean;
  isPaused?: boolean;
  onSelectSlide?: (index: number) => void;
}

const EASE_CINEMATIC = [0.16, 1, 0.3, 1] as const;
const EASE_EXIT = [0.4, 0, 1, 1] as const;

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.12,
    },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: {
      duration: 0.22,
      ease: EASE_EXIT,
    },
  },
};

export default function HeroSlideCopy({
  activeIndex,
  reducedMotion,
}: HeroSlideCopyProps) {
  const slide = HERO_SLIDES[activeIndex] || HERO_SLIDES[0];

  // Line mask reveal with generous vertical padding so Vietnamese diacritics never clip or collide
  const maskedLineVariants: Variants = {
    hidden: {
      opacity: 0,
      y: reducedMotion ? "0%" : "88%",
    },
    visible: {
      opacity: 1,
      y: "0%",
      transition: {
        duration: 0.9,
        ease: EASE_CINEMATIC,
      },
    },
    exit: {
      opacity: 0,
      y: reducedMotion ? "0%" : "-20%",
      transition: {
        duration: 0.2,
        ease: EASE_EXIT,
      },
    },
  };

  const descVariants: Variants = {
    hidden: {
      opacity: 0,
      y: reducedMotion ? 0 : 14,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        delay: 0.24,
        ease: EASE_CINEMATIC,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.18,
        ease: EASE_EXIT,
      },
    },
  };

  const badgeVariants: Variants = {
    hidden: {
      opacity: 0,
      y: reducedMotion ? 0 : 10,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        ease: EASE_CINEMATIC,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.18,
        ease: EASE_EXIT,
      },
    },
  };

  return (
    <div className="w-full max-w-[660px] mb-5 sm:mb-7">
      {/* ── Khối nội dung cân đối (~48–55% chiều rộng desktop), tạo khoảng thở cho phong cảnh bên phải ── */}
      <div className="min-h-[210px] sm:min-h-[240px] lg:min-h-[255px] flex flex-col justify-end">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            className="flex flex-col items-start w-full"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* ── 1. Eyebrow Editorial Badge & Compact Coordinates (Phần 07 & 12) ── */}
            <motion.div
              variants={badgeVariants}
              className="inline-flex flex-wrap items-center gap-3 mb-3 sm:mb-4"
            >
              <span
                className="w-7 h-[1px] bg-[#E87B39]"
                aria-hidden="true"
              />
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#F8F8F4]/90">
                {slide.badge}
              </span>
              <span
                aria-hidden="true"
                className="hidden sm:inline-block text-[10px] font-mono tracking-[0.16em] text-[#BCD3D1]/75 pl-2.5 border-l border-white/20"
              >
                16°03&apos;16&quot;N · 108°12&apos;08&quot;E
              </span>
            </motion.div>

            {/* ── 2. H1 Hero — 1 Primary Display Focus + Refined Italic Emotion + Editorial Subtitle (Phần 07–10) ── */}
            <h1 className="w-full mb-3.5 sm:mb-4">
              {/* Line 1: Único điểm nhấn Display chính với 1 lượt Champagne Light Sweep tinh tế khi slide xuất hiện */}
              <span className="block overflow-hidden pt-[0.22em] -mt-[0.22em] pb-[0.12em] -mb-[0.12em]">
                <motion.span
                  variants={maskedLineVariants}
                  className={`block cinematic-condensed font-bold uppercase text-[#F8F8F4] text-[clamp(2.5rem,5.4vw,5.25rem)] leading-[1.1] tracking-[-0.015em] drop-shadow-[0_2px_18px_rgba(10,25,32,0.35)] ${
                    !reducedMotion ? "text-shimmer-dark is-shimmering" : ""
                  }`}
                >
                  {slide.line1}
                </motion.span>
              </span>

              {/* Line 2 (Serif Italic 22–36px — documentary pace) & Line 3 (Editorial Subtitle 16–21px) */}
              <span className="block overflow-hidden pt-[0.2em] -mt-[0.2em] pb-[0.14em] -mb-[0.14em] mt-1.5 sm:mt-2">
                <motion.span
                  variants={{
                    hidden: { opacity: 0, y: reducedMotion ? "0%" : "92%" },
                    visible: {
                      opacity: 1,
                      y: "0%",
                      transition: {
                        duration: 1.05,
                        delay: 0.08,
                        ease: EASE_CINEMATIC,
                      },
                    },
                    exit: {
                      opacity: 0,
                      y: reducedMotion ? "0%" : "-20%",
                      transition: { duration: 0.2, ease: EASE_EXIT },
                    },
                  }}
                  className="flex flex-wrap items-baseline gap-x-3 gap-y-1"
                >
                  <span className="home-serif italic font-normal text-[#E6D9B7] text-[clamp(1.375rem,2.4vw,2.25rem)] leading-[1.28] pr-1">
                    {slide.line2}
                  </span>
                  <span className="home-sans font-medium uppercase text-[#F8F8F4]/90 text-[clamp(0.95rem,1.35vw,1.25rem)] leading-[1.4] tracking-[0.1em]">
                    {slide.line3}
                  </span>
                </motion.span>
              </span>
            </h1>

            {/* ── 3. Mô tả Hero — Max-width 480px, font-size 14–15.5px, line-height 1.68 (Phần 07.4) ── */}
            <motion.p
              variants={descVariants}
              className="home-sans text-[14px] sm:text-[15px] text-[#F8F8F4]/88 font-normal leading-[1.68] max-w-[490px] border-l border-[#E87B39]/80 pl-3.5 sm:pl-4 py-0.5"
            >
              {slide.description}
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
