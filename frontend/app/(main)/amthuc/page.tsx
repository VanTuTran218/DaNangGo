"use client";

import Image from "next/image";
import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
  Suspense,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getPlaces } from "@/lib/api/places";
import { formatPriceRange } from "@/lib/mappers/place.mapper";
import HeartButton from "@/components/HeartButton";
import {
  motion,
  AnimatePresence,
  LayoutGroup,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import {
  ChevronRight,
  ChevronLeft,
  Star,
  MapPin,
  Clock,
  Navigation,
  Bookmark,
  ArrowUpDown,
  Users,
  Zap,
  ThumbsUp,
  CalendarClock,
  Calendar,
  CheckCircle,
  Search,
  X,
  SearchX,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Loader2,
  LayoutGrid,
  List,
  Utensils,
} from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import { recordSharedPlaceClick } from "@/components/ui/MotionPrimitives";
import CulinaryAmbientBackdrop from "@/components/places/CulinaryAmbientBackdrop";
import CulinaryTastingShowcase, {
  type CulinaryPlaceItem,
} from "@/components/places/CulinaryTastingShowcase";
import CulinaryMenuIndex from "@/components/places/CulinaryMenuIndex";
import Footer from "@/components/layout/Footer";
import { EASING, SPRING } from "@/lib/motion-tokens";

function removeVietnameseTones(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

const AM_THUC_HERO_IMAGE =
  "/images/cinematic/editorial/editorial-coastal-terrace.jpg";

const FALLBACK_FOOD_IMG =
  "https://images.unsplash.com/photo-1559847844-5315695dadae?w=1200&q=85";

const FOOD_PLACES: CulinaryPlaceItem[] = [
  {
    id: 96,
    name: "Hải Sản Bé Mặn",
    badge: "Hải sản tươi sống",
    badgeColor: "bg-teal-500",
    badgePulse: true,
    category: "Hải sản",
    location: "Sơn Trà, Đà Nẵng",
    rating: 4.7,
    reviews: 2890,
    priceRange: "70.000đ–180.000đ",
    priceNote: "/món",
    openNow: true,
    hours: "09:00–23:59",
    img: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=1200&q=85",
    tags: ["Hải sản tươi sống", "Sơn Trà", "Chip chip hấp", "Mực lá nướng"],
    description:
      "Quán hải sản bình dân đông đúc nhất dọc bãi biển Sơn Trà, hải sản tươi rói vừa cập bến ghe tàu.",
  },
  {
    id: 95,
    name: "Bún Chả Cá Hờn",
    badge: "Bún chả cá trứ danh",
    badgeColor: "bg-blue-500",
    badgePulse: false,
    category: "Bún chả cá",
    location: "Hải Châu, Đà Nẵng",
    rating: 4.8,
    reviews: 1780,
    priceRange: "40.000đ–45.000đ",
    priceNote: "/tô",
    openNow: true,
    hours: "06:00–22:00",
    img: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=1200&q=85",
    tags: ["Bún chả cá", "Hải Châu", "Chả cá thu", "Gia truyền"],
    description:
      "Thương hiệu bún chả cá lâu năm nổi danh xứ Đà với nước dùng ngọt lịm từ bí đỏ và chả cá thu dai giòn.",
  },
  {
    id: 94,
    name: "Cơm Niêu Nhà Đỏ Đà Nẵng",
    badge: "Cơm niêu gia truyền",
    badgeColor: "bg-purple-500",
    badgePulse: false,
    category: "Cơm nhà",
    location: "Hải Châu, Đà Nẵng",
    rating: 4.7,
    reviews: 1650,
    priceRange: "35.000đ–95.000đ",
    priceNote: "/món",
    openNow: true,
    hours: "10:00–22:00",
    img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&q=85",
    tags: ["Cơm niêu đập", "Cá bống kho tộ", "Cơm nhà ấm cúng"],
    description:
      "Cơm niêu đập cháy giòn rụm ăn kèm cá bống sông Trà kho tộ và canh cua đồng đậm đà hương vị quê hương.",
  },
  {
    id: 93,
    name: "Mì Quảng 1A Hải Phòng",
    badge: "Mì Quảng số 1",
    badgeColor: "bg-amber-500",
    badgePulse: true,
    category: "Mì Quảng",
    location: "Hải Châu, Đà Nẵng",
    rating: 4.8,
    reviews: 2450,
    priceRange: "45.000đ–55.000đ",
    priceNote: "/tô",
    openNow: true,
    hours: "06:00–21:30",
    img: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=1200&q=85",
    tags: ["Mì Quảng tôm thịt", "Ếch đồng", "Đặc sản Đà Nẵng"],
    description:
      "Địa chỉ mì Quảng nức tiếng với sợi mì gạo vàng óng, nước nhưn tôm thịt rim đậm đà và bánh tráng mè nướng.",
  },
  {
    id: 92,
    name: "Bánh Xèo Bà Dưỡng",
    badge: "Đặc sản số 1",
    badgeColor: "bg-red-500",
    badgePulse: true,
    category: "Bánh xèo",
    location: "Hải Châu, Đà Nẵng",
    rating: 4.9,
    reviews: 3120,
    priceRange: "60.000đ–75.000đ",
    priceNote: "/phần",
    openNow: true,
    hours: "09:30–21:30",
    img: "https://images.unsplash.com/photo-1600850056064-a8b380df8395?w=1200&q=85",
    tags: ["Bánh xèo giòn rụm", "Nước chấm gan heo mè", "Nem lụi than hoa"],
    description:
      "Huyền thoại ẩm thực hẻm Hoàng Diệu, bánh xèo vàng ươm giòn tan cuộn rau sống chấm nước sốt gan heo béo bùi.",
  },
  {
    id: 1,
    name: "Hải Sản Tươi Sống Mỹ Khê",
    badge: "Hải sản ven biển",
    badgeColor: "bg-teal-500",
    badgePulse: false,
    category: "Hải sản",
    location: "Ngũ Hành Sơn, Đà Nẵng",
    rating: 4.8,
    reviews: 1250,
    priceRange: "45.000đ–500.000đ",
    priceNote: "/món",
    openNow: true,
    hours: "09:00–23:30",
    img: "https://images.unsplash.com/photo-1559847844-5315695dadae?w=1200&q=85",
    tags: ["Tôm hùm bơ tỏi", "Cua huỳnh đế", "View biển Mỹ Khê"],
    description:
      "Nhà hàng hải sản uy tín bậc nhất ven biển Mỹ Khê, bắt trực tiếp từ hồ kính chế biến theo phong vị miền Trung.",
  },
  {
    id: 2,
    name: "Bánh Tráng Cuốn Thịt Heo Trần",
    badge: "Đặc sản nổi tiếng",
    badgeColor: "bg-red-500",
    badgePulse: true,
    category: "Bánh tráng cuốn",
    location: "Hải Châu, Đà Nẵng",
    rating: 4.8,
    reviews: 1893,
    priceRange: "60.000đ–120.000đ",
    priceNote: "/phần",
    openNow: true,
    hours: "10:00–22:00",
    img: "https://images.unsplash.com/photo-1561189386-42f49bcc29ef?w=1200&q=85",
    tags: ["Thịt heo 2 đầu da", "Mắm nêm nguyên chất", "Rau rừng"],
    description:
      "Điểm đến ẩm thực trứ danh khi đến Đà Nẵng, thịt heo luộc 2 đầu da cuốn bánh tráng Đại Lộc chấm mắm nêm thơm nồng.",
  },
  {
    id: 5,
    name: "Bánh Mì Bà Lan",
    badge: "Quán hẻm nổi tiếng",
    badgeColor: "bg-purple-500",
    badgePulse: false,
    category: "Bánh mì",
    location: "Hải Châu, Đà Nẵng",
    rating: 4.9,
    reviews: 3241,
    priceRange: "15.000đ–25.000đ",
    priceNote: "/ổ",
    openNow: true,
    hours: "06:00–21:00",
    img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=85",
    tags: ["Bánh mì chả bò", "Pate béo ngậy", "Đông khách"],
    description:
      "Huyền thoại bánh mì Đà Nẵng, vỏ giòn ruột mềm nhân chả bò, thịt nguội và pate béo ngậy đặc trưng.",
  },
  {
    id: 6,
    name: "Cà Phê Sân Thượng Việt Ơi",
    badge: "Check-in sông Hàn",
    badgeColor: "bg-pink-500",
    badgePulse: false,
    category: "Cà phê",
    location: "Hải Châu, Đà Nẵng",
    rating: 4.7,
    reviews: 1876,
    priceRange: "35.000đ–75.000đ",
    priceNote: "/ly",
    openNow: true,
    hours: "07:00–22:30",
    img: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1200&q=85",
    tags: ["View sông Hàn", "Cà phê muối", "Decor vintage"],
    description:
      "Không gian cà phê sân thượng ngắm trọn cầu Rồng và cầu sông Hàn lung linh ánh đèn về đêm.",
  },
  {
    id: 3,
    name: "Cao Lầu Hội An Giao Lưu",
    badge: "Đặc sản xứ Quảng",
    badgeColor: "bg-amber-500",
    badgePulse: false,
    category: "Cao lầu",
    location: "Sơn Trà, Đà Nẵng",
    rating: 4.7,
    reviews: 543,
    priceRange: "40.000đ–65.000đ",
    priceNote: "/tô",
    openNow: true,
    hours: "08:00–20:00",
    img: "https://images.unsplash.com/photo-1551326844-4df70f78d0e9?w=1200&q=85",
    tags: ["Cao lầu chính hiệu", "Thịt xá xíu", "Rau Trà Quế"],
    description:
      "Cao lầu sợi to dai sần sật, xá xíu thơm lừng hòa quyện rau sống Trà Quế giòn mát ngay giữa lòng Đà Nẵng.",
  },
  {
    id: 4,
    name: "Mì Hoành Thánh Tàu Bay",
    badge: "Ẩm thực người Hoa",
    badgeColor: "bg-red-500",
    badgePulse: false,
    category: "Mì Quảng",
    location: "Thanh Khê, Đà Nẵng",
    rating: 4.5,
    reviews: 876,
    priceRange: "35.000đ–55.000đ",
    priceNote: "/tô",
    openNow: true,
    hours: "07:00–20:00",
    img: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=1200&q=85",
    tags: ["Hoành thánh mỏng vỏ", "Nước dùng thanh ngọt", "Lâu đời"],
    description:
      "Mì hoành thánh chuẩn phong cách người Hoa tồn tại hơn 50 năm, nước dùng trong vắt thanh tao.",
  },
  {
    id: 21,
    name: "Chả Bò Huỳnh Thúc Kháng",
    badge: "Đặc sản làm quà",
    badgeColor: "bg-amber-500",
    badgePulse: false,
    category: "Chả bò",
    location: "Hải Châu, Đà Nẵng",
    rating: 4.9,
    reviews: 1234,
    priceRange: "50.000đ–150.000đ",
    priceNote: "/đòn",
    openNow: true,
    hours: "08:00–18:00",
    img: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=1200&q=85",
    tags: ["Chả bò nguyên chất", "Tiêu sọ cay nồng", "Quà tặng Đà Nẵng"],
    description:
      "Chả bò loại 1 thơm lừng tiêu sọ cay nồng, dai giòn sần sật, món quà biếu ý nghĩa khi đến Đà Nẵng.",
  },
];

const TOTAL_DISPLAY = 96;
const PLACES_PER_PAGE = 6;

const CATEGORY_TABS: { key: string; dot: string }[] = [
  { key: "Tất cả", dot: "bg-[#E87B39]" },
  { key: "Mì Quảng", dot: "bg-amber-400" },
  { key: "Bánh tráng cuốn", dot: "bg-rose-400" },
  { key: "Bún chả cá", dot: "bg-sky-400" },
  { key: "Hải sản", dot: "bg-teal-400" },
  { key: "Cà phê", dot: "bg-pink-400" },
  { key: "Bánh xèo", dot: "bg-orange-400" },
  { key: "Cơm nhà", dot: "bg-purple-400" },
];

const CAT_TINT: Record<string, string> = {
  "Mì Quảng": "bg-amber-500",
  "Bánh tráng cuốn": "bg-red-500",
  "Bún chả cá": "bg-blue-500",
  "Hải sản": "bg-teal-500",
  "Cà phê": "bg-pink-500",
  "Bánh xèo": "bg-orange-500",
  "Cơm nhà": "bg-purple-500",
  "Tất cả": "bg-gray-800",
};

const POPULAR_FOOD_TAGS = [
  { label: "Hải Sản Bé Mặn", query: "bé mặn" },
  { label: "Mì Quảng 1A", query: "mì quảng" },
  { label: "Bánh Xèo Bà Dưỡng", query: "bà dưỡng" },
  { label: "Bún Chả Cá Hờn", query: "chả cá hờn" },
  { label: "Cơm Niêu Nhà Đỏ", query: "cơm niêu" },
  { label: "Bánh Mì Bà Lan", query: "bà lan" },
  { label: "Hải Sản Mỹ Khê", query: "mỹ khê" },
];

const TIME_FILTERS = [
  "Tất cả khung giờ",
  "Sáng sớm (6-9h)",
  "Trưa (11-14h)",
  "Tối (18-23h)",
];
const DAY_FILTERS = ["Tất cả ngày", "Cuối tuần", "Ngày thường"];

const SORT_OPTIONS = [
  { value: "recommended", label: "Đề xuất" },
  { value: "rating", label: "Đánh giá cao nhất" },
  { value: "reviews", label: "Nhiều đánh giá nhất" },
  { value: "name", label: "Tên A–Z" },
];

const TRUST_BADGES = [
  {
    icon: Users,
    accent: "text-[#7FD1C8]",
    ring: "bg-[#216B70]/25 border-[#69A5A3]/35",
    title: "Xác minh bởi cộng đồng",
    desc: "Hàng nghìn thực khách đánh giá chân thực mỗi ngày.",
  },
  {
    icon: Zap,
    accent: "text-[#F6B27B]",
    ring: "bg-[#E87B39]/18 border-[#E87B39]/35",
    title: "Cập nhật theo thời gian thực",
    desc: "Giá tham khảo & giờ mở cửa được cập nhật liên tục.",
  },
  {
    icon: ThumbsUp,
    accent: "text-[#93C5FD]",
    ring: "bg-sky-500/18 border-sky-400/35",
    title: "Chỉ đường chính xác",
    desc: "Tích hợp bản đồ, dẫn đường chi tiết tới từng quán hẻm.",
  },
  {
    icon: CalendarClock,
    accent: "text-[#E6D9B7]",
    ring: "bg-[#E6D9B7]/14 border-[#E6D9B7]/35",
    title: "Gợi ý theo khung giờ",
    desc: "Biết ngay quán đang mở cửa phù hợp sáng, trưa hay đêm khuya.",
  },
];

function matchesTimeWindow(hoursText: string, activeTime: string): boolean {
  if (activeTime === "Tất cả khung giờ") return true;
  const match = /(\d{1,2}):(\d{2})\s*[–\-]\s*(\d{1,2}):(\d{2})/.exec(hoursText);
  if (!match) return true;
  const openH = Number(match[1]) + Number(match[2]) / 60;
  const closeH = Number(match[3]) + Number(match[4]) / 60;
  if (activeTime.startsWith("Sáng")) return openH <= 9 && closeH >= 6;
  if (activeTime.startsWith("Trưa")) return openH <= 14 && closeH >= 11;
  if (activeTime.startsWith("Tối")) return closeH >= 19.5;
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// FULL-BLEED NOCTURNAL GASTRONOMY CARD
// ─────────────────────────────────────────────────────────────────────────────
function FoodCard({
  place,
  saved,
  onSave,
  index,
}: {
  place: CulinaryPlaceItem;
  saved: boolean;
  onSave: () => void;
  index: number;
}) {
  const reducedMotion = Boolean(useReducedMotion());
  const [imgError, setImgError] = useState(false);
  const cardRef = useRef<HTMLElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (reducedMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    const rx = (0.5 - ny) * 4.5;
    const ry = (nx - 0.5) * 4.5;
    const px = (0.5 - nx) * 8;
    const py = (0.5 - ny) * 6;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const el = cardRef.current;
      if (!el) return;
      el.classList.add("is-tilting");
      el.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
      el.style.setProperty("--ry", `${ry.toFixed(2)}deg`);
      el.style.setProperty("--px", `${px.toFixed(1)}px`);
      el.style.setProperty("--py", `${py.toFixed(1)}px`);
      el.style.setProperty("--mx", `${mx.toFixed(1)}px`);
      el.style.setProperty("--my", `${my.toFixed(1)}px`);
      el.style.setProperty("--spot-opacity", "1");
      rafRef.current = null;
    });
  };

  const resetCardTilt = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const el = cardRef.current;
    if (!el) return;
    el.classList.remove("is-tilting");
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--px", "0px");
    el.style.setProperty("--py", "0px");
    el.style.setProperty("--spot-opacity", "0");
  };

  const handleMouseDown = () => {
    if (!cardRef.current) return;
    cardRef.current.style.setProperty("--spot-opacity", "0");
  };

  const imgSrc = imgError || !place.img ? FALLBACK_FOOD_IMG : place.img;
  const orderLabel = String(index + 1).padStart(2, "0");

  return (
    <motion.div
      layout="position"
      transition={{ duration: 0.25 }}
      className="h-full"
    >
      <article
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={resetCardTilt}
        onMouseDown={handleMouseDown}
        className="event-ticket-card luxury-border-sweep group relative rounded-[18px] overflow-hidden bg-[#081C25] border border-[#E6D9B7]/24 shadow-[0_18px_46px_rgba(2,10,15,0.44)] min-h-[435px] flex flex-col h-full"
      >
        {/* Whisper-soft Champagne spotlight (zero glare on click) */}
        <div
          aria-hidden="true"
          className="event-ticket-spotlight pointer-events-none absolute inset-0 z-20 rounded-[inherit]"
        />

        {/* 4 Subtle Leica Corner Viewfinder Brackets */}
        <span
          aria-hidden="true"
          className="explore-corner-bracket pointer-events-none absolute top-3 left-3 z-30 w-3 h-3 border-t border-l border-[#E6D9B7]/75 rounded-tl-[2px]"
        />
        <span
          aria-hidden="true"
          className="explore-corner-bracket pointer-events-none absolute top-3 right-3 z-30 w-3 h-3 border-t border-r border-[#E6D9B7]/75 rounded-tr-[2px]"
        />
        <span
          aria-hidden="true"
          className="explore-corner-bracket pointer-events-none absolute bottom-3 left-3 z-30 w-3 h-3 border-b border-l border-[#E6D9B7]/75 rounded-bl-[2px]"
        />
        <span
          aria-hidden="true"
          className="explore-corner-bracket pointer-events-none absolute bottom-3 right-3 z-30 w-3 h-3 border-b border-r border-[#E6D9B7]/75 rounded-br-[2px]"
        />

        {/* Action buttons cleanly above link layer */}
        {place.placeId ? (
          <>
            <div className="absolute top-3.5 right-3.5 z-30">
              <HeartButton placeId={place.placeId} />
            </div>
            <div className="absolute top-3.5 right-[3.35rem] z-30">
              <HeartButton placeId={place.placeId} variant="bookmark" />
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSave();
            }}
            className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-[#06151C]/78 backdrop-blur-md border border-[#E6D9B7]/28 flex items-center justify-center hover:border-[#E6D9B7]/65 transition-all z-30 cursor-pointer"
            aria-label={saved ? "Bỏ lưu" : "Lưu địa điểm"}
          >
            <Bookmark
              size={14}
              className={
                saved
                  ? "fill-[#E87B39] text-[#E87B39]"
                  : "text-[#FFFDF5]"
              }
            />
          </button>
        )}

        <Link
          href={`/places/${place.id}`}
          onClick={() =>
            recordSharedPlaceClick(place.placeId ?? place.id, imgSrc)
          }
          className="relative flex flex-col flex-1 h-full luxury-shimmer-frame"
        >
          {/* Full-Bleed Food Photography */}
          <div className="absolute inset-0 overflow-hidden bg-[#051219]">
            <div className="event-ticket-media absolute inset-0">
              <Image
                src={imgSrc}
                alt={place.name}
                fill
                unoptimized={imgSrc.startsWith("http")}
                onError={() => setImgError(true)}
                className="object-cover"
                sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,33vw"
              />
            </div>

            {/* Velvety Deep-Ocean Editorial Vignette */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(6,21,28,0.56) 0%, rgba(6,21,28,0.08) 28%, rgba(6,21,28,0.28) 44%, rgba(6,21,28,0.84) 66%, rgba(5,18,25,0.96) 84%, #051219 100%)",
              }}
            />
          </div>

          {/* Top Bar: Specialty Badge + Open Now Status */}
          <div className="relative z-10 pt-3.5 px-3.5 pr-24 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center rounded-full bg-[#06151C]/78 backdrop-blur-md border border-[#E6D9B7]/32 text-[#FFFDF5] text-[10px] font-semibold uppercase tracking-[0.1em] px-3 py-1.5">
              {place.badge}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1.5 rounded-full backdrop-blur-md border ${
                place.openNow
                  ? "bg-[#216B70]/55 border-[#69A5A3]/60 text-[#FFFDF5]"
                  : "bg-[#06151C]/78 border-white/20 text-[#CBD9DA]/75"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  place.openNow ? "bg-[#7FD1C8]" : "bg-white/40"
                }`}
              />
              {place.openNow ? "Đang mở cửa" : "Đã đóng cửa"}
            </span>
          </div>

          {/* Bottom Editorial Dossier */}
          <div className="relative z-10 mt-auto p-5 flex flex-col justify-end transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-0.5">
            {/* Category + ORYZO Order Number */}
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 text-[10.5px] font-mono font-semibold uppercase tracking-[0.18em] text-[#E6D9B7]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E87B39]" />
                <span>{place.category}</span>
              </span>

              <div
                aria-hidden="true"
                className="flex items-center gap-1.5 select-none shrink-0"
              >
                <span className="w-3.5 h-[1px] bg-[#E6D9B7]/60 transition-all duration-400 group-hover:w-6 group-hover:bg-[#E87B39]" />
                <span className="oryzo-card-number text-[15px] tracking-[0.14em] leading-none">
                  {orderLabel}
                </span>
              </div>
            </div>

            <h3
              style={{ textShadow: "0 2px 14px rgba(3,12,17,0.72)" }}
              className="home-serif font-semibold text-[#FFFDF5] group-hover:text-[#F5E6C4] transition-colors text-[20px] leading-[1.28] line-clamp-1 mb-1.5"
            >
              {place.name}
            </h3>

            {/* Location + Hours */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#CBD9DA]/85 mb-2">
              <span className="inline-flex items-center gap-1 min-w-0">
                <MapPin size={12.5} className="text-[#C9B580] shrink-0" />
                <span className="truncate">{place.location}</span>
              </span>
              <span className="inline-flex items-center gap-1 shrink-0 text-[#E6D9B7]/85">
                <Clock size={11.5} />
                <span>{place.hours}</span>
              </span>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1.5 text-xs mb-2.5">
              <Star size={12} className="fill-[#E87B39] text-[#E87B39]" />
              <strong className="text-[#FFFDF5]">{place.rating}</strong>
              <span className="text-[#CBD9DA]/70">
                ({place.reviews.toLocaleString("vi-VN")} đánh giá)
              </span>
            </div>

            <p className="text-xs text-[#BFD1D3]/78 line-clamp-2 leading-relaxed mb-4">
              {place.description}
            </p>

            {/* Kinetic Champagne -> Sunset Divider Sweep */}
            <div className="relative w-full h-[1px] bg-[#E6D9B7]/22 overflow-hidden mb-3.5">
              <span
                aria-hidden="true"
                className="absolute inset-0 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-550 ease-[cubic-bezier(0.22,1,0.36,1)] bg-gradient-to-r from-[#E87B39] via-[#E6D9B7] to-transparent"
              />
            </div>

            {/* Price + Kinetic CTA */}
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="stat-number text-[#7FD1C8] font-bold text-sm sm:text-[15px] leading-tight truncate">
                  {place.priceRange}
                </p>
                <p className="text-[10.5px] text-[#CBD9DA]/65">
                  {place.priceNote}
                </p>
              </div>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF8E9] group-hover:bg-white text-[#102832] text-[11px] font-semibold uppercase tracking-[0.12em] px-3.5 py-2 transition-colors shrink-0">
                <span>Chi tiết</span>
                <span className="relative inline-flex w-3.5 h-3.5 items-center justify-center overflow-hidden">
                  <ArrowRight
                    size={12.5}
                    aria-hidden="true"
                    className="explore-arrow-out absolute text-[#0F4C5C]"
                  />
                  <ArrowRight
                    size={12.5}
                    aria-hidden="true"
                    className="explore-arrow-in absolute text-[#CB712D]"
                  />
                </span>
              </span>
            </div>
          </div>
        </Link>
      </article>
    </motion.div>
  );
}

function FoodSkeleton() {
  return (
    <div className="rounded-[18px] overflow-hidden bg-[#081C25]/82 border border-[#E6D9B7]/16 min-h-[435px] flex flex-col justify-between p-5 animate-pulse">
      <div className="flex justify-between">
        <div className="h-6 w-28 rounded-full bg-white/10" />
        <div className="h-8 w-8 rounded-full bg-white/10" />
      </div>
      <div className="space-y-3">
        <div className="h-4 w-24 rounded-full bg-white/10" />
        <div className="h-6 w-3/4 rounded-lg bg-white/12" />
        <div className="h-3.5 w-1/2 rounded bg-white/8" />
        <div className="h-3 w-full rounded bg-white/8" />
        <div className="pt-4 border-t border-[#E6D9B7]/14 flex justify-between items-center">
          <div className="h-5 w-28 rounded bg-white/12" />
          <div className="h-8 w-24 rounded-full bg-white/12" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NỘI DUNG CHÍNH TRANG ẨM THỰC
// ─────────────────────────────────────────────────────────────────────────────
function AmThucContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQ = searchParams.get("q") || "";
  const reducedMotion = Boolean(useReducedMotion());

  const [foodPlaces, setFoodPlaces] =
    useState<CulinaryPlaceItem[]>(FOOD_PLACES);
  const [savedPlaces, setSavedPlaces] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState(urlQ);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [activeTime, setActiveTime] = useState("Tất cả khung giờ");
  const [activeDay, setActiveDay] = useState("Tất cả ngày");
  const [sortBy, setSortBy] = useState<string>("recommended");
  const [viewMode, setViewMode] = useState<"cards" | "menu">("cards");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [nearMe, setNearMe] = useState(false);
  const [onlyOpenNow, setOnlyOpenNow] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const pageContainerRef = useRef<HTMLDivElement>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const consoleRef = useRef<HTMLDivElement>(null);
  const consoleRafRef = useRef<number | null>(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(
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
      el.style.setProperty("--ax", `${x.toFixed(1)}px`);
      el.style.setProperty("--ay", `${y.toFixed(1)}px`);
      el.style.setProperty("--a-spot", "1");
      consoleRafRef.current = null;
    });
  };

  const handleConsoleLeave = () => {
    if (consoleRafRef.current !== null) {
      cancelAnimationFrame(consoleRafRef.current);
      consoleRafRef.current = null;
    }
    consoleRef.current?.style.setProperty("--a-spot", "0");
  };

  useEffect(() => {
    return () => {
      if (consoleRafRef.current !== null)
        cancelAnimationFrame(consoleRafRef.current);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        searchBoxRef.current &&
        !searchBoxRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setSearchQuery(urlQ);
  }, [urlQ]);

  // Gọi API Backend thật: GET /api/places?type=RESTAURANT
  useEffect(() => {
    let isMounted = true;
    async function fetchLiveRestaurants() {
      try {
        const res = await getPlaces({ type: "RESTAURANT", limit: 50 });
        if (res && res.items && res.items.length > 0 && isMounted) {
          const livePlaces: CulinaryPlaceItem[] = res.items.map((item) => ({
            id: item.place_id,
            placeId: item.place_id,
            name: item.name,
            badge:
              item.promo_label ||
              (item.avg_rating >= 4.7
                ? "Đặc sản nổi bật"
                : "Món ngon Đà Nẵng"),
            badgeColor: CAT_TINT[item.category_name || ""] || "bg-teal-500",
            badgePulse: item.avg_rating >= 4.8,
            category: item.category_name || "Món ngon",
            location: item.district_name
              ? `${item.district_name}, Đà Nẵng`
              : item.address || "Đà Nẵng",
            rating: Number((item.avg_rating || 4.7).toFixed(1)),
            reviews: item.review_count || 120,
            priceRange: formatPriceRange(item.price_min, item.price_max),
            priceNote: "/món",
            openNow: item.is_open,
            hours: item.today_hours || "08:00–22:00",
            img: item.cover_image || FALLBACK_FOOD_IMG,
            tags: [
              item.district_name || "Đà Nẵng",
              item.category_name || "Ẩm thực",
            ].filter(Boolean),
            description:
              item.description || "Quán ăn ngon nổi tiếng tại Đà Nẵng.",
          }));

          const liveIds = new Set(livePlaces.map((p) => p.id));
          const liveNames = new Set(
            livePlaces.map((p) => removeVietnameseTones(p.name))
          );
          const additionalMock = FOOD_PLACES.filter(
            (p) =>
              !liveIds.has(p.id) &&
              !liveNames.has(removeVietnameseTones(p.name))
          );
          setFoodPlaces([...livePlaces, ...additionalMock]);
        }
      } catch (err) {
        console.warn("API /api/places chưa kết nối, dùng dữ liệu fallback:", err);
      }
    }
    fetchLiveRestaurants();
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleSave = (id: number) => {
    setSavedPlaces((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const applyFilter = useCallback((fn: () => void) => {
    setIsLoading(true);
    fn();
    setCurrentPage(1);
    setTimeout(() => setIsLoading(false), 220);
  }, []);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
    if (val.trim()) {
      setIsDropdownOpen(true);
    }
    const trimmed = val.trim();
    const url = trimmed ? `/amthuc?q=${encodeURIComponent(trimmed)}` : "/amthuc";
    router.replace(url, { scroll: false });
  };

  const handleSelectQuickTag = (tagQuery: string) => {
    setSearchQuery(tagQuery);
    setIsDropdownOpen(false);
    setActiveCategory("Tất cả");
    setCurrentPage(1);
    const url = `/amthuc?q=${encodeURIComponent(tagQuery)}`;
    router.replace(url, { scroll: false });
  };

  const handleClearFilters = () => {
    setActiveCategory("Tất cả");
    setActiveTime("Tất cả khung giờ");
    setActiveDay("Tất cả ngày");
    setSearchQuery("");
    setSortBy("recommended");
    setNearMe(false);
    setOnlyOpenNow(false);
    setIsDropdownOpen(false);
    setCurrentPage(1);
    router.replace("/amthuc", { scroll: false });
  };

  const matchingSuggestions = useMemo(() => {
    const qTrim = searchQuery.trim();
    if (!qTrim) return [];
    const qNorm = removeVietnameseTones(qTrim);

    return foodPlaces
      .filter((place) => {
        const haystack = removeVietnameseTones(
          `${place.name} ${place.location} ${place.category} ${place.description} ${place.tags.join(" ")}`
        );
        return haystack.includes(qNorm);
      })
      .slice(0, 5);
  }, [foodPlaces, searchQuery]);

  const filtered = useMemo(() => {
    const qTrim = searchQuery.trim();
    const qNorm = removeVietnameseTones(qTrim);

    let result = foodPlaces.filter((p) => {
      if (activeCategory !== "Tất cả" && p.category !== activeCategory) {
        return false;
      }
      if (onlyOpenNow && !p.openNow) {
        return false;
      }
      if (!matchesTimeWindow(p.hours, activeTime)) {
        return false;
      }
      if (qTrim) {
        const haystack = removeVietnameseTones(
          `${p.name} ${p.location} ${p.category} ${p.description} ${p.tags.join(" ")}`
        );
        if (!haystack.includes(qNorm)) return false;
      }
      return true;
    });

    if (sortBy === "rating")
      result = [...result].sort((a, b) => b.rating - a.rating);
    if (sortBy === "reviews")
      result = [...result].sort((a, b) => b.reviews - a.reviews);
    if (sortBy === "name")
      result = [...result].sort((a, b) => a.name.localeCompare(b.name, "vi"));

    return result;
  }, [foodPlaces, activeCategory, activeTime, onlyOpenNow, searchQuery, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PLACES_PER_PAGE));
  const paginated = filtered.slice(
    (currentPage - 1) * PLACES_PER_PAGE,
    currentPage * PLACES_PER_PAGE
  );

  const changePage = (p: number) => {
    setIsLoading(true);
    setCurrentPage(p);
    setTimeout(() => {
      setIsLoading(false);
      document
        .getElementById("food-grid")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 220);
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

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
      activeCategory !== "Tất cả" ||
      activeTime !== "Tất cả khung giờ" ||
      activeDay !== "Tất cả ngày" ||
      sortBy !== "recommended" ||
      nearMe ||
      onlyOpenNow
  );

  const showTastingShowcase =
    !isLoading &&
    !searchQuery.trim() &&
    currentPage === 1 &&
    filtered.length >= 2;

  return (
    <div
      ref={pageContainerRef}
      className="dananggo-cinematic-content relative min-h-screen bg-[#06151C] text-[#FFFDF5] flex flex-col overflow-x-clip"
    >
      {/* Nocturnal Gastronomy Atmospheric Backdrop */}
      <CulinaryAmbientBackdrop
        activeCategory={activeCategory}
        containerRef={pageContainerRef}
      />

      {/* ═══ PHẦN 1: CINEMATIC COASTAL GASTRONOMY HERO ═══ */}
      <section
        ref={heroRef}
        data-navbar-overlay="true"
        aria-label="Ẩm thực Đà Nẵng"
        className="relative z-10 w-full h-[460px] sm:h-[510px] lg:h-[540px] overflow-hidden select-none bg-[#06151C] flex items-end"
      >
        <motion.div
          style={{ y: heroY }}
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
            src={AM_THUC_HERO_IMAGE}
            alt="Món ngon ẩm thực đặc sản Đà Nẵng"
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
              "linear-gradient(180deg, rgba(6,21,28,0.72) 0%, rgba(8,26,35,0.30) 40%, rgba(7,22,30,0.56) 72%, rgba(6,21,28,0.86) 90%, #06151C 100%)",
          }}
        />

        {/* Hero Typography & Bottom-Right Curated Pill (clears fixed top-right Weather pill) */}
        <div className="relative z-10 home-container w-full pb-24 sm:pb-28 pt-28">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-xs sm:text-sm text-[#CBD9DA]/82 mb-4"
          >
            <Link href="/" className="hover:text-[#FFFDF5] transition-colors">
              Trang chủ
            </Link>
            <ChevronRight size={14} className="text-[#E6D9B7]/50" />
            <span className="text-[#E6D9B7] font-medium">Ẩm thực Đà Nẵng</span>
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
                <Utensils size={13} className="text-[#E6D9B7]" />
                <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-[#E6D9B7]">
                  BẢN ĐỒ VỊ GIÁC MIỀN TRUNG
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
                className="cinematic-condensed uppercase font-bold text-[#FFFDF5] text-[clamp(2.45rem,5.4vw,4.85rem)] leading-[1.0] tracking-[-0.02em]"
              >
                Ẩm Thực{" "}
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
                <span>Đậm đà phong vị miền Trung với</span>
                <AnimatedCounter
                  to={TOTAL_DISPLAY}
                  suffix="+ quán ăn, đặc sản & hải sản được tuyển chọn."
                  className="text-[#E6D9B7] font-semibold"
                  duration={1.2}
                />
              </motion.p>
            </div>

            <motion.div
              initial={reducedMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.28, ease: EASING.standard }}
              className="hidden lg:flex flex-col items-end text-right shrink-0 pb-1"
            >
              <span className="text-[10.5px] font-mono uppercase tracking-[0.22em] text-[#E6D9B7]/85">
                DANANG GASTRONOMY ARCHIVE
              </span>
              <span className="mt-1.5 inline-flex items-center gap-2 rounded-full bg-[#06151C]/62 backdrop-blur-md border border-[#E6D9B7]/30 px-3.5 py-1.5 text-xs font-medium text-[#FFFDF5]">
                <CheckCircle size={13} className="text-[#E87B39]" />
                <span>Được tuyển chọn &amp; xác minh bởi DanangGo</span>
              </span>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ PHẦN 2: FROSTED SMOKED GLASS GASTRONOMY CONSOLE ═══ */}
      <div className="relative z-30 home-container -mt-16 sm:-mt-20 mb-12 w-full">
        <motion.div
          ref={consoleRef}
          onMouseMove={handleConsoleMove}
          onMouseLeave={handleConsoleLeave}
          initial={reducedMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.58, delay: 0.2, ease: EASING.standard }}
          className="amthuc-console-glass relative rounded-[22px] bg-gradient-to-br from-[#0F2C38]/40 via-[#081D27]/30 to-[#06161F]/44 backdrop-blur-2xl backdrop-saturate-150 border border-[#E6D9B7]/28 p-5 sm:p-6 lg:p-7 shadow-[0_24px_64px_rgba(2,10,15,0.45),inset_0_1px_0_rgba(255,253,245,0.18),inset_0_-1px_0_rgba(230,217,183,0.08)] flex flex-col gap-5"
        >
          {/* Clipped specular & sheen layer (so search dropdown overflows cleanly) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden"
          >
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#FFFDF5]/45 to-transparent" />
            <div className="absolute inset-x-10 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-[#E6D9B7]/22 to-transparent" />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,253,245,0.07) 0%, rgba(255,253,245,0.015) 38%, rgba(6,21,28,0.14) 100%)",
              }}
            />
            <div className="amthuc-console-spotlight absolute inset-0" />
            <span className="absolute top-3 left-3 w-2.5 h-2.5 border-t border-l border-[#E6D9B7]/45 rounded-tl-[3px]" />
            <span className="absolute top-3 right-3 w-2.5 h-2.5 border-t border-r border-[#E6D9B7]/45 rounded-tr-[3px]" />
            <span className="absolute bottom-3 left-3 w-2.5 h-2.5 border-b border-l border-[#E6D9B7]/45 rounded-bl-[3px]" />
            <span className="absolute bottom-3 right-3 w-2.5 h-2.5 border-b border-r border-[#E6D9B7]/45 rounded-br-[3px]" />
          </div>

          {/* HÀNG 1: THANH TÌM KIẾM TRỰC TIẾP + DROPDOWN GỢI Ý + CHIPS MÓN HOT */}
          <div ref={searchBoxRef} className="relative z-20 w-full">
            <div
              className={`relative flex items-center rounded-full border backdrop-blur-md transition-all duration-300 ${
                isSearchFocused
                  ? "border-[#E6D9B7]/72 bg-[#06151C]/60 shadow-[0_0_0_3px_rgba(230,217,183,0.10)]"
                  : "border-[#E6D9B7]/24 bg-[#06151C]/36 hover:border-[#E6D9B7]/44"
              }`}
            >
              <span
                aria-hidden="true"
                className={`ml-2.5 w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-300 shrink-0 ${
                  isSearchFocused
                    ? "bg-[#E87B39]/20 border-[#E87B39]/60 text-[#F3D299]"
                    : "bg-[#FFF8E9]/[0.07] border-[#E6D9B7]/24 text-[#E6D9B7]"
                }`}
              >
                <Search size={16} />
              </span>

              <input
                type="text"
                value={searchQuery}
                onFocus={() => {
                  setIsSearchFocused(true);
                  if (searchQuery.trim()) setIsDropdownOpen(true);
                }}
                onBlur={() => setIsSearchFocused(false)}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Nhập tên quán ăn, món ngon (ví dụ: Bé Mặn, Mì Quảng, Bánh xèo, Bún chả cá)..."
                aria-label="Tìm kiếm quán ăn hoặc món ngon"
                className="w-full bg-transparent py-3.5 pl-3.5 pr-12 text-sm sm:text-[15px] font-medium text-[#FFFDF5] placeholder:text-[#BFD1D3]/62 outline-none"
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleSearchChange("")}
                  className="mr-2.5 inline-flex items-center gap-1 rounded-full bg-white/10 hover:bg-white/18 border border-[#E6D9B7]/25 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#FFFDF5] transition cursor-pointer shrink-0"
                  title="Xóa từ khóa"
                  aria-label="Xóa từ khóa tìm kiếm"
                >
                  <span>Xóa</span>
                  <X size={13} />
                </button>
              )}
            </div>

            {/* DARK SMOKED GLASS DROPDOWN GỢI Ý TỨC THÌ */}
            <AnimatePresence>
              {isDropdownOpen && searchQuery.trim() && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.985 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.985 }}
                  transition={{ duration: 0.18 }}
                  className="absolute top-full left-0 right-0 mt-2.5 rounded-[18px] bg-[#071821]/96 backdrop-blur-xl shadow-[0_28px_70px_rgba(2,10,15,0.68)] border border-[#E6D9B7]/30 overflow-hidden z-50 p-3 divide-y divide-[#E6D9B7]/14"
                >
                  {matchingSuggestions.length > 0 ? (
                    <>
                      <div className="px-3 py-2 text-[11px] font-mono uppercase tracking-[0.16em] text-[#E6D9B7]/80 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Sparkles size={13} className="text-[#E87B39]" />
                          Quán ăn khớp tức thì ({matchingSuggestions.length})
                        </span>
                        <span className="text-[#CBD9DA]/60 hidden sm:inline">
                          Nhấn để mở thực đơn chi tiết
                        </span>
                      </div>
                      <div className="space-y-1 pt-2">
                        {matchingSuggestions.map((item) => (
                          <Link
                            key={item.id}
                            href={`/places/${item.id}`}
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-3.5 p-2.5 rounded-[12px] hover:bg-white/[0.06] transition-colors group"
                          >
                            <div className="relative w-14 h-14 rounded-[10px] overflow-hidden shrink-0 border border-[#E6D9B7]/22 bg-[#051219]">
                              <Image
                                src={item.img}
                                alt={item.name}
                                fill
                                unoptimized={item.img.startsWith("http")}
                                className="object-cover group-hover:scale-110 transition-transform duration-300"
                                sizes="56px"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-[#FFFDF5] group-hover:text-[#F5E6C4] text-sm truncate transition-colors">
                                  {item.name}
                                </h4>
                                <span className="px-2 py-0.5 text-[10px] font-semibold bg-white/[0.08] text-[#E6D9B7] rounded-full shrink-0 border border-[#E6D9B7]/25">
                                  {item.category}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-[#CBD9DA]/75">
                                <span className="flex items-center gap-1">
                                  <MapPin
                                    size={12}
                                    className="text-[#C9B580]"
                                  />{" "}
                                  {item.location}
                                </span>
                                <span className="flex items-center gap-1 text-[#F6B27B] font-semibold">
                                  <Star
                                    size={11.5}
                                    className="fill-[#E87B39] text-[#E87B39]"
                                  />{" "}
                                  {item.rating}
                                </span>
                                <span className="text-[#7FD1C8] font-medium">
                                  {item.priceRange}
                                </span>
                              </div>
                            </div>
                            <div className="shrink-0 hidden sm:flex items-center gap-1.5 bg-[#FFF8E9] group-hover:bg-white text-[#102832] text-xs font-semibold px-3.5 py-2 rounded-full transition-colors">
                              <span>Xem chi tiết</span>
                              <ArrowRight
                                size={13}
                                className="text-[#CB712D] group-hover:translate-x-0.5 transition-transform"
                              />
                            </div>
                          </Link>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="p-6 text-center text-sm text-[#CBD9DA]/80">
                      Không tìm thấy quán ăn nào khớp với từ khóa &ldquo;
                      <strong className="text-[#FFFDF5]">{searchQuery}</strong>
                      &rdquo;.
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* CHIPS QUÁN & MÓN NỔI BẬT */}
            <div className="flex items-center gap-2 mt-3 overflow-x-auto hide-scrollbar pt-0.5">
              <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#E6D9B7]/70 shrink-0 flex items-center gap-1.5">
                <Sparkles size={12} className="text-[#E87B39]" /> Món nổi bật:
              </span>
              {POPULAR_FOOD_TAGS.map((tag) => {
                const isTagActive =
                  removeVietnameseTones(searchQuery) ===
                  removeVietnameseTones(tag.query);
                return (
                  <button
                    key={tag.label}
                    type="button"
                    onClick={() => handleSelectQuickTag(tag.query)}
                    className={`text-xs px-3 py-1 rounded-full font-medium transition-all shrink-0 border cursor-pointer ${
                      isTagActive
                        ? "bg-[#FFF8E9] text-[#102832] border-[#FFF8E9] shadow-sm"
                        : "bg-[#FFF8E9]/[0.07] hover:bg-[#FFF8E9]/[0.15] text-[#DCE8E8] hover:text-[#FFFDF5] border-[#E6D9B7]/20 hover:border-[#E6D9B7]/50"
                    }`}
                  >
                    {tag.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* HÀNG 2: DANH MỤC MÓN ĂN + VIEW SWITCHER (THẺ MÓN ⇄ THỰC ĐƠN) */}
          <div className="relative z-10 pt-4 border-t border-[#E6D9B7]/14 flex flex-wrap items-center justify-between gap-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10.5px] font-mono uppercase tracking-[0.18em] text-[#E6D9B7]/72 mr-1 hidden md:inline">
                Danh mục:
              </span>
              <LayoutGroup id="amthuc-cat">
                <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-full bg-[#051218]/36 backdrop-blur-md border border-[#E6D9B7]/20">
                  {CATEGORY_TABS.map((cat) => {
                    const active = activeCategory === cat.key;
                    return (
                      <button
                        key={cat.key}
                        type="button"
                        aria-pressed={active}
                        onClick={() =>
                          applyFilter(() => setActiveCategory(cat.key))
                        }
                        className={`relative inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors duration-200 cursor-pointer ${
                          active
                            ? "text-[#102832]"
                            : "text-[#D4E3E4] hover:text-[#FFFDF5] hover:bg-white/[0.06]"
                        }`}
                      >
                        {active && (
                          <motion.div
                            layoutId="active-cat-amthuc"
                            className="absolute inset-0 rounded-full bg-gradient-to-b from-[#FFFDF5] to-[#F3E7CE] shadow-[0_6px_16px_rgba(3,12,17,0.38)]"
                            style={{ zIndex: 0 }}
                            transition={SPRING.snappy}
                          />
                        )}
                        <span
                          className={`relative z-10 w-1.5 h-1.5 rounded-full ${
                            active ? "bg-[#CB712D]" : cat.dot
                          }`}
                        />
                        <span className="relative z-10">{cat.key}</span>
                      </button>
                    );
                  })}
                </div>
              </LayoutGroup>
            </div>

            {/* View Mode Toggle: Thẻ món ⇄ Thực đơn */}
            <div
              className="inline-flex items-center gap-1 p-1 rounded-full bg-[#051218]/36 backdrop-blur-md border border-[#E6D9B7]/20 ml-auto"
              role="group"
              aria-label="Chế độ hiển thị ẩm thực"
            >
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                aria-pressed={viewMode === "cards"}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-all cursor-pointer ${
                  viewMode === "cards"
                    ? "bg-[#FFF8E9]/16 text-[#FFFDF5] border border-[#E6D9B7]/42"
                    : "text-[#CBD9DA]/72 hover:text-[#FFFDF5] border border-transparent"
                }`}
              >
                <LayoutGrid size={12.5} className="text-[#E6D9B7]" />
                <span>Thẻ món</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("menu")}
                aria-pressed={viewMode === "menu"}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-all cursor-pointer ${
                  viewMode === "menu"
                    ? "bg-[#FFF8E9]/16 text-[#FFFDF5] border border-[#E6D9B7]/42"
                    : "text-[#CBD9DA]/72 hover:text-[#FFFDF5] border border-transparent"
                }`}
              >
                <List size={12.5} className="text-[#E6D9B7]" />
                <span>Thực đơn</span>
              </button>
            </div>
          </div>

          {/* HÀNG 3: KHUNG GIỜ + NGÀY + SẮP XẾP + GẦN TÔI + ĐANG MỞ CỬA + XÓA BỘ LỌC */}
          <div className="relative z-10 pt-4 border-t border-[#E6D9B7]/14 flex flex-wrap items-center gap-2.5 justify-between">
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              {/* Khung giờ */}
              <div className="flex items-center gap-1.5 rounded-full bg-[#051218]/44 border border-[#E6D9B7]/22 px-3 py-1.5">
                <Clock size={13} className="text-[#E6D9B7]/85 shrink-0" />
                <select
                  aria-label="Lọc theo khung giờ"
                  value={activeTime}
                  onChange={(e) =>
                    applyFilter(() => setActiveTime(e.target.value))
                  }
                  className="bg-transparent text-xs text-[#FFFDF5] focus:outline-none font-medium cursor-pointer"
                >
                  {TIME_FILTERS.map((t) => (
                    <option
                      key={t}
                      value={t}
                      className="bg-[#071821] text-[#FFFDF5]"
                    >
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ngày */}
              <div className="flex items-center gap-1.5 rounded-full bg-[#051218]/44 border border-[#E6D9B7]/22 px-3 py-1.5">
                <Calendar size={13} className="text-[#C9B580] shrink-0" />
                <select
                  aria-label="Lọc theo ngày"
                  value={activeDay}
                  onChange={(e) =>
                    applyFilter(() => setActiveDay(e.target.value))
                  }
                  className="bg-transparent text-xs text-[#FFFDF5] focus:outline-none font-medium cursor-pointer"
                >
                  {DAY_FILTERS.map((d) => (
                    <option
                      key={d}
                      value={d}
                      className="bg-[#071821] text-[#FFFDF5]"
                    >
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sắp xếp */}
              <div className="flex items-center gap-1.5 rounded-full bg-[#051218]/44 border border-[#E6D9B7]/22 px-3 py-1.5">
                <ArrowUpDown size={13} className="text-[#E87B39] shrink-0" />
                <select
                  aria-label="Sắp xếp địa điểm ẩm thực"
                  value={sortBy}
                  onChange={(e) =>
                    applyFilter(() => setSortBy(e.target.value))
                  }
                  className="bg-transparent text-xs text-[#FFFDF5] focus:outline-none font-medium cursor-pointer"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option
                      key={o.value}
                      value={o.value}
                      className="bg-[#071821] text-[#FFFDF5]"
                    >
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Chỉ đang mở cửa */}
              <button
                type="button"
                aria-pressed={onlyOpenNow}
                onClick={() =>
                  applyFilter(() => setOnlyOpenNow((prev) => !prev))
                }
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all cursor-pointer ${
                  onlyOpenNow
                    ? "bg-[#216B70] text-[#FFFDF5] border-[#69A5A3] shadow-sm"
                    : "bg-[#216B70]/22 text-[#A7E4DF] border-[#69A5A3]/35 hover:bg-[#216B70]/38"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#7FD1C8]" />
                <span>Đang mở cửa</span>
              </button>

              {/* Gần tôi nhất */}
              <button
                type="button"
                aria-pressed={nearMe}
                onClick={() => applyFilter(() => setNearMe(!nearMe))}
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all cursor-pointer ${
                  nearMe
                    ? "bg-[#E87B39] text-[#FFFDF5] border-[#F6B27B] shadow-sm"
                    : "bg-[#E87B39]/16 text-[#FAD0A8] border-[#E87B39]/38 hover:bg-[#E87B39]/30"
                }`}
              >
                <Navigation size={12} />
                <span>Gần tôi nhất</span>
              </button>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="flex items-center gap-1.5 text-xs font-semibold text-red-200 hover:text-white bg-red-500/20 hover:bg-red-500/35 border border-red-400/40 transition-colors px-3.5 py-1.5 rounded-full shrink-0 cursor-pointer"
                title="Đặt lại toàn bộ bộ lọc"
              >
                <RefreshCw size={12.5} />
                <span>Xóa bộ lọc</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>

      {/* ═══ PHẦN 3: NỘI DUNG ẨM THỰC ═══ */}
      <main className="relative z-10 home-container w-full flex-1">
        {/* TIER 1: CHEF'S TASTING SHOWCASE */}
        {showTastingShowcase && <CulinaryTastingShowcase places={filtered} />}

        {/* TIER 2 HEADER: CHƯƠNG 02 */}
        <div
          id="food-grid"
          className="scroll-mt-28 flex flex-wrap items-end justify-between gap-4 pb-5 mb-7 border-b border-[#E6D9B7]/16"
        >
          <div>
            <div className="inline-flex items-center gap-2.5 text-[10.5px] font-mono uppercase tracking-[0.24em] text-[#E6D9B7] mb-1.5">
              <span className="w-6 h-[1px] bg-[#E87B39]" />
              <span>
                CHƯƠNG 02 //{" "}
                {viewMode === "cards"
                  ? "BỘ SƯU TẬP QUÁN NGON ĐÀ NẴNG"
                  : "THỰC ĐƠN MỤC LỤC TINH GỌN"}
              </span>
            </div>
            <h2 className="home-serif text-2xl sm:text-3xl font-semibold text-[#FFFDF5] leading-tight">
              {viewMode === "cards" ? (
                <>
                  Hương vị{" "}
                  <span className="italic font-normal text-[#E6D9B7]">
                    xứ Quảng &amp; biển khơi
                  </span>
                </>
              ) : (
                <>
                  Bảng vị giác{" "}
                  <span className="italic font-normal text-[#E6D9B7]">
                    Đà Nẵng theo khung giờ
                  </span>
                </>
              )}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <p className="text-xs sm:text-sm text-[#CBD9DA]/82">
              Hiển thị{" "}
              <span className="font-mono font-bold text-[#FFFDF5]">
                {filtered.length > 0
                  ? (currentPage - 1) * PLACES_PER_PAGE + 1
                  : 0}
                –{Math.min(currentPage * PLACES_PER_PAGE, filtered.length)}
              </span>{" "}
              /{" "}
              <span className="font-mono font-bold text-[#E6D9B7]">
                {filtered.length}
              </span>{" "}
              địa điểm ẩm thực
              {searchQuery && (
                <span>
                  {" "}
                  cho &ldquo;
                  <strong className="text-[#F6B27B]">{searchQuery}</strong>
                  &rdquo;
                </span>
              )}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                className="text-xs text-[#F6B27B] hover:text-[#FFFDF5] font-semibold underline underline-offset-4 cursor-pointer"
              >
                Hiển thị tất cả
              </button>
            )}
          </div>
        </div>

        {/* FOOD COLLECTION */}
        <div>
          {isLoading ? (
            <div
              role="status"
              aria-label="Đang tải danh sách ẩm thực"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <FoodSkeleton key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 bg-[#081C25]/82 backdrop-blur-md rounded-[22px] border border-[#E6D9B7]/22 p-8 max-w-lg mx-auto">
              <SearchX className="w-12 h-12 text-[#E6D9B7]/60 mx-auto mb-3 stroke-[1.5]" />
              <h3 className="home-serif text-xl font-semibold text-[#FFFDF5]">
                Không tìm thấy quán ăn phù hợp
              </h3>
              <p className="text-[#CBD9DA]/76 text-sm mt-2 leading-relaxed">
                Không có địa điểm nào khớp với bộ lọc hiện tại
                {searchQuery ? ` cho từ khóa "${searchQuery}"` : ""}. Hãy thử
                món khác hoặc xóa bộ lọc nhé!
              </p>
              <button
                type="button"
                onClick={handleClearFilters}
                className="mt-6 px-6 py-2.5 bg-[#FFF8E9] hover:bg-white text-[#102832] rounded-full text-xs font-semibold uppercase tracking-[0.12em] transition cursor-pointer"
              >
                Xem lại tất cả quán ăn
              </button>
            </div>
          ) : viewMode === "menu" ? (
            <CulinaryMenuIndex
              places={paginated}
              savedPlaces={savedPlaces}
              onToggleSave={toggleSave}
              startIndex={(currentPage - 1) * PLACES_PER_PAGE}
            />
          ) : (
            <div
              key={`food-${currentPage}-${activeCategory}-${activeTime}-${onlyOpenNow}-${searchQuery}-${sortBy}`}
              className="event-ticket-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7"
            >
              {paginated.map((place, i) => (
                <motion.div
                  key={place.id}
                  initial={reducedMotion ? false : { opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.36,
                    delay: reducedMotion ? 0 : i * 0.05,
                    ease: EASING.standard,
                  }}
                  className="h-full"
                >
                  <FoodCard
                    place={place}
                    saved={savedPlaces.has(place.id)}
                    onSave={() => toggleSave(place.id)}
                    index={(currentPage - 1) * PLACES_PER_PAGE + i}
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
                <span>CHUẨN BẢN ĐỊA DANANGGO</span>
                <span className="w-5 h-[1px] bg-[#E87B39]" />
              </span>
              <h2 className="home-serif text-2xl sm:text-3xl font-semibold text-[#FFFDF5]">
                Vì sao chọn ẩm thực trên{" "}
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

        {/* ═══ PHẦN 6: CLOSING CULINARY CTA BANNER ═══ */}
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
                  <span>LÊN KẾ HOẠCH ẨM THỰC NGAY HÔM NAY</span>
                </div>

                <h2 className="home-serif text-2xl sm:text-4xl font-semibold text-[#FFFDF5] leading-snug mb-3">
                  Đã tìm được món ngon ưng ý?{" "}
                  <span className="italic font-normal text-[#E6D9B7]">
                    Thêm vào lịch trình ngay!
                  </span>
                </h2>
                <p className="text-[#CBD9DA]/82 max-w-lg mx-auto mb-8 text-sm leading-relaxed">
                  DanangGo giúp bạn lập hành trình ẩm thực trọn vẹn — kết hợp
                  quán ăn, địa điểm tham quan và lưu trú thành một chuyến đi
                  hoàn hảo tại Đà Nẵng.
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
                    href="/diemdulich"
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

export default function AmThucPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#06151C] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#E87B39]" />
            <p className="text-sm font-medium text-[#E6D9B7]">
              Đang tải bản đồ ẩm thực...
            </p>
          </div>
        </div>
      }
    >
      <AmThucContent />
    </Suspense>
  );
}
