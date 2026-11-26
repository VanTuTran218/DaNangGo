"use client";

/**
 * ExploreAmbientBackdrop — Nocturnal Deep Ocean Sanctuary Backdrop for /khampha
 *
 * Aman × White Desert × ORYZO dark sanctuary atmosphere with 60fps GPU performance:
 * - Deep Ocean twilight base with subtle organic starlight grain.
 * - Dynamic category mood aurora washes (smooth 700ms crossfade on filter change).
 * - Scroll-drawn luminous Champagne ORYZO journey curve & gliding sun pinpoint
 *   updated directly via DOM refs + 64-pt LUT (0 React re-renders on scroll).
 * - Subtle Son Tra mountain silhouettes & ghosted "ĐÀ NẴNG" serif watermark.
 * - Auto-pauses CSS drift when tab is hidden and respects `prefers-reduced-motion`.
 */

import React, { useEffect, useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValueEvent,
  useReducedMotion,
} from "framer-motion";
import type { PlaceType } from "@/lib/api/places";

interface ExploreAmbientBackdropProps {
  activeType: PlaceType | "";
  containerRef: React.RefObject<HTMLDivElement | null>;
}

const SAMPLE_COUNT = 64;
const DEFAULT_PATH_LEN = 2200;

const ExploreAmbientBackdrop = React.memo(function ExploreAmbientBackdrop({
  activeType,
  containerRef,
}: ExploreAmbientBackdropProps) {
  const reducedMotion = Boolean(useReducedMotion());
  const [isTabHidden, setIsTabHidden] = useState(false);

  const journeyPathRef = useRef<SVGPathElement>(null);
  const pinpointRef = useRef<SVGGElement>(null);
  const lutRef = useRef<{
    total: number;
    xs: Float32Array;
    ys: Float32Array;
    ready: boolean;
  }>({
    total: DEFAULT_PATH_LEN,
    xs: new Float32Array(SAMPLE_COUNT + 1),
    ys: new Float32Array(SAMPLE_COUNT + 1),
    ready: false,
  });

  useEffect(() => {
    if (typeof document === "undefined") return;
    setIsTabHidden(document.hidden);
    const onVisibility = () => setIsTabHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    const pathEl = journeyPathRef.current;
    const pinEl = pinpointRef.current;
    if (!pathEl || !pinEl) return;

    let total = DEFAULT_PATH_LEN;
    try {
      const measured = pathEl.getTotalLength();
      if (measured > 0) total = measured;
    } catch {
      // Fallback
    }

    pathEl.style.strokeDasharray = `${total}`;
    const xs = new Float32Array(SAMPLE_COUNT + 1);
    const ys = new Float32Array(SAMPLE_COUNT + 1);
    let ready = true;

    try {
      for (let i = 0; i <= SAMPLE_COUNT; i++) {
        const pt = pathEl.getPointAtLength((total * i) / SAMPLE_COUNT);
        xs[i] = pt.x;
        ys[i] = pt.y;
      }
    } catch {
      ready = false;
    }

    lutRef.current = { total, xs, ys, ready };

    const initialRatio = reducedMotion ? 0.65 : 0.08;
    pathEl.style.strokeDashoffset = `${(total * (1 - initialRatio)).toFixed(2)}`;
    if (ready) {
      const idx = Math.min(SAMPLE_COUNT - 1, Math.floor(initialRatio * SAMPLE_COUNT));
      pinEl.setAttribute(
        "transform",
        `translate(${xs[idx].toFixed(1)}, ${ys[idx].toFixed(1)})`
      );
      pinEl.style.opacity = "1";
    }
  }, [reducedMotion]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 150,
    damping: 30,
    mass: 0.35,
    restDelta: 0.0005,
  });

  const watermarkY = useTransform(
    smoothProgress,
    [0, 1],
    reducedMotion ? [0, 0] : [14, -52]
  );
  const contourY = useTransform(
    smoothProgress,
    [0, 1],
    reducedMotion ? [0, 0] : [0, -44]
  );

  useMotionValueEvent(smoothProgress, "change", (latest) => {
    if (reducedMotion) return;
    const pathEl = journeyPathRef.current;
    const pinEl = pinpointRef.current;
    const lut = lutRef.current;
    if (!pathEl || !pinEl || !lut.ready) return;

    const clamped = Math.max(0.05, Math.min(0.98, 0.06 + latest * 0.92));
    pathEl.style.strokeDashoffset = `${(lut.total * (1 - clamped)).toFixed(2)}`;

    const fIdx = clamped * SAMPLE_COUNT;
    const i0 = Math.min(SAMPLE_COUNT - 1, Math.floor(fIdx));
    const frac = fIdx - i0;
    const x = lut.xs[i0] + (lut.xs[i0 + 1] - lut.xs[i0]) * frac;
    const y = lut.ys[i0] + (lut.ys[i0 + 1] - lut.ys[i0]) * frac;
    pinEl.setAttribute("transform", `translate(${x.toFixed(1)}, ${y.toFixed(1)})`);
  });

  const pauseClass = isTabHidden || reducedMotion ? "explore-ambient-paused" : "";

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none select-none absolute inset-0 z-0 overflow-x-clip ${pauseClass}`}
    >
      {/* ── LAYER 01: Subtle Starry Coordinate Grid Pattern ── */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(230,217,183,0.75) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* ── LAYER 02: Sticky Nocturnal Aurora Mood Orbs + Scroll-Drawn ORYZO Constellation ── */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* Default / All Places: Deep Ocean Teal & Warm Champagne Moonbeam */}
        <div
          className="absolute inset-0 transition-opacity duration-700 ease-out"
          style={{ opacity: activeType === "" ? 1 : 0 }}
        >
          <div
            className="explore-orb-a absolute -top-[14%] -right-[8%] w-[68vw] h-[68vw] max-w-[940px] max-h-[940px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(201,171,120,0.16) 0%, rgba(33,107,112,0.12) 45%, transparent 72%)",
            }}
          />
          <div
            className="explore-orb-b absolute top-[32%] -left-[12%] w-[62vw] h-[62vw] max-w-[840px] max-h-[840px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(33,107,112,0.22) 0%, rgba(16,58,68,0.12) 48%, transparent 74%)",
            }}
          />
          <div
            className="explore-orb-c absolute -bottom-[16%] right-[14%] w-[56vw] h-[56vw] max-w-[760px] max-h-[760px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(232,123,57,0.10) 0%, rgba(201,171,120,0.06) 46%, transparent 74%)",
            }}
          />
        </div>

        {/* Top Restaurants: Warm Nocturnal Amber & Candlelight Glow */}
        <div
          className="absolute inset-0 transition-opacity duration-700 ease-out"
          style={{ opacity: activeType === "RESTAURANT" ? 1 : 0 }}
        >
          <div
            className="explore-orb-a absolute -top-[12%] right-[2%] w-[64vw] h-[64vw] max-w-[880px] max-h-[880px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(232,123,57,0.20) 0%, rgba(201,171,120,0.10) 46%, transparent 72%)",
            }}
          />
          <div
            className="explore-orb-b absolute bottom-[4%] -left-[10%] w-[58vw] h-[58vw] max-w-[780px] max-h-[780px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(201,171,120,0.16) 0%, rgba(33,107,112,0.08) 50%, transparent 74%)",
            }}
          />
        </div>

        {/* Top Accommodations: Quiet Luxury Sanctuary Gold & Deep Sea */}
        <div
          className="absolute inset-0 transition-opacity duration-700 ease-out"
          style={{ opacity: activeType === "ACCOMMODATION" ? 1 : 0 }}
        >
          <div
            className="explore-orb-a absolute -top-[10%] -right-[6%] w-[66vw] h-[66vw] max-w-[900px] max-h-[900px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(230,217,183,0.18) 0%, rgba(201,171,120,0.09) 46%, transparent 74%)",
            }}
          />
          <div
            className="explore-orb-b absolute top-[38%] -left-[10%] w-[60vw] h-[60vw] max-w-[820px] max-h-[820px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(22,82,92,0.24) 0%, rgba(16,40,50,0.12) 48%, transparent 74%)",
            }}
          />
        </div>

        {/* Top Attractions: Bioluminescent Turquoise & Son Tra Mist */}
        <div
          className="absolute inset-0 transition-opacity duration-700 ease-out"
          style={{ opacity: activeType === "ATTRACTION" ? 1 : 0 }}
        >
          <div
            className="explore-orb-a absolute -top-[8%] right-[6%] w-[66vw] h-[66vw] max-w-[900px] max-h-[900px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(105,165,163,0.22) 0%, rgba(33,107,112,0.12) 48%, transparent 74%)",
            }}
          />
          <div
            className="explore-orb-b absolute bottom-[6%] -left-[8%] w-[58vw] h-[58vw] max-w-[800px] max-h-[800px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(201,181,128,0.16) 0%, rgba(105,165,163,0.08) 50%, transparent 74%)",
            }}
          />
        </div>

        {/* Parallax Topographic Contours */}
        <motion.div
          style={{ y: contourY }}
          className="absolute -inset-y-12 inset-x-0 opacity-30"
        >
          <img
            src="/images/intro/atmosphere/intro-coastal-contours.svg"
            alt=""
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />
        </motion.div>

        {/* Scroll-Drawn ORYZO Golden Journey Curve & Celestial Rings */}
        <svg
          viewBox="0 0 1440 900"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 w-full h-full opacity-75"
        >
          <defs>
            <linearGradient
              id="exploreDarkJourneyStroke"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#E6D9B7" stopOpacity="0.1" />
              <stop offset="38%" stopColor="#E87B39" stopOpacity="0.48" />
              <stop offset="72%" stopColor="#E6D9B7" stopOpacity="0.42" />
              <stop offset="100%" stopColor="#69A5A3" stopOpacity="0.15" />
            </linearGradient>
            <radialGradient id="exploreDarkPinGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFDF5" stopOpacity="1" />
              <stop offset="38%" stopColor="#E87B39" stopOpacity="0.78" />
              <stop offset="72%" stopColor="#E6D9B7" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#E6D9B7" stopOpacity="0" />
            </radialGradient>
          </defs>

          <circle
            cx="1270"
            cy="210"
            r="250"
            stroke="#E6D9B7"
            strokeWidth="0.7"
            strokeOpacity="0.14"
          />
          <circle
            cx="1270"
            cy="210"
            r="180"
            stroke="#69A5A3"
            strokeWidth="0.6"
            strokeDasharray="4 8"
            strokeOpacity="0.16"
          />
          <circle
            cx="130"
            cy="730"
            r="220"
            stroke="#E6D9B7"
            strokeWidth="0.7"
            strokeDasharray="3 9"
            strokeOpacity="0.13"
          />

          <path
            d="M -60 220 C 310 110, 680 340, 1080 210 C 1270 148, 1390 215, 1520 280"
            stroke="#E6D9B7"
            strokeWidth="0.75"
            strokeOpacity="0.12"
            strokeDasharray="5 10"
          />

          <path
            ref={journeyPathRef}
            d="M 1340 40 C 1020 220, 420 190, 210 420 C 40 605, 620 690, 1180 860"
            stroke="url(#exploreDarkJourneyStroke)"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeDasharray={DEFAULT_PATH_LEN}
            strokeDashoffset={DEFAULT_PATH_LEN}
          />

          <g ref={pinpointRef} style={{ opacity: 0 }}>
            <circle cx="0" cy="0" r="18" fill="url(#exploreDarkPinGlow)" />
            <circle
              cx="0"
              cy="0"
              r="5.5"
              stroke="#E87B39"
              strokeWidth="0.9"
              strokeOpacity="0.7"
            />
            <circle cx="0" cy="0" r="2.6" fill="#FFFDF5" />
          </g>
        </svg>
      </div>

      {/* ── LAYER 03: Subtle Ghosted Watermark Typography below Hero ── */}
      <div className="absolute inset-x-0 top-[490px] sm:top-[540px] lg:top-[580px] h-[320px] overflow-hidden">
        <motion.div
          style={{ y: watermarkY }}
          className="hidden md:block absolute top-8 right-[5%] lg:right-[7%] home-serif italic font-normal text-[84px] lg:text-[124px] leading-none tracking-[0.06em] text-[#E6D9B7]/[0.05] whitespace-nowrap"
        >
          ĐÀ NẴNG
        </motion.div>
      </div>
    </div>
  );
});

export default ExploreAmbientBackdrop;
