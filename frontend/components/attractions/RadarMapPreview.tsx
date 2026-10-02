'use client';
import { motion } from 'framer-motion';
import { Map, MapPin, Navigation, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function RadarMapPreview() {
  return (
    <div className="relative bg-[#0f2942] rounded-3xl overflow-hidden shadow-2xl">
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at center, #14b8a6 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      <div className="absolute top-1/2 left-3/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 pointer-events-none" />
      
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between p-8 md:p-12 gap-8">
        <div className="md:w-1/2 text-white">
          <div className="inline-flex items-center gap-1.5 bg-teal-500/20 text-teal-300 font-semibold px-3 py-1 rounded-full text-xs mb-6 border border-teal-500/30">
            <Map size={14} /> Bản đồ tương tác
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">Khám phá Đà Nẵng trên bản đồ thông minh</h2>
          <p className="text-gray-300 text-sm md:text-base mb-8 max-w-lg">
            Trải nghiệm trực quan với hệ thống bản đồ Radar Map. Dễ dàng tìm kiếm điểm đến, xem khoảng cách, tính toán lộ trình và khám phá các địa điểm ẩn mình xung quanh bạn.
          </p>
          <Link href="/bando" className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-teal-500/30 group">
            Mở Bản Đồ Khám Phá <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="md:w-1/2 relative h-64 md:h-80 w-full flex items-center justify-center">
          <motion.div 
            className="w-48 h-48 md:w-64 md:h-64 rounded-full border-4 border-white/10 flex items-center justify-center relative"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            <div className="absolute top-0 right-0 bottom-1/2 left-1/2 bg-gradient-to-tr from-teal-500/40 to-transparent origin-bottom-left" style={{ clipPath: 'polygon(100% 0, 0 100%, 100% 100%)' }} />
            <div className="w-3 h-3 bg-teal-400 rounded-full shadow-[0_0_15px_rgba(45,212,191,1)]" />
          </motion.div>
          
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="absolute top-1/4 right-1/4 bg-white text-[#0f2942] rounded-full w-10 h-10 flex items-center justify-center shadow-xl"
          >
            <MapPin size={18} className="text-orange-500" />
          </motion.div>
          
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="absolute bottom-1/4 left-1/4 bg-white text-[#0f2942] rounded-full w-12 h-12 flex items-center justify-center shadow-xl"
          >
            <Navigation size={22} className="text-blue-500" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
