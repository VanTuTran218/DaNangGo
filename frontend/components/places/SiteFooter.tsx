'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function SiteFooter() {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="bg-[#071a2e] text-white/70 pt-16 pb-12"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* CỘT 1: LOGO + MÔ TẢ DANANGGO */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-teal-600 flex items-center justify-center shadow-md">
                <span className="text-white text-sm font-black">D</span>
              </div>
              <span className="text-white font-black text-xl tracking-tight">
                <span className="text-cyan-400">Danang</span>
                <span className="text-orange-400">Go</span>
              </span>
            </Link>
            <p className="text-xs sm:text-sm leading-relaxed text-white/60">
              Nền tảng du lịch thông minh Đà Nẵng — Khám phá ẩm thực tinh hoa, điểm đến hấp dẫn và tự tạo lịch trình du lịch cá nhân hóa hoàn toàn miễn phí.
            </p>
            <div className="flex gap-2.5 pt-1">
              {[
                { label: 'FB', color: 'bg-blue-600', href: '#' },
                { label: 'IG', color: 'bg-pink-600', href: '#' },
                { label: 'TT', color: 'bg-gray-800', href: '#' },
                { label: 'YT', color: 'bg-red-600', href: '#' },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  className={`w-8 h-8 ${s.color} rounded-full flex items-center justify-center text-white text-xs font-bold hover:opacity-85 hover:scale-105 transition-all`}
                  aria-label={s.label}
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          {/* CỘT 2: KHÁM PHÁ */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-wider text-cyan-400">
              Khám phá
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              {[
                { name: 'Ẩm thực Đà Nẵng', href: '/amthuc' },
                { name: 'Điểm tham quan du lịch', href: '/diemdulich' },
                { name: 'Khách sạn & Lưu trú', href: '/luutru' },
                { name: 'Bản đồ tương tác', href: '/bando' },
                { name: 'Tạo lịch trình tự động', href: '/lich-trinh/tao-moi' },
              ].map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="hover:text-cyan-300 transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* CỘT 3: TIỆN ÍCH & HỖ TRỢ */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-wider text-cyan-400">
              Tiện ích & Hỗ trợ
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              {[
                { name: 'Gói thành viên VIP', href: '/vip' },
                { name: 'Dành cho đối tác nhà hàng', href: '/partner' },
                { name: 'Hướng dẫn sử dụng', href: '#' },
                { name: 'Chính sách bảo mật', href: '/chinh-sach' },
                { name: 'Điều khoản dịch vụ', href: '/dieu-khoan' },
              ].map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="hover:text-cyan-300 transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* CỘT 4: LIÊN HỆ */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-wider text-cyan-400">
              Liên hệ
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-white/70">
              <li>📧 contact@dananggo.vn</li>
              <li>📞 Hotline: 0236 386 8xxx</li>
              <li>📍 Hải Châu, TP. Đà Nẵng, Việt Nam</li>
              <li className="text-emerald-400 font-semibold pt-1">
                ● Hỗ trợ du khách 24/7
              </li>
            </ul>
          </div>
        </div>

        {/* BOTTOM COPYRIGHT */}
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40">
          <p>© 2025 DanangGo. Nền tảng Du lịch Thông minh Đà Nẵng. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/dieu-khoan" className="hover:text-white/70 transition-colors">
              Điều khoản
            </Link>
            <Link href="/chinh-sach" className="hover:text-white/70 transition-colors">
              Bảo mật
            </Link>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
