"use client";

/**
 * EditorialIndexList — Tier 3 Mode B (Awwwards SOTD Hover-Preview Studio Archive)
 *
 * Ultra-refined minimal directory rows on the Dark Sanctuary canvas:
 * - Hovering any row smoothly floats a spring-damped cinematic framed preview card
 *   beside the cursor (driven by Framer Motion `useMotionValue` + `useSpring` — 0 React re-renders
 *   during pointer movement!).
 * - Clicking any row opens `/places/[id]` cleanly with Shared Element transition memory.
 */

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from "framer-motion";
import {
  ArrowRight,
  Compass,
  Hotel,
  Landmark,
  MapPin,
  Star,
  Utensils,
  Coffee,
} from "lucide-react";
import type { PlaceListItem } from "@/lib/api/places";
import HeartButton from "@/components/HeartButton";
import { recordSharedPlaceClick } from "@/components/ui/MotionPrimitives";

interface EditorialIndexListProps {
  places: PlaceListItem[];
  resolveImageSrc: (raw?: string | null) => string | null;
}

function typeLabel(type: string) {
  switch (type) {
    case "ACCOMMODATION":
      return { label: "Lưu trú", icon: <Hotel size={12} /> };
    case "RESTAURANT":
      return { label: "Nhà hàng", icon: <Utensils size={12} /> };
    case "ATTRACTION":
      return { label: "Điểm du lịch", icon: <Landmark size={12} /> };
    case "CAFE":
      return { label: "Cà phê", icon: <Coffee size={12} /> };
    default:
      return { label: type, icon: <Compass size={12} /> };
  }
}

export default function EditorialIndexList({
  places,
  resolveImageSrc,
}: EditorialIndexListProps) {
  const reducedMotion = Boolean(useReducedMotion());
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredPlace, setHoveredPlace] = useState<PlaceListItem | null>(null);
  const [canHover, setCanHover] = useState(false);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const smoothX = useSpring(rawX, { stiffness: 260, damping: 28, mass: 0.45 });
  const smoothY = useSpring(rawY, { stiffness: 260, damping: 28, mass: 0.45 });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1024px) and (hover: hover) and (pointer: fine)");
    setCanHover(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setCanHover(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const handleContainerMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion || !canHover || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    // Position floating preview slightly to the right of cursor, clamped inside container width
    const targetX = Math.min(rect.width - 320, Math.max(20, e.clientX - rect.left + 28));
    const targetY = e.clientY - rect.top - 110;
    rawX.set(targetX);
    rawY.set(targetY);
  };

  const hoveredImg = hoveredPlace ? resolveImageSrc(hoveredPlace.cover_image) : null;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleContainerMove}
      onMouseLeave={() => setHoveredPlace(null)}
      className="relative rounded-[20px] bg-[#071821]/85 border border-[#E6D9B7]/22 overflow-hidden"
    >
      {/* Floating Cursor-Tracked Cinematic Preview Card (Desktop only) */}
      {canHover && !reducedMotion && (
        <AnimatePresence>
          {hoveredPlace && (
            <motion.div
              key="floating-preview"
              aria-hidden="true"
              style={{ x: smoothX, y: smoothY }}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.22 }}
              className="pointer-events-none absolute top-0 left-0 z-30 w-[300px] h-[205px] rounded-[14px] overflow-hidden border border-[#E6D9B7]/50 bg-[#081C25] shadow-[0_26px_64px_rgba(2,10,15,0.65)]"
            >
              {hoveredImg ? (
                <Image
                  src={hoveredImg}
                  alt=""
                  fill
                  unoptimized={hoveredImg.startsWith("http")}
                  sizes="300px"
                  className="object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{
                    background:
                      "radial-gradient(circle at 50% 40%, rgba(33,107,112,0.5) 0%, #071922 80%)",
                  }}
                >
                  <Compass size={26} className="text-[#E6D9B7]/70" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#051219]/90 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between gap-2 text-xs text-[#FFFDF5]">
                <span className="font-semibold truncate">{hoveredPlace.name}</span>
                <span className="inline-flex items-center gap-1 text-[#E6D9B7] shrink-0">
                  <Star size={11} className="fill-[#E87B39] text-[#E87B39]" />
                  {Number(hoveredPlace.avg_rating).toFixed(1)}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Table Header */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-6 sm:px-8 py-3.5 border-b border-[#E6D9B7]/16 text-[10px] font-mono uppercase tracking-[0.22em] text-[#E6D9B7]/65">
        <span className="col-span-1">SỐ</span>
        <span className="col-span-4">ĐỊA ĐIỂM</span>
        <span className="col-span-2">PHÂN LOẠI</span>
        <span className="col-span-3">TỌA ĐỘ / ĐỊA CHỈ</span>
        <span className="col-span-2 text-right">ĐÁNH GIÁ</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-[#E6D9B7]/12">
        {places.map((place, idx) => {
          const order = String(idx + 1).padStart(2, "0");
          const meta = typeLabel(place.place_type);
          const resolvedSrc = resolveImageSrc(place.cover_image);

          return (
            <div
              key={place.place_id}
              onMouseEnter={() => setHoveredPlace(place)}
              className="group relative flex items-center transition-colors duration-250 hover:bg-[#FFF8E9]/[0.05]"
            >
              {/* Left luminous hover accent bar */}
              <span
                aria-hidden="true"
                className="absolute left-0 inset-y-0 w-[2px] bg-[#E87B39] scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-center"
              />

              <Link
                href={`/places/${place.place_id}`}
                onClick={() =>
                  recordSharedPlaceClick(place.place_id, resolvedSrc ?? undefined)
                }
                className="flex-1 grid grid-cols-12 items-center gap-3 md:gap-4 px-5 sm:px-8 py-4 sm:py-5 outline-none"
              >
                {/* Index Number */}
                <span className="col-span-2 md:col-span-1 font-mono text-xs sm:text-sm tracking-[0.14em] text-[#E6D9B7]/60 group-hover:text-[#E87B39] transition-colors">
                  {order}
                </span>

                {/* Name */}
                <div className="col-span-10 md:col-span-4 min-w-0">
                  <p className="home-serif text-base sm:text-lg font-semibold text-[#FFFDF5] group-hover:text-[#F5E6C4] group-hover:translate-x-1 transition-all duration-300 truncate">
                    {place.name}
                  </p>
                  <p className="md:hidden text-xs text-[#CBD9DA]/75 truncate mt-0.5">
                    {place.address || "Đà Nẵng"}
                  </p>
                </div>

                {/* Type Pill */}
                <div className="hidden md:flex col-span-2 items-center">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] border border-[#E6D9B7]/20 px-3 py-1 text-[11px] font-medium text-[#E6D9B7]">
                    {meta.icon}
                    <span>{meta.label}</span>
                  </span>
                </div>

                {/* Address */}
                <div className="hidden md:flex col-span-3 items-center gap-1.5 text-xs text-[#CBD9DA]/78 min-w-0">
                  <MapPin size={13} className="text-[#C9B580] shrink-0" />
                  <span className="truncate">{place.address || "Đà Nẵng, Việt Nam"}</span>
                </div>

                {/* Rating + Arrow */}
                <div className="hidden md:flex col-span-2 items-center justify-end gap-3">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#FFFDF5]">
                    <Star size={12} className="fill-[#E87B39] text-[#E87B39]" />
                    <span>{Number(place.avg_rating).toFixed(1)}</span>
                    <span className="text-[#CBD9DA]/60 font-normal">
                      ({place.review_count})
                    </span>
                  </span>
                  <ArrowRight
                    size={15}
                    className="text-[#E6D9B7]/70 group-hover:text-[#E87B39] group-hover:translate-x-1 transition-all duration-250"
                  />
                </div>
              </Link>

              {/* Heart button kept outside Link */}
              <div className="pr-4 sm:pr-6 shrink-0 z-20">
                <HeartButton placeId={place.place_id} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
