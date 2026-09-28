'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  motion, AnimatePresence, LayoutGroup, useMotionValue, PanInfo,
} from 'framer-motion';
import {
  ChevronRight, Search, X, RefreshCw, MapPin, Star,
  Navigation, Calendar, Map as MapIcon, List, Layers, Plus, Minus,
  LocateFixed, ChevronUp, Sun, Bike, Car, Bus, Footprints,
  ArrowRight, ChevronDown,
} from 'lucide-react';
import { useNavbarHero } from '@/contexts/NavbarHeroContext';
import Footer from '@/components/Footer';
import AnimatedCounter from '@/components/AnimatedCounter';
import MapWrapper from '@/components/MapWrapper';

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────
type Category = 'luutru' | 'amthuc' | 'diemdulich' | 'cafe';

interface MapLocation {
  id: number;
  name: string;
  category: Category;
  rating: number;
  reviews: number;
  address: string;
  distance: string; // from center
  img: string;
  lat: number;
  lng: number;
  travel: { walk: string; bike: string; car: string; bus: string; bikeNote?: string };
}

const LOCATIONS: MapLocation[] = [
  { id:1,  name:'Bãi biển Mỹ Khê',             category:'diemdulich', rating:4.9, reviews:8420, address:'Võ Nguyên Giáp, Sơn Trà', distance:'3.2 km',  img:'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=400&q=75', lat: 16.060, lng: 108.245, travel:{ walk:'38 phút', bike:'11 phút', car:'8 phút',  bus:'18 phút', bikeNote:'Cung đường ven biển tuyệt đẹp' } },
  { id:2,  name:'Novotel Sông Hàn',             category:'luutru',     rating:4.7, reviews:2103, address:'36 Bạch Đằng, Hải Châu',  distance:'0.5 km',  img:'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=75', lat: 16.075, lng: 108.223, travel:{ walk:'6 phút',  bike:'2 phút',  car:'3 phút',  bus:'5 phút'  } },
  { id:3,  name:'Mì Quảng Bà Vị',               category:'amthuc',     rating:4.9, reviews:2156, address:'Hải Châu, Đà Nẵng',       distance:'1.1 km',  img:'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&q=75', lat: 16.065, lng: 108.210, travel:{ walk:'13 phút', bike:'4 phút',  car:'4 phút',  bus:'7 phút'  } },
  { id:4,  name:'Chùa Linh Ứng Sơn Trà',        category:'diemdulich', rating:4.9, reviews:9841, address:'Bán đảo Sơn Trà',          distance:'7.8 km',  img:'https://images.unsplash.com/photo-1546587348-d12660c30c50?w=400&q=75', lat: 16.100, lng: 108.277, travel:{ walk:'94 phút', bike:'28 phút', car:'18 phút', bus:'Không khuyến nghị', bikeNote:'Đường đèo leo núi, cảnh đẹp' } },
  { id:5,  name:'Cà Phê Sân Thượng Việt Ơi',    category:'cafe',       rating:4.7, reviews:1876, address:'Hải Châu, Đà Nẵng',       distance:'0.8 km',  img:'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=75', lat: 16.068, lng: 108.220, travel:{ walk:'10 phút', bike:'3 phút',  car:'3 phút',  bus:'6 phút'  } },
  { id:6,  name:'InterContinental Sun Peninsula',category:'luutru',     rating:4.8, reviews:1893, address:'Sơn Trà, Đà Nẵng',        distance:'8.5 km',  img:'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&q=75', lat: 16.120, lng: 108.300, travel:{ walk:'102 phút',bike:'30 phút', car:'20 phút', bus:'Không khuyến nghị' } },
  { id:7,  name:'Cầu Rồng',                      category:'diemdulich', rating:4.8, reviews:7234, address:'Hải Châu, Đà Nẵng',       distance:'0.3 km',  img:'https://images.unsplash.com/photo-1559493442-0eaaba8bb6ce?w=400&q=75', lat: 16.061, lng: 108.227, travel:{ walk:'4 phút',  bike:'1 phút',  car:'2 phút',  bus:'4 phút'  } },
  { id:8,  name:'Hải Sản Tươi Sống Mỹ Khê',     category:'amthuc',     rating:4.6, reviews:987,  address:'Ngũ Hành Sơn',            distance:'5.6 km',  img:'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=75', lat: 16.040, lng: 108.250, travel:{ walk:'67 phút', bike:'20 phút', car:'13 phút', bus:'22 phút' } },
  { id:9,  name:'Ngũ Hành Sơn',                  category:'diemdulich', rating:4.7, reviews:5102, address:'Ngũ Hành Sơn, Đà Nẵng',   distance:'8.2 km',  img:'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=75', lat: 16.002, lng: 108.263, travel:{ walk:'98 phút', bike:'29 phút', car:'19 phút', bus:'30 phút' } },
  { id:10, name:'Fusion Maia Resort',             category:'luutru',     rating:4.9, reviews:2341, address:'Khu vực Biển Mỹ Khê',     distance:'4.1 km',  img:'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&q=75', lat: 16.035, lng: 108.255, travel:{ walk:'49 phút', bike:'14 phút', car:'10 phút', bus:'20 phút' } },
  { id:11, name:'Cà phê Trứng Phố Cổ',           category:'cafe',       rating:4.8, reviews:2134, address:'Hải Châu, Đà Nẵng',       distance:'1.4 km',  img:'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=75', lat: 16.070, lng: 108.222, travel:{ walk:'17 phút', bike:'5 phút',  car:'4 phút',  bus:'8 phút'  } },
  { id:12, name:'Bánh Tráng Cuốn Thịt Heo',      category:'amthuc',     rating:4.8, reviews:1893, address:'Sơn Trà, Đà Nẵng',        distance:'2.7 km',  img:'https://images.unsplash.com/photo-1561189386-42f49bcc29ef?w=400&q=75', lat: 16.060, lng: 108.240, travel:{ walk:'32 phút', bike:'9 phút',  car:'7 phút',  bus:'14 phút' } },
];

const CATEGORY_META: Record<Category, { label: string; dot: string; count: number; bg: string }> = {
  luutru:     { label: 'Lưu trú & Khách sạn',        dot: 'bg-blue-500',   count: 128, bg: 'bg-blue-500' },
  amthuc:     { label: 'Ẩm thực & Quán ngon',        dot: 'bg-orange-500', count: 96,  bg: 'bg-orange-500' },
  diemdulich: { label: 'Điểm du lịch & Danh thắng',  dot: 'bg-green-500',  count: 64,  bg: 'bg-green-500' },
  cafe:       { label: 'Quán cafe & Bar view biển',   dot: 'bg-pink-500',   count: 42,  bg: 'bg-pink-500' },
};

const BLUR = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATED CHECKBOX
// ─────────────────────────────────────────────────────────────────────────────
function AnimCheckbox({ checked, onChange, label, dot, count }: { checked: boolean; onChange: () => void; label: string; dot: string; count: number; }) {
  return (
    <button onClick={onChange} className="flex items-center gap-2.5 group w-full text-left py-1" type="button">
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
function MapPopup({ loc, onClose, onAddTrip }: { loc: MapLocation; onClose: () => void; onAddTrip: () => void; }) {
  const travelRows = [
    { icon: Footprints, label: 'Đi bộ',  time: loc.travel.walk,  note: loc.travel.bikeNote ?? null,   warn: loc.travel.walk.includes('Không') },
    { icon: Bike,       label: 'Xe máy', time: loc.travel.bike,  note: loc.travel.bikeNote ?? null,   warn: false },
    { icon: Car,        label: 'Ô tô',   time: loc.travel.car,   note: null,                          warn: false },
    { icon: Bus,        label: 'Xe buýt',time: loc.travel.bus,   note: null,                          warn: loc.travel.bus.includes('Không') },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 24, scale: 0.95 }} animate={{ opacity: 1, y: 0,  scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.95 }} transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }} className="absolute bottom-4 left-4 sm:left-auto sm:right-20 z-[1000] w-[calc(100%-2rem)] sm:w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
      <div className="relative h-28 overflow-hidden">
        <Image src={loc.img} alt={loc.name} fill className="object-cover" sizes="288px" placeholder="blur" blurDataURL={BLUR} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <button onClick={onClose} className="absolute top-2 right-2 w-6 h-6 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors z-10"><X size={12} className="text-gray-700" /></button>
        <div className="absolute bottom-2 left-3">
          <span className={`text-white text-[10px] font-bold px-2 py-0.5 rounded-full ${CATEGORY_META[loc.category].bg}`}>{CATEGORY_META[loc.category].label.split('&')[0].trim()}</span>
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-bold text-[#0f2942] text-sm leading-snug mb-0.5">{loc.name}</h3>
        <div className="flex items-center gap-1 mb-1">
          <Star size={11} className="fill-yellow-400 text-yellow-400" />
          <span className="text-xs font-semibold text-gray-700">{loc.rating}</span>
          <span className="text-[10px] text-gray-400">({loc.reviews.toLocaleString('vi-VN')})</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-gray-400 mb-3"><MapPin size={10} /><span className="truncate">{loc.address}</span></div>
        <div className="space-y-1 mb-3">
          {travelRows.map((row, i) => (
            <motion.div key={row.label} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.07, duration: 0.25 }} className="flex items-center gap-2 text-[11px]">
              <row.icon size={12} className="text-gray-400 flex-shrink-0" />
              <span className="text-gray-600 w-14">{row.label}</span>
              <span className={`font-semibold ${row.warn ? 'text-red-400' : 'text-[#0f2942]'}`}>{row.time}</span>
              {row.note && !row.warn && <span className="text-[10px] text-green-600 italic truncate">{row.note}</span>}
            </motion.div>
          ))}
        </div>
        <div className="flex gap-2">
          <a href="#" onClick={e => e.preventDefault()} className="group flex-1 flex items-center justify-center gap-1.5 bg-[#0f2942] hover:bg-[#1a3f5c] text-white text-[11px] font-bold px-3 py-2 rounded-xl transition-colors"><Navigation size={11} /> Bắt đầu<ArrowRight size={11} className="transition-transform duration-200 group-hover:translate-x-0.5" /></a>
          <button onClick={onAddTrip} className="flex items-center justify-center gap-1 border border-gray-200 text-[#0f2942] hover:border-teal-400 hover:text-teal-600 text-[11px] font-medium px-2.5 py-2 rounded-xl transition-colors"><Calendar size={11} /></button>
        </div>
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
      <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0"><Image src={loc.img} alt={loc.name} fill className="object-cover" sizes="48px" placeholder="blur" blurDataURL={BLUR} /></div>
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
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<Record<Category, boolean>>({ luutru: true, amthuc: true, diemdulich: true, cafe: true });
  const [radius, setRadius] = useState<2 | 5 | 10>(5);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [nearOpen, setNearOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showAllLocations, setShowAllLocations] = useState(false);

  // NavbarHeroContext - luôn giữ navbar background trắng
  const { setHeroRef } = useNavbarHero();
  useEffect(() => { setHeroRef(null); }, [setHeroRef]);

  const selectedLoc = LOCATIONS.find(l => l.id === selectedId) ?? null;
  const visibleLocations = LOCATIONS.filter(loc => {
    if (!catFilter[loc.category]) return false;
    if (search && !loc.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

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
              <h1 className="text-2xl sm:text-3xl font-bold text-[#0f2942]">Bản đồ du lịch tương tác Đà Nẵng</h1>
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
                16.0544°N, 108.2022°E
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="flex flex-wrap gap-x-6 gap-y-2 mt-5">
            {[ { cat: 'luutru', dot: 'bg-blue-500' }, { cat: 'amthuc', dot: 'bg-orange-500' }, { cat: 'diemdulich', dot: 'bg-green-500' }, { cat: 'cafe', dot: 'bg-pink-500' } ].map(({ cat, dot }) => (
              <div key={cat} className="flex items-center gap-1.5 text-sm text-gray-600 font-medium">
                <span className={`w-2 h-2 rounded-full ${dot}`} />
                <AnimatedCounter to={CATEGORY_META[cat as Category].count} className="font-bold text-[#0f2942]" />
                <span className="text-xs">{CATEGORY_META[cat as Category].label.split('&')[0].trim()}</span>
              </div>
            ))}
          </motion.div>
        </div>
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
                    <AnimCheckbox key={cat} checked={catFilter[cat]} onChange={() => toggleCat(cat)} label={CATEGORY_META[cat].label} dot={CATEGORY_META[cat].dot} count={CATEGORY_META[cat].count} />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3">Bán kính trung tâm</p>
                <LayoutGroup id="radius">
                  <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                    {([2, 5, 10] as const).map(r => (
                      <button key={r} onClick={() => setRadius(r)} className={`relative flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${radius === r ? 'text-[#0f2942]' : 'text-gray-500 hover:text-gray-700'}`}>
                        {radius === r && (
                          <motion.span layoutId="radius-bg" className="absolute inset-0 rounded-lg bg-white shadow-sm" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />
                        )}
                        <span className="relative z-10">{r} km</span>
                      </button>
                    ))}
                  </div>
                </LayoutGroup>
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
                
                {visibleLocations.length === 0 && <p className="text-xs text-gray-400 text-center py-6">Không tìm thấy địa điểm</p>}
              </div>
            </div>
          </aside>

          {/* ── MAP AREA ── */}
          <div className="flex-1 relative overflow-hidden bg-[#e8f4fd] z-0 isolate" style={{ transform: 'translateZ(0)', maskImage: '-webkit-radial-gradient(white, black)' }}>
            
            {/* THƯ VIỆN BẢN ĐỒ THẬT (Leaflet) */}
            <div className="absolute inset-0 z-0">
              <MapWrapper 
                locations={visibleLocations} 
                selectedId={selectedId} 
                onSelect={(id: number) => setSelectedId(id)}
                zoomLevel={zoomLevel}
                radius={radius}
              />
            </div>

            {/* Vòng tròn bán kính ảo (minh hoạ center, nếu dùng Leaflet center cứng) */}
            <motion.div key={radius} className="absolute rounded-full border-2 border-teal-400/50 bg-teal-400/10 z-10 pointer-events-none" style={{ top: '50%', left: '50%', width: radius * 38, height: radius * 38, x: -(radius * 19), y: -(radius * 19) }} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4, ease: 'easeOut' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
              <div className="w-4 h-4 rounded-full bg-[#0f2942] border-2 border-white shadow-lg" />
              <div className="absolute inset-0 rounded-full bg-[#0f2942] animate-ping opacity-25" />
            </div>

            {/* OVERLAYS UI */}
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="absolute top-4 left-4 flex flex-wrap gap-2 z-20 pointer-events-none">
              {['Gần biển', 'Đang mở cửa', 'Miễn phí'].map(pill => (
                <button key={pill} onClick={() => setNearOpen(!nearOpen)} className="pointer-events-auto backdrop-blur-md bg-white/85 border border-white/60 text-[#0f2942] text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm hover:bg-white transition-colors">
                  {pill}
                </button>
              ))}
            </motion.div>

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
              {[{ icon: Plus, title: 'Phóng to', action: () => setZoomLevel(z => Math.min(z + 0.25, 2)) }, { icon: Minus, title: 'Thu nhỏ', action: () => setZoomLevel(z => Math.max(z - 0.25, 0.5)) }, { icon: LocateFixed, title: 'Vị trí tôi', action: () => {} }, { icon: Layers, title: 'Lớp bản đồ', action: () => {} }].map(btn => (
                <button key={btn.title} onClick={btn.action} title={btn.title} className="w-10 h-10 bg-white/95 backdrop-blur-md rounded-xl shadow-md border border-gray-100 flex items-center justify-center text-gray-600 hover:text-[#0f2942] hover:scale-105 active:scale-95 transition-all">
                  <btn.icon size={16} />
                </button>
              ))}
            </div>

            {/* POPUP REACT (RENDER ĐÈ LÊN LEAFLET) */}
            <AnimatePresence>
              {selectedLoc && <MapPopup key={selectedLoc.id} loc={selectedLoc} onClose={() => setSelectedId(null)} onAddTrip={() => { toggleCheck(selectedLoc.id); setSelectedId(null); }} />}
            </AnimatePresence>

            {/* MOBILE LIST OVERLAY */}
            <AnimatePresence>
              {viewMode === 'list' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="absolute inset-0 z-[2000] bg-white overflow-y-auto p-4 lg:hidden">
                  <div className="max-w-2xl mx-auto pb-24">
                    <div className="flex items-center justify-between mb-4 mt-2">
                      <h2 className="font-bold text-[#0f2942] text-lg">Địa điểm ({visibleLocations.length})</h2>
                      <button onClick={() => setViewMode('map')} className="flex items-center gap-1.5 text-sm text-teal-600 font-bold bg-teal-50 px-3 py-1.5 rounded-full">
                        <MapIcon size={14} /> Trở về Bản đồ
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
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
                <h3 className="font-bold text-[#0f2942] text-lg">Khám phá địa điểm</h3>
                <button onClick={() => setSheetOpen(false)} className="bg-gray-100 p-1.5 rounded-full text-gray-500 hover:text-gray-800"><X size={16} /></button>
              </div>
              <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
                <div className="relative shadow-sm rounded-xl"><Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kiếm nhanh..." className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white" /></div>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
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
