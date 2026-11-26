"use client";

/**
 * CulinaryTastingShowcase — Tier 1 ("CHƯƠNG 01 // TUYỂN TẬP VỊ NGON BẢN ĐỊA")
 *
 * Michelin Guide Dark Edition × Editorial Tasting Showcase:
 * - Left 7 cols: Full-bleed dish photography, live open-now pulse, specialty badge,
 *   HeartButton/Bookmark, and zero-clipping flex-wrap Tasting Course switcher (01..04).
 * - Right 5 cols: Chef's Tasting Note dossier with opening hours, rating, description,
 *   signature flavor tags, transparent price range, and direct CTA to `/places/[id]`.
 */

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import {
  MapPin,
  Star,
  Clock,
  Sparkles,
  ArrowRight,
  Utensils,
} from "lucide-react";
import HeartButton from "@/components/HeartButton";
import { recordSharedPlaceClick } from "@/components/ui/MotionPrimitives";
import { EASING } from "@/lib/motion-tokens";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1559847844-5315695dadae?w=1200&q=85";

export interface CulinaryPlaceItem {
  id: number;
  placeId?: number;
  name: string;
  badge: string;
  badgeColor: string;
  badgePulse: boolean;
  category: string;
  location: string;
  rating: number;
  reviews: number;
  priceRange: string;
  priceNote: string;
  openNow: boolean;
  hours: string;
  img: string;
  tags: string[];
  description: string;
}

interface CulinaryTastingShowcaseProps {
  places: CulinaryPlaceItem[];
}

export default function CulinaryTastingShowcase({
  places,
}: CulinaryTastingShowcaseProps) {
  const reducedMotion = Boolean(useReducedMotion());

  const curatedCourses = useMemo(() => {
    if (places.length === 0) return [];
    const sorted = [...places].sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      return b.reviews - a.reviews;
    });
    return sorted.slice(0, 4);
  }, [places]);

  const [activeIdx, setActiveIdx] = useState(0);
  const [imgFailed, setImgFailed] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setActiveIdx(0);
  }, [curatedCourses.length, curatedCourses[0]?.id]);

  if (curatedCourses.length < 2) return null;

  const safeIdx = activeIdx < curatedCourses.length ? activeIdx : 0;
  const current = curatedCourses[safeIdx];
  const imgSrc =
    imgFailed[current.id] || !current.img ? FALLBACK_IMAGE : current.img;

  return (
    <section
      aria-label="Tuyển tập vị ngon bản địa Đà Nẵng"
      className="mb-14 lg:mb-18"
    >
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
        <div>
          <div className="inline-flex items-center gap-2.5 text-[10.5px] font-mono uppercase tracking-[0.24em] text-[#E6D9B7] mb-2">
            <span className="w-6 h-[1px] bg-[#E87B39]" />
            <span>CHƯƠNG 01 // TUYỂN TẬP VỊ NGON BẢN ĐỊA</span>
          </div>
          <h2 className="home-serif text-2xl sm:text-3xl lg:text-[34px] font-semibold text-[#FFFDF5] leading-tight">
            Tinh hoa vị giác,{" "}
            <span className="italic font-normal text-[#E6D9B7]">
              từ quán hẻm trứ danh đến hải sản ven biển
            </span>
          </h2>
        </div>

        <span className="hidden sm:inline-flex items-center gap-2 rounded-full bg-[#091E28]/72 border border-[#E6D9B7]/24 px-3.5 py-1.5 text-[10.5px] font-mono uppercase tracking-[0.18em] text-[#E6D9B7]/85">
          <Utensils size={12.5} className="text-[#E87B39]" />
          <span>{curatedCourses.length} ĐỊA CHỈ ĐỀ XUẤT</span>
        </span>
      </div>

      {/* Main 12-Col Michelin Tasting Showcase */}
      <div className="relative rounded-[22px] bg-[#071821]/88 backdrop-blur-md border border-[#E6D9B7]/26 shadow-[0_30px_80px_rgba(2,10,15,0.52)] overflow-hidden grid lg:grid-cols-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[1px] z-30 bg-gradient-to-r from-transparent via-[#E6D9B7]/60 to-transparent"
        />

        {/* LEFT 7 COLS: FULL-BLEED DISH PHOTOGRAPHY */}
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

          {/* Editorial Deep-Ocean Vignette */}
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
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#06151C]/78 backdrop-blur-md border border-[#E6D9B7]/32 px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[#FFFDF5]">
                <Sparkles size={11} className="text-[#E87B39]" />
                <span>{current.badge}</span>
              </span>

              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10.5px] font-semibold border backdrop-blur-md ${
                  current.openNow
                    ? "bg-[#216B70]/45 border-[#69A5A3]/60 text-[#E2ECEC]"
                    : "bg-[#06151C]/78 border-white/20 text-[#CBD9DA]/75"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    current.openNow ? "bg-[#7FD1C8] animate-pulse" : "bg-white/40"
                  }`}
                />
                <span>{current.openNow ? "Đang mở cửa" : "Đã đóng cửa"}</span>
              </span>
            </div>

            {current.placeId ? (
              <div className="shrink-0">
                <HeartButton placeId={current.placeId} />
              </div>
            ) : null}
          </div>

          {/* Bottom Telemetry + Zero-Clipping Course Switcher */}
          <div className="relative z-10 p-5 sm:p-6 pt-0 space-y-4">
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#E2ECEC]">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#06151C]/80 backdrop-blur-md border border-[#E6D9B7]/28 px-3 py-1.5">
                <Star size={12.5} className="fill-[#E87B39] text-[#E87B39]" />
                <strong className="text-[#FFFDF5]">{current.rating}</strong>
                <span className="text-[#CBD9DA]/75">
                  ({current.reviews.toLocaleString("vi-VN")} đánh giá)
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#06151C]/80 backdrop-blur-md border border-[#E6D9B7]/25 px-3 py-1.5">
                <Clock size={12.5} className="text-[#E6D9B7]" />
                <span>{current.hours}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#06151C]/80 backdrop-blur-md border border-[#E6D9B7]/25 px-3 py-1.5">
                <MapPin size={12.5} className="text-[#C9B580]" />
                <span>{current.location}</span>
              </span>
            </div>

            <div
              className="flex flex-wrap items-center gap-2 pt-0.5"
              role="tablist"
              aria-label="Chọn địa điểm ẩm thực nổi bật"
            >
              {curatedCourses.map((course, idx) => {
                const isActive = idx === safeIdx;
                const code = String(idx + 1).padStart(2, "0");
                return (
                  <button
                    key={`${course.id}-${course.name}`}
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
                    <span className="max-w-[115px] truncate">
                      {course.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT 5 COLS: TASTING NOTE DOSSIER */}
        <div className="lg:col-span-5 p-6 sm:p-7 lg:p-8 flex flex-col justify-between bg-gradient-to-b from-[#0A202B]/95 to-[#06151C]/98">
          <motion.div
            key={current.id}
            initial={reducedMotion ? false : { opacity: 0.45, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: EASING.standard }}
            className="flex flex-col h-full justify-between space-y-5"
          >
            <div>
              {/* Header */}
              <div className="flex items-center justify-between gap-2 pb-3.5 mb-4 border-b border-[#E6D9B7]/16">
                <span className="inline-flex items-center gap-2 text-[10.5px] font-mono uppercase tracking-[0.2em] text-[#E6D9B7]">
                  <Utensils size={12} className="text-[#E87B39]" />
                  <span>MÓN NGON #{String(safeIdx + 1).padStart(2, "0")}</span>
                </span>
                <span className="rounded-full bg-white/[0.06] border border-[#E6D9B7]/24 px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-[0.14em] text-[#E6D9B7]">
                  {current.category}
                </span>
              </div>

              <Link
                href={`/places/${current.id}`}
                onClick={() =>
                  recordSharedPlaceClick(current.placeId ?? current.id, imgSrc)
                }
                className="group/title block"
              >
                <h3 className="home-serif text-2xl sm:text-[26px] font-semibold text-[#FFFDF5] group-hover/title:text-[#F5E6C4] transition-colors leading-[1.24] mb-3">
                  {current.name}
                </h3>
              </Link>

              <p className="text-xs sm:text-[13.5px] text-[#CBD9DA]/85 leading-relaxed line-clamp-3 mb-5">
                {current.description}
              </p>

              {/* Signature Tasting Tags */}
              <div className="rounded-[16px] bg-[#051219]/70 border border-[#E6D9B7]/16 p-4 space-y-2.5">
                <span className="block text-[9.5px] font-mono uppercase tracking-[0.2em] text-[#E6D9B7]/70">
                  HƯƠNG VỊ ĐẶC TRƯNG
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {current.tags.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full bg-white/[0.06] border border-[#E6D9B7]/22 px-2.5 py-1 text-[11px] font-medium text-[#E2ECEC]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Price & CTA Footer */}
            <div className="pt-4 border-t border-[#E6D9B7]/16 flex items-end justify-between gap-3">
              <div>
                <span className="block text-[10px] font-mono uppercase tracking-[0.16em] text-[#CBD9DA]/62 mb-0.5">
                  MỨC GIÁ THAM KHẢO
                </span>
                <p className="stat-number text-lg sm:text-xl font-bold text-[#7FD1C8] leading-tight">
                  {current.priceRange}
                  <span className="text-xs font-normal text-[#E6D9B7]/75 ml-1">
                    {current.priceNote}
                  </span>
                </p>
              </div>

              <Link
                href={`/places/${current.id}`}
                onClick={() =>
                  recordSharedPlaceClick(current.placeId ?? current.id, imgSrc)
                }
                className="group/open luxury-btn-sweep inline-flex items-center gap-2 rounded-full bg-[#FFF8E9] hover:bg-white text-[#102832] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] shadow-[0_10px_24px_rgba(2,10,15,0.42)] transition-all shrink-0"
              >
                <span>Xem thực đơn</span>
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
