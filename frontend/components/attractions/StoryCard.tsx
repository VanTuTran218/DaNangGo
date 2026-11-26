"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Star, Users, ArrowRight } from "lucide-react";
import HeartButton from "@/components/HeartButton";
import { recordSharedPlaceClick } from "@/components/ui/MotionPrimitives";

const LOCAL_FALLBACK_IMG = "/images/intro/landscape/intro-coastal-panorama.jpg";

export interface AttractionData {
  id: number;
  placeId?: number;
  name: string;
  category: string;
  location: string;
  rating: number;
  visitors: number;
  img: string;
  shortDesc: string;
  longDesc: string;
  badgeTint: "blue" | "green" | "amber" | "pink" | "purple";
}

interface Props {
  data: AttractionData;
  liked: boolean;
  onLike: () => void;
  index?: number;
}

export default function StoryCard({ data, index }: Props) {
  const reducedMotion = Boolean(useReducedMotion());
  const [isHovered, setIsHovered] = useState(false);
  const [imgSrc, setImgSrc] = useState(data.img || LOCAL_FALLBACK_IMG);
  const cardRef = useRef<HTMLElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    setImgSrc(data.img || LOCAL_FALLBACK_IMG);
  }, [data.img]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (reducedMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    const rx = (0.5 - ny) * 4.5;
    const ry = (nx - 0.5) * 4.5;
    const px = (0.5 - nx) * 8;
    const py = (0.5 - ny) * 6;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const el = cardRef.current;
      if (!el) return;
      el.classList.add("is-tilting");
      el.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
      el.style.setProperty("--ry", `${ry.toFixed(2)}deg`);
      el.style.setProperty("--px", `${px.toFixed(1)}px`);
      el.style.setProperty("--py", `${py.toFixed(1)}px`);
      el.style.setProperty("--mx", `${mx.toFixed(1)}px`);
      el.style.setProperty("--my", `${my.toFixed(1)}px`);
      el.style.setProperty("--spot-opacity", "1");
      rafRef.current = null;
    });
  };

  const resetCardTilt = () => {
    setIsHovered(false);
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const el = cardRef.current;
    if (!el) return;
    el.classList.remove("is-tilting");
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--px", "0px");
    el.style.setProperty("--py", "0px");
    el.style.setProperty("--spot-opacity", "0");
  };

  const handleMouseDown = () => {
    if (!cardRef.current) return;
    cardRef.current.style.setProperty("--spot-opacity", "0");
  };

  const orderLabel =
    typeof index === "number" ? String(index + 1).padStart(2, "0") : null;

  return (
    <article
      ref={cardRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={resetCardTilt}
      onMouseDown={handleMouseDown}
      className="event-ticket-card luxury-border-sweep group relative rounded-[18px] overflow-hidden bg-[#081C25] border border-[#E6D9B7]/24 shadow-[0_18px_46px_rgba(2,10,15,0.44)] min-h-[445px] flex flex-col h-full"
    >
      {/* Whisper-soft Champagne spotlight (zero glare on click) */}
      <div
        aria-hidden="true"
        className="event-ticket-spotlight pointer-events-none absolute inset-0 z-20 rounded-[inherit]"
      />

      {/* 4 Subtle Leica Corner Viewfinder Brackets */}
      <span
        aria-hidden="true"
        className="explore-corner-bracket pointer-events-none absolute top-3 left-3 z-30 w-3 h-3 border-t border-l border-[#E6D9B7]/75 rounded-tl-[2px]"
      />
      <span
        aria-hidden="true"
        className="explore-corner-bracket pointer-events-none absolute top-3 right-3 z-30 w-3 h-3 border-t border-r border-[#E6D9B7]/75 rounded-tr-[2px]"
      />
      <span
        aria-hidden="true"
        className="explore-corner-bracket pointer-events-none absolute bottom-3 left-3 z-30 w-3 h-3 border-b border-l border-[#E6D9B7]/75 rounded-bl-[2px]"
      />
      <span
        aria-hidden="true"
        className="explore-corner-bracket pointer-events-none absolute bottom-3 right-3 z-30 w-3 h-3 border-b border-r border-[#E6D9B7]/75 rounded-br-[2px]"
      />

      {/* HeartButton outside Link layer */}
      <div className="absolute top-3.5 right-3.5 z-30">
        <HeartButton placeId={data.placeId ?? data.id} />
      </div>

      <Link
        href={`/places/${data.id}`}
        onClick={() => recordSharedPlaceClick(data.id, imgSrc)}
        className="relative flex flex-col flex-1 h-full luxury-shimmer-frame"
      >
        {/* Full-Bleed Landmark Photography */}
        <div className="absolute inset-0 overflow-hidden bg-[#051219]">
          <div className="event-ticket-media absolute inset-0">
            <Image
              src={imgSrc}
              alt={data.name}
              fill
              unoptimized={imgSrc.startsWith("http")}
              onError={() => {
                if (imgSrc !== LOCAL_FALLBACK_IMG) {
                  setImgSrc(LOCAL_FALLBACK_IMG);
                }
              }}
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>

          {/* Velvety Deep-Ocean Editorial Vignette */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(6,21,28,0.52) 0%, rgba(6,21,28,0.08) 26%, rgba(6,21,28,0.28) 44%, rgba(6,21,28,0.84) 66%, rgba(5,18,25,0.96) 84%, #051219 100%)",
            }}
          />
        </div>

        {/* Top Category Badge */}
        <div className="relative z-10 pt-3.5 px-3.5 pr-16 flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-[#06151C]/78 backdrop-blur-md border border-[#E6D9B7]/32 text-[#FFFDF5] text-[10px] font-semibold uppercase tracking-[0.12em] px-3 py-1.5">
            {data.category}
          </span>
        </div>

        {/* Bottom Editorial Story Overlay */}
        <div className="relative z-10 mt-auto p-5 flex flex-col justify-end transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-0.5">
          {/* Location + Rating + ORYZO Order Number */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2.5 text-[11px] text-[#E6D9B7] min-w-0">
              <span className="inline-flex items-center gap-1 truncate">
                <MapPin size={12} className="text-[#C9B580] shrink-0" />
                <span className="truncate">{data.location}</span>
              </span>
              <span className="inline-flex items-center gap-1 shrink-0 text-[#FFFDF5] font-semibold">
                <Star size={11.5} className="fill-[#E87B39] text-[#E87B39]" />
                {data.rating}
              </span>
            </div>

            {orderLabel && (
              <div
                aria-hidden="true"
                className="flex items-center gap-1.5 select-none shrink-0"
              >
                <span className="w-3.5 h-[1px] bg-[#E6D9B7]/60 transition-all duration-400 group-hover:w-6 group-hover:bg-[#E87B39]" />
                <span className="oryzo-card-number text-[15px] tracking-[0.14em] leading-none">
                  {orderLabel}
                </span>
              </div>
            )}
          </div>

          {/* Serif Landmark Name */}
          <h3
            style={{ textShadow: "0 2px 14px rgba(3,12,17,0.72)" }}
            className="home-serif font-semibold text-[#FFFDF5] group-hover:text-[#F5E6C4] transition-colors text-[20px] leading-[1.28] line-clamp-2 mb-2"
          >
            {data.name}
          </h3>

          {/* Interactive Story Crossfade (shortDesc -> longDesc on hover) */}
          <div className="relative h-[58px] overflow-hidden mb-3.5">
            <motion.p
              className="text-[#CBD9DA]/82 text-xs leading-relaxed line-clamp-3 absolute top-0 left-0 w-full"
              initial={false}
              animate={
                reducedMotion
                  ? { opacity: 1, y: 0 }
                  : { opacity: isHovered ? 0 : 1, y: isHovered ? -12 : 0 }
              }
              transition={{ duration: 0.28 }}
            >
              {data.shortDesc}
            </motion.p>
            {!reducedMotion && (
              <motion.p
                className="text-[#FFFDF5]/92 text-xs leading-relaxed line-clamp-3 absolute top-0 left-0 w-full"
                initial={false}
                animate={{
                  opacity: isHovered ? 1 : 0,
                  y: isHovered ? 0 : 12,
                }}
                transition={{ duration: 0.28 }}
              >
                {data.longDesc}
              </motion.p>
            )}
          </div>

          {/* Kinetic Champagne -> Sunset Divider Sweep */}
          <div className="relative w-full h-[1px] bg-[#E6D9B7]/22 overflow-hidden mb-3.5">
            <span
              aria-hidden="true"
              className="absolute inset-0 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-550 ease-[cubic-bezier(0.22,1,0.36,1)] bg-gradient-to-r from-[#E87B39] via-[#E6D9B7] to-transparent"
            />
          </div>

          {/* Footer: Visitors + Kinetic CTA */}
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-[#7FD1C8] truncate">
              <Users size={13} className="shrink-0" />
              <span className="truncate">
                {data.visitors.toLocaleString("vi-VN")} lượt/năm
              </span>
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF8E9] group-hover:bg-white text-[#102832] text-[11px] font-semibold uppercase tracking-[0.12em] px-3.5 py-2 transition-colors shrink-0">
              <span>Chi tiết</span>
              <span className="relative inline-flex w-3.5 h-3.5 items-center justify-center overflow-hidden">
                <ArrowRight
                  size={12.5}
                  aria-hidden="true"
                  className="explore-arrow-out absolute text-[#0F4C5C]"
                />
                <ArrowRight
                  size={12.5}
                  aria-hidden="true"
                  className="explore-arrow-in absolute text-[#CB712D]"
                />
              </span>
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
