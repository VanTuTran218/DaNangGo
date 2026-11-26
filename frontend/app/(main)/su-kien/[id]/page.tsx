"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import {
  Calendar,
  MapPin,
  Ticket,
  Navigation,
  ExternalLink,
  AlertTriangle,
  Building2,
  Globe,
  Clock,
  ArrowLeft,
  Share2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ChevronRight,
  Ban,
  BellRing,
  Mail,
  Compass,
  Star,
  Radio,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Footer from "@/components/layout/Footer";
import EventCard from "@/components/events/EventCard";
import RouteDirectionsModal from "@/components/places/RouteDirectionsModal";
import ScrollProgressBar from "@/components/places/ScrollProgressBar";
import {
  EVENT_TYPES,
  STATUS_LABELS,
  TICKET_TYPES,
  type Event,
} from "@/types/event";
import {
  getPublicEventDetail,
  getPublicEvents,
  getEventNearbyPlaces,
  buildGoogleCalendarUrl,
  formatEventDateRange,
  isMultiDayEvent,
  isEventBookmarkedForReminder,
  subscribeToEventReminder,
  type NearbyPlaceItem,
} from "@/lib/api/events";
import { EASING } from "@/lib/motion-tokens";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1600&q=90&auto=format&fit=crop";

function isValidHttpUrl(url?: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

interface ParsedScheduleBlock {
  type: "paragraph" | "heading" | "timeline";
  text?: string;
  items?: { time: string; detail: string }[];
}

/**
 * Parses rich event description text into clean prose + interactive timeline cards
 * whenever lines match bullet schedule notation (e.g. "• 16:30 – 18:30: ...").
 */
function parseDescriptionBlocks(raw: string): ParsedScheduleBlock[] {
  const lines = raw.split(/\r?\n/);
  const blocks: ParsedScheduleBlock[] = [];
  let pendingTimeline: { time: string; detail: string }[] = [];

  const flushTimeline = () => {
    if (pendingTimeline.length > 0) {
      blocks.push({ type: "timeline", items: pendingTimeline });
      pendingTimeline = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushTimeline();
      continue;
    }

    const timeBullet = /^[•\-*]\s*(\d{1,2}:\d{2}(?:\s*[–\-]\s*\d{1,2}:\d{2})?)\s*:\s*(.+)$/.exec(
      line
    );
    if (timeBullet) {
      pendingTimeline.push({
        time: timeBullet[1].trim(),
        detail: timeBullet[2].trim(),
      });
      continue;
    }

    const plainBullet = /^[•\-*]\s+(.+)$/.exec(line);
    if (plainBullet) {
      pendingTimeline.push({
        time: "HOẠT ĐỘNG",
        detail: plainBullet[1].trim(),
      });
      continue;
    }

    flushTimeline();
    if (line.endsWith(":") && line.length <= 70) {
      blocks.push({ type: "heading", text: line.slice(0, -1) });
    } else {
      blocks.push({ type: "paragraph", text: line });
    }
  }

  flushTimeline();
  return blocks;
}

function getLiveCountdownLabel(event: Event, nowMs: number) {
  if (event.status === "CANCELLED") return null;
  if (event.status === "POSTPONED") return null;
  const startMs = Date.parse(event.startAt);
  const endMs = Date.parse(event.endAt || event.startAt);
  if (!Number.isFinite(startMs)) return null;
  const effectiveEnd = Number.isFinite(endMs) && endMs >= startMs ? endMs : startMs;

  if (nowMs >= startMs && nowMs <= effectiveEnd) {
    return { label: "ĐANG DIỄN RA NGAY", live: true };
  }
  if (nowMs < startMs) {
    const diffMs = startMs - nowMs;
    const days = Math.floor(diffMs / (24 * 3600 * 1000));
    const hours = Math.floor((diffMs % (24 * 3600 * 1000)) / (3600 * 1000));
    if (days > 0) {
      return { label: `Khởi tranh sau ${days} ngày ${hours} giờ`, live: false };
    }
    if (hours > 0) {
      return { label: `Khởi tranh sau ${hours} giờ nữa`, live: true };
    }
    return { label: "Sắp mở màn", live: true };
  }
  return null;
}

export default function EventDetailPage() {
  const params = useParams();
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const { user } = useAuth();
  const reducedMotion = Boolean(useReducedMotion());

  const [event, setEvent] = useState<Event | null>(null);
  const [relatedEvents, setRelatedEvents] = useState<Event[]>([]);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [directionsOpen, setDirectionsOpen] = useState(false);
  const [reminderSaved, setReminderSaved] = useState(false);
  const [reminderEmail, setReminderEmail] = useState("");
  const [reminderBoxOpen, setReminderBoxOpen] = useState(false);
  const [reminderBusy, setReminderBusy] = useState(false);
  const [reminderMsg, setReminderMsg] = useState("");
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (user?.email) {
      setReminderEmail((prev) => prev || user.email);
    }
  }, [user]);

  useEffect(() => {
    if (event) {
      setReminderSaved(isEventBookmarkedForReminder(event));
    }
  }, [event]);

  const loadDetail = useCallback(
    async (signal?: AbortSignal) => {
      if (!rawId) return;
      setLoading(true);
      setError(null);
      try {
        const detail = await getPublicEventDetail(String(rawId), signal);
        if (signal?.aborted) return;
        setEvent(detail);

        if (detail) {
          const [allPublic, nearby] = await Promise.all([
            getPublicEvents({}, signal),
            getEventNearbyPlaces(String(rawId), 3, signal),
          ]);
          if (signal?.aborted) return;
          const others = allPublic.events
            .filter(
              (item) => item.id !== detail.id && item.slug !== detail.slug
            )
            .slice(0, 4);
          setRelatedEvents(others);
          setNearbyPlaces(nearby);
        }
      } catch (err) {
        if (signal?.aborted) return;
        setError(
          err instanceof Error
            ? err.message
            : "Không thể tải thông tin chi tiết sự kiện. Vui lòng thử lại."
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [rawId]
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadDetail(controller.signal);
    return () => controller.abort();
  }, [loadDetail]);

  const handleCopyShareLink = () => {
    if (typeof window !== "undefined") {
      void navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const descriptionBlocks = useMemo(() => {
    if (!event) return [];
    const text =
      event.description ||
      event.shortDescription ||
      "Đang cập nhật chương trình chi tiết.";
    return parseDescriptionBlocks(text);
  }, [event]);

  // 1. TRẠNG THÁI ĐANG TẢI (DARK SANCTUARY SKELETON — ZERO WHITE FLASH)
  if (loading) {
    return (
      <div className="min-h-screen bg-[#06151C] pt-28 pb-20">
        <div
          role="status"
          aria-label="Đang tải chi tiết sự kiện"
          className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6 animate-pulse"
        >
          <div className="h-4 w-64 bg-white/10 rounded-full" />
          <div className="h-80 sm:h-96 bg-[#0B222C] border border-[#E6D9B7]/14 rounded-[22px]" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-4">
              <div className="h-8 w-3/4 bg-white/10 rounded-xl" />
              <div className="h-4 w-full bg-white/8 rounded" />
              <div className="h-4 w-5/6 bg-white/8 rounded" />
              <div className="h-52 w-full bg-[#0B222C] border border-[#E6D9B7]/14 rounded-[20px]" />
            </div>
            <div className="lg:col-span-4 h-80 bg-[#0B222C] border border-[#E6D9B7]/14 rounded-[20px]" />
          </div>
        </div>
      </div>
    );
  }

  // 2. TRẠNG THÁI LỖI TẢI DỮ LIỆU
  if (error) {
    return (
      <div className="min-h-screen bg-[#06151C] pt-28 pb-20 px-4">
        <div
          role="alert"
          className="max-w-lg mx-auto bg-[#081C25] rounded-[22px] border border-red-400/35 p-8 text-center shadow-[0_24px_60px_rgba(2,10,15,0.5)]"
        >
          <div className="w-14 h-14 rounded-full bg-red-500/18 border border-red-400/35 text-red-300 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h1 className="home-serif text-xl font-semibold text-[#FFFDF5] mb-2">
            Lỗi tải thông tin sự kiện
          </h1>
          <p className="text-sm text-[#CBD9DA]/80 mb-6">{error}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => void loadDetail()}
              className="inline-flex items-center gap-2 bg-[#FFF8E9] hover:bg-white text-[#102832] text-xs font-semibold uppercase tracking-[0.12em] px-6 py-2.5 rounded-full transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Thử lại
            </button>
            <Link
              href="/su-kien"
              className="inline-flex items-center gap-2 border border-[#E6D9B7]/30 hover:bg-white/10 text-[#FFFDF5] text-xs font-semibold uppercase tracking-[0.12em] px-5 py-2.5 rounded-full transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Về danh sách sự kiện
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. TRẠNG THÁI KHÔNG TÌM THẤY (Hoặc sự kiện là DRAFT)
  if (!event) {
    return (
      <div className="min-h-screen bg-[#06151C] pt-28 pb-20 px-4">
        <div className="max-w-lg mx-auto bg-[#081C25] rounded-[22px] border border-[#E6D9B7]/24 p-8 sm:p-10 text-center shadow-[0_24px_60px_rgba(2,10,15,0.5)]">
          <div className="w-14 h-14 rounded-full bg-[#E6D9B7]/12 border border-[#E6D9B7]/30 text-[#E6D9B7] flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-7 h-7" />
          </div>
          <h1 className="home-serif text-2xl font-semibold text-[#FFFDF5] mb-2">
            Không tìm thấy sự kiện
          </h1>
          <p className="text-sm text-[#CBD9DA]/78 mb-6 leading-relaxed">
            Sự kiện bạn đang tìm kiếm không tồn tại hoặc đang ở trạng thái bản
            nháp chưa được công bố.
          </p>
          <Link
            href="/su-kien"
            className="inline-flex items-center gap-2 bg-[#FFF8E9] hover:bg-white text-[#102832] text-xs font-semibold uppercase tracking-[0.12em] px-6 py-3 rounded-full transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại danh sách sự kiện
          </Link>
        </div>
      </div>
    );
  }

  const categoryLabel =
    EVENT_TYPES[event.eventType as keyof typeof EVENT_TYPES] ||
    event.eventType ||
    "Sự kiện";
  const multiDay = isMultiDayEvent(event);
  const countdown = getLiveCountdownLabel(event, nowMs);

  // Quy tắc nghiệp vụ: Ẩn nút vé và đăng ký khi sự kiện bị hoãn (POSTPONED) hoặc hủy (CANCELLED)
  const isPostponedOrCancelled =
    event.status === "POSTPONED" || event.status === "CANCELLED";
  const canRegisterOrBuyTicket = !isPostponedOrCancelled;

  const fullAddress = [
    event.locationName,
    event.address,
    event.district,
    "Đà Nẵng",
  ]
    .filter(Boolean)
    .join(", ");

  const googleMapsUrl =
    event.latitude && event.longitude
      ? `https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`
      : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress)}`;

  const numericPlaceId =
    event.placeId && /^\d+$/.test(event.placeId) ? Number(event.placeId) : null;

  const handleDirectionsClick = () => {
    if (numericPlaceId) {
      setDirectionsOpen(true);
    } else if (typeof window !== "undefined") {
      window.open(googleMapsUrl, "_blank", "noopener,noreferrer");
    }
  };

  const heroImageSrc =
    imgError || !event.imageUrl ? FALLBACK_IMAGE : event.imageUrl;

  return (
    <div className="dananggo-cinematic-content relative min-h-screen bg-[#06151C] text-[#FFFDF5] flex flex-col overflow-x-clip">
      {/* Top Champagne Reading Progress Hairline */}
      <ScrollProgressBar />

      {/* Subtle Fixed Nocturnal Starlight Background Layer */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% 0%, #0D2834 0%, #071922 52%, #051219 100%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(230,217,183,0.4) 1px, transparent 1px)",
            backgroundSize: "52px 52px",
          }}
        />
      </div>

      {/* ══ CINEMATIC FULL-BLEED EVENT HERO (FIXED CONTRAST) ══ */}
      <section
        data-navbar-overlay="true"
        className="relative z-10 bg-[#06151C] pt-28 pb-14 sm:pt-32 sm:pb-16 overflow-hidden"
      >
        <Image
          src={heroImageSrc}
          alt={event.name}
          fill
          priority
          unoptimized
          onError={() => setImgError(true)}
          className="object-cover opacity-42 scale-[1.03]"
          sizes="100vw"
        />

        {/* Multi-Stop Deep Ocean Vignette melting seamlessly into #06151C */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(6,21,28,0.78) 0%, rgba(7,24,33,0.56) 40%, rgba(6,21,28,0.88) 82%, #06151C 100%)",
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm text-[#CBD9DA]/80 mb-6"
          >
            <Link href="/" className="hover:text-[#FFFDF5] transition">
              Trang chủ
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#E6D9B7]/45" />
            <Link href="/su-kien" className="hover:text-[#FFFDF5] transition">
              Sự kiện
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#E6D9B7]/45" />
            <span className="text-[#E6D9B7] font-medium truncate max-w-xs sm:max-w-md">
              {event.name}
            </span>
          </nav>

          {/* Badges Row */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#216B70]/42 backdrop-blur-md border border-[#69A5A3]/45 text-[#E2ECEC] text-[11px] font-semibold uppercase tracking-[0.12em] px-3 py-1">
              <span>{categoryLabel}</span>
            </span>

            <span
              className={`inline-flex items-center gap-1 rounded-full text-[11px] font-bold uppercase tracking-[0.1em] px-3 py-1 border ${
                event.status === "CANCELLED"
                  ? "bg-red-600/90 border-red-400/60 text-white"
                  : event.status === "POSTPONED"
                    ? "bg-[#E87B39]/90 border-orange-300/60 text-white"
                    : event.status === "RESCHEDULED"
                      ? "bg-amber-500/90 border-amber-300/60 text-white"
                      : "bg-emerald-500/20 border-emerald-400/45 text-emerald-200"
              }`}
            >
              {STATUS_LABELS[event.status]}
            </span>

            {event.isFeatured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#E87B39]/22 border border-[#E87B39]/50 text-[#FFFDF5] text-[11px] font-semibold px-3 py-1">
                <Sparkles className="w-3 h-3 text-[#E87B39]" />
                Sự kiện nổi bật
              </span>
            )}

            {multiDay && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#FFFDF5] text-[11px] font-medium px-3 py-1">
                <Clock className="w-3 h-3 text-[#69A5A3]" />
                Sự kiện kéo dài nhiều ngày
              </span>
            )}

            {countdown && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10.5px] font-mono font-semibold uppercase tracking-[0.14em] border backdrop-blur-md ${
                  countdown.live
                    ? "bg-[#E87B39]/24 border-[#E87B39]/65 text-[#FFFDF5]"
                    : "bg-[#06151C]/72 border-[#E6D9B7]/35 text-[#E6D9B7]"
                }`}
              >
                <Radio
                  size={11}
                  className={
                    countdown.live ? "text-[#E87B39] animate-pulse" : "text-[#E6D9B7]"
                  }
                />
                <span>{countdown.label}</span>
              </span>
            )}
          </div>

          {/* High-Contrast Monumental Event Title (FIXED — no dark .home-section-heading color) */}
          <motion.h1
            initial={reducedMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: EASING.entrance }}
            style={{ textShadow: "0 8px 30px rgba(3,12,17,0.72)" }}
            className="home-serif text-3xl sm:text-4xl lg:text-[46px] font-semibold text-[#FFFDF5] leading-[1.16] max-w-4xl mb-4"
          >
            {event.name}
          </motion.h1>

          <p className="text-[#E2ECEC]/88 text-sm sm:text-base max-w-3xl leading-relaxed mb-6 border-l-2 border-[#C9B580] pl-4">
            {event.shortDescription}
          </p>

          {/* Frosted Quick Telemetry Chips */}
          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-[#FFFDF5]">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#071821]/72 backdrop-blur-md px-4 py-2 border border-[#E6D9B7]/26">
              <Calendar className="w-4 h-4 text-[#E87B39] shrink-0" />
              <span>
                {formatEventDateRange(event.startAt, event.endAt, event.isAllDay)}
              </span>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full bg-[#071821]/72 backdrop-blur-md px-4 py-2 border border-[#E6D9B7]/26">
              <MapPin className="w-4 h-4 text-[#C9B580] shrink-0" />
              <span>
                {event.locationName}
                {event.district ? ` · ${event.district}` : ""}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ══ MAIN DOSSIER & VIP PASS CONTENT ══ */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-4 pb-16">
        {/* BANNER THÔNG BÁO ĐỔI LỊCH / TẠM HOÃN / ĐÃ HỦY */}
        {(event.status === "RESCHEDULED" ||
          event.status === "POSTPONED" ||
          event.status === "CANCELLED") && (
          <div
            role="alert"
            className={`mb-8 rounded-[20px] border p-5 sm:p-6 backdrop-blur-md shadow-[0_18px_48px_rgba(2,10,15,0.42)] ${
              event.status === "CANCELLED"
                ? "bg-red-950/55 border-red-400/45 text-red-50"
                : event.status === "POSTPONED"
                  ? "bg-orange-950/55 border-orange-400/45 text-orange-50"
                  : "bg-amber-950/55 border-amber-300/45 text-amber-50"
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  event.status === "CANCELLED"
                    ? "bg-red-500/30 border border-red-400/50 text-red-200"
                    : event.status === "POSTPONED"
                      ? "bg-orange-500/30 border border-orange-400/50 text-orange-200"
                      : "bg-amber-500/30 border border-amber-300/50 text-amber-200"
                }`}
              >
                {event.status === "CANCELLED" ? (
                  <Ban className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>

              <div className="flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="home-serif text-lg sm:text-xl font-semibold text-[#FFFDF5]">
                    {event.status === "CANCELLED"
                      ? "Sự kiện này đã bị hủy"
                      : event.status === "POSTPONED"
                        ? "Sự kiện đang tạm hoãn"
                        : "Sự kiện đã thay đổi lịch tổ chức"}
                  </h2>
                  <span className="text-[10.5px] font-mono font-bold uppercase tracking-[0.14em] px-2.5 py-0.5 rounded-full bg-white/12 border border-white/20">
                    {STATUS_LABELS[event.status]}
                  </span>
                </div>

                <p className="text-sm leading-relaxed text-white/88">
                  {event.changeNote ||
                    (event.status === "CANCELLED"
                      ? "Ban tổ chức đã thông báo hủy sự kiện này. Hoạt động bán vé và đăng ký tham gia đã đóng."
                      : event.status === "POSTPONED"
                        ? "Sự kiện tạm hoãn chờ lịch mới từ Ban tổ chức. Cổng đăng ký và bán vé hiện đang tạm đóng."
                        : `Sự kiện đã được cập nhật sang khung giờ mới: ${formatEventDateRange(
                            event.startAt,
                            event.endAt,
                            event.isAllDay
                          )}.`)}
                </p>

                {event.status === "RESCHEDULED" && (
                  <p className="text-xs sm:text-sm font-semibold text-amber-200 pt-1">
                    Lịch mới áp dụng (Giờ Đà Nẵng UTC+7):{" "}
                    <span className="underline underline-offset-4">
                      {formatEventDateRange(
                        event.startAt,
                        event.endAt,
                        event.isAllDay
                      )}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ── CỘT TRÁI (8/12): ẢNH SÂN KHẤU, LỊCH TRÌNH TƯƠNG TÁC, ĐỊA ĐIỂM, BAN TỔ CHỨC ── */}
          <div className="lg:col-span-8 space-y-7">
            {/* Cinema Stage Photo Frame */}
            <div className="relative rounded-[22px] overflow-hidden shadow-[0_24px_64px_rgba(2,10,15,0.5)] border border-[#E6D9B7]/24 aspect-[16/9] bg-[#081C25] group">
              <Image
                src={heroImageSrc}
                alt={event.name}
                fill
                unoptimized
                onError={() => setImgError(true)}
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]"
                sizes="(max-width: 1024px) 100vw, 66vw"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(6,21,28,0.12) 0%, transparent 45%, rgba(6,21,28,0.72) 100%)",
                }}
              />
              {/* 4 Corner Architectural Viewfinder Ticks */}
              <span className="pointer-events-none absolute top-4 left-4 w-3.5 h-3.5 border-t border-l border-[#E6D9B7]/70" />
              <span className="pointer-events-none absolute top-4 right-4 w-3.5 h-3.5 border-t border-r border-[#E6D9B7]/70" />
              <span className="pointer-events-none absolute bottom-4 left-4 w-3.5 h-3.5 border-b border-l border-[#E6D9B7]/70" />
              <span className="pointer-events-none absolute bottom-4 right-4 w-3.5 h-3.5 border-b border-r border-[#E6D9B7]/70" />

              <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between gap-2 text-[11px] font-mono uppercase tracking-[0.16em] text-[#E6D9B7]/90">
                <span className="truncate">{event.locationName || "Đà Nẵng"}</span>
                {event.latitude && event.longitude && (
                  <span className="hidden sm:inline shrink-0">
                    {event.latitude.toFixed(4)}°N &middot;{" "}
                    {event.longitude.toFixed(4)}°E
                  </span>
                )}
              </div>
            </div>

            {/* Nội dung chương trình & Interactive Schedule Timeline */}
            <section className="rounded-[22px] bg-[#081C25]/82 backdrop-blur-md border border-[#E6D9B7]/22 p-6 sm:p-8 shadow-[0_18px_48px_rgba(2,10,15,0.38)] space-y-5">
              <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#E6D9B7]/14">
                <div>
                  <span className="block text-[10px] font-mono uppercase tracking-[0.22em] text-[#E6D9B7]/75 mb-1">
                    STAGE PROGRAM &amp; SYNOPSIS
                  </span>
                  <h2 className="home-serif text-xl sm:text-2xl font-semibold text-[#FFFDF5] flex items-center gap-2.5">
                    <Sparkles className="w-5 h-5 text-[#E87B39] shrink-0" />
                    <span>Nội dung &amp; Chương trình sự kiện</span>
                  </h2>
                </div>
              </div>

              <div className="space-y-4">
                {descriptionBlocks.map((block, bIdx) => {
                  if (block.type === "heading") {
                    return (
                      <h3
                        key={bIdx}
                        className="pt-2 text-xs font-mono font-semibold uppercase tracking-[0.2em] text-[#E6D9B7] flex items-center gap-2"
                      >
                        <span className="w-4 h-[1px] bg-[#E87B39]" />
                        <span>{block.text}</span>
                      </h3>
                    );
                  }
                  if (block.type === "timeline" && block.items) {
                    return (
                      <ol
                        key={bIdx}
                        className="relative space-y-3 pl-5 before:content-[''] before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[1px] before:bg-gradient-to-b before:from-[#E87B39] before:via-[#E6D9B7]/45 before:to-transparent"
                      >
                        {block.items.map((item, tIdx) => (
                          <li
                            key={tIdx}
                            className="relative rounded-[14px] bg-[#051219]/68 border border-[#E6D9B7]/16 hover:border-[#E6D9B7]/38 p-3.5 sm:p-4 transition-colors"
                          >
                            <span
                              aria-hidden="true"
                              className="absolute -left-[18px] top-4 w-2.5 h-2.5 rounded-full bg-[#E87B39] ring-4 ring-[#081C25]"
                            />
                            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1.5 sm:gap-3">
                              <span className="inline-flex items-center rounded-full bg-[#E87B39]/16 border border-[#E87B39]/38 px-2.5 py-0.5 text-[11px] font-mono font-semibold text-[#F6B27B] shrink-0 w-fit">
                                {item.time}
                              </span>
                              <p className="text-sm text-[#E2ECEC]/90 leading-relaxed">
                                {item.detail}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ol>
                    );
                  }
                  return (
                    <p
                      key={bIdx}
                      className="text-sm sm:text-[15px] text-[#D5E4E4]/88 leading-relaxed"
                    >
                      {block.text}
                    </p>
                  );
                })}
              </div>
            </section>

            {/* Địa điểm tổ chức & Map Sanctuary Card */}
            <section className="rounded-[22px] bg-[#081C25]/82 backdrop-blur-md border border-[#E6D9B7]/22 p-6 sm:p-8 shadow-[0_18px_48px_rgba(2,10,15,0.38)] space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E6D9B7]/14">
                <div>
                  <span className="block text-[10px] font-mono uppercase tracking-[0.22em] text-[#E6D9B7]/75 mb-1">
                    VENUE COORDINATES
                  </span>
                  <h2 className="home-serif text-xl sm:text-2xl font-semibold text-[#FFFDF5] flex items-center gap-2.5">
                    <MapPin className="w-5 h-5 text-[#C9B580] shrink-0" />
                    <span>Địa điểm tổ chức</span>
                  </h2>
                </div>

                {numericPlaceId && (
                  <Link
                    href={`/places/${numericPlaceId}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FFFDF5] bg-[#216B70]/35 hover:bg-[#216B70]/55 border border-[#69A5A3]/45 px-4 py-2 rounded-full transition"
                  >
                    <span>Xem địa điểm trên DaNangGo</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>

              <div className="relative rounded-[16px] bg-[#051219]/75 border border-[#E6D9B7]/18 p-5 sm:p-6 overflow-hidden space-y-3.5">
                {/* Faint nautical coordinate grid */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-[0.09]"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, rgba(230,217,183,0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(230,217,183,0.4) 1px, transparent 1px)",
                    backgroundSize: "40px 40px",
                  }}
                />

                <div className="relative z-10 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="home-serif text-lg font-semibold text-[#FFFDF5]">
                      {event.locationName || "Đà Nẵng"}
                    </h3>
                    {event.district && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] border border-[#E6D9B7]/25 px-3 py-1 text-[11px] font-medium text-[#E6D9B7]">
                        <Compass size={12} className="text-[#E87B39]" />
                        <span>{event.district}, TP. Đà Nẵng</span>
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-[#CBD9DA]/85 leading-relaxed">
                    Địa chỉ:{" "}
                    <span className="font-medium text-[#FFFDF5]">
                      {fullAddress}
                    </span>
                  </p>

                  <div className="pt-2 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleDirectionsClick}
                      className="inline-flex items-center gap-2 bg-[#FFF8E9] hover:bg-white text-[#102832] text-xs font-semibold uppercase tracking-[0.12em] px-5 py-2.5 rounded-full shadow-sm transition cursor-pointer"
                    >
                      <Navigation className="w-3.5 h-3.5 text-[#CB712D]" />
                      Chỉ đường đến sự kiện
                    </button>

                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 border border-[#E6D9B7]/30 bg-white/[0.05] hover:bg-white/[0.12] text-[#FFFDF5] text-xs font-semibold uppercase tracking-[0.1em] px-5 py-2.5 rounded-full transition"
                    >
                      <span>Mở Google Maps</span>
                      <ExternalLink className="w-3.5 h-3.5 text-[#E6D9B7]" />
                    </a>
                  </div>
                </div>
              </div>
            </section>

            {/* Ban tổ chức & Nguồn thông tin chính thức */}
            <section className="rounded-[22px] bg-[#081C25]/82 backdrop-blur-md border border-[#E6D9B7]/22 p-6 sm:p-8 shadow-[0_18px_48px_rgba(2,10,15,0.38)] space-y-5">
              <div className="pb-4 border-b border-[#E6D9B7]/14">
                <span className="block text-[10px] font-mono uppercase tracking-[0.22em] text-[#E6D9B7]/75 mb-1">
                  VERIFIED ORGANIZER &amp; SOURCE
                </span>
                <h2 className="home-serif text-xl sm:text-2xl font-semibold text-[#FFFDF5] flex items-center gap-2.5">
                  <Building2 className="w-5 h-5 text-[#7FD1C8] shrink-0" />
                  <span>Ban tổ chức &amp; Nguồn thông tin chính thức</span>
                </h2>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="rounded-[16px] bg-[#051219]/70 p-4 sm:p-5 border border-[#E6D9B7]/16">
                  <dt className="text-[10.5px] font-mono font-semibold text-[#E6D9B7]/72 uppercase tracking-[0.18em] mb-1.5">
                    Đơn vị tổ chức
                  </dt>
                  <dd className="font-semibold text-[#FFFDF5] text-base">
                    {event.organizerName || "Ban tổ chức sự kiện Đà Nẵng"}
                  </dd>
                  {event.organizerContact && (
                    <dd className="text-xs text-[#CBD9DA]/78 mt-1.5">
                      {event.organizerContact}
                    </dd>
                  )}
                </div>

                <div className="rounded-[16px] bg-[#051219]/70 p-4 sm:p-5 border border-[#E6D9B7]/16">
                  <dt className="text-[10.5px] font-mono font-semibold text-[#E6D9B7]/72 uppercase tracking-[0.18em] mb-1.5">
                    Nguồn thông tin chính thức
                  </dt>
                  <dd className="mt-1">
                    {isValidHttpUrl(event.officialSourceUrl) ? (
                      <a
                        href={event.officialSourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-semibold text-[#7FD1C8] hover:text-[#FFFDF5] underline underline-offset-4 break-all transition-colors"
                      >
                        <Globe className="w-4 h-4 shrink-0" />
                        <span>Xem cổng thông tin chính thức</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-[#CBD9DA]/80">
                        Cập nhật bởi Cẩm nang Du lịch DaNangGo
                      </span>
                    )}
                  </dd>
                </div>
              </dl>
            </section>
          </div>

          {/* ── CỘT PHẢI (4/12): STICKY PERFORATED VIP EVENT PASS (top-[124px] clears Weather pill) ── */}
          <aside className="lg:col-span-4 lg:sticky lg:top-[124px] space-y-5">
            <div className="relative rounded-[22px] bg-gradient-to-b from-[#0A202B]/94 to-[#071821]/96 backdrop-blur-xl border border-[#E6D9B7]/28 shadow-[0_28px_70px_rgba(2,10,15,0.55)] overflow-hidden">
              {/* Top Champagne foil hairline */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#E6D9B7]/70 to-transparent"
              />

              {/* UPPER PASS: PRICE & DETAILS */}
              <div className="p-6 space-y-5">
                <div className="pb-5 border-b border-dashed border-[#E6D9B7]/22">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.2em] text-[#E6D9B7]">
                      <Ticket className="w-3.5 h-3.5 text-[#E87B39]" />
                      <span>THÔNG TIN VÉ THAM DỰ</span>
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#CBD9DA]/60">
                      VIP PASS
                    </span>
                  </div>
                  <p className="home-serif text-2xl sm:text-[26px] font-semibold text-[#FFFDF5] leading-snug">
                    {event.ticketType === "PAID"
                      ? event.ticketPriceDisplay || "Sự kiện có bán vé"
                      : TICKET_TYPES[event.ticketType]}
                  </p>
                  {event.ticketType !== "PAID" && event.ticketPriceDisplay && (
                    <p className="text-xs font-semibold text-[#7FD1C8] mt-1">
                      {event.ticketPriceDisplay}
                    </p>
                  )}
                </div>

                {/* Metadata rows */}
                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#216B70]/28 border border-[#69A5A3]/40 text-[#7FD1C8] flex items-center justify-center shrink-0 mt-0.5">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#E6D9B7]/72">
                        Thời gian (UTC+7)
                      </p>
                      <p className="font-semibold text-[#FFFDF5] mt-0.5 leading-snug">
                        {formatEventDateRange(
                          event.startAt,
                          event.endAt,
                          event.isAllDay
                        )}
                      </p>
                      {event.isAllDay && (
                        <span className="inline-block mt-1.5 text-[10.5px] font-semibold bg-[#216B70]/35 border border-[#69A5A3]/40 text-[#A7E4DF] px-2.5 py-0.5 rounded-full">
                          Diễn ra cả ngày
                        </span>
                      )}
                    </div>
                  </div>

                  {event.registrationDeadline && canRegisterOrBuyTicket && (
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-300/40 text-amber-200 flex items-center justify-center shrink-0 mt-0.5">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#E6D9B7]/72">
                          Hạn chót đăng ký
                        </p>
                        <p className="font-semibold text-amber-200 mt-0.5">
                          {formatEventDateRange(
                            event.registrationDeadline,
                            "",
                            false
                          )}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#E87B39]/18 border border-[#E87B39]/38 text-[#F6B27B] flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#E6D9B7]/72">
                        Địa điểm
                      </p>
                      <p className="font-semibold text-[#FFFDF5] mt-0.5">
                        {event.locationName}
                      </p>
                      <p className="text-xs text-[#CBD9DA]/76 mt-0.5">
                        {[event.address, event.district]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-white/[0.06] border border-[#E6D9B7]/28 text-[#E6D9B7] flex items-center justify-center shrink-0 mt-0.5">
                      <Ticket className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#E6D9B7]/72">
                        Hình thức tham gia
                      </p>
                      <p className="font-semibold text-[#FFFDF5] mt-0.5">
                        {TICKET_TYPES[event.ticketType]}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* PERFORATED TEAR LINE WITH SIDE NOTCHES */}
              <div
                aria-hidden="true"
                className="relative flex items-center px-6"
              >
                <span className="absolute -left-3 w-6 h-6 rounded-full bg-[#06151C] border border-[#E6D9B7]/28" />
                <div className="w-full border-t border-dashed border-[#E6D9B7]/26" />
                <span className="absolute -right-3 w-6 h-6 rounded-full bg-[#06151C] border border-[#E6D9B7]/28" />
              </div>

              {/* LOWER STUB: ACTION DOCK */}
              <div className="p-6 bg-[#051219]/58 space-y-3">
                {/* Quy tắc nghiệp vụ: ẩn nút vé & đăng ký khi POSTPONED hoặc CANCELLED */}
                {isPostponedOrCancelled ? (
                  <div className="rounded-[14px] bg-white/[0.05] border border-[#E6D9B7]/20 p-4 text-center space-y-1">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#E6D9B7]">
                      {event.status === "CANCELLED"
                        ? "Đã đóng đăng ký & bán vé (Sự kiện đã hủy)"
                        : "Tạm đóng đăng ký & bán vé (Sự kiện tạm hoãn)"}
                    </p>
                    <p className="text-xs text-[#CBD9DA]/72">
                      Nút đăng ký tham gia và mua vé đã được ẩn để tránh nhầm
                      lẫn cho du khách.
                    </p>
                  </div>
                ) : (
                  <>
                    {event.ticketType === "FREE_REGISTRATION" &&
                      isValidHttpUrl(event.ticketUrl) && (
                        <a
                          href={event.ticketUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="luxury-btn-sweep w-full inline-flex items-center justify-center gap-2 bg-[#216B70] hover:bg-[#298086] text-[#FFFDF5] font-semibold text-xs sm:text-sm uppercase tracking-[0.1em] px-6 py-3.5 rounded-full shadow-[0_12px_28px_rgba(33,107,112,0.35)] transition"
                        >
                          <Ticket className="w-4 h-4" />
                          <span>Đăng ký tham gia</span>
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}

                    {event.ticketType === "PAID" &&
                      isValidHttpUrl(event.ticketUrl) && (
                        <a
                          href={event.ticketUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="luxury-btn-sweep w-full inline-flex items-center justify-center gap-2 bg-[#E87B39] hover:bg-[#D66A28] text-[#FFFDF5] font-semibold text-xs sm:text-sm uppercase tracking-[0.1em] px-6 py-3.5 rounded-full shadow-[0_12px_28px_rgba(232,123,57,0.34)] transition"
                        >
                          <Ticket className="w-4 h-4" />
                          <span>Xem vé &amp; Đặt mua</span>
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}

                    {event.ticketType === "FREE_OPEN" && (
                      <div className="rounded-[14px] bg-emerald-500/14 border border-emerald-400/35 px-4 py-3 text-center">
                        <p className="text-xs font-semibold text-emerald-200">
                          ✓ Sự kiện mở cửa tự do — Không cần đăng ký vé trước
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* Nút Chỉ đường */}
                <button
                  type="button"
                  onClick={handleDirectionsClick}
                  className="luxury-btn-sweep w-full inline-flex items-center justify-center gap-2 bg-[#FFF8E9] hover:bg-white text-[#102832] font-semibold text-xs sm:text-sm uppercase tracking-[0.1em] px-6 py-3.5 rounded-full shadow-[0_10px_24px_rgba(2,10,15,0.4)] transition cursor-pointer"
                >
                  <Navigation className="w-4 h-4 text-[#CB712D]" />
                  <span>Chỉ đường đến địa điểm</span>
                </button>

                {/* Nút Nhắc tôi khi sự kiện sắp diễn ra */}
                {!isPostponedOrCancelled && (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (reminderSaved && !reminderBoxOpen) {
                          setReminderBoxOpen(true);
                          return;
                        }
                        setReminderBoxOpen((prev) => !prev);
                      }}
                      className={`w-full inline-flex items-center justify-center gap-2 border font-semibold text-xs sm:text-[13px] px-5 py-3 rounded-full transition cursor-pointer ${
                        reminderSaved
                          ? "bg-[#216B70]/35 border-[#69A5A3]/65 text-[#FFFDF5]"
                          : "bg-[#E87B39]/14 hover:bg-[#E87B39]/25 border-[#E87B39]/42 text-[#FAD0A8]"
                      }`}
                    >
                      <BellRing className="w-4 h-4 text-[#E87B39]" />
                      <span>
                        {reminderSaved
                          ? "Đã bật thông báo khi sự kiện sắp diễn ra"
                          : "Nhắc tôi khi sự kiện sắp diễn ra"}
                      </span>
                    </button>

                    {reminderBoxOpen && (
                      <div className="rounded-[16px] border border-[#69A5A3]/40 bg-[#081C25]/92 p-4 space-y-2.5 text-xs">
                        <p className="text-[#CBD9DA]/85 leading-relaxed">
                          Nhận thông báo ngay trên chuông thông báo của web và
                          qua email trước giờ sự kiện bắt đầu:
                        </p>
                        <div className="relative">
                          <Mail className="w-3.5 h-3.5 text-[#E6D9B7]/70 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="email"
                            value={reminderEmail}
                            onChange={(e) => setReminderEmail(e.target.value)}
                            placeholder="Nhập email nhận nhắc lịch (tùy chọn)"
                            className="w-full pl-8 pr-3 py-2 rounded-full bg-[#051219]/80 border border-[#E6D9B7]/26 text-xs text-[#FFFDF5] placeholder:text-[#CBD9DA]/55 focus:border-[#E6D9B7]/65 focus:outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          disabled={reminderBusy}
                          onClick={async () => {
                            setReminderBusy(true);
                            setReminderMsg("");
                            try {
                              const res = await subscribeToEventReminder(
                                event,
                                reminderEmail,
                                user?.name
                              );
                              setReminderSaved(true);
                              setReminderMsg(res.message);
                            } catch (err) {
                              setReminderMsg(
                                err instanceof Error
                                  ? err.message
                                  : "Chưa lưu được nhắc lịch. Vui lòng thử lại."
                              );
                            } finally {
                              setReminderBusy(false);
                            }
                          }}
                          className="w-full py-2.5 rounded-full bg-[#216B70] hover:bg-[#298086] text-[#FFFDF5] font-semibold text-xs cursor-pointer disabled:opacity-50 transition-colors"
                        >
                          {reminderBusy
                            ? "Đang lưu..."
                            : "Xác nhận bật thông báo"}
                        </button>
                        {reminderMsg && (
                          <p
                            role="status"
                            className="text-[11px] font-semibold text-[#7FD1C8]"
                          >
                            {reminderMsg}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Nút Thêm vào Google Calendar */}
                {!isPostponedOrCancelled && (
                  <a
                    href={buildGoogleCalendarUrl(event)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 border border-[#E6D9B7]/25 hover:border-[#E6D9B7]/55 bg-white/[0.04] hover:bg-white/[0.09] text-[#E2ECEC] font-semibold text-xs sm:text-[13px] px-5 py-2.5 rounded-full transition cursor-pointer"
                  >
                    <Calendar className="w-4 h-4 text-[#E6D9B7]" />
                    <span>Thêm vào Google Calendar</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#CBD9DA]/60" />
                  </a>
                )}

                {/* Nút Chia sẻ sự kiện */}
                <button
                  type="button"
                  onClick={handleCopyShareLink}
                  className="w-full inline-flex items-center justify-center gap-2 border border-[#E6D9B7]/25 hover:border-[#E6D9B7]/55 bg-white/[0.04] hover:bg-white/[0.09] text-[#E2ECEC] font-semibold text-xs sm:text-[13px] px-5 py-2.5 rounded-full transition cursor-pointer"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[#7FD1C8]" />
                      <span className="text-[#7FD1C8]">
                        Đã sao chép liên kết sự kiện!
                      </span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 text-[#E6D9B7]" />
                      <span>Sao chép liên kết chia sẻ</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </aside>
        </div>

        {/* ══ GỢI Ý ĐỊA ĐIỂM ĂN UỐNG & THAM QUAN GẦN SỰ KIỆN ══ */}
        {nearbyPlaces.length > 0 && (
          <section className="mt-16 pt-12 border-t border-[#E6D9B7]/16">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-7">
              <div>
                <span className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-[#E6D9B7] mb-1.5">
                  <span className="w-5 h-[1px] bg-[#E87B39]" />
                  <span>NEARBY COORDINATES &middot; 3KM RADIUS</span>
                </span>
                <h2 className="home-serif text-2xl sm:text-3xl font-semibold text-[#FFFDF5]">
                  Địa điểm ăn uống &amp; tham quan gần sự kiện
                </h2>
                <p className="text-xs sm:text-sm text-[#CBD9DA]/76 mt-1">
                  Gợi ý các địa điểm trong bán kính 3km quanh{" "}
                  {event.locationName || "khu vực tổ chức"}
                </p>
              </div>
              <Link
                href="/khampha"
                className="text-xs font-mono uppercase tracking-[0.16em] font-semibold text-[#E6D9B7] hover:text-[#FFFDF5] whitespace-nowrap transition-colors"
              >
                Khám phá thêm &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {nearbyPlaces.map((p) => (
                <Link
                  key={p.place_id}
                  href={`/places/${p.place_id}`}
                  className="group rounded-[18px] bg-[#081C25]/82 backdrop-blur-md border border-[#E6D9B7]/20 hover:border-[#E6D9B7]/55 p-5 shadow-[0_14px_36px_rgba(2,10,15,0.36)] transition-all hover:-translate-y-1 flex flex-col justify-between gap-3.5"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-[11px] font-semibold mb-2.5">
                      <span className="inline-flex items-center rounded-full bg-[#216B70]/35 border border-[#69A5A3]/40 text-[#A7E4DF] px-2.5 py-0.5 font-mono">
                        Cách {p.distance_km} km
                      </span>
                      {p.avg_rating > 0 && (
                        <span className="inline-flex items-center gap-1 text-[#F6B27B]">
                          <Star size={11.5} className="fill-[#E87B39] text-[#E87B39]" />
                          {Number(p.avg_rating).toFixed(1)}
                        </span>
                      )}
                    </div>
                    <h3 className="home-serif font-semibold text-base text-[#FFFDF5] group-hover:text-[#F5E6C4] transition line-clamp-1">
                      {p.name}
                    </h3>
                    <p className="text-xs text-[#CBD9DA]/72 mt-1.5 line-clamp-2 leading-relaxed">
                      {[p.address, p.district].filter(Boolean).join(", ")}
                    </p>
                  </div>
                  <span className="text-[11px] font-mono uppercase tracking-[0.14em] font-semibold text-[#E6D9B7] group-hover:text-[#FFFDF5] inline-flex items-center gap-1 pt-2 border-t border-[#E6D9B7]/14">
                    <span>Xem địa điểm</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ══ SỰ KIỆN KHÁC TẠI ĐÀ NẴNG ══ */}
        {relatedEvents.length > 0 && (
          <section className="mt-16 pt-12 border-t border-[#E6D9B7]/16">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
              <div>
                <span className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-[#E6D9B7] mb-1.5">
                  <span className="w-5 h-[1px] bg-[#E87B39]" />
                  <span>MORE ON THE DANANG STAGE</span>
                </span>
                <h2 className="home-serif text-2xl sm:text-3xl font-semibold text-[#FFFDF5]">
                  Sự kiện đáng chú ý khác tại Đà Nẵng
                </h2>
                <p className="text-xs sm:text-sm text-[#CBD9DA]/76 mt-1">
                  Khám phá thêm các hoạt động văn hóa, âm nhạc và giải trí sắp
                  diễn ra
                </p>
              </div>
              <Link
                href="/su-kien"
                className="text-xs font-mono uppercase tracking-[0.16em] font-semibold text-[#E6D9B7] hover:text-[#FFFDF5] whitespace-nowrap transition-colors"
              >
                Xem tất cả &rarr;
              </Link>
            </div>

            <div className="event-ticket-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedEvents.map((item, idx) => (
                <EventCard
                  key={item.id || item.slug || idx}
                  event={item}
                  index={idx}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Modal Chỉ đường nội bộ DaNangGo khi sự kiện có liên kết địa điểm (placeId) */}
      {numericPlaceId && (
        <RouteDirectionsModal
          isOpen={directionsOpen}
          onClose={() => setDirectionsOpen(false)}
          destination={{
            place_id: numericPlaceId,
            name: event.locationName || event.name,
            address: fullAddress,
            latitude: event.latitude ?? null,
            longitude: event.longitude ?? null,
          }}
        />
      )}

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}
