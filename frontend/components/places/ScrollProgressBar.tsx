'use client';

import { motion, useScroll, useSpring } from 'framer-motion';

/**
 * Thanh tiến độ cuộn mỏng ở đỉnh trang web
 * Tự động tính toán theo tỷ lệ cuộn của cửa sổ trình duyệt
 */
export default function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-teal-400 via-cyan-500 to-orange-500 z-50 origin-left pointer-events-none"
      style={{ scaleX }}
    />
  );
}
