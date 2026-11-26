"use client";

/**
 * LandmarkAtlasIndex — Tier 2 Mode B ("HỒ SƠ ĐỊA DANH TINH GỌN")
 *
 * Awwwards SOTD field-dossier rows with a spring-damped cursor-tracked
 * floating landmark photo preview card on desktop hover.
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
import { MapPin, Star, Users, ArrowUpRight } from "lucide-react";
import type { AttractionData } from "@/components/attractions/StoryCard";
import HeartButton from "@/components/HeartButton";
import { recordSharedPlaceClick } from "@/components/ui/MotionPrimitives";

const LOCAL_FALLBACK_IMG = "/images/intro/landscape/intro-coastal-panorama.jpg";

interface LandmarkAtlasIndexProps {
  items: AttractionData[];
}

export default function LandmarkAtlasIndex({ items }: LandmarkAtlasIndexProps) {
  const reducedMotion = Boolean(useReducedMotion());
  const [hovered, setHovered] = useState<AttractionData | null>(null);
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

  const hoveredImg =
    hovered && !imgFailed[hovered.id] && hovered.img
      ? hovered.img
      : LOCAL_FALLBACK_IMG;

  return (
    <div
      onMouseMove={handleMove}
      onMouseLeave={() => setHovered(null)}
      className="relative"
    >
      {/* Floating Spring-Damped Landmark Preview Card */}
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
                src={hoveredImg}
                alt={hovered.name}
                fill
                unoptimized={hoveredImg.startsWith("http")}
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
                    {hovered.category} &middot; {hovered.location}
                  </span>
                  <span className="block text-xs font-semibold text-[#FFFDF5] truncate mt-0.5">
                    {hovered.name}
                  </span>
                </div>
                <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#F6B27B] shrink-0">
                  ★ {hovered.rating}
                </span>
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* Expedition Field Index Table */}
      <div className="rounded-[20px] bg-[#071821]/82 backdrop-blur-md border border-[#E6D9B7]/22 overflow-hidden shadow-[0_24px_60px_rgba(2,10,15,0.42)]">
        <div className="hidden md:grid md:grid-cols-12 items-center gap-4 px-6 py-3.5 border-b border-[#E6D9B7]/16 bg-[#051219]/65 text-[10px] font-mono uppercase tracking-[0.22em] text-[#E6D9B7]/70">
          <span className="col-span-1">SỐ</span>
          <span className="col-span-4">ĐỊA DANH &amp; KỲ QUAN</span>
          <span className="col-span-2">PHÂN LOẠI</span>
          <span className="col-span-2">LƯỢT KHÁCH / NĂM</span>
          <span className="col-span-3 text-right">ĐÁNH GIÁ / CHI TIẾT</span>
        </div>

        <ul className="divide-y divide-[#E6D9B7]/12">
          {items.map((item, idx) => {
            const orderLabel = String(idx + 1).padStart(2, "0");
            return (
              <li
                key={item.id}
                onMouseEnter={() => setHovered(item)}
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
                      href={`/places/${item.id}`}
                      onClick={() => recordSharedPlaceClick(item.id, item.img)}
                      className="block home-serif text-base sm:text-[18px] font-semibold text-[#FFFDF5] group-hover:text-[#F5E6C4] transition-colors leading-snug line-clamp-1"
                    >
                      {item.name}
                    </Link>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-[#CBD9DA]/76">
                      <MapPin size={12} className="text-[#C9B580] shrink-0" />
                      <span className="truncate">{item.location}, Đà Nẵng</span>
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <span className="inline-flex items-center rounded-full bg-white/[0.06] border border-[#E6D9B7]/22 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#E6D9B7]">
                      {item.category}
                    </span>
                  </div>

                  <div className="md:col-span-2 flex items-center gap-1.5 text-xs font-mono text-[#7FD1C8]">
                    <Users size={12.5} className="shrink-0" />
                    <span>{item.visitors.toLocaleString("vi-VN")}</span>
                  </div>

                  <div className="md:col-span-3 flex items-center justify-between md:justify-end gap-3">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#FFFDF5]">
                      <Star
                        size={12.5}
                        className="fill-[#E87B39] text-[#E87B39]"
                      />
                      <span>{item.rating}</span>
                    </span>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <HeartButton placeId={item.placeId ?? item.id} />
                      <Link
                        href={`/places/${item.id}`}
                        onClick={() =>
                          recordSharedPlaceClick(item.id, item.img)
                        }
                        aria-label={`Xem chi tiết ${item.name}`}
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
