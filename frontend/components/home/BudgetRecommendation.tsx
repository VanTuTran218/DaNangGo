"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Banknote, Check, ChevronLeft, CircleAlert, MapPin, RotateCcw, Star, X } from 'lucide-react';
import { getDistricts, getCuisines, getTastes, getAttractionCategories, type CategoryItem } from '@/lib/api/categories';
import { getRecommendations, type RecommendationItem, type RecommendationRequest, type RecommendationResponse, type RecommendationType } from '@/lib/api/recommendations';
import { formatCurrency } from '@/lib/mappers/place.mapper';

const TYPE_OPTIONS: { id: RecommendationType; label: string }[] = [
  { id: 'ACCOMMODATION', label: 'Lưu trú' },
  { id: 'RESTAURANT', label: 'Ăn uống' },
  { id: 'ATTRACTION', label: 'Tham quan' },
];

const GROUPS = [
  { key: 'accommodations', type: 'ACCOMMODATION', title: 'Lưu trú' },
  { key: 'restaurants', type: 'RESTAURANT', title: 'Ăn uống' },
  { key: 'attractions', type: 'ATTRACTION', title: 'Tham quan' },
] as const;

const QUICK_BUDGET_PRESETS = [
  { label: '500.000 đ', value: 500000 },
  { label: '1.000.000 đ', value: 1000000 },
  { label: '2.000.000 đ', value: 2000000 },
  { label: '3.000.000 đ', value: 3000000 },
  { label: '5.000.000 đ', value: 5000000 },
];

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
  if (!items.length) return <p className="text-sm text-[#C8EEEA]/70">Chưa có lựa chọn.</p>;
  return (
    <div className="flex flex-wrap gap-2">
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
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs sm:text-sm font-medium transition-all disabled:opacity-50 ${
              active
                ? 'border-[#56B5B3] bg-[#26B8AE] font-semibold text-white shadow-xs'
                : 'border-[#56B5B3] bg-[#168589] text-[#C8EEEA] hover:border-[#2DD4BF] hover:text-white'
            }`}
          >
            {active && <Check size={14} aria-hidden="true" className="text-white" />}
            {item.name}
          </motion.button>
        );
      })}
    </div>
  );
}

function RecommendationCard({ item, index }: { item: RecommendationItem; index: number }) {
  const reduceMotion = useReducedMotion();
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
      transition={{ duration: reduceMotion ? 0 : 0.2, delay: reduceMotion ? 0 : Math.min(index * 0.04, 0.2) }}
      className="overflow-hidden rounded-2xl border border-[#56B5B3]/60 bg-[#168589] shadow-md transition-all hover:border-[#56B5B3] hover:shadow-lg"
    >
      <Link href={`/places/${item.place_id}`} className="flex h-full gap-3 p-3 sm:gap-4 sm:p-4">
        <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-xl bg-[#086F72] sm:h-28 sm:w-36">
          {item.cover_image ? (
            <Image src={item.cover_image} alt="" fill sizes="144px" className="object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-[#C8EEEA]">
              <MapPin />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="line-clamp-2 font-semibold text-white">{item.name}</h4>
          <p className="mt-1 flex items-center gap-1 truncate text-xs text-[#C8EEEA]">
            <MapPin size={13} className="shrink-0" />
            {item.district_name || item.address || 'Đà Nẵng'}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#C8EEEA]">
            <span className="inline-flex items-center gap-1 text-white">
              <Star size={13} className="fill-[#FBBF24] text-[#FBBF24]" />
              {item.avg_rating.toFixed(1)} ({item.review_count})
            </span>
            {(item.cuisine_name || item.category_name || item.accommodation_type) && (
              <span>{item.cuisine_name || item.category_name || item.accommodation_type}</span>
            )}
            {item.star_rating && <span>{item.star_rating} sao</span>}
          </div>
          <p className="mt-2 text-sm font-bold text-[#2DD4BF]">{price}</p>
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
  const reduceMotion = useReducedMotion();

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
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#56B5B3] bg-[#168589] px-5 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-[#26B8AE] sm:w-auto"
        >
          <motion.span aria-hidden="true" whileHover={reduceMotion ? undefined : { rotate: -8 }}>
            <Banknote size={19} />
          </motion.span>
          Gợi ý theo ngân sách
        </motion.button>
      )}

      {portalRoot &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.18 }}
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
                  onKeyDown={onDialogKeyDown}
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: 8 }}
                  transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="flex max-h-[90vh] w-full max-w-[560px] flex-col overflow-hidden rounded-[24px] bg-[#086F72] border border-[#56B5B3] shadow-2xl shadow-black/50 outline-none text-white"
                >
                  {/* ══ HEADER (NỀN XANH NGỌC #086F72) ══ */}
                  <header className="flex items-start justify-between border-b border-[#56B5B3]/40 bg-[#086F72] px-5 py-4 sm:px-6">
                    <div>
                      {showResults && (
                        <button
                          type="button"
                          onClick={() => setShowResults(false)}
                          className="mb-1.5 inline-flex items-center gap-1 text-xs font-semibold text-[#2DD4BF] hover:underline"
                        >
                          <ChevronLeft size={15} /> Thay đổi tiêu chí
                        </button>
                      )}
                      <h2 id="budget-title" className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                        {showResults ? 'Địa điểm phù hợp ngân sách' : 'Khám phá theo ngân sách'}
                      </h2>
                      <p id="budget-description" className="mt-1 text-xs sm:text-sm text-[#C8EEEA]">
                        {showResults
                          ? `Ngân sách ${formatCurrency(budget)}`
                          : 'Chọn mức chi và loại địa điểm bạn muốn khám phá tại Đà Nẵng.'}
                      </p>
                    </div>
                    <button
                      ref={closeRef}
                      type="button"
                      onClick={close}
                      aria-label="Đóng"
                      className="rounded-full p-2 text-[#C8EEEA] hover:bg-[#168589] hover:text-white transition-colors shrink-0 ml-2"
                    >
                      <X size={20} />
                    </button>
                  </header>

                  {/* ══ BODY (NỀN XANH NGỌC #086F72) ══ */}
                  {showResults && results ? (
                    <main className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5 sm:p-6 bg-[#086F72]" aria-live="polite">
                      {loading ? (
                        <div className="space-y-3" aria-label="Đang tải gợi ý">
                          {[0, 1, 2].map((i) => (
                            <div
                              key={i}
                              className={`h-28 rounded-2xl bg-[#168589]/80 border border-[#56B5B3]/40 ${
                                reduceMotion ? '' : 'animate-pulse'
                              }`}
                            />
                          ))}
                        </div>
                      ) : null}

                      {selectedResults.every((group) => results.groups[group.key].length === 0) && (
                        <div className="rounded-2xl bg-[#168589] border border-[#56B5B3] px-5 py-4 text-white">
                          <p className="font-semibold text-white">Chưa tìm thấy địa điểm phù hợp.</p>
                          <p className="mt-1 text-sm text-[#C8EEEA]">
                            Bạn có thể tăng ngân sách hoặc bỏ bớt bộ lọc rồi thử lại.
                          </p>
                        </div>
                      )}

                      {selectedResults.map((group) => (
                        <section key={group.key} aria-labelledby={`group-${group.key}`}>
                          <div className="mb-3 flex items-center justify-between">
                            <h3 id={`group-${group.key}`} className="font-bold text-white text-base">
                              {group.title}
                            </h3>
                            <span className="text-xs sm:text-sm text-[#C8EEEA]">
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
                            <p className="rounded-xl bg-[#168589]/60 border border-[#56B5B3]/40 px-4 py-4 text-xs sm:text-sm text-[#C8EEEA]">
                              Chưa có địa điểm {group.title.toLowerCase()} phù hợp với tiêu chí này.{' '}
                              {EMPTY_HINTS[group.key]}
                            </p>
                          )}
                        </section>
                      ))}

                      {error && (
                        <div
                          role="alert"
                          className="rounded-xl bg-red-950/60 border border-red-500/50 p-3 text-sm text-red-200"
                        >
                          {error}
                          <button
                            type="button"
                            onClick={() => submit()}
                            className="ml-2 inline-flex items-center gap-1 font-semibold text-[#2DD4BF] underline"
                          >
                            <RotateCcw size={14} /> Thử lại
                          </button>
                        </div>
                      )}
                    </main>
                  ) : (
                    <form onSubmit={submit} className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6 bg-[#086F72]">
                      <div className="space-y-5">
                        {/* 1. Ô nhập số tiền VNĐ */}
                        <div>
                          <label htmlFor="budget-amount" className="mb-2 block text-sm font-semibold text-white">
                            Ngân sách dự kiến
                          </label>
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
                              placeholder="Ví dụ: 1.000.000"
                              className="w-full rounded-xl border border-[#56B5B3] bg-[#168589] py-3 pl-4 pr-16 text-base text-white placeholder-[#C8EEEA]/60 outline-none focus:border-[#2DD4BF] focus:ring-2 focus:ring-[#2DD4BF]/30 font-medium"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-semibold text-[#C8EEEA]">
                              VNĐ
                            </span>
                          </div>

                          {/* 2. Các mức ngân sách chọn nhanh */}
                          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                            <span className="text-xs text-[#C8EEEA] mr-1">Mức chọn nhanh:</span>
                            {QUICK_BUDGET_PRESETS.map((p) => {
                              const isSelected = budget === p.value;
                              return (
                                <button
                                  key={p.value}
                                  type="button"
                                  onClick={() => handleSelectPreset(p.value)}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                                    isSelected
                                      ? 'bg-[#26B8AE] border-[#56B5B3] text-white font-semibold'
                                      : 'bg-[#168589] border-[#56B5B3] text-[#C8EEEA] hover:text-white hover:border-[#2DD4BF]'
                                  }`}
                                >
                                  {p.label}
                                </button>
                              );
                            })}
                          </div>

                          <p id="budget-hint" className="mt-1.5 text-xs text-[#C8EEEA]">
                            Với ăn uống, ngân sách được so với giá trung bình trong khoảng giá nhà hàng.
                          </p>
                          {attempted && !(budget > 0) && (
                            <p
                              id="budget-error"
                              role="alert"
                              className="mt-2 inline-flex items-center gap-1 text-xs text-amber-200 bg-red-950/50 border border-red-500/40 p-2 rounded-lg"
                            >
                              <CircleAlert size={14} /> Ngân sách phải là số dương lớn hơn 0.
                            </p>
                          )}
                        </div>

                        {/* 3. Lựa chọn loại địa điểm (Cho phép chọn nhiều) */}
                        <fieldset>
                          <legend className="mb-2 text-sm font-semibold text-white">
                            Loại địa điểm <span className="font-normal text-[#C8EEEA]">(chọn ít nhất một)</span>
                          </legend>
                          <div className="flex flex-wrap gap-2">
                            {TYPE_OPTIONS.map((option) => {
                              const selected = types.includes(option.id);
                              return (
                                <motion.button
                                  key={option.id}
                                  type="button"
                                  whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                                  aria-pressed={selected}
                                  onClick={() => toggleType(option.id)}
                                  className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
                                    selected
                                      ? 'border-[#56B5B3] bg-[#26B8AE] font-semibold text-white shadow-xs'
                                      : 'border-[#56B5B3] bg-[#168589] text-[#C8EEEA] hover:border-[#2DD4BF] hover:text-white'
                                  }`}
                                >
                                  {selected && <Check size={16} className="text-white" />}
                                  {option.label}
                                </motion.button>
                              );
                            })}
                          </div>
                          {attempted && types.length === 0 && (
                            <p role="alert" className="mt-2 text-xs text-amber-200 bg-red-950/50 border border-red-500/40 p-2 rounded-lg">
                              Hãy chọn ít nhất một loại địa điểm.
                            </p>
                          )}
                        </fieldset>

                        {/* 4. Dropdown chọn quận / khu vực */}
                        <div>
                          <label htmlFor="budget-district" className="mb-2 block text-sm font-semibold text-white">
                            Quận / Khu vực
                          </label>
                          <select
                            id="budget-district"
                            value={districtId}
                            onChange={(e) => setDistrictId(e.target.value)}
                            className="w-full rounded-xl border border-[#56B5B3] bg-[#168589] px-4 py-3 text-sm text-white outline-none focus:border-[#2DD4BF] focus:ring-2 focus:ring-[#2DD4BF]/20 [&>option]:bg-[#086F72] [&>option]:text-white"
                          >
                            <option value="">Tất cả quận / khu vực</option>
                            {districts.map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {categoryError && (
                          <p role="alert" className="rounded-xl bg-red-950/60 border border-red-500/50 p-3 text-sm text-red-200">
                            {categoryError}
                          </p>
                        )}

                        {loading && (
                          <div role="status" aria-label="Đang tải gợi ý" className="space-y-2">
                            {[0, 1].map((item) => (
                              <div
                                key={item}
                                className={`h-16 rounded-xl bg-[#168589]/80 border border-[#56B5B3]/40 ${
                                  reduceMotion ? '' : 'animate-pulse'
                                }`}
                              />
                            ))}
                            <span className="sr-only">Đang tìm địa điểm phù hợp…</span>
                          </div>
                        )}

                        {/* Sở thích ăn uống */}
                        {types.includes('RESTAURANT') && (
                          <fieldset className="space-y-3.5 rounded-2xl bg-[#168589]/50 border border-[#56B5B3]/50 p-4">
                            <legend className="px-1 text-sm font-semibold text-white">Sở thích ăn uống</legend>
                            <div>
                              <p className="mb-2 text-xs font-medium text-[#C8EEEA]">Loại món</p>
                              <ChoiceChips
                                items={cuisines}
                                selected={cuisineIds}
                                onToggle={(id) => toggleId(cuisineIds, setCuisineIds, id)}
                                disabled={Boolean(categoryError)}
                              />
                            </div>
                            <div>
                              <p className="mb-2 text-xs font-medium text-[#C8EEEA]">Khẩu vị</p>
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
                          <fieldset className="rounded-2xl bg-[#168589]/50 border border-[#56B5B3]/50 p-4">
                            <legend className="px-1 text-sm font-semibold text-white">Loại điểm tham quan</legend>
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
                          <fieldset className="space-y-3.5 rounded-2xl bg-[#168589]/50 border border-[#56B5B3]/50 p-4">
                            <legend className="px-1 text-sm font-semibold text-white">Sở thích lưu trú</legend>
                            <div>
                              <p className="mb-2 text-xs font-medium text-[#C8EEEA]">Loại hình</p>
                              <ChoiceChips
                                items={ACCOMMODATION_TYPE_OPTIONS}
                                selected={accommodationTypeIds}
                                onToggle={(id) => toggleId(accommodationTypeIds, setAccommodationTypeIds, id)}
                              />
                            </div>
                            <div>
                              <p className="mb-2 text-xs font-medium text-[#C8EEEA]">Hạng sao</p>
                              <ChoiceChips
                                items={STAR_OPTIONS}
                                selected={starRatings}
                                onToggle={(id) => toggleId(starRatings, setStarRatings, id)}
                              />
                            </div>
                          </fieldset>
                        )}

                        {error && (
                          <div role="alert" className="rounded-xl bg-red-950/60 border border-red-500/50 p-3 text-sm text-red-200">
                            {error}
                            <button
                              type="button"
                              onClick={() => submit()}
                              className="ml-2 inline-flex items-center gap-1 font-semibold text-[#2DD4BF] underline"
                            >
                              <RotateCcw size={14} /> Thử lại
                            </button>
                          </div>
                        )}
                      </div>

                      {/* ══ FOOTER (NỀN XANH NGỌC #086F72) ══ */}
                      <footer className="sticky bottom-0 -mx-5 mt-6 flex gap-3 border-t border-[#56B5B3]/40 bg-[#086F72] px-5 pt-4 sm:-mx-6 sm:px-6">
                        <button
                          type="button"
                          onClick={close}
                          className="flex-1 rounded-xl border border-[#56B5B3] bg-transparent px-4 py-3 font-semibold text-[#C8EEEA] hover:bg-[#168589] hover:text-white transition-colors"
                        >
                          Hủy
                        </button>
                        <button
                          type="submit"
                          disabled={!valid || loading || categoriesLoading}
                          className="flex-1 rounded-xl bg-[#2DD4BF] hover:bg-[#34e5ce] px-4 py-3 font-bold text-[#042f2e] shadow-lg shadow-[#2DD4BF]/25 hover:shadow-[#2DD4BF]/35 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? 'Đang tìm…' : categoriesLoading ? 'Đang tải danh mục…' : 'Xem gợi ý'}
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
