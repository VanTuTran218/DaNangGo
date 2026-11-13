"use client";

/**
 * IntroOverlay — Màn hình chào mừng (Welcome / Intro Screen) DanangGo
 *
 * Tính năng trải nghiệm:
 * 1. Background Cầu Rồng / Sông Hàn Đà Nẵng chất lượng cao, bao phủ toàn màn hình (cover)
 * 2. Gradient overlay chuẩn tông xanh navy (#061B30) tạo độ tương phản cao, làm nổi bật nội dung
 * 3. Hiệu ứng Ken Burns: background zoom nhẹ từ 1.0 đến 1.08 mượt mà, tự nhiên
 * 4. Ánh sáng xanh ngọc (ambient cyan pulse) nhẹ nhàng tạo chiều sâu không gian
 * 5. Logo DanangGo la bàn chuẩn nhận diện thương hiệu, xoay chậm và phát sáng tinh tế
 * 6. Tiêu đề "CHÀO MỪNG ĐẾN VỚI ĐÀ NẴNG" với điểm nhấn xanh ngọc và hiệu ứng gradient shimmer
 * 7. Nút CTA "Bắt đầu khám phá" chuẩn glassmorphism/gradient xanh ngọc, hiệu ứng hover phát sáng & mũi tên dịch chuyển
 * 8. Hiệu ứng fade-out + zoom khi bắt đầu khám phá để chuyển mượt vào trang chủ
 * 9. Hỗ trợ prefers-reduced-motion, phím tắt Esc/Enter, nút Bỏ qua và sessionStorage
 */

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const SESSION_KEY = "danangGoIntroShown";

interface IntroOverlayProps {
  onComplete?: () => void;
}

export default function IntroOverlay({ onComplete }: IntroOverlayProps) {
  const pathname = usePathname();
  return pathname === "/" ? <HomeIntroOverlay onComplete={onComplete} /> : null;
}

function HomeIntroOverlay({ onComplete }: IntroOverlayProps) {
  const prefersReduced = useReducedMotion();

  const [shouldShow, setShouldShow] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const isExitingRef = useRef(false);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Xử lý chuyển vào trang chủ khi click "Bắt đầu khám phá" hoặc "Bỏ qua"
  const handleExplore = useCallback(() => {
    if (isExitingRef.current) return;
    isExitingRef.current = true;
    setIsExiting(true);

    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // Bỏ qua lỗi trong môi trường hạn chế storage
    }

    // Thời gian animation fade-out + zoom nhẹ (550ms)
    exitTimer.current = setTimeout(() => {
      setIsVisible(false);
      document.body.style.overflow = "";
      onComplete?.();

    }, 550);
  }, [onComplete]);

  useEffect(() => {
    // Kiểm tra prefers-reduced-motion & sessionStorage
    const prefersReducedMotionMedia =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Hỗ trợ tham số ?intro=1 để dễ dàng test lại màn hình chào mừng
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

    // Khóa cuộn trang khi đang hiển thị màn hình chào mừng
    document.body.style.overflow = "hidden";

    // Phím tắt bàn phím: Escape hoặc Enter để vào khám phá ngay
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") {
        handleExplore();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // Safety fallback: Sau 12s nếu người dùng không thao tác, tự động chuyển mượt vào site
    const autoDismissTimer = setTimeout(() => {
      handleExplore();
    }, 12000);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(autoDismissTimer);
      if (exitTimer.current !== null) clearTimeout(exitTimer.current);
      document.body.style.overflow = "";
    };
  }, [handleExplore, onComplete]);

  if (!shouldShow || !isVisible) return null;

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          key="welcome-intro-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.06,
            filter: "blur(6px)",
            transition: { duration: 0.55, ease: [0.4, 0, 0.2, 1] },
          }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden select-none bg-[#061B30]"
          role="dialog"
          aria-label="Màn hình chào mừng DanangGo"
          aria-modal="true"
        >
          {/* ========================================================
              1. BACKGROUND TOÀN MÀN HÌNH (CẦU RỒNG - KEN BURNS)
              ======================================================== */}
          <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
            <motion.div
              className="absolute inset-0 w-full h-full"
              initial={{ scale: 1 }}
              animate={{ scale: prefersReduced ? 1 : 1.08 }}
              transition={{
                duration: 16,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
              }}
            >
              <Image
                src="/hero/cau-rong-hd.jpg"
                alt="Cầu Rồng Đà Nẵng về đêm rực sáng bên dòng sông Hàn"
                fill
                priority
                sizes="100vw"
                quality={92}
                className="object-cover object-center"
              />
            </motion.div>

            {/* Gradient Overlay xanh navy (#061B30) nhiều lớp đảm bảo độ tương phản cao */}
            <div className="absolute inset-0 bg-[#061B30]/75" />

            {/* Radial vignette overlay — làm tối vùng viền ngoài và tập trung ánh sáng vào nội dung */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 50%, rgba(6, 27, 48, 0.5) 0%, rgba(6, 27, 48, 0.85) 65%, #061B30 100%)",
              }}
            />

            {/* Linear gradient trên/dưới tạo chiều sâu điện ảnh */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#061B30] via-transparent to-[#061B30]/60" />

            {/* Ambient Cyan Glow — hiệu ứng ánh sáng xanh ngọc chuyển động rất nhẹ */}
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] sm:w-[750px] sm:h-[750px] rounded-full filter blur-[100px] pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, rgba(34, 211, 238, 0.25) 0%, rgba(6, 182, 212, 0.08) 50%, transparent 70%)",
              }}
              animate={
                prefersReduced
                  ? {}
                  : {
                      scale: [1, 1.12, 1],
                      opacity: [0.65, 0.95, 0.65],
                    }
              }
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>

          {/* ========================================================
              NÚT BỎ QUA NHANH (GÓC TRÊN PHẢI)
              ======================================================== */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            onClick={handleExplore}
            className="absolute top-5 right-5 sm:top-8 sm:right-8 z-30 text-white/70 hover:text-white text-xs sm:text-sm tracking-wider uppercase border border-white/20 hover:border-cyan-400/50 bg-[#061B30]/50 hover:bg-[#061B30]/80 backdrop-blur-md rounded-full px-4 py-2 transition-all duration-200 cursor-pointer flex items-center gap-1.5 group"
            aria-label="Bỏ qua màn hình giới thiệu"
          >
            <span>Bỏ qua</span>
            <span className="transition-transform duration-200 group-hover:translate-x-0.5">
              →
            </span>
          </motion.button>

          {/* ========================================================
              NỘI DUNG CHÍNH (CĂN GIỮA TOÀN BỘ)
              ======================================================== */}
          <div className="relative z-20 flex flex-col items-center text-center px-4 max-w-4xl mx-auto my-auto space-y-6 sm:space-y-8 pointer-events-auto">
            {/* ── 2. LOGO DANANGGO (LA BÀN THƯƠNG HIỆU) ── */}
            <motion.div
              initial={{ opacity: 0, scale: 0.82, y: -12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{
                duration: 0.7,
                delay: prefersReduced ? 0 : 0.35,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="flex flex-col items-center gap-3 sm:gap-4"
            >
              {/* Biểu tượng la bàn với phát sáng nhẹ & quay chậm */}
              <div className="relative">
                {/* Vầng hào quang xanh ngọc nhẹ */}
                <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-xl scale-125" />

                <svg
                  width="110"
                  height="110"
                  viewBox="0 0 120 120"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 drop-shadow-[0_0_16px_rgba(34,211,238,0.45)]"
                >
                  {/* Vòng tròn ngoài — stroke xanh ngọc (#22d3ee) */}
                  <circle
                    cx="60"
                    cy="60"
                    r="55"
                    stroke="#22d3ee"
                    strokeWidth="3"
                    className="opacity-95"
                  />

                  {/* Kim la bàn xoay chậm rất nhẹ nhàng */}
                  <motion.g
                    animate={
                      prefersReduced
                        ? {}
                        : {
                            rotate: [0, 7, -5, 0],
                          }
                    }
                    transition={{
                      duration: 9,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    style={{ transformOrigin: "60px 60px" }}
                  >
                    {/* Hướng Bắc (Xanh ngọc #22d3ee) */}
                    <path
                      d="M60 20 L68 52 L60 58 L52 52 Z"
                      fill="#22d3ee"
                    />
                    {/* Hướng Nam (Trắng mờ) */}
                    <path
                      d="M60 100 L52 68 L60 62 L68 68 Z"
                      fill="rgba(255,255,255,0.4)"
                    />
                    {/* Hướng Tây (Trắng mờ) */}
                    <path
                      d="M20 60 L52 52 L58 60 L52 68 Z"
                      fill="rgba(255,255,255,0.4)"
                    />
                    {/* Hướng Đông (Cam thương hiệu #f97316) */}
                    <path
                      d="M100 60 L68 68 L62 60 L68 52 Z"
                      fill="#f97316"
                    />
                  </motion.g>

                  {/* Tâm la bàn */}
                  <circle
                    cx="60"
                    cy="60"
                    r="4.5"
                    fill="white"
                    className="drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]"
                  />
                </svg>
              </div>

              {/* Tên thương hiệu DANANGGO */}
              <div className="text-center">
                <div className="text-white text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-widest uppercase font-display drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
                  <span className="text-[#22d3ee]">Danang</span>
                  <span className="text-[#f97316]">Go</span>
                </div>
                <p className="text-cyan-200/80 text-[11px] sm:text-xs md:text-sm tracking-[0.35em] uppercase mt-1 font-medium">
                  Cẩm nang du lịch Đà Nẵng
                </p>
              </div>
            </motion.div>

            {/* ── 3. NỘI DUNG CHÀO MỪNG ── */}
            <div className="flex flex-col items-center space-y-3 sm:space-y-4">
              {/* Tiêu đề lớn: "CHÀO MỪNG ĐẾN VỚI ĐÀ NẴNG" với Shimmer Effect */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.7,
                  delay: prefersReduced ? 0 : 0.75,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="relative inline-block overflow-hidden py-1 px-2"
              >
                <h1 className="relative text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight uppercase font-display leading-tight sm:leading-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
                  <span className="text-white">CHÀO MỪNG ĐẾN VỚI </span>
                  <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-cyan-400 to-teal-300 drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]">
                    ĐÀ NẴNG
                  </span>
                </h1>

                {/* Gradient shimmer ánh sáng quét từ trái sang phải với tần suất thấp */}
                {!prefersReduced && (
                  <motion.div
                    initial={{ x: "-120%", opacity: 0 }}
                    animate={{
                      x: ["-120%", "220%"],
                      opacity: [0, 0.7, 0],
                    }}
                    transition={{
                      duration: 2.2,
                      delay: 1.3,
                      repeat: Infinity,
                      repeatDelay: 5,
                      ease: "easeInOut",
                    }}
                    className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/35 to-transparent -skew-x-25 pointer-events-none"
                  />
                )}
              </motion.div>

              {/* Dòng mô tả chào đón */}
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: prefersReduced ? 0 : 1.05,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="text-slate-200/90 text-sm sm:text-base md:text-lg lg:text-xl font-normal max-w-2xl mx-auto leading-relaxed tracking-wide drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)]"
              >
                Hành trình khám phá thành phố đáng sống bắt đầu từ đây.
              </motion.p>
            </div>

            {/* ── 4. NÚT BẮT ĐẦU KHÁM PHÁ (CTA) ── */}
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.6,
                delay: prefersReduced ? 0 : 1.35,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="pt-2 sm:pt-4"
            >
              <button
                onClick={handleExplore}
                className="group relative inline-flex items-center justify-center gap-3 px-8 py-3.5 sm:px-10 sm:py-4 rounded-full font-semibold text-white tracking-wide text-base sm:text-lg shadow-[0_0_24px_rgba(34,211,238,0.35)] hover:shadow-[0_0_40px_rgba(34,211,238,0.65)] border border-cyan-300/40 hover:border-cyan-200/90 hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 overflow-hidden cursor-pointer"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(6, 182, 212, 0.9) 0%, rgba(20, 184, 166, 0.85) 100%)",
                  backdropFilter: "blur(12px)",
                }}
                aria-label="Bắt đầu khám phá Đà Nẵng"
              >
                {/* Ánh sáng chạy lướt trên bề mặt kính khi hover */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none transition-transform" />

                <span className="relative z-10 flex items-center gap-2.5">
                  <span>Bắt đầu khám phá</span>
                  <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1.5" />
                </span>
              </button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
