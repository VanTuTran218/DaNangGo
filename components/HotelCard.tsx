'use client';
import Image from 'next/image';
import { Heart, MapPin, Star, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export interface HotelData {
  id: number;
  name: string;
  category: string;
  badgeColor: string;
  badgePulse: boolean;
  location: string;
  rating: number;
  reviews: number;
  pricePerNight: number;
  originalPrice: number;
  img: string;
  amenities: string[];
  amenityIcon: string;
  tags: string[];
  isLiked: boolean;
}

interface HotelCardProps {
  hotel: HotelData;
  liked: boolean;
  onLike: () => void;
}

const BLUR_PLACEHOLDER =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

export default function HotelCard({ hotel, liked, onLike }: HotelCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25 }}
      className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 ease-out border border-gray-100 cursor-pointer"
    >
      {/* Image container */}
      <div className="relative h-52 overflow-hidden">
        <Image
          src={hotel.img}
          alt={hotel.name}
          fill
          className="object-cover group-hover:scale-[1.08] transition-transform duration-500 ease-out"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          placeholder="blur"
          blurDataURL={BLUR_PLACEHOLDER}
        />

        {/* Badge top-left */}
        <div
          className={`absolute top-3 left-3 ${hotel.badgeColor} text-white text-[10px] font-bold px-2.5 py-1 rounded-full ${
            hotel.badgePulse ? 'animate-[pulse_2s_ease-in-out_infinite]' : ''
          }`}
        >
          {hotel.category}
        </div>

        {/* Like button top-right */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onLike();
          }}
          className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all duration-200"
          aria-label={liked ? 'Bỏ yêu thích' : 'Yêu thích'}
        >
          <Heart
            size={15}
            className={`transition-all duration-200 ${
              liked ? 'fill-red-500 text-red-500 scale-110' : 'text-gray-400'
            }`}
          />
        </button>

        {/* Amenity chips bottom of image — glass style */}
        <motion.div className="absolute bottom-3 left-3 flex gap-1.5 flex-wrap overflow-hidden">
          {hotel.amenities.slice(0, 3).map((a) => (
            <span
              key={a}
              className="bg-black/40 group-hover:bg-black/60 group-hover:-translate-y-[2px] transition-all duration-300 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-full font-medium"
            >
              {a}
            </span>
          ))}
        </motion.div>
      </div>

      {/* Card body */}
      <div className="p-4">
        <h3 className="font-bold text-[#0f2942] text-sm leading-snug line-clamp-2 mb-1">
          {hotel.name}
        </h3>
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
          <MapPin size={11} />
          {hotel.location}
        </div>
        <div className="flex items-center gap-1 mb-3">
          <Star size={12} className="fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-semibold text-gray-800">{hotel.rating}</span>
          <span className="text-xs text-gray-400">
            ({hotel.reviews.toLocaleString('vi-VN')} đánh giá)
          </span>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-gray-400 line-through">
              {hotel.originalPrice.toLocaleString('vi-VN')}đ
            </p>
            <p className="text-orange-500 font-bold text-base group-hover:translate-x-0.5 transition-transform duration-300">
              {hotel.pricePerNight.toLocaleString('vi-VN')}đ
              <span className="text-xs font-normal text-gray-500">/đêm</span>
            </p>
          </div>
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="btn-ripple flex items-center gap-1 bg-[#0f2942] hover:bg-[#1a3f5c] text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all group/btn"
          >
            Xem chi tiết
            <motion.span className="inline-flex" whileHover={{ x: 3 }} transition={{ duration: 0.2 }}>
              <ArrowRight
                size={11}
                className="transition-transform duration-200"
              />
            </motion.span>
          </a>
        </div>
      </div>
    </motion.div>
  );
}
