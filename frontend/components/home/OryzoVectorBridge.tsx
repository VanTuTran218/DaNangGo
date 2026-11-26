"use client";

/**
 * OryzoVectorBridge V10.0 — Seamless Golden Journey Wave & SVG Point-at-Length Traveler
 *
 * Connects consecutive sections in the Golden Coastal Journey:
 * - "ivory-to-sand": Transition from Horizontal Destination Gallery into Weekend Events
 * - "sand-to-ivory": Seamless mid-journey wave crest between Weekend Events and Travel Stories
 *
 * Uses SVG `getTotalLength()` and `getPointAtLength()` driven by scroll progress so the
 * luminous golden sun pinpoint travels along the exact Bézier wave curve in both forward
 * and reverse scroll directions.
 */

import React, { useRef, useState, useEffect } from "react";
import {
  useScroll,
  useSpring,
  useReducedMotion,
  useMotionValueEvent,
} from "framer-motion";

interface OryzoVectorBridgeProps {
  variant?: "ivory-to-sand" | "sand-to-ivory";
  label?: string;
}

export default function OryzoVectorBridge({
  variant = "ivory-to-sand",
}: OryzoVectorBridgeProps) {
  const bridgeRef = useRef<HTMLDivElement>(null);
  const crestPathRef = useRef<SVGPathElement>(null);
  const reducedMotion = useReducedMotion();

  const [pathLen, setPathLen] = useState(1520);
  const [dashOffset, setDashOffset] = useState(0);
  const [pinpoint, setPinpoint] = useState<{ x: number; y: number }>({
    x: 590,
    y: 82,
  });

  useEffect(() => {
    if (crestPathRef.current) {
      try {
        const len = crestPathRef.current.getTotalLength();
        if (len > 0) {
          setPathLen(len);
          const pt = crestPathRef.current.getPointAtLength(len * 0.41);
          setPinpoint({ x: pt.x, y: pt.y });
        }
      } catch {
        // Fallback default
      }
    }
  }, []);

  const { scrollYProgress: rawProgress } = useScroll({
    target: bridgeRef,
    offset: ["start 92%", "end 14%"],
  });

  const smoothProgress = useSpring(rawProgress, {
    stiffness: 180,
    damping: 32,
    mass: 0.35,
    restDelta: 0.0005,
  });

  useMotionValueEvent(smoothProgress, "change", (latest) => {
    if (!crestPathRef.current || pathLen <= 0) return;
    const clamped = Math.max(0, Math.min(1, latest));
    const drawRatio = reducedMotion
      ? 1
      : Math.max(0.25, Math.min(1, 0.25 + clamped * 0.75));
    setDashOffset(pathLen * (1 - drawRatio));

    // Move the glowing sun pinpoint along the central wave segment (30% -> 56% of path length)
    const pointRatio = reducedMotion ? 0.41 : 0.3 + clamped * 0.26;
    try {
      const pt = crestPathRef.current.getPointAtLength(pathLen * pointRatio);
      setPinpoint({ x: pt.x, y: pt.y });
    } catch {
      // Ignore if unmounted
    }
  });

  const isIvoryToSand = variant === "ivory-to-sand";

  return (
    <div
      ref={bridgeRef}
      aria-hidden="true"
      className="pointer-events-none relative w-full h-16 sm:h-20 lg:h-24 overflow-hidden select-none"
      style={{
        background: isIvoryToSand
          ? "linear-gradient(180deg, #F8F8F4 0%, #F8F2E8 100%)"
          : "transparent",
      }}
    >
      {/* Warm golden horizon glow behind the wave crest */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 48% 80% at 44% 58%, rgba(234,180,125,0.30) 0%, rgba(203,113,45,0.10) 45%, transparent 78%)",
        }}
      />

      <svg
        viewBox="0 0 1440 144"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        <defs>
          {/* Upper soft warm dune silhouette gradient */}
          <linearGradient
            id={`mountainBack-${variant}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#E8D9C6" stopOpacity="0.52" />
            <stop offset="45%" stopColor="#E2CEB6" stopOpacity="0.78" />
            <stop offset="100%" stopColor="#DBC2A6" stopOpacity="0.68" />
          </linearGradient>

          {/* Lower foreground wave blending smoothly into the next section */}
          <linearGradient
            id={`mountainFront-${variant}`}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#EFE5D6" stopOpacity="0.88" />
            <stop
              offset="100%"
              stopColor={isIvoryToSand ? "#F8F2E8" : "#FAF4EA"}
              stopOpacity="1"
            />
          </linearGradient>

          {/* Luminous Champagne Gold & Pearl Cream wave crest stroke */}
          <linearGradient
            id={`crestStroke-${variant}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#E8D9C6" stopOpacity="0.35" />
            <stop offset="28%" stopColor="#FFF9EF" stopOpacity="0.92" />
            <stop offset="42%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="58%" stopColor="#EAB47D" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#C9AB78" stopOpacity="0.48" />
          </linearGradient>

          {/* Radiant sun pinpoint halo */}
          <radialGradient
            id={`sunPinpointGlow-${variant}`}
            cx="50%"
            cy="50%"
            r="50%"
          >
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="28%" stopColor="#FFF9EF" stopOpacity="0.95" />
            <stop offset="62%" stopColor="#EAB47D" stopOpacity="0.42" />
            <stop offset="100%" stopColor="#CB712D" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Distant right-side mountain rise */}
        <path
          d="M 540 94 C 780 96, 1020 42, 1270 30 C 1350 26, 1405 30, 1440 36 L 1440 144 L 540 144 Z"
          fill={`url(#mountainBack-${variant})`}
        />

        {/* Sweeping foreground coastal dune wave from left to right */}
        <path
          d="M -20 26 C 170 28, 390 66, 610 84 C 855 104, 1135 90, 1460 34 L 1460 144 L -20 144 Z"
          fill={`url(#mountainFront-${variant})`}
        />

        {/* Delicate circular orbit ring intersecting on the right side */}
        <circle
          cx="1190"
          cy="190"
          r="210"
          stroke="#C9AB78"
          strokeWidth="0.95"
          strokeOpacity="0.58"
        />

        {/* Secondary subtle golden horizon thread */}
        <path
          d="M 560 92 C 810 92, 1060 40, 1440 34"
          stroke="#C9AB78"
          strokeWidth="0.85"
          strokeOpacity="0.55"
        />

        {/* Primary luminous Champagne Gold & Pearl Cream S-curve crest */}
        <path
          ref={crestPathRef}
          d="M -20 26 C 170 28, 390 66, 610 84 C 855 104, 1135 90, 1460 34"
          stroke={`url(#crestStroke-${variant})`}
          strokeWidth="1.65"
          strokeLinecap="round"
          strokeDasharray={pathLen}
          strokeDashoffset={reducedMotion ? 0 : dashOffset}
        />

        {/* Exact getPointAtLength Glowing Sun Pinpoint resting right on the curve */}
        <g transform={`translate(${pinpoint.x}, ${pinpoint.y})`}>
          <circle
            cx="0"
            cy="0"
            r="26"
            fill={`url(#sunPinpointGlow-${variant})`}
          />
          <ellipse
            cx="0"
            cy="0"
            rx="22"
            ry="2.2"
            fill="#FFF9EF"
            fillOpacity="0.82"
          />
          <circle cx="0" cy="0" r="3.5" fill="#FFFFFF" />
        </g>
      </svg>
    </div>
  );
}
