'use client';

import { motion } from 'framer-motion';
import { PhoneCall, Mail, Compass } from 'lucide-react';

export default function CtaBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-[22px] bg-[#073B3A] text-white p-6 sm:p-8 md:p-10 shadow-md border border-[#073B3A]/20 my-8"
      style={{
        backgroundImage: `url('/images/partner/danang-son-tra-peninsula.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 50%',
      }}
    >
      {/* Overlay Deep Ocean */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#052E2D]/95 via-[#073B3A]/90 to-[#008F89]/75" />

      {/* Decorative Wave SVG */}
      <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
        <svg
          className="absolute -bottom-6 -left-10 w-[120%] h-36 text-[#14B8A6]"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M0,15 C180,95 400,-35 650,50 C850,115 1050,20 1200,55 L1200,120 L0,120 Z"
            fill="currentColor"
          />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2.5 max-w-xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/12 border border-white/15 text-[#6EE7B7] text-[11px] font-bold tracking-wider uppercase backdrop-blur-xs">
            <Compass className="w-3.5 h-3.5 text-[#FF8A24]" />
            Hỗ trợ đối tác 24/7
          </span>
          <h3 className="text-xl sm:text-2xl md:text-[26px] font-extrabold text-white leading-snug tracking-tight">
            Cần hỗ trợ đăng cơ sở hoặc giải đáp thắc mắc?
          </h3>
          <p className="text-xs sm:text-sm text-teal-50/90 leading-relaxed">
            Đội ngũ quản trị viên DaNangGo luôn sẵn sàng hỗ trợ quý đối tác tối ưu hóa hồ sơ cơ sở dịch vụ và tiếp cận hàng triệu du khách Đà Nẵng.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap shrink-0">
          <a
            href="tel:02363865xxx"
            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white text-[#073B3A] font-bold text-xs sm:text-sm shadow-sm hover:bg-[#E9F8F5] transition-all active:scale-[0.98]"
          >
            <PhoneCall className="w-4 h-4 text-[#008F89]" />
            <span>0236 386 5xxx</span>
          </a>
          <a
            href="mailto:support@dananggo.vn"
            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/12 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/20 backdrop-blur-xs transition-all active:scale-[0.98]"
          >
            <Mail className="w-4 h-4 text-[#6EE7B7]" />
            <span>support@dananggo.vn</span>
          </a>
        </div>
      </div>
    </motion.div>
  );
}
