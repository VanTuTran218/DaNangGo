"use client";

/**
 * LandmarkExpeditionShowcase — Tier 1 ("CHƯƠNG 01 // TUYỆT TÁC KỲ QUAN ĐÀ NẴNG")
 *
 * White Desert × &Beyond interactive 12-col Landmark Spotlight:
 * - Left 7 cols: Full-bleed landmark photography with guaranteed local fallback,
 *   HeartButton, rating & visitor badges, and zero-clipping flex-wrap landmark tabs (01..04).
 * - Right 5 cols: Expedition Field Dossier with full story (`longDesc`), location/visitors
 *   telemetry grid, and luminous CTA to `/places/[id]`.
 */

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import {
  MapPin,
  Star,
  Users,
  Sparkles,
  ArrowRight,
  Compass,
} from "lucide-react";
import type { AttractionData } from "@/components/attractions/StoryCard";
import HeartButton from "@/components/HeartButton";
import { recordSharedPlaceClick } from "@/components/ui/MotionPrimitives";
import { EASING } from "@/lib/motion-tokens";

const LOCAL_FALLBACK_IMG = "/images/intro/landscape/intro-coastal-panorama.jpg";

interface LandmarkExpeditionShowcaseProps {
  items: AttractionData[];
}

export default function LandmarkExpeditionShowcase({
  items,
}: LandmarkExpeditionShowcaseProps) {
  const reducedMotion = Boolean(useReducedMotion());

  const featuredLandmarks = useMemo(() => {
    if (items.length === 0) return [];
    const sorted = [...items].sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      return b.visitors - a.visitors;
    });
    return sorted.slice(0, 4);
  }, [items]);

  const [activeIdx, setActiveIdx] = useState(0);
  const [imgFailed, setImgFailed] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setActiveIdx(0);
  }, [featuredLandmarks.length, featuredLandmarks[0]?.id]);

  if (featuredLandmarks.length < 2) return null;

  const safeIdx = activeIdx < featuredLandmarks.length ? activeIdx : 0;
  const current = featuredLandmarks[safeIdx];
  const imgSrc =
    imgFailed[current.id] || !current.img ? LOCAL_FALLBACK_IMG : current.img;

  return (
    <section
      aria-label="Tuyệt tác kỳ quan Đà Nẵng"
      className="mb-14 lg:mb-18"
    >
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
        <div>
          <div className="inline-flex items-center gap-2.5 text-[10.5px] font-mono uppercase tracking-[0.24em] text-[#E6D9B7] mb-2">
            <span className="w-6 h-[1px] bg-[#E87B39]" />
            <span>CHƯƠNG 01 // TUYỆT TÁC KỲ QUAN ĐÀ NẴNG</span>
          </div>
          <h2 className="home-serif text-2xl sm:text-3xl lg:text-[34px] font-semibold text-[#FFFDF5] leading-tight">
            Hành trình kỳ quan,{" "}
            <span className="italic font-normal text-[#E6D9B7]">
              từ đỉnh núi Chúa đến bờ biển thiên đường
            </span>
          </h2>
        </div>

        <span className="hidden sm:inline-flex items-center gap-2 rounded-full bg-[#091E28]/72 border border-[#E6D9B7]/24 px-3.5 py-1.5 text-[10.5px] font-mono uppercase tracking-[0.18em] text-[#E6D9B7]/85">
          <Compass size={13} className="text-[#E87B39]" />
          <span>{featuredLandmarks.length} TỌA ĐỘ BIỂU TƯỢNG</span>
        </span>
      </div>

      {/* Main 12-Col Expedition Spotlight */}
      <div className="relative rounded-[22px] bg-[#071821]/88 backdrop-blur-md border border-[#E6D9B7]/26 shadow-[0_30px_80px_rgba(2,10,15,0.52)] overflow-hidden grid lg:grid-cols-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[1px] z-30 bg-gradient-to-r from-transparent via-[#E6D9B7]/60 to-transparent"
        />

        {/* LEFT 7 COLS: FULL-BLEED LANDMARK CANVAS */}
        <div className="relative lg:col-span-7 min-h-[360px] sm:min-h-[420px] lg:min-h-[455px] overflow-hidden bg-[#051219] flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#E6D9B7]/16">
          <motion.div
            key={current.id}
            initial={reducedMotion ? false : { opacity: 0.45, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, ease: EASING.standard }}
            className="absolute inset-0"
          >
            <Image
              src={imgSrc}
              alt={current.name}
              fill
              priority
              unoptimized={imgSrc.startsWith("http")}
              onError={() =>
                setImgFailed((m) => ({ ...m, [current.id]: true }))
              }
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 58vw"
            />
          </motion.div>

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(6,21,28,0.62) 0%, rgba(6,21,28,0.12) 38%, rgba(6,21,28,0.64) 74%, rgba(5,18,25,0.94) 100%)",
            }}
          />

          {/* Top Bar */}
          <div className="relative z-10 p-5 sm:p-6 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#06151C]/78 backdrop-blur-md border border-[#E6D9B7]/32 px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[#FFFDF5]">
              <Sparkles size={11} className="text-[#E87B39]" />
              <span>{current.category}</span>
            </span>

            <div className="shrink-0">
              <HeartButton placeId={current.placeId ?? current.id} />
            </div>
          </div>

          {/* Bottom Telemetry + Zero-Clipping Landmark Switcher */}
          <div className="relative z-10 p-5 sm:p-6 pt-0 space-y-4">
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#E2ECEC]">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#06151C]/80 backdrop-blur-md border border-[#E6D9B7]/28 px-3 py-1.5">
                <Star size={12.5} className="fill-[#E87B39] text-[#E87B39]" />
                <strong className="text-[#FFFDF5]">{current.rating}</strong>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#06151C]/80 backdrop-blur-md border border-[#E6D9B7]/25 px-3 py-1.5">
                <Users size={12.5} className="text-[#7FD1C8]" />
                <span>
                  {current.visitors.toLocaleString("vi-VN")} lượt khách/năm
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#06151C]/80 backdrop-blur-md border border-[#E6D9B7]/25 px-3 py-1.5">
                <MapPin size={12.5} className="text-[#C9B580]" />
                <span>{current.location}</span>
              </span>
            </div>

            <div
              className="flex flex-wrap items-center gap-2 pt-0.5"
              role="tablist"
              aria-label="Chọn kỳ quan nổi bật"
            >
              {featuredLandmarks.map((item, idx) => {
                const isActive = idx === safeIdx;
                const code = String(idx + 1).padStart(2, "0");
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveIdx(idx)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-all shrink-0 cursor-pointer border ${
                      isActive
                        ? "bg-[#FFF8E9] text-[#102832] border-[#FFF8E9] shadow-[0_6px_18px_rgba(2,10,15,0.45)]"
                        : "bg-[#06151C]/74 text-[#CBD9DA] border-[#E6D9B7]/22 hover:border-[#E6D9B7]/55 hover:text-[#FFFDF5]"
                    }`}
                  >
                    <span
                      className={`font-mono text-[10px] font-bold ${
                        isActive ? "text-[#CB712D]" : "text-[#E6D9B7]/80"
                      }`}
                    >
                      {code}
                    </span>
                    <span className="max-w-[115px] truncate">{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT 5 COLS: EXPEDITION FIELD DOSSIER */}
        <div className="lg:col-span-5 p-6 sm:p-7 lg:p-8 flex flex-col justify-between bg-gradient-to-b from-[#0A202B]/95 to-[#06151C]/98">
          <motion.div
            key={current.id}
            initial={reducedMotion ? false : { opacity: 0.45, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: EASING.standard }}
            className="flex flex-col h-full justify-between space-y-5"
          >
            <div>
              <div className="flex items-center justify-between gap-2 pb-3.5 mb-4 border-b border-[#E6D9B7]/16">
                <span className="inline-flex items-center gap-2 text-[10.5px] font-mono uppercase tracking-[0.2em] text-[#E6D9B7]">
                  <Compass size={12.5} className="text-[#E87B39]" />
                  <span>KỲ QUAN #{String(safeIdx + 1).padStart(2, "0")}</span>
                </span>
                <span className="rounded-full bg-white/[0.06] border border-[#E6D9B7]/24 px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-[0.14em] text-[#E6D9B7]">
                  {current.location}
                </span>
              </div>

              <Link
                href={`/places/${current.id}`}
                onClick={() => recordSharedPlaceClick(current.id, imgSrc)}
                className="group/title block"
              >
                <h3 className="home-serif text-2xl sm:text-[26px] font-semibold text-[#FFFDF5] group-hover/title:text-[#F5E6C4] transition-colors leading-[1.24] mb-3">
                  {current.name}
                </h3>
              </Link>

              <p className="text-xs sm:text-[13.5px] text-[#CBD9DA]/85 leading-relaxed line-clamp-4 mb-5">
                {current.longDesc || current.shortDesc}
              </p>

              {/* Telemetry Meta Grid */}
              <div className="grid grid-cols-2 gap-3 rounded-[16px] bg-[#051219]/70 border border-[#E6D9B7]/16 p-4">
                <div>
                  <span className="block text-[9.5px] font-mono uppercase tracking-[0.18em] text-[#E6D9B7]/65 mb-1">
                    LƯỢT KHÁCH / NĂM
                  </span>
                  <span className="block text-sm font-mono font-bold text-[#7FD1C8]">
                    {current.visitors.toLocaleString("vi-VN")}
                  </span>
                </div>
                <div className="border-l border-[#E6D9B7]/14 pl-3">
                  <span className="block text-[9.5px] font-mono uppercase tracking-[0.18em] text-[#E6D9B7]/65 mb-1">
                    ĐÁNH GIÁ DU KHÁCH
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm font-bold text-[#F6B27B]">
                    ★ {current.rating} / 5.0
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E6D9B7]/16 flex items-center justify-between gap-3">
              <span className="text-[10.5px] font-mono uppercase tracking-[0.16em] text-[#CBD9DA]/70 truncate">
                {current.category}
              </span>

              <Link
                href={`/places/${current.id}`}
                onClick={() => recordSharedPlaceClick(current.id, imgSrc)}
                className="group/open luxury-btn-sweep inline-flex items-center gap-2 rounded-full bg-[#FFF8E9] hover:bg-white text-[#102832] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] shadow-[0_10px_24px_rgba(2,10,15,0.42)] transition-all shrink-0"
              >
                <span>Khám phá kỳ quan</span>
                <ArrowRight
                  size={14}
                  className="text-[#CB712D] transition-transform duration-250 group-hover/open:translate-x-1"
                />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
