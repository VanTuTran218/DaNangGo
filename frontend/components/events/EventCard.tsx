"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import {
  Calendar,
  MapPin,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Clock,
  BellRing,
  Check,
} from "lucide-react";
import {
  EVENT_TYPES,
  STATUS_LABELS,
  TICKET_TYPES,
  type Event,
} from "@/types/event";
import {
  formatEventCardDate,
  isMultiDayEvent,
  isEventBookmarkedForReminder,
  toggleLocalEventReminder,
} from "@/lib/api/events";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1200&q=85&auto=format&fit=crop";

const STATUS_BADGE_STYLES: Record<string, string> = {
  RESCHEDULED: "bg-amber-500/90 border-amber-300/60 text-white",
  POSTPONED: "bg-orange-600/90 border-orange-300/60 text-white",
  CANCELLED: "bg-red-600/90 border-red-300/60 text-white",
};

export interface EventCardProps {
  event: Event;
  priority?: boolean;
  index?: number;
}

export default function EventCard({
  event,
  priority = false,
  index,
}: EventCardProps) {
  const reducedMotion = Boolean(useReducedMotion());
  const [imgError, setImgError] = useState(false);
  const [reminded, setReminded] = useState(false);

  const cardRef = useRef<HTMLElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    setReminded(isEventBookmarkedForReminder(event));
    const sync = () => setReminded(isEventBookmarkedForReminder(event));
    window.addEventListener("dananggo:event-reminders-changed", sync);
    return () =>
      window.removeEventListener("dananggo:event-reminders-changed", sync);
  }, [event]);

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

  const detailHref = `/su-kien/${encodeURIComponent(
    event.slug || event.id || ""
  )}`;
  const categoryLabel =
    EVENT_TYPES[event.eventType as keyof typeof EVENT_TYPES] ||
    event.eventType ||
    "Sự kiện";

  const multiDay = isMultiDayEvent(event);
  const hasSpecialStatus =
    event.status === "RESCHEDULED" ||
    event.status === "POSTPONED" ||
    event.status === "CANCELLED";

  const ticketHeadline =
    event.ticketType === "PAID"
      ? event.ticketPriceDisplay || "Có phí"
      : event.ticketType === "FREE_REGISTRATION"
        ? "Miễn phí"
        : event.ticketType === "FREE_OPEN"
          ? "Miễn phí"
          : TICKET_TYPES[event.ticketType] || "Đang cập nhật";

  const ticketSubnote =
    event.ticketType === "PAID"
      ? "/vé tham dự"
      : event.ticketType === "FREE_REGISTRATION"
        ? "Cần đăng ký trước"
        : event.ticketType === "FREE_OPEN"
          ? "Vào cửa tự do"
          : "";

  const isFree =
    event.ticketType === "FREE_OPEN" ||
    event.ticketType === "FREE_REGISTRATION";

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
        className="event-ticket-card luxury-border-sweep group relative rounded-[18px] overflow-hidden bg-gradient-to-b from-[#0A202B] via-[#081A23] to-[#06151C] border border-[#E6D9B7]/22 shadow-[0_18px_46px_rgba(2,10,15,0.42)] flex flex-col h-full"
      >
        {/* Whisper-soft Champagne cursor spotlight (zero glare on click) */}
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

        {/* ── UPPER POSTER STAGE ── */}
        <Link
          href={detailHref}
          className="block relative h-56 overflow-hidden shrink-0 bg-[#051219] luxury-shimmer-frame"
        >
          <div className="event-ticket-media absolute inset-0">
            <Image
              src={imgError || !event.imageUrl ? FALLBACK_IMAGE : event.imageUrl}
              alt={event.name}
              fill
              priority={priority}
              unoptimized
              onError={() => setImgError(true)}
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>

          {/* Seamless Deep-Ocean Editorial Vignette melting into card body */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(6,21,28,0.52) 0%, rgba(6,21,28,0.08) 38%, rgba(8,26,35,0.68) 78%, #0A202B 100%)",
            }}
          />

          {/* Top-Left Status / Category Badge */}
          <div className="absolute top-3.5 left-3.5 flex flex-wrap items-center gap-1.5 max-w-[78%] z-10">
            {hasSpecialStatus ? (
              <span
                className={`inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-[0.08em] px-2.5 py-1 rounded-full border backdrop-blur-md shadow-xs ${
                  STATUS_BADGE_STYLES[event.status] ||
                  "bg-slate-700/90 border-white/20 text-white"
                }`}
              >
                <AlertTriangle className="w-3 h-3 shrink-0" />
                {STATUS_LABELS[event.status]}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-[#06151C]/78 backdrop-blur-md text-[#FFFDF5] border border-[#E6D9B7]/32 text-[10.5px] font-semibold uppercase tracking-[0.1em] px-3 py-1 rounded-full">
                {event.isFeatured && (
                  <Sparkles className="w-3 h-3 text-[#E87B39] shrink-0" />
                )}
                {event.isFeatured ? `Nổi bật · ${categoryLabel}` : categoryLabel}
              </span>
            )}
          </div>

          {/* Top-Right Multi-Day Badge */}
          {multiDay && (
            <div className="absolute top-3.5 right-3.5 z-10">
              <span className="inline-flex items-center gap-1 bg-[#06151C]/78 backdrop-blur-md text-[#E2ECEC] text-[10px] font-medium px-2.5 py-1 rounded-full border border-white/20">
                <Clock className="w-3 h-3 text-[#69A5A3] shrink-0" />
                Nhiều ngày
              </span>
            </div>
          )}

          {/* Bottom Date Chip + ORYZO Hollow->Solid Number */}
          <div className="absolute bottom-3 left-3.5 right-3.5 z-10 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-3 py-1 rounded-full backdrop-blur-md bg-[#06151C]/82 text-[#FFFDF5] border border-[#E6D9B7]/28 truncate">
              <Calendar className="w-3 h-3 text-[#E87B39] shrink-0" />
              <span className="truncate">
                {formatEventCardDate(
                  event.startAt,
                  event.endAt,
                  event.isAllDay
                )}
              </span>
            </span>

            {orderLabel && (
              <span
                aria-hidden="true"
                className="oryzo-card-number text-[15px] tracking-[0.14em] leading-none select-none shrink-0"
              >
                {orderLabel}
              </span>
            )}
          </div>
        </Link>

        {/* ── MIDDLE DOSSIER BODY ── */}
        <div className="relative z-10 px-5 pt-3.5 pb-4 flex flex-col flex-1">
          {/* Category + District */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 text-[10.5px] font-mono font-semibold uppercase tracking-[0.16em] text-[#E6D9B7]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E87B39]" />
              {categoryLabel}
            </span>
            {event.district && (
              <span className="text-[11px] text-[#CBD9DA]/72 font-medium truncate">
                {event.district}, Đà Nẵng
              </span>
            )}
          </div>

          <Link href={detailHref} className="block">
            <h3 className="home-serif font-semibold text-[#FFFDF5] group-hover:text-[#F5E6C4] transition-colors text-[18px] leading-[1.3] line-clamp-2 mb-2">
              {event.name}
            </h3>
          </Link>

          {/* Venue */}
          <div className="flex items-center gap-1.5 text-xs text-[#CBD9DA]/82 mb-2.5">
            <MapPin size={13} className="text-[#C9B580] shrink-0" />
            <span className="truncate">
              {event.locationName || event.address || "Đà Nẵng"}
            </span>
          </div>

          {/* Short description */}
          <p className="text-xs text-[#BFD1D3]/76 line-clamp-2 leading-relaxed mb-3">
            {event.shortDescription}
          </p>

          {/* Rescheduled / Postponed / Cancelled Callout */}
          {hasSpecialStatus && event.changeNote && (
            <div
              className={`mt-auto rounded-[10px] px-3 py-2 text-[11px] leading-snug border ${
                event.status === "CANCELLED"
                  ? "bg-red-500/14 border-red-400/35 text-red-100"
                  : "bg-amber-500/14 border-amber-300/35 text-amber-100"
              }`}
            >
              <p className="font-medium line-clamp-2">{event.changeNote}</p>
            </div>
          )}
        </div>

        {/* ── PERFORATED TICKET STUB TEAR LINE WITH SIDE NOTCHES ── */}
        <div
          aria-hidden="true"
          className="relative z-10 flex items-center px-5"
        >
          <span className="absolute -left-2.5 w-5 h-5 rounded-full bg-[#06151C] border border-[#E6D9B7]/22" />
          <div className="w-full border-t border-dashed border-[#E6D9B7]/24" />
          <span className="absolute -right-2.5 w-5 h-5 rounded-full bg-[#06151C] border border-[#E6D9B7]/22" />
        </div>

        {/* ── TICKET STUB FOOTER: PRICE + REMINDER + KINETIC CTA ── */}
        <div className="relative z-10 px-5 py-3.5 bg-[#051219]/55 flex items-center justify-between gap-2.5">
          <div className="min-w-0">
            <p
              className={`font-semibold text-[13.5px] leading-tight truncate ${
                isFree ? "text-[#7FD1C8]" : "text-[#F6B27B]"
              }`}
            >
              {ticketHeadline}
            </p>
            {ticketSubnote && (
              <p className="text-[10.5px] text-[#CBD9DA]/65 truncate mt-0.5">
                {ticketSubnote}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {event.status !== "CANCELLED" && event.status !== "POSTPONED" && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setReminded(toggleLocalEventReminder(event));
                }}
                title={
                  reminded
                    ? "Đã bật thông báo khi sự kiện sắp diễn ra (Bấm để tắt)"
                    : "Nhắc tôi khi sự kiện sắp diễn ra"
                }
                aria-label="Nhắc tôi khi sự kiện sắp diễn ra"
                className={`inline-flex items-center justify-center w-8 h-8 rounded-full border transition-all cursor-pointer ${
                  reminded
                    ? "bg-[#216B70]/45 border-[#69A5A3]/75 text-[#FFFDF5]"
                    : "bg-white/[0.05] hover:bg-white/[0.12] border-[#E6D9B7]/24 text-[#CBD9DA] hover:text-[#FFFDF5] hover:border-[#E6D9B7]/55"
                }`}
              >
                {reminded ? (
                  <Check size={13.5} className="text-[#7FD1C8]" />
                ) : (
                  <BellRing size={13.5} />
                )}
              </button>
            )}

            <Link
              href={detailHref}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF8E9] hover:bg-white text-[#102832] text-[11px] font-semibold uppercase tracking-[0.12em] px-3.5 py-2 transition-colors shrink-0"
            >
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
            </Link>
          </div>
        </div>
      </article>
    </motion.div>
  );
}
