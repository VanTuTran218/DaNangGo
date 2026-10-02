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
 *
 * Usage:
 *   <Reveal delay={0.2}><MyCard /></Reveal>
 */

import { useRef } from "react";
import { motion, useInView, type Variants } from "framer-motion";

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  once?: boolean;
  direction?: "up" | "left" | "right" | "none";
  duration?: number;
}

export default function Reveal({
  children,
  delay = 0,
  className = "",
  once = true,
  direction = "up",
  duration = 0.5,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  // Trigger when 15% of element is visible
  const isInView = useInView(ref, { once, margin: "0px 0px -60px 0px" });

  // Determine initial offset based on direction
  const offsets = {
    up: { x: 0, y: 20 },
    left: { x: -20, y: 0 },
    right: { x: 20, y: 0 },
    none: { x: 0, y: 0 },
  };

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
        ease: [0.25, 0.46, 0.45, 0.94], // cubic-bezier easeOutQuart
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={variants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
    >
      {children}
    </motion.div>
  );
}
