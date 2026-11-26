"use client";

/**
 * HotelIndexList — Tier 3 Mode B ("DANH MỤC LƯU TRÚ TINH GỌN")
 *
 * Awwwards SOTD hospitality concierge directory rows with a spring-damped
 * cursor-tracked floating suite preview card on desktop hover.
 */

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from "framer-motion";
import { MapPin, Star, ArrowUpRight } from "lucide-react";
import type { HotelData } from "@/components/places/HotelCard";
import HeartButton from "@/components/HeartButton";
import { recordSharedPlaceClick } from "@/components/ui/MotionPrimitives";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=900&q=85";

interface HotelIndexListProps {
  hotels: HotelData[];
  startIndex?: number;
}

export default function HotelIndexList({
  hotels,
  startIndex = 0,
}: HotelIndexListProps) {
  const reducedMotion = Boolean(useReducedMotion());
  const [hovered, setHovered] = useState<HotelData | null>(null);
  const [imgFailed, setImgFailed] = useState<Record<number, boolean>>({});

  const rawX = useMotionValue(-400);
  const rawY = useMotionValue(-400);
  const smoothX = useSpring(rawX, { stiffness: 260, damping: 28, mass: 0.45 });
  const smoothY = useSpring(rawY, { stiffness: 260, damping: 28, mass: 0.45 });

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion) return;
    const cardW = 272;
    const cardH = 180;
    const vw = typeof window !== "undefined" ? window.innerWidth : 1440;
    const vh = typeof window !== "undefined" ? window.innerHeight : 900;
    const targetX =
      e.clientX + 28 + cardW > vw ? e.clientX - cardW - 24 : e.clientX + 28;
    const targetY = Math.max(
      90,
      Math.min(vh - cardH - 24, e.clientY - cardH / 2)
    );
    rawX.set(targetX);
    rawY.set(targetY);
  };

  return (
    <div
      onMouseMove={handleMove}
      onMouseLeave={() => setHovered(null)}
      className="relative"
    >
      {/* Floating Spring-Damped Suite Preview Card (Desktop Only) */}
      {!reducedMotion && (
        <motion.div
          aria-hidden="true"
          style={{
            x: smoothX,
            y: smoothY,
            opacity: hovered ? 1 : 0,
            scale: hovered ? 1 : 0.94,
          }}
          transition={{ duration: 0.22 }}
          className="hidden lg:block pointer-events-none fixed top-0 left-0 z-50 w-[272px] h-[180px] rounded-[16px] overflow-hidden border border-[#E6D9B7]/45 bg-[#071821] shadow-[0_28px_64px_rgba(2,10,15,0.68)]"
        >
          {hovered && (
            <>
              <Image
                src={
                  imgFailed[hovered.id] || !hovered.img
                    ? FALLBACK_IMAGE
                    : hovered.img
                }
                alt={hovered.name}
                fill
                unoptimized={hovered.img.startsWith("http")}
                onError={() =>
                  setImgFailed((m) => ({ ...m, [hovered.id]: true }))
                }
                sizes="272px"
                className="object-cover"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(6,21,28,0.12) 0%, rgba(6,21,28,0.88) 100%)",
                }}
              />
              <div className="absolute bottom-3 left-3.5 right-3.5 flex items-end justify-between gap-2">
                <div className="min-w-0">
                  <span className="block text-[9.5px] font-mono uppercase tracking-[0.16em] text-[#E6D9B7] truncate">
                    {hovered.category}
                  </span>
                  <span className="block text-xs font-semibold text-[#FFFDF5] truncate mt-0.5">
                    {hovered.name}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#F6B27B] shrink-0">
                  ★ {hovered.rating}
                </span>
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* Minimal Hospitality Studio Rows */}
      <div className="rounded-[20px] bg-[#071821]/82 backdrop-blur-md border border-[#E6D9B7]/22 overflow-hidden shadow-[0_24px_60px_rgba(2,10,15,0.42)]">
        <div className="hidden md:grid md:grid-cols-12 items-center gap-4 px-6 py-3.5 border-b border-[#E6D9B7]/16 bg-[#051219]/65 text-[10px] font-mono uppercase tracking-[0.22em] text-[#E6D9B7]/70">
          <span className="col-span-1">SỐ</span>
          <span className="col-span-4">KHU NGHỈ &amp; KHÁCH SẠN</span>
          <span className="col-span-2">PHÂN HẠNG</span>
          <span className="col-span-2">ĐÁNH GIÁ</span>
          <span className="col-span-3 text-right">GIÁ / ĐÊM</span>
        </div>

        <ul className="divide-y divide-[#E6D9B7]/12">
          {hotels.map((hotel, idx) => {
            const orderLabel = String(startIndex + idx + 1).padStart(2, "0");
            return (
              <li
                key={`${hotel.id}-${hotel.name}`}
                onMouseEnter={() => setHovered(hotel)}
                className="group relative transition-colors duration-200 hover:bg-white/[0.045]"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-0 top-0 bottom-0 w-[2.5px] bg-[#E87B39] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                />

                <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-3 md:gap-4 px-5 sm:px-6 py-4 sm:py-5">
                  <div className="md:col-span-1">
                    <span className="font-mono text-xs text-[#E6D9B7]/55 group-hover:text-[#E87B39] transition-colors">
                      {orderLabel}
                    </span>
                  </div>

                  <div className="md:col-span-4 min-w-0">
                    <Link
                      href={`/places/${hotel.id}`}
                      onClick={() => recordSharedPlaceClick(hotel.id, hotel.img)}
                      className="block home-serif text-base sm:text-[18px] font-semibold text-[#FFFDF5] group-hover:text-[#F5E6C4] transition-colors leading-snug line-clamp-1"
                    >
                      {hotel.name}
                    </Link>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-[#CBD9DA]/76">
                      <MapPin size={12} className="text-[#C9B580] shrink-0" />
                      <span className="truncate">{hotel.location}</span>
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <span className="inline-flex items-center rounded-full bg-white/[0.06] border border-[#E6D9B7]/22 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#E6D9B7]">
                      {hotel.category}
                    </span>
                  </div>

                  <div className="md:col-span-2 flex items-center gap-1.5 text-xs">
                    <Star
                      size={12.5}
                      className="fill-[#E87B39] text-[#E87B39] shrink-0"
                    />
                    <span className="font-semibold text-[#FFFDF5]">
                      {hotel.rating}
                    </span>
                    <span className="text-[#CBD9DA]/65">
                      ({hotel.reviews.toLocaleString("vi-VN")})
                    </span>
                  </div>

                  <div className="md:col-span-3 flex items-center justify-between md:justify-end gap-3">
                    <div className="text-left md:text-right">
                      {hotel.originalPrice > hotel.pricePerNight && (
                        <span className="block text-[11px] text-[#CBD9DA]/50 line-through">
                          {hotel.originalPrice.toLocaleString("vi-VN")}đ
                        </span>
                      )}
                      <span className="stat-number text-sm sm:text-[15px] font-bold text-[#7FD1C8]">
                        {hotel.pricePerNight.toLocaleString("vi-VN")}đ
                        <span className="text-[11px] font-normal text-[#CBD9DA]/68">
                          /đêm
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <HeartButton placeId={hotel.placeId ?? hotel.id} />
                      <Link
                        href={`/places/${hotel.id}`}
                        onClick={() =>
                          recordSharedPlaceClick(hotel.id, hotel.img)
                        }
                        aria-label={`Xem chi tiết ${hotel.name}`}
                        className="w-8 h-8 rounded-full bg-white/[0.06] group-hover:bg-[#FFF8E9] border border-[#E6D9B7]/25 group-hover:border-[#FFF8E9] text-[#E6D9B7] group-hover:text-[#102832] inline-flex items-center justify-center transition-all"
                      >
                        <ArrowUpRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
