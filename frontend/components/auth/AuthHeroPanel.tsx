'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import AnimatedCounter from '@/components/ui/AnimatedCounter';

interface AuthHeroPanelProps {
  activeTab: 'login' | 'register';
}

const IMAGES = [
  'https://images.unsplash.com/photo-1559493442-0eaaba8bb6ce?q=80&w=1600',
  'https://images.unsplash.com/photo-1582650949186-c5dc3bba5b7c?q=80&w=1600',
  'https://images.unsplash.com/photo-1528360983277-13d401cdc186?q=80&w=1600'
];

// Giá trị cố định cho các hạt sáng — tránh SSR/client hydration mismatch
const PARTICLES = [
  { size: 6,   left: 12,  driftX:  30, duration: 18, delay: 0   },
  { size: 5,   left: 27,  driftX: -40, duration: 22, delay: 1.5 },
  { size: 7,   left: 45,  driftX:  20, duration: 16, delay: 3   },
  { size: 4,   left: 60,  driftX: -25, duration: 20, delay: 0.8 },
  { size: 6,   left: 73,  driftX:  45, duration: 24, delay: 2.2 },
  { size: 5,   left: 85,  driftX: -15, duration: 19, delay: 4   },
  { size: 7,   left: 33,  driftX:  35, duration: 21, delay: 1   },
  { size: 4,   left: 92,  driftX: -30, duration: 17, delay: 3.5 },
];

export default function AuthHeroPanel({ activeTab }: AuthHeroPanelProps) {
  const [currentImage, setCurrentImage] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % IMAGES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const title = activeTab === 'login'
    ? 'Chào mừng bạn trở lại cộng đồng DanangGo Club'
    : 'Gia nhập cộng đồng DanangGo Club';

  const desc = activeTab === 'login'
    ? 'Hàng trăm điểm đến, ẩm thực và lịch trình cá nhân hóa chờ đón bạn.'
    : 'Tích điểm mỗi lần đặt chỗ, nhận ưu đãi Hạng Bạc ngay khi đăng ký và truy cập các deal độc quyền.';

  // Highlight DanangGo Club
  const renderTitle = (text: string) => {
    const parts = text.split('DanangGo Club');
    return (
      <>
        {parts[0]}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400">
          DanangGo Club
        </span>
        {parts[1]}
      </>
    );
  };

  return (
    <div className="hidden lg:block relative h-full w-full overflow-hidden">
      {/* Slideshow */}
      <AnimatePresence initial={false}>
        <motion.div
          key={currentImage}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          <motion.div
            animate={shouldReduceMotion ? {} : { scale: [1, 1.05] }}
            transition={{ duration: 6, ease: 'linear' }}
            className="w-full h-full relative"
          >
            <Image
              src={IMAGES[currentImage]}
              alt="Danang Background"
              fill
              className="object-cover"
              priority
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-[30%] bg-gradient-to-b from-black/50 to-transparent" />

      {/* Particles — giá trị cố định để tránh SSR hydration mismatch */}
      {!shouldReduceMotion && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {PARTICLES.map((p, i) => (
            <motion.div
              key={i}
              className="absolute bg-white rounded-full opacity-20"
              style={{
                width: p.size + 'px',
                height: p.size + 'px',
                left: p.left + '%',
                bottom: '-5%'
              }}
              animate={{
                y: [0, -1000],
                x: [0, p.driftX],
                opacity: [0.15, 0.3, 0]
              }}
              transition={{
                duration: p.duration,
                repeat: Infinity,
                ease: 'linear',
                delay: p.delay
              }}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end p-12 text-white pb-16 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, staggerChildren: 0.1 }}
          className="flex flex-col gap-6"
        >
          <motion.div className="flex flex-col items-start gap-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/15 backdrop-blur border border-white/20">
              <span className="text-xs font-bold tracking-widest text-orange-400 uppercase">
                Đặc quyền hội viên DanangGo
              </span>
            </div>
            <span className="text-xs tracking-widest uppercase opacity-80">
              Cẩm nang du lịch số #1 Đà Nẵng
            </span>
          </motion.div>

          <motion.h2 
            key={activeTab}
            className="h2-section text-4xl font-bold leading-tight"
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            
          >
            {renderTitle(title)}
          </motion.h2>

          <motion.p 
            key={`${activeTab}-desc`}
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="text-lg text-white/80"
          >
            {desc}
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.3 }}
            className="grid grid-cols-3 gap-4 mt-4"
          >
            <div className="stat-card stat-card-stagger-1 flex flex-col gap-1 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
              <span className="stat-number text-2xl font-bold">
                <AnimatedCounter to={120} />K+
              </span>
              <span className="text-sm text-white/70">Members</span>
            </div>
            <div className="stat-card stat-card-stagger-2 flex flex-col gap-1 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
              <span className="text-2xl font-bold">
                <AnimatedCounter to={4.9} decimals={1} />
              </span>
              <span className="text-sm text-white/70">Đánh giá</span>
            </div>
            <div className="stat-card stat-card-stagger-3 flex flex-col gap-1 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
              <span className="text-2xl font-bold">
                <AnimatedCounter to={25} />%
              </span>
              <span className="text-sm text-white/70">Tiết kiệm trung bình</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
