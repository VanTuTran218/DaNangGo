"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { TIER_CONFIG } from "@/lib/constants/tiers";

const NAV_LINKS = [
  { href: "/", label: "Trang chủ" },
  { href: "/luutru", label: "Lưu trú" },
  { href: "/amthuc", label: "Ẩm thực" },
  { href: "/diemdulich", label: "Điểm du lịch" },
  { href: "/bando", label: "Bản đồ" },
];


export default function Navbar() {
  const pathname = usePathname();
  const [isAtTop, setIsAtTop] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [showStickySearch, setShowStickySearch] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [avatarDropdownOpen, setAvatarDropdownOpen] = useState(false);
  const exploreRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  const { user, loading, logout } = useAuth();

  useEffect(() => {
    function checkOverlay() {
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
      setShowStickySearch(window.scrollY > window.innerHeight * 0.75);
      if (!initialized) setInitialized(true);
    }
    checkOverlay();
    window.addEventListener("scroll", checkOverlay, { passive: true });
    window.addEventListener("resize", checkOverlay, { passive: true });
    return () => {
      window.removeEventListener("scroll", checkOverlay);
      window.removeEventListener("resize", checkOverlay);
    };
  }, [initialized]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (exploreRef.current && !exploreRef.current.contains(e.target as Node)) {
        setExploreOpen(false);
      }
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

  if (pathname?.startsWith('/dang-nhap')) {
    return null;
  }

  const textColor = isAtTop ? "text-white drop-shadow-md" : "text-[#0f2942]";
  const subTextColor = isAtTop ? "text-white/90 drop-shadow-md" : "text-gray-500";
  const hoverTextColor = isAtTop ? "hover:text-white" : "hover:text-[#0f2942]";

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 ${isAtTop ? "py-3" : "py-2"}`}
      style={{ 
        transition: "padding 350ms ease, opacity 200ms ease",
        opacity: initialized ? 1 : 0
      }}
    >
      {/* ── LAYER 1: GLASS ── */}
      <div
        className="absolute inset-0 bg-transparent pointer-events-none"
        style={{
          opacity: isAtTop ? 1 : 0,
          transition: "opacity 350ms ease",
        }}
        aria-hidden="true"
      />

      {/* ── LAYER 2: SOLID WHITE ── */}
      <div
        className="absolute inset-0 bg-white/90 backdrop-blur-lg border-b border-black/5 shadow-sm pointer-events-none"
        style={{
          opacity: isAtTop ? 0 : 1,
          transition: "opacity 350ms ease",
        }}
        aria-hidden="true"
      />

      {/* ── CONTENT: grid 3 cột ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full grid grid-cols-[1fr_auto_1fr] items-center">

        {/* ══ CỘT TRÁI: Logo + Sticky Search ══ */}
        <div className="justify-self-start flex items-center gap-3 min-w-0">
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className={`w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-teal-600 flex items-center justify-center shadow-md ${isAtTop ? "shadow-black/20" : "shadow-teal-500/30"}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 10c1.5-2.5 3-2.5 4.5 0S11 12.5 12.5 10 16 7.5 17.5 10s3 2.5 4.5 0"
                  stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"
                />
                <path
                  d="M3 15c1.5-2 3-2 4.5 0S11 17 12.5 15s3.5-2 5 0 3 2 4.5 0"
                  stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" strokeLinecap="round" fill="none"
                />
                <circle cx="18" cy="5.5" r="2" fill="#f97316" />
              </svg>
            </div>
            <span className={`font-bold text-xl tracking-tight leading-none ${isAtTop ? "drop-shadow-md" : ""}`}>
              <span className={isAtTop ? "text-white" : "text-cyan-400"}>Danang</span>
              <span className={isAtTop ? "text-white" : "text-orange-400"}>Go</span>
            </span>
          </Link>

          {/* Sticky search — slide in sau vùng hero */}
          <AnimatePresence>
            {showStickySearch && (
              <motion.div
                initial={{ y: -16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -16, opacity: 0 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="hidden lg:flex w-44 xl:w-52 flex-shrink-0"
              >
                <div className="relative w-full">
                  <input
                    type="text"
                    placeholder="Tìm điểm đến..."
                    className={`w-full border text-sm rounded-full px-4 py-1.5 focus:outline-none transition-colors ${
                      isAtTop
                        ? "bg-white/20 border-white/30 text-white placeholder-white/70 focus:border-white shadow-sm"
                        : "bg-gray-100 border-gray-200 text-gray-700 placeholder-gray-400 focus:border-teal-400"
                    }`}
                  />
                  <button
                    className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${
                      isAtTop ? "text-white/70 hover:text-white" : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                    </svg>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ══ CỘT GIỮA: Menu ngang (md+) ══ */}
        <nav
          className="justify-self-center hidden md:flex items-center gap-1 lg:gap-2 flex-shrink-0"
          aria-label="Main navigation"
        >
          {/* Render 5 mục, ẩn 2 mục cuối trên màn hình nhỏ (chỉ hiện trên lg) */}
          {NAV_LINKS.map((link, index) => {
            const isActive = link.href === "/" 
              ? pathname === "/" 
              : pathname?.startsWith(link.href);
            
            const displayClass = index >= 3 ? "hidden lg:block" : "";

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-300 group ${displayClass} ${
                  isActive ? textColor : `${subTextColor} ${hoverTextColor}`
                }`}
              >
                {link.label}
                {isActive && (
                  <motion.span
                    layoutId="nav-underline"
                    className={`absolute bottom-1 left-3 right-3 h-0.5 rounded-full ${isAtTop ? "bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" : "bg-orange-400"}`}
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                {!isActive && (
                  <span
                    className={`absolute bottom-1 left-3 right-3 h-0.5 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left ${
                      isAtTop ? "bg-white/60" : "bg-gray-300"
                    }`}
                  />
                )}
              </Link>
            );
          })}

          {/* Dropdown "Khám phá" — hiện trên md..lg khi "Điểm du lịch" và "Bản đồ" bị gộp */}
          <div ref={exploreRef} className="relative lg:hidden">
            <button
              onClick={() => setExploreOpen(!exploreOpen)}
              className={`relative flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-300 ${subTextColor} ${hoverTextColor}`}
            >
              Khám phá
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                className={`transition-transform duration-200 ${exploreOpen ? "rotate-180" : ""}`}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            <AnimatePresence>
              {exploreOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.16 }}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 w-44 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 overflow-hidden"
                >
                  {[
                    { href: "/diemdulich", label: "Điểm du lịch", icon: "🏛️" },
                    { href: "/bando", label: "Bản đồ tương tác", icon: "🗺️" },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setExploreOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-teal-600 transition-colors"
                    >
                      <span>{item.icon}</span>
                      {item.label}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        {/* ══ CỘT PHẢI: CTA Desktop + Hamburger Mobile ══ */}
        <div className="justify-self-end flex items-center gap-2.5">

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Thêm lịch trình — nút chính */}
            <Link
              href="/lich-trinh/tao-moi"
              className={`btn-ripple h-10 flex items-center gap-1.5 text-sm font-semibold px-5 rounded-full transition-colors shadow-md whitespace-nowrap ${
                isAtTop 
                  ? "bg-white text-teal-600 hover:bg-gray-50 hover:text-teal-700 shadow-black/10" 
                  : "bg-teal-500 hover:bg-teal-400 text-white shadow-teal-500/25 hover:shadow-teal-400/30"
              }`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
              Thêm lịch trình
            </Link>

            {loading ? (
              <div className="w-10 h-10 rounded-full bg-white/20 animate-pulse border border-black/10"></div>
            ) : !user ? (
              <Link
                href="/dang-nhap"
                className={`h-10 flex items-center gap-1.5 text-sm font-medium px-4 rounded-full transition-all duration-300 border whitespace-nowrap ${
                  isAtTop
                    ? "text-white border-white bg-white/10 hover:bg-white/20 hover:border-white shadow-[0_2px_4px_rgba(0,0,0,0.1)] backdrop-blur-sm"
                    : "text-[#0f2942] border-gray-300 hover:border-teal-400 hover:text-teal-600 hover:bg-teal-50"
                }`}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
                Đăng nhập
              </Link>
            ) : (
              <div className="relative" ref={avatarRef}>
                <button
                  onClick={() => setAvatarDropdownOpen(!avatarDropdownOpen)}
                  className={`relative w-10 h-10 rounded-full border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400 shadow-sm ${
                    isAtTop ? "border-white/80 hover:border-white bg-white" : "border-gray-200 hover:border-teal-300 bg-gray-50"
                  }`}
                >
                  {user.avatarUrl ? (
                    <Image src={user.avatarUrl} alt={user.name} fill className="rounded-full object-cover" />
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
                                  <Image src={user.avatarUrl} alt={user.name} fill className="object-cover" />
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
                            <Link href="/ca-nhan" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-teal-600 transition-colors" onClick={() => setAvatarDropdownOpen(false)}>Trang cá nhân</Link>
                            <Link href="/ca-nhan?tab=offers" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-teal-600 transition-colors" onClick={() => setAvatarDropdownOpen(false)}>Ưu đãi thành viên VIP</Link>
                            <Link href="/lich-trinh" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-teal-600 transition-colors" onClick={() => setAvatarDropdownOpen(false)}>Lịch trình của tôi</Link>
                            <Link href="/ca-nhan?tab=reviews" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-teal-600 transition-colors" onClick={() => setAvatarDropdownOpen(false)}>Lịch sử đánh giá</Link>
                            <Link href="/ca-nhan?tab=settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-teal-600 transition-colors" onClick={() => setAvatarDropdownOpen(false)}>Cài đặt tài khoản</Link>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full relative overflow-hidden">
                              {user.avatarUrl ? (
                                <Image src={user.avatarUrl} alt={user.name} fill className="object-cover" />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
                                  {user.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{user.name}</p>
                              <p className="text-xs text-gray-500">{user.email}</p>
                              <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded-full font-medium">Thành viên thường</span>
                            </div>
                          </div>
                          
                          <div className="px-4 py-3 border-b border-gray-100">
                            <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 text-center">
                              <p className="text-xs text-orange-800 font-medium mb-2">Đăng ký thành viên VIP để nhận ưu đãi từ 500+ đối tác</p>
                              <Link 
                                href="/vip?action=register-vip" 
                                className="block w-full py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg transition-colors"
                                onClick={() => setAvatarDropdownOpen(false)}
                              >
                                Đăng ký thành viên VIP
                              </Link>
                            </div>
                            <div className="flex justify-between mt-3 px-2">
                              <div className="text-center">
                                <p className="text-lg font-bold text-teal-600">0</p>
                                <p className="text-[10px] text-gray-500">Lịch trình</p>
                              </div>
                              <div className="w-px h-8 bg-gray-200"></div>
                              <div className="text-center">
                                <p className="text-lg font-bold text-teal-600">0</p>
                                <p className="text-[10px] text-gray-500">Đánh giá</p>
                              </div>
                            </div>
                          </div>

                          <div className="py-1">
                            <Link href="/ca-nhan" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-teal-600 transition-colors" onClick={() => setAvatarDropdownOpen(false)}>Trang cá nhân</Link>
                            <Link href="/lich-trinh" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-teal-600 transition-colors" onClick={() => setAvatarDropdownOpen(false)}>Lịch trình của tôi</Link>
                            <Link href="/ca-nhan?tab=reviews" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-teal-600 transition-colors" onClick={() => setAvatarDropdownOpen(false)}>Lịch sử đánh giá</Link>
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

          {/* Mobile: Hamburger only */}
          <button
            className="flex md:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <div className="flex flex-col justify-center w-5 h-5 gap-[5px]">
              <div
                className={`w-5 h-0.5 rounded-full transition-all duration-300 ${
                  isAtTop ? "bg-white shadow-sm" : "bg-[#0f2942]"
                } ${mobileOpen ? "rotate-45 translate-y-[7px]" : ""}`}
              />
              <div
                className={`w-5 h-0.5 rounded-full transition-all duration-300 ${
                  isAtTop ? "bg-white shadow-sm" : "bg-[#0f2942]"
                } ${mobileOpen ? "opacity-0" : ""}`}
              />
              <div
                className={`w-5 h-0.5 rounded-full transition-all duration-300 ${
                  isAtTop ? "bg-white shadow-sm" : "bg-[#0f2942]"
                } ${mobileOpen ? "-rotate-45 -translate-y-[7px]" : ""}`}
              />
            </div>
          </button>
        </div>
      </div>

      {/* ── MOBILE MENU ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="relative z-10 md:hidden bg-white border-t border-gray-100 overflow-hidden shadow-xl"
          >
            <nav className="flex flex-col px-5 py-4 gap-1">
              {NAV_LINKS.map((link) => {
                const isActive = link.href === "/" 
                  ? pathname === "/" 
                  : pathname?.startsWith(link.href);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`py-2.5 px-3 rounded-xl text-sm transition-colors ${
                      isActive
                        ? "text-[#0f2942] font-semibold bg-gray-100 border-l-2 border-orange-400"
                        : "text-gray-600 hover:text-[#0f2942] hover:bg-gray-50"
                    }`}
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                );
              })}

              {/* Divider */}
              <div className="h-px my-3 bg-gray-200" />

              {loading ? (
                <div className="flex items-center justify-center py-3">
                  <div className="w-8 h-8 rounded-full bg-black/10 animate-pulse"></div>
                </div>
              ) : !user ? (
                <Link
                  href="/dang-nhap"
                  className="flex items-center justify-center gap-2 border border-gray-300 text-[#0f2942] hover:bg-gray-50 py-3 rounded-full text-sm font-medium transition-all"
                  onClick={() => setMobileOpen(false)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                  Đăng nhập
                </Link>
              ) : (
                <>
                  <Link
                    href="/ca-nhan"
                    className="flex items-center justify-center gap-2 border border-gray-300 text-[#0f2942] hover:bg-gray-50 py-3 rounded-full text-sm font-medium transition-all"
                    onClick={() => setMobileOpen(false)}
                  >
                    Hồ sơ của tôi
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
                className="flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-400 text-white py-3 rounded-full text-sm font-semibold mt-1 transition-colors"
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
