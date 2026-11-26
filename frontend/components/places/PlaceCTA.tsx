'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles, ArrowRight, Compass, MapPin } from 'lucide-react';

export default function PlaceCTA() {
  const reducedMotion = useReducedMotion();

  return (
    <motion.section
      initial={reducedMotion ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="home-container mb-16"
    >
      <div className="relative rounded-[18px] overflow-hidden bg-[#081C25] border border-[#E6D9B7]/32 p-8 sm:p-14 text-[#FFFDF5] shadow-[0_26px_68px_rgba(6,18,24,0.28)]">
        {/* Top Champagne rim glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#E6D9B7]/55 to-transparent"
        />
        {/* Subtle coastal contours & sunrise warmth */}
        <img
          src="/images/intro/atmosphere/intro-coastal-contours.svg"
          alt=""
          loading="lazy"
          decoding="async"
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 62% 72% at 86% 24%, rgba(232,123,57,0.16) 0%, rgba(201,181,128,0.10) 42%, transparent 74%), radial-gradient(ellipse 58% 66% at 14% 82%, rgba(33,107,112,0.28) 0%, transparent 70%)',
          }}
        />
        <div className="pointer-events-none absolute inset-4 border border-[#E6D9B7]/16 rounded-[12px]" />

        {/* NỘI DUNG CHÍNH */}
        <div className="relative z-10 max-w-2xl text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFF8E9]/10 border border-[#E6D9B7]/30 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#E6D9B7] mb-5">
            <Sparkles size={12.5} className="text-[#E87B39]" />
            <span>Cẩm nang du lịch thông minh Đà Nẵng</span>
          </div>

          <h3 className="home-serif text-2xl sm:text-4xl font-semibold tracking-[-0.01em] leading-[1.2] mb-3.5 text-[#FFFDF5]">
            Tiếp tục hành trình khám phá{' '}
            <span className="italic font-normal text-[#E6D9B7]">Đà Nẵng</span>
          </h3>

          <p className="text-sm sm:text-base text-[#D5E4E4]/85 leading-relaxed mb-8 max-w-xl">
            Từ khu nghỉ dưỡng mặt biển Mỹ Khê, điểm tham quan kỳ vĩ đến những quán ăn đặc sản bản địa — tất cả đã được tuyển chọn kỹ lưỡng dành cho bạn.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3.5">
            <Link
              href="/khampha"
              className="group luxury-btn-sweep w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full bg-[#FFF8E9] hover:bg-white text-[#102832] border border-[#E6D9B7]/75 font-semibold uppercase tracking-[0.12em] text-xs shadow-[0_10px_28px_rgba(4,14,20,0.4)] transition-all"
            >
              <Compass size={15} className="text-[#0F4C5C]" />
              <span>Khám phá tất cả địa điểm</span>
              <ArrowRight
                size={15}
                className="text-[#0F4C5C] transition-transform duration-250 group-hover:translate-x-1"
              />
            </Link>

            <Link
              href="/bando"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-[#E6D9B7]/35 text-[#FFFDF5] font-semibold uppercase tracking-[0.12em] text-xs transition-all"
            >
              <MapPin size={14} className="text-[#E6D9B7]" />
              <span>Xem trên Bản đồ</span>
            </Link>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
