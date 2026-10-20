'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star, MapPin, ChevronRight, Compass } from 'lucide-react';

const SIMILAR_PLACES = [
  {
    id: 1,
    name: 'Mì Quảng Bà Vị',
    category: 'Mì Quảng gia truyền',
    location: 'Hải Châu, Đà Nẵng',
    rating: 4.9,
    price: '25.000₫ – 45.000₫',
    img: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600&q=80',
  },
  {
    id: 2,
    name: 'Bánh Tráng Cuốn Thịt Heo Trần',
    category: 'Đặc sản số 1',
    location: 'Sơn Trà, Đà Nẵng',
    rating: 4.8,
    price: '60.000₫ – 120.000₫',
    img: 'https://images.unsplash.com/photo-1561189386-42f49bcc29ef?w=600&q=80',
  },
  {
    id: 3,
    name: 'Bún Chả Cá Bà Loan',
    category: 'Bún chả cá lâu năm',
    location: 'Thanh Khê, Đà Nẵng',
    rating: 4.7,
    price: '30.000₫ – 50.000₫',
    img: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600&q=80',
  },
  {
    id: 5,
    name: 'Bánh Mì Bà Lan',
    category: 'Huyền thoại đường phố',
    location: 'Hải Châu, Đà Nẵng',
    rating: 4.9,
    price: '15.000₫ – 25.000₫',
    img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  },
];

export default function SimilarPlacesSection({ currentId }: { currentId: number }) {
  const filtered = SIMILAR_PLACES.filter((p) => p.id !== currentId);

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 mb-8 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-cyan-100 text-cyan-600 rounded-xl shadow-sm">
            <Compass size={18} />
          </span>
          <h3 className="text-lg sm:text-xl font-extrabold text-[#0f2942]">
            Gợi ý địa điểm tương tự tại Đà Nẵng
          </h3>
        </div>
        <Link
          href="/amthuc"
          className="text-xs sm:text-sm font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 group"
        >
          <span>Xem tất cả</span>
          <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* CAROUSEL KÉO NGANG VỚI SNAP */}
      <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-none -mx-2 px-2">
        {filtered.map((item) => (
          <Link
            key={item.id}
            href={`/places/${item.id}`}
            className="w-64 sm:w-72 shrink-0 snap-start group"
          >
            <motion.div
              whileHover={{ y: -4 }}
              className="bg-gray-50/70 hover:bg-white border border-gray-100 hover:border-orange-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
            >
              <div className="relative h-36 w-full overflow-hidden">
                <Image
                  src={item.img}
                  alt={item.name}
                  fill
                  className="object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
                  sizes="288px"
                />
                <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-black/60 backdrop-blur-md text-white">
                  {item.category}
                </span>
              </div>
              <div className="p-3.5 space-y-1.5">
                <h4 className="font-bold text-sm text-[#0f2942] group-hover:text-orange-600 transition-colors truncate">
                  {item.name}
                </h4>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1 truncate max-w-[130px]">
                    <MapPin size={11} className="shrink-0" />
                    <span className="truncate">{item.location}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 font-semibold text-gray-700">
                    <Star size={12} className="fill-amber-400 text-amber-400" />
                    <span>{item.rating}</span>
                  </div>
                </div>
                <p className="text-xs font-extrabold text-orange-500 pt-1">
                  {item.price}
                </p>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}
