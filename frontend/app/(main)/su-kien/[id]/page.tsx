'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
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
} from 'lucide-react';
import Footer from '@/components/layout/Footer';
import EventCard from '@/components/events/EventCard';
import RouteDirectionsModal from '@/components/places/RouteDirectionsModal';
import {
  EVENT_TYPES,
  STATUS_LABELS,
  TICKET_TYPES,
  type Event,
} from '@/types/event';
import {
  getPublicEventDetail,
  getPublicEvents,
  formatEventDateRange,
  isMultiDayEvent,
} from '@/lib/api/events';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1600&q=90&auto=format&fit=crop';

function isValidHttpUrl(url?: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export default function EventDetailPage() {
  const params = useParams();
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [event, setEvent] = useState<Event | null>(null);
  const [relatedEvents, setRelatedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [directionsOpen, setDirectionsOpen] = useState(false);

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
          const allPublic = await getPublicEvents({}, signal);
          if (signal?.aborted) return;
          const others = allPublic.events
            .filter((item) => item.id !== detail.id && item.slug !== detail.slug)
            .slice(0, 4);
          setRelatedEvents(others);
        }
      } catch (err) {
        if (signal?.aborted) return;
        setError(
          err instanceof Error
            ? err.message
            : 'Không thể tải thông tin chi tiết sự kiện. Vui lòng thử lại.',
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [rawId],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadDetail(controller.signal);
    return () => controller.abort();
  }, [loadDetail]);

  const handleCopyShareLink = () => {
    if (typeof window !== 'undefined') {
      void navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // 1. TRẠNG THÁI ĐANG TẢI
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 pb-20">
        <div
          role="status"
          aria-label="Đang tải chi tiết sự kiện"
          className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6 animate-pulse"
        >
          <div className="h-5 w-64 bg-slate-200 rounded" />
          <div className="h-80 sm:h-96 bg-slate-200 rounded-3xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-8 w-3/4 bg-slate-200 rounded-xl" />
              <div className="h-4 w-full bg-slate-200 rounded" />
              <div className="h-4 w-5/6 bg-slate-200 rounded" />
              <div className="h-48 w-full bg-slate-200 rounded-2xl" />
            </div>
            <div className="h-72 bg-slate-200 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // 2. TRẠNG THÁI LỖI TẢI DỮ LIỆU
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 pt-28 pb-20 px-4">
        <div
          role="alert"
          className="max-w-lg mx-auto bg-white rounded-3xl border border-red-200 p-8 text-center shadow-xs"
        >
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-[#0f2942] mb-2">
            Lỗi tải thông tin sự kiện
          </h1>
          <p className="text-sm text-slate-600 mb-6">{error}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => void loadDetail()}
              className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Thử lại
            </button>
            <Link
              href="/su-kien"
              className="inline-flex items-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold px-5 py-2.5 rounded-xl transition"
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
      <div className="min-h-screen bg-slate-50 pt-28 pb-20 px-4">
        <div className="max-w-lg mx-auto bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-[#0f2942] mb-2">
            Không tìm thấy sự kiện
          </h1>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            Sự kiện bạn đang tìm kiếm không tồn tại hoặc đang ở trạng thái bản nháp chưa được công bố.
          </p>
          <Link
            href="/su-kien"
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-6 py-3 rounded-xl transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại danh sách sự kiện
          </Link>
        </div>
      </div>
    );
  }

  const categoryLabel =
    EVENT_TYPES[event.eventType as keyof typeof EVENT_TYPES] || event.eventType || 'Sự kiện';
  const multiDay = isMultiDayEvent(event);

  // Quy tắc nghiệp vụ: Ẩn nút vé và đăng ký khi sự kiện bị hoãn (POSTPONED) hoặc hủy (CANCELLED)
  const isPostponedOrCancelled =
    event.status === 'POSTPONED' || event.status === 'CANCELLED';
  const canRegisterOrBuyTicket = !isPostponedOrCancelled;

  const fullAddress = [event.locationName, event.address, event.district, 'Đà Nẵng']
    .filter(Boolean)
    .join(', ');

  const googleMapsUrl =
    event.latitude && event.longitude
      ? `https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`
      : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress)}`;

  const numericPlaceId =
    event.placeId && /^\d+$/.test(event.placeId) ? Number(event.placeId) : null;

  const handleDirectionsClick = () => {
    if (numericPlaceId) {
      setDirectionsOpen(true);
    } else if (typeof window !== 'undefined') {
      window.open(googleMapsUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ══ HERO SECTION ══ */}
      <section
        data-navbar-overlay="true"
        className="relative bg-[#071a2e] pt-24 pb-12 sm:pt-28 sm:pb-16 text-white overflow-hidden"
      >
        <Image
          src={imgError || !event.imageUrl ? FALLBACK_IMAGE : event.imageUrl}
          alt={event.name}
          fill
          priority
          unoptimized
          onError={() => setImgError(true)}
          className="object-cover opacity-35 blur-[2px] scale-105"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#071a2e] via-[#071a2e]/80 to-[#071a2e]/65" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm text-white/75 mb-6"
          >
            <Link href="/" className="hover:text-white transition">
              Trang chủ
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-white/50" />
            <Link href="/su-kien" className="hover:text-white transition">
              Sự kiện
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-white/50" />
            <span className="text-cyan-300 font-medium truncate max-w-xs sm:max-w-md">
              {event.name}
            </span>
          </nav>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 text-xs font-bold px-3 py-1 rounded-full">
              {categoryLabel}
            </span>

            <span
              className={`text-xs font-bold px-3 py-1 rounded-full ${
                event.status === 'CANCELLED'
                  ? 'bg-red-600 text-white'
                  : event.status === 'POSTPONED'
                    ? 'bg-orange-500 text-white'
                    : event.status === 'RESCHEDULED'
                      ? 'bg-amber-500 text-white'
                      : 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-200'
              }`}
            >
              {STATUS_LABELS[event.status]}
            </span>

            {event.isFeatured && (
              <span className="inline-flex items-center gap-1 bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs font-bold px-3 py-1 rounded-full">
                <Sparkles className="w-3.5 h-3.5" />
                Sự kiện nổi bật
              </span>
            )}

            {multiDay && (
              <span className="inline-flex items-center gap-1 bg-white/15 border border-white/25 text-white text-xs font-semibold px-3 py-1 rounded-full">
                <Clock className="w-3.5 h-3.5" />
                Sự kiện kéo dài nhiều ngày
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold leading-tight max-w-4xl mb-4">
            {event.name}
          </h1>

          <p className="text-white/85 text-sm sm:text-base max-w-3xl leading-relaxed mb-6">
            {event.shortDescription}
          </p>

          {/* Thông tin nhanh trên Hero */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm text-white/90">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/15">
              <Calendar className="w-4 h-4 text-cyan-300 shrink-0" />
              <span>{formatEventDateRange(event.startAt, event.endAt, event.isAllDay)}</span>
            </div>

            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/15">
              <MapPin className="w-4 h-4 text-orange-300 shrink-0" />
              <span>
                {event.locationName}
                {event.district ? ` · ${event.district}` : ''}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ══ MAIN CONTENT ══ */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* BANNER THÔNG BÁO ĐỔI LỊCH / TẠM HOÃN / ĐÃ HỦY (HIỂN THỊ RÕ RÀNG) */}
        {(event.status === 'RESCHEDULED' ||
          event.status === 'POSTPONED' ||
          event.status === 'CANCELLED') && (
          <div
            role="alert"
            className={`mb-8 rounded-2xl border-2 p-5 sm:p-6 shadow-sm ${
              event.status === 'CANCELLED'
                ? 'bg-red-50 border-red-300 text-red-950'
                : event.status === 'POSTPONED'
                  ? 'bg-orange-50 border-orange-300 text-orange-950'
                  : 'bg-amber-50 border-amber-300 text-amber-950'
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  event.status === 'CANCELLED'
                    ? 'bg-red-600 text-white'
                    : event.status === 'POSTPONED'
                      ? 'bg-orange-600 text-white'
                      : 'bg-amber-500 text-white'
                }`}
              >
                {event.status === 'CANCELLED' ? (
                  <Ban className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>

              <div className="flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base sm:text-lg font-extrabold">
                    {event.status === 'CANCELLED'
                      ? 'Sự kiện này đã bị hủy'
                      : event.status === 'POSTPONED'
                        ? 'Sự kiện đang tạm hoãn'
                        : 'Sự kiện đã thay đổi lịch tổ chức'}
                  </h2>
                  <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded-full bg-black/10">
                    {STATUS_LABELS[event.status]}
                  </span>
                </div>

                <p className="text-sm leading-relaxed font-medium">
                  {event.changeNote ||
                    (event.status === 'CANCELLED'
                      ? 'Ban tổ chức đã thông báo hủy sự kiện này. Hoạt động bán vé và đăng ký tham gia đã đóng.'
                      : event.status === 'POSTPONED'
                        ? 'Sự kiện tạm hoãn chờ lịch mới từ Ban tổ chức. Cổng đăng ký và bán vé hiện đang tạm đóng.'
                        : `Sự kiện đã được cập nhật sang khung giờ mới: ${formatEventDateRange(
                            event.startAt,
                            event.endAt,
                            event.isAllDay,
                          )}.`)}
                </p>

                {event.status === 'RESCHEDULED' && (
                  <p className="text-xs sm:text-sm font-bold pt-1">
                    ⏰ Lịch mới áp dụng (Giờ Đà Nẵng UTC+7):{' '}
                    <span className="underline">
                      {formatEventDateRange(event.startAt, event.endAt, event.isAllDay)}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* ── CỘT TRÁI (2/3): ẢNH BÌA, CHƯƠNG TRÌNH, ĐỊA ĐIỂM, NGUỒN CHÍNH THỨC ── */}
          <div className="lg:col-span-2 space-y-8">
            {/* Ảnh chính */}
            <div className="relative rounded-3xl overflow-hidden shadow-md border border-slate-200 aspect-[16/9] bg-slate-100">
              <Image
                src={imgError || !event.imageUrl ? FALLBACK_IMAGE : event.imageUrl}
                alt={event.name}
                fill
                unoptimized
                onError={() => setImgError(true)}
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 66vw"
              />
            </div>

            {/* Nội dung chương trình & Mô tả chi tiết */}
            <section className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-4">
              <h2 className="text-xl font-bold text-[#0f2942] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-teal-600" />
                Nội dung &amp; Chương trình sự kiện
              </h2>

              <div className="prose prose-slate max-w-none text-slate-700 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                {event.description || event.shortDescription || 'Đang cập nhật chương trình chi tiết.'}
              </div>
            </section>

            {/* Địa điểm tổ chức & Liên kết địa điểm có sẵn trong App */}
            <section className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-[#0f2942] flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-teal-600" />
                  Địa điểm tổ chức
                </h2>

                {numericPlaceId && (
                  <Link
                    href={`/places/${numericPlaceId}`}
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3.5 py-1.5 rounded-full transition"
                  >
                    <span>Xem địa điểm trên DaNangGo</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                )}
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 sm:p-5 space-y-3">
                <h3 className="text-base font-bold text-[#0f2942]">
                  {event.locationName || 'Đà Nẵng'}
                </h3>
                <p className="text-sm text-slate-600">
                  📍 Địa chỉ: <span className="font-medium text-slate-800">{fullAddress}</span>
                </p>
                {event.district && (
                  <p className="text-xs font-semibold text-teal-700">
                    Khu vực: Quận / Huyện {event.district}, TP. Đà Nẵng
                  </p>
                )}

                <div className="pt-2 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleDirectionsClick}
                    className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <Navigation className="w-4 h-4" />
                    Chỉ đường đến sự kiện
                  </button>

                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl transition"
                  >
                    <span>Mở Google Maps</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </section>

            {/* Ban tổ chức & Nguồn thông tin chính thức */}
            <section className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-4">
              <h2 className="text-xl font-bold text-[#0f2942] flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-600" />
                Ban tổ chức &amp; Nguồn thông tin chính thức
              </h2>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                  <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Đơn vị tổ chức
                  </dt>
                  <dd className="font-bold text-[#0f2942]">
                    {event.organizerName || 'Ban tổ chức sự kiện Đà Nẵng'}
                  </dd>
                  {event.organizerContact && (
                    <dd className="text-xs text-slate-600 mt-1">{event.organizerContact}</dd>
                  )}
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                  <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Nguồn thông tin chính thức
                  </dt>
                  <dd className="mt-1">
                    {isValidHttpUrl(event.officialSourceUrl) ? (
                      <a
                        href={event.officialSourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-semibold text-teal-600 hover:text-teal-700 underline underline-offset-4 break-all"
                      >
                        <Globe className="w-4 h-4 shrink-0" />
                        <span>Xem cổng thông tin chính thức</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-slate-600">
                        Cập nhật bởi Cẩm nang Du lịch DaNangGo
                      </span>
                    )}
                  </dd>
                </div>
              </dl>
            </section>
          </div>

          {/* ── CỘT PHẢI (1/3): THẺ TÓM TẮT THỜI GIAN, VÉ & CÁC NÚT HÀNH ĐỘNG ── */}
          <aside className="lg:sticky lg:top-24 space-y-5">
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-md space-y-6">
              {/* Khối giá vé */}
              <div className="pb-5 border-b border-slate-100">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Thông tin vé tham dự
                </span>
                <div className="mt-1.5 flex items-baseline justify-between gap-2">
                  <p className="text-xl sm:text-2xl font-extrabold text-[#0f2942]">
                    {event.ticketType === 'PAID'
                      ? event.ticketPriceDisplay || 'Sự kiện có bán vé'
                      : TICKET_TYPES[event.ticketType]}
                  </p>
                </div>
                {event.ticketType !== 'PAID' && event.ticketPriceDisplay && (
                  <p className="text-xs font-semibold text-emerald-700 mt-1">
                    {event.ticketPriceDisplay}
                  </p>
                )}
              </div>

              {/* Chi tiết thời gian & địa điểm */}
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500">
                      Thời gian (Giờ Đà Nẵng UTC+7)
                    </p>
                    <p className="font-bold text-slate-900 mt-0.5">
                      {formatEventDateRange(event.startAt, event.endAt, event.isAllDay)}
                    </p>
                    {event.isAllDay && (
                      <span className="inline-block mt-1 text-[11px] font-semibold bg-teal-50 text-teal-700 px-2 py-0.5 rounded">
                        Diễn ra cả ngày
                      </span>
                    )}
                  </div>
                </div>

                {event.registrationDeadline && canRegisterOrBuyTicket && (
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500">Hạn chót đăng ký</p>
                      <p className="font-bold text-amber-800 mt-0.5">
                        {formatEventDateRange(event.registrationDeadline, '', false)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500">Địa điểm</p>
                    <p className="font-bold text-slate-900 mt-0.5">{event.locationName}</p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {[event.address, event.district].filter(Boolean).join(', ')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Ticket className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500">Hình thức tham gia</p>
                    <p className="font-bold text-slate-900 mt-0.5">
                      {TICKET_TYPES[event.ticketType]}
                    </p>
                  </div>
                </div>
              </div>

              {/* ── CÁC NÚT HÀNH ĐỘNG CHÍNH ── */}
              <div className="space-y-3 pt-2">
                {/* Khi sự kiện bị HOÃN hoặc HỦY: Ẩn hoàn toàn nút Vé và Đăng ký theo đúng yêu cầu */}
                {isPostponedOrCancelled ? (
                  <div className="rounded-2xl bg-slate-100 border border-slate-200 p-4 text-center space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      {event.status === 'CANCELLED'
                        ? 'Đã đóng đăng ký & bán vé (Sự kiện đã hủy)'
                        : 'Tạm đóng đăng ký & bán vé (Sự kiện tạm hoãn)'}
                    </p>
                    <p className="text-xs text-slate-500">
                      Nút đăng ký tham gia và mua vé đã được ẩn để tránh nhầm lẫn cho du khách.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Nút Đăng ký tham gia (cho sự kiện FREE_REGISTRATION) */}
                    {event.ticketType === 'FREE_REGISTRATION' && isValidHttpUrl(event.ticketUrl) && (
                      <a
                        href={event.ticketUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold text-sm px-6 py-3.5 rounded-2xl shadow-md shadow-teal-600/25 transition"
                      >
                        <Ticket className="w-4 h-4" />
                        <span>Đăng ký tham gia</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}

                    {/* Nút Xem vé / Mua vé (cho sự kiện PAID) */}
                    {event.ticketType === 'PAID' && isValidHttpUrl(event.ticketUrl) && (
                      <a
                        href={event.ticketUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-bold text-sm px-6 py-3.5 rounded-2xl shadow-md shadow-orange-500/25 transition"
                      >
                        <Ticket className="w-4 h-4" />
                        <span>Xem vé &amp; Đặt mua</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}

                    {/* Thông báo vào cửa tự do (cho sự kiện FREE_OPEN) */}
                    {event.ticketType === 'FREE_OPEN' && (
                      <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-center">
                        <p className="text-xs font-bold text-emerald-800">
                          ✓ Sự kiện mở cửa tự do — Không cần đăng ký vé trước
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* Nút Chỉ đường (Luôn sẵn sàng để người dùng tra cứu vị trí) */}
                <button
                  type="button"
                  onClick={handleDirectionsClick}
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#0f2942] hover:bg-[#163a5c] text-white font-bold text-sm px-6 py-3.5 rounded-2xl shadow-sm transition cursor-pointer"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Chỉ đường đến địa điểm</span>
                </button>

                {/* Nút Chia sẻ sự kiện */}
                <button
                  type="button"
                  onClick={handleCopyShareLink}
                  className="w-full inline-flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-2xl transition cursor-pointer"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700">Đã sao chép liên kết sự kiện!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      <span>Sao chép liên kết chia sẻ</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </aside>
        </div>

        {/* ══ SỰ KIỆN KHÁC TẠI ĐÀ NẴNG ══ */}
        {relatedEvents.length > 0 && (
          <section className="mt-16 pt-12 border-t border-slate-200">
            <div className="flex items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#0f2942]">
                  Sự kiện đáng chú ý khác tại Đà Nẵng
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Khám phá thêm các hoạt động văn hóa, âm nhạc và giải trí sắp diễn ra
                </p>
              </div>
              <Link
                href="/su-kien"
                className="text-xs sm:text-sm font-semibold text-teal-600 hover:text-teal-700 whitespace-nowrap"
              >
                Xem tất cả →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedEvents.map((item, idx) => (
                <EventCard key={item.id || item.slug || idx} event={item} />
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

      <Footer />
    </div>
  );
}
