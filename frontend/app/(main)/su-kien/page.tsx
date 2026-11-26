"use client";

import Image from "next/image";
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  Suspense,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  motion,
  AnimatePresence,
  LayoutGroup,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import {
  ChevronRight,
  ChevronLeft,
  Search,
  Calendar,
  MapPin,
  Ticket,
  Sparkles,
  AlertCircle,
  RefreshCw,
  SearchX,
  X,
  Info,
  ArrowRight,
  CheckCircle,
  ArrowUpDown,
  ShieldCheck,
  BellRing,
  Compass,
  Clock,
  Loader2,
  LayoutGrid,
  List,
} from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import EventCard from "@/components/events/EventCard";
import EventsAmbientBackdrop from "@/components/events/EventsAmbientBackdrop";
import EventSpotlightStage from "@/components/events/EventSpotlightStage";
import EventTimelineList from "@/components/events/EventTimelineList";
import Footer from "@/components/layout/Footer";
import {
  DANANG_DISTRICTS,
  EVENT_TYPES,
  type Event,
  type EventDatePreset,
  type EventPriceFilter,
} from "@/types/event";
import {
  getPublicEvents,
  getDanangWeekendRange,
  getDanangTodayRange,
  formatEventCardDate,
  removeVietnameseTones,
  MOCK_EVENTS,
  filterPublicEvents,
} from "@/lib/api/events";
import { EASING, SPRING } from "@/lib/motion-tokens";

const SU_KIEN_HERO_IMAGE =
  "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=2000&q=90&auto=format&fit=crop";

const EVENTS_PER_PAGE = 6;
const TOTAL_EVENTS_DISPLAY = 48;

const DATE_PRESETS: { value: EventDatePreset; label: string }[] = [
  { value: "ALL", label: "Tất cả thời gian" },
  { value: "TODAY", label: "Hôm nay" },
  { value: "THIS_WEEKEND", label: "Cuối tuần này" },
  { value: "UPCOMING", label: "Sắp diễn ra" },
  { value: "CUSTOM_DATE", label: "Chọn ngày cụ thể" },
];

const PRICE_OPTIONS: { value: EventPriceFilter; label: string }[] = [
  { value: "ALL", label: "Tất cả mức vé" },
  { value: "FREE", label: "Miễn phí" },
  { value: "PAID", label: "Có phí" },
];

const SORT_OPTIONS = [
  { value: "featured", label: "Đề xuất / Nổi bật" },
  { value: "date_asc", label: "Sắp diễn ra gần nhất" },
  { value: "name_asc", label: "Tên sự kiện A–Z" },
] as const;

type SortOption = (typeof SORT_OPTIONS)[number]["value"];

const CATEGORY_TABS: { key: string; label: string; dot: string }[] = [
  { key: "ALL", label: "Tất cả", dot: "bg-[#E87B39]" },
  { key: "FESTIVAL", label: EVENT_TYPES.FESTIVAL, dot: "bg-rose-400" },
  { key: "MUSIC", label: EVENT_TYPES.MUSIC, dot: "bg-purple-400" },
  { key: "FOOD", label: EVENT_TYPES.FOOD, dot: "bg-orange-400" },
  { key: "WORKSHOP", label: EVENT_TYPES.WORKSHOP, dot: "bg-teal-400" },
  { key: "EXHIBITION", label: EVENT_TYPES.EXHIBITION, dot: "bg-indigo-400" },
  { key: "SPORTS", label: EVENT_TYPES.SPORTS, dot: "bg-sky-400" },
  { key: "FAMILY", label: EVENT_TYPES.FAMILY, dot: "bg-emerald-400" },
];

const POPULAR_EVENT_TAGS = [
  { label: "Lễ hội Ẩm thực Sông Hàn", query: "ẩm thực" },
  { label: "Workshop Đèn lồng APEC", query: "đèn lồng" },
  { label: "Đêm nhạc Biển Mỹ Khê", query: "mỹ khê" },
  { label: "Bà Nà Carnival", query: "bà nà" },
  { label: "Triển lãm Chăm Pa", query: "chăm pa" },
  { label: "Giải chạy Sơn Trà", query: "marathon" },
];

const TRUST_BADGES = [
  {
    icon: ShieldCheck,
    accent: "text-[#7FD1C8]",
    ring: "bg-[#216B70]/25 border-[#69A5A3]/35",
    title: "Nguồn tin chính thức",
    desc: "Mọi sự kiện đều đính kèm liên kết xác thực từ Ban tổ chức và Sở Du lịch.",
  },
  {
    icon: Clock,
    accent: "text-[#F6B27B]",
    ring: "bg-[#E87B39]/18 border-[#E87B39]/35",
    title: "Chuẩn múi giờ Đà Nẵng",
    desc: "Bộ lọc Hôm nay & Cuối tuần tính chính xác theo giờ Đà Nẵng (UTC+7).",
  },
  {
    icon: BellRing,
    accent: "text-[#E6D9B7]",
    ring: "bg-[#E6D9B7]/14 border-[#E6D9B7]/35",
    title: "Cập nhật đổi lịch & hủy tức thì",
    desc: "Hiển thị rõ thông báo dời lịch, tạm hoãn hoặc hủy ngay trên thẻ và trang chi tiết.",
  },
  {
    icon: Compass,
    accent: "text-[#93C5FD]",
    ring: "bg-sky-500/18 border-sky-400/35",
    title: "Kết nối địa điểm & chỉ đường",
    desc: "Tích hợp trực tiếp với địa điểm có sẵn trong DaNangGo và bản đồ dẫn đường.",
  },
];

function EventSkeletonCard() {
  return (
    <div className="rounded-[18px] overflow-hidden bg-[#081C25]/80 border border-[#E6D9B7]/16 flex flex-col h-[435px] animate-pulse">
      <div className="h-56 bg-[#0F2C38]/80" />
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex justify-between">
            <div className="h-3.5 w-20 bg-white/10 rounded-full" />
            <div className="h-3.5 w-16 bg-white/10 rounded" />
          </div>
          <div className="h-5 bg-white/12 rounded-lg w-4/5" />
          <div className="h-3.5 bg-white/10 rounded w-2/3" />
          <div className="h-3 bg-white/8 rounded w-full" />
        </div>
        <div className="flex justify-between items-center pt-4 border-t border-dashed border-[#E6D9B7]/16">
          <div className="h-4 bg-white/10 rounded w-24" />
          <div className="h-8 bg-white/12 rounded-full w-24" />
        </div>
      </div>
    </div>
  );
}

function EventsListContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reducedMotion = Boolean(useReducedMotion());

  const initialDatePreset = useMemo<EventDatePreset>(() => {
    const raw = (searchParams?.get("date") || "").toUpperCase();
    if (
      raw === "TODAY" ||
      raw === "THIS_WEEKEND" ||
      raw === "UPCOMING" ||
      raw === "CUSTOM_DATE"
    ) {
      return raw;
    }
    return "ALL";
  }, [searchParams]);

  const [searchQuery, setSearchQuery] = useState(
    () => searchParams?.get("q") || ""
  );
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [datePreset, setDatePreset] =
    useState<EventDatePreset>(initialDatePreset);
  const [customDate, setCustomDate] = useState(
    () => searchParams?.get("customDate") || ""
  );
  const [eventType, setEventType] = useState(
    () => searchParams?.get("type") || "ALL"
  );
  const [district, setDistrict] = useState(
    () => searchParams?.get("district") || "ALL"
  );
  const [priceFilter, setPriceFilter] = useState<EventPriceFilter>(() => {
    const raw = (searchParams?.get("price") || "").toUpperCase();
    return raw === "FREE" || raw === "PAID" ? raw : "ALL";
  });
  const [sortBy, setSortBy] = useState<SortOption>("featured");
  const [viewMode, setViewMode] = useState<"tickets" | "timeline">("tickets");
  const [currentPage, setCurrentPage] = useState(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [events, setEvents] = useState<Event[]>(() =>
    filterPublicEvents(MOCK_EVENTS, {
      search: searchParams?.get("q") || "",
      datePreset: initialDatePreset,
    })
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pageContainerRef = useRef<HTMLDivElement>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const consoleRef = useRef<HTMLDivElement>(null);
  const consoleRafRef = useRef<number | null>(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(
    scrollYProgress,
    [0, 1],
    reducedMotion ? ["0px", "0px"] : ["0px", "26px"]
  );

  const handleConsoleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion || !consoleRef.current) return;
    const rect = consoleRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (consoleRafRef.current !== null)
      cancelAnimationFrame(consoleRafRef.current);
    consoleRafRef.current = requestAnimationFrame(() => {
      const el = consoleRef.current;
      if (!el) return;
      el.style.setProperty("--ex", `${x.toFixed(1)}px`);
      el.style.setProperty("--ey", `${y.toFixed(1)}px`);
      el.style.setProperty("--e-spot", "1");
      consoleRafRef.current = null;
    });
  };

  const handleConsoleLeave = () => {
    if (consoleRafRef.current !== null) {
      cancelAnimationFrame(consoleRafRef.current);
      consoleRafRef.current = null;
    }
    consoleRef.current?.style.setProperty("--e-spot", "0");
  };

  useEffect(() => {
    return () => {
      if (consoleRafRef.current !== null)
        cancelAnimationFrame(consoleRafRef.current);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        searchBoxRef.current &&
        !searchBoxRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setDatePreset(initialDatePreset);
  }, [initialDatePreset]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchFilteredEvents = useCallback(
    async (signal?: AbortSignal, showSkeleton = false) => {
      if (showSkeleton) setLoading(true);
      setError(null);
      try {
        if (searchParams?.get("simError") === "1") {
          throw new Error(
            "Không thể kết nối máy chủ sự kiện. Vui lòng kiểm tra kết nối và thử lại."
          );
        }

        const result = await getPublicEvents(
          {
            search: debouncedSearch,
            datePreset,
            customDate: datePreset === "CUSTOM_DATE" ? customDate : undefined,
            eventType,
            district,
            priceFilter,
          },
          signal
        );
        if (signal?.aborted) return;
        setEvents(result.events);
      } catch (err) {
        if (signal?.aborted) return;
        setError(
          err instanceof Error
            ? err.message
            : "Đã xảy ra lỗi khi tải danh sách sự kiện. Vui lòng thử lại."
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [
      debouncedSearch,
      datePreset,
      customDate,
      eventType,
      district,
      priceFilter,
      searchParams,
    ]
  );

  useEffect(() => {
    const controller = new AbortController();
    void fetchFilteredEvents(controller.signal, false);
    return () => controller.abort();
  }, [fetchFilteredEvents]);

  const matchingSuggestions = useMemo(() => {
    const qTrim = searchQuery.trim();
    if (!qTrim) return [];
    return filterPublicEvents(MOCK_EVENTS, { search: qTrim }).slice(0, 5);
  }, [searchQuery]);

  const sortedEvents = useMemo(() => {
    const list = [...events];
    if (sortBy === "date_asc") {
      return list.sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt));
    }
    if (sortBy === "name_asc") {
      return list.sort((a, b) => a.name.localeCompare(b.name, "vi"));
    }
    return list;
  }, [events, sortBy]);

  const totalResults = sortedEvents.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / EVENTS_PER_PAGE));
  const paginatedEvents = sortedEvents.slice(
    (currentPage - 1) * EVENTS_PER_PAGE,
    currentPage * EVENTS_PER_PAGE
  );

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
      datePreset !== "ALL" ||
      eventType !== "ALL" ||
      district !== "ALL" ||
      priceFilter !== "ALL" ||
      sortBy !== "featured"
  );

  const applyFilter = useCallback((fn: () => void) => {
    fn();
    setCurrentPage(1);
  }, []);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
    if (val.trim()) {
      setIsDropdownOpen(true);
    }
  };

  const handleSelectQuickTag = (tagQuery: string) => {
    setSearchQuery(tagQuery);
    setDebouncedSearch(tagQuery);
    setIsDropdownOpen(false);
    setEventType("ALL");
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setDatePreset("ALL");
    setCustomDate("");
    setEventType("ALL");
    setDistrict("ALL");
    setPriceFilter("ALL");
    setSortBy("featured");
    setIsDropdownOpen(false);
    setCurrentPage(1);
    if (searchParams?.toString()) {
      router.replace("/su-kien", { scroll: false });
    }
  };

  const changePage = (p: number) => {
    setCurrentPage(p);
    setTimeout(() => {
      document
        .getElementById("events-grid")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const pageWindow = () => {
    const delta = 2;
    const range: number[] = [];
    for (
      let i = Math.max(1, currentPage - delta);
      i <= Math.min(totalPages, currentPage + delta);
      i++
    ) {
      range.push(i);
    }
    return range;
  };

  const danangDateHint = useMemo(() => {
    const fmt = new Intl.DateTimeFormat("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      day: "2-digit",
      month: "2-digit",
    });
    const today = getDanangTodayRange();
    const weekend = getDanangWeekendRange();
    return {
      todayStr: fmt.format(new Date(today.startMs)),
      weekendStr: `${fmt.format(new Date(weekend.startMs))}–${fmt.format(new Date(weekend.endMs))}`,
    };
  }, []);

  const showSpotlightStage =
    !loading &&
    !error &&
    !searchQuery.trim() &&
    currentPage === 1 &&
    sortedEvents.length > 0;

  return (
    <div
      ref={pageContainerRef}
      className="dananggo-cinematic-content relative min-h-screen bg-[#06151C] text-[#FFFDF5] flex flex-col overflow-x-clip"
    >
      {/* Nocturnal Festival Stage Atmospheric Backdrop */}
      <EventsAmbientBackdrop
        activeCategory={eventType}
        containerRef={pageContainerRef}
      />

      {/* ═══ PHẦN 1: CINEMATIC LIVE FESTIVAL HERO ═══ */}
      <section
        ref={heroRef}
        data-navbar-overlay="true"
        aria-label="Sự kiện & Lễ hội tại Đà Nẵng"
        className="relative z-10 w-full h-[460px] sm:h-[510px] lg:h-[540px] overflow-hidden select-none bg-[#06151C] flex items-end"
      >
        {/* Subtle Parallax Concert Background */}
        <motion.div
          style={{ y: heroY }}
          initial={reducedMotion ? false : { scale: 1.06 }}
          animate={{ scale: 1 }}
          transition={
            reducedMotion
              ? { duration: 0 }
              : { duration: 1.4, ease: [0.16, 1, 0.3, 1] }
          }
          className="absolute inset-0"
        >
          <Image
            src={SU_KIEN_HERO_IMAGE}
            alt="Sự kiện và Lễ hội đặc sắc tại Đà Nẵng"
            fill
            priority
            unoptimized
            className="object-cover object-center"
            sizes="100vw"
          />
        </motion.div>

        {/* Seamless Multi-Stop Scrim melting cleanly into #06151C behind Frosted Console */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-1"
          style={{
            background:
              "linear-gradient(180deg, rgba(6,21,28,0.74) 0%, rgba(8,26,35,0.34) 40%, rgba(7,22,30,0.58) 72%, rgba(6,21,28,0.86) 90%, #06151C 100%)",
          }}
        />

        {/* Hero Typography & Live Clock Telemetry */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full pb-24 sm:pb-28 pt-28">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-xs sm:text-sm text-[#CBD9DA]/80 mb-4"
          >
            <Link href="/" className="hover:text-[#FFFDF5] transition-colors">
              Trang chủ
            </Link>
            <ChevronRight size={14} className="text-[#E6D9B7]/50" />
            <span className="text-[#E6D9B7] font-medium">
              Sự kiện &amp; Lễ hội Đà Nẵng
            </span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <motion.div
                initial={reducedMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.55,
                  delay: 0.08,
                  ease: EASING.standard,
                }}
                className="inline-flex items-center gap-3 mb-3.5"
              >
                <span
                  className="w-8 h-[1.5px] bg-[#E87B39]"
                  aria-hidden="true"
                />
                <Sparkles size={13} className="text-[#E6D9B7]" />
                <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-[#E6D9B7]">
                  TÂM ĐIỂM LỄ HỘI &amp; HOẠT ĐỘNG VĂN HÓA
                </span>
              </motion.div>

              {/* Monumental High-Contrast Ivory + Champagne Title (no dark .home-section-heading override) */}
              <motion.h1
                initial={reducedMotion ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.68,
                  delay: 0.14,
                  ease: EASING.entrance,
                }}
                style={{ textShadow: "0 8px 30px rgba(3,12,17,0.68)" }}
                className="cinematic-condensed uppercase font-bold text-[#FFFDF5] text-[clamp(2.35rem,4.9vw,4.35rem)] leading-[1.02] tracking-[-0.02em]"
              >
                Sự Kiện &amp; Lễ Hội{" "}
                <span className="home-serif italic font-normal text-[#E6D9B7] normal-case whitespace-nowrap pr-2">
                  Đà Nẵng
                </span>
              </motion.h1>

              <motion.p
                initial={reducedMotion ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.62,
                  delay: 0.22,
                  ease: EASING.entrance,
                }}
                className="mt-4 text-sm sm:text-base text-[#E2ECEC]/90 max-w-2xl leading-relaxed border-l-2 border-[#C9B580] pl-4 flex flex-wrap items-center gap-1.5"
              >
                <span>Nhịp đập thành phố biển với</span>
                <AnimatedCounter
                  to={TOTAL_EVENTS_DISPLAY}
                  suffix="+ lễ hội, đêm nhạc & workshop đặc sắc trong năm."
                  className="text-[#E6D9B7] font-semibold"
                  duration={1.2}
                />
              </motion.p>
            </div>

            {/* Bottom-Right Live Clock Pill (clears fixed top-right Weather pill cleanly) */}
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.28, ease: EASING.standard }}
              className="hidden lg:flex flex-col items-end text-right shrink-0 pb-1"
            >
              <span className="text-[10.5px] font-mono uppercase tracking-[0.22em] text-[#E6D9B7]/85">
                DANANG LIVE STAGE &middot; UTC+7
              </span>
              <span className="mt-1.5 inline-flex items-center gap-2 rounded-full bg-[#06151C]/62 backdrop-blur-md border border-[#E6D9B7]/30 px-3.5 py-1.5 text-xs font-medium text-[#FFFDF5]">
                <CheckCircle size={13} className="text-[#E87B39]" />
                <span>Cập nhật trực tiếp theo giờ Đà Nẵng</span>
              </span>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ PHẦN 2: FROSTED SMOKED GLASS COMMAND CONSOLE ═══ */}
      <div className="relative z-30 max-w-7xl mx-auto px-4 sm:px-6 -mt-16 sm:-mt-20 mb-12 w-full">
        <motion.div
          ref={consoleRef}
          onMouseMove={handleConsoleMove}
          onMouseLeave={handleConsoleLeave}
          initial={reducedMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.58, delay: 0.2, ease: EASING.standard }}
          className="events-console-glass relative rounded-[22px] bg-gradient-to-br from-[#0F2C38]/40 via-[#081D27]/30 to-[#06161F]/44 backdrop-blur-2xl backdrop-saturate-150 border border-[#E6D9B7]/28 p-5 sm:p-6 lg:p-7 shadow-[0_24px_64px_rgba(2,10,15,0.45),inset_0_1px_0_rgba(255,253,245,0.18),inset_0_-1px_0_rgba(230,217,183,0.08)] flex flex-col gap-5"
        >
          {/* Specular top rim & cursor sheen (clipped inside overlay wrapper so search dropdown can extend below cleanly) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden"
          >
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#FFFDF5]/45 to-transparent" />
            <div className="absolute inset-x-10 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-[#E6D9B7]/22 to-transparent" />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,253,245,0.07) 0%, rgba(255,253,245,0.015) 38%, rgba(6,21,28,0.14) 100%)",
              }}
            />
            <div className="events-console-spotlight absolute inset-0" />
            {/* 4 Delicate Architectural Corner Ticks */}
            <span className="absolute top-3 left-3 w-2.5 h-2.5 border-t border-l border-[#E6D9B7]/45 rounded-tl-[3px]" />
            <span className="absolute top-3 right-3 w-2.5 h-2.5 border-t border-r border-[#E6D9B7]/45 rounded-tr-[3px]" />
            <span className="absolute bottom-3 left-3 w-2.5 h-2.5 border-b border-l border-[#E6D9B7]/45 rounded-bl-[3px]" />
            <span className="absolute bottom-3 right-3 w-2.5 h-2.5 border-b border-r border-[#E6D9B7]/45 rounded-br-[3px]" />
          </div>

          {/* HÀNG 1: THANH TÌM KIẾM TRỰC TIẾP + DROPDOWN GỢI Ý + CHIPS SỰ KIỆN HOT */}
          <div ref={searchBoxRef} className="relative z-20 w-full">
            <div
              className={`relative flex items-center rounded-full border backdrop-blur-md transition-all duration-300 ${
                isSearchFocused
                  ? "border-[#E6D9B7]/72 bg-[#06151C]/60 shadow-[0_0_0_3px_rgba(230,217,183,0.10)]"
                  : "border-[#E6D9B7]/24 bg-[#06151C]/36 hover:border-[#E6D9B7]/44"
              }`}
            >
              <span
                aria-hidden="true"
                className={`ml-2.5 w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-300 shrink-0 ${
                  isSearchFocused
                    ? "bg-[#E87B39]/20 border-[#E87B39]/60 text-[#F3D299]"
                    : "bg-[#FFF8E9]/[0.07] border-[#E6D9B7]/24 text-[#E6D9B7]"
                }`}
              >
                <Search size={16} />
              </span>

              <input
                type="text"
                value={searchQuery}
                onFocus={() => {
                  setIsSearchFocused(true);
                  if (searchQuery.trim()) setIsDropdownOpen(true);
                }}
                onBlur={() => setIsSearchFocused(false)}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Nhập tên sự kiện, lễ hội, workshop hoặc địa điểm (VD: Cầu Rồng, Mỹ Khê, APEC, Bà Nà)..."
                aria-label="Tìm kiếm sự kiện"
                className="w-full bg-transparent py-3.5 pl-3.5 pr-12 text-sm sm:text-[15px] font-medium text-[#FFFDF5] placeholder:text-[#BFD1D3]/62 outline-none"
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleSearchChange("")}
                  className="mr-2.5 inline-flex items-center gap-1 rounded-full bg-white/10 hover:bg-white/18 border border-[#E6D9B7]/25 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#FFFDF5] transition cursor-pointer shrink-0"
                  title="Xóa từ khóa"
                  aria-label="Xóa từ khóa tìm kiếm"
                >
                  <span>Xóa</span>
                  <X size={13} />
                </button>
              )}
            </div>

            {/* DROPDOWN KẾT QUẢ GỢI Ý TỨC THÌ (DARK SMOKED GLASS) */}
            <AnimatePresence>
              {isDropdownOpen && searchQuery.trim() && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.985 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.985 }}
                  transition={{ duration: 0.18 }}
                  className="absolute top-full left-0 right-0 mt-2.5 rounded-[18px] bg-[#071821]/96 backdrop-blur-xl shadow-[0_28px_70px_rgba(2,10,15,0.68)] border border-[#E6D9B7]/30 overflow-hidden z-50 p-3 divide-y divide-[#E6D9B7]/14"
                >
                  {matchingSuggestions.length > 0 ? (
                    <>
                      <div className="px-3 py-2 text-[11px] font-mono uppercase tracking-[0.16em] text-[#E6D9B7]/80 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Sparkles size={13} className="text-[#E87B39]" />
                          Sự kiện khớp tức thì ({matchingSuggestions.length})
                        </span>
                        <span className="text-[#CBD9DA]/60 hidden sm:inline">
                          Nhấn để xem lịch &amp; vé
                        </span>
                      </div>
                      <div className="space-y-1 pt-2">
                        {matchingSuggestions.map((item) => {
                          const href = `/su-kien/${encodeURIComponent(
                            item.slug || item.id || ""
                          )}`;
                          return (
                            <Link
                              key={item.id || item.slug}
                              href={href}
                              onClick={() => setIsDropdownOpen(false)}
                              className="flex items-center gap-3.5 p-2.5 rounded-[12px] hover:bg-white/[0.06] transition-colors group"
                            >
                              <div className="relative w-14 h-14 rounded-[10px] overflow-hidden shrink-0 border border-[#E6D9B7]/22 bg-[#051219]">
                                <Image
                                  src={item.imageUrl}
                                  alt={item.name}
                                  fill
                                  unoptimized
                                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                                  sizes="56px"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-[#FFFDF5] group-hover:text-[#F5E6C4] text-sm truncate transition-colors">
                                    {item.name}
                                  </h4>
                                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-white/[0.08] text-[#E6D9B7] rounded-full shrink-0 border border-[#E6D9B7]/25">
                                    {EVENT_TYPES[
                                      item.eventType as keyof typeof EVENT_TYPES
                                    ] || item.eventType}
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-[#CBD9DA]/75">
                                  <span className="flex items-center gap-1">
                                    <Calendar
                                      size={12}
                                      className="text-[#E87B39]"
                                    />
                                    {formatEventCardDate(
                                      item.startAt,
                                      item.endAt,
                                      item.isAllDay
                                    )}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MapPin
                                      size={12}
                                      className="text-[#C9B580]"
                                    />
                                    {item.locationName} ({item.district})
                                  </span>
                                </div>
                              </div>
                              <div className="shrink-0 hidden sm:flex items-center gap-1.5 bg-[#FFF8E9] group-hover:bg-white text-[#102832] text-xs font-semibold px-3.5 py-2 rounded-full transition-colors">
                                <span>Xem chi tiết</span>
                                <ArrowRight
                                  size={13}
                                  className="text-[#CB712D] group-hover:translate-x-0.5 transition-transform"
                                />
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="p-6 text-center text-sm text-[#CBD9DA]/80">
                      Không tìm thấy sự kiện nào khớp với từ khóa &ldquo;
                      <strong className="text-[#FFFDF5]">{searchQuery}</strong>
                      &rdquo;.
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* CHIPS GỢI Ý TỪ KHÓA SỰ KIỆN HOT */}
            <div className="flex items-center gap-2 mt-3 overflow-x-auto hide-scrollbar pt-0.5">
              <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#E6D9B7]/70 shrink-0 flex items-center gap-1.5">
                <Sparkles size={12} className="text-[#E87B39]" /> Nổi bật:
              </span>
              {POPULAR_EVENT_TAGS.map((tag) => {
                const isTagActive =
                  removeVietnameseTones(searchQuery) ===
                  removeVietnameseTones(tag.query);
                return (
                  <button
                    key={tag.label}
                    type="button"
                    onClick={() => handleSelectQuickTag(tag.query)}
                    className={`text-xs px-3 py-1 rounded-full font-medium transition-all shrink-0 border cursor-pointer ${
                      isTagActive
                        ? "bg-[#FFF8E9] text-[#102832] border-[#FFF8E9] shadow-sm"
                        : "bg-[#FFF8E9]/[0.07] hover:bg-[#FFF8E9]/[0.15] text-[#DCE8E8] hover:text-[#FFFDF5] border-[#E6D9B7]/20 hover:border-[#E6D9B7]/50"
                    }`}
                  >
                    {tag.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* HÀNG 2: LOẠI HÌNH SỰ KIỆN + VIEW MODE SWITCHER */}
          <div className="relative z-10 pt-4 border-t border-[#E6D9B7]/14 flex flex-wrap items-center justify-between gap-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10.5px] font-mono uppercase tracking-[0.18em] text-[#E6D9B7]/72 mr-1 hidden md:inline">
                Loại hình:
              </span>
              <LayoutGroup id="sukien-cat">
                <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-full bg-[#051218]/36 backdrop-blur-md border border-[#E6D9B7]/20">
                  {CATEGORY_TABS.map((cat) => {
                    const active = eventType === cat.key;
                    return (
                      <button
                        key={cat.key}
                        type="button"
                        aria-pressed={active}
                        onClick={() => applyFilter(() => setEventType(cat.key))}
                        className={`relative inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors duration-200 cursor-pointer ${
                          active
                            ? "text-[#102832]"
                            : "text-[#D4E3E4] hover:text-[#FFFDF5] hover:bg-white/[0.06]"
                        }`}
                      >
                        {active && (
                          <motion.div
                            layoutId="active-cat-sukien"
                            className="absolute inset-0 rounded-full bg-gradient-to-b from-[#FFFDF5] to-[#F3E7CE] shadow-[0_6px_16px_rgba(3,12,17,0.38)]"
                            style={{ zIndex: 0 }}
                            transition={SPRING.snappy}
                          />
                        )}
                        <span
                          className={`relative z-10 w-1.5 h-1.5 rounded-full ${
                            active ? "bg-[#CB712D]" : cat.dot
                          }`}
                        />
                        <span className="relative z-10">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </LayoutGroup>
            </div>

            {/* View Switcher: Thẻ vé ⇄ Lịch trình */}
            <div
              className="inline-flex items-center gap-1 p-1 rounded-full bg-[#051218]/36 backdrop-blur-md border border-[#E6D9B7]/20 ml-auto"
              role="group"
              aria-label="Chế độ hiển thị sự kiện"
            >
              <button
                type="button"
                onClick={() => setViewMode("tickets")}
                aria-pressed={viewMode === "tickets"}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-all cursor-pointer ${
                  viewMode === "tickets"
                    ? "bg-[#FFF8E9]/16 text-[#FFFDF5] border border-[#E6D9B7]/42"
                    : "text-[#CBD9DA]/72 hover:text-[#FFFDF5] border border-transparent"
                }`}
              >
                <LayoutGrid size={12.5} className="text-[#E6D9B7]" />
                <span>Thẻ vé</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("timeline")}
                aria-pressed={viewMode === "timeline"}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-all cursor-pointer ${
                  viewMode === "timeline"
                    ? "bg-[#FFF8E9]/16 text-[#FFFDF5] border border-[#E6D9B7]/42"
                    : "text-[#CBD9DA]/72 hover:text-[#FFFDF5] border border-transparent"
                }`}
              >
                <List size={12.5} className="text-[#E6D9B7]" />
                <span>Lịch trình</span>
              </button>
            </div>
          </div>

          {/* HÀNG 3: THỜI GIAN (HÔM NAY / CUỐI TUẦN) + KHU VỰC + GIÁ VÉ + SẮP XẾP + XÓA BỘ LỌC */}
          <div className="relative z-10 pt-4 border-t border-[#E6D9B7]/14 flex flex-wrap items-center gap-2.5 justify-between">
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              {/* Quick pill: Hôm nay */}
              <button
                type="button"
                onClick={() =>
                  applyFilter(() =>
                    setDatePreset(datePreset === "TODAY" ? "ALL" : "TODAY")
                  )
                }
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all cursor-pointer ${
                  datePreset === "TODAY"
                    ? "bg-[#216B70] text-[#FFFDF5] border-[#69A5A3] shadow-sm"
                    : "bg-[#216B70]/22 text-[#A7E4DF] border-[#69A5A3]/35 hover:bg-[#216B70]/38"
                }`}
              >
                <Calendar size={12} />
                Hôm nay ({danangDateHint.todayStr})
              </button>

              {/* Quick pill: Cuối tuần này */}
              <button
                type="button"
                onClick={() =>
                  applyFilter(() =>
                    setDatePreset(
                      datePreset === "THIS_WEEKEND" ? "ALL" : "THIS_WEEKEND"
                    )
                  )
                }
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all cursor-pointer ${
                  datePreset === "THIS_WEEKEND"
                    ? "bg-[#E87B39] text-[#FFFDF5] border-[#F6B27B] shadow-sm"
                    : "bg-[#E87B39]/18 text-[#FAD0A8] border-[#E87B39]/38 hover:bg-[#E87B39]/32"
                }`}
              >
                <Sparkles size={12} />
                Cuối tuần này ({danangDateHint.weekendStr})
              </button>

              {/* Dropdown Thời gian đầy đủ */}
              <div className="flex items-center gap-1.5 rounded-full bg-[#051218]/44 border border-[#E6D9B7]/22 px-3 py-1.5">
                <Calendar size={13} className="text-[#E6D9B7]/80 shrink-0" />
                <select
                  aria-label="Thời gian sự kiện"
                  value={datePreset}
                  onChange={(e) =>
                    applyFilter(() =>
                      setDatePreset(e.target.value as EventDatePreset)
                    )
                  }
                  className="bg-transparent text-xs text-[#FFFDF5] focus:outline-none font-medium cursor-pointer"
                >
                  {DATE_PRESETS.map((opt) => (
                    <option
                      key={opt.value}
                      value={opt.value}
                      className="bg-[#071821] text-[#FFFDF5]"
                    >
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {datePreset === "CUSTOM_DATE" && (
                <input
                  type="date"
                  aria-label="Chọn ngày cụ thể"
                  value={customDate}
                  onChange={(e) =>
                    applyFilter(() => setCustomDate(e.target.value))
                  }
                  className="text-xs border border-[#69A5A3]/55 rounded-full px-3 py-1.5 text-[#FFFDF5] bg-[#06151C]/70 focus:outline-none font-medium [color-scheme:dark]"
                />
              )}

              {/* Khu vực Quận / Huyện */}
              <div className="flex items-center gap-1.5 rounded-full bg-[#051218]/44 border border-[#E6D9B7]/22 px-3 py-1.5">
                <MapPin size={13} className="text-[#C9B580] shrink-0" />
                <select
                  aria-label="Khu vực quận huyện"
                  value={district}
                  onChange={(e) =>
                    applyFilter(() => setDistrict(e.target.value))
                  }
                  className="bg-transparent text-xs text-[#FFFDF5] focus:outline-none font-medium cursor-pointer"
                >
                  <option value="ALL" className="bg-[#071821] text-[#FFFDF5]">
                    Tất cả khu vực
                  </option>
                  {DANANG_DISTRICTS.map((d) => (
                    <option
                      key={d}
                      value={d}
                      className="bg-[#071821] text-[#FFFDF5]"
                    >
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Giá vé */}
              <div className="flex items-center gap-1.5 rounded-full bg-[#051218]/44 border border-[#E6D9B7]/22 px-3 py-1.5">
                <Ticket size={13} className="text-[#E87B39] shrink-0" />
                <select
                  aria-label="Lọc theo giá vé"
                  value={priceFilter}
                  onChange={(e) =>
                    applyFilter(() =>
                      setPriceFilter(e.target.value as EventPriceFilter)
                    )
                  }
                  className="bg-transparent text-xs text-[#FFFDF5] focus:outline-none font-medium cursor-pointer"
                >
                  {PRICE_OPTIONS.map((opt) => (
                    <option
                      key={opt.value}
                      value={opt.value}
                      className="bg-[#071821] text-[#FFFDF5]"
                    >
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sắp xếp */}
              <div className="flex items-center gap-1.5 rounded-full bg-[#051218]/44 border border-[#E6D9B7]/22 px-3 py-1.5">
                <ArrowUpDown size={13} className="text-[#E6D9B7] shrink-0" />
                <select
                  aria-label="Sắp xếp sự kiện"
                  value={sortBy}
                  onChange={(e) =>
                    applyFilter(() => setSortBy(e.target.value as SortOption))
                  }
                  className="bg-transparent text-xs text-[#FFFDF5] focus:outline-none font-medium cursor-pointer"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option
                      key={o.value}
                      value={o.value}
                      className="bg-[#071821] text-[#FFFDF5]"
                    >
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Nút Xóa bộ lọc */}
            <button
              type="button"
              onClick={handleClearFilters}
              disabled={!hasActiveFilters}
              className={`flex items-center gap-1.5 text-xs font-semibold transition-all px-3.5 py-1.5 rounded-full border shrink-0 ${
                hasActiveFilters
                  ? "text-red-200 hover:text-white bg-red-500/20 hover:bg-red-500/35 border-red-400/40 cursor-pointer"
                  : "text-[#CBD9DA]/40 bg-white/[0.04] border-white/10 cursor-not-allowed"
              }`}
              title="Đặt lại toàn bộ bộ lọc"
            >
              <RefreshCw size={12.5} />
              <span>Xóa bộ lọc</span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* ═══ PHẦN 3: NỘI DUNG SỰ KIỆN (TẦNG 1 SPOTLIGHT STAGE + TẦNG 2 COLLECTION) ═══ */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-4 w-full flex-1">
        {/* TIER 1: SÂN KHẤU TÂM ĐIỂM */}
        {showSpotlightStage && <EventSpotlightStage events={sortedEvents} />}

        {/* TIER 2 HEADER: CHƯƠNG 02 // BỘ SƯU TẬP SỰ KIỆN */}
        <div
          id="events-grid"
          className="scroll-mt-28 flex flex-wrap items-end justify-between gap-4 pb-5 mb-7 border-b border-[#E6D9B7]/16"
        >
          <div>
            <div className="inline-flex items-center gap-2.5 text-[10.5px] font-mono uppercase tracking-[0.24em] text-[#E6D9B7] mb-1.5">
              <span className="w-6 h-[1px] bg-[#E87B39]" />
              <span>
                CHƯƠNG 02 //{" "}
                {viewMode === "tickets"
                  ? "BỘ SƯU TẬP THẺ VÉ SỰ KIỆN"
                  : "LỊCH TRÌNH THEO DÒNG THỜI GIAN"}
              </span>
            </div>
            <h2 className="home-serif text-2xl sm:text-3xl font-semibold text-[#FFFDF5] leading-tight">
              {viewMode === "tickets" ? (
                <>
                  Lịch diễn &amp;{" "}
                  <span className="italic font-normal text-[#E6D9B7]">
                    trải nghiệm chọn lọc
                  </span>
                </>
              ) : (
                <>
                  Dòng thời gian{" "}
                  <span className="italic font-normal text-[#E6D9B7]">
                    lễ hội Đà Nẵng
                  </span>
                </>
              )}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <p className="text-xs sm:text-sm font-medium text-[#CBD9DA]/82">
              Hiển thị{" "}
              <span className="font-mono font-bold text-[#FFFDF5]">
                {totalResults > 0
                  ? (currentPage - 1) * EVENTS_PER_PAGE + 1
                  : 0}
                –{Math.min(currentPage * EVENTS_PER_PAGE, totalResults)}
              </span>{" "}
              /{" "}
              <span className="font-mono font-bold text-[#E6D9B7]">
                {totalResults}
              </span>{" "}
              sự kiện
              {searchQuery && (
                <span>
                  {" "}
                  cho &ldquo;
                  <strong className="text-[#F6B27B]">{searchQuery}</strong>
                  &rdquo;
                </span>
              )}
            </p>
            {hasActiveFilters && (
              <span className="text-[10.5px] font-mono uppercase tracking-[0.14em] bg-[#216B70]/35 border border-[#69A5A3]/45 text-[#A7E4DF] px-2.5 py-1 rounded-full font-semibold">
                Đang lọc
              </span>
            )}
          </div>
        </div>

        {/* DANH SÁCH KẾT QUẢ */}
        <div>
          {loading ? (
            <div
              role="status"
              aria-label="Đang tải danh sách sự kiện"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <EventSkeletonCard key={i} />
              ))}
            </div>
          ) : error ? (
            <div
              role="alert"
              className="text-center py-14 bg-[#081C25]/85 backdrop-blur-md rounded-[22px] border border-red-400/35 shadow-[0_24px_60px_rgba(2,10,15,0.45)] p-8 max-w-lg mx-auto"
            >
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3 stroke-[1.5]" />
              <h3 className="home-serif text-xl font-semibold text-[#FFFDF5]">
                Không thể tải dữ liệu sự kiện
              </h3>
              <p className="text-[#CBD9DA]/80 text-sm mt-2 mb-6">{error}</p>
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => void fetchFilteredEvents(undefined, true)}
                  className="px-5 py-2.5 bg-[#FFF8E9] hover:bg-white text-[#102832] rounded-full text-xs font-semibold uppercase tracking-[0.12em] transition inline-flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw size={14} />
                  Thử lại ngay
                </button>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="px-5 py-2.5 border border-[#E6D9B7]/30 hover:bg-white/10 text-[#FFFDF5] rounded-full text-xs font-semibold uppercase tracking-[0.12em] transition cursor-pointer"
                  >
                    Xóa bộ lọc
                  </button>
                )}
              </div>
            </div>
          ) : paginatedEvents.length === 0 ? (
            <div className="text-center py-16 bg-[#081C25]/85 backdrop-blur-md rounded-[22px] border border-[#E6D9B7]/22 shadow-[0_24px_60px_rgba(2,10,15,0.45)] p-8 max-w-lg mx-auto">
              <SearchX className="w-12 h-12 text-[#E6D9B7]/60 mx-auto mb-3 stroke-[1.5]" />
              <h3 className="home-serif text-xl font-semibold text-[#FFFDF5]">
                Không tìm thấy sự kiện phù hợp
              </h3>
              <p className="text-[#CBD9DA]/78 text-sm mt-2 leading-relaxed">
                Không có sự kiện nào khớp với tiêu chí lọc hiện tại của bạn. Hãy
                thử chọn khoảng thời gian khác hoặc xóa bộ lọc để xem toàn bộ sự
                kiện tại Đà Nẵng!
              </p>
              <button
                type="button"
                onClick={handleClearFilters}
                className="mt-6 px-6 py-2.5 bg-[#FFF8E9] hover:bg-white text-[#102832] rounded-full text-xs font-semibold uppercase tracking-[0.12em] transition cursor-pointer"
              >
                Xóa bộ lọc &amp; Xem tất cả sự kiện
              </button>
            </div>
          ) : viewMode === "timeline" ? (
            <EventTimelineList
              events={paginatedEvents}
              startIndex={(currentPage - 1) * EVENTS_PER_PAGE}
            />
          ) : (
            <div
              key={`events-${currentPage}-${datePreset}-${eventType}-${district}-${priceFilter}-${debouncedSearch}-${sortBy}`}
              className="event-ticket-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7"
            >
              {paginatedEvents.map((event, i) => (
                <motion.div
                  key={event.id || event.slug || i}
                  initial={reducedMotion ? false : { opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.36,
                    delay: reducedMotion ? 0 : i * 0.05,
                    ease: EASING.standard,
                  }}
                  className="h-full"
                >
                  <EventCard
                    event={event}
                    priority={i < 3}
                    index={(currentPage - 1) * EVENTS_PER_PAGE + i}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Hộp lưu ý quy tắc sự kiện Đã hủy (Smoked Amber Glass) */}
        <div className="mt-10 rounded-[18px] border border-[#E6D9B7]/22 bg-[#081C25]/78 backdrop-blur-md p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_14px_38px_rgba(2,10,15,0.34)]">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-[#E87B39]/18 border border-[#E87B39]/38 text-[#F6B27B] flex items-center justify-center shrink-0 mt-0.5">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#FFFDF5]">
                Tra cứu sự kiện đã hủy qua liên kết trực tiếp
              </h3>
              <p className="text-xs text-[#CBD9DA]/76 mt-0.5 leading-relaxed">
                Sự kiện ở trạng thái{" "}
                <strong className="text-[#E6D9B7]">Đã hủy</strong> được gỡ khỏi
                danh sách khám phá để tránh nhầm lẫn, nhưng người dùng đã lưu
                link vẫn có thể mở trang chi tiết để đọc thông báo chính thức.
              </p>
            </div>
          </div>
          <Link
            href="/su-kien/workshop-nhiep-anh-san-may-dinh-ban-co-da-huy"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FFFDF5] bg-white/[0.08] hover:bg-[#FFF8E9] hover:text-[#102832] border border-[#E6D9B7]/32 px-4 py-2 rounded-full transition-colors shrink-0"
          >
            <span>Mở mẫu sự kiện đã hủy</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* ═══ PHẦN 4: PHÂN TRANG (DARK GLASS PAGINATION) ═══ */}
        {totalPages > 1 && (
          <div className="py-10 flex justify-center">
            <div className="inline-flex items-center gap-2 p-1.5 rounded-full bg-[#081C25]/80 backdrop-blur-md border border-[#E6D9B7]/22">
              <button
                type="button"
                onClick={() => currentPage > 1 && changePage(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Trang trước"
                className={`flex items-center justify-center w-9 h-9 rounded-full border transition-all ${
                  currentPage === 1
                    ? "opacity-35 cursor-not-allowed border-transparent text-[#CBD9DA]"
                    : "border-[#E6D9B7]/22 text-[#FFFDF5] hover:bg-white/10 cursor-pointer"
                }`}
              >
                <ChevronLeft size={16} />
              </button>

              {pageWindow().map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => p !== currentPage && changePage(p)}
                  className={`w-9 h-9 rounded-full text-xs font-mono font-bold transition-all duration-200 cursor-pointer ${
                    p === currentPage
                      ? "bg-[#FFF8E9] text-[#102832] shadow-[0_6px_16px_rgba(2,10,15,0.45)]"
                      : "text-[#CBD9DA] hover:text-[#FFFDF5] hover:bg-white/10"
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                type="button"
                onClick={() =>
                  currentPage < totalPages && changePage(currentPage + 1)
                }
                disabled={currentPage === totalPages}
                aria-label="Trang sau"
                className={`flex items-center justify-center w-9 h-9 rounded-full border transition-all ${
                  currentPage === totalPages
                    ? "opacity-35 cursor-not-allowed border-transparent text-[#CBD9DA]"
                    : "border-[#E6D9B7]/22 text-[#FFFDF5] hover:bg-white/10 cursor-pointer"
                }`}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ═══ PHẦN 5: TRUST PILLARS (NOCTURNAL ARCHITECTURAL SANCTUARY CARDS) ═══ */}
        <section className="py-14">
          <Reveal delay={0.05}>
            <div className="text-center mb-9">
              <span className="inline-flex items-center gap-2 text-[10.5px] font-mono uppercase tracking-[0.24em] text-[#E6D9B7] mb-2">
                <span className="w-5 h-[1px] bg-[#E87B39]" />
                <span>CHUẨN XÁC THỰC DANANGGO</span>
                <span className="w-5 h-[1px] bg-[#E87B39]" />
              </span>
              <h2 className="home-serif text-2xl sm:text-3xl font-semibold text-[#FFFDF5]">
                Vì sao theo dõi sự kiện trên{" "}
                <span className="text-[#7FD1C8]">Danang</span>
                <span className="text-[#E87B39]">Go</span>?
              </h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
            {TRUST_BADGES.map((badge, i) => {
              const Icon = badge.icon;
              return (
                <Reveal key={badge.title} delay={i * 0.08} className="flex">
                  <div className="flex flex-col h-full w-full rounded-[18px] bg-[#081C25]/78 backdrop-blur-md p-6 border border-[#E6D9B7]/20 hover:border-[#E6D9B7]/48 items-center text-center transition-all duration-300 shadow-[0_14px_38px_rgba(2,10,15,0.34)]">
                    <div
                      className={`w-12 h-12 rounded-full border flex items-center justify-center mb-4 shrink-0 ${badge.ring}`}
                    >
                      <Icon size={20} className={badge.accent} />
                    </div>
                    <h3 className="font-semibold text-[#FFFDF5] text-sm mb-2">
                      {badge.title}
                    </h3>
                    <p className="text-[#CBD9DA]/76 text-xs leading-relaxed">
                      {badge.desc}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* ═══ PHẦN 6: CLOSING NOCTURNAL CTA BANNER (FIXED CONTRAST) ═══ */}
        <section className="pb-16">
          <Reveal delay={0.1}>
            <div className="relative rounded-[24px] bg-gradient-to-br from-[#0C2632]/92 via-[#081C25]/95 to-[#06151C]/98 border border-[#E6D9B7]/28 p-9 sm:p-14 text-center overflow-hidden shadow-[0_28px_72px_rgba(2,10,15,0.52)]">
              {/* Top Champagne rim & coastal contours */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#E6D9B7]/55 to-transparent"
              />
              <img
                src="/images/intro/atmosphere/intro-coastal-contours.svg"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 w-full h-full object-cover opacity-[0.14]"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[520px] h-[240px] rounded-full"
                style={{
                  background:
                    "radial-gradient(ellipse, rgba(232,123,57,0.18) 0%, rgba(201,181,128,0.08) 50%, transparent 75%)",
                }}
              />

              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#216B70]/30 border border-[#69A5A3]/45 text-[#E6D9B7] text-[11px] font-mono font-semibold px-4 py-1.5 mb-5 uppercase tracking-[0.18em]">
                  <Calendar size={13} className="text-[#E87B39]" />
                  <span>KẾT HỢP SỰ KIỆN VÀO CHUYẾN ĐI</span>
                </div>

                <h2 className="home-serif text-2xl sm:text-4xl font-semibold text-[#FFFDF5] leading-snug mb-3">
                  Đã chọn được sự kiện yêu thích?{" "}
                  <span className="italic font-normal text-[#E6D9B7]">
                    Lên lịch trình khám phá ngay!
                  </span>
                </h2>
                <p className="text-[#CBD9DA]/82 max-w-xl mx-auto mb-8 text-sm leading-relaxed">
                  DanangGo giúp bạn kết hợp các lễ hội, workshop cuối tuần với
                  điểm ăn uống và lưu trú gần nhất để có một chuyến đi trọn vẹn
                  tại Đà Nẵng.
                </p>

                <div className="flex flex-col sm:flex-row gap-3.5 justify-center">
                  <Link
                    href="/lich-trinh/tao-moi"
                    className="luxury-btn-sweep inline-flex items-center justify-center gap-2 rounded-full bg-[#E87B39] hover:bg-[#D66A28] text-[#FFFDF5] font-semibold px-8 py-3.5 transition-colors text-xs sm:text-sm uppercase tracking-[0.12em] shadow-[0_14px_32px_rgba(232,123,57,0.32)]"
                  >
                    <Calendar size={15} />
                    <span>Tạo lịch trình của bạn</span>
                  </Link>
                  <Link
                    href="/bando"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[#E6D9B7]/40 hover:border-[#FFFDF5] bg-white/[0.05] hover:bg-white/[0.12] text-[#FFFDF5] font-semibold px-8 py-3.5 transition-all text-xs sm:text-sm uppercase tracking-[0.12em]"
                  >
                    <span>Xem bản đồ Đà Nẵng</span>
                  </Link>
                </div>

                <p className="text-[#CBD9DA]/55 text-xs font-mono uppercase tracking-[0.16em] mt-5">
                  Cập nhật liên tục &middot; Chỉ đường thuận tiện &middot; Hoàn
                  toàn miễn phí
                </p>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      {/* ═══ PHẦN 7: FOOTER ═══ */}
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}

export default function EventsListPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#06151C] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#E87B39]" />
            <p className="text-sm font-medium text-[#E6D9B7]">
              Đang tải danh sách sự kiện...
            </p>
          </div>
        </div>
      }
    >
      <EventsListContent />
    </Suspense>
  );
}
