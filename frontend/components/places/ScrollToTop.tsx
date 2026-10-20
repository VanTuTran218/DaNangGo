'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight =
        document.documentElement.scrollHeight - document.documentElement.clientHeight;

      if (totalScroll > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }

      if (windowHeight > 0) {
        const progress = (totalScroll / windowHeight) * 100;
        setScrollProgress(Math.min(100, Math.max(0, progress)));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // Tính chu vi vòng tròn SVG radius 18
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scrollProgress / 100) * circumference;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.25 }}
          onClick={scrollToTop}
          className="fixed bottom-20 lg:bottom-8 right-5 sm:right-8 z-40 w-12 h-12 rounded-full bg-white shadow-xl hover:shadow-2xl border border-gray-100 flex items-center justify-center text-[#0f2942] hover:text-orange-500 transition-all group active:scale-90"
          aria-label="Cuộn lên đầu trang"
        >
          {/* Vòng tiến độ cuộn SVG */}
          <svg className="w-12 h-12 absolute -rotate-90 pointer-events-none">
            <circle
              cx="24"
              cy="24"
              r={radius}
              stroke="currentColor"
              strokeWidth="2.5"
              fill="transparent"
              className="text-gray-100"
            />
            <circle
              cx="24"
              cy="24"
              r={radius}
              stroke="currentColor"
              strokeWidth="2.5"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="text-orange-500 transition-all duration-100"
            />
          </svg>

          <ArrowUp
            size={18}
            className="group-hover:-translate-y-1 transition-transform duration-200"
          />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
