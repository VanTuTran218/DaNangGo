'use client';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import Image from 'next/image';

export default function ParallaxBanner() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);

  return (
    <div ref={ref} data-navbar-overlay="true" className="relative h-[320px] md:h-[400px] w-full overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 via-black/10 to-transparent pointer-events-none z-20" />
      <motion.div style={{ y }} className="absolute inset-0 w-full h-[120%] -top-[10%]">
        <Image
          src="https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=2000&auto=format&fit=crop"
          alt="Bà Nà Hills"
          fill
          className="object-cover"
          priority
        />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f2942]/70 via-[#0f2942]/30 to-transparent" />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-4">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-5xl font-bold text-center mb-4 h1-hero"
        >
          Khám Phá Đà Nẵng
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-sm md:text-lg text-center max-w-2xl text-white/90 body-text"
        >
          Từ những bãi biển cát trắng miên man đến những ngọn núi hùng vĩ, Đà Nẵng lưu giữ hàng trăm kỳ quan chờ bạn khám phá.
        </motion.p>
      </div>
    </div>
  );
}
