"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import {
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";

// ============================================================
// DANANGGO V15.0 — THE JOURNEY CONTINUES
// Cinematic Closing Experience × Luxury VIP Banner × Scroll Motion
// Strictly scoped to #newsletter ("Nhận Ưu Đãi Tới 25%") above Footer
// ============================================================

export interface CinematicClosingBannerProps {
  discountText?: string;
}

/**
 * Safe Magnetic CTA wrapper (Section 18):
 * - Stationary outer hit area (never moves the clickable <Link> target)
 * - Only translates the inner visual surface by ±3.5px on fine-pointer desktop
 * - Automatically disabled on touch devices and prefers-reduced-motion
 */
function SafeMagneticLink({
  href,
  variant,
  reducedMotion,
  children,
}: {
  href: string;
  variant: "primary" | "secondary";
  reducedMotion: boolean;
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isFinePointer, setIsFinePointer] = useState(false);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const springX = useSpring(rawX, { stiffness: 260, damping: 22, mass: 0.5 });
  const springY = useSpring(rawY, { stiffness: 260, damping: 22, mass: 0.5 });

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsFinePointer(window.matchMedia("(pointer: fine)").matches);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion || !isFinePointer || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relX = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const relY = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    rawX.set(Math.max(-4, Math.min(4, relX * 4)));
    rawY.set(Math.max(-3, Math.min(3, relY * 3)));
  };

  const handleMouseLeave = () => {
    rawX.set(0);
    rawY.set(0);
  };

  const isPrimary = variant === "primary";

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="w-full sm:w-auto inline-flex"
    >
      <Link
        href={href}
        className="group/cta relative w-full sm:w-auto inline-flex items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C9AB78] rounded-[4px]"
      >
        <motion.span
          style={reducedMotion || !isFinePointer ? undefined : { x: springX, y: springY }}
          className={`relative overflow-hidden w-full sm:w-auto h-[52px] px-8 rounded-[4px] inline-flex items-center justify-center gap-2.5 text-xs sm:text-[13px] font-semibold uppercase tracking-[0.14em] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98] ${
            isPrimary
              ? "bg-[#E87B39] hover:bg-[#d56a29] text-[#FFF8E9] border border-[#F6B485]/40 shadow-[0_14px_34px_rgba(232,123,57,0.30)] hover:shadow-[0_18px_40px_rgba(232,123,57,0.42)]"
              : "bg-[#102832]/55 hover:bg-[#102832]/82 backdrop-blur-md text-[#FFF8E9] border border-[#C9AB78]/55 hover:border-[#FFF8E9]/85 shadow-[0_12px_28px_rgba(10,32,41,0.28)]"
          }`}
        >
          {/* One-shot diagonal sheen strictly clipped inside the button */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -translate-x-[120%] group-hover/cta:translate-x-[120%] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] bg-[linear-gradient(110deg,transparent_25%,rgba(255,248,233,0.28)_50%,transparent_75%)]"
          />
          <span className="relative z-10 inline-flex items-center gap-2">
            {children}
          </span>
        </motion.span>
      </Link>
    </div>
  );
}

/**
 * Golden Vector Frame Construction (Section 15) + Golden Journey Closing Line (Section 16)
 * Both use getTotalLength() + getPointAtLength() synchronized with scroll progress,
 * strictly pointer-events: none and aria-hidden.
 */
function GoldenClosingVectors({
  scrollProgress,
  reducedMotion,
}: {
  scrollProgress: ReturnType<typeof useSpring>;
  reducedMotion: boolean;
}) {
  const framePathRef = useRef<SVGPathElement | null>(null);
  const closingPathRef = useRef<SVGPathElement | null>(null);
  const frameGradId = useId();
  const closingGradId = useId();

  const [frameLen, setFrameLen] = useState(4100);
  const [frameOffset, setFrameOffset] = useState(0);
  const [framePin, setFramePin] = useState<{ x: number; y: number; visible: boolean }>({
    x: 24,
    y: 24,
    visible: false,
  });

  const [closingLen, setClosingLen] = useState(1480);
  const [closingOffset, setClosingOffset] = useState(0);
  const [closingPin, setClosingPin] = useState<{ x: number; y: number; opacity: number }>({
    x: 720,
    y: 52,
    opacity: 0,
  });

  // Rounded architectural frame path (1440x680 viewBox, inset 24px)
  const framePathD =
    "M 32 24 L 1408 24 Q 1416 24 1416 32 L 1416 648 Q 1416 656 1408 656 L 32 656 Q 24 656 24 648 L 24 32 Q 24 24 32 24 Z";

  // Serene coastal closing curve guiding eyes toward the Footer
  const closingPathD =
    "M 60 36 C 320 10, 520 72, 720 44 C 920 16, 1140 68, 1380 34";

  useEffect(() => {
    if (framePathRef.current) {
      try {
        const len = framePathRef.current.getTotalLength();
        if (len > 0) {
          setFrameLen(len);
          setFrameOffset(reducedMotion ? 0 : len * 0.72);
        }
      } catch {
        // Ignore in SSR
      }
    }
    if (closingPathRef.current) {
      try {
        const len = closingPathRef.current.getTotalLength();
        if (len > 0) {
          setClosingLen(len);
          setClosingOffset(reducedMotion ? 0 : len * 0.85);
        }
      } catch {
        // Ignore in SSR
      }
    }
  }, [reducedMotion]);

  useMotionValueEvent(scrollProgress, "change", (latest) => {
    if (reducedMotion) return;

    // Frame draws between progress 0.12 -> 0.72
    const frameRatio = Math.max(0.08, Math.min(1, (latest - 0.10) / 0.60));
    if (framePathRef.current && frameLen > 0) {
      setFrameOffset(frameLen * (1 - frameRatio));
      try {
        const pt = framePathRef.current.getPointAtLength(frameLen * frameRatio);
        setFramePin({
          x: pt.x,
          y: pt.y,
          visible: frameRatio > 0.10 && frameRatio < 0.98,
        });
      } catch {
        // Ignore
      }
    }

    // Closing journey line draws between progress 0.42 -> 0.92
    const closeRatio = Math.max(0.05, Math.min(1, (latest - 0.38) / 0.52));
    if (closingPathRef.current && closingLen > 0) {
      setClosingOffset(closingLen * (1 - closeRatio));
      try {
        const pt = closingPathRef.current.getPointAtLength(closingLen * closeRatio);
        const fadeOut = latest > 0.90 ? Math.max(0, 1 - (latest - 0.90) / 0.10) : 1;
        setClosingPin({
          x: pt.x,
          y: pt.y,
          opacity: closeRatio > 0.08 ? fadeOut : 0,
        });
      } catch {
        // Ignore
      }
    }
  });

  return (
    <>
      {/* Layer 05A: Golden Vector Frame Construction */}
      <svg
        aria-hidden="true"
        viewBox="0 0 1440 680"
        fill="none"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 w-full h-full z-[6] hidden sm:block"
      >
        <defs>
          <linearGradient id={frameGradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C9AB78" stopOpacity="0.65" />
            <stop offset="50%" stopColor="#FFF8E9" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#E87B39" stopOpacity="0.55" />
          </linearGradient>
        </defs>

        {/* Base subtle architectural guide frame */}
        <path
          d={framePathD}
          stroke="#C9AB78"
          strokeOpacity="0.16"
          strokeWidth="0.9"
          fill="none"
        />

        {/* Scroll-drawn Golden Vector Frame */}
        <path
          ref={framePathRef}
          d={framePathD}
          stroke={`url(#${frameGradId})`}
          strokeWidth="1.25"
          strokeLinecap="round"
          fill="none"
          style={{
            strokeDasharray: frameLen,
            strokeDashoffset: frameOffset,
          }}
        />

        {/* Delicate Corner Accent Brackets */}
        <g stroke="#C9AB78" strokeOpacity="0.58" strokeWidth="1.5">
          <path d="M 24 54 L 24 24 L 54 24" />
          <path d="M 1386 24 L 1416 24 L 1416 54" />
          <path d="M 24 626 L 24 656 L 54 656" />
          <path d="M 1386 656 L 1416 656 L 1416 626" />
        </g>

        {/* Traveling Champagne Pinpoint along Frame */}
        {framePin.visible && (
          <g transform={`translate(${framePin.x}, ${framePin.y})`}>
            <circle r="9" fill="#C9AB78" fillOpacity="0.22" />
            <circle r="3.2" fill="#FFF8E9" />
          </g>
        )}
      </svg>

      {/* Layer 05B: Golden Journey Closing Line (Lower edge guiding toward Footer) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-3 sm:bottom-5 h-16 z-[6] px-4 sm:px-10"
      >
        <svg
          viewBox="0 0 1440 80"
          fill="none"
          preserveAspectRatio="none"
          className="w-full h-full overflow-visible"
        >
          <defs>
            <linearGradient id={closingGradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#C9AB78" stopOpacity="0.10" />
              <stop offset="30%" stopColor="#C9AB78" stopOpacity="0.65" />
              <stop offset="65%" stopColor="#E87B39" stopOpacity="0.72" />
              <stop offset="100%" stopColor="#C9AB78" stopOpacity="0.10" />
            </linearGradient>
          </defs>

          <path
            d={closingPathD}
            stroke="#C9AB78"
            strokeOpacity="0.16"
            strokeWidth="1"
            strokeDasharray="4 7"
            fill="none"
          />

          <path
            ref={closingPathRef}
            d={closingPathD}
            stroke={`url(#${closingGradId})`}
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
            style={{
              strokeDasharray: closingLen,
              strokeDashoffset: closingOffset,
            }}
          />

          {closingPin.opacity > 0.02 && (
            <g
              transform={`translate(${closingPin.x}, ${closingPin.y})`}
              opacity={closingPin.opacity}
            >
              <circle r="11" fill="#E87B39" fillOpacity="0.22" />
              <circle r="5" fill="#FFF8E9" stroke="#C9AB78" strokeWidth="1" />
              <circle r="2.2" fill="#E87B39" />
            </g>
          )}
        </svg>
      </div>
    </>
  );
}

// ============================================================
// MAIN COMPONENT: CinematicClosingBanner
// ============================================================

export default function CinematicClosingBanner({
  discountText = "25%",
}: CinematicClosingBannerProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const [reducedMotion, setReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [shimmerComplete, setShimmerComplete] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mqMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mqMobile = window.matchMedia("(max-width: 767px)");
    setReducedMotion(mqMotion.matches);
    setIsMobile(mqMobile.matches);

    const onMotionChange = (e: MediaQueryListEvent) =>
      setReducedMotion(e.matches);
    const onMobileChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);

    mqMotion.addEventListener("change", onMotionChange);
    mqMobile.addEventListener("change", onMobileChange);
    return () => {
      mqMotion.removeEventListener("change", onMotionChange);
      mqMobile.removeEventListener("change", onMobileChange);
    };
  }, []);

  // Once content enters viewport, trigger one-shot kinetic typography & percentage reveal
  const isContentInView = useInView(contentRef, {
    once: true,
    margin: "-10% 0px -10% 0px",
  });

  useEffect(() => {
    if (isContentInView && !shimmerComplete) {
      const timer = setTimeout(() => setShimmerComplete(true), 1650);
      return () => clearTimeout(timer);
    }
  }, [isContentInView, shimmerComplete]);

  // Reversible Master Scroll Progress across the closing section (Scenes 01–05)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end end"],
  });

  const smoothScroll = useSpring(scrollYProgress, {
    stiffness: 78,
    damping: 26,
    restDelta: 0.001,
  });

  // ------------------------------------------------------------
  // SIGNATURE CINEMATIC EXPANDING FRAME (Section 07)
  // GPU clip-path expansion: ~89% width (rounded 12px) -> 100% full-bleed (0px)
  // Never scales text, never causes layout reflow, never causes horizontal overflow
  // ------------------------------------------------------------
  const frameClipPath = useTransform(smoothScroll, (v) => {
    if (reducedMotion || isMobile) {
      return "inset(0% 0% 0% 0% round 0px)";
    }
    // Expand smoothly across scroll progress 0.08 -> 0.56
    const t = Math.max(0, Math.min(1, (v - 0.08) / 0.48));
    // Smooth ease-out curve
    const eased = 1 - Math.pow(1 - t, 3);
    const insetX = (1 - eased) * 5.5; // 5.5% each side (~89% width) -> 0% (100% width)
    const radius = (1 - eased) * 12; // 12px -> 0px
    return `inset(0% ${insetX.toFixed(2)}% 0% ${insetX.toFixed(2)}% round ${radius.toFixed(1)}px)`;
  });

  // ------------------------------------------------------------
  // MULTI-LAYER CINEMATIC PARALLAX (Section 09)
  // ------------------------------------------------------------
  // Layer 01: Coastal Landscape Camera Push & Parallax
  const bgScale = useTransform(
    smoothScroll,
    [0, 1],
    reducedMotion ? [1.02, 1.02] : isMobile ? [1.02, 1.05] : [1.01, 1.08]
  );
  const bgY = useTransform(
    smoothScroll,
    [0, 1],
    reducedMotion ? [0, 0] : isMobile ? [-10, 12] : [-24, 28]
  );

  // Layer 02: Distant Coastal Mountains Silhouette
  const mountainY = useTransform(
    smoothScroll,
    [0, 1],
    reducedMotion ? [0, 0] : [20, -14]
  );

  // Layer 03: Golden Hour Atmospheric Light
  const lightY = useTransform(
    smoothScroll,
    [0, 1],
    reducedMotion ? [0, 0] : [-34, 34]
  );

  return (
    <section
      ref={sectionRef}
      id="newsletter"
      aria-label="Ưu đãi đặc quyền thành viên DANANGGO VIP"
      className="relative w-full overflow-hidden bg-[linear-gradient(180deg,#E8DFD0_0%,#E8DFD0_8%,#102832_46%,#102832_100%)] pt-2 sm:pt-4 pb-0"
    >
      {/* Subtle Top Horizon Seam connecting cleanly from #lichtrinhgoiY */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-[#E8DFD0] to-transparent z-[1]"
      />

      {/* ============================================================
          STABLE FULL-WIDTH STAGE + GPU-EXPANDING VISUAL FRAME
          ============================================================ */}
      <div className="relative w-full min-h-[600px] sm:min-h-[660px] lg:min-h-[720px] flex items-center justify-center">
        {/* VISUAL EXPANDING FRAME LAYER (Clip-path expands 89% -> 100% without scaling text) */}
        <motion.div
          style={{ clipPath: frameClipPath }}
          className="absolute inset-0 overflow-hidden bg-[#0A2029] shadow-[0_30px_80px_rgba(10,32,41,0.45)] will-change-[clip-path]"
        >
          {/* LAYER 01 — Coastal Landscape Photography (Camera Push + Parallax, Responsive WebP) */}
          <motion.div
            style={{ scale: bgScale, y: bgY }}
            className="pointer-events-none absolute -inset-y-10 inset-x-0 will-change-transform"
          >
            <picture className="block w-full h-full">
              <source
                media="(max-width: 767px)"
                srcSet="/images/closing/closing-coastal-finale-mobile.webp"
                type="image/webp"
              />
              <source
                srcSet="/images/closing/closing-coastal-finale.webp"
                type="image/webp"
              />
              <img
                src="/images/closing/closing-coastal-finale.jpg"
                alt=""
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover object-center"
              />
            </picture>
          </motion.div>

          {/* LAYER 02 — Atmospheric Distant Coastal Mountains */}
          <motion.div
            aria-hidden="true"
            style={{ y: mountainY }}
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%] opacity-80 will-change-transform z-[2]"
          >
            <img
              src="/images/closing/closing-mountain-layer.svg"
              alt=""
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover object-bottom"
            />
          </motion.div>

          {/* LAYER 03 — Golden Hour Atmospheric Light */}
          <motion.div
            aria-hidden="true"
            style={{ y: lightY }}
            className="pointer-events-none absolute inset-0 opacity-90 mix-blend-screen will-change-transform z-[3]"
          >
            <img
              src="/images/closing/closing-golden-atmosphere.svg"
              alt=""
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover object-center"
            />
          </motion.div>

          {/* LAYER 04 — Directional Readability Overlay (Preserves vivid landscape edges) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-[4] bg-[radial-gradient(ellipse_66%_64%_at_50%_46%,rgba(10,32,41,0.72)_0%,rgba(16,40,50,0.42)_56%,rgba(16,40,50,0.18)_100%)]"
          />

          {/* Seamless Bottom Transition into Deep Ocean Footer (#102832 — Section 22) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-32 sm:h-40 z-[5] bg-[linear-gradient(180deg,rgba(16,40,50,0)_0%,rgba(16,40,50,0.68)_58%,#102832_100%)]"
          />

          {/* LAYER 05 — Golden Vector Frame Construction & Golden Journey Closing Line */}
          <GoldenClosingVectors
            scrollProgress={smoothScroll}
            reducedMotion={reducedMotion}
          />
        </motion.div>

        {/* ============================================================
            LAYER 06 — LUXURY TRAVEL TYPOGRAPHY & MAGNETIC CTAs (z-10)
            Completely independent of visual frame clip-path (never distorts)
            ============================================================ */}
        <div
          ref={contentRef}
          className="relative z-10 w-full max-w-4xl mx-auto px-6 sm:px-10 py-16 sm:py-22 lg:py-26 text-center text-[#FFF8E9]"
        >
          {/* 1. Eyebrow VIP — Minimalist Champagne Architectural Pill */}
          <motion.div
            initial={
              reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }
            }
            animate={
              isContentInView || reducedMotion
                ? { opacity: 1, y: 0 }
                : { opacity: 0, y: 12 }
            }
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2.5 border border-[#C9AB78]/45 bg-[#0A2029]/55 backdrop-blur-md text-[#FFF8E9] px-4 py-1.5 rounded-[2px] mb-6 sm:mb-7"
          >
            <span
              aria-hidden="true"
              className="w-1.5 h-1.5 rounded-full bg-[#E87B39]"
            />
            <span className="text-[11px] sm:text-xs font-mono uppercase tracking-[0.24em] text-[#C9AB78] font-medium">
              ĐẶC QUYỀN THÀNH VIÊN DANANGGO VIP
            </span>
          </motion.div>

          {/* 2–4. Editorial Hierarchy Heading with Signature Percentage Centerpiece */}
          <h2
            aria-label={`Nhận Ưu Đãi Tới ${discountText} Khi Đặt Lưu Trú & Vé Tham Quan`}
            className="flex flex-col items-center justify-center mb-6 sm:mb-7"
          >
            {/* Line 1: "Nhận Ưu Đãi Tới" — Restrained Display Sans */}
            <span className="block overflow-visible py-1">
              <motion.span
                initial={
                  reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }
                }
                animate={
                  isContentInView || reducedMotion
                    ? { opacity: 1, y: 0 }
                    : { opacity: 0, y: 18 }
                }
                transition={{
                  duration: 0.7,
                  delay: 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="inline-block text-[clamp(18px,2.2vw,28px)] font-semibold uppercase tracking-[0.16em] text-[#FFF8E9]/95 leading-[1.35]"
              >
                Nhận Ưu Đãi Tới
              </motion.span>
            </span>

            {/* Centerpiece: Signature "25%" Outline-to-Solid + One-Shot Champagne Reflection (Section 12) */}
            <span className="relative inline-flex items-center justify-center gap-4 sm:gap-7 my-1 sm:my-2">
              {/* Subtle flanking architectural vector hairlines */}
              <motion.span
                aria-hidden="true"
                initial={reducedMotion ? { scaleX: 1 } : { scaleX: 0 }}
                animate={
                  isContentInView || reducedMotion
                    ? { scaleX: 1 }
                    : { scaleX: 0 }
                }
                transition={{
                  duration: 0.75,
                  delay: 0.22,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="hidden sm:block w-14 lg:w-20 h-[1px] bg-gradient-to-r from-transparent to-[#C9AB78]/70 origin-right"
              />

              <span className="relative inline-block px-2 sm:px-3 py-1">
                {/* Phase 01: Outline Construction Layer */}
                <span
                  aria-hidden="true"
                  style={{
                    WebkitTextStroke: "1.25px rgba(201, 171, 120, 0.78)",
                    color: "transparent",
                  }}
                  className="block home-serif italic font-semibold text-[clamp(64px,9vw,136px)] leading-[1.06] tracking-[-0.02em] pr-[0.1em] select-none"
                >
                  {discountText}
                </span>

                {/* Phase 02: Solid Reveal Mask (Outline -> Sunset Orange / Champagne Gold Solid) */}
                <motion.span
                  initial={
                    reducedMotion
                      ? { clipPath: "inset(0% 0% 0% 0%)" }
                      : { clipPath: "inset(0% 100% 0% 0%)" }
                  }
                  animate={
                    isContentInView || reducedMotion
                      ? { clipPath: "inset(0% 0% 0% 0%)" }
                      : { clipPath: "inset(0% 100% 0% 0%)" }
                  }
                  transition={{
                    duration: 0.95,
                    delay: 0.24,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="absolute inset-0 px-2 sm:px-3 py-1 block home-serif italic font-semibold text-[clamp(64px,9vw,136px)] leading-[1.06] tracking-[-0.02em] pr-[0.1em] text-transparent bg-clip-text bg-[linear-gradient(125deg,#E87B39_0%,#F29B52_42%,#D39A58_76%,#FFF8E9_100%)] drop-shadow-[0_12px_28px_rgba(10,32,41,0.45)]"
                >
                  {discountText}
                </motion.span>

                {/* Phase 03: One-Shot Champagne Metallic Reflection strictly inside glyph */}
                {!reducedMotion && isContentInView && !shimmerComplete && (
                  <motion.span
                    aria-hidden="true"
                    initial={{ backgroundPosition: "200% 0%" }}
                    animate={{ backgroundPosition: "-100% 0%" }}
                    transition={{
                      duration: 1.15,
                      delay: 0.45,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    style={{
                      backgroundSize: "240% 100%",
                    }}
                    className="pointer-events-none absolute inset-0 px-2 sm:px-3 py-1 block home-serif italic font-semibold text-[clamp(64px,9vw,136px)] leading-[1.06] tracking-[-0.02em] pr-[0.1em] text-transparent bg-clip-text bg-[linear-gradient(110deg,transparent_38%,rgba(255,248,233,0.92)_50%,transparent_62%)]"
                  >
                    {discountText}
                  </motion.span>
                )}
              </span>

              <motion.span
                aria-hidden="true"
                initial={reducedMotion ? { scaleX: 1 } : { scaleX: 0 }}
                animate={
                  isContentInView || reducedMotion
                    ? { scaleX: 1 }
                    : { scaleX: 0 }
                }
                transition={{
                  duration: 0.75,
                  delay: 0.22,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="hidden sm:block w-14 lg:w-20 h-[1px] bg-gradient-to-l from-transparent to-[#C9AB78]/70 origin-left"
              />
            </span>

            {/* Line 2: "Khi Đặt Lưu Trú & Vé Tham Quan" — Balanced Display Sans */}
            <span className="block overflow-visible py-1">
              <motion.span
                initial={
                  reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }
                }
                animate={
                  isContentInView || reducedMotion
                    ? { opacity: 1, y: 0 }
                    : { opacity: 0, y: 18 }
                }
                transition={{
                  duration: 0.72,
                  delay: 0.32,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="inline-block text-[clamp(20px,2.6vw,34px)] font-semibold tracking-[-0.01em] text-[#FFF8E9] leading-[1.32]"
              >
                Khi Đặt Lưu Trú &amp; Vé Tham Quan
              </motion.span>
            </span>
          </h2>

          {/* 5. Supporting Description (Preserves exact copy) */}
          <motion.p
            initial={
              reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }
            }
            animate={
              isContentInView || reducedMotion
                ? { opacity: 1, y: 0 }
                : { opacity: 0, y: 14 }
            }
            transition={{
              duration: 0.7,
              delay: 0.42,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="text-[#FFF8E9]/88 max-w-xl mx-auto mb-9 sm:mb-10 text-sm sm:text-[16px] leading-[1.7] font-normal"
          >
            Trở thành thành viên VIP DanangGo — nhận voucher độc quyền, ưu đãi
            flash sale và lịch trình cá nhân hóa miễn phí.
          </motion.p>

          {/* 6. Two Premium CTAs with Safe Magnetic Motion (Preserves exact labels & hrefs) */}
          <motion.div
            initial={
              reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }
            }
            animate={
              isContentInView || reducedMotion
                ? { opacity: 1, y: 0 }
                : { opacity: 0, y: 14 }
            }
            transition={{
              duration: 0.7,
              delay: 0.5,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <SafeMagneticLink
              href="/dang-nhap?tab=dang-ky&intent=vip"
              variant="primary"
              reducedMotion={reducedMotion}
            >
              <span>Đăng ký thành viên VIP</span>
              <span
                aria-hidden="true"
                className="inline-block transition-transform duration-300 group-hover/cta:translate-x-1"
              >
                →
              </span>
            </SafeMagneticLink>

            <SafeMagneticLink
              href="/lich-trinh/tao-moi"
              variant="secondary"
              reducedMotion={reducedMotion}
            >
              <span>📋 Tạo lịch trình của bạn</span>
            </SafeMagneticLink>
          </motion.div>

          {/* 7. Supporting Trust Line (Preserves exact copy) */}
          <motion.p
            initial={
              reducedMotion ? { opacity: 1 } : { opacity: 0 }
            }
            animate={
              isContentInView || reducedMotion
                ? { opacity: 1 }
                : { opacity: 0 }
            }
            transition={{
              duration: 0.65,
              delay: 0.6,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="text-[#C9AB78]/85 text-xs mt-7 sm:mt-8 tracking-[0.06em]"
          >
            Miễn phí hoàn toàn · Không cần thẻ tín dụng · Hủy bất kỳ lúc nào
          </motion.p>
        </div>
      </div>
    </section>
  );
}
