"use client";

/**
 * CinematicMotion V3.0 — White Desert Inspired Creative Motion Architecture for DANANGGO
 *
 * Includes:
 * 1. CinematicImageMask — 7 mask variants (vertical, vertical-down, horizontal-left, horizontal-right, expand, editorial-window, organic-cloud)
 * 2. ScrollImageExpansion — Scroll-synchronized image expansion from editorial window (58–68%) to full-bleed (100%) with reverse scrub
 * 3. LineReveal & WordReveal — Vietnamese diacritic-safe masked typography reveals
 * 4. HairlineExpand — Architectural 1px line draw (0% -> 100%)
 * 5. CloudRevealTransition — 3-Layer Signature Cloud & Sea Mist flight transition (Cloud Layer A, B, C)
 * 6. SectionMistBridge — Seamless section morphing & atmospheric continuity between light and dark chapters
 * 7. MouseDepthParallax — Damped desktop cursor-responsive 2.5D depth interaction (disabled on touch/mobile/reduced-motion)
 */

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  motion,
  useInView,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";
import { DURATION, EASING } from "@/lib/motion-tokens";

// ── 1. CINEMATIC IMAGE MASK SYSTEM (7 VARIANTS — SECTION 15) ─────────────────
export type ImageMaskVariant =
  | "vertical"
  | "vertical-down"
  | "horizontal-left"
  | "horizontal-right"
  | "expand"
  | "editorial-window"
  | "organic-cloud";

interface CinematicImageMaskProps {
  children: React.ReactNode;
  direction?: ImageMaskVariant;
  duration?: number;
  delay?: number;
  className?: string;
  innerClassName?: string;
}

export function CinematicImageMask({
  children,
  direction = "vertical",
  duration = DURATION.editorial,
  delay = 0,
  className = "",
  innerClassName = "w-full h-full",
}: CinematicImageMaskProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const isInView = useInView(ref, {
    once: true,
    margin: "80px 0px 40px 0px",
    amount: 0.05,
  });

  if (reducedMotion) {
    return (
      <div ref={ref} className={`relative overflow-hidden ${className}`}>
        <div className={innerClassName}>{children}</div>
      </div>
    );
  }

  // Safe initial clip-path: never 100% clipped so images are always visible even before IntersectionObserver fires
  const getInitialClip = () => {
    switch (direction) {
      case "vertical":
        return "inset(14% 0% 0% 0%)";
      case "vertical-down":
        return "inset(0% 0% 14% 0%)";
      case "horizontal-left":
        return "inset(0% 14% 0% 0%)";
      case "horizontal-right":
        return "inset(0% 0% 0% 14%)";
      case "expand":
        return "inset(10% 12% 10% 12%)";
      case "editorial-window":
        return "inset(6% 8% 6% 8% round 4px)";
      case "organic-cloud":
        return "inset(16% 4% 8% 4% round 8px)";
      default:
        return "inset(12% 0% 0% 0%)";
    }
  };

  const getFinalClip = () => {
    if (direction === "editorial-window" || direction === "organic-cloud") {
      return "inset(0% 0% 0% 0% round 4px)";
    }
    return "inset(0% 0% 0% 0%)";
  };

  return (
    <motion.div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      initial={{ clipPath: getInitialClip(), opacity: 0.92 }}
      animate={{
        clipPath: isInView ? getFinalClip() : getInitialClip(),
        opacity: 1,
      }}
      transition={{
        duration,
        delay,
        ease: EASING.entrance,
      }}
    >
      <motion.div
        className={innerClassName}
        initial={{
          scale: direction === "editorial-window" ? 1.08 : 1.06,
          y: direction === "editorial-window" ? 10 : 0,
        }}
        animate={{
          scale: isInView ? 1 : direction === "editorial-window" ? 1.08 : 1.06,
          y: isInView ? 0 : direction === "editorial-window" ? 10 : 0,
        }}
        transition={{
          duration: duration * 1.15,
          delay,
          ease: EASING.entrance,
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

// ── 2. SCROLL-SYNCHRONIZED CINEMATIC IMAGE EXPANSION (SECTION 12) ────────────
interface ScrollImageExpansionProps {
  children: React.ReactNode;
  overlayContent?: React.ReactNode;
  caption?: string;
  coordinates?: string;
  className?: string;
}

export function ScrollImageExpansion({
  children,
  overlayContent,
  caption,
  coordinates = "16°06'42\"N · 108°15'58\"E // SON TRA PENINSULA",
  className = "",
}: ScrollImageExpansionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 88%", "center 38%"],
  });

  // Progress 0% -> 25% -> 50% -> 75% -> 100% clip-path expansion (GPU/Composite safe, no width/height layout thrash)
  const clipPath = useTransform(
    scrollYProgress,
    [0, 0.25, 0.5, 0.75, 1],
    reducedMotion || !isDesktop
      ? [
          "inset(0% 0% 0% 0% round 4px)",
          "inset(0% 0% 0% 0% round 4px)",
          "inset(0% 0% 0% 0% round 4px)",
          "inset(0% 0% 0% 0% round 4px)",
          "inset(0% 0% 0% 0% round 4px)",
        ]
      : [
          "inset(6% 18% 6% 18% round 4px)",
          "inset(4% 12% 4% 12% round 4px)",
          "inset(2% 5% 2% 5% round 4px)",
          "inset(0.5% 1.5% 0.5% 1.5% round 2px)",
          "inset(0% 0% 0% 0% round 0px)",
        ]
  );

  // Inner camera pull-back & dolly as the frame opens
  const innerScale = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    reducedMotion ? [1, 1, 1] : [1.14, 1.06, 1.0]
  );

  const innerY = useTransform(
    scrollYProgress,
    [0, 1],
    reducedMotion || !isDesktop ? ["0%", "0%"] : ["-4%", "4%"]
  );

  const overlayOpacity = useTransform(
    scrollYProgress,
    [0, 0.45, 0.78, 1],
    reducedMotion ? [1, 1, 1, 1] : [0, 0.25, 0.85, 1]
  );

  const overlayY = useTransform(
    scrollYProgress,
    [0, 0.55, 1],
    reducedMotion ? [0, 0, 0] : [24, 12, 0]
  );

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Top technical header bar above expanding frame */}
      <div className="home-container mb-3 flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.2em] text-[#4E5E63]">
        <span>{coordinates}</span>
        <span>SCROLL TO EXPAND EXPEDITION VIEW</span>
      </div>

      <motion.div
        style={{ clipPath }}
        className="relative w-full h-[54vh] sm:h-[64vh] lg:h-[76vh] overflow-hidden bg-[#102832]"
      >
        <motion.div
          style={{ scale: innerScale, y: innerY }}
          className="relative w-full h-[110%] -top-[5%]"
        >
          {children}
        </motion.div>

        {/* Subtle editorial vignette */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(16,40,50,0.28) 0%, rgba(16,40,50,0.08) 42%, rgba(16,40,50,0.78) 100%)",
          }}
        />

        {/* Progressive overlay reveal at 50%–100% expansion */}
        {(overlayContent || caption) && (
          <motion.div
            style={{ opacity: overlayOpacity, y: overlayY }}
            className="absolute inset-x-0 bottom-0 z-10 p-6 sm:p-10 lg:p-14"
          >
            <div className="home-container">
              {overlayContent}
              {caption && (
                <p className="home-serif italic text-[#F8F8F4]/90 text-base sm:text-xl max-w-2xl mt-2">
                  {caption}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

// ── 3. EDITORIAL HAIRLINE EXPAND (0% -> 100%) ────────────────────────────────
interface HairlineExpandProps {
  className?: string;
  delay?: number;
  duration?: number;
  colorClass?: string;
}

export function HairlineExpand({
  className = "",
  delay = 0.1,
  duration = 0.95,
  colorClass = "bg-[#DEDAD2]",
}: HairlineExpandProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const isInView = useInView(ref, { once: true, margin: "0px 0px -20px 0px" });

  if (reducedMotion) {
    return (
      <div
        ref={ref}
        aria-hidden="true"
        className={`h-[1px] w-full ${colorClass} ${className}`}
      />
    );
  }

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`w-full overflow-hidden ${className}`}
    >
      <motion.div
        className={`h-[1px] w-full origin-left ${colorClass}`}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: isInView ? 1 : 0 }}
        transition={{
          duration,
          delay,
          ease: EASING.entrance,
        }}
      />
    </div>
  );
}

// ── 4. VIETNAMESE-SAFE LINE REVEAL & TYPOGRAPHY LIGHT SWEEP (SECTION 08 & 09) ──
interface LineRevealProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  shimmer?: "none" | "light" | "dark" | "gold";
}

export function LineReveal({
  children,
  delay = 0,
  duration = 0.85,
  className = "",
  shimmer = "none",
}: LineRevealProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reducedMotion = useReducedMotion();
  const isInView = useInView(ref, { once: true, margin: "40px 0px -10px 0px" });
  const [shimmerActive, setShimmerActive] = useState(false);

  useEffect(() => {
    if (!isInView || reducedMotion || shimmer === "none") return;
    // Trigger one-shot light sweep right as line mask reveal settles (Phần 08.2 & 09)
    const timer = setTimeout(() => {
      setShimmerActive(true);
    }, Math.round((delay + duration * 0.72) * 1000));
    return () => clearTimeout(timer);
  }, [isInView, reducedMotion, shimmer, delay, duration]);

  const shimmerClass =
    shimmer === "light"
      ? `text-shimmer-light ${shimmerActive ? "is-shimmering" : ""}`
      : shimmer === "dark"
      ? `text-shimmer-dark ${shimmerActive ? "is-shimmering" : ""}`
      : shimmer === "gold"
      ? `text-shimmer-gold ${shimmerActive ? "is-shimmering" : ""}`
      : "";

  if (reducedMotion) {
    return <span className={`block ${className}`}>{children}</span>;
  }

  return (
    <span
      ref={ref}
      className={`block overflow-hidden py-[0.14em] -my-[0.06em] ${className}`}
    >
      <motion.span
        className={`block ${shimmerClass}`}
        initial={{ y: "75%", opacity: 0 }}
        animate={isInView ? { y: "0%", opacity: 1 } : { y: "75%", opacity: 0 }}
        transition={{
          duration,
          delay,
          ease: EASING.entrance,
        }}
      >
        {children}
      </motion.span>
    </span>
  );
}

interface WordRevealProps {
  text: string;
  delay?: number;
  stagger?: number;
  className?: string;
}

export function WordReveal({
  text,
  delay = 0,
  stagger = 0.04,
  className = "",
}: WordRevealProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reducedMotion = useReducedMotion();
  const isInView = useInView(ref, { once: true, margin: "10px 0px -20px 0px" });

  if (reducedMotion) {
    return <span className={className}>{text}</span>;
  }

  const words = text.split(" ");

  return (
    <span ref={ref} className={`inline-flex flex-wrap gap-x-[0.28em] ${className}`}>
      {words.map((word, idx) => (
        <span
          key={`${word}-${idx}`}
          className="inline-block overflow-hidden pt-[0.16em] -mt-[0.16em] pb-[0.08em] -mb-[0.08em]"
        >
          <motion.span
            className="inline-block"
            initial={{ y: "96%", opacity: 0 }}
            animate={
              isInView ? { y: "0%", opacity: 1 } : { y: "96%", opacity: 0 }
            }
            transition={{
              duration: 0.75,
              delay: delay + idx * stagger,
              ease: EASING.entrance,
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

// ── 5. SIGNATURE 3-LAYER CLOUD & SEA MIST FLIGHT TRANSITION (SECTION 10) ────
interface CloudRevealTransitionProps {
  targetRef?: React.RefObject<HTMLElement | null>;
}

export function CloudRevealTransition({
  targetRef,
}: CloudRevealTransitionProps) {
  const localRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: targetRef ?? localRef,
    offset: ["start start", "end start"],
  });

  // Cloud Layer A: Zero permanent haze at scroll=0; emerges smoothly only as user scrolls past 8% (Phần 09.1 & 09.2)
  const layerAX = useTransform(
    scrollYProgress,
    [0, 0.3, 0.65, 1],
    reducedMotion ? ["0%", "0%", "0%", "0%"] : ["-2.5%", "-0.5%", "2%", "4.5%"]
  );
  const layerAY = useTransform(
    scrollYProgress,
    [0, 0.3, 0.75, 1],
    reducedMotion ? ["0px", "0px", "0px", "0px"] : ["36px", "14px", "-8px", "-24px"]
  );
  const layerAOpacity = useTransform(
    scrollYProgress,
    [0, 0.08, 0.35, 0.7, 1],
    reducedMotion ? [0, 0, 0, 0, 0] : [0, 0.04, 0.48, 0.86, 1]
  );

  // Cloud Layer B: Midground volumetric cloud (emerges after 15% scroll progress)
  const layerBX = useTransform(
    scrollYProgress,
    [0, 0.3, 0.65, 1],
    reducedMotion ? ["0%", "0%", "0%", "0%"] : ["4%", "1.5%", "-2.5%", "-6%"]
  );
  const layerBY = useTransform(
    scrollYProgress,
    [0, 0.3, 0.65, 1],
    reducedMotion ? ["0px", "0px", "0px", "0px"] : ["48px", "22px", "-6px", "-32px"]
  );
  const layerBScale = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    reducedMotion ? [1, 1, 1] : [1, 1.03, 1.08]
  );
  const layerBOpacity = useTransform(
    scrollYProgress,
    [0, 0.14, 0.45, 0.8, 1],
    reducedMotion ? [0, 0, 0, 0, 0] : [0, 0.02, 0.52, 0.88, 0.94]
  );

  // Cloud Layer C: Foreground cloud passing close to camera (emerges at 25–90% transition zone)
  const layerCX = useTransform(
    scrollYProgress,
    [0, 0.45, 0.85, 1],
    reducedMotion ? ["0%", "0%", "0%", "0%"] : ["-5%", "0%", "5%", "8%"]
  );
  const layerCY = useTransform(
    scrollYProgress,
    [0, 0.45, 0.85, 1],
    reducedMotion ? ["0px", "0px", "0px", "0px"] : ["64px", "28px", "-10px", "-36px"]
  );
  const layerCScale = useTransform(
    scrollYProgress,
    [0, 0.65, 1],
    reducedMotion ? [1, 1, 1] : [0.98, 1.05, 1.12]
  );
  const layerCOpacity = useTransform(
    scrollYProgress,
    [0, 0.22, 0.58, 0.86, 1],
    reducedMotion ? [0, 0, 0, 0, 0] : [0, 0, 0.56, 0.94, 1]
  );

  return (
    <div
      ref={localRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 z-15 h-36 sm:h-48 lg:h-56 overflow-hidden select-none"
    >
      {/* Scroll-activated horizon mist feathering into Ocean White #F8F8F4 */}
      <motion.div
        style={{ opacity: layerAOpacity }}
        className="absolute inset-0"
      >
        <div
          className="w-full h-full"
          style={{
            background:
              "linear-gradient(180deg, rgba(248,248,244,0) 0%, rgba(248,248,244,0.16) 38%, rgba(248,248,244,0.68) 76%, #F8F8F4 100%)",
          }}
        />
      </motion.div>

      {/* Cloud Layer A: Distant Coastal Mist Bank */}
      <motion.div
        style={{ x: layerAX, y: layerAY, opacity: layerAOpacity }}
        className="absolute -inset-x-24 bottom-0 h-full"
      >
        <img
          src="/images/cinematic/clouds/cloud-distant-01.svg"
          alt=""
          className="w-full h-full object-cover object-bottom"
        />
      </motion.div>

      {/* Cloud Layer B: Midground Son Tra Cloud Formation */}
      <motion.div
        style={{
          x: layerBX,
          y: layerBY,
          scale: layerBScale,
          opacity: layerBOpacity,
        }}
        className="absolute -inset-x-24 bottom-0 h-[85%]"
      >
        <img
          src="/images/cinematic/clouds/cloud-midground-01.svg"
          alt=""
          className="w-full h-full object-cover object-bottom"
        />
      </motion.div>

      {/* Cloud Layer C: Foreground Volumetric Cloud */}
      <motion.div
        style={{
          x: layerCX,
          y: layerCY,
          scale: layerCScale,
          opacity: layerCOpacity,
        }}
        className="absolute -inset-x-24 -bottom-3 h-[72%]"
      >
        <img
          src="/images/cinematic/clouds/cloud-foreground-01.svg"
          alt=""
          className="w-full h-full object-cover object-bottom"
        />
      </motion.div>
    </div>
  );
}

// ── 6. SEAMLESS SECTION MIST BRIDGE (SECTION 11) ─────────────────────────────
interface SectionMistBridgeProps {
  variant?: "light-to-dark" | "dark-to-light";
  className?: string;
}

export function SectionMistBridge({
  variant = "light-to-dark",
  className = "",
}: SectionMistBridgeProps) {
  const bridgeRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: bridgeRef,
    offset: ["start end", "end start"],
  });

  const driftX = useTransform(
    scrollYProgress,
    [0, 1],
    reducedMotion ? ["0%", "0%"] : ["-3%", "3%"]
  );

  const isLightToDark = variant === "light-to-dark";

  return (
    <div
      ref={bridgeRef}
      aria-hidden="true"
      className={`pointer-events-none relative w-full h-20 sm:h-28 overflow-hidden select-none ${
        isLightToDark ? "bg-[#F8F8F4]" : "bg-[#102832]"
      } ${className}`}
    >
      <div
        className="absolute inset-0"
        style={{
          background: isLightToDark
            ? "linear-gradient(180deg, #F8F8F4 0%, rgba(231,226,214,0.65) 38%, rgba(16,40,50,0.85) 82%, #102832 100%)"
            : "linear-gradient(180deg, #102832 0%, rgba(22,46,56,0.75) 36%, rgba(241,239,231,0.85) 82%, #F1EFE7 100%)",
        }}
      />
      <motion.div
        style={{ x: driftX }}
        className="absolute -inset-x-16 inset-y-0 opacity-35"
      >
        <img
          src="/images/cinematic/clouds/cloud-midground-01.svg"
          alt=""
          className={`w-full h-full object-cover ${
            isLightToDark ? "invert-[0.85] hue-rotate-180" : ""
          }`}
        />
      </motion.div>
    </div>
  );
}

// ── 7. MOUSE-RESPONSIVE 2.5D DEPTH INTERACTION (SECTION 17) ─────────────────
interface MouseDepthParallaxProps {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}

export function MouseDepthParallax({
  children,
  strength = 10,
  className = "",
}: MouseDepthParallaxProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const [canHover, setCanHover] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1024px) and (hover: hover)");
    setCanHover(mq.matches);
    const handler = (e: MediaQueryListEvent) => setCanHover(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const springX = useSpring(rawX, { stiffness: 120, damping: 24, mass: 0.6 });
  const springY = useSpring(rawY, { stiffness: 120, damping: 24, mass: 0.6 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (reducedMotion || !canHover || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const normX = (e.clientX - rect.left) / rect.width - 0.5;
      const normY = (e.clientY - rect.top) / rect.height - 0.5;
      rawX.set(normX * strength);
      rawY.set(normY * strength);
    },
    [canHover, rawX, rawY, reducedMotion, strength]
  );

  const handleMouseLeave = useCallback(() => {
    rawX.set(0);
    rawY.set(0);
  }, [rawX, rawY]);

  if (reducedMotion || !canHover) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
    >
      <motion.div style={{ x: springX, y: springY }}>{children}</motion.div>
    </div>
  );
}
