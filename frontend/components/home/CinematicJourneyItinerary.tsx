"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useInView,
  useScroll,
  useSpring,
  useTransform,
  useMotionValueEvent,
} from "framer-motion";

// ============================================================
// DANANGGO V14.2 — THE CINEMATIC JOURNEY OF DISCOVERY
// World-Class Interactive Travel Journal × Scroll-driven Storytelling
// Strictly scoped to #lichtrinhgoiY ("LỊCH TRÌNH GỢI Ý & CẢM HỨNG KHÁM PHÁ")
// ============================================================

export interface ItineraryActivityItem {
  readonly time: string;
  readonly activity: string;
}

export interface ItineraryDayPlan {
  readonly day: string;
  readonly theme: string;
  readonly items: readonly ItineraryActivityItem[];
  readonly duration: string;
  readonly spots: number;
}

export interface ItineraryPlanGroup {
  readonly label: string;
  readonly days: readonly ItineraryDayPlan[];
}

export type ItineraryPlansMap<K extends string = string> = Record<
  K,
  ItineraryPlanGroup
>;

interface CinematicJourneyItineraryProps<K extends string> {
  plans: ItineraryPlansMap<K>;
  selectedPlan: K;
  onSelectPlan: (planKey: K) => void;
}

interface VisualStoryAsset {
  src: string;
  caption: string;
  coordinates: string;
}

const DEFAULT_DAY_VISUALS: readonly VisualStoryAsset[] = [
  {
    src: "/images/itinerary/days/journey-day1-coastal.jpg",
    caption: "MY KHE COASTLINE & DRAGON BRIDGE",
    coordinates: "16°03'16\"N · 108°14'50\"E",
  },
  {
    src: "/images/itinerary/days/journey-day2-mountain.jpg",
    caption: "BA NA HILLS & GOLDEN BRIDGE PEAK",
    coordinates: "15°59'42\"N · 107°59'48\"E",
  },
  {
    src: "/images/itinerary/days/journey-day3-heritage.jpg",
    caption: "HOI AN ANCIENT LANTERN PORT",
    coordinates: "15°52'48\"N · 108°19'40\"E",
  },
];

/**
 * Resolves the representative editorial photograph for an activity hover/focus
 * so that hovering each timeline row smoothly crossfades the Day Card photo.
 */
function resolveActivityVisual(
  activityText: string,
  dayIndex: number
): VisualStoryAsset {
  const lower = activityText.toLowerCase();

  if (lower.includes("cà phê") || lower.includes("mỹ khê")) {
    if (lower.includes("thư giãn")) {
      return {
        src: "/images/intro/landscape/intro-coastal-panorama.jpg",
        caption: "BÃI BIỂN MỸ KHÊ · GOLDEN HORIZON",
        coordinates: "16°03'16\"N · 108°14'50\"E",
      };
    }
    return {
      src: "/images/itinerary/days/journey-day1-coastal.jpg",
      caption: "CÀ PHÊ SÁNG VEN BIỂN MỸ KHÊ",
      coordinates: "16°03'28\"N · 108°14'44\"E",
    };
  }

  if (
    lower.includes("sơn trà") ||
    lower.includes("linh ứng") ||
    lower.includes("bảo tàng") ||
    lower.includes("chăm")
  ) {
    return {
      src: "/images/cinematic/hero/hero-sontra-mist.jpg",
      caption: "BÁN ĐẢO SƠN TRÀ & DI SẢN ĐÀ NẴNG",
      coordinates: "16°06'02\"N · 108°16'40\"E",
    };
  }

  if (
    lower.includes("mì quảng") ||
    lower.includes("bún mắm") ||
    lower.includes("cơm gà") ||
    lower.includes("buffet") ||
    lower.includes("chợ hàn")
  ) {
    return {
      src: "/images/categories/category-culinary-miquang.jpg",
      caption: "TINH HOA ẨM THỰC BẢN ĐỊA",
      coordinates: "16°04'10\"N · 108°13'25\"E",
    };
  }

  if (lower.includes("cầu rồng") || lower.includes("tình yêu")) {
    return {
      src: "/images/partner/danang-dragon-bridge-night.jpg",
      caption: "CẦU RỒNG & SÔNG HÀN RỰC RỠ",
      coordinates: "16°03'40\"N · 108°13'38\"E",
    };
  }

  if (lower.includes("cầu vàng")) {
    return {
      src: "/images/categories/category-discovery-golden-bridge.jpg",
      caption: "CẦU VÀNG BÀ NÀ · TUYỆT TÁC TRÊN MÂY",
      coordinates: "15°59'42\"N · 107°59'48\"E",
    };
  }

  if (
    lower.includes("bà nà") ||
    lower.includes("cáp treo") ||
    lower.includes("phố pháp") ||
    lower.includes("wax") ||
    lower.includes("xuống núi")
  ) {
    return {
      src: "/images/itinerary/days/journey-day2-mountain.jpg",
      caption: "BÀ NÀ HILLS · ĐỈNH NÚI SƯƠNG MỜ",
      coordinates: "15°59'50\"N · 107°59'18\"E",
    };
  }

  if (
    lower.includes("đèn lồng") ||
    lower.includes("hoa đăng") ||
    lower.includes("nguyễn hoàng")
  ) {
    return {
      src: "/hero/pho-co-hoi-an-hd.jpg",
      caption: "ĐÊM ĐÈN LỒNG & HOA ĐĂNG SÔNG HOÀI",
      coordinates: "15°52'37\"N · 108°19'34\"E",
    };
  }

  if (
    lower.includes("hội an") ||
    lower.includes("làng nghề") ||
    lower.includes("sân bay")
  ) {
    return {
      src: "/images/itinerary/days/journey-day3-heritage.jpg",
      caption: "THƯƠNG CẢNG DI SẢN HỘI AN",
      coordinates: "15°52'48\"N · 108°19'40\"E",
    };
  }

  return (
    DEFAULT_DAY_VISUALS[dayIndex % DEFAULT_DAY_VISUALS.length] ??
    DEFAULT_DAY_VISUALS[0]
  );
}

/**
 * Computes scroll-driven directional entry vector for each day card
 * based on index and total day count (Section 15 & Section 25).
 */
function getCardDirectionalOffset(index: number, totalDays: number) {
  if (totalDays <= 1) {
    return { x: 0, y: 45 };
  }
  const middle = (totalDays - 1) / 2;
  const normalized = (index - middle) / Math.max(middle, 1); // -1 (left) -> 0 (center) -> +1 (right)
  const x = Math.round(normalized * 45);
  const y = Math.abs(normalized) < 0.25 ? 50 : 45;
  return { x, y };
}

// ============================================================
// SUB-COMPONENT: GoldenJourneyConnectionSvg (Layer 05 — Section 10)
// Connects Day 01 -> Day 02 -> Day 03 with exact getTotalLength()
// & getPointAtLength() traveling sun pinpoint driven by scroll
// ============================================================

function GoldenJourneyConnectionSvg({
  scrollProgress,
  dayCount,
  reducedMotion,
}: {
  scrollProgress: ReturnType<typeof useSpring>;
  dayCount: number;
  reducedMotion: boolean;
}) {
  const pathRef = useRef<SVGPathElement | null>(null);
  const mobilePathRef = useRef<SVGPathElement | null>(null);
  const gradientId = useId();
  const glowFilterId = useId();

  const [pathLength, setPathLength] = useState(1450);
  const [dashOffset, setDashOffset] = useState(0);
  const [pinpoint, setPinpoint] = useState<{ x: number; y: number }>({
    x: 200,
    y: 250,
  });

  const [mobileLength, setMobileLength] = useState(900);
  const [mobileOffset, setMobileOffset] = useState(0);
  const [mobilePinpoint, setMobilePinpoint] = useState<{
    x: number;
    y: number;
  }>({ x: 36, y: 120 });

  // Adapt cubic Bézier path dynamically to the number of stages
  const desktopPathD = useMemo(() => {
    if (dayCount === 4) {
      return "M 90 280 C 260 150, 390 150, 510 245 C 640 340, 770 340, 910 245 C 1040 150, 1180 175, 1350 250";
    }
    return "M 130 285 C 340 145, 540 150, 720 250 C 900 350, 1100 345, 1310 215";
  }, [dayCount]);

  // Anchor nodes along the journey curve
  const desktopStageNodes = useMemo(() => {
    if (dayCount === 4) {
      return [
        { cx: 180, cy: 230, label: "STAGE 01" },
        { cx: 510, cy: 245, label: "STAGE 02" },
        { cx: 910, cy: 245, label: "STAGE 03" },
        { cx: 1260, cy: 225, label: "STAGE 04" },
      ];
    }
    return [
      { cx: 230, cy: 225, label: "STAGE 01 · MY KHE" },
      { cx: 720, cy: 250, label: "STAGE 02 · BA NA" },
      { cx: 1210, cy: 265, label: "STAGE 03 · HOI AN" },
    ];
  }, [dayCount]);

  useEffect(() => {
    if (pathRef.current) {
      try {
        const len = pathRef.current.getTotalLength();
        if (len > 0) {
          setPathLength(len);
          const initialRatio = reducedMotion ? 1 : 0.35;
          setDashOffset(len * (1 - initialRatio));
          const pt = pathRef.current.getPointAtLength(len * initialRatio);
          setPinpoint({ x: pt.x, y: pt.y });
        }
      } catch {
        // Fallback when SVG is hidden in test/SSR environment
      }
    }
    if (mobilePathRef.current) {
      try {
        const mLen = mobilePathRef.current.getTotalLength();
        if (mLen > 0) {
          setMobileLength(mLen);
          const initialRatio = reducedMotion ? 1 : 0.35;
          setMobileOffset(mLen * (1 - initialRatio));
          const mPt = mobilePathRef.current.getPointAtLength(
            mLen * initialRatio
          );
          setMobilePinpoint({ x: mPt.x, y: mPt.y });
        }
      } catch {
        // Ignore in SSR
      }
    }
  }, [desktopPathD, reducedMotion]);

  useMotionValueEvent(scrollProgress, "change", (latest) => {
    if (reducedMotion) return;
    // Normalize scroll progress [0.08 .. 0.78] -> [0.08 .. 1.0]
    const clamped = Math.max(0.08, Math.min(1, (latest - 0.06) / 0.72));

    if (pathRef.current && pathLength > 0) {
      setDashOffset(pathLength * (1 - clamped));
      try {
        const pt = pathRef.current.getPointAtLength(pathLength * clamped);
        setPinpoint({ x: pt.x, y: pt.y });
      } catch {
        // Ignore
      }
    }

    if (mobilePathRef.current && mobileLength > 0) {
      setMobileOffset(mobileLength * (1 - clamped));
      try {
        const mPt = mobilePathRef.current.getPointAtLength(
          mobileLength * clamped
        );
        setMobilePinpoint({ x: mPt.x, y: mPt.y });
      } catch {
        // Ignore
      }
    }
  });

  return (
    <>
      {/* Desktop Horizontal Golden Journey Connection */}
      <div
        className="pointer-events-none hidden md:block absolute inset-x-0 top-[72px] bottom-[60px] z-[1] overflow-visible"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 1440 500"
          fill="none"
          preserveAspectRatio="none"
          className="w-full h-full overflow-visible"
        >
          <defs>
            <linearGradient
              id={gradientId}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#216B70" stopOpacity="0.45" />
              <stop offset="48%" stopColor="#C9AB78" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#E87B39" stopOpacity="0.88" />
            </linearGradient>
            <filter
              id={glowFilterId}
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Base Cartographic Dotted Guide Curve */}
          <path
            d={desktopPathD}
            stroke="#C9AB78"
            strokeOpacity="0.28"
            strokeWidth="1.25"
            strokeDasharray="5 8"
            fill="none"
          />

          {/* Soft Golden Halo Curve */}
          <path
            d={desktopPathD}
            stroke="#C9AB78"
            strokeOpacity="0.18"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
            style={{
              strokeDasharray: pathLength,
              strokeDashoffset: dashOffset,
            }}
          />

          {/* Main Animated Golden Journey Connection Path */}
          <path
            ref={pathRef}
            d={desktopPathD}
            stroke={`url(#${gradientId})`}
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
            style={{
              strokeDasharray: pathLength,
              strokeDashoffset: dashOffset,
            }}
          />

          {/* Stage Waypoint Rings along the curve */}
          {desktopStageNodes.map((node, i) => (
            <g key={i}>
              <circle
                cx={node.cx}
                cy={node.cy}
                r="11"
                stroke="#C9AB78"
                strokeOpacity="0.35"
                strokeWidth="1"
                strokeDasharray="2 3"
                fill="#FFFDF6"
                fillOpacity="0.7"
              />
              <circle
                cx={node.cx}
                cy={node.cy}
                r="3.5"
                fill="#C9AB78"
              />
            </g>
          ))}

          {/* Traveling Golden Sun Pinpoint synchronized with getPointAtLength() */}
          <g
            transform={`translate(${pinpoint.x}, ${pinpoint.y})`}
            filter={`url(#${glowFilterId})`}
          >
            <circle
              r="14"
              fill="#E87B39"
              fillOpacity="0.18"
            />
            <circle
              r="7.5"
              stroke="#C9AB78"
              strokeWidth="1.2"
              fill="#FFFDF6"
            />
            <circle r="3.5" fill="#E87B39" />
          </g>
        </svg>
      </div>

      {/* Mobile Vertical Golden Journey Connection */}
      <div
        className="pointer-events-none md:hidden absolute left-4 top-6 bottom-6 w-12 z-[1]"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 72 1000"
          fill="none"
          preserveAspectRatio="none"
          className="w-full h-full overflow-visible"
        >
          <path
            d="M 36 20 C 16 260, 56 520, 36 980"
            stroke="#C9AB78"
            strokeOpacity="0.26"
            strokeWidth="1.2"
            strokeDasharray="4 7"
            fill="none"
          />
          <path
            ref={mobilePathRef}
            d="M 36 20 C 16 260, 56 520, 36 980"
            stroke="#C9AB78"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            style={{
              strokeDasharray: mobileLength,
              strokeDashoffset: mobileOffset,
            }}
          />
          <g transform={`translate(${mobilePinpoint.x}, ${mobilePinpoint.y})`}>
            <circle r="10" fill="#E87B39" fillOpacity="0.2" />
            <circle r="5" fill="#FFFDF6" stroke="#C9AB78" strokeWidth="1.2" />
            <circle r="2.5" fill="#E87B39" />
          </g>
        </svg>
      </div>
    </>
  );
}

// ============================================================
// SUB-COMPONENT: TravelJournalDayCard (Sections 15–24)
// Separated wrappers:
// 1. Outer Scroll & Directional Parallax Wrapper
// 2. Hover Elevation & 1px Champagne Border Sweep Wrapper
// 3. Header Photograph Mask & Activity Dynamic Photo Crossfade
// 4. Progressive Vertical Timeline Draw & Pinpoint
// ============================================================

function TravelJournalDayCard({
  dayData,
  dayIndex,
  totalDays,
  scrollProgress,
  reducedMotion,
}: {
  dayData: ItineraryDayPlan;
  dayIndex: number;
  totalDays: number;
  scrollProgress: ReturnType<typeof useSpring>;
  reducedMotion: boolean;
}) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const isCardInView = useInView(cardRef, {
    once: false,
    margin: "-8% 0px -8% 0px",
  });
  const hasEnteredOnce = useInView(cardRef, {
    once: true,
    margin: "-5% 0px -5% 0px",
  });

  // Track hovered/focused activity index for dynamic photography transition (Section 18 & 21)
  const [activeActivityIdx, setActiveActivityIdx] = useState<number | null>(
    null
  );

  // Sequential timeline illumination state as card enters view (Section 17)
  const [timelineProgress, setTimelineProgress] = useState<number>(
    reducedMotion ? 1 : 0
  );

  useEffect(() => {
    if (reducedMotion) {
      setTimelineProgress(1);
      return;
    }
    if (!isCardInView) {
      return;
    }
    let frameId: number;
    const start = performance.now() + dayIndex * 140;
    const duration = 1150;

    const tick = (now: number) => {
      if (now < start) {
        frameId = requestAnimationFrame(tick);
        return;
      }
      const elapsed = now - start;
      const ratio = Math.min(1, elapsed / duration);
      // Cubic ease-out
      const eased = 1 - Math.pow(1 - ratio, 3);
      setTimelineProgress(eased);
      if (ratio < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isCardInView, dayIndex, reducedMotion]);

  // Directional scroll-driven entry (Section 15):
  // Day 01: bottom-left (-45px, +45px) -> 0
  // Day 02: bottom-center (0px, +50px) -> 0
  // Day 03: bottom-right (+45px, +45px) -> 0
  const offset = useMemo(
    () => getCardDirectionalOffset(dayIndex, totalDays),
    [dayIndex, totalDays]
  );

  const entryStart = 0.04 + dayIndex * 0.045;
  const entryEnd = 0.36 + dayIndex * 0.045;

  const scrollX = useTransform(
    scrollProgress,
    [entryStart, entryEnd],
    reducedMotion ? [0, 0] : [offset.x, 0]
  );
  const scrollY = useTransform(
    scrollProgress,
    [entryStart, entryEnd],
    reducedMotion ? [0, 0] : [offset.y, 0]
  );
  const scrollScale = useTransform(
    scrollProgress,
    [entryStart, entryEnd],
    reducedMotion ? [1, 1] : [0.97, 1]
  );
  const scrollOpacity = useTransform(
    scrollProgress,
    [entryStart, entryStart + 0.18],
    reducedMotion ? [1, 1] : [0.25, 1]
  );

  // Subtle internal image parallax as user scrolls past the section
  const photoParallaxY = useTransform(
    scrollProgress,
    [0, 1],
    reducedMotion ? [0, 0] : [-10, 12]
  );

  // Determine the currently displayed editorial photograph
  const defaultVisual =
    DEFAULT_DAY_VISUALS[dayIndex % DEFAULT_DAY_VISUALS.length] ??
    DEFAULT_DAY_VISUALS[0];

  const currentVisual = useMemo(() => {
    if (activeActivityIdx === null) {
      return defaultVisual;
    }
    const item = dayData.items[activeActivityIdx];
    if (!item) return defaultVisual;
    return resolveActivityVisual(item.activity, dayIndex);
  }, [activeActivityIdx, dayData.items, dayIndex, defaultVisual]);

  const activeTimeLabel =
    activeActivityIdx !== null && dayData.items[activeActivityIdx]
      ? dayData.items[activeActivityIdx].time
      : null;

  return (
    /* 1. Outer Scroll-Driven Directional Wrapper (Never conflicts with hover transform) */
    <motion.div
      ref={cardRef}
      style={{
        x: scrollX,
        y: scrollY,
        scale: scrollScale,
        opacity: scrollOpacity,
      }}
      className="relative z-[2] h-full will-change-transform"
    >
      {/* 2. Inner Interactive Hover & 1px Champagne Gold Border Light Sweep Wrapper */}
      <article
        className="group/card relative h-full flex flex-col justify-between rounded-[6px] bg-[#FFFDF6]/94 backdrop-blur-[8px] border border-[#C9AB78]/32 shadow-[0_18px_48px_rgba(16,40,50,0.07),0_2px_10px_rgba(16,40,50,0.03)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-[#C9AB78]/75 hover:shadow-[0_28px_64px_rgba(16,40,50,0.13),0_0_0_1px_rgba(201,171,120,0.35)] overflow-hidden"
      >
        {/* 1px Champagne Gold Border Light Sweep on Hover (Section 23) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[6px] opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 overflow-hidden z-0"
        >
          <div className="absolute -inset-[100%] bg-[conic-gradient(from_120deg,transparent_0deg,transparent_290deg,rgba(201,171,120,0.85)_330deg,rgba(232,123,57,0.65)_348deg,transparent_360deg)] animate-[spin_4.5s_linear_infinite]" />
          <div className="absolute inset-[1.5px] rounded-[5px] bg-[#FFFDF6]" />
        </div>

        {/* Fine Editorial Corner Registration Marks */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-2.5 left-2.5 w-2.5 h-2.5 border-t border-l border-[#C9AB78]/55 z-30 transition-colors duration-300 group-hover/card:border-[#E87B39]"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-2.5 right-2.5 w-2.5 h-2.5 border-t border-r border-[#C9AB78]/55 z-30 transition-colors duration-300 group-hover/card:border-[#E87B39]"
        />

        {/* Card Content Stack */}
        <div className="relative z-10 flex flex-col flex-1">
          {/* 3. Cinematic Day Photography Header with Image Mask Reveal & Activity Hover Crossfade (Sections 18, 20, 21) */}
          <div
            className="relative h-48 sm:h-52 w-full overflow-hidden border-b border-[#E8DFD0]"
            style={{
              clipPath:
                hasEnteredOnce || reducedMotion
                  ? "inset(0% 0% 0% 0%)"
                  : "inset(12% 4% 12% 4%)",
              transition:
                "clip-path 0.95s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            <motion.div
              style={{ y: photoParallaxY }}
              className="relative w-full h-[114%] -top-[7%]"
            >
              <AnimatePresence mode="sync">
                <motion.img
                  key={currentVisual.src}
                  src={currentVisual.src}
                  alt={`${dayData.day} — ${dayData.theme}`}
                  loading="lazy"
                  decoding="async"
                  initial={
                    reducedMotion
                      ? { opacity: 1, scale: 1 }
                      : { opacity: 0, scale: 1.07 }
                  }
                  animate={{ opacity: 1, scale: 1 }}
                  exit={
                    reducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, scale: 1.03 }
                  }
                  transition={{
                    duration: 0.62,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/card:scale-[1.04]"
                />
              </AnimatePresence>
            </motion.div>

            {/* Warm Cinematic Scrim & Bottom Editorial Gradient */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#102832]/82 via-[#102832]/24 to-[#102832]/18"
            />

            {/* Top Journal Metadata Strip inside Photo Header */}
            <div className="absolute top-3.5 inset-x-4 flex items-center justify-between gap-2 z-10">
              <span
                aria-hidden="true"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] bg-[#102832]/72 backdrop-blur-md border border-[#C9AB78]/40 text-[10px] font-mono uppercase tracking-[0.22em] text-[#F8F3E9]"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#E87B39] animate-pulse" />
                STAGE 0{dayIndex + 1}
              </span>

              <span
                aria-hidden="true"
                className="hidden sm:inline-block text-[9px] font-mono tracking-[0.18em] text-[#F8F3E9]/85 bg-[#102832]/50 backdrop-blur-sm px-2 py-0.5 rounded-[2px] border border-white/10"
              >
                {currentVisual.coordinates}
              </span>
            </div>

            {/* Bottom Photo Caption & Active Activity Time Indicator */}
            <div className="absolute bottom-3 inset-x-4 flex items-end justify-between gap-2 z-10">
              <div className="min-w-0">
                <p
                  aria-hidden="true"
                  className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#C9AB78] truncate"
                >
                  {currentVisual.caption}
                </p>
              </div>
              {activeTimeLabel && (
                <span
                  aria-hidden="true"
                  className="flex-shrink-0 px-2 py-0.5 rounded-[2px] bg-[#E87B39] text-[#FFFDF6] font-mono text-[10px] font-semibold tracking-wider shadow-sm"
                >
                  {activeTimeLabel}
                </span>
              )}
            </div>
          </div>

          {/* 4. Journal Body: Day Heading + Theme Badge + Interactive Vertical Timeline */}
          <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between">
            <div>
              {/* Day Header Row (Preserves exact dayData.day & dayData.theme) */}
              <div className="flex items-center justify-between gap-3 pb-4 mb-5 border-b border-[#E8DFD0]">
                <div>
                  <span
                    aria-hidden="true"
                    className="block text-[10px] font-mono uppercase tracking-[0.22em] text-[#8A7D6B] group-hover/card:text-[#C9AB78] transition-colors mb-0.5"
                  >
                    EXPEDITION LOG · 0{dayIndex + 1}
                  </span>
                  <h3 className="home-serif font-semibold text-2xl sm:text-[26px] text-[#102832] tracking-tight leading-tight">
                    {dayData.day}
                  </h3>
                </div>

                <span className="bg-[#F8F3E9] border border-[#E8DFD0] group-hover/card:border-[#C9AB78]/70 text-[#216B70] text-xs font-semibold px-3 py-1.5 rounded-[4px] transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                  {dayData.theme}
                </span>
              </div>

              {/* 5. Animated Cinematic Activity Timeline (Sections 17 & 18) */}
              <div
                className="relative space-y-2.5"
                onMouseLeave={() => setActiveActivityIdx(null)}
              >
                {dayData.items.map((item, idx) => {
                  const itemThreshold =
                    (idx + 0.35) / Math.max(dayData.items.length, 1);
                  const isIlluminated = timelineProgress >= itemThreshold;
                  const isHovered = activeActivityIdx === idx;

                  return (
                    <div
                      key={idx}
                      tabIndex={0}
                      onMouseEnter={() => setActiveActivityIdx(idx)}
                      onFocus={() => setActiveActivityIdx(idx)}
                      onBlur={() => setActiveActivityIdx(null)}
                      className={`group/item relative flex gap-3.5 items-start rounded-[5px] px-2.5 py-2 -mx-2.5 transition-all duration-300 cursor-pointer outline-none ${
                        isHovered
                          ? "bg-[#F8F3E9] shadow-[inset_2px_0_0_#E87B39,0_4px_14px_rgba(16,40,50,0.04)]"
                          : "hover:bg-[#F8F3E9]/80"
                      }`}
                    >
                      {/* Time Stop Metadata (JetBrains Mono) */}
                      <span
                        className={`flex-shrink-0 text-xs font-mono font-semibold w-12 pt-0.5 transition-colors duration-300 ${
                          isHovered
                            ? "text-[#E87B39]"
                            : isIlluminated
                              ? "text-[#216B70]"
                              : "text-[#8A7D6B]"
                        }`}
                      >
                        {item.time}
                      </span>

                      {/* Timeline Axis Node & Progressive Connector Segment */}
                      <div className="flex-shrink-0 flex flex-col items-center self-stretch pt-1">
                        <div className="relative flex items-center justify-center">
                          {/* Soft Sunset Halo Ring on Hover */}
                          <span
                            aria-hidden="true"
                            className={`absolute w-4 h-4 rounded-full bg-[#E87B39]/25 transition-transform duration-300 ${
                              isHovered ? "scale-125 opacity-100" : "scale-0 opacity-0"
                            }`}
                          />
                          {/* Marker Pinpoint */}
                          <div
                            className={`relative w-2.5 h-2.5 rounded-full ring-2 ring-[#FFFDF6] transition-all duration-300 ${
                              isHovered
                                ? "bg-[#E87B39] scale-125 shadow-[0_0_10px_rgba(232,123,57,0.65)]"
                                : isIlluminated
                                  ? "bg-[#216B70] group-hover/item:bg-[#E87B39]"
                                  : "bg-[#C9AB78]/50"
                            }`}
                          />
                        </div>

                        {/* Progressive Vertical Line Segment between stops */}
                        {idx < dayData.items.length - 1 && (
                          <div className="relative w-[1.5px] flex-1 bg-[#E8DFD0] mt-1.5 min-h-[20px] overflow-hidden rounded-full">
                            <div
                              className="w-full bg-gradient-to-b from-[#216B70] via-[#C9AB78] to-[#E87B39] transition-all duration-500 ease-out"
                              style={{
                                height: isIlluminated ? "100%" : "0%",
                              }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Activity Description (Be Vietnam Pro) */}
                      <div className="flex-1 pb-0.5">
                        <p
                          className={`text-[14px] leading-[1.6] transition-colors duration-200 ${
                            isHovered
                              ? "text-[#102832] font-medium"
                              : "text-[#1A2A32] font-normal"
                          }`}
                        >
                          {item.activity}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 6. Footer Stats & CTA Link (Preserves 100% of text and href="/lich-trinh/tao-moi") */}
            <div className="mt-7 pt-4 border-t border-[#E8DFD0] flex items-center justify-between gap-2">
              <div className="flex items-center gap-3.5 text-xs text-[#54656E] font-medium">
                <span>⏱ {dayData.duration}</span>
                <span>📍 {dayData.spots} điểm</span>
              </div>
              <Link
                href="/lich-trinh/tao-moi"
                className="group/cta inline-flex items-center gap-1.5 text-xs text-[#216B70] font-semibold uppercase tracking-wider hover:text-[#102832] transition-colors py-1"
              >
                <span>Dùng mẫu {dayData.spots} điểm</span>
                <span className="inline-block transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/cta:translate-x-1 group-hover/card:translate-x-1 text-[#E87B39]">
                  →
                </span>
              </Link>
            </div>
          </div>
        </div>
      </article>
    </motion.div>
  );
}

// ============================================================
// MAIN EXPORT: CinematicJourneyItinerary
// ============================================================

export default function CinematicJourneyItinerary<K extends string>({
  plans,
  selectedPlan,
  onSelectPlan,
}: CinematicJourneyItineraryProps<K>) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const headingRef = useRef<HTMLDivElement | null>(null);

  const [reducedMotion, setReducedMotion] = useState(false);
  const [sweepDone, setSweepDone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);

  const isHeadingInView = useInView(headingRef, {
    once: true,
    margin: "-8% 0px -8% 0px",
  });

  useEffect(() => {
    if (isHeadingInView && !sweepDone) {
      const timer = setTimeout(() => setSweepDone(true), 1800);
      return () => clearTimeout(timer);
    }
  }, [isHeadingInView, sweepDone]);

  // Reversible Scroll-Driven Parallax & Storytelling Progress (Sections 11, 28, 29)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const smoothScroll = useSpring(scrollYProgress, {
    stiffness: 85,
    damping: 26,
    restDelta: 0.001,
  });

  // Layer 03: Coastal Mountain Landscape Parallax (translateY: 15-35px, scale: 1.02-1.05)
  const mountainY = useTransform(
    smoothScroll,
    [0, 1],
    reducedMotion ? [0, 0] : [28, -28]
  );
  const mountainScale = useTransform(
    smoothScroll,
    [0, 0.5, 1],
    reducedMotion ? [1, 1, 1] : [1.02, 1.04, 1.05]
  );

  // Layer 04: Topographic Contour Lines Parallax (translateY: 10-25px)
  const contourY = useTransform(
    smoothScroll,
    [0, 1],
    reducedMotion ? [0, 0] : [-18, 22]
  );

  // Layer 06: Atmospheric Sunlight Parallax (translateY: 20-60px)
  const sunlightY = useTransform(
    smoothScroll,
    [0, 1],
    reducedMotion ? [0, 0] : [-38, 45]
  );

  const currentPlan = plans[selectedPlan];
  const planKeys = useMemo(() => Object.keys(plans) as K[], [plans]);

  return (
    <section
      ref={sectionRef}
      id="lichtrinhgoiY"
      aria-label="Lịch trình gợi ý & Cảm hứng khám phá"
      className="relative pt-12 pb-10 lg:pt-16 lg:pb-14 bg-[#F8F3E9] overflow-hidden select-none sm:select-auto"
    >
      {/* ============================================================
          7-LAYER CINEMATIC BACKGROUND ARCHITECTURE (Section 09)
          ============================================================ */}

      {/* LAYER 01 — Warm Ivory Base Gradient (#F8F3E9 -> #FFFDF6 -> #E8DFD0) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#F8F3E9_0%,#FFFDF6_48%,#F3ECE0_82%,#E8DFD0_100%)]"
      />

      {/* LAYER 02 — Editorial Paper Texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-65 mix-blend-multiply"
        style={{
          backgroundImage:
            "url('/images/itinerary/background/journey-paper-texture.svg')",
          backgroundSize: "420px 420px",
        }}
      />

      {/* LAYER 03 — Coastal Mountain Landscape (Son Tra & Ba Na Mist Silhouette) */}
      <motion.div
        aria-hidden="true"
        style={{ y: mountainY, scale: mountainScale }}
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[78%] opacity-85 will-change-transform"
      >
        <img
          src="/images/itinerary/background/journey-mountain-silhouette.svg"
          alt=""
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover object-bottom"
        />
      </motion.div>

      {/* LAYER 04 — Topographic Contour Lines */}
      <motion.div
        aria-hidden="true"
        style={{ y: contourY }}
        className="pointer-events-none absolute inset-0 opacity-75 will-change-transform"
      >
        <img
          src="/images/itinerary/background/journey-topographic-contours.svg"
          alt=""
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover object-center"
        />
      </motion.div>

      {/* LAYER 06 — Atmospheric Golden Morning Sunlight */}
      <motion.div
        aria-hidden="true"
        style={{ y: sunlightY }}
        className="pointer-events-none absolute inset-0 opacity-90 will-change-transform"
      >
        <img
          src="/images/itinerary/background/journey-golden-atmosphere.svg"
          alt=""
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover object-top"
        />
      </motion.div>

      {/* Top Horizon Soft Integration with ocean-to-sand coastal transition */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-[#F8F3E9] to-transparent"
      />

      {/* ============================================================
          FOREGROUND CONTAINER: HEADER + SEGMENTED CONTROL + CARDS
          ============================================================ */}
      <div className="home-container relative z-10">
        {/* 6-PHASE KINETIC TYPOGRAPHY HEADER & SEGMENTED CONTROL (Sections 12, 13, 14, 25) */}
        <div
          ref={headingRef}
          className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12 lg:mb-14"
        >
          <div className="max-w-3xl">
            {/* Phase 01: Eyebrow Line Draw + Uppercase Label */}
            <div className="flex items-center gap-3.5 mb-4">
              <motion.span
                aria-hidden="true"
                initial={reducedMotion ? { scaleX: 1 } : { scaleX: 0 }}
                animate={
                  isHeadingInView || reducedMotion
                    ? { scaleX: 1 }
                    : { scaleX: 0 }
                }
                transition={{
                  duration: 0.7,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="w-11 h-[1.5px] bg-gradient-to-r from-[#E87B39] to-[#C9AB78] origin-left"
              />
              <motion.span
                initial={
                  reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }
                }
                animate={
                  isHeadingInView || reducedMotion
                    ? { opacity: 1, y: 0 }
                    : { opacity: 0, y: 8 }
                }
                transition={{
                  duration: 0.6,
                  delay: 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="home-eyebrow text-[#216B70] tracking-[0.26em] font-semibold"
              >
                Lên kế hoạch dễ dàng
              </motion.span>
            </div>

            {/* Phase 02–05: Luxury Editorial Heading with Vietnamese Diacritic Protection (Section 14) */}
            <h2
              aria-label="Lịch trình gợi ý & Cảm hứng khám phá"
              className="relative font-bold tracking-[-0.02em] text-[#102832]"
            >
              {/* Line 1: Bold Geometric Display Sans with Outline-to-Solid Construction */}
              <span className="block overflow-visible py-[0.08em]">
                <motion.span
                  initial={
                    reducedMotion
                      ? { opacity: 1, y: 0 }
                      : { opacity: 0, y: 22 }
                  }
                  animate={
                    isHeadingInView || reducedMotion
                      ? { opacity: 1, y: 0 }
                      : { opacity: 0, y: 22 }
                  }
                  transition={{
                    duration: 0.78,
                    delay: 0.14,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="inline-block text-[clamp(28px,3.8vw,54px)] leading-[1.24] uppercase tracking-[-0.02em] text-[#102832]"
                >
                  Lịch trình gợi ý &amp;
                </motion.span>
              </span>

              {/* Line 2: Editorial Serif Italic ("Cảm hứng khám phá") + One-Shot Champagne Light Sweep */}
              <span className="block overflow-visible pt-[0.04em] pb-[0.12em]">
                <motion.span
                  initial={
                    reducedMotion
                      ? { opacity: 1, y: 0 }
                      : { opacity: 0, y: 24 }
                  }
                  animate={
                    isHeadingInView || reducedMotion
                      ? { opacity: 1, y: 0 }
                      : { opacity: 0, y: 24 }
                  }
                  transition={{
                    duration: 0.85,
                    delay: 0.26,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="relative inline-block home-serif italic font-semibold text-[clamp(32px,4.5vw,64px)] leading-[1.26] text-transparent bg-clip-text bg-[linear-gradient(100deg,#102832_0%,#216B70_38%,#C9AB78_74%,#E87B39_100%)]"
                >
                  Cảm hứng khám phá
                  {/* Phase 05: One-shot Champagne Gold Light Sweep across Editorial Italic Title */}
                  {!reducedMotion && isHeadingInView && !sweepDone && (
                    <motion.span
                      aria-hidden="true"
                      initial={{ x: "-120%", opacity: 0 }}
                      animate={{ x: "140%", opacity: [0, 0.85, 0] }}
                      transition={{
                        duration: 1.35,
                        delay: 0.55,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-[#FFFDF6]/80 to-transparent skew-x-[-20deg]"
                    />
                  )}
                </motion.span>
              </span>
            </h2>
          </div>

          {/* Phase 06: Luxury Segmented Control Tab Switcher (3N2Đ / 4N3Đ — Section 25) */}
          <motion.div
            initial={
              reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }
            }
            animate={
              isHeadingInView || reducedMotion
                ? { opacity: 1, y: 0 }
                : { opacity: 0, y: 14 }
            }
            transition={{
              duration: 0.68,
              delay: 0.34,
              ease: [0.22, 1, 0.36, 1],
            }}
            role="tablist"
            aria-label="Chọn thời lượng lịch trình"
            className="inline-flex bg-[#FFFDF6]/90 backdrop-blur-md border border-[#C9AB78]/45 rounded-[6px] p-1.5 gap-1.5 flex-shrink-0 self-start lg:self-end shadow-[0_10px_28px_rgba(16,40,50,0.06)]"
          >
            {planKeys.map((key) => {
              const isSelected = selectedPlan === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => onSelectPlan(key)}
                  className={`relative px-4 sm:px-5 py-2.5 rounded-[4px] text-xs sm:text-[13px] font-semibold uppercase tracking-wider transition-colors duration-300 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#216B70] ${
                    isSelected
                      ? "text-[#F8F3E9]"
                      : "text-[#54656E] hover:text-[#102832]"
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="plan-pill"
                      className="absolute inset-0 bg-[#102832] rounded-[4px] shadow-[0_6px_18px_rgba(16,40,50,0.22)] border border-[#C9AB78]/40"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 32,
                      }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${
                        isSelected ? "bg-[#E87B39]" : "bg-[#C9AB78]/60"
                      }`}
                    />
                    {plans[key].label}
                  </span>
                </button>
              );
            })}
          </motion.div>
        </div>

        {/* Architectural Champagne Hairline Divider with Compass Center Node */}
        <div
          aria-hidden="true"
          className="relative flex items-center gap-4 mb-12 lg:mb-14"
        >
          <div className="h-[1px] flex-1 bg-gradient-to-r from-[#C9AB78]/65 via-[#C9AB78]/35 to-transparent" />
          <span className="text-[10px] font-mono uppercase tracking-[0.28em] text-[#8A7D6B]">
            DA NANG EXPEDITION ROUTE
          </span>
          <div className="h-[1px] flex-1 bg-gradient-to-l from-[#C9AB78]/65 via-[#C9AB78]/35 to-transparent" />
        </div>

        {/* ============================================================
            LAYER 05 & LAYER 07 — GOLDEN JOURNEY CONNECTION + DAY CARDS
            ============================================================ */}
        <div className="relative">
          {/* LAYER 05 — Signature Golden Journey Connection SVG (Behind Day Cards) */}
          <GoldenJourneyConnectionSvg
            scrollProgress={smoothScroll}
            dayCount={currentPlan.days.length}
            reducedMotion={reducedMotion}
          />

          {/* LAYER 07 — Travel Journal Day Cards Grid */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedPlan}
              initial={
                reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }
              }
              animate={{ opacity: 1, y: 0 }}
              exit={
                reducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }
              }
              transition={{
                duration: 0.36,
                ease: [0.22, 1, 0.36, 1],
              }}
              className={`relative z-[2] grid gap-6 lg:gap-8 pl-6 md:pl-0 ${
                currentPlan.days.length === 4
                  ? "md:grid-cols-2 xl:grid-cols-4"
                  : "md:grid-cols-3"
              }`}
            >
              {currentPlan.days.map((dayData, dayIdx) => (
                <TravelJournalDayCard
                  key={`${selectedPlan}-${dayData.day}`}
                  dayData={dayData}
                  dayIndex={dayIdx}
                  totalDays={currentPlan.days.length}
                  scrollProgress={smoothScroll}
                  reducedMotion={reducedMotion}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
