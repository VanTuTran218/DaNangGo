"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
  type TargetAndTransition,
} from "framer-motion";
import { HERO_SLIDES, FADE_MS } from "./hero-data";
import { EASING } from "@/lib/motion-tokens";

// ── HẰNG SỐ LỚP PHỦ ĐỈNH (HEADER SCRIM OVERLAY CHO NAVBAR TRONG SUỐT) ──
export const SCRIM_HEIGHT_DESKTOP = 180;
export const SCRIM_HEIGHT_MOBILE = 140;
export const SCRIM_OPACITY = 0.72;

// ── HẰNG SỐ LỚP PHỦ NGANG VÀ ĐÁY HERO (ADAPTIVE EDITORIAL SCRIM) ──
export const OVERLAY_LEFT = "rgba(16, 40, 50, 0.72)";
export const OVERLAY_MID = "rgba(16, 40, 50, 0.30)";
export const OVERLAY_RIGHT = "rgba(16, 40, 50, 0.04)";
export const OVERLAY_BOTTOM = "rgba(16, 40, 50, 0.56)";

interface HeroCarouselBackgroundProps {
  activeIndex: number;
  reducedMotion: boolean;
  onFirstLoaded: () => void;
  onSlideLoaded: (index: number) => void;
  mouseX?: MotionValue<number>;
  mouseY?: MotionValue<number>;
}

export default function HeroCarouselBackground({
  activeIndex,
  reducedMotion,
  onFirstLoaded,
  onSlideLoaded,
  mouseX,
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

  // Scroll-Synchronized Hero Transformation (Phần 09 & 18)
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

  // Main Landscape Parallax + Subtle Dolly-in on scroll
  const parallaxY = useTransform(
    scrollYProgress,
    [0, 0.25, 0.5, 0.75, 1],
    reducedMotion || !isDesktop ? [0, 0, 0, 0, 0] : [0, 14, 32, 52, 72]
  );

  const scrollScale = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    reducedMotion || !isDesktop ? [1, 1, 1] : [1, 1.03, 1.06]
  );

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none z-0 select-none bg-[#102832]"
      aria-hidden="true"
    >
      {/* ── LAYER 01: Crisp High-Definition Landscape Photography (1.05 -> 1.00 opening camera movement) ── */}
      {HERO_SLIDES.map((slide, index) => {
        const isActive = activeIndex === index;
        const isPrev = prevIndex === index && !isActive;
        const zIndex = isActive ? 2 : isPrev ? 1 : 0;

        const animateProps: TargetAndTransition = { opacity: isActive ? 1 : 0 };
        const initialProps: TargetAndTransition = {
          opacity: index === 0 ? 1 : 0,
        };

        return (
          <motion.div
            key={slide.id}
            className="absolute -inset-3 sm:-inset-4"
            style={{
              zIndex,
              willChange: "opacity, transform",
              y: parallaxY,
              scale: scrollScale,
              x: mouseX,
            }}
            initial={initialProps}
            animate={animateProps}
            transition={{ duration: FADE_MS / 1000, ease: EASING.standard }}
          >
            {/* Opening Camera Pull-back: scale 1.05 -> 1.00 over 2.2s (Phần 18.1) */}
            <motion.div
              className="relative w-full h-full"
              initial={{ scale: reducedMotion ? 1.0 : 1.05 }}
              animate={{
                scale: reducedMotion ? 1.0 : isActive ? 1.0 : 1.025,
              }}
              transition={{
                duration: isActive ? 2.2 : FADE_MS / 1000,
                ease: isActive ? [0.22, 1, 0.36, 1] : EASING.standard,
              }}
              style={{
                willChange: "transform",
                backfaceVisibility: "hidden",
              }}
            >
              <div
                className="absolute inset-0"
                style={{ backgroundColor: "#102832" }}
              />
              <Image
                src={slide.image}
                alt={slide.alt}
                fill
                unoptimized
                priority={index === 0}
                loading="eager"
                quality={92}
                sizes="100vw"
                className="object-cover"
                style={{
                  objectPosition: slide.objectPosition,
                }}
                onLoad={() => handleImageLoad(index)}
                onError={() => handleImageLoad(index)}
              />
            </motion.div>
          </motion.div>
        );
      })}

      {/* ── LAYER 02: Directional Editorial Contrast Scrim (Focused on left copy zone, leaving right landscape crystal-clear — Phần 09.3) ── */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(16,40,50,0.52) 0%, rgba(16,40,50,0.08) 28%, rgba(16,40,50,0.12) 64%, rgba(16,40,50,0.64) 100%)",
        }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background:
            "linear-gradient(92deg, rgba(16,40,50,0.72) 0%, rgba(16,40,50,0.40) 42%, rgba(16,40,50,0.06) 72%, rgba(16,40,50,0) 100%)",
        }}
        aria-hidden="true"
      />
    </div>
  );
}
