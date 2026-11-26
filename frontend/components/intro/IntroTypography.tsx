"use client";

/**
 * IntroTypography V11.2 — GPU-Optimized Luxury Travel Editorial Typography & Quiet Luxury CTA
 *
 * Preserves 100% of existing Vietnamese text, fonts, sizes, colors, and layout:
 * - "DanangGo"
 * - "Cẩm nang du lịch Đà Nẵng"
 * - "CHÀO MỪNG ĐẾN VỚI"
 * - "ĐÀ NẴNG"
 * - "Hành trình khám phá thành phố đáng sống bắt đầu từ đây."
 * - "Bắt đầu khám phá"
 *
 * Optimizations:
 * - Replaced expensive CSS `filter: drop-shadow(...)` with lightweight `textShadow`.
 * - Eliminated mid-animation `useState` + `setTimeout` re-renders via declarative Framer Motion delays.
 * - Pure GPU opacity + subtle translateY staging, waiting cleanly for `isReady`.
 * - Replaced `transition-all` on CTA button with explicit composited/surface properties.
 */

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface IntroTypographyProps {
  isReady: boolean;
  prefersReduced: boolean;
  isExiting: boolean;
  onExplore: () => void;
}

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
const EASE_OUT_CUBIC = [0.22, 1, 0.36, 1] as const;

const IntroTypography = React.memo(function IntroTypography({
  isReady,
  prefersReduced,
  isExiting,
  onExplore,
}: IntroTypographyProps) {
  const shouldAnimate = isReady || prefersReduced;

  return (
    <motion.div
      animate={
        isExiting
          ? { opacity: 0, y: -14, scale: 0.98 }
          : { opacity: 1, y: 0, scale: 1 }
      }
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="flex flex-col items-center text-center w-full"
    >
      {/* ================================================================
          PHASE 01 — BRAND REVEAL ("DanangGo" + "Cẩm nang du lịch Đà Nẵng")
          ================================================================ */}
      <div className="flex flex-col items-center mb-5 sm:mb-7">
        <div className="overflow-hidden px-3 py-1">
          <motion.div
            initial={prefersReduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
            transition={{
              duration: prefersReduced ? 0 : 0.68,
              delay: prefersReduced ? 0 : 0.48,
              ease: EASE_OUT_EXPO,
            }}
            className="text-lg sm:text-xl md:text-2xl font-bold tracking-[0.26em] uppercase"
            style={{ fontFamily: "var(--font-display), 'Be Vietnam Pro', sans-serif" }}
          >
            <span className="text-[#FFF8E9]">Danang</span>
            <span className="relative inline-block text-[#E87B39] ml-0.5 overflow-hidden align-bottom">
              <span>Go</span>
              {!prefersReduced && (
                <motion.span
                  aria-hidden="true"
                  initial={{ x: "-140%", opacity: 0 }}
                  animate={
                    shouldAnimate
                      ? { x: ["-140%", "160%"], opacity: [0, 0.9, 0] }
                      : { x: "-140%", opacity: 0 }
                  }
                  transition={{
                    duration: 0.72,
                    delay: 0.92,
                    ease: EASE_OUT_CUBIC,
                  }}
                  style={{
                    background:
                      "linear-gradient(105deg, transparent 15%, rgba(255,248,233,0.95) 50%, transparent 85%)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                  className="pointer-events-none absolute inset-0 select-none"
                >
                  Go
                </motion.span>
              )}
            </span>
          </motion.div>
        </div>

        {/* Hairline Champagne divider */}
        <motion.div
          aria-hidden="true"
          initial={prefersReduced ? { scaleX: 1, opacity: 0.55 } : { scaleX: 0, opacity: 0 }}
          animate={
            shouldAnimate
              ? { scaleX: 1, opacity: 0.55 }
              : { scaleX: 0, opacity: 0 }
          }
          transition={{
            duration: prefersReduced ? 0 : 0.7,
            delay: prefersReduced ? 0 : 0.62,
            ease: EASE_OUT_EXPO,
          }}
          className="w-16 sm:w-24 h-[1px] bg-gradient-to-r from-transparent via-[#C9AB78] to-transparent my-2"
        />

        <div className="overflow-hidden px-3 py-0.5">
          <motion.p
            initial={prefersReduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
            transition={{
              duration: prefersReduced ? 0 : 0.64,
              delay: prefersReduced ? 0 : 0.68,
              ease: EASE_OUT_EXPO,
            }}
            className="text-[#FFF8E9]/80 text-[11px] sm:text-xs tracking-[0.32em] uppercase font-medium"
            style={{ fontFamily: "var(--font-display), 'Be Vietnam Pro', sans-serif" }}
          >
            Cẩm nang du lịch Đà Nẵng
          </motion.p>
        </div>
      </div>

      {/* ================================================================
          PHASE 02 & 03 — SEMANTIC HEADING ("CHÀO MỪNG ĐẾN VỚI" + "ĐÀ NẴNG")
          Vietnamese diacritic-safe masks with lightweight text-shadow (zero filter pass)
          ================================================================ */}
      <h1 className="flex flex-col items-center justify-center w-full mb-4 sm:mb-6">
        {/* Phase 02: "CHÀO MỪNG ĐẾN VỚI" */}
        <span className="block overflow-hidden px-4 py-1.5 -my-1">
          <motion.span
            initial={prefersReduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
            transition={{
              duration: prefersReduced ? 0 : 0.72,
              delay: prefersReduced ? 0 : 0.92,
              ease: EASE_OUT_EXPO,
            }}
            style={{
              fontFamily: "var(--font-display), 'Be Vietnam Pro', sans-serif",
              fontSize: "clamp(1.25rem, 2.6vw, 2.65rem)",
              lineHeight: 1.35,
              textShadow: "0 2px 14px rgba(10,32,41,0.55)",
            }}
            className="block font-medium tracking-[0.18em] uppercase text-[#FFF8E9]/92"
          >
            CHÀO MỪNG ĐẾN VỚI{" "}
          </motion.span>
        </span>

        {/* Phase 03 & 04: "ĐÀ NẴNG" — Monumental Playfair Display Italic */}
        <span className="relative block overflow-hidden px-6 sm:px-10 pt-3 pb-4 -mt-1 -mb-2">
          <motion.span
            initial={
              prefersReduced
                ? { opacity: 1, y: 0, scale: 1 }
                : { opacity: 0, y: 28, scale: 0.97 }
            }
            animate={
              shouldAnimate
                ? { opacity: 1, y: 0, scale: 1 }
                : { opacity: 0, y: 28, scale: 0.97 }
            }
            transition={{
              duration: prefersReduced ? 0 : 0.92,
              delay: prefersReduced ? 0 : 1.12,
              ease: EASE_OUT_EXPO,
            }}
            style={{
              fontFamily:
                "var(--font-serif-editorial), 'Playfair Display', Georgia, serif",
              fontSize: "clamp(3.65rem, 10.2vw, 9.25rem)",
              lineHeight: 1.26,
              textShadow: "0 10px 28px rgba(10,32,41,0.62)",
            }}
            className="relative inline-block italic font-normal tracking-[-0.01em] text-[#FFF8E9]"
          >
            ĐÀ NẴNG

            {/* Phase 04: One-shot Champagne Gold shimmer light sweep (declarative delay, 0 re-renders) */}
            {!prefersReduced && (
              <motion.span
                aria-hidden="true"
                initial={{ x: "-135%", opacity: 0 }}
                animate={
                  shouldAnimate
                    ? { x: ["-135%", "165%"], opacity: [0, 0.85, 0] }
                    : { x: "-135%", opacity: 0 }
                }
                transition={{
                  duration: 1.35,
                  delay: 1.82,
                  ease: EASE_OUT_CUBIC,
                }}
                style={{
                  background:
                    "linear-gradient(105deg, transparent 20%, rgba(255,248,233,0.12) 38%, rgba(201,171,120,0.85) 50%, rgba(255,248,233,0.15) 62%, transparent 80%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  textShadow: "none",
                }}
                className="pointer-events-none absolute inset-0 select-none italic font-normal"
              >
                ĐÀ NẴNG
              </motion.span>
            )}
          </motion.span>
        </span>
      </h1>

      {/* ================================================================
          PHASE 05 — DESCRIPTION & QUIET LUXURY CTA ("Bắt đầu khám phá")
          ================================================================ */}
      <motion.p
        initial={prefersReduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
        transition={{
          duration: prefersReduced ? 0 : 0.68,
          delay: prefersReduced ? 0 : 1.52,
          ease: EASE_OUT_EXPO,
        }}
        style={{
          fontFamily: "var(--font-display), 'Be Vietnam Pro', sans-serif",
          fontSize: "clamp(0.925rem, 1.2vw, 1.125rem)",
          textShadow: "0 2px 12px rgba(10,32,41,0.65)",
        }}
        className="text-[#FFF8E9]/88 font-normal max-w-[580px] mx-auto leading-[1.72] tracking-[0.01em] mb-7 sm:mb-9"
      >
        Hành trình khám phá thành phố đáng sống bắt đầu từ đây.
      </motion.p>

      {/* Quiet Luxury CTA Button — Always clickable immediately without waiting for timeline */}
      <motion.div
        initial={prefersReduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
        transition={{
          duration: prefersReduced ? 0 : 0.68,
          delay: prefersReduced ? 0 : 1.72,
          ease: EASE_OUT_EXPO,
        }}
      >
        <motion.button
          type="button"
          onClick={onExplore}
          whileHover={prefersReduced ? undefined : { y: -2 }}
          whileTap={{ scale: 0.97 }}
          aria-label="Bắt đầu khám phá Đà Nẵng"
          className="group relative inline-flex items-center justify-center gap-3.5 h-[52px] sm:h-[56px] px-8 sm:px-10 rounded-[6px] bg-[#FFF8E9] hover:bg-white text-[#102832] border border-[#C9AB78]/65 hover:border-[#C9AB78] shadow-[0_12px_32px_rgba(10,32,41,0.38)] hover:shadow-[0_16px_40px_rgba(10,32,41,0.48)] transition-[background-color,border-color,box-shadow,transform] duration-300 overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9AB78] focus-visible:ring-offset-2 focus-visible:ring-offset-[#102832]"
        >
          {/* Subtle Champagne sheen sweep across button surface on hover */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"
            style={{
              background:
                "linear-gradient(105deg, transparent 25%, rgba(201,171,120,0.28) 50%, transparent 75%)",
            }}
          />

          <span
            style={{ fontFamily: "var(--font-display), 'Be Vietnam Pro', sans-serif" }}
            className="relative z-10 text-[13px] sm:text-[14px] font-semibold uppercase tracking-[0.16em] text-[#102832]"
          >
            Bắt đầu khám phá
          </span>

          <ArrowRight
            strokeWidth={1.75}
            className="relative z-10 w-4 h-4 sm:w-[18px] sm:h-[18px] text-[#0F4C5C] transition-transform duration-300 group-hover:translate-x-1.5"
          />
        </motion.button>
      </motion.div>
    </motion.div>
  );
});

export default IntroTypography;
