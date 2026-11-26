"use client";

/**
 * ImmersiveDiscoverySection V9.1 — Lando Norris Dual Cutouts × ORYZO Horizontal Gallery
 * with White Desert Cinematic Multi-Layer Landscape Background
 *
 * Scoped strictly to the Homepage Statistics (500+, 1500+, 98%, 50+) and Popular Places
 * ("Được xem nhiều nhất tuần qua") section right below Hero.
 *
 * V9.1 Multi-Layer Background Architecture for Horizontal Destination Gallery (Sections 03–11):
 * - Layer 01 (Cinematic Landscape): Full-bleed aerial panorama of Son Tra Peninsula &
 *   Da Nang turquoise coastline (`/images/cinematic/hero/hero-sontra-mist.jpg`), sized 114%
 *   wide so scroll-linked horizontal parallax (-96px) and subtle scale (1.07 -> 1.03)
 *   never expose empty edges.
 * - Layer 02 (Directional Overlay & Seamless Transitions): Controlled Deep Ocean (`#102832`)
 *   and Ocean Teal (`#216B70`) atmospheric wash ensuring high card contrast, with soft
 *   top/bottom ivory feathering (`#F8F8F4`) so the transition from the Lando Norris stage
 *   above and into the Weekend Events bridge below is 100% seamless without thick white fog.
 * - Layer 03 (ORYZO Topographic Vector Lines): Coastal contour trajectories, sun-orbit arc,
 *   and horizon wave paths drawn progressively via `pathLength` + independent horizontal drift
 *   (`-48px`) and a glowing Champagne Gold pinpoint traveling along the curve.
 * - Layer 04 (Cinematic Atmospheric Lighting): Restrained Sunrise/Sunset Orange (`#E87B39`)
 *   and Champagne Gold (`#C9B580`) radial light pools shifting (`+36px -> -54px`) in sync
 *   with horizontal scroll progress (0–20% reveal, 20–50% depth parallax, 50–80% light drift,
 *   80–100% settle & release).
 * - Layer 05 (Horizontal Exhibition Gallery): Scroll-driven horizontal track of opaque
 *   warm-ivory (`#FAF8F3`) destination cards with internal camera image parallax.
 * - Layer 06 (Premium Interactive Effects): Active center card emphasis, one-shot border
 *   light sweep, shimmer reflection, and synchronized Previous / Next controls.
 */

import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  useCallback,
} from "react";
import Link from "next/link";
import Image from "next/image";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useReducedMotion,
  useMotionValueEvent,
  type MotionValue,
} from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import AnimatedCounter from "@/components/ui/AnimatedCounter";

export interface DiscoveryStatItem {
  to: number;
  suffix: string;
  label: string;
  coord: string;
}

export interface HorizontalGalleryContextValue {
  /** Normalized horizontal scroll progress (0 = first card at start, 1 = last card fully revealed) */
  progressMotion: MotionValue<number>;
  /** Index of the card currently closest to the visual focal zone */
  activeIndex: number;
  /** Total cards in the track */
  totalCards: number;
  /** True when desktop scroll-driven horizontal pinning is active */
  isPinnedHorizontal: boolean;
}

const HorizontalGalleryContext =
  createContext<HorizontalGalleryContextValue | null>(null);

export function useHorizontalGalleryContext() {
  return useContext(HorizontalGalleryContext);
}

interface ImmersiveDiscoverySectionProps {
  stats: DiscoveryStatItem[];
  onScrollGallery: (direction: "prev" | "next") => void;
  galleryRef: React.RefObject<HTMLDivElement | null>;
  surveyNode?: React.ReactNode;
  totalCards?: number;
  children: React.ReactNode;
}

export default function ImmersiveDiscoverySection({
  stats,
  onScrollGallery,
  galleryRef,
  surveyNode,
  totalCards = 4,
  children,
}: ImmersiveDiscoverySectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const pinContainerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const reducedMotion = useReducedMotion();
  const [viewportMode, setViewportMode] = useState<
    "mobile" | "tablet" | "desktop"
  >("desktop");
  const [maxHorizontalShift, setMaxHorizontalShift] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateViewport = () => {
      const w = window.innerWidth;
      if (w < 768) setViewportMode("mobile");
      else if (w < 1024) setViewportMode("tablet");
      else setViewportMode("desktop");
    };
    updateViewport();
    window.addEventListener("resize", updateViewport, { passive: true });
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  const isMobile = viewportMode === "mobile";
  const isTablet = viewportMode === "tablet";
  const isDesktop = viewportMode === "desktop";
  const disableScrollTransforms = Boolean(reducedMotion || isMobile);

  // Measure horizontal track overflow dynamically (track.scrollWidth - viewport.clientWidth)
  const measureTrackDistance = useCallback(() => {
    if (typeof window === "undefined") return;
    const viewportEl = viewportRef.current;
    const trackEl = trackRef.current;
    if (!viewportEl || !trackEl || window.innerWidth < 1024 || reducedMotion) {
      setMaxHorizontalShift(0);
      return;
    }
    const rawShift = trackEl.scrollWidth - viewportEl.clientWidth;
    setMaxHorizontalShift(rawShift > 16 ? Math.ceil(rawShift) : 0);
  }, [reducedMotion]);

  useEffect(() => {
    measureTrackDistance();
    window.addEventListener("resize", measureTrackDistance, { passive: true });
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => measureTrackDistance());
      if (viewportRef.current) ro.observe(viewportRef.current);
      if (trackRef.current) ro.observe(trackRef.current);
    }
    return () => {
      window.removeEventListener("resize", measureTrackDistance);
      ro?.disconnect();
    };
  }, [measureTrackDistance, children]);

  const isPinnedHorizontal =
    isDesktop && !reducedMotion && maxHorizontalShift > 16;

  // ── UPPER DISCOVERY STAGE TIMELINE (Layers 01–07: Lando Norris Cutouts + Typography + Stats) ──
  const { scrollYProgress: stageScrollProgress } = useScroll({
    target: stageRef,
    offset: ["start 92%", "end 15%"],
  });

  // Layer 02: Topographic Contour Lines parallax & stroke reveal
  const contourY = useTransform(
    stageScrollProgress,
    [0, 0.5, 1],
    disableScrollTransforms ? [0, 0, 0] : [-14, 4, 22]
  );
  const contourOpacity = useTransform(
    stageScrollProgress,
    [0, 0.2, 0.65, 1],
    reducedMotion ? [0.85, 0.85, 0.85, 0.85] : [0.35, 1, 0.92, 0.55]
  );

  // Layer 03: Left Landmark Subject (Golden Bridge Stone Hands)
  const leftSubjectX = useTransform(
    stageScrollProgress,
    [0, 0.18, 0.42, 0.65, 0.92],
    disableScrollTransforms
      ? ["0px", "0px", "0px", "0px", "0px"]
      : isTablet
      ? ["-64px", "-12px", "0px", "-8px", "-42px"]
      : ["-130px", "-28px", "0px", "-16px", "-88px"]
  );
  const leftSubjectY = useTransform(
    stageScrollProgress,
    [0, 0.5, 1],
    disableScrollTransforms ? [0, 0, 0] : [36, 0, -44]
  );
  const leftSubjectScale = useTransform(
    stageScrollProgress,
    [0, 0.4, 0.85],
    disableScrollTransforms ? [1, 1, 1] : [0.95, 1.04, 0.98]
  );
  const leftSubjectOpacity = useTransform(
    stageScrollProgress,
    [0, 0.15, 0.45, 0.78, 0.96],
    disableScrollTransforms
      ? [0.75, 0.75, 0.75, 0.75, 0.75]
      : [0.15, 0.88, 1, 0.82, 0.38]
  );

  // Layer 04: Right Landmark Subject (Son Tra Sanctuary)
  const rightSubjectX = useTransform(
    stageScrollProgress,
    [0, 0.2, 0.44, 0.66, 0.92],
    disableScrollTransforms
      ? ["0px", "0px", "0px", "0px", "0px"]
      : isTablet
      ? ["64px", "14px", "0px", "10px", "44px"]
      : ["140px", "32px", "0px", "18px", "94px"]
  );
  const rightSubjectY = useTransform(
    stageScrollProgress,
    [0, 0.5, 1],
    disableScrollTransforms ? [0, 0, 0] : [52, -6, -58]
  );
  const rightSubjectScale = useTransform(
    stageScrollProgress,
    [0, 0.42, 0.88],
    disableScrollTransforms ? [1, 1, 1] : [0.94, 1.05, 0.98]
  );
  const rightSubjectOpacity = useTransform(
    stageScrollProgress,
    [0, 0.16, 0.45, 0.78, 0.96],
    disableScrollTransforms
      ? [0.75, 0.75, 0.75, 0.75, 0.75]
      : [0.15, 0.86, 1, 0.82, 0.38]
  );

  // Layer 05: Central Kinetic Typography
  const kineticTitleY = useTransform(
    stageScrollProgress,
    [0, 0.35, 0.75, 1],
    disableScrollTransforms ? [0, 0, 0, 0] : [26, 0, -10, -18]
  );
  const kineticTitleScale = useTransform(
    stageScrollProgress,
    [0, 0.38, 0.78, 1],
    disableScrollTransforms ? [1, 1, 1, 1] : [0.96, 1.0, 0.985, 0.97]
  );

  // Layer 06: Signature Coastal Wave Brush Stroke
  const brushPathLength = useTransform(
    stageScrollProgress,
    [0.06, 0.42, 0.82],
    reducedMotion ? [1, 1, 1] : [0.05, 1, 1]
  );
  const brushOpacity = useTransform(
    stageScrollProgress,
    [0.05, 0.25, 0.65, 0.92],
    reducedMotion ? [0.85, 0.85, 0.85, 0.85] : [0, 0.95, 0.9, 0.42]
  );

  // Layer 07: Statistics Strip elevation
  const statsY = useTransform(
    stageScrollProgress,
    [0.08, 0.38, 0.85],
    disableScrollTransforms ? [0, 0, 0] : [20, 0, -8]
  );

  // ── V9.0 + V9.1 HORIZONTAL GALLERY & MULTI-LAYER CINEMATIC BACKGROUND TIMELINE ──
  const { scrollYProgress: rawPinProgress } = useScroll({
    target: pinContainerRef,
    offset: ["start start", "end end"],
  });

  // Also track entry into viewport (before pin starts) so 0–20% background & vector reveal begins smoothly
  const { scrollYProgress: entryScrollProgress } = useScroll({
    target: pinContainerRef,
    offset: ["start 88%", "end 15%"],
  });

  // Smooth scrub (~0.65s spring with high damping so reverse scroll is immediate and drift-free)
  const smoothHorizontalProgress = useSpring(rawPinProgress, {
    stiffness: 185,
    damping: 32,
    mass: 0.36,
    restDelta: 0.0005,
  });

  const activeProgressMotion = isPinnedHorizontal
    ? smoothHorizontalProgress
    : entryScrollProgress;

  // Layer 05: Horizontal destination track translation (0 -> -maxHorizontalShift)
  const trackTranslateX = useTransform(activeProgressMotion, (p) => {
    if (!isPinnedHorizontal || maxHorizontalShift <= 0) return 0;
    const clamped = Math.max(0, Math.min(1, p));
    return -clamped * maxHorizontalShift;
  });

  // V9.1 Layer 01: Cinematic Landscape Background Parallax (Sections 06 & 10)
  // - Moves horizontally at a slower speed than the cards (translateX: 0 -> -96px on desktop, 0 -> -32px on tablet)
  // - Subtle camera scale progression across the timeline (0–20%: 1.07->1.055, 20–80%: 1.055->1.035, 80–100%: settles at 1.03)
  const bgLandscapeX = useTransform(
    activeProgressMotion,
    [0, 0.2, 0.5, 0.8, 1],
    disableScrollTransforms
      ? [0, 0, 0, 0, 0]
      : isTablet
      ? [12, 4, -8, -20, -28]
      : [36, 12, -24, -62, -88]
  );
  const bgLandscapeScale = useTransform(
    activeProgressMotion,
    [0, 0.2, 0.5, 0.8, 1],
    disableScrollTransforms
      ? [1.02, 1.02, 1.02, 1.02, 1.02]
      : [1.075, 1.06, 1.045, 1.035, 1.03]
  );

  // V9.1 Layer 03: ORYZO Topographic Vector Lines independent motion & progressive stroke draw (Sections 06, 07, 10)
  // - Vector layer translates independently (20–60px range: +22px -> -36px)
  const bgVectorX = useTransform(
    activeProgressMotion,
    [0, 0.2, 0.5, 0.8, 1],
    disableScrollTransforms
      ? [0, 0, 0, 0, 0]
      : isTablet
      ? [8, 2, -6, -14, -20]
      : [22, 8, -10, -26, -36]
  );
  const bgVectorPrimaryDraw = useTransform(
    activeProgressMotion,
    [0, 0.2, 0.78, 1],
    reducedMotion ? [1, 1, 1, 1] : [0.18, 0.45, 0.94, 1]
  );
  const bgVectorSecondaryDraw = useTransform(
    activeProgressMotion,
    [0, 0.25, 0.85, 1],
    reducedMotion ? [1, 1, 1, 1] : [0.12, 0.38, 0.9, 1]
  );

  // Traveling Champagne Gold node along the main coastal S-curve (`M -60 310 C 280 140, 640 340, 1010 180 C 1220 90, 1370 175, 1520 270`)
  const bgNodeX = useTransform(
    activeProgressMotion,
    [0, 0.25, 0.5, 0.75, 1],
    disableScrollTransforms
      ? [720, 720, 720, 720, 720]
      : [180, 460, 740, 1020, 1290]
  );
  const bgNodeY = useTransform(
    activeProgressMotion,
    [0, 0.25, 0.5, 0.75, 1],
    disableScrollTransforms
      ? [225, 225, 225, 225, 225]
      : [232, 212, 238, 178, 162]
  );

  // V9.1 Layer 04: Cinematic Atmospheric Lighting drift (Sections 06, 08, 10)
  // - Golden sunrise/sunset light pool shifts gently across the horizon (30–100px range: -36px -> +56px)
  const atmosphericLightX = useTransform(
    activeProgressMotion,
    [0, 0.2, 0.5, 0.8, 1],
    disableScrollTransforms
      ? [0, 0, 0, 0, 0]
      : isTablet
      ? [-14, -4, 8, 20, 28]
      : [-36, -12, 16, 42, 56]
  );
  const atmosphericLightOpacity = useTransform(
    activeProgressMotion,
    [0, 0.2, 0.5, 0.8, 1],
    reducedMotion ? [0.75, 0.75, 0.75, 0.75, 0.75] : [0.55, 0.85, 0.95, 0.88, 0.78]
  );

  // Update active card index (0..totalCards-1) as horizontal progress changes
  useMotionValueEvent(activeProgressMotion, "change", (latest) => {
    if (!isPinnedHorizontal || totalCards <= 1) return;
    const clamped = Math.max(0, Math.min(1, latest));
    const idx = Math.min(
      totalCards - 1,
      Math.max(0, Math.round(clamped * (totalCards - 1)))
    );
    if (idx !== activeIndex) {
      setActiveIndex(idx);
    }
  });

  // Synchronized Previous / Next button handler (Section 16)
  const handleNavButton = useCallback(
    (direction: "prev" | "next") => {
      if (
        isPinnedHorizontal &&
        pinContainerRef.current &&
        typeof window !== "undefined"
      ) {
        const containerEl = pinContainerRef.current;
        const rect = containerEl.getBoundingClientRect();
        const containerTopDoc = window.scrollY + rect.top;
        const scrollableDistance = Math.max(
          1,
          containerEl.offsetHeight - window.innerHeight
        );
        const stepCount = Math.max(1, totalCards - 1);
        const currentProgress = Math.max(
          0,
          Math.min(1, (window.scrollY - containerTopDoc) / scrollableDistance)
        );
        const currentStep = Math.round(currentProgress * stepCount);
        const targetStep =
          direction === "next"
            ? Math.min(stepCount, currentStep + 1)
            : Math.max(0, currentStep - 1);
        const targetScrollY =
          containerTopDoc + (targetStep / stepCount) * scrollableDistance;

        window.scrollTo({
          top: targetScrollY,
          behavior: "smooth",
        });
        return;
      }

      onScrollGallery(direction);
    },
    [isPinnedHorizontal, totalCards, onScrollGallery]
  );

  return (
    <div
      ref={sectionRef}
      className="relative w-full bg-[#F8F8F4]"
    >
      {/* ── UPPER STAGE BACKGROUND: Atmospheric Ivory Base + Topographic Coastal Contour Lines ── */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[780px] overflow-hidden z-0 select-none">
        <motion.div
          aria-hidden="true"
          style={{ y: contourY, opacity: contourOpacity }}
          className="w-full h-full"
        >
          <img
            src="/images/cinematic/textures/coastal-contours-v7.svg"
            alt=""
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover opacity-90"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 62% 54% at 50% 36%, rgba(248,248,244,0.92) 0%, rgba(248,248,244,0.55) 58%, rgba(248,248,244,0.15) 100%)",
            }}
          />
        </motion.div>
      </div>

      {/* ── UPPER DISCOVERY STAGE (Lando Norris Dual Cutouts & Open-Air Stats — Preserved 100%) ── */}
      <div
        ref={stageRef}
        className="relative z-10 pt-10 sm:pt-14 lg:pt-16 pb-8 lg:pb-12 overflow-hidden"
      >
        {/* Left Landmark Subject Cutout (Golden Bridge Weathered Stone Hands) */}
        <motion.div
          aria-hidden="true"
          style={{
            x: leftSubjectX,
            y: leftSubjectY,
            scale: leftSubjectScale,
            opacity: leftSubjectOpacity,
          }}
          className="pointer-events-none hidden md:block absolute top-8 lg:top-10 -left-16 lg:-left-10 xl:-left-4 w-[250px] lg:w-[350px] xl:w-[420px] h-[390px] lg:h-[490px] xl:h-[540px] z-10 select-none"
        >
          <div
            className="relative w-full h-full overflow-hidden rounded-r-[8px]"
            style={{
              WebkitMaskImage:
                "radial-gradient(ellipse 92% 88% at 24% 48%, #000 48%, rgba(0,0,0,0.65) 72%, transparent 98%)",
              maskImage:
                "radial-gradient(ellipse 92% 88% at 24% 48%, #000 48%, rgba(0,0,0,0.65) 72%, transparent 98%)",
            }}
          >
            <Image
              src="/images/cinematic/discovery/golden-bridge-cutout.jpg"
              alt=""
              fill
              sizes="(max-width: 1280px) 340px, 420px"
              className="object-cover object-left"
            />
          </div>
          <div className="hidden xl:flex items-center gap-2 mt-2 pl-12 text-[10px] font-mono uppercase tracking-[0.2em] text-[#4E5E63]/75">
            <span className="w-4 h-[1px] bg-[#C9B580]" />
            <span>15°59&apos;N · BA NA GOLDEN HANDS</span>
          </div>
        </motion.div>

        {/* Right Landmark Subject Cutout (Son Tra Peninsula & Linh Ung Sanctuary) */}
        <motion.div
          aria-hidden="true"
          style={{
            x: rightSubjectX,
            y: rightSubjectY,
            scale: rightSubjectScale,
            opacity: rightSubjectOpacity,
          }}
          className="pointer-events-none hidden md:block absolute top-10 lg:top-12 -right-16 lg:-right-10 xl:-right-4 w-[250px] lg:w-[350px] xl:w-[420px] h-[390px] lg:h-[490px] xl:h-[540px] z-10 select-none"
        >
          <div
            className="relative w-full h-full overflow-hidden rounded-l-[8px]"
            style={{
              WebkitMaskImage:
                "radial-gradient(ellipse 92% 88% at 76% 48%, #000 48%, rgba(0,0,0,0.65) 72%, transparent 98%)",
              maskImage:
                "radial-gradient(ellipse 92% 88% at 76% 48%, #000 48%, rgba(0,0,0,0.65) 72%, transparent 98%)",
            }}
          >
            <Image
              src="/images/cinematic/discovery/sontra-sanctuary-cutout.jpg"
              alt=""
              fill
              sizes="(max-width: 1280px) 340px, 420px"
              className="object-cover object-right"
            />
          </div>
          <div className="hidden xl:flex items-center justify-end gap-2 mt-2 pr-12 text-[10px] font-mono uppercase tracking-[0.2em] text-[#4E5E63]/75">
            <span>16°06&apos;N · SON TRA SANCTUARY</span>
            <span className="w-4 h-[1px] bg-[#C9B580]" />
          </div>
        </motion.div>

        {/* Central Kinetic Typography & Signature Brush Wave */}
        <div className="home-container relative z-20">
          <motion.div
            style={{ y: kineticTitleY, scale: kineticTitleScale }}
            className="max-w-3xl mx-auto text-center px-2 sm:px-6"
          >
            <div className="inline-flex items-center justify-center gap-3 mb-4 sm:mb-5">
              <span className="w-7 h-[1px] bg-[#E87B39]" aria-hidden="true" />
              <span className="home-eyebrow text-[#216B70]">
                Cập nhật 24h qua
              </span>
              <span className="w-7 h-[1px] bg-[#E87B39]" aria-hidden="true" />
            </div>

            <h2
              id="popular-discovery-heading"
              className="relative flex flex-col items-center justify-center text-[#102832] select-none"
            >
              <span className="block overflow-hidden py-1">
                <motion.span
                  initial={{ y: reducedMotion ? "0%" : "82%", opacity: 0 }}
                  whileInView={{ y: "0%", opacity: 1 }}
                  viewport={{ once: true, margin: "40px 0px -20px 0px" }}
                  transition={{
                    duration: 0.85,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="block home-serif italic font-normal text-[#216B70] text-[clamp(1.75rem,3.4vw,3.15rem)] leading-[1.22] tracking-[-0.01em]"
                >
                  Được xem
                </motion.span>
              </span>

              <span className="relative inline-block py-1 px-3">
                <span className="block overflow-hidden pt-[0.26em] -mt-[0.18em] pb-[0.1em]">
                  <motion.span
                    initial={{ y: reducedMotion ? "0%" : "82%", opacity: 0 }}
                    whileInView={{ y: "0%", opacity: 1 }}
                    viewport={{ once: true, margin: "40px 0px -20px 0px" }}
                    transition={{
                      duration: 0.9,
                      delay: 0.08,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="block cinematic-condensed font-bold uppercase text-[#102832] text-shimmer-light is-shimmering text-[clamp(2.5rem,5.6vw,5.1rem)] leading-[1.16] tracking-[-0.015em]"
                  >
                    NHIỀU NHẤT
                  </motion.span>
                </span>

                <motion.svg
                  aria-hidden="true"
                  viewBox="0 0 420 34"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ opacity: brushOpacity }}
                  className="pointer-events-none absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-[92%] sm:w-[102%] h-6 sm:h-7 overflow-visible"
                >
                  <defs>
                    <linearGradient
                      id="danangWaveBrushGrad"
                      x1="0%"
                      y1="50%"
                      x2="100%"
                      y2="50%"
                    >
                      <stop offset="0%" stopColor="#216B70" stopOpacity="0.85" />
                      <stop offset="52%" stopColor="#E87B39" stopOpacity="0.95" />
                      <stop offset="100%" stopColor="#C9B580" stopOpacity="0.85" />
                    </linearGradient>
                  </defs>
                  <motion.path
                    d="M8 23 C95 8, 178 29, 268 15 C325 6, 374 19, 412 11"
                    stroke="url(#danangWaveBrushGrad)"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    style={{ pathLength: brushPathLength }}
                  />
                  <motion.path
                    d="M36 28 C124 18, 218 31, 356 20"
                    stroke="#C9B580"
                    strokeWidth="1.25"
                    strokeLinecap="round"
                    strokeOpacity="0.65"
                    style={{ pathLength: brushPathLength }}
                  />
                </motion.svg>
              </span>

              <span className="block overflow-hidden pt-3 pb-1">
                <motion.span
                  initial={{ y: reducedMotion ? "0%" : "82%", opacity: 0 }}
                  whileInView={{ y: "0%", opacity: 1 }}
                  viewport={{ once: true, margin: "40px 0px -20px 0px" }}
                  transition={{
                    duration: 0.88,
                    delay: 0.16,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="inline-flex items-center gap-3 text-[clamp(1.35rem,2.4vw,2.15rem)] leading-[1.24] tracking-[0.18em] uppercase font-semibold text-[#202B30]"
                >
                  <span className="hidden sm:inline-block w-8 h-[1px] bg-[#C9B580]" />
                  <span>TUẦN QUA</span>
                  <span className="hidden sm:inline-block w-8 h-[1px] bg-[#C9B580]" />
                </motion.span>
              </span>
            </h2>
          </motion.div>

          {/* Open-Air Editorial Expedition Milestones */}
          <motion.div
            style={{ y: statsY }}
            className="mt-10 sm:mt-14 max-w-3xl mx-auto"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4 sm:gap-x-8 items-start">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: reducedMotion ? 0 : 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "20px 0px -20px 0px" }}
                  transition={{
                    duration: 0.65,
                    delay: reducedMotion ? 0 : i * 0.09,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="group relative flex flex-col items-center justify-center text-center px-2"
                >
                  <div
                    aria-hidden="true"
                    className="flex items-center gap-1.5 mb-2"
                  >
                    <span className="w-3 h-[1px] bg-[#C9B580]/70 group-hover:w-5 transition-all duration-300" />
                    <span className="text-[10px] font-mono tracking-[0.22em] text-[#4E5E63]/75 group-hover:text-[#216B70] transition-colors">
                      {stat.coord}
                    </span>
                    <span className="w-3 h-[1px] bg-[#C9B580]/70 group-hover:w-5 transition-all duration-300" />
                  </div>

                  <div className="home-serif italic font-semibold text-[clamp(2.1rem,3.6vw,3.25rem)] leading-none tracking-[-0.02em] text-[#216B70] text-shimmer-light">
                    <AnimatedCounter
                      to={stat.to}
                      suffix={stat.suffix}
                      className="home-serif italic font-semibold"
                    />
                  </div>

                  <p className="mt-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#4E5E63]">
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Optional Survey Invite Card */}
          {surveyNode && <div className="mt-10">{surveyNode}</div>}
        </div>
      </div>

      {/* ── V9.1 HORIZONTAL EXHIBITION GALLERY WITH 6-LAYER CINEMATIC DYNAMIC BACKGROUND ── */}
      <HorizontalGalleryContext.Provider
        value={{
          progressMotion: activeProgressMotion,
          activeIndex,
          totalCards,
          isPinnedHorizontal,
        }}
      >
        <div
          ref={pinContainerRef}
          className="relative z-20"
          style={{
            height: isPinnedHorizontal
              ? `calc(100vh + ${Math.round(maxHorizontalShift * 1.15)}px)`
              : "auto",
          }}
        >
          <section
            id="popular"
            aria-labelledby="popular-discovery-heading"
            className={
              isPinnedHorizontal
                ? "sticky top-[68px] min-h-[calc(100vh-68px)] flex flex-col justify-center py-8 lg:py-10 overflow-hidden bg-[#102832]"
                : "relative py-12 sm:py-16 lg:py-20 overflow-hidden bg-[#102832]"
            }
          >
            {/* ── LAYER 01: Full-Bleed Cinematic Landscape (Son Tra Peninsula & Da Nang Turquoise Coastline) ── */}
            <div
              aria-hidden="true"
              className="pointer-events-none select-none absolute inset-0 overflow-hidden z-0"
            >
              <motion.div
                style={{
                  x: bgLandscapeX,
                  scale: bgLandscapeScale,
                }}
                className="relative -left-[7%] w-[114%] h-full will-change-transform"
              >
                <Image
                  src="/images/cinematic/hero/hero-sontra-mist.jpg"
                  alt=""
                  fill
                  quality={90}
                  sizes="100vw"
                  className="object-cover object-center"
                />
              </motion.div>
            </div>

            {/* ── LAYER 02: Directional Deep Ocean & Teal Contrast Overlay + Top/Bottom Seamless Transitions ── */}
            <div
              aria-hidden="true"
              className="pointer-events-none select-none absolute inset-0 z-1"
            >
              {/* Primary directional coastal depth wash so warm-ivory cards pop with crisp contrast */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(16,40,50,0.48) 0%, rgba(16,40,50,0.34) 38%, rgba(16,40,50,0.52) 76%, rgba(16,40,50,0.68) 100%)",
                }}
              />
              {/* Left-to-right oceanic gradient reinforcing the horizontal storytelling axis */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(16,40,50,0.52) 0%, rgba(33,107,112,0.18) 45%, rgba(16,40,50,0.45) 100%)",
                }}
              />
              {/* Seamless upper transition feathering from the ivory Lando Norris stage (#F8F8F4) */}
              <div
                className="absolute inset-x-0 top-0 h-14 sm:h-16"
                style={{
                  background:
                    "linear-gradient(180deg, #F8F8F4 0%, rgba(248,248,244,0.62) 45%, rgba(248,248,244,0) 100%)",
                }}
              />
              {/* Seamless lower transition feathering into the OryzoVectorBridge (#F8F8F4) */}
              <div
                className="absolute inset-x-0 bottom-0 h-12 sm:h-14"
                style={{
                  background:
                    "linear-gradient(0deg, #F8F8F4 0%, rgba(248,248,244,0.48) 42%, rgba(248,248,244,0) 100%)",
                }}
              />
            </div>

            {/* ── LAYER 04: Cinematic Atmospheric Sunrise / Sunset & Champagne Lighting (Sections 05, 06, 08) ── */}
            <motion.div
              aria-hidden="true"
              style={{
                x: atmosphericLightX,
                opacity: atmosphericLightOpacity,
              }}
              className="pointer-events-none select-none absolute inset-0 z-2 will-change-transform"
            >
              {/* Warm Golden Sunrise / Sunset reflection over the Son Tra mountain ridge */}
              <div
                className="absolute -top-12 left-[14%] w-[62%] h-[340px] rounded-full"
                style={{
                  background:
                    "radial-gradient(ellipse at 50% 38%, rgba(232,123,57,0.22) 0%, rgba(201,181,128,0.16) 44%, transparent 76%)",
                }}
              />
              {/* Subtle Champagne Gold & Pearl White coastal horizon shimmer */}
              <div
                className="absolute bottom-8 right-[8%] w-[54%] h-[280px] rounded-full"
                style={{
                  background:
                    "radial-gradient(ellipse at 55% 50%, rgba(201,181,128,0.20) 0%, rgba(33,107,112,0.15) 52%, transparent 78%)",
                }}
              />
            </motion.div>

            {/* ── LAYER 03: ORYZO Topographic Vector Lines & Traveling Champagne Light Node (Sections 05, 06, 07) ── */}
            <motion.svg
              aria-hidden="true"
              viewBox="0 0 1440 460"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="none"
              style={{ x: bgVectorX }}
              className="pointer-events-none select-none absolute -inset-x-24 inset-y-0 w-[calc(100%+12rem)] h-full z-3 opacity-85 will-change-transform"
            >
              <defs>
                <linearGradient
                  id="oryzoV91PrimaryPath"
                  x1="0%"
                  y1="20%"
                  x2="100%"
                  y2="80%"
                >
                  <stop offset="0%" stopColor="#FFFDF5" stopOpacity="0.12" />
                  <stop offset="32%" stopColor="#C9B580" stopOpacity="0.62" />
                  <stop offset="68%" stopColor="#E87B39" stopOpacity="0.58" />
                  <stop offset="100%" stopColor="#FFFDF5" stopOpacity="0.16" />
                </linearGradient>
                <linearGradient
                  id="oryzoV91ContourPath"
                  x1="0%"
                  y1="50%"
                  x2="100%"
                  y2="50%"
                >
                  <stop offset="0%" stopColor="#C9B580" stopOpacity="0.08" />
                  <stop offset="50%" stopColor="#FFFDF5" stopOpacity="0.38" />
                  <stop offset="100%" stopColor="#C9B580" stopOpacity="0.10" />
                </linearGradient>
                <radialGradient
                  id="oryzoV91NodeGlow"
                  cx="50%"
                  cy="50%"
                  r="50%"
                >
                  <stop offset="0%" stopColor="#FFFDF5" stopOpacity="1" />
                  <stop offset="34%" stopColor="#E87B39" stopOpacity="0.88" />
                  <stop offset="68%" stopColor="#C9B580" stopOpacity="0.38" />
                  <stop offset="100%" stopColor="#C9B580" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Delicate celestial sun-orbit ring over the right coastline */}
              <circle
                cx="1140"
                cy="210"
                r="260"
                stroke="#C9B580"
                strokeWidth="0.85"
                strokeOpacity="0.32"
              />
              <circle
                cx="1140"
                cy="210"
                r="195"
                stroke="#FFFDF5"
                strokeWidth="0.65"
                strokeDasharray="3 7"
                strokeOpacity="0.24"
              />

              {/* Secondary topographic elevation contour curve */}
              <motion.path
                d="M -60 125 C 340 275, 790 75, 1500 235"
                stroke="url(#oryzoV91ContourPath)"
                strokeWidth="0.95"
                strokeDasharray="5 9"
                strokeLinecap="round"
                style={{ pathLength: bgVectorSecondaryDraw }}
              />

              {/* Lower coastal wave harmonic thread */}
              <motion.path
                d="M -40 370 C 380 290, 860 420, 1490 315"
                stroke="#C9B580"
                strokeWidth="0.75"
                strokeOpacity="0.3"
                style={{ pathLength: bgVectorSecondaryDraw }}
              />

              {/* Primary scroll-drawn ORYZO expedition trajectory S-curve */}
              <motion.path
                d="M -60 310 C 280 140, 640 340, 1010 180 C 1220 90, 1370 175, 1520 270"
                stroke="url(#oryzoV91PrimaryPath)"
                strokeWidth="1.45"
                strokeLinecap="round"
                style={{ pathLength: bgVectorPrimaryDraw }}
              />

              {/* Luminous Champagne Gold pinpoint gliding along the expedition trajectory */}
              <motion.g style={{ x: bgNodeX, y: bgNodeY }}>
                <circle
                  cx="0"
                  cy="0"
                  r="18"
                  fill="url(#oryzoV91NodeGlow)"
                />
                <circle
                  cx="0"
                  cy="0"
                  r="5.5"
                  stroke="#E87B39"
                  strokeWidth="0.9"
                  strokeOpacity="0.75"
                />
                <circle cx="0" cy="0" r="3" fill="#FFFDF5" />
              </motion.g>
            </motion.svg>

            {/* ── LAYER 05 & 06: Gallery Header Bar, Horizontal Destination Cards & Interactive Effects ── */}
            <div className="home-container relative z-10 w-full pt-4">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-[0.2em] text-[#FFFDF5]/90 drop-shadow-[0_1px_6px_rgba(16,40,50,0.55)]">
                  <span className="w-2 h-2 rounded-full bg-[#E87B39] shadow-[0_0_10px_rgba(232,123,57,0.8)]" />
                  <span>
                    DANANG CURATED EXHIBITION // 0{activeIndex + 1} — 0
                    {totalCards}
                  </span>
                </div>

                <div className="flex items-center gap-4 sm:gap-5 ml-auto">
                  <Link
                    href="/khampha"
                    className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#FFFDF5] hover:text-[#E6D9B7] border-b border-[#E6D9B7]/55 hover:border-[#E6D9B7] pb-1 shrink-0 group active:scale-[0.98] transition-colors drop-shadow-[0_1px_6px_rgba(16,40,50,0.55)]"
                  >
                    <span>Xem tất cả 120+ địa điểm</span>
                    <span
                      aria-hidden="true"
                      className="transition-transform duration-250 group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </Link>
                </div>
              </div>

              {/* Subtle Champagne Gold architectural hairline above the gallery track */}
              <div
                aria-hidden="true"
                className="w-full h-[1px] bg-gradient-to-r from-[#E6D9B7]/45 via-[#FFFDF5]/35 to-[#E6D9B7]/15 mb-6 lg:mb-8"
              />
            </div>

            {/* Horizontal Exhibition Gallery Viewport */}
            <div
              ref={viewportRef}
              className="relative z-10 w-full overflow-visible"
            >
              {isPinnedHorizontal ? (
                <div className="w-full overflow-hidden">
                  <motion.div
                    ref={trackRef}
                    style={{ x: trackTranslateX }}
                    className="flex items-stretch gap-7 xl:gap-8 w-max pl-[max(1.25rem,calc((100vw-1280px)/2+2rem))] pr-[max(3rem,calc((100vw-1280px)/2+4rem))] py-3 will-change-transform"
                  >
                    {children}
                  </motion.div>
                </div>
              ) : (
                /* Mobile / Tablet / Reduced-Motion: Native Horizontal Swipe Gallery with CSS scroll-snap */
                <div
                  ref={(node) => {
                    trackRef.current = node;
                    if (galleryRef) {
                      (
                        galleryRef as React.MutableRefObject<HTMLDivElement | null>
                      ).current = node;
                    }
                  }}
                  className="flex items-stretch gap-5 sm:gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 px-5 sm:px-8"
                >
                  {children}
                </div>
              )}
            </div>

            {/* Minimal 2.5px Scroll Progress Indicator at the bottom of the gallery */}
            <div className="home-container relative z-10 w-full mt-6 lg:mt-8 pb-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 h-[2.5px] bg-[#FFFDF5]/25 rounded-full overflow-hidden">
                  <motion.div
                    style={{
                      scaleX: isPinnedHorizontal ? activeProgressMotion : 1,
                    }}
                    className="h-full w-full origin-left bg-gradient-to-r from-[#216B70] via-[#C9B580] to-[#E87B39]"
                  />
                </div>
                <span
                  aria-hidden="true"
                  className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#FFFDF5]/90 drop-shadow-[0_1px_4px_rgba(16,40,50,0.6)] shrink-0"
                >
                  SON TRA COASTAL EXPEDITION · 0{activeIndex + 1}/0{totalCards}
                </span>
              </div>
            </div>
          </section>
        </div>
      </HorizontalGalleryContext.Provider>
    </div>
  );
}
