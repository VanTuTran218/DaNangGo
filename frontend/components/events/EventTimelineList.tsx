"use client";

/**
 * EventTimelineList — Tier 2 Mode B ("LỊCH TRÌNH THEO DÒNG THỜI GIAN")
 *
 * Awwwards SOTD chronological festival program rows with a spring-damped
 * cursor-tracked floating poster preview card on desktop hover.
 */

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from "framer-motion";
import {
  Calendar,
  MapPin,
  ArrowUpRight,
  BellRing,
  Check,
  AlertTriangle,
} from "lucide-react";
import {
  EVENT_TYPES,
  STATUS_LABELS,
  TICKET_TYPES,
  type Event,
} from "@/types/event";
import {
  formatEventCardDate,
  isEventBookmarkedForReminder,
  toggleLocalEventReminder,
} from "@/lib/api/events";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1200&q=85&auto=format&fit=crop";

interface EventTimelineListProps {
  events: Event[];
  startIndex?: number;
}

function formatDayPill(iso: string) {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return { weekday: "LỊCH", dayMonth: "--/--" };
  const date = new Date(ms);
  const weekday = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    weekday: "short",
  })
    .format(date)
    .toUpperCase();
  const dayMonth = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
  }).format(date);
  return { weekday, dayMonth };
}

export default function EventTimelineList({
  events,
  startIndex = 0,
}: EventTimelineListProps) {
  const reducedMotion = Boolean(useReducedMotion());
  const [hoveredEvent, setHoveredEvent] = useState<Event | null>(null);
  const [imgFailed, setImgFailed] = useState<Record<string, boolean>>({});
  const [remindedMap, setRemindedMap] = useState<Record<string, boolean>>({});

  const rawX = useMotionValue(-400);
  const rawY = useMotionValue(-400);
  const smoothX = useSpring(rawX, { stiffness: 260, damping: 28, mass: 0.45 });
  const smoothY = useSpring(rawY, { stiffness: 260, damping: 28, mass: 0.45 });

  useEffect(() => {
    const sync = () => {
      const next: Record<string, boolean> = {};
      for (const ev of events) {
        const key = String(ev.slug || ev.id || "");
        if (key) next[key] = isEventBookmarkedForReminder(ev);
      }
      setRemindedMap(next);
    };
    sync();
    window.addEventListener("dananggo:event-reminders-changed", sync);
    return () => window.removeEventListener("dananggo:event-reminders-changed", sync);
  }, [events]);

  const handleContainerMove = (e: React.MouseEvent<HTMLDivElement>) => {
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

  const hoveredKey = hoveredEvent
    ? String(hoveredEvent.slug || hoveredEvent.id || "")
    : "";

  return (
    <div
      onMouseMove={handleContainerMove}
      onMouseLeave={() => setHoveredEvent(null)}
      className="relative"
    >
      {/* Floating Spring-Damped Poster Preview (Desktop Only) */}
      {!reducedMotion && (
        <motion.div
          aria-hidden="true"
          style={{
            x: smoothX,
            y: smoothY,
            opacity: hoveredEvent ? 1 : 0,
            scale: hoveredEvent ? 1 : 0.94,
          }}
          transition={{ duration: 0.22 }}
          className="hidden lg:block pointer-events-none fixed top-0 left-0 z-50 w-[272px] h-[180px] rounded-[16px] overflow-hidden border border-[#E6D9B7]/45 bg-[#071821] shadow-[0_28px_64px_rgba(2,10,15,0.68)]"
        >
          {hoveredEvent && (
            <>
              <Image
                src={
                  imgFailed[hoveredKey] || !hoveredEvent.imageUrl
                    ? FALLBACK_IMAGE
                    : hoveredEvent.imageUrl
                }
                alt={hoveredEvent.name}
                fill
                unoptimized
                onError={() =>
                  setImgFailed((m) => ({ ...m, [hoveredKey]: true }))
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
                    {formatEventCardDate(
                      hoveredEvent.startAt,
                      hoveredEvent.endAt,
                      hoveredEvent.isAllDay
                    )}
                  </span>
                  <span className="block text-xs font-semibold text-[#FFFDF5] truncate mt-0.5">
                    {hoveredEvent.name}
                  </span>
                </div>
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* Chronological Studio Index Table */}
      <div className="rounded-[20px] bg-[#071821]/82 backdrop-blur-md border border-[#E6D9B7]/22 overflow-hidden shadow-[0_24px_60px_rgba(2,10,15,0.42)]">
        {/* Column Header */}
        <div className="hidden md:grid md:grid-cols-12 items-center gap-4 px-6 py-3.5 border-b border-[#E6D9B7]/16 bg-[#051219]/65 text-[10px] font-mono uppercase tracking-[0.22em] text-[#E6D9B7]/70">
          <span className="col-span-2">NGÀY / GIỜ</span>
          <span className="col-span-4">SỰ KIỆN &amp; CHƯƠNG TRÌNH</span>
          <span className="col-span-2">PHÂN LOẠI</span>
          <span className="col-span-2">ĐỊA ĐIỂM</span>
          <span className="col-span-2 text-right">VÉ / NHẮC LỊCH</span>
        </div>

        <ul className="divide-y divide-[#E6D9B7]/12">
          {events.map((event, idx) => {
            const key = String(event.slug || event.id || idx);
            const detailHref = `/su-kien/${encodeURIComponent(
              event.slug || event.id || ""
            )}`;
            const dayPill = formatDayPill(event.startAt);
            const categoryLabel =
              EVENT_TYPES[event.eventType as keyof typeof EVENT_TYPES] ||
              event.eventType ||
              "Sự kiện";
            const isFree =
              event.ticketType === "FREE_OPEN" ||
              event.ticketType === "FREE_REGISTRATION";
            const ticketHeadline =
              event.ticketType === "PAID"
                ? event.ticketPriceDisplay || "Có phí"
                : event.ticketType === "FREE_OPEN" ||
                    event.ticketType === "FREE_REGISTRATION"
                  ? "Miễn phí"
                  : TICKET_TYPES[event.ticketType];
            const isSpecialStatus =
              event.status === "RESCHEDULED" ||
              event.status === "POSTPONED" ||
              event.status === "CANCELLED";
            const isReminded = Boolean(remindedMap[key]);
            const canRemind =
              event.status !== "CANCELLED" && event.status !== "POSTPONED";
            const orderLabel = String(startIndex + idx + 1).padStart(2, "0");

            return (
              <li
                key={key}
                onMouseEnter={() => setHoveredEvent(event)}
                className="group relative transition-colors duration-200 hover:bg-white/[0.045]"
              >
                {/* Left Glowing Accent Bar on Hover */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-0 top-0 bottom-0 w-[2.5px] bg-[#E87B39] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                />

                <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-3 md:gap-4 px-5 sm:px-6 py-4 sm:py-5">
                  {/* Date Pillar */}
                  <div className="md:col-span-2 flex items-center gap-3">
                    <span className="font-mono text-[11px] text-[#E6D9B7]/55 group-hover:text-[#E87B39] transition-colors">
                      {orderLabel}
                    </span>
                    <div className="rounded-[10px] bg-[#051219]/80 border border-[#E6D9B7]/20 group-hover:border-[#E6D9B7]/45 px-2.5 py-1.5 min-w-[78px] text-center transition-colors">
                      <span className="block text-[9px] font-mono uppercase tracking-[0.16em] text-[#E87B39]">
                        {dayPill.weekday}
                      </span>
                      <span className="block text-sm font-mono font-bold text-[#FFFDF5]">
                        {dayPill.dayMonth}
                      </span>
                    </div>
                  </div>

                  {/* Title & Time */}
                  <div className="md:col-span-4 min-w-0">
                    <Link
                      href={detailHref}
                      className="block home-serif text-base sm:text-[18px] font-semibold text-[#FFFDF5] group-hover:text-[#F5E6C4] transition-colors leading-snug line-clamp-2"
                    >
                      {event.name}
                    </Link>
                    <p className="mt-1 flex items-center gap-1.5 text-[11.5px] text-[#CBD9DA]/75">
                      <Calendar size={11.5} className="text-[#E6D9B7] shrink-0" />
                      <span className="truncate">
                        {formatEventCardDate(
                          event.startAt,
                          event.endAt,
                          event.isAllDay
                        )}
                      </span>
                    </p>
                  </div>

                  {/* Category + Status */}
                  <div className="md:col-span-2 flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center rounded-full bg-white/[0.06] border border-[#E6D9B7]/22 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[#E6D9B7]">
                      {categoryLabel}
                    </span>
                    {isSpecialStatus && (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] ${
                          event.status === "CANCELLED"
                            ? "bg-red-500/25 text-red-200 border border-red-400/40"
                            : "bg-amber-500/25 text-amber-200 border border-amber-400/40"
                        }`}
                      >
                        <AlertTriangle size={10} />
                        {STATUS_LABELS[event.status]}
                      </span>
                    )}
                  </div>

                  {/* Venue */}
                  <div className="md:col-span-2 min-w-0 flex items-start gap-1.5 text-xs text-[#CBD9DA]/80">
                    <MapPin size={13} className="text-[#C9B580] shrink-0 mt-0.5" />
                    <span className="line-clamp-2">
                      {event.locationName}
                      {event.district ? ` · ${event.district}` : ""}
                    </span>
                  </div>

                  {/* Price + Reminder + Link */}
                  <div className="md:col-span-2 flex items-center justify-between md:justify-end gap-2.5">
                    <span
                      className={`text-xs font-semibold truncate max-w-[110px] ${
                        isFree ? "text-[#7FD1C8]" : "text-[#F6B27B]"
                      }`}
                    >
                      {ticketHeadline}
                    </span>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {canRemind && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const nextState = toggleLocalEventReminder(event);
                            setRemindedMap((prev) => ({ ...prev, [key]: nextState }));
                          }}
                          aria-label="Nhắc tôi khi sự kiện sắp diễn ra"
                          title={
                            isReminded
                              ? "Đã bật nhắc lịch (Bấm để tắt)"
                              : "Nhắc tôi khi sự kiện sắp diễn ra"
                          }
                          className={`w-8 h-8 rounded-full border inline-flex items-center justify-center transition-all cursor-pointer ${
                            isReminded
                              ? "bg-[#216B70]/40 border-[#69A5A3]/70 text-[#FFFDF5]"
                              : "bg-[#051219]/70 border-[#E6D9B7]/22 text-[#CBD9DA] hover:text-[#FFFDF5] hover:border-[#E6D9B7]/55"
                          }`}
                        >
                          {isReminded ? (
                            <Check size={13} className="text-[#7FD1C8]" />
                          ) : (
                            <BellRing size={13} />
                          )}
                        </button>
                      )}

                      <Link
                        href={detailHref}
                        aria-label={`Xem chi tiết ${event.name}`}
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
