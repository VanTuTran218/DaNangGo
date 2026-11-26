'use client';

/**
 * AuthHeroPanel — Nocturnal Cinematic Showcase (Left Side)
 * ────────────────────────────────────────────────────────
 * - High-contrast Ivory & Champagne editorial typography (zero dark-on-dark overlap)
 * - Ken Burns Đà Nẵng landmark slideshow (Cầu Rồng, Bà Nà Hills, Phố Cổ Hội An)
 * - Multi-stop Deep Ocean scrim & Frosted Glass telemetry metrics
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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 6500);
    return () => clearInterval(timer);
  }, []);

  const headingMain =
    activeTab === 'login' ? 'Chào mừng trở lại' : 'Gia nhập cộng đồng';

  const desc =
    activeTab === 'login'
      ? 'Hàng trăm điểm đến tuyển chọn, ẩm thực bản địa và lịch trình AI cá nhân hóa đang chờ bạn khám phá.'
      : 'Tích điểm mỗi chuyến đi, mở khóa đặc quyền Hạng Bạc và đồng bộ lịch trình thông minh trên mọi thiết bị.';

  return (
    <div className="hidden lg:block relative h-full w-full overflow-hidden select-none bg-[#05141C]">
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
            animate={shouldReduceMotion ? {} : { scale: [1, 1.06] }}
            transition={{ duration: 8, ease: 'easeInOut' }}
            className="w-full h-full relative"
          >
            <Image
              src={SLIDES[currentSlide].src}
              alt={SLIDES[currentSlide].alt}
              fill
              priority
              unoptimized
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover object-center"
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* ── 2. MULTI-STOP NOCTURNAL SCRIM (HIGH CONTRAST FOR EVERY PHOTO) ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(4,16,23,0.72) 0%, rgba(5,20,28,0.34) 36%, rgba(5,19,27,0.76) 66%, rgba(4,16,23,0.96) 100%)',
        }}
      />

      {/* ── 3. LIVE LOCATION TELEMETRY PILL (TOP RIGHT OF LEFT PANEL) ── */}
      <div className="absolute top-6 right-6 z-20">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#06151C]/80 backdrop-blur-xl border border-[#E6D9B7]/30 text-[#FFFDF5] text-xs font-medium shadow-[0_10px_24px_rgba(2,10,15,0.45)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E87B39] animate-pulse" />
          <span>{SLIDES[currentSlide].location}</span>
        </div>
      </div>

      {/* ── 4. EDITORIAL SHOWCASE CONTENT ── */}
      <div className="relative h-full flex flex-col justify-end p-9 xl:p-11 z-10">
        <motion.div
          key={activeTab}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="flex flex-col gap-4 max-w-md"
        >
          {/* Eyebrow Badge */}
          <div className="flex flex-col items-start gap-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#06151C]/78 backdrop-blur-xl border border-[#E6D9B7]/35 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#E87B39]" />
              <span className="text-[10.5px] font-bold tracking-[0.18em] text-[#E6D9B7] uppercase">
                Đặc quyền hội viên DanangGo
              </span>
            </div>
            <span className="text-[10.5px] tracking-[0.22em] uppercase text-[#CBD9DA]/80 font-medium pl-1">
              {SLIDES[currentSlide].tag} · ĐÀ NẴNG
            </span>
          </div>

          {/* Crisp Two-Tone Editorial Heading (Explicit Ivory + Champagne, zero dark-on-dark) */}
          <h2 className="cinematic-condensed uppercase text-3xl xl:text-[2.65rem] font-bold leading-[1.06] tracking-[0.01em] text-[#FFFDF5] drop-shadow-[0_4px_18px_rgba(2,10,15,0.65)]">
            {headingMain}
            <span className="block home-serif italic font-normal normal-case text-[#E6D9B7] mt-1 tracking-normal">
              DanangGo Club
            </span>
          </h2>

          {/* Description */}
          <p className="text-sm text-[#CBD9DA]/88 leading-relaxed font-normal">
            {desc}
          </p>

          {/* ── 5. FROSTED SMOKED-GLASS METRICS ── */}
          <div className="grid grid-cols-3 gap-2.5 pt-2">
            <div className="flex flex-col justify-between p-3.5 rounded-2xl bg-[#071821]/78 hover:bg-[#0A222E]/88 backdrop-blur-xl border border-[#E6D9B7]/22 transition-colors">
              <span className="text-xl font-bold font-mono tracking-tight text-[#FFFDF5]">
                <AnimatedCounter to={120} />K+
              </span>
              <span className="text-[11px] text-[#E6D9B7]/85 font-medium mt-1">
                Hội viên
              </span>
            </div>

            <div className="flex flex-col justify-between p-3.5 rounded-2xl bg-[#071821]/78 hover:bg-[#0A222E]/88 backdrop-blur-xl border border-[#E6D9B7]/22 transition-colors">
              <div className="flex items-center gap-1">
                <span className="text-xl font-bold font-mono tracking-tight text-[#FFFDF5]">
                  <AnimatedCounter to={4.9} decimals={1} />
                </span>
                <Star className="w-3.5 h-3.5 text-[#E87B39] fill-[#E87B39] shrink-0" />
              </div>
              <span className="text-[11px] text-[#E6D9B7]/85 font-medium mt-1">
                Đánh giá
              </span>
            </div>

            <div className="flex flex-col justify-between p-3.5 rounded-2xl bg-[#071821]/78 hover:bg-[#0A222E]/88 backdrop-blur-xl border border-[#E6D9B7]/22 transition-colors">
              <span className="text-xl font-bold font-mono tracking-tight text-[#FFFDF5]">
                <AnimatedCounter to={25} />%
              </span>
              <span className="text-[11px] text-[#E6D9B7]/85 font-medium mt-1">
                Tiết kiệm
              </span>
            </div>
          </div>

          {/* ── SLIDE INDICATORS ── */}
          <div className="flex items-center gap-2 pt-2">
            {SLIDES.map((slide, idx) => (
              <button
                key={slide.location}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Chuyển tới ảnh ${slide.location}`}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  currentSlide === idx
                    ? 'w-8 bg-[#E6D9B7]'
                    : 'w-2 bg-[#FFFDF5]/30 hover:bg-[#FFFDF5]/60'
                }`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
