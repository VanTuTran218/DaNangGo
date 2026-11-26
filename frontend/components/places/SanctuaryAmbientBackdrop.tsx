"use client";

/**
 * SanctuaryAmbientBackdrop — Nocturnal Coastal Luxury Backdrop for /luutru
 *
 * Aman × Six Senses × Belmond dark sanctuary atmosphere with 60fps GPU motion:
 * - Deep Ocean twilight base (#06151C -> #051219) with faint celestial grain.
 * - Warm Champagne candlelight & Emerald lagoon mood orbs shifting gently with district filter.
 * - Scroll-drawn luminous Champagne horizon curve & gliding pearl pinpoint via direct DOM refs
 *   and 64-pt LUT (0 React re-renders on scroll).
 * - Ghosted serif "LƯU TRÚ ĐÀ NẴNG" parallax watermark & auto-pause on hidden tab / reduced motion.
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

interface SanctuaryAmbientBackdropProps {
  activeDistrictId: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

const SAMPLE_COUNT = 64;
const DEFAULT_PATH_LEN = 2300;

const SanctuaryAmbientBackdrop = React.memo(function SanctuaryAmbientBackdrop({
  activeDistrictId,
  containerRef,
}: SanctuaryAmbientBackdropProps) {
  const reducedMotion = Boolean(useReducedMotion());
  const [isTabHidden, setIsTabHidden] = useState(false);

  const curvePathRef = useRef<SVGPathElement>(null);
  const pearlRef = useRef<SVGGElement>(null);
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
    const pathEl = curvePathRef.current;
    const pearlEl = pearlRef.current;
    if (!pathEl || !pearlEl) return;

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
      pearlEl.setAttribute(
        "transform",
        `translate(${xs[idx].toFixed(1)}, ${ys[idx].toFixed(1)})`
      );
      pearlEl.style.opacity = "1";
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
    reducedMotion ? [0, 0] : [16, -54]
  );

  useMotionValueEvent(smoothProgress, "change", (latest) => {
    if (reducedMotion) return;
    const pathEl = curvePathRef.current;
    const pearlEl = pearlRef.current;
    const lut = lutRef.current;
    if (!pathEl || !pearlEl || !lut.ready) return;

    const clamped = Math.max(0.05, Math.min(0.98, 0.06 + latest * 0.92));
    pathEl.style.strokeDashoffset = `${(lut.total * (1 - clamped)).toFixed(2)}`;

    const fIdx = clamped * SAMPLE_COUNT;
    const i0 = Math.min(SAMPLE_COUNT - 1, Math.floor(fIdx));
    const frac = fIdx - i0;
    const x = lut.xs[i0] + (lut.xs[i0 + 1] - lut.xs[i0]) * frac;
    const y = lut.ys[i0] + (lut.ys[i0 + 1] - lut.ys[i0]) * frac;
    pearlEl.setAttribute("transform", `translate(${x.toFixed(1)}, ${y.toFixed(1)})`);
  });

  // Warm sanctuary mood subtly shifts when filtering by coastal vs city districts
  const warmOrbA =
    activeDistrictId === 2 || activeDistrictId === 3
      ? "radial-gradient(circle, rgba(105,165,163,0.22) 0%, rgba(201,181,128,0.10) 46%, transparent 72%)"
      : activeDistrictId === 1
        ? "radial-gradient(circle, rgba(232,123,57,0.18) 0%, rgba(201,181,128,0.10) 46%, transparent 72%)"
        : "radial-gradient(circle, rgba(201,181,128,0.18) 0%, rgba(232,123,57,0.08) 48%, transparent 72%)";

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-0 overflow-hidden select-none ${
        isTabHidden || reducedMotion ? "explore-ambient-paused" : ""
      }`}
    >
      {/* Nocturnal Deep Ocean Base */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 85% 55% at 50% 0%, #0E2934 0%, #071922 48%, #051219 100%)",
        }}
      />

      {/* Fine Champagne Starlight Grid */}
      <div
        className="absolute inset-0 opacity-[0.13]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(230,217,183,0.42) 1px, transparent 1px)",
          backgroundSize: "54px 54px",
        }}
      />

      {/* Ambient Lagoon & Candlelight Auroras */}
      <div
        className="explore-orb-a absolute -top-28 right-[-8%] w-[560px] h-[560px] rounded-full transition-all duration-700"
        style={{ background: warmOrbA }}
      />
      <div
        className="explore-orb-b absolute top-[36%] left-[-10%] w-[620px] h-[620px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(33,107,112,0.26) 0%, rgba(15,76,92,0.10) 48%, transparent 72%)",
        }}
      />
      <div
        className="explore-orb-c absolute bottom-[-12%] right-[10%] w-[540px] h-[540px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(201,181,128,0.14) 0%, rgba(232,123,57,0.06) 46%, transparent 72%)",
        }}
      />

      {/* Ghosted Editorial Serif Watermark */}
      <motion.div
        style={{ y: watermarkY }}
        className="hidden lg:flex absolute top-[19%] inset-x-0 justify-center opacity-[0.03]"
      >
        <span className="home-serif italic text-[13vw] font-normal tracking-[0.08em] text-[#E6D9B7] whitespace-nowrap">
          SANCTUARY ĐÀ NẴNG
        </span>
      </motion.div>

      {/* Scroll-Drawn Champagne Coastal Horizon Curve */}
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full opacity-55"
      >
        <defs>
          <linearGradient id="sanctuaryArcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E6D9B7" stopOpacity="0.14" />
            <stop offset="50%" stopColor="#E6D9B7" stopOpacity="0.58" />
            <stop offset="100%" stopColor="#E87B39" stopOpacity="0.45" />
          </linearGradient>
          <radialGradient id="sanctuaryPearlGlow">
            <stop offset="0%" stopColor="#FFFDF5" stopOpacity="0.95" />
            <stop offset="40%" stopColor="#E6D9B7" stopOpacity="0.58" />
            <stop offset="100%" stopColor="#E87B39" stopOpacity="0" />
          </radialGradient>
        </defs>

        <path
          d="M -30 220 C 310 90, 560 310, 880 185 C 1150 80, 1280 420, 1480 390"
          fill="none"
          stroke="rgba(230,217,183,0.10)"
          strokeWidth="1"
          strokeDasharray="4 8"
        />

        <path
          ref={curvePathRef}
          d="M -30 220 C 310 90, 560 310, 880 185 C 1150 80, 1280 420, 1480 390"
          fill="none"
          stroke="url(#sanctuaryArcGrad)"
          strokeWidth="1.35"
        />

        <g ref={pearlRef} style={{ opacity: 0 }}>
          <circle r="18" fill="url(#sanctuaryPearlGlow)" />
          <circle r="3.5" fill="#FFFDF5" />
        </g>
      </svg>
    </div>
  );
});

export default SanctuaryAmbientBackdrop;
