"use client";

/**
 * ThreeWorldsCategories V12.0 — DANANGGO: THE THREE WORLDS OF DA NANG
 *
 * Scoped strictly to the "KHÁM PHÁ THEO DANH MỤC" section on the Homepage.
 *
 * Features:
 * 1. 6-Layer Cinematic Landscape Background with reversible scroll parallax:
 *    - Layer 01: Deep Ocean Base (#102832)
 *    - Layer 02: Coastal Mountain & Sea Panorama (/images/categories/categories-coastal-bg.jpg)
 *    - Layer 03: Controlled Directional Vignette Overlay
 *    - Layer 04: Topographic Coastal Contours + ORYZO-inspired Golden Vector Journey (SVG Bézier + getPointAtLength pinpoint)
 *    - Layer 05: Dynamic Atmospheric Light (750ms crossfade between Champagne Gold for Lưu trú, Warm Amber for Ẩm thực, and Ocean Teal for Điểm du lịch)
 *    - Layer 06: 3 Interactive Expanding Category Panels
 * 2. Interactive Expanding Gallery (Desktop flex ratios 1 : 1 : 1 -> 1.35 : 0.825 : 0.825 with 750ms cubic-bezier(0.22, 1, 0.36, 1)).
 * 3. Distinct Art Direction & Camera Motion per World (Aman calm hospitality, Luxury food editorial Mì Quảng, White Desert expedition).
 * 4. One-shot 1px Champagne Border Light Sweep on active/hovered panel.
 * 5. Luxury Travel Editorial Typography ("KHÁM PHÁ THEO" in Display Sans + "Danh mục" in Playfair Display Italic with one-shot Champagne shimmer, plus non-breaking "Check-in" protection).
 */

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useInView,
  useReducedMotion,
  useMotionValueEvent,
} from "framer-motion";

export interface CategoryWorldItem {
  id: string;
  href: string;
  label: string;
  desc: string;
  count: number;
  icon: string;
  stat: string;
  cta: string;
  highlights: string[];
  img: string;
  color?: string;
}

interface ThreeWorldsCategoriesProps {
  categories: CategoryWorldItem[];
  activeIndex?: number;
  onActiveChange?: (index: number) => void;
}

const EASE_LUXURY = [0.22, 1, 0.36, 1] as const;

// Helper to ensure "Check-in" or "check-in" never wraps awkwardly between "Check-" and "in"
function renderNonBreakingLabel(text: string): React.ReactNode {
  if (!/check-in/i.test(text)) return text;
  const parts = text.split(/(check-in)/i);
  return parts.map((part, idx) =>
    /^check-in$/i.test(part) ? (
      <span key={idx} className="whitespace-nowrap">
        {part}
      </span>
    ) : (
      <React.Fragment key={idx}>{part}</React.Fragment>
    )
  );
}

export default function ThreeWorldsCategories({
  categories,
  onActiveChange,
}: ThreeWorldsCategoriesProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const journeyPathRef = useRef<SVGPathElement>(null);

  const reducedMotionHook = useReducedMotion();
  const prefersReduced = Boolean(reducedMotionHook);

  // hoveredIndex: null = default 1:1:1 state; 0 | 1 | 2 = expanded active world
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [ambientIndex, setAmbientIndex] = useState<number>(0);
  const [sweepKeys, setSweepKeys] = useState<number[]>([0, 0, 0]);
  const [headingShimmerDone, setHeadingShimmerDone] = useState(false);

  const isHeadingInView = useInView(headingRef, {
    once: true,
    margin: "40px 0px -20px 0px",
    amount: 0.15,
  });

  const isGalleryInView = useInView(galleryRef, {
    once: true,
    margin: "60px 0px -20px 0px",
    amount: 0.08,
  });

  // One-shot Champagne shimmer across "Danh mục" after heading reveal
  useEffect(() => {
    if (!isHeadingInView || prefersReduced) return;
    const timer = setTimeout(() => {
      setHeadingShimmerDone(true);
    }, 680);
    return () => clearTimeout(timer);
  }, [isHeadingInView, prefersReduced]);

  // Trigger a one-shot border sweep when gallery first enters view
  useEffect(() => {
    if (!isGalleryInView || prefersReduced) return;
    const timer = setTimeout(() => {
      setSweepKeys((prev) => [prev[0] + 1, prev[1], prev[2]]);
    }, 950);
    return () => clearTimeout(timer);
  }, [isGalleryInView, prefersReduced]);

  // Master Scroll Timeline (0% -> 100% across the section)
  const { scrollYProgress: rawScroll } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const smoothScroll = useSpring(rawScroll, {
    stiffness: 140,
    damping: 30,
    mass: 0.4,
    restDelta: 0.0005,
  });

  // Layer 02: Background Coastal Landscape Parallax (scale 1.03 -> 1.08, translateY -22px -> 26px)
  const bgScale = useTransform(
    smoothScroll,
    [0, 0.5, 1],
    prefersReduced ? [1, 1, 1] : [1.03, 1.06, 1.08]
  );
  const bgY = useTransform(
    smoothScroll,
    [0, 1],
    prefersReduced ? ["0px", "0px"] : ["-22px", "26px"]
  );

  // Layer 04: Topographic Vector Lines Parallax (-14px -> 18px)
  const vectorY = useTransform(
    smoothScroll,
    [0, 1],
    prefersReduced ? ["0px", "0px"] : ["-14px", "18px"]
  );

  // Layer 05: Atmospheric Light Parallax (-28px -> 32px)
  const lightY = useTransform(
    smoothScroll,
    [0, 1],
    prefersReduced ? ["0px", "0px"] : ["-28px", "32px"]
  );

  // Internal card image vertical parallax (-10px -> 10px)
  const cardInternalY = useTransform(
    smoothScroll,
    [0.15, 0.85],
    prefersReduced ? ["0px", "0px"] : ["-10px", "10px"]
  );

  // Section 18: Golden Vector Journey SVG path draw & pinpoint traveler
  const [pathLen, setPathLen] = useState(1650);
  const [dashOffset, setDashOffset] = useState(0);
  const [journeyOpacity, setJourneyOpacity] = useState(0.55);
  const [pinpoint, setPinpoint] = useState<{ x: number; y: number }>({
    x: 420,
    y: 360,
  });

  useEffect(() => {
    if (!journeyPathRef.current) return;
    try {
      const len = journeyPathRef.current.getTotalLength();
      if (len > 0) {
        setPathLen(len);
        const pt = journeyPathRef.current.getPointAtLength(len * 0.48);
        setPinpoint({ x: pt.x, y: pt.y });
      }
    } catch {
      // Fallback
    }
  }, []);

  useMotionValueEvent(smoothScroll, "change", (latest) => {
    if (!journeyPathRef.current || pathLen <= 0) return;
    const clamped = Math.max(0, Math.min(1, latest));
    // Draw from 15% to 82% of scroll progress, then gently dim in Scene 05 (85-100%)
    const drawProgress = prefersReduced
      ? 1
      : Math.max(0.18, Math.min(1, (clamped - 0.1) / 0.68));
    setDashOffset(pathLen * (1 - drawProgress));

    const fadeOut =
      clamped > 0.82
        ? Math.max(0.22, 0.68 - ((clamped - 0.82) / 0.18) * 0.46)
        : 0.68;
    setJourneyOpacity(fadeOut);

    try {
      const pt = journeyPathRef.current.getPointAtLength(
        pathLen * (0.15 + drawProgress * 0.72)
      );
      setPinpoint({ x: pt.x, y: pt.y });
    } catch {
      // Ignore if unmounted
    }
  });

  const handleActivatePanel = (idx: number) => {
    setHoveredIndex(idx);
    setAmbientIndex(idx);
    onActiveChange?.(idx);
    if (!prefersReduced) {
      setSweepKeys((prev) => {
        const next = [...prev];
        next[idx] = next[idx] + 1;
        return next;
      });
    }
  };

  const handleDeactivateGallery = () => {
    setHoveredIndex(null);
  };

  return (
    <section
      ref={sectionRef}
      id="khamphatheodanhmuc"
      aria-labelledby="three-worlds-heading"
      className="py-14 lg:py-20 bg-[#102832] text-[#F8F8F4] relative overflow-hidden"
    >
      {/* ================================================================
          LAYER 01 & 02 — DEEP OCEAN BASE & COASTAL LANDSCAPE PARALLAX
          ================================================================ */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none"
      >
        <motion.div
          style={{ scale: bgScale, y: bgY }}
          className="absolute -inset-[6%] w-[112%] h-[112%]"
        >
          <img
            src="/images/categories/categories-coastal-bg.jpg"
            alt=""
            decoding="async"
            loading="lazy"
            className="w-full h-full object-cover object-center opacity-[0.28]"
          />
        </motion.div>

        {/* Distant mountain silhouette layer */}
        <motion.div
          style={{ y: vectorY }}
          className="absolute inset-x-0 bottom-0 h-[52%] opacity-25 mix-blend-soft-light"
        >
          <img
            src="/images/cinematic/mountains/distant-mountain-layer.svg"
            alt=""
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover object-bottom"
          />
        </motion.div>

        {/* ================================================================
            LAYER 03 — DIRECTIONAL OVERLAY (Controlled Deep Ocean Vignette)
            ================================================================ */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, #102832 0%, rgba(16,40,50,0.68) 22%, rgba(12,32,38,0.62) 55%, rgba(16,40,50,0.82) 85%, #102832 100%)",
          }}
        />

        {/* ================================================================
            LAYER 04 — TOPOGRAPHIC COASTAL CONTOURS & GOLDEN VECTOR JOURNEY
            ================================================================ */}
        <motion.div
          style={{ y: vectorY }}
          className="absolute -inset-[4%] w-[108%] h-[108%]"
        >
          <img
            src="/images/categories/categories-topographic-lines.svg"
            alt=""
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover opacity-80"
          />
        </motion.div>

        {/* ORYZO-Inspired Golden Vector Journey S-Curve behind the 3 panels */}
        <svg
          viewBox="0 0 1600 900"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 w-full h-full transition-opacity duration-500"
          style={{ opacity: journeyOpacity }}
        >
          <defs>
            <linearGradient
              id="threeWorldsJourneyGrad"
              x1="0%"
              y1="50%"
              x2="100%"
              y2="50%"
            >
              <stop offset="0%" stopColor="#C9B580" stopOpacity="0" />
              <stop offset="20%" stopColor="#C9B580" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#FFF8E9" stopOpacity="0.78" />
              <stop offset="80%" stopColor="#E87B39" stopOpacity="0.42" />
              <stop offset="100%" stopColor="#69A5A3" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="threeWorldsPinGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFF8E9" stopOpacity="1" />
              <stop offset="38%" stopColor="#C9B580" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#C9B580" stopOpacity="0" />
            </radialGradient>
          </defs>

          <path
            ref={journeyPathRef}
            d="M -60 640 C 280 710, 520 420, 810 470 C 1100 520, 1320 310, 1660 365"
            stroke="url(#threeWorldsJourneyGrad)"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeDasharray={pathLen}
            strokeDashoffset={prefersReduced ? 0 : dashOffset}
          />

          <g transform={`translate(${pinpoint.x}, ${pinpoint.y})`}>
            <circle cx="0" cy="0" r="22" fill="url(#threeWorldsPinGlow)" />
            <circle cx="0" cy="0" r="3" fill="#FFF8E9" />
          </g>
        </svg>

        {/* ================================================================
            LAYER 05 — DYNAMIC ATMOSPHERIC LIGHT (750ms Crossfade per World)
            ================================================================ */}
        <motion.div
          style={{ y: lightY }}
          className="absolute -inset-[4%] w-[108%] h-[108%]"
        >
          <img
            src="/images/categories/categories-golden-light.svg"
            alt=""
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />

          {/* World 01 Ambient: Lưu trú nghỉ dưỡng — Champagne Gold Morning Serenity */}
          <div
            className="absolute inset-0 transition-opacity duration-800 ease-out"
            style={{
              opacity: ambientIndex === 0 ? 1 : 0,
              background:
                "radial-gradient(ellipse 58% 54% at 24% 56%, rgba(201,181,128,0.22) 0%, rgba(255,248,233,0.08) 45%, transparent 76%)",
            }}
          />

          {/* World 02 Ambient: Thiên đường ẩm thực — Warm Amber & Sunset Orange */}
          <div
            className="absolute inset-0 transition-opacity duration-800 ease-out"
            style={{
              opacity: ambientIndex === 1 ? 1 : 0,
              background:
                "radial-gradient(ellipse 58% 54% at 50% 56%, rgba(232,123,57,0.20) 0%, rgba(201,171,120,0.10) 45%, transparent 76%)",
            }}
          />

          {/* World 03 Ambient: Điểm du lịch & Check-in — Ocean Teal & Coastal Turquoise */}
          <div
            className="absolute inset-0 transition-opacity duration-800 ease-out"
            style={{
              opacity: ambientIndex === 2 ? 1 : 0,
              background:
                "radial-gradient(ellipse 58% 54% at 76% 56%, rgba(105,165,163,0.24) 0%, rgba(33,107,112,0.14) 48%, transparent 76%)",
            }}
          />
        </motion.div>

        {/* Subtle organic tropical foliage silhouette at upper corners */}
        <img
          src="/images/categories/categories-foliage-foreground.svg"
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover opacity-70"
        />
      </div>

      {/* ================================================================
          MAIN CONTENT CONTAINER
          ================================================================ */}
      <div className="home-container relative z-10">
        {/* ── HEADER: LUXURY TRAVEL TYPOGRAPHY (SECTIONS 13 & 14) ── */}
        <div
          ref={headingRef}
          className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10 lg:mb-14"
        >
          <div>
            {/* Step 1: Eyebrow text */}
            <motion.div
              initial={
                prefersReduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }
              }
              animate={
                isHeadingInView
                  ? { opacity: 1, y: 0 }
                  : { opacity: 0, y: 12 }
              }
              transition={{ duration: 0.65, ease: EASE_LUXURY }}
              className="flex items-center gap-3 mb-3.5"
            >
              <span
                className="w-10 h-[1px] bg-[#C9B580]"
                aria-hidden="true"
              />
              <span className="home-eyebrow text-[#BCD3D1] tracking-[0.2em]">
                Đa dạng lựa chọn
              </span>
            </motion.div>

            {/* Step 2, 3, 4: "Khám phá theo" (Display Sans) + "danh mục" (Editorial Serif Italic + One-shot Champagne Shimmer) */}
            <h2
              id="three-worlds-heading"
              className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1 text-[#F8F8F4]"
            >
              {/* Display Sans phrase */}
              <span className="inline-block overflow-hidden py-1 -my-1">
                <motion.span
                  initial={
                    prefersReduced
                      ? { opacity: 1, y: 0 }
                      : { opacity: 0, y: "82%" }
                  }
                  animate={
                    isHeadingInView
                      ? { opacity: 1, y: 0 }
                      : { opacity: 0, y: "82%" }
                  }
                  transition={{
                    duration: 0.78,
                    delay: prefersReduced ? 0 : 0.08,
                    ease: EASE_LUXURY,
                  }}
                  style={{
                    fontFamily:
                      "var(--font-display), 'Be Vietnam Pro', sans-serif",
                    fontSize: "clamp(1.95rem, 3.6vw, 3.35rem)",
                    lineHeight: 1.22,
                  }}
                  className="inline-block font-semibold uppercase tracking-[-0.015em] text-[#F8F8F4]"
                >
                  Khám phá theo
                </motion.span>
              </span>

              {/* Editorial Serif Italic accent phrase ("danh mục") */}
              <span className="relative inline-block overflow-hidden px-2 py-1.5 -mx-1 -my-1">
                <motion.span
                  initial={
                    prefersReduced
                      ? { opacity: 1, y: 0 }
                      : { opacity: 0, y: "78%" }
                  }
                  animate={
                    isHeadingInView
                      ? { opacity: 1, y: 0 }
                      : { opacity: 0, y: "78%" }
                  }
                  transition={{
                    duration: 0.88,
                    delay: prefersReduced ? 0 : 0.18,
                    ease: EASE_LUXURY,
                  }}
                  style={{
                    fontFamily:
                      "var(--font-serif-editorial), 'Playfair Display', Georgia, serif",
                    fontSize: "clamp(2.25rem, 4.3vw, 4.1rem)",
                    lineHeight: 1.24,
                  }}
                  className="relative inline-block italic font-normal text-[#E6D9B7]"
                >
                  danh mục

                  {/* Step 4: One-shot Champagne Gold shimmer light sweep */}
                  {!prefersReduced && (
                    <motion.span
                      aria-hidden="true"
                      initial={{ x: "-135%", opacity: 0 }}
                      animate={
                        headingShimmerDone
                          ? { x: ["-135%", "165%"], opacity: [0, 0.9, 0] }
                          : { x: "-135%", opacity: 0 }
                      }
                      transition={{ duration: 1.35, ease: EASE_LUXURY }}
                      style={{
                        background:
                          "linear-gradient(105deg, transparent 20%, rgba(255,248,233,0.15) 38%, rgba(255,248,233,0.95) 50%, rgba(201,181,128,0.2) 62%, transparent 80%)",
                        WebkitBackgroundClip: "text",
                        backgroundClip: "text",
                        color: "transparent",
                      }}
                      className="pointer-events-none absolute inset-0 select-none italic font-normal"
                    >
                      danh mục
                    </motion.span>
                  )}
                </motion.span>
              </span>
            </h2>
          </div>

          {/* Step 6: Description reveal */}
          <motion.p
            initial={
              prefersReduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }
            }
            animate={
              isHeadingInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }
            }
            transition={{
              duration: 0.72,
              delay: prefersReduced ? 0 : 0.26,
              ease: EASE_LUXURY,
            }}
            className="text-[#F8F8F4]/78 text-sm sm:text-[15px] leading-relaxed max-w-md border-l border-[#C9B580]/55 pl-4"
          >
            Chọn đúng danh mục, tìm đúng trải nghiệm — từ nghỉ dưỡng sang trọng
            đến ẩm thực dân dã và điểm{" "}
            <span className="whitespace-nowrap">check-in</span> hot nhất Đà
            Nẵng.
          </motion.p>
        </div>

        {/* Step 5: Decorative architectural hairline drawn left-to-right */}
        <div
          aria-hidden="true"
          className="w-full overflow-hidden mb-10 lg:mb-14"
        >
          <motion.div
            initial={prefersReduced ? { scaleX: 1 } : { scaleX: 0 }}
            animate={isHeadingInView ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{
              duration: 0.95,
              delay: prefersReduced ? 0 : 0.22,
              ease: EASE_LUXURY,
            }}
            className="h-[1px] w-full origin-left bg-gradient-to-r from-[#C9B580]/55 via-white/15 to-transparent"
          />
        </div>

        {/* ================================================================
            LAYER 06 — INTERACTIVE EXPANDING GALLERY (SECTIONS 08–12, 15, 16)
            Default: 1 : 1 : 1
            Hovered/Focused: 1.35 : 0.825 : 0.825 (on Desktop lg+)
            ================================================================ */}
        <div
          ref={galleryRef}
          onMouseLeave={handleDeactivateGallery}
          className="flex flex-col lg:flex-row items-stretch gap-5 xl:gap-6 w-full"
        >
          {categories.map((cat, idx) => {
            const isHovered = hoveredIndex === idx;
            const isAnotherHovered =
              hoveredIndex !== null && hoveredIndex !== idx;
            const flexRatio =
              hoveredIndex === null ? 1 : isHovered ? 1.35 : 0.825;

            // Distinct camera hover motion per world (Section 16)
            const hoverImageTransform =
              idx === 0
                ? "group-hover:scale-[1.045] group-hover:-translate-x-1" // Aman: serene horizontal glide
                : idx === 1
                ? "group-hover:scale-[1.055] group-hover:-translate-y-1.5" // Culinary: warm vertical close-up
                : "group-hover:scale-[1.07] group-hover:-translate-y-2"; // White Desert: deeper expedition push-in

            // Per-world accent color for border light sweep
            const worldSweepGradient =
              idx === 0
                ? "linear-gradient(115deg, transparent 20%, rgba(255,248,233,0.95) 48%, rgba(201,181,128,0.85) 54%, transparent 78%)"
                : idx === 1
                ? "linear-gradient(115deg, transparent 20%, rgba(255,248,233,0.95) 48%, rgba(232,123,57,0.85) 54%, transparent 78%)"
                : "linear-gradient(115deg, transparent 20%, rgba(255,248,233,0.95) 48%, rgba(105,165,163,0.9) 54%, transparent 78%)";

            return (
              /* Wrapper 1: Flex-grow layout expansion wrapper (no transform conflict) */
              <div
                key={cat.id}
                onMouseEnter={() => handleActivatePanel(idx)}
                onFocus={() => handleActivatePanel(idx)}
                style={{
                  flexGrow: flexRatio,
                  flexShrink: 1,
                  flexBasis: "0%",
                  transition: prefersReduced
                    ? "none"
                    : "flex-grow 750ms cubic-bezier(0.22, 1, 0.36, 1)",
                }}
                className="min-w-0 w-full"
              >
                {/* Wrapper 2: Scroll-triggered Cinematic Image Mask Reveal (Section 10) */}
                <motion.div
                  initial={
                    prefersReduced
                      ? {
                          clipPath: "inset(0% 0% 0% 0% round 8px)",
                          opacity: 1,
                          y: 0,
                        }
                      : {
                          clipPath: "inset(10% 6% 10% 6% round 8px)",
                          opacity: 0.85,
                          y: 18,
                        }
                  }
                  animate={
                    isGalleryInView
                      ? {
                          clipPath: "inset(0% 0% 0% 0% round 8px)",
                          opacity: 1,
                          y: 0,
                        }
                      : {
                          clipPath: "inset(10% 6% 10% 6% round 8px)",
                          opacity: 0.85,
                          y: 18,
                        }
                  }
                  transition={{
                    duration: 0.95,
                    delay: prefersReduced ? 0 : idx * 0.13,
                    ease: EASE_LUXURY,
                  }}
                  className="h-full"
                >
                  <Link
                    href={cat.href}
                    className="group relative block w-full h-[460px] sm:h-[500px] lg:h-[540px] rounded-[8px] overflow-hidden bg-[#142F3A] border transition-colors duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9B580]"
                    style={{
                      borderColor: isHovered
                        ? "rgba(201, 181, 128, 0.82)"
                        : "rgba(255, 255, 255, 0.16)",
                      boxShadow: isHovered
                        ? "0 24px 56px rgba(6, 18, 24, 0.45)"
                        : "0 12px 32px rgba(6, 18, 24, 0.25)",
                    }}
                  >
                    {/* ========================================================
                        WRAPPER 3 & 4 — SCROLL PARALLAX + HOVER CAMERA MOTION
                        ======================================================== */}
                    <motion.div
                      style={{ y: cardInternalY }}
                      className="absolute -inset-[5%] w-[110%] h-[110%] pointer-events-none"
                    >
                      <motion.div
                        initial={
                          prefersReduced ? { scale: 1 } : { scale: 1.08 }
                        }
                        animate={
                          isGalleryInView ? { scale: 1 } : { scale: 1.08 }
                        }
                        transition={{
                          duration: 1.15,
                          delay: prefersReduced ? 0 : idx * 0.13,
                          ease: EASE_LUXURY,
                        }}
                        className="w-full h-full"
                      >
                        <img
                          src={cat.img}
                          alt={cat.label}
                          decoding="async"
                          loading="lazy"
                          className={`w-full h-full object-cover object-center transition-transform duration-750 ease-[cubic-bezier(0.22,1,0.36,1)] ${hoverImageTransform}`}
                        />
                      </motion.div>
                    </motion.div>

                    {/* ========================================================
                        CONTROLLED EDITORIAL OVERLAY (Upper scenery stays crisp
                        and luminous; lower gradient grounds the typography)
                        ======================================================== */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 transition-opacity duration-500"
                      style={{
                        opacity: isHovered ? 0.86 : isAnotherHovered ? 0.96 : 0.9,
                        background:
                          "linear-gradient(180deg, rgba(10,32,41,0.22) 0%, rgba(16,40,50,0.06) 34%, rgba(16,40,50,0.52) 62%, rgba(10,28,36,0.94) 100%)",
                      }}
                    />

                    {/* ========================================================
                        SECTION 12 — PREMIUM 1PX BORDER LIGHT SWEEP (One-shot)
                        ======================================================== */}
                    {!prefersReduced && sweepKeys[idx] > 0 && (
                      <motion.div
                        key={`border-sweep-${cat.id}-${sweepKeys[idx]}`}
                        aria-hidden="true"
                        initial={{ x: "-130%", opacity: 0 }}
                        animate={{
                          x: ["-130%", "130%"],
                          opacity: [0, 1, 0],
                        }}
                        transition={{ duration: 1.45, ease: EASE_LUXURY }}
                        className="pointer-events-none absolute inset-0 z-20 rounded-[8px]"
                        style={{
                          padding: "1.25px",
                          background: worldSweepGradient,
                          WebkitMask:
                            "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                          WebkitMaskComposite: "xor",
                          maskComposite: "exclude",
                        }}
                      />
                    )}

                    {/* ========================================================
                        TOP BAR: COMPACT STAT BADGE & EDITORIAL INDEX (01 // 03)
                        ======================================================== */}
                    <div className="absolute top-5 left-5 right-5 z-15 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 bg-[#0A2029]/75 backdrop-blur-xs border border-white/20 group-hover:border-[#C9B580]/60 rounded-[4px] px-3 py-1 text-[11.5px] font-medium tracking-wide text-[#F8F8F4] transition-colors duration-300">
                        <span>{cat.icon}</span>
                        <span>{cat.stat}</span>
                      </span>

                      <span
                        aria-hidden="true"
                        style={{
                          fontFamily:
                            "var(--font-serif-editorial), 'Playfair Display', Georgia, serif",
                        }}
                        className="text-sm italic tracking-[0.14em] text-[#FFF8E9]/85 group-hover:text-[#E6D9B7] transition-colors duration-300"
                      >
                        0{idx + 1} / 03
                      </span>
                    </div>

                    {/* ========================================================
                        BOTTOM EDITORIAL CONTENT & ALIGNED CTA BASELINE
                        ======================================================== */}
                    <div className="absolute inset-x-0 bottom-0 z-15 flex flex-col justify-end p-6 sm:p-7">
                      {/* Category Title (Non-breaking "Check-in" protection) */}
                      <h3
                        style={{
                          fontFamily:
                            "var(--font-serif-editorial), 'Playfair Display', Georgia, serif",
                          fontSize: "clamp(1.45rem, 2.05vw, 1.95rem)",
                          lineHeight: 1.24,
                        }}
                        className="text-[#F8F8F4] group-hover:text-[#FFF8E9] font-medium tracking-[-0.01em] mb-2.5 transition-transform duration-400 group-hover:-translate-y-1 drop-shadow-[0_2px_10px_rgba(10,32,41,0.55)]"
                      >
                        {renderNonBreakingLabel(cat.label)}
                      </h3>

                      {/* Description (Uniform 2-line height reserve so CTAs always share the same baseline) */}
                      <p className="text-[#F8F8F4]/82 text-[13.5px] sm:text-[14px] leading-[1.65] mb-4 line-clamp-2 min-h-[44px]">
                        {cat.desc}
                      </p>

                      {/* Refined Highlights Metadata Row (Restrained border & subtle dot separators) */}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 mb-5">
                        {cat.highlights.map((tag) => (
                          <span
                            key={tag}
                            className="text-[11px] font-medium tracking-wide text-[#FFF8E9]/90 bg-[#0A2029]/55 border border-white/15 group-hover:border-[#C9B580]/40 px-2.5 py-0.5 rounded-[3px] transition-colors duration-300"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* CTA Bar with thin architectural divider, underline reveal & arrow translation */}
                      <div className="pt-3.5 border-t border-white/15 group-hover:border-[#C9B580]/55 flex items-center justify-between transition-colors duration-300">
                        <span className="relative inline-flex items-center text-[#F8F8F4] group-hover:text-[#E6D9B7] text-xs font-semibold tracking-[0.14em] uppercase transition-colors duration-300 py-0.5">
                          <span>{ renderNonBreakingLabel(cat.cta) }</span>
                          <span
                            aria-hidden="true"
                            className="absolute left-0 right-0 bottom-0 h-[1px] bg-[#C9B580] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-350 ease-out"
                          />
                        </span>

                        <span
                          aria-hidden="true"
                          className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-white/20 group-hover:border-[#C9B580] group-hover:bg-[#C9B580]/15 text-[#F8F8F4] group-hover:text-[#E6D9B7] transition-all duration-300 group-hover:translate-x-1"
                        >
                          →
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
