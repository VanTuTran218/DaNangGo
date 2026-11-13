'use client';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { useRef } from 'react';
import Image from 'next/image';
import { DURATION, EASING } from '@/lib/motion-tokens';

// ── ĐƯỜNG DẪN ẢNH NỀN HERO ĐIỂM DU LỊCH (DỄ DÀNG THAY ĐỔI TẠI ĐÂY) ──────────────────
export const DIEM_DU_LICH_HERO_IMAGE =
  'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=85&w=2400&auto=format&fit=crop';

export default function ParallaxBanner() {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], reducedMotion ? ['0px', '0px'] : ['0px', '24px']);

  return (
    <div
      ref={ref}
      data-navbar-overlay="true"
      aria-label="Điểm du lịch Đà Nẵng"
      className="relative w-full h-[400px] sm:h-[450px] lg:h-[490px] overflow-hidden select-none"
    >
      {/* Lớp gradient tối trên đỉnh bảo đảm Navbar trong suốt đọc sắc nét */}
      <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/75 via-black/30 to-transparent pointer-events-none z-20" />

      {/* Ảnh nền Parallax + C1 Hero Image Reveal (scale 1.05 -> 1 trong 1.5s) */}
      <motion.div
        style={{ y }}
        initial={reducedMotion ? { scale: 1 } : { scale: 1.05 }}
        animate={{ scale: 1 }}
        transition={{ duration: DURATION.cinematic, ease: EASING.entrance }}
        className="absolute inset-0 w-full h-[108%] -top-[4%]"
      >
        <Image
          src={DIEM_DU_LICH_HERO_IMAGE}
          alt="Bà Nà Hills — Cầu Vàng Đà Nẵng"
          fill
          priority
          quality={90}
          className="object-cover object-center"
          sizes="100vw"
        />
      </motion.div>

      {/* Overlay gradient cân bằng: tôn lên vẻ hùng vĩ của Bà Nà Hills và đảm bảo chữ tương phản cao */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-[#0f2942]/35 to-[#071a2e]/75 pointer-events-none z-10" />

      {/* Nội dung banner — thoáng đãng, cân đối tương tự trang Khám phá, Lưu trú & Ẩm thực */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-white px-6 text-center pb-12 sm:pb-14 pt-20">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-3 sm:mb-4 h1-hero drop-shadow-md"
        >
          Khám Phá Đà Nẵng
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.15 }}
          className="text-sm sm:text-base lg:text-lg max-w-2xl text-white/90 leading-relaxed body-text drop-shadow"
        >
          Từ những bãi biển cát trắng miên man đến những ngọn núi hùng vĩ, Đà Nẵng lưu giữ hàng trăm kỳ quan chờ bạn khám phá.
        </motion.p>
      </div>
    </div>
  );
}
