'use client';

import Image from 'next/image';
import { useState, useCallback, useRef, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getPlaces } from '@/lib/api/places';
import { formatPriceRange } from '@/lib/mappers/place.mapper';
import { motion, AnimatePresence, LayoutGroup, useScroll, useTransform } from 'framer-motion';
import {
  ChevronRight,
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
} from 'lucide-react';
import Reveal from '@/components/ui/Reveal';
import AnimatedCounter from '@/components/ui/AnimatedCounter';

// Helper chuẩn hóa tiếng Việt không dấu
function removeVietnameseTones(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA — Danh sách địa điểm ẩm thực (Đồng bộ với CSDL SQL Server Task 7)
// ─────────────────────────────────────────────────────────────────────────────
interface FoodPlace {
  id: number;
  name: string;
  badge: string;
  badgeColor: string;
  badgePulse: boolean;
  category: string;
  location: string;
  rating: number;
  reviews: number;
  priceRange: string;
  priceNote: string;
  openNow: boolean;
  hours: string;
  img: string;
  tags: string[];
  description: string;
}

const FOOD_PLACES: FoodPlace[] = [
  // Quán ăn đồng bộ với CSDL Task 7
  {
    id: 96,
    name: 'Hải Sản Bé Mặn',
    badge: 'Hải sản tươi sống',
    badgeColor: 'bg-teal-500',
    badgePulse: true,
    category: 'Hải sản',
    location: 'Sơn Trà, Đà Nẵng',
    rating: 4.7,
    reviews: 2890,
    priceRange: '70.000đ–180.000đ',
    priceNote: '/món',
    openNow: true,
    hours: '09:00–23:59',
    img: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&q=80',
    tags: ['Hải sản tươi sống', 'Sơn Trà', 'Chip chip hấp', 'Mực lá nướng'],
    description: 'Quán hải sản bình dân đông đúc nhất dọc bãi biển Sơn Trà, hải sản tươi rói vừa cập bến ghe tàu.',
  },
  {
    id: 95,
    name: 'Bún Chả Cá Hờn',
    badge: 'Bún chả cá trứ danh',
    badgeColor: 'bg-blue-500',
    badgePulse: false,
    category: 'Bún chả cá',
    location: 'Hải Châu, Đà Nẵng',
    rating: 4.8,
    reviews: 1780,
    priceRange: '40.000đ–45.000đ',
    priceNote: '/tô',
    openNow: true,
    hours: '06:00–22:00',
    img: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600&q=80',
    tags: ['Bún chả cá', 'Hải Châu', 'Chả cá thu', 'Gia truyền'],
    description: 'Thương hiệu bún chả cá lâu năm nổi danh xứ Đà với nước dùng ngọt lịm từ bí đỏ và chả cá thu dai giòn.',
  },
  {
    id: 94,
    name: 'Cơm Niêu Nhà Đỏ Đà Nẵng',
    badge: 'Cơm niêu gia truyền',
    badgeColor: 'bg-purple-500',
    badgePulse: false,
    category: 'Cơm nhà',
    location: 'Hải Châu, Đà Nẵng',
    rating: 4.7,
    reviews: 1650,
    priceRange: '35.000đ–95.000đ',
    priceNote: '/món',
    openNow: true,
    hours: '10:00–22:00',
    img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80',
    tags: ['Cơm niêu đập', 'Cá bống kho tộ', 'Cơm nhà ấm cúng'],
    description: 'Cơm niêu đập cháy giòn rụm ăn kèm cá bống sông Trà kho tộ và canh cua đồng đậm đà hương vị quê hương.',
  },
  {
    id: 93,
    name: 'Mì Quảng 1A Hải Phòng',
    badge: 'Mì Quảng số 1',
    badgeColor: 'bg-amber-500',
    badgePulse: true,
    category: 'Mì Quảng',
    location: 'Hải Châu, Đà Nẵng',
    rating: 4.8,
    reviews: 2450,
    priceRange: '45.000đ–55.000đ',
    priceNote: '/tô',
    openNow: true,
    hours: '06:00–21:30',
    img: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600&q=80',
    tags: ['Mì Quảng tôm thịt', 'Ếch đồng', 'Đặc sản Đà Nẵng'],
    description: 'Địa chỉ mì Quảng nức tiếng với sợi mì gạo vàng óng, nước nhưn tôm thịt rim đậm đà và bánh tráng mè nướng.',
  },
  {
    id: 92,
    name: 'Bánh Xèo Bà Dưỡng',
    badge: 'Đặc sản số 1',
    badgeColor: 'bg-red-500',
    badgePulse: true,
    category: 'Bánh xèo',
    location: 'Hải Châu, Đà Nẵng',
    rating: 4.9,
    reviews: 3120,
    priceRange: '60.000đ–75.000đ',
    priceNote: '/phần',
    openNow: true,
    hours: '09:30–21:30',
    img: 'https://images.unsplash.com/photo-1600850056064-a8b380df8395?w=600&q=80',
    tags: ['Bánh xèo giòn rụm', 'Nước chấm gan heo mè', 'Nem lụi than hoa'],
    description: 'Huyền thoại ẩm thực hẻm Hoàng Diệu, bánh xèo vàng ươm giòn tan cuộn rau sống chấm nước sốt gan heo béo bùi.',
  },
  {
    id: 1,
    name: 'Hải Sản Tươi Sống Mỹ Khê',
    badge: 'Hải sản ven biển',
    badgeColor: 'bg-teal-500',
    badgePulse: false,
    category: 'Hải sản',
    location: 'Ngũ Hành Sơn, Đà Nẵng',
    rating: 4.8,
    reviews: 1250,
    priceRange: '45.000đ–500.000đ',
    priceNote: '/món',
    openNow: true,
    hours: '09:00–23:30',
    img: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=600&q=80',
    tags: ['Tôm hùm bơ tỏi', 'Cua huỳnh đế', 'View biển Mỹ Khê'],
    description: 'Nhà hàng hải sản uy tín bậc nhất ven biển Mỹ Khê, bắt trực tiếp từ hồ kính chế biến theo phong vị miền Trung.',
  },
  {
    id: 2,
    name: 'Bánh Tráng Cuốn Thịt Heo Trần',
    badge: 'Đặc sản nổi tiếng',
    badgeColor: 'bg-red-500',
    badgePulse: true,
    category: 'Bánh tráng cuốn',
    location: 'Hải Châu, Đà Nẵng',
    rating: 4.8,
    reviews: 1893,
    priceRange: '60.000đ–120.000đ',
    priceNote: '/phần',
    openNow: true,
    hours: '10:00–22:00',
    img: 'https://images.unsplash.com/photo-1561189386-42f49bcc29ef?w=600&q=80',
    tags: ['Thịt heo 2 đầu da', 'Mắm nêm nguyên chất', 'Rau rừng'],
    description: 'Điểm đến ẩm thực trứ danh khi đến Đà Nẵng, thịt heo luộc 2 đầu da cuốn bánh tráng Đại Lộc chấm mắm nêm thơm nồng.',
  },
  {
    id: 5,
    name: 'Bánh Mì Bà Lan',
    badge: 'Quán hẻm nổi tiếng',
    badgeColor: 'bg-purple-500',
    badgePulse: false,
    category: 'Bánh mì',
    location: 'Hải Châu, Đà Nẵng',
    rating: 4.9,
    reviews: 3241,
    priceRange: '15.000đ–25.000đ',
    priceNote: '/ổ',
    openNow: true,
    hours: '06:00–21:00',
    img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
    tags: ['Bánh mì chả bò', 'Pate béo ngậy', 'Đông khách'],
    description: 'Huyền thoại bánh mì Đà Nẵng, vỏ giòn ruột mềm nhân chả bò, thịt nguội và pate béo ngậy đặc trưng.',
  },
  {
    id: 6,
    name: 'Cà Phê Sân Thượng Việt Ơi',
    badge: 'Check-in sông Hàn',
    badgeColor: 'bg-pink-500',
    badgePulse: false,
    category: 'Cà phê',
    location: 'Hải Châu, Đà Nẵng',
    rating: 4.7,
    reviews: 1876,
    priceRange: '35.000đ–75.000đ',
    priceNote: '/ly',
    openNow: true,
    hours: '07:00–22:30',
    img: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=80',
    tags: ['View sông Hàn', 'Cà phê muối', 'Decor vintage'],
    description: 'Không gian cà phê sân thượng ngắm trọn cầu Rồng và cầu sông Hàn lung linh ánh đèn về đêm.',
  },
  {
    id: 3,
    name: 'Cao Lầu Hội An Giao Lưu',
    badge: 'Đặc sản xứ Quảng',
    badgeColor: 'bg-amber-500',
    badgePulse: false,
    category: 'Cao lầu',
    location: 'Sơn Trà, Đà Nẵng',
    rating: 4.7,
    reviews: 543,
    priceRange: '40.000đ–65.000đ',
    priceNote: '/tô',
    openNow: true,
    hours: '08:00–20:00',
    img: 'https://images.unsplash.com/photo-1551326844-4df70f78d0e9?w=600&q=80',
    tags: ['Cao lầu chính hiệu', 'Thịt xá xíu', 'Rau Trà Quế'],
    description: 'Cao lầu sợi to dai sần sật, xá xíu thơm lừng hòa quyện rau sống Trà Quế giòn mát ngay giữa lòng Đà Nẵng.',
  },
  {
    id: 4,
    name: 'Mì Hoành Thánh Tàu Bay',
    badge: 'Ẩm thực người Hoa',
    badgeColor: 'bg-red-500',
    badgePulse: false,
    category: 'Mì Quảng',
    location: 'Thanh Khê, Đà Nẵng',
    rating: 4.5,
    reviews: 876,
    priceRange: '35.000đ–55.000đ',
    priceNote: '/tô',
    openNow: true,
    hours: '07:00–20:00',
    img: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80',
    tags: ['Hoành thánh mỏng vỏ', 'Nước dùng thanh ngọt', 'Lâu đời'],
    description: 'Mì hoành thánh chuẩn phong cách người Hoa tồn tại hơn 50 năm, nước dùng trong vắt thanh tao.',
  },
  {
    id: 21,
    name: 'Chả Bò Huỳnh Thúc Kháng',
    badge: 'Đặc sản làm quà',
    badgeColor: 'bg-amber-500',
    badgePulse: false,
    category: 'Chả bò',
    location: 'Hải Châu, Đà Nẵng',
    rating: 4.9,
    reviews: 1234,
    priceRange: '50.000đ–150.000đ',
    priceNote: '/đòn',
    openNow: true,
    hours: '08:00–18:00',
    img: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&q=80',
    tags: ['Chả bò nguyên chất', 'Tiêu sọ cay nồng', 'Quà tặng Đà Nẵng'],
    description: 'Chả bò loại 1 thơm lừng tiêu sọ cay nồng, dai giòn sần sật, món quà biếu ý nghĩa khi đến Đà Nẵng.',
  },
];

const TOTAL_DISPLAY = 96;
const PLACES_PER_PAGE = 6;

const CATEGORIES = [
  'Tất cả',
  'Mì Quảng',
  'Bánh tráng cuốn',
  'Bún chả cá',
  'Hải sản',
  'Cà phê',
  'Bánh xèo',
  'Cơm nhà',
];

const CAT_TINT: Record<string, string> = {
  'Mì Quảng': 'bg-amber-500',
  'Bánh tráng cuốn': 'bg-red-500',
  'Bún chả cá': 'bg-blue-500',
  'Hải sản': 'bg-teal-500',
  'Cà phê': 'bg-pink-500',
  'Bánh xèo': 'bg-orange-500',
  'Cơm nhà': 'bg-purple-500',
  'Tất cả': 'bg-gray-800',
};

const POPULAR_FOOD_TAGS = [
  { label: 'Hải Sản Bé Mặn', query: 'bé mặn' },
  { label: 'Mì Quảng 1A', query: 'mì quảng' },
  { label: 'Bánh Xèo Bà Dưỡng', query: 'bà dưỡng' },
  { label: 'Bún Chả Cá Hờn', query: 'chả cá hờn' },
  { label: 'Cơm Niêu Nhà Đỏ', query: 'cơm niêu' },
  { label: 'Bánh Mì Bà Lan', query: 'bà lan' },
  { label: 'Hải Sản Mỹ Khê', query: 'mỹ khê' },
];

const TIME_FILTERS = ['Tất cả khung giờ', 'Sáng sớm (6-9h)', 'Trưa (11-14h)', 'Tối (18-23h)'];
const DAY_FILTERS = ['Tất cả ngày', 'Cuối tuần', 'Ngày thường'];

const SORT_OPTIONS = [
  { value: 'recommended', label: 'Đề xuất' },
  { value: 'rating', label: 'Đánh giá cao nhất' },
  { value: 'reviews', label: 'Nhiều đánh giá nhất' },
  { value: 'name', label: 'Tên A–Z' },
];

const TRUST_BADGES = [
  { icon: Users, color: 'text-teal-600', bg: 'bg-teal-50', title: 'Xác minh bởi cộng đồng', desc: 'Hàng nghìn thực khách đánh giá mỗi ngày.' },
  { icon: Zap, color: 'text-orange-500', bg: 'bg-orange-50', title: 'Cập nhật theo thời gian thực', desc: 'Giá & giờ mở cửa được cập nhật liên tục.' },
  { icon: ThumbsUp, color: 'text-blue-600', bg: 'bg-blue-50', title: 'Chỉ đường chính xác', desc: 'Tích hợp bản đồ, dẫn đường từng ngõ hẻm.' },
  { icon: CalendarClock, color: 'text-purple-600', bg: 'bg-purple-50', title: 'Gợi ý theo khung giờ', desc: 'Biết ngay nơi đang mở cửa phù hợp ngay bây giờ.' },
];

const BLUR = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

// ─────────────────────────────────────────────────────────────────────────────
// FOOD CARD
// ─────────────────────────────────────────────────────────────────────────────
function FoodCard({
  place,
  saved,
  onSave,
}: {
  place: FoodPlace;
  saved: boolean;
  onSave: () => void;
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25 }}
      className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 ease-out border border-gray-100 flex flex-col h-full"
    >
      {/* Image */}
      <Link href={`/places/${place.id}`} className="block relative h-52 overflow-hidden shrink-0">
        <Image
          src={place.img}
          alt={place.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,33vw"
          placeholder="blur"
          blurDataURL={BLUR}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

        {/* Badge góc trên trái */}
        <div
          className={`absolute top-3 left-3 ${place.badgeColor} text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm ${
            place.badgePulse ? 'animate-[pulse_2s_ease-in-out_infinite]' : ''
          }`}
        >
          {place.badge}
        </div>

        {/* Trạng thái mở cửa */}
        <div className="absolute bottom-3 left-3">
          <span
            className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-md ${
              place.openNow ? 'bg-emerald-500/90 text-white' : 'bg-gray-800/80 text-white/80'
            }`}
          >
            {place.openNow && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
            {place.openNow ? 'Đang mở cửa' : 'Đã đóng cửa'}
          </span>
        </div>

        {/* Bookmark button góc trên phải */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSave();
          }}
          className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all duration-200 z-10"
          aria-label={saved ? 'Bỏ lưu' : 'Lưu địa điểm'}
        >
          <Bookmark
            size={15}
            className={`transition-all duration-200 ${
              saved ? 'fill-orange-500 text-orange-500 scale-110' : 'text-gray-400'
            }`}
          />
        </button>
      </Link>

      {/* Card body */}
      <div className="p-5 flex flex-col flex-1 justify-between">
        <div>
          <Link href={`/places/${place.id}`}>
            <h3 className="font-bold text-[#0f2942] group-hover:text-orange-500 transition-colors text-base leading-snug line-clamp-1 mb-1.5">
              {place.name}
            </h3>
          </Link>

          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2.5">
            <MapPin size={13} className="text-gray-400 shrink-0" />
            <span className="truncate">{place.location}</span>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mb-2.5 text-xs">
            <div className="flex items-center gap-1 text-amber-500 font-bold bg-amber-50 px-2 py-0.5 rounded-md">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              <span>{place.rating}</span>
            </div>
            <span className="text-gray-400">({place.reviews.toLocaleString('vi-VN')} đánh giá)</span>
            <span className="text-gray-300">•</span>
            <span className="text-gray-500 flex items-center gap-1">
              <Clock size={11} className="text-gray-400" />
              {place.hours}
            </span>
          </div>

          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed mb-4">
            {place.description}
          </p>
        </div>

        {/* Price + Action Button "Xem chi tiết" */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
          <div>
            <p className="text-orange-600 font-bold text-sm leading-tight">{place.priceRange}</p>
            <p className="text-[10px] text-gray-400">{place.priceNote}</p>
          </div>

          <Link
            href={`/places/${place.id}`}
            className="inline-flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-md shadow-orange-500/20 group-hover:scale-105"
          >
            <span>Xem chi tiết</span>
            <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// Skeleton loading
function FoodSkeleton() {
  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
      <div className="h-52 bg-gray-200 animate-pulse" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
        <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
        <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3" />
        <div className="flex justify-between items-end pt-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
          <div className="h-8 bg-gray-200 rounded-xl animate-pulse w-24" />
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
  const urlQ = searchParams.get('q') || '';

  const [foodPlaces, setFoodPlaces] = useState<FoodPlace[]>(FOOD_PLACES);
  const [savedPlaces, setSavedPlaces] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState(urlQ);
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [activeTime, setActiveTime] = useState('Tất cả khung giờ');
  const [activeDay, setActiveDay] = useState('Tất cả ngày');
  const [sortBy, setSortBy] = useState<string>('recommended');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [nearMe, setNearMe] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const searchBoxRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);

  // Đóng gợi ý khi nhấp ra ngoài
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Đồng bộ param ?q= từ URL (khi gõ từ Sticky Navbar hoặc chuyển trang)
  useEffect(() => {
    setSearchQuery(urlQ);
  }, [urlQ]);

  // Gọi API Backend thật: GET /api/places?type=RESTAURANT
  useEffect(() => {
    let isMounted = true;
    async function fetchLiveRestaurants() {
      try {
        const res = await getPlaces({ type: 'RESTAURANT', limit: 50 });
        if (res && res.items && res.items.length > 0 && isMounted) {
          const livePlaces: FoodPlace[] = res.items.map((item) => ({
            id: item.place_id,
            name: item.name,
            badge: item.promo_label || (item.avg_rating >= 4.7 ? 'Đặc sản nổi bật' : 'Món ngon Đà Nẵng'),
            badgeColor: CAT_TINT[item.category_name || ''] || 'bg-teal-500',
            badgePulse: item.avg_rating >= 4.8,
            category: item.category_name || 'Món ngon',
            location: item.district_name ? `${item.district_name}, Đà Nẵng` : (item.address || 'Đà Nẵng'),
            rating: item.avg_rating || 4.7,
            reviews: item.review_count || 120,
            priceRange: formatPriceRange(item.price_min, item.price_max),
            priceNote: '/món',
            openNow: item.is_open,
            hours: item.today_hours || '08:00–22:00',
            img: item.cover_image || 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=600&q=80',
            tags: [item.district_name || 'Đà Nẵng', item.category_name || 'Ẩm thực'].filter(Boolean),
            description: item.description || 'Quán ăn ngon nổi tiếng tại Đà Nẵng.',
          }));

          // Ưu tiên dữ liệu thật từ SQL Server, loại bỏ trùng lặp với danh sách mẫu
          const liveIds = new Set(livePlaces.map((p) => p.id));
          const liveNames = new Set(livePlaces.map((p) => removeVietnameseTones(p.name)));
          const additionalMock = FOOD_PLACES.filter(
            (p) => !liveIds.has(p.id) && !liveNames.has(removeVietnameseTones(p.name))
          );
          setFoodPlaces([...livePlaces, ...additionalMock]);
        }
      } catch (err) {
        console.warn('API /api/places chưa kết nối, dùng dữ liệu fallback:', err);
      }
    }
    fetchLiveRestaurants();
    return () => {
      isMounted = false;
    };
  }, []);

  const prefersReduced =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);

  const toggleSave = (id: number) => {
    setSavedPlaces((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const applyFilter = useCallback((fn: () => void) => {
    setIsLoading(true);
    fn();
    setCurrentPage(1);
    setTimeout(() => setIsLoading(false), 300);
  }, []);

  // Xử lý khi gõ tìm kiếm: cập nhật URL, reset trang 1 và mở gợi ý tức thì
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
    if (val.trim()) {
      setIsDropdownOpen(true);
    }
    const trimmed = val.trim();
    const url = trimmed ? `/amthuc?q=${encodeURIComponent(trimmed)}` : '/amthuc';
    router.replace(url, { scroll: false });
  };

  const handleSelectQuickTag = (tagQuery: string) => {
    setSearchQuery(tagQuery);
    setIsDropdownOpen(false);
    setActiveCategory('Tất cả');
    setCurrentPage(1);
    const url = `/amthuc?q=${encodeURIComponent(tagQuery)}`;
    router.replace(url, { scroll: false });
  };

  const handleClearFilters = () => {
    setActiveCategory('Tất cả');
    setSearchQuery('');
    setSortBy('recommended');
    setIsDropdownOpen(false);
    setCurrentPage(1);
    router.replace('/amthuc', { scroll: false });
  };

  // 1. Danh sách gợi ý tức thì khi gõ trong ô tìm kiếm
  const matchingSuggestions = useMemo(() => {
    const qTrim = searchQuery.trim();
    if (!qTrim) return [];
    const qNorm = removeVietnameseTones(qTrim);

    return foodPlaces
      .filter((place) => {
        const nameNorm = removeVietnameseTones(place.name);
        const locNorm = removeVietnameseTones(place.location || '');
        const catNorm = removeVietnameseTones(place.category || '');
        const descNorm = removeVietnameseTones(place.description || '');
        const tagNorm = removeVietnameseTones(place.tags.join(' '));
        return (
          nameNorm.includes(qNorm) ||
          locNorm.includes(qNorm) ||
          catNorm.includes(qNorm) ||
          descNorm.includes(qNorm) ||
          tagNorm.includes(qNorm)
        );
      })
      .slice(0, 5);
  }, [foodPlaces, searchQuery]);

  // 2. Lọc và sắp xếp danh sách quán ăn
  const filtered = useMemo(() => {
    const qTrim = searchQuery.trim();
    const qNorm = removeVietnameseTones(qTrim);

    let result = foodPlaces.filter((p) => {
      // 1. Lọc theo danh mục
      if (activeCategory !== 'Tất cả' && p.category !== activeCategory) {
        return false;
      }

      // 2. Lọc theo từ khóa tìm kiếm (không dấu)
      if (qTrim) {
        const nameNorm = removeVietnameseTones(p.name);
        const locNorm = removeVietnameseTones(p.location || '');
        const catNorm = removeVietnameseTones(p.category || '');
        const descNorm = removeVietnameseTones(p.description || '');
        const tagNorm = removeVietnameseTones(p.tags.join(' '));

        const matchesQuery =
          nameNorm.includes(qNorm) ||
          locNorm.includes(qNorm) ||
          catNorm.includes(qNorm) ||
          descNorm.includes(qNorm) ||
          tagNorm.includes(qNorm);

        if (!matchesQuery) return false;
      }

      return true;
    });

    if (sortBy === 'rating') result = [...result].sort((a, b) => b.rating - a.rating);
    if (sortBy === 'reviews') result = [...result].sort((a, b) => b.reviews - a.reviews);
    if (sortBy === 'name') result = [...result].sort((a, b) => a.name.localeCompare(b.name, 'vi'));

    return result;
  }, [foodPlaces, activeCategory, searchQuery, sortBy]);

  const totalPages = Math.ceil(filtered.length / PLACES_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * PLACES_PER_PAGE,
    currentPage * PLACES_PER_PAGE
  );

  const changePage = (p: number) => {
    setIsLoading(true);
    setCurrentPage(p);
    setTimeout(() => {
      setIsLoading(false);
      document.getElementById('food-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 350);
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col overflow-x-hidden">
      {/* ═══ PHẦN 1: MINI HERO BANNER ════════════════════════════════════════ */}
      <section
        ref={heroRef}
        data-navbar-overlay="true"
        className="relative h-[320px] sm:h-[350px] overflow-hidden"
      >
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 via-black/10 to-transparent pointer-events-none z-20" />
        <motion.div style={{ y: heroY }} className="absolute inset-0 ken-burns">
          <Image
            src="https://images.unsplash.com/photo-1600850056064-a8b380df8395?w=1920&q=85"
            alt="Ẩm thực đặc sản Đà Nẵng — bánh xèo tôm thịt"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#071a2e]/65 via-[#0f2942]/50 to-[#071a2e]/85" />

        <div className="absolute top-20 right-6 sm:right-8 z-20 hidden sm:block">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 text-white rounded-full px-4 py-1.5 text-xs font-semibold">
            <CheckCircle size={12} className="text-emerald-300" />
            Được tuyển chọn &amp; xác minh bởi DanangGo
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 flex flex-col justify-end h-full pb-14 pt-16">
          <div className="flex items-center gap-1 text-sm text-white/70 mb-3">
            <Link href="/" className="hover:text-white transition-colors">
              Trang chủ
            </Link>
            <ChevronRight size={14} className="text-white/40" />
            <span className="text-white font-medium">Ẩm thực Đà Nẵng</span>
          </div>

          <div className="mb-2">
            <span className="inline-flex items-center gap-2 bg-orange-500/90 backdrop-blur-sm text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              🗺️ BẢN ĐỒ VỊ GIÁC MIỀN TRUNG
            </span>
          </div>

          <div>
            <h1 className="h1-hero text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
              Ẩm thực Đà Nẵng — Đậm đà phong vị miền Trung
            </h1>
            <p className="body-text stat-number text-white/70 text-sm mt-1.5">
              <AnimatedCounter
                to={TOTAL_DISPLAY}
                suffix=" địa điểm ẩm thực được tuyển chọn"
                className="text-orange-300 font-semibold"
                duration={1.2}
              />
            </p>
          </div>
        </div>
      </section>

      {/* ═══ PHẦN 2: BỘ LỌC & Ô TÌM KIẾM NỔI BẬT (-mt-10) ════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-10 relative z-30 mb-8 w-full">
        <Reveal delay={0.1}>
          <div className="bg-white rounded-3xl shadow-xl p-5 sm:p-7 border border-gray-100 flex flex-col gap-5">
            {/* HÀNG 1: THANH TÌM KIẾM TRỰC TIẾP + GỢI Ý DROPDOWN */}
            <div ref={searchBoxRef} className="relative w-full">
              <div className="relative flex items-center">
                <Search className="absolute left-4 text-orange-500" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onFocus={() => {
                    if (searchQuery.trim()) setIsDropdownOpen(true);
                  }}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Nhập tên quán ăn, món ngon (ví dụ: Bé Mặn, Mì Quảng, Bánh xèo, Bún chả cá)..."
                  className="w-full bg-slate-50 hover:bg-slate-100/80 focus:bg-white border-2 border-slate-200 focus:border-orange-500 rounded-2xl pl-12 pr-12 py-3.5 text-base font-semibold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-orange-500/15 transition-all shadow-inner"
                />
                {searchQuery && (
                  <button
                    onClick={() => handleSearchChange('')}
                    className="absolute right-4 text-gray-400 hover:text-gray-700 transition p-1 rounded-full hover:bg-gray-200"
                    title="Xóa từ khóa"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              {/* DROPDOWN KẾT QUẢ GỢI Ý TỨC THÌ (POPUP XEM CHI TIẾT) */}
              <AnimatePresence>
                {isDropdownOpen && searchQuery.trim() && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 p-3 divide-y divide-gray-100"
                  >
                    {matchingSuggestions.length > 0 ? (
                      <>
                        <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-orange-600">
                            <Sparkles size={14} className="text-orange-500" />
                            Quán ăn khớp tức thì ({matchingSuggestions.length})
                          </span>
                          <span className="text-gray-400 font-normal">Nhấn &ldquo;Xem chi tiết&rdquo; để mở thực đơn</span>
                        </div>
                        <div className="space-y-1 pt-1">
                          {matchingSuggestions.map((item) => (
                            <Link
                              key={item.id}
                              href={`/places/${item.id}`}
                              onClick={() => setIsDropdownOpen(false)}
                              className="flex items-center gap-3.5 p-2.5 rounded-xl hover:bg-orange-50/70 transition-all group"
                            >
                              <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 shadow-sm border border-gray-100">
                                <Image
                                  src={item.img}
                                  alt={item.name}
                                  fill
                                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                                  sizes="56px"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-gray-900 group-hover:text-orange-600 text-sm truncate transition-colors">
                                    {item.name}
                                  </h4>
                                  <span className="px-2 py-0.5 text-[10px] font-bold bg-orange-50 text-orange-700 rounded-full shrink-0 border border-orange-100">
                                    {item.category}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <MapPin size={12} className="text-gray-400" /> {item.location}
                                  </span>
                                  <span className="flex items-center gap-1 text-amber-500 font-semibold">
                                    <Star size={12} className="fill-amber-400 text-amber-400" /> {item.rating}
                                  </span>
                                  <span className="text-orange-600 font-medium">
                                    {item.priceRange}
                                  </span>
                                </div>
                              </div>
                              <div className="shrink-0 flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-md shadow-orange-500/20 group-hover:scale-105 transition-all">
                                <span>Xem chi tiết</span>
                                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                              </div>
                            </Link>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="p-6 text-center text-sm text-gray-500">
                        Không tìm thấy quán ăn nào khớp với từ khóa &ldquo;<strong>{searchQuery}</strong>&rdquo;.
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* CHIPS GỢI Ý TỪ KHÓA MÓN ĂN & QUÁN HOT */}
              <div className="flex items-center gap-2 mt-3 overflow-x-auto hide-scrollbar pt-1">
                <span className="text-xs font-semibold text-gray-400 shrink-0 flex items-center gap-1">
                  <Sparkles size={12} className="text-orange-500" /> Quán &amp; Món nổi bật:
                </span>
                {POPULAR_FOOD_TAGS.map((tag) => (
                  <button
                    key={tag.label}
                    onClick={() => handleSelectQuickTag(tag.query)}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all shrink-0 border ${
                      removeVietnameseTones(searchQuery) === removeVietnameseTones(tag.query)
                        ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                        : 'bg-gray-100 hover:bg-orange-50 text-gray-700 hover:text-orange-700 border-gray-200'
                    }`}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>

            {/* HÀNG 2: DANH MỤC MÓN ĂN */}
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                Danh mục món ăn
              </p>
              <LayoutGroup id="amthuc-cat">
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => applyFilter(() => setActiveCategory(cat))}
                      className={`relative px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors duration-200 ${
                        activeCategory === cat
                          ? 'text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {activeCategory === cat && (
                        <motion.div
                          layoutId="active-cat-amthuc"
                          className={`absolute inset-0 rounded-[inherit] ${CAT_TINT[cat] ?? 'bg-orange-500'}`}
                          style={{ zIndex: 0 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10">{cat}</span>
                    </button>
                  ))}
                </div>
              </LayoutGroup>
            </div>

            <div className="h-px bg-gray-100" />

            {/* HÀNG 3: KHUNG GIỜ + SẮP XẾP + GẦN TÔI + NÚT XÓA LỌC */}
            <div className="flex flex-wrap items-center gap-3 justify-between">
              <div className="flex flex-wrap items-center gap-3">
                {/* Khung giờ */}
                <div className="flex items-center gap-1.5">
                  <Clock size={13} className="text-gray-400" />
                  <select
                    value={activeTime}
                    onChange={(e) => applyFilter(() => setActiveTime(e.target.value))}
                    className="text-xs border border-gray-200 rounded-xl px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all bg-gray-50 font-medium"
                  >
                    {TIME_FILTERS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ngày */}
                <div className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-gray-400" />
                  <select
                    value={activeDay}
                    onChange={(e) => applyFilter(() => setActiveDay(e.target.value))}
                    className="text-xs border border-gray-200 rounded-xl px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all bg-gray-50 font-medium"
                  >
                    {DAY_FILTERS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sắp xếp */}
                <div className="flex items-center gap-1.5">
                  <ArrowUpDown size={13} className="text-[#0f2942]" />
                  <select
                    value={sortBy}
                    onChange={(e) => applyFilter(() => setSortBy(e.target.value))}
                    className="text-xs border border-gray-200 rounded-xl px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all bg-gray-50 font-medium"
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Gần tôi nhất */}
                <button
                  onClick={() => applyFilter(() => setNearMe(!nearMe))}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all duration-200 ${
                    nearMe
                      ? 'bg-orange-500 text-white shadow-sm shadow-orange-200'
                      : 'bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100'
                  }`}
                >
                  <Navigation
                    size={12}
                    className={nearMe ? 'text-white' : 'text-orange-500 animate-[pulse_2s_ease-in-out_infinite]'}
                  />
                  Gần tôi nhất
                </button>
              </div>

              {/* Nút Xóa lọc nếu có điều kiện */}
              {(searchQuery || activeCategory !== 'Tất cả' || sortBy !== 'recommended' || nearMe) && (
                <button
                  onClick={handleClearFilters}
                  className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 transition-colors px-3 py-1.5 rounded-xl border border-red-200 shrink-0"
                  title="Đặt lại toàn bộ bộ lọc"
                >
                  <RefreshCw size={13} /> Xóa bộ lọc
                </button>
              )}
            </div>
          </div>
        </Reveal>
      </div>

      {/* ═══ PHẦN 3: LƯỚI QUÁN ĂN (FOOD GRID) ════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-4 w-full">
        {/* Results bar */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm font-medium text-gray-500">
            Hiển thị{' '}
            <span className="font-bold text-[#0f2942]">
              {filtered.length > 0 ? (currentPage - 1) * PLACES_PER_PAGE + 1 : 0}–
              {Math.min(currentPage * PLACES_PER_PAGE, filtered.length)}
            </span>{' '}
            trên <span className="font-bold text-[#0f2942]">{filtered.length}</span> địa điểm ẩm thực
            {searchQuery && (
              <span> cho từ khóa &ldquo;<strong className="text-orange-600 font-semibold">{searchQuery}</strong>&rdquo;</span>
            )}
            {activeCategory !== 'Tất cả' && (
              <span> trong mục &ldquo;<strong className="text-gray-900">{activeCategory}</strong>&rdquo;</span>
            )}
          </p>

          {searchQuery && (
            <button
              onClick={() => handleSearchChange('')}
              className="text-xs text-orange-600 hover:text-orange-800 font-semibold underline underline-offset-2"
            >
              Hiển thị tất cả
            </button>
          )}
        </div>

        <div id="food-grid" className="scroll-mt-24">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <FoodSkeleton key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm p-8 max-w-lg mx-auto">
              <SearchX className="w-14 h-14 text-gray-300 mx-auto mb-3 stroke-[1.5]" />
              <h3 className="text-lg font-bold text-gray-800">Không tìm thấy quán ăn phù hợp</h3>
              <p className="text-gray-500 text-sm mt-1">
                Không có địa điểm nào khớp với từ khóa &ldquo;<strong className="text-gray-700">{searchQuery}</strong>&rdquo;. Bạn thử tìm món khác hoặc xóa bộ lọc nhé!
              </p>
              <button
                onClick={handleClearFilters}
                className="mt-5 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition shadow-md shadow-orange-500/20"
              >
                Xem lại tất cả quán ăn
              </button>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={`food-${currentPage}-${activeCategory}-${searchQuery}-${sortBy}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
              >
                {paginated.map((place, i) => (
                  <motion.div
                    key={place.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.35,
                      delay: prefersReduced ? 0 : i * 0.05,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                  >
                    <FoodCard
                      place={place}
                      saved={savedPlaces.has(place.id)}
                      onSave={() => toggleSave(place.id)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* ═══ PHẦN 4: PHÂN TRANG (PAGINATION) ═════════════════════════════════ */}
      {totalPages > 1 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex justify-center">
          <div className="flex items-center gap-2">
            {/* Prev */}
            <button
              onClick={() => currentPage > 1 && changePage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`flex items-center justify-center w-10 h-10 rounded-xl border transition-all ${
                currentPage === 1
                  ? 'opacity-40 cursor-not-allowed border-gray-200 text-gray-400'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-100 hover:scale-105 active:scale-95'
              }`}
            >
              <ChevronRight size={16} className="rotate-180" />
            </button>

            {pageWindow()[0] > 1 && (
              <>
                <button
                  onClick={() => changePage(1)}
                  className="w-10 h-10 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-100 transition-all"
                >
                  1
                </button>
                {pageWindow()[0] > 2 && <span className="text-gray-400 px-1">…</span>}
              </>
            )}

            {pageWindow().map((p) => (
              <button
                key={p}
                onClick={() => p !== currentPage && changePage(p)}
                className={`w-10 h-10 rounded-xl text-sm font-bold transition-all duration-200 ${
                  p === currentPage
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25 scale-105'
                    : 'border border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {p}
              </button>
            ))}

            {pageWindow()[pageWindow().length - 1] < totalPages && (
              <>
                {pageWindow()[pageWindow().length - 1] < totalPages - 1 && (
                  <span className="text-gray-400 px-1">…</span>
                )}
                <button
                  onClick={() => changePage(totalPages)}
                  className="w-10 h-10 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-100 transition-all"
                >
                  {totalPages}
                </button>
              </>
            )}

            {/* Next */}
            <button
              onClick={() => currentPage < totalPages && changePage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`flex items-center justify-center w-10 h-10 rounded-xl border transition-all ${
                currentPage === totalPages
                  ? 'opacity-40 cursor-not-allowed border-gray-200 text-gray-400'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-100 hover:scale-105 active:scale-95'
              }`}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ═══ PHẦN 5: TRUST BADGES ═══════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <Reveal delay={0.05}>
          <h2 className="h2-section text-center text-xl sm:text-2xl font-bold text-[#0f2942] mb-8">
            Vì sao chọn ẩm thực trên <span className="text-cyan-500">Danang</span>
            <span className="text-orange-400">Go</span>?
          </h2>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
          {TRUST_BADGES.map((badge, i) => {
            const Icon = badge.icon;
            return (
              <Reveal key={badge.title} delay={i * 0.1} className="flex">
                <div className="flex flex-col h-full w-full bg-white rounded-2xl p-5 shadow-sm border border-gray-100 items-center text-center hover:shadow-md transition-shadow duration-300">
                  <div
                    className={`w-12 h-12 ${badge.bg} rounded-2xl flex items-center justify-center mb-4 flex-shrink-0`}
                  >
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

      {/* ═══ PHẦN 6: CTA BANNER ═════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <Reveal delay={0.1}>
          <div className="shimmer-bg rounded-3xl p-10 sm:p-14 text-center text-white relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-orange-400/25 border border-orange-300/30 text-orange-200 text-xs font-bold px-4 py-1.5 rounded-full mb-5 uppercase tracking-wider">
                <Calendar size={13} />
                Lên kế hoạch ẩm thực ngay hôm nay
              </div>

              <h2 className="h2-section text-2xl sm:text-3xl font-bold mb-3">
                Đã tìm được món ngon ưng ý?{' '}
                <span className="text-orange-300">Thêm vào lịch trình ngay!</span>
              </h2>
              <p className="body-text text-white/70 max-w-lg mx-auto mb-8 text-sm leading-relaxed">
                DanangGo giúp bạn lập hành trình ẩm thực trọn vẹn — kết hợp quán ăn, địa điểm tham
                quan và lưu trú thành một chuyến đi hoàn hảo.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/lich-trinh/tao-moi"
                  className="btn-ripple inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold px-8 py-3.5 rounded-xl transition-colors hover:scale-[1.03] active:scale-[0.97] text-sm"
                >
                  <Calendar size={15} />
                  Thêm vào lịch trình
                </Link>
                <Link
                  href="/diemdulich"
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

      {/* ═══ PHẦN 7: FOOTER ══════════════════════════════════════════════════ */}
      <footer className="bg-[#071a2e] text-white/70 pt-14 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
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
                Cẩm nang du lịch Đà Nẵng đầy đủ và cập nhật nhất — từ điểm đến, ẩm thực đến lịch
                trình tối ưu.
              </p>
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
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Tiện ích</h4>
              <ul className="space-y-2.5">
                {['Tạo lịch trình', 'Bản đồ thành phố', 'Thời tiết', 'Đặt vé online', 'Hỏi đáp'].map(
                  (link) => (
                    <li key={link}>
                      <a href="#" className="text-sm hover:text-white transition-colors">
                        {link}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Liên hệ</h4>
              <ul className="space-y-2.5">
                <li className="text-sm">📧 hello@dananggo.vn</li>
                <li className="text-sm">📞 0236 386 5xxx</li>
                <li className="text-sm">📍 Đà Nẵng, Việt Nam</li>
              </ul>
              <div className="mt-4 space-y-1.5">
                {['Về chúng tôi', 'Tuyển dụng', 'Báo chí'].map((link) => (
                  <a key={link} href="#" className="block text-sm hover:text-white transition-colors">
                    {link}
                  </a>
                ))}
              </div>
            </div>
          </div>
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

export default function AmThucPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            <p className="text-sm font-medium text-gray-500">Đang tải danh sách ẩm thực...</p>
          </div>
        </div>
      }
    >
      <AmThucContent />
    </Suspense>
  );
}
