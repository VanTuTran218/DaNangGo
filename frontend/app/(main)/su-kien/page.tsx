'use client';

import Image from 'next/image';
import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence, LayoutGroup, useScroll, useTransform } from 'framer-motion';
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
} from 'lucide-react';
import Reveal from '@/components/ui/Reveal';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import EventCard from '@/components/events/EventCard';
import Footer from '@/components/layout/Footer';
import {
  DANANG_DISTRICTS,
  EVENT_TYPES,
  type Event,
  type EventDatePreset,
  type EventPriceFilter,
} from '@/types/event';
import {
  getPublicEvents,
  getDanangWeekendRange,
  getDanangTodayRange,
  formatEventCardDate,
  removeVietnameseTones,
  MOCK_EVENTS,
  filterPublicEvents,
} from '@/lib/api/events';

const SU_KIEN_HERO_IMAGE =
  'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=2000&q=90&auto=format&fit=crop';

const EVENTS_PER_PAGE = 6;
const TOTAL_EVENTS_DISPLAY = 48;

const DATE_PRESETS: { value: EventDatePreset; label: string }[] = [
  { value: 'ALL', label: 'Tất cả thời gian' },
  { value: 'TODAY', label: 'Hôm nay' },
  { value: 'THIS_WEEKEND', label: 'Cuối tuần này' },
  { value: 'UPCOMING', label: 'Sắp diễn ra' },
  { value: 'CUSTOM_DATE', label: 'Chọn ngày cụ thể' },
];

const PRICE_OPTIONS: { value: EventPriceFilter; label: string }[] = [
  { value: 'ALL', label: 'Tất cả mức vé' },
  { value: 'FREE', label: 'Miễn phí' },
  { value: 'PAID', label: 'Có phí' },
];

const SORT_OPTIONS = [
  { value: 'featured', label: 'Đề xuất / Nổi bật' },
  { value: 'date_asc', label: 'Sắp diễn ra gần nhất' },
  { value: 'name_asc', label: 'Tên sự kiện A–Z' },
] as const;

type SortOption = (typeof SORT_OPTIONS)[number]['value'];

const CATEGORY_TABS: { key: string; label: string; tint: string }[] = [
  { key: 'ALL', label: 'Tất cả', tint: 'bg-[#0f2942]' },
  { key: 'FESTIVAL', label: EVENT_TYPES.FESTIVAL, tint: 'bg-rose-500' },
  { key: 'MUSIC', label: EVENT_TYPES.MUSIC, tint: 'bg-purple-600' },
  { key: 'FOOD', label: EVENT_TYPES.FOOD, tint: 'bg-orange-500' },
  { key: 'WORKSHOP', label: EVENT_TYPES.WORKSHOP, tint: 'bg-teal-600' },
  { key: 'EXHIBITION', label: EVENT_TYPES.EXHIBITION, tint: 'bg-indigo-600' },
  { key: 'SPORTS', label: EVENT_TYPES.SPORTS, tint: 'bg-sky-600' },
  { key: 'FAMILY', label: EVENT_TYPES.FAMILY, tint: 'bg-emerald-600' },
];

const POPULAR_EVENT_TAGS = [
  { label: 'Lễ hội Ẩm thực Sông Hàn', query: 'ẩm thực' },
  { label: 'Workshop Đèn lồng APEC', query: 'đèn lồng' },
  { label: 'Đêm nhạc Biển Mỹ Khê', query: 'mỹ khê' },
  { label: 'Bà Nà Carnival', query: 'bà nà' },
  { label: 'Triển lãm Chăm Pa', query: 'chăm pa' },
  { label: 'Giải chạy Sơn Trà', query: 'marathon' },
];

const TRUST_BADGES = [
  {
    icon: ShieldCheck,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    title: 'Nguồn tin chính thức',
    desc: 'Mọi sự kiện đều đính kèm liên kết xác thực từ Ban tổ chức và Sở Du lịch.',
  },
  {
    icon: Clock,
    color: 'text-orange-500',
    bg: 'bg-orange-50',
    title: 'Chuẩn múi giờ Đà Nẵng',
    desc: 'Bộ lọc Hôm nay & Cuối tuần tính chính xác theo giờ Đà Nẵng (UTC+7).',
  },
  {
    icon: BellRing,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    title: 'Cập nhật đổi lịch & hủy tức thì',
    desc: 'Hiển thị rõ thông báo dời lịch, tạm hoãn hoặc hủy ngay trên thẻ và trang chi tiết.',
  },
  {
    icon: Compass,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    title: 'Kết nối địa điểm & chỉ đường',
    desc: 'Tích hợp trực tiếp với địa điểm có sẵn trong DaNangGo và bản đồ dẫn đường.',
  },
];

function EventSkeletonCard() {
  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 flex flex-col h-[410px]">
      <div className="h-52 bg-gray-200 animate-pulse" />
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex justify-between">
            <div className="h-4 w-20 bg-gray-200 rounded-full animate-pulse" />
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-5 bg-gray-200 rounded-lg animate-pulse w-4/5" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
          <div className="h-3 bg-gray-200 rounded animate-pulse w-full" />
        </div>
        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
          <div className="h-8 bg-gray-200 rounded-xl animate-pulse w-24" />
        </div>
      </div>
    </div>
  );
}

function EventsListContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialDatePreset = useMemo<EventDatePreset>(() => {
    const raw = (searchParams?.get('date') || '').toUpperCase();
    if (
      raw === 'TODAY' ||
      raw === 'THIS_WEEKEND' ||
      raw === 'UPCOMING' ||
      raw === 'CUSTOM_DATE'
    ) {
      return raw;
    }
    return 'ALL';
  }, [searchParams]);

  const [searchQuery, setSearchQuery] = useState(() => searchParams?.get('q') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const [datePreset, setDatePreset] = useState<EventDatePreset>(initialDatePreset);
  const [customDate, setCustomDate] = useState(() => searchParams?.get('customDate') || '');
  const [eventType, setEventType] = useState(() => searchParams?.get('type') || 'ALL');
  const [district, setDistrict] = useState(() => searchParams?.get('district') || 'ALL');
  const [priceFilter, setPriceFilter] = useState<EventPriceFilter>(() => {
    const raw = (searchParams?.get('price') || '').toUpperCase();
    return raw === 'FREE' || raw === 'PAID' ? raw : 'ALL';
  });
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [currentPage, setCurrentPage] = useState(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Khởi tạo dữ liệu ngay từ MOCK_EVENTS để hiển thị mượt mà như Lưu trú & Ẩm thực
  const [events, setEvents] = useState<Event[]>(() =>
    filterPublicEvents(MOCK_EVENTS, {
      search: searchParams?.get('q') || '',
      datePreset: initialDatePreset,
    }),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchBoxRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);

  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroY = useTransform(
    scrollYProgress,
    [0, 1],
    prefersReduced ? ['0px', '0px'] : ['0px', '22px'],
  );

  // Đóng dropdown gợi ý khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
        if (searchParams?.get('simError') === '1') {
          throw new Error(
            'Không thể kết nối máy chủ sự kiện. Vui lòng kiểm tra kết nối và thử lại.',
          );
        }

        const result = await getPublicEvents(
          {
            search: debouncedSearch,
            datePreset,
            customDate: datePreset === 'CUSTOM_DATE' ? customDate : undefined,
            eventType,
            district,
            priceFilter,
          },
          signal,
        );
        if (signal?.aborted) return;
        setEvents(result.events);
      } catch (err) {
        if (signal?.aborted) return;
        setError(
          err instanceof Error
            ? err.message
            : 'Đã xảy ra lỗi khi tải danh sách sự kiện. Vui lòng thử lại.',
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [debouncedSearch, datePreset, customDate, eventType, district, priceFilter, searchParams],
  );

  useEffect(() => {
    const controller = new AbortController();
    void fetchFilteredEvents(controller.signal, false);
    return () => controller.abort();
  }, [fetchFilteredEvents]);

  // Gợi ý tức thì trong ô tìm kiếm (đồng bộ với trang Ẩm thực)
  const matchingSuggestions = useMemo(() => {
    const qTrim = searchQuery.trim();
    if (!qTrim) return [];
    return filterPublicEvents(MOCK_EVENTS, { search: qTrim }).slice(0, 5);
  }, [searchQuery]);

  // Sắp xếp danh sách kết quả
  const sortedEvents = useMemo(() => {
    const list = [...events];
    if (sortBy === 'date_asc') {
      return list.sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt));
    }
    if (sortBy === 'name_asc') {
      return list.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    }
    return list;
  }, [events, sortBy]);

  const totalResults = sortedEvents.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / EVENTS_PER_PAGE));
  const paginatedEvents = sortedEvents.slice(
    (currentPage - 1) * EVENTS_PER_PAGE,
    currentPage * EVENTS_PER_PAGE,
  );

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
      datePreset !== 'ALL' ||
      eventType !== 'ALL' ||
      district !== 'ALL' ||
      priceFilter !== 'ALL' ||
      sortBy !== 'featured',
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
    setEventType('ALL');
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setDatePreset('ALL');
    setCustomDate('');
    setEventType('ALL');
    setDistrict('ALL');
    setPriceFilter('ALL');
    setSortBy('featured');
    setIsDropdownOpen(false);
    setCurrentPage(1);
    if (searchParams?.toString()) {
      router.replace('/su-kien', { scroll: false });
    }
  };

  const changePage = (p: number) => {
    setCurrentPage(p);
    setTimeout(() => {
      document.getElementById('events-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    const fmt = new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      day: '2-digit',
      month: '2-digit',
    });
    const today = getDanangTodayRange();
    const weekend = getDanangWeekendRange();
    return {
      todayStr: fmt.format(new Date(today.startMs)),
      weekendStr: `${fmt.format(new Date(weekend.startMs))}–${fmt.format(new Date(weekend.endMs))}`,
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col overflow-x-hidden">
      {/* ═══ PHẦN 1: HERO BANNER SỰ KIỆN (ĐỒNG BỘ TỈ LỆ VỚI TRANG LƯU TRÚ & ẨM THỰC) ═══ */}
      <section
        ref={heroRef}
        data-navbar-overlay="true"
        aria-label="Sự kiện & Lễ hội tại Đà Nẵng"
        className="relative w-full h-[400px] sm:h-[450px] lg:h-[490px] overflow-hidden select-none"
      >
        {/* Lớp gradient tối trên đỉnh bảo đảm Navbar trong suốt đọc sắc nét */}
        <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/75 via-black/30 to-transparent pointer-events-none z-20" />

        {/* Ảnh nền C1 Hero Image Reveal (scale 1.05 -> 1) & C3 Subtle Parallax */}
        <motion.div
          style={{ y: heroY }}
          initial={prefersReduced ? false : { scale: 1.05 }}
          animate={{ scale: 1 }}
          transition={
            prefersReduced ? { duration: 0 } : { duration: 1.5, ease: [0.16, 1, 0.3, 1] }
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

        {/* Overlay gradient cân bằng */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-[#071a2e]/40 to-[#071a2e]/85 pointer-events-none z-10" />

        {/* Badge góc trên phải đồng bộ với Lưu trú & Ẩm thực */}
        <div className="absolute top-24 right-6 sm:right-8 z-20 hidden sm:block">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/25 text-white rounded-full px-4 py-1.5 text-xs font-semibold shadow-sm">
            <CheckCircle size={13} className="text-emerald-400" />
            Cập nhật trực tiếp theo giờ Đà Nẵng (UTC+7)
          </div>
        </div>

        {/* Nội dung banner */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 flex flex-col justify-end h-full pb-14 sm:pb-16 pt-24">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm text-white/80 mb-3">
            <Link href="/" className="hover:text-cyan-300 transition-colors">
              Trang chủ
            </Link>
            <ChevronRight size={14} className="text-white/50" />
            <span className="text-white font-medium">Sự kiện &amp; Lễ hội Đà Nẵng</span>
          </div>

          <div className="mb-2">
            <span className="inline-flex items-center gap-2 bg-teal-500/90 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
              🎉 TÂM ĐIỂM LỄ HỘI &amp; HOẠT ĐỘNG VĂN HÓA
            </span>
          </div>

          <div>
            <h1 className="h1-hero text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight drop-shadow-sm">
              Sự kiện &amp; Lễ hội tại Đà Nẵng — Nhịp đập thành phố biển
            </h1>
            <p className="body-text stat-number text-white/85 text-sm sm:text-base mt-2 flex items-center gap-1.5">
              <AnimatedCounter
                to={TOTAL_EVENTS_DISPLAY}
                suffix="+ lễ hội, đêm nhạc & workshop đặc sắc trong năm"
                className="text-cyan-300 font-semibold"
                duration={1.2}
              />
            </p>
          </div>
        </div>
      </section>

      {/* ═══ PHẦN 2: BỘ LỌC & Ô TÌM KIẾM NỔI BẬT (-mt-10 ĐỒNG BỘ ẨM THỰC & LƯU TRÚ) ═══ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-10 relative z-30 mb-8 w-full">
        <Reveal delay={0.1}>
          <div className="bg-white rounded-3xl shadow-xl p-5 sm:p-7 border border-gray-100 flex flex-col gap-5">
            {/* HÀNG 1: THANH TÌM KIẾM TRỰC TIẾP + GỢI Ý DROPDOWN + CHIPS NỔI BẬT */}
            <div ref={searchBoxRef} className="relative w-full">
              <div className="relative flex items-center">
                <Search className="absolute left-4 text-teal-600" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onFocus={() => {
                    if (searchQuery.trim()) setIsDropdownOpen(true);
                  }}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Nhập tên sự kiện, lễ hội, workshop hoặc địa điểm (VD: Cầu Rồng, Mỹ Khê, APEC, Bà Nà)..."
                  aria-label="Tìm kiếm sự kiện"
                  className="w-full bg-slate-50 hover:bg-slate-100/80 focus:bg-white border-2 border-slate-200 focus:border-teal-500 rounded-2xl pl-12 pr-12 py-3.5 text-sm sm:text-base font-semibold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-teal-500/15 transition-all shadow-inner"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => handleSearchChange('')}
                    className="absolute right-4 text-gray-400 hover:text-gray-700 transition p-1 rounded-full hover:bg-gray-200"
                    title="Xóa từ khóa"
                    aria-label="Xóa từ khóa tìm kiếm"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              {/* DROPDOWN KẾT QUẢ GỢI Ý TỨC THÌ */}
              <AnimatePresence>
                {isDropdownOpen && searchQuery.trim() && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 p-3 divide-y divide-gray-100"
                  >
                    {matchingSuggestions.length > 0 ? (
                      <>
                        <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-teal-600">
                            <Sparkles size={14} className="text-teal-500" />
                            Sự kiện khớp tức thì ({matchingSuggestions.length})
                          </span>
                          <span className="text-gray-400 font-normal hidden sm:inline">
                            Nhấn &ldquo;Xem chi tiết&rdquo; để xem lịch &amp; vé
                          </span>
                        </div>
                        <div className="space-y-1 pt-1">
                          {matchingSuggestions.map((item) => {
                            const href = `/su-kien/${encodeURIComponent(item.slug || item.id || '')}`;
                            return (
                              <Link
                                key={item.id || item.slug}
                                href={href}
                                onClick={() => setIsDropdownOpen(false)}
                                className="flex items-center gap-3.5 p-2.5 rounded-xl hover:bg-teal-50/70 transition-all group"
                              >
                                <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 shadow-sm border border-gray-100 bg-slate-100">
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
                                    <h4 className="font-bold text-gray-900 group-hover:text-teal-600 text-sm truncate transition-colors">
                                      {item.name}
                                    </h4>
                                    <span className="px-2 py-0.5 text-[10px] font-bold bg-teal-50 text-teal-700 rounded-full shrink-0 border border-teal-100">
                                      {EVENT_TYPES[item.eventType as keyof typeof EVENT_TYPES] ||
                                        item.eventType}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                      <Calendar size={12} className="text-teal-500" />
                                      {formatEventCardDate(
                                        item.startAt,
                                        item.endAt,
                                        item.isAllDay,
                                      )}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <MapPin size={12} className="text-gray-400" />
                                      {item.locationName} ({item.district})
                                    </span>
                                  </div>
                                </div>
                                <div className="shrink-0 hidden sm:flex items-center gap-1.5 bg-[#0f2942] group-hover:bg-teal-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition-all">
                                  <span>Xem chi tiết</span>
                                  <ArrowRight
                                    size={13}
                                    className="group-hover:translate-x-0.5 transition-transform"
                                  />
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <div className="p-6 text-center text-sm text-gray-500">
                        Không tìm thấy sự kiện nào khớp với từ khóa &ldquo;
                        <strong>{searchQuery}</strong>&rdquo;.
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* CHIPS GỢI Ý TỪ KHÓA SỰ KIỆN HOT */}
              <div className="flex items-center gap-2 mt-3 overflow-x-auto hide-scrollbar pt-1">
                <span className="text-xs font-semibold text-gray-400 shrink-0 flex items-center gap-1">
                  <Sparkles size={12} className="text-teal-500" /> Sự kiện nổi bật:
                </span>
                {POPULAR_EVENT_TAGS.map((tag) => {
                  const isTagActive =
                    removeVietnameseTones(searchQuery) === removeVietnameseTones(tag.query);
                  return (
                    <button
                      key={tag.label}
                      type="button"
                      onClick={() => handleSelectQuickTag(tag.query)}
                      className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all shrink-0 border cursor-pointer ${
                        isTagActive
                          ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                          : 'bg-gray-100 hover:bg-teal-50 text-gray-700 hover:text-teal-700 border-gray-200'
                      }`}
                    >
                      {tag.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* HÀNG 2: DANH MỤC LOẠI SỰ KIỆN (PILL TABS ĐỒNG BỘ ẨM THỰC) */}
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                Loại hình sự kiện
              </p>
              <LayoutGroup id="sukien-cat">
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_TABS.map((cat) => {
                    const active = eventType === cat.key;
                    return (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => applyFilter(() => setEventType(cat.key))}
                        className={`relative px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors duration-200 cursor-pointer ${
                          active ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {active && (
                          <motion.div
                            layoutId="active-cat-sukien"
                            className={`absolute inset-0 rounded-[inherit] ${cat.tint}`}
                            style={{ zIndex: 0 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                          />
                        )}
                        <span className="relative z-10">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </LayoutGroup>
            </div>

            <div className="h-px bg-gray-100" />

            {/* HÀNG 3: THỜI GIAN (HÔM NAY / CUỐI TUẦN) + KHU VỰC + GIÁ VÉ + SẮP XẾP + NÚT XÓA BỘ LỌC */}
            <div className="flex flex-wrap items-center gap-3 justify-between">
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                {/* Pills chọn nhanh Hôm nay & Cuối tuần này */}
                <button
                  type="button"
                  onClick={() =>
                    applyFilter(() =>
                      setDatePreset(datePreset === 'TODAY' ? 'ALL' : 'TODAY'),
                    )
                  }
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all cursor-pointer ${
                    datePreset === 'TODAY'
                      ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                      : 'bg-teal-50/70 text-teal-700 border-teal-200 hover:bg-teal-100'
                  }`}
                >
                  <Calendar size={12} />
                  Hôm nay ({danangDateHint.todayStr})
                </button>

                <button
                  type="button"
                  onClick={() =>
                    applyFilter(() =>
                      setDatePreset(
                        datePreset === 'THIS_WEEKEND' ? 'ALL' : 'THIS_WEEKEND',
                      ),
                    )
                  }
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all cursor-pointer ${
                    datePreset === 'THIS_WEEKEND'
                      ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                      : 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100'
                  }`}
                >
                  <Sparkles size={12} />
                  Cuối tuần này ({danangDateHint.weekendStr})
                </button>

                {/* Dropdown Thời gian đầy đủ */}
                <div className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-gray-400" />
                  <select
                    aria-label="Thời gian sự kiện"
                    value={datePreset}
                    onChange={(e) =>
                      applyFilter(() => setDatePreset(e.target.value as EventDatePreset))
                    }
                    className="text-xs border border-gray-200 rounded-xl px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-all bg-gray-50 font-medium"
                  >
                    {DATE_PRESETS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {datePreset === 'CUSTOM_DATE' && (
                  <input
                    type="date"
                    aria-label="Chọn ngày cụ thể"
                    value={customDate}
                    onChange={(e) => applyFilter(() => setCustomDate(e.target.value))}
                    className="text-xs border border-teal-300 rounded-xl px-2.5 py-1.5 text-gray-800 bg-teal-50/40 focus:outline-none focus:ring-2 focus:ring-teal-400 font-medium"
                  />
                )}

                {/* Khu vực Quận / Huyện */}
                <div className="flex items-center gap-1.5">
                  <MapPin size={13} className="text-teal-600" />
                  <select
                    aria-label="Khu vực quận huyện"
                    value={district}
                    onChange={(e) => applyFilter(() => setDistrict(e.target.value))}
                    className="text-xs border border-gray-200 rounded-xl px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-all bg-gray-50 font-medium"
                  >
                    <option value="ALL">Tất cả khu vực</option>
                    {DANANG_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Giá vé */}
                <div className="flex items-center gap-1.5">
                  <Ticket size={13} className="text-orange-500" />
                  <select
                    aria-label="Lọc theo giá vé"
                    value={priceFilter}
                    onChange={(e) =>
                      applyFilter(() => setPriceFilter(e.target.value as EventPriceFilter))
                    }
                    className="text-xs border border-gray-200 rounded-xl px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-all bg-gray-50 font-medium"
                  >
                    {PRICE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sắp xếp */}
                <div className="flex items-center gap-1.5">
                  <ArrowUpDown size={13} className="text-[#0f2942]" />
                  <select
                    aria-label="Sắp xếp sự kiện"
                    value={sortBy}
                    onChange={(e) => applyFilter(() => setSortBy(e.target.value as SortOption))}
                    className="text-xs border border-gray-200 rounded-xl px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-all bg-gray-50 font-medium"
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
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
                className={`flex items-center gap-1.5 text-xs font-semibold transition-colors px-3.5 py-1.5 rounded-xl border shrink-0 ${
                  hasActiveFilters
                    ? 'text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border-red-200 cursor-pointer'
                    : 'text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed'
                }`}
                title="Đặt lại toàn bộ bộ lọc"
              >
                <RefreshCw size={13} />
                <span>Xóa bộ lọc</span>
              </button>
            </div>
          </div>
        </Reveal>
      </div>

      {/* ═══ PHẦN 3: LƯỚI THẺ SỰ KIỆN (ĐỒNG BỘ 3 CỘT VỚI LƯU TRÚ & ẨM THỰC) ═══ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-4 w-full">
        {/* Thanh tóm tắt kết quả */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <p className="text-sm font-medium text-gray-500">
            Hiển thị{' '}
            <span className="font-bold text-[#0f2942]">
              {totalResults > 0 ? (currentPage - 1) * EVENTS_PER_PAGE + 1 : 0}–
              {Math.min(currentPage * EVENTS_PER_PAGE, totalResults)}
            </span>{' '}
            trên <span className="font-bold text-[#0f2942]">{totalResults}</span> sự kiện tại Đà
            Nẵng
            {searchQuery && (
              <span>
                {' '}
                cho từ khóa &ldquo;
                <strong className="text-teal-600 font-semibold">{searchQuery}</strong>&rdquo;
              </span>
            )}
            {eventType !== 'ALL' && (
              <span>
                {' '}
                trong danh mục &ldquo;
                <strong className="text-gray-900">
                  {EVENT_TYPES[eventType as keyof typeof EVENT_TYPES] ?? eventType}
                </strong>
                &rdquo;
              </span>
            )}
          </p>

          {hasActiveFilters && (
            <span className="text-xs bg-teal-100 text-teal-700 px-2.5 py-1 rounded-full font-semibold">
              Đang áp dụng bộ lọc
            </span>
          )}
        </div>

        <div id="events-grid" className="scroll-mt-24">
          {/* 1. Đang tải */}
          {loading ? (
            <div
              role="status"
              aria-label="Đang tải danh sách sự kiện"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <EventSkeletonCard key={i} />
              ))}
            </div>
          ) : error ? (
            /* 2. Lỗi tải dữ liệu */
            <div
              role="alert"
              className="text-center py-16 bg-white rounded-3xl border border-red-200 shadow-sm p-8 max-w-lg mx-auto"
            >
              <AlertCircle className="w-14 h-14 text-red-500 mx-auto mb-3 stroke-[1.5]" />
              <h3 className="text-lg font-bold text-gray-900">Không thể tải dữ liệu sự kiện</h3>
              <p className="text-gray-600 text-sm mt-1 mb-5">{error}</p>
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => void fetchFilteredEvents(undefined, true)}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition shadow-md shadow-teal-600/20 inline-flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw size={15} />
                  Thử lại ngay
                </button>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="px-5 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-semibold transition cursor-pointer"
                  >
                    Xóa bộ lọc
                  </button>
                )}
              </div>
            </div>
          ) : paginatedEvents.length === 0 ? (
            /* 3. Không có kết quả */
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm p-8 max-w-lg mx-auto">
              <SearchX className="w-14 h-14 text-gray-300 mx-auto mb-3 stroke-[1.5]" />
              <h3 className="text-lg font-bold text-gray-800">Không tìm thấy sự kiện phù hợp</h3>
              <p className="text-gray-500 text-sm mt-1 leading-relaxed">
                Không có sự kiện nào khớp với tiêu chí lọc hiện tại của bạn. Hãy thử chọn khoảng
                thời gian khác hoặc xóa bộ lọc để xem toàn bộ sự kiện tại Đà Nẵng!
              </p>
              <button
                type="button"
                onClick={handleClearFilters}
                className="mt-5 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition shadow-md shadow-teal-600/20 cursor-pointer"
              >
                Xóa bộ lọc &amp; Xem tất cả sự kiện
              </button>
            </div>
          ) : (
            /* 4. Danh sách thẻ sự kiện */
            <AnimatePresence mode="wait">
              <motion.div
                key={`events-${currentPage}-${datePreset}-${eventType}-${district}-${priceFilter}-${debouncedSearch}-${sortBy}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
              >
                {paginatedEvents.map((event, i) => (
                  <motion.div
                    key={event.id || event.slug || i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.35,
                      delay: prefersReduced ? 0 : i * 0.05,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                    className="h-full"
                  >
                    <EventCard event={event} priority={i < 3} />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Hộp lưu ý nghiệm thu quy tắc sự kiện Đã hủy */}
        <div className="mt-8 rounded-2xl border border-gray-200/80 bg-white p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0f2942]">
                Tra cứu sự kiện đã hủy qua liên kết trực tiếp
              </h3>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                Sự kiện ở trạng thái <strong>Đã hủy</strong> được gỡ khỏi danh sách khám phá để
                tránh nhầm lẫn, nhưng người dùng đã lưu link vẫn có thể mở trang chi tiết để đọc
                thông báo chính thức.
              </p>
            </div>
          </div>
          <Link
            href="/su-kien/workshop-nhiep-anh-san-may-dinh-ban-co-da-huy"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3.5 py-2 rounded-xl transition shrink-0"
          >
            <span>Mở mẫu sự kiện đã hủy</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ═══ PHẦN 4: PHÂN TRANG (PAGINATION) ═════════════════════════════════ */}
      {totalPages > 1 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex justify-center">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => currentPage > 1 && changePage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`flex items-center justify-center w-10 h-10 rounded-xl border transition-all ${
                currentPage === 1
                  ? 'opacity-40 cursor-not-allowed border-gray-200 text-gray-400'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-100 hover:scale-105 active:scale-95'
              }`}
            >
              <ChevronLeft size={16} />
            </button>

            {pageWindow().map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => p !== currentPage && changePage(p)}
                className={`w-10 h-10 rounded-xl text-sm font-bold transition-all duration-200 ${
                  p === currentPage
                    ? 'bg-[#0f2942] text-white shadow-md scale-105'
                    : 'border border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {p}
              </button>
            ))}

            <button
              type="button"
              onClick={() => currentPage < totalPages && changePage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`flex items-center justify-center w-10 h-10 rounded-xl border transition-all ${
                currentPage === totalPages
                  ? 'opacity-40 cursor-not-allowed border-gray-200 text-gray-400'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-100 hover:scale-105 active:scale-95'
              }`}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ═══ PHẦN 5: TRUST BADGES (ĐỒNG BỘ VỚI LƯU TRÚ & ẨM THỰC) ═══════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <Reveal delay={0.05}>
          <h2 className="h2-section text-center text-xl sm:text-2xl font-bold text-[#0f2942] mb-8">
            Vì sao theo dõi sự kiện trên <span className="text-cyan-500">Danang</span>
            <span className="text-orange-400">Go</span>?
          </h2>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
          {TRUST_BADGES.map((badge, i) => {
            const Icon = badge.icon;
            return (
              <Reveal key={badge.title} delay={i * 0.1} className="flex">
                <div className="flex flex-col h-full w-full bg-white rounded-2xl p-5 shadow-sm border border-gray-100 items-center text-center hover:shadow-md transition-shadow duration-300">
                  <div
                    className={`w-12 h-12 ${badge.bg} rounded-2xl flex items-center justify-center mb-4 flex-shrink-0`}
                  >
                    <Icon size={22} className={badge.color} />
                  </div>
                  <h3 className="font-bold text-[#0f2942] text-sm mb-1.5">{badge.title}</h3>
                  <p className="body-text text-gray-500 text-xs leading-relaxed">{badge.desc}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>

      {/* ═══ PHẦN 6: CTA BANNER (SHIMMER-BG ĐỒNG BỘ LƯU TRÚ & ẨM THỰC) ═══════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 w-full">
        <Reveal delay={0.1}>
          <div className="shimmer-bg rounded-3xl p-10 sm:p-14 text-center text-white relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-teal-400/20 border border-teal-300/30 text-teal-200 text-xs font-bold px-4 py-1.5 rounded-full mb-5 uppercase tracking-wider">
                <Calendar size={13} />
                Kết hợp sự kiện vào chuyến đi
              </div>

              <h2 className="h2-section text-2xl sm:text-3xl font-bold mb-3">
                Đã chọn được sự kiện yêu thích?{' '}
                <span className="text-cyan-300">Lên lịch trình khám phá ngay!</span>
              </h2>
              <p className="body-text text-white/70 max-w-lg mx-auto mb-8 text-sm leading-relaxed">
                DanangGo giúp bạn kết hợp các lễ hội, workshop cuối tuần với điểm ăn uống và lưu trú
                gần nhất để có một chuyến đi trọn vẹn tại Đà Nẵng.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/lich-trinh/tao-moi"
                  className="btn-ripple inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold px-8 py-3.5 rounded-xl transition-colors hover:scale-[1.03] active:scale-[0.97] text-sm"
                >
                  <Calendar size={15} />
                  Tạo lịch trình của bạn
                </Link>
                <Link
                  href="/bando"
                  className="inline-flex items-center justify-center gap-2 border-2 border-white/60 hover:border-white text-white hover:bg-white/10 font-semibold px-8 py-3.5 rounded-xl transition-all text-sm"
                >
                  Xem bản đồ Đà Nẵng
                </Link>
              </div>

              <p className="text-white/40 text-xs mt-4">
                Cập nhật liên tục · Chỉ đường thuận tiện · Hoàn toàn miễn phí
              </p>
            </div>
          </div>
        </Reveal>
      </div>

      {/* ═══ PHẦN 7: FOOTER ══════════════════════════════════════════════════ */}
      <Footer />
    </div>
  );
}

export default function EventsListPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            <p className="text-sm font-medium text-gray-500">Đang tải danh sách sự kiện...</p>
          </div>
        </div>
      }
    >
      <EventsListContent />
    </Suspense>
  );
}
