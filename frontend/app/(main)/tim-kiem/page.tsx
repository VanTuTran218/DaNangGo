'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  BedDouble, ChevronRight, Clock, History, Landmark,
  MapPin, Search, Ticket, Trash2, Utensils, X,
} from 'lucide-react';
import {
  searchCatalog,
  type CatalogPlaceKind,
  type CatalogSearchItem,
  type CatalogSearchResponse,
} from '@/lib/api/search';
import {
  clearSearchHistory,
  getSearchHistory,
  recordSearchHistory,
  removeSearchHistoryEntry,
  type SearchHistoryEntry,
} from '@/lib/search-history';

const CATEGORIES: Array<{ value: CatalogPlaceKind | ''; label: string; icon: typeof BedDouble }> = [
  { value: '', label: 'Tất cả danh mục', icon: Search },
  { value: 'STAY', label: 'Nơi lưu trú', icon: BedDouble },
  { value: 'FOOD', label: 'Ẩm thực', icon: Utensils },
  { value: 'ATTRACTION', label: 'Điểm du lịch', icon: Landmark },
  { value: 'ENTERTAINMENT', label: 'Giải trí', icon: Ticket },
];

const TRENDING_SEARCHES = ['Mỹ Khê', 'Bánh mì', 'Sơn Trà', 'Bà Nà Hills', 'Khách sạn'];

const CATEGORY_LABELS: Record<CatalogPlaceKind, string> = {
  STAY: 'Lưu trú',
  FOOD: 'Ẩm thực',
  ATTRACTION: 'Điểm du lịch',
  ENTERTAINMENT: 'Giải trí',
};

const CATEGORY_ICONS: Record<CatalogPlaceKind | '', typeof Search> = {
  '': Search,
  STAY: BedDouble,
  FOOD: Utensils,
  ATTRACTION: Landmark,
  ENTERTAINMENT: Ticket,
};

function isCatalogPlaceKind(value: string | null): value is CatalogPlaceKind {
  return value === 'STAY' || value === 'FOOD' || value === 'ATTRACTION' || value === 'ENTERTAINMENT';
}

function formatPrice(price: number): string {
  return price === 0 ? 'Miễn phí' : `${price.toLocaleString('vi-VN')}đ`;
}

function priceUnit(place: CatalogSearchItem): string {
  if (place.kind === 'STAY') return place.priceBasis === 'PER_ROOM' ? '/ phòng/đêm' : '/ người/đêm';
  return '/ người';
}

/** Hiển thị thời gian tương đối: "Vừa xong", "5 phút trước", "2 giờ trước", ... */
function timeAgo(ts: number): string {
  const diffMs = Date.now() - ts;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'Vừa xong';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay} ngày trước`;
  return new Date(ts).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

function historyLabel(entry: SearchHistoryEntry): string {
  if (entry.query.trim()) return entry.query.trim();
  if (entry.kind) return CATEGORY_LABELS[entry.kind];
  return 'Tất cả địa điểm';
}

function historySub(entry: SearchHistoryEntry): string {
  const parts: string[] = [];
  if (entry.kind && entry.query.trim()) parts.push(CATEGORY_LABELS[entry.kind]);
  if (entry.minPrice !== undefined || entry.maxPrice !== undefined) {
    const min = entry.minPrice === undefined ? '0đ' : formatPrice(entry.minPrice);
    const max = entry.maxPrice === undefined ? 'không giới hạn' : formatPrice(entry.maxPrice);
    parts.push(`${min} – ${max}`);
  }
  return parts.join(' · ');
}

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<CatalogPlaceKind | ''>('');
  const [minPriceInput, setMinPriceInput] = useState('');
  const [maxPriceInput, setMaxPriceInput] = useState('');
  const [results, setResults] = useState<CatalogSearchResponse>({ items: [], suggestions: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);
  const [historyError, setHistoryError] = useState('');
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const HISTORY_PREVIEW = 3;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialQuery = params.get('q') ?? '';
    const initialMinPriceValue = params.get('minPrice') ?? '';
    const initialMaxPriceValue = params.get('maxPrice') ?? '';
    const initialQueryKind = params.get('type');
    const initialKind = isCatalogPlaceKind(initialQueryKind) ? initialQueryKind : '';
    setQuery(initialQuery);
    setKind(initialKind);
    setMinPriceInput(initialMinPriceValue);
    setMaxPriceInput(initialMaxPriceValue);

    try {
      const storedHistory = getSearchHistory();
      const parsedMinPrice = initialMinPriceValue.trim() ? Number(initialMinPriceValue) : undefined;
      const parsedMaxPrice = initialMaxPriceValue.trim() ? Number(initialMaxPriceValue) : undefined;
      const hasInitialSearch = Boolean(initialQuery.trim() || initialKind || initialMinPriceValue || initialMaxPriceValue);
      const validInitialPrice = (parsedMinPrice === undefined || (Number.isFinite(parsedMinPrice) && parsedMinPrice >= 0))
        && (parsedMaxPrice === undefined || (Number.isFinite(parsedMaxPrice) && parsedMaxPrice >= 0))
        && (parsedMinPrice === undefined || parsedMaxPrice === undefined || parsedMinPrice <= parsedMaxPrice);
      const updatedHistory = hasInitialSearch && validInitialPrice
        ? recordSearchHistory({
          query: initialQuery,
          kind: initialKind,
          ...(parsedMinPrice === undefined ? {} : { minPrice: parsedMinPrice }),
          ...(parsedMaxPrice === undefined ? {} : { maxPrice: parsedMaxPrice }),
        })
        : storedHistory;
      setHistory(updatedHistory);
    } catch (storageError) {
      setHistoryError(storageError instanceof Error ? storageError.message : 'Không thể truy cập lịch sử tìm kiếm trên thiết bị này.');
    }
    setInitialized(true);
  }, []);

  const minPrice = minPriceInput.trim() === '' ? undefined : Number(minPriceInput);
  const maxPrice = maxPriceInput.trim() === '' ? undefined : Number(maxPriceInput);
  const invalidPrice = useMemo(() =>
    (minPrice !== undefined && (!Number.isFinite(minPrice) || minPrice < 0))
    || (maxPrice !== undefined && (!Number.isFinite(maxPrice) || maxPrice < 0))
    || (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice),
  [maxPrice, minPrice]);

  useEffect(() => {
    if (!initialized) return;
    if (invalidPrice) {
      setLoading(false);
      setError('Vui lòng nhập khoảng giá hợp lệ.');
      setResults({ items: [], suggestions: [] });
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const response = await searchCatalog({ query, kind, minPrice, maxPrice }, controller.signal);
        setResults(response);
      } catch (searchError) {
        if (!controller.signal.aborted) {
          setError(searchError instanceof Error ? searchError.message : 'Không thể tải kết quả tìm kiếm.');
          setResults({ items: [], suggestions: [] });
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, query.trim() ? 250 : 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [initialized, invalidPrice, kind, maxPrice, minPrice, query, retryCount]);

  const submitSearch = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuggestionsOpen(false);
    if (!invalidPrice) {
      try {
        setHistory(recordSearchHistory({
          query,
          kind,
          ...(minPrice === undefined ? {} : { minPrice }),
          ...(maxPrice === undefined ? {} : { maxPrice }),
        }));
        setHistoryError('');
      } catch (storageError) {
        setHistoryError(storageError instanceof Error ? storageError.message : 'Không thể lưu lịch sử tìm kiếm trên thiết bị này.');
      }
    }
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (kind) params.set('type', kind);
    if (minPriceInput) params.set('minPrice', minPriceInput);
    if (maxPriceInput) params.set('maxPrice', maxPriceInput);
    router.replace(`/tim-kiem${params.size ? `?${params.toString()}` : ''}`, { scroll: false });
  }, [invalidPrice, kind, maxPrice, maxPriceInput, minPrice, minPriceInput, query, router]);

  const chooseSuggestion = useCallback((suggestion: string) => {
    setQuery(suggestion);
    setSuggestionsOpen(false);
  }, []);

  /** Áp dụng mục lịch sử vào form và tìm lại */
  const applyHistoryEntry = useCallback((entry: SearchHistoryEntry) => {
    setQuery(entry.query);
    setKind(entry.kind);
    setMinPriceInput(entry.minPrice === undefined ? '' : String(entry.minPrice));
    setMaxPriceInput(entry.maxPrice === undefined ? '' : String(entry.maxPrice));
    const params = new URLSearchParams();
    if (entry.query.trim()) params.set('q', entry.query.trim());
    if (entry.kind) params.set('type', entry.kind);
    if (entry.minPrice !== undefined) params.set('minPrice', String(entry.minPrice));
    if (entry.maxPrice !== undefined) params.set('maxPrice', String(entry.maxPrice));
    router.replace(`/tim-kiem${params.size ? `?${params.toString()}` : ''}`, { scroll: false });
  }, [router]);

  /** Xóa một mục lịch sử riêng lẻ */
  const removeEntry = useCallback((searchedAt: number, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      setHistory(removeSearchHistoryEntry(searchedAt));
      setHistoryError('');
    } catch (storageError) {
      setHistoryError(storageError instanceof Error ? storageError.message : 'Không thể xóa mục lịch sử trên thiết bị này.');
    }
  }, []);

  /** Xóa toàn bộ lịch sử */
  const removeAllHistory = useCallback(() => {
    try {
      clearSearchHistory();
      setHistory([]);
      setHistoryError('');
    } catch (storageError) {
      setHistoryError(storageError instanceof Error ? storageError.message : 'Không thể xóa lịch sử tìm kiếm trên thiết bị này.');
    }
  }, []);

  const activeCategory = CATEGORIES.find((category) => category.value === kind);

  return (
    <main className="min-h-screen bg-slate-50 pb-16 pt-28">
      <section className="bg-gradient-to-br from-[#0f2942] via-[#123d58] to-teal-700 px-4 py-10 text-white sm:py-14">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-teal-200">Khám phá Đà Nẵng</p>
            <h1 className="text-3xl font-bold sm:text-4xl">Tìm điểm đến phù hợp với bạn</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/70 sm:text-base">
              Tìm nơi lưu trú, món ngon và trải nghiệm theo từ khóa, danh mục hoặc ngân sách.
            </p>
          </div>

          <form onSubmit={submitSearch} className="grid gap-3 rounded-2xl bg-white p-3 shadow-xl md:grid-cols-[minmax(0,1fr)_220px_auto]">
            <div className="relative">
              <Search aria-hidden="true" className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onFocus={() => setSuggestionsOpen(true)}
                onBlur={() => window.setTimeout(() => setSuggestionsOpen(false), 120)}
                placeholder="Bạn muốn tìm gì? Ví dụ: Mỹ Khê, mì Quảng..."
                aria-label="Từ khóa tìm kiếm"
                aria-autocomplete="list"
                aria-expanded={suggestionsOpen && results.suggestions.length > 0}
                className="w-full rounded-xl border border-slate-200 py-3 pl-12 pr-11 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Xóa từ khóa"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              {suggestionsOpen && results.suggestions.length > 0 && (
                <div role="listbox" aria-label="Gợi ý tìm kiếm" className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-slate-100 bg-white py-1 text-slate-800 shadow-xl">
                  {results.suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      role="option"
                      aria-selected={false}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => chooseSuggestion(suggestion)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-teal-50"
                    >
                      <Search className="h-4 w-4 text-slate-400" />
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <label className="relative">
              <span className="sr-only">Danh mục địa điểm</span>
              <select
                value={kind}
                onChange={(event) => {
                  const value = event.target.value;
                  setKind(isCatalogPlaceKind(value) ? value : '');
                }}
                className="h-full min-h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              >
                {CATEGORIES.map((category) => (
                  <option key={category.value || 'all'} value={category.value}>{category.label}</option>
                ))}
              </select>
              <ChevronRight aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-slate-400" />
            </label>

            <button type="submit" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 text-sm font-semibold text-white transition hover:bg-orange-600">
              <Search className="h-4 w-4" />
              Tìm kiếm
            </button>
          </form>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 lg:grid-cols-[250px_minmax(0,1fr)]">
        {/* Sidebar bộ lọc */}
        <aside className="h-fit rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-2 text-slate-800">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <MapPin className="h-4 w-4" />
            </span>
            <div>
              <h2 className="font-bold">Bộ lọc</h2>
              <p className="text-xs text-slate-500">Tinh chỉnh kết quả</p>
            </div>
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-slate-700">Loại địa điểm</legend>
            <div className="space-y-1">
              {CATEGORIES.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.value || 'all'}
                    type="button"
                    onClick={() => setKind(category.value)}
                    aria-pressed={kind === category.value}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                      kind === category.value ? 'bg-teal-50 font-semibold text-teal-800' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {category.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="my-5 border-t border-slate-100" />
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-slate-700">Khoảng giá (VNĐ)</legend>
            <div className="grid grid-cols-2 gap-2">
              <label>
                <span className="mb-1 block text-xs text-slate-500">Từ</span>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  value={minPriceInput}
                  onChange={(event) => setMinPriceInput(event.target.value)}
                  placeholder="Tối thiểu"
                  className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-sm outline-none focus:border-teal-500"
                />
              </label>
              <label>
                <span className="mb-1 block text-xs text-slate-500">Đến</span>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  value={maxPriceInput}
                  onChange={(event) => setMaxPriceInput(event.target.value)}
                  placeholder="Tối đa"
                  className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-sm outline-none focus:border-teal-500"
                />
              </label>
            </div>
            {invalidPrice && <p role="alert" className="mt-2 text-xs text-red-600">Khoảng giá chưa hợp lệ.</p>}
          </fieldset>

          {(kind || minPriceInput || maxPriceInput) && (
            <button
              type="button"
              onClick={() => {
                setKind('');
                setMinPriceInput('');
                setMaxPriceInput('');
              }}
              className="mt-5 w-full rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Xóa bộ lọc
            </button>
          )}
        </aside>

        {/* Kết quả */}
        <section aria-live="polite">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">Kết quả tìm kiếm</p>
              <h2 className="mt-1 text-xl font-bold text-[#0f2942]">
                {loading ? 'Đang tìm địa điểm...' : `${results.items.length} địa điểm`}
                {activeCategory?.value && <span className="ml-2 text-base font-medium text-teal-700">· {activeCategory.label}</span>}
              </h2>
            </div>
          </div>

          {historyError && (
            <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <span>{historyError}</span>
              <button type="button" onClick={removeAllHistory} className="font-semibold underline underline-offset-2">
                Xóa lịch sử lỗi
              </button>
            </div>
          )}

          {/* ── Lịch sử tìm kiếm ── */}
          {history.length > 0 && (
            <div className="mb-5 rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <History className="h-4 w-4 text-teal-600" />
                  Lịch sử tìm kiếm gần đây
                  <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-500">
                    {history.length}
                  </span>
                </h3>
                <button
                  type="button"
                  onClick={removeAllHistory}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Xóa tất cả
                </button>
              </div>

              {/* Danh sách — hiển thị 3 mục mặc định, hoặc tất cả khi mở rộng */}
              <ul className="divide-y divide-slate-50">
                {(historyExpanded ? history : history.slice(0, HISTORY_PREVIEW)).map((entry, index) => {
                  const KindIcon = CATEGORY_ICONS[entry.kind];
                  const sub = historySub(entry);
                  return (
                    <li key={`${entry.searchedAt}-${index}`} className="group relative flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                      {/* Icon danh mục */}
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                        <KindIcon className="h-4 w-4" />
                      </span>

                      {/* Nội dung — bấm để tìm lại */}
                      <button
                        type="button"
                        onClick={() => applyHistoryEntry(entry)}
                        className="flex-1 min-w-0 text-left"
                        title={`Tìm lại: ${historyLabel(entry)}`}
                      >
                        <p className="truncate text-sm font-medium text-slate-800 group-hover:text-teal-700 transition-colors">
                          {historyLabel(entry)}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {sub && (
                            <span className="truncate text-xs text-slate-400">{sub}</span>
                          )}
                          <span className="flex items-center gap-1 text-xs text-slate-300 shrink-0">
                            <Clock className="h-3 w-3" />
                            {timeAgo(entry.searchedAt)}
                          </span>
                        </div>
                      </button>

                      {/* Nút xóa từng mục */}
                      <button
                        type="button"
                        onClick={(e) => removeEntry(entry.searchedAt, e)}
                        aria-label={`Xóa lịch sử "${historyLabel(entry)}"`}
                        className="shrink-0 rounded-lg p-1.5 text-slate-300 opacity-0 transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-500"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  );
                })}
              </ul>

              {/* Footer: Xem thêm / Thu gọn */}
              {history.length > HISTORY_PREVIEW && (
                <button
                  type="button"
                  onClick={() => setHistoryExpanded((prev) => !prev)}
                  className="flex w-full items-center justify-center gap-1.5 border-t border-slate-100 py-2.5 text-xs font-medium text-teal-600 transition hover:bg-teal-50"
                >
                  <ChevronRight className={`h-3.5 w-3.5 transition-transform ${historyExpanded ? '-rotate-90' : 'rotate-90'}`} />
                  {historyExpanded ? 'Thu gọn' : `Xem thêm ${history.length - HISTORY_PREVIEW} lịch sử`}
                </button>
              )}
            </div>
          )}

          {!query.trim() && !kind && !minPriceInput && !maxPriceInput && (
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="mr-1 text-sm text-slate-500">Gợi ý:</span>
              {TRENDING_SEARCHES.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => setQuery(term)}
                  className="rounded-full border border-teal-100 bg-white px-3 py-1.5 text-xs font-medium text-teal-800 transition hover:border-teal-300 hover:bg-teal-50"
                >
                  {term}
                </button>
              ))}
            </div>
          )}

          {error ? (
            <div role="alert" className="rounded-2xl border border-red-100 bg-white p-8 text-center">
              <p className="font-semibold text-red-700">Không thể tải kết quả</p>
              <p className="mt-1 text-sm text-slate-600">{error}</p>
              <button type="button" onClick={() => setRetryCount((count) => count + 1)} className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">
                Thử lại
              </button>
            </div>
          ) : loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="h-72 animate-pulse rounded-2xl bg-white shadow-sm" />
              ))}
            </div>
          ) : results.items.length === 0 ? (
            <div className="rounded-2xl border border-slate-100 bg-white px-6 py-14 text-center">
              <Search className="mx-auto h-9 w-9 text-slate-300" />
              <h3 className="mt-3 font-bold text-slate-800">Chưa tìm thấy địa điểm phù hợp</h3>
              <p className="mt-1 text-sm text-slate-500">Hãy thử từ khóa khác hoặc điều chỉnh bộ lọc giá và danh mục.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {results.items.map((place) => (
                <article key={place.id} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                  <div
                    role="img"
                    aria-label={place.name}
                    className="h-44 bg-cover bg-center"
                    style={{ backgroundImage: `linear-gradient(180deg, transparent 50%, rgba(15, 41, 66, 0.5)), url("${place.imageUrl}")` }}
                  >
                    <span className="ml-3 mt-3 inline-flex rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-teal-800 shadow-sm">
                      {CATEGORY_LABELS[place.kind]}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="line-clamp-1 font-bold text-[#0f2942]" title={place.name}>{place.name}</h3>
                    <p className="mt-1 flex items-start gap-1.5 text-xs text-slate-500">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span className="line-clamp-1">{place.address}</span>
                    </p>
                    <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-slate-600">{place.description}</p>
                    <div className="mt-4 flex items-end justify-between border-t border-slate-100 pt-3">
                      {place.kind === 'STAY' && place.stars && (
                        <span className="text-xs font-medium text-amber-600">{place.stars} sao · {place.accommodationType}</span>
                      )}
                      {place.kind !== 'STAY' && <span className="text-xs text-slate-400">{place.mealPeriod ? 'Món ăn' : 'Trải nghiệm'}</span>}
                      <span className="text-right font-bold text-orange-600">
                        {formatPrice(place.price)}
                        {place.price > 0 && <small className="ml-1 font-normal text-slate-500">{priceUnit(place)}</small>}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
