"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { TIER_CONFIG } from "@/lib/constants/tiers";
import { Magnetic } from "@/components/ui/MotionPrimitives";
import { SPRING } from "@/lib/motion-tokens";

// Ngưỡng cuộn trang (px) để chuyển từ trong suốt sang nền trắng
const SCROLL_THRESHOLD = 24;

const NAV_LINKS = [
  { href: "/", label: "Trang chủ" },
  { href: "/khampha", label: "Khám phá" },
  { href: "/su-kien", label: "Sự kiện" },
  { href: "/luutru", label: "Lưu trú" },
  { href: "/amthuc", label: "Ẩm thực" },
  { href: "/diemdulich", label: "Điểm du lịch" },
  { href: "/bando", label: "Bản đồ" },
  { href: "/chat", label: "Trợ lý AI" },
];

export default function Navbar() {
  const [isAtTop, setIsAtTop] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [avatarDropdownOpen, setAvatarDropdownOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const pathname = usePathname();
  const avatarRef = useRef<HTMLDivElement>(null);

  const { user, loading, logout } = useAuth();

  // Theo dõi vị trí cuộn trang bằng passive listener + requestAnimationFrame
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrolled = window.scrollY >= SCROLL_THRESHOLD;
          setIsScrolled((prev) => (prev !== scrolled ? scrolled : prev));

          // Kiểm tra xem các trang con có hero overlay không
          const elements = document.querySelectorAll('[data-navbar-overlay="true"]');
          let found = false;
          for (let i = 0; i < elements.length; i++) {
            const rect = elements[i].getBoundingClientRect();
            if (rect.bottom > 60) {
              found = true;
              break;
            }
          }
          setIsAtTop(found);
          if (!initialized) setInitialized(true);

          ticking = false;
        });
        ticking = true;
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [initialized]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setAvatarDropdownOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (
    pathname?.startsWith('/dang-nhap') ||
    pathname?.startsWith('/quen-mat-khau') ||
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/partner')
  ) {
    return null;
  }

  const isHomePage = pathname === "/";
  // Trên trang chủ: Trong suốt khi ở đầu trang (scrollY < 24px), chuyển sang nền trắng khi cuộn >= 24px
  // Trên trang con: Trong suốt nếu có banner overlay và chưa cuộn, ngược lại là nền trắng
  const isTransparent = isHomePage ? !isScrolled : (isAtTop && !isScrolled);

  const textColor = isTransparent ? "text-white" : "text-[#0f2942]";
  const subTextColor = isTransparent ? "text-white/90" : "text-gray-600";
  const hoverTextColor = isTransparent ? "hover:text-cyan-300" : "hover:text-teal-600";
  const textShadowStyle = isTransparent ? { textShadow: "0 1px 2px rgba(0, 0, 0, 0.35)" } : undefined;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 h-16 flex items-center transition-colors duration-250 ease-out select-none ${
        isTransparent
          ? "bg-transparent border-b border-transparent shadow-none"
          : "bg-white/95 backdrop-blur-md border-b border-gray-200/80 shadow-sm"
      }`}
      style={{
        opacity: initialized ? 1 : 0,
      }}
    >
      {/* Container căn giữa nội dung Navbar */}
      <div className="relative z-10 mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 xl:gap-8">

        {/* ══ 1. LOGO DANANGGO ══ */}
        <div className="flex shrink-0 items-center min-w-[140px] lg:min-w-[200px]">
          <Link href="/" className="group flex items-center gap-2.5 flex-shrink-0">
            <div className={`w-9 h-9 sm:w-[38px] sm:h-[38px] rounded-full bg-gradient-to-br from-cyan-400 to-teal-600 flex items-center justify-center shadow-md transition-transform duration-200 group-hover:scale-105 shrink-0 ${isTransparent ? "shadow-black/25" : "shadow-teal-500/25"}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 10c1.5-2.5 3-2.5 4.5 0S11 12.5 12.5 10 16 7.5 17.5 10s3 2.5 4.5 0"
                  stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"
                />
                <path
                  d="M3 15c1.5-2 3-2 4.5 0S11 17 12.5 15s3.5-2 5 0 3 2 4.5 0"
                  stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" fill="none"
                />
                <circle cx="18" cy="5.5" r="2" fill="#FF7300" />
              </svg>
            </div>
            <span className="font-bold text-[20px] sm:text-[21px] tracking-tight leading-none flex items-center select-none" style={textShadowStyle}>
              <span className={`transition-colors duration-200 ${isTransparent ? "text-white" : "text-[#0f2942]"}`}>Danang</span>
              <span className="text-[#FF7300] font-extrabold ml-0.5">Go</span>
            </span>
          </Link>
        </div>

        {/* ══ 2. ĐIỀU HƯỚNG MENU (CĂN GIỮA HOÀN HẢO) ══ */}
        <nav
          className="hidden min-w-0 flex-1 items-center justify-center gap-1 xl:gap-1.5 2xl:gap-2.5 lg:flex"
          aria-label="Main navigation"
        >
          {NAV_LINKS.map((link) => {
            const isActive = link.href === "/" 
              ? pathname === "/" 
              : pathname?.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                style={textShadowStyle}
                className={`relative shrink-0 whitespace-nowrap px-3 py-1.5 xl:px-3.5 text-[13.5px] xl:text-[14px] leading-tight tracking-[-0.01em] rounded-full transition-colors duration-200 select-none ${
                  isActive
                    ? isTransparent
                      ? "text-white font-semibold"
                      : "text-teal-800 font-semibold"
                    : isTransparent
                      ? "text-white/90 font-medium hover:text-white hover:bg-white/12 border border-transparent"
                      : "text-slate-600 font-medium hover:text-slate-900 hover:bg-slate-100/90 border border-transparent"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="navbar-active-pill"
                    transition={SPRING.snappy}
                    className={`absolute inset-0 rounded-full -z-10 ${
                      isTransparent
                        ? "bg-white/20 border border-white/30 shadow-sm shadow-black/15 backdrop-blur-sm"
                        : "bg-teal-500/10 border border-teal-500/20 shadow-xs"
                    }`}
                  />
                )}
                <span className="relative z-10">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* ══ 3. CỘT PHẢI: CTA Desktop & Hamburger Mobile ══ */}
        <div className="ml-auto lg:ml-0 flex shrink-0 items-center justify-end min-w-[140px] lg:min-w-[200px] gap-2.5 sm:gap-3">

          {/* Desktop CTA */}
          <div className="hidden items-center gap-2.5 sm:gap-3 lg:flex">
            {/* Nút "Thêm lịch trình": Giữ màu xanh ngọc thương hiệu hiện tại + Magnetic nhẹ */}
            <Magnetic strength={2.5}>
              <Link
                href="/lich-trinh/tao-moi"
                className="h-9 sm:h-[38px] flex items-center gap-1.5 text-[13px] sm:text-[13.5px] font-semibold px-4 sm:px-4.5 rounded-full text-white bg-teal-500 hover:bg-teal-400 hover:brightness-105 shadow-md shadow-teal-500/25 hover:shadow-lg hover:shadow-teal-500/35 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none whitespace-nowrap transition-all duration-200"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
                <span>Thêm lịch trình</span>
              </Link>
            </Magnetic>

            {loading ? (
              <div className="w-9 h-9 sm:w-[38px] sm:h-[38px] rounded-full bg-white/20 animate-pulse border border-black/10"></div>
            ) : !user ? (
              /* Nút "Đăng nhập": outlined button, tăng tương phản, icon & text cùng hàng */
              <Link
                href="/dang-nhap"
                style={textShadowStyle}
                className={`h-9 sm:h-[38px] flex items-center gap-1.5 text-[13px] sm:text-[13.5px] font-semibold px-4 rounded-full whitespace-nowrap hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none transition-all duration-200 ${
                  isTransparent
                    ? "text-white border border-white/60 bg-white/10 hover:bg-white/20 hover:border-white shadow-sm"
                    : "text-slate-800 border border-slate-300 hover:border-teal-500 hover:text-teal-700 hover:bg-teal-50/70"
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
                <span>Đăng nhập</span>
              </Link>
            ) : (
              /* Avatar khi đã đăng nhập: đồng bộ kích thước h-9 sm:h-[38px] */
              <div className="relative" ref={avatarRef}>
                <button
                  onClick={() => setAvatarDropdownOpen(!avatarDropdownOpen)}
                  className={`relative w-9 h-9 sm:w-[38px] sm:h-[38px] rounded-full border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-400 shadow-sm hover:scale-105 ${
                    isTransparent ? "border-white ring-2 ring-white/60 bg-white/20" : "border-gray-200 hover:border-teal-300 bg-gray-50"
                  }`}
                >
                  {user.avatarUrl ? (
                    <Image src={user.avatarUrl} alt={user.name} fill className="rounded-full object-cover" unoptimized />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {user.membership?.isVip && (
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white bg-${TIER_CONFIG[user.membership.tier].color}-400`}
                    ></span>
                  )}
                </button>

                <AnimatePresence>
                  {avatarDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl py-3 border border-gray-100 z-50 text-[#0f2942] overflow-hidden"
                    >
                      {user.membership?.isVip ? (
                        <>
                          <div className={`px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-${TIER_CONFIG[user.membership.tier].color}-50 to-white`}>
                            <div className="flex items-center gap-3">
                              <div className={`w-12 h-12 rounded-full ring-2 ring-${TIER_CONFIG[user.membership.tier].color}-400 overflow-hidden relative`}>
                                {user.avatarUrl ? (
                                  <Image src={user.avatarUrl} alt={user.name} fill className="object-cover" unoptimized />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
                                    {user.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-sm">{user.name}</p>
                                <p className={`text-xs font-bold text-${TIER_CONFIG[user.membership.tier].color}-600 mt-0.5`}>HẠNG {user.membership.tier.toUpperCase()}</p>
                                <p className="text-[10px] text-gray-500 mt-0.5">ID: DNG-VIP-{user.id.slice(0,5)}</p>
                              </div>
                            </div>
                            
                            <div className="mt-4">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="font-medium text-gray-700">{user.membership.points} / {user.membership.nextTierPoints || 100} điểm</span>
                                <span className="text-gray-500">Còn {(user.membership.nextTierPoints || 100) - user.membership.points} điểm để lên hạng</span>
                              </div>
                              <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(user.membership.points / (user.membership.nextTierPoints || 100)) * 100}%` }}
                                  transition={{ duration: 0.8, ease: "easeOut" }}
                                  className={`h-full bg-${TIER_CONFIG[user.membership.tier].color}-500`}
                                />
                              </div>
                            </div>
                          </div>
                          
                          <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-semibold text-gray-700">3 ưu đãi có thể dùng</span>
                              <Link href="/ca-nhan?tab=offers" className="text-[10px] text-teal-600 hover:underline" onClick={() => setAvatarDropdownOpen(false)}>Xem tất cả</Link>
                            </div>
                          </div>

                          <div className="py-1">
                            {user.role === 'PARTNER' && (
                              <Link href="/partner" className="block px-4 py-2 text-sm font-semibold text-teal-600 bg-teal-50/60 hover:bg-teal-100/60 transition-colors" onClick={() => setAvatarDropdownOpen(false)}>Quản lý cơ sở</Link>
                            )}
                            <Link href="/ca-nhan" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-teal-600 transition-colors" onClick={() => setAvatarDropdownOpen(false)}>Trang cá nhân</Link>
                            <Link href="/ca-nhan?tab=offers" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-teal-600 transition-colors" onClick={() => setAvatarDropdownOpen(false)}>Ưu đãi thành viên VIP</Link>
                            <Link href="/lich-trinh" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-teal-600 transition-colors" onClick={() => setAvatarDropdownOpen(false)}>Lịch trình của tôi</Link>
                            <Link href="/ca-nhan?tab=reviews" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-teal-600 transition-colors" onClick={() => setAvatarDropdownOpen(false)}>Lịch sử đánh giá</Link>
                            <Link href="/khao-sat" className="block px-4 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50 hover:text-teal-800 transition-colors" onClick={() => setAvatarDropdownOpen(false)}>Góp ý &amp; khảo sát</Link>
                            <Link href="/ca-nhan?tab=settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-teal-600 transition-colors" onClick={() => setAvatarDropdownOpen(false)}>Cài đặt tài khoản</Link>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full relative overflow-hidden">
                              {user.avatarUrl ? (
                                <Image src={user.avatarUrl} alt={user.name} fill className="object-cover" unoptimized />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
                                  {user.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{user.name}</p>
                              <p className="text-xs text-gray-500">{user.email || 'Thành viên DaNangGo'}</p>
                            </div>
                          </div>

                          <div className="px-4 py-3 border-b border-gray-100 bg-teal-50/50">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-xs font-semibold text-teal-800">Thành viên Tiêu chuẩn</span>
                                <p className="text-[10px] text-teal-600">Nâng cấp VIP để nhận ưu đãi</p>
                              </div>
                              <Link href="/vip" className="text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 px-3 py-1 rounded-full transition-colors" onClick={() => setAvatarDropdownOpen(false)}>Nâng cấp</Link>
                            </div>
                          </div>

                          <div className="px-4 py-2 border-b border-gray-100">
                            <div className="flex items-center justify-around py-1">
                              <Link href="/lich-trinh" className="text-center group" onClick={() => setAvatarDropdownOpen(false)}>
                                <p className="text-lg font-bold text-teal-600 group-hover:text-teal-700">0</p>
                                <p className="text-[10px] text-gray-500">Xem lịch đã lưu</p>
                              </Link>
                              <div className="w-px h-8 bg-gray-200"></div>
                              <div className="text-center">
                                <p className="text-lg font-bold text-teal-600">0</p>
                                <p className="text-[10px] text-gray-500">Đánh giá</p>
                              </div>
                            </div>
                          </div>

                          <div className="py-1">
                            {user.role === 'PARTNER' && (
                              <Link href="/partner" className="block px-4 py-2 text-sm font-semibold text-teal-600 bg-teal-50/60 hover:bg-teal-100/60 transition-colors" onClick={() => setAvatarDropdownOpen(false)}>Quản lý cơ sở</Link>
                            )}
                            <Link href="/ca-nhan" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-teal-600 transition-colors" onClick={() => setAvatarDropdownOpen(false)}>Trang cá nhân</Link>
                            <Link href="/lich-trinh" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-teal-600 transition-colors" onClick={() => setAvatarDropdownOpen(false)}>Lịch trình của tôi</Link>
                            <Link href="/ca-nhan?tab=reviews" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-teal-600 transition-colors" onClick={() => setAvatarDropdownOpen(false)}>Lịch sử đánh giá</Link>
                            <Link href="/khao-sat" className="block px-4 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50 hover:text-teal-800 transition-colors" onClick={() => setAvatarDropdownOpen(false)}>Góp ý &amp; khảo sát</Link>
                            <Link href="/ca-nhan?tab=settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-teal-600 transition-colors" onClick={() => setAvatarDropdownOpen(false)}>Cài đặt tài khoản</Link>
                          </div>
                        </>
                      )}
                      
                      <div className="border-t border-gray-100 pt-1">
                        <button onClick={() => { setAvatarDropdownOpen(false); logout(); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">Đăng xuất</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Hamburger Mobile */}
          <button
            className="flex lg:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Mở menu điều hướng"
            aria-expanded={mobileOpen}
          >
            <div className="flex flex-col justify-center w-5 h-5 gap-[5px]">
              <div
                className={`w-5 h-0.5 rounded-full transition-all duration-300 ${
                  isTransparent ? "bg-white shadow-sm" : "bg-[#0f2942]"
                } ${mobileOpen ? "rotate-45 translate-y-[7px]" : ""}`}
              />
              <div
                className={`w-5 h-0.5 rounded-full transition-all duration-300 ${
                  isTransparent ? "bg-white shadow-sm" : "bg-[#0f2942]"
                } ${mobileOpen ? "opacity-0" : ""}`}
              />
              <div
                className={`w-5 h-0.5 rounded-full transition-all duration-300 ${
                  isTransparent ? "bg-white shadow-sm" : "bg-[#0f2942]"
                } ${mobileOpen ? "-rotate-45 -translate-y-[7px]" : ""}`}
              />
            </div>
          </button>
        </div>
      </div>

      {/* ── MOBILE MENU DRAWER ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className={`absolute top-full left-0 right-0 z-50 lg:hidden overflow-hidden shadow-2xl transition-colors duration-250 ${
              isTransparent
                ? "bg-[#071a2e] text-white border-t border-white/10"
                : "bg-white text-gray-800 border-t border-gray-100"
            }`}
          >
            <nav className="flex flex-col px-5 py-4 gap-1.5">
              {NAV_LINKS.map((link) => {
                const isActive = link.href === "/" 
                  ? pathname === "/" 
                  : pathname?.startsWith(link.href);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`py-2.5 px-3.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isTransparent
                        ? isActive
                          ? "text-white font-semibold bg-white/20 border border-white/25 shadow-sm"
                          : "text-white/85 hover:text-white hover:bg-white/10"
                        : isActive
                          ? "text-teal-800 font-semibold bg-teal-50 border border-teal-200/60"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                );
              })}

              {/* Divider */}
              <div className={`h-px my-3 ${isTransparent ? "bg-white/10" : "bg-gray-200"}`} />

              {loading ? (
                <div className="flex items-center justify-center py-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 animate-pulse"></div>
                </div>
              ) : !user ? (
                <Link
                  href="/dang-nhap"
                  className={`flex items-center justify-center gap-2 py-3 rounded-full text-sm font-semibold transition-all ${
                    isTransparent
                      ? "border border-white/60 bg-white/10 text-white hover:bg-white/20"
                      : "border border-slate-300 text-slate-800 hover:border-teal-500 hover:bg-teal-50/70"
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                  <span>Đăng nhập</span>
                </Link>
              ) : (
                <>
                  {user.role === 'PARTNER' && (
                    <Link
                      href="/partner"
                      className="flex items-center justify-center gap-2 bg-teal-50 border border-teal-200 text-teal-700 hover:bg-teal-100 py-3 rounded-full text-sm font-semibold transition-all mb-1"
                      onClick={() => setMobileOpen(false)}
                    >
                      Quản lý cơ sở (Partner)
                    </Link>
                  )}
                  <Link
                    href="/ca-nhan"
                    className={`flex items-center justify-center gap-2 py-3 rounded-full text-sm font-medium transition-all ${
                      isTransparent ? "border border-white/20 text-white hover:bg-white/10" : "border border-gray-300 text-[#0f2942] hover:bg-gray-50"
                    }`}
                    onClick={() => setMobileOpen(false)}
                  >
                    Hồ sơ của tôi
                  </Link>
                  <Link
                    href="/lich-trinh"
                    className="flex items-center justify-center gap-2 border border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 py-3 rounded-full text-sm font-semibold transition-all"
                    onClick={() => setMobileOpen(false)}
                  >
                    Lịch trình của tôi · Xem lịch đã lưu
                  </Link>
                  <button
                    onClick={() => { setMobileOpen(false); logout(); }}
                    className="flex items-center justify-center gap-2 border border-red-200 text-red-500 hover:bg-red-50 py-3 rounded-full text-sm font-medium transition-all mt-1"
                  >
                    Đăng xuất
                  </button>
                </>
              )}

              {/* Thêm lịch trình — nút chính, full width */}
              <Link
                href="/lich-trinh/tao-moi"
                className="flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-400 text-white py-3 rounded-full text-sm font-semibold mt-1 transition-colors shadow-md shadow-teal-500/25"
                onClick={() => setMobileOpen(false)}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
                Thêm lịch trình
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
