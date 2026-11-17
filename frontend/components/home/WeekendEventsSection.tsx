'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { CalendarDays, ArrowRight, RefreshCw, Sparkles, AlertCircle } from 'lucide-react';
import EventCard from '@/components/events/EventCard';
import {
  getHomeWeekendEvents,
  getDanangWeekendRange,
  filterPublicEvents,
  MOCK_EVENTS,
} from '@/lib/api/events';
import type { Event } from '@/types/event';

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

  return (
    <section
      id="cuoi-tuan-nay-o-da-nang"
      aria-labelledby="weekend-events-heading"
      className="py-16 bg-gradient-to-b from-teal-50/50 via-white to-white border-y border-teal-100/80"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 text-teal-700 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-3 shadow-2xs">
              <CalendarDays className="w-3.5 h-3.5 text-teal-600" />
              <span>
                {isFallbackUpcoming
                  ? 'Sự kiện sắp diễn ra · Giờ Đà Nẵng (UTC+7)'
                  : `Sự kiện cuối tuần (${weekendRangeLabel}) · Giờ Đà Nẵng`}
              </span>
            </div>

            <h2
              id="weekend-events-heading"
              className="h2-section text-2xl sm:text-3xl font-bold text-[#0f2942]"
            >
              Cuối tuần này ở Đà Nẵng
            </h2>

            <p className="text-slate-600 text-sm mt-1.5 max-w-2xl">
              {isFallbackUpcoming
                ? 'Cuối tuần này hiện chưa có sự kiện mới. Dưới đây là các sự kiện và hoạt động đặc sắc sắp diễn ra tại Đà Nẵng.'
                : 'Khám phá các lễ hội, đêm nhạc, workshop và hoạt động giải trí sôi động diễn ra vào dịp cuối tuần này tại Đà Nẵng.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/su-kien?date=THIS_WEEKEND"
              className="inline-flex items-center gap-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-full border border-teal-200/80 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Lọc cuối tuần</span>
            </Link>
            <Link
              href="/su-kien"
              className="inline-flex items-center gap-1.5 bg-[#0f2942] hover:bg-[#163a5c] text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-full shadow-sm transition-all"
            >
              <span>Xem tất cả sự kiện</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Trạng thái đang tải (Skeleton) */}
        {loading && (
          <div
            role="status"
            aria-label="Đang tải sự kiện cuối tuần"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs animate-pulse flex flex-col h-[380px]"
              >
                <div className="h-48 bg-slate-200" />
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="h-4 w-24 bg-slate-200 rounded-full" />
                    <div className="h-5 w-full bg-slate-200 rounded-lg" />
                    <div className="h-4 w-4/5 bg-slate-200 rounded-lg" />
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex justify-between">
                    <div className="h-4 w-28 bg-slate-200 rounded" />
                    <div className="h-4 w-16 bg-slate-200 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Trạng thái lỗi */}
        {!loading && error && (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50/70 p-6 sm:p-8 text-center max-w-xl mx-auto"
          >
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-red-900 mb-1">
              Không thể tải sự kiện cuối tuần
            </h3>
            <p className="text-xs sm:text-sm text-red-700 mb-4">{error}</p>
            <button
              type="button"
              onClick={() => void loadWeekendEvents(undefined, true)}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-semibold px-5 py-2.5 rounded-full transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Thử lại
            </button>
          </div>
        )}

        {/* Trạng thái trống */}
        {!loading && !error && events.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
            <CalendarDays className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#0f2942] mb-1">
              Chưa có sự kiện nào được công bố
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Các sự kiện mới tại Đà Nẵng đang được cập nhật. Bạn có thể xem trang danh sách sự kiện để tra cứu thêm.
            </p>
            <Link
              href="/su-kien"
              className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold px-5 py-2.5 rounded-full transition"
            >
              Khám phá trang Sự kiện
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Danh sách thẻ sự kiện dùng chung EventCard */}
        {!loading && !error && events.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {events.map((event, index) => (
              <EventCard key={event.id || event.slug || index} event={event} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
