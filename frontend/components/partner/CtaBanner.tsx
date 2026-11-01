'use client';

import { motion } from 'framer-motion';
import { PhoneCall, Mail, MessageSquare } from 'lucide-react';
import Link from 'next/link';

export default function CtaBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-700 via-teal-600 to-sky-700 text-white p-6 sm:p-8 md:p-10 shadow-xl shadow-teal-900/10 my-10"
    >
      {/* Decorative Wave SVG */}
      <div className="absolute inset-0 pointer-events-none opacity-15 overflow-hidden">
        <svg
          className="absolute -bottom-8 -left-10 w-[120%] h-40 text-white"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M0,0 C150,90 350,-40 500,45 C650,130 900,10 1200,50 L1200,120 L0,120 Z"
            fill="currentColor"
          />
        </svg>
        <div className="absolute -top-16 -right-16 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <span className="inline-block px-3 py-1 rounded-full bg-white/15 text-teal-100 text-[11px] font-bold tracking-wide uppercase backdrop-blur-xs">
            Hỗ trợ đối tác 24/7
          </span>
          <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-snug">
            Cần hỗ trợ đăng cơ sở hoặc giải đáp thắc mắc?
          </h3>
          <p className="text-xs sm:text-sm text-teal-50/90 leading-relaxed">
            Đội ngũ quản trị viên DaNangGo luôn sẵn sàng hỗ trợ quý đối tác tối ưu hóa hồ sơ nhà hàng và tiếp cận hàng triệu du khách Đà Nẵng.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <a
            href="tel:02363865xxx"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-teal-900 font-bold text-xs sm:text-sm shadow-md hover:bg-teal-50 transition-all active:scale-95"
          >
            <PhoneCall className="w-4 h-4 text-teal-600" />
            <span>0236 386 5xxx</span>
          </a>
          <a
            href="mailto:support@dananggo.vn"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm border border-white/20 transition-all active:scale-95"
          >
            <Mail className="w-4 h-4" />
            <span>support@dananggo.vn</span>
          </a>
        </div>
      </div>
    </motion.div>
  );
}
