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

const EMPTY_HINTS = {
  accommodations: 'Chỉ hiện cơ sở có phòng đang hoạt động, giá theo đêm trong ngân sách và hạng sao đã được cập nhật nếu bạn lọc theo sao.',
  restaurants: 'Chỉ hiện nhà hàng có đủ khoảng giá để so với ngân sách; các nhà hàng chưa có giá sẽ không xuất hiện.',
  attractions: 'Chỉ hiện điểm tham quan có thông tin giá vé và giá vé nằm trong ngân sách.',
};

const ACCOMMODATION_TYPE_OPTIONS = [
  { id: 1, name: 'Khách sạn', value: 'HOTEL' }, { id: 2, name: 'Homestay', value: 'HOMESTAY' },
  { id: 3, name: 'Resort', value: 'RESORT' }, { id: 4, name: 'Hostel', value: 'HOSTEL' },
  { id: 5, name: 'Căn hộ', value: 'APARTMENT' },
];
const STAR_OPTIONS = [1, 2, 3, 4, 5].map((id) => ({ id, name: `${id} sao` }));

function ChoiceChips({ items, selected, onToggle, disabled = false }: {
  items: CategoryItem[]; selected: number[]; onToggle: (id: number) => void; disabled?: boolean;
}) {
  if (!items.length) return <p className="text-sm text-slate-500">Chưa có lựa chọn.</p>;
  return <div className="flex flex-wrap gap-2">
    {items.map((item) => {
      const active = selected.includes(item.id);
      return <motion.button key={item.id} type="button" disabled={disabled} whileTap={{ scale: 0.96 }}
        aria-pressed={active} onClick={() => onToggle(item.id)}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm transition-colors disabled:opacity-50 ${active ? 'border-teal-600 bg-teal-50 font-semibold text-teal-800' : 'border-slate-200 bg-white text-slate-700 hover:border-teal-300'}`}>
        {active && <Check size={14} aria-hidden="true" />}{item.name}
      </motion.button>;
    })}
  </div>;
}

function RecommendationCard({ item, index }: { item: RecommendationItem; index: number }) {
  const reduceMotion = useReducedMotion();
  const price = item.place_type === 'ATTRACTION'
    ? item.ticket_price === 0 ? 'Miễn phí' : formatCurrency(item.ticket_price ?? 0)
    : item.place_type === 'ACCOMMODATION'
      ? `Từ ${formatCurrency(item.price_min ?? 0)} / đêm`
      : item.price_min === item.price_max ? formatCurrency(item.price_min ?? 0)
        : `Từ ${formatCurrency(item.price_min ?? 0)}${item.price_max ? ` – ${formatCurrency(item.price_max)}` : ''}`;
  return <motion.article initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.2, delay: reduceMotion ? 0 : Math.min(index * 0.04, 0.2) }}
    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
    <Link href={`/places/${item.place_id}`} className="flex h-full gap-3 p-3 sm:gap-4 sm:p-4">
      <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-28 sm:w-36">
        {item.cover_image ? <Image src={item.cover_image} alt="" fill sizes="144px" className="object-cover" /> : <div className="grid h-full place-items-center text-slate-400"><MapPin /></div>}
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="line-clamp-2 font-semibold text-slate-900">{item.name}</h4>
        <p className="mt-1 flex items-center gap-1 truncate text-xs text-slate-500"><MapPin size={13} />{item.district_name || item.address || 'Đà Nẵng'}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1"><Star size={13} className="fill-amber-400 text-amber-400" />{item.avg_rating.toFixed(1)} ({item.review_count})</span>
          {(item.cuisine_name || item.category_name || item.accommodation_type) && <span>{item.cuisine_name || item.category_name || item.accommodation_type}</span>}
          {item.star_rating && <span>{item.star_rating} sao</span>}
        </div>
        <p className="mt-2 text-sm font-bold text-teal-800">{price}</p>
      </div>
    </Link>
  </motion.article>;
}

export default function BudgetRecommendation() {
  const [open, setOpen] = useState(false);
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

  useEffect(() => { setPortalRoot(document.body); }, []);

  const budget = Number(budgetText.replace(/\D/g, ''));
  const valid = budget > 0 && Number.isSafeInteger(budget) && types.length > 0 && !categoryError;
  const selectedResults = useMemo(() => results ? GROUPS.filter((group) => types.includes(group.type)) : [], [results, types]);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const frame = requestAnimationFrame(() => closeRef.current?.focus());
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); return; }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusables = [...dialogRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href]')];
      if (!focusables.length) return;
      if (event.shiftKey && document.activeElement === focusables[0]) { event.preventDefault(); focusables.at(-1)?.focus(); }
      else if (!event.shiftKey && document.activeElement === focusables.at(-1)) { event.preventDefault(); focusables[0].focus(); }
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
      .then(([d, c, t, a]) => { if (active) { setDistricts(d); setCuisines(c); setTastes(t); setAttractionCategories(a); setCategoryError(''); } })
      .catch(() => { if (active) setCategoryError('Không tải được danh mục. Hãy đóng và mở lại để thử lại.'); })
      .finally(() => { if (active) setCategoriesLoading(false); });
    return () => { active = false; };
  }, [open]);

  function close() { setOpen(false); }
  function toggleType(type: RecommendationType) {
    setAttempted(true);
    setTypes((current) => current.includes(type) ? current.filter((item) => item !== type) : [...current, type]);
    if (type === 'RESTAURANT') { setCuisineIds([]); setTasteIds([]); }
    if (type === 'ATTRACTION') setAttractionCategoryIds([]);
    if (type === 'ACCOMMODATION') { setAccommodationTypeIds([]); setStarRatings([]); }
  }
  function toggleId(current: number[], setter: (value: number[]) => void, id: number) {
    setter(current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  }
  function handleBudgetChange(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 15);
    setBudgetText(digits ? new Intl.NumberFormat('vi-VN').format(Number(digits)) : '');
  }
  async function submit(event?: React.FormEvent) {
    event?.preventDefault();
    setAttempted(true);
    setError('');
    if (!valid || loading) return;
    setLoading(true);
    const payload: RecommendationRequest = {
      budget, types,
      ...(districtId ? { districtId: Number(districtId) } : {}),
      cuisineIds: types.includes('RESTAURANT') ? cuisineIds : [],
      tasteIds: types.includes('RESTAURANT') ? tasteIds : [],
      attractionCategoryIds: types.includes('ATTRACTION') ? attractionCategoryIds : [],
      accommodationTypes: types.includes('ACCOMMODATION') ? accommodationTypeIds.map((id) => ACCOMMODATION_TYPE_OPTIONS.find((item) => item.id === id)!.value as RecommendationRequest['accommodationTypes'][number]) : [],
      starRatings: types.includes('ACCOMMODATION') ? starRatings : [],
    };
    try { setResults(await getRecommendations(payload)); setShowResults(true); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Không thể tải gợi ý. Vui lòng thử lại.'); }
    finally { setLoading(false); }
  }

  function onDialogKeyDown(event: KeyboardEvent<HTMLDivElement>) { if (event.key === 'Enter' && event.target instanceof HTMLInputElement && event.target.type === 'text') event.stopPropagation(); }

  return <>
    <motion.button ref={triggerRef} type="button" whileHover={reduceMotion ? undefined : { y: -2 }} whileTap={reduceMotion ? undefined : { scale: 0.98 }}
      onClick={() => { setOpen(true); setShowResults(false); setError(''); }}
      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-5 py-3 font-semibold text-teal-900 shadow-sm transition-colors hover:border-teal-300 hover:bg-teal-100 sm:w-auto">
      <motion.span aria-hidden="true" whileHover={reduceMotion ? undefined : { rotate: -8 }}><Banknote size={19} /></motion.span>
      Gợi ý theo ngân sách
    </motion.button>

    {portalRoot && createPortal(<AnimatePresence>
      {open && <motion.div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0 : 0.18 }} onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
        <motion.div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="budget-title" aria-describedby="budget-description" tabIndex={-1}
          onKeyDown={onDialogKeyDown} initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: 5 }} transition={{ duration: reduceMotion ? 0 : 0.2 }}
          className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl outline-none">
          <header className="flex items-start justify-between border-b border-slate-100 px-5 py-4 sm:px-7">
            <div>{showResults && <button type="button" onClick={() => setShowResults(false)} className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-teal-800"><ChevronLeft size={15} /> Thay đổi tiêu chí</button>}
              <h2 id="budget-title" className="text-xl font-bold text-slate-900">{showResults ? 'Địa điểm phù hợp ngân sách' : 'Gợi ý theo ngân sách'}</h2>
              <p id="budget-description" className="mt-1 text-sm text-slate-500">{showResults ? `Ngân sách ${formatCurrency(budget)}` : 'Chọn mức chi và loại địa điểm bạn muốn khám phá.'}</p>
            </div>
            <button ref={closeRef} type="button" onClick={close} aria-label="Đóng" className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"><X size={20} /></button>
          </header>

          {showResults && results ? <main className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5 sm:p-7" aria-live="polite">
            {loading ? <div className="space-y-3" aria-label="Đang tải gợi ý">{[0, 1, 2].map((i) => <div key={i} className={`h-28 rounded-2xl bg-slate-100 ${reduceMotion ? '' : 'animate-pulse'}`} />)}</div> : null}
            {selectedResults.every((group) => results.groups[group.key].length === 0) && <div className="rounded-2xl bg-teal-50 px-5 py-4"><p className="font-semibold text-slate-900">Chưa tìm thấy địa điểm phù hợp.</p><p className="mt-1 text-sm text-slate-600">Bạn có thể tăng ngân sách hoặc bỏ bớt bộ lọc rồi thử lại.</p></div>}
            {selectedResults.map((group) => <section key={group.key} aria-labelledby={`group-${group.key}`}>
              <div className="mb-3 flex items-center justify-between"><h3 id={`group-${group.key}`} className="font-bold text-slate-900">{group.title}</h3><span className="text-sm text-slate-500">{results.groups[group.key].length} địa điểm</span></div>
              {results.groups[group.key].length ? <div className="grid gap-3 sm:grid-cols-2">{results.groups[group.key].map((item, index) => <RecommendationCard key={item.place_id} item={item} index={index} />)}</div> : <p className="rounded-xl bg-slate-50 px-4 py-5 text-sm text-slate-600">Chưa có địa điểm {group.title.toLowerCase()} phù hợp với tiêu chí này. {EMPTY_HINTS[group.key]}</p>}
            </section>)}
            {error && <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}<button type="button" onClick={() => submit()} className="ml-2 inline-flex items-center gap-1 font-semibold underline"><RotateCcw size={14} /> Thử lại</button></div>}
          </main> : <form onSubmit={submit} className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-7">
            <div className="space-y-6">
              <div><label htmlFor="budget-amount" className="mb-2 block text-sm font-semibold text-slate-800">Ngân sách</label>
                <div className="relative"><input id="budget-amount" type="text" inputMode="numeric" autoComplete="off" value={budgetText} onChange={(e) => handleBudgetChange(e.target.value)} onBlur={() => setAttempted(true)} aria-invalid={attempted && !(budget > 0)} aria-describedby="budget-hint budget-error" placeholder="Ví dụ: 1.000.000" className="w-full rounded-xl border border-slate-300 py-3 pl-4 pr-16 text-base outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100" /><span className="absolute right-4 top-1/2 -translate-y-1/2 font-semibold text-slate-500">VNĐ</span></div>
                <p id="budget-hint" className="mt-1.5 text-xs text-slate-500">Với ăn uống, ngân sách được so với giá trung bình trong khoảng giá nhà hàng.</p>
                {attempted && !(budget > 0) && <p id="budget-error" role="alert" className="mt-1 inline-flex items-center gap-1 text-sm text-red-700"><CircleAlert size={15} /> Ngân sách phải là số dương.</p>}
              </div>
              <fieldset><legend className="mb-2 text-sm font-semibold text-slate-800">Loại địa điểm <span className="font-normal text-slate-500">(chọn ít nhất một)</span></legend>
                <div className="flex flex-wrap gap-2">{TYPE_OPTIONS.map((option) => { const selected = types.includes(option.id); return <motion.button key={option.id} type="button" whileTap={reduceMotion ? undefined : { scale: 0.96 }} aria-pressed={selected} onClick={() => toggleType(option.id)} className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${selected ? 'border-teal-700 bg-teal-700 text-white' : 'border-slate-200 text-slate-700 hover:border-teal-400'}`}>{selected && <Check size={15} />}{option.label}</motion.button>; })}</div>
                {attempted && types.length === 0 && <p role="alert" className="mt-2 text-sm text-red-700">Hãy chọn ít nhất một loại địa điểm.</p>}
              </fieldset>
              <div><label htmlFor="budget-district" className="mb-2 block text-sm font-semibold text-slate-800">Quận</label><select id="budget-district" value={districtId} onChange={(e) => setDistrictId(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-teal-600"><option value="">Tất cả quận</option>{districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
              {categoryError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{categoryError}</p>}
              {loading && <div role="status" aria-label="Đang tải gợi ý" className="space-y-2">{[0, 1].map((item) => <div key={item} className={`h-16 rounded-xl bg-slate-100 ${reduceMotion ? '' : 'animate-pulse'}`} />)}<span className="sr-only">Đang tìm địa điểm phù hợp…</span></div>}
              {types.includes('RESTAURANT') && <fieldset className="space-y-4 rounded-2xl bg-slate-50 p-4"><legend className="px-1 text-sm font-semibold text-slate-800">Sở thích ăn uống</legend><div><p className="mb-2 text-xs font-medium text-slate-600">Loại món</p><ChoiceChips items={cuisines} selected={cuisineIds} onToggle={(id) => toggleId(cuisineIds, setCuisineIds, id)} disabled={Boolean(categoryError)} /></div><div><p className="mb-2 text-xs font-medium text-slate-600">Khẩu vị</p><ChoiceChips items={tastes} selected={tasteIds} onToggle={(id) => toggleId(tasteIds, setTasteIds, id)} disabled={Boolean(categoryError)} /></div></fieldset>}
              {types.includes('ATTRACTION') && <fieldset className="rounded-2xl bg-slate-50 p-4"><legend className="px-1 text-sm font-semibold text-slate-800">Loại điểm tham quan</legend><ChoiceChips items={attractionCategories} selected={attractionCategoryIds} onToggle={(id) => toggleId(attractionCategoryIds, setAttractionCategoryIds, id)} disabled={Boolean(categoryError)} /></fieldset>}
              {types.includes('ACCOMMODATION') && <fieldset className="space-y-4 rounded-2xl bg-slate-50 p-4"><legend className="px-1 text-sm font-semibold text-slate-800">Sở thích lưu trú</legend><div><p className="mb-2 text-xs font-medium text-slate-600">Loại hình</p><ChoiceChips items={ACCOMMODATION_TYPE_OPTIONS} selected={accommodationTypeIds} onToggle={(id) => toggleId(accommodationTypeIds, setAccommodationTypeIds, id)} /></div><div><p className="mb-2 text-xs font-medium text-slate-600">Hạng sao</p><ChoiceChips items={STAR_OPTIONS} selected={starRatings} onToggle={(id) => toggleId(starRatings, setStarRatings, id)} /></div></fieldset>}
              {error && <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}<button type="button" onClick={() => submit()} className="ml-2 inline-flex items-center gap-1 font-semibold underline"><RotateCcw size={14} /> Thử lại</button></div>}
            </div>
            <footer className="sticky bottom-0 -mx-5 mt-6 flex gap-3 border-t border-slate-100 bg-white px-5 pt-4 sm:-mx-7 sm:px-7"><button type="button" onClick={close} className="flex-1 rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50">Hủy</button><button type="submit" disabled={!valid || loading || categoriesLoading} className="flex-1 rounded-xl bg-teal-700 px-4 py-3 font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50">{loading ? 'Đang tìm…' : categoriesLoading ? 'Đang tải danh mục…' : 'Xem gợi ý'}</button></footer>
          </form>}
        </motion.div>
      </motion.div>}
    </AnimatePresence>, portalRoot)}
  </>;
}
