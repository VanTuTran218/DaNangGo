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

      {/* Particles */}
      {!shouldReduceMotion && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute bg-white rounded-full opacity-20"
              style={{
                width: Math.random() * 4 + 4 + 'px',
                height: Math.random() * 4 + 4 + 'px',
                left: Math.random() * 100 + '%',
                bottom: '-5%'
              }}
              animate={{
                y: [0, -1000],
                x: [0, (Math.random() - 0.5) * 100],
                opacity: [0.15, 0.3, 0]
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                ease: 'linear',
                delay: Math.random() * 5
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
            <div className="flex flex-col gap-1 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
              <span className="stat-number text-2xl font-bold">
                <AnimatedCounter to={120} />K+
              </span>
              <span className="text-sm text-white/70">Members</span>
            </div>
            <div className="flex flex-col gap-1 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
              <span className="text-2xl font-bold">
                <AnimatedCounter to={4.9} decimals={1} />
              </span>
              <span className="text-sm text-white/70">Đánh giá</span>
            </div>
            <div className="flex flex-col gap-1 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
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
