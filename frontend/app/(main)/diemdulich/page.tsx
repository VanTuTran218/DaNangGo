'use client';

import { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getPlaces } from '@/lib/api/places';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import {
  Map,
  Palmtree,
  Mountain,
  Landmark,
  Camera,
  FerrisWheel,
  RefreshCw,
  ArrowUpDown,
  Loader2,
  ChevronDown,
  Search,
  X,
  SearchX,
  Star,
  MapPin,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

import Footer from '@/components/layout/Footer';
import ParallaxBanner from '@/components/attractions/ParallaxBanner';
import StoryCard, { AttractionData } from '@/components/attractions/StoryCard';
import RadarMapPreview from '@/components/attractions/RadarMapPreview';

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

// DỮ LIỆU ĐIỂM ĐẾN MẪU ĐỒNG BỘ VỚI CSDL SQL SERVER
const RAW_ATTRACTIONS = [
  {
    id: 97,
    name: 'Sun World Bà Nà Hills',
    category: 'Giải trí',
    location: 'Hòa Vang',
    rating: 4.8,
    visitors: 420000,
    img: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&q=80',
    shortDesc: 'Thiên đường nghỉ dưỡng trên đỉnh núi Chúa ở độ cao 1.487m với Cầu Vàng...',
    longDesc: 'Nằm ở độ cao 1.414m so với mực nước biển, Cầu Vàng là tuyệt tác kiến trúc vắt ngang bầu trời sương mù Bà Nà. Đứng tại đây, bạn có thể phóng tầm mắt bao quát toàn cảnh núi rừng chập chùng tuyệt đẹp.',
  },
  {
    id: 102,
    name: 'Bãi Biển Mỹ Khê',
    category: 'Biển & Đảo',
    location: 'Sơn Trà',
    rating: 4.9,
    visitors: 245000,
    img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    shortDesc: 'Bãi biển cát trắng mịn dài 9km, làn nước trong xanh ấm áp quanh năm...',
    longDesc: 'Được tạp chí Forbes vinh danh là một trong 6 bãi biển quyến rũ nhất hành tinh. Bãi biển Mỹ Khê thu hút du khách bởi bờ cát trắng mịn, sóng biển ôn hòa và các hoạt động thể thao trên nước sôi động.',
  },
  {
    id: 98,
    name: 'Bán Đảo Sơn Trà & Chùa Linh Ứng',
    category: 'Chùa / Tâm linh',
    location: 'Sơn Trà',
    rating: 4.9,
    visitors: 280000,
    img: 'https://images.unsplash.com/photo-1570789210967-2cac24afeb00?w=800&q=80',
    shortDesc: 'Khu bảo tồn thiên nhiên đa dạng với tượng Phật Bà Quan Âm cao 67m...',
    longDesc: 'Khu bảo tồn thiên nhiên rộng lớn bảo vệ hơn hàng ngàn hecta rừng nguyên sinh. Cung đường vòng quanh bán đảo mang đến khung cảnh ngoạn mục của biển Đông và cơ hội bắt gặp nữ hoàng linh trưởng - Voọc chà vá chân nâu.',
  },
  {
    id: 100,
    name: 'Cầu Rồng & Cầu Tình Yêu Đà Nẵng',
    category: 'Chụp ảnh Check-in',
    location: 'Hải Châu',
    rating: 4.8,
    visitors: 350000,
    img: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800&q=80',
    shortDesc: 'Cây cầu hình con rồng thời Lý vươn mình ra biển lớn, phun lửa và phun nước...',
    longDesc: 'Biểu tượng của sự chuyển mình mạnh mẽ của Đà Nẵng. Mỗi tối thứ 7 và Chủ nhật lúc 21h00, Cầu Rồng sẽ trình diễn phun lửa và phun nước tạo nên cảnh tượng vô cùng hoành tráng thu hút hàng ngàn du khách.',
  },
  {
    id: 99,
    name: 'Danh Thắng Ngũ Hành Sơn',
    category: 'Văn hoá & Lịch sử',
    location: 'Ngũ Hành Sơn',
    rating: 4.7,
    visitors: 185000,
    img: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800&q=80',
    shortDesc: 'Quần thể 5 ngọn núi đá vôi kỳ vĩ gắn liền với truyền thuyết ngũ hành...',
    longDesc: 'Di tích lịch sử văn hóa cấp Quốc gia với 5 ngọn núi đá vôi: Kim, Mộc, Thủy, Hỏa, Thổ. Khám phá các hang động huyền bí như động Huyền Không, động Âm Phủ và các ngôi cổ tự linh thiêng hàng trăm năm tuổi.',
  },
  {
    id: 101,
    name: 'Bảo Tàng Điêu Khắc Chăm Đà Nẵng',
    category: 'Văn hoá & Lịch sử',
    location: 'Hải Châu',
    rating: 4.7,
    visitors: 95000,
    img: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=800&q=80',
    shortDesc: 'Bộ sưu tập điêu khắc Chăm lớn nhất thế giới với hơn 2.000 hiện vật...',
    longDesc: 'Bảo tàng duy nhất trên thế giới về nền văn hóa Chăm Pa. Lưu giữ hàng ngàn bức phù điêu, tượng đá sa thạch miêu tả các vị thần Ấn Độ giáo tinh xảo từ thế kỷ 7 đến thế kỷ 15.',
  },
];

const MORE_RAW_ATTRACTIONS = [
  {
    id: 107,
    name: 'Công viên Châu Á (Asia Park)',
    category: 'Giải trí',
    location: 'Hải Châu',
    rating: 4.5,
    visitors: 200000,
    img: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800&q=80',
    shortDesc: 'Khu vui chơi giải trí quy mô lớn với vòng đu quay khổng lồ Sun Wheel...',
    longDesc: 'Nơi hội tụ tinh hoa văn hóa của 10 quốc gia châu Á. Tận hưởng cảm giác mạnh với hàng chục trò chơi đẳng cấp thế giới và chiêm ngưỡng toàn cảnh Đà Nẵng lung linh về đêm từ vòng quay Sun Wheel cao 115m.',
  },
  {
    id: 103,
    name: 'Đỉnh Bà Nà Hills (Làng Pháp)',
    category: 'Núi & Rừng',
    location: 'Hòa Vang',
    rating: 4.8,
    visitors: 450000,
    img: 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=800&q=80',
    shortDesc: 'Cáp treo dài nhất thế giới đưa bạn lên Làng Pháp cổ kính...',
    longDesc: 'Đường lên tiên cảnh với hệ thống cáp treo đạt 4 kỷ lục Guinness thế giới. Trải nghiệm 4 mùa trong 1 ngày, lạc bước trong Làng Pháp cổ kính và vườn hoa Le Jardin D’Amour lãng mạn.',
  },
  {
    id: 104,
    name: 'Rạn Nam Ô',
    category: 'Biển & Đảo',
    location: 'Liên Chiểu',
    rating: 4.6,
    visitors: 65000,
    img: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&q=80',
    shortDesc: 'Bãi đá hoang sơ phủ đầy rêu xanh mướt vào đầu xuân...',
    longDesc: 'Nổi tiếng với những bãi đá phủ đầy rêu xanh tuyệt đẹp vào mùa xuân. Nước biển ở đây trong vắt, là điểm đến lý tưởng cho những ai thích vẻ đẹp hoang sơ, yên bình và những bức ảnh sống ảo cực chất.',
  },
  {
    id: 105,
    name: 'Công viên APEC',
    category: 'Chụp ảnh Check-in',
    location: 'Hải Châu',
    rating: 4.5,
    visitors: 120000,
    img: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&q=80',
    shortDesc: 'Công viên kiến trúc độc đáo với mái vòm hình cánh diều uốn lượn...',
    longDesc: 'Biểu tượng mới của Đà Nẵng bên bờ sông Hàn. Mái vòm thép uốn lượn hình cánh diều cùng hệ thống chiếu sáng đèn LED nghệ thuật về đêm tạo nên một không gian check-in vô cùng hiện đại và ảo diệu.',
  },
  {
    id: 106,
    name: 'Suối khoáng nóng Thần Tài',
    category: 'Giải trí',
    location: 'Hòa Vang',
    rating: 4.6,
    visitors: 110000,
    img: 'https://images.unsplash.com/photo-1520962880247-cfaf541c8724?w=800&q=80',
    shortDesc: 'Công viên suối khoáng nóng quy mô lớn giữa không gian rừng núi...',
    longDesc: 'Nơi hoàn hảo để tái tạo năng lượng với dòng suối khoáng nóng tự nhiên. Trải nghiệm tắm bùn, tắm onsen Nhật Bản và khu vui chơi công viên nước sôi động giữa núi rừng mát mẻ.',
  },
];

function mapData(raw: any[]): AttractionData[] {
  return raw.map((item) => {
    let tint: AttractionData['badgeTint'] = 'blue';
    const cat = item.category || '';
    if (cat.includes('Núi') || cat.includes('Rừng')) tint = 'green';
    else if (cat.includes('Văn hoá') || cat.includes('Lịch sử') || cat.includes('Tâm linh') || cat.includes('Chùa')) tint = 'amber';
    else if (cat.includes('Check-in') || cat.includes('Ảnh')) tint = 'pink';
    else if (cat.includes('Giải trí')) tint = 'purple';
    return { ...item, badgeTint: tint };
  });
}

const INITIAL_ATTRACTIONS = mapData(RAW_ATTRACTIONS);
const MORE_ATTRACTIONS = mapData(MORE_RAW_ATTRACTIONS);

const CATEGORIES = [
  { label: 'Tất cả', value: 'Tất cả', Icon: Map, tint: 'bg-gray-100 text-gray-700', active: 'bg-gray-800 text-white shadow-md' },
  { label: 'Biển & Đảo', value: 'Biển & Đảo', Icon: Palmtree, tint: 'bg-blue-50 text-blue-600', active: 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' },
  { label: 'Núi & Rừng', value: 'Núi & Rừng', Icon: Mountain, tint: 'bg-green-50 text-green-600', active: 'bg-green-500 text-white shadow-lg shadow-green-500/30' },
  { label: 'Văn hoá & Lịch sử', value: 'Văn hoá & Lịch sử', Icon: Landmark, tint: 'bg-amber-50 text-amber-600', active: 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' },
  { label: 'Chụp ảnh Check-in', value: 'Chụp ảnh Check-in', Icon: Camera, tint: 'bg-pink-50 text-pink-600', active: 'bg-pink-500 text-white shadow-lg shadow-pink-500/30' },
  { label: 'Giải trí', value: 'Giải trí', Icon: FerrisWheel, tint: 'bg-purple-50 text-purple-600', active: 'bg-purple-500 text-white shadow-lg shadow-purple-500/30' },
];

const POPULAR_TAGS = [
  { label: 'Bà Nà Hills', query: 'bà nà' },
  { label: 'Cầu Rồng', query: 'cầu rồng' },
  { label: 'Bãi biển Mỹ Khê', query: 'mỹ khê' },
  { label: 'Ngũ Hành Sơn', query: 'ngũ hành sơn' },
  { label: 'Bán đảo Sơn Trà', query: 'sơn trà' },
  { label: 'Bảo tàng Chăm', query: 'chăm' },
];

type SortType = 'default' | 'rating' | 'visitors';

function DiemDuLichContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQ = searchParams.get('q') || '';

  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState(urlQ);
  const [sortBy, setSortBy] = useState<SortType>('default');
  const [items, setItems] = useState<AttractionData[]>(INITIAL_ATTRACTIONS);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const searchBoxRef = useRef<HTMLDivElement>(null);

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

  // Gọi API Backend thật: GET /api/places?type=ATTRACTION
  useEffect(() => {
    let isMounted = true;
    async function fetchLiveAttractions() {
      try {
        const res = await getPlaces({ type: 'ATTRACTION', limit: 50 });
        if (res && res.items && res.items.length > 0 && isMounted) {
          const liveAttractions: AttractionData[] = res.items.map((item) => {
            let tint: AttractionData['badgeTint'] = 'blue';
            const cat = item.category_name || '';
            if (cat.includes('Núi') || cat.includes('Rừng')) tint = 'green';
            else if (cat.includes('Văn hoá') || cat.includes('Lịch sử') || cat.includes('Tâm linh') || cat.includes('Chùa')) tint = 'amber';
            else if (cat.includes('Check-in') || cat.includes('Ảnh')) tint = 'pink';
            else if (cat.includes('Giải trí')) tint = 'purple';
            else if (cat.includes('Biển')) tint = 'blue';

            return {
              id: item.place_id,
              name: item.name,
              category: item.category_name || 'Văn hoá & Lịch sử',
              location: item.district_name ? `${item.district_name}` : (item.address || 'Đà Nẵng'),
              rating: item.avg_rating || 4.8,
              visitors: (item.view_count || 100) * 150,
              img: item.cover_image || 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&q=80',
              shortDesc: item.description ? item.description.slice(0, 85) + '...' : 'Điểm du lịch nổi tiếng tại Đà Nẵng...',
              longDesc: item.description || 'Khám phá nét đẹp thiên nhiên và văn hoá đặc sắc của thành phố biển Đà Nẵng.',
              badgeTint: tint,
            };
          });

          // Loại bỏ các mục mẫu trùng lặp theo ID và tên chuẩn hóa
          const liveIds = new Set(liveAttractions.map((a) => a.id));
          const liveNameKeys = new Set(liveAttractions.map((a) => removeVietnameseTones(a.name)));
          const additionalMock = INITIAL_ATTRACTIONS.filter(
            (a) => !liveIds.has(a.id) && !liveNameKeys.has(removeVietnameseTones(a.name))
          );
          setItems([...liveAttractions, ...additionalMock]);
        }
      } catch (err) {
        console.warn('API /api/places chưa kết nối hoặc offline, dùng dữ liệu mẫu chuẩn:', err);
      }
    }
    fetchLiveAttractions();
    return () => {
      isMounted = false;
    };
  }, []);

  // Xử lý khi gõ tìm kiếm: lọc ngay lập tức và mở gợi ý
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (val.trim()) {
      setIsDropdownOpen(true);
    }
    const trimmed = val.trim();
    const url = trimmed ? `/diemdulich?q=${encodeURIComponent(trimmed)}` : '/diemdulich';
    router.replace(url, { scroll: false });
  };

  const handleSelectQuickTag = (tagQuery: string) => {
    setSearchQuery(tagQuery);
    setIsDropdownOpen(false);
    setActiveCategory('Tất cả');
    const url = `/diemdulich?q=${encodeURIComponent(tagQuery)}`;
    router.replace(url, { scroll: false });
  };

  const handleClearFilters = () => {
    setActiveCategory('Tất cả');
    setSearchQuery('');
    setSortBy('default');
    setIsDropdownOpen(false);
    router.replace('/diemdulich', { scroll: false });
  };

  const handleLike = (id: number) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const loadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setItems((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const newItems = MORE_ATTRACTIONS.filter((m) => !existingIds.has(m.id));
        return [...prev, ...newItems];
      });
      setHasMore(false);
      setIsLoadingMore(false);
    }, 800);
  };

  // 1. Danh sách gợi ý tức thì khi đang gõ trong ô tìm kiếm
  const matchingSuggestions = useMemo(() => {
    const qTrim = searchQuery.trim();
    if (!qTrim) return [];
    const qNorm = removeVietnameseTones(qTrim);

    return items
      .filter((item) => {
        const nameNorm = removeVietnameseTones(item.name);
        const locNorm = removeVietnameseTones(item.location || '');
        const catNorm = removeVietnameseTones(item.category || '');
        const descNorm = removeVietnameseTones(item.shortDesc || '');
        return (
          nameNorm.includes(qNorm) ||
          locNorm.includes(qNorm) ||
          catNorm.includes(qNorm) ||
          descNorm.includes(qNorm)
        );
      })
      .slice(0, 5);
  }, [items, searchQuery]);

  // 2. Lọc và sắp xếp danh sách thẻ trên trang chính
  const filteredItems = useMemo(() => {
    const qTrim = searchQuery.trim();
    const qNorm = removeVietnameseTones(qTrim);

    let result = items.filter((item) => {
      // Nếu có từ khóa tìm kiếm: kiểm tra khớp từ khóa
      if (qTrim) {
        const nameNorm = removeVietnameseTones(item.name);
        const locNorm = removeVietnameseTones(item.location || '');
        const catNorm = removeVietnameseTones(item.category || '');
        const descNorm = removeVietnameseTones(item.shortDesc || '');

        const matchesQuery =
          nameNorm.includes(qNorm) ||
          locNorm.includes(qNorm) ||
          catNorm.includes(qNorm) ||
          descNorm.includes(qNorm);

        if (!matchesQuery) return false;

        // Khi tìm kiếm: nếu người dùng đang chọn 1 danh mục cụ thể (khác Tất cả), giữ lọc theo danh mục
        if (activeCategory !== 'Tất cả' && item.category !== activeCategory) {
          return false;
        }
        return true;
      }

      // Khi không có từ khóa: lọc thuần túy theo danh mục
      return activeCategory === 'Tất cả' || item.category === activeCategory;
    });

    // Sắp xếp
    if (sortBy === 'rating') {
      result = [...result].sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'visitors') {
      result = [...result].sort((a, b) => b.visitors - a.visitors);
    }

    return result;
  }, [items, activeCategory, searchQuery, sortBy]);

  const toggleSort = () => {
    if (sortBy === 'default') setSortBy('rating');
    else if (sortBy === 'rating') setSortBy('visitors');
    else setSortBy('default');
  };

  const sortLabel = {
    default: 'Mặc định',
    rating: 'Đánh giá cao',
    visitors: 'Lượt quan tâm',
  }[sortBy];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col overflow-x-hidden">
      {/* 1. PARALLAX BANNER */}
      <ParallaxBanner />

      {/* 2. KHU VỰC TÌM KIẾM & BỘ LỌC NỔI BẬT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-12 relative z-30 mb-8 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="bg-white rounded-3xl shadow-xl p-5 md:p-7 border border-gray-100 flex flex-col gap-5 backdrop-blur-sm"
        >
          {/* HÀNG 1: THANH TÌM KIẾM TRUNG TÂM + GỢI Ý DROPDOWN */}
          <div ref={searchBoxRef} className="relative w-full">
            <div className="relative flex items-center">
              <Search className="absolute left-4 text-teal-600" size={20} />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => {
                  if (searchQuery.trim()) setIsDropdownOpen(true);
                }}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Nhập tên điểm đến (ví dụ: Bà Nà, Cầu Rồng, Bãi biển Mỹ Khê)..."
                className="w-full bg-slate-50 hover:bg-slate-100/80 focus:bg-white border-2 border-slate-200 focus:border-teal-500 rounded-2xl pl-12 pr-12 py-3.5 text-base font-semibold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-teal-500/15 transition-all shadow-inner"
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

            {/* DROPDOWN KẾT QUẢ TỨC THÌ (POPUP XEM CHI TIẾT) */}
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
                        <span className="flex items-center gap-1.5 text-teal-700">
                          <Sparkles size={14} className="text-teal-500" />
                          Kết quả khớp tức thì ({matchingSuggestions.length})
                        </span>
                        <span className="text-gray-400 font-normal">Nhấn &ldquo;Xem chi tiết&rdquo; để mở</span>
                      </div>
                      <div className="space-y-1 pt-1">
                        {matchingSuggestions.map((item) => (
                          <Link
                            key={item.id}
                            href={`/places/${item.id}`}
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-3.5 p-2.5 rounded-xl hover:bg-teal-50/70 transition-all group"
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
                                <h4 className="font-bold text-gray-900 group-hover:text-teal-700 text-sm truncate transition-colors">
                                  {item.name}
                                </h4>
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-teal-50 text-teal-700 rounded-full shrink-0 border border-teal-100">
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
                              </div>
                            </div>
                            <div className="shrink-0 flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-md shadow-teal-600/20 group-hover:scale-105 transition-all">
                              <span>Xem chi tiết</span>
                              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="p-6 text-center text-sm text-gray-500">
                      Không tìm thấy điểm đến nào khớp với từ khóa &ldquo;<strong>{searchQuery}</strong>&rdquo;.
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* CHIPS GỢI Ý TỪ KHÓA PHỔ BIẾN */}
            <div className="flex items-center gap-2 mt-3 overflow-x-auto hide-scrollbar pt-1">
              <span className="text-xs font-semibold text-gray-400 shrink-0 flex items-center gap-1">
                <Sparkles size={12} className="text-orange-400" /> Gợi ý hot:
              </span>
              {POPULAR_TAGS.map((tag) => (
                <button
                  key={tag.label}
                  onClick={() => handleSelectQuickTag(tag.query)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all shrink-0 border ${
                    removeVietnameseTones(searchQuery) === removeVietnameseTones(tag.query)
                      ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                      : 'bg-gray-100 hover:bg-teal-50 text-gray-700 hover:text-teal-700 border-gray-200'
                  }`}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          {/* HÀNG 2: DANH MỤC LỌC + SẮP XẾP */}
          <div className="flex flex-col md:flex-row items-center gap-3 justify-between pt-3 border-t border-gray-100">
            <LayoutGroup>
              <div className="flex items-center gap-2 overflow-x-auto w-full pt-1 pb-1 hide-scrollbar mask-edges">
                {CATEGORIES.map((cat) => {
                  const isActive = activeCategory === cat.value;
                  return (
                    <button
                      key={cat.value}
                      onClick={() => setActiveCategory(cat.value)}
                      className={`relative px-4 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap text-sm font-semibold transition-all duration-300 flex-shrink-0 ${
                        isActive ? cat.active : cat.tint + ' hover:brightness-95'
                      }`}
                    >
                      <cat.Icon size={16} />
                      <span className="relative z-10">{cat.label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="activeCategory"
                          className="absolute inset-0 rounded-xl border-2 border-white/20 pointer-events-none"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </LayoutGroup>

            {/* Quick Actions */}
            <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 justify-end">
              <button
                onClick={toggleSort}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-teal-700 transition-colors bg-gray-50 hover:bg-gray-100 px-3.5 py-2 rounded-xl border border-gray-200"
                title="Nhấn để đổi kiểu sắp xếp"
              >
                <ArrowUpDown size={14} className="text-teal-600" />
                <span>Sắp xếp: <strong className="font-semibold text-gray-900">{sortLabel}</strong></span>
              </button>

              {(searchQuery || activeCategory !== 'Tất cả' || sortBy !== 'default') && (
                <button
                  onClick={handleClearFilters}
                  className="flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 transition-colors px-3 py-2 rounded-xl border border-red-200 shrink-0"
                  title="Đặt lại toàn bộ bộ lọc"
                >
                  <RefreshCw size={14} /> Xóa lọc
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* 3. LƯỚI DANH SÁCH THẺ ĐIỂM DU LỊCH */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 w-full">
        {/* Kết quả đếm */}
        <div className="flex items-center justify-between mb-6 px-1">
          <p className="text-sm font-medium text-gray-500">
            Hiển thị <strong className="text-gray-900 font-bold">{filteredItems.length}</strong> điểm đến
            {searchQuery && (
              <span> cho từ khóa &ldquo;<strong className="text-teal-600 font-semibold">{searchQuery}</strong>&rdquo;</span>
            )}
            {activeCategory !== 'Tất cả' && (
              <span> trong mục &ldquo;<strong className="text-gray-900">{activeCategory}</strong>&rdquo;</span>
            )}
          </p>
          {searchQuery && (
            <button
              onClick={() => handleSearchChange('')}
              className="text-xs text-teal-600 hover:text-teal-800 font-semibold underline underline-offset-2"
            >
              Hiển thị tất cả
            </button>
          )}
        </div>

        {/* Khi không tìm thấy kết quả */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm p-8 max-w-lg mx-auto">
            <SearchX className="w-14 h-14 text-gray-300 mx-auto mb-3 stroke-[1.5]" />
            <h3 className="text-lg font-bold text-gray-800">Không tìm thấy điểm đến phù hợp</h3>
            <p className="text-gray-500 text-sm mt-1">
              Không có địa điểm nào khớp với từ khóa &ldquo;<strong className="text-gray-700">{searchQuery}</strong>&rdquo;. Bạn thử tìm với tên khác hoặc xóa bộ lọc nhé!
            </p>
            <button
              onClick={handleClearFilters}
              className="mt-5 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition shadow-md shadow-teal-500/20"
            >
              Xem lại tất cả điểm đến
            </button>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {filteredItems.map((item, index) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.3) }}
                  key={item.id}
                >
                  <StoryCard
                    data={item}
                    liked={likedIds.has(item.id)}
                    onLike={() => handleLike(item.id)}
                  />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Nút Xem thêm */}
        {hasMore && filteredItems.length > 0 && !searchQuery && activeCategory === 'Tất cả' && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex justify-center mt-14"
          >
            <button
              onClick={loadMore}
              disabled={isLoadingMore}
              className="group flex items-center justify-center gap-2 bg-white hover:bg-gray-50 border-2 border-gray-200 text-[#0f2942] font-bold text-sm px-8 py-3.5 rounded-full transition-all hover:border-teal-500 hover:text-teal-600 hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Đang tải thêm...
                </>
              ) : (
                <>
                  Xem thêm các điểm đến khác{' '}
                  <ChevronDown size={18} className="group-hover:translate-y-1 transition-transform" />
                </>
              )}
            </button>
          </motion.div>
        )}
      </div>

      {/* 4. RADAR MAP PREVIEW */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-24 w-full">
        <RadarMapPreview />
      </div>

      {/* 5. FOOTER */}
      <Footer />
    </div>
  );
}

export default function DiemDuLichPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            <p className="text-sm font-medium text-gray-500">Đang tải danh sách điểm du lịch...</p>
          </div>
        </div>
      }
    >
      <DiemDuLichContent />
    </Suspense>
  );
}
