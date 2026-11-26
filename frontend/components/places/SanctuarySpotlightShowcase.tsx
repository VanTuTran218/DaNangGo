"use client";

/**
 * SanctuarySpotlightShowcase — Tier 1 ("CHƯƠNG 01 // TUYỆT TÁC NGHỈ DƯỠNG SIGNATURE")
 *
 * Aman × Belmond × Six Senses 12-col interactive Suite Spotlight:
 * - Left 7 cols: Full-bleed resort photography, rating & savings badges, HeartButton,
 *   and zero-clipping flex-wrap Suite Switcher (01..04).
 * - Right 5 cols: Private Concierge Suite Folio with curated amenities, transparent nightly rate,
 *   savings callout, and direct link to `/places/[id]`.
 */

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import {
  MapPin,
  Star,
  Sparkles,
  ArrowRight,
  Check,
  BedDouble,
} from "lucide-react";
import type { HotelData } from "@/components/places/HotelCard";
import HeartButton from "@/components/HeartButton";
import { recordSharedPlaceClick } from "@/components/ui/MotionPrimitives";
import { EASING } from "@/lib/motion-tokens";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=85";

interface SanctuarySpotlightShowcaseProps {
  hotels: HotelData[];
}

export default function SanctuarySpotlightShowcase({
  hotels,
}: SanctuarySpotlightShowcaseProps) {
  const reducedMotion = Boolean(useReducedMotion());

  const curatedSuites = useMemo(() => {
    if (hotels.length === 0) return [];
    const sorted = [...hotels].sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      return b.reviews - a.reviews;
    });
    return sorted.slice(0, 4);
  }, [hotels]);

  const [activeIdx, setActiveIdx] = useState(0);
  const [imgFailed, setImgFailed] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setActiveIdx(0);
  }, [curatedSuites.length, curatedSuites[0]?.id]);

  if (curatedSuites.length < 2) return null;

  const safeIdx = activeIdx < curatedSuites.length ? activeIdx : 0;
  const current = curatedSuites[safeIdx];
  const discountPct =
    current.originalPrice > current.pricePerNight
      ? Math.round(
          ((current.originalPrice - current.pricePerNight) /
            current.originalPrice) *
            100
        )
      : 0;
  const imgSrc =
    imgFailed[current.id] || !current.img ? FALLBACK_IMAGE : current.img;

  return (
    <section
      aria-label="Tuyệt tác nghỉ dưỡng Đà Nẵng"
      className="mb-14 lg:mb-18"
    >
      {/* Section Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
        <div>
          <div className="inline-flex items-center gap-2.5 text-[10.5px] font-mono uppercase tracking-[0.24em] text-[#E6D9B7] mb-2">
            <span className="w-6 h-[1px] bg-[#E87B39]" />
            <span>CHƯƠNG 01 // TUYỆT TÁC NGHỈ DƯỠNG SIGNATURE</span>
          </div>
          <h2 className="home-serif text-2xl sm:text-3xl lg:text-[34px] font-semibold text-[#FFFDF5] leading-tight">
            Chạm nhịp bình yên,{" "}
            <span className="italic font-normal text-[#E6D9B7]">
              giữa không gian nghỉ dưỡng biển trời
            </span>
          </h2>
        </div>

        <span className="hidden sm:inline-flex items-center gap-2 rounded-full bg-[#091E28]/72 border border-[#E6D9B7]/24 px-3.5 py-1.5 text-[10.5px] font-mono uppercase tracking-[0.18em] text-[#E6D9B7]/85">
          <BedDouble size={13} className="text-[#E87B39]" />
          <span>{curatedSuites.length} KHU NGHỈ NỔI BẬT</span>
        </span>
      </div>

      {/* Main 12-Col Luxury Suite Showcase */}
      <div className="relative rounded-[22px] bg-[#071821]/88 backdrop-blur-md border border-[#E6D9B7]/26 shadow-[0_30px_80px_rgba(2,10,15,0.52)] overflow-hidden grid lg:grid-cols-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[1px] z-30 bg-gradient-to-r from-transparent via-[#E6D9B7]/60 to-transparent"
        />

        {/* LEFT 7 COLS: FULL-BLEED SUITE PHOTOGRAPHY */}
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
              onError={() => setImgFailed((m) => ({ ...m, [current.id]: true }))}
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 58vw"
            />
          </motion.div>

          {/* Velvety Editorial Vignette */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(6,21,28,0.62) 0%, rgba(6,21,28,0.12) 38%, rgba(6,21,28,0.62) 74%, rgba(5,18,25,0.94) 100%)",
            }}
          />

          {/* Top Bar */}
          <div className="relative z-10 p-5 sm:p-6 flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#06151C]/78 backdrop-blur-md border border-[#E6D9B7]/32 px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[#FFFDF5]">
                <Sparkles size={11} className="text-[#E87B39]" />
                <span>{current.category}</span>
              </span>

              {discountPct > 0 && (
                <span className="inline-flex items-center rounded-full bg-[#E87B39]/90 border border-[#F6C89F]/45 px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#FFFDF5]">
                  Ưu đãi -{discountPct}%
                </span>
              )}
            </div>

            <div className="shrink-0">
              <HeartButton placeId={current.placeId ?? current.id} />
            </div>
          </div>

          {/* Bottom Location + Suite Switcher Tabs (flex-wrap, zero edge clipping) */}
          <div className="relative z-10 p-5 sm:p-6 pt-0 space-y-4">
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#E2ECEC]">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#06151C]/80 backdrop-blur-md border border-[#E6D9B7]/28 px-3 py-1.5">
                <Star
                  size={12.5}
                  className="fill-[#E87B39] text-[#E87B39]"
                />
                <strong className="text-[#FFFDF5]">{current.rating}</strong>
                <span className="text-[#CBD9DA]/75">
                  ({current.reviews.toLocaleString("vi-VN")} đánh giá)
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
              aria-label="Chọn điểm lưu trú nổi bật"
            >
              {curatedSuites.map((suite, idx) => {
                const isActive = idx === safeIdx;
                const code = String(idx + 1).padStart(2, "0");
                return (
                  <button
                    key={`${suite.id}-${suite.name}`}
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
                    <span className="max-w-[115px] truncate">{suite.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT 5 COLS: CONCIERGE SUITE FOLIO */}
        <div className="lg:col-span-5 p-6 sm:p-7 lg:p-8 flex flex-col justify-between bg-gradient-to-b from-[#0A202B]/95 to-[#06151C]/98">
          <motion.div
            key={current.id}
            initial={reducedMotion ? false : { opacity: 0.45, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: EASING.standard }}
            className="flex flex-col h-full justify-between space-y-5"
          >
            <div>
              {/* Folio Header */}
              <div className="flex items-center justify-between gap-2 pb-3.5 mb-4 border-b border-[#E6D9B7]/16">
                <span className="inline-flex items-center gap-2 text-[10.5px] font-mono uppercase tracking-[0.2em] text-[#E6D9B7]">
                  <Sparkles size={12} className="text-[#E87B39]" />
                  <span>SIGNATURE #{String(safeIdx + 1).padStart(2, "0")}</span>
                </span>
                <span className="text-[10.5px] font-mono uppercase tracking-[0.14em] text-[#7FD1C8]">
                  XÁC THỰC DANANGGO
                </span>
              </div>

              <Link
                href={`/places/${current.id}`}
                onClick={() => recordSharedPlaceClick(current.id, imgSrc)}
                className="group/title block"
              >
                <h3 className="home-serif text-2xl sm:text-[26px] font-semibold text-[#FFFDF5] group-hover/title:text-[#F5E6C4] transition-colors leading-[1.24] mb-2.5">
                  {current.name}
                </h3>
              </Link>

              <p className="flex items-center gap-1.5 text-xs sm:text-[13px] text-[#CBD9DA]/82 mb-5">
                <MapPin size={13.5} className="text-[#C9B580] shrink-0" />
                <span>{current.location}</span>
              </p>

              {/* Curated Amenities Checklist */}
              <div className="rounded-[16px] bg-[#051219]/70 border border-[#E6D9B7]/16 p-4 space-y-2.5">
                <span className="block text-[9.5px] font-mono uppercase tracking-[0.2em] text-[#E6D9B7]/70">
                  TIỆN NGHI NỔI BẬT
                </span>
                <ul className="space-y-2">
                  {current.amenities.slice(0, 3).map((amenity) => (
                    <li
                      key={amenity}
                      className="flex items-center gap-2 text-xs sm:text-[13px] text-[#E2ECEC]/90"
                    >
                      <span className="w-4 h-4 rounded-full bg-[#216B70]/35 border border-[#69A5A3]/45 text-[#7FD1C8] inline-flex items-center justify-center shrink-0">
                        <Check size={10} />
                      </span>
                      <span className="truncate">{amenity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Pricing & CTA Footer */}
            <div className="pt-4 border-t border-[#E6D9B7]/16 flex items-end justify-between gap-3">
              <div>
                <span className="block text-[10px] font-mono uppercase tracking-[0.16em] text-[#CBD9DA]/62 mb-0.5">
                  GIÁ CHỈ TỪ
                </span>
                {current.originalPrice > current.pricePerNight && (
                  <span className="block text-xs text-[#CBD9DA]/50 line-through">
                    {current.originalPrice.toLocaleString("vi-VN")}đ
                  </span>
                )}
                <p className="stat-number text-xl sm:text-2xl font-bold text-[#FFFDF5] leading-tight">
                  {current.pricePerNight.toLocaleString("vi-VN")}đ
                  <span className="text-xs font-normal text-[#E6D9B7]/80">
                    {" "}
                    / đêm
                  </span>
                </p>
              </div>

              <Link
                href={`/places/${current.id}`}
                onClick={() => recordSharedPlaceClick(current.id, imgSrc)}
                className="group/open luxury-btn-sweep inline-flex items-center gap-2 rounded-full bg-[#FFF8E9] hover:bg-white text-[#102832] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] shadow-[0_10px_24px_rgba(2,10,15,0.42)] transition-all shrink-0"
              >
                <span>Khám phá</span>
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
