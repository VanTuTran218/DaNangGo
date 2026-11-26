"use client";

/**
 * CompassReveal V11.2 — GPU-Optimized Signature Da Nang Brand Emblem Animation
 *
 * Preserves 100% of visual design: official Da Nang emblem, framing ring,
 * dashed outer orbital ring, Champagne pinpoint, and one-shot golden orbital light.
 *
 * Optimizations:
 * - Zero per-frame React setState: replaced JS cos/sin orbit state loop with pure GPU rotation.
 * - Replaced clip-path circle animation on the logo with smooth GPU opacity + subtle translateY/scale.
 * - Uses WebP (<picture> with PNG fallback), eager decode, and fixed dimensions (zero CLS).
 */

import React from "react";
import { motion } from "framer-motion";

interface CompassRevealProps {
  isReady: boolean;
  prefersReduced: boolean;
  isExiting?: boolean;
}

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
const EASE_OUT_CUBIC = [0.22, 1, 0.36, 1] as const;

const CompassReveal = React.memo(function CompassReveal({
  isReady,
  prefersReduced,
  isExiting = false,
}: CompassRevealProps) {
  const cx = 68;
  const cy = 68;
  const orbitRadius = 56;
  const circumference = 2 * Math.PI * orbitRadius; // ~351.86

  const shouldAnimate = isReady || prefersReduced;

  return (
    <motion.div
      initial={{ opacity: 1, scale: 1, y: 0 }}
      animate={
        isExiting
          ? { opacity: 0, scale: 0.94, y: -12 }
          : { opacity: 1, scale: 1, y: 0 }
      }
      transition={{
        duration: isExiting ? 0.38 : 0.5,
        ease: EASE_OUT_EXPO,
      }}
      className="relative flex items-center justify-center w-[112px] h-[112px] sm:w-[128px] sm:h-[128px] md:w-[136px] md:h-[136px]"
    >
      {/* Subtle Champagne Gold atmospheric halo behind the emblem */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute w-28 h-28 sm:w-32 sm:h-32 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(201,171,120,0.22) 0%, rgba(33,107,112,0.08) 54%, transparent 76%)",
        }}
      />

      {/* ================================================================
          STAGE 1 & STAGE 3 — SVG CIRCULAR CONSTRUCTION & GPU ORBITAL LIGHT
          ================================================================ */}
      <svg
        width="136"
        height="136"
        viewBox="0 0 136 136"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 w-full h-full z-20"
      >
        <defs>
          <linearGradient
            id="introLogoRimGrad"
            x1="12"
            y1="12"
            x2="124"
            y2="124"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#FFF8E9" stopOpacity="0.88" />
            <stop offset="50%" stopColor="#C9AB78" stopOpacity="0.82" />
            <stop offset="100%" stopColor="#69A5A3" stopOpacity="0.58" />
          </linearGradient>

          <linearGradient
            id="introLogoArcSweep"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#FFF8E9" stopOpacity="0" />
            <stop offset="50%" stopColor="#FFF8E9" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#C9AB78" stopOpacity="0" />
          </linearGradient>

          <radialGradient id="introOrbitalPinGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFF8E9" stopOpacity="1" />
            <stop offset="40%" stopColor="#C9AB78" stopOpacity="0.72" />
            <stop offset="100%" stopColor="#C9AB78" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Stage 1a: Initial central Champagne pinpoint (one-shot) */}
        {!prefersReduced && (
          <motion.g
            initial={{ scale: 0, opacity: 0 }}
            animate={
              shouldAnimate
                ? { scale: [0, 1.3, 0.4], opacity: [0, 1, 0] }
                : { scale: 0, opacity: 0 }
            }
            transition={{ duration: 0.42, delay: 0.02, ease: "easeOut" }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          >
            <circle cx={cx} cy={cy} r="11" fill="url(#introOrbitalPinGlow)" />
            <circle cx={cx} cy={cy} r="3.2" fill="#FFF8E9" />
          </motion.g>
        )}

        {/* Outer decorative dashed orbital ring */}
        <motion.circle
          cx={cx}
          cy={cy}
          r="63"
          stroke="#C9AB78"
          strokeWidth="0.75"
          strokeOpacity="0.32"
          strokeDasharray="5 8"
          initial={prefersReduced ? { opacity: 0.32 } : { opacity: 0 }}
          animate={shouldAnimate ? { opacity: 0.32 } : { opacity: 0 }}
          transition={{ duration: 0.55, delay: prefersReduced ? 0 : 0.12 }}
        />

        {/* Stage 1b: Primary thin framing circle drawn around the logo */}
        <motion.circle
          cx={cx}
          cy={cy}
          r={orbitRadius}
          stroke="url(#introLogoRimGrad)"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={
            prefersReduced
              ? { strokeDashoffset: 0, opacity: 0.9 }
              : { strokeDashoffset: circumference, opacity: 0 }
          }
          animate={
            shouldAnimate
              ? { strokeDashoffset: 0, opacity: 0.9 }
              : { strokeDashoffset: circumference, opacity: 0 }
          }
          transition={{
            duration: prefersReduced ? 0 : 0.56,
            delay: prefersReduced ? 0 : 0.04,
            ease: EASE_OUT_CUBIC,
          }}
          style={{
            transformOrigin: `${cx}px ${cy}px`,
            transform: "rotate(-90deg)",
          }}
        />

        {/* Stage 3a: Subtle golden arc trail accompanying the orbital pinpoint */}
        {!prefersReduced && (
          <motion.circle
            cx={cx}
            cy={cy}
            r={orbitRadius}
            stroke="url(#introLogoArcSweep)"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeDasharray={`52 ${circumference}`}
            initial={{ strokeDashoffset: circumference, opacity: 0 }}
            animate={
              shouldAnimate
                ? {
                    strokeDashoffset: [circumference, 0],
                    opacity: [0, 0.95, 0],
                  }
                : { strokeDashoffset: circumference, opacity: 0 }
            }
            transition={{
              duration: 0.65,
              delay: 0.72,
              ease: EASE_OUT_CUBIC,
            }}
            style={{
              transformOrigin: `${cx}px ${cy}px`,
              transform: "rotate(-90deg)",
            }}
          />
        )}

        {/* Stage 3b: Golden Orbital Light pinpoint — pure GPU rotation (0 JS frames, 0 re-renders) */}
        {!prefersReduced && (
          <motion.g
            initial={{ rotate: 0, opacity: 0 }}
            animate={
              shouldAnimate
                ? {
                    rotate: 360,
                    opacity: [0, 1, 1, 0],
                  }
                : { rotate: 0, opacity: 0 }
            }
            transition={{
              duration: 0.65,
              delay: 0.72,
              ease: EASE_OUT_CUBIC,
              opacity: {
                duration: 0.65,
                delay: 0.72,
                times: [0, 0.08, 0.9, 1],
              },
            }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          >
            <circle
              cx={cx}
              cy={cy - orbitRadius}
              r="11"
              fill="url(#introOrbitalPinGlow)"
            />
            <circle cx={cx} cy={cy - orbitRadius} r="2.6" fill="#FFF8E9" />
          </motion.g>
        )}
      </svg>

      {/* ================================================================
          STAGE 2 — DA NANG LOGO REVEAL (Pure GPU opacity + subtle translateY/scale)
          Zero clip-path repaint, zero layout shift, zero flicker
          ================================================================ */}
      <motion.div
        initial={
          prefersReduced
            ? { opacity: 1, y: 0, scale: 1 }
            : { opacity: 0, y: 8, scale: 0.94 }
        }
        animate={
          shouldAnimate
            ? { opacity: 1, y: 0, scale: 1 }
            : { opacity: 0, y: 8, scale: 0.94 }
        }
        transition={{
          duration: prefersReduced ? 0 : 0.65,
          delay: prefersReduced ? 0 : 0.24,
          ease: EASE_OUT_EXPO,
        }}
        className="relative z-10 w-[82px] h-[82px] sm:w-[94px] sm:h-[94px] md:w-[100px] md:h-[100px] flex items-center justify-center"
      >
        <picture className="w-full h-full flex items-center justify-center">
          <source srcSet="/images/branding/danang-logo.webp" type="image/webp" />
          <img
            src="/images/branding/danang-logo.png"
            alt="Biểu trưng Đà Nẵng"
            width={100}
            height={100}
            loading="eager"
            decoding="sync"
            fetchPriority="high"
            className="w-full h-full object-contain select-none"
          />
        </picture>
      </motion.div>
    </motion.div>
  );
});

export default CompassReveal;
