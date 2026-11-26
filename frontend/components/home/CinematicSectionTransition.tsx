"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";

// ============================================================
// DANANGGO V16.0 — SEAMLESS CINEMATIC FLOW
// Lightweight, GPU-friendly, scroll-linked section transitions
// Replaces heavy fog bands with tailored coastal silhouettes &
// ORYZO-inspired Champagne Gold connecting hairlines.
// ============================================================

export type SectionTransitionVariant =
  | "editorial-to-ocean" // Travel Stories (#FAF4EA) -> Three Worlds (#102832)
  | "ocean-to-sand"; // Three Worlds (#102832) -> Travel Journal Itinerary (#F8F3E9)

interface CinematicSectionTransitionProps {
  variant: SectionTransitionVariant;
  className?: string;
}

export default function CinematicSectionTransition({
  variant,
  className = "",
}: CinematicSectionTransitionProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const linePathRef = useRef<SVGPathElement | null>(null);
  const reducedMotion = Boolean(useReducedMotion());
  const gradId = useId();
  const glowId = useId();

  const [pathLen, setPathLen] = useState(1480);
  const [dashOffset, setDashOffset] = useState(0);
  const [pinpoint, setPinpoint] = useState<{ x: number; y: number; visible: boolean }>({
    x: 720,
    y: 44,
    visible: false,
  });

  const isEditorialToOcean = variant === "editorial-to-ocean";

  // Organic coastal silhouette curve (subtle, editorial — never a template wave)
  const silhouettePath = isEditorialToOcean
    ? "M -10 54 C 260 22, 520 68, 860 36 C 1120 12, 1300 44, 1450 28 L 1450 96 L -10 96 Z"
    : "M -10 28 C 280 56, 560 16, 890 46 C 1150 68, 1310 34, 1450 48 L 1450 96 L -10 96 Z";

  // Delicate Champagne Gold contour thread riding along the coastal ridge
  const contourPath = isEditorialToOcean
    ? "M -10 54 C 260 22, 520 68, 860 36 C 1120 12, 1300 44, 1450 28"
    : "M -10 28 C 280 56, 560 16, 890 46 C 1150 68, 1310 34, 1450 48";

  // Distant atmospheric ridge behind the primary silhouette
  const farRidgePath = isEditorialToOcean
    ? "M -10 64 C 310 42, 620 16, 980 44 C 1200 60, 1340 36, 1450 42 L 1450 96 L -10 96 Z"
    : "M -10 46 C 320 20, 640 58, 990 30 C 1220 12, 1360 44, 1450 34 L 1450 96 L -10 96 Z";

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const smoothScroll = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 28,
    restDelta: 0.001,
  });

  // Gentle reversible vertical parallax for the distant ridge (10–18px)
  const farRidgeY = useTransform(
    smoothScroll,
    [0, 1],
    reducedMotion ? [0, 0] : [10, -10]
  );

  useEffect(() => {
    if (!linePathRef.current) return;
    try {
      const len = linePathRef.current.getTotalLength();
      if (len > 0) {
        setPathLen(len);
        setDashOffset(reducedMotion ? 0 : len * 0.72);
        const pt = linePathRef.current.getPointAtLength(len * 0.35);
        setPinpoint({ x: pt.x, y: pt.y, visible: !reducedMotion });
      }
    } catch {
      // Ignore in SSR
    }
  }, [contourPath, reducedMotion]);

  useMotionValueEvent(smoothScroll, "change", (latest) => {
    if (reducedMotion || !linePathRef.current || pathLen <= 0) return;
    const drawRatio = Math.max(0.18, Math.min(1, 0.15 + latest * 0.92));
    setDashOffset(pathLen * (1 - drawRatio));

    try {
      const pt = linePathRef.current.getPointAtLength(pathLen * drawRatio);
      setPinpoint({
        x: pt.x,
        y: pt.y,
        visible: latest > 0.06 && latest < 0.96,
      });
    } catch {
      // Ignore
    }
  });

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`pointer-events-none relative w-full h-14 sm:h-18 lg:h-22 overflow-hidden select-none ${className}`}
      style={{
        backgroundColor: isEditorialToOcean ? "#FAF4EA" : "#102832",
      }}
    >
      {/* Distant coastal ridge layer with subtle reversible scroll parallax */}
      <motion.svg
        style={{ y: farRidgeY }}
        viewBox="0 0 1440 96"
        fill="none"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-[118%] -top-[9%] will-change-transform"
      >
        <path
          d={farRidgePath}
          fill={isEditorialToOcean ? "#183B45" : "#E8DFD0"}
          fillOpacity={isEditorialToOcean ? "0.22" : "0.26"}
        />
      </motion.svg>

      {/* Primary organic coastal silhouette + Champagne Gold connecting line */}
      <svg
        viewBox="0 0 1440 96"
        fill="none"
        preserveAspectRatio="none"
        className="relative z-[1] w-full h-full overflow-visible"
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#C9AB78" stopOpacity="0.18" />
            <stop offset="35%" stopColor="#C9AB78" stopOpacity="0.88" />
            <stop offset="68%" stopColor="#E87B39" stopOpacity="0.78" />
            <stop offset="100%" stopColor="#C9AB78" stopOpacity="0.22" />
          </linearGradient>
          <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFDF6" stopOpacity="1" />
            <stop offset="45%" stopColor="#E87B39" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#C9AB78" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Seamless color fill matching exact target section background */}
        <path
          d={silhouettePath}
          fill={isEditorialToOcean ? "#102832" : "#F8F3E9"}
        />

        {/* Subtle dotted guide contour */}
        <path
          d={contourPath}
          stroke="#C9AB78"
          strokeOpacity="0.24"
          strokeWidth="0.9"
          strokeDasharray="4 7"
          fill="none"
        />

        {/* Scroll-drawn Champagne Gold Connecting Line */}
        <path
          ref={linePathRef}
          d={contourPath}
          stroke={`url(#${gradId})`}
          strokeWidth="1.45"
          strokeLinecap="round"
          fill="none"
          style={{
            strokeDasharray: pathLen,
            strokeDashoffset: dashOffset,
          }}
        />

        {/* Traveling Champagne Sun Pinpoint */}
        {pinpoint.visible && (
          <g transform={`translate(${pinpoint.x}, ${pinpoint.y})`}>
            <circle r="11" fill={`url(#${glowId})`} />
            <circle r="2.6" fill="#FFFDF6" />
          </g>
        )}
      </svg>
    </div>
  );
}
