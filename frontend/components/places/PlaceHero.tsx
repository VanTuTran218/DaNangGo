'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
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
  Check,
  Flame,
  Utensils,
  Hotel,
  Landmark,
  Coffee,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Images,
} from 'lucide-react';
import type { PlaceDetail } from '@/lib/api/places';
import { formatPlaceAddress } from '@/lib/mappers/place.mapper';
import HeartButton from '@/components/HeartButton';
import { consumeSharedPlaceClick } from '@/components/ui/MotionPrimitives';
import { DURATION, EASING, SPRING } from '@/lib/motion-tokens';

interface PlaceHeroProps {
  place: PlaceDetail;
  images: string[];
  onShare: () => void;
  copiedLink: boolean;
}

function getPlaceTypeMeta(place: PlaceDetail) {
  switch (String(place.place_type)) {
    case 'ACCOMMODATION':
      return {
        label: place.category_name || 'Lưu trú & Nghỉ dưỡng',
        icon: <Hotel size={12} className="text-[#E6D9B7]" />,
      };
    case 'ATTRACTION':
      return {
        label: place.category_name || 'Điểm tham quan & Du lịch',
        icon: <Landmark size={12} className="text-[#E6D9B7]" />,
      };
    case 'CAFE':
      return {
        label: place.category_name || 'Cà phê & Không gian',
        icon: <Coffee size={12} className="text-[#E6D9B7]" />,
      };
    default:
      return {
        label: place.category_name || 'Ẩm thực & Nhà hàng',
        icon: <Utensils size={12} className="text-[#E6D9B7]" />,
      };
  }
}

export default function PlaceHero({
  place,
  images,
  onShare,
  copiedLink,
}: PlaceHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  // State Lightbox & Shared Element Morph
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [fromCardClick, setFromCardClick] = useState(false);

  useEffect(() => {
    const shared = consumeSharedPlaceClick(place.place_id);
    if (shared) {
      setFromCardClick(true);
    }
  }, [place.place_id]);

  // Parallax cuộn ảnh nhẹ nhàng (tối đa 24px)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });
  const yParallax = useTransform(
    scrollYProgress,
    [0, 1],
    prefersReduced ? ['0px', '0px'] : ['0px', '24px']
  );

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const nextImage = useCallback(() => {
    setLightboxIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevImage = useCallback(() => {
    setLightboxIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Hỗ trợ phím ESC, mũi tên Trái/Phải và khóa cuộn nền khi mở Lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      else if (e.key === 'ArrowRight' && images.length > 1) nextImage();
      else if (e.key === 'ArrowLeft' && images.length > 1) prevImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [lightboxOpen, images.length, nextImage, prevImage]);

  const hasMultipleImages = images.length > 1;
  const mainImage =
    images[0] ||
    'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1200&q=80';
  const sideImages = images.slice(1, 3);
  const typeMeta = getPlaceTypeMeta(place);

  return (
    <>
      <section
        ref={containerRef}
        data-navbar-overlay="true"
        className="relative w-full overflow-hidden pt-20 sm:pt-24 pb-7 bg-[#081C25]"
      >
        {/* Atmospheric Deep Ocean Backdrop + Topographic Contours (Belmond × Aman stage) */}
        <img
          src="/images/intro/atmosphere/intro-coastal-contours.svg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 w-full h-full object-cover opacity-35"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 68% 54% at 78% 12%, rgba(230,217,183,0.14) 0%, rgba(33,107,112,0.18) 44%, transparent 74%)',
          }}
        />
        {/* Smooth lower band bridging dark hero into warm sand canvas */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-[#F6F2EA]"
        />

        <div className="home-container relative z-10">
          {/* Editorial Gallery Bento Frame */}
          <div
            className={`relative rounded-[18px] overflow-hidden shadow-[0_28px_72px_rgba(4,14,20,0.42)] border border-[#E6D9B7]/30 bg-[#0A2029] ${
              hasMultipleImages
                ? 'grid grid-cols-1 lg:grid-cols-12 gap-2.5 p-2.5'
                : 'p-0'
            }`}
          >
            {/* Subtle top Champagne rim reflection */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-[1px] z-30 bg-gradient-to-r from-transparent via-[#E6D9B7]/55 to-transparent"
            />

            {/* 1. ẢNH CHÍNH LỚN (EDITORIAL MAIN + SHARED ELEMENT MORPH) */}
            <motion.div
              initial={
                prefersReduced
                  ? false
                  : fromCardClick
                  ? { scale: 0.985, opacity: 1 }
                  : { opacity: 1 }
              }
              animate={{ scale: 1, opacity: 1 }}
              transition={
                fromCardClick
                  ? SPRING.gentle
                  : { duration: DURATION.medium, ease: EASING.standard }
              }
              className={`luxury-shimmer-frame relative overflow-hidden cursor-pointer group ${
                hasMultipleImages
                  ? 'lg:col-span-8 h-[390px] sm:h-[470px] lg:h-[530px] rounded-[12px]'
                  : 'w-full h-[420px] sm:h-[500px] lg:h-[560px] rounded-[18px]'
              }`}
              onClick={() => openLightbox(0)}
            >
              {/* Parallax & Opening Camera Settle */}
              <motion.div
                className="relative w-full h-[108%] -top-[4%] will-change-transform"
                style={{ y: yParallax }}
                initial={{ scale: prefersReduced ? 1 : 1.06 }}
                animate={{ scale: 1 }}
                transition={{
                  duration: DURATION.cinematic,
                  ease: EASING.entrance,
                }}
              >
                <Image
                  src={mainImage}
                  alt={place.name}
                  fill
                  priority
                  unoptimized={mainImage.startsWith('http')}
                  quality={90}
                  className="object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  sizes="(max-width: 1024px) 100vw, 75vw"
                />
              </motion.div>

              {/* Velvety Deep-Ocean Editorial Vignette */}
              <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(7,22,30,0.42) 0%, rgba(7,22,30,0.12) 34%, rgba(7,22,30,0.45) 62%, rgba(5,16,22,0.92) 100%)',
                }}
              />

              {/* Top-right gallery trigger pill */}
              <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#081C25]/74 backdrop-blur-xs border border-[#E6D9B7]/35 text-[#FFFDF5] text-xs font-medium shadow-[0_6px_18px_rgba(4,14,20,0.35)] transition-colors group-hover:border-[#E6D9B7]/75">
                  {images.length > 1 ? (
                    <>
                      <Images size={13} className="text-[#E6D9B7]" />
                      <span>Thư viện ({images.length})</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 size={13} className="text-[#E6D9B7]" />
                      <span>Xem toàn màn hình</span>
                    </>
                  )}
                </span>
              </div>

              {/* STAGGER FADE-UP NỘI DUNG TRÊN ẢNH CHÍNH */}
              <div className="absolute bottom-6 left-6 right-6 sm:bottom-8 sm:left-8 sm:right-8 z-20 space-y-3.5">
                {/* Badges danh mục & trạng thái mở cửa */}
                <motion.div
                  initial={prefersReduced ? false : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.08, ease: EASING.standard }}
                  className="flex flex-wrap items-center gap-2"
                >
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-[0.12em] text-[#FFFDF5] bg-[#081C25]/76 border border-[#E6D9B7]/35 backdrop-blur-xs">
                    {typeMeta.icon}
                    <span>{typeMeta.label}</span>
                  </span>

                  {place.promo_label && (
                    <span className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-[0.1em] bg-[#CB712D]/92 border border-[#F6C89F]/40 text-white shadow-[0_4px_14px_rgba(203,113,45,0.35)]">
                      <Flame size={12} />
                      <span>{place.promo_label}</span>
                    </span>
                  )}

                  <span
                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-[0.08em] backdrop-blur-xs border ${
                      place.isOpenNow
                        ? 'bg-[#174D52]/88 border-[#7CC7C3]/45 text-[#FFFDF5]'
                        : 'bg-[#081C25]/82 border-white/20 text-[#CBD9DA]'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        place.isOpenNow ? 'bg-[#6EE7B7]' : 'bg-white/50'
                      }`}
                    />
                    {place.isOpenNow ? 'Đang mở cửa' : 'Đã đóng cửa'}
                  </span>
                </motion.div>

                {/* Tên địa điểm (Editorial Luxury Display) */}
                <motion.h1
                  initial={prefersReduced ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.52, delay: 0.16, ease: EASING.entrance }}
                  style={{ textShadow: '0 6px 26px rgba(4,14,20,0.68)' }}
                  className="home-serif font-semibold text-3xl sm:text-5xl lg:text-[54px] text-[#FFFDF5] leading-[1.12] tracking-[-0.015em] max-w-4xl"
                >
                  {place.name}
                </motion.h1>

                {/* Địa chỉ ngắn gọn */}
                <motion.div
                  initial={prefersReduced ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.48, delay: 0.24, ease: EASING.standard }}
                  className="flex items-center gap-2 text-xs sm:text-sm text-[#E2ECEC]/92"
                >
                  <MapPin size={15} className="text-[#E6D9B7] shrink-0" />
                  <span className="truncate max-w-2xl">
                    {formatPlaceAddress(place.address, place.district_name)}
                  </span>
                </motion.div>
              </div>
            </motion.div>

            {/* 2. ẢNH PHỤ BENTO (CHỈ HIỆN KHI CÓ NHIỀU ẢNH) */}
            {hasMultipleImages && (
              <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-2.5 h-full">
                {sideImages.map((imgUrl, idx) => {
                  const actualIndex = idx + 1;
                  const isLastSlot = idx === 1;
                  const remainingCount = images.length - 3;

                  return (
                    <div
                      key={actualIndex}
                      onClick={() => openLightbox(actualIndex)}
                      className="luxury-shimmer-frame relative h-44 sm:h-52 lg:h-[260px] rounded-[12px] overflow-hidden cursor-pointer group border border-white/10"
                    >
                      <Image
                        src={imgUrl}
                        alt={`${place.name} - ảnh ${actualIndex + 1}`}
                        fill
                        unoptimized={imgUrl.startsWith('http')}
                        quality={85}
                        className="object-cover group-hover:scale-[1.05] transition-transform duration-600 ease-[cubic-bezier(0.22,1,0.36,1)]"
                        sizes="(max-width: 1024px) 50vw, 30vw"
                      />
                      <div className="absolute inset-0 bg-[#081C25]/18 group-hover:bg-transparent transition-colors" />

                      {isLastSlot && remainingCount > 0 && (
                        <div className="absolute inset-0 bg-[#081C25]/72 backdrop-blur-[2px] flex flex-col items-center justify-center text-[#FFFDF5] p-3">
                          <span className="home-serif italic text-3xl sm:text-4xl font-semibold text-[#E6D9B7]">
                            +{remainingCount}
                          </span>
                          <span className="text-[11px] text-[#FFFDF5]/90 font-semibold uppercase tracking-[0.16em] mt-1">
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

          {/* DẢI TIỆN ÍCH TOP ACTIONS: CHIA SẺ & LƯU ĐỊA ĐIỂM */}
          <div className="flex flex-wrap items-center justify-end gap-2.5 mt-4">
            <HeartButton placeId={place.place_id} />

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={onShare}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FFFDF9] border border-[#E5DAC8] text-[#102832] hover:text-[#216B70] hover:border-[#C9B580] text-xs sm:text-[13px] font-semibold shadow-[0_6px_18px_rgba(16,40,50,0.06)] transition-all cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check size={15} className="text-[#216B70]" />
                  <span className="text-[#216B70]">Đã chép link!</span>
                </>
              ) : (
                <>
                  <Share2 size={15} className="text-[#216B70]" />
                  <span>Chia sẻ</span>
                </>
              )}
            </motion.button>

            <HeartButton placeId={place.place_id} variant="bookmark" showLabel />
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
            className="fixed inset-0 z-[100] bg-[#051118]/95 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-8"
            onClick={() => setLightboxOpen(false)}
          >
            {/* Header thanh trên Lightbox */}
            <div className="absolute top-5 inset-x-6 flex items-center justify-between z-50">
              <div className="hidden sm:block text-left">
                <p className="text-[10.5px] font-mono uppercase tracking-[0.2em] text-[#E6D9B7]">
                  THƯ VIỆN ẢNH &middot; {lightboxIndex + 1} / {images.length}
                </p>
                <p className="home-serif text-base text-[#FFFDF5] mt-0.5 truncate max-w-md">
                  {place.name}
                </p>
              </div>
              <button
                onClick={() => setLightboxOpen(false)}
                className="ml-auto w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 border border-[#E6D9B7]/30 text-[#FFFDF5] flex items-center justify-center transition-all cursor-pointer"
                aria-label="Đóng ảnh"
              >
                <X size={20} />
              </button>
            </div>

            {/* Khung ảnh chính Lightbox */}
            <motion.div
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25, ease: EASING.standard }}
              className="relative max-w-5xl max-h-[76vh] w-full h-[74vh] rounded-[16px] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={images[lightboxIndex] || mainImage}
                alt={`${place.name} - ảnh ${lightboxIndex + 1}`}
                fill
                unoptimized={(images[lightboxIndex] || mainImage).startsWith('http')}
                quality={95}
                className="object-contain"
                sizes="100vw"
              />
            </motion.div>

            {/* Nút Previous / Next */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/22 border border-[#E6D9B7]/30 text-[#FFFDF5] flex items-center justify-center transition-all z-50 cursor-pointer"
                  aria-label="Ảnh trước"
                >
                  <ChevronLeft size={26} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/22 border border-[#E6D9B7]/30 text-[#FFFDF5] flex items-center justify-center transition-all z-50 cursor-pointer"
                  aria-label="Ảnh kế tiếp"
                >
                  <ChevronRight size={26} />
                </button>
              </>
            )}

            {/* Chỉ số ảnh & Dải thumbnail bên dưới */}
            <div
              className="absolute bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2.5 max-w-full px-4"
              onClick={(e) => e.stopPropagation()}
            >
              {images.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto max-w-[88vw] pb-1">
                  {images.slice(0, 8).map((thumb, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setLightboxIndex(idx)}
                      className={`relative w-12 h-9 rounded-[6px] overflow-hidden border transition-all shrink-0 cursor-pointer ${
                        idx === lightboxIndex
                          ? 'border-[#E6D9B7] scale-105 opacity-100'
                          : 'border-white/20 opacity-55 hover:opacity-90'
                      }`}
                    >
                      <Image
                        src={thumb}
                        alt={`Thumbnail ${idx + 1}`}
                        fill
                        unoptimized={thumb.startsWith('http')}
                        sizes="48px"
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
              <div className="text-[#E6D9B7] text-xs font-mono tracking-[0.18em] bg-white/10 border border-[#E6D9B7]/25 backdrop-blur-md px-4 py-1 rounded-full">
                {lightboxIndex + 1} / {images.length}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
