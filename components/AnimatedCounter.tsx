"use client";

/**
 * AnimatedCounter — Animated number counter
 *
 * Counts from 0 (or `from`) to `to` value when element enters viewport.
 * Reusable on any page — just provide the target number.
 *
 * Props:
 * - to: target number
 * - from?: starting number (default 0)
 * - duration?: animation duration in seconds (default 1.5)
 * - suffix?: string appended after number (e.g. "+", "%", "k")
 * - prefix?: string prepended before number (e.g. "$")
 * - className?: extra Tailwind classes
 *
 * Usage:
 *   <AnimatedCounter to={1500} suffix="+" className="text-4xl font-bold" />
 */

import { useRef, useEffect, useState } from "react";
import { useInView, useMotionValue, useSpring, animate } from "framer-motion";

interface AnimatedCounterProps {
  to: number;
  from?: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  decimals?: number;
}

export default function AnimatedCounter({
  to,
  from = 0,
  duration = 1.5,
  suffix = "",
  prefix = "",
  className = "",
  decimals = 0,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "0px 0px -40px 0px" });
  const [displayed, setDisplayed] = useState(from);
  const hasAnimated = useRef(false);

  useEffect(() => {
    // Respect reduced motion
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (isInView && !hasAnimated.current) {
      hasAnimated.current = true;

      if (prefersReduced) {
        setDisplayed(to);
        return;
      }

      // Animate from `from` to `to` using requestAnimationFrame
      const startTime = performance.now();
      const totalDuration = duration * 1000;

      function step(currentTime: number) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / totalDuration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = from + (to - from) * eased;
        setDisplayed(current);

        if (progress < 1) {
          requestAnimationFrame(step);
        }
      }

      requestAnimationFrame(step);
    }
  }, [isInView, from, to, duration]);

  const formatted = displayed.toFixed(decimals);

  return (
    <span ref={ref} className={className} aria-label={`${prefix}${to}${suffix}`}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
