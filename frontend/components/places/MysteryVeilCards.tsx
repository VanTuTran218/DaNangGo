"use client";

/**
 * MysteryVeilCards — Tier 2 ("Vén Màn Sương — 3 Điểm Đến Ẩn Mình")
 *
 * Inspired by White Desert × Aman Resorts × Belmond:
 * - Selects 3 standout destinations from the active list and veils them behind
 *   an atmospheric dark coastal mist + poetic riddle clue.
 * - As the user moves their pointer over a card, a crisp circular aperture (`mask-image`
 *   driven by CSS variables `--vx`, `--vy`, 0 React re-renders) physically dissolves the mist
 *   right underneath the cursor to reveal the vivid photograph beneath.
 * - Clicking opens the real `/places/[id]` detail page smoothly with zero glare.
 */

import React, { useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Compass, Eye, MapPin, Sparkles, Star } from "lucide-react";
import type { PlaceListItem } from "@/lib/api/places";
import HeartButton from "@/components/HeartButton";
import { recordSharedPlaceClick } from "@/components/ui/MotionPrimitives";

interface MysteryVeilCardsProps {
  places: PlaceListItem[];
  resolveImageSrc: (raw?: string | null) => string | null;
}

const MYSTERY_CLUES = [
  {
    chapter: "MẬT MÃ I",
    clue: "“Nơi ánh bình minh chạm mặt sóng trước khi thành phố kịp thức giấc.”",
  },
  {
    chapter: "MẬT MÃ II",
    clue: "“Một khoảng lặng tách biệt giữa mùi gió biển và sắc xanh sơn thủy.”",
  },
  {
    chapter: "MẬT MÃ III",
    clue: "“Lát cắt bản địa ít ồn ào nhưng đủ giữ chân mọi du khách quay lại.”",
  },
];

function VeilCard({
  place,
  imageSrc,
  clue,
}: {
  place: PlaceListItem;
  imageSrc: string | null;
  clue: (typeof MYSTERY_CLUES)[number];
}) {
  const cardRef = useRef<HTMLElement>(null);
  const rafRef = useRef<number | null>(null);
  const [imgFailed, setImgFailed] = useState(false);

  const handleMove = (e: React.MouseEvent<HTMLElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      el.style.setProperty("--vx", `${x.toFixed(1)}px`);
      el.style.setProperty("--vy", `${y.toFixed(1)}px`);
      el.style.setProperty("--v-open", "1");
      rafRef.current = null;
    });
  };

  const handleLeave = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    cardRef.current?.style.setProperty("--v-open", "0");
  };

  const showImage = Boolean(imageSrc) && !imgFailed;

  return (
    <article
      ref={cardRef}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="group mystery-veil-card relative rounded-[18px] bg-[#081A22] border border-[#E6D9B7]/25 hover:border-[#E6D9B7]/65 shadow-[0_22px_54px_rgba(3,12,17,0.45)] overflow-hidden h-[380px] sm:h-[410px] flex flex-col transition-all duration-400 hover:-translate-y-1 select-none"
    >
      {/* Top Champagne hairline */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[1px] z-30 bg-gradient-to-r from-transparent via-[#E6D9B7]/50 to-transparent"
      />

      {/* Favorite Heart Button outside Link */}
      <div className="absolute top-4 right-4 z-30">
        <HeartButton placeId={place.place_id} />
      </div>

      <Link
        href={`/places/${place.place_id}`}
        onClick={() => recordSharedPlaceClick(place.place_id, imageSrc ?? undefined)}
        className="relative flex flex-col justify-between w-full h-full outline-none"
      >
        {/* Vivid Full-Color Destination Photo Beneath the Mist */}
        <div className="absolute inset-0 z-0 overflow-hidden bg-[#081A22]">
          {showImage && imageSrc ? (
            <Image
              src={imageSrc}
              alt={place.name}
              fill
              unoptimized={imageSrc.startsWith("http")}
              onError={() => setImgFailed(true)}
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                background:
                  "radial-gradient(circle at 50% 40%, rgba(33,107,112,0.48) 0%, #06151C 80%)",
              }}
            >
              <Compass size={32} className="text-[#E6D9B7]/55" />
            </div>
          )}

          {/* Grounding bottom vignette so text is always crisp even when mist parts */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(6,21,28,0.38) 0%, rgba(6,21,28,0.12) 38%, rgba(5,16,22,0.82) 74%, rgba(4,14,19,0.96) 100%)",
            }}
          />
        </div>

        {/* Mysterious Coastal Mist Veil — Physically Dissolves Under Cursor Aperture */}
        <div
          aria-hidden="true"
          className="mystery-veil-mist pointer-events-none absolute inset-0 z-10"
          style={{
            background:
              "radial-gradient(ellipse 90% 80% at 50% 35%, rgba(9,31,41,0.74) 0%, rgba(6,20,27,0.88) 70%, rgba(4,14,20,0.94) 100%)",
          }}
        >
          <img
            src="/images/intro/atmosphere/intro-coastal-contours.svg"
            alt=""
            className="w-full h-full object-cover opacity-35"
          />
        </div>

        {/* Subtle circular unveiling lens ring tracking pointer */}
        <div
          aria-hidden="true"
          className="mystery-veil-ring pointer-events-none hidden lg:block absolute z-15 w-[190px] h-[190px] rounded-full border border-[#E6D9B7]/32"
        />

        {/* Top Row: Chapter Cipher Badge */}
        <div className="relative z-20 p-5 pr-16 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#06151C]/78 backdrop-blur-xs border border-[#E6D9B7]/32 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em] text-[#E6D9B7]">
            <Sparkles size={11} className="text-[#E87B39]" />
            <span>{clue.chapter}</span>
          </span>
        </div>

        {/* Center Poetic Mystery Riddle — gently fades away as user unveils the photo */}
        <div className="relative z-20 px-6 text-center transition-all duration-500 ease-out group-hover:opacity-0 group-hover:-translate-y-2">
          <p className="home-serif italic text-base sm:text-[17px] text-[#FFFDF5]/90 leading-relaxed drop-shadow-[0_2px_10px_rgba(4,14,20,0.8)]">
            {clue.clue}
          </p>
          <span className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.2em] text-[#E6D9B7]/80">
            <Eye size={12} className="text-[#E87B39]" />
            <span>Rê chuột vén màn sương</span>
          </span>
        </div>

        {/* Bottom Info — reveals clearly with smooth lift */}
        <div className="relative z-20 p-5 sm:p-6">
          <h3
            style={{ textShadow: "0 2px 12px rgba(4,14,20,0.85)" }}
            className="home-serif text-lg sm:text-xl font-semibold text-[#FFFDF5] group-hover:text-[#F5E6C4] transition-colors line-clamp-1 mb-1"
          >
            {place.name}
          </h3>
          <div className="flex items-center justify-between gap-2 text-xs text-[#CBD9DA]/82">
            <span className="inline-flex items-center gap-1.5 truncate">
              <MapPin size={12.5} className="text-[#C9B580] shrink-0" />
              <span className="truncate">{place.address || "Đà Nẵng"}</span>
            </span>
            <span className="inline-flex items-center gap-1 shrink-0 text-[#FFFDF5] font-semibold">
              <Star size={12} className="fill-[#E87B39] text-[#E87B39]" />
              <span>{Number(place.avg_rating).toFixed(1)}</span>
              <ArrowRight
                size={13}
                className="ml-1 text-[#E6D9B7] transition-transform duration-300 group-hover:translate-x-1"
              />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

export default function MysteryVeilCards({
  places,
  resolveImageSrc,
}: MysteryVeilCardsProps) {
  const trio = useMemo(() => {
    const withImage = places.filter((p) => Boolean(resolveImageSrc(p.cover_image)));
    const pool = withImage.length >= 3 ? withImage : places;
    // Prefer top-rated distinct entries
    const sorted = [...pool].sort(
      (a, b) =>
        Number(b.avg_rating) - Number(a.avg_rating) ||
        b.review_count - a.review_count
    );
    const chosen: PlaceListItem[] = [];
    const seen = new Set<string>();
    for (const item of sorted) {
      const key = item.name.trim().toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      chosen.push(item);
      if (chosen.length === 3) break;
    }
    return chosen;
  }, [places, resolveImageSrc]);

  if (trio.length < 3) return null;

  return (
    <section aria-label="Vén màn sương Đà Nẵng" className="mb-16 lg:mb-20">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2.5 text-[10.5px] font-mono uppercase tracking-[0.24em] text-[#E6D9B7] mb-2">
            <span className="w-6 h-[1px] bg-[#E87B39]" />
            <span>CHƯƠNG 02 // VÉN MÀN SƯƠNG BÍ ẨN</span>
          </div>
          <h2 className="home-serif text-2xl sm:text-3xl font-semibold text-[#FFFDF5]">
            Ba điểm hẹn{" "}
            <span className="italic font-normal text-[#E6D9B7]">
              ẩn sau làn sương sớm
            </span>
          </h2>
        </div>
        <p className="text-xs font-mono uppercase tracking-[0.18em] text-[#CBD9DA]/70 hidden sm:block">
          Lia con trỏ qua từng khung để hé lộ hình ảnh
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {trio.map((place, idx) => (
          <VeilCard
            key={place.place_id}
            place={place}
            imageSrc={resolveImageSrc(place.cover_image)}
            clue={MYSTERY_CLUES[idx]}
          />
        ))}
      </div>
    </section>
  );
}
