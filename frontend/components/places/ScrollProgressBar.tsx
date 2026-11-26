'use client';

import { motion, useScroll, useSpring, useReducedMotion } from 'framer-motion';

/**
 * Thanh tiến độ cuộn mỏng ở đỉnh trang Chi tiết — đồng bộ Champagne Gold & Sunset Coral
 */
export default function ScrollProgressBar() {
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 30,
    restDelta: 0.001,
  });

  if (reducedMotion) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-[#216B70] via-[#C9B580] to-[#E87B39] z-[60] origin-left pointer-events-none"
      style={{ scaleX }}
    />
  );
}
