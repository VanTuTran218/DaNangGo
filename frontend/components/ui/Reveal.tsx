"use client";

/**
 * Reveal — Scroll-triggered fade-up wrapper
 *
 * Wraps children with a framer-motion fade+translateY animation
 * that triggers when the element enters the viewport.
 *
 * Props:
 * - delay?: stagger delay in seconds (default 0)
 * - className?: extra classes to pass to wrapper div
 * - once?: only animate once (default true)
 * - direction?: fade-up | fade-left | fade-right (default fade-up)
 * - as?: render as a different element (default div)
 *
 * Usage:
 *   <Reveal delay={0.2}><MyCard /></Reveal>
 */

import { useRef } from "react";
import { motion, useInView, useReducedMotion, type Variants } from "framer-motion";
import { DURATION, EASING } from "@/lib/motion-tokens";

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  once?: boolean;
  direction?: "up" | "left" | "right" | "none";
  duration?: number;
  /** HTML element to render as (default: div) */
  as?: "div" | "section" | "article" | "li" | "span";
}

export default function Reveal({
  children,
  delay = 0,
  className = "",
  once = true,
  direction = "up",
  duration = DURATION.medium,
  as = "div",
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  // Trigger reliably as soon as element approaches viewport
  const isInView = useInView(ref, { once, margin: "60px 0px -20px 0px", amount: 0.05 });

  // Determine initial offset based on direction (restrained editorial motion)
  const offsets = {
    up: { x: 0, y: 18 },
    left: { x: -16, y: 0 },
    right: { x: 16, y: 0 },
    none: { x: 0, y: 0 },
  };

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const variants: Variants = {
    hidden: {
      opacity: 0,
      x: offsets[direction].x,
      y: offsets[direction].y,
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration,
        delay,
        ease: EASING.entrance,
      },
    },
  };

  const MotionEl = motion[as] as typeof motion.div;

  return (
    <MotionEl
      ref={ref}
      className={className}
      variants={variants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
    >
      {children}
    </MotionEl>
  );
}

// ── RevealGroup: Stagger container for grids ──────────────────────────────────
interface RevealGroupProps {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  delayChildren?: number;
}

export function RevealGroup({
  children,
  className = "",
  stagger = 0.07,
  delayChildren = 0.05,
}: RevealGroupProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const isInView = useInView(ref, { once: true, margin: "60px 0px -20px 0px", amount: 0.05 });

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: stagger,
            delayChildren,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

// ── RevealItem: Child of RevealGroup ─────────────────────────────────────────
interface RevealItemProps {
  children: React.ReactNode;
  className?: string;
}

export function RevealItem({ children, className = "" }: RevealItemProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: DURATION.medium,
            ease: EASING.entrance,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}
