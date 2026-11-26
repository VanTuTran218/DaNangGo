"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Map, MapPin, Navigation, ArrowRight, Compass } from "lucide-react";
import Link from "next/link";

const RADAR_BLIPS = [
  { label: "Sơn Trà", top: "20%", right: "24%" },
  { label: "Cầu Rồng", bottom: "26%", left: "22%" },
  { label: "Mỹ Khê", bottom: "22%", right: "22%" },
  { label: "Bà Nà", top: "26%", left: "18%" },
];

export default function RadarMapPreview() {
  const reducedMotion = Boolean(useReducedMotion());

  return (
    <div className="relative rounded-[24px] bg-gradient-to-br from-[#0B232E]/94 via-[#071922]/96 to-[#051219]/98 border border-[#E6D9B7]/28 overflow-hidden shadow-[0_28px_72px_rgba(2,10,15,0.52)]">
      {/* Top Champagne Hairline */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#E6D9B7]/60 to-transparent"
      />

      {/* Nautical Coordinate Grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(230,217,183,0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(230,217,183,0.4) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between p-8 md:p-14 gap-10">
        {/* Left Copy */}
        <div className="md:w-1/2 text-[#FFFDF5]">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#216B70]/30 border border-[#69A5A3]/45 text-[#E6D9B7] text-[11px] font-mono font-semibold uppercase tracking-[0.18em] px-4 py-1.5 mb-5">
            <Map size={13} className="text-[#E87B39]" />
            <span>BẢN ĐỒ TƯƠNG TÁC SONAR</span>
          </div>

          <h2 className="home-serif text-3xl md:text-4xl lg:text-[42px] font-semibold mb-4 leading-[1.15] text-[#FFFDF5]">
            Khám phá Đà Nẵng trên{" "}
            <span className="italic font-normal text-[#E6D9B7]">
              bản đồ thông minh
            </span>
          </h2>

          <p className="text-[#CBD9DA]/82 text-sm md:text-base mb-8 max-w-lg leading-relaxed">
            Trải nghiệm trực quan với hệ thống bản đồ Radar Map. Dễ dàng định vị
            kỳ quan, đo khoảng cách, tính toán lộ trình và khám phá các tọa độ
            ẩn mình xung quanh bạn.
          </p>

          <Link
            href="/bando"
            className="luxury-btn-sweep inline-flex items-center gap-2.5 rounded-full bg-[#E87B39] hover:bg-[#D66A28] text-[#FFFDF5] font-semibold uppercase tracking-[0.12em] text-xs px-7 py-3.5 transition-all group shadow-[0_14px_32px_rgba(232,123,57,0.34)]"
          >
            <span>Mở Bản Đồ Khám Phá</span>
            <ArrowRight
              size={15}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>
        </div>

        {/* Right Nocturnal Sonar Radar */}
        <div className="md:w-1/2 relative h-64 md:h-80 w-full flex items-center justify-center">
          {/* Outer concentric nautical rings */}
          <div
            aria-hidden="true"
            className="absolute w-64 h-64 md:w-76 md:h-76 rounded-full border border-[#E6D9B7]/16"
          />
          <div
            aria-hidden="true"
            className="absolute w-48 h-48 md:w-60 md:h-60 rounded-full border border-dashed border-[#69A5A3]/30"
          />
          <div
            aria-hidden="true"
            className="absolute w-32 h-32 md:w-40 md:h-40 rounded-full border border-[#E6D9B7]/20"
          />

          {/* Crosshair axes */}
          <div
            aria-hidden="true"
            className="absolute w-64 md:w-76 h-[1px] bg-[#E6D9B7]/14"
          />
          <div
            aria-hidden="true"
            className="absolute h-64 md:h-76 w-[1px] bg-[#E6D9B7]/14"
          />

          {/* Rotating Sonar Sweep */}
          <motion.div
            aria-hidden="true"
            className="w-52 h-52 md:w-64 md:h-64 rounded-full flex items-center justify-center relative"
            animate={reducedMotion ? undefined : { rotate: 360 }}
            transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
          >
            <div
              className="absolute top-0 right-0 bottom-1/2 left-1/2 bg-gradient-to-tr from-[#69A5A3]/45 via-[#E6D9B7]/18 to-transparent origin-bottom-left"
              style={{ clipPath: "polygon(100% 0, 0 100%, 100% 100%)" }}
            />
            <div className="w-3.5 h-3.5 bg-[#FFFDF5] ring-4 ring-[#E87B39]/55 rounded-full shadow-[0_0_20px_rgba(232,123,57,0.9)]" />
          </motion.div>

          {/* Landmark Coordinate Blips */}
          {RADAR_BLIPS.map((blip, idx) => (
            <div
              key={blip.label}
              style={{
                top: blip.top,
                bottom: blip.bottom,
                left: blip.left,
                right: blip.right,
              }}
              className="absolute inline-flex items-center gap-1.5 rounded-full bg-[#06151C]/86 backdrop-blur-md border border-[#E6D9B7]/35 px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.12em] text-[#FFFDF5] shadow-lg"
            >
              {idx % 2 === 0 ? (
                <MapPin size={11} className="text-[#E87B39]" />
              ) : (
                <Navigation size={11} className="text-[#7FD1C8]" />
              )}
              <span>{blip.label}</span>
            </div>
          ))}

          {/* Bottom Compass Telemetry */}
          <div className="absolute bottom-1 inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.2em] text-[#E6D9B7]/70">
            <Compass size={11} className="text-[#E87B39]" />
            <span>16°04&apos;N &middot; 108°13&apos;E</span>
          </div>
        </div>
      </div>
    </div>
  );
}
