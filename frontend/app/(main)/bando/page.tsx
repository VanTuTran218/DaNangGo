'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  motion, AnimatePresence, LayoutGroup, PanInfo,
} from 'framer-motion';
import {
  ChevronRight, Search, X, RefreshCw, MapPin, Star,
  Navigation, Calendar, Map as MapIcon, List, Layers, Plus, Minus,
  LocateFixed, ChevronUp, Sun, Car, LoaderCircle, ExternalLink,
  ArrowRight, ChevronDown,
} from 'lucide-react';
import { useNavbarHero } from '@/contexts/NavbarHeroContext';
import Footer from '@/components/layout/Footer';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import MapWrapper from '@/components/map/MapWrapper';
import { useMapRouting } from '@/hooks/useMapRouting';
import { useMapPlaces } from '@/hooks/useMapPlaces';
import { PLACE_PLACEHOLDER, type MapLocation } from '@/lib/map-places';
import { DANANG_CENTER, googleMapsDirections, haversineDistance, type Coordinates, type MapLayer } from '@/lib/map-navigation';

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────
type Category = 'luutru' | 'amthuc' | 'diemdulich' | 'cafe';

const CATEGORY_META: Record<Category, { label: string; dot: string; bg: string }> = {
  luutru:     { label: 'Lưu trú & Khách sạn',        dot: 'bg-blue-500',   bg: 'bg-blue-500' },
  amthuc:     { label: 'Ẩm thực & Quán ngon',        dot: 'bg-orange-500', bg: 'bg-orange-500' },
  diemdulich: { label: 'Điểm du lịch & Danh thắng',  dot: 'bg-green-500',  bg: 'bg-green-500' },
  cafe:       { label: 'Quán cafe & Bar view biển',   dot: 'bg-pink-500',   bg: 'bg-pink-500' },
};

const BLUR = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

function MapPlaceImage(props: React.ComponentProps<typeof Image>) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [props.src]);
  return <Image {...props} unoptimized src={failed ? PLACE_PLACEHOLDER : props.src} onError={() => setFailed(true)} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATED CHECKBOX
// ─────────────────────────────────────────────────────────────────────────────
function AnimCheckbox({ checked, onChange, label, dot, count }: { checked: boolean; onChange: () => void; label: string; dot: string; count: number; }) {
  return (
    <button onClick={onChange} aria-pressed={checked} className="flex items-center gap-2.5 group w-full text-left py-1" type="button">
      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${checked ? 'bg-teal-500 border-teal-500' : 'border-gray-300 bg-white group-hover:border-teal-400'}`}>
        <AnimatePresence>
          {checked && (
            <motion.svg key="chk" viewBox="0 0 12 10" width="9" height="7" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} exit={{ pathLength: 0 }} transition={{ duration: 0.2 }}>
              <motion.path d="M1 5 L4.5 8.5 L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </motion.svg>
          )}
        </AnimatePresence>
      </div>
      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dot}`} />
      <span className="text-xs text-gray-700 flex-1 leading-snug">{label}</span>
      <span className="text-[10px] text-gray-400 font-medium">{count}</span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAP POPUP
// ─────────────────────────────────────────────────────────────────────────────
function MapPopup({ loc, onClose, onAddTrip, onNavigate }: { loc: MapLocation; onClose: () => void; onAddTrip: () => void; onNavigate: () => void; }) {
  return (
    <motion.div initial={{ opacity: 0, y: 24, scale: 0.95 }} animate={{ opacity: 1, y: 0,  scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.95 }} transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }} className="absolute bottom-4 left-4 sm:left-auto sm:right-20 z-[1000] w-[calc(100%-2rem)] sm:w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
      <div className="relative h-28 overflow-hidden">
        <MapPlaceImage src={loc.img} alt={loc.name} fill className="object-cover" sizes="288px" placeholder="blur" blurDataURL={BLUR} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <button onClick={onClose} aria-label="Đóng thông tin địa điểm" className="absolute top-2 right-2 w-6 h-6 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors z-10"><X size={12} className="text-gray-700" /></button>
        <div className="absolute bottom-2 left-3">
          <span className={`text-white text-[10px] font-bold px-2 py-0.5 rounded-full ${CATEGORY_META[loc.category].bg}`}>{CATEGORY_META[loc.category].label.split('&')[0].trim()}</span>
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-bold text-[#0f2942] text-sm leading-snug mb-0.5 h3-card">{loc.name}</h3>
        <div className="flex items-center gap-1 mb-1">
          <Star size={11} className="fill-yellow-400 text-yellow-400" />
          <span className="text-xs font-semibold text-gray-700">{loc.rating}</span>
          <span className="text-[10px] text-gray-400">({loc.reviews.toLocaleString('vi-VN')})</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-gray-400 mb-3"><MapPin size={10} /><span className="truncate body-text">{loc.address}</span></div>
        <div className="space-y-1 mb-3 text-[11px] text-gray-500">
          <p><span className="font-semibold text-[#0f2942]">{loc.distance}</span> đường chim bay từ tâm tìm kiếm</p>
          <p className="flex items-center gap-1"><Car size={12} /> Xem quãng đường và thời gian đi ô tô thực tế.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onNavigate} className="group flex-1 flex items-center justify-center gap-1.5 bg-[#0f2942] hover:bg-[#1a3f5c] text-white text-[11px] font-bold px-3 py-2 rounded-xl transition-colors"><Navigation size={11} /> Chỉ đường<ArrowRight size={11} className="transition-transform duration-200 group-hover:translate-x-0.5" /></button>
          <button onClick={onAddTrip} aria-label="Thêm địa điểm vào lịch trình" className="flex items-center justify-center gap-1 border border-gray-200 text-[#0f2942] hover:border-teal-400 hover:text-teal-600 text-[11px] font-medium px-2.5 py-2 rounded-xl transition-colors"><Calendar size={11} /></button>
        </div>
        <Link href={`/places/${loc.id}`} className="mt-2 mr-3 inline-flex text-[11px] font-semibold text-teal-700 hover:underline">Xem chi tiết</Link>
        <a href={googleMapsDirections([loc.lat, loc.lng])} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-[11px] text-teal-700 hover:underline"><ExternalLink size={11} /> Mở Google Maps</a>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LOCATION LIST ITEM
// ─────────────────────────────────────────────────────────────────────────────
function LocationItem({ loc, isSelected, isChecked, onSelect, onCheck, index }: { loc: MapLocation; isSelected: boolean; isChecked: boolean; onSelect: () => void; onCheck: () => void; index: number; }) {
  const meta = CATEGORY_META[loc.category];
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + index * 0.04, duration: 0.3 }} onClick={onSelect} className={`group flex items-start gap-2.5 p-2.5 rounded-xl cursor-pointer transition-all duration-200 border ${isSelected ? 'bg-teal-50 border-teal-200' : 'border-transparent hover:bg-gray-50 hover:border-gray-100 hover:translate-x-0.5'}`}>
      <button onClick={e => { e.stopPropagation(); onCheck(); }} className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-200 ${isChecked ? 'bg-teal-500 border-teal-500' : 'border-gray-300 bg-white'}`}>
        {isChecked && <motion.svg viewBox="0 0 12 10" width="9" height="7" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.2 }}><motion.path d="M1 5 L4.5 8.5 L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></motion.svg>}
      </button>
      <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0"><MapPlaceImage src={loc.img} alt={loc.name} fill className="object-cover" sizes="48px" placeholder="blur" blurDataURL={BLUR} /></div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-[#0f2942] leading-tight truncate">{loc.name}</p>
        <div className="flex items-center gap-1 mt-0.5"><span className={`w-1.5 h-1.5 rounded-full ${meta.dot} flex-shrink-0`} /><Star size={9} className="fill-yellow-400 text-yellow-400" /><span className="text-[10px] text-gray-600">{loc.rating}</span><span className="text-[10px] text-gray-400 ml-auto">{loc.distance}</span></div>
        <p className="text-[10px] text-gray-400 mt-0.5 truncate">{loc.address}</p>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function BanDoDuLichPage() {
  const { locations, loading: placesLoading, error: placesError, missingCoordinates, reload: reloadPlaces } = useMapPlaces();
  const categoryCounts = useMemo(() => {
    const counts: Record<Category, number> = { luutru: 0, amthuc: 0, diemdulich: 0, cafe: 0 };
    for (const location of locations) counts[location.category]++;
    return counts;
  }, [locations]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<Record<Category, boolean>>({ luutru: true, amthuc: true, diemdulich: true, cafe: true });
  const [radius, setRadius] = useState<2 | 5 | 10>(5);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [zoomLevel, setZoomLevel] = useState(13);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showAllLocations, setShowAllLocations] = useState(false);
  const [userPosition, setUserPosition] = useState<Coordinates | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [mapLayer, setMapLayer] = useState<MapLayer>('street');
  const [layersOpen, setLayersOpen] = useState(false);
  const [routeTarget, setRouteTarget] = useState<MapLocation | null>(null);
  const [routeAttempt, setRouteAttempt] = useState(0);
  const mounted = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  const filterCenter = userPosition ?? DANANG_CENTER;
  const { route, loading: routeLoading, error: routeError } = useMapRouting(routeTarget, filterCenter, routeAttempt);
  const locateUser = useCallback(() => {
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError('Trình duyệt không hỗ trợ định vị. Đang dùng tâm Đà Nẵng.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      position => {
        if (!mounted.current) return;
        setUserPosition([position.coords.latitude, position.coords.longitude]);
        setIsLocating(false);
      },
      error => {
        if (!mounted.current) return;
        const message = error.code === 1
          ? 'Bạn chưa cho phép định vị. Hãy cấp quyền vị trí cho trang web rồi thử lại.'
          : error.code === 3 ? 'Định vị quá thời gian chờ. Vui lòng thử lại.'
            : 'Chưa lấy được vị trí GPS. Kiểm tra dịch vụ vị trí rồi thử lại.';
        setGpsError(message);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 },
    );
  }, []);

  // NavbarHeroContext - luôn giữ navbar background trắng
  const { setHeroRef } = useNavbarHero();
  useEffect(() => { setHeroRef(null); }, [setHeroRef]);

  const visibleLocations = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('vi');
    return locations.map(loc => {
      const distanceKm = haversineDistance(filterCenter, [loc.lat, loc.lng]);
      return { ...loc, distanceKm, distance: `${distanceKm.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} km` };
    }).filter(loc => catFilter[loc.category] && loc.distanceKm <= radius
      && (!query || `${loc.name} ${loc.address}`.toLocaleLowerCase('vi').includes(query)))
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [locations, catFilter, search, radius, filterCenter]);
  const selectedLoc = visibleLocations.find(loc => loc.id === selectedId) ?? null;

  const toggleCat = (cat: Category) => setCatFilter(prev => ({ ...prev, [cat]: !prev[cat] }));
  const toggleCheck = (id: number) => setCheckedIds(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next;
  });
  const resetFilters = () => {
    setCatFilter({ luutru: true, amthuc: true, diemdulich: true, cafe: true });
    setSearch(''); setRadius(5); setSelectedId(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 pt-[56px]">

      {/* ═══ HEADER (BREADCRUMB & STATS) ════════════════════════════════════ */}
      <div className="bg-gradient-to-r from-teal-50/70 to-cyan-50/30 border-b border-gray-100 pb-5 pt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                <Link href="/" className="hover:text-teal-600 transition-colors">Trang chủ</Link>
                <ChevronRight size={14} className="text-gray-300" />
                <span className="text-[#0f2942] font-medium">Bản đồ du lịch</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#0f2942] h2-section">Bản đồ du lịch tương tác Đà Nẵng</h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 bg-white shadow-sm border border-gray-200 text-gray-700 text-xs font-medium px-3.5 py-1.5 rounded-full">
                <div className="text-amber-500 flex items-center justify-center">
                  <Sun size={14} className="animate-[spin_4s_linear_infinite]" />
                </div>
                28°C · Nắng êm sóng lặng
              </div>
              <div className="inline-flex items-center gap-2 bg-white shadow-sm border border-gray-200 text-gray-600 text-xs font-medium px-3.5 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                {filterCenter[0].toFixed(4)}°, {filterCenter[1].toFixed(4)}° · {userPosition ? 'Vị trí của bạn' : 'Tâm Đà Nẵng'}
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="flex flex-wrap gap-x-6 gap-y-2 mt-5">
            {[ { cat: 'luutru', dot: 'bg-blue-500' }, { cat: 'amthuc', dot: 'bg-orange-500' }, { cat: 'diemdulich', dot: 'bg-green-500' }, { cat: 'cafe', dot: 'bg-pink-500' } ].map(({ cat, dot }) => (
              <div key={cat} className="flex items-center gap-1.5 text-sm text-gray-600 font-medium">
                <span className={`w-2 h-2 rounded-full ${dot}`} />
                <AnimatedCounter key={`${cat}-${categoryCounts[cat as Category]}`} to={categoryCounts[cat as Category]} className="font-bold text-[#0f2942]" />
                <span className="text-xs">{CATEGORY_META[cat as Category].label.split('&')[0].trim()}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 pt-3 sm:px-6" aria-live="polite">
        {placesLoading && <p role="status" className="flex items-center gap-2 text-sm text-teal-700"><LoaderCircle size={16} className="animate-spin" /> Đang tải địa điểm từ máy chủ…</p>}
        {placesError && <div role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{placesError}<button onClick={reloadPlaces} className="ml-3 font-bold underline">Thử tải lại</button></div>}
        {!placesLoading && !placesError && locations.length === 0 && <p className="text-sm text-gray-600">Chưa có địa điểm có tọa độ để hiển thị trên bản đồ.</p>}
        {!placesLoading && !placesError && missingCoordinates > 0 && <p className="text-xs text-gray-500">{missingCoordinates} địa điểm chưa có tọa độ hợp lệ nên chưa hiển thị trên bản đồ.</p>}
      </div>

      {/* ═══ MAP APP CONTAINER ══════════════════════════════════════════════ */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col min-h-0">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex-1 flex flex-col lg:flex-row bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden min-h-[600px] max-h-[85vh] relative"
        >
          {/* ── SIDEBAR ── */}
          <aside className="hidden lg:flex flex-col w-[340px] bg-white border-r border-gray-200 flex-shrink-0 z-20 relative min-h-0">
            {/* Sidebar gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-teal-50/50 to-transparent pointer-events-none" />
            
            {/* PHẦN TRÊN - KHÔNG CUỘN */}
            <div className="p-5 space-y-6 shrink-0 relative z-10 border-b border-gray-50">
              <div>
                <div className="relative shadow-sm rounded-xl">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder='Tìm địa điểm... "Sơn Trà"' className="w-full pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 bg-white transition-all" />
                  <AnimatePresence>
                    {search && (
                      <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <X size={14} />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-gray-800 uppercase tracking-wider">Phân loại</p>
                  <button onClick={resetFilters} className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-red-500 transition-colors font-medium">
                    <RefreshCw size={11} /> Đặt lại
                  </button>
                </div>
                <div className="space-y-2">
                  {(Object.keys(CATEGORY_META) as Category[]).map(cat => (
                    <AnimCheckbox key={cat} checked={catFilter[cat]} onChange={() => toggleCat(cat)} label={CATEGORY_META[cat].label} dot={CATEGORY_META[cat].dot} count={categoryCounts[cat]} />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3">Bán kính từ {userPosition ? 'vị trí của bạn' : 'tâm Đà Nẵng'}</p>
                <LayoutGroup id="radius">
                  <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                    {([2, 5, 10] as const).map(r => (
                      <button key={r} onClick={() => setRadius(r)} aria-pressed={radius === r} className={`relative flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${radius === r ? 'text-[#0f2942]' : 'text-gray-500 hover:text-gray-700'}`}>
                        {radius === r && (
                          <motion.span layoutId="radius-bg" className="absolute inset-0 rounded-lg bg-white shadow-sm" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />
                        )}
                        <span className="relative z-10">{r} km</span>
                      </button>
                    ))}
                  </div>
                </LayoutGroup>
                <p className="mt-2 text-[10px] text-gray-500">Khoảng cách đường chim bay. Quãng đường lái xe sẽ được tính khi chỉ đường.</p>
              </div>
            </div>

            {/* PHẦN LIST - CUỘN ĐỘC LẬP */}
            <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-5 relative z-10 pt-2">
              <p className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3">Địa điểm ghim ({visibleLocations.length})</p>
              <div className="space-y-1.5 pb-20"> {/* pb-20 prevents bottom items from being cut off */}
                {visibleLocations.slice(0, 5).map((loc, i) => (
                  <LocationItem key={loc.id} loc={loc} isSelected={selectedId === loc.id} isChecked={checkedIds.has(loc.id)} onSelect={() => setSelectedId(selectedId === loc.id ? null : loc.id)} onCheck={() => toggleCheck(loc.id)} index={i} />
                ))}
                
                <AnimatePresence>
                  {showAllLocations && visibleLocations.length > 5 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-1.5 overflow-hidden"
                    >
                      {visibleLocations.slice(5).map((loc, i) => (
                        <LocationItem key={loc.id} loc={loc} isSelected={selectedId === loc.id} isChecked={checkedIds.has(loc.id)} onSelect={() => setSelectedId(selectedId === loc.id ? null : loc.id)} onCheck={() => toggleCheck(loc.id)} index={i + 5} />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {visibleLocations.length > 5 && (
                  <button
                    onClick={() => setShowAllLocations(!showAllLocations)}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 mt-2 text-xs font-semibold text-[#0f2942] hover:text-teal-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors border border-gray-100"
                  >
                    {showAllLocations ? (
                      <>Thu gọn <ChevronUp size={14} /></>
                    ) : (
                      <>Xem thêm {visibleLocations.length - 5} địa điểm khác <ChevronDown size={14} /></>
                    )}
                  </button>
                )}
                
                {visibleLocations.length === 0 && <p className="text-xs text-gray-400 text-center py-6">{placesLoading ? 'Đang tải địa điểm…' : placesError ? 'Chưa tải được danh sách địa điểm' : 'Không có địa điểm phù hợp trong bán kính đã chọn'}</p>}
              </div>
            </div>
          </aside>

          {/* ── MAP AREA ── */}
          <div data-lenis-prevent className="flex-1 min-h-[600px] relative overflow-hidden bg-[#e8f4fd] z-0 isolate" style={{ transform: 'translateZ(0)', maskImage: '-webkit-radial-gradient(white, black)' }}>
            
            {/* THƯ VIỆN BẢN ĐỒ THẬT (Leaflet) */}
            <div className="absolute inset-0 z-0">
              <MapWrapper 
                locations={visibleLocations} 
                selectedId={selectedId} 
                onSelect={(id: number) => setSelectedId(id)}
                zoomLevel={zoomLevel}
                onZoomChange={setZoomLevel}
                radius={radius}
                userPosition={userPosition}
                mapLayer={mapLayer}
                route={route}
                routeOrigin={filterCenter}
                routeDestination={routeTarget}
              />
            </div>

            {/* OVERLAYS UI */}
            <div className="absolute top-4 left-4 z-20 max-w-[calc(100%-13rem)] rounded-xl bg-white/95 px-3 py-2 text-[11px] font-semibold text-teal-800 shadow-sm" aria-live="polite">
              {visibleLocations.length} địa điểm · {radius} km
            </div>

            <div className="absolute top-4 right-4 z-20">
              <div className="flex bg-white/90 backdrop-blur-md rounded-xl shadow-sm border border-white/60 overflow-hidden">
                {(['map', 'list'] as const).map(mode => (
                  <button key={mode} onClick={() => setViewMode(mode)} className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold transition-colors ${viewMode === mode ? 'bg-[#0f2942] text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                    {mode === 'map' ? <MapIcon size={13} /> : <List size={13} />}
                    {mode === 'map' ? 'Bản đồ' : 'Danh sách'}
                  </button>
                ))}
              </div>
            </div>

            <div className="absolute bottom-6 right-4 z-20 flex flex-col gap-2">
              {[{ icon: Plus, title: 'Phóng to', action: () => setZoomLevel(z => Math.min(z + 1, 19)), disabled: zoomLevel >= 19 }, { icon: Minus, title: 'Thu nhỏ', action: () => setZoomLevel(z => Math.max(z - 1, 3)), disabled: zoomLevel <= 3 }].map(btn => (
                <button key={btn.title} onClick={btn.action} title={btn.title} aria-label={btn.title} disabled={btn.disabled} className="w-10 h-10 bg-white/95 backdrop-blur-md rounded-xl shadow-md border border-gray-100 flex items-center justify-center text-gray-600 hover:text-[#0f2942] hover:scale-105 active:scale-95 disabled:opacity-40 transition-all">
                  <btn.icon size={16} />
                </button>
              ))}
              <button type="button" onClick={locateUser} disabled={isLocating} title="Vị trí tôi" aria-label={isLocating ? 'Đang định vị' : 'Vị trí tôi'} className={`w-10 h-10 bg-white/95 rounded-xl shadow-md border border-gray-100 flex items-center justify-center disabled:opacity-60 ${userPosition ? 'text-blue-600' : 'text-gray-600'}`}>
                {isLocating ? <LoaderCircle size={16} className="animate-spin" /> : <LocateFixed size={16} />}
              </button>
              <button type="button" onClick={() => setLayersOpen(open => !open)} title="Lớp bản đồ" aria-label="Lớp bản đồ" aria-expanded={layersOpen} aria-controls="map-layers" className="w-10 h-10 bg-white/95 rounded-xl shadow-md border border-gray-100 flex items-center justify-center text-gray-600"><Layers size={16} /></button>
            </div>

            {layersOpen && (
              <div id="map-layers" role="group" aria-label="Chọn lớp bản đồ" className="absolute bottom-6 right-16 z-[1100] w-52 rounded-xl border border-gray-100 bg-white p-2 shadow-xl">
                <div className="flex items-center justify-between px-2 py-1 text-xs font-bold text-[#0f2942]">Lớp bản đồ<button onClick={() => setLayersOpen(false)} aria-label="Đóng chọn lớp bản đồ"><X size={14} /></button></div>
                {([{ value: 'street', label: 'Đường phố du lịch' }, { value: 'satellite', label: 'Ảnh vệ tinh' }] as const).map(layer => (
                  <button key={layer.value} type="button" aria-pressed={mapLayer === layer.value} onClick={() => { setMapLayer(layer.value); setLayersOpen(false); }} className={`w-full rounded-lg px-3 py-2.5 text-left text-xs font-semibold ${mapLayer === layer.value ? 'bg-teal-50 text-teal-700' : 'text-gray-600 hover:bg-gray-50'}`}>{layer.label}{mapLayer === layer.value && ' ✓'}</button>
                ))}
              </div>
            )}

            <div className="absolute top-16 left-4 right-16 z-30 flex max-w-sm flex-col gap-2">
              {(isLocating || gpsError) && (
                <div role="status" className="rounded-xl bg-white/95 p-3 text-xs text-gray-700 shadow-lg">
                  {isLocating ? 'Đang lấy vị trí GPS của bạn…' : gpsError}
                  {gpsError && <div className="mt-2 flex gap-3"><button onClick={locateUser} className="font-bold text-teal-700">Thử lại</button><button onClick={() => setGpsError(null)} className="text-gray-500">Đóng</button></div>}
                </div>
              )}
              {routeTarget && (
                <div role="status" aria-live="polite" className="rounded-2xl border border-teal-100 bg-white/95 p-3 shadow-xl backdrop-blur-md">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-wider text-teal-700">Chỉ đường ô tô</p><p className="mt-1 truncate text-sm font-bold text-[#0f2942]">{routeTarget.name}</p></div>
                    <button onClick={() => setRouteTarget(null)} aria-label="Đóng tuyến đường" className="rounded-full p-1 text-gray-500 hover:bg-gray-100"><X size={15} /></button>
                  </div>
                  <p className="mt-1 text-[11px] text-gray-500">Từ {userPosition ? 'vị trí GPS của bạn' : 'tâm Đà Nẵng (chưa có GPS)'}</p>
                  {routeLoading && <p className="mt-2 flex items-center gap-2 text-xs text-teal-700"><LoaderCircle size={14} className="animate-spin" /> Đang tìm tuyến đường…</p>}
                  {route && <><p className="mt-2 text-base font-bold text-teal-700">{route.distanceKm.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} km <span className="text-gray-300">·</span> khoảng {route.durationMinutes.toLocaleString('vi-VN')} phút</p><p className="mt-1 text-[10px] text-gray-500">Thời gian ước tính, chưa tính giao thông trực tiếp.</p></>}
                  {routeError && <><p className="mt-2 text-xs text-amber-700">{routeError}</p><button onClick={() => setRouteAttempt(value => value + 1)} className="mt-2 text-xs font-bold text-teal-700">Thử lại chỉ đường</button></>}
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-2">
                    {!userPosition && <button onClick={locateUser} disabled={isLocating} className="text-[11px] font-semibold text-blue-700 disabled:opacity-50">Dùng vị trí của tôi</button>}
                    <a href={googleMapsDirections([routeTarget.lat, routeTarget.lng], filterCenter)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:underline"><ExternalLink size={11} /> Mở Google Maps</a>
                  </div>
                </div>
              )}
            </div>

            {/* POPUP REACT (RENDER ĐÈ LÊN LEAFLET) */}
            <AnimatePresence>
              {selectedLoc && <MapPopup key={selectedLoc.id} loc={selectedLoc} onClose={() => setSelectedId(null)} onAddTrip={() => { toggleCheck(selectedLoc.id); setSelectedId(null); }} onNavigate={() => { setRouteTarget(selectedLoc); setRouteAttempt(value => value + 1); setSelectedId(null); setLayersOpen(false); }} />}
            </AnimatePresence>

            {/* MOBILE LIST OVERLAY */}
            <AnimatePresence>
              {viewMode === 'list' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="absolute inset-0 z-[2000] bg-white overflow-y-auto p-4">
                  <div className="max-w-2xl mx-auto pb-24">
                    <div className="flex items-center justify-between mb-4 mt-2">
                      <h2 className="font-bold text-[#0f2942] text-lg h2-section">Địa điểm ({visibleLocations.length})</h2>
                      <button onClick={() => setViewMode('map')} className="flex items-center gap-1.5 text-sm text-teal-600 font-bold bg-teal-50 px-3 py-1.5 rounded-full">
                        <MapIcon size={14} /> Trở về Bản đồ
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {visibleLocations.length === 0 && <p className="py-6 text-center text-sm text-gray-500">{placesLoading ? 'Đang tải địa điểm…' : placesError ? 'Chưa tải được danh sách địa điểm' : 'Không có địa điểm phù hợp. Hãy mở rộng bán kính hoặc đổi bộ lọc.'}</p>}
                      {visibleLocations.slice(0, 5).map((loc, i) => (
                        <LocationItem key={loc.id} loc={loc} index={i} isSelected={selectedId === loc.id} isChecked={checkedIds.has(loc.id)} onSelect={() => { setSelectedId(loc.id); setViewMode('map'); }} onCheck={() => toggleCheck(loc.id)} />
                      ))}

                      <AnimatePresence>
                        {showAllLocations && visibleLocations.length > 5 && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="grid grid-cols-1 gap-3 overflow-hidden"
                          >
                            {visibleLocations.slice(5).map((loc, i) => (
                              <LocationItem key={loc.id} loc={loc} index={i + 5} isSelected={selectedId === loc.id} isChecked={checkedIds.has(loc.id)} onSelect={() => { setSelectedId(loc.id); setViewMode('map'); }} onCheck={() => toggleCheck(loc.id)} />
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {visibleLocations.length > 5 && (
                        <button
                          onClick={() => setShowAllLocations(!showAllLocations)}
                          className="w-full flex items-center justify-center gap-1.5 py-3 mt-1 text-sm font-semibold text-[#0f2942] hover:text-teal-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors border border-gray-100"
                        >
                          {showAllLocations ? (
                            <>Thu gọn <ChevronUp size={16} /></>
                          ) : (
                            <>Xem thêm {visibleLocations.length - 5} địa điểm khác <ChevronDown size={16} /></>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* MOBILE LIST BOTTOM BUTTON */}
            <div className="lg:hidden absolute bottom-5 left-5 z-20">
              <button onClick={() => setSheetOpen(true)} className="flex items-center gap-2 bg-white shadow-xl border border-gray-200 text-[#0f2942] text-sm font-bold px-5 py-3 rounded-full hover:bg-gray-50">
                <List size={16} /> Danh sách ({visibleLocations.length}) <ChevronUp size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ═══ MOBILE BOTTOM SHEET ════════════════════════════════════════════ */}
      <AnimatePresence>
        {sheetOpen && (
          <>
            <motion.div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSheetOpen(false)} />
            <motion.div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl lg:hidden max-h-[85vh] flex flex-col" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 400, damping: 40 }} drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.3 }} onDragEnd={(_e, info: PanInfo) => { if (info.offset.y > 80) setSheetOpen(false); }}>
              <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"><div className="w-10 h-1.5 bg-gray-300 rounded-full" /></div>
              <div className="flex items-center justify-between px-5 pb-3 border-b border-gray-100">
                <h3 className="font-bold text-[#0f2942] text-lg h3-card">Khám phá địa điểm</h3>
                <button onClick={() => setSheetOpen(false)} aria-label="Đóng danh sách địa điểm" className="bg-gray-100 p-1.5 rounded-full text-gray-500 hover:text-gray-800"><X size={16} /></button>
              </div>
              <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
                <div className="relative shadow-sm rounded-xl"><Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kiếm nhanh..." className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white" /></div>
                <div className="mt-3 flex items-center gap-2" role="group" aria-label="Bán kính tìm kiếm">
                  <span className="text-xs text-gray-600">Bán kính</span>
                  {([2, 5, 10] as const).map(value => <button key={value} onClick={() => setRadius(value)} aria-pressed={radius === value} className={`flex-1 rounded-lg py-2 text-xs font-bold ${radius === value ? 'bg-teal-600 text-white' : 'border border-gray-200 bg-white text-gray-600'}`}>{value} km</button>)}
                </div>
                <p className="mt-2 text-[10px] text-gray-500">Từ {userPosition ? 'vị trí của bạn' : 'tâm Đà Nẵng'} · Đường chim bay</p>
                <div className="mt-3 grid grid-cols-2 gap-2">{(Object.keys(CATEGORY_META) as Category[]).map(cat => <AnimCheckbox key={cat} checked={catFilter[cat]} onChange={() => toggleCat(cat)} label={CATEGORY_META[cat].label.split('&')[0].trim()} dot={CATEGORY_META[cat].dot} count={categoryCounts[cat]} />)}</div>
                <button onClick={resetFilters} className="mt-2 text-xs font-semibold text-teal-700">Đặt lại bộ lọc</button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
                {visibleLocations.length === 0 && <p className="py-6 text-center text-sm text-gray-500">{placesLoading ? 'Đang tải địa điểm…' : placesError ? 'Chưa tải được danh sách địa điểm' : 'Không có địa điểm phù hợp. Hãy mở rộng bán kính hoặc đổi bộ lọc.'}</p>}
                {visibleLocations.slice(0, 5).map((loc, i) => (
                  <LocationItem key={loc.id} loc={loc} index={i} isSelected={selectedId === loc.id} isChecked={checkedIds.has(loc.id)} onSelect={() => { setSelectedId(loc.id); setSheetOpen(false); }} onCheck={() => toggleCheck(loc.id)} />
                ))}

                <AnimatePresence>
                  {showAllLocations && visibleLocations.length > 5 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-2 overflow-hidden"
                    >
                      {visibleLocations.slice(5).map((loc, i) => (
                        <LocationItem key={loc.id} loc={loc} index={i + 5} isSelected={selectedId === loc.id} isChecked={checkedIds.has(loc.id)} onSelect={() => { setSelectedId(loc.id); setSheetOpen(false); }} onCheck={() => toggleCheck(loc.id)} />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {visibleLocations.length > 5 && (
                  <button
                    onClick={() => setShowAllLocations(!showAllLocations)}
                    className="w-full flex items-center justify-center gap-1.5 py-3 mt-2 text-sm font-semibold text-[#0f2942] hover:text-teal-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                  >
                    {showAllLocations ? (
                      <>Thu gọn <ChevronUp size={16} /></>
                    ) : (
                      <>Xem thêm {visibleLocations.length - 5} địa điểm khác <ChevronDown size={16} /></>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══ FLOATING CTA ═══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {checkedIds.size > 0 && (
          <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 40, scale: 0.95 }} transition={{ duration: 0.3, ease: 'backOut' }} className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[3000]">
            <Link href="/lich-trinh/tao-moi" className="btn-ripple flex items-center gap-3 bg-[#0f2942] hover:bg-[#1a3f5c] text-white font-bold px-7 py-3.5 rounded-full shadow-2xl shadow-[#0f2942]/40 transition-colors border border-[#1a3f5c]">
              <Calendar size={18} className="text-teal-400" />
              Tạo lịch trình từ <motion.span key={checkedIds.size} initial={{ scale: 1.5, color: '#fbbf24' }} animate={{ scale: 1, color: '#ffffff' }} transition={{ duration: 0.3 }} className="font-black text-lg">{checkedIds.size}</motion.span> điểm
              <ArrowRight size={16} className="ml-1 opacity-80" />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
