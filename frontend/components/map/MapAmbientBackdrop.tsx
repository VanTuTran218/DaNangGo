"use client";

/**
 * MapAmbientBackdrop — Nocturnal Expedition Cartography Backdrop for /bando
 *
 * Unified Deep Ocean Sanctuary atmosphere (60fps GPU-only):
 * - Deep coastal ocean twilight base (#06151C -> #051219) with subtle nautical lat/lng dot grid.
 * - Soft dynamic mood orbs responding to active map mode (Nocturnal / Daylight / Satellite).
 * - Scroll-drawn luminous Champagne maritime route trail & gliding compass beacon via direct
 *   DOM refs + 64-pt LUT (0 React re-renders during scroll).
 * - Ghosted serif "BẢN ĐỒ ĐÀ NẴNG" parallax watermark & auto-pause on hidden tab / reduced motion.
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

interface MapAmbientBackdropProps {
  mode: "night" | "day" | "satellite";
  containerRef: React.RefObject<HTMLDivElement | null>;
}

const SAMPLE_COUNT = 64;
const DEFAULT_PATH_LEN = 2300;

const MODE_MOODS: Record<
  "night" | "day" | "satellite",
  { orbA: string; orbB: string; orbC: string }
> = {
  night: {
    orbA: "radial-gradient(circle, rgba(45,212,191,0.20) 0%, rgba(33,107,112,0.10) 46%, transparent 72%)",
    orbB: "radial-gradient(circle, rgba(201,181,128,0.18) 0%, rgba(232,123,57,0.06) 48%, transparent 72%)",
    orbC: "radial-gradient(circle, rgba(33,107,112,0.26) 0%, rgba(15,76,92,0.10) 46%, transparent 72%)",
  },
  day: {
    orbA: "radial-gradient(circle, rgba(230,217,183,0.20) 0%, rgba(232,123,57,0.08) 46%, transparent 72%)",
    orbB: "radial-gradient(circle, rgba(56,189,248,0.18) 0%, rgba(33,107,112,0.10) 48%, transparent 72%)",
    orbC: "radial-gradient(circle, rgba(201,181,128,0.15) 0%, transparent 70%)",
  },
  satellite: {
    orbA: "radial-gradient(circle, rgba(16,185,129,0.20) 0%, rgba(33,107,112,0.10) 46%, transparent 72%)",
    orbB: "radial-gradient(circle, rgba(56,189,248,0.18) 0%, transparent 70%)",
    orbC: "radial-gradient(circle, rgba(232,123,57,0.15) 0%, transparent 70%)",
  },
};

const MapAmbientBackdrop = React.memo(function MapAmbientBackdrop({
  mode,
  containerRef,
}: MapAmbientBackdropProps) {
  const reducedMotion = Boolean(useReducedMotion());
  const [isTabHidden, setIsTabHidden] = useState(false);

  const trailRef = useRef<SVGPathElement>(null);
  const beaconRef = useRef<SVGGElement>(null);
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
    const pathEl = trailRef.current;
    const beaconEl = beaconRef.current;
    if (!pathEl || !beaconEl) return;

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

    const initialRatio = reducedMotion ? 0.65 : 0.1;
    pathEl.style.strokeDashoffset = `${(total * (1 - initialRatio)).toFixed(2)}`;
    if (ready) {
      const idx = Math.min(SAMPLE_COUNT - 1, Math.floor(initialRatio * SAMPLE_COUNT));
      beaconEl.setAttribute(
        "transform",
        `translate(${xs[idx].toFixed(1)}, ${ys[idx].toFixed(1)})`
      );
      beaconEl.style.opacity = "1";
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
    reducedMotion ? [0, 0] : [14, -48]
  );

  useMotionValueEvent(smoothProgress, "change", (latest) => {
    if (reducedMotion) return;
    const pathEl = trailRef.current;
    const beaconEl = beaconRef.current;
    const lut = lutRef.current;
    if (!pathEl || !beaconEl || !lut.ready) return;

    const clamped = Math.max(0.06, Math.min(0.98, 0.08 + latest * 0.9));
    pathEl.style.strokeDashoffset = `${(lut.total * (1 - clamped)).toFixed(2)}`;

    const fIdx = clamped * SAMPLE_COUNT;
    const i0 = Math.min(SAMPLE_COUNT - 1, Math.floor(fIdx));
    const frac = fIdx - i0;
    const x = lut.xs[i0] + (lut.xs[i0 + 1] - lut.xs[i0]) * frac;
    const y = lut.ys[i0] + (lut.ys[i0 + 1] - lut.ys[i0]) * frac;
    beaconEl.setAttribute("transform", `translate(${x.toFixed(1)}, ${y.toFixed(1)})`);
  });

  const mood = MODE_MOODS[mode] ?? MODE_MOODS.night;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-0 overflow-hidden select-none ${
        isTabHidden || reducedMotion ? "explore-ambient-paused" : ""
      }`}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 85% 55% at 50% 0%, #0E2A36 0%, #071922 48%, #051219 100%)",
        }}
      />

      <div
        className="absolute inset-0 opacity-[0.13]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(230,217,183,0.42) 1px, transparent 1px)",
          backgroundSize: "52px 52px",
        }}
      />

      <div
        className="explore-orb-a absolute -top-28 right-[-8%] w-[560px] h-[560px] rounded-full transition-all duration-700"
        style={{ background: mood.orbA }}
      />
      <div
        className="explore-orb-b absolute top-[40%] left-[-10%] w-[620px] h-[620px] rounded-full transition-all duration-700"
        style={{ background: mood.orbB }}
      />
      <div
        className="explore-orb-c absolute bottom-[-12%] right-[12%] w-[540px] h-[540px] rounded-full transition-all duration-700"
        style={{ background: mood.orbC }}
      />

      <motion.div
        style={{ y: watermarkY }}
        className="hidden lg:flex absolute top-[18%] inset-x-0 justify-center opacity-[0.028]"
      >
        <span className="home-serif italic text-[13vw] font-normal tracking-[0.08em] text-[#E6D9B7] whitespace-nowrap">
          BẢN ĐỒ ĐÀ NẴNG
        </span>
      </motion.div>

      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full opacity-50"
      >
        <defs>
          <linearGradient id="bandoTrailGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.18" />
            <stop offset="50%" stopColor="#E6D9B7" stopOpacity="0.58" />
            <stop offset="100%" stopColor="#E87B39" stopOpacity="0.50" />
          </linearGradient>
          <radialGradient id="bandoBeaconGlow">
            <stop offset="0%" stopColor="#FFFDF5" stopOpacity="0.95" />
            <stop offset="40%" stopColor="#2DD4BF" stopOpacity="0.58" />
            <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0" />
          </radialGradient>
        </defs>

        <path
          d="M -30 220 C 310 130, 560 360, 880 210 C 1150 90, 1270 430, 1480 390"
          fill="none"
          stroke="rgba(230,217,183,0.10)"
          strokeWidth="1"
          strokeDasharray="4 8"
        />

        <path
          ref={trailRef}
          d="M -30 220 C 310 130, 560 360, 880 210 C 1150 90, 1270 430, 1480 390"
          fill="none"
          stroke="url(#bandoTrailGrad)"
          strokeWidth="1.4"
        />

        <g ref={beaconRef} style={{ opacity: 0 }}>
          <circle r="18" fill="url(#bandoBeaconGlow)" />
          <circle r="3.5" fill="#FFFDF5" />
        </g>
      </svg>
    </div>
  );
});

export default MapAmbientBackdrop;
