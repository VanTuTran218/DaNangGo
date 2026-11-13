"use client";

import { motion, AnimatePresence } from "framer-motion";
import { HERO_SLIDES } from "./hero-data";

interface HeroSlideCopyProps {
  activeIndex: number;
  reducedMotion: boolean;
}

// Easing siêu mượt mà, thư thái chuẩn Luxury Travel: cubic-bezier(0.16, 1, 0.3, 1)
const EASE_SLOW = [0.16, 1, 0.3, 1] as const;
const DURATION = 1.15; // 1.15 giây (chạy chậm, êm dịu, lướt nhẹ nhàng)
const Y_OFFSET = 18;   // Độ trượt nhẹ nhàng 18px

export default function HeroSlideCopy({
  activeIndex,
  reducedMotion,
}: HeroSlideCopyProps) {
  const slide = HERO_SLIDES[activeIndex] || HERO_SLIDES[0];

  return (
    <div className="w-full max-w-3xl mb-4 sm:mb-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          className="flex flex-col items-start w-full"
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* ── 1. Badge nhỏ (Cẩm nang du lịch Đà Nẵng) ── */}
          <motion.div
            initial={{ opacity: 0, y: reducedMotion ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reducedMotion ? 0 : -8 }}
            transition={{
              duration: 0.8,
              ease: EASE_SLOW,
            }}
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-3.5 py-1 mb-4"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-white/90 text-xs tracking-wider uppercase font-medium">
              {slide.badge}
            </span>
          </motion.div>

          {/* ── 2. H1 Hero — Chữ chạy chậm, êm đềm, không có dấu gạch ngang ── */}
          <h1 className="hero-h1 w-full max-w-3xl mb-4">
            {/* Dòng 1: Xuất hiện chậm rãi đầu tiên */}
            <motion.span
              className="block"
              initial={{ opacity: 0, y: reducedMotion ? 0 : Y_OFFSET }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reducedMotion ? 0 : -10 }}
              transition={{
                duration: DURATION,
                ease: EASE_SLOW,
                delay: 0.08,
              }}
            >
              {slide.line1}
            </motion.span>

            {/* Dòng 2: Xuất hiện chậm rãi tiếp theo với điểm nhấn xanh Cyan */}
            <motion.span
              className="block hero-highlight-cyan"
              initial={{ opacity: 0, y: reducedMotion ? 0 : Y_OFFSET }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reducedMotion ? 0 : -10 }}
              transition={{
                duration: DURATION,
                ease: EASE_SLOW,
                delay: 0.32, // Stagger thư thái sau dòng 1
              }}
            >
              {slide.line2}
            </motion.span>

            {/* Dòng 3: Xuất hiện chậm rãi tiếp nối */}
            <motion.span
              className="block"
              initial={{ opacity: 0, y: reducedMotion ? 0 : Y_OFFSET }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reducedMotion ? 0 : -10 }}
              transition={{
                duration: DURATION,
                ease: EASE_SLOW,
                delay: 0.56, // Stagger thư thái sau dòng 2
              }}
            >
              {slide.line3}
            </motion.span>
          </h1>

          {/* ── 3. Mô tả Hero — Fade-in êm ái chậm rãi ── */}
          <motion.p
            className="hero-desc mb-6"
            initial={{ opacity: 0, y: reducedMotion ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reducedMotion ? 0 : -6 }}
            transition={{
              duration: DURATION,
              ease: EASE_SLOW,
              delay: 0.72, // Xuất hiện sau khi các dòng tiêu đề đã lướt vào
            }}
          >
            {slide.description}
          </motion.p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
