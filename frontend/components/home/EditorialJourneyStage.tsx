"use client";

/**
 * EditorialJourneyStage V10.0 — DANANGGO "The Golden Coastal Journey"
 *
 * Shared multi-layer presentation wrapper uniting two consecutive Homepage chapters:
 * 1. CUỐI TUẦN NÀY Ở ĐÀ NẴNG (WeekendEventsSection)
 * 2. CÂU CHUYỆN & CẢM HỨNG DU LỊCH (Chapter 04 in page.tsx)
 *
 * 7-Layer Multi-Depth Background Architecture (Sections 07–12 & 20–25):
 * - Layer 01: Warm Ivory & Pearl Cream Editorial Base (#F8F2E8 -> #FFF9EF) + Organic Paper Grain
 * - Layer 02: Distant & Midground Coastal Mountain Silhouettes (translateY 12–46px)
 * - Layer 03: Translucent Warm Coastal Mist (translateX -24px -> +36px, never obscuring photography)
 * - Layer 04: Golden Hour Atmospheric Lighting (translate 40–88px)
 * - Layer 05: ORYZO Orbital Sunlight Arcs + Exact SVG `getTotalLength` / `getPointAtLength`
 *   traveling pinpoint + Decorative Serif "ĐÀ NẴNG" watermark (4.5% opacity, translateY -32px)
 * - Layer 06: Signature Golden Journey Line (continuous Champagne Gold Bézier curve drawn via
 *   `stroke-dasharray` / `stroke-dashoffset` with an exact `getPointAtLength` luminous pinpoint
 *   and soft pearl halo guiding the user from Weekend Events into Travel Stories, fully reversible)
 * - Layer 07: Content slot (Weekend Events + Transition Bridge + Travel Stories)
 */

import React, { useRef, useState, useEffect } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useReducedMotion,
  useMotionValueEvent,
} from "framer-motion";

interface EditorialJourneyStageProps {
  children: React.ReactNode;
}

export default function EditorialJourneyStage({
  children,
}: EditorialJourneyStageProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const journeyPathRef = useRef<SVGPathElement>(null);
  const orbitArcRef = useRef<SVGPathElement>(null);
  const reducedMotion = useReducedMotion();

  const [isMobile, setIsMobile] = useState(false);

  // Exact SVG path length and point-at-length state for the Signature Golden Journey Line (Section 10)
  const [journeyTotalLen, setJourneyTotalLen] = useState(2150);
  const [journeyPoint, setJourneyPoint] = useState<{ x: number; y: number }>({
    x: 1180,
    y: 95,
  });

  // Exact SVG path length and point-at-length state for the Upper Orbital Sunlight Arc (Section 11)
  const [orbitTotalLen, setOrbitTotalLen] = useState(820);
  const [orbitPoint, setOrbitPoint] = useState<{ x: number; y: number }>({
    x: 1212,
    y: 78,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Measure exact SVG total lengths on mount
  useEffect(() => {
    if (journeyPathRef.current) {
      try {
        const len = journeyPathRef.current.getTotalLength();
        if (len > 0) {
          setJourneyTotalLen(len);
          const pt = journeyPathRef.current.getPointAtLength(len * 0.08);
          setJourneyPoint({ x: pt.x, y: pt.y });
        }
      } catch {
        // Fallback default
      }
    }
    if (orbitArcRef.current) {
      try {
        const len = orbitArcRef.current.getTotalLength();
        if (len > 0) {
          setOrbitTotalLen(len);
          const pt = orbitArcRef.current.getPointAtLength(len * 0.62);
          setOrbitPoint({ x: pt.x, y: pt.y });
        }
      } catch {
        // Fallback default
      }
    }
  }, []);

  // Master Scroll Timeline across both sections (Scene 01: 0-15%, Scene 02: 15-30%, Scene 03: 30-50%, Scene 04: 50-70%, Scene 05: 70-90%, Scene 06: 90-100%)
  const { scrollYProgress: rawProgress } = useScroll({
    target: stageRef,
    offset: ["start 88%", "end 12%"],
  });

  const masterProgress = useSpring(rawProgress, {
    stiffness: 170,
    damping: 30,
    mass: 0.35,
    restDelta: 0.0005,
  });

  const disableParallax = Boolean(reducedMotion || isMobile);

  // Layer 02: Distant Mountain Landscape (translateY: 10–25px) & Midground Mountain (translateY: 25–50px) — Section 09
  const distantMountainY = useTransform(
    masterProgress,
    [0, 0.5, 1],
    disableParallax ? [0, 0, 0] : [-12, 6, 22]
  );
  const midgroundMountainY = useTransform(
    masterProgress,
    [0, 0.5, 1],
    disableParallax ? [0, 0, 0] : [24, 0, -24]
  );

  // Layer 03: Atmospheric Mist (translateX: 20–60px) — Section 09
  const mistTranslateX = useTransform(
    masterProgress,
    [0, 0.5, 1],
    disableParallax ? [0, 0, 0] : [-24, 8, 34]
  );

  // Layer 04: Golden Hour Lighting (translate: 40–100px) — Section 09
  const goldenLightX = useTransform(
    masterProgress,
    [0, 0.5, 1],
    disableParallax ? [0, 0, 0] : [36, -12, -52]
  );
  const goldenLightY = useTransform(
    masterProgress,
    [0, 0.5, 1],
    disableParallax ? [0, 0, 0] : [-28, 12, 48]
  );

  // Layer 05: Decorative Background Typography "ĐÀ NẴNG" (translateY: 20–50px, opacity 4.5%) — Section 12
  const watermarkY = useTransform(
    masterProgress,
    [0, 0.5, 1],
    disableParallax ? [0, 0, 0] : [18, -8, -28]
  );

  // Layer 05: Orbital Sunlight Arc reveal & fade (Section 11)
  const orbitOpacity = useTransform(
    masterProgress,
    [0, 0.12, 0.45, 0.85],
    reducedMotion ? [0.85, 0.85, 0.85, 0.85] : [0.35, 1, 0.92, 0.45]
  );

  // Update exact SVG coordinates via `getPointAtLength` whenever scroll progress changes (Sections 10, 11, 25)
  const [journeyDashOffset, setJourneyDashOffset] = useState(0);
  const [orbitDashOffset, setOrbitDashOffset] = useState(0);

  useMotionValueEvent(masterProgress, "change", (latest) => {
    const clamped = Math.max(0, Math.min(1, latest));

    // 1. Signature Golden Journey Line progression (0.04 -> 0.96 across the two sections)
    if (journeyPathRef.current && journeyTotalLen > 0) {
      const drawRatio = reducedMotion
        ? 1
        : Math.max(0.06, Math.min(1, 0.06 + clamped * 0.94));
      const drawnLen = journeyTotalLen * drawRatio;
      setJourneyDashOffset(journeyTotalLen - drawnLen);
      try {
        const pt = journeyPathRef.current.getPointAtLength(drawnLen);
        setJourneyPoint({ x: pt.x, y: pt.y });
      } catch {
        // Ignore if SVG unmounted
      }
    }

    // 2. Upper Orbital Sunlight Arc progression (0.15 -> 0.92 along the upper solar arc)
    if (orbitArcRef.current && orbitTotalLen > 0) {
      const arcRatio = reducedMotion
        ? 0.72
        : Math.max(0.22, Math.min(0.92, 0.25 + clamped * 0.85));
      const arcDrawn = orbitTotalLen * arcRatio;
      setOrbitDashOffset(orbitTotalLen - arcDrawn);
      try {
        const pt = orbitArcRef.current.getPointAtLength(arcDrawn);
        setOrbitPoint({ x: pt.x, y: pt.y });
      } catch {
        // Ignore if SVG unmounted
      }
    }
  });

  return (
    <div
      ref={stageRef}
      className="relative w-full overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #F8F2E8 0%, #F6EFE3 48%, #FFF9EF 100%)",
      }}
    >
      {/* ── LAYER 01: Warm Ivory Editorial Paper Texture (Section 08 & 26) ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none absolute inset-0 z-0 opacity-65"
        style={{
          backgroundImage:
            "url('/images/cinematic/textures/ivory-editorial-texture.svg')",
          backgroundRepeat: "repeat",
        }}
      />

      {/* ── LAYER 04: Golden Hour Atmospheric Lighting (Sections 07, 08, 09) ── */}
      <motion.div
        aria-hidden="true"
        style={{ x: goldenLightX, y: goldenLightY }}
        className="pointer-events-none select-none absolute -inset-16 z-0 will-change-transform"
      >
        <img
          src="/images/cinematic/atmosphere/golden-atmosphere.svg"
          alt=""
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover"
        />
      </motion.div>

      {/* ── LAYER 02: Distant & Midground Coastal Mountain Landscape (Sections 08 & 09) ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none absolute inset-x-0 top-0 h-[440px] overflow-hidden z-1"
      >
        {/* Distant Mountain Silhouette (translateY: 10–25px) */}
        <motion.div
          style={{ y: distantMountainY }}
          className="absolute -inset-x-8 top-0 h-[390px] will-change-transform"
        >
          <img
            src="/images/cinematic/mountains/distant-mountain-layer.svg"
            alt=""
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />
        </motion.div>

        {/* Decorative Background Typography "ĐÀ NẴNG" behind the mountain mist (Section 12: Serif, ~5% opacity, translateY 20–50px) */}
        <motion.div
          style={{ y: watermarkY }}
          className="hidden md:block absolute top-6 right-[5%] lg:right-[7%] home-serif italic font-normal text-[76px] lg:text-[108px] leading-none tracking-[0.06em] text-[#C9AB78]/[0.18] whitespace-nowrap will-change-transform"
        >
          ĐÀ NẴNG
        </motion.div>

        {/* Midground Coastal Mountain Slope (translateY: 25–50px) */}
        <motion.div
          style={{ y: midgroundMountainY }}
          className="absolute -inset-x-6 top-10 h-[370px] will-change-transform"
        >
          <img
            src="/images/cinematic/mountains/golden-coastal-mountains.svg"
            alt=""
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />
        </motion.div>
      </div>

      {/* ── LAYER 03: Translucent Warm Coastal Mist (Sections 08 & 09: translateX 20–60px) ── */}
      <motion.div
        aria-hidden="true"
        style={{ x: mistTranslateX }}
        className="pointer-events-none select-none absolute -inset-x-16 top-16 h-[420px] z-1 opacity-75 will-change-transform"
      >
        <img
          src="/images/cinematic/atmosphere/warm-coastal-mist.svg"
          alt=""
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover"
        />
      </motion.div>

      {/* ── LAYER 05: ORYZO Orbital Sunlight Effect at Upper Right (Section 11) ── */}
      <motion.div
        aria-hidden="true"
        style={{ opacity: orbitOpacity }}
        className="pointer-events-none select-none absolute inset-x-0 top-0 h-[420px] z-2 overflow-hidden"
      >
        <svg
          viewBox="0 0 1440 420"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          <defs>
            <radialGradient id="orbitalSunPinpoint" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
              <stop offset="32%" stopColor="#FFF9EF" stopOpacity="0.95" />
              <stop offset="65%" stopColor="#EAB47D" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#CB712D" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Outer subtle secondary solar ring */}
          <circle
            cx="1055"
            cy="245"
            r="268"
            stroke="#E8D9C6"
            strokeWidth="0.7"
            strokeDasharray="3 7"
            strokeOpacity="0.55"
          />

          {/* Base guide ring for the primary solar orbit */}
          <circle
            cx="1055"
            cy="245"
            r="222"
            stroke="#E8D9C6"
            strokeWidth="0.85"
            strokeOpacity="0.45"
          />

          {/* Scroll-drawn primary solar orbit arc with exact getPointAtLength sun pinpoint */}
          <path
            ref={orbitArcRef}
            d="M 835 225 A 222 222 0 0 1 1272 198"
            stroke="#C9AB78"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeDasharray={orbitTotalLen}
            strokeDashoffset={reducedMotion ? 0 : orbitDashOffset}
          />

          {/* Traveling Solar Pinpoint on the upper-right orbital arc */}
          <g transform={`translate(${orbitPoint.x}, ${orbitPoint.y})`}>
            <circle cx="0" cy="0" r="20" fill="url(#orbitalSunPinpoint)" />
            <circle
              cx="0"
              cy="0"
              r="5.5"
              stroke="#EAB47D"
              strokeWidth="0.85"
              strokeOpacity="0.7"
            />
            <circle cx="0" cy="0" r="3" fill="#FFFFFF" />
          </g>
        </svg>
      </motion.div>

      {/* ── LAYER 06: SIGNATURE GOLDEN JOURNEY LINE (Section 10: Continuous SVG Bézier path + exact getPointAtLength luminous traveler connecting both sections) ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none absolute inset-0 z-2 overflow-hidden"
      >
        <svg
          viewBox="0 0 1440 1680"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          <defs>
            <linearGradient
              id="goldenJourneyStrokeGrad"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#C9AB78" stopOpacity="0.2" />
              <stop offset="22%" stopColor="#EAB47D" stopOpacity="0.75" />
              <stop offset="52%" stopColor="#FFF9EF" stopOpacity="0.95" />
              <stop offset="78%" stopColor="#C9AB78" stopOpacity="0.78" />
              <stop offset="100%" stopColor="#C9AB78" stopOpacity="0.22" />
            </linearGradient>
            <radialGradient
              id="goldenJourneyPinpointHalo"
              cx="50%"
              cy="50%"
              r="50%"
            >
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
              <stop offset="30%" stopColor="#FFF9EF" stopOpacity="0.92" />
              <stop offset="65%" stopColor="#EAB47D" stopOpacity="0.42" />
              <stop offset="100%" stopColor="#C9AB78" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Subtle underlying guide trajectory */}
          <path
            d="M 1220 75 C 940 165, 360 190, 210 470 C 90 695, 420 825, 690 865 C 940 902, 1340 810, 1395 1080 C 1435 1290, 1380 1490, 1290 1630"
            stroke="#E8D9C6"
            strokeWidth="0.8"
            strokeDasharray="4 8"
            strokeOpacity="0.45"
          />

          {/* Primary scroll-revealed Champagne Gold Journey Line (routed gracefully along the outer right margin in the lower half so it never crosses over the article text) */}
          <path
            ref={journeyPathRef}
            d="M 1220 75 C 940 165, 360 190, 210 470 C 90 695, 420 825, 690 865 C 940 902, 1340 810, 1395 1080 C 1435 1290, 1380 1490, 1290 1630"
            stroke="url(#goldenJourneyStrokeGrad)"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeDasharray={journeyTotalLen}
            strokeDashoffset={reducedMotion ? 0 : journeyDashOffset}
          />

          {/* Thin Pearl Cream highlight thread following the Golden Journey Line */}
          <path
            d="M 1220 75 C 940 165, 360 190, 210 470 C 90 695, 420 825, 690 865 C 940 902, 1340 810, 1395 1080 C 1435 1290, 1380 1490, 1290 1630"
            stroke="#FFF9EF"
            strokeWidth="0.55"
            strokeLinecap="round"
            strokeOpacity="0.65"
            strokeDasharray={journeyTotalLen}
            strokeDashoffset={reducedMotion ? 0 : journeyDashOffset}
          />

          {/* Exact getPointAtLength Luminous Traveler Pinpoint with soft Champagne Halo */}
          <g transform={`translate(${journeyPoint.x}, ${journeyPoint.y})`}>
            <circle
              cx="0"
              cy="0"
              r="22"
              fill="url(#goldenJourneyPinpointHalo)"
            />
            <circle
              cx="0"
              cy="0"
              r="6"
              stroke="#EAB47D"
              strokeWidth="0.9"
              strokeOpacity="0.8"
            />
            <circle cx="0" cy="0" r="3.2" fill="#FFFFFF" />
          </g>
        </svg>
      </div>

      {/* ── LAYER 07: Content Slot (Weekend Events + Wave Bridge + Travel Stories) ── */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
