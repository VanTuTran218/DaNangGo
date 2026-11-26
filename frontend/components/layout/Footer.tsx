import Link from 'next/link';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#102832] text-[#F8F8F4]/80 pt-11 pb-8 border-t border-white/10 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-8 items-start">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-3.5 group">
              <img
                src="/images/branding/danang-logo.png"
                alt="Biểu trưng Đà Nẵng"
                width={42}
                height={42}
                className="w-10 h-10 sm:w-[42px] sm:h-[42px] object-contain shrink-0 transition-transform duration-300 group-hover:scale-105"
              />
              <span className="cinematic-condensed uppercase font-bold text-xl tracking-wider">
                <span className="text-[#F8F8F4]">Danang</span>
                <span className="text-[#E87B39] ml-0.5">Go</span>
              </span>
            </Link>
            <p className="text-[13.5px] leading-relaxed text-[#F8F8F4]/70 mb-4">
              Cẩm nang du lịch Đà Nẵng đầy đủ và cập nhật nhất — từ điểm đến, ẩm thực đến lịch trình tối ưu.
            </p>
            <div className="flex items-center gap-3.5">
              {[
                {
                  l: 'Facebook',
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                    </svg>
                  ),
                },
                {
                  l: 'Instagram',
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                    </svg>
                  ),
                },
                {
                  l: 'TikTok',
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                    </svg>
                  ),
                },
                {
                  l: 'YouTube',
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
                      <path d="m10 15 5-3-5-3z" />
                    </svg>
                  ),
                },
              ].map((s) => (
                <a
                  key={s.l}
                  href="#"
                  aria-label={s.l}
                  title={s.l}
                  className="text-[#F8F8F4]/65 hover:text-[#E87B39] transition-colors p-1"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="home-eyebrow text-[#BCD3D1] mb-3.5">Khám phá</h4>
            <ul className="space-y-2">
              {['Điểm du lịch', 'Ẩm thực', 'Lưu trú', 'Mua sắm', 'Giải trí'].map((l) => (
                <li key={l}>
                  <a href="#" className="text-[13.5px] text-[#F8F8F4]/75 hover:text-white transition-colors">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="home-eyebrow text-[#BCD3D1] mb-3.5">Tiện ích</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/khao-sat" className="text-[13.5px] text-[#F8F8F4]/75 hover:text-white transition-colors">
                  Góp ý &amp; khảo sát
                </Link>
              </li>
              {[
                { label: 'Tạo lịch trình', href: '/lich-trinh/tao-moi' },
                { label: 'Bản đồ thành phố', href: '/bando' },
                { label: 'Thời tiết', href: '/thoi-tiet' },
                { label: 'Đặt vé online', href: '#' },
                { label: 'Hỏi đáp', href: '/chat' },
              ].map((item) => (
                <li key={item.label}>
                  {item.href === '#' ? (
                    <a href="#" className="text-[13.5px] text-[#F8F8F4]/75 hover:text-white transition-colors">
                      {item.label}
                    </a>
                  ) : (
                    <Link href={item.href} className="text-[13.5px] text-[#F8F8F4]/75 hover:text-white transition-colors">
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="home-eyebrow text-[#BCD3D1] mb-3.5">Liên hệ</h4>
            <ul className="space-y-2.5 text-[#F8F8F4]/80 text-[13.5px]">
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#5E9898] shrink-0 stroke-[1.6]" />
                <span>hello@dananggo.vn</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#5E9898] shrink-0 stroke-[1.6]" />
                <span>0236 386 5xxx</span>
              </li>
              <li className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-[#5E9898] shrink-0 stroke-[1.6]" />
                <span>Đà Nẵng, Việt Nam</span>
              </li>
            </ul>
            <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap gap-x-4 gap-y-1.5">
              {['Về chúng tôi', 'Tuyển dụng', 'Báo chí'].map((l) => (
                <a key={l} href="#" className="text-xs text-[#F8F8F4]/65 hover:text-white transition-colors">
                  {l}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#F8F8F4]/55">
          <p>© 2025 DanangGo. Made with ❤️ in Đà Nẵng, Việt Nam.</p>
          <div className="flex gap-5">
            {['Điều khoản sử dụng', 'Chính sách bảo mật'].map((s) => (
              <a key={s} href="#" className="hover:text-[#F8F8F4]/90 transition-colors">
                {s}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
