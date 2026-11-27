"use client";

import Image from "next/image";
import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  LayoutGroup,
  useReducedMotion,
} from "framer-motion";
import {
  ChevronRight,
  ChevronLeft,
  Sparkles,
  CheckCircle,
  MapPin,
  Star,
  ArrowUpDown,
  Wallet,
  Users,
  Shield,
  Clock,
  Headphones,
  Award,
  Calendar,
  LayoutGrid,
  List,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import HotelCard, { HotelData } from "@/components/places/HotelCard";
import SanctuaryAmbientBackdrop from "@/components/places/SanctuaryAmbientBackdrop";
import SanctuarySpotlightShowcase from "@/components/places/SanctuarySpotlightShowcase";
import HotelIndexList from "@/components/places/HotelIndexList";
import Footer from "@/components/layout/Footer";
import {
  getPlaces,
  getDistricts,
  getAmenities,
  type MasterCategoryItem,
  type PlaceSortOption,
} from "@/lib/api/places";
import PriceRangeSlider from "@/components/ui/PriceRangeSlider";
import { EASING, SPRING } from "@/lib/motion-tokens";

// ── ĐƯỜNG DẪN ẢNH NỀN HERO LƯU TRÚ ────────────────────────────────────────────
const LUU_TRU_HERO_IMAGE = "/images/luu-tru-hero.jpg";

// ── DATA: 24 khách sạn mẫu kết hợp dữ liệu thật từ Backend ────────────────────
const HOTELS: HotelData[] = [
  { id: 1, name: "Fusion Maia Da Nang Resort", category: "KHU NGHỈ DƯỠNG 5 SAO", badgeColor: "bg-purple-600", badgePulse: false, location: "Khu vực Biển Mỹ Khê", rating: 4.9, reviews: 2341, pricePerNight: 3200000, originalPrice: 4500000, img: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=85", amenities: ["Hồ bơi vô cực & Spa", "Giáp biển Mỹ Khê", "Bao gồm bữa sáng"], amenityIcon: "🏊", tags: ["Hồ bơi vô cực", "Spa cao cấp", "Trực tiếp biển"], isLiked: false },
  { id: 2, name: "InterContinental Da Nang Sun Peninsula", category: "ĐƯỢC YÊU THÍCH", badgeColor: "bg-red-500", badgePulse: true, location: "Sơn Trà, Đà Nẵng", rating: 4.8, reviews: 1893, pricePerNight: 5800000, originalPrice: 7200000, img: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=85", amenities: ["Tầm nhìn biển toàn cảnh", "Nhà hàng 5 sao", "Infinity pool"], amenityIcon: "🌊", tags: ["View biển", "Ẩm thực", "Hồ bơi"], isLiked: false },
  { id: 3, name: "Novotel Da Nang Premier Han River", category: "KHÁCH SẠN 4 SAO", badgeColor: "bg-blue-500", badgePulse: false, location: "Trung tâm Đà Nẵng", rating: 4.6, reviews: 3102, pricePerNight: 1850000, originalPrice: 2400000, img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=85", amenities: ["View sông Hàn", "Hồ bơi ngoài trời", "Trung tâm thành phố"], amenityIcon: "🏙️", tags: ["View sông Hàn", "Trung tâm", "Hồ bơi"], isLiked: false },
  { id: 4, name: "Ohana Beach Hotel Da Nang", category: "TOP VIEW BIỂN", badgeColor: "bg-teal-500", badgePulse: false, location: "Phạm Văn Đồng, Mỹ Khê", rating: 4.7, reviews: 1204, pricePerNight: 980000, originalPrice: 1300000, img: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=85", amenities: ["Ngay mặt biển Mỹ Khê", "Rooftop bar", "Wifi tốc độ cao"], amenityIcon: "🏖️", tags: ["Mặt biển", "Rooftop", "Giá tốt"], isLiked: false },
  { id: 5, name: "The Anam Da Nang", category: "ƯU ĐÃI HỜI", badgeColor: "bg-orange-500", badgePulse: true, location: "Bãi biển Non Nước", rating: 4.5, reviews: 876, pricePerNight: 2100000, originalPrice: 3500000, img: "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=1200&q=85", amenities: ["Biển Non Nước riêng tư", "Spa Việt Nam", "Bao gồm bữa trưa"], amenityIcon: "🌴", tags: ["Bãi riêng", "Spa", "Ưu đãi"], isLiked: false },
  { id: 6, name: "The Lena House Boutique", category: "BOUTIQUE HOMESTAY", badgeColor: "bg-pink-500", badgePulse: false, location: "Hải Châu, Đà Nẵng", rating: 4.8, reviews: 567, pricePerNight: 450000, originalPrice: 600000, img: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=85", amenities: ["Phong cách vintage", "Bếp chung", "Gần chợ Hàn"], amenityIcon: "🏡", tags: ["Boutique", "Cozy", "Giá rẻ"], isLiked: false },
  { id: 7, name: "Hyatt Regency Da Nang Resort", category: "KHU NGHỈ DƯỠNG 5 SAO", badgeColor: "bg-purple-600", badgePulse: false, location: "Khu vực Biển Mỹ Khê", rating: 4.7, reviews: 1650, pricePerNight: 4100000, originalPrice: 5500000, img: "https://images.unsplash.com/photo-1540541338537-1220059b8aed?w=1200&q=85", amenities: ["4 hồ bơi", "Bãi biển riêng", "Spa cao cấp"], amenityIcon: "🏊", tags: ["Hồ bơi vô cực", "Trực tiếp biển", "Spa cao cấp"], isLiked: false },
  { id: 8, name: "Sheraton Grand Da Nang Resort", category: "KHÁCH SẠN 5 SAO", badgeColor: "bg-purple-700", badgePulse: false, location: "Khu vực Biển Mỹ Khê", rating: 4.8, reviews: 2089, pricePerNight: 3600000, originalPrice: 4800000, img: "https://images.unsplash.com/photo-1551882547-ff40c4a49ce5?w=1200&q=85", amenities: ["View biển trực tiếp", "Nhà hàng Nhật Bản", "Fitness center"], amenityIcon: "🌊", tags: ["View biển", "Ẩm thực", "Hồ bơi"], isLiked: false },
  { id: 9, name: "Cocobay Da Nang", category: "ĐƯỢC YÊU THÍCH", badgeColor: "bg-red-500", badgePulse: true, location: "Ngũ Hành Sơn, Đà Nẵng", rating: 4.6, reviews: 943, pricePerNight: 1200000, originalPrice: 1800000, img: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1200&q=85", amenities: ["Khu phức hợp giải trí", "Beach club", "Water park"], amenityIcon: "🎡", tags: ["Giải trí", "Ưu đãi", "Hồ bơi"], isLiked: false },
  { id: 10, name: "Muong Thanh Luxury Da Nang Hotel", category: "KHÁCH SẠN 4 SAO", badgeColor: "bg-blue-500", badgePulse: false, location: "Trung tâm Đà Nẵng", rating: 4.5, reviews: 2210, pricePerNight: 890000, originalPrice: 1200000, img: "https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=1200&q=85", amenities: ["Hồ bơi tầng cao", "Nhà hàng buffet", "Gần biển Mỹ Khê"], amenityIcon: "🏙️", tags: ["Trung tâm", "Giá tốt", "Hồ bơi"], isLiked: false },
  { id: 11, name: "Azura Da Nang", category: "TOP VIEW BIỂN", badgeColor: "bg-teal-500", badgePulse: false, location: "Phạm Văn Đồng, Mỹ Khê", rating: 4.6, reviews: 780, pricePerNight: 1100000, originalPrice: 1500000, img: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1200&q=85", amenities: ["Rooftop infinity pool", "View biển Mỹ Khê", "Bar tầng thượng"], amenityIcon: "🏖️", tags: ["Rooftop", "Mặt biển", "Hồ bơi"], isLiked: false },
  { id: 12, name: "Faifo Hoi An - Da Nang Gateway", category: "BOUTIQUE HOMESTAY", badgeColor: "bg-pink-500", badgePulse: false, location: "Hải Châu, Đà Nẵng", rating: 4.7, reviews: 432, pricePerNight: 550000, originalPrice: 750000, img: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=1200&q=85", amenities: ["Phong cách Hội An", "Rooftop garden", "Breakfast included"], amenityIcon: "🏡", tags: ["Boutique", "Cozy", "Bao gồm bữa sáng"], isLiked: false },
  { id: 13, name: "Premier Village Da Nang Resort", category: "KHU NGHỈ DƯỠNG 5 SAO", badgeColor: "bg-purple-600", badgePulse: false, location: "Sơn Trà, Đà Nẵng", rating: 4.9, reviews: 1102, pricePerNight: 6200000, originalPrice: 8000000, img: "https://images.unsplash.com/photo-1527786356703-4b100091cd2c?w=1200&q=85", amenities: ["Villa riêng có hồ bơi", "Bờ biển riêng", "Butler service"], amenityIcon: "🏝️", tags: ["Hồ bơi vô cực", "Bãi riêng", "Spa cao cấp"], isLiked: false },
  { id: 14, name: "Almanity Hoi An Wellness Resort", category: "ƯU ĐÃI HỜI", badgeColor: "bg-orange-500", badgePulse: true, location: "Non Nước, Đà Nẵng", rating: 4.6, reviews: 698, pricePerNight: 1750000, originalPrice: 2800000, img: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&q=85", amenities: ["Wellness & Detox", "Yoga hàng ngày", "Hồ bơi muối khoáng"], amenityIcon: "🧘", tags: ["Spa", "Ưu đãi", "Bao gồm bữa sáng"], isLiked: false },
  { id: 15, name: "Grand Mercure Da Nang", category: "KHÁCH SẠN 4 SAO", badgeColor: "bg-blue-500", badgePulse: false, location: "Trung tâm Đà Nẵng", rating: 4.5, reviews: 1876, pricePerNight: 1350000, originalPrice: 1800000, img: "https://images.unsplash.com/photo-1549294413-26f195200c16?w=1200&q=85", amenities: ["View sông Hàn & biển", "Buffet sáng 5 sao", "Club Lounge độc quyền"], amenityIcon: "🏙️", tags: ["View sông Hàn", "Trung tâm", "Ẩm thực"], isLiked: false },
  { id: 16, name: "Brilliant Hotel Da Nang", category: "ĐƯỢC YÊU THÍCH", badgeColor: "bg-red-500", badgePulse: true, location: "Trung tâm Đà Nẵng", rating: 4.6, reviews: 2034, pricePerNight: 750000, originalPrice: 1050000, img: "https://images.unsplash.com/photo-1445991842772-097fea258e7b?w=1200&q=85", amenities: ["Rooftop bar sầm uất", "View sông Hàn", "Gần cầu Rồng"], amenityIcon: "🌉", tags: ["Rooftop", "Trung tâm", "Giá tốt"], isLiked: false },
  { id: 17, name: "Sandy Beach Non Nuoc Resort", category: "TOP VIEW BIỂN", badgeColor: "bg-teal-500", badgePulse: false, location: "Non Nước, Đà Nẵng", rating: 4.4, reviews: 1123, pricePerNight: 1600000, originalPrice: 2200000, img: "https://images.unsplash.com/photo-1535498730771-e735b998cd64?w=1200&q=85", amenities: ["Bãi biển Non Nước", "Beach volleyball", "Hải sản tươi sống"], amenityIcon: "🏖️", tags: ["Mặt biển", "Bãi riêng", "Ẩm thực"], isLiked: false },
  { id: 18, name: "Memority Hotel Da Nang", category: "BOUTIQUE HOMESTAY", badgeColor: "bg-pink-500", badgePulse: false, location: "Hải Châu, Đà Nẵng", rating: 4.8, reviews: 312, pricePerNight: 380000, originalPrice: 520000, img: "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=1200&q=85", amenities: ["Decor nghệ thuật độc đáo", "Cafe sân thượng", "Vị trí trung tâm"], amenityIcon: "🎨", tags: ["Boutique", "Cozy", "Giá rẻ"], isLiked: false },
  { id: 19, name: "TMS Hotel Da Nang Beach", category: "TOP VIEW BIỂN", badgeColor: "bg-teal-500", badgePulse: false, location: "Khu vực Biển Mỹ Khê", rating: 4.7, reviews: 1567, pricePerNight: 1450000, originalPrice: 2000000, img: "https://images.unsplash.com/photo-1561501900-3701fa6a0864?w=1200&q=85", amenities: ["Ngay biển Mỹ Khê", "Hồ bơi nước mặn", "Nhà hàng hải sản"], amenityIcon: "🏖️", tags: ["Mặt biển", "Hồ bơi", "Ẩm thực"], isLiked: false },
  { id: 20, name: "A La Carte Da Nang Beach Hotel", category: "ĐƯỢC YÊU THÍCH", badgeColor: "bg-red-500", badgePulse: true, location: "Khu vực Biển Mỹ Khê", rating: 4.6, reviews: 2198, pricePerNight: 1250000, originalPrice: 1700000, img: "https://images.unsplash.com/photo-1506059612708-99d6128a0101?w=1200&q=85", amenities: ["Phòng có bếp riêng", "Rooftop pool", "Dịch vụ tự nấu ăn"], amenityIcon: "🍳", tags: ["Rooftop", "Mặt biển", "Hồ bơi"], isLiked: false },
  { id: 21, name: "Green World Hotel Da Nang", category: "KHÁCH SẠN 4 SAO", badgeColor: "bg-blue-500", badgePulse: false, location: "Sơn Trà, Đà Nẵng", rating: 4.5, reviews: 934, pricePerNight: 820000, originalPrice: 1100000, img: "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=1200&q=85", amenities: ["View bán đảo Sơn Trà", "Gym & Yoga center", "Bao gồm bữa sáng"], amenityIcon: "🌿", tags: ["Spa", "Bao gồm bữa sáng", "View biển"], isLiked: false },
  { id: 22, name: "Palmy Hotel & Spa Da Nang", category: "ƯU ĐÃI HỜI", badgeColor: "bg-orange-500", badgePulse: true, location: "Hải Châu, Đà Nẵng", rating: 4.4, reviews: 756, pricePerNight: 650000, originalPrice: 1100000, img: "https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?w=1200&q=85", amenities: ["Spa toàn thân", "Hồ bơi tầng trệt", "Trung tâm thành phố"], amenityIcon: "💆", tags: ["Spa", "Ưu đãi", "Trung tâm"], isLiked: false },
  { id: 23, name: "Bana Hills Retreat Lodge", category: "KHU NGHỈ DƯỠNG 5 SAO", badgeColor: "bg-purple-600", badgePulse: false, location: "Hòa Vang, Đà Nẵng", rating: 4.8, reviews: 489, pricePerNight: 2800000, originalPrice: 3800000, img: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1200&q=85", amenities: ["Cảnh núi rừng", "Bungalow riêng tư", "Đưa đón Bà Nà Hills"], amenityIcon: "⛰️", tags: ["Spa cao cấp", "Bãi riêng", "Hồ bơi vô cực"], isLiked: false },
  { id: 24, name: "Da Nang Riverside Hotel", category: "BOUTIQUE HOMESTAY", badgeColor: "bg-pink-500", badgePulse: false, location: "Hải Châu, Đà Nẵng", rating: 4.5, reviews: 623, pricePerNight: 420000, originalPrice: 580000, img: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1200&q=85", amenities: ["View sông Hàn", "Tầng thượng thư giãn", "Gần cầu Tình Yêu"], amenityIcon: "🌉", tags: ["Boutique", "Cozy", "View sông Hàn"], isLiked: false },
];

const TOTAL_DISPLAY = 128;
const DEFAULT_DISTRICTS: MasterCategoryItem[] = [
  { id: 1, name: "Hải Châu" },
  { id: 2, name: "Sơn Trà" },
  { id: 3, name: "Ngũ Hành Sơn" },
  { id: 4, name: "Thanh Khê" },
  { id: 5, name: "Liên Chiểu" },
  { id: 6, name: "Cẩm Lệ" },
  { id: 7, name: "Hòa Vang" },
];
const DEFAULT_AMENITIES: MasterCategoryItem[] = [
  { id: 1, name: "Wi-Fi miễn phí" },
  { id: 2, name: "Hồ bơi" },
  { id: 3, name: "Bữa sáng" },
  { id: 4, name: "Điều hòa" },
  { id: 5, name: "Đưa đón sân bay" },
  { id: 6, name: "Chỗ đậu xe" },
  { id: 7, name: "Gần biển" },
];
const HOTELS_PER_PAGE = 6;

const AI_BUDGET_PRESETS = [
  { label: "Dưới 1 triệu", amount: 1000000, display: "1.000.000" },
  { label: "1 – 2 triệu", amount: 2000000, display: "2.000.000" },
  { label: "2 – 4 triệu", amount: 4000000, display: "4.000.000" },
  { label: "5★ Cao cấp", amount: 7000000, display: "7.000.000" },
];

const TRUST_BADGES = [
  {
    icon: Shield,
    accent: "text-[#7FD1C8]",
    ring: "bg-[#216B70]/25 border-[#69A5A3]/35",
    title: "Giá tốt nhất đảm bảo",
    desc: "Khớp giá minh bạch nếu bạn tìm thấy nơi lưu trú tốt hơn.",
  },
  {
    icon: Clock,
    accent: "text-[#F6B27B]",
    ring: "bg-[#E87B39]/18 border-[#E87B39]/35",
    title: "Hủy miễn phí trước 24h",
    desc: "Linh hoạt thay đổi kế hoạch hành trình không mất phụ phí.",
  },
  {
    icon: Headphones,
    accent: "text-[#93C5FD]",
    ring: "bg-sky-500/18 border-sky-400/35",
    title: "Hỗ trợ 24/7",
    desc: "Đội ngũ tư vấn địa phương luôn sẵn sàng đồng hành cùng bạn.",
  },
  {
    icon: Award,
    accent: "text-[#E6D9B7]",
    ring: "bg-[#E6D9B7]/14 border-[#E6D9B7]/35",
    title: "Xác thực bởi 500+ đối tác",
    desc: "Chỉ những khu nghỉ, khách sạn & homestay uy tín mới được niêm yết.",
  },
];

function SpinnerDots() {
  return (
    <span className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 bg-[#102832] rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}

function HotelSkeletonCard() {
  return (
    <div className="rounded-[18px] overflow-hidden bg-[#081C25]/82 border border-[#E6D9B7]/16 min-h-[430px] flex flex-col justify-between p-5 animate-pulse">
      <div className="flex justify-between">
        <div className="h-6 w-28 rounded-full bg-white/10" />
        <div className="h-8 w-8 rounded-full bg-white/10" />
      </div>
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="h-5 w-20 rounded-full bg-white/10" />
          <div className="h-5 w-24 rounded-full bg-white/10" />
        </div>
        <div className="h-6 w-3/4 rounded-lg bg-white/12" />
        <div className="h-4 w-1/2 rounded bg-white/8" />
        <div className="pt-4 border-t border-[#E6D9B7]/14 flex justify-between items-center">
          <div className="h-6 w-28 rounded bg-white/12" />
          <div className="h-8 w-24 rounded-full bg-white/12" />
        </div>
      </div>
    </div>
  );
}

export default function LuuTruPage() {
  const reducedMotion = Boolean(useReducedMotion());
  const [districts, setDistricts] =
    useState<MasterCategoryItem[]>(DEFAULT_DISTRICTS);
  const [amenitiesList, setAmenitiesList] =
    useState<MasterCategoryItem[]>(DEFAULT_AMENITIES);
  const [filterDistrictId, setFilterDistrictId] = useState<number>(0);
  const [filterAccType, setFilterAccType] = useState<string>("");
  const [filterRating, setFilterRating] = useState<number>(0);
  const [filterCapacity, setFilterCapacity] = useState<number>(0);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000000]);
  const [filterAmenityIds, setFilterAmenityIds] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<
    "recommended" | "price_asc" | "price_desc" | "rating"
  >("recommended");
  const [viewMode, setViewMode] = useState<"gallery" | "index">("gallery");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [liveHotels, setLiveHotels] = useState<HotelData[]>([]);
  const [hasLoadedLive, setHasLoadedLive] = useState(false);

  const [aiBudget, setAiBudget] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiSuggestion, setShowAiSuggestion] = useState(false);
  const [analyzedBudget, setAnalyzedBudget] = useState<number>(2000000);

  const pageContainerRef = useRef<HTMLDivElement>(null);
  const bannerRef = useRef<HTMLElement>(null);
  const consoleRef = useRef<HTMLDivElement>(null);
  const consoleRafRef = useRef<number | null>(null);

  const { scrollYProgress } = useScroll({
    target: bannerRef,
    offset: ["start start", "end start"],
  });
  const yImage = useTransform(
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
      el.style.setProperty("--lx", `${x.toFixed(1)}px`);
      el.style.setProperty("--ly", `${y.toFixed(1)}px`);
      el.style.setProperty("--l-spot", "1");
      consoleRafRef.current = null;
    });
  };

  const handleConsoleLeave = () => {
    if (consoleRafRef.current !== null) {
      cancelAnimationFrame(consoleRafRef.current);
      consoleRafRef.current = null;
    }
    consoleRef.current?.style.setProperty("--l-spot", "0");
  };

  useEffect(() => {
    return () => {
      if (consoleRafRef.current !== null)
        cancelAnimationFrame(consoleRafRef.current);
    };
  }, []);

  // Tải danh mục Quận và Tiện nghi từ Backend
  useEffect(() => {
    let isMounted = true;
    getDistricts()
      .then((list) => {
        if (isMounted && list.length > 0) setDistricts(list);
      })
      .catch(() => {});
    getAmenities()
      .then((list) => {
        if (isMounted && list.length > 0) setAmenitiesList(list);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Gọi API Backend GET /api/places?type=ACCOMMODATION với đầy đủ tham số lọc
  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;
    setIsLoading(true);

    const sortParam: PlaceSortOption =
      sortBy === "price_asc"
        ? "price_asc"
        : sortBy === "price_desc"
          ? "price_desc"
          : sortBy === "rating"
            ? "rating_desc"
            : "newest";

    getPlaces(
      {
        type: "ACCOMMODATION",
        accommodation_type: filterAccType ? (filterAccType as "HOTEL" | "HOMESTAY" | "RESORT" | "HOSTEL" | "APARTMENT") : undefined,
        district_id: filterDistrictId > 0 ? filterDistrictId : undefined,
        min_rating: filterRating > 0 ? filterRating : undefined,
        min_price: priceRange[0] > 0 ? priceRange[0] : undefined,
        max_price: priceRange[1] < 10000000 ? priceRange[1] : undefined,
        capacity: filterCapacity > 0 ? filterCapacity : undefined,
        amenity_ids: filterAmenityIds.length > 0 ? filterAmenityIds : undefined,
        sort: sortParam,
        page: 1,
        limit: 50,
      },
      controller.signal
    )
      .then((res) => {
        if (!isMounted) return;
        const live: HotelData[] = (res.items || []).map((item) => {
          const priceMin = item.price_min ?? 500000;
          const origPrice =
            item.original_price && item.original_price >= priceMin
              ? item.original_price
              : item.price_max && item.price_max > priceMin
                ? item.price_max
                : Math.round(priceMin * 1.2);
          const itemAmenities =
            item.amenity_names && item.amenity_names.length > 0
              ? item.amenity_names
              : ["Wi-Fi miễn phí", "Điều hòa"];
          return {
            id: item.place_id,
            placeId: item.place_id,
            name: item.name,
            category:
              item.accommodation_type === "RESORT"
                ? "KHU NGHỈ DƯỠNG"
                : item.accommodation_type === "HOMESTAY"
                  ? "BOUTIQUE HOMESTAY"
                  : item.accommodation_type === "HOSTEL"
                    ? "HOSTEL"
                    : item.accommodation_type === "APARTMENT"
                      ? "CĂN HỘ NGHỈ DƯỠNG"
                      : "KHÁCH SẠN",
            badgeColor:
              item.accommodation_type === "RESORT"
                ? "bg-purple-600"
                : item.accommodation_type === "HOMESTAY"
                  ? "bg-pink-500"
                  : item.accommodation_type === "HOSTEL"
                    ? "bg-teal-500"
                    : item.accommodation_type === "APARTMENT"
                      ? "bg-orange-500"
                      : "bg-blue-500",
            badgePulse: (item.avg_rating ?? 0) >= 4.8,
            location: item.district_name
              ? item.district_name + ", Đà Nẵng"
              : item.address || "Đà Nẵng",
            rating: Number((item.avg_rating ?? 4.5).toFixed(1)),
            reviews: item.review_count ?? 0,
            pricePerNight: priceMin,
            originalPrice: origPrice,
            img:
              item.cover_image ||
              "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=85",
            amenities: itemAmenities,
            amenityIcon: "🏨",
            tags: [item.district_name || "Đà Nẵng", ...itemAmenities],
            isLiked: false,
          };
        });
        setLiveHotels(live);
        setHasLoadedLive(true);
      })
      .catch((e: unknown) => {
        if (e instanceof Error && e.name === "AbortError") return;
        console.error(e);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [
    filterAccType,
    filterDistrictId,
    filterRating,
    filterCapacity,
    priceRange,
    filterAmenityIds,
    sortBy,
  ]);

  const applyFilter = useCallback((fn: () => void) => {
    fn();
    setCurrentPage(1);
  }, []);

  const toggleAmenity = (amenityId: number) => {
    applyFilter(() => {
      setFilterAmenityIds((prev) =>
        prev.includes(amenityId)
          ? prev.filter((x) => x !== amenityId)
          : [...prev, amenityId]
      );
    });
  };

  const clearFilters = () => {
    applyFilter(() => {
      setFilterAccType("");
      setFilterDistrictId(0);
      setFilterRating(0);
      setFilterCapacity(0);
      setPriceRange([0, 10000000]);
      setFilterAmenityIds([]);
      setSortBy("recommended");
    });
  };

  // Gộp dữ liệu từ API (SQL Server) + fallback HOTELS khi offline
  const selectedDistrictName =
    districts.find((d) => d.id === filterDistrictId)?.name || "";
  const selectedAmenityNames = amenitiesList
    .filter((a) => filterAmenityIds.includes(a.id))
    .map((a) => a.name);

  const combinedHotels = useMemo(() => {
    if (hasLoadedLive) {
      let list = [...liveHotels];
      if (sortBy === "price_asc")
        list = [...list].sort((a, b) => a.pricePerNight - b.pricePerNight);
      else if (sortBy === "price_desc")
        list = [...list].sort((a, b) => b.pricePerNight - a.pricePerNight);
      else if (sortBy === "rating")
        list = [...list].sort((a, b) => b.rating - a.rating);
      return list;
    }

    const liveNameSet = new Set(
      liveHotels.map((h) => h.name.trim().toLowerCase())
    );

    const matchStaticHotel = (h: HotelData): boolean => {
      if (selectedDistrictName) {
        const loc = h.location.toLowerCase();
        const dName = selectedDistrictName.toLowerCase();
        const matchDistrict =
          loc.includes(dName) ||
          (dName === "hải châu" && loc.includes("trung tâm")) ||
          (dName === "sơn trà" && loc.includes("mỹ khê")) ||
          (dName === "ngũ hành sơn" &&
            (loc.includes("non nước") || loc.includes("mỹ khê")));
        if (!matchDistrict) return false;
      }
      if (filterRating > 0 && h.rating < filterRating) return false;
      if (h.pricePerNight < priceRange[0] || h.pricePerNight > priceRange[1])
        return false;
      if (filterCapacity >= 6 && !h.category.includes("NGHỈ DƯỠNG"))
        return false;
      if (selectedAmenityNames.length > 0) {
        const textPool = [...h.amenities, ...h.tags, h.category, h.location]
          .join(" ")
          .toLowerCase();
        const hasAll = selectedAmenityNames.every((aName) => {
          const lower = aName.toLowerCase();
          if (lower.includes("wi-fi") || lower.includes("điều hòa"))
            return true;
          if (lower.includes("hồ bơi"))
            return textPool.includes("hồ bơi") || textPool.includes("pool");
          if (lower.includes("bữa sáng"))
            return (
              textPool.includes("bữa sáng") ||
              textPool.includes("breakfast") ||
              textPool.includes("buffet")
            );
          if (lower.includes("gần biển"))
            return (
              textPool.includes("biển") ||
              textPool.includes("mỹ khê") ||
              textPool.includes("non nước")
            );
          if (lower.includes("sân bay"))
            return h.pricePerNight >= 1500000 || textPool.includes("đưa đón");
          if (lower.includes("đậu xe")) return !h.category.includes("HOMESTAY");
          return textPool.includes(lower);
        });
        if (!hasAll) return false;
      }
      return true;
    };

    const extraStaticHotels = HOTELS.filter(
      (h) =>
        !liveNameSet.has(h.name.trim().toLowerCase()) && matchStaticHotel(h)
    );

    let list = [...liveHotels, ...extraStaticHotels];

    if (sortBy === "price_asc")
      list = [...list].sort((a, b) => a.pricePerNight - b.pricePerNight);
    else if (sortBy === "price_desc")
      list = [...list].sort((a, b) => b.pricePerNight - a.pricePerNight);
    else if (sortBy === "rating")
      list = [...list].sort((a, b) => b.rating - a.rating);

    return list;
  }, [
    hasLoadedLive,
    liveHotels,
    selectedDistrictName,
    filterRating,
    priceRange,
    filterCapacity,
    selectedAmenityNames,
    sortBy,
  ]);

  // Gợi ý AI thực theo ngân sách từ danh sách lưu trú hiện có
  const aiRecommendedHotels = useMemo(() => {
    const cap = analyzedBudget > 0 ? analyzedBudget : 2000000;
    const withinBudget = combinedHotels
      .filter((h) => h.pricePerNight <= cap)
      .sort((a, b) => {
        if (b.rating !== a.rating) return b.rating - a.rating;
        return b.pricePerNight - a.pricePerNight;
      });
    if (withinBudget.length > 0) return withinBudget.slice(0, 3);
    return [...combinedHotels]
      .sort((a, b) => a.pricePerNight - b.pricePerNight)
      .slice(0, 3);
  }, [combinedHotels, analyzedBudget]);

  const totalResults = combinedHotels.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / HOTELS_PER_PAGE));
  const paginated = combinedHotels.slice(
    (currentPage - 1) * HOTELS_PER_PAGE,
    currentPage * HOTELS_PER_PAGE
  );

  const changePage = (p: number) => {
    setCurrentPage(p);
    setTimeout(() => {
      document
        .getElementById("hotel-grid")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleAI = (overrideAmount?: number) => {
    const parsed =
      overrideAmount ??
      (Number(aiBudget.replace(/\D/g, "")) || 2000000);
    setAnalyzedBudget(parsed);
    setAiLoading(true);
    setShowAiSuggestion(false);
    setTimeout(() => {
      setAiLoading(false);
      setShowAiSuggestion(true);
    }, 650);
  };

  const hasActiveFilters =
    filterDistrictId > 0 ||
    filterRating > 0 ||
    filterCapacity > 0 ||
    filterAmenityIds.length > 0 ||
    priceRange[0] > 0 ||
    priceRange[1] < 10000000;

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

  const showSpotlight = !isLoading && currentPage === 1 && combinedHotels.length >= 2;

  return (
    <div
      ref={pageContainerRef}
      className="dananggo-cinematic-content relative min-h-screen bg-[#06151C] text-[#FFFDF5] flex flex-col overflow-x-clip"
    >
      {/* Nocturnal Coastal Sanctuary Atmospheric Backdrop */}
      <SanctuaryAmbientBackdrop
        activeDistrictId={filterDistrictId}
        containerRef={pageContainerRef}
      />

      {/* ═══ PHẦN 1: CINEMATIC COASTAL SUITE HERO ═══ */}
      <section
        ref={bannerRef}
        data-navbar-overlay="true"
        aria-label="Lưu trú tại Đà Nẵng"
        className="relative z-10 w-full h-[460px] sm:h-[510px] lg:h-[540px] overflow-hidden select-none bg-[#06151C] flex items-end"
      >
        <motion.div
          style={{ y: yImage }}
          initial={reducedMotion ? false : { scale: 1.06 }}
          animate={{ scale: 1 }}
          transition={
            reducedMotion
              ? { duration: 0 }
              : { duration: 1.45, ease: [0.16, 1, 0.3, 1] }
          }
          className="absolute inset-0"
        >
          <Image
            src={LUU_TRU_HERO_IMAGE}
            alt="Khách sạn resort nghỉ dưỡng view biển Đà Nẵng"
            fill
            priority
            quality={90}
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
              "linear-gradient(180deg, rgba(6,21,28,0.72) 0%, rgba(8,26,35,0.28) 40%, rgba(7,22,30,0.54) 72%, rgba(6,21,28,0.85) 90%, #06151C 100%)",
          }}
        />

        {/* Hero Typography & Bottom-Right Guarantee Badge (zero overlap with Weather pill) */}
        <div className="relative z-10 home-container w-full pb-24 sm:pb-28 pt-28">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-xs sm:text-sm text-[#CBD9DA]/82 mb-4"
          >
            <Link href="/" className="hover:text-[#FFFDF5] transition-colors">
              Trang chủ
            </Link>
            <ChevronRight size={14} className="text-[#E6D9B7]/50" />
            <span className="text-[#E6D9B7] font-medium">
              Lưu trú tại Đà Nẵng
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
                  THE COASTAL SANCTUARY COLLECTION
                </span>
              </motion.div>

              <motion.h1
                initial={reducedMotion ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.68,
                  delay: 0.14,
                  ease: EASING.entrance,
                }}
                style={{ textShadow: "0 8px 30px rgba(3,12,17,0.68)" }}
                className="cinematic-condensed uppercase font-bold text-[#FFFDF5] text-[clamp(2.4rem,5.2vw,4.7rem)] leading-[1.0] tracking-[-0.02em]"
              >
                Lưu Trú Tại{" "}
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
                <AnimatedCounter
                  to={TOTAL_DISPLAY}
                  suffix="+ khách sạn, resort ven biển & boutique homestay tinh tuyển."
                  className="text-[#E6D9B7] font-semibold"
                  duration={1.2}
                />
              </motion.p>
            </div>

            {/* Guarantee Telemetry Pill (clears fixed top-right Weather pill cleanly) */}
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.28, ease: EASING.standard }}
              className="hidden lg:flex flex-col items-end text-right shrink-0 pb-1"
            >
              <span className="text-[10.5px] font-mono uppercase tracking-[0.22em] text-[#E6D9B7]/85">
                HOSPITALITY CONCIERGE &middot; 500+ ĐỐI TÁC
              </span>
              <span className="mt-1.5 inline-flex items-center gap-2 rounded-full bg-[#06151C]/62 backdrop-blur-md border border-[#E6D9B7]/30 px-3.5 py-1.5 text-xs font-medium text-[#FFFDF5]">
                <span className="w-2 h-2 rounded-full bg-[#E87B39]" />
                <span>Đảm bảo giá tốt nhất · Hủy miễn phí 24h</span>
              </span>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ PHẦN 2: FROSTED SMOKED GLASS HOSPITALITY CONSOLE ═══ */}
      <div className="relative z-30 home-container -mt-16 sm:-mt-20 mb-12 w-full">
        <motion.div
          ref={consoleRef}
          onMouseMove={handleConsoleMove}
          onMouseLeave={handleConsoleLeave}
          initial={reducedMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.58, delay: 0.2, ease: EASING.standard }}
          className="luutru-console-glass relative rounded-[22px] bg-gradient-to-br from-[#0F2C38]/40 via-[#081D27]/30 to-[#06161F]/44 backdrop-blur-2xl backdrop-saturate-150 border border-[#E6D9B7]/28 p-5 sm:p-6 lg:p-7 shadow-[0_24px_64px_rgba(2,10,15,0.45),inset_0_1px_0_rgba(255,253,245,0.18),inset_0_-1px_0_rgba(230,217,183,0.08)] overflow-hidden"
        >
          {/* Top & bottom glass rim reflections + cursor sheen + 4 corner ticks */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#FFFDF5]/45 to-transparent"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-10 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-[#E6D9B7]/22 to-transparent"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,253,245,0.07) 0%, rgba(255,253,245,0.015) 38%, rgba(6,21,28,0.14) 100%)",
            }}
          />
          <div
            aria-hidden="true"
            className="luutru-console-spotlight pointer-events-none absolute inset-0 rounded-[inherit]"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-3 left-3 w-2.5 h-2.5 border-t border-l border-[#E6D9B7]/45 rounded-tl-[3px]"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-3 right-3 w-2.5 h-2.5 border-t border-r border-[#E6D9B7]/45 rounded-tr-[3px]"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-3 left-3 w-2.5 h-2.5 border-b border-l border-[#E6D9B7]/45 rounded-bl-[3px]"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-3 right-3 w-2.5 h-2.5 border-b border-r border-[#E6D9B7]/45 rounded-br-[3px]"
          />

          {/* Row 0: Loại hình lưu trú (Tất cả, Khách sạn, Homestay, Resort, Hostel, Căn hộ) */}
          <div className="relative z-10 pb-4 mb-4 border-b border-[#E6D9B7]/14 flex flex-wrap items-center gap-2">
            <span className="text-[10.5px] font-mono uppercase tracking-[0.18em] text-[#E6D9B7]/74 mr-1">
              Loại hình:
            </span>
            {[
              { value: "", label: "Tất cả" },
              { value: "HOMESTAY", label: "Homestay" },
              { value: "HOTEL", label: "Khách sạn" },
              { value: "RESORT", label: "Resort" },
              { value: "APARTMENT", label: "Căn hộ" },
              { value: "HOSTEL", label: "Hostel" },
            ].map((typeOpt) => {
              const isActive = filterAccType === typeOpt.value;
              return (
                <button
                  key={typeOpt.value || "ALL"}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => applyFilter(() => setFilterAccType(typeOpt.value))}
                  className={`relative text-xs px-3.5 py-1.5 rounded-full font-semibold transition-all duration-200 border cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-b from-[#FFFDF5] to-[#F3E7CE] text-[#102832] border-[#FFF8E9]"
                      : "bg-[#FFF8E9]/[0.07] text-[#DCE8E8] border-[#E6D9B7]/22 hover:border-[#E6D9B7]/52 hover:text-[#FFFDF5]"
                  }`}
                >
                  {typeOpt.label}
                </button>
              );
            })}
          </div>

          {/* Row 1: 4 Dark-Glass Selects + Upgraded Dark Champagne Price Slider */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
            {/* Quận / Khu vực */}
            <div>
              <label className="flex items-center gap-1.5 text-[10.5px] font-mono font-semibold uppercase tracking-[0.16em] text-[#E6D9B7]/82 mb-2">
                <MapPin size={12} className="text-[#C9B580]" />
                Quận / Khu vực
              </label>
              <select
                aria-label="Lọc theo quận khu vực"
                value={filterDistrictId}
                onChange={(e) =>
                  applyFilter(() => setFilterDistrictId(Number(e.target.value)))
                }
                className="w-full border border-[#E6D9B7]/24 hover:border-[#E6D9B7]/45 rounded-full px-3.5 py-2.5 text-xs sm:text-sm text-[#FFFDF5] focus:outline-none focus:border-[#E6D9B7]/75 transition-all bg-[#06151C]/42 backdrop-blur-md cursor-pointer"
              >
                <option value={0} className="bg-[#071821] text-[#FFFDF5]">
                  Tất cả quận
                </option>
                {districts.map((d) => (
                  <option
                    key={d.id}
                    value={d.id}
                    className="bg-[#071821] text-[#FFFDF5]"
                  >
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Hạng đánh giá */}
            <div>
              <label className="flex items-center gap-1.5 text-[10.5px] font-mono font-semibold uppercase tracking-[0.16em] text-[#E6D9B7]/82 mb-2">
                <Star size={12} className="text-[#E87B39]" />
                Đánh giá tối thiểu
              </label>
              <select
                aria-label="Lọc theo đánh giá tối thiểu"
                value={filterRating}
                onChange={(e) =>
                  applyFilter(() => setFilterRating(Number(e.target.value)))
                }
                className="w-full border border-[#E6D9B7]/24 hover:border-[#E6D9B7]/45 rounded-full px-3.5 py-2.5 text-xs sm:text-sm text-[#FFFDF5] focus:outline-none focus:border-[#E6D9B7]/75 transition-all bg-[#06151C]/42 backdrop-blur-md cursor-pointer"
              >
                <option value={0} className="bg-[#071821] text-[#FFFDF5]">
                  Tất cả
                </option>
                <option value={3.5} className="bg-[#071821] text-[#FFFDF5]">
                  3.5+ sao
                </option>
                <option value={4} className="bg-[#071821] text-[#FFFDF5]">
                  4.0+ sao
                </option>
                <option value={4.5} className="bg-[#071821] text-[#FFFDF5]">
                  4.5+ sao
                </option>
                <option value={4.8} className="bg-[#071821] text-[#FFFDF5]">
                  4.8+ sao
                </option>
              </select>
            </div>

            {/* Sức chứa phòng */}
            <div>
              <label className="flex items-center gap-1.5 text-[10.5px] font-mono font-semibold uppercase tracking-[0.16em] text-[#E6D9B7]/82 mb-2">
                <Users size={12} className="text-[#7FD1C8]" />
                Sức chứa phòng
              </label>
              <select
                aria-label="Lọc theo sức chứa phòng"
                value={filterCapacity}
                onChange={(e) =>
                  applyFilter(() => setFilterCapacity(Number(e.target.value)))
                }
                className="w-full border border-[#E6D9B7]/24 hover:border-[#E6D9B7]/45 rounded-full px-3.5 py-2.5 text-xs sm:text-sm text-[#FFFDF5] focus:outline-none focus:border-[#E6D9B7]/75 transition-all bg-[#06151C]/42 backdrop-blur-md cursor-pointer"
              >
                <option value={0} className="bg-[#071821] text-[#FFFDF5]">
                  Tất cả sức chứa
                </option>
                <option value={1} className="bg-[#071821] text-[#FFFDF5]">
                  Từ 1 khách/phòng
                </option>
                <option value={2} className="bg-[#071821] text-[#FFFDF5]">
                  Từ 2 khách/phòng
                </option>
                <option value={4} className="bg-[#071821] text-[#FFFDF5]">
                  Từ 4 khách (Gia đình)
                </option>
                <option value={6} className="bg-[#071821] text-[#FFFDF5]">
                  Từ 6 khách (Nhóm)
                </option>
              </select>
            </div>

            {/* Sắp xếp */}
            <div>
              <label className="flex items-center gap-1.5 text-[10.5px] font-mono font-semibold uppercase tracking-[0.16em] text-[#E6D9B7]/82 mb-2">
                <ArrowUpDown size={12} className="text-[#E6D9B7]" />
                Sắp xếp
              </label>
              <select
                aria-label="Sắp xếp kết quả lưu trú"
                value={sortBy}
                onChange={(e) =>
                  applyFilter(() => setSortBy(e.target.value as typeof sortBy))
                }
                className="w-full border border-[#E6D9B7]/24 hover:border-[#E6D9B7]/45 rounded-full px-3.5 py-2.5 text-xs sm:text-sm text-[#FFFDF5] focus:outline-none focus:border-[#E6D9B7]/75 transition-all bg-[#06151C]/42 backdrop-blur-md cursor-pointer"
              >
                <option
                  value="recommended"
                  className="bg-[#071821] text-[#FFFDF5]"
                >
                  Mới nhất / Đề xuất
                </option>
                <option
                  value="price_asc"
                  className="bg-[#071821] text-[#FFFDF5]"
                >
                  Giá thấp đến cao
                </option>
                <option
                  value="price_desc"
                  className="bg-[#071821] text-[#FFFDF5]"
                >
                  Giá cao đến thấp
                </option>
                <option value="rating" className="bg-[#071821] text-[#FFFDF5]">
                  Đánh giá cao nhất
                </option>
              </select>
            </div>

            {/* Price range slider (single clean label, dark Champagne styling) */}
            <div>
              <label className="flex items-center gap-1.5 text-[10.5px] font-mono font-semibold uppercase tracking-[0.16em] text-[#E6D9B7]/82 mb-2">
                <Wallet size={12} className="text-[#E87B39]" />
                Khoảng giá / đêm
              </label>
              <div className="pt-0.5">
                <PriceRangeSlider
                  min={0}
                  max={10000000}
                  value={priceRange}
                  onChange={(v) => applyFilter(() => setPriceRange(v))}
                  theme="dark"
                  hideLabel
                />
              </div>
            </div>
          </div>

          {/* Row 2: Amenity Chips + View Mode Switcher + Clear Filters */}
          <div className="relative z-10 pt-4 border-t border-[#E6D9B7]/14 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10.5px] font-mono uppercase tracking-[0.18em] text-[#E6D9B7]/74 mr-1">
                Tiện nghi:
              </span>
              <LayoutGroup id="luutru-amenities">
                {amenitiesList.map((a) => {
                  const isActive = filterAmenityIds.includes(a.id);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => toggleAmenity(a.id)}
                      className={`relative text-xs px-3 py-1.5 rounded-full font-medium transition-all duration-200 border cursor-pointer ${
                        isActive
                          ? "text-[#102832] border-[#FFF8E9]"
                          : "bg-[#FFF8E9]/[0.07] text-[#DCE8E8] border-[#E6D9B7]/22 hover:border-[#E6D9B7]/52 hover:text-[#FFFDF5]"
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId={`active-filter-luutru-${a.id}`}
                          className="absolute inset-0 rounded-full bg-gradient-to-b from-[#FFFDF5] to-[#F3E7CE]"
                          transition={SPRING.snappy}
                        />
                      )}
                      <span className="relative z-10">{a.name}</span>
                    </button>
                  );
                })}
              </LayoutGroup>
            </div>

            <div className="flex items-center gap-2.5 ml-auto">
              {/* View Switcher: Thư viện ⇄ Danh mục */}
              <div
                className="inline-flex items-center gap-1 p-1 rounded-full bg-[#051218]/36 backdrop-blur-md border border-[#E6D9B7]/20"
                role="group"
                aria-label="Chế độ hiển thị lưu trú"
              >
                <button
                  type="button"
                  onClick={() => setViewMode("gallery")}
                  aria-pressed={viewMode === "gallery"}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-all cursor-pointer ${
                    viewMode === "gallery"
                      ? "bg-[#FFF8E9]/16 text-[#FFFDF5] border border-[#E6D9B7]/42"
                      : "text-[#CBD9DA]/72 hover:text-[#FFFDF5] border border-transparent"
                  }`}
                >
                  <LayoutGrid size={12.5} className="text-[#E6D9B7]" />
                  <span>Thư viện</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("index")}
                  aria-pressed={viewMode === "index"}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-all cursor-pointer ${
                    viewMode === "index"
                      ? "bg-[#FFF8E9]/16 text-[#FFFDF5] border border-[#E6D9B7]/42"
                      : "text-[#CBD9DA]/72 hover:text-[#FFFDF5] border border-transparent"
                  }`}
                >
                  <List size={12.5} className="text-[#E6D9B7]" />
                  <span>Danh mục</span>
                </button>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-200 hover:text-white bg-red-500/20 hover:bg-red-500/35 border border-red-400/40 px-3.5 py-1.5 rounded-full transition-colors cursor-pointer"
                >
                  <RefreshCw size={12} />
                  <span>Xóa bộ lọc</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ═══ PHẦN 3: NỘI DUNG LƯU TRÚ ═══ */}
      <main className="relative z-10 home-container w-full flex-1">
        {/* TIER 1: SIGNATURE SUITE SPOTLIGHT */}
        {showSpotlight && <SanctuarySpotlightShowcase hotels={combinedHotels} />}

        {/* TIER 2: SMART AI BUDGET CONCIERGE ATELIER */}
        <section aria-label="Gợi ý lưu trú theo ngân sách AI" className="mb-14">
          <Reveal delay={0.1}>
            <div className="relative rounded-[22px] bg-gradient-to-br from-[#0B232E]/92 via-[#081C25]/94 to-[#06151C]/96 backdrop-blur-md border border-[#E6D9B7]/26 p-6 sm:p-8 overflow-hidden shadow-[0_24px_60px_rgba(2,10,15,0.45)]">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#E6D9B7]/55 to-transparent"
              />
              <img
                src="/images/intro/atmosphere/intro-coastal-contours.svg"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 w-full h-full object-cover opacity-[0.12]"
              />

              <div className="relative z-10 flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 text-[10.5px] font-mono uppercase tracking-[0.22em] text-[#E6D9B7] mb-2">
                    <Sparkles size={13} className="text-[#E87B39]" />
                    <span>CONCIERGE AI // TƯ VẤN NGÂN SÁCH THÔNG MINH</span>
                  </div>
                  <h2 className="home-serif text-xl sm:text-2xl font-semibold text-[#FFFDF5]">
                    Gợi ý khách sạn theo{" "}
                    <span className="italic font-normal text-[#E6D9B7]">
                      ngân sách mỗi đêm của bạn
                    </span>
                  </h2>
                  <p className="text-[#CBD9DA]/78 text-xs sm:text-sm mt-1">
                    Chọn nhanh khung ngân sách hoặc nhập mức giá mong muốn để
                    DanangGo đề xuất ngay những chỗ ở đáng giá nhất.
                  </p>

                  {/* Quick Budget Presets */}
                  <div className="flex flex-wrap items-center gap-2 mt-3.5">
                    {AI_BUDGET_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setAiBudget(preset.display);
                          handleAI(preset.amount);
                        }}
                        className={`text-[11px] font-medium px-3 py-1 rounded-full border transition-all cursor-pointer ${
                          showAiSuggestion && analyzedBudget === preset.amount
                            ? "bg-[#FFF8E9] text-[#102832] border-[#FFF8E9]"
                            : "bg-white/[0.06] hover:bg-white/[0.14] text-[#DCE8E8] border-[#E6D9B7]/24"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto shrink-0">
                  <input
                    type="text"
                    value={aiBudget}
                    onChange={(e) => setAiBudget(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAI();
                    }}
                    placeholder="VD: 2.000.000đ / đêm"
                    aria-label="Nhập ngân sách lưu trú mỗi đêm"
                    className="bg-[#051219]/72 border border-[#E6D9B7]/28 text-[#FFFDF5] placeholder:text-[#BFD1D3]/55 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-[#E6D9B7]/75 transition-all w-full sm:w-64"
                  />
                  <button
                    type="button"
                    onClick={() => handleAI()}
                    disabled={aiLoading}
                    className="luxury-btn-sweep bg-[#FFF8E9] hover:bg-white disabled:opacity-70 text-[#102832] font-semibold uppercase tracking-[0.12em] px-5 py-2.5 rounded-full transition-all text-xs flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer shadow-[0_10px_24px_rgba(2,10,15,0.4)]"
                  >
                    {aiLoading ? (
                      <>
                        <SpinnerDots />
                        <span>Đang phân tích...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={13} className="text-[#CB712D]" />
                        <span>Áp dụng đề xuất AI</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {showAiSuggestion && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.28 }}
                    className="relative z-10 mt-6 pt-5 border-t border-[#E6D9B7]/16 space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
                      <span className="inline-flex items-center gap-2 text-[#E2ECEC]">
                        <CheckCircle
                          size={15}
                          className="text-[#7FD1C8] shrink-0"
                        />
                        <span>
                          Top đề xuất phù hợp ngân sách{" "}
                          <strong className="text-[#E6D9B7]">
                            ≤ {analyzedBudget.toLocaleString("vi-VN")}đ/đêm
                          </strong>
                          :
                        </span>
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          applyFilter(() =>
                            setPriceRange([
                              0,
                              Math.min(10000000, Math.max(500000, analyzedBudget)),
                            ])
                          )
                        }
                        className="text-[11px] font-mono uppercase tracking-[0.14em] font-semibold text-[#F6B27B] hover:text-[#FFFDF5] underline underline-offset-4 cursor-pointer"
                      >
                        Áp dụng mức giá này vào bộ lọc &rarr;
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                      {aiRecommendedHotels.map((item) => (
                        <Link
                          key={`ai-${item.id}-${item.name}`}
                          href={`/places/${item.id}`}
                          className="group flex items-center gap-3.5 rounded-[14px] bg-[#051219]/75 hover:bg-[#0B222D] border border-[#E6D9B7]/18 hover:border-[#E6D9B7]/48 p-3 transition-all"
                        >
                          <div className="relative w-16 h-16 rounded-[10px] overflow-hidden shrink-0 bg-[#081C25] border border-[#E6D9B7]/20">
                            <Image
                              src={item.img}
                              alt={item.name}
                              fill
                              unoptimized={item.img.startsWith("http")}
                              sizes="64px"
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="home-serif text-sm font-semibold text-[#FFFDF5] group-hover:text-[#F5E6C4] truncate">
                              {item.name}
                            </h4>
                            <p className="text-[11px] text-[#CBD9DA]/72 truncate mt-0.5">
                              {item.location}
                            </p>
                            <div className="flex items-center justify-between gap-2 mt-1.5">
                              <span className="text-xs font-bold text-[#7FD1C8]">
                                {item.pricePerNight.toLocaleString("vi-VN")}đ
                              </span>
                              <span className="inline-flex items-center gap-0.5 text-[11px] text-[#F6B27B]">
                                ★ {item.rating}
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Reveal>
        </section>

        {/* TIER 3: BỘ SƯU TẬP LƯU TRÚ (THƯ VIỆN ⇄ DANH MỤC) */}
        <div
          id="hotel-grid"
          className="scroll-mt-28 flex flex-wrap items-end justify-between gap-4 pb-5 mb-7 border-b border-[#E6D9B7]/16"
        >
          <div>
            <div className="inline-flex items-center gap-2.5 text-[10.5px] font-mono uppercase tracking-[0.24em] text-[#E6D9B7] mb-1.5">
              <span className="w-6 h-[1px] bg-[#E87B39]" />
              <span>
                CHƯƠNG 02 //{" "}
                {viewMode === "gallery"
                  ? "THƯ VIỆN LƯU TRÚ CHỌN LỌC"
                  : "DANH MỤC LƯU TRÚ TINH GỌN"}
              </span>
            </div>
            <h2 className="home-serif text-2xl sm:text-3xl font-semibold text-[#FFFDF5] leading-tight">
              {viewMode === "gallery" ? (
                <>
                  Điểm dừng chân{" "}
                  <span className="italic font-normal text-[#E6D9B7]">
                    ven biển &amp; trung tâm
                  </span>
                </>
              ) : (
                <>
                  Mục lục giá phòng{" "}
                  <span className="italic font-normal text-[#E6D9B7]">
                    Đà Nẵng
                  </span>
                </>
              )}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <p className="text-xs sm:text-sm text-[#CBD9DA]/82">
              {totalResults > 0 ? (
                <>
                  Hiển thị{" "}
                  <span className="font-mono font-bold text-[#FFFDF5]">
                    {(currentPage - 1) * HOTELS_PER_PAGE + 1}–
                    {Math.min(currentPage * HOTELS_PER_PAGE, totalResults)}
                  </span>{" "}
                  /{" "}
                  <span className="font-mono font-bold text-[#E6D9B7]">
                    {totalResults}
                  </span>{" "}
                  chỗ ở
                </>
              ) : (
                "Không có kết quả"
              )}
            </p>
            {hasActiveFilters && (
              <span className="text-[10.5px] font-mono uppercase tracking-[0.14em] bg-[#216B70]/35 border border-[#69A5A3]/45 text-[#A7E4DF] px-2.5 py-1 rounded-full font-semibold">
                Đang lọc
              </span>
            )}
          </div>
        </div>

        {/* HOTEL COLLECTION */}
        <div>
          {isLoading ? (
            <div
              role="status"
              aria-label="Đang tải danh sách lưu trú"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <HotelSkeletonCard key={i} />
              ))}
            </div>
          ) : paginated.length === 0 ? (
            <div className="text-center py-16 bg-[#081C25]/82 backdrop-blur-md rounded-[22px] border border-[#E6D9B7]/22 p-8 max-w-lg mx-auto">
              <p className="home-serif text-xl font-semibold text-[#FFFDF5] mb-2">
                Không tìm thấy khách sạn phù hợp
              </p>
              <p className="text-sm text-[#CBD9DA]/76 mb-6">
                Hãy nới rộng khoảng giá hoặc bỏ bớt tiện nghi để xem thêm các
                điểm lưu trú tuyệt đẹp tại Đà Nẵng.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="px-6 py-2.5 rounded-full bg-[#FFF8E9] hover:bg-white text-[#102832] text-xs font-semibold uppercase tracking-[0.12em] transition cursor-pointer"
              >
                Xóa bộ lọc &amp; Xem tất cả
              </button>
            </div>
          ) : viewMode === "index" ? (
            <HotelIndexList
              hotels={paginated}
              startIndex={(currentPage - 1) * HOTELS_PER_PAGE}
            />
          ) : (
            <div
              key={`page-${currentPage}-${filterDistrictId}-${filterCapacity}-${sortBy}-${filterRating}-${filterAmenityIds.join(",")}`}
              className="event-ticket-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7"
            >
              {paginated.map((hotel, i) => (
                <motion.div
                  key={`${hotel.id}-${hotel.name}`}
                  initial={reducedMotion ? false : { opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.36,
                    delay: reducedMotion ? 0 : i * 0.05,
                    ease: EASING.standard,
                  }}
                  className="h-full"
                >
                  <HotelCard
                    hotel={hotel}
                    index={(currentPage - 1) * HOTELS_PER_PAGE + i}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* ═══ PHẦN 4: DARK GLASS PAGINATION ═══ */}
        {totalPages > 1 && (
          <div className="py-10 flex justify-center">
            <div className="inline-flex items-center gap-1.5 p-1.5 rounded-full bg-[#081C25]/82 backdrop-blur-md border border-[#E6D9B7]/22">
              <button
                type="button"
                aria-label="Trang trước"
                onClick={() => currentPage > 1 && changePage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`flex items-center justify-center w-9 h-9 rounded-full border transition-all ${
                  currentPage === 1
                    ? "opacity-35 cursor-not-allowed border-transparent text-[#CBD9DA]"
                    : "border-[#E6D9B7]/22 text-[#FFFDF5] hover:bg-white/10 cursor-pointer"
                }`}
              >
                <ChevronLeft size={16} />
              </button>

              {pageWindow()[0] > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => changePage(1)}
                    className="w-9 h-9 rounded-full text-xs font-mono font-semibold text-[#CBD9DA] hover:text-[#FFFDF5] hover:bg-white/10 transition cursor-pointer"
                  >
                    1
                  </button>
                  {pageWindow()[0] > 2 && (
                    <span className="text-[#CBD9DA]/50 px-1">…</span>
                  )}
                </>
              )}

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

              {pageWindow()[pageWindow().length - 1] < totalPages && (
                <>
                  {pageWindow()[pageWindow().length - 1] < totalPages - 1 && (
                    <span className="text-[#CBD9DA]/50 px-1">…</span>
                  )}
                  <button
                    type="button"
                    onClick={() => changePage(totalPages)}
                    className="w-9 h-9 rounded-full text-xs font-mono font-semibold text-[#CBD9DA] hover:text-[#FFFDF5] hover:bg-white/10 transition cursor-pointer"
                  >
                    {totalPages}
                  </button>
                </>
              )}

              <button
                type="button"
                aria-label="Trang sau"
                onClick={() =>
                  currentPage < totalPages && changePage(currentPage + 1)
                }
                disabled={currentPage === totalPages}
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

        {/* ═══ PHẦN 5: NOCTURNAL TRUST PILLARS ═══ */}
        <section className="py-14">
          <Reveal delay={0.05}>
            <div className="text-center mb-9">
              <span className="inline-flex items-center gap-2 text-[10.5px] font-mono uppercase tracking-[0.24em] text-[#E6D9B7] mb-2">
                <span className="w-5 h-[1px] bg-[#E87B39]" />
                <span>CAM KẾT DỊCH VỤ DANANGGO</span>
                <span className="w-5 h-[1px] bg-[#E87B39]" />
              </span>
              <h2 className="home-serif text-2xl sm:text-3xl font-semibold text-[#FFFDF5]">
                Vì sao chọn đặt qua{" "}
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

        {/* ═══ PHẦN 6: CLOSING CTA BANNER ═══ */}
        <section className="pb-16">
          <Reveal delay={0.1}>
            <div className="relative rounded-[24px] bg-gradient-to-br from-[#0C2632]/92 via-[#081C25]/95 to-[#06151C]/98 border border-[#E6D9B7]/28 p-9 sm:p-14 text-center overflow-hidden shadow-[0_28px_72px_rgba(2,10,15,0.52)]">
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

              <div className="relative z-10 max-w-2xl mx-auto">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#216B70]/30 border border-[#69A5A3]/45 text-[#E6D9B7] text-[11px] font-mono font-semibold px-4 py-1.5 mb-5 uppercase tracking-[0.18em]">
                  <Calendar size={13} className="text-[#E87B39]" />
                  <span>LÊN KẾ HOẠCH NGAY HÔM NAY</span>
                </div>

                <h2 className="home-serif text-2xl sm:text-4xl font-semibold text-[#FFFDF5] leading-snug mb-3">
                  Đã tìm được chỗ ở ưng ý?{" "}
                  <span className="italic font-normal text-[#E6D9B7]">
                    Thêm ngay vào lịch trình!
                  </span>
                </h2>
                <p className="text-[#CBD9DA]/82 max-w-lg mx-auto mb-8 text-sm leading-relaxed">
                  DanangGo giúp bạn lập lịch trình trọn vẹn — kết hợp lưu trú,
                  ẩm thực và điểm tham quan thành một hành trình hoàn hảo tại Đà
                  Nẵng.
                </p>

                <div className="flex flex-col sm:flex-row gap-3.5 justify-center">
                  <Link
                    href="/lich-trinh/tao-moi"
                    className="luxury-btn-sweep inline-flex items-center justify-center gap-2 rounded-full bg-[#E87B39] hover:bg-[#D66A28] text-[#FFFDF5] font-semibold uppercase tracking-[0.12em] px-8 py-3.5 transition-colors text-xs sm:text-sm shadow-[0_14px_32px_rgba(232,123,57,0.32)]"
                  >
                    <Calendar size={15} />
                    <span>Thêm vào lịch trình</span>
                  </Link>
                  <Link
                    href="/khampha"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[#E6D9B7]/40 hover:border-[#FFFDF5] bg-white/[0.05] hover:bg-white/[0.12] text-[#FFFDF5] font-semibold uppercase tracking-[0.12em] px-8 py-3.5 transition-all text-xs sm:text-sm"
                  >
                    <span>Khám phá thêm điểm đến</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>

                <p className="text-[#CBD9DA]/55 text-xs font-mono uppercase tracking-[0.16em] mt-5">
                  Miễn phí hoàn toàn &middot; Lưu lịch trình không giới hạn
                  &middot; Chia sẻ dễ dàng
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
