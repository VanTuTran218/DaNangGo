"use client";

/**
 * CulinaryAmbientBackdrop — Nocturnal Gastronomy Backdrop for /amthuc
 *
 * Michelin Dark Edition × Coastal Da Nang night-market atmosphere (60fps GPU-only):
 * - Deep Ocean twilight base (#06151C -> #051219) with subtle celestial dot texture.
 * - Dynamic spice & coastal mood spotlights crossfading with active dish category.
 * - Scroll-drawn luminous Champagne/Ember aroma ribbon & gliding spark via direct DOM refs
 *   and 64-pt LUT (0 React re-renders during scroll).
 * - Ghosted serif "VỊ GIÁC ĐÀ NẴNG" parallax watermark & auto-pause on hidden tab / reduced motion.
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

interface CulinaryAmbientBackdropProps {
  activeCategory: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

const SAMPLE_COUNT = 64;
const DEFAULT_PATH_LEN = 2300;

const DISH_MOOD_ORBS: Record<
  string,
  { orbA: string; orbB: string; orbC: string }
> = {
  "Tất cả": {
    orbA: "radial-gradient(circle, rgba(232,123,57,0.20) 0%, rgba(201,181,128,0.09) 46%, transparent 72%)",
    orbB: "radial-gradient(circle, rgba(33,107,112,0.26) 0%, rgba(15,76,92,0.10) 48%, transparent 72%)",
    orbC: "radial-gradient(circle, rgba(201,181,128,0.14) 0%, rgba(232,123,57,0.06) 46%, transparent 72%)",
  },
  "Hải sản": {
    orbA: "radial-gradient(circle, rgba(45,212,191,0.20) 0%, rgba(33,107,112,0.10) 46%, transparent 72%)",
    orbB: "radial-gradient(circle, rgba(201,181,128,0.16) 0%, transparent 70%)",
    orbC: "radial-gradient(circle, rgba(232,123,57,0.14) 0%, transparent 70%)",
  },
  "Mì Quảng": {
    orbA: "radial-gradient(circle, rgba(245,158,11,0.22) 0%, rgba(232,123,57,0.10) 46%, transparent 72%)",
    orbB: "radial-gradient(circle, rgba(33,107,112,0.22) 0%, transparent 70%)",
    orbC: "radial-gradient(circle, rgba(201,181,128,0.16) 0%, transparent 70%)",
  },
  "Bánh xèo": {
    orbA: "radial-gradient(circle, rgba(232,123,57,0.24) 0%, rgba(245,158,11,0.10) 46%, transparent 72%)",
    orbB: "radial-gradient(circle, rgba(201,181,128,0.16) 0%, transparent 70%)",
    orbC: "radial-gradient(circle, rgba(33,107,112,0.20) 0%, transparent 70%)",
  },
  "Bánh tráng cuốn": {
    orbA: "radial-gradient(circle, rgba(244,63,94,0.18) 0%, rgba(232,123,57,0.09) 46%, transparent 72%)",
    orbB: "radial-gradient(circle, rgba(33,107,112,0.24) 0%, transparent 70%)",
    orbC: "radial-gradient(circle, rgba(201,181,128,0.15) 0%, transparent 70%)",
  },
  "Bún chả cá": {
    orbA: "radial-gradient(circle, rgba(56,189,248,0.18) 0%, rgba(33,107,112,0.09) 46%, transparent 72%)",
    orbB: "radial-gradient(circle, rgba(232,123,57,0.16) 0%, transparent 70%)",
    orbC: "radial-gradient(circle, rgba(201,181,128,0.14) 0%, transparent 70%)",
  },
  "Cà phê": {
    orbA: "radial-gradient(circle, rgba(217,119,6,0.20) 0%, rgba(201,181,128,0.10) 46%, transparent 72%)",
    orbB: "radial-gradient(circle, rgba(33,107,112,0.22) 0%, transparent 70%)",
    orbC: "radial-gradient(circle, rgba(244,114,182,0.12) 0%, transparent 70%)",
  },
  "Cơm nhà": {
    orbA: "radial-gradient(circle, rgba(201,181,128,0.22) 0%, rgba(232,123,57,0.09) 46%, transparent 72%)",
    orbB: "radial-gradient(circle, rgba(33,107,112,0.24) 0%, transparent 70%)",
    orbC: "radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)",
  },
};

const CulinaryAmbientBackdrop = React.memo(function CulinaryAmbientBackdrop({
  activeCategory,
  containerRef,
}: CulinaryAmbientBackdropProps) {
  const reducedMotion = Boolean(useReducedMotion());
  const [isTabHidden, setIsTabHidden] = useState(false);

  const ribbonRef = useRef<SVGPathElement>(null);
  const emberRef = useRef<SVGGElement>(null);
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
    const pathEl = ribbonRef.current;
    const emberEl = emberRef.current;
    if (!pathEl || !emberEl) return;

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
      emberEl.setAttribute(
        "transform",
        `translate(${xs[idx].toFixed(1)}, ${ys[idx].toFixed(1)})`
      );
      emberEl.style.opacity = "1";
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
    const pathEl = ribbonRef.current;
    const emberEl = emberRef.current;
    const lut = lutRef.current;
    if (!pathEl || !emberEl || !lut.ready) return;

    const clamped = Math.max(0.05, Math.min(0.98, 0.06 + latest * 0.92));
    pathEl.style.strokeDashoffset = `${(lut.total * (1 - clamped)).toFixed(2)}`;

    const fIdx = clamped * SAMPLE_COUNT;
    const i0 = Math.min(SAMPLE_COUNT - 1, Math.floor(fIdx));
    const frac = fIdx - i0;
    const x = lut.xs[i0] + (lut.xs[i0 + 1] - lut.xs[i0]) * frac;
    const y = lut.ys[i0] + (lut.ys[i0 + 1] - lut.ys[i0]) * frac;
    emberEl.setAttribute("transform", `translate(${x.toFixed(1)}, ${y.toFixed(1)})`);
  });

  const mood = DISH_MOOD_ORBS[activeCategory] ?? DISH_MOOD_ORBS["Tất cả"];

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
            "radial-gradient(ellipse 85% 55% at 50% 0%, #0E2833 0%, #071922 48%, #051219 100%)",
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
        className="explore-orb-b absolute top-[38%] left-[-10%] w-[620px] h-[620px] rounded-full transition-all duration-700"
        style={{ background: mood.orbB }}
      />
      <div
        className="explore-orb-c absolute bottom-[-12%] right-[12%] w-[540px] h-[540px] rounded-full transition-all duration-700"
        style={{ background: mood.orbC }}
      />

      <motion.div
        style={{ y: watermarkY }}
        className="hidden lg:flex absolute top-[18%] inset-x-0 justify-center opacity-[0.03]"
      >
        <span className="home-serif italic text-[13.5vw] font-normal tracking-[0.08em] text-[#E6D9B7] whitespace-nowrap">
          VỊ GIÁC ĐÀ NẴNG
        </span>
      </motion.div>

      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full opacity-55"
      >
        <defs>
          <linearGradient id="culinaryRibbonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E6D9B7" stopOpacity="0.14" />
            <stop offset="50%" stopColor="#E6D9B7" stopOpacity="0.58" />
            <stop offset="100%" stopColor="#E87B39" stopOpacity="0.52" />
          </linearGradient>
          <radialGradient id="culinaryEmberGlow">
            <stop offset="0%" stopColor="#FFFDF5" stopOpacity="0.95" />
            <stop offset="40%" stopColor="#E87B39" stopOpacity="0.62" />
            <stop offset="100%" stopColor="#E87B39" stopOpacity="0" />
          </radialGradient>
        </defs>

        <path
          d="M -30 180 C 290 290, 520 75, 840 235 C 1130 375, 1220 555, 1480 465"
          fill="none"
          stroke="rgba(230,217,183,0.10)"
          strokeWidth="1"
          strokeDasharray="4 8"
        />

        <path
          ref={ribbonRef}
          d="M -30 180 C 290 290, 520 75, 840 235 C 1130 375, 1220 555, 1480 465"
          fill="none"
          stroke="url(#culinaryRibbonGrad)"
          strokeWidth="1.4"
        />

        <g ref={emberRef} style={{ opacity: 0 }}>
          <circle r="18" fill="url(#culinaryEmberGlow)" />
          <circle r="3.5" fill="#FFFDF5" />
        </g>
      </svg>
    </div>
  );
});

export default CulinaryAmbientBackdrop;
