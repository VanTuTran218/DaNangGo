'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ShieldCheck, Clock, BookmarkCheck, Sparkles } from 'lucide-react';

export default function SurveyHero() {
  const prefersReduced = useReducedMotion();

  return (
    <section
      data-navbar-overlay="true"
      className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-gradient-to-b from-[#0e4860] via-[#0b6377] to-[#0d8299] text-white"
    >
      {/* Decorative resort mesh light circles */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-orange-400/15 rounded-full blur-3xl pointer-events-none" />

      {/* Sóng SVG trôi chậm nhẹ nhàng ở đáy hero */}
      <div className="absolute inset-x-0 bottom-0 pointer-events-none opacity-25 overflow-hidden h-16 sm:h-24">
        <motion.svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="w-[200%] h-full"
          animate={
            prefersReduced
              ? {}
              : {
                  x: ['0%', '-50%'],
                }
          }
          transition={{
            repeat: Infinity,
            duration: 22,
            ease: 'linear',
          }}
        >
          <path
            d="M0,30 C150,90 350,-20 500,45 C650,110 900,10 1200,50 L1200,120 L0,120 Z"
            fill="white"
          />
          <path
            d="M1200,30 C1350,90 1550,-20 1700,45 C1850,110 2100,10 2400,50 L2400,120 L1200,120 Z"
            fill="white"
          />
        </motion.svg>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
        {/* Badge nhỏ xinh xắn */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold text-cyan-200 mb-5 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-orange-400" />
          <span>Khảo sát du khách Đà Nẵng 2026</span>
        </motion.div>

        {/* Tiêu đề chính */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight drop-shadow-sm"
        >
          Chia sẻ trải nghiệm <span className="text-orange-300">Đà Nẵng</span> của bạn
        </motion.h1>

        {/* Mô tả thân thiện */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-sm sm:text-base md:text-lg text-white/90 max-w-2xl mx-auto font-medium leading-relaxed mb-8"
        >
          Chỉ mất khoảng 3 phút. Ý kiến của bạn giúp du lịch Đà Nẵng ngày càng tốt hơn và xây dựng một thành phố đáng sống, đáng đến.
        </motion.p>

        {/* Ba huy hiệu nhỏ */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs font-semibold text-white/95"
        >
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-xs hover:bg-white/15 transition-colors">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>Ẩn danh hoàn toàn</span>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-xs hover:bg-white/15 transition-colors">
            <Clock className="w-4 h-4 text-cyan-200" />
            <span>Mất khoảng 3 phút</span>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-xs hover:bg-white/15 transition-colors">
            <BookmarkCheck className="w-4 h-4 text-orange-300" />
            <span>Có thể dừng và quay lại sau</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
