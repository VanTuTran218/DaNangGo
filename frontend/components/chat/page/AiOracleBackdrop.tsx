"use client";

/**
 * AiOracleBackdrop — Celestial Nocturnal Oracle Atmosphere for /chat
 *
 * 100% GPU-composited living background for Gô AI Concierge:
 * - Deep Ocean cosmos gradient (#041017 -> #071A24) with fine starlight coordinate lattice.
 * - Soft drifting Teal, Champagne Gold & Sunset Ember atmospheric nebula orbs.
 * - Subtle architectural coastal horizon arcs & neural resonance halo.
 * - Auto-pauses when tab is hidden or prefers-reduced-motion is enabled.
 */

import React, { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

const AiOracleBackdrop = React.memo(function AiOracleBackdrop() {
  const reducedMotion = Boolean(useReducedMotion());
  const [isTabHidden, setIsTabHidden] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    setIsTabHidden(document.hidden);
    const onVisibility = () => setIsTabHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-0 overflow-hidden select-none ${
        isTabHidden || reducedMotion ? "explore-ambient-paused" : ""
      }`}
    >
      {/* Deep Ocean Celestial Cosmos Base */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 88% 58% at 50% 0%, #0E2B38 0%, #061822 48%, #040F16 100%)",
        }}
      />

      {/* Starlight Coordinate Lattice */}
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(230,217,183,0.44) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Drifting Atmospheric Nebula Orbs */}
      <div
        className="explore-orb-a absolute -top-28 left-[14%] w-[560px] h-[560px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(45,212,191,0.18) 0%, rgba(33,107,112,0.09) 46%, transparent 72%)",
        }}
      />
      <div
        className="explore-orb-b absolute top-[32%] right-[-8%] w-[620px] h-[620px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(230,217,183,0.14) 0%, rgba(232,123,57,0.07) 48%, transparent 72%)",
        }}
      />
      <div
        className="explore-orb-c absolute bottom-[-16%] left-[-8%] w-[540px] h-[540px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(232,123,57,0.12) 0%, rgba(33,107,112,0.14) 48%, transparent 72%)",
        }}
      />

      {/* Subtle Architectural Coastal Wave & Astrolabe Hairline Arcs */}
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full opacity-40"
      >
        <defs>
          <linearGradient id="oracleHorizonA" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0" />
            <stop offset="35%" stopColor="#2DD4BF" stopOpacity="0.32" />
            <stop offset="68%" stopColor="#E6D9B7" stopOpacity="0.38" />
            <stop offset="100%" stopColor="#E87B39" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="oracleHorizonB" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E6D9B7" stopOpacity="0" />
            <stop offset="50%" stopColor="#69A5A3" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0" />
          </linearGradient>
        </defs>

        <circle
          cx="720"
          cy="440"
          r="390"
          fill="none"
          stroke="rgba(230,217,183,0.07)"
          strokeWidth="1"
          strokeDasharray="4 10"
        />
        <circle
          cx="720"
          cy="440"
          r="560"
          fill="none"
          stroke="rgba(45,212,191,0.05)"
          strokeWidth="1"
        />
        <path
          d="M -40 760 C 260 640, 560 820, 860 700 C 1120 595, 1300 720, 1480 650"
          fill="none"
          stroke="url(#oracleHorizonA)"
          strokeWidth="1.2"
        />
        <path
          d="M -40 810 C 300 710, 620 865, 920 755 C 1160 665, 1340 770, 1480 710"
          fill="none"
          stroke="url(#oracleHorizonB)"
          strokeWidth="1"
          strokeDasharray="5 7"
        />
      </svg>
    </div>
  );
});

export default AiOracleBackdrop;
