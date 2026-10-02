"use client";
import Link from 'next/link';

/**
 * DanangGo — Trang chủ (route "/")
 *
 * ANIMATION GIỮ NGUYÊN HOÀN TOÀN:
 * - Hero: Ken Burns bg + CSS fade-up stagger (LCP-safe)
 * - Reveal wrapper: scroll-triggered fade-up/left/right
 * - PopularCard: hover translateY + shadow + img scale + like bounce
 * - CategoryCard: hover img scale + overlay + CTA slide-up
 * - Itinerary: layoutId pill toggle + AnimatePresence crossfade
 * - Newsletter: shimmer-bg + ripple button
 * - AnimatedCounter: easeOutCubic khi vào viewport
 * - Scroll-to-top: fade-in + slide AnimatePresence
 *
 * BỔ SUNG nội dung theo ảnh tham chiếu:
 * - Hero: đúng H1, quote nghiêng, search 2 ô, tags chuẩn
 * - Popular: 4 card (bỏ 2 cuối), thêm giá, nhãn "CẬP NHẬT 24H QUA", "120+ địa điểm"
 * - Story: badge ảnh, author avatar, nút "Đọc câu chuyện"
 * - Categories: icon góc trên, mô tả section, nút CTA per card
 * - Itinerary: layout 3 cột đồng thời, badge chủ đề, stats dưới mỗi cột
 * - VIP Banner: 2 CTA, badge đặc quyền
 * - Footer: 3 cột đúng label (Khám phá / Tiện ích / Liên hệ), social icons
 */

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import Reveal from "@/components/ui/Reveal";
import AnimatedCounter from "@/components/ui/AnimatedCounter";


// ============================================================
// DATA
// ============================================================

// 4 card theo ảnh tham chiếu (giảm từ 6 xuống 4)
const POPULAR_CARDS = [
  {
    id: 1,
    title: "Bãi biển Mỹ Khê",
    category: "Bãi biển",
    location: "Đà Nẵng",
    rating: 4.9,
    reviews: 2341,
    price: "Miễn phí",
    img: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600&q=80",
    badge: "🔥 Hot",
    badgeColor: "bg-red-500",
  },
  {
    id: 2,
    title: "Bánh Xèo Tôm Nhảy Chị Bảo",
    category: "Ẩm thực",
    location: "Đà Nẵng",
    rating: 4.8,
    reviews: 1893,
    price: "40.000₫",
    img: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600&q=80",
    badge: "🍜 Đặc sản",
    badgeColor: "bg-orange-500",
  },
  {
    id: 3,
    title: "Cầu Rồng Phun Lửa & Phun Nước",
    category: "Điểm tham quan",
    location: "Đà Nẵng",
    rating: 4.9,
    reviews: 3102,
    price: "Miễn phí",
    img: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600&q=80",
    badge: "🏆 Nổi bật",
    badgeColor: "bg-yellow-500",
  },
  {
    id: 4,
    title: "Bà Nà Hills & Cầu Vàng",
    category: "Điểm tham quan",
    location: "Đà Nẵng",
    rating: 4.8,
    reviews: 1204,
    price: "từ 750.000₫",
    img: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=600&q=80",
    badge: "⭐ Top 1",
    badgeColor: "bg-teal-600",
  },
];

// Categories với icon góc trên + số liệu + CTA per card
const CATEGORIES = [
  {
    id: "luutru",
    label: "Lưu Trú Nghỉ Dưỡng",
    desc: "Từ resort 5 sao view biển đến homestay cozy giữa phố cổ — tất cả chờ bạn.",
    count: 124,
    icon: "🏨",
    stat: "124 lựa chọn",
    cta: "Xem 124+ khách sạn",
    img: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80",
    color: "from-blue-600/70",
  },
  {
    id: "amthuc",
    label: "Thiên Đường Ẩm Thực",
    desc: "Mì Quảng, bánh tráng cuốn thịt heo, bún mắm nêm — đặc sản không thể bỏ qua.",
    count: 89,
    icon: "🍜",
    stat: "89 nhà hàng",
    cta: "Khám phá ẩm thực",
    img: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=800&q=80",
    color: "from-orange-600/70",
  },
  {
    id: "diemdden",
    label: "Điểm Du Lịch & Check-in",
    desc: "Cầu Vàng, Cầu Rồng, Sơn Trà — những biểu tượng không thể thiếu trong hành trình.",
    count: 67,
    icon: "🗺️",
    stat: "67 điểm đến",
    cta: "Xem điểm check-in",
    img: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800&q=80",
    color: "from-teal-600/70",
  },
];

// Itinerary data — layout 3 cột đồng thời theo ảnh
const ITINERARY_PLANS = {
  "3N2D": {
    label: "Lịch trình 3N2Đ (Cổ điển)",
    days: [
      {
        day: "Ngày 01",
        theme: "🌅 Biển & Phố Cổ",
        items: [
          { time: "07:00", activity: "Cà phê sáng ven biển Mỹ Khê" },
          { time: "09:00", activity: "Tham quan Bảo tàng Điêu khắc Chăm" },
          { time: "11:00", activity: "Ăn trưa: Mì Quảng Bà Mua đặc sản" },
          { time: "14:00", activity: "Ngắm Cầu Rồng, cầu Tình Yêu" },
          { time: "19:00", activity: "Xem Cầu Rồng phun lửa (T7, CN)" },
        ],
        duration: "Cả ngày",
        spots: 5,
      },
      {
        day: "Ngày 02",
        theme: "🚡 Bà Nà Hills",
        items: [
          { time: "07:30", activity: "Khởi hành lên Bà Nà Hills" },
          { time: "09:00", activity: "Đi cáp treo dài nhất thế giới" },
          { time: "10:30", activity: "Check-in Cầu Vàng huyền thoại" },
          { time: "12:30", activity: "Buffet tại Fantasy Park" },
          { time: "15:00", activity: "Phố Pháp cổ kính lãng mạn" },
        ],
        duration: "Cả ngày",
        spots: 6,
      },
      {
        day: "Ngày 03",
        theme: "🏮 Hội An & Bay Về",
        items: [
          { time: "08:00", activity: "Drive đến Hội An (45 phút)" },
          { time: "09:30", activity: "Dạo phố cổ, ngắm đèn lồng" },
          { time: "12:00", activity: "Cơm gà Hội An nổi tiếng" },
          { time: "14:30", activity: "Mua quà lưu niệm làng nghề" },
          { time: "17:00", activity: "Trở về sân bay Đà Nẵng" },
        ],
        duration: "Cả ngày",
        spots: 5,
      },
    ],
  },
  "4N3D": {
    label: "Lịch trình 4N3Đ (Trọn vẹn)",
    days: [
      {
        day: "Ngày 01",
        theme: "🌅 Khám Phá Đà Nẵng",
        items: [
          { time: "07:00", activity: "Cà phê view biển Mỹ Khê" },
          { time: "09:00", activity: "Bán đảo Sơn Trà — Chùa Linh Ứng" },
          { time: "12:00", activity: "Trưa: Bún mắm nêm đặc sản" },
          { time: "15:00", activity: "Bãi biển Mỹ Khê thư giãn" },
          { time: "18:00", activity: "Chợ Hàn — mua sắm đặc sản" },
        ],
        duration: "Cả ngày",
        spots: 5,
      },
      {
        day: "Ngày 02",
        theme: "🚡 Bà Nà Hills",
        items: [
          { time: "07:30", activity: "Khởi hành lên Bà Nà Hills" },
          { time: "09:00", activity: "Cáp treo + Cầu Vàng" },
          { time: "12:30", activity: "Buffet Fantasy Park" },
          { time: "14:00", activity: "Khu vui chơi Wax Village" },
          { time: "17:00", activity: "Xuống núi, nghỉ ngơi" },
        ],
        duration: "Cả ngày",
        spots: 6,
      },
      {
        day: "Ngày 03",
        theme: "🏮 Hội An Phố Cổ",
        items: [
          { time: "08:00", activity: "Drive đến Hội An" },
          { time: "09:30", activity: "Phố đi bộ Nguyễn Hoàng" },
          { time: "11:00", activity: "Học làm đèn lồng" },
          { time: "12:30", activity: "Cơm gà Phố Hội" },
          { time: "19:00", activity: "Đêm thả đèn hoa đăng" },
        ],
        duration: "Cả ngày",
        spots: 7,
      },
    ],
  },
} as const;

type PlanKey = keyof typeof ITINERARY_PLANS;

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function HomePage() {
  const [likedCards, setLikedCards] = useState<Set<number>>(new Set());
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>("3N2D");
  const [showScrollTop, setShowScrollTop] = useState(false);

  const heroSectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroSectionRef, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
  const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;



  useEffect(() => {
    const handler = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const toggleLike = (id: number) => {
    setLikedCards((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const currentPlan = ITINERARY_PLANS[selectedPlan];

  return (
    <>
      {/* ============================================================
          1. HERO SECTION
          Ken Burns bg + CSS fade-up stagger (LCP-safe, không chờ JS)
          ============================================================ */}
      <section
        ref={heroSectionRef}
        data-navbar-overlay="true"
        id="hero"
        className="relative h-screen min-h-[640px] flex items-center overflow-hidden"
      >
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 via-black/10 to-transparent pointer-events-none z-20" />
        {/* Ken Burns background */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div className="absolute inset-0 ken-burns" style={{ y }}>
            <Image
              src="https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1920&q=85"
              alt="Bãi biển Đà Nẵng nhìn từ trên cao"
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-b from-[#071a2e]/65 via-[#0f2942]/45 to-[#071a2e]/85" />
        </div>

        {/* Hero Content — CSS animation chạy ngay, không chờ JS hydrate (LCP-safe) */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full pt-20">
          {/* Badge nhỏ */}
          <div
            className="eyebrow-label inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-white/80 text-xs mb-5"
            style={{ opacity: 0, animation: "fade-up 0.6s 0.1s ease-out forwards" }}
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Cẩm nang du lịch Đà Nẵng 2025
          </div>

          {/* H1 — đúng theo ảnh tham chiếu */}
          <h1
            className="h1-hero text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4 max-w-3xl"
            style={{ opacity: 0, animation: "fade-up 0.7s 0.2s ease-out forwards" }}
          >
            Khám Phá Đà Nẵng —{" "}
            <span className="text-gradient-animate">
              Thiên Đường Biển
            </span>{" "}
            & Văn Hóa Miền Trung
          </h1>

          {/* Quote nghiêng */}
          <p
            className="body-text italic text-white/70 text-base sm:text-lg max-w-xl mb-7 leading-relaxed"
            style={{ opacity: 0, animation: "fade-up 0.7s 0.32s ease-out forwards" }}
          >
            "Đà Nẵng — nơi ánh nắng chạm sóng biển, lịch sử hòa quyện cùng hiện đại,
            và mỗi góc phố đều là một câu chuyện đáng nhớ."
          </p>

          {/* Search box 2 ô */}
          <div
            style={{ opacity: 0, animation: "fade-up 0.7s 0.45s ease-out forwards" }}
          >
            <div className="flex flex-col sm:flex-row gap-2 max-w-2xl bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-2">
              {/* Ô 1: Địa điểm */}
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                <input
                  type="text"
                  placeholder="Địa điểm lưu trú..."
                  className="w-full bg-transparent text-white placeholder-white/50 pl-9 pr-3 py-3 focus:outline-none text-sm"
                />
              </div>
              {/* Divider */}
              <div className="hidden sm:block w-px bg-white/20 my-2" />
              {/* Ô 2: Khu vực / Sở thích */}
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  type="text"
                  placeholder="Khu vực · Sở thích..."
                  className="w-full bg-transparent text-white placeholder-white/50 pl-9 pr-3 py-3 focus:outline-none text-sm"
                />
              </div>
              {/* Nút tìm kiếm */}
              <button className="btn-ripple bg-orange-500 hover:bg-orange-400 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm hover:scale-[1.02] active:scale-[0.97] whitespace-nowrap">
                Tìm kiếm
              </button>
            </div>

            {/* Tags xu hướng */}
            <div
              className="flex flex-wrap gap-2 mt-4"
              style={{ opacity: 0, animation: "fade-up 0.6s 0.6s ease-out forwards" }}
            >
              <span className="text-white/60 text-xs mr-1 self-center">🔥 Xu hướng:</span>
              {["#MyKheBeach", "#CauRongPhunLua", "#NuiSonTra", "#NguHanhSon", "#BaNaHills"].map((tag) => (
                <motion.button
                  whileHover={{ y: -2, scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  key={tag}
                  className="text-white/70 bg-white/10 hover:bg-cyan-500/30 hover:text-cyan-300 border border-white/20 hover:border-cyan-400/40 text-xs px-3 py-1.5 rounded-full transition-all hover:-translate-y-0.5 hover:scale-105 active:scale-95"
                >
                  {tag}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-white/40">
          <span className="text-xs tracking-widest uppercase">Cuộn xuống</span>
          <div className="w-px h-10 bg-gradient-to-b from-white/40 to-transparent" style={{ animation: "float 2s ease-in-out infinite" }} />
        </div>
      </section>

      {/* ============================================================
          2. STATS ROW — lấp lánh gradient navy
          ============================================================ */}
      <section className="relative overflow-hidden bg-white py-12">
        {/* Shimmer sweep chạy qua nền */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background:
              "linear-gradient(105deg, transparent 40%, rgba(34,211,238,0.15) 50%, transparent 60%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 4s ease-in-out infinite",
          }}
        />
        {/* Glowing dots trang trí */}
        <div className="absolute top-3 left-1/4 w-1 h-1 rounded-full bg-cyan-400 opacity-60 animate-pulse" />
        <div className="absolute bottom-3 right-1/3 w-1 h-1 rounded-full bg-orange-400 opacity-60" style={{ animation: "pulse-badge 2.5s ease-in-out infinite" }} />
        <div className="absolute top-5 right-1/4 w-0.5 h-0.5 rounded-full bg-cyan-300 opacity-40 animate-pulse" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {[
              { to: 500, suffix: "+", label: "Địa điểm", icon: "📍", color: "from-cyan-400 to-teal-400" },
              { to: 1500, suffix: "+", label: "Đánh giá", icon: "⭐", color: "from-yellow-400 to-orange-400" },
              { to: 98, suffix: "%", label: "Hài lòng", icon: "💚", color: "from-emerald-400 to-green-400" },
              { to: 50, suffix: "+", label: "Lịch trình mẫu", icon: "🗺️", color: "from-purple-400 to-pink-400" },
            ].map((stat, i) => (
              <Reveal key={stat.label} delay={i * 0.1}>
                <div
                  className={`flex flex-col items-center text-center px-6 py-2 ${
                    i < 3 ? "md:border-r border-gray-200" : ""
                  }`}
                >
                  {/* Icon nhỏ */}
                  <span className="text-xl mb-2">{stat.icon}</span>

                  {/* Số đếm — gradient text lấp lánh, glow qua filter */}
                  <div className="stat-number" style={{ filter: "drop-shadow(0 0 12px rgba(34,211,238,0.2))" }}>
                    <AnimatedCounter
                      to={stat.to}
                      suffix={stat.suffix}
                      className={`text-4xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent leading-none`}
                    />
                  </div>

                  {/* Label */}
                  <p className="text-gray-500 text-xs font-medium mt-1.5 tracking-wide uppercase">
                    {stat.label}
                  </p>

                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>


      {/* ============================================================
          3. POPULAR — "Được xem nhiều nhất tuần qua"
          4 cards, stagger reveal, hover effects GIỮ NGUYÊN
          ============================================================ */}
      <section id="popular" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Reveal direction="left" delay={0}>
            <div className="flex items-end justify-between mb-10">
              <div>
                {/* Nhãn nhỏ "CẬP NHẬT 24H QUA" */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-red-500 font-bold text-xs uppercase tracking-widest">
                    Cập nhật 24h qua
                  </span>
                </div>
                <h2 className="h2-section text-2xl sm:text-3xl font-bold text-[#0f2942]">
                  Được xem nhiều nhất tuần qua
                </h2>
              </div>
              <motion.a
                whileTap={{ scale: 0.97 }}
                href="#"
                className="text-teal-600 hover:text-teal-500 font-medium text-sm hidden sm:flex items-center gap-1 hover:gap-2 transition-all whitespace-nowrap"
              >
                Xem tất cả 120+ địa điểm&nbsp;<motion.span whileHover={{ x: 3 }} transition={{ duration: 0.2 }}>→</motion.span>
              </motion.a>
            </div>
          </Reveal>

          {/* 4-card grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {POPULAR_CARDS.map((card, i) => (
              <Reveal key={card.id} delay={prefersReduced ? 0 : i * 0.08}>
                <PopularCard
                  card={card}
                  liked={likedCards.has(card.id)}
                  onToggleLike={() => toggleLike(card.id)}
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          4. STORY — "Câu chuyện & Cảm hứng Du lịch"
          Reveal fade-left/right GIỮ NGUYÊN, bổ sung badge ảnh + author + CTA
          ============================================================ */}
      <section id="cauchuyenvacamhung" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Reveal direction="right" delay={0} className="mb-10">
            {/* Nhãn nhỏ */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-teal-600 font-bold text-xs uppercase tracking-widest">
                DanangGo Editorial Stories
              </span>
            </div>
            <div className="flex items-end justify-between">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0f2942]">
                Câu chuyện &amp; Cảm hứng Du lịch
              </h2>
            </div>
          </Reveal>

          <div className="grid lg:grid-cols-2 gap-10 items-center">
            {/* Ảnh lớn bên trái */}
            <Reveal direction="left" className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-[4/3]">
                <Image
                  src="https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800&q=80"
                  alt="Khoảnh khắc hoàng hôn Đà Nẵng"
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-700"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                {/* Badge "Trải nghiệm địa phương" */}
                <div className="absolute top-4 left-4 bg-teal-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg">
                  Trải nghiệm địa phương
                </div>
                {/* Caption overlay dưới */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#071a2e]/80 to-transparent p-5">
                  <p className="text-white font-semibold text-sm leading-snug">
                    Khi ánh bình minh chạm đỉnh Bàn Cờ và tiếng sóng thì thầm Bãi Rạng
                  </p>
                </div>
              </div>
            </Reveal>

            {/* Nội dung bên phải */}
            <Reveal direction="right" delay={0.15}>
              <div className="space-y-5">
                {/* Tên tác giả + avatar */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-teal-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    AN
                  </div>
                  <div>
                    <p className="text-[#0f2942] font-semibold text-sm">Anh Nguyên</p>
                    <p className="text-gray-400 text-xs">Tác giả & Travel Editor · DanangGo</p>
                  </div>
                </div>

                <h3 className="h3-card text-xl font-bold text-[#0f2942] leading-snug">
                  Đà Nẵng — Thành phố đáng sống nhất Đông Nam Á 2025
                </h3>

                <p className="body-text text-gray-600 leading-relaxed text-sm">
                  Được ví như "thành phố của cầu", Đà Nẵng sở hữu bờ biển trải dài 30km,
                  khí hậu trong lành và người dân thân thiện. Từ bãi biển Mỹ Khê trong xanh
                  đến đỉnh Bà Nà Hills mây phủ, mỗi khoảnh khắc đều là một bức tranh...
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: "🏖️", text: "30km bờ biển" },
                    { icon: "🌡️", text: "26°C quanh năm" },
                    { icon: "✈️", text: "Bay thẳng 30+ nước" },
                    { icon: "🏆", text: "Top 10 điểm đến Á" },
                  ].map((item) => (
                    <div key={item.text} className="flex items-center gap-2 bg-gray-50 rounded-xl p-2.5">
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-xs font-medium text-[#0f2942]">{item.text}</span>
                    </div>
                  ))}
                </div>

                {/* Nút "Đọc câu chuyện" */}
                <button className="btn-ripple bg-[#0f2942] hover:bg-[#1a3f5c] text-white font-semibold px-6 py-2.5 rounded-xl transition-colors hover:scale-[1.02] active:scale-[0.98] text-sm">
                  Đọc câu chuyện →
                </button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================================================
          5. CATEGORIES — "Khám phá theo danh mục"
          Hover overlay GIỮ NGUYÊN, bổ sung: mô tả section, icon góc trên, CTA per card
          ============================================================ */}
      <section id="khamphatheodanhmuc" className="py-16 bg-[#0f2942]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Reveal direction="left" delay={0} className="mb-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-cyan-400 font-bold text-xs uppercase tracking-widest">
                Đa dạng lựa chọn
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h2 className="h2-section text-2xl sm:text-3xl font-bold text-white">
                  Khám phá theo danh mục
                </h2>
                <p className="body-text text-white/60 text-sm mt-1.5 max-w-md">
                  Chọn đúng danh mục, tìm đúng trải nghiệm — từ nghỉ dưỡng sang trọng
                  đến ẩm thực dân dã và điểm check-in hot nhất Đà Nẵng.
                </p>
              </div>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-5">
            {CATEGORIES.map((cat, i) => (
              <Reveal key={cat.id} delay={prefersReduced ? 0 : i * 0.1}>
                <CategoryCard category={cat} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          6. ITINERARY — "Lịch trình gợi ý & Cảm hứng khám phá"
          layoutId toggle GIỮ NGUYÊN, bổ sung: 3 cột đồng thời, badge, stats, CTA per col
          ============================================================ */}
      <section id="lichtrinhgoiY" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Reveal direction="right" delay={0} className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-orange-500 font-bold text-xs uppercase tracking-widest">
                Lên kế hoạch dễ dàng
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0f2942]">
                Lịch trình gợi ý &amp; Cảm hứng khám phá
              </h2>
              {/* Toggle 3N2D / 4N3D với layoutId pill */}
              <div className="inline-flex bg-white border border-gray-200 rounded-full p-1 gap-1 shadow-sm flex-shrink-0">
                {(Object.keys(ITINERARY_PLANS) as PlanKey[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => setSelectedPlan(key)}
                    className={`relative px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      selectedPlan === key ? "text-white" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {selectedPlan === key && (
                      <motion.div
                        layoutId="plan-pill"
                        className="absolute inset-0 bg-[#0f2942] rounded-full"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{ITINERARY_PLANS[key].label}</span>
                  </button>
                ))}
              </div>
            </div>
          </Reveal>

          {/* 3 cột ngày đồng thời — crossfade khi đổi plan */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedPlan}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="grid md:grid-cols-3 gap-5"
            >
              {currentPlan.days.map((dayData, i) => (
                <Reveal key={dayData.day} delay={i * 0.08}>
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 h-full flex flex-col">
                    {/* Header ngày */}
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="h3-card font-bold text-[#0f2942] text-base">{dayData.day}</h3>
                      <span className="bg-teal-50 text-teal-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                        {dayData.theme}
                      </span>
                    </div>

                    {/* Timeline items */}
                    <div className="space-y-3 flex-1">
                      {dayData.items.map((item, idx) => (
                        <div key={idx} className="flex gap-3 items-start">
                          <span className="flex-shrink-0 text-xs font-mono text-teal-600 font-semibold w-12 pt-0.5">
                            {item.time}
                          </span>
                          <div className="flex-shrink-0 flex flex-col items-center">
                            <div className="w-2.5 h-2.5 rounded-full bg-orange-400 mt-0.5" />
                            {idx < dayData.items.length - 1 && (
                              <div className="w-px flex-1 bg-orange-200 mt-1 min-h-[16px]" />
                            )}
                          </div>
                          <p className="text-gray-600 text-xs leading-relaxed">{item.activity}</p>
                        </div>
                      ))}
                    </div>

                    {/* Stats + CTA dưới cùng */}
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>⏱ {dayData.duration}</span>
                        <span>📍 {dayData.spots} điểm</span>
                      </div>
                      <button className="text-xs text-teal-600 font-semibold hover:text-teal-500 transition-colors">
                        Gợi ý {dayData.spots} điểm →
                      </button>
                    </div>
                  </div>
                </Reveal>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ============================================================
          7. VIP BANNER — "Nhận Ưu Đãi Tới 25%"
          shimmer-bg GIỮ NGUYÊN, bổ sung: badge đặc quyền, 2 nút CTA
          ============================================================ */}
      <section id="newsletter" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Reveal delay={0.1} direction="up">
            <div className="shimmer-bg rounded-3xl p-10 sm:p-14 text-center text-white relative overflow-hidden">
              {/* Decorative circles */}
              <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/5" />
              <div className="absolute -bottom-12 -left-12 w-64 h-64 rounded-full bg-white/5" />

              <div className="relative z-10">
                {/* Badge đặc quyền */}
                <div className="inline-block bg-orange-500/20 border border-orange-400/30 text-orange-300 text-xs font-bold px-4 py-1.5 rounded-full mb-5 uppercase tracking-wider">
                  ĐẶC QUYỀN THÀNH VIÊN DANANGGO VIP
                </div>

                <h2 className="h2-section text-2xl sm:text-4xl font-bold mb-3">
                  Nhận Ưu Đãi Tới{" "}
                  <span className="text-gradient-animate-warm text-orange-400">25%</span>{" "}
                  Khi Đặt Lưu Trú & Vé Tham Quan
                </h2>
                <p className="body-text text-white/70 max-w-lg mx-auto mb-8 text-sm leading-relaxed">
                  Trở thành thành viên VIP DanangGo — nhận voucher độc quyền,
                  ưu đãi flash sale và lịch trình cá nhân hóa miễn phí.
                </p>

                {/* 2 nút CTA */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/dang-nhap?tab=dang-ky&intent=vip" className="btn-ripple inline-flex items-center justify-center bg-orange-500 hover:bg-orange-400 text-white font-bold px-8 py-3.5 rounded-xl transition-colors hover:scale-[1.03] active:scale-[0.97] text-sm">
                    Đăng ký thành viên VIP
                  </Link>
                  <Link href="/lich-trinh/tao-moi" className="border-2 border-white/60 hover:border-white text-white hover:bg-white/10 font-semibold px-8 py-3.5 rounded-xl transition-all text-sm inline-flex items-center justify-center">
                    📋 Tạo lịch trình của bạn
                  </Link>
                </div>

                <p className="text-white/40 text-xs mt-4">
                  Miễn phí hoàn toàn · Không cần thẻ tín dụng · Hủy bất kỳ lúc nào
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================================================
          8. FOOTER — 3 cột: Khám phá / Tiện ích / Liên hệ
          ============================================================ */}
      <footer className="bg-[#071a2e] text-white/70 pt-14 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {/* Logo + mô tả */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-teal-600 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">D</span>
                </div>
                <span className="text-white font-bold text-lg">
                  <span className="text-cyan-400">Danang</span>
                  <span className="text-orange-400">Go</span>
                </span>
              </div>
              <p className="body-text text-sm leading-relaxed text-white/50 mb-4">
                Cẩm nang du lịch Đà Nẵng đầy đủ và cập nhật nhất — từ điểm đến,
                ẩm thực đến lịch trình tối ưu.
              </p>
              {/* Social icons */}
              <div className="flex gap-3">
                {[
                  { label: "FB", color: "bg-blue-600" },
                  { label: "IG", color: "bg-pink-600" },
                  { label: "TT", color: "bg-gray-700" },
                  { label: "YT", color: "bg-red-600" },
                ].map((s) => (
                  <a
                    key={s.label}
                    href="#"
                    className={`w-8 h-8 ${s.color} rounded-full flex items-center justify-center text-white text-xs font-bold hover:opacity-80 transition-opacity`}
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Cột Khám phá */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Khám phá</h4>
              <ul className="space-y-2.5">
                {["Điểm du lịch", "Ẩm thực", "Lưu trú", "Mua sắm", "Giải trí"].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm hover:text-white transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Cột Tiện ích */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Tiện ích</h4>
              <ul className="space-y-2.5">
                {["Tạo lịch trình", "Bản đồ thành phố", "Thời tiết", "Đặt vé online", "Hỏi đáp"].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm hover:text-white transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Cột Liên hệ */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Liên hệ</h4>
              <ul className="space-y-2.5">
                <li className="text-sm">📧 hello@dananggo.vn</li>
                <li className="text-sm">📞 0236 386 5xxx</li>
                <li className="text-sm">📍 Đà Nẵng, Việt Nam</li>
              </ul>
              <div className="mt-4 space-y-1.5">
                {["Về chúng tôi", "Tuyển dụng", "Báo chí"].map((link) => (
                  <a key={link} href="#" className="block text-sm hover:text-white transition-colors">{link}</a>
                ))}
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
            <p>© 2025 DanangGo. Made with ❤️ in Đà Nẵng, Việt Nam.</p>
            <div className="flex gap-4">
              {["Điều khoản sử dụng", "Chính sách bảo mật"].map((s) => (
                <a key={s} href="#" className="hover:text-white/70 transition-colors">{s}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* ============================================================
          SCROLL-TO-TOP — fade-in + slide khi scroll > 400px (GIỮ NGUYÊN)
          ============================================================ */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ duration: 0.25 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-8 right-8 z-40 w-12 h-12 bg-[#0f2942] hover:bg-[#1a3f5c] text-white rounded-full shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
            aria-label="Lên đầu trang"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="m18 15-6-6-6 6" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================================
// SUB-COMPONENTS (GIỮ NGUYÊN animation, chỉ bổ sung nội dung)
// ============================================================

/**
 * PopularCard — hover translateY + shadow + img scale + like bounce (GIỮ NGUYÊN)
 * Bổ sung: location + price fields
 */
function PopularCard({
  card,
  liked,
  onToggleLike,
}: {
  card: (typeof POPULAR_CARDS)[0];
  liked: boolean;
  onToggleLike: () => void;
}) {
  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer">
      {/* Image */}
      <div className="relative h-44 overflow-hidden">
        <Image
          src={card.img}
          alt={card.title}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        {/* Badge */}
        <div className="absolute top-3 left-3">
          <span className={`${card.badgeColor} text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm`}>
            {card.badge}
          </span>
        </div>
        {/* Like button — scale bounce khi click */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleLike(); }}
          className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:scale-110 active:scale-125 transition-transform"
          aria-label={liked ? "Bỏ yêu thích" : "Yêu thích"}
        >
          <motion.svg width="14" height="14" viewBox="0 0 24 24" animate={liked ? { scale: [1, 1.4, 1] } : { scale: 1 }} transition={{ duration: 0.3 }}>
            <path
              d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
              fill={liked ? "#ef4444" : "none"}
              stroke={liked ? "#ef4444" : "#9ca3af"}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </motion.svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <span className="text-xs text-teal-600 font-semibold bg-teal-50 px-2 py-0.5 rounded-full">
          {card.category}
        </span>
        <h3 className="font-bold text-[#0f2942] text-sm mt-2 mb-1 leading-snug group-hover:text-teal-700 transition-colors line-clamp-2">
          {card.title}
        </h3>
        {/* Location */}
        <div className="flex items-center gap-1 text-gray-400 text-xs mb-2">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          {card.location}
        </div>
        {/* Rating + Price */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-yellow-400 text-xs">★</span>
            <span className="text-xs font-semibold text-gray-700">{card.rating}</span>
            <span className="text-xs text-gray-400">({card.reviews.toLocaleString("en-US")})</span>
          </div>
          <span className="text-xs font-bold text-orange-500">{card.price}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * CategoryCard — hover img scale + overlay tối dần + CTA slide-up (GIỮ NGUYÊN)
 * Bổ sung: icon nhỏ góc trên, stat, nút CTA riêng
 */
function CategoryCard({ category }: { category: (typeof CATEGORIES)[0] }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.25 }}
      className="group relative rounded-2xl overflow-hidden cursor-pointer h-72 shadow-lg"
    >
      <Image
        src={category.img}
        alt={category.label}
        fill
        className="object-cover group-hover:scale-110 transition-transform duration-500"
        sizes="(max-width: 768px) 100vw, 33vw"
      />
      {/* Overlay tối dần khi hover */}
      <div className={`absolute inset-0 bg-gradient-to-t ${category.color} to-[#071a2e]/80 group-hover:to-[#071a2e]/90 transition-all duration-300`} />

      {/* Icon nhỏ góc trên trái */}
      <div className="absolute top-4 left-4 bg-white/20 backdrop-blur-sm rounded-xl px-2.5 py-1.5 text-sm font-semibold text-white">
        {category.icon} {category.stat}
      </div>

      {/* Content dưới */}
      <div className="absolute inset-0 flex flex-col justify-end p-5">
        <h3 className="text-white text-xl font-bold mb-1">{category.label}</h3>
        <p className="text-white/70 text-xs leading-relaxed mb-3">{category.desc}</p>

        {/* CTA slide up khi hover */}
        <span className="inline-block text-white bg-white/20 hover:bg-white/30 border border-white/30 text-xs font-semibold px-4 py-2 rounded-full translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 w-fit">
          {category.cta} →
        </span>
      </div>
    </motion.div>
  );
}
