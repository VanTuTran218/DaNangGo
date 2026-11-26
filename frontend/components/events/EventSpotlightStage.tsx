"use client";

/**
 * EventSpotlightStage — Tier 1 ("SÂN KHẤU TÂM ĐIỂM // LIVE SPOTLIGHT STAGE")
 *
 * Interactive 12-col nocturnal stage showcase + perforated VIP Golden Ticket Pass:
 * - Lets visitors flip between top featured/upcoming Da Nang events synchronously.
 * - Live countdown telemetry (UTC+7), category & status pills, reminder bell sync.
 * - Zero AnimatePresence mode="wait" deadlock: immediate crisp transition on switch.
 */

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import {
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  ArrowRight,
  BellRing,
  Check,
  AlertTriangle,
  Ticket,
  Radio,
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
import { EASING } from "@/lib/motion-tokens";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1600&q=90&auto=format&fit=crop";

interface EventSpotlightStageProps {
  events: Event[];
}

function getCountdownBadge(event: Event, nowMs: number) {
  if (event.status === "POSTPONED") {
    return { label: "Tạm hoãn tổ chức", tone: "amber" as const };
  }
  if (event.status === "CANCELLED") {
    return { label: "Đã hủy sự kiện", tone: "red" as const };
  }
  const startMs = Date.parse(event.startAt);
  const endMs = Date.parse(event.endAt || event.startAt);
  if (!Number.isFinite(startMs)) {
    return { label: "Sắp diễn ra", tone: "gold" as const };
  }
  const effectiveEndMs = Number.isFinite(endMs) && endMs >= startMs ? endMs : startMs;

  if (nowMs >= startMs && nowMs <= effectiveEndMs) {
    return { label: "ĐANG DIỄN RA NGAY", tone: "live" as const };
  }
  if (nowMs < startMs) {
    const diffMs = startMs - nowMs;
    const days = Math.floor(diffMs / (24 * 3600 * 1000));
    const hours = Math.floor((diffMs % (24 * 3600 * 1000)) / (3600 * 1000));
    if (days > 0) {
      return { label: `Khởi tranh sau ${days} ngày ${hours} giờ`, tone: "gold" as const };
    }
    if (hours > 0) {
      return { label: `Khởi tranh sau ${hours} giờ nữa`, tone: "live" as const };
    }
    return { label: "Sắp mở màn trong ít phút", tone: "live" as const };
  }
  return { label: "Sự kiện nổi bật Đà Nẵng", tone: "gold" as const };
}

export default function EventSpotlightStage({ events }: EventSpotlightStageProps) {
  const reducedMotion = Boolean(useReducedMotion());
  const spotlightActs = useMemo(() => {
    const active = events.filter(
      (ev) => ev.status !== "DRAFT" && ev.status !== "CANCELLED"
    );
    const featured = active.filter((ev) => ev.isFeatured);
    const pool = featured.length >= 2 ? featured : active;
    return pool.slice(0, 5);
  }, [events]);

  const [activeIdx, setActiveIdx] = useState(0);
  const [imgFailedMap, setImgFailedMap] = useState<Record<string, boolean>>({});
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [remindedMap, setRemindedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setActiveIdx(0);
  }, [spotlightActs.length, spotlightActs[0]?.id]);

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const sync = () => {
      const next: Record<string, boolean> = {};
      for (const ev of spotlightActs) {
        const key = String(ev.slug || ev.id || "");
        if (key) next[key] = isEventBookmarkedForReminder(ev);
      }
      setRemindedMap(next);
    };
    sync();
    window.addEventListener("dananggo:event-reminders-changed", sync);
    return () => window.removeEventListener("dananggo:event-reminders-changed", sync);
  }, [spotlightActs]);

  if (spotlightActs.length === 0) return null;

  const safeIdx = activeIdx < spotlightActs.length ? activeIdx : 0;
  const current = spotlightActs[safeIdx];
  const currentKey = String(current.slug || current.id || safeIdx);
  const detailHref = `/su-kien/${encodeURIComponent(current.slug || current.id || "")}`;
  const categoryLabel =
    EVENT_TYPES[current.eventType as keyof typeof EVENT_TYPES] ||
    current.eventType ||
    "Sự kiện";
  const multiDay = isMultiDayEvent(current);
  const countdown = getCountdownBadge(current, nowMs);
  const isReminded = Boolean(remindedMap[currentKey]);
  const isFree =
    current.ticketType === "FREE_OPEN" || current.ticketType === "FREE_REGISTRATION";
  const ticketHeadline =
    current.ticketType === "PAID"
      ? current.ticketPriceDisplay || "Có bán vé"
      : TICKET_TYPES[current.ticketType] || "Miễn phí";

  const canRemind = current.status !== "CANCELLED" && current.status !== "POSTPONED";

  return (
    <section aria-label="Sân khấu tâm điểm Đà Nẵng" className="mb-14 lg:mb-18">
      {/* Section Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
        <div>
          <div className="inline-flex items-center gap-2.5 text-[10.5px] font-mono uppercase tracking-[0.24em] text-[#E6D9B7] mb-2">
            <span className="w-6 h-[1px] bg-[#E87B39]" />
            <span>CHƯƠNG 01 // SÂN KHẤU TÂM ĐIỂM ĐÀ NẴNG</span>
          </div>
          <h2 className="home-serif text-2xl sm:text-3xl lg:text-[34px] font-semibold text-[#FFFDF5] leading-tight">
            Tâm điểm lễ hội,{" "}
            <span className="italic font-normal text-[#E6D9B7]">
              chạm nhịp phố biển về đêm
            </span>
          </h2>
        </div>

        <span className="hidden sm:inline-flex items-center gap-2 rounded-full bg-[#091E28]/70 border border-[#E6D9B7]/24 px-3.5 py-1.5 text-[10.5px] font-mono uppercase tracking-[0.18em] text-[#E6D9B7]/85">
          <Radio size={12} className="text-[#E87B39]" />
          <span>{spotlightActs.length} TIẾT MỤC ĐỀ XUẤT</span>
        </span>
      </div>

      {/* Main 12-Col Spotlight Stage + Perforated VIP Pass */}
      <div className="relative rounded-[22px] bg-[#071821]/88 backdrop-blur-md border border-[#E6D9B7]/26 shadow-[0_30px_80px_rgba(2,10,15,0.52)] overflow-hidden grid lg:grid-cols-12">
        {/* Top champagne hairline */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[1px] z-30 bg-gradient-to-r from-transparent via-[#E6D9B7]/60 to-transparent"
        />

        {/* LEFT 7 COLS: CINEMATIC FULL-BLEED STAGE CANVAS */}
        <div className="relative lg:col-span-7 min-h-[360px] sm:min-h-[420px] lg:min-h-[460px] overflow-hidden bg-[#051219] flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-dashed border-[#E6D9B7]/24">
          <motion.div
            key={currentKey}
            initial={reducedMotion ? false : { opacity: 0.45, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, ease: EASING.standard }}
            className="absolute inset-0"
          >
            <Image
              src={
                imgFailedMap[currentKey] || !current.imageUrl
                  ? FALLBACK_IMAGE
                  : current.imageUrl
              }
              alt={current.name}
              fill
              priority
              unoptimized
              onError={() =>
                setImgFailedMap((m) => ({ ...m, [currentKey]: true }))
              }
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 58vw"
            />
          </motion.div>

          {/* Editorial Deep-Ocean Multi-Stop Scrim */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(6,21,28,0.68) 0%, rgba(6,21,28,0.18) 38%, rgba(6,21,28,0.64) 74%, rgba(5,18,25,0.94) 100%)",
            }}
          />

          {/* Top Bar: Countdown + Category + Multi-Day */}
          <div className="relative z-10 p-5 sm:p-6 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10.5px] font-mono font-semibold uppercase tracking-[0.14em] border backdrop-blur-md ${
                  countdown.tone === "live"
                    ? "bg-[#E87B39]/25 border-[#E87B39]/65 text-[#FFFDF5]"
                    : countdown.tone === "amber"
                      ? "bg-amber-500/25 border-amber-300/60 text-amber-100"
                      : "bg-[#06151C]/75 border-[#E6D9B7]/35 text-[#E6D9B7]"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    countdown.tone === "live"
                      ? "bg-[#E87B39] animate-pulse"
                      : "bg-[#E6D9B7]"
                  }`}
                />
                <span>{countdown.label}</span>
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#06151C]/72 backdrop-blur-md border border-[#E6D9B7]/28 px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[#FFFDF5]">
                <Sparkles size={11} className="text-[#E87B39]" />
                <span>{categoryLabel}</span>
              </span>
            </div>

            {multiDay && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#06151C]/75 backdrop-blur-md border border-white/18 px-3 py-1.5 text-[10.5px] font-medium text-[#E2ECEC]">
                <Clock size={11} className="text-[#69A5A3]" />
                <span>Nhiều ngày</span>
              </span>
            )}
          </div>

          {/* Bottom Act Switcher Strip */}
          <div className="relative z-10 p-5 sm:p-6 pt-0 space-y-4">
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#E2ECEC]">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#06151C]/78 backdrop-blur-md border border-[#E6D9B7]/25 px-3 py-1.5">
                <Calendar size={12.5} className="text-[#E87B39]" />
                <span>
                  {formatEventCardDate(current.startAt, current.endAt, current.isAllDay)}
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#06151C]/78 backdrop-blur-md border border-[#E6D9B7]/25 px-3 py-1.5">
                <MapPin size={12.5} className="text-[#C9B580]" />
                <span className="truncate max-w-[260px]">
                  {current.locationName}
                  {current.district ? ` · ${current.district}` : ""}
                </span>
              </span>
            </div>

            {spotlightActs.length > 1 && (
              <div
                className="flex flex-wrap items-center gap-2 pt-1"
                role="tablist"
                aria-label="Chọn sự kiện tâm điểm"
              >
                {spotlightActs.map((act, idx) => {
                  const isActive = idx === safeIdx;
                  const code = String(idx + 1).padStart(2, "0");
                  return (
                    <button
                      key={act.id || act.slug || idx}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveIdx(idx)}
                      className={`group/act flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-medium transition-all shrink-0 cursor-pointer border ${
                        isActive
                          ? "bg-[#FFF8E9] text-[#102832] border-[#FFF8E9] shadow-[0_6px_18px_rgba(2,10,15,0.45)]"
                          : "bg-[#06151C]/72 text-[#CBD9DA] border-[#E6D9B7]/22 hover:border-[#E6D9B7]/55 hover:text-[#FFFDF5]"
                      }`}
                    >
                      <span
                        className={`font-mono text-[10px] font-bold ${
                          isActive ? "text-[#CB712D]" : "text-[#E6D9B7]/80"
                        }`}
                      >
                        {code}
                      </span>
                      <span className="max-w-[115px] truncate">{act.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Perforation Notches on Desktop Divider Seam */}
        <span
          aria-hidden="true"
          className="hidden lg:block pointer-events-none absolute top-0 left-[58.3333%] -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#06151C] border border-[#E6D9B7]/26 z-20"
        />
        <span
          aria-hidden="true"
          className="hidden lg:block pointer-events-none absolute bottom-0 left-[58.3333%] -translate-x-1/2 translate-y-1/2 w-6 h-6 rounded-full bg-[#06151C] border border-[#E6D9B7]/26 z-20"
        />

        {/* RIGHT 5 COLS: PHYSICAL VIP GOLDEN TICKET STUB */}
        <div className="lg:col-span-5 p-6 sm:p-7 lg:p-8 flex flex-col justify-between bg-gradient-to-b from-[#0A202B]/95 to-[#06151C]/98">
          <motion.div
            key={currentKey}
            initial={reducedMotion ? false : { opacity: 0.45, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: EASING.standard }}
            className="flex flex-col h-full justify-between space-y-5"
          >
            <div>
              {/* Pass Header */}
              <div className="flex items-center justify-between gap-2 pb-3.5 mb-4 border-b border-dashed border-[#E6D9B7]/22">
                <span className="inline-flex items-center gap-2 text-[10.5px] font-mono uppercase tracking-[0.2em] text-[#E6D9B7]">
                  <Ticket size={13} className="text-[#E87B39]" />
                  <span>VIP PASS #{String(safeIdx + 1).padStart(2, "0")}</span>
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] border ${
                    current.status === "RESCHEDULED"
                      ? "bg-amber-500/20 border-amber-300/50 text-amber-200"
                      : current.status === "POSTPONED"
                        ? "bg-orange-500/20 border-orange-300/50 text-orange-200"
                        : "bg-emerald-500/15 border-emerald-400/40 text-emerald-200"
                  }`}
                >
                  {current.status === "RESCHEDULED" || current.status === "POSTPONED" ? (
                    <AlertTriangle size={10} />
                  ) : null}
                  <span>{STATUS_LABELS[current.status]}</span>
                </span>
              </div>

              {/* Event Serif Title */}
              <Link href={detailHref} className="group/title block">
                <h3 className="home-serif text-2xl sm:text-[26px] font-semibold text-[#FFFDF5] group-hover/title:text-[#F5E6C4] transition-colors leading-[1.24] mb-3">
                  {current.name}
                </h3>
              </Link>

              {/* Editorial Synopsis */}
              <p className="text-xs sm:text-[13.5px] text-[#CBD9DA]/85 leading-relaxed line-clamp-3 mb-5">
                {current.shortDescription}
              </p>

              {/* Ticket & Venue Meta Grid */}
              <div className="grid grid-cols-2 gap-3 rounded-[14px] bg-[#051219]/70 border border-[#E6D9B7]/16 p-3.5">
                <div>
                  <span className="block text-[9.5px] font-mono uppercase tracking-[0.18em] text-[#E6D9B7]/65 mb-1">
                    HÌNH THỨC VÉ
                  </span>
                  <span
                    className={`block text-xs sm:text-[13px] font-semibold leading-snug ${
                      isFree ? "text-[#7FD1C8]" : "text-[#F6B27B]"
                    }`}
                  >
                    {ticketHeadline}
                  </span>
                </div>
                <div className="border-l border-[#E6D9B7]/14 pl-3">
                  <span className="block text-[9.5px] font-mono uppercase tracking-[0.18em] text-[#E6D9B7]/65 mb-1">
                    KHU VỰC
                  </span>
                  <span className="block text-xs sm:text-[13px] font-semibold text-[#FFFDF5] leading-snug truncate">
                    {current.district || "Đà Nẵng"}
                  </span>
                </div>
              </div>
            </div>

            {/* Pass Footer CTAs */}
            <div className="pt-4 border-t border-dashed border-[#E6D9B7]/22 flex items-center justify-between gap-2.5">
              {canRemind ? (
                <button
                  type="button"
                  onClick={() => {
                    const nextState = toggleLocalEventReminder(current);
                    setRemindedMap((prev) => ({ ...prev, [currentKey]: nextState }));
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2.5 text-[11px] font-semibold border transition-all cursor-pointer ${
                    isReminded
                      ? "bg-[#216B70]/35 border-[#69A5A3]/70 text-[#FFFDF5]"
                      : "bg-[#051219]/75 hover:bg-white/[0.08] border-[#E6D9B7]/24 text-[#DCE8E8]"
                  }`}
                >
                  {isReminded ? (
                    <Check size={13} className="text-[#7FD1C8]" />
                  ) : (
                    <BellRing size={13} className="text-[#E87B39]" />
                  )}
                  <span>{isReminded ? "Đã nhắc lịch" : "Nhắc tôi"}</span>
                </button>
              ) : (
                <span className="text-[10.5px] font-mono uppercase tracking-[0.14em] text-amber-200/80">
                  Cổng vé tạm đóng
                </span>
              )}

              <Link
                href={detailHref}
                className="group/cta luxury-btn-sweep inline-flex items-center gap-2 rounded-full bg-[#FFF8E9] hover:bg-white text-[#102832] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] shadow-[0_10px_24px_rgba(2,10,15,0.42)] transition-all shrink-0"
              >
                <span>Khám phá</span>
                <ArrowRight
                  size={14}
                  className="text-[#CB712D] transition-transform duration-250 group-hover/cta:translate-x-1"
                />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
