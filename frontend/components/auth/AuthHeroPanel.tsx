'use client';

/**
 * AuthHeroPanel — Cinematic Da Nang Panel (Left Side)
 * ──────────────────────────────────────────────────
 * Trải nghiệm hình ảnh cao cấp:
 * - Slideshow các địa danh biểu tượng Đà Nẵng sắc nét (Cầu Rồng, Cầu Vàng, Phố Cổ)
 * - Gradient overlay nhiều tầng chuẩn Deep Navy (#061B30) và Ocean Blue (#087E9C)
 * - Hiệu ứng Ken Burns nhẹ nhàng, tối ưu GPU transform-only
 * - Huy hiệu "ĐẶC QUYỀN HỘI VIÊN DANANGGO" viền kính mờ, chữ cam Sunset Orange
 * - Thẻ thống kê Glassmorphism 2.0 (120K+ Members, 4.9 Đánh giá, 25% Tiết kiệm) với hover lift
 */

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Sparkles, Star } from 'lucide-react';
import AnimatedCounter from '@/components/ui/AnimatedCounter';

interface AuthHeroPanelProps {
  activeTab: 'login' | 'register';
}

interface SlideItem {
  src: string;
  alt: string;
  tag: string;
  location: string;
}

const SLIDES: SlideItem[] = [
  {
    src: '/hero/cau-rong-hd.jpg',
    alt: 'Cầu Rồng Đà Nẵng về đêm rực sáng bên dòng sông Hàn',
    tag: 'BIỂU TƯỢNG ĐÀ NẴNG',
    location: 'Cầu Rồng Sông Hàn',
  },
  {
    src: '/hero/cau-vang-ba-na-hd.jpg',
    alt: 'Cầu Vàng Bà Nà Hills giữa mây trời Đà Nẵng',
    tag: 'KỲ QUAN DU LỊCH',
    location: 'Bà Nà Hills',
  },
  {
    src: '/hero/pho-co-hoi-an-hd.jpg',
    alt: 'Phố cổ Hội An lung linh đèn lồng bên dòng sông Hoài',
    tag: 'DI SẢN VĂN HÓA',
    location: 'Phố Cổ Hội An',
  },
];

export default function AuthHeroPanel({ activeTab }: AuthHeroPanelProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  // Tự động chuyển slide mỗi 6.5s
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 6500);
    return () => clearInterval(timer);
  }, []);

  const titlePrefix = activeTab === 'login'
    ? 'Chào mừng bạn trở lại cộng đồng '
    : 'Gia nhập cộng đồng ';

  const desc = activeTab === 'login'
    ? 'Hàng trăm điểm đến, ẩm thực và lịch trình cá nhân hóa chờ đón bạn khám phá.'
    : 'Tích điểm mỗi lần đặt chỗ, nhận ưu đãi Hạng Bạc ngay khi đăng ký và mở khóa deal độc quyền.';

  return (
    <div className="hidden lg:block relative h-full w-full overflow-hidden select-none bg-[#061B30]">
      {/* ── 1. CINEMATIC BACKGROUND SLIDESHOW ── */}
      <AnimatePresence initial={false}>
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <motion.div
            animate={
              shouldReduceMotion
                ? {}
                : {
                    scale: [1, 1.05],
                  }
            }
            transition={{
              duration: 8,
              ease: 'easeInOut',
            }}
            className="w-full h-full relative"
          >
            <Image
              src={SLIDES[currentSlide].src}
              alt={SLIDES[currentSlide].alt}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover object-center"
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* ── 2. MULTI-LAYER OVERLAYS: Tối ưu tương phản, bảo đảm sắc độ ── */}
      {/* Lớp đỉnh: Navy trong suốt */}
      <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-[#061B30]/85 via-[#061B30]/40 to-transparent pointer-events-none" />

      {/* Lớp giữa: Ocean Blue tint nhẹ tạo chiều sâu biển miền Trung */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40 mix-blend-multiply"
        style={{
          background: 'radial-gradient(ellipse at 50% 60%, rgba(8,126,156,0.3) 0%, transparent 70%)',
        }}
      />

      {/* Lớp đáy: Deep Navy (#061B30) để chữ và thẻ nổi bật */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#061B30] via-[#061B30]/75 to-transparent pointer-events-none" />

      {/* ── 3. THÔNG TIN VỊ TRÍ ẢNH HIỆN TẠI (GÓC TRÊN PHẢI CỦA LEFT PANEL) ── */}
      <div className="absolute top-4 sm:top-6 right-6 z-20">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white/90 text-xs font-medium shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#11C5C6] animate-pulse" />
          <span>{SLIDES[currentSlide].location}</span>
        </div>
      </div>

      {/* ── 4. NỘI DUNG QUẢNG BÁ & ĐẶC QUYỀN HỘI VIÊN ── */}
      <div className="relative h-full flex flex-col justify-end p-8 lg:p-10 xl:p-12 text-white z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex flex-col gap-5 max-w-lg"
        >
          {/* Badge & Slogan */}
          <div className="flex flex-col items-start gap-2.5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 transition-colors shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#FF6A00]" />
              <span className="text-[11px] sm:text-xs font-bold tracking-widest text-[#FF6A00] uppercase">
                Đặc quyền hội viên DanangGo
              </span>
            </div>
            <span className="text-[11px] tracking-[0.2em] uppercase text-cyan-200/70 font-medium">
              Cẩm nang du lịch số #1 Đà Nẵng
            </span>
          </div>

          {/* Heading */}
          <h2 className="text-2xl sm:text-3xl xl:text-4xl font-extrabold leading-tight tracking-tight font-display text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
            {titlePrefix}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#11C5C6] via-[#27E5DD] to-[#087E9C]">
              DanangGo Club
            </span>
          </h2>

          {/* Description */}
          <p className="text-sm sm:text-base text-slate-200/90 leading-relaxed font-normal">
            {desc}
          </p>

          {/* ── 5. THẺ THỐNG KÊ (GLASSMORPHISM 2.0) ── */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {/* Thẻ 1: Members */}
            <div className="group flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 hover:border-white/35 transition-all duration-250 hover:-translate-y-1 shadow-sm">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white font-display">
                <AnimatedCounter to={120} />K+
              </span>
              <span className="text-xs text-slate-300 font-medium mt-1">
                Members
              </span>
            </div>

            {/* Thẻ 2: Đánh giá */}
            <div className="group flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 hover:border-white/35 transition-all duration-250 hover:-translate-y-1 shadow-sm">
              <div className="flex items-center gap-1">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-white font-display">
                  <AnimatedCounter to={4.9} decimals={1} />
                </span>
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
              </div>
              <span className="text-xs text-slate-300 font-medium mt-1">
                Đánh giá
              </span>
            </div>

            {/* Thẻ 3: Tiết kiệm */}
            <div className="group flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 hover:border-white/35 transition-all duration-250 hover:-translate-y-1 shadow-sm">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white font-display">
                <AnimatedCounter to={25} />%
              </span>
              <span className="text-xs text-slate-300 font-medium mt-1 leading-tight">
                Tiết kiệm
              </span>
            </div>
          </div>

          {/* ── Slide Indicators ── */}
          <div className="flex items-center gap-1.5 pt-1">
            {SLIDES.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Chuyển tới ảnh ${idx + 1}`}
                className={`h-1 rounded-full transition-all duration-300 ${
                  currentSlide === idx
                    ? 'w-6 bg-[#11C5C6]'
                    : 'w-2 bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
