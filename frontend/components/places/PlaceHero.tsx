'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useReducedMotion,
} from 'framer-motion';
import {
  MapPin,
  Share2,
  Bookmark,
  Check,
  Flame,
  Utensils,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
} from 'lucide-react';
import type { PlaceDetail } from '@/lib/api/places';

const BLUR_PLACEHOLDER =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

interface PlaceHeroProps {
  place: PlaceDetail;
  images: string[];
  isSaved: boolean;
  onToggleSave: () => void;
  onShare: () => void;
  copiedLink: boolean;
}

export default function PlaceHero({
  place,
  images,
  isSaved,
  onToggleSave,
  onShare,
  copiedLink,
}: PlaceHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  // State Lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Parallax cuộn ảnh
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });
  const yParallax = useTransform(
    scrollYProgress,
    [0, 1],
    prefersReduced ? ['0%', '0%'] : ['0%', '15%']
  );

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const nextImage = () => {
    setLightboxIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setLightboxIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Số lượng ảnh hiện có
  const hasMultipleImages = images.length > 1;
  const mainImage = images[0] || 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1200&q=80';
  const sideImages = images.slice(1, 3); // Lấy tối đa 2 ảnh phụ cho Bento grid

  return (
    <>
      <section
        ref={containerRef}
        data-navbar-overlay="true"
        className="relative w-full overflow-hidden pt-20 sm:pt-24 pb-4"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Bento Gallery Grid */}
          <div
            className={`rounded-3xl overflow-hidden shadow-xl border border-gray-100 bg-[#071a2e] ${
              hasMultipleImages
                ? 'grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-3 p-2 sm:p-3'
                : 'p-0'
            }`}
          >
            {/* 1. ẢNH CHÍNH LỚN (BENTO MAIN) */}
            <div
              className={`relative overflow-hidden cursor-pointer group ${
                hasMultipleImages
                  ? 'lg:col-span-8 h-[360px] sm:h-[440px] lg:h-[500px] rounded-2xl'
                  : 'w-full h-[380px] sm:h-[460px] lg:h-[520px] rounded-3xl'
              }`}
              onClick={() => openLightbox(0)}
            >
              {/* Parallax & Zoom motion */}
              <motion.div
                className="relative w-full h-[115%] -top-[7.5%]"
                style={{ y: yParallax }}
                initial={{ scale: prefersReduced ? 1 : 1.06 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <Image
                  src={mainImage}
                  alt={place.name}
                  fill
                  priority
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  placeholder="blur"
                  blurDataURL={BLUR_PLACEHOLDER}
                  sizes="(max-width: 1024px) 100vw, 70vw"
                />
              </motion.div>

              {/* Gradient che bóng tối ở chân ảnh */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

              {/* Nút phóng to ảnh ở góc */}
              <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-semibold shadow-md">
                  <Maximize2 size={13} />
                  <span>Xem toàn màn hình</span>
                </span>
              </div>

              {/* STAGGER FADE-UP NỘI DUNG TRÊN ẢNH CHÍNH */}
              <div className="absolute bottom-6 left-6 right-6 z-10 space-y-3">
                {/* Badges danh mục & giờ mở cửa */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="flex flex-wrap items-center gap-2"
                >
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-white bg-amber-500 shadow-md">
                    <Utensils size={13} />
                    <span>{place.category_name || 'Ẩm thực & Nhà hàng'}</span>
                  </span>

                  {place.promo_label && (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-500 text-white shadow-md">
                      <Flame size={13} />
                      <span>{place.promo_label}</span>
                    </span>
                  )}

                  {/* Badge Mở cửa / Đã đóng cửa nhấp nháy xanh/đỏ */}
                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md shadow-md ${
                      place.isOpenNow
                        ? 'bg-emerald-500/90 text-white'
                        : 'bg-rose-500/90 text-white'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        place.isOpenNow ? 'bg-white animate-pulse' : 'bg-white/80'
                      }`}
                    />
                    {place.isOpenNow ? 'Đang mở cửa' : 'Đã đóng cửa'}
                  </span>
                </motion.div>

                {/* Tên quán */}
                <motion.h1
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight drop-shadow-lg"
                >
                  {place.name}
                </motion.h1>

                {/* Địa chỉ ngắn gọn */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="flex items-center gap-2 text-xs sm:text-sm text-white/90"
                >
                  <MapPin size={15} className="text-cyan-400 shrink-0" />
                  <span className="truncate max-w-xl">
                    {place.address ? `${place.address}, ` : ''}
                    {place.district_name ? `${place.district_name}, ` : ''}
                    Đà Nẵng
                  </span>
                </motion.div>
              </div>
            </div>

            {/* 2. ẢNH PHỤ BENTO (CHỈ HIỆN KHI CÓ NHIỀU ẢNH) */}
            {hasMultipleImages && (
              <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-2 sm:gap-3 h-full">
                {sideImages.map((imgUrl, idx) => {
                  const actualIndex = idx + 1;
                  const isLastSlot = idx === 1;
                  const remainingCount = images.length - 3;

                  return (
                    <div
                      key={actualIndex}
                      onClick={() => openLightbox(actualIndex)}
                      className="relative h-44 sm:h-52 lg:h-[244px] rounded-2xl overflow-hidden cursor-pointer group shadow-sm"
                    >
                      <Image
                        src={imgUrl}
                        alt={`${place.name} - ảnh ${actualIndex + 1}`}
                        fill
                        className="object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
                        placeholder="blur"
                        blurDataURL={BLUR_PLACEHOLDER}
                        sizes="(max-width: 1024px) 50vw, 30vw"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />

                      {/* Hiển thị số ảnh còn lại nếu nhiều hơn 3 ảnh */}
                      {isLastSlot && remainingCount > 0 && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-white p-2">
                          <span className="text-xl sm:text-2xl font-extrabold">
                            +{remainingCount}
                          </span>
                          <span className="text-xs text-white/80 font-medium">
                            Xem tất cả ảnh
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* DẢI TIỆN ÍCH TOP ACTIONS: NÚT CHIA SẺ & LƯU QUÁN */}
          <div className="flex items-center justify-end gap-3 mt-4">
            {/* Nút Chia sẻ */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={onShare}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-gray-200 text-gray-700 hover:text-cyan-600 hover:border-cyan-300 shadow-sm text-xs sm:text-sm font-semibold transition-all"
            >
              {copiedLink ? (
                <>
                  <Check size={16} className="text-emerald-500" />
                  <span className="text-emerald-600">Đã chép link!</span>
                </>
              ) : (
                <>
                  <Share2 size={16} className="text-gray-500" />
                  <span>Chia sẻ</span>
                </>
              )}
            </motion.button>

            {/* Nút Lưu quán nảy (scale bounce) */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.88 }}
              onClick={onToggleSave}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs sm:text-sm font-semibold shadow-sm transition-all ${
                isSaved
                  ? 'bg-orange-50 border-orange-300 text-orange-600'
                  : 'bg-white border-gray-200 text-gray-700 hover:text-orange-500 hover:border-orange-200'
              }`}
            >
              <motion.div
                animate={isSaved ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Bookmark
                  size={16}
                  className={isSaved ? 'fill-orange-500 text-orange-500' : 'text-gray-500'}
                />
              </motion.div>
              <span>{isSaved ? 'Đã lưu quán' : 'Lưu quán'}</span>
            </motion.button>
          </div>
        </div>
      </section>

      {/* ═══ LIGHTBOX MODAL TOÀN MÀN HÌNH ═══ */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
            onClick={() => setLightboxOpen(false)}
          >
            {/* Nút Đóng */}
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-5 right-5 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all z-50"
              aria-label="Đóng ảnh"
            >
              <X size={22} />
            </button>

            {/* Khung ảnh chính Lightbox */}
            <motion.div
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="relative max-w-5xl max-h-[85vh] w-full h-[80vh] rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={images[lightboxIndex] || mainImage}
                alt={`${place.name} - ảnh ${lightboxIndex + 1}`}
                fill
                className="object-contain"
                sizes="100vw"
              />
            </motion.div>

            {/* Nút Previous */}
            {images.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-all z-50"
                aria-label="Ảnh trước"
              >
                <ChevronLeft size={28} />
              </button>
            )}

            {/* Nút Next */}
            {images.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-all z-50"
                aria-label="Ảnh kế tiếp"
              >
                <ChevronRight size={28} />
              </button>
            )}

            {/* Chỉ số ảnh bên dưới */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 text-xs sm:text-sm font-medium bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full">
              {lightboxIndex + 1} / {images.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
