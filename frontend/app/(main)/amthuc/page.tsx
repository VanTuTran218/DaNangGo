'use client';

import Image from 'next/image';
import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
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
} from 'lucide-react';
import Reveal from '@/components/ui/Reveal';
import AnimatedCounter from '@/components/ui/AnimatedCounter';


// ─────────────────────────────────────────────────────────────────────────────
// DATA — 24 địa điểm ẩm thực (4 trang × 6 card)
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
  // Trang 1
  { id:1,  name:'Mì Quảng Bà Vị', badge:'Mì Quảng gia truyền', badgeColor:'bg-amber-500', badgePulse:false, category:'Mì Quảng', location:'Hải Châu, Đà Nẵng', rating:4.9, reviews:2156, priceRange:'25.000đ–45.000đ', priceNote:'/tô', openNow:true,  hours:'06:00–14:00', img:'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600&q=80', tags:['Gia truyền 40 năm','Nước lèo đậm đà','Đông khách sáng sớm'], description:'Quán mì Quảng nổi tiếng nhất Đà Nẵng, gia truyền 3 đời.' },
  { id:2,  name:'Bánh Tráng Cuốn Thịt Heo Trần', badge:'Đặc sản số 1', badgeColor:'bg-red-500', badgePulse:true, category:'Bánh tráng cuốn', location:'Sơn Trà, Đà Nẵng', rating:4.8, reviews:1893, priceRange:'60.000đ–120.000đ', priceNote:'/phần', openNow:true,  hours:'10:00–22:00', img:'https://images.unsplash.com/photo-1561189386-42f49bcc29ef?w=600&q=80', tags:['Thịt heo quay giòn','Đặc sản Đà Nẵng','Rau thơm tươi ngon'], description:'Điểm đến bắt buộc khi đến Đà Nẵng, thịt heo quay da giòn rụm.' },
  { id:3,  name:'Bún Chả Cá Bà Loan', badge:'Bún chả cá lâu năm', badgeColor:'bg-blue-500', badgePulse:false, category:'Bún chả cá', location:'Thanh Khê, Đà Nẵng', rating:4.7, reviews:1204, priceRange:'30.000đ–50.000đ', priceNote:'/tô', openNow:true,  hours:'06:30–13:00', img:'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600&q=80', tags:['Chả cá tự làm','Súp trong vắt','Mở từ 1985'], description:'Bún chả cá gia truyền với chả cá tự tay làm mỗi sáng sớm.' },
  { id:4,  name:'Hải Sản Tươi Sống Mỹ Khê', badge:'Hải sản tươi sống', badgeColor:'bg-teal-500', badgePulse:true, category:'Hải sản', location:'Ngũ Hành Sơn, Mỹ Khê', rating:4.6, reviews:987, priceRange:'150.000đ–500.000đ', priceNote:'/kg', openNow:true,  hours:'10:00–23:00', img:'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80', tags:['Tôm cua ghẹ tươi sống','View biển Mỹ Khê','Giá chợ tươi'], description:'Nhà hàng hải sản uy tín, tôm cua bắt từ thuyền vào buổi sáng.' },
  { id:5,  name:'Bánh Mì Bà Lan', badge:'Quán hẻm nổi tiếng', badgeColor:'bg-purple-500', badgePulse:false, category:'Bánh mì', location:'Hải Châu, Đà Nẵng', rating:4.9, reviews:3241, priceRange:'15.000đ–25.000đ', priceNote:'/ổ', openNow:false, hours:'06:00–10:00', img:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80', tags:['Ổ bánh mì giòn rụm','Nhân phomát trứng','Xếp hàng mua'], description:'Huyền thoại bánh mì Đà Nẵng, giòn bên ngoài mềm bên trong.' },
  { id:6,  name:'Cà Phê Sân Thượng Việt Ơi', badge:'Cà phê & Check-in hoài niệm', badgeColor:'bg-pink-500', badgePulse:false, category:'Cà phê', location:'Hải Châu, Đà Nẵng', rating:4.7, reviews:1876, priceRange:'35.000đ–75.000đ', priceNote:'/ly', openNow:true,  hours:'07:00–22:30', img:'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=80', tags:['Sân thượng view sông Hàn','Cà phê rang xay tại chỗ','Decor vintage Việt'], description:'Không gian cà phê Việt retro, view toàn cảnh sông Hàn.' },
  // Trang 2
  { id:7,  name:'Cơm Hến Bà Nga', badge:'Mì Quảng gia truyền', badgeColor:'bg-amber-500', badgePulse:false, category:'Cơm hến', location:'Hải Châu, Đà Nẵng', rating:4.8, reviews:765, priceRange:'20.000đ–35.000đ', priceNote:'/phần', openNow:true,  hours:'07:00–13:00', img:'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=600&q=80', tags:['Hến tươi miền Trung','Mắm ruốc đặc trưng','Bữa sáng dân dã'], description:'Cơm hến đậm chất miền Trung, cay nồng vị ký ức Đà Nẵng.' },
  { id:8,  name:'Phở Đặc Biệt Anh Tám', badge:'Đặc sản số 1', badgeColor:'bg-red-500', badgePulse:true, category:'Phở', location:'Thanh Khê, Đà Nẵng', rating:4.6, reviews:1432, priceRange:'40.000đ–70.000đ', priceNote:'/tô', openNow:true,  hours:'05:30–11:00', img:'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=600&q=80', tags:['Nước dùng hầm 12 tiếng','Thịt bò tái chín','Sáng sớm đông khách'], description:'Phở bò gia truyền, nước dùng trong veo hầm từ 3 giờ sáng.' },
  { id:9,  name:'Nem Lụi Bà Hoa', badge:'Quán hẻm nổi tiếng', badgeColor:'bg-purple-500', badgePulse:false, category:'Nem lụi', location:'Sơn Trà, Đà Nẵng', rating:4.8, reviews:654, priceRange:'50.000đ–90.000đ', priceNote:'/phần', openNow:true,  hours:'11:00–21:00', img:'https://images.unsplash.com/photo-1513135467880-6c41603fef6e?w=600&q=80', tags:['Nem nướng thơm phức','Cuốn bánh tráng','Tự cuốn theo ý thích'], description:'Nem lụi nướng than hoa, thơm ngon không nơi nào sánh bằng.' },
  { id:10, name:'Bún Bò Huế Gánh Thơm', badge:'Bún chả cá lâu năm', badgeColor:'bg-blue-500', badgePulse:false, category:'Bún bò Huế', location:'Ngũ Hành Sơn, Đà Nẵng', rating:4.5, reviews:1123, priceRange:'35.000đ–60.000đ', priceNote:'/tô', openNow:false, hours:'06:00–14:00', img:'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&q=80', tags:['Sả nước mắm đặc trưng','Chả cua giò heo','Cay mê mẩn'], description:'Bún bò Huế chuẩn vị, được người Huế sinh sống tại Đà Nẵng yêu thích.' },
  { id:11, name:'Bánh Xèo Bà Ba', badge:'Đặc sản số 1', badgeColor:'bg-red-500', badgePulse:true, category:'Bánh xèo', location:'Hải Châu, Đà Nẵng', rating:4.9, reviews:2098, priceRange:'45.000đ–80.000đ', priceNote:'/cái', openNow:true,  hours:'10:30–21:00', img:'https://images.unsplash.com/photo-1600850056064-a8b380df8395?w=600&q=80', tags:['Bánh xèo giòn 45cm','Nhân tôm thịt đầy','Rau sống tươi ngon'], description:'Bánh xèo đường kính 45cm, giòn rụm, nhân tôm thịt đầy ắp.' },
  { id:12, name:'Lẩu Cá Rô Nướng Sông Hàn', badge:'Hải sản tươi sống', badgeColor:'bg-teal-500', badgePulse:true, category:'Lẩu cá', location:'Hải Châu, Đà Nẵng', rating:4.6, reviews:876, priceRange:'200.000đ–350.000đ', priceNote:'/nồi', openNow:true,  hours:'11:00–23:00', img:'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&q=80', tags:['View sông Hàn','Cá rô nướng sả ớt','Không gian ngoài trời'], description:'Nhà hàng lẩu cá rô đặc sản, view trực diện cầu sông Hàn lung linh.' },
  // Trang 3
  { id:13, name:'Cao Lầu Hội An Giao Lưu', badge:'Mì Quảng gia truyền', badgeColor:'bg-amber-500', badgePulse:false, category:'Cao lầu', location:'Sơn Trà, Đà Nẵng', rating:4.7, reviews:543, priceRange:'40.000đ–65.000đ', priceNote:'/tô', openNow:true,  hours:'08:00–20:00', img:'https://images.unsplash.com/photo-1551326844-4df70f78d0e9?w=600&q=80', tags:['Cao lầu chính hiệu','Thịt heo xá xíu','Bánh crackers giòn'], description:'Cao lầu chuẩn phong cách Hội An, một bước không cần ra Phố cổ.' },
  { id:14, name:'Chè Ba Màu Đà Nẵng', badge:'Cà phê & Check-in hoài niệm', badgeColor:'bg-pink-500', badgePulse:false, category:'Chè', location:'Hải Châu, Đà Nẵng', rating:4.7, reviews:1345, priceRange:'15.000đ–30.000đ', priceNote:'/ly', openNow:true,  hours:'10:00–22:00', img:'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=600&q=80', tags:['Chè đậu đỏ đậu xanh','Nước cốt dừa béo','Giải nhiệt mùa hè'], description:'Chè ba màu mát lạnh, điểm đến giải khát yêu thích của người Đà Nẵng.' },
  { id:15, name:'Mực Nướng Biển Mỹ Khê', badge:'Hải sản tươi sống', badgeColor:'bg-teal-500', badgePulse:true, category:'Hải sản', location:'Ngũ Hành Sơn, Mỹ Khê', rating:4.8, reviews:987, priceRange:'80.000đ–200.000đ', priceNote:'/con', openNow:true,  hours:'16:00–23:30', img:'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&q=80', tags:['Mực tươi nướng than','Nhúng muối ớt xanh','View biển hoàng hôn'], description:'Mực tươi nướng than hoa bên bãi biển Mỹ Khê, ăn ngắm hoàng hôn.' },
  { id:16, name:'Bánh Canh Bà Thuận', badge:'Bún chả cá lâu năm', badgeColor:'bg-blue-500', badgePulse:false, category:'Bánh canh', location:'Hải Châu, Đà Nẵng', rating:4.6, reviews:654, priceRange:'30.000đ–50.000đ', priceNote:'/tô', openNow:false, hours:'06:00–11:30', img:'https://images.unsplash.com/photo-1540189549336-e6e99eb4b1c2?w=600&q=80', tags:['Sợi bánh canh bột gạo','Cua chả mọc đầy','Nước lèo ngọt tự nhiên'], description:'Bánh canh bột gạo sợi to, nước lèo ngọt thanh từ xương ống.' },
  { id:17, name:'Mì Hoành Thánh Tàu Bay', badge:'Đặc sản số 1', badgeColor:'bg-red-500', badgePulse:true, category:'Mì', location:'Thanh Khê, Đà Nẵng', rating:4.5, reviews:876, priceRange:'35.000đ–55.000đ', priceNote:'/tô', openNow:true,  hours:'07:00–20:00', img:'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80', tags:['Hoành thánh mỏng vỏ','Nước tương dầu mè','Ký ức người Hoa'], description:'Mì hoành thánh phong cách người Hoa, tồn tại hơn 50 năm tại Đà Nẵng.' },
  { id:18, name:'Quán Cơm Bà Ngoại', badge:'Quán hẻm nổi tiếng', badgeColor:'bg-purple-500', badgePulse:false, category:'Cơm nhà', location:'Liên Chiểu, Đà Nẵng', rating:4.8, reviews:432, priceRange:'30.000đ–55.000đ', priceNote:'/suất', openNow:true,  hours:'10:30–14:00', img:'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600&q=80', tags:['Cơm nhà bình dị','Nhiều món thay đổi hàng ngày','Bán hết sớm'], description:'Cơm nhà theo phong cách bà ngoại nấu, hơn 15 món thay đổi mỗi ngày.' },
  // Trang 4
  { id:19, name:'Gỏi Cuốn Tôm Thịt Bà Sáu', badge:'Đặc sản số 1', badgeColor:'bg-red-500', badgePulse:true, category:'Gỏi cuốn', location:'Hải Châu, Đà Nẵng', rating:4.7, reviews:765, priceRange:'20.000đ–35.000đ', priceNote:'/cuốn', openNow:true,  hours:'10:00–20:00', img:'https://images.unsplash.com/photo-1562802378-063ec186a863?w=600&q=80', tags:['Gỏi cuốn tươi ngon','Nước chấm đặc biệt','Rau thơm phong phú'], description:'Gỏi cuốn sạch ngon, tươi mát chuẩn vị Nam Bộ giữa lòng Đà Nẵng.' },
  { id:20, name:'Bia Hơi Đà Nẵng Phạm Cự Lượng', badge:'Quán hẻm nổi tiếng', badgeColor:'bg-purple-500', badgePulse:false, category:'Bia hơi', location:'Hải Châu, Đà Nẵng', rating:4.6, reviews:1987, priceRange:'10.000đ–25.000đ', priceNote:'/ly', openNow:true,  hours:'14:00–23:00', img:'https://images.unsplash.com/photo-1555658636-6e4a36218be7?w=600&q=80', tags:['Bia hơi chính hiệu Đà Nẵng','Mồi đa dạng','Không khí vỉa hè đặc trưng'], description:'Văn hóa bia hơi đường phố Đà Nẵng, giao lưu cuối ngày của người địa phương.' },
  { id:21, name:'Chả Bò Huỳnh Thúc Kháng', badge:'Mì Quảng gia truyền', badgeColor:'bg-amber-500', badgePulse:false, category:'Chả bò', location:'Hải Châu, Đà Nẵng', rating:4.9, reviews:1234, priceRange:'50.000đ–150.000đ', priceNote:'/gói', openNow:true,  hours:'08:00–18:00', img:'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&q=80', tags:['Chả bò thứ thiệt','Quà tặng đặc sản','Đóng gói chân không'], description:'Chả bò Đà Nẵng nổi tiếng toàn quốc, quà tặng không thể thiếu.' },
  { id:22, name:'Cháo Lươn Bà Chín', badge:'Bún chả cá lâu năm', badgeColor:'bg-blue-500', badgePulse:false, category:'Cháo', location:'Thanh Khê, Đà Nẵng', rating:4.6, reviews:543, priceRange:'30.000đ–50.000đ', priceNote:'/tô', openNow:false, hours:'06:00–12:00', img:'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80', tags:['Lươn đồng sạch','Cháo sánh ngọt tự nhiên','Thêm tiêu gừng đặc trưng'], description:'Cháo lươn đồng miền Trung thứ thiệt, ấm bụng sáng sớm.' },
  { id:23, name:'Nộm Sứa Biển Thanh Bình', badge:'Hải sản tươi sống', badgeColor:'bg-teal-500', badgePulse:true, category:'Hải sản', location:'Sơn Trà, Đà Nẵng', rating:4.5, reviews:432, priceRange:'25.000đ–40.000đ', priceNote:'/phần', openNow:true,  hours:'15:00–22:00', img:'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80', tags:['Sứa biển tươi giòn','Giấm tỏi chua ngọt','Món ăn vặt buổi chiều'], description:'Nộm sứa biển đặc sản Đà Nẵng, chua ngọt mát lạnh chiều hè.' },
  { id:24, name:'Cà Phê Trứng Phố Cổ', badge:'Cà phê & Check-in hoài niệm', badgeColor:'bg-pink-500', badgePulse:false, category:'Cà phê', location:'Hải Châu, Đà Nẵng', rating:4.8, reviews:2134, priceRange:'40.000đ–80.000đ', priceNote:'/ly', openNow:true,  hours:'07:00–22:00', img:'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&q=80', tags:['Cà phê trứng Hà Nội','Decor nhà cổ','Ảnh check-in đẹp'], description:'Phong cách cà phê trứng Hà Nội giữa không gian nhà cổ Đà Nẵng.' },
];

const TOTAL_DISPLAY = 96;
const PLACES_PER_PAGE = 6;

const CATEGORIES = [
  'Tất cả', 'Mì Quảng', 'Bánh tráng cuốn', 'Bún chả cá',
  'Hải sản', 'Cà phê', 'Bánh xèo', 'Phở',
];

const CAT_TINT: Record<string, string> = {
  'Mì Quảng': 'bg-amber-500',
  'Hải sản': 'bg-teal-500',
  'Cà phê': 'bg-pink-500',
  'Bánh xèo': 'bg-orange-500',
  'Phở': 'bg-red-500',
  'Tất cả': 'bg-gray-800',
};

const TIME_FILTERS = ['Tất cả khung giờ', 'Sáng sớm (6-9h)', 'Trưa (11-14h)', 'Tối (18-23h)'];
const DAY_FILTERS  = ['Tất cả ngày', 'Cuối tuần', 'Ngày thường'];

const SORT_OPTIONS = [
  { value: 'recommended', label: 'Đề xuất' },
  { value: 'rating',      label: 'Đánh giá cao nhất' },
  { value: 'reviews',     label: 'Nhiều đánh giá nhất' },
  { value: 'name',        label: 'Tên A–Z' },
];

const TRUST_BADGES = [
  { icon: Users,       color: 'text-teal-600',  bg: 'bg-teal-50',   title: 'Xác minh bởi cộng đồng', desc: 'Hàng nghìn thực khách đánh giá mỗi ngày.' },
  { icon: Zap,         color: 'text-orange-500', bg: 'bg-orange-50', title: 'Cập nhật theo thời gian thực', desc: 'Giá & giờ mở cửa được cập nhật liên tục.' },
  { icon: ThumbsUp,    color: 'text-blue-600',   bg: 'bg-blue-50',   title: 'Chỉ đường chính xác', desc: 'Tích hợp bản đồ, dẫn đường từng ngõ hẻm.' },
  { icon: CalendarClock, color: 'text-purple-600', bg: 'bg-purple-50', title: 'Gợi ý theo khung giờ', desc: 'Biết ngay nơi đang mở cửa phù hợp ngay bây giờ.' },
];

// ─────────────────────────────────────────────────────────────────────────────
// BLUR PLACEHOLDER
// ─────────────────────────────────────────────────────────────────────────────
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
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.25 }} className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 ease-out border border-gray-100 cursor-pointer">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <Image
          src={place.img}
          alt={place.name}
          fill
          className="object-cover group-hover:scale-[1.08] transition-transform duration-500 ease-out"
          sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,33vw"
          placeholder="blur"
          blurDataURL={BLUR}
        />
        {/* Badge góc trên trái */}
        <div
          className={`absolute top-3 left-3 ${place.badgeColor} text-white text-[10px] font-bold px-2.5 py-1 rounded-full ${
            place.badgePulse ? 'animate-[pulse_2s_ease-in-out_infinite]' : ''
          }`}
        >
          {place.badge}
        </div>
        {/* Bookmark button góc trên phải */}
        <button
          onClick={(e) => { e.stopPropagation(); onSave(); }}
          className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all duration-200"
          aria-label={saved ? 'Bỏ lưu' : 'Lưu địa điểm'}
        >
          <Bookmark
            size={15}
            className={`transition-all duration-200 ${saved ? 'fill-orange-500 text-orange-500 scale-110' : 'text-gray-400'}`}
          />
        </button>
        {/* Trạng thái mở cửa */}
        <div className="absolute bottom-3 left-3">
          <span
            className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm ${
              place.openNow
                ? 'bg-green-500/80 text-white'
                : 'bg-gray-800/70 text-white/80'
            }`}
          >
            {place.openNow && (
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            )}
            {place.openNow ? 'Đang mở cửa' : 'Đã đóng cửa'}
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4">
        <h3 className="font-bold text-[#0f2942] text-sm leading-snug line-clamp-1 mb-1">
          {place.name}
        </h3>
        <div className="flex items-center gap-1 text-xs text-gray-500 group-hover:text-gray-600 transition-colors mb-2">
          <MapPin size={11} className="flex-shrink-0" />
          <span className="truncate">{place.location}</span>
        </div>
        {/* Rating */}
        <div className="flex items-center gap-1 mb-2">
          <Star size={12} className="fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-semibold text-gray-800">{place.rating}</span>
          <span className="text-xs text-gray-400">
            ({place.reviews.toLocaleString('vi-VN')} đánh giá)
          </span>
        </div>
        {/* Hours */}
        <div className="flex items-center gap-1 text-xs text-gray-400 group-hover:text-gray-600 transition-colors mb-3">
          <Clock size={11} />
          {place.hours}
        </div>
        {/* Price + actions */}
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-orange-500 font-bold text-sm leading-tight">
              {place.priceRange}
            </p>
            <p className="text-xs text-gray-400">{place.priceNote}</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onSave(); }}
              className={`text-[11px] font-medium px-3 py-1.5 rounded-xl border transition-all duration-200 ${
                saved
                  ? 'border-orange-400 text-orange-500 bg-orange-50'
                  : 'border-gray-200 text-gray-600 hover:border-teal-400 hover:text-teal-600'
              }`}
            >
              {saved ? '✓ Đã lưu' : 'Lưu'}
            </button>
            <button className="group/dir btn-ripple flex items-center gap-1 bg-[#0f2942] hover:bg-[#1a3f5c] text-white text-[11px] font-semibold px-3 py-1.5 rounded-xl transition-all">
              <motion.span whileHover={{ x: 2 }}>
                <Navigation
                  size={11}
                  className="transition-transform duration-200 group-hover/dir:translate-x-0.5 group-hover/dir:-translate-y-0.5"
                />
              </motion.span>
              Chỉ đường
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON CARD
// ─────────────────────────────────────────────────────────────────────────────
function FoodSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100">
      <div className="h-48 bg-gray-200 animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
        <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
        <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3" />
        <div className="flex justify-between items-end pt-1">
          <div className="space-y-1.5">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-28" />
          </div>
          <div className="h-8 bg-gray-200 rounded-xl animate-pulse w-20" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function AmThucPage() {
  const [savedPlaces, setSavedPlaces] = useState<Set<number>>(new Set());
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [activeTime, setActiveTime]         = useState('Tất cả khung giờ');
  const [activeDay, setActiveDay]           = useState('Tất cả ngày');
  const [sortBy, setSortBy] = useState<string>('recommended');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [nearMe, setNearMe] = useState(false);

  const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start']
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);



  const toggleSave = (id: number) => {
    setSavedPlaces(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const applyFilter = useCallback((fn: () => void) => {
    setIsLoading(true);
    fn();
    setCurrentPage(1);
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  // ── Filtering + sorting ──────────────────────────────────────────────────
  let filtered = FOOD_PLACES.filter(p => {
    if (activeCategory !== 'Tất cả' && p.category !== activeCategory) return false;
    if (nearMe) return true; // demo: nearMe giữ tất cả
    return true;
  });

  if (sortBy === 'rating')   filtered = [...filtered].sort((a, b) => b.rating - a.rating);
  if (sortBy === 'reviews')  filtered = [...filtered].sort((a, b) => b.reviews - a.reviews);
  if (sortBy === 'name')     filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name, 'vi'));

  const totalPages = Math.ceil(filtered.length / PLACES_PER_PAGE);
  const paginated  = filtered.slice((currentPage - 1) * PLACES_PER_PAGE, currentPage * PLACES_PER_PAGE);

  const changePage = (p: number) => {
    setIsLoading(true);
    setCurrentPage(p);
    setTimeout(() => {
      setIsLoading(false);
      document.getElementById('food-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 400);
  };

  // Pagination window
  const pageWindow = () => {
    const delta = 2;
    const range: number[] = [];
    for (let i = Math.max(1, currentPage - delta); i <= Math.min(totalPages, currentPage + delta); i++) {
      range.push(i);
    }
    return range;
  };

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* ═══ PHẦN 1: MINI HERO BANNER ════════════════════════════════════════
          Ảnh: Mâm bánh xèo tôm thịt vàng giòn đặt đẹp — gợi cảm giác
          ẩm thực Miền Trung phong phú, màu vàng ấm hài hoà với tông cam
          thương hiệu DanangGo.
          Ken Burns scale nhẹ; badge cố định góc phải (không đè filter card)
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        data-navbar-overlay="true"
        className="relative h-[320px] sm:h-[340px] overflow-hidden"
      >
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 via-black/10 to-transparent pointer-events-none z-20" />
        {/* Ảnh nền Ken Burns */}
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
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#071a2e]/55 via-[#0f2942]/45 to-[#071a2e]/82" />

        {/* Badge "Được tuyển chọn" — cố định góc trên phải, không đè filter card */}
        <div
          className="absolute top-20 right-6 sm:right-8 z-20"
          style={{ opacity: 0, animation: 'fade-up 0.5s 0.3s ease-out forwards' }}
        >
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 text-white rounded-full px-4 py-1.5 text-xs font-semibold">
            <CheckCircle size={12} className="text-green-300" />
            Được tuyển chọn &amp; xác minh bởi DanangGo
          </div>
        </div>

        {/* Nội dung banner — neo xuống đáy với pb-10 */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 flex flex-col justify-end h-full pb-10 pt-16">
          {/* Breadcrumb */}
          <div
            className="flex items-center gap-1 text-sm text-white/70 mb-3"
            style={{ opacity: 0, animation: 'fade-up 0.5s 0.1s ease-out forwards' }}
          >
            <Link href="/" className="hover:text-white transition-colors">Trang chủ</Link>
            <ChevronRight size={14} className="text-white/40" />
            <span className="text-white font-medium">Ẩm thực Đà Nẵng</span>
          </div>

          {/* Badge danh mục */}
          <div
            style={{ opacity: 0, animation: 'fade-up 0.5s 0.15s ease-out forwards' }}
            className="mb-2"
          >
            <span className="inline-flex items-center gap-2 bg-orange-500/80 backdrop-blur-sm text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              🗺️ BẢN ĐỒ VỊ GIÁC MIỀN TRUNG
            </span>
          </div>

          {/* Tiêu đề + counter */}
          <div style={{ opacity: 0, animation: 'fade-up 0.55s 0.2s ease-out forwards' }}>
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

      {/* ═══ PHẦN 2: FILTER CARD — overlap lên đáy banner (-mt-8) ════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-8 relative z-10 mb-8">
        <Reveal delay={0.1}>
          <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-6 border border-gray-100">

            {/* Hàng 1: Category pills với layoutId framer-motion */}
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 mb-2.5">Danh mục món ăn</p>
              <LayoutGroup id="amthuc-cat">
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
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
                          className={`absolute inset-0 rounded-[inherit] ${CAT_TINT[cat] ?? 'bg-teal-500'}`}
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

            <div className="h-px bg-gray-100 mb-4" />

            {/* Hàng 2: Khung giờ + Ngày + Sắp xếp + Gần tôi */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Khung giờ */}
              <div className="flex items-center gap-1.5">
                <Clock size={13} className="text-gray-400" />
                <select
                  value={activeTime}
                  onChange={e => applyFilter(() => setActiveTime(e.target.value))}
                  className="text-xs border border-gray-200 rounded-xl px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-all bg-gray-50"
                >
                  {TIME_FILTERS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Ngày */}
              <div className="flex items-center gap-1.5">
                <Calendar size={13} className="text-gray-400" />
                <select
                  value={activeDay}
                  onChange={e => applyFilter(() => setActiveDay(e.target.value))}
                  className="text-xs border border-gray-200 rounded-xl px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-all bg-gray-50"
                >
                  {DAY_FILTERS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* Sắp xếp */}
              <div className="flex items-center gap-1.5">
                <ArrowUpDown size={13} className="text-[#0f2942]" />
                <select
                  value={sortBy}
                  onChange={e => applyFilter(() => setSortBy(e.target.value))}
                  className="text-xs border border-gray-200 rounded-xl px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-all bg-gray-50"
                >
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
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

              {/* Live map status */}
              <div className="ml-auto hidden sm:flex items-center gap-1.5 text-xs text-gray-400">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Bản đồ đang cập nhật theo thời gian thực
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      {/* ═══ PHẦN 3: FOOD GRID ══════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-4">
        {/* Results bar */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            Hiển thị{' '}
            <span className="font-semibold text-[#0f2942]">
              {(currentPage - 1) * PLACES_PER_PAGE + 1}–
              {Math.min(currentPage * PLACES_PER_PAGE, filtered.length)}
            </span>{' '}
            trên{' '}
            <span className="font-semibold text-[#0f2942]">{filtered.length}</span> địa điểm ẩm thực
          </p>
          {activeCategory !== 'Tất cả' && (
            <span className="text-xs bg-orange-100 text-orange-600 px-2.5 py-1 rounded-full font-medium">
              Đang lọc: {activeCategory}
            </span>
          )}
        </div>

        <div id="food-grid" className="scroll-mt-24">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => <FoodSkeleton key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg mb-2">Không tìm thấy địa điểm phù hợp</p>
              <button onClick={() => applyFilter(() => setActiveCategory('Tất cả'))} className="text-teal-600 font-medium text-sm hover:underline">
                Xóa bộ lọc
              </button>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={`food-${currentPage}-${activeCategory}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {paginated.map((place, i) => (
                  <motion.div
                    key={place.id}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: prefersReduced ? 0 : i * 0.07, ease: [0.25,0.46,0.45,0.94] }}
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

      {/* ═══ PHẦN 4: PAGINATION ══════════════════════════════════════════════ */}
      {totalPages > 1 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex justify-center">
          <div className="flex items-center gap-2">
            {/* Prev */}
            <button
              onClick={() => currentPage > 1 && changePage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`flex items-center justify-center w-9 h-9 rounded-xl border transition-all ${
                currentPage === 1 ? 'opacity-40 cursor-not-allowed border-gray-200 text-gray-400' : 'border-gray-200 text-gray-600 hover:bg-gray-100 hover:scale-105'
              }`}
            >
              <ChevronRight size={16} className="rotate-180" />
            </button>

            {pageWindow()[0] > 1 && (
              <>
                <button onClick={() => changePage(1)} className="w-9 h-9 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-100 transition-all">1</button>
                {pageWindow()[0] > 2 && <span className="text-gray-400 px-1">…</span>}
              </>
            )}

            {pageWindow().map(p => (
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

            {pageWindow()[pageWindow().length - 1] < totalPages && (
              <>
                {pageWindow()[pageWindow().length - 1] < totalPages - 1 && <span className="text-gray-400 px-1">…</span>}
                <button onClick={() => changePage(totalPages)} className="w-9 h-9 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-100 transition-all">{totalPages}</button>
              </>
            )}

            {/* Next */}
            <button
              onClick={() => currentPage < totalPages && changePage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`flex items-center justify-center w-9 h-9 rounded-xl border transition-all ${
                currentPage === totalPages ? 'opacity-40 cursor-not-allowed border-gray-200 text-gray-400' : 'border-gray-200 text-gray-600 hover:bg-gray-100 hover:scale-105'
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
            Vì sao chọn ẩm thực trên{' '}
            <span className="text-cyan-500">Danang</span>
            <span className="text-orange-400">Go</span>?
          </h2>
        </Reveal>
        {/* items-stretch + Reveal className="flex" để card đồng chiều cao */}
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
                DanangGo giúp bạn lập hành trình ẩm thực trọn vẹn — kết hợp quán ăn,
                địa điểm tham quan và lưu trú thành một chuyến đi hoàn hảo.
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

      {/* ═══ PHẦN 7: FOOTER (đồng bộ với trang chủ và Lưu trú) ════════════ */}
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
              <div className="flex gap-3">
                {[{ label: 'FB', color: 'bg-blue-600' }, { label: 'IG', color: 'bg-pink-600' }, { label: 'TT', color: 'bg-gray-700' }, { label: 'YT', color: 'bg-red-600' }].map(s => (
                  <a key={s.label} href="#" className={`w-8 h-8 ${s.color} rounded-full flex items-center justify-center text-white text-xs font-bold hover:opacity-80 transition-opacity`}>{s.label}</a>
                ))}
              </div>
            </div>
            {/* Khám phá */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Khám phá</h4>
              <ul className="space-y-2.5">
                {['Điểm du lịch', 'Ẩm thực', 'Lưu trú', 'Mua sắm', 'Giải trí'].map(link => (
                  <li key={link}><a href="#" className="text-sm hover:text-white transition-colors">{link}</a></li>
                ))}
              </ul>
            </div>
            {/* Tiện ích */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Tiện ích</h4>
              <ul className="space-y-2.5">
                {['Tạo lịch trình', 'Bản đồ thành phố', 'Thời tiết', 'Đặt vé online', 'Hỏi đáp'].map(link => (
                  <li key={link}><a href="#" className="text-sm hover:text-white transition-colors">{link}</a></li>
                ))}
              </ul>
            </div>
            {/* Liên hệ */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Liên hệ</h4>
              <ul className="space-y-2.5">
                <li className="text-sm">📧 hello@dananggo.vn</li>
                <li className="text-sm">📞 0236 386 5xxx</li>
                <li className="text-sm">📍 Đà Nẵng, Việt Nam</li>
              </ul>
              <div className="mt-4 space-y-1.5">
                {['Về chúng tôi', 'Tuyển dụng', 'Báo chí'].map(link => (
                  <a key={link} href="#" className="block text-sm hover:text-white transition-colors">{link}</a>
                ))}
              </div>
            </div>
          </div>
          {/* Copyright */}
          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
            <p>© 2025 DanangGo. Made with ❤️ in Đà Nẵng, Việt Nam.</p>
            <div className="flex gap-4">
              {['Điều khoản sử dụng', 'Chính sách bảo mật'].map(s => (
                <a key={s} href="#" className="hover:text-white/70 transition-colors">{s}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
