"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Banknote,
  BedDouble,
  Check,
  ChevronDown,
  ChevronLeft,
  CircleAlert,
  Compass,
  MapPin,
  RotateCcw,
  Sparkles,
  Star,
  UtensilsCrossed,
  Wallet,
  X,
} from 'lucide-react';
import { getDistricts, getCuisines, getTastes, getAttractionCategories, type CategoryItem } from '@/lib/api/categories';
import { getRecommendations, type RecommendationItem, type RecommendationRequest, type RecommendationResponse, type RecommendationType } from '@/lib/api/recommendations';
import { formatCurrency } from '@/lib/mappers/place.mapper';

const TYPE_OPTIONS: {
  id: RecommendationType;
  label: string;
  hint: string;
  icon: typeof BedDouble;
  tone: string;
}[] = [
  {
    id: 'ACCOMMODATION',
    label: 'Lưu trú',
    hint: 'Khách sạn · Resort',
    icon: BedDouble,
    tone: 'sky',
  },
  {
    id: 'RESTAURANT',
    label: 'Ăn uống',
    hint: 'Quán ngon · Hải sản',
    icon: UtensilsCrossed,
    tone: 'sunset',
  },
  {
    id: 'ATTRACTION',
    label: 'Tham quan',
    hint: 'Danh thắng · Biển',
    icon: Compass,
    tone: 'teal',
  },
];

const GROUPS = [
  { key: 'accommodations', type: 'ACCOMMODATION', title: 'Lưu trú' },
  { key: 'restaurants', type: 'RESTAURANT', title: 'Ăn uống' },
  { key: 'attractions', type: 'ATTRACTION', title: 'Tham quan' },
] as const;

const QUICK_BUDGET_PRESETS = [
  { label: '500K', value: 500000 },
  { label: '1 triệu', value: 1000000 },
  { label: '2 triệu', value: 2000000 },
  { label: '3 triệu', value: 3000000 },
  { label: '5 triệu', value: 5000000 },
];

const SLIDER_MAX = 5000000;

const EMPTY_HINTS = {
  accommodations: 'Chỉ hiện cơ sở có phòng đang hoạt động, giá theo đêm trong ngân sách và hạng sao đã được cập nhật nếu bạn lọc theo sao.',
  restaurants: 'Chỉ hiện nhà hàng có đủ khoảng giá để so với ngân sách; các nhà hàng chưa có giá sẽ không xuất hiện.',
  attractions: 'Chỉ hiện điểm tham quan có thông tin giá vé và giá vé nằm trong ngân sách.',
};

const ACCOMMODATION_TYPE_OPTIONS = [
  { id: 1, name: 'Khách sạn', value: 'HOTEL' },
  { id: 2, name: 'Homestay', value: 'HOMESTAY' },
  { id: 3, name: 'Resort', value: 'RESORT' },
  { id: 4, name: 'Hostel', value: 'HOSTEL' },
  { id: 5, name: 'Căn hộ', value: 'APARTMENT' },
];
const STAR_OPTIONS = [1, 2, 3, 4, 5].map((id) => ({ id, name: `${id} sao` }));

function ChoiceChips({
  items,
  selected,
  onToggle,
  disabled = false,
}: {
  items: CategoryItem[];
  selected: number[];
  onToggle: (id: number) => void;
  disabled?: boolean;
}) {
  if (!items.length) return <p className="text-xs text-[#94B0B3]">Chưa có lựa chọn.</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => {
        const active = selected.includes(item.id);
        return (
          <motion.button
            key={item.id}
            type="button"
            disabled={disabled}
            whileTap={{ scale: 0.96 }}
            aria-pressed={active}
            onClick={() => onToggle(item.id)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-50 cursor-pointer ${
              active
                ? 'border-[#E6D9B7] bg-[#E6D9B7] font-semibold text-[#06151C] shadow-[0_6px_16px_rgba(230,217,183,0.22)]'
                : 'border-[#E6D9B7]/18 bg-[#0A202B]/85 text-[#CBD9DA] hover:border-[#E6D9B7]/48 hover:text-[#FFFDF5]'
            }`}
          >
            {active && <Check size={12} aria-hidden="true" className="text-[#06151C]" />}
            {item.name}
          </motion.button>
        );
      })}
    </div>
  );
}

function RecommendationCard({ item, index }: { item: RecommendationItem; index: number }) {
  const reduceMotion = useReducedMotion();
  const [imgFailed, setImgFailed] = useState(false);

  const price =
    item.place_type === 'ATTRACTION'
      ? item.ticket_price === 0
        ? 'Miễn phí'
        : formatCurrency(item.ticket_price ?? 0)
      : item.place_type === 'ACCOMMODATION'
      ? `Từ ${formatCurrency(item.price_min ?? 0)} / đêm`
      : item.price_min === item.price_max
      ? formatCurrency(item.price_min ?? 0)
      : `Từ ${formatCurrency(item.price_min ?? 0)}${item.price_max ? ` – ${formatCurrency(item.price_max)}` : ''}`;

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.22, delay: reduceMotion ? 0 : Math.min(index * 0.04, 0.2) }}
      className="group overflow-hidden rounded-2xl border border-[#E6D9B7]/18 bg-[#091F2A]/90 transition-all duration-200 hover:border-[#E6D9B7]/48 hover:bg-[#0D2A38]/95 hover:shadow-[0_14px_32px_rgba(2,10,15,0.5)]"
    >
      <Link href={`/places/${item.place_id}`} className="flex h-full items-center gap-3.5 p-3.5 sm:gap-4">
        <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-xl border border-[#E6D9B7]/16 bg-[#06151C] sm:h-26 sm:w-32">
          {item.cover_image && !imgFailed ? (
            <Image
              src={item.cover_image}
              alt=""
              fill
              unoptimized
              sizes="128px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div className="grid h-full place-items-center text-[#2DD4BF]/80">
              <MapPin size={22} />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="line-clamp-2 text-sm font-bold text-[#FFFDF5] group-hover:text-[#E6D9B7] transition-colors">
              {item.name}
            </h4>
            <ArrowRight size={15} className="shrink-0 text-[#E6D9B7]/55 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-[#E6D9B7] mt-0.5" />
          </div>
          <p className="mt-1 flex items-center gap-1 truncate text-xs text-[#94B0B3]">
            <MapPin size={12} className="shrink-0 text-[#2DD4BF]" />
            {item.district_name || item.address || 'Đà Nẵng'}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-[#CBD9DA]">
            <span className="inline-flex items-center gap-1 font-semibold text-[#FFFDF5]">
              <Star size={12} className="fill-[#E87B39] text-[#E87B39]" />
              {item.avg_rating.toFixed(1)}
              <span className="font-normal text-[#94B0B3]">({item.review_count})</span>
            </span>
            {(item.cuisine_name || item.category_name || item.accommodation_type) && (
              <span className="rounded-md bg-[#06151C]/80 border border-[#E6D9B7]/15 px-2 py-0.5 text-[10px] text-[#E6D9B7]">
                {item.cuisine_name || item.category_name || item.accommodation_type}
              </span>
            )}
            {item.star_rating && (
              <span className="text-[#E6D9B7] font-medium">{item.star_rating} sao</span>
            )}
          </div>
          <p className="mt-2 inline-flex items-center rounded-lg bg-[#E87B39]/14 border border-[#E87B39]/30 px-2.5 py-0.5 text-xs font-bold text-[#F5B281]">
            {price}
          </p>
        </div>
      </Link>
    </motion.article>
  );
}

export interface BudgetRecommendationProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
  initialBudget?: number | string;
  onApplyBudget?: (budget: number) => void;
}

export default function BudgetRecommendation({
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
  initialBudget,
  onApplyBudget,
}: BudgetRecommendationProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = (val: boolean) => {
    if (isControlled) {
      onOpenChange?.(val);
    } else {
      setInternalOpen(val);
    }
  };

  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const [budgetText, setBudgetText] = useState('');
  const [types, setTypes] = useState<RecommendationType[]>([]);
  const [districtId, setDistrictId] = useState('');
  const [districtMenuOpen, setDistrictMenuOpen] = useState(false);
  const [cuisineIds, setCuisineIds] = useState<number[]>([]);
  const [tasteIds, setTasteIds] = useState<number[]>([]);
  const [attractionCategoryIds, setAttractionCategoryIds] = useState<number[]>([]);
  const [accommodationTypeIds, setAccommodationTypeIds] = useState<number[]>([]);
  const [starRatings, setStarRatings] = useState<number[]>([]);
  const [districts, setDistricts] = useState<CategoryItem[]>([]);
  const [cuisines, setCuisines] = useState<CategoryItem[]>([]);
  const [tastes, setTastes] = useState<CategoryItem[]>([]);
  const [attractionCategories, setAttractionCategories] = useState<CategoryItem[]>([]);
  const [categoryError, setCategoryError] = useState('');
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<RecommendationResponse | null>(null);
  const [showResults, setShowResults] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const districtDropdownRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!districtMenuOpen) return;
    const onOutside = (e: MouseEvent) => {
      if (districtDropdownRef.current && !districtDropdownRef.current.contains(e.target as Node)) {
        setDistrictMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [districtMenuOpen]);

  useEffect(() => {
    setPortalRoot(document.body);
  }, []);

  useEffect(() => {
    if (initialBudget) {
      const num = typeof initialBudget === 'string' ? Number(initialBudget.replace(/\D/g, '')) : initialBudget;
      if (num > 0 && !budgetText) {
        setBudgetText(new Intl.NumberFormat('vi-VN').format(num));
      }
    }
  }, [initialBudget, budgetText]);

  const budget = Number(budgetText.replace(/\D/g, ''));
  const sliderValue = Math.min(SLIDER_MAX, Math.max(0, budget || 0));
  const sliderPercent = Math.round((sliderValue / SLIDER_MAX) * 100);
  const valid = budget > 0 && Number.isSafeInteger(budget) && types.length > 0 && !categoryError;
  const selectedResults = useMemo(
    () => (results ? GROUPS.filter((group) => types.includes(group.type)) : []),
    [results, types]
  );

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const frame = requestAnimationFrame(() => closeRef.current?.focus());
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusables = [
        ...dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href]'
        ),
      ];
      if (!focusables.length) return;
      if (event.shiftKey && document.activeElement === focusables[0]) {
        event.preventDefault();
        focusables.at(-1)?.focus();
      } else if (!event.shiftKey && document.activeElement === focusables.at(-1)) {
        event.preventDefault();
        focusables[0].focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = oldOverflow;
      if (previous === triggerRef.current) requestAnimationFrame(() => triggerRef.current?.focus());
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setCategoriesLoading(true);
    Promise.all([getDistricts(), getCuisines(), getTastes(), getAttractionCategories()])
      .then(([d, c, t, a]) => {
        if (active) {
          setDistricts(d);
          setCuisines(c);
          setTastes(t);
          setAttractionCategories(a);
          setCategoryError('');
        }
      })
      .catch(() => {
        if (active) setCategoryError('Không tải được danh mục. Hãy đóng và mở lại để thử lại.');
      })
      .finally(() => {
        if (active) setCategoriesLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open]);

  function close() {
    setOpen(false);
  }

  function toggleType(type: RecommendationType) {
    setAttempted(true);
    setTypes((current) => (current.includes(type) ? current.filter((item) => item !== type) : [...current, type]));
    if (type === 'RESTAURANT') {
      setCuisineIds([]);
      setTasteIds([]);
    }
    if (type === 'ATTRACTION') setAttractionCategoryIds([]);
    if (type === 'ACCOMMODATION') {
      setAccommodationTypeIds([]);
      setStarRatings([]);
    }
  }

  function toggleId(current: number[], setter: (value: number[]) => void, id: number) {
    setter(current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  }

  function handleBudgetChange(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 15);
    setBudgetText(digits ? new Intl.NumberFormat('vi-VN').format(Number(digits)) : '');
  }

  function handleSelectPreset(val: number) {
    setBudgetText(new Intl.NumberFormat('vi-VN').format(val));
  }

  async function submit(event?: React.FormEvent) {
    event?.preventDefault();
    setAttempted(true);
    setError('');
    if (!valid || loading) return;

    if (budget > 0) {
      onApplyBudget?.(budget);
    }

    setLoading(true);
    const payload: RecommendationRequest = {
      budget,
      types,
      ...(districtId ? { districtId: Number(districtId) } : {}),
      cuisineIds: types.includes('RESTAURANT') ? cuisineIds : [],
      tasteIds: types.includes('RESTAURANT') ? tasteIds : [],
      attractionCategoryIds: types.includes('ATTRACTION') ? attractionCategoryIds : [],
      accommodationTypes: types.includes('ACCOMMODATION')
        ? accommodationTypeIds.map(
            (id) =>
              ACCOMMODATION_TYPE_OPTIONS.find((item) => item.id === id)!
                .value as RecommendationRequest['accommodationTypes'][number]
          )
        : [],
      starRatings: types.includes('ACCOMMODATION') ? starRatings : [],
    };
    try {
      setResults(await getRecommendations(payload));
      setShowResults(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể tải gợi ý. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }

  function onDialogKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' && event.target instanceof HTMLInputElement && event.target.type === 'text')
      event.stopPropagation();
  }

  return (
    <>
      {!hideTrigger && (
        <motion.button
          ref={triggerRef}
          type="button"
          whileHover={reduceMotion ? undefined : { y: -2 }}
          whileTap={reduceMotion ? undefined : { scale: 0.98 }}
          onClick={() => {
            setOpen(true);
            setShowResults(false);
            setError('');
          }}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#E6D9B7]/35 bg-[#0A2330]/90 px-5 py-3 text-sm font-semibold text-[#E6D9B7] shadow-[0_12px_28px_rgba(2,10,15,0.4)] transition-all hover:border-[#E6D9B7]/70 hover:bg-[#0F2F3E] hover:text-[#FFFDF5] sm:w-auto cursor-pointer"
        >
          <motion.span aria-hidden="true" whileHover={reduceMotion ? undefined : { rotate: -8 }}>
            <Banknote size={18} className="text-[#E87B39]" />
          </motion.span>
          Gợi ý theo ngân sách
        </motion.button>
      )}

      {portalRoot &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-[#020A0F]/75 p-3 backdrop-blur-md sm:p-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.2 }}
                onMouseDown={(event) => {
                  if (event.target === event.currentTarget) close();
                }}
              >
                <motion.div
                  ref={dialogRef}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="budget-title"
                  aria-describedby="budget-description"
                  tabIndex={-1}
                  data-lenis-prevent
                  onKeyDown={onDialogKeyDown}
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 10 }}
                  transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="relative flex max-h-[90vh] w-full max-w-[590px] flex-col overflow-hidden rounded-[24px] bg-[#071821]/95 backdrop-blur-2xl border border-[#E6D9B7]/28 shadow-[0_36px_96px_rgba(2,10,15,0.82),inset_0_1px_0_rgba(255,253,245,0.12)] outline-none text-[#FFFDF5]"
                >
                  {/* Ambient Soft Top Aura */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-44 w-[420px] rounded-full opacity-55"
                    style={{
                      background:
                        'radial-gradient(ellipse, rgba(45,212,191,0.22) 0%, rgba(230,217,183,0.14) 45%, transparent 72%)',
                    }}
                  />

                  {/* Subtle Leica Corner Hairlines */}
                  <span aria-hidden="true" className="pointer-events-none absolute top-3 left-3 w-3 h-3 border-t border-l border-[#E6D9B7]/35 rounded-tl-sm z-20" />
                  <span aria-hidden="true" className="pointer-events-none absolute top-3 right-3 w-3 h-3 border-t border-r border-[#E6D9B7]/35 rounded-tr-sm z-20" />

                  {/* ══ HEADER (NOCTURNAL EDITORIAL GLASS) ══ */}
                  <header className="relative z-10 flex items-start justify-between border-b border-[#E6D9B7]/14 px-6 py-5">
                    <div>
                      {showResults ? (
                        <button
                          type="button"
                          onClick={() => setShowResults(false)}
                          className="mb-2 inline-flex items-center gap-1 rounded-full border border-[#E6D9B7]/24 bg-[#0B222E]/90 px-3 py-1 text-[11px] font-semibold text-[#E6D9B7] hover:border-[#E6D9B7]/60 hover:text-[#FFFDF5] transition-colors cursor-pointer"
                        >
                          <ChevronLeft size={14} /> Thay đổi tiêu chí
                        </button>
                      ) : (
                        <div className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#E6D9B7]">
                          <Sparkles size={11} className="text-[#E87B39]" />
                          <span>DANANGGO BUDGET CONCIERGE</span>
                        </div>
                      )}
                      <h2
                        id="budget-title"
                        className="cinematic-condensed uppercase text-2xl sm:text-[1.9rem] font-bold text-[#FFFDF5] tracking-[0.01em] leading-none"
                      >
                        {showResults ? (
                          <>
                            Địa điểm{' '}
                            <span className="home-serif italic font-normal normal-case text-[#E6D9B7]">
                              phù hợp ngân sách
                            </span>
                          </>
                        ) : (
                          <>
                            Khám phá{' '}
                            <span className="home-serif italic font-normal normal-case text-[#E6D9B7]">
                              theo ngân sách
                            </span>
                          </>
                        )}
                      </h2>
                      <p id="budget-description" className="mt-1.5 text-xs sm:text-[13px] text-[#94B0B3]">
                        {showResults
                          ? `Gợi ý tối ưu trong mức chi ${formatCurrency(budget)}`
                          : 'Thiết lập ngân sách và loại hình bạn muốn để chọn lọc điểm đến chuẩn xác tại Đà Nẵng.'}
                      </p>
                    </div>
                    <button
                      ref={closeRef}
                      type="button"
                      onClick={close}
                      aria-label="Đóng"
                      className="w-9 h-9 rounded-full border border-[#E6D9B7]/22 bg-[#0B222E]/88 flex items-center justify-center text-[#E6D9B7] hover:border-[#E6D9B7]/60 hover:bg-[#103040] hover:text-[#FFFDF5] transition-all shrink-0 ml-3 cursor-pointer"
                    >
                      <X size={17} />
                    </button>
                  </header>

                  {/* ══ BODY ══ */}
                  {showResults && results ? (
                    <main className="relative z-10 min-h-0 flex-1 space-y-6 overflow-y-auto bando-sidebar-scroll p-6" aria-live="polite">
                      {loading ? (
                        <div className="space-y-3" aria-label="Đang tải gợi ý">
                          {[0, 1, 2].map((i) => (
                            <div
                              key={i}
                              className={`h-28 rounded-2xl bg-[#0B222E] border border-[#E6D9B7]/14 ${
                                reduceMotion ? '' : 'animate-pulse'
                              }`}
                            />
                          ))}
                        </div>
                      ) : null}

                      {selectedResults.every((group) => results.groups[group.key].length === 0) && (
                        <div className="rounded-2xl bg-[#0A202B]/90 border border-[#E6D9B7]/20 px-5 py-5 text-[#FFFDF5]">
                          <p className="font-bold text-[#E6D9B7]">Chưa tìm thấy địa điểm phù hợp.</p>
                          <p className="mt-1.5 text-xs sm:text-sm text-[#CBD9DA]/80 leading-relaxed">
                            Bạn có thể tăng ngân sách hoặc bỏ bớt bộ lọc rồi thử lại nhé.
                          </p>
                        </div>
                      )}

                      {selectedResults.map((group) => (
                        <section key={group.key} aria-labelledby={`group-${group.key}`}>
                          <div className="mb-3 flex items-center justify-between">
                            <h3 id={`group-${group.key}`} className="text-xs font-bold uppercase tracking-[0.16em] text-[#E6D9B7]">
                              {group.title}
                            </h3>
                            <span className="rounded-full bg-[#0B222E] border border-[#E6D9B7]/20 px-2.5 py-0.5 text-[11px] font-semibold font-mono text-[#2DD4BF]">
                              {results.groups[group.key].length} địa điểm
                            </span>
                          </div>
                          {results.groups[group.key].length ? (
                            <div className="grid gap-3">
                              {results.groups[group.key].map((item, index) => (
                                <RecommendationCard key={item.place_id} item={item} index={index} />
                              ))}
                            </div>
                          ) : (
                            <p className="rounded-2xl bg-[#0A202B]/75 border border-[#E6D9B7]/14 px-4 py-3.5 text-xs text-[#94B0B3] leading-relaxed">
                              Chưa có địa điểm {group.title.toLowerCase()} phù hợp với tiêu chí này.{' '}
                              {EMPTY_HINTS[group.key]}
                            </p>
                          )}
                        </section>
                      ))}

                      {error && (
                        <div
                          role="alert"
                          className="rounded-xl bg-[#2C1314]/85 border border-rose-400/40 p-3.5 text-xs text-rose-200"
                        >
                          {error}
                          <button
                            type="button"
                            onClick={() => submit()}
                            className="ml-2 inline-flex items-center gap-1 font-semibold text-[#E6D9B7] underline cursor-pointer"
                          >
                            <RotateCcw size={13} /> Thử lại
                          </button>
                        </div>
                      )}
                    </main>
                  ) : (
                    <form onSubmit={submit} className="relative z-10 min-h-0 flex-1 overflow-y-auto bando-sidebar-scroll px-6 pt-5 pb-0">
                      <div className="space-y-5 pb-6">
                        {/* 1. KHỐI NGÂN SÁCH DỰ KIẾN + SLIDER + 5 PRESETS TRÊN 1 HÀNG */}
                        <div className="rounded-2xl border border-[#E6D9B7]/18 bg-[#0A202B]/72 p-4">
                          <div className="flex items-center justify-between mb-2.5">
                            <label htmlFor="budget-amount" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#E6D9B7]">
                              <Wallet size={13} className="text-[#E87B39]" />
                              Ngân sách dự kiến
                            </label>
                            {budget > 0 && (
                              <button
                                type="button"
                                onClick={() => setBudgetText('')}
                                className="text-[11px] font-medium text-[#94B0B3] hover:text-[#FFFDF5] transition-colors cursor-pointer"
                              >
                                Xóa số tiền
                              </button>
                            )}
                          </div>

                          <div className="relative">
                            <input
                              id="budget-amount"
                              type="text"
                              inputMode="numeric"
                              autoComplete="off"
                              value={budgetText}
                              onChange={(e) => handleBudgetChange(e.target.value)}
                              onBlur={() => setAttempted(true)}
                              aria-invalid={attempted && !(budget > 0)}
                              aria-describedby="budget-hint budget-error"
                              placeholder="1.000.000"
                              className="w-full rounded-xl border border-[#E6D9B7]/24 bg-[#06151C]/92 py-3.5 pl-4 pr-20 text-xl font-bold font-mono tracking-tight text-[#FFFDF5] placeholder-[#94B0B3]/45 outline-none focus:border-[#E6D9B7]/75 focus:ring-2 focus:ring-[#E6D9B7]/15 transition-all"
                            />
                            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg border border-[#E6D9B7]/25 bg-[#0D2734] px-2.5 py-1 text-[11px] font-bold tracking-wider text-[#E6D9B7]">
                              VNĐ
                            </span>
                          </div>

                          {/* Smooth Interactive Budget Slider */}
                          <div className="mt-3.5 px-0.5">
                            <input
                              type="range"
                              min={0}
                              max={SLIDER_MAX}
                              step={100000}
                              aria-label="Kéo chọn nhanh ngân sách"
                              value={sliderValue}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setBudgetText(val > 0 ? new Intl.NumberFormat('vi-VN').format(val) : '');
                              }}
                              className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-[#E87B39]"
                              style={{
                                background: `linear-gradient(90deg, #E87B39 0%, #E6D9B7 ${sliderPercent}%, rgba(230,217,183,0.16) ${sliderPercent}%)`,
                              }}
                            />
                          </div>

                          {/* 5 Balanced Quick Presets on a single clean row */}
                          <div className="mt-3 grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                            {QUICK_BUDGET_PRESETS.map((p) => {
                              const isSelected = budget === p.value;
                              return (
                                <button
                                  key={p.value}
                                  type="button"
                                  onClick={() => handleSelectPreset(p.value)}
                                  className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-[#E6D9B7] border-[#E6D9B7] text-[#06151C] shadow-[0_6px_16px_rgba(230,217,183,0.24)]'
                                      : 'bg-[#06151C]/80 border-[#E6D9B7]/16 text-[#CBD9DA] hover:text-[#FFFDF5] hover:border-[#E6D9B7]/45'
                                  }`}
                                >
                                  {p.label}
                                </button>
                              );
                            })}
                          </div>

                          <p id="budget-hint" className="mt-2.5 text-[11px] text-[#94B0B3] leading-relaxed">
                            Với ăn uống, ngân sách được đối chiếu với mức giá trung bình của nhà hàng.
                          </p>
                          {attempted && !(budget > 0) && (
                            <p
                              id="budget-error"
                              role="alert"
                              className="mt-2.5 inline-flex items-center gap-1.5 text-xs text-[#FCD9B6] bg-[#311612]/85 border border-[#E87B39]/45 px-3 py-2 rounded-xl"
                            >
                              <CircleAlert size={14} className="text-[#E87B39] shrink-0" /> Ngân sách phải là số dương lớn hơn 0.
                            </p>
                          )}
                        </div>

                        {/* 2. LOẠI ĐỊA ĐIỂM — 3 THẺ TRỰC QUAN CÓ ICON */}
                        <fieldset>
                          <div className="flex items-center justify-between mb-2.5">
                            <legend className="text-xs font-bold uppercase tracking-[0.14em] text-[#E6D9B7]">
                              Loại địa điểm
                            </legend>
                            <span className="text-[11px] text-[#94B0B3]">Chọn ít nhất 1 mục</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2.5">
                            {TYPE_OPTIONS.map((option) => {
                              const selected = types.includes(option.id);
                              const Icon = option.icon;
                              return (
                                <motion.button
                                  key={option.id}
                                  type="button"
                                  whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                                  aria-pressed={selected}
                                  onClick={() => toggleType(option.id)}
                                  className={`relative flex flex-col items-start gap-2 rounded-2xl border p-3.5 text-left transition-all cursor-pointer ${
                                    selected
                                      ? 'border-[#E6D9B7]/75 bg-gradient-to-br from-[#123342]/95 to-[#0A222E]/95 shadow-[0_12px_26px_rgba(2,10,15,0.45),inset_0_1px_0_rgba(230,217,183,0.2)]'
                                      : 'border-[#E6D9B7]/16 bg-[#0A202B]/72 hover:border-[#E6D9B7]/42 hover:bg-[#0D2835]/88'
                                  }`}
                                >
                                  <div className="flex w-full items-center justify-between">
                                    <span
                                      className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-colors ${
                                        selected
                                          ? 'bg-[#E87B39] border-[#E87B39] text-[#FFFDF5]'
                                          : 'bg-[#06151C]/85 border-[#E6D9B7]/20 text-[#E6D9B7]'
                                      }`}
                                    >
                                      <Icon size={15} />
                                    </span>
                                    <span
                                      className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                                        selected
                                          ? 'bg-[#E6D9B7] border-[#E6D9B7] text-[#06151C]'
                                          : 'border-[#E6D9B7]/25 bg-transparent'
                                      }`}
                                    >
                                      {selected && <Check size={11} strokeWidth={3} />}
                                    </span>
                                  </div>
                                  <div>
                                    <span className={`block text-sm font-bold leading-tight ${selected ? 'text-[#FFFDF5]' : 'text-[#E8F0F0]'}`}>
                                      {option.label}
                                    </span>
                                    <span className="mt-0.5 block text-[10.5px] text-[#94B0B3] leading-snug">
                                      {option.hint}
                                    </span>
                                  </div>
                                </motion.button>
                              );
                            })}
                          </div>
                          {attempted && types.length === 0 && (
                            <p role="alert" className="mt-2.5 inline-flex items-center gap-1.5 text-xs text-[#FCD9B6] bg-[#311612]/85 border border-[#E87B39]/45 px-3 py-2 rounded-xl">
                              <CircleAlert size={14} className="text-[#E87B39] shrink-0" /> Hãy chọn ít nhất một loại địa điểm.
                            </p>
                          )}
                        </fieldset>

                        {/* 3. QUẬN / KHU VỰC — BESPOKE DARK-GLASS DROPDOWN */}
                        <div ref={districtDropdownRef} className="relative">
                          <label htmlFor="budget-district-btn" className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[#E6D9B7]">
                            Quận / Khu vực
                          </label>
                          <button
                            id="budget-district-btn"
                            type="button"
                            aria-haspopup="listbox"
                            aria-expanded={districtMenuOpen}
                            onClick={() => setDistrictMenuOpen((prev) => !prev)}
                            className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-left text-sm font-medium transition-all cursor-pointer ${
                              districtMenuOpen
                                ? 'border-[#E6D9B7]/70 bg-[#0D2835] text-[#FFFDF5]'
                                : 'border-[#E6D9B7]/22 bg-[#0A202B]/90 text-[#FFFDF5] hover:border-[#E6D9B7]/45'
                            }`}
                          >
                            <span className="flex items-center gap-2.5 min-w-0">
                              <MapPin size={15} className="shrink-0 text-[#2DD4BF]" />
                              <span className="truncate">
                                {districtId
                                  ? districts.find((d) => String(d.id) === districtId)?.name ?? 'Tất cả quận / khu vực tại Đà Nẵng'
                                  : 'Tất cả quận / khu vực tại Đà Nẵng'}
                              </span>
                            </span>
                            <ChevronDown
                              size={15}
                              className={`shrink-0 text-[#E6D9B7]/75 transition-transform duration-200 ${
                                districtMenuOpen ? 'rotate-180 text-[#E6D9B7]' : ''
                              }`}
                            />
                          </button>

                          <AnimatePresence>
                            {districtMenuOpen && (
                              <motion.ul
                                role="listbox"
                                aria-label="Chọn quận hoặc khu vực"
                                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.98 }}
                                transition={{ duration: 0.16 }}
                                className="absolute bottom-full left-0 right-0 mb-2 z-30 max-h-56 overflow-y-auto bando-sidebar-scroll rounded-2xl border border-[#E6D9B7]/32 bg-[#06151C]/98 p-1.5 shadow-[0_-18px_48px_rgba(2,10,15,0.82)] backdrop-blur-2xl"
                              >
                                <li>
                                  <button
                                    type="button"
                                    role="option"
                                    aria-selected={districtId === ''}
                                    onClick={() => {
                                      setDistrictId('');
                                      setDistrictMenuOpen(false);
                                    }}
                                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                                      districtId === ''
                                        ? 'bg-[#E6D9B7]/16 text-[#E6D9B7] font-semibold'
                                        : 'text-[#CBD9DA] hover:bg-[#0D2734] hover:text-[#FFFDF5]'
                                    }`}
                                  >
                                    <span>Tất cả quận / khu vực tại Đà Nẵng</span>
                                    {districtId === '' && <Check size={14} className="text-[#E6D9B7]" />}
                                  </button>
                                </li>
                                {districts.map((d) => {
                                  const active = String(d.id) === districtId;
                                  return (
                                    <li key={d.id}>
                                      <button
                                        type="button"
                                        role="option"
                                        aria-selected={active}
                                        onClick={() => {
                                          setDistrictId(String(d.id));
                                          setDistrictMenuOpen(false);
                                        }}
                                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                                          active
                                            ? 'bg-[#E6D9B7]/16 text-[#E6D9B7] font-semibold'
                                            : 'text-[#CBD9DA] hover:bg-[#0D2734] hover:text-[#FFFDF5]'
                                        }`}
                                      >
                                        <span>{d.name}</span>
                                        {active && <Check size={14} className="text-[#E6D9B7]" />}
                                      </button>
                                    </li>
                                  );
                                })}
                              </motion.ul>
                            )}
                          </AnimatePresence>
                        </div>

                        {categoryError && (
                          <p role="alert" className="rounded-xl bg-[#2C1314]/85 border border-rose-400/40 p-3 text-xs text-rose-200">
                            {categoryError}
                          </p>
                        )}

                        {loading && (
                          <div role="status" aria-label="Đang tải gợi ý" className="space-y-2">
                            {[0, 1].map((item) => (
                              <div
                                key={item}
                                className={`h-16 rounded-2xl bg-[#0A202B] border border-[#E6D9B7]/14 ${
                                  reduceMotion ? '' : 'animate-pulse'
                                }`}
                              />
                            ))}
                            <span className="sr-only">Đang tìm địa điểm phù hợp…</span>
                          </div>
                        )}

                        {/* Sở thích ăn uống */}
                        {types.includes('RESTAURANT') && (
                          <fieldset className="space-y-3.5 rounded-2xl bg-[#0A202B]/75 border border-[#E6D9B7]/18 p-4">
                            <legend className="px-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#E6D9B7]">
                              Sở thích ăn uống
                            </legend>
                            <div>
                              <p className="mb-2 text-xs font-medium text-[#94B0B3]">Loại món</p>
                              <ChoiceChips
                                items={cuisines}
                                selected={cuisineIds}
                                onToggle={(id) => toggleId(cuisineIds, setCuisineIds, id)}
                                disabled={Boolean(categoryError)}
                              />
                            </div>
                            <div>
                              <p className="mb-2 text-xs font-medium text-[#94B0B3]">Khẩu vị</p>
                              <ChoiceChips
                                items={tastes}
                                selected={tasteIds}
                                onToggle={(id) => toggleId(tasteIds, setTasteIds, id)}
                                disabled={Boolean(categoryError)}
                              />
                            </div>
                          </fieldset>
                        )}

                        {/* Loại điểm tham quan */}
                        {types.includes('ATTRACTION') && (
                          <fieldset className="rounded-2xl bg-[#0A202B]/75 border border-[#E6D9B7]/18 p-4">
                            <legend className="px-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#E6D9B7]">
                              Loại điểm tham quan
                            </legend>
                            <ChoiceChips
                              items={attractionCategories}
                              selected={attractionCategoryIds}
                              onToggle={(id) => toggleId(attractionCategoryIds, setAttractionCategoryIds, id)}
                              disabled={Boolean(categoryError)}
                            />
                          </fieldset>
                        )}

                        {/* Sở thích lưu trú */}
                        {types.includes('ACCOMMODATION') && (
                          <fieldset className="space-y-3.5 rounded-2xl bg-[#0A202B]/75 border border-[#E6D9B7]/18 p-4">
                            <legend className="px-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#E6D9B7]">
                              Sở thích lưu trú
                            </legend>
                            <div>
                              <p className="mb-2 text-xs font-medium text-[#94B0B3]">Loại hình</p>
                              <ChoiceChips
                                items={ACCOMMODATION_TYPE_OPTIONS}
                                selected={accommodationTypeIds}
                                onToggle={(id) => toggleId(accommodationTypeIds, setAccommodationTypeIds, id)}
                              />
                            </div>
                            <div>
                              <p className="mb-2 text-xs font-medium text-[#94B0B3]">Hạng sao</p>
                              <ChoiceChips
                                items={STAR_OPTIONS}
                                selected={starRatings}
                                onToggle={(id) => toggleId(starRatings, setStarRatings, id)}
                              />
                            </div>
                          </fieldset>
                        )}

                        {error && (
                          <div role="alert" className="rounded-xl bg-[#2C1314]/85 border border-rose-400/40 p-3 text-xs text-rose-200">
                            {error}
                            <button
                              type="button"
                              onClick={() => submit()}
                              className="ml-2 inline-flex items-center gap-1 font-semibold text-[#E6D9B7] underline cursor-pointer"
                            >
                              <RotateCcw size={13} /> Thử lại
                            </button>
                          </div>
                        )}
                      </div>

                      {/* ══ STICKY FROSTED FOOTER ══ */}
                      <footer className="sticky bottom-0 -mx-6 flex items-center gap-3 border-t border-[#E6D9B7]/14 bg-[#06151C]/95 backdrop-blur-xl px-6 py-4">
                        <button
                          type="button"
                          onClick={close}
                          className="flex-1 rounded-xl border border-[#E6D9B7]/22 bg-[#0A202B]/80 px-4 py-3 font-semibold uppercase tracking-[0.14em] text-xs text-[#CBD9DA] hover:border-[#E6D9B7]/50 hover:bg-[#0E2B39] hover:text-[#FFFDF5] transition-all cursor-pointer"
                        >
                          Hủy
                        </button>
                        <button
                          type="submit"
                          disabled={!valid || loading || categoriesLoading}
                          className={`flex-[1.35] inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold uppercase tracking-[0.14em] text-xs transition-all ${
                            valid && !loading && !categoriesLoading
                              ? 'bg-gradient-to-r from-[#E87B39] to-[#D16322] text-[#FFFDF5] border border-[#FFFDF5]/20 shadow-[0_12px_28px_rgba(232,123,57,0.4)] hover:brightness-108 active:scale-[0.98] cursor-pointer'
                              : 'bg-[#0C2532]/90 border border-[#E6D9B7]/18 text-[#94B0B3]/70 cursor-not-allowed'
                          }`}
                        >
                          <span>{loading ? 'Đang tìm gợi ý…' : categoriesLoading ? 'Đang tải danh mục…' : 'Xem gợi ý'}</span>
                          {!loading && !categoriesLoading && <ArrowRight size={14} />}
                        </button>
                      </footer>
                    </form>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          portalRoot
        )}
    </>
  );
}
