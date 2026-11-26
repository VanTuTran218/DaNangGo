"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Star, ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import HeartButton from "@/components/HeartButton";
import { recordSharedPlaceClick } from "@/components/ui/MotionPrimitives";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=85";

export interface HotelData {
  placeId?: number;
  id: number;
  name: string;
  category: string;
  badgeColor: string;
  badgePulse: boolean;
  location: string;
  rating: number;
  reviews: number;
  pricePerNight: number;
  originalPrice: number;
  img: string;
  amenities: string[];
  amenityIcon: string;
  tags: string[];
  isLiked: boolean;
}

interface HotelCardProps {
  hotel: HotelData;
  index?: number;
}

export default function HotelCard({ hotel, index }: HotelCardProps) {
  const reducedMotion = Boolean(useReducedMotion());
  const [imgError, setImgError] = useState(false);
  const cardRef = useRef<HTMLElement>(null);
  const rafRef = useRef<number | null>(null);

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

  const imgSrc = imgError || !hotel.img ? FALLBACK_IMAGE : hotel.img;
  const discountPct =
    hotel.originalPrice > hotel.pricePerNight
      ? Math.round(
          ((hotel.originalPrice - hotel.pricePerNight) / hotel.originalPrice) *
            100
        )
      : 0;
  const orderLabel =
    typeof index === "number" ? String(index + 1).padStart(2, "0") : null;

  return (
    <motion.div
      layout="position"
      transition={{ duration: 0.25 }}
      className="h-full"
    >
      <article
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={resetCardTilt}
        onMouseDown={handleMouseDown}
        className="event-ticket-card luxury-border-sweep group relative rounded-[18px] overflow-hidden bg-[#081C25] border border-[#E6D9B7]/24 shadow-[0_18px_46px_rgba(2,10,15,0.44)] min-h-[430px] flex flex-col h-full"
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

        {/* HeartButton positioned above link so favorites toggle cleanly */}
        <div className="absolute top-3.5 right-3.5 z-30">
          <HeartButton placeId={hotel.placeId ?? hotel.id} />
        </div>

        <Link
          href={`/places/${hotel.id}`}
          onClick={() => recordSharedPlaceClick(hotel.id, imgSrc)}
          className="relative flex flex-col flex-1 h-full luxury-shimmer-frame"
        >
          {/* Full-Bleed Suite Photography Layer */}
          <div className="absolute inset-0 overflow-hidden bg-[#051219]">
            <div className="event-ticket-media absolute inset-0">
              <Image
                src={imgSrc}
                alt={hotel.name}
                fill
                unoptimized={imgSrc.startsWith("http")}
                onError={() => setImgError(true)}
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>

            {/* Velvety Deep-Ocean Multi-Stop Editorial Vignette */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(6,21,28,0.52) 0%, rgba(6,21,28,0.08) 28%, rgba(6,21,28,0.22) 45%, rgba(6,21,28,0.82) 68%, rgba(5,18,25,0.95) 85%, #051219 100%)",
              }}
            />
          </div>

          {/* Top Bar: Category & Discount Pill */}
          <div className="relative z-10 pt-3.5 px-3.5 pr-16 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center rounded-full bg-[#06151C]/78 backdrop-blur-md border border-[#E6D9B7]/32 text-[#FFFDF5] text-[10px] font-semibold uppercase tracking-[0.12em] px-3 py-1.5">
              {hotel.category}
            </span>
            {discountPct > 0 && (
              <span className="inline-flex items-center rounded-full bg-[#E87B39]/90 border border-[#F6C89F]/45 text-[#FFFDF5] text-[10px] font-bold uppercase tracking-[0.1em] px-2.5 py-1.5">
                -{discountPct}%
              </span>
            )}
          </div>

          {/* Bottom Editorial Suite Dossier */}
          <div className="relative z-10 mt-auto p-5 flex flex-col justify-end transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-0.5">
            {/* Amenity micro-pills + ORYZO number */}
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                {hotel.amenities.slice(0, 2).map((a) => (
                  <span
                    key={a}
                    className="rounded-full bg-[#06151C]/72 backdrop-blur-xs border border-[#E6D9B7]/22 text-[#DCE8E8] text-[10px] px-2.5 py-0.5 font-medium truncate max-w-[130px]"
                  >
                    {a}
                  </span>
                ))}
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

            {/* Hotel Serif Name */}
            <h3
              style={{ textShadow: "0 2px 14px rgba(3,12,17,0.72)" }}
              className="home-serif font-semibold text-[#FFFDF5] group-hover:text-[#F5E6C4] transition-colors text-[20px] leading-[1.28] line-clamp-2 mb-1.5"
            >
              {hotel.name}
            </h3>

            {/* Location & Rating */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#CBD9DA]/85 mb-4">
              <span className="inline-flex items-center gap-1.5 min-w-0">
                <MapPin size={12.5} className="text-[#C9B580] shrink-0" />
                <span className="truncate">{hotel.location}</span>
              </span>
              <span className="inline-flex items-center gap-1 shrink-0">
                <Star size={12} className="fill-[#E87B39] text-[#E87B39]" />
                <strong className="text-[#FFFDF5]">{hotel.rating}</strong>
                <span className="text-[#CBD9DA]/65">
                  ({hotel.reviews.toLocaleString("vi-VN")})
                </span>
              </span>
            </div>

            {/* Kinetic Champagne -> Sunset Divider Sweep */}
            <div className="relative w-full h-[1px] bg-[#E6D9B7]/22 overflow-hidden mb-3.5">
              <span
                aria-hidden="true"
                className="absolute inset-0 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-550 ease-[cubic-bezier(0.22,1,0.36,1)] bg-gradient-to-r from-[#E87B39] via-[#E6D9B7] to-transparent"
              />
            </div>

            {/* Nightly Rate & Kinetic CTA */}
            <div className="flex items-end justify-between gap-2">
              <div className="min-w-0">
                {hotel.originalPrice > hotel.pricePerNight && (
                  <p className="text-[11px] text-[#CBD9DA]/50 line-through leading-none mb-0.5">
                    {hotel.originalPrice.toLocaleString("vi-VN")}đ
                  </p>
                )}
                <p className="stat-number text-[#7FD1C8] font-bold text-base leading-tight truncate">
                  {hotel.pricePerNight.toLocaleString("vi-VN")}đ
                  <span className="text-[11px] font-normal text-[#CBD9DA]/72">
                    /đêm
                  </span>
                </p>
              </div>

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
    </motion.div>
  );
}
