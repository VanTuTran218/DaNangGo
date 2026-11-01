'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles, ArrowRight, UtensilsCrossed } from 'lucide-react';

export default function PlaceCTA() {
  const prefersReduced = useReducedMotion();

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="max-w-7xl mx-auto px-4 sm:px-6 mb-16"
    >
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-teal-500 via-cyan-600 to-blue-700 p-8 sm:p-12 text-white shadow-xl shadow-cyan-600/20">
        {/* SÓNG BIỂN SVG TRÔI LIÊN TỤC Ở ĐÁY BANNER */}
        <div className="absolute inset-x-0 bottom-0 pointer-events-none opacity-20 overflow-hidden h-24">
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
              duration: 18,
              ease: 'linear',
            }}
          >
            <path
              d="M0,0 C150,90 350,-40 500,40 C650,120 900,20 1200,60 L1200,120 L0,120 Z"
              fill="white"
            />
            <path
              d="M1200,0 C1350,90 1550,-40 1700,40 C1850,120 2100,20 2400,60 L2400,120 L1200,120 Z"
              fill="white"
            />
          </motion.svg>
        </div>

        {/* NỘI DUNG CHÍNH */}
        <div className="relative z-10 max-w-2xl text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-white mb-4">
            <Sparkles size={14} className="text-amber-300" />
            <span>Cẩm nang du lịch thông minh Đà Nẵng</span>
          </div>

          <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight mb-3">
            Khám phá thêm hàng trăm quán ngon & đặc sản Đà Nẵng
          </h3>

          <p className="text-sm sm:text-base text-white/90 leading-relaxed mb-8 max-w-xl">
            Tận hưởng trọn vẹn hương vị miền Trung từ những quán hẻm gia truyền 40 năm đến các nhà hàng hải sản view biển Mỹ Khê lộng gió.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Link
              href="/amthuc"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-white text-[#0f2942] hover:bg-orange-50 hover:text-orange-600 font-extrabold text-sm shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
            >
              <UtensilsCrossed size={17} className="text-orange-500" />
              <span>Xem danh sách Ẩm thực</span>
              <ArrowRight size={16} />
            </Link>

            <Link
              href="/bando"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold text-sm backdrop-blur-md transition-all"
            >
              <span>Xem trên Bản đồ ẩm thực</span>
            </Link>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
