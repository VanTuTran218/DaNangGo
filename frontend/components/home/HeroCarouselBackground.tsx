"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, type TargetAndTransition } from "framer-motion";
import { HERO_SLIDES, FADE_MS } from "./hero-data";
import { DURATION, EASING } from "@/lib/motion-tokens";

// ── HẰNG SỐ LỚP PHỦ ĐỈNH (HEADER SCRIM OVERLAY CHO NAVBAR TRONG SUỐT) ──
export const SCRIM_HEIGHT_DESKTOP = 180; // Chiều cao phủ đỉnh desktop (px)
export const SCRIM_HEIGHT_MOBILE = 140;  // Chiều cao phủ đỉnh mobile (px)
export const SCRIM_OPACITY = 0.68;       // Độ đậm 68% ở mép trên (chuẩn 65–70%)

// ── HẰNG SỐ LỚP PHỦ NGANG VÀ ĐÁY HERO (GIỮ ẢNH TRONG TRẺO, RÕ CHỮ) ──
export const OVERLAY_LEFT = "rgba(7, 26, 46, 0.55)";   // Phía trái ~55% đủ đọc chữ trắng
export const OVERLAY_MID = "rgba(7, 26, 46, 0.20)";    // Giữa ~20% làm sáng chủ thể ảnh
export const OVERLAY_RIGHT = "rgba(7, 26, 46, 0.10)";  // Phải ~10% khoáng đạt
export const OVERLAY_BOTTOM = "rgba(7, 26, 46, 0.52)"; // Đáy ~52% cho ô tìm kiếm và hashtag

interface HeroCarouselBackgroundProps {
  activeIndex: number;
  reducedMotion: boolean;
  onFirstLoaded: () => void;
  onSlideLoaded: (index: number) => void;
}

export default function HeroCarouselBackground({
  activeIndex,
  reducedMotion,
  onFirstLoaded,
  onSlideLoaded,
}: HeroCarouselBackgroundProps) {
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [firstLoaded, setFirstLoaded] = useState(false);
  const loadedMap = useRef<Record<number, boolean>>({});

  useEffect(() => {
    setPrevIndex((prev) => (prev !== activeIndex ? activeIndex : prev));
  }, [activeIndex]);

  const handleImageLoad = (index: number) => {
    loadedMap.current[index] = true;
    onSlideLoaded(index);
    if (index === 0 && !firstLoaded) {
      setFirstLoaded(true);
      onFirstLoaded();
    }
  };

  // Subtle Parallax theo C3: dịch chuyển nhẹ 22px trong Hero Section (chỉ trên Desktop, tắt khi Reduced Motion)
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  const parallaxY = useTransform(
    scrollYProgress,
    [0, 1],
    reducedMotion || !isDesktop ? [0, 0] : [0, 22]
  );

  // C1. Hero Image Reveal: bắt đầu từ scale(1.05) -> chuyển mượt về scale(1) trong 1.5s với easing cinematic
  const getHeroRevealInitial = (isActive: boolean) => {
    if (reducedMotion || !isActive) return { scale: 1 };
    return { scale: 1.05 };
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none z-0 select-none"
      aria-hidden="true"
    >
      {/* ── TẦNG z-0: Các ảnh Carousel chồng lên nhau ── */}
      {HERO_SLIDES.map((slide, index) => {
        const isActive = activeIndex === index;
        const isPrev = prevIndex === index && !isActive;
        const zIndex = isActive ? 2 : isPrev ? 1 : 0;

        const animateProps: TargetAndTransition = { opacity: isActive ? 1 : 0 };
        const initialProps: TargetAndTransition = { opacity: index === 0 ? 1 : 0 };

        return (
          <motion.div
            key={slide.id}
            className="absolute inset-0"
            style={{ zIndex, willChange: "opacity", y: parallaxY }}
            initial={initialProps}
            animate={animateProps}
            transition={{ duration: FADE_MS / 1000, ease: EASING.standard }}
          >
            <motion.div
              className="relative w-full h-full"
              key={`kb-${index}-${isActive}`}
              initial={getHeroRevealInitial(isActive)}
              animate={{ scale: 1 }}
              transition={{ duration: DURATION.cinematic, ease: EASING.entrance }}
              style={{
                willChange: "transform",
                backfaceVisibility: "hidden",
              }}
            >
              {/* Nền màu ấm hiển thị khi ảnh tải */}
              <div
                className="absolute inset-0"
                style={{ backgroundColor: index === 1 ? "#2d1b00" : "#071a2e" }}
              />
              <Image
                src={slide.image}
                alt={slide.alt}
                fill
                priority
                loading="eager"
                quality={90}
                sizes="100vw"
                className="object-cover object-center"
                style={{
                  objectPosition: slide.objectPosition,
                }}
                onLoad={() => handleImageLoad(index)}
              />
            </motion.div>
          </motion.div>
        );
      })}

      {/* ── TẦNG z-10: Lớp phủ ngang và đáy CỐ ĐỊNH giống nhau cho cả 3 slide ── */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background: `linear-gradient(to right, ${OVERLAY_LEFT} 0%, ${OVERLAY_MID} 50%, ${OVERLAY_RIGHT} 100%)`,
        }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-x-0 bottom-0 h-56 z-10 pointer-events-none"
        style={{
          background: `linear-gradient(to top, ${OVERLAY_BOTTOM} 0%, rgba(7, 26, 46, 0) 100%)`,
        }}
        aria-hidden="true"
      />

      {/* ── TẦNG z-15: LỚP PHỦ TỐI Ở ĐỈNH HERO (HEADER SCRIM GRADIENT CỐ ĐỊNH) ── */}
      {/* Giúp chữ trắng của navbar luôn đạt tương phản WCAG AA >= 4.5:1 trên cả 3 slide */}
      <div
        className="absolute inset-x-0 top-0 h-[140px] sm:h-[180px] z-15 pointer-events-none select-none"
        style={{
          background: `linear-gradient(to bottom, rgba(7, 26, 46, ${SCRIM_OPACITY}) 0%, rgba(7, 26, 46, ${SCRIM_OPACITY * 0.45}) 55%, rgba(7, 26, 46, 0) 100%)`,
        }}
        aria-hidden="true"
      />
    </div>
  );
}
