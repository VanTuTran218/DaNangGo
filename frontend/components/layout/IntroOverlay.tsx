"use client";

/**
 * IntroOverlay V11.2 — DANANGGO: THE GATEWAY TO DA NANG (Performance-Optimized)
 *
 * Preserves 100% of visual design, Vietnamese copy, `SESSION_KEY = "danangGoIntroShown"`,
 * `?intro=1` preview support, Escape/Enter shortcuts, 12s auto-dismiss safety fallback,
 * "Bỏ qua" button, and "Bắt đầu khám phá" handler.
 *
 * Performance architecture:
 * - Preloads & decodes critical intro images + fonts before starting choreography
 *   so frame 1 never stalls on image decode or pops in abruptly.
 * - Pure GPU-composited transform + opacity exit transition (no full-screen clip-path repaint,
 *   no flash/white-screen when revealing Homepage).
 * - Pauses timers & parallax when tab is hidden (`visibilitychange`).
 * - Activates desktop 2.5D mouse parallax only after entrance settles, with cached viewport size.
 */

import React, { useEffect, useState, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  motion,
  useReducedMotion,
  useMotionValue,
  useSpring,
} from "framer-motion";
import CompassReveal from "@/components/intro/CompassReveal";
import GoldenJourneyPath from "@/components/intro/GoldenJourneyPath";
import IntroCloudLayers from "@/components/intro/IntroCloudLayers";
import IntroTypography from "@/components/intro/IntroTypography";

const SESSION_KEY = "danangGoIntroShown";
const AUTO_DISMISS_MS = 12000;
const ASSET_PRELOAD_TIMEOUT_MS = 850;
const FONT_WAIT_TIMEOUT_MS = 250;
const PARALLAX_ACTIVATE_DELAY_MS = 2250;
const EXIT_DURATION_S = 0.52;
const EXIT_FALLBACK_MS = 620;

interface IntroOverlayProps {
  onComplete?: () => void;
}

function preloadAndDecodeImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.decoding = "async";
    img.src = src;

    const done = () => resolve();

    if (img.complete && img.naturalWidth > 0) {
      if (typeof img.decode === "function") {
        img.decode().then(done, done);
      } else {
        done();
      }
      return;
    }

    img.onload = () => {
      if (typeof img.decode === "function") {
        img.decode().then(done, done);
      } else {
        done();
      }
    };
    img.onerror = done;
  });
}

export default function IntroOverlay({ onComplete }: IntroOverlayProps) {
  const pathname = usePathname();
  return pathname === "/" ? <HomeIntroOverlay onComplete={onComplete} /> : null;
}

function HomeIntroOverlay({ onComplete }: IntroOverlayProps) {
  const prefersReducedHook = useReducedMotion();
  const prefersReduced = Boolean(prefersReducedHook);

  const [shouldShow, setShouldShow] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isMotionReady, setIsMotionReady] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [canMouseParallax, setCanMouseParallax] = useState(false);
  const [isParallaxActive, setIsParallaxActive] = useState(false);
  const [isTabVisible, setIsTabVisible] = useState(true);

  const isExitingRef = useRef(false);
  const isCompletedRef = useRef(false);
  const exitFallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const viewportRef = useRef({ width: 1440, height: 900 });

  // Damped mouse coordinates for Scene 05 desktop 2.5D parallax (activated only after entrance settles)
  const rawMouseX = useMotionValue(0);
  const rawMouseY = useMotionValue(0);
  const smoothMouseX = useSpring(rawMouseX, { stiffness: 90, damping: 26, mass: 0.6 });
  const smoothMouseY = useSpring(rawMouseY, { stiffness: 90, damping: 26, mass: 0.6 });

  const finishExit = useCallback(() => {
    if (isCompletedRef.current) return;
    isCompletedRef.current = true;
    if (exitFallbackTimer.current !== null) {
      clearTimeout(exitFallbackTimer.current);
      exitFallbackTimer.current = null;
    }
    setIsVisible(false);
    document.body.style.overflow = "";
    onComplete?.();
  }, [onComplete]);

  // Xử lý chuyển vào trang chủ khi click "Bắt đầu khám phá" hoặc "Bỏ qua" (hoạt động ngay lập tức ở mọi giai đoạn)
  const handleExplore = useCallback(() => {
    if (isExitingRef.current) return;
    isExitingRef.current = true;
    setIsParallaxActive(false);
    setIsExiting(true);

    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // Bỏ qua lỗi trong môi trường hạn chế storage
    }

    // Fallback đảm bảo luôn unmount hoàn toàn kể cả khi tab bị ẩn trong lúc exit
    exitFallbackTimer.current = setTimeout(
      finishExit,
      prefersReduced ? 260 : EXIT_FALLBACK_MS
    );
  }, [finishExit, prefersReduced]);

  // Theo dõi desktop pointer & cache kích thước viewport (tránh đọc layout trong mousemove)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateViewport = () => {
      viewportRef.current.width = Math.max(1, window.innerWidth);
      viewportRef.current.height = Math.max(1, window.innerHeight);
    };
    updateViewport();

    const mq = window.matchMedia(
      "(min-width: 1024px) and (hover: hover) and (pointer: fine)"
    );
    setCanMouseParallax(mq.matches);
    const onMqChange = (e: MediaQueryListEvent) => setCanMouseParallax(e.matches);

    mq.addEventListener("change", onMqChange);
    window.addEventListener("resize", updateViewport, { passive: true });
    return () => {
      mq.removeEventListener("change", onMqChange);
      window.removeEventListener("resize", updateViewport);
    };
  }, []);

  // Theo dõi trạng thái hiển thị tab để tạm dừng animation/timer khi tab không hoạt động
  useEffect(() => {
    if (typeof document === "undefined") return;
    setIsTabVisible(!document.hidden);

    const onVisibilityChange = () => {
      const visible = !document.hidden;
      setIsTabVisible(visible);
      if (!visible) {
        rawMouseX.set(0);
        rawMouseY.set(0);
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [rawMouseX, rawMouseY]);

  // Quyết định hiển thị Intro, khóa cuộn & lắng nghe phím tắt Escape/Enter (GIỮ NGUYÊN LOGIC)
  useEffect(() => {
    const prefersReducedMotionMedia =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const urlParams =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search)
        : null;
    const forcePreview = urlParams?.get("intro") === "1";

    const alreadyShown =
      typeof window !== "undefined"
        ? sessionStorage.getItem(SESSION_KEY)
        : null;

    if (!forcePreview && (prefersReducedMotionMedia || alreadyShown)) {
      onComplete?.();
      return;
    }

    setShouldShow(true);
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") {
        handleExplore();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (exitFallbackTimer.current !== null) {
        clearTimeout(exitFallbackTimer.current);
      }
      document.body.style.overflow = "";
    };
  }, [handleExplore, onComplete]);

  // Preload + decode ảnh nền & logo (và chờ font ngắn hạn) trước khi bắt đầu animation
  useEffect(() => {
    if (!shouldShow || isMotionReady || !isTabVisible) return;

    let cancelled = false;
    let raf1 = 0;
    let raf2 = 0;

    const startChoreography = () => {
      if (cancelled || isExitingRef.current) return;
      // Chờ 1 nhịp frame để hydration/layout ổn định rồi mới chạy animation (tránh khựng khung hình đầu)
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          if (!cancelled && !isExitingRef.current) {
            setIsMotionReady(true);
          }
        });
      });
    };

    if (prefersReduced) {
      setIsMotionReady(true);
      return;
    }

    const criticalImages = [
      "/images/intro/landscape/intro-coastal-panorama.jpg",
      "/images/intro/landscape/intro-above-clouds.webp",
      "/images/branding/danang-logo.webp",
    ];

    const imagesPromise = Promise.all(criticalImages.map(preloadAndDecodeImage));
    const fontsPromise =
      typeof document !== "undefined" && document.fonts?.ready
        ? Promise.race([
            document.fonts.ready.then(() => undefined),
            new Promise<void>((resolve) => setTimeout(resolve, FONT_WAIT_TIMEOUT_MS)),
          ])
        : Promise.resolve();

    const safetyTimeout = new Promise<void>((resolve) =>
      setTimeout(resolve, ASSET_PRELOAD_TIMEOUT_MS)
    );

    Promise.race([Promise.all([imagesPromise, fontsPromise]), safetyTimeout]).then(
      startChoreography
    );

    return () => {
      cancelled = true;
      if (raf1) cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, [shouldShow, isMotionReady, isTabVisible, prefersReduced]);

  // Kích hoạt desktop 2.5D parallax chỉ sau khi chuỗi animation vào đã ổn định
  useEffect(() => {
    if (!isMotionReady || prefersReduced || !canMouseParallax || isExiting) return;
    const timer = setTimeout(() => {
      if (!isExitingRef.current) {
        setIsParallaxActive(true);
      }
    }, PARALLAX_ACTIVATE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isMotionReady, prefersReduced, canMouseParallax, isExiting]);

  // Safety fallback 12s — tự tạm dừng khi tab bị ẩn và chạy tiếp khi quay lại
  const remainingDismissRef = useRef(AUTO_DISMISS_MS);
  useEffect(() => {
    if (!shouldShow || !isMotionReady || isExiting || !isTabVisible) return;

    const startedAt = Date.now();
    const delay = Math.max(0, remainingDismissRef.current);
    const timer = setTimeout(() => {
      remainingDismissRef.current = 0;
      handleExplore();
    }, delay);

    return () => {
      clearTimeout(timer);
      const elapsed = Date.now() - startedAt;
      remainingDismissRef.current = Math.max(0, remainingDismissRef.current - elapsed);
    };
  }, [shouldShow, isMotionReady, isExiting, isTabVisible, handleExplore]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (
        prefersReduced ||
        !canMouseParallax ||
        !isParallaxActive ||
        !isTabVisible ||
        isExitingRef.current
      ) {
        return;
      }
      const { width, height } = viewportRef.current;
      rawMouseX.set(e.clientX / width - 0.5);
      rawMouseY.set(e.clientY / height - 0.5);
    },
    [canMouseParallax, isParallaxActive, isTabVisible, prefersReduced, rawMouseX, rawMouseY]
  );

  const handleMouseLeave = useCallback(() => {
    rawMouseX.set(0);
    rawMouseY.set(0);
  }, [rawMouseX, rawMouseY]);

  if (!shouldShow || !isVisible) return null;

  return (
    <motion.div
      key="welcome-intro-screen"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 1, scale: 1 }}
      animate={
        isExiting
          ? {
              opacity: 0,
              scale: prefersReduced ? 1 : 1.03,
            }
          : { opacity: 1, scale: 1 }
      }
      transition={{
        duration: isExiting ? (prefersReduced ? 0.2 : EXIT_DURATION_S) : 0.01,
        ease: [0.22, 1, 0.36, 1],
      }}
      onAnimationComplete={() => {
        if (isExitingRef.current) {
          finishExit();
        }
      }}
      className={`fixed inset-0 z-[1100] flex flex-col items-center justify-center overflow-hidden select-none bg-[#0A2029] min-h-[100svh] ${
        isExiting ? "pointer-events-none" : ""
      }`}
      role="dialog"
      aria-label="Màn hình chào mừng DanangGo"
      aria-modal="true"
    >
      {/* ========================================================
          1. MULTI-LAYER CLOUD FLIGHT & 2.5D COASTAL PARALLAX
          ======================================================== */}
      <IntroCloudLayers
        isReady={isMotionReady}
        isParallaxActive={isParallaxActive && isTabVisible}
        prefersReduced={prefersReduced}
        isExiting={isExiting}
        mouseX={smoothMouseX}
        mouseY={smoothMouseY}
      />

      {/* ========================================================
          2. GOLDEN JOURNEY PATH (ORYZO-INSPIRED SVG BÉZIER LIGHT)
          ======================================================== */}
      <GoldenJourneyPath
        isReady={isMotionReady}
        isPaused={!isTabVisible}
        prefersReduced={prefersReduced}
        isExiting={isExiting}
      />

      {/* ========================================================
          3. NÚT BỎ QUA NHANH (GÓC TRÊN PHẢI — LUÔN HIỂN THỊ & HOẠT ĐỘNG TỪ GIÂY 0)
          ======================================================== */}
      <button
        type="button"
        onClick={handleExplore}
        className="absolute top-5 right-5 sm:top-8 sm:right-8 z-30 text-[#FFF8E9]/88 hover:text-[#FFF8E9] text-xs sm:text-[13px] tracking-[0.18em] uppercase border border-[#C9AB78]/40 hover:border-[#C9AB78] bg-[#0A2029]/65 hover:bg-[#0A2029]/85 rounded-[4px] px-4 py-2 transition-colors duration-200 cursor-pointer flex items-center gap-1.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9AB78]"
        aria-label="Bỏ qua màn hình giới thiệu"
      >
        <span>Bỏ qua</span>
        <span className="transition-transform duration-200 group-hover:translate-x-0.5 text-[#C9AB78]">
          →
        </span>
      </button>

      {/* ========================================================
          4. NỘI DUNG TRUNG TÂM (LOGO ĐÀ NẴNG + TYPOGRAPHY + CTA)
          ======================================================== */}
      <div className="relative z-20 flex flex-col items-center text-center px-4 sm:px-6 max-w-5xl mx-auto my-auto py-12 pointer-events-auto">
        <div className="mb-3 sm:mb-4">
          <CompassReveal
            isReady={isMotionReady}
            prefersReduced={prefersReduced}
            isExiting={isExiting}
          />
        </div>

        <IntroTypography
          isReady={isMotionReady}
          prefersReduced={prefersReduced}
          isExiting={isExiting}
          onExplore={handleExplore}
        />
      </div>
    </motion.div>
  );
}
