"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  BellRing,
  Calendar,
  MapPin,
  Sparkles,
  ArrowRight,
  Clock,
  Check,
} from "lucide-react";
import {
  getUpcomingEventAlerts,
  formatEventCardDate,
  type UpcomingEventAlert,
} from "@/lib/api/events";

interface EventNotificationBellProps {
  isTransparent?: boolean;
}

export default function EventNotificationBell({
  isTransparent = false,
}: EventNotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState<UpcomingEventAlert[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadAlerts() {
      try {
        const list = await getUpcomingEventAlerts(72, controller.signal);
        if (!controller.signal.aborted) {
          setAlerts(list);
          setHasUnread(list.length > 0);
        }
      } catch {
        // ignore
      }
    }

    loadAlerts();
    const onChanged = () => {
      loadAlerts();
    };
    window.addEventListener("dananggo:event-reminders-changed", onChanged);
    return () => {
      controller.abort();
      window.removeEventListener("dananggo:event-reminders-changed", onChanged);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const badgeCount = alerts.length;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          setOpen((prev) => !prev);
          setHasUnread(false);
        }}
        aria-label="Thông báo sự kiện sắp diễn ra tại Đà Nẵng"
        title="Sự kiện đang & sắp diễn ra tại Đà Nẵng"
        className={`relative w-9 h-9 sm:w-[38px] sm:h-[38px] rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
          isTransparent
            ? "bg-white/15 hover:bg-white/25 text-white border border-white/30"
            : "bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-700 border border-slate-200/80"
        }`}
      >
        <BellRing className="w-4 h-4 sm:w-[17px] sm:h-[17px]" />
        {badgeCount > 0 && (
          <span
            className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-orange-500 text-white text-[10px] font-extrabold flex items-center justify-center border-2 border-white shadow-xs ${
              hasUnread ? "animate-bounce" : ""
            }`}
          >
            {badgeCount > 9 ? "9+" : badgeCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 mt-2.5 w-80 sm:w-96 rounded-3xl bg-white shadow-2xl border border-slate-200/90 overflow-hidden z-50 text-slate-800"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#0f2942] via-teal-700 to-cyan-700 px-4 py-3.5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BellRing className="w-4 h-4 text-amber-300" />
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold leading-tight">
                    Sự kiện sắp diễn ra tại Đà Nẵng
                  </h3>
                  <p className="text-[11px] text-white/80">
                    Cập nhật theo giờ Đà Nẵng (UTC+7)
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold bg-white/20 px-2.5 py-0.5 rounded-full">
                {badgeCount} sự kiện
              </span>
            </div>

            {/* Body */}
            <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
              {alerts.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  Hiện chưa có sự kiện nào sắp diễn ra trong 72 giờ tới.
                </div>
              ) : (
                alerts.slice(0, 6).map((item) => {
                  const ev = item.event;
                  const href = `/su-kien/${encodeURIComponent(ev.slug || ev.id || "")}`;
                  return (
                    <Link
                      key={ev.id || ev.slug}
                      href={href}
                      onClick={() => setOpen(false)}
                      className="block p-3.5 hover:bg-teal-50/50 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        {item.isHappeningNow ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            Đang diễn ra ngay lúc này
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Sắp diễn ra sau ~{item.startsInHours} giờ
                          </span>
                        )}

                        {item.isBookmarked && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                            <Check className="w-2.5 h-2.5" />
                            Đã bật nhắc tôi
                          </span>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2">
                        {ev.name}
                      </p>

                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-teal-600" />
                          {formatEventCardDate(ev.startAt, ev.endAt, ev.isAllDay)}
                        </span>
                        {ev.locationName && (
                          <span className="inline-flex items-center gap-1 truncate max-w-[180px]">
                            <MapPin className="w-3 h-3 text-orange-500 shrink-0" />
                            <span className="truncate">{ev.locationName}</span>
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Bấm 🔔 trên sự kiện để nhận nhắc lịch
              </span>
              <Link
                href="/su-kien"
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-800"
              >
                <span>Xem tất cả</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
