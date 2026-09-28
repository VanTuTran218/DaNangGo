"use client";

/**
 * IntroOverlay — Màn hình intro/preloader cho DanangGo
 *
 * Hành vi:
 * - Chỉ hiển thị ở lần đầu tiên vào site trong phiên (sessionStorage)
 * - Tôn trọng prefers-reduced-motion: bỏ qua hoàn toàn nếu bật
 * - Khóa scroll trong lúc chạy (overflow-hidden trên body)
 * - Tổng thời gian ~2.5s, có nút skip
 *
 * Animation sequence:
 * 1. Nền navy + logo SVG vẽ đường viền (~1s)
 * 2. Dòng chữ loading crossfade + progress % (~1s)
 * 3. Curtain reveal — hai khối navy trượt ra hai bên (~0.5s)
 */

import { useEffect, useState, useCallback } from "react";
import {
  motion,
  AnimatePresence,
  useAnimation,
  type Variants,
} from "framer-motion";

const LOADING_TEXTS = [
  "Đang tải nắng Đà Nẵng...",
  "Đang chuẩn bị bờ biển Mỹ Khê...",
  "Sẵn sàng khám phá...",
];

const SESSION_KEY = "danangGoIntroShown";

interface IntroOverlayProps {
  onComplete?: () => void;
}

export default function IntroOverlay({ onComplete }: IntroOverlayProps) {
  const [shouldShow, setShouldShow] = useState(false); // default false — no SSR flicker
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [textIndex, setTextIndex] = useState(0);
  const [phase, setPhase] = useState<"logo" | "loading" | "curtain">("logo");

  const dismiss = useCallback(() => {
    setIsVisible(false);
  }, []);

  useEffect(() => {
    // Check: already shown this session? respect reduced-motion?
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const alreadyShown = sessionStorage.getItem(SESSION_KEY);

    if (prefersReduced || alreadyShown) {
      onComplete?.();
      return;
    }

    // Mark as shown
    sessionStorage.setItem(SESSION_KEY, "1");
    setShouldShow(true);

    // Lock scroll
    document.body.style.overflow = "hidden";

    // === PHASE TIMELINE ===
    // 0–1000ms: logo SVG draw
    // 1000–2200ms: loading text + progress
    // 2200–2700ms: curtain exit
    // 2700ms: unmount

    const phaseTimer = setTimeout(() => setPhase("loading"), 1000);
    const curtainTimer = setTimeout(() => setPhase("curtain"), 2200);
    const doneTimer = setTimeout(() => {
      dismiss();
      document.body.style.overflow = "";
      onComplete?.();
    }, 2700);

    // Progress counter 0→100 over 2200ms
    let frame = 0;
    const totalFrames = 110; // ~2200ms / 20ms
    const progressInterval = setInterval(() => {
      frame++;
      setProgress(Math.min(100, Math.round((frame / totalFrames) * 100)));
      if (frame >= totalFrames) clearInterval(progressInterval);
    }, 20);

    // Rotate loading texts every 400ms starting at 1s
    const textTimer = setTimeout(() => {
      let idx = 0;
      const textInterval = setInterval(() => {
        idx = (idx + 1) % LOADING_TEXTS.length;
        setTextIndex(idx);
        if (idx === LOADING_TEXTS.length - 1) clearInterval(textInterval);
      }, 400);
      return () => clearInterval(textInterval);
    }, 1000);

    return () => {
      clearTimeout(phaseTimer);
      clearTimeout(curtainTimer);
      clearTimeout(doneTimer);
      clearTimeout(textTimer);
      clearInterval(progressInterval);
      document.body.style.overflow = "";
    };
  }, [dismiss, onComplete]);

  if (!shouldShow) return null;

  // ======= ANIMATION VARIANTS =======

  const logoVariants: Variants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, ease: "easeOut" },
    },
    exit: {
      opacity: 0,
      scale: 0.6,
      transition: { duration: 0.3, ease: "easeIn" },
    },
  };

  // Left curtain slides out to the left
  const curtainLeftVariants: Variants = {
    visible: { x: "0%" },
    exit: { x: "-100%", transition: { duration: 0.5, ease: "easeInOut" } },
  };

  // Right curtain slides out to the right
  const curtainRightVariants: Variants = {
    visible: { x: "0%" },
    exit: { x: "100%", transition: { duration: 0.5, ease: "easeInOut" } },
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="intro-overlay"
          className="fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.2, delay: 0.5 } }}
          // Click anywhere to skip
          onClick={dismiss}
          role="dialog"
          aria-label="Màn hình giới thiệu DanangGo"
          aria-live="polite"
        >
          {/* ---- CURTAIN LEFT ---- */}
          <motion.div
            className="absolute inset-y-0 left-0 w-1/2 bg-[#071a2e] origin-left z-10"
            variants={curtainLeftVariants}
            animate={phase === "curtain" ? "exit" : "visible"}
          />

          {/* ---- CURTAIN RIGHT ---- */}
          <motion.div
            className="absolute inset-y-0 right-0 w-1/2 bg-[#071a2e] origin-right z-10"
            variants={curtainRightVariants}
            animate={phase === "curtain" ? "exit" : "visible"}
          />

          {/* ---- CONTENT (Logo + Text) ---- */}
          <div className="relative z-20 flex flex-col items-center gap-6 select-none pointer-events-none">
            {/* Logo SVG with stroke-draw animation */}
            <AnimatePresence mode="wait">
              {phase !== "curtain" && (
                <motion.div
                  key="logo"
                  variants={logoVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="flex flex-col items-center gap-4"
                >
                  {/* SVG Logo — compass + text */}
                  <svg
                    width="120"
                    height="120"
                    viewBox="0 0 120 120"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    {/* Outer circle — stroke draw */}
                    <circle
                      cx="60"
                      cy="60"
                      r="55"
                      stroke="#22d3ee"
                      strokeWidth="3"
                      className="svg-draw"
                      style={{
                        strokeDasharray: 350,
                        strokeDashoffset: 350,
                        animation: "draw-stroke 1s ease-out forwards",
                      }}
                    />
                    {/* Inner compass rose */}
                    <path
                      d="M60 20 L68 52 L60 58 L52 52 Z"
                      fill="#22d3ee"
                      style={{
                        opacity: 0,
                        animation: "fade-up 0.5s 0.8s ease-out forwards",
                      }}
                    />
                    <path
                      d="M60 100 L52 68 L60 62 L68 68 Z"
                      fill="rgba(255,255,255,0.4)"
                      style={{
                        opacity: 0,
                        animation: "fade-up 0.5s 0.9s ease-out forwards",
                      }}
                    />
                    <path
                      d="M20 60 L52 52 L58 60 L52 68 Z"
                      fill="rgba(255,255,255,0.4)"
                      style={{
                        opacity: 0,
                        animation: "fade-up 0.5s 1s ease-out forwards",
                      }}
                    />
                    <path
                      d="M100 60 L68 68 L62 60 L68 52 Z"
                      fill="#f97316"
                      style={{
                        opacity: 0,
                        animation: "fade-up 0.5s 1.1s ease-out forwards",
                      }}
                    />
                    {/* Center dot */}
                    <circle cx="60" cy="60" r="4" fill="white" />
                  </svg>

                  {/* Brand name */}
                  <div className="text-center">
                    <h1 className="text-white text-3xl font-bold tracking-widest uppercase">
                      <span className="text-[#22d3ee]">Danang</span>
                      <span className="text-[#f97316]">Go</span>
                    </h1>
                    <p className="text-white/60 text-xs tracking-[0.3em] uppercase mt-1">
                      Cẩm nang du lịch Đà Nẵng
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ---- LOADING TEXT + PROGRESS ---- */}
            <AnimatePresence mode="wait">
              {phase === "loading" && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center gap-3"
                >
                  {/* Progress bar */}
                  <div className="w-48 h-0.5 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-[#22d3ee] rounded-full"
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>

                  {/* Counter + text row */}
                  <div className="flex items-center gap-3">
                    <span className="text-[#22d3ee] text-sm font-mono w-10 text-right">
                      {progress}%
                    </span>
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={textIndex}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.2 }}
                        className="text-white/70 text-xs tracking-wide"
                      >
                        {LOADING_TEXTS[textIndex]}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ---- SKIP BUTTON ---- */}
          <button
            className="absolute bottom-8 right-8 z-30 text-white/50 text-xs hover:text-white/80 transition-colors pointer-events-auto tracking-wider uppercase border border-white/20 rounded-full px-4 py-2 hover:border-white/40"
            onClick={(e) => {
              e.stopPropagation();
              dismiss();
              document.body.style.overflow = "";
              onComplete?.();
            }}
            aria-label="Bỏ qua màn hình giới thiệu"
          >
            Bỏ qua →
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
