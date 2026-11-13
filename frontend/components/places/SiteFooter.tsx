'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';

export default function SiteFooter() {
  const reducedMotion = useReducedMotion();

  return (
    <motion.footer
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -40px 0px" }}
      transition={{ duration: reducedMotion ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="bg-[#061B30] text-slate-300 pt-16 pb-12 border-t border-slate-800/80 select-none relative z-10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 mb-12">
          {/* CỘT 1: THƯƠNG HIỆU DANANGGO */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-1 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-teal-600 flex items-center justify-center shadow-md transition-transform duration-200 group-hover:scale-105 shrink-0">
                <span className="text-white text-sm font-black">D</span>
              </div>
              <span className="text-white font-black text-xl tracking-tight">
                <span>Danang</span>
                <span className="text-[#FF7300] ml-0.5">Go</span>
              </span>
            </Link>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-300/85">
              Cẩm nang và nền tảng du lịch thông minh Đà Nẵng — Khám phá ẩm thực tinh hoa, điểm đến hấp dẫn và tự tạo lịch trình du lịch cá nhân hóa.
            </p>
            <div className="flex gap-2.5 pt-1">
              {[
                { label: 'FB', color: 'bg-blue-600', href: '#' },
                { label: 'IG', color: 'bg-gradient-to-tr from-amber-500 via-pink-600 to-purple-600', href: '#' },
                { label: 'TT', color: 'bg-slate-800 border border-slate-700', href: '#' },
                { label: 'YT', color: 'bg-red-600', href: '#' },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  className={`w-8 h-8 ${s.color} rounded-full flex items-center justify-center text-white text-xs font-bold hover:opacity-90 hover:scale-105 transition-all shadow-sm`}
                  aria-label={s.label}
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          {/* CỘT 2: KHÁM PHÁ */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-wider text-cyan-300 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00B8A9]" />
              Khám phá
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
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
                    className="hover:text-[#00B8A9] hover:translate-x-0.5 inline-block transition-all duration-200 text-slate-300"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* CỘT 3: TIỆN ÍCH */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-wider text-cyan-300 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00B8A9]" />
              Tiện ích
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
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
                    className="hover:text-[#00B8A9] hover:translate-x-0.5 inline-block transition-all duration-200 text-slate-300"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* CỘT 4: LIÊN HỆ */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-wider text-cyan-300 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00B8A9]" />
              Liên hệ
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <span>📧</span>
                <span className="hover:text-[#00B8A9] transition-colors">contact@dananggo.vn</span>
              </li>
              <li className="flex items-center gap-2">
                <span>📞</span>
                <span>Hotline: 0236 386 8xxx</span>
              </li>
              <li className="flex items-start gap-2">
                <span>📍</span>
                <span>Hải Châu, TP. Đà Nẵng, Việt Nam</span>
              </li>
              <li className="text-emerald-400 font-semibold pt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Hỗ trợ du khách 24/7
              </li>
            </ul>
            <div className="pt-3 mt-3 border-t border-slate-800 flex gap-4 text-xs text-slate-400">
              <Link href="/chinh-sach" className="hover:text-[#00B8A9] transition-colors">
                Chính sách
              </Link>
              <span>·</span>
              <Link href="/dieu-khoan" className="hover:text-[#00B8A9] transition-colors">
                Điều khoản
              </Link>
            </div>
          </div>
        </div>

        {/* BOTTOM COPYRIGHT */}
        <div className="border-t border-slate-800/90 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© 2026 DanangGo. Nền tảng Du lịch Thông minh Đà Nẵng. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/dieu-khoan" className="hover:text-slate-200 transition-colors">
              Điều khoản sử dụng
            </Link>
            <Link href="/chinh-sach" className="hover:text-slate-200 transition-colors">
              Chính sách bảo mật
            </Link>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
