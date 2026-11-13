"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import HeroSearchBar from "./HeroSearchBar";
import HeroCarouselBackground from "./HeroCarouselBackground";
import HeroSlideCopy from "./HeroSlideCopy";
import HeroIndicators from "./HeroIndicators";
import { HERO_SLIDES, INTERVAL_MS, SHOW_INDICATORS } from "./hero-data";

export default function HomeHero() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [firstLoaded, setFirstLoaded] = useState(false);
  const [slidesLoaded, setSlidesLoaded] = useState<boolean[]>([false, false, false]);
  const [isPaused, setIsPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Detect prefers-reduced-motion
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Preload remaining images sau khi ảnh đầu đã tải xong
  useEffect(() => {
    if (!firstLoaded || typeof window === "undefined") return;
    HERO_SLIDES.forEach((slide, idx) => {
      if (idx === 0) return;
      const img = new window.Image();
      img.src = slide.image;
      img.onload = () => {
        setSlidesLoaded((prev) => {
          const updated = [...prev];
          updated[idx] = true;
          return updated;
        });
      };
    });
  }, [firstLoaded]);

  // Tạm dừng khi tab bị ẩn, tiếp tục khi quay lại
  useEffect(() => {
    if (typeof document === "undefined") return;
    const handleVisibilityChange = () => setIsPaused(document.hidden);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Autoplay: setTimeout chain, đúng 3 giây/ảnh
  useEffect(() => {
    if (reducedMotion || !firstLoaded || isPaused) return;
    const nextIndex = (activeIndex + 1) % HERO_SLIDES.length;
    let retryTimer: ReturnType<typeof setInterval> | null = null;

    const timer = setTimeout(() => {
      if (slidesLoaded[nextIndex]) {
        setActiveIndex(nextIndex);
      } else {
        retryTimer = setInterval(() => {
          if (slidesLoaded[nextIndex]) {
            if (retryTimer) clearInterval(retryTimer);
            setActiveIndex(nextIndex);
          }
        }, 150);
      }
    }, INTERVAL_MS);

    return () => {
      clearTimeout(timer);
      if (retryTimer) clearInterval(retryTimer);
    };
  }, [activeIndex, firstLoaded, isPaused, reducedMotion, slidesLoaded]);

  const handleFirstLoaded = useCallback(() => {
    setFirstLoaded(true);
    setSlidesLoaded((prev) => {
      const updated = [...prev];
      updated[0] = true;
      return updated;
    });
  }, []);

  const handleSlideLoaded = useCallback((index: number) => {
    setSlidesLoaded((prev) => {
      const updated = [...prev];
      updated[index] = true;
      return updated;
    });
  }, []);

  return (
    <section
      id="hero"
      data-navbar-overlay="true"
      aria-roledescription="carousel"
      aria-label="Cẩm nang du lịch DaNangGo"
      className="relative w-full overflow-hidden flex items-center min-h-screen"
    >
      {/* ── z-0, z-10 & z-15: Carousel ảnh HD + overlay ngang + Header Scrim cho Navbar ── */}
      <HeroCarouselBackground
        activeIndex={activeIndex}
        reducedMotion={reducedMotion}
        onFirstLoaded={handleFirstLoaded}
        onSlideLoaded={handleSlideLoaded}
      />

      {/* ── z-20: Nội dung (Padding-top đủ lớn cách đáy navbar >= 24px, đệm dưới an toàn) ── */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 w-full pt-24 sm:pt-28 lg:pt-32 pb-24 sm:pb-28">
        {/* a) Chữ thay đổi theo slide — Stagger 180ms, duration 800ms, easing mượt mà */}
        <HeroSlideCopy activeIndex={activeIndex} reducedMotion={reducedMotion} />

        {/* b) Khối CỐ ĐỊNH — Fade-up nhẹ nhàng khi tải trang */}
        <motion.div
          className="w-full max-w-2xl lg:max-w-3xl"
          initial={{ opacity: 0, y: reducedMotion ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.75,
            delay: 0.5,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {/* Thanh tìm kiếm 3 khu vực thống nhất: Địa điểm | Ngân sách | Nút tìm kiếm #FF7300 */}
          <HeroSearchBar />

          {/* Hashtag xu hướng */}
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="text-white/60 text-xs mr-1 self-center font-medium">🔥 Xu hướng:</span>
            {[
              { tag: "#MyKheBeach", q: "Biển Mỹ Khê" },
              { tag: "#CauRongPhunLua", q: "Cầu Rồng" },
              { tag: "#NuiSonTra", q: "Sơn Trà" },
              { tag: "#NguHanhSon", q: "Ngũ Hành Sơn" },
              { tag: "#BaNaHills", q: "Bà Nà Hills" },
            ].map(({ tag, q }) => (
              <motion.button
                whileHover={{ y: -2, scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.2 }}
                key={tag}
                type="button"
                onClick={() => router.push(`/tim-kiem?q=${encodeURIComponent(q)}`)}
                className="text-white/75 bg-white/10 hover:bg-cyan-500/30 hover:text-cyan-200 border border-white/20 hover:border-cyan-400/40 text-xs px-3 py-1.5 rounded-full transition-all cursor-pointer"
              >
                {tag}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Scroll indicator ("CUỘN XUỐNG") — Cố định đáy an toàn, cách xa hàng tag, KHÔNG BAO GIỜ BỊ TRÙNG ── */}
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 hidden sm:flex flex-col items-center gap-1.5 text-white/50 pointer-events-none select-none">
        <span className="text-[10px] tracking-[0.2em] uppercase font-medium">Cuộn xuống</span>
        <div
          className="w-px h-6 bg-gradient-to-b from-white/60 to-transparent"
          style={{ animation: "float 2.2s ease-in-out infinite" }}
        />
      </div>

      {/* ── 3 vạch chỉ báo tiến độ bên phải ── */}
      {SHOW_INDICATORS && (
        <HeroIndicators
          activeIndex={activeIndex}
          isPaused={isPaused}
          reducedMotion={reducedMotion}
        />
      )}
    </section>
  );
}
