'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  motion,
  useInView,
  useScroll,
  useTransform,
  useReducedMotion,
} from 'framer-motion';
import {
  CalendarDays,
  ArrowRight,
  RefreshCw,
  Sparkles,
  AlertCircle,
  MapPin,
  Clock,
  AlertTriangle,
  BellRing,
  Check,
  Star,
  Users,
} from 'lucide-react';
import {
  getHomeWeekendEvents,
  getDanangWeekendRange,
  filterPublicEvents,
  formatEventCardDate,
  isMultiDayEvent,
  isEventBookmarkedForReminder,
  toggleLocalEventReminder,
  MOCK_EVENTS,
} from '@/lib/api/events';
import { EVENT_TYPES, STATUS_LABELS, TICKET_TYPES, type Event } from '@/types/event';

const FALLBACK_EVENT_IMAGE =
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=90&auto=format&fit=crop';

function getInitialWeekendState(): { events: Event[]; isFallbackUpcoming: boolean } {
  const now = new Date();
  const weekend = filterPublicEvents(MOCK_EVENTS, { datePreset: 'THIS_WEEKEND' }, now);
  if (weekend.length > 0) {
    return { events: weekend.slice(0, 4), isFallbackUpcoming: false };
  }
  const upcoming = filterPublicEvents(MOCK_EVENTS, { datePreset: 'UPCOMING' }, now);
  return {
    events: (upcoming.length > 0 ? upcoming : MOCK_EVENTS).slice(0, 4),
    isFallbackUpcoming: true,
  };
}

export default function WeekendEventsSection() {
  const initial = useMemo(() => getInitialWeekendState(), []);
  const [events, setEvents] = useState<Event[]>(initial.events);
  const [isFallbackUpcoming, setIsFallbackUpcoming] = useState(initial.isFallbackUpcoming);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWeekendEvents = useCallback(async (signal?: AbortSignal, showSpinner = false) => {
    if (showSpinner) setLoading(true);
    setError(null);
    try {
      const result = await getHomeWeekendEvents(4, signal);
      if (signal?.aborted) return;
      setEvents(result.events);
      setIsFallbackUpcoming(result.isFallbackUpcoming);
    } catch (err) {
      if (signal?.aborted) return;
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể tải danh sách sự kiện cuối tuần. Vui lòng thử lại.',
      );
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadWeekendEvents(controller.signal, false);
    return () => controller.abort();
  }, [loadWeekendEvents]);

  // Định dạng khoảng ngày Thứ Bảy - Chủ Nhật tuần này theo giờ Đà Nẵng
  const weekendRangeLabel = (() => {
    const { startMs, endMs } = getDanangWeekendRange();
    const fmt = new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      day: '2-digit',
      month: '2-digit',
    });
    return `${fmt.format(new Date(startMs))} – ${fmt.format(new Date(endMs))}`;
  })();

  const headingRef = useRef<HTMLHeadingElement>(null);
  const reducedMotion = useReducedMotion();
  const isHeadingInView = useInView(headingRef, {
    once: true,
    margin: '120px 0px 120px 0px',
    amount: 0.05,
  });

  // Phase C & D: Outline-to-Solid transition + One-shot Champagne Light Sweep on "ĐÀ NẴNG"
  const [isOutlineSolid, setIsOutlineSolid] = useState(true);
  const [isSerifShimmering, setIsSerifShimmering] = useState(false);

  useEffect(() => {
    if (reducedMotion || !isHeadingInView) return;
    setIsOutlineSolid(true);
    const shimmerStartTimer = setTimeout(() => setIsSerifShimmering(true), 420);
    const shimmerEndTimer = setTimeout(() => setIsSerifShimmering(false), 2100);
    return () => {
      clearTimeout(shimmerStartTimer);
      clearTimeout(shimmerEndTimer);
    };
  }, [isHeadingInView, reducedMotion]);

  return (
    <section
      id="cuoi-tuan-nay-o-da-nang"
      aria-labelledby="weekend-events-heading"
      className="relative pt-8 pb-10 lg:pt-12 lg:pb-12 overflow-hidden"
    >
      <div className="home-container relative z-10">
        {/* Header block matching the reference mockup with V10.0 4-Phase Kinetic Typography (Sections 13, 14, 15) */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-9 lg:mb-12">
          <div className="max-w-2xl">
            {/* Eyebrow with thin Sunset Orange horizontal line & generous bottom margin so Vietnamese diacritics never touch */}
            <motion.div
              initial={{ opacity: 0.9, y: reducedMotion ? 0 : 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-3 mb-5"
            >
              <span className="w-7 h-[1.5px] bg-[#CB712D] shrink-0" aria-hidden="true" />
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-[#35474C]">
                ĐIỂM HẸN ĐÀ NẴNG &middot;{' '}
                {isFallbackUpcoming
                  ? 'SỰ KIỆN NỔI BẬT'
                  : `SỰ KIỆN NỔI BẬT (${weekendRangeLabel})`}
              </span>
            </motion.div>

            {/* Two-line Mixed-Font Heading with 100% guaranteed visibility for "CUỐI TUẦN NÀY Ở ĐÀ NẴNG" */}
            <h2
              ref={headingRef}
              id="weekend-events-heading"
              className="leading-[1.12] tracking-[-0.02em]"
            >
              <span className="block font-extrabold uppercase text-[#12383D] text-[clamp(2rem,4.3vw,3.5rem)]">
                CUỐI TUẦN NÀY
              </span>
              <span className="block mt-1 text-[clamp(2rem,4.3vw,3.5rem)]">
                <span className="font-extrabold uppercase text-[#12383D]">
                  Ở{' '}
                </span>
                <span
                  style={{ color: '#CB712D', WebkitTextFillColor: '#CB712D' }}
                  className="inline-block home-serif italic font-normal text-[#CB712D] text-[clamp(2.15rem,4.6vw,3.75rem)] leading-[1.24] tracking-[0.01em] pr-2"
                >
                  ĐÀ NẴNG
                </span>
              </span>
            </h2>

            <motion.p
              initial={{ opacity: 0.92, y: reducedMotion ? 0 : 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{
                duration: 0.6,
                delay: 0.16,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="text-sm sm:text-[15.5px] text-[#3F4E53] leading-relaxed mt-3.5 max-w-xl"
            >
              {isFallbackUpcoming
                ? 'Gợi ý những sự kiện, trải nghiệm và hoạt động đặc sắc nhất tại Đà Nẵng sắp diễn ra.'
                : 'Gợi ý những sự kiện, trải nghiệm và hoạt động đặc sắc nhất tại Đà Nẵng trong cuối tuần này.'}
            </motion.p>
          </div>

          {/* Action buttons on the right with V10.0 Premium Micro-Interactions (Section 28) */}
          <motion.div
            initial={{ opacity: 0.92, y: reducedMotion ? 0 : 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{
              duration: 0.6,
              delay: 0.2,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="flex flex-wrap items-center gap-3 shrink-0"
          >
            <Link
              href="/su-kien?date=THIS_WEEKEND"
              className="group/btn luxury-btn-sweep inline-flex items-center gap-2 bg-[#FFF9EF] hover:bg-white active:scale-[0.97] text-[#1E2B30] hover:text-[#12383D] font-semibold uppercase tracking-[0.08em] text-[11px] sm:text-xs px-4 py-3 rounded-[6px] border border-[#D8CFC0] hover:border-[#C9AB78] shadow-[0_2px_10px_rgba(18,56,61,0.05)] transition-all duration-250"
            >
              <CalendarDays className="w-3.5 h-3.5 text-[#CB712D] transition-transform duration-250 group-hover/btn:scale-105" />
              <span>Lịch sự kiện</span>
            </Link>
            <Link
              href="/su-kien"
              className="group/btn luxury-btn-sweep inline-flex items-center gap-2 bg-[#12383D] hover:bg-[#1A4B52] active:scale-[0.97] text-white font-semibold uppercase tracking-[0.08em] text-[11px] sm:text-xs px-5 py-3 rounded-[6px] shadow-[0_6px_18px_rgba(18,56,61,0.16)] transition-all duration-250"
            >
              <span>Xem tất cả sự kiện</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-250 group-hover/btn:translate-x-1" />
            </Link>
          </motion.div>
        </div>

        {/* Trạng thái đang tải (Skeleton) */}
        {loading && (
          <div
            role="status"
            aria-label="Đang tải sự kiện cuối tuần"
            className="rounded-[18px] border border-[#E6D9B7]/25 bg-[#0B212A] overflow-hidden animate-pulse grid lg:grid-cols-12 min-h-[440px]"
          >
            <div className="lg:col-span-6 min-h-[260px] bg-[#12313D]" />
            <div className="lg:col-span-6 p-7 sm:p-9 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="h-4 w-28 bg-white/10 rounded-full" />
                <div className="h-8 w-4/5 bg-white/15 rounded-[6px]" />
                <div className="h-4 w-3/5 bg-white/10 rounded-[6px]" />
                <div className="h-20 w-full bg-white/10 rounded-[10px]" />
              </div>
              <div className="pt-4 border-t border-white/10 flex justify-between">
                <div className="h-5 w-28 bg-white/10 rounded-[6px]" />
                <div className="h-11 w-40 bg-white/15 rounded-full" />
              </div>
            </div>
          </div>
        )}

        {/* Trạng thái lỗi */}
        {!loading && error && (
          <div
            role="alert"
            className="rounded-[10px] border border-red-200 bg-white p-6 sm:p-8 text-center max-w-xl mx-auto"
          >
            <AlertCircle className="w-9 h-9 text-red-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-[#1A1A1A] mb-1">
              Không thể tải sự kiện cuối tuần
            </h3>
            <p className="text-xs sm:text-sm text-[#6B6B6B] mb-4">{error}</p>
            <button
              type="button"
              onClick={() => void loadWeekendEvents(undefined, true)}
              className="inline-flex items-center gap-2 bg-[#12383D] hover:bg-[#1A4B52] text-white text-xs sm:text-sm font-medium px-5 py-2.5 rounded-[6px] transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Thử lại
            </button>
          </div>
        )}

        {/* Trạng thái trống */}
        {!loading && !error && events.length === 0 && (
          <div className="rounded-[10px] border border-[#E4DDD0] bg-[#FFF9EF] p-8 text-center">
            <CalendarDays className="w-9 h-9 text-[#6B6B6B] mx-auto mb-3 stroke-[1.5]" />
            <h3 className="home-card-title mb-1">
              Chưa có sự kiện nào được công bố
            </h3>
            <p className="text-sm text-[#6B6B6B] mb-5 max-w-lg mx-auto">
              Các sự kiện mới tại Đà Nẵng đang được cập nhật. Bạn có thể xem trang danh sách sự kiện để tra cứu thêm.
            </p>
            <Link
              href="/su-kien"
              className="inline-flex items-center gap-1.5 bg-[#12383D] hover:bg-[#1A4B52] text-white text-xs sm:text-sm font-medium px-5 py-2.5 rounded-[6px] transition"
            >
              Khám phá trang Sự kiện
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Featured Horizontal Card giống hệt thiết kế mẫu + Dải sự kiện phụ nếu có > 1 sự kiện */}
        {!loading && !error && events.length >= 1 && (
          <div className="space-y-6">
            <FeaturedSingleWeekendEvent event={events[0]} />

            {events.length > 1 && (
              <div
                className={`grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 ${
                  events.length - 1 === 1
                    ? 'lg:grid-cols-1 max-w-2xl'
                    : events.length - 1 === 2
                    ? 'lg:grid-cols-2'
                    : 'lg:grid-cols-3'
                }`}
              >
                {events.slice(1).map((event, index) => (
                  <EditorialWeekendEventCard
                    key={event.id || event.slug || index}
                    event={event}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * FeaturedSingleWeekendEvent — V10.0 Sections 16, 17, 18, 19:
 * - Card Surface: Warm Pearl Cream (#FFF9EF), fine Champagne border, 12px radius, soft natural shadow, one-shot border sweep on entrance.
 * - Stage 1–4 Cinematic Beach Image Reveal:
 *   1. Safe Initial Image Window (never blank)
 *   2. Mask expansion + 1.08 -> 1.00 camera settle
 *   3. Scroll-linked internal camera movement (-18px -> +18px)
 *   4. Subtle Golden Hour reflection sweep on reveal completion
 * - 7-Step Staggered Right Column Content Reveal (Category/Day -> Line-mask Title -> Location -> Date -> Description -> Highlight Box -> Audience & CTA)
 */
function FeaturedSingleWeekendEvent({ event }: { event: Event }) {
  const [imgError, setImgError] = useState(false);
  const [reminded, setReminded] = useState(false);
  const [cardSweeping, setCardSweeping] = useState(false);
  const [goldenReflectionActive, setGoldenReflectionActive] = useState(false);

  const cardRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const isCardInView = useInView(cardRef, {
    once: true,
    margin: '40px 0px -40px 0px',
    amount: 0.15,
  });

  // Stage 3: Scroll-linked internal camera movement inside the beach image (15–35px range)
  const { scrollYProgress: cardScrollProgress } = useScroll({
    target: cardRef,
    offset: ['start end', 'end start'],
  });
  const imageCameraY = useTransform(
    cardScrollProgress,
    [0, 1],
    reducedMotion ? [0, 0] : [20, -20],
  );

  useEffect(() => {
    setReminded(isEventBookmarkedForReminder(event));
    const sync = () => setReminded(isEventBookmarkedForReminder(event));
    window.addEventListener('dananggo:event-reminders-changed', sync);
    return () => window.removeEventListener('dananggo:event-reminders-changed', sync);
  }, [event]);

  // Trigger one-shot card border sweep & Stage 4 Golden Reflection on entrance completion
  useEffect(() => {
    if (!isCardInView || reducedMotion) return;
    const sweepStart = setTimeout(() => {
      setCardSweeping(true);
      setGoldenReflectionActive(true);
    }, 520);
    const sweepEnd = setTimeout(() => {
      setCardSweeping(false);
      setGoldenReflectionActive(false);
    }, 2050);
    return () => {
      clearTimeout(sweepStart);
      clearTimeout(sweepEnd);
    };
  }, [isCardInView, reducedMotion]);

  const detailHref = `/su-kien/${encodeURIComponent(event.slug || event.id || '')}`;
  const categoryLabel =
    EVENT_TYPES[event.eventType as keyof typeof EVENT_TYPES] || event.eventType || 'Sự kiện';
  const hasSpecialStatus =
    event.status === 'RESCHEDULED' || event.status === 'POSTPONED' || event.status === 'CANCELLED';

  const highlightCallout =
    hasSpecialStatus && event.changeNote
      ? event.changeNote
      : 'Tâm điểm cuối tuần với chuỗi hoạt động sôi động trên bãi biển, trải nghiệm văn hóa địa phương và không khí lễ hội rực rỡ bên biển Đà Nẵng.';

  const audienceText =
    event.ticketType === 'PAID'
      ? `${event.ticketPriceDisplay || 'Vé tham dự'} · Gia đình · Nhóm bạn`
      : 'Gia đình · Nhóm bạn';

  return (
    <motion.article
      ref={cardRef}
      initial={{ opacity: 0.94, y: reducedMotion ? 0 : 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative luxury-border-sweep luxury-shimmer-frame rounded-[18px] bg-[#081C25] border border-[#E6D9B7]/35 hover:border-[#E6D9B7]/80 shadow-[0_24px_64px_rgba(12,34,42,0.22)] hover:shadow-[0_32px_80px_rgba(12,34,42,0.32)] overflow-hidden transition-all duration-500 ${
        cardSweeping ? 'is-reveal-sweeping' : ''
      }`}
    >
      {/* Subtle Champagne top rim reflection */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[1px] z-30 bg-gradient-to-r from-transparent via-[#E6D9B7]/55 to-transparent"
      />

      {/* Full-Bleed Panoramic Background Image — preserves all 4-Stage Cinematic Beach Image Reveal animations */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-[#081C25]">
        {/* Stage 1 & 2: Image Window Expansion */}
        <motion.div
          initial={reducedMotion ? { scale: 1 } : { scale: 1.07 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 1.15, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full h-full overflow-hidden"
        >
          {/* Stage 3: Internal Camera Scroll Movement Wrapper */}
          <motion.div
            style={{ y: imageCameraY }}
            className="relative w-full h-[112%] -top-[6%] will-change-transform"
          >
            {/* Separate Hover Zoom Wrapper (1.04x zoom) */}
            <div className="relative w-full h-full group-hover:scale-[1.04] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]">
              <Image
                src={imgError || !event.imageUrl ? FALLBACK_EVENT_IMAGE : event.imageUrl}
                alt={event.name}
                fill
                unoptimized
                onError={() => setImgError(true)}
                className="object-cover object-left lg:object-[32%_50%]"
                sizes="(max-width: 1024px) 100vw, 1280px"
              />
            </div>
          </motion.div>

          {/* Stage 4: Subtle Golden Hour Reflection Sweep upon reveal completion */}
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-0 transition-opacity duration-1000 ${
              goldenReflectionActive ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              background:
                'linear-gradient(115deg, transparent 20%, rgba(255,249,239,0.22) 46%, rgba(234,180,125,0.18) 54%, transparent 78%)',
            }}
          />
        </motion.div>

        {/* Seamless Desktop Horizontal Deep-Ocean Editorial Scrim (leaves left coastal view luminous, melts into dark ocean panel on right) */}
        <div
          aria-hidden="true"
          className="pointer-events-none hidden lg:block absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(7,22,30,0.24) 0%, rgba(7,22,30,0.06) 28%, rgba(7,22,30,0.42) 44%, rgba(6,19,27,0.86) 56%, rgba(6,19,27,0.94) 74%, rgba(5,16,23,0.97) 100%)',
          }}
        />
        {/* Seamless Mobile/Tablet Vertical Deep-Ocean Editorial Scrim */}
        <div
          aria-hidden="true"
          className="pointer-events-none lg:hidden absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(7,22,30,0.38) 0%, rgba(7,22,30,0.08) 26%, rgba(6,19,27,0.78) 46%, rgba(6,19,27,0.95) 66%, rgba(5,16,23,0.98) 100%)',
          }}
        />
        {/* Subtle bottom coastal depth grounding */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(6,19,27,0.28) 0%, transparent 24%, transparent 72%, rgba(5,16,23,0.52) 100%)',
          }}
        />
      </div>

      {/* Main Responsive Layout Grid over Full-Bleed Canvas */}
      <div className="relative z-20 grid lg:grid-cols-12 min-h-[460px] lg:min-h-[490px]">
        {/* Cột trái (6.5 -> 6 cột): Không gian mở thưởng lãm ảnh biển + Badge nổi tinh tế */}
        <Link
          href={detailHref}
          aria-label={`Xem chi tiết sự kiện ${event.name}`}
          className="relative lg:col-span-6 min-h-[240px] sm:min-h-[300px] lg:min-h-full p-5 sm:p-6 flex flex-col justify-between"
        >
          {/* Top badges row */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            {hasSpecialStatus ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] px-3.5 py-1.5 rounded-full bg-[#B95218]/90 backdrop-blur-xs text-[#FFFDF5] border border-[#F6C89F]/40 shadow-[0_6px_18px_rgba(10,20,26,0.35)]">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {STATUS_LABELS[event.status]}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-[#CB712D]/92 backdrop-blur-xs text-[#FFFDF5] border border-[#F6C89F]/40 text-[11px] font-semibold uppercase tracking-[0.1em] px-3.5 py-1.5 rounded-full shadow-[0_6px_18px_rgba(203,113,45,0.38)]">
                <Star className="w-3.5 h-3.5 shrink-0 fill-current" />
                <span>NỔI BẬT</span>
              </span>
            )}

            <span className="inline-flex items-center gap-1.5 bg-[#081C25]/72 backdrop-blur-xs text-[#FFFDF5]/95 text-[11px] font-semibold uppercase tracking-[0.1em] px-3.5 py-1.5 rounded-full border border-[#E6D9B7]/30 shadow-[0_6px_18px_rgba(6,18,24,0.35)]">
              <CalendarDays className="w-3.5 h-3.5 text-[#E6D9B7] shrink-0" />
              <span>CUỐI TUẦN NÀY</span>
            </span>
          </div>

          {/* Subtle editorial caption at bottom-left on desktop */}
          <div className="hidden lg:flex items-center gap-2.5 text-[10.5px] font-mono uppercase tracking-[0.22em] text-[#FFFDF5]/78">
            <span className="w-6 h-[1px] bg-[#E6D9B7]/70" aria-hidden="true" />
            <span>DANANG WEEKEND SHOWCASE</span>
          </div>
        </Link>

        {/* Cột phải (6 cột): Nội dung biên tập cao cấp hòa mượt vào nền biển sâu (7-Step Staggered Reveal) */}
        <div className="lg:col-span-6 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
          <div>
            {/* Step 1: Category & Day meta bar */}
            <motion.div
              initial={{ opacity: 0.92, y: reducedMotion ? 0 : 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.5, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center justify-between gap-3 pb-3.5 mb-4 border-b border-[#E6D9B7]/22"
            >
              <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E6D9B7]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E87B39] shrink-0" aria-hidden="true" />
                <span>{categoryLabel}</span>
              </span>
              <span className="text-xs text-[#D5E4E4]/80 font-medium tracking-[0.02em]">
                Thứ 7 – Chủ Nhật
              </span>
            </motion.div>

            {/* Step 2: Event Title with Line-Mask Reveal & Vietnamese-safe padding */}
            <Link href={detailHref} className="block mb-4 overflow-hidden pt-0.5 pb-1">
              <motion.h3
                initial={{ opacity: 0.92, y: reducedMotion ? 0 : 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.58, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                style={{ textShadow: '0 2px 16px rgba(4,14,20,0.6)' }}
                className="home-serif font-semibold text-[#FFFDF5] text-2xl sm:text-[28px] lg:text-[30px] leading-[1.26] group-hover:text-[#F5E6C4] transition-colors"
              >
                {event.name}
              </motion.h3>
            </Link>

            {/* Step 3 & 4: Địa điểm & Thời gian */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-4 text-[13.5px]">
              <motion.div
                initial={{ opacity: 0.92, y: reducedMotion ? 0 : 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.48, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center gap-2 text-[#F3F8F8]"
              >
                <MapPin className="w-4 h-4 text-[#C9B580] shrink-0" />
                <span className="font-medium">
                  {event.locationName || event.address || 'Công viên Biển Đông'}
                </span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0.92, y: reducedMotion ? 0 : 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.48, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center gap-2 text-[#D5E4E4]/85"
              >
                <CalendarDays className="w-4 h-4 text-[#C9B580] shrink-0" />
                <span>
                  {formatEventCardDate(event.startAt, event.endAt, event.isAllDay)}
                </span>
              </motion.div>
            </div>

            {/* Step 5: Mô tả ngắn */}
            <motion.p
              initial={{ opacity: 0.92, y: reducedMotion ? 0 : 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.52, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="text-[13.5px] sm:text-sm text-[#DCE8E8]/85 leading-relaxed mb-5"
            >
              {event.shortDescription}
            </motion.p>

            {/* Step 6: Khung thông báo / highlight dạng kính mờ Champagne tinh tế */}
            <motion.div
              initial={{ opacity: 0.92, y: reducedMotion ? 0 : 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.52, delay: 0.26, ease: [0.22, 1, 0.36, 1] }}
              className={`mb-6 rounded-[10px] backdrop-blur-xs px-4 py-3.5 flex items-start gap-3 border ${
                hasSpecialStatus
                  ? 'bg-[#E87B39]/[0.14] border-[#F0B47C]/35 border-l-2 border-l-[#E87B39]'
                  : 'bg-[#FFF8E9]/[0.08] border-[#E6D9B7]/25 border-l-2 border-l-[#C9B580]'
              }`}
            >
              <Sparkles className="w-4 h-4 text-[#F0B47C] shrink-0 mt-0.5" />
              <p className="text-xs sm:text-[13px] text-[#FFF4E0]/92 italic leading-relaxed">
                {highlightCallout}
              </p>
            </motion.div>
          </div>

          {/* Step 7: Hàng cuối — Phù hợp với + Nút nhắc lịch + CTA Pearl Ivory sang trọng */}
          <motion.div
            initial={{ opacity: 0.92, y: reducedMotion ? 0 : 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.52, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="pt-4 border-t border-[#E6D9B7]/20 flex flex-wrap items-center justify-between gap-3.5"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#FFF8E9]/10 border border-[#E6D9B7]/25 flex items-center justify-center text-[#E6D9B7] shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] text-[#B9CECE]/80 leading-tight">Phù hợp với</p>
                <p className="text-xs sm:text-[13px] font-semibold text-[#FFFDF5] mt-0.5">
                  {audienceText}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {event.status !== 'CANCELLED' && event.status !== 'POSTPONED' && (
                <button
                  type="button"
                  onClick={() => setReminded(toggleLocalEventReminder(event))}
                  title={
                    reminded
                      ? 'Đã bật thông báo khi sự kiện sắp diễn ra (Bấm để tắt)'
                      : 'Nhắc tôi khi sự kiện sắp diễn ra'
                  }
                  aria-label="Nhắc tôi khi sự kiện sắp diễn ra"
                  className={`inline-flex items-center justify-center w-10 h-10 rounded-full border transition-colors cursor-pointer ${
                    reminded
                      ? 'bg-[#E6D9B7]/22 border-[#E6D9B7] text-[#FFFDF5]'
                      : 'bg-[#FFF8E9]/8 hover:bg-[#FFF8E9]/16 border-[#E6D9B7]/30 text-[#E6D9B7] hover:text-[#FFFDF5]'
                  }`}
                >
                  {reminded ? <Check size={15} /> : <BellRing size={15} />}
                </button>
              )}

              <Link
                href={detailHref}
                className="group/cta luxury-btn-sweep inline-flex items-center gap-2.5 bg-[#FFF8E9] hover:bg-white active:scale-[0.97] text-[#102832] border border-[#E6D9B7]/75 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.12em] px-5 sm:px-6 py-3 rounded-full shadow-[0_10px_28px_rgba(4,14,20,0.42)] transition-all duration-250"
              >
                <span>Khám phá ngay</span>
                <ArrowRight
                  size={14}
                  className="text-[#0F4C5C] transition-transform duration-250 group-hover/cta:translate-x-1"
                />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.article>
  );
}

function EditorialWeekendEventCard({ event }: { event: Event }) {
  const [imgError, setImgError] = useState(false);
  const [reminded, setReminded] = useState(false);

  useEffect(() => {
    setReminded(isEventBookmarkedForReminder(event));
    const sync = () => setReminded(isEventBookmarkedForReminder(event));
    window.addEventListener('dananggo:event-reminders-changed', sync);
    return () => window.removeEventListener('dananggo:event-reminders-changed', sync);
  }, [event]);

  const detailHref = `/su-kien/${encodeURIComponent(event.slug || event.id || '')}`;
  const categoryLabel =
    EVENT_TYPES[event.eventType as keyof typeof EVENT_TYPES] || event.eventType || 'Sự kiện';
  const multiDay = isMultiDayEvent(event);
  const hasSpecialStatus =
    event.status === 'RESCHEDULED' || event.status === 'POSTPONED' || event.status === 'CANCELLED';

  const ticketHeadline =
    event.ticketType === 'PAID'
      ? event.ticketPriceDisplay || 'Có phí'
      : event.ticketType === 'FREE_REGISTRATION'
        ? 'Miễn phí'
        : event.ticketType === 'FREE_OPEN'
          ? 'Miễn phí'
          : TICKET_TYPES[event.ticketType] || 'Đang cập nhật';

  const ticketSubnote =
    event.ticketType === 'PAID'
      ? '/vé tham dự'
      : event.ticketType === 'FREE_REGISTRATION'
        ? 'Cần đăng ký trước'
        : event.ticketType === 'FREE_OPEN'
          ? 'Vào cửa tự do'
          : '';

  return (
    <article className="group relative luxury-border-sweep luxury-shimmer-frame rounded-[14px] bg-[#081C25] border border-[#E6D9B7]/28 hover:border-[#E6D9B7]/75 shadow-[0_18px_46px_rgba(12,34,42,0.18)] hover:shadow-[0_26px_60px_rgba(12,34,42,0.28)] overflow-hidden flex flex-col justify-between min-h-[380px] h-full transition-all duration-400 hover:-translate-y-1">
      {/* Subtle Champagne top rim reflection */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[1px] z-20 bg-gradient-to-r from-transparent via-[#E6D9B7]/45 to-transparent"
      />

      {/* Full-Bleed Image Background */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-[#081C25]">
        <Image
          src={imgError || !event.imageUrl ? FALLBACK_EVENT_IMAGE : event.imageUrl}
          alt={event.name}
          fill
          unoptimized
          onError={() => setImgError(true)}
          className="object-cover group-hover:scale-[1.05] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(7,22,30,0.42) 0%, rgba(7,22,30,0.08) 28%, rgba(6,19,27,0.68) 54%, rgba(6,19,27,0.92) 76%, rgba(5,16,22,0.97) 100%)',
          }}
        />
      </div>

      {/* Top Badges */}
      <div className="relative z-20 p-4 flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 max-w-[75%]">
          {hasSpecialStatus ? (
            <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] px-3 py-1 rounded-full bg-[#B95218]/90 backdrop-blur-xs text-[#FFFDF5] border border-[#F6C89F]/35">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              {STATUS_LABELS[event.status]}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-[#CB712D]/90 backdrop-blur-xs text-[#FFFDF5] border border-[#F6C89F]/35 text-[10px] font-semibold uppercase tracking-[0.08em] px-3 py-1 rounded-full">
              <Star className="w-3 h-3 shrink-0 fill-current" />
              {categoryLabel}
            </span>
          )}
        </div>

        {multiDay && (
          <span className="inline-flex items-center gap-1 bg-[#081C25]/75 backdrop-blur-xs text-[#FFFDF5]/95 text-[10px] font-medium px-2.5 py-1 rounded-full border border-[#E6D9B7]/30 shrink-0">
            <Clock className="w-3 h-3 text-[#E6D9B7] shrink-0" />
            Nhiều ngày
          </span>
        )}
      </div>

      {/* Bottom Editorial Content Overlay */}
      <div className="relative z-20 mt-auto p-5 flex flex-col justify-end">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#E6D9B7] truncate">
            <CalendarDays className="w-3.5 h-3.5 text-[#E87B39] shrink-0" />
            <span className="truncate">
              {formatEventCardDate(event.startAt, event.endAt, event.isAllDay)}
            </span>
          </span>
          {event.district && (
            <span className="text-[11px] text-[#CBD9DA]/80 truncate shrink-0">
              {event.district}
            </span>
          )}
        </div>

        <Link href={detailHref}>
          <h3
            style={{ textShadow: '0 2px 12px rgba(4,14,20,0.65)' }}
            className="home-serif font-semibold text-lg sm:text-[19px] leading-[1.3] text-[#FFFDF5] group-hover:text-[#F5E6C4] transition-colors line-clamp-2 mb-2"
          >
            {event.name}
          </h3>
        </Link>

        <div className="flex items-center gap-1.5 text-xs text-[#D5E4E4]/85 mb-2">
          <MapPin size={13} className="text-[#C9B580] shrink-0" />
          <span className="truncate">
            {event.locationName || event.address || 'Đà Nẵng'}
          </span>
        </div>

        <p className="text-xs text-[#CBD9DA]/80 line-clamp-2 leading-relaxed mb-4">
          {event.shortDescription}
        </p>

        <div className="pt-3.5 border-t border-[#E6D9B7]/20 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-sm text-[#F2DFB4] leading-tight truncate">
              {ticketHeadline}
            </p>
            {ticketSubnote && (
              <p className="text-[10.5px] text-[#CBD9DA]/75 truncate">{ticketSubnote}</p>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {event.status !== 'CANCELLED' && event.status !== 'POSTPONED' && (
              <button
                type="button"
                onClick={() => setReminded(toggleLocalEventReminder(event))}
                title={
                  reminded
                    ? 'Đã bật thông báo khi sự kiện sắp diễn ra (Bấm để tắt)'
                    : 'Nhắc tôi khi sự kiện sắp diễn ra'
                }
                aria-label="Nhắc tôi khi sự kiện sắp diễn ra"
                className={`inline-flex items-center justify-center w-8 h-8 rounded-full border transition-colors cursor-pointer ${
                  reminded
                    ? 'bg-[#E6D9B7]/22 border-[#E6D9B7] text-[#FFFDF5]'
                    : 'bg-[#FFF8E9]/10 hover:bg-[#FFF8E9]/18 border-[#E6D9B7]/30 text-[#E6D9B7]'
                }`}
              >
                {reminded ? <Check size={14} /> : <BellRing size={14} />}
              </button>
            )}

            <Link
              href={detailHref}
              className="group/cta luxury-btn-sweep inline-flex items-center gap-1.5 bg-[#FFF8E9] hover:bg-white active:scale-[0.97] text-[#102832] text-xs font-semibold px-3.5 py-2 rounded-full transition-all shrink-0"
            >
              <span>Khám phá</span>
              <ArrowRight
                size={13}
                className="text-[#0F4C5C] transition-transform duration-250 group-hover/cta:translate-x-1"
              />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
