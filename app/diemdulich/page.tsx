'use client';

import { useState } from 'react';
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
  ChevronDown
} from 'lucide-react';


import Footer from '@/components/Footer';
import ParallaxBanner from '@/components/attractions/ParallaxBanner';
import StoryCard, { AttractionData } from '@/components/attractions/StoryCard';
import RadarMapPreview from '@/components/attractions/RadarMapPreview';

// --- DATA ---
const RAW_ATTRACTIONS = [
  { id:1, name:'Bãi biển Mỹ Khê', category:'Biển & Đảo', location:'Sơn Trà', rating:4.9, visitors: 245000, img:'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600&q=80', shortDesc:'Bãi biển cát trắng mịn dài 9km, làn nước trong xanh mát lành...', longDesc:'Được tạp chí Forbes vinh danh là một trong 6 bãi biển quyến rũ nhất hành tinh. Bãi biển Mỹ Khê thu hút du khách bởi bờ cát trắng mịn, sóng biển ôn hòa và các hoạt động thể thao trên nước sôi động.' },
  { id:2, name:'Cầu Vàng Bà Nà Hills', category:'Chụp ảnh Check-in', location:'Hòa Vang', rating:4.8, visitors: 420000, img:'https://images.unsplash.com/photo-1582650949186-c5dc3bba5b7c?w=600&q=80', shortDesc:'Biểu tượng kiến trúc thế giới — đôi bàn tay khổng lồ đỡ cây cầu vàng...', longDesc:'Nằm ở độ cao 1.414m so với mực nước biển, Cầu Vàng là tuyệt tác kiến trúc vắt ngang bầu trời sương mù Bà Nà. Đứng tại đây, bạn có thể phóng tầm mắt bao quát toàn cảnh núi rừng chập chùng tuyệt đẹp.' },
  { id:3, name:'Bán đảo Sơn Trà', category:'Núi & Rừng', location:'Sơn Trà', rating:4.8, visitors: 112000, img:'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&q=80', shortDesc:'Lá phổi xanh của Đà Nẵng — nơi sinh sống của đàn voọc chà vá...', longDesc:'Khu bảo tồn thiên nhiên rộng lớn bảo vệ hơn hàng ngàn hecta rừng nguyên sinh. Cung đường vòng quanh bán đảo mang đến khung cảnh ngoạn mục của biển Đông và cơ hội bắt gặp nữ hoàng linh trưởng - Voọc chà vá chân nâu.' },
  { id:4, name:'Ngũ Hành Sơn', category:'Văn hoá & Lịch sử', location:'Ngũ Hành Sơn', rating:4.7, visitors: 185000, img:'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80', shortDesc:'Quần thể 5 ngọn núi đá cẩm thạch linh thiêng, hàng chục chùa chiền...', longDesc:'Di tích lịch sử văn hóa cấp Quốc gia với 5 ngọn núi đá vôi: Kim, Mộc, Thủy, Hỏa, Thổ. Khám phá các hang động huyền bí như động Huyền Không, động Âm Phủ và các ngôi cổ tự linh thiêng hàng trăm năm tuổi.' },
  { id:5, name:'Công viên Châu Á (Asia Park)', category:'Vui chơi giải trí', location:'Hải Châu', rating:4.5, visitors: 200000, img:'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&q=80', shortDesc:'Khu vui chơi giải trí quy mô lớn với vòng đu quay khổng lồ Sun Wheel...', longDesc:'Nơi hội tụ tinh hoa văn hóa của 10 quốc gia châu Á. Tận hưởng cảm giác mạnh với hàng chục trò chơi đẳng cấp thế giới và chiêm ngưỡng toàn cảnh Đà Nẵng lung linh về đêm từ vòng quay Sun Wheel cao 115m.' },
  { id:6, name:'Cầu Rồng', category:'Chụp ảnh Check-in', location:'Hải Châu', rating:4.8, visitors: 350000, img:'https://images.unsplash.com/photo-1559493442-0eaaba8bb6ce?w=600&q=80', shortDesc:'Cây cầu hình con rồng phun lửa và phun nước mỗi cuối tuần...', longDesc:'Biểu tượng của sự chuyển mình mạnh mẽ của Đà Nẵng. Mỗi tối thứ 7 và Chủ nhật lúc 21h00, Cầu Rồng sẽ trình diễn phun lửa và phun nước tạo nên cảnh tượng vô cùng hoành tráng thu hút hàng ngàn du khách.' },
];

const MORE_RAW_ATTRACTIONS = [
  { id:7, name:'Chùa Linh Ứng Sơn Trà', category:'Văn hoá & Lịch sử', location:'Sơn Trà', rating:4.9, visitors: 280000, img:'https://images.unsplash.com/photo-1546587348-d12660c30c50?w=600&q=80', shortDesc:'Ngôi chùa linh thiêng nhìn ra biển Đông, tượng Phật Quan Âm 67m...', longDesc:'Tọa lạc trên đồi cao của bán đảo Sơn Trà, nổi bật với tượng Phật Bà Quan Âm cao 67m (tương đương tòa nhà 30 tầng) hướng mặt ra biển Đông, lưng tựa vào cánh rừng nguyên sinh.' },
  { id:8, name:'Đỉnh Bà Nà Hills', category:'Núi & Rừng', location:'Hòa Vang', rating:4.8, visitors: 450000, img:'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80', shortDesc:'Cáp treo dài nhất thế giới đưa bạn lên độ cao 1.487m...', longDesc:'Đường lên tiên cảnh với hệ thống cáp treo đạt 4 kỷ lục Guinness thế giới. Trải nghiệm 4 mùa trong 1 ngày, lạc bước trong Làng Pháp cổ kính và vườn hoa Le Jardin D’Amour lãng mạn.' },
  { id:9, name:'Bảo tàng Điêu khắc Chăm', category:'Văn hoá & Lịch sử', location:'Hải Châu', rating:4.7, visitors: 95000, img:'https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=600&q=80', shortDesc:'Bộ sưu tập điêu khắc Chăm lớn nhất thế giới — hơn 2.000 hiện vật...', longDesc:'Bảo tàng duy nhất trên thế giới về nền văn hóa Chăm Pa. Lưu giữ hàng ngàn bức phù điêu, tượng đá sa thạch miêu tả các vị thần Ấn Độ giáo tinh xảo từ thế kỷ 7 đến thế kỷ 15.' },
  { id:10, name:'Rạn Nam Ô', category:'Biển & Đảo', location:'Liên Chiểu', rating:4.6, visitors: 65000, img:'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=600&q=80', shortDesc:'Bãi đá hoang sơ phủ đầy rêu xanh mướt vào đầu xuân...', longDesc:'Nổi tiếng với những bãi đá phủ đầy rêu xanh tuyệt đẹp vào mùa xuân. Nước biển ở đây trong vắt, là điểm đến lý tưởng cho những ai thích vẻ đẹp hoang sơ, yên bình và những bức ảnh sống ảo cực chất.' },
  { id:11, name:'Công viên APEC', category:'Chụp ảnh Check-in', location:'Hải Châu', rating:4.5, visitors: 120000, img:'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&q=80', shortDesc:'Công viên kiến trúc độc đáo với mái vòm hình cánh diều uốn lượn...', longDesc:'Biểu tượng mới của Đà Nẵng bên bờ sông Hàn. Mái vòm thép uốn lượn hình cánh diều cùng hệ thống chiếu sáng đèn LED nghệ thuật về đêm tạo nên một không gian check-in vô cùng hiện đại và ảo diệu.' },
  { id:12, name:'Suối khoáng nóng Thần Tài', category:'Vui chơi giải trí', location:'Hòa Vang', rating:4.6, visitors: 110000, img:'https://images.unsplash.com/photo-1520962880247-cfaf541c8724?w=600&q=80', shortDesc:'Công viên suối khoáng nóng quy mô lớn giữa không gian rừng núi...', longDesc:'Nơi hoàn hảo để tái tạo năng lượng với dòng suối khoáng nóng tự nhiên. Trải nghiệm tắm bùn, tắm onsen Nhật Bản và khu vui chơi công viên nước sôi động giữa núi rừng mát mẻ.' },
];

function mapData(raw: any[]): AttractionData[] {
  return raw.map(item => {
    let tint: AttractionData['badgeTint'] = 'blue';
    if (item.category === 'Núi & Rừng') tint = 'green';
    else if (item.category === 'Văn hoá & Lịch sử') tint = 'amber';
    else if (item.category === 'Chụp ảnh Check-in') tint = 'pink';
    else if (item.category === 'Vui chơi giải trí') tint = 'purple';
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
  { label: 'Vui chơi giải trí', value: 'Vui chơi giải trí', Icon: FerrisWheel, tint: 'bg-purple-50 text-purple-600', active: 'bg-purple-500 text-white shadow-lg shadow-purple-500/30' },
];

export default function DiemDuLichPage() {

  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [items, setItems] = useState<AttractionData[]>(INITIAL_ATTRACTIONS);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());

  const handleLike = (id: number) => {
    setLikedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const loadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setItems(prev => [...prev, ...MORE_ATTRACTIONS]);
      setHasMore(false);
      setIsLoadingMore(false);
    }, 800);
  };

  const filteredItems = items.filter(item => activeCategory === 'Tất cả' || item.category === activeCategory);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col overflow-x-hidden">
      {/* 1. PARALLAX BANNER */}
      <ParallaxBanner />

      {/* 2. FILTER CARD OVERLAP */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-10 relative z-20 mb-12 w-full">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl p-4 md:p-6 border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center"
        >
          {/* Categories */}
          <LayoutGroup>
            <div className="flex items-center gap-2 overflow-x-auto w-full pb-2 md:pb-0 hide-scrollbar mask-edges">
              {CATEGORIES.map(cat => {
                const isActive = activeCategory === cat.value;
                return (
                  <button
                    key={cat.value}
                    onClick={() => setActiveCategory(cat.value)}
                    className={`relative px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap text-sm font-semibold transition-all duration-300 flex-shrink-0 ${isActive ? cat.active : cat.tint + ' hover:brightness-95'}`}
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
          <div className="flex items-center gap-3 w-full md:w-auto shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100">
            <button className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-[#0f2942] transition-colors bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200">
              <ArrowUpDown size={14} /> Mới nhất
            </button>
            <button className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-red-500 transition-colors px-3 py-2.5">
              <RefreshCw size={14} /> Xóa lọc
            </button>
          </div>
        </motion.div>
      </div>

      {/* 3. STORY CARDS GRID */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 w-full">
        <AnimatePresence mode="popLayout">
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {filteredItems.map((item, index) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
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

        {/* Load More Button */}
        {hasMore && filteredItems.length > 0 && (
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
                <><Loader2 size={18} className="animate-spin" /> Đang tải thêm...</>
              ) : (
                <>Xem thêm 58 điểm đến khác <ChevronDown size={18} className="group-hover:translate-y-1 transition-transform" /></>
              )}
            </button>
          </motion.div>
        )}
      </div>

      {/* 4. RADAR MAP PREVIEW (SMART MAP SHOWCASE) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-24 w-full">
        <RadarMapPreview />
      </div>

      {/* 5. FOOTER */}
      <Footer />
    </div>
  );
}
