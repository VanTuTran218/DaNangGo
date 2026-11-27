"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { TrendingUp } from "lucide-react";
import HeroSearchBar from "./HeroSearchBar";
import HeroCarouselBackground from "./HeroCarouselBackground";
import HeroSlideCopy from "./HeroSlideCopy";
import HeroIndicators from "./HeroIndicators";
import { CloudRevealTransition } from "@/components/ui/CinematicMotion";
import { HERO_SLIDES, INTERVAL_MS, SHOW_INDICATORS } from "./hero-data";

export default function HomeHero() {
  const router = useRouter();
  const heroSectionRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [firstLoaded, setFirstLoaded] = useState(true);
  const [slidesLoaded, setSlidesLoaded] = useState<boolean[]>([
    true,
    true,
    true,
  ]);
  const [isTabHidden, setIsTabHidden] = useState(false);
  const [isHoverPaused, setIsHoverPaused] = useState(false);
  const [isManualPaused, setIsManualPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  const isPaused = isTabHidden || isHoverPaused || isManualPaused;

  // Detect prefers-reduced-motion & desktop breakpoint
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const desktopMq = window.matchMedia(
      "(min-width: 1024px) and (hover: hover)"
    );
    setReducedMotion(mq.matches);
    setIsDesktop(desktopMq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    const onDesktopChange = (e: MediaQueryListEvent) =>
      setIsDesktop(e.matches);
    mq.addEventListener("change", onChange);
    desktopMq.addEventListener("change", onDesktopChange);
    return () => {
      mq.removeEventListener("change", onChange);
      desktopMq.removeEventListener("change", onDesktopChange);
    };
  }, []);

  // Mouse-Responsive 2.5D Cinematic Interaction (Desktop only, damped)
  const rawMouseX = useMotionValue(0);
  const rawMouseY = useMotionValue(0);
  const dampedBgX = useSpring(rawMouseX, {
    stiffness: 90,
    damping: 26,
    mass: 0.7,
  });
  const dampedMonumentalX = useSpring(rawMouseY, {
    stiffness: 75,
    damping: 28,
    mass: 0.8,
  });

  const handleHeroMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (reducedMotion || !isDesktop || !heroSectionRef.current) return;
      const rect = heroSectionRef.current.getBoundingClientRect();
      const normX = (e.clientX - rect.left) / rect.width - 0.5;
      const normY = (e.clientY - rect.top) / rect.height - 0.5;
      rawMouseX.set(normX * -10);
      rawMouseY.set(normY * 7);
    },
    [isDesktop, rawMouseX, rawMouseY, reducedMotion]
  );

  const handleHeroMouseLeave = useCallback(() => {
    rawMouseX.set(0);
    rawMouseY.set(0);
  }, [rawMouseX, rawMouseY]);

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
    const handleVisibilityChange = () => setIsTabHidden(document.hidden);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Autoplay: setTimeout chain
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

  // Scroll-Synchronized Hero Transformation
  const { scrollYProgress } = useScroll({
    target: heroSectionRef,
    offset: ["start start", "end start"],
  });

  const copyTranslateY = useTransform(
    scrollYProgress,
    [0, 0.2, 0.45, 0.7, 0.9, 1],
    reducedMotion || !isDesktop
      ? [0, 0, 0, 0, 0, 0]
      : [0, -6, -18, -36, -52, -64]
  );
  const copyOpacity = useTransform(
    scrollYProgress,
    [0, 0.2, 0.45, 0.7, 0.9, 1],
    reducedMotion ? [1, 1, 1, 1, 1, 1] : [1, 0.98, 0.88, 0.5, 0.15, 0]
  );

  const uiTranslateY = useTransform(
    scrollYProgress,
    [0, 0.2, 0.45, 0.7, 0.9, 1],
    reducedMotion || !isDesktop
      ? [0, 0, 0, 0, 0, 0]
      : [0, -4, -12, -24, -36, -44]
  );

  const TRENDING_TAGS = [
    { tag: "#MyKheBeach", q: "Biển Mỹ Khê" },
    { tag: "#CauRongPhunLua", q: "Cầu Rồng" },
    { tag: "#NuiSonTra", q: "Sơn Trà" },
    { tag: "#NguHanhSon", q: "Ngũ Hành Sơn" },
    { tag: "#BaNaHills", q: "Bà Nà Hills" },
  ];

  return (
    <section
      ref={heroSectionRef}
      id="hero"
      data-navbar-overlay="true"
      aria-roledescription="carousel"
      aria-label="Cẩm nang du lịch DaNangGo"
      onMouseMove={handleHeroMouseMove}
      onMouseLeave={handleHeroMouseLeave}
      className="relative w-full overflow-hidden flex items-end min-h-[100dvh] bg-[#102832]"
    >
      {/* ── Layer 01–02: Crisp HD Landscape Photography & Directional Editorial Scrim ── */}
      <HeroCarouselBackground
        activeIndex={activeIndex}
        reducedMotion={reducedMotion}
        onFirstLoaded={handleFirstLoaded}
        onSlideLoaded={handleSlideLoaded}
        mouseX={dampedBgX}
        mouseY={dampedMonumentalX}
      />

      {/* ── Scroll-linked Cloud Transition (Zero opacity at scroll=0; activates smoothly on scroll — Phần 09) ── */}
      <CloudRevealTransition targetRef={heroSectionRef} />

      {/* ── Editorial Foreground Content (Full viewport height, balanced bottom breathing room) ── */}
      <div className="relative z-20 home-container w-full pt-28 sm:pt-32 lg:pt-36 pb-16 sm:pb-20 lg:pb-24">
        {/* a) Typography Mask Reveal */}
        <motion.div
          style={{
            y: copyTranslateY,
            opacity: copyOpacity,
          }}
        >
          <HeroSlideCopy
            activeIndex={activeIndex}
            reducedMotion={reducedMotion}
            isPaused={isPaused}
            onSelectSlide={(idx) => setActiveIndex(idx)}
          />
        </motion.div>

        {/* b) Compact Minimal Search Bar & Borderless Trending Text Links (Phần 10 & 11) */}
        <motion.div
          style={{ y: uiTranslateY }}
          className="w-full max-w-[650px]"
          initial={{ opacity: 0, y: reducedMotion ? 0 : 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.75,
            delay: 0.5,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <HeroSearchBar />

          {/* Hashtag xu hướng: Bỏ khung viền, chuyển thành text link nhỏ gọn phân tách bằng dấu chấm & underline sweep (Phần 11) */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 mt-3.5 text-[12.5px] sm:text-[13px]">
            <span className="inline-flex items-center gap-1.5 text-[#F8F8F4]/75 font-medium mr-1">
              <TrendingUp className="w-3.5 h-3.5 text-[#E87B39] stroke-[1.75]" />
              <span>Xu hướng:</span>
            </span>
            {TRENDING_TAGS.map(({ tag, q }, idx) => (
              <span key={tag} className="inline-flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    router.push(`/tim-kiem?q=${encodeURIComponent(q)}`)
                  }
                  className="relative text-[#F8F8F4]/88 hover:text-white transition-colors duration-200 cursor-pointer py-0.5 after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[1px] after:w-full after:bg-[#E87B39] after:origin-right after:scale-x-0 hover:after:origin-left hover:after:scale-x-100 after:transition-transform after:duration-300"
                >
                  {tag}
                </button>
                {idx < TRENDING_TAGS.length - 1 && (
                  <span className="text-white/35 select-none" aria-hidden="true">
                    ·
                  </span>
                )}
              </span>
            ))}
          </div>
        </motion.div>

        {/* c) Minimal Cinematic Pagination (Phần 08) */}
        {SHOW_INDICATORS && (
          <motion.div
            style={{ y: uiTranslateY }}
            initial={{ opacity: 0, y: reducedMotion ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.75,
              delay: 0.68,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <HeroIndicators
              activeIndex={activeIndex}
              isPaused={isPaused}
              reducedMotion={reducedMotion}
              onSelectSlide={(idx) => setActiveIndex(idx)}
              onTogglePause={() => setIsManualPaused((prev) => !prev)}
            />
          </motion.div>
        )}
      </div>
    </section>
  );
}
