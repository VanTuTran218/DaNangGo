'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function SiteFooter() {
  const reducedMotion = useReducedMotion();

  return (
    <motion.footer
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -30px 0px' }}
      transition={{ duration: reducedMotion ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="bg-[#102832] text-[#F8F8F4]/80 pt-11 pb-8 border-t border-white/10 select-none relative z-10 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 pb-8 items-start">
          {/* CỘT 1: THƯƠNG HIỆU DANANGGO */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-1 space-y-3.5">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <img
                src="/images/branding/danang-logo.png"
                alt="Biểu trưng Đà Nẵng"
                width={42}
                height={42}
                className="w-10 h-10 sm:w-[42px] sm:h-[42px] object-contain shrink-0 transition-transform duration-300 group-hover:scale-105"
              />
              <span className="text-[#F8F8F4] cinematic-condensed uppercase font-bold text-xl tracking-wider">
                <span>Danang</span>
                <span className="text-[#E87B39] ml-0.5">Go</span>
              </span>
            </Link>
            <p className="text-[13.5px] leading-relaxed text-[#F8F8F4]/70">
              Cẩm nang và nền tảng du lịch thông minh Đà Nẵng — Khám phá ẩm thực tinh hoa, điểm đến hấp dẫn và tự tạo lịch trình du lịch cá nhân hóa.
            </p>
            <div className="flex items-center gap-3.5 pt-1">
              {[
                {
                  label: 'Facebook',
                  href: '#',
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                    </svg>
                  ),
                },
                {
                  label: 'Instagram',
                  href: '#',
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                    </svg>
                  ),
                },
                {
                  label: 'TikTok',
                  href: '#',
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                    </svg>
                  ),
                },
                {
                  label: 'YouTube',
                  href: '#',
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
                      <path d="m10 15 5-3-5-3z" />
                    </svg>
                  ),
                },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  className="text-[#F8F8F4]/65 hover:text-[#E87B39] transition-colors p-1"
                  aria-label={s.label}
                  title={s.label}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* CỘT 2: KHÁM PHÁ */}
          <div>
            <h4 className="home-eyebrow text-[#BCD3D1] mb-3.5">Khám phá</h4>
            <ul className="space-y-2 text-[13.5px]">
              {[
                { name: 'Điểm tham quan du lịch', href: '/diemdulich' },
                { name: 'Ẩm thực Đà Nẵng', href: '/amthuc' },
                { name: 'Khách sạn & Lưu trú', href: '/luutru' },
                { name: 'Bản đồ thành phố', href: '/bando' },
                { name: 'Tạo lịch trình tự động', href: '/lich-trinh/tao-moi' },
              ].map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="hover:text-white inline-block transition-colors duration-200 text-[#F8F8F4]/75"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* CỘT 3: TIỆN ÍCH */}
          <div>
            <h4 className="home-eyebrow text-[#BCD3D1] mb-3.5">Tiện ích</h4>
            <ul className="space-y-2 text-[13.5px]">
              {[
                { name: 'Tạo lịch trình', href: '/lich-trinh/tao-moi' },
                { name: 'Bản đồ thành phố', href: '/bando' },
                { name: 'Trợ lý du lịch AI', href: '/chat' },
                { name: 'Góp ý & khảo sát', href: '/khao-sat' },
                { name: 'Gói thành viên VIP', href: '/vip' },
                { name: 'Dành cho đối tác', href: '/partner' },
              ].map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="hover:text-white inline-block transition-colors duration-200 text-[#F8F8F4]/75"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* CỘT 4: LIÊN HỆ */}
          <div>
            <h4 className="home-eyebrow text-[#BCD3D1] mb-3.5">Liên hệ</h4>
            <ul className="space-y-2.5 text-[13.5px] text-[#F8F8F4]/80">
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#5E9898] shrink-0 stroke-[1.6]" />
                <span className="hover:text-white transition-colors">contact@dananggo.vn</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#5E9898] shrink-0 stroke-[1.6]" />
                <span>Hotline: 0236 386 8xxx</span>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#5E9898] shrink-0 stroke-[1.6] mt-0.5" />
                <span>Hải Châu, TP. Đà Nẵng, Việt Nam</span>
              </li>
              <li className="text-[#BCD3D1] font-medium pt-1 flex items-center gap-1.5 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E87B39]" />
                Hỗ trợ du khách 24/7
              </li>
            </ul>
          </div>
        </div>

        {/* BOTTOM COPYRIGHT */}
        <div className="border-t border-white/10 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#F8F8F4]/55">
          <p>© 2026 DanangGo. Nền tảng Du lịch Thông minh Đà Nẵng. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="/dieu-khoan" className="hover:text-[#F8F8F4]/90 transition-colors">
              Điều khoản sử dụng
            </Link>
            <Link href="/chinh-sach" className="hover:text-[#F8F8F4]/90 transition-colors">
              Chính sách bảo mật
            </Link>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
