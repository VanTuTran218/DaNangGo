"use client";

import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Compass } from "lucide-react";
import { DURATION, EASING } from "@/lib/motion-tokens";

export const DIEM_DU_LICH_HERO_IMAGE =
  "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=85&w=2400&auto=format&fit=crop";

export default function ParallaxBanner() {
  const ref = useRef<HTMLElement>(null);
  const reducedMotion = Boolean(useReducedMotion());
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    reducedMotion ? ["0px", "0px"] : ["0px", "26px"]
  );

  return (
    <section
      ref={ref}
      data-navbar-overlay="true"
      aria-label="Điểm du lịch Đà Nẵng"
      className="relative z-10 w-full h-[460px] sm:h-[510px] lg:h-[540px] overflow-hidden select-none bg-[#06151C] flex items-end"
    >
      {/* Parallax Golden Bridge Background */}
      <motion.div
        style={{ y }}
        initial={reducedMotion ? { scale: 1 } : { scale: 1.06 }}
        animate={{ scale: 1 }}
        transition={{ duration: DURATION.cinematic, ease: EASING.entrance }}
        className="absolute inset-0 w-full h-[108%] -top-[4%]"
      >
        <Image
          src={DIEM_DU_LICH_HERO_IMAGE}
          alt="Bà Nà Hills — Cầu Vàng Đà Nẵng"
          fill
          priority
          unoptimized
          className="object-cover object-center"
          sizes="100vw"
        />
      </motion.div>

      {/* Seamless Multi-Stop Scrim melting cleanly into #06151C behind Frosted Console */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-1"
        style={{
          background:
            "linear-gradient(180deg, rgba(6,21,28,0.72) 0%, rgba(8,26,35,0.30) 40%, rgba(7,22,30,0.56) 72%, rgba(6,21,28,0.86) 90%, #06151C 100%)",
        }}
      />

      {/* Hero Typography & Bottom-Right Coordinate Pill (clears fixed top-right Weather pill) */}
      <div className="relative z-10 home-container w-full pb-24 sm:pb-28 pt-28">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs sm:text-sm text-[#CBD9DA]/82 mb-4"
        >
          <Link href="/" className="hover:text-[#FFFDF5] transition-colors">
            Trang chủ
          </Link>
          <ChevronRight size={14} className="text-[#E6D9B7]/50" />
          <span className="text-[#E6D9B7] font-medium">
            Điểm du lịch Đà Nẵng
          </span>
        </nav>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.06, ease: EASING.standard }}
              className="inline-flex items-center gap-3 mb-3.5"
            >
              <span
                className="w-8 h-[1.5px] bg-[#E87B39]"
                aria-hidden="true"
              />
              <Compass size={13} className="text-[#E6D9B7]" />
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-[#E6D9B7]">
                EXPEDITION LANDMARKS // ĐÀ NẴNG
              </span>
            </motion.div>

            <motion.h1
              initial={reducedMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.14, ease: EASING.entrance }}
              style={{ textShadow: "0 8px 30px rgba(3,12,17,0.68)" }}
              className="cinematic-condensed uppercase font-bold text-[#FFFDF5] text-[clamp(2.45rem,5.4vw,4.85rem)] leading-[1.0] tracking-[-0.02em]"
            >
              Điểm Du Lịch{" "}
              <span className="home-serif italic font-normal text-[#E6D9B7] normal-case whitespace-nowrap pr-2">
                Đà Nẵng
              </span>
            </motion.h1>

            <motion.p
              initial={reducedMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.22, ease: EASING.entrance }}
              className="mt-4 text-sm sm:text-base max-w-2xl text-[#E2ECEC]/90 leading-relaxed border-l-2 border-[#C9B580] pl-4"
            >
              Từ những bãi biển cát trắng miên man đến những ngọn núi hùng vĩ,
              Đà Nẵng lưu giữ hàng trăm kỳ quan chờ bạn khám phá.
            </motion.p>
          </div>

          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.28, ease: EASING.standard }}
            className="hidden lg:flex flex-col items-end text-right shrink-0 pb-1"
          >
            <span className="text-[10.5px] font-mono uppercase tracking-[0.22em] text-[#E6D9B7]/85">
              16°04&apos;N &middot; 108°13&apos;E
            </span>
            <span className="mt-1.5 inline-flex items-center gap-2 rounded-full bg-[#06151C]/62 backdrop-blur-md border border-[#E6D9B7]/30 px-3.5 py-1.5 text-xs font-medium text-[#FFFDF5]">
              <span className="w-2 h-2 rounded-full bg-[#E87B39]" />
              <span>Kỳ quan biển · núi · di sản miền Trung</span>
            </span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
