'use client';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Heart, MapPin, Star, Users, ArrowRight } from 'lucide-react';
import { useState } from 'react';

export interface AttractionData {
  id: number;
  name: string;
  category: string;
  location: string;
  rating: number;
  visitors: number;
  img: string;
  shortDesc: string;
  longDesc: string;
  badgeTint: 'blue' | 'green' | 'amber' | 'pink' | 'purple';
}

interface Props {
  data: AttractionData;
  liked: boolean;
  onLike: () => void;
}

const tintColors = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  amber: 'bg-amber-500',
  pink: 'bg-pink-500',
  purple: 'bg-purple-500'
};

const tintText = {
  blue: 'text-blue-600 bg-blue-50',
  green: 'text-green-600 bg-green-50',
  amber: 'text-amber-600 bg-amber-50',
  pink: 'text-pink-600 bg-pink-50',
  purple: 'text-purple-600 bg-purple-50'
};

export default function StoryCard({ data, liked, onLike }: Props) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 cursor-pointer h-[420px] flex flex-col relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Nửa trên: Hình ảnh */}
      <div className="relative h-[240px] w-full overflow-hidden shrink-0">
        <Image
          src={data.img}
          alt={data.name}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
        
        <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm ${tintColors[data.badgeTint]}`}>
          {data.category}
        </div>
        
        <button
          onClick={(e) => { e.stopPropagation(); onLike(); }}
          className="absolute top-4 right-4 w-9 h-9 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/40 active:scale-95 transition-all shadow-sm"
        >
          <Heart size={16} className={`transition-colors ${liked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
        </button>

        <div className="absolute bottom-4 left-4 right-4 text-white">
          <h3 className="text-xl font-bold leading-tight mb-1 h3-card">{data.name}</h3>
          <div className="flex items-center gap-3 text-sm text-white/90">
            <div className="flex items-center gap-1"><MapPin size={14}/> {data.location}</div>
            <div className="flex items-center gap-1"><Star size={14} className="fill-yellow-400 text-yellow-400"/> {data.rating}</div>
          </div>
        </div>
      </div>

      {/* Nửa dưới: Nội dung (Animate khi hover) */}
      <div className="p-5 flex flex-col flex-1 relative bg-white z-10">
        <div className="flex items-center justify-between mb-3 text-sm">
          <div className="flex items-center gap-1.5 text-gray-500 font-medium">
            <Users size={16} /> <span className="meta-text">{data.visitors.toLocaleString('vi-VN')} lượt khách/năm</span>
          </div>
        </div>

        <div className="relative flex-1 overflow-hidden">
          <motion.p 
            className="text-gray-600 text-sm leading-relaxed absolute top-0 left-0 w-full body-text"
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: isHovered ? 0 : 1, y: isHovered ? -20 : 0 }}
            transition={{ duration: 0.3 }}
          >
            {data.shortDesc}
          </motion.p>
          <motion.p 
            className="text-gray-700 text-sm leading-relaxed absolute top-0 left-0 w-full body-text"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 20 }}
            transition={{ duration: 0.3 }}
          >
            {data.longDesc}
          </motion.p>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <span className={`text-xs font-bold px-2 py-1 rounded-md ${tintText[data.badgeTint]}`}>
            Khám phá ngay
          </span>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${tintColors[data.badgeTint]} group-hover:scale-110 transition-transform`}>
            <ArrowRight size={14} />
          </div>
        </div>
      </div>
    </div>
  );
}
