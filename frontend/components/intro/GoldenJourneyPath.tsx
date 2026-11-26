"use client";

/**
 * GoldenJourneyPath V11.2 — Zero-Re-Render Champagne Gold Bézier Light Thread
 *
 * Preserves the exact coastal S-curve, orbital compass ring, dashed contour thread,
 * and luminous traveling pinpoint — while eliminating all 60fps React setState calls
 * and per-frame SVG `getPointAtLength()` queries:
 * - Pre-samples a 64-point lookup table once when ready.
 * - Mutates SVG strokeDashoffset and pinpoint transform directly on refs.
 * - Pauses cleanly when tab is hidden and stops immediately on exit.
 */

import React, { useEffect, useRef } from "react";
import { animate, useMotionValue, type AnimationPlaybackControls } from "framer-motion";

interface GoldenJourneyPathProps {
  isReady: boolean;
  isPaused?: boolean;
  prefersReduced: boolean;
  isExiting?: boolean;
}

const SAMPLE_COUNT = 64;
const DEFAULT_PATH_LEN = 1840;

const GoldenJourneyPath = React.memo(function GoldenJourneyPath({
  isReady,
  isPaused = false,
  prefersReduced,
  isExiting = false,
}: GoldenJourneyPathProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const pinpointRef = useRef<SVGGElement>(null);
  const progress = useMotionValue(prefersReduced ? 1 : 0);
  const controlsRef = useRef<AnimationPlaybackControls | null>(null);
  const startedRef = useRef(false);

  // Tạm dừng hoặc tiếp tục animation khi tab chuyển trạng thái
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    if (isPaused || isExiting) {
      controls.pause();
    } else if (progress.get() < 1) {
      controls.play();
    }
  }, [isPaused, isExiting, progress]);

  useEffect(() => {
    const pathEl = pathRef.current;
    const pinpointEl = pinpointRef.current;
    if (!pathEl || !pinpointEl) return;

    let total = DEFAULT_PATH_LEN;
    try {
      const measured = pathEl.getTotalLength();
      if (measured > 0) total = measured;
    } catch {
      // Fallback
    }

    pathEl.style.strokeDasharray = `${total}`;

    if (prefersReduced) {
      pathEl.style.strokeDashoffset = "0";
      try {
        const pt = pathEl.getPointAtLength(total * 0.68);
        pinpointEl.setAttribute("transform", `translate(${pt.x.toFixed(1)}, ${pt.y.toFixed(1)})`);
        pinpointEl.style.opacity = "1";
      } catch {
        // Ignore
      }
      return;
    }

    if (!isReady) {
      pathEl.style.strokeDashoffset = `${total}`;
      pinpointEl.style.opacity = "0";
      return;
    }

    if (startedRef.current) return;
    startedRef.current = true;

    // Pre-sample lookup table 1 lần duy nhất (tránh gọi getPointAtLength mỗi khung hình)
    const lutX = new Float32Array(SAMPLE_COUNT + 1);
    const lutY = new Float32Array(SAMPLE_COUNT + 1);
    let hasLut = true;
    try {
      for (let i = 0; i <= SAMPLE_COUNT; i++) {
        const pt = pathEl.getPointAtLength((total * i) / SAMPLE_COUNT);
        lutX[i] = pt.x;
        lutY[i] = pt.y;
      }
    } catch {
      hasLut = false;
    }

    pathEl.style.strokeDashoffset = `${total}`;
    pinpointEl.style.opacity = "0";

    const unsubscribe = progress.on("change", (val) => {
      const clamped = Math.max(0, Math.min(1, val));
      pathEl.style.strokeDashoffset = `${(total * (1 - clamped)).toFixed(2)}`;

      if (!hasLut) return;
      const visible = clamped > 0.01 && clamped < 0.99;
      pinpointEl.style.opacity = visible ? "1" : "0";
      if (!visible) return;

      const fIdx = clamped * SAMPLE_COUNT;
      const i0 = Math.min(SAMPLE_COUNT - 1, Math.floor(fIdx));
      const frac = fIdx - i0;
      const x = lutX[i0] + (lutX[i0 + 1] - lutX[i0]) * frac;
      const y = lutY[i0] + (lutY[i0 + 1] - lutY[i0]) * frac;
      pinpointEl.setAttribute("transform", `translate(${x.toFixed(1)}, ${y.toFixed(1)})`);
    });

    const controls = animate(progress, 1, {
      duration: 1.55,
      delay: 0.18,
      ease: [0.22, 1, 0.36, 1],
    });
    controlsRef.current = controls;

    return () => {
      unsubscribe();
      controls.stop();
      controlsRef.current = null;
    };
  }, [isReady, prefersReduced, progress]);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 z-10 overflow-hidden select-none transition-opacity duration-500 ${
        isExiting ? "opacity-0" : "opacity-100"
      }`}
    >
      <svg
        viewBox="0 0 1600 900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="introJourneyStroke" x1="0%" y1="50%" x2="100%" y2="35%">
            <stop offset="0%" stopColor="#C9AB78" stopOpacity="0" />
            <stop offset="22%" stopColor="#C9AB78" stopOpacity="0.42" />
            <stop offset="52%" stopColor="#FFF8E9" stopOpacity="0.72" />
            <stop offset="78%" stopColor="#C9AB78" stopOpacity="0.48" />
            <stop offset="100%" stopColor="#C9AB78" stopOpacity="0" />
          </linearGradient>

          <radialGradient id="introPinpointHalo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFF8E9" stopOpacity="1" />
            <stop offset="35%" stopColor="#C9AB78" stopOpacity="0.72" />
            <stop offset="100%" stopColor="#C9AB78" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Low-contrast orbital compass ring in the background */}
        <circle
          cx="800"
          cy="450"
          r="335"
          stroke="#C9AB78"
          strokeWidth="0.75"
          strokeOpacity="0.14"
        />

        {/* Secondary subtle coastal contour thread */}
        <path
          d="M -60 610 C 310 680, 560 440, 820 460 C 1090 480, 1290 310, 1660 355"
          stroke="#C9AB78"
          strokeWidth="0.75"
          strokeOpacity="0.16"
          strokeDasharray="4 8"
        />

        {/* Primary Golden Journey Path (1.25px Champagne Gold curve) */}
        <path
          ref={pathRef}
          d="M -80 575 C 260 645, 510 355, 800 395 C 1085 435, 1310 245, 1680 295"
          stroke="url(#introJourneyStroke)"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeDasharray={DEFAULT_PATH_LEN}
          strokeDashoffset={prefersReduced ? 0 : DEFAULT_PATH_LEN}
        />

        {/* Luminous traveling pinpoint strictly locked to path coordinates (updated directly via ref) */}
        <g ref={pinpointRef} style={{ opacity: 0 }}>
          <circle cx="0" cy="0" r="18" fill="url(#introPinpointHalo)" />
          <circle cx="0" cy="0" r="2.8" fill="#FFF8E9" />
        </g>
      </svg>
    </div>
  );
});

export default GoldenJourneyPath;
