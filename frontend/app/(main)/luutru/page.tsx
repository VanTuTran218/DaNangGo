'use client';

import Image from 'next/image';
import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useTransform, LayoutGroup } from 'framer-motion';
import {
  ChevronRight,
  ChevronLeft,
  Sparkles,
  CheckCircle,
  MapPin,
  Star,
  ArrowUpDown,
  Wallet,
  Shield,
  Clock,
  Headphones,
  Award,
  Calendar,
} from 'lucide-react';
import Reveal from '@/components/ui/Reveal';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import HotelCard, { HotelData } from '@/components/places/HotelCard';
import SkeletonCard from '@/components/ui/SkeletonCard';
import PriceRangeSlider from '@/components/ui/PriceRangeSlider';



// ── DATA: 24 khách sạn để có phân trang thực (4 trang × 6 card) ───────────────
const HOTELS: HotelData[] = [
  // Page 1
  { id:1,  name:'Fusion Maia Da Nang Resort', category:'KHU NGHỈ DƯỠNG 5 SAO', badgeColor:'bg-purple-600', badgePulse:false, location:'Khu vực Biển Mỹ Khê', rating:4.9, reviews:2341, pricePerNight:3200000, originalPrice:4500000, img:'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&q=80', amenities:['Hồ bơi vô cực & Spa','Giáp biển Mỹ Khê','Bao gồm bữa sáng'], amenityIcon:'🏊', tags:['Hồ bơi vô cực','Spa cao cấp','Trực tiếp biển'], isLiked:false },
  { id:2,  name:'InterContinental Da Nang Sun Peninsula', category:'ĐƯỢC YÊU THÍCH', badgeColor:'bg-red-500', badgePulse:true, location:'Sơn Trà, Đà Nẵng', rating:4.8, reviews:1893, pricePerNight:5800000, originalPrice:7200000, img:'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&q=80', amenities:['Tầm nhìn biển toàn cảnh','Nhà hàng 5 sao','Infinity pool'], amenityIcon:'🌊', tags:['View biển','Ẩm thực','Hồ bơi'], isLiked:false },
  { id:3,  name:'Novotel Da Nang Premier Han River', category:'KHÁCH SẠN 4 SAO', badgeColor:'bg-blue-500', badgePulse:false, location:'Trung tâm Đà Nẵng', rating:4.6, reviews:3102, pricePerNight:1850000, originalPrice:2400000, img:'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80', amenities:['View sông Hàn','Hồ bơi ngoài trời','Trung tâm thành phố'], amenityIcon:'🏙️', tags:['View sông Hàn','Trung tâm','Hồ bơi'], isLiked:false },
  { id:4,  name:'Ohana Beach Hotel Da Nang', category:'TOP VIEW BIỂN', badgeColor:'bg-teal-500', badgePulse:false, location:'Phạm Văn Đồng, Mỹ Khê', rating:4.7, reviews:1204, pricePerNight:980000, originalPrice:1300000, img:'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80', amenities:['Ngay mặt biển Mỹ Khê','Rooftop bar','Wifi tốc độ cao'], amenityIcon:'🏖️', tags:['Mặt biển','Rooftop','Giá tốt'], isLiked:false },
  { id:5,  name:'The Anam Da Nang', category:'ƯU ĐÃI HỜI', badgeColor:'bg-orange-500', badgePulse:true, location:'Bãi biển Non Nước', rating:4.5, reviews:876, pricePerNight:2100000, originalPrice:3500000, img:'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=600&q=80', amenities:['Biển Non Nước riêng tư','Spa Việt Nam','Bao gồm bữa trưa'], amenityIcon:'🌴', tags:['Bãi riêng','Spa','Ưu đãi'], isLiked:false },
  { id:6,  name:'The Lena House Boutique', category:'BOUTIQUE HOMESTAY', badgeColor:'bg-pink-500', badgePulse:false, location:'Hải Châu, Đà Nẵng', rating:4.8, reviews:567, pricePerNight:450000, originalPrice:600000, img:'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80', amenities:['Phong cách vintage','Bếp chung','Gần chợ Hàn'], amenityIcon:'🏡', tags:['Boutique','Cozy','Giá rẻ'], isLiked:false },
  // Page 2
  { id:7,  name:'Hyatt Regency Da Nang Resort', category:'KHU NGHỈ DƯỠNG 5 SAO', badgeColor:'bg-purple-600', badgePulse:false, location:'Khu vực Biển Mỹ Khê', rating:4.7, reviews:1650, pricePerNight:4100000, originalPrice:5500000, img:'https://images.unsplash.com/photo-1540541338537-1220059b8aed?w=600&q=80', amenities:['4 hồ bơi','Bãi biển riêng','Spa cao cấp'], amenityIcon:'🏊', tags:['Hồ bơi vô cực','Trực tiếp biển','Spa cao cấp'], isLiked:false },
  { id:8,  name:'Sheraton Grand Da Nang Resort', category:'KHÁCH SẠN 5 SAO', badgeColor:'bg-purple-700', badgePulse:false, location:'Khu vực Biển Mỹ Khê', rating:4.8, reviews:2089, pricePerNight:3600000, originalPrice:4800000, img:'https://images.unsplash.com/photo-1551882547-ff40c4a49ce5?w=600&q=80', amenities:['View biển trực tiếp','Nhà hàng Nhật Bản','Fitness center'], amenityIcon:'🌊', tags:['View biển','Ẩm thực','Hồ bơi'], isLiked:false },
  { id:9,  name:'Cocobay Da Nang', category:'ĐƯỢC YÊU THÍCH', badgeColor:'bg-red-500', badgePulse:true, location:'Ngũ Hành Sơn, Đà Nẵng', rating:4.6, reviews:943, pricePerNight:1200000, originalPrice:1800000, img:'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&q=80', amenities:['Khu phức hợp giải trí','Beach club','Water park'], amenityIcon:'🎡', tags:['Giải trí','Ưu đãi','Hồ bơi'], isLiked:false },
  { id:10, name:'Muong Thanh Luxury Da Nang Hotel', category:'KHÁCH SẠN 4 SAO', badgeColor:'bg-blue-500', badgePulse:false, location:'Trung tâm Đà Nẵng', rating:4.5, reviews:2210, pricePerNight:890000, originalPrice:1200000, img:'https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=600&q=80', amenities:['Hồ bơi tầng cao','Nhà hàng buffet','Gần biển Mỹ Khê'], amenityIcon:'🏙️', tags:['Trung tâm','Giá tốt','Hồ bơi'], isLiked:false },
  { id:11, name:'Azura Da Nang', category:'TOP VIEW BIỂN', badgeColor:'bg-teal-500', badgePulse:false, location:'Phạm Văn Đồng, Mỹ Khê', rating:4.6, reviews:780, pricePerNight:1100000, originalPrice:1500000, img:'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=600&q=80', amenities:['Rooftop infinity pool','View biển Mỹ Khê','Bar tầng thượng'], amenityIcon:'🏖️', tags:['Rooftop','Mặt biển','Hồ bơi'], isLiked:false },
  { id:12, name:'Faifo Hoi An - Da Nang Gateway', category:'BOUTIQUE HOMESTAY', badgeColor:'bg-pink-500', badgePulse:false, location:'Hải Châu, Đà Nẵng', rating:4.7, reviews:432, pricePerNight:550000, originalPrice:750000, img:'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600&q=80', amenities:['Phong cách Hội An','Rooftop garden','Breakfast included'], amenityIcon:'🏡', tags:['Boutique','Cozy','Bao gồm bữa sáng'], isLiked:false },
  // Page 3
  { id:13, name:'Premier Village Da Nang Resort', category:'KHU NGHỈ DƯỠNG 5 SAO', badgeColor:'bg-purple-600', badgePulse:false, location:'Sơn Trà, Đà Nẵng', rating:4.9, reviews:1102, pricePerNight:6200000, originalPrice:8000000, img:'https://images.unsplash.com/photo-1527786356703-4b100091cd2c?w=600&q=80', amenities:['Villa riêng có hồ bơi','Bờ biển riêng','Butler service'], amenityIcon:'🏝️', tags:['Hồ bơi vô cực','Bãi riêng','Spa cao cấp'], isLiked:false },
  { id:14, name:'Almanity Hoi An Wellness Resort', category:'ƯU ĐÃI HỜI', badgeColor:'bg-orange-500', badgePulse:true, location:'Non Nước, Đà Nẵng', rating:4.6, reviews:698, pricePerNight:1750000, originalPrice:2800000, img:'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&q=80', amenities:['Wellness & Detox','Yoga hàng ngày','Hồ bơi muối khoáng'], amenityIcon:'🧘', tags:['Spa','Ưu đãi','Bao gồm bữa sáng'], isLiked:false },
  { id:15, name:'Grand Mercure Da Nang', category:'KHÁCH SẠN 4 SAO', badgeColor:'bg-blue-500', badgePulse:false, location:'Trung tâm Đà Nẵng', rating:4.5, reviews:1876, pricePerNight:1350000, originalPrice:1800000, img:'https://images.unsplash.com/photo-1549294413-26f195200c16?w=600&q=80', amenities:['View sông Hàn & biển','Buffet sáng 5 sao','Club Lounge độc quyền'], amenityIcon:'🏙️', tags:['View sông Hàn','Trung tâm','Ẩm thực'], isLiked:false },
  { id:16, name:'Brilliant Hotel Da Nang', category:'ĐƯỢC YÊU THÍCH', badgeColor:'bg-red-500', badgePulse:true, location:'Trung tâm Đà Nẵng', rating:4.6, reviews:2034, pricePerNight:750000, originalPrice:1050000, img:'https://images.unsplash.com/photo-1445991842772-097fea258e7b?w=600&q=80', amenities:['Rooftop bar sầm uất','View sông Hàn','Gần cầu Rồng'], amenityIcon:'🌉', tags:['Rooftop','Trung tâm','Giá tốt'], isLiked:false },
  { id:17, name:'Sandy Beach Non Nuoc Resort', category:'TOP VIEW BIỂN', badgeColor:'bg-teal-500', badgePulse:false, location:'Non Nước, Đà Nẵng', rating:4.4, reviews:1123, pricePerNight:1600000, originalPrice:2200000, img:'https://images.unsplash.com/photo-1535498730771-e735b998cd64?w=600&q=80', amenities:['Bãi biển Non Nước','Beach volleyball','Hải sản tươi sống'], amenityIcon:'🏖️', tags:['Mặt biển','Bãi riêng','Ẩm thực'], isLiked:false },
  { id:18, name:'Memority Hotel Da Nang', category:'BOUTIQUE HOMESTAY', badgeColor:'bg-pink-500', badgePulse:false, location:'Hải Châu, Đà Nẵng', rating:4.8, reviews:312, pricePerNight:380000, originalPrice:520000, img:'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=600&q=80', amenities:['Decor nghệ thuật độc đáo','Cafe sân thượng','Vị trí trung tâm'], amenityIcon:'🎨', tags:['Boutique','Cozy','Giá rẻ'], isLiked:false },
  // Page 4
  { id:19, name:'TMS Hotel Da Nang Beach', category:'TOP VIEW BIỂN', badgeColor:'bg-teal-500', badgePulse:false, location:'Khu vực Biển Mỹ Khê', rating:4.7, reviews:1567, pricePerNight:1450000, originalPrice:2000000, img:'https://images.unsplash.com/photo-1561501900-3701fa6a0864?w=600&q=80', amenities:['Ngay biển Mỹ Khê','Hồ bơi nước mặn','Nhà hàng hải sản'], amenityIcon:'🏖️', tags:['Mặt biển','Hồ bơi','Ẩm thực'], isLiked:false },
  { id:20, name:'A La Carte Da Nang Beach Hotel', category:'ĐƯỢC YÊU THÍCH', badgeColor:'bg-red-500', badgePulse:true, location:'Khu vực Biển Mỹ Khê', rating:4.6, reviews:2198, pricePerNight:1250000, originalPrice:1700000, img:'https://images.unsplash.com/photo-1506059612708-99d6128a0101?w=600&q=80', amenities:['Phòng có bếp riêng','Rooftop pool','Dịch vụ tự nấu ăn'], amenityIcon:'🍳', tags:['Rooftop','Mặt biển','Hồ bơi'], isLiked:false },
  { id:21, name:'Green World Hotel Da Nang', category:'KHÁCH SẠN 4 SAO', badgeColor:'bg-blue-500', badgePulse:false, location:'Sơn Trà, Đà Nẵng', rating:4.5, reviews:934, pricePerNight:820000, originalPrice:1100000, img:'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=600&q=80', amenities:['View bán đảo Sơn Trà','Gym & Yoga center','Bao gồm bữa sáng'], amenityIcon:'🌿', tags:['Spa','Bao gồm bữa sáng','View biển'], isLiked:false },
  { id:22, name:'Palmy Hotel & Spa Da Nang', category:'ƯU ĐÃI HỜI', badgeColor:'bg-orange-500', badgePulse:true, location:'Hải Châu, Đà Nẵng', rating:4.4, reviews:756, pricePerNight:650000, originalPrice:1100000, img:'https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?w=600&q=80', amenities:['Spa toàn thân','Hồ bơi tầng trệt','Trung tâm thành phố'], amenityIcon:'💆', tags:['Spa','Ưu đãi','Trung tâm'], isLiked:false },
  { id:23, name:'Bana Hills Retreat Lodge', category:'KHU NGHỈ DƯỠNG 5 SAO', badgeColor:'bg-purple-600', badgePulse:false, location:'Hòa Vang, Đà Nẵng', rating:4.8, reviews:489, pricePerNight:2800000, originalPrice:3800000, img:'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600&q=80', amenities:['Cảnh núi rừng','Bungalow riêng tư','Đưa đón Bà Nà Hills'], amenityIcon:'⛰️', tags:['Spa cao cấp','Bãi riêng','Hồ bơi vô cực'], isLiked:false },
  { id:24, name:'Da Nang Riverside Hotel', category:'BOUTIQUE HOMESTAY', badgeColor:'bg-pink-500', badgePulse:false, location:'Hải Châu, Đà Nẵng', rating:4.5, reviews:623, pricePerNight:420000, originalPrice:580000, img:'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80', amenities:['View sông Hàn','Tầng thượng thư giãn','Gần cầu Tình Yêu'], amenityIcon:'🌉', tags:['Boutique','Cozy','View sông Hàn'], isLiked:false },
];

const TOTAL_DISPLAY = 128; // Số hiển thị trên UI (thực tế demo 24 card)
const AREAS = ['Tất cả', 'Biển Mỹ Khê', 'Sơn Trà', 'Trung tâm', 'Non Nước', 'Hải Châu'];
const AMENITY_OPTIONS = ['Gần biển', 'Hồ bơi vô cực', 'Spa', 'Bao gồm bữa sáng', 'Rooftop bar', 'Pet friendly'];
const HOTELS_PER_PAGE = 6;

const TRUST_BADGES = [
  { icon: Shield,     color: 'text-teal-600',   bg: 'bg-teal-50',    title: 'Giá tốt nhất đảm bảo',     desc: 'Khớp giá nếu bạn tìm thấy nơi rẻ hơn.' },
  { icon: Clock,      color: 'text-orange-500',  bg: 'bg-orange-50',  title: 'Hủy miễn phí trước 24h',   desc: 'Thay đổi kế hoạch? Không vấn đề gì.' },
  { icon: Headphones, color: 'text-blue-600',    bg: 'bg-blue-50',    title: 'Hỗ trợ 24/7',              desc: 'Đội ngũ của chúng tôi luôn sẵn sàng giúp bạn.' },
  { icon: Award,      color: 'text-purple-600',  bg: 'bg-purple-50',  title: 'Xác thực bởi 500+ đối tác', desc: 'Chỉ những đối tác uy tín mới được niêm yết.' },
];

// ── SPINNER DOTS ───────────────────────────────────────────────────────────────
function SpinnerDots() {
  return (
    <span className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}

// ── PAGE ───────────────────────────────────────────────────────────────────────
export default function LuuTruPage() {
  const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [likedHotels, setLikedHotels] = useState<Set<number>>(new Set());
  const [filterArea, setFilterArea] = useState('Tất cả');
  const [filterRating, setFilterRating] = useState(0);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000000]);
  const [filterAmenities, setFilterAmenities] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'recommended' | 'price_asc' | 'price_desc' | 'rating'>('recommended');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [aiBudget, setAiBudget] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiSuggestion, setShowAiSuggestion] = useState(false);

  const bannerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: bannerRef, offset: ['start start', 'end start'] });
  const yImage = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);



  const applyFilter = useCallback((fn: () => void) => {
    setIsLoading(true);
    fn();
    setCurrentPage(1);
    setTimeout(() => setIsLoading(false), 600);
  }, []);

  const toggleLike = (id: number) => {
    setLikedHotels((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAmenity = (a: string) => {
    applyFilter(() => {
      setFilterAmenities((prev) =>
        prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
      );
    });
  };

  const clearFilters = () => {
    applyFilter(() => {
      setFilterArea('Tất cả');
      setFilterRating(0);
      setPriceRange([0, 10000000]);
      setFilterAmenities([]);
      setSortBy('recommended');
    });
  };

  // ── Filtering + sorting ──────────────────────────────────────────────────────
  let filtered = HOTELS.filter((h) => {
    if (filterArea !== 'Tất cả' && !h.location.includes(filterArea)) return false;
    if (filterRating > 0 && h.rating < filterRating) return false;
    if (h.pricePerNight < priceRange[0] || h.pricePerNight > priceRange[1]) return false;
    if (filterAmenities.length > 0) {
      const hasAny = filterAmenities.some((a) =>
        h.tags.some((t) => t.toLowerCase().includes(a.toLowerCase()))
      );
      if (!hasAny) return false;
    }
    return true;
  });

  if (sortBy === 'price_asc')
    filtered = [...filtered].sort((a, b) => a.pricePerNight - b.pricePerNight);
  else if (sortBy === 'price_desc')
    filtered = [...filtered].sort((a, b) => b.pricePerNight - a.pricePerNight);
  else if (sortBy === 'rating')
    filtered = [...filtered].sort((a, b) => b.rating - a.rating);

  const totalPages = Math.ceil(filtered.length / HOTELS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * HOTELS_PER_PAGE,
    currentPage * HOTELS_PER_PAGE
  );

  const changePage = (p: number) => {
    setIsLoading(true);
    setCurrentPage(p);
    setTimeout(() => {
      setIsLoading(false);
      document
        .getElementById('hotel-grid')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 400);
  };

  const handleAI = () => {
    setAiLoading(true);
    setShowAiSuggestion(false);
    setTimeout(() => {
      setAiLoading(false);
      setShowAiSuggestion(true);
    }, 1200);
  };

  const hasActiveFilters =
    filterArea !== 'Tất cả' ||
    filterRating > 0 ||
    filterAmenities.length > 0 ||
    priceRange[0] > 0 ||
    priceRange[1] < 10000000;

  // Pagination window: show max 5 pages around currentPage
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

  // ── RENDER ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* ═══════════════════════════════════════════════════════════════════════
          PHẦN A-1: MINI HERO BANNER — ảnh resort + overlay gradient
          Ảnh: Fusion Maia resort (hồ bơi vô cực view biển) — đại diện đỉnh cao
          lưu trú Đà Nẵng, màu xanh teal hài hoà thương hiệu DanangGo.
          Ken Burns scale chậm (20s) tái sử dụng class `.ken-burns`.
      ═══════════════════════════════════════════════════════════════════════ */}
      <section ref={bannerRef} data-navbar-overlay="true" className="relative h-[320px] sm:h-[340px] overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 via-black/10 to-transparent pointer-events-none z-20" />
        {/* Ảnh nền Ken Burns */}
        <motion.div style={{ y: yImage }} className="absolute inset-0 ken-burns">
          <Image
            src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1920&q=85"
            alt="Resort Đà Nẵng hồ bơi vô cực view biển"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        </motion.div>
        {/* Overlay gradient: tối dưới → sáng trên để chữ trắng đọc được */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#071a2e]/60 via-[#0f2942]/50 to-[#071a2e]/80" />

        {/* Badge "Đảm bảo giá tốt nhất" — cố định góc trên phải, cách mép 24px,
            z-index 20 nhưng nằm TRONG banner (không gần đường overlap filter) */}
        <div
          className="absolute top-20 right-6 sm:right-8 z-20"
          style={{ opacity: 0, animation: 'fade-up 0.5s 0.3s ease-out forwards' }}
        >
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 text-white rounded-full px-4 py-1.5 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Đảm bảo giá tốt nhất
          </div>
        </div>

        {/* Nội dung banner — fade-up staggered, pb-10 đệm trước vùng overlap */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 flex flex-col justify-end h-full pb-10 pt-16">
          {/* Breadcrumb */}
          <div
            className="flex items-center gap-1 text-sm text-white/70 mb-3"
            style={{ opacity: 0, animation: 'fade-up 0.5s 0.1s ease-out forwards' }}
          >
            <Link href="/" className="hover:text-white transition-colors">
              Trang chủ
            </Link>
            <ChevronRight size={14} className="text-white/40" />
            <span className="text-white font-medium">Lưu trú tại Đà Nẵng</span>
          </div>

          {/* Tiêu đề + phụ đề */}
          <div
            style={{ opacity: 0, animation: 'fade-up 0.55s 0.2s ease-out forwards' }}
          >
            <h1 className="h1-hero text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
              Lưu trú tại Đà Nẵng
            </h1>
            <p className="stat-number text-white/70 text-sm mt-1.5">
              <AnimatedCounter
                to={TOTAL_DISPLAY}
                suffix=" khách sạn, resort & homestay tốt nhất"
                className="text-cyan-300 font-semibold"
                duration={1.2}
              />
            </p>
          </div>
        </div>
      </section>

      {/* Filter card: -mt-8 (giảm từ -mt-12) để không đè lên badge */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-8 relative z-10 mb-8">
        <Reveal delay={0.1}>
          <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-6 border border-gray-100">
            {/* Row 1: dropdowns + slider */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">

              {/* Khu vực */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 mb-1.5">
                  <MapPin size={12} className="text-teal-500" />
                  Khu vực
                </label>
                <select
                  value={filterArea}
                  onChange={(e) => applyFilter(() => setFilterArea(e.target.value))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-all bg-gray-50"
                >
                  {AREAS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              {/* Hạng đánh giá */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 mb-1.5">
                  <Star size={12} className="text-yellow-500" />
                  Hạng đánh giá
                </label>
                <select
                  value={filterRating}
                  onChange={(e) => applyFilter(() => setFilterRating(Number(e.target.value)))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-all bg-gray-50"
                >
                  <option value={0}>Tất cả</option>
                  <option value={4}>4.0+</option>
                  <option value={4.5}>4.5+</option>
                  <option value={4.8}>4.8+</option>
                </select>
              </div>

              {/* Sắp xếp */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 mb-1.5">
                  <ArrowUpDown size={12} className="text-[#0f2942]" />
                  Sắp xếp
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => applyFilter(() => setSortBy(e.target.value as typeof sortBy))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-all bg-gray-50"
                >
                  <option value="recommended">Đề xuất</option>
                  <option value="price_asc">Giá thấp đến cao</option>
                  <option value="price_desc">Giá cao đến thấp</option>
                  <option value="rating">Đánh giá cao nhất</option>
                </select>
              </div>

              {/* Price range slider */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 mb-1.5">
                  <Wallet size={12} className="text-orange-500" />
                  Khoảng giá/đêm
                </label>
                <PriceRangeSlider
                  min={0}
                  max={10000000}
                  value={priceRange}
                  onChange={(v) => applyFilter(() => setPriceRange(v))}
                />
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gray-100 mb-4" />

            {/* Row 2: amenity chips */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-gray-500 mr-1">Tiện ích ưu tiên:</span>
              <LayoutGroup>
                {AMENITY_OPTIONS.map((a) => {
                  const isActive = filterAmenities.includes(a);
                  return (
                    <button
                      key={a}
                      onClick={() => toggleAmenity(a)}
                      className={`relative text-xs px-3 py-1.5 rounded-full font-medium transition-all duration-200 border ${
                        isActive
                          ? 'text-white border-teal-500 shadow-sm'
                          : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="active-filter-luutru"
                          className="absolute inset-0 rounded-[inherit] bg-teal-500"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10">{a}</span>
                    </button>
                  );
                })}
              </LayoutGroup>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-red-500 hover:text-red-700 font-medium ml-2 transition-colors"
                >
                  ✕ Xóa tất cả
                </button>
              )}
            </div>
          </div>
        </Reveal>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 3: AI BANNER (giữ nguyên từ trước)
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-8">
        <Reveal delay={0.15}>
          <div className="shimmer-bg rounded-2xl p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row gap-6 items-start lg:items-center">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles
                    size={22}
                    className="text-yellow-300"
                    style={{ animation: 'pulse-badge 2s ease-in-out infinite' }}
                  />
                  <h2 className="h2-section text-white font-bold text-lg sm:text-xl">
                    Gợi ý khách sạn theo ngân sách của bạn
                  </h2>
                </div>
                <p className="body-text text-white/70 text-sm">
                  AI của DanangGo sẽ tìm ra lựa chọn tốt nhất phù hợp với túi tiền của bạn
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <input
                  type="text"
                  value={aiBudget}
                  onChange={(e) => setAiBudget(e.target.value)}
                  placeholder="Nhập ngân sách/đêm (VD: 2.000.000đ)"
                  className="bg-white/15 border border-white/30 text-white placeholder-white/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all w-full sm:w-72"
                />
                <button
                  onClick={handleAI}
                  disabled={aiLoading}
                  className="btn-ripple bg-orange-500 hover:bg-orange-400 disabled:opacity-70 text-white font-semibold px-5 py-2.5 rounded-xl transition-all text-sm flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  {aiLoading ? (
                    <><SpinnerDots /><span>Đang phân tích...</span></>
                  ) : (
                    '✨ Áp dụng đề xuất AI'
                  )}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {showAiSuggestion && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.3 }}
                  className="relative z-10 mt-4 flex items-start gap-2 bg-white/15 rounded-xl px-4 py-3 text-white text-sm"
                >
                  <CheckCircle size={16} className="text-green-300 flex-shrink-0 mt-0.5" />
                  <span>
                    Dựa trên ngân sách của bạn, chúng tôi đề xuất:{' '}
                    <strong>Ohana Beach Hotel Da Nang</strong> và{' '}
                    <strong>The Lena House Boutique</strong> — phù hợp tuyệt vời!
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Reveal>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 4: HOTEL GRID
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-4">
        {/* Results bar */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            Hiển thị{' '}
            <span className="font-semibold text-[#0f2942]">
              {(currentPage - 1) * HOTELS_PER_PAGE + 1}–
              {Math.min(currentPage * HOTELS_PER_PAGE, filtered.length)}
            </span>{' '}
            trong{' '}
            <span className="font-semibold text-[#0f2942]">{filtered.length}</span> kết quả
          </p>
          {hasActiveFilters && (
            <span className="text-xs bg-teal-100 text-teal-700 px-2.5 py-1 rounded-full font-medium">
              Đang lọc
            </span>
          )}
        </div>

        {/* Grid */}
        <div id="hotel-grid" className="scroll-mt-24">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </motion.div>
            ) : filtered.length === 0 ? (
              <motion.div key="empty" className="text-center py-20">
                <p className="text-gray-400 text-lg mb-2">Không tìm thấy khách sạn phù hợp</p>
                <button
                  onClick={clearFilters}
                  className="text-teal-600 font-medium text-sm hover:underline"
                >
                  Xóa bộ lọc
                </button>
              </motion.div>
            ) : (
              <motion.div
                key={`page-${currentPage}-${filterArea}-${sortBy}-${filterRating}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {paginated.map((hotel, i) => (
                  <motion.div
                    key={hotel.id}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: prefersReduced ? 0 : i * 0.07, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                    <HotelCard
                      hotel={hotel}
                      liked={likedHotels.has(hotel.id)}
                      onLike={() => toggleLike(hotel.id)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          PHẦN B-1: PHÂN TRANG — hiển thị khi có >1 trang
      ═══════════════════════════════════════════════════════════════════════ */}
      {totalPages > 1 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex justify-center">
          <div className="flex items-center gap-2">
            {/* Nút Prev */}
            <button
              onClick={() => currentPage > 1 && changePage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`flex items-center justify-center w-9 h-9 rounded-xl border transition-all ${
                currentPage === 1
                  ? 'opacity-40 cursor-not-allowed border-gray-200 text-gray-400'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-100 hover:scale-105'
              }`}
            >
              <ChevronLeft size={16} />
            </button>

            {/* Trang đầu nếu không nằm trong window */}
            {pageWindow()[0] > 1 && (
              <>
                <button
                  onClick={() => changePage(1)}
                  className="w-9 h-9 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-100 transition-all duration-200"
                >
                  1
                </button>
                {pageWindow()[0] > 2 && (
                  <span className="text-gray-400 px-1">…</span>
                )}
              </>
            )}

            {/* Window số trang */}
            {pageWindow().map((p) => (
              <button
                key={p}
                onClick={() => p !== currentPage && changePage(p)}
                className={`w-9 h-9 rounded-xl text-sm font-medium transition-all duration-200 ${
                  p === currentPage
                    ? 'bg-[#0f2942] text-white shadow-sm scale-105'
                    : 'border border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {p}
              </button>
            ))}

            {/* Trang cuối nếu không nằm trong window */}
            {pageWindow()[pageWindow().length - 1] < totalPages && (
              <>
                {pageWindow()[pageWindow().length - 1] < totalPages - 1 && (
                  <span className="text-gray-400 px-1">…</span>
                )}
                <button
                  onClick={() => changePage(totalPages)}
                  className="w-9 h-9 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-100 transition-all duration-200"
                >
                  {totalPages}
                </button>
              </>
            )}

            {/* Nút Next */}
            <button
              onClick={() => currentPage < totalPages && changePage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`flex items-center justify-center w-9 h-9 rounded-xl border transition-all ${
                currentPage === totalPages
                  ? 'opacity-40 cursor-not-allowed border-gray-200 text-gray-400'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-100 hover:scale-105'
              }`}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          PHẦN B-2: TRUST BADGES — "Vì sao chọn đặt qua DanangGo"
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <Reveal delay={0.05}>
          <h2 className="h2-section text-center text-xl sm:text-2xl font-bold text-[#0f2942] mb-8">
            Vì sao chọn đặt qua{' '}
            <span className="text-cyan-500">Danang</span>
            <span className="text-orange-400">Go</span>?
          </h2>
        </Reveal>
        {/* Grid: items-stretch → tất cả card tự động đồng chiều cao.
            Mỗi card dùng flex-col h-full để icon/title trên, desc dưới đều nhau. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
          {TRUST_BADGES.map((badge, i) => {
            const Icon = badge.icon;
            return (
              <Reveal key={badge.title} delay={i * 0.1} className="flex">
                <div className="flex flex-col h-full w-full bg-white rounded-2xl p-5 shadow-sm border border-gray-100 items-center text-center hover:shadow-md transition-shadow duration-300">
                  <div className={`w-12 h-12 ${badge.bg} rounded-2xl flex items-center justify-center mb-4 flex-shrink-0`}>
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

      {/* ═══════════════════════════════════════════════════════════════════════
          PHẦN B-3: CTA BANNER — "Thêm vào lịch trình" (tái sử dụng shimmer-bg)
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <Reveal delay={0.1}>
          <div className="shimmer-bg rounded-3xl p-10 sm:p-14 text-center text-white relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/5" />
            <div className="absolute -bottom-12 -left-12 w-64 h-64 rounded-full bg-white/5" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-teal-400/20 border border-teal-300/30 text-teal-200 text-xs font-bold px-4 py-1.5 rounded-full mb-5 uppercase tracking-wider">
                <Calendar size={13} />
                Lên kế hoạch ngay hôm nay
              </div>

              <h2 className="h2-section text-2xl sm:text-3xl font-bold mb-3">
                Đã tìm được chỗ ở ưng ý?{' '}
                <span className="text-cyan-300">Thêm ngay vào lịch trình!</span>
              </h2>
              <p className="body-text text-white/70 max-w-lg mx-auto mb-8 text-sm leading-relaxed">
                DanangGo giúp bạn lập lịch trình trọn vẹn — kết hợp lưu trú, ẩm thực và
                điểm tham quan thành một hành trình hoàn hảo tại Đà Nẵng.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="#lichtrinhgoiY"
                  className="btn-ripple inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold px-8 py-3.5 rounded-xl transition-colors hover:scale-[1.03] active:scale-[0.97] text-sm"
                >
                  <Calendar size={15} />
                  Thêm vào lịch trình
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 border-2 border-white/60 hover:border-white text-white hover:bg-white/10 font-semibold px-8 py-3.5 rounded-xl transition-all text-sm"
                >
                  Khám phá thêm điểm đến
                </Link>
              </div>

              <p className="text-white/40 text-xs mt-4">
                Miễn phí hoàn toàn · Lưu lịch trình không giới hạn · Chia sẻ dễ dàng
              </p>
            </div>
          </div>
        </Reveal>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          PHẦN B-4: FOOTER — đồng bộ với trang chủ
      ═══════════════════════════════════════════════════════════════════════ */}
      <footer className="bg-[#071a2e] text-white/70 pt-14 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {/* Logo + mô tả */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-teal-600 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">D</span>
                </div>
                <span className="text-white font-bold text-lg">
                  <span className="text-cyan-400">Danang</span>
                  <span className="text-orange-400">Go</span>
                </span>
              </div>
              <p className="text-sm leading-relaxed text-white/50 mb-4">
                Cẩm nang du lịch Đà Nẵng đầy đủ và cập nhật nhất — từ điểm đến,
                ẩm thực đến lịch trình tối ưu.
              </p>
              {/* Social icons */}
              <div className="flex gap-3">
                {[
                  { label: 'FB', color: 'bg-blue-600' },
                  { label: 'IG', color: 'bg-pink-600' },
                  { label: 'TT', color: 'bg-gray-700' },
                  { label: 'YT', color: 'bg-red-600' },
                ].map((s) => (
                  <a
                    key={s.label}
                    href="#"
                    className={`w-8 h-8 ${s.color} rounded-full flex items-center justify-center text-white text-xs font-bold hover:opacity-80 transition-opacity`}
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Cột Khám phá */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Khám phá</h4>
              <ul className="space-y-2.5">
                {['Điểm du lịch', 'Ẩm thực', 'Lưu trú', 'Mua sắm', 'Giải trí'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm hover:text-white transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Cột Tiện ích */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Tiện ích</h4>
              <ul className="space-y-2.5">
                {['Tạo lịch trình', 'Bản đồ thành phố', 'Thời tiết', 'Đặt vé online', 'Hỏi đáp'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm hover:text-white transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Cột Liên hệ */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Liên hệ</h4>
              <ul className="space-y-2.5">
                <li className="text-sm">📧 hello@dananggo.vn</li>
                <li className="text-sm">📞 0236 386 5xxx</li>
                <li className="text-sm">📍 Đà Nẵng, Việt Nam</li>
              </ul>
              <div className="mt-4 space-y-1.5">
                {['Về chúng tôi', 'Tuyển dụng', 'Báo chí'].map((link) => (
                  <a
                    key={link}
                    href="#"
                    className="block text-sm hover:text-white transition-colors"
                  >
                    {link}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
            <p>© 2025 DanangGo. Made with ❤️ in Đà Nẵng, Việt Nam.</p>
            <div className="flex gap-4">
              {['Điều khoản sử dụng', 'Chính sách bảo mật'].map((s) => (
                <a key={s} href="#" className="hover:text-white/70 transition-colors">
                  {s}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
