'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  motion, AnimatePresence, LayoutGroup, PanInfo, useReducedMotion,
} from 'framer-motion';
import {
  ChevronRight, Search, X, RefreshCw, MapPin, Star,
  Navigation, Calendar, Map as MapIcon, List, Layers, Plus, Minus,
  LocateFixed, ChevronUp, Sun, Moon, Car, LoaderCircle, ExternalLink,
  ArrowRight, ChevronDown, Footprints, Bike, Bus, Coins, Compass, Sparkles,
} from 'lucide-react';
import { useNavbarHero } from '@/contexts/NavbarHeroContext';
import Footer from '@/components/layout/Footer';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import MapWrapper from '@/components/map/MapWrapper';
import MapAmbientBackdrop from '@/components/map/MapAmbientBackdrop';
import { useMapRouting } from '@/hooks/useMapRouting';
import { useMapPlaces } from '@/hooks/useMapPlaces';
import { PLACE_PLACEHOLDER, type MapLocation } from '@/lib/map-places';
import { DANANG_CENTER, googleMapsDirections, haversineDistance, type Coordinates, type MapLayer } from '@/lib/map-navigation';
import { getRouteDirections, type TravelOption, type TravelMode } from '@/lib/api/routes';

// ── ĐƯỜNG DẪN ẢNH MINH HỌA CẨM NANG DU LỊCH (DỄ DÀNG THAY THẾ) ───────────────
// Bạn có thể đổi đường dẫn ảnh hoặc thay thế file: frontend/public/images/da-nang-travel-map.jpg
const TRAVEL_MAP_ILLUSTRATION = '/images/da-nang-travel-map.jpg';
const HERO_PANORAMA_IMG = '/images/intro/landscape/intro-coastal-panorama.jpg';

const MAP_MODE_META: { mode: TravelMode; label: string; icon: typeof Car; googleMode: string }[] = [
  { mode: 'WALK', label: 'Đi bộ', icon: Footprints, googleMode: 'walking' },
  { mode: 'MOTORBIKE', label: 'Xe máy', icon: Bike, googleMode: 'two-wheeler' },
  { mode: 'CAR', label: 'Ô tô', icon: Car, googleMode: 'driving' },
  { mode: 'TAXI', label: 'Taxi', icon: Car, googleMode: 'driving' },
  { mode: 'BUS', label: 'Xe buýt', icon: Bus, googleMode: 'transit' },
];

type Category = 'luutru' | 'amthuc' | 'diemdulich' | 'cafe';

const CATEGORY_META: Record<Category, { label: string; shortLabel: string; dot: string; glow: string }> = {
  luutru:     { label: 'Lưu trú & Khách sạn',        shortLabel: 'Lưu trú',      dot: 'bg-sky-400',     glow: 'shadow-[0_0_8px_rgba(56,189,248,0.65)]' },
  amthuc:     { label: 'Ẩm thực & Quán ngon',        shortLabel: 'Ẩm thực',      dot: 'bg-orange-400',  glow: 'shadow-[0_0_8px_rgba(251,146,60,0.65)]' },
  diemdulich: { label: 'Điểm du lịch & Danh thắng',  shortLabel: 'Điểm du lịch', dot: 'bg-emerald-400', glow: 'shadow-[0_0_8px_rgba(52,211,153,0.65)]' },
  cafe:       { label: 'Quán cafe & Bar view biển',  shortLabel: 'Quán cafe',    dot: 'bg-pink-400',    glow: 'shadow-[0_0_8px_rgba(244,114,182,0.65)]' },
};

const ICONIC_LANDMARKS = [
  {
    no: 1,
    name: 'Cầu Rồng (Dragon Bridge)',
    query: 'Cầu Rồng',
    desc: 'Biểu tượng Đà Nẵng, xem trình diễn phun lửa & phun nước 21h thứ Bảy, Chủ Nhật.',
  },
  {
    no: 2,
    name: 'Bãi biển Mỹ Khê (My Khe Beach)',
    query: 'Mỹ Khê',
    desc: 'Top bãi biển quyến rũ nhất hành tinh với bãi cát trắng mịn, làn nước trong xanh.',
  },
  {
    no: 3,
    name: 'Ngũ Hành Sơn (Marble Mountains)',
    query: 'Ngũ Hành Sơn',
    desc: 'Quần thể 5 ngọn núi đá vôi kỳ vĩ với hệ thống hang động huyền ảo và chùa cổ.',
  },
  {
    no: 4,
    name: 'Bán đảo Sơn Trà & Chùa Linh Ứng',
    query: 'Sơn Trà',
    desc: 'Tượng Phật Bà Quan Âm 67m hướng biển, ngắm toàn cảnh vịnh Đà Nẵng.',
  },
  {
    no: 5,
    name: 'Chợ Hàn (Han Market)',
    query: 'Chợ Hàn',
    desc: 'Chợ truyền thống sầm uất tại trung tâm, thiên đường đặc sản & quà lưu niệm.',
  },
  {
    no: 6,
    name: 'Phố cổ Hội An (Cách 30km)',
    query: 'Hội An',
    desc: 'Di sản thế giới UNESCO lung linh lồng đèn ven sông Hoài bình yên.',
  },
];

const MUST_TRY_FOODS = [
  { name: 'Mì Quảng ếch & tôm thịt', query: 'Mì Quảng', icon: '🍜' },
  { name: 'Bánh xèo tôm nhảy giòn rụm', query: 'Bánh Xèo', icon: '🥞' },
  { name: 'Bún chả cá thu gia truyền', query: 'Bún Chả Cá', icon: '🍲' },
  { name: 'Hải sản tươi sống Mỹ Khê', query: 'Hải Sản', icon: '🦀' },
  { name: 'Cà phê sữa đá đậm đà', query: 'Cafe', icon: '☕' },
];

function MapPlaceImage(props: React.ComponentProps<typeof Image>) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [props.src]);
  return <Image {...props} unoptimized src={failed ? PLACE_PLACEHOLDER : props.src} onError={() => setFailed(true)} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATED CHECKBOX (NOCTURNAL DARK GLASS)
// ─────────────────────────────────────────────────────────────────────────────
function AnimCheckbox({
  checked,
  onChange,
  label,
  dot,
  glow,
  count,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  dot: string;
  glow: string;
  count: number;
}) {
  return (
    <button
      onClick={onChange}
      aria-pressed={checked}
      className="flex items-center gap-2.5 group w-full text-left py-1.5 px-2 -mx-2 rounded-lg hover:bg-[#0D2734]/75 transition-colors cursor-pointer"
      type="button"
    >
      <div
        className={`w-4 h-4 rounded-[4px] border flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
          checked
            ? 'bg-[#E6D9B7] border-[#E6D9B7]'
            : 'border-[#E6D9B7]/30 bg-[#0A202B]/80 group-hover:border-[#E6D9B7]/65'
        }`}
      >
        <AnimatePresence>
          {checked && (
            <motion.svg
              key="chk"
              viewBox="0 0 12 10"
              width="9"
              height="7"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              exit={{ pathLength: 0 }}
              transition={{ duration: 0.18 }}
            >
              <motion.path
                d="M1 5 L4.5 8.5 L11 1"
                stroke="#06151C"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </motion.svg>
          )}
        </AnimatePresence>
      </div>
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot} ${checked ? glow : 'opacity-45'}`} />
      <span className={`text-xs font-medium flex-1 leading-snug transition-colors ${checked ? 'text-[#FFFDF5]' : 'text-[#94B0B3]'}`}>
        {label}
      </span>
      <span className="shrink-0 text-[11px] font-semibold font-mono text-[#E6D9B7] bg-[#0B222E]/95 px-2 py-0.5 rounded-md border border-[#E6D9B7]/20">
        {count}
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAP POPUP (NOCTURNAL FROSTED SMOKED GLASS)
// ─────────────────────────────────────────────────────────────────────────────
function MapPopup({
  loc,
  isChecked,
  onClose,
  onAddTrip,
  onNavigate,
}: {
  loc: MapLocation;
  isChecked: boolean;
  onClose: () => void;
  onAddTrip: () => void;
  onNavigate: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.96 }}
      transition={{ duration: 0.24 }}
      className="absolute bottom-4 left-4 sm:left-auto sm:right-20 z-[1000] w-[calc(100%-2rem)] sm:w-80 bg-[#071922]/94 backdrop-blur-2xl rounded-2xl shadow-[0_28px_64px_rgba(2,10,15,0.72)] border border-[#E6D9B7]/30 overflow-hidden"
    >
      <div className="relative h-32 overflow-hidden bg-[#06151C]">
        <MapPlaceImage src={loc.img} alt={loc.name} fill className="object-cover" sizes="320px" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#071922] via-[#071922]/30 to-transparent" />
        <button
          onClick={onClose}
          aria-label="Đóng thông tin địa điểm"
          className="absolute top-2.5 right-2.5 w-7 h-7 bg-[#06151C]/80 text-[#E6D9B7] rounded-full border border-[#E6D9B7]/30 flex items-center justify-center hover:bg-[#06151C] hover:text-[#FFFDF5] transition-colors z-10 cursor-pointer"
        >
          <X size={13} />
        </button>
        <div className="absolute bottom-2.5 left-3">
          <span className="inline-flex items-center gap-1.5 bg-[#06151C]/88 backdrop-blur-md text-[#E6D9B7] border border-[#E6D9B7]/30 text-[10px] font-semibold uppercase tracking-[0.14em] px-2.5 py-1 rounded-full">
            <span className={`w-1.5 h-1.5 rounded-full ${CATEGORY_META[loc.category].dot}`} />
            {CATEGORY_META[loc.category].shortLabel}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-[#FFFDF5] text-sm leading-snug mb-1.5">{loc.name}</h3>
        <div className="flex items-center gap-1.5 mb-1.5">
          <Star size={12} className="fill-[#E87B39] text-[#E87B39]" />
          <span className="text-xs font-semibold text-[#FFFDF5]">{loc.rating}</span>
          <span className="text-[11px] text-[#94B0B3]">({loc.reviews.toLocaleString('vi-VN')} đánh giá)</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-[#CBD9DA]/80 mb-3">
          <MapPin size={11} className="text-[#2DD4BF] shrink-0" />
          <span className="truncate">{loc.address}</span>
        </div>

        <div className="space-y-1.5 mb-3.5 text-[11px] text-[#CBD9DA]/85 border-y border-[#E6D9B7]/15 py-2.5">
          <p>
            <span className="font-semibold font-mono text-[#E6D9B7]">{loc.distance}</span> đường chim bay từ tâm tìm kiếm
          </p>
          <p className="flex items-center gap-1.5 text-[#94B0B3]">
            <Car size={12} className="text-[#2DD4BF] shrink-0" />
            Hỗ trợ 5 phương tiện (Đi bộ, Xe máy, Ô tô, Taxi, Xe buýt).
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onNavigate}
            className="group flex-1 flex items-center justify-center gap-1.5 bg-[#E87B39] hover:bg-[#D96B29] text-[#FFFDF5] text-[11px] font-bold uppercase tracking-wider px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer shadow-[0_8px_20px_rgba(232,123,57,0.28)]"
          >
            <Navigation size={12} />
            Chỉ đường
            <ArrowRight size={12} className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>
          <button
            onClick={onAddTrip}
            aria-label="Thêm địa điểm vào lịch trình"
            title={isChecked ? 'Bỏ khỏi lịch trình' : 'Thêm vào lịch trình'}
            className={`flex items-center justify-center gap-1 border text-[11px] font-semibold px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
              isChecked
                ? 'border-[#E6D9B7] bg-[#E6D9B7] text-[#06151C]'
                : 'border-[#E6D9B7]/28 bg-[#0B222E]/90 text-[#E6D9B7] hover:border-[#E6D9B7]/65 hover:text-[#FFFDF5]'
            }`}
          >
            <Calendar size={13} />
          </button>
        </div>

        <div className="pt-2.5 mt-3 border-t border-[#E6D9B7]/15 flex items-center justify-between">
          <Link href={`/places/${loc.id}`} className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#E6D9B7] hover:text-[#FFFDF5] hover:underline">
            Xem chi tiết
          </Link>
          <a
            href={googleMapsDirections([loc.lat, loc.lng])}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-[#2DD4BF] hover:text-[#5EEAD4] hover:underline"
          >
            <ExternalLink size={11} /> Mở Google Maps
          </a>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LOCATION LIST ITEM (ZERO DISTANCE CLIPPING, DARK SMOKED GLASS)
// ─────────────────────────────────────────────────────────────────────────────
function LocationItem({
  loc,
  isSelected,
  isChecked,
  onSelect,
  onCheck,
  index,
}: {
  loc: MapLocation;
  isSelected: boolean;
  isChecked: boolean;
  onSelect: () => void;
  onCheck: () => void;
  index: number;
}) {
  const meta = CATEGORY_META[loc.category];
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(0.28, 0.03 + index * 0.03), duration: 0.28 }}
      onClick={onSelect}
      className={`group flex items-start gap-2.5 p-2.5 rounded-xl cursor-pointer transition-all duration-200 border ${
        isSelected
          ? 'bg-[#0F2F3E]/95 border-[#E6D9B7]/55 shadow-[0_10px_24px_rgba(2,10,15,0.42)]'
          : 'bg-[#091E28]/55 border-[#E6D9B7]/10 hover:bg-[#0D2835]/85 hover:border-[#E6D9B7]/30'
      }`}
    >
      <button
        type="button"
        aria-label={isChecked ? `Bỏ chọn ${loc.name}` : `Chọn ${loc.name} cho lịch trình`}
        onClick={e => { e.stopPropagation(); onCheck(); }}
        className={`w-4 h-4 rounded-[4px] border flex items-center justify-center flex-shrink-0 mt-1 transition-all duration-200 cursor-pointer ${
          isChecked
            ? 'bg-[#E6D9B7] border-[#E6D9B7]'
            : 'border-[#E6D9B7]/32 bg-[#06151C]/75 hover:border-[#E6D9B7]/65'
        }`}
      >
        {isChecked && (
          <motion.svg viewBox="0 0 12 10" width="9" height="7" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.18 }}>
            <motion.path d="M1 5 L4.5 8.5 L11 1" stroke="#06151C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </motion.svg>
        )}
      </button>

      <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-[#06151C] border border-[#E6D9B7]/18">
        <MapPlaceImage src={loc.img} alt={loc.name} fill className="object-cover" sizes="48px" />
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold leading-snug truncate transition-colors ${isSelected ? 'text-[#E6D9B7]' : 'text-[#FFFDF5] group-hover:text-[#E6D9B7]'}`}>
          {loc.name}
        </p>
        <div className="flex items-center justify-between gap-2 mt-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot} flex-shrink-0`} />
            <Star size={10} className="fill-[#E87B39] text-[#E87B39] flex-shrink-0" />
            <span className="text-[11px] font-semibold text-[#FFFDF5]">{loc.rating}</span>
          </div>
          <span className="shrink-0 whitespace-nowrap text-[11px] font-mono font-semibold text-[#E6D9B7] bg-[#0B222E]/95 border border-[#E6D9B7]/20 px-1.5 py-0.5 rounded-md">
            {loc.distance}
          </span>
        </div>
        <p className="text-[11px] text-[#94B0B3] font-normal mt-1 truncate">{loc.address}</p>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function BanDoDuLichPage() {
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const heroSectionRef = useRef<HTMLElement>(null);
  const mapStageRef = useRef<HTMLDivElement>(null);
  const reducedMotion = Boolean(useReducedMotion());

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
  const [darkMap, setDarkMap] = useState(true);
  const [layersOpen, setLayersOpen] = useState(false);
  const [routeTarget, setRouteTarget] = useState<MapLocation | null>(null);
  const [routeAttempt, setRouteAttempt] = useState(0);
  const [travelOptions, setTravelOptions] = useState<TravelOption[]>([]);
  const [selectedMode, setSelectedMode] = useState<TravelMode>('MOTORBIKE');
  const [resetViewSignal, setResetViewSignal] = useState(0);
  const mounted = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  // Register Dark Hero for Navbar glass-over-hero seamless transition
  const { setHeroRef } = useNavbarHero();
  useEffect(() => {
    setHeroRef(heroSectionRef.current);
    return () => setHeroRef(null);
  }, [setHeroRef]);

  const filterCenter = userPosition ?? DANANG_CENTER;
  const { route, loading: routeLoading, error: routeError } = useMapRouting(routeTarget, filterCenter, routeAttempt);

  useEffect(() => {
    if (!routeTarget) {
      setTravelOptions([]);
      return;
    }
    let cancelled = false;
    getRouteDirections({
      toPlaceId: routeTarget.id,
      from: `${filterCenter[0]},${filterCenter[1]}`,
      to: `${routeTarget.lat},${routeTarget.lng}`,
      modes: 'WALK,MOTORBIKE,CAR,TAXI,BUS',
    })
      .then(opts => {
        if (!cancelled) setTravelOptions(opts);
      })
      .catch(() => {
        if (!cancelled) setTravelOptions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [routeTarget, filterCenter, routeAttempt]);

  const effectiveTravelOptions: TravelOption[] = useMemo(() => {
    if (travelOptions.length > 0) return travelOptions;
    if (!route) return [];
    const d = Math.round(route.distanceKm * 100) / 100;
    const driveMin = route.durationMinutes;
    const round1000 = (n: number) => Math.round(n / 1000) * 1000;
    return [
      { mode: 'WALK', distanceKm: d, durationMinutes: Math.max(1, Math.round((d / 5) * 60)), estimatedCost: 0, cached: false },
      { mode: 'MOTORBIKE', distanceKm: d, durationMinutes: Math.max(1, Math.round(driveMin * 0.9)), estimatedCost: round1000(d * 3000), cached: false },
      { mode: 'CAR', distanceKm: d, durationMinutes: Math.max(1, Math.round(driveMin)), estimatedCost: round1000(d * 6000), cached: false },
      { mode: 'TAXI', distanceKm: d, durationMinutes: Math.max(1, Math.round(driveMin)), estimatedCost: round1000(d * 15000), cached: false },
      { mode: 'BUS', distanceKm: d, durationMinutes: Math.max(1, Math.round(driveMin * 1.6 + 10)), estimatedCost: 7000, cached: false },
    ];
  }, [travelOptions, route]);

  const activeTravelOption = effectiveTravelOptions.find(o => o.mode === selectedMode) ?? effectiveTravelOptions[0] ?? null;

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
    setSearch('');
    setRadius(5);
    setSelectedId(null);
    setRouteTarget(null);
    setZoomLevel(13);
    setResetViewSignal(v => v + 1);
  };

  const focusLandmarkOrQuery = useCallback((query: string) => {
    const normalized = query.toLocaleLowerCase('vi');
    const matched = locations.find(loc =>
      `${loc.name} ${loc.address}`.toLocaleLowerCase('vi').includes(normalized),
    );
    setCatFilter({ luutru: true, amthuc: true, diemdulich: true, cafe: true });
    setViewMode('map');
    if (matched) {
      const dist = haversineDistance(filterCenter, [matched.lat, matched.lng]);
      if (dist > radius) setRadius(10);
      setSearch('');
      setSelectedId(matched.id);
    } else {
      setRadius(10);
      setSearch(query);
      setSelectedId(null);
    }
    mapStageRef.current?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
  }, [locations, filterCenter, radius, reducedMotion]);

  const backdropMode: 'night' | 'day' | 'satellite' =
    mapLayer === 'satellite' ? 'satellite' : darkMap ? 'night' : 'day';

  return (
    <div
      ref={pageContainerRef}
      className="min-h-screen flex flex-col bg-[#06151C] text-[#FFFDF5] dananggo-cinematic-content relative overflow-x-clip"
    >
      {/* ═══ NOCTURNAL AMBIENT CARTOGRAPHY BACKDROP ═════════════════════════ */}
      <MapAmbientBackdrop mode={backdropMode} containerRef={pageContainerRef} />

      {/* ═══ CINEMATIC EXPEDITION CARTOGRAPHY HERO ══════════════════════════ */}
      <section
        ref={heroSectionRef}
        data-navbar-overlay="true"
        aria-label="Bản đồ du lịch Đà Nẵng"
        className="relative z-10 w-full h-[430px] sm:h-[470px] lg:h-[505px] overflow-hidden select-none bg-[#06151C] flex items-end"
      >
        <motion.div
          initial={reducedMotion ? { scale: 1 } : { scale: 1.05 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.15, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 w-full h-full"
        >
          <Image
            src={HERO_PANORAMA_IMG}
            alt="Toàn cảnh ven biển và bản đồ khám phá Đà Nẵng"
            fill
            priority
            unoptimized
            className="object-cover object-center opacity-70"
            sizes="100vw"
          />
        </motion.div>

        {/* Deep Ocean Multi-Stop Scrim melting into #06151C */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            background:
              'linear-gradient(180deg, rgba(6,21,28,0.78) 0%, rgba(8,26,35,0.40) 38%, rgba(7,22,30,0.68) 70%, rgba(6,21,28,0.92) 89%, #06151C 100%)',
          }}
        />

        {/* Hero Content & Bottom-Right Telemetry (clears top-right Weather pill cleanly) */}
        <div className="relative z-10 home-container w-full pb-20 sm:pb-24 pt-28">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-xs sm:text-sm text-[#CBD9DA]/82 mb-3.5"
          >
            <Link href="/" className="hover:text-[#FFFDF5] transition-colors">
              Trang chủ
            </Link>
            <ChevronRight size={14} className="text-[#E6D9B7]/50" />
            <span className="text-[#E6D9B7] font-medium">Bản đồ du lịch</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <motion.div
                initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="inline-flex items-center gap-2.5 mb-3"
              >
                <span className="w-8 h-[1.5px] bg-[#E87B39]" aria-hidden="true" />
                <Compass size={13} className="text-[#E6D9B7]" />
                <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-[#E6D9B7]">
                  EXPEDITION CARTOGRAPHY // ĐÀ NẴNG
                </span>
              </motion.div>

              <motion.h1
                initial={reducedMotion ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.06 }}
                className="cinematic-condensed uppercase text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-[#FFFDF5] tracking-[0.015em] leading-[1.02]"
              >
                Bản đồ du lịch{' '}
                <span className="home-serif italic font-normal normal-case text-[#E6D9B7] tracking-normal">
                  tương tác
                </span>
              </motion.h1>

              <motion.p
                initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.12 }}
                className="text-xs sm:text-sm text-[#CBD9DA]/85 mt-2.5 max-w-xl leading-relaxed"
              >
                Định vị danh thắng, khách sạn, quán ngon theo bán kính trực tiếp và tính toán lộ trình tối ưu bằng 5 phương tiện di chuyển.
              </motion.p>

              {/* Category Quick-Toggle Stat Chips */}
              <motion.div
                initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.18 }}
                className="flex flex-wrap gap-2 mt-4"
              >
                {(['luutru', 'amthuc', 'diemdulich', 'cafe'] as Category[]).map(cat => {
                  const active = catFilter[cat];
                  const meta = CATEGORY_META[cat];
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCat(cat)}
                      aria-pressed={active}
                      className={`inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border backdrop-blur-md transition-all cursor-pointer ${
                        active
                          ? 'bg-[#0A202B]/88 border-[#E6D9B7]/35 text-[#FFFDF5] hover:border-[#E6D9B7]/65'
                          : 'bg-[#06151C]/60 border-[#E6D9B7]/12 text-[#94B0B3] opacity-65 hover:opacity-100'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${meta.dot} ${active ? meta.glow : ''}`} />
                      <AnimatedCounter
                        key={`${cat}-${categoryCounts[cat]}`}
                        to={categoryCounts[cat]}
                        className="font-bold font-mono text-[#E6D9B7]"
                      />
                      <span>{meta.shortLabel}</span>
                    </button>
                  );
                })}
              </motion.div>
            </div>

            {/* Bottom-Right Live Coordinate & Routing Telemetry */}
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.16 }}
              className="flex flex-wrap items-center gap-2.5 lg:justify-end"
            >
              <div className="inline-flex items-center gap-2 bg-[#071922]/82 backdrop-blur-xl border border-[#E6D9B7]/24 text-[#CBD9DA] text-xs font-medium px-3.5 py-2 rounded-full">
                <Navigation size={13} className="text-[#2DD4BF]" />
                <span>Dẫn đường trực tiếp · 5 phương tiện</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-[#071922]/90 backdrop-blur-xl border border-[#E6D9B7]/32 text-[#FFFDF5] text-xs font-mono px-3.5 py-2 rounded-full shadow-[0_10px_28px_rgba(2,10,15,0.45)]">
                <span className="w-2 h-2 rounded-full bg-[#E87B39] animate-pulse" />
                <span>
                  {filterCenter[0].toFixed(4)}°, {filterCenter[1].toFixed(4)}° · {userPosition ? 'Vị trí của bạn' : 'Tâm Đà Nẵng'}
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ STATUS / DATA DIAGNOSTIC BAR ═══════════════════════════════════ */}
      <div className="home-container -mt-12 sm:-mt-14 mb-3 relative z-20" aria-live="polite">
        {placesLoading && (
          <p role="status" className="inline-flex items-center gap-2 rounded-full bg-[#071922]/90 border border-[#E6D9B7]/25 backdrop-blur-xl px-4 py-1.5 text-xs text-[#E6D9B7] font-medium">
            <LoaderCircle size={14} className="animate-spin text-[#E87B39]" /> Đang tải địa điểm từ máy chủ…
          </p>
        )}
        {placesError && (
          <div role="alert" className="rounded-xl bg-[#2A1710]/90 backdrop-blur-xl px-4 py-2.5 text-xs text-[#FCD9B6] border border-[#E87B39]/40">
            {placesError}
            <button onClick={reloadPlaces} className="ml-3 font-bold text-[#E6D9B7] underline hover:text-[#FFFDF5] cursor-pointer">
              Thử tải lại
            </button>
          </div>
        )}
        {!placesLoading && !placesError && locations.length === 0 && (
          <p className="inline-block rounded-full bg-[#071922]/85 border border-[#E6D9B7]/20 px-4 py-1.5 text-xs text-[#CBD9DA]">
            Chưa có địa điểm có tọa độ để hiển thị trên bản đồ.
          </p>
        )}
        {!placesLoading && !placesError && missingCoordinates > 0 && (
          <p className="inline-flex items-center gap-2 rounded-full bg-[#071922]/82 backdrop-blur-xl border border-[#E6D9B7]/18 px-3.5 py-1 text-[11px] text-[#CBD9DA]/80">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E6D9B7]/70" />
            {missingCoordinates} địa điểm chưa có tọa độ hợp lệ nên chưa hiển thị trên bản đồ.
          </p>
        )}
      </div>

      {/* ═══ NOCTURNAL MAP COMMAND CENTER CONTAINER ═════════════════════════ */}
      <div ref={mapStageRef} id="bando-command-center" className="flex-1 w-full home-container pb-10 flex flex-col min-h-0 relative z-20">
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="bando-console-glass flex-1 flex flex-col lg:flex-row bg-[#071821]/86 rounded-[20px] shadow-[0_32px_80px_rgba(2,10,15,0.62)] border border-[#E6D9B7]/26 overflow-hidden min-h-[640px] lg:h-[76vh] lg:min-h-[650px] lg:max-h-[840px] relative"
        >
          {/* Subtle Leica Viewfinder Corner Hairlines */}
          <span aria-hidden="true" className="pointer-events-none absolute top-2.5 left-2.5 w-3.5 h-3.5 border-t border-l border-[#E6D9B7]/40 rounded-tl-sm z-30" />
          <span aria-hidden="true" className="pointer-events-none absolute top-2.5 right-2.5 w-3.5 h-3.5 border-t border-r border-[#E6D9B7]/40 rounded-tr-sm z-30" />
          <span aria-hidden="true" className="pointer-events-none absolute bottom-2.5 left-2.5 w-3.5 h-3.5 border-b border-l border-[#E6D9B7]/40 rounded-bl-sm z-30" />
          <span aria-hidden="true" className="pointer-events-none absolute bottom-2.5 right-2.5 w-3.5 h-3.5 border-b border-r border-[#E6D9B7]/40 rounded-br-sm z-30" />

          {/* ── LEFT DESKTOP SIDEBAR (NOCTURNAL COMMAND CONSOLE) ── */}
          <aside className="hidden lg:flex flex-col w-[375px] xl:w-[395px] bg-[#06151C]/90 border-r border-[#E6D9B7]/16 flex-shrink-0 z-20 relative min-h-0">
            {/* TOP CONTROLS — FIXED */}
            <div className="p-5 space-y-5 shrink-0 relative z-10 border-b border-[#E6D9B7]/14">
              {/* Search Box */}
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#E6D9B7]/75" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder='Tìm địa điểm... "Sơn Trà", "Cầu Rồng"'
                  className="w-full pl-10 pr-9 py-2.5 border border-[#E6D9B7]/22 focus:border-[#E6D9B7]/65 rounded-xl text-sm font-medium text-[#FFFDF5] focus:outline-none bg-[#0A202B]/90 focus:bg-[#0D2835] transition-all placeholder-[#94B0B3]/65"
                />
                <AnimatePresence>
                  {search && (
                    <motion.button
                      type="button"
                      aria-label="Xóa từ khóa tìm kiếm"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={() => setSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94B0B3] hover:text-[#FFFDF5] cursor-pointer"
                    >
                      <X size={14} />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              {/* Category Filters */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E6D9B7]">
                    Phân loại
                  </p>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="flex items-center gap-1 text-[11px] text-[#94B0B3] hover:text-[#E87B39] transition-colors font-semibold cursor-pointer"
                  >
                    <RefreshCw size={11} /> Đặt lại
                  </button>
                </div>
                <div className="space-y-0.5">
                  {(Object.keys(CATEGORY_META) as Category[]).map(cat => (
                    <AnimCheckbox
                      key={cat}
                      checked={catFilter[cat]}
                      onChange={() => toggleCat(cat)}
                      label={CATEGORY_META[cat].label}
                      dot={CATEGORY_META[cat].dot}
                      glow={CATEGORY_META[cat].glow}
                      count={categoryCounts[cat]}
                    />
                  ))}
                </div>
              </div>

              {/* Radius Filter */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#E6D9B7] mb-2.5">
                  Bán kính từ {userPosition ? 'vị trí của bạn' : 'tâm Đà Nẵng'}
                </p>
                <LayoutGroup id="radius">
                  <div className="flex gap-1.5 p-1 bg-[#0A202B]/90 border border-[#E6D9B7]/18 rounded-xl">
                    {([2, 5, 10] as const).map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRadius(r)}
                        aria-pressed={radius === r}
                        className={`relative flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          radius === r ? 'text-[#06151C]' : 'text-[#CBD9DA]/80 hover:text-[#FFFDF5]'
                        }`}
                      >
                        {radius === r && (
                          <motion.span
                            layoutId="radius-bg"
                            className="absolute inset-0 rounded-lg bg-[#E6D9B7]"
                            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                          />
                        )}
                        <span className="relative z-10">{r} km</span>
                      </button>
                    ))}
                  </div>
                </LayoutGroup>
                <p className="mt-2 text-[11px] font-normal text-[#94B0B3] leading-relaxed">
                  Khoảng cách đường chim bay. Quãng đường lái xe sẽ được tính khi chỉ đường.
                </p>
              </div>
            </div>

            {/* SCROLLABLE LOCATION LIST */}
            <div data-lenis-prevent className="flex-1 min-h-0 overflow-y-auto bando-sidebar-scroll px-5 pb-5 relative z-10 pt-3.5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E6D9B7]">
                  Địa điểm ghim ({visibleLocations.length})
                </p>
                {checkedIds.size > 0 && (
                  <span className="text-[10px] font-semibold text-[#2DD4BF] bg-[#2DD4BF]/12 border border-[#2DD4BF]/30 px-2 py-0.5 rounded-full">
                    Đã chọn {checkedIds.size}
                  </span>
                )}
              </div>

              <div className="space-y-2 pb-16">
                {visibleLocations.slice(0, 5).map((loc, i) => (
                  <LocationItem
                    key={loc.id}
                    loc={loc}
                    isSelected={selectedId === loc.id}
                    isChecked={checkedIds.has(loc.id)}
                    onSelect={() => setSelectedId(selectedId === loc.id ? null : loc.id)}
                    onCheck={() => toggleCheck(loc.id)}
                    index={i}
                  />
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
                        <LocationItem
                          key={loc.id}
                          loc={loc}
                          isSelected={selectedId === loc.id}
                          isChecked={checkedIds.has(loc.id)}
                          onSelect={() => setSelectedId(selectedId === loc.id ? null : loc.id)}
                          onCheck={() => toggleCheck(loc.id)}
                          index={i + 5}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {visibleLocations.length > 5 && (
                  <button
                    type="button"
                    onClick={() => setShowAllLocations(!showAllLocations)}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 mt-2 text-xs font-semibold text-[#E6D9B7] hover:text-[#FFFDF5] bg-[#0B222E]/90 hover:bg-[#103040] rounded-xl transition-colors border border-[#E6D9B7]/20 cursor-pointer"
                  >
                    {showAllLocations ? (
                      <>Thu gọn <ChevronUp size={14} /></>
                    ) : (
                      <>Xem thêm {visibleLocations.length - 5} địa điểm khác <ChevronDown size={14} /></>
                    )}
                  </button>
                )}

                {visibleLocations.length === 0 && (
                  <p className="text-xs text-[#94B0B3] text-center py-8 leading-relaxed">
                    {placesLoading
                      ? 'Đang tải địa điểm…'
                      : placesError
                        ? 'Chưa tải được danh sách địa điểm'
                        : 'Không có địa điểm phù hợp trong bán kính đã chọn'}
                  </p>
                )}
              </div>
            </div>
          </aside>

          {/* ── RIGHT LEAFLET INTERACTIVE MAP STAGE ── */}
          <div
            data-lenis-prevent
            className={`bando-leaflet-container ${darkMap && mapLayer === 'street' ? 'bando-map-nocturnal' : ''} flex-1 min-h-[600px] relative overflow-hidden bg-[#071922] z-0 isolate`}
            style={{ transform: 'translateZ(0)' }}
          >
            {/* LEAFLET MAP */}
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
                resetViewSignal={resetViewSignal}
              />
            </div>

            {/* TOP-LEFT TELEMETRY PILL */}
            <div
              className="absolute top-4 left-4 z-20 max-w-[calc(100%-15rem)] inline-flex items-center gap-2 rounded-full bg-[#06151C]/86 backdrop-blur-xl border border-[#E6D9B7]/28 px-3.5 py-2 text-[11px] font-semibold text-[#FFFDF5] shadow-[0_12px_28px_rgba(2,10,15,0.45)]"
              aria-live="polite"
            >
              <span className="w-2 h-2 rounded-full bg-[#2DD4BF] shadow-[0_0_8px_rgba(45,212,191,0.8)]" />
              <span>{visibleLocations.length} địa điểm · {radius} km</span>
              <span className="hidden sm:inline text-[#E6D9B7]/70 font-mono text-[10px] pl-1 border-l border-[#E6D9B7]/20">
                Z{zoomLevel}
              </span>
            </div>

            {/* TOP-RIGHT MAP MODE & NIGHT THEME CONTROLS */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (mapLayer === 'satellite') {
                    setMapLayer('street');
                    setDarkMap(true);
                  } else {
                    setDarkMap(prev => !prev);
                  }
                }}
                title={mapLayer === 'satellite' ? 'Chuyển về bản đồ đêm' : darkMap ? 'Chuyển sang bản đồ sáng' : 'Chuyển sang bản đồ đêm'}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-[#06151C]/86 backdrop-blur-xl border border-[#E6D9B7]/28 px-3 py-2 text-xs font-semibold text-[#E6D9B7] hover:text-[#FFFDF5] hover:border-[#E6D9B7]/55 shadow-[0_12px_28px_rgba(2,10,15,0.45)] transition-all cursor-pointer"
              >
                {mapLayer === 'satellite' ? (
                  <>
                    <Layers size={13} className="text-[#2DD4BF]" /> Vệ tinh
                  </>
                ) : darkMap ? (
                  <>
                    <Moon size={13} className="text-[#E6D9B7]" /> Bản đồ đêm
                  </>
                ) : (
                  <>
                    <Sun size={13} className="text-[#E87B39]" /> Bản đồ sáng
                  </>
                )}
              </button>

              <div className="flex bg-[#06151C]/88 backdrop-blur-xl rounded-full shadow-[0_12px_28px_rgba(2,10,15,0.45)] border border-[#E6D9B7]/28 p-0.5">
                {(['map', 'list'] as const).map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setViewMode(mode)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                      viewMode === mode
                        ? 'bg-[#E6D9B7] text-[#06151C]'
                        : 'text-[#CBD9DA] hover:text-[#FFFDF5]'
                    }`}
                  >
                    {mode === 'map' ? <MapIcon size={13} /> : <List size={13} />}
                    {mode === 'map' ? 'Bản đồ' : 'Danh sách'}
                  </button>
                ))}
              </div>
            </div>

            {/* BOTTOM-RIGHT FLOATING CONTROL STACK */}
            <div className="absolute bottom-7 right-4 z-20 flex flex-col gap-2">
              {[
                { icon: Plus, title: 'Phóng to', action: () => setZoomLevel(z => Math.min(z + 1, 19)), disabled: zoomLevel >= 19 },
                { icon: Minus, title: 'Thu nhỏ', action: () => setZoomLevel(z => Math.max(z - 1, 3)), disabled: zoomLevel <= 3 },
              ].map(btn => (
                <button
                  key={btn.title}
                  type="button"
                  onClick={btn.action}
                  title={btn.title}
                  aria-label={btn.title}
                  disabled={btn.disabled}
                  className="w-10 h-10 bg-[#06151C]/88 backdrop-blur-xl rounded-xl shadow-[0_12px_28px_rgba(2,10,15,0.5)] border border-[#E6D9B7]/28 flex items-center justify-center text-[#E6D9B7] hover:bg-[#0D2835] hover:text-[#FFFDF5] hover:border-[#E6D9B7]/55 hover:scale-105 active:scale-95 disabled:opacity-40 transition-all cursor-pointer"
                >
                  <btn.icon size={16} />
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setZoomLevel(13);
                  setResetViewSignal(v => v + 1);
                }}
                title="Về tâm Đà Nẵng"
                aria-label="Về tâm Đà Nẵng"
                className="w-10 h-10 bg-[#06151C]/88 backdrop-blur-xl rounded-xl shadow-[0_12px_28px_rgba(2,10,15,0.5)] border border-[#E6D9B7]/28 flex items-center justify-center text-[#E6D9B7] hover:bg-[#0D2835] hover:text-[#FFFDF5] hover:border-[#E6D9B7]/55 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <Compass size={16} />
              </button>
              <button
                type="button"
                onClick={locateUser}
                disabled={isLocating}
                title="Vị trí tôi"
                aria-label={isLocating ? 'Đang định vị' : 'Vị trí tôi'}
                className={`w-10 h-10 bg-[#06151C]/88 backdrop-blur-xl rounded-xl shadow-[0_12px_28px_rgba(2,10,15,0.5)] border border-[#E6D9B7]/28 flex items-center justify-center hover:bg-[#0D2835] hover:border-[#E6D9B7]/55 disabled:opacity-60 transition-all cursor-pointer ${
                  userPosition ? 'text-[#38BDF8] border-[#38BDF8]/55' : 'text-[#E6D9B7]'
                }`}
              >
                {isLocating ? <LoaderCircle size={16} className="animate-spin" /> : <LocateFixed size={16} />}
              </button>
              <button
                type="button"
                onClick={() => setLayersOpen(open => !open)}
                title="Lớp bản đồ"
                aria-label="Lớp bản đồ"
                aria-expanded={layersOpen}
                aria-controls="map-layers"
                className={`w-10 h-10 bg-[#06151C]/88 backdrop-blur-xl rounded-xl shadow-[0_12px_28px_rgba(2,10,15,0.5)] border flex items-center justify-center hover:bg-[#0D2835] hover:text-[#FFFDF5] transition-all cursor-pointer ${
                  layersOpen ? 'border-[#E6D9B7] text-[#FFFDF5] bg-[#0D2835]' : 'border-[#E6D9B7]/28 text-[#E6D9B7]'
                }`}
              >
                <Layers size={16} />
              </button>
            </div>

            {/* LAYERS POPOVER (DARK SMOKED GLASS) */}
            <AnimatePresence>
              {layersOpen && (
                <motion.div
                  id="map-layers"
                  role="group"
                  aria-label="Chọn lớp bản đồ"
                  initial={{ opacity: 0, x: 8, scale: 0.96 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 8, scale: 0.96 }}
                  transition={{ duration: 0.18 }}
                  className="absolute bottom-7 right-16 z-[1100] w-56 rounded-2xl border border-[#E6D9B7]/30 bg-[#06151C]/94 backdrop-blur-2xl p-2.5 shadow-[0_24px_54px_rgba(2,10,15,0.7)]"
                >
                  <div className="flex items-center justify-between px-2 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#E6D9B7]">
                    <span>Lớp bản đồ</span>
                    <button
                      type="button"
                      onClick={() => setLayersOpen(false)}
                      aria-label="Đóng chọn lớp bản đồ"
                      className="text-[#94B0B3] hover:text-[#FFFDF5] cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  {[
                    { id: 'night', label: 'Đường phố (Ban đêm)', active: mapLayer === 'street' && darkMap, onClick: () => { setMapLayer('street'); setDarkMap(true); setLayersOpen(false); } },
                    { id: 'day', label: 'Đường phố (Ban ngày)', active: mapLayer === 'street' && !darkMap, onClick: () => { setMapLayer('street'); setDarkMap(false); setLayersOpen(false); } },
                    { id: 'satellite', label: 'Ảnh vệ tinh', active: mapLayer === 'satellite', onClick: () => { setMapLayer('satellite'); setLayersOpen(false); } },
                  ].map(option => (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={option.active}
                      onClick={option.onClick}
                      className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition-colors cursor-pointer ${
                        option.active
                          ? 'bg-[#E6D9B7]/16 text-[#E6D9B7] border border-[#E6D9B7]/35'
                          : 'text-[#CBD9DA] hover:bg-[#0D2835] hover:text-[#FFFDF5] border border-transparent'
                      }`}
                    >
                      <span>{option.label}</span>
                      {option.active && <span className="text-[#E87B39]">✓</span>}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* GPS STATUS & 5-MODE OSRM ROUTE PANEL */}
            <div className="absolute top-16 left-4 right-16 z-30 flex max-w-sm flex-col gap-2">
              {(isLocating || gpsError) && (
                <div role="status" className="rounded-2xl bg-[#06151C]/92 backdrop-blur-xl border border-[#E6D9B7]/28 p-3.5 text-xs text-[#FFFDF5] shadow-[0_18px_40px_rgba(2,10,15,0.6)]">
                  {isLocating ? 'Đang lấy vị trí GPS của bạn…' : gpsError}
                  {gpsError && (
                    <div className="mt-2.5 flex gap-3">
                      <button type="button" onClick={locateUser} className="font-bold text-[#E6D9B7] hover:underline cursor-pointer">
                        Thử lại
                      </button>
                      <button type="button" onClick={() => setGpsError(null)} className="text-[#94B0B3] hover:text-[#FFFDF5] cursor-pointer">
                        Đóng
                      </button>
                    </div>
                  )}
                </div>
              )}

              {routeTarget && (
                <div
                  role="status"
                  aria-live="polite"
                  className="rounded-2xl border border-[#E6D9B7]/30 bg-[#06151C]/94 p-4 shadow-[0_26px_60px_rgba(2,10,15,0.72)] backdrop-blur-2xl"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#2DD4BF]">
                        Chỉ đường &amp; Phương tiện di chuyển
                      </p>
                      <p className="mt-1 truncate text-sm font-bold text-[#FFFDF5]">{routeTarget.name}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRouteTarget(null)}
                      aria-label="Đóng tuyến đường"
                      className="rounded-full p-1 text-[#94B0B3] hover:bg-[#0D2835] hover:text-[#FFFDF5] cursor-pointer"
                    >
                      <X size={15} />
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-[#94B0B3]">
                    Từ {userPosition ? 'vị trí GPS của bạn' : 'tâm Đà Nẵng (chưa có GPS)'}
                  </p>
                  {routeLoading && (
                    <p className="mt-2.5 flex items-center gap-2 text-xs text-[#E6D9B7]">
                      <LoaderCircle size={14} className="animate-spin text-[#E87B39]" /> Đang tìm tuyến đường…
                    </p>
                  )}

                  <div className="mt-3 grid grid-cols-5 gap-1.5">
                    {MAP_MODE_META.map(({ mode, label, icon: Icon }) => {
                      const active = selectedMode === mode;
                      const opt = effectiveTravelOptions.find(o => o.mode === mode);
                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setSelectedMode(mode)}
                          className={`flex flex-col items-center justify-center rounded-xl py-2 px-1 text-[10px] font-bold transition-all border cursor-pointer ${
                            active
                              ? 'bg-[#E6D9B7] text-[#06151C] border-[#E6D9B7] shadow-sm'
                              : 'bg-[#0A202B]/90 text-[#CBD9DA] border-[#E6D9B7]/16 hover:border-[#E6D9B7]/45 hover:text-[#FFFDF5]'
                          }`}
                        >
                          <Icon size={13} className="mb-0.5" />
                          <span className="truncate max-w-full">{label}</span>
                          {opt && (
                            <span className={`text-[9px] font-mono font-semibold ${active ? 'text-[#06151C]/75' : 'text-[#94B0B3]'}`}>
                              {opt.durationMinutes}p
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {activeTravelOption ? (
                    <div className="mt-3 rounded-xl bg-[#0B2330]/95 border border-[#E6D9B7]/22 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-[#FFFDF5]">
                          {activeTravelOption.distanceKm.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} km{' '}
                          <span className="text-[#E6D9B7]/50">·</span>{' '}
                          <span className="text-[#2DD4BF]">
                            khoảng {activeTravelOption.durationMinutes.toLocaleString('vi-VN')} phút
                          </span>
                        </p>
                        <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-[#E87B39]/16 px-2.5 py-0.5 text-[11px] font-bold text-[#F5B281] border border-[#E87B39]/35">
                          <Coins size={11} />
                          {activeTravelOption.estimatedCost === 0
                            ? 'Miễn phí'
                            : `~${activeTravelOption.estimatedCost.toLocaleString('vi-VN')}đ`}
                        </span>
                      </div>
                      <p className="mt-1.5 text-[10px] text-[#94B0B3]">
                        Phương tiện:{' '}
                        <span className="font-semibold text-[#E6D9B7]">
                          {MAP_MODE_META.find(m => m.mode === selectedMode)?.label}
                        </span>{' '}
                        · Thời gian &amp; chi phí ước tính.
                      </p>
                    </div>
                  ) : (
                    route && (
                      <>
                        <p className="mt-2.5 text-base font-bold text-[#2DD4BF]">
                          {route.distanceKm.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} km{' '}
                          <span className="text-[#E6D9B7]/40">·</span> khoảng {route.durationMinutes.toLocaleString('vi-VN')} phút
                        </p>
                        <p className="mt-1 text-[10px] text-[#94B0B3]">
                          Thời gian ước tính, chưa tính giao thông trực tiếp.
                        </p>
                      </>
                    )
                  )}

                  {routeError && (
                    <>
                      <p className="mt-2.5 text-xs text-[#F5B281]">{routeError}</p>
                      <button
                        type="button"
                        onClick={() => setRouteAttempt(value => value + 1)}
                        className="mt-1.5 text-xs font-bold text-[#E6D9B7] hover:underline cursor-pointer"
                      >
                        Thử lại chỉ đường
                      </button>
                    </>
                  )}

                  <div className="mt-3 pt-2.5 border-t border-[#E6D9B7]/14 flex flex-wrap items-center justify-between gap-2">
                    {!userPosition && (
                      <button
                        type="button"
                        onClick={locateUser}
                        disabled={isLocating}
                        className="text-[11px] font-semibold text-[#38BDF8] hover:underline disabled:opacity-50 cursor-pointer"
                      >
                        Dùng vị trí của tôi
                      </button>
                    )}
                    <a
                      href={googleMapsDirections([routeTarget.lat, routeTarget.lng], filterCenter)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#E6D9B7] hover:text-[#FFFDF5] hover:underline ml-auto"
                    >
                      <ExternalLink size={11} /> Mở Google Maps
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* POPUP REACT (RENDER ĐÈ LÊN LEAFLET) */}
            <AnimatePresence>
              {selectedLoc && (
                <MapPopup
                  key={selectedLoc.id}
                  loc={selectedLoc}
                  isChecked={checkedIds.has(selectedLoc.id)}
                  onClose={() => setSelectedId(null)}
                  onAddTrip={() => {
                    toggleCheck(selectedLoc.id);
                    setSelectedId(null);
                  }}
                  onNavigate={() => {
                    setRouteTarget(selectedLoc);
                    setRouteAttempt(value => value + 1);
                    setSelectedId(null);
                    setLayersOpen(false);
                  }}
                />
              )}
            </AnimatePresence>

            {/* LIST OVERLAY VIEW */}
            <AnimatePresence>
              {viewMode === 'list' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  data-lenis-prevent
                  className="absolute inset-0 z-[2000] bg-[#06151C]/96 backdrop-blur-2xl overflow-y-auto bando-sidebar-scroll p-5"
                >
                  <div className="max-w-2xl mx-auto pb-24">
                    <div className="flex items-center justify-between mb-5 mt-1 pb-3 border-b border-[#E6D9B7]/16">
                      <h2 className="cinematic-condensed uppercase text-xl font-bold text-[#FFFDF5] tracking-wide">
                        Danh sách địa điểm{' '}
                        <span className="font-mono text-[#E6D9B7]">({visibleLocations.length})</span>
                      </h2>
                      <button
                        type="button"
                        onClick={() => setViewMode('map')}
                        className="flex items-center gap-1.5 text-xs text-[#06151C] font-bold bg-[#E6D9B7] hover:bg-[#FFFDF5] px-4 py-2 rounded-full transition-colors cursor-pointer"
                      >
                        <MapIcon size={14} /> Trở về Bản đồ
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                      {visibleLocations.length === 0 && (
                        <p className="py-10 text-center text-sm text-[#94B0B3]">
                          {placesLoading
                            ? 'Đang tải địa điểm…'
                            : placesError
                              ? 'Chưa tải được danh sách địa điểm'
                              : 'Không có địa điểm phù hợp. Hãy mở rộng bán kính hoặc đổi bộ lọc.'}
                        </p>
                      )}
                      {visibleLocations.slice(0, 5).map((loc, i) => (
                        <LocationItem
                          key={loc.id}
                          loc={loc}
                          index={i}
                          isSelected={selectedId === loc.id}
                          isChecked={checkedIds.has(loc.id)}
                          onSelect={() => {
                            setSelectedId(loc.id);
                            setViewMode('map');
                          }}
                          onCheck={() => toggleCheck(loc.id)}
                        />
                      ))}

                      <AnimatePresence>
                        {showAllLocations && visibleLocations.length > 5 && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="grid grid-cols-1 gap-2.5 overflow-hidden"
                          >
                            {visibleLocations.slice(5).map((loc, i) => (
                              <LocationItem
                                key={loc.id}
                                loc={loc}
                                index={i + 5}
                                isSelected={selectedId === loc.id}
                                isChecked={checkedIds.has(loc.id)}
                                onSelect={() => {
                                  setSelectedId(loc.id);
                                  setViewMode('map');
                                }}
                                onCheck={() => toggleCheck(loc.id)}
                              />
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {visibleLocations.length > 5 && (
                        <button
                          type="button"
                          onClick={() => setShowAllLocations(!showAllLocations)}
                          className="w-full flex items-center justify-center gap-1.5 py-3 mt-1 text-xs font-semibold text-[#E6D9B7] hover:text-[#FFFDF5] bg-[#0B222E]/90 hover:bg-[#103040] rounded-xl transition-colors border border-[#E6D9B7]/20 cursor-pointer"
                        >
                          {showAllLocations ? (
                            <>Thu gọn <ChevronUp size={15} /></>
                          ) : (
                            <>Xem thêm {visibleLocations.length - 5} địa điểm khác <ChevronDown size={15} /></>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* MOBILE LIST BOTTOM BUTTON */}
            <div className="lg:hidden absolute bottom-6 left-4 z-20">
              <button
                type="button"
                onClick={() => setSheetOpen(true)}
                className="flex items-center gap-2 bg-[#06151C]/92 backdrop-blur-xl shadow-xl border border-[#E6D9B7]/35 text-[#FFFDF5] text-xs font-bold px-4 py-3 rounded-full hover:bg-[#0D2835] cursor-pointer"
              >
                <List size={15} className="text-[#E6D9B7]" /> Danh sách ({visibleLocations.length}) <ChevronUp size={15} className="text-[#E6D9B7]" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ═══ MOBILE BOTTOM SHEET (NOCTURNAL GLASS) ══════════════════════════ */}
      <AnimatePresence>
        {sheetOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-[#020A0F]/65 backdrop-blur-sm z-40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSheetOpen(false)}
            />
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-50 bg-[#071922] border-t border-[#E6D9B7]/28 rounded-t-3xl shadow-2xl lg:hidden max-h-[85vh] flex flex-col"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 40 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.3 }}
              onDragEnd={(_e, info: PanInfo) => {
                if (info.offset.y > 80) setSheetOpen(false);
              }}
            >
              <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
                <div className="w-10 h-1.5 bg-[#E6D9B7]/35 rounded-full" />
              </div>
              <div className="flex items-center justify-between px-5 pb-3 border-b border-[#E6D9B7]/14">
                <h3 className="font-bold text-[#FFFDF5] text-base">Khám phá địa điểm</h3>
                <button
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  aria-label="Đóng danh sách địa điểm"
                  className="bg-[#0B222E] border border-[#E6D9B7]/20 p-1.5 rounded-full text-[#CBD9DA] hover:text-[#FFFDF5]"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="px-5 py-4 bg-[#06151C]/75 border-b border-[#E6D9B7]/14">
                <div className="relative">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#E6D9B7]/75" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Tìm kiếm nhanh..."
                    className="w-full pl-9 pr-3 py-2.5 border border-[#E6D9B7]/22 rounded-xl text-sm text-[#FFFDF5] focus:outline-none focus:border-[#E6D9B7]/60 bg-[#0A202B] placeholder-[#94B0B3]/65"
                  />
                </div>
                <div className="mt-3 flex items-center gap-2" role="group" aria-label="Bán kính tìm kiếm">
                  <span className="text-xs text-[#CBD9DA]">Bán kính</span>
                  {([2, 5, 10] as const).map(value => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRadius(value)}
                      aria-pressed={radius === value}
                      className={`flex-1 rounded-lg py-2 text-xs font-bold transition-colors ${
                        radius === value
                          ? 'bg-[#E6D9B7] text-[#06151C]'
                          : 'border border-[#E6D9B7]/20 bg-[#0A202B] text-[#CBD9DA]'
                      }`}
                    >
                      {value} km
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[10px] text-[#94B0B3]">
                  Từ {userPosition ? 'vị trí của bạn' : 'tâm Đà Nẵng'} · Đường chim bay
                </p>
                <div className="mt-3 grid grid-cols-2 gap-1.5">
                  {(Object.keys(CATEGORY_META) as Category[]).map(cat => (
                    <AnimCheckbox
                      key={cat}
                      checked={catFilter[cat]}
                      onChange={() => toggleCat(cat)}
                      label={CATEGORY_META[cat].shortLabel}
                      dot={CATEGORY_META[cat].dot}
                      glow={CATEGORY_META[cat].glow}
                      count={categoryCounts[cat]}
                    />
                  ))}
                </div>
                <button type="button" onClick={resetFilters} className="mt-2 text-xs font-semibold text-[#E87B39]">
                  Đặt lại bộ lọc
                </button>
              </div>

              <div className="flex-1 overflow-y-auto bando-sidebar-scroll px-4 py-4 space-y-2">
                {visibleLocations.length === 0 && (
                  <p className="py-6 text-center text-sm text-[#94B0B3]">
                    {placesLoading
                      ? 'Đang tải địa điểm…'
                      : placesError
                        ? 'Chưa tải được danh sách địa điểm'
                        : 'Không có địa điểm phù hợp. Hãy mở rộng bán kính hoặc đổi bộ lọc.'}
                  </p>
                )}
                {visibleLocations.slice(0, 5).map((loc, i) => (
                  <LocationItem
                    key={loc.id}
                    loc={loc}
                    index={i}
                    isSelected={selectedId === loc.id}
                    isChecked={checkedIds.has(loc.id)}
                    onSelect={() => {
                      setSelectedId(loc.id);
                      setSheetOpen(false);
                    }}
                    onCheck={() => toggleCheck(loc.id)}
                  />
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
                        <LocationItem
                          key={loc.id}
                          loc={loc}
                          index={i + 5}
                          isSelected={selectedId === loc.id}
                          isChecked={checkedIds.has(loc.id)}
                          onSelect={() => {
                            setSelectedId(loc.id);
                            setSheetOpen(false);
                          }}
                          onCheck={() => toggleCheck(loc.id)}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {visibleLocations.length > 5 && (
                  <button
                    type="button"
                    onClick={() => setShowAllLocations(!showAllLocations)}
                    className="w-full flex items-center justify-center gap-1.5 py-3 mt-2 text-xs font-semibold text-[#E6D9B7] bg-[#0B222E] hover:bg-[#103040] rounded-xl border border-[#E6D9B7]/20"
                  >
                    {showAllLocations ? (
                      <>Thu gọn <ChevronUp size={15} /></>
                    ) : (
                      <>Xem thêm {visibleLocations.length - 5} địa điểm khác <ChevronDown size={15} /></>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══ FLOATING ITINERARY CTA ═════════════════════════════════════════ */}
      <AnimatePresence>
        {checkedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'backOut' }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[3000]"
          >
            <Link
              href="/lich-trinh/tao-moi"
              className="btn-ripple flex items-center gap-3 bg-[#E87B39] hover:bg-[#D96B29] text-[#FFFDF5] font-bold px-7 py-3.5 rounded-full shadow-[0_20px_50px_rgba(232,123,57,0.42)] transition-colors border border-[#FFFDF5]/25"
            >
              <Calendar size={18} className="text-[#FFFDF5]" />
              <span>
                Tạo lịch trình từ{' '}
                <motion.span
                  key={checkedIds.size}
                  initial={{ scale: 1.45, color: '#E6D9B7' }}
                  animate={{ scale: 1, color: '#FFFDF5' }}
                  transition={{ duration: 0.3 }}
                  className="font-black text-lg inline-block"
                >
                  {checkedIds.size}
                </motion.span>{' '}
                điểm
              </span>
              <ArrowRight size={16} className="ml-1 opacity-90" />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ SECTION: CẨM NANG DU LỊCH ĐÀ NẴNG (NOCTURNAL ILLUSTRATED ATLAS) ═══ */}
      <section className="w-full home-container pt-2 pb-16 relative z-10">
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="bando-console-glass rounded-[24px] border border-[#E6D9B7]/24 bg-[#071821]/84 p-6 sm:p-8 lg:p-10 shadow-[0_30px_76px_rgba(2,10,15,0.58)] relative overflow-hidden"
        >
          {/* Header section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8 pb-6 border-b border-[#E6D9B7]/16">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#0B222E]/90 border border-[#E6D9B7]/28 text-[#E6D9B7] text-[11px] font-bold px-3.5 py-1 rounded-full uppercase tracking-[0.18em] mb-3">
                <Sparkles size={12} className="text-[#E87B39]" />
                Cẩm nang du lịch Đà Nẵng
              </div>
              <h2 className="cinematic-condensed uppercase text-2xl sm:text-3xl lg:text-4xl font-bold text-[#FFFDF5] tracking-tight">
                Bản Đồ Chỉ Dẫn Du Lịch &amp;{' '}
                <span className="home-serif italic font-normal normal-case text-[#E6D9B7]">
                  Điểm Đến Nổi Bật
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-[#CBD9DA]/82 font-normal mt-2 max-w-2xl leading-relaxed">
                Khám phá tổng quan vị trí 6 danh thắng biểu tượng, bãi biển quyến rũ và ẩm thực đặc sản Đà Nẵng. Nhấn vào từng tọa độ để định vị ngay trên bản đồ tương tác phía trên.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                href="/lich-trinh/tao-moi"
                className="inline-flex items-center gap-2 bg-[#E87B39] hover:bg-[#D96B29] text-[#FFFDF5] text-xs sm:text-sm font-semibold px-4.5 py-2.5 rounded-full shadow-[0_12px_28px_rgba(232,123,57,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Calendar size={15} />
                <span>Lên lịch trình tự động</span>
              </Link>
              <Link
                href="/diemdulich"
                className="inline-flex items-center gap-1.5 bg-[#0B222E]/90 hover:bg-[#103040] border border-[#E6D9B7]/28 text-[#E6D9B7] hover:text-[#FFFDF5] text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-full transition-all"
              >
                <span>Xem danh thắng</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Grid 2 cột: Trái là Ảnh minh họa giữ trọn tỷ lệ 576:1024, Phải là Danh sách chỉ dẫn tương tác */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* Cột trái: Archival Illustrated Map Frame */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="relative w-full max-w-[420px] rounded-2xl overflow-hidden bg-gradient-to-b from-[#0E2A36] via-[#091F29] to-[#06151C] p-3.5 border border-[#E6D9B7]/30 shadow-[0_24px_56px_rgba(2,10,15,0.62)] group">
                <div className="relative w-full aspect-[576/1024] rounded-xl overflow-hidden bg-[#F8F8F4] shadow-inner">
                  <Image
                    src={TRAVEL_MAP_ILLUSTRATION}
                    alt="Da Nang Travel Map — Cẩm nang du lịch Đà Nẵng minh họa trực quan"
                    fill
                    sizes="(max-width: 768px) 100vw, 420px"
                    className="object-contain transition-transform duration-500 group-hover:scale-[1.015]"
                    priority={false}
                  />
                </div>
                <div className="pt-3.5 pb-1 text-center">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#E6D9B7]">
                    DA NANG TRAVEL MAP — RECIPE, TRAVEL &amp; ASIA
                  </p>
                  <p className="text-[11px] text-[#94B0B3] font-medium mt-1">
                    Ảnh minh họa độc quyền các điểm đến &amp; ẩm thực Đà Nẵng
                  </p>
                </div>
              </div>
            </div>

            {/* Cột phải: 6 Tọa độ biểu tượng tương tác & Ẩm thực đặc sản */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {/* Khối 1: 6 Danh thắng biểu tượng */}
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <h3 className="text-xs font-bold text-[#E6D9B7] uppercase tracking-[0.18em] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#2DD4BF] shadow-[0_0_8px_rgba(45,212,191,0.8)]" />
                    6 Tọa Độ Biểu Tượng Trên Bản Đồ
                  </h3>
                  <span className="hidden sm:inline text-[11px] text-[#94B0B3]">
                    Nhấn thẻ để ghim trên bản đồ live
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ICONIC_LANDMARKS.map(place => (
                    <button
                      key={place.no}
                      type="button"
                      onClick={() => focusLandmarkOrQuery(place.query)}
                      className="group text-left flex items-start gap-3 p-4 rounded-2xl bg-[#0A202B]/80 border border-[#E6D9B7]/16 hover:bg-[#0E2B39]/95 hover:border-[#E6D9B7]/45 hover:shadow-[0_14px_34px_rgba(2,10,15,0.45)] transition-all duration-200 cursor-pointer"
                    >
                      <span className="w-7 h-7 rounded-xl bg-[#E6D9B7]/16 border border-[#E6D9B7]/35 text-[#E6D9B7] group-hover:bg-[#E87B39] group-hover:border-[#E87B39] group-hover:text-[#FFFDF5] flex items-center justify-center text-xs font-mono font-bold shrink-0 transition-colors">
                        0{place.no}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-[#FFFDF5] group-hover:text-[#E6D9B7] truncate transition-colors">
                            {place.name}
                          </h4>
                          <MapPin size={12} className="text-[#2DD4BF] opacity-60 group-hover:opacity-100 shrink-0 transition-opacity" />
                        </div>
                        <p className="text-[11px] text-[#CBD9DA]/78 font-normal leading-relaxed mt-1.5">
                          {place.desc}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Khối 2: Ẩm thực đặc sản gợi ý */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-[#1A1A14]/85 via-[#162328]/85 to-[#0B222E]/85 border border-[#E6D9B7]/22">
                <h3 className="text-xs font-bold text-[#E6D9B7] uppercase tracking-[0.18em] mb-2 flex items-center gap-2">
                  <span>🍜</span> Món Ngon Nhất Định Phải Thử (Must-Try Food)
                </h3>
                <p className="text-xs text-[#CBD9DA]/78 font-normal mb-3.5">
                  Ẩm thực đậm đà phong vị miền Trung được thể hiện sinh động ở chân bản đồ — nhấn món để tìm quán trên bản đồ:
                </p>
                <div className="flex flex-wrap gap-2">
                  {MUST_TRY_FOODS.map(food => (
                    <button
                      key={food.name}
                      type="button"
                      onClick={() => focusLandmarkOrQuery(food.query)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#071922]/90 border border-[#E6D9B7]/24 text-xs font-semibold text-[#FFFDF5] hover:border-[#E87B39]/65 hover:text-[#E6D9B7] hover:bg-[#0D2734] transition-all cursor-pointer"
                    >
                      <span>{food.icon}</span>
                      <span>{food.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Khối 3: Mẹo di chuyển */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#09212C]/88 border border-[#2DD4BF]/24">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#2DD4BF]/14 border border-[#2DD4BF]/30 text-[#2DD4BF] flex items-center justify-center shrink-0">
                    <Navigation size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#FFFDF5]">Mẹo di chuyển thuận tiện</h4>
                    <p className="text-[11px] sm:text-xs text-[#CBD9DA]/78 font-normal mt-0.5 leading-relaxed">
                      Thuê xe máy khám phá đèo &amp; bán đảo, dùng Grab/Taxi trong phố, dạo bộ ngắm cầu sông Hàn.
                    </p>
                  </div>
                </div>
                <Link
                  href="/amthuc"
                  className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-[#E6D9B7] hover:text-[#FFFDF5] hover:underline"
                >
                  <span>Khám phá ẩm thực</span>
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
