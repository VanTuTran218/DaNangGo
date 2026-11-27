'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  ArrowLeft,
  AlertCircle,
  Ticket,
  Hotel,
  CheckCircle2,
  Calendar,
  Bed,
  Users,
} from 'lucide-react';

import { getPlaceDetail, PlaceDetail } from '@/lib/api/places';
import { formatCurrency, formatDuration, getDayOfWeekName } from '@/lib/mappers/place.mapper';

// Components chuyên biệt cao cấp
import ScrollProgressBar from '@/components/places/ScrollProgressBar';
import PlaceHero from '@/components/places/PlaceHero';
import PlaceStats from '@/components/places/PlaceStats';
import PlaceInfo from '@/components/places/PlaceInfo';
import MenuSection from '@/components/places/MenuSection';
import BookingSidebar from '@/components/places/BookingSidebar';
import ReviewSection from '@/components/places/ReviewSection';
import { AiReviewSummary } from '@/components/ai/AiTools';
import SimilarPlacesSection from '@/components/places/SimilarPlacesSection';
import PlaceCTA from '@/components/places/PlaceCTA';
import SiteFooter from '@/components/places/SiteFooter';
import ScrollToTop from '@/components/places/ScrollToTop';
import RouteDirectionsModal from '@/components/places/RouteDirectionsModal';

export default function PlaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.['id'];

  const [place, setPlace] = useState<PlaceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States tương tác
  const [copiedLink, setCopiedLink] = useState(false);
  const [isDirectionsOpen, setIsDirectionsOpen] = useState(false);

  // 1. Fetch dữ liệu địa điểm từ API
  useEffect(() => {
    if (!rawId) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    getPlaceDetail(String(rawId))
      .then((data) => {
        if (!isMounted) return;
        if (!data) {
          setError('Không tìm thấy thông tin địa điểm hoặc địa điểm đang được bảo trì.');
        } else {
          setPlace(data);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Lỗi tải chi tiết địa điểm:', err);
        setError('Không tìm thấy địa điểm hoặc bạn không có quyền truy cập.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [rawId]);

  // 2. Danh sách ảnh gallery (ghép cover_image và images)
  const galleryImages = useMemo(() => {
    if (!place) return [];
    const list: string[] = [];
    if (place.cover_image) list.push(place.cover_image);
    if (place.images && place.images.length > 0) {
      for (const img of place.images) {
        if (!list.includes(img.image_url)) {
          list.push(img.image_url);
        }
      }
    }
    if (list.length === 0) {
      list.push('https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1200&q=80');
    }
    return list;
  }, [place]);

  // 3. Xử lý sao chép liên kết chia sẻ
  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // 4. Mở modal chỉ đường
  const handleOpenDirections = () => {
    setIsDirectionsOpen(true);
  };

  const handleReviewSummaryChange = useCallback(
    (summary: { avg_rating: number; review_count: number }) => {
      setPlace((current) =>
        current
          ? {
              ...current,
              avg_rating: summary.avg_rating,
              review_count: summary.review_count,
            }
          : current,
      );
    },
    [],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // GIAO DIỆN SKELETON KHI ĐANG TẢI (DỊU MẮT, KHÔNG CHỚP TRẮNG)
  // ─────────────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F6F2EA] pb-20">
        <div className="bg-[#081C25] pt-24 pb-10">
          <div className="home-container">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 p-2.5 rounded-[18px] border border-[#E6D9B7]/16 bg-[#0A2029]">
              <div className="lg:col-span-8 h-[390px] sm:h-[470px] bg-[#102B36] rounded-[12px]" />
              <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-2.5">
                <div className="h-44 sm:h-52 lg:h-[228px] bg-[#102B36] rounded-[12px]" />
                <div className="h-44 sm:h-52 lg:h-[228px] bg-[#102B36] rounded-[12px]" />
              </div>
            </div>
          </div>
        </div>

        <div className="home-container pt-6">
          <div className="h-4 w-56 bg-[#E5DAC8]/75 rounded-full mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-6">
              <div className="h-28 bg-[#0B222C] rounded-[16px]" />
              <div className="h-64 bg-[#F2ECE0] border border-[#E5DAC8] rounded-[16px]" />
              <div className="h-80 bg-[#F2ECE0] border border-[#E5DAC8] rounded-[16px]" />
            </div>
            <div className="lg:col-span-4 h-96 bg-[#0B222C] rounded-[18px]" />
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GIAO DIỆN BÁO LỖI HOẶC 404 NOT FOUND
  // ─────────────────────────────────────────────────────────────────────────
  if (error || !place) {
    return (
      <div className="min-h-screen bg-[#F6F2EA] pt-32 pb-20 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-6 text-center rounded-[18px] bg-[#FFFDF9] border border-[#E5DAC8] p-8 shadow-[0_18px_48px_rgba(16,40,50,0.08)]">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
            <AlertCircle size={32} />
          </div>
          <h2 className="home-serif text-2xl font-semibold text-[#102832] mb-2.5">
            Địa điểm không khả dụng
          </h2>
          <p className="text-sm text-[#4E5E63] mb-7 leading-relaxed">
            {error || 'Địa điểm bạn đang tìm kiếm không tồn tại, đã bị ẩn hoặc đang chờ kiểm duyệt.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full border border-[#E5DAC8] text-[#102832] font-semibold hover:border-[#C9B580] hover:bg-[#F7F2E8] transition-all text-xs uppercase tracking-[0.1em] cursor-pointer"
            >
              <ArrowLeft size={15} /> Quay lại trang trước
            </button>
            <Link
              href="/khampha"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#102832] hover:bg-[#216B70] text-[#FFFDF5] font-semibold transition-all text-xs uppercase tracking-[0.1em]"
            >
              Khám phá Đà Nẵng
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Cấu hình URL cha của Breadcrumb theo loại địa điểm
  const parentUrl =
    place.place_type === 'ATTRACTION'
      ? '/diemdulich'
      : place.place_type === 'ACCOMMODATION'
      ? '/luutru'
      : '/amthuc';

  const parentLabel =
    place.place_type === 'ATTRACTION'
      ? 'Điểm du lịch'
      : place.place_type === 'ACCOMMODATION'
      ? 'Lưu trú'
      : 'Ẩm thực';

  // Tính khoảng giá dự phòng từ danh sách phòng / thực đơn nếu backend không trả price_min/price_max
  const rawRooms: any[] = (place as any).room_types || (place as any).rooms || [];
  const derivedRoomPrices = rawRooms
    .map((r) => Number(r?.price_per_night))
    .filter((n) => Number.isFinite(n) && n > 0);
  const derivedMenuPrices = (place.menu_items || [])
    .map((m) => Number(m?.price))
    .filter((n) => Number.isFinite(n) && n > 0);
  const fallbackPrices =
    place.place_type === 'ACCOMMODATION' ? derivedRoomPrices : derivedMenuPrices;

  const effectivePriceMin =
    typeof place.price_min === 'number' && Number.isFinite(place.price_min)
      ? place.price_min
      : fallbackPrices.length > 0
        ? Math.min(...fallbackPrices)
        : null;
  const effectivePriceMax =
    typeof place.price_max === 'number' && Number.isFinite(place.price_max)
      ? place.price_max
      : fallbackPrices.length > 0
        ? Math.max(...fallbackPrices)
        : null;

  return (
    <div
      className="min-h-screen dananggo-cinematic-content text-[#202B30] selection:bg-[#E87B39] selection:text-white"
      style={{
        backgroundColor: '#F6F2EA',
        backgroundImage:
          'radial-gradient(ellipse 68% 36% at 90% 24%, rgba(230,217,183,0.26) 0%, transparent 66%), radial-gradient(ellipse 58% 34% at 8% 64%, rgba(201,181,128,0.14) 0%, transparent 68%)',
      }}
    >
      {/* 1. THANH TIẾN ĐỘ CUỘN MỎNG Ở ĐỈNH TRANG */}
      <ScrollProgressBar />

      {/* 2. HERO BANNER BENTO GRID & LIGHTBOX & TOP ACTIONS */}
      <PlaceHero
        place={place}
        images={galleryImages}
        onShare={handleShare}
        copiedLink={copiedLink}
      />

      {/* 3. BREADCRUMB LIÊN KẾT */}
      <div className="home-container pt-1 pb-5">
        <nav className="inline-flex items-center gap-2 text-xs sm:text-[13px] text-[#4E5E63] px-3.5 py-1.5 rounded-full bg-[#FFFDF9]/80 border border-[#E5DAC8]">
          <Link href="/" className="hover:text-[#216B70] transition-colors">
            Trang chủ
          </Link>
          <ChevronRight size={13} className="text-[#C9B580]" />
          <Link href="/khampha" className="hover:text-[#216B70] transition-colors">
            Khám phá
          </Link>
          <ChevronRight size={13} className="text-[#C9B580]" />
          <Link href={parentUrl} className="hover:text-[#216B70] transition-colors font-medium">
            {parentLabel}
          </Link>
          <ChevronRight size={13} className="text-[#C9B580]" />
          <span className="font-semibold text-[#102832] truncate max-w-[180px] sm:max-w-xs">
            {place.name}
          </span>
        </nav>
      </div>

      {/* 4. LAYOUT 12 CỘT CÂN XỨNG: NỘI DUNG CHÍNH (8 CỘT) + SIDEBAR STICKY (4 CỘT) */}
      <main className="home-container pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ═══ CỘT TRÁI: NỘI DUNG CHÍNH (8 CỘT) ═══ */}
          <div className="lg:col-span-8 w-full">
            {/* 4.1. Thanh thống kê 3 ô bằng nhau (Rating, Khoảng giá, Lượt xem) */}
            <PlaceStats
              avgRating={place.avg_rating}
              reviewCount={place.review_count}
              viewCount={place.view_count}
              priceMin={effectivePriceMin}
              priceMax={effectivePriceMax}
              ticketPrice={place.ticket_price}
              placeType={place.place_type}
            />

            {/* 4.2. Khối 2 ô cân đối: Địa chỉ & Giờ mở cửa hôm nay + Giới thiệu */}
            <PlaceInfo place={place} onOpenMap={handleOpenDirections} />

            {/* 4.3. THỰC ĐƠN MÓN ĂN & KHẨU VỊ (NHÀ HÀNG - RESTAURANT) */}
            {place.place_type === 'RESTAURANT' && (
              <MenuSection
                menuItems={place.menu_items || []}
                restaurantName={place.name}
              />
            )}

            {/* 4.4. THÔNG TIN DU LỊCH (ĐIỂM THAM QUAN - ATTRACTION) */}
            {place.place_type === 'ATTRACTION' && (
              <div className="bg-[#FFFDF9] rounded-[16px] p-6 sm:p-8 border border-[#E5DAC8] shadow-[0_14px_38px_rgba(16,40,50,0.05)] mb-8 space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-[#E8DDCF]">
                  <span className="w-9 h-9 rounded-full bg-[#091E27] text-[#E6D9B7] flex items-center justify-center shrink-0">
                    <Ticket size={16} />
                  </span>
                  <h3 className="home-serif text-xl sm:text-2xl font-semibold text-[#102832] tracking-[-0.01em]">
                    Thông tin tham quan &amp; Vé vào cổng
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 rounded-[12px] bg-[#F7F2E8] border border-[#E5DAC8]">
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#216B70] mb-1.5">
                      Giá vé tham quan
                    </p>
                    <p className="home-serif text-2xl font-semibold text-[#102832]">
                      {place.ticket_price !== null && place.ticket_price !== undefined
                        ? place.ticket_price === 0
                          ? 'Miễn phí vé vào cửa'
                          : formatCurrency(place.ticket_price)
                        : 'Đang cập nhật'}
                    </p>
                    <p className="text-xs text-[#4E5E63] mt-1.5">
                      Áp dụng cho khách tham quan trong ngày
                    </p>
                  </div>

                  <div className="p-5 rounded-[12px] bg-[#F7F2E8] border border-[#E5DAC8]">
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#216B70] mb-1.5">
                      Thời lượng tham quan ước tính
                    </p>
                    <p className="home-serif text-2xl font-semibold text-[#102832]">
                      {formatDuration(place.visit_duration_minutes)}
                    </p>
                    <p className="text-xs text-[#4E5E63] mt-1.5">
                      Thời gian lý tưởng để trải nghiệm trọn vẹn
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 4.5. THÔNG TIN LƯU TRÚ (KHÁCH SẠN - ACCOMMODATION) */}
            {place.place_type === 'ACCOMMODATION' && (
              <div className="bg-[#FFFDF9] rounded-[16px] p-6 sm:p-8 border border-[#E5DAC8] shadow-[0_14px_38px_rgba(16,40,50,0.05)] mb-8 space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-[#E8DDCF]">
                  <span className="w-9 h-9 rounded-full bg-[#091E27] text-[#E6D9B7] flex items-center justify-center shrink-0">
                    <Hotel size={16} />
                  </span>
                  <h3 className="home-serif text-xl sm:text-2xl font-semibold text-[#102832] tracking-[-0.01em]">
                    Tiện ích &amp; Danh sách phòng nghỉ
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 sm:p-5 rounded-[12px] bg-[#F7F2E8] border border-[#E5DAC8] text-sm">
                  <div>
                    <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#216B70] block mb-1">
                      Giờ nhận phòng
                    </span>
                    <span className="home-serif text-xl font-semibold text-[#102832]">
                      {place.check_in_time || '14:00'}
                    </span>
                  </div>
                  <div className="border-l border-[#E5DAC8] pl-4">
                    <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#216B70] block mb-1">
                      Giờ trả phòng
                    </span>
                    <span className="home-serif text-xl font-semibold text-[#102832]">
                      {place.check_out_time || '12:00'}
                    </span>
                  </div>
                </div>

                {place.amenities && place.amenities.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#216B70] mb-3">
                      Tiện nghi nổi bật
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {place.amenities.map((a) => (
                        <span
                          key={a.amenity_id}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F7F2E8] border border-[#E5DAC8] text-[#102832] text-xs font-medium"
                        >
                          <CheckCircle2 size={13} className="text-[#216B70]" />
                          {a.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Danh sách loại phòng nghỉ */}
                {((place as any).room_types || (place as any).rooms) &&
                  ((place as any).room_types || (place as any).rooms).length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#216B70] mb-3.5 flex items-center gap-2">
                        <Bed size={15} className="text-[#CB712D]" />
                        <span>Các loại phòng &amp; Bảng giá</span>
                      </h4>
                      <div className="space-y-3">
                        {((place as any).room_types || (place as any).rooms).map((room: any) => (
                          <div
                            key={room.room_type_id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-[12px] border border-[#E5DAC8] bg-[#F7F2E8]/80 hover:bg-[#F7F2E8] hover:border-[#C9B580] transition-all duration-250"
                          >
                            <div className="flex-1">
                              <p className="home-serif font-semibold text-base sm:text-lg text-[#102832]">
                                {room.name}
                              </p>
                              <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#4E5E63] mt-1.5">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/80 border border-[#E5DAC8]">
                                  <Users size={11} className="text-[#216B70]" />
                                  Tối đa: {room.capacity} khách
                                </span>
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/80 border border-[#E5DAC8]">
                                  Số phòng: {room.room_count ?? 1}
                                </span>
                                {room.status &&
                                  room.status !== 'AVAILABLE' &&
                                  room.status !== 'ACTIVE' && (
                                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-200 text-amber-800 text-[10px] font-semibold">
                                      {room.status === 'MAINTENANCE' ? 'Đang bảo trì' : room.status}
                                    </span>
                                  )}
                              </div>
                            </div>
                            <div className="sm:text-right shrink-0">
                              {room.original_price && room.original_price > room.price_per_night && (
                                <p className="text-xs text-[#6E7D82] line-through">
                                  {room.original_price.toLocaleString('vi-VN')}đ/đêm
                                </p>
                              )}
                              <p className="home-serif text-xl font-semibold text-[#102832]">
                                {((room.price_per_night ?? 0) as number).toLocaleString('vi-VN')}đ
                                <span className="font-sans text-xs font-medium text-[#4E5E63] ml-0.5">
                                  /đêm
                                </span>
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            )}

            {/* 4.6. Lịch mở cửa chi tiết trong tuần */}
            <div className="bg-[#FFFDF9] rounded-[16px] p-6 sm:p-8 border border-[#E5DAC8] shadow-[0_14px_38px_rgba(16,40,50,0.05)] mb-8 space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-[#E8DDCF]">
                <span className="w-9 h-9 rounded-full bg-[#091E27] text-[#E87B39] flex items-center justify-center shrink-0">
                  <Calendar size={16} />
                </span>
                <h3 className="home-serif text-xl sm:text-2xl font-semibold text-[#102832] tracking-[-0.01em]">
                  Lịch mở cửa trong tuần
                </h3>
              </div>

              {place.opening_hours && place.opening_hours.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm">
                  {place.opening_hours.map((h) => {
                    const isToday =
                      (new Date().getDay() === 0 ? 1 : new Date().getDay() + 1) ===
                      h.day_of_week;

                    return (
                      <div
                        key={h.opening_id}
                        className={`flex items-center justify-between px-4 py-3 rounded-[10px] transition-all ${
                          isToday
                            ? 'bg-[#FFF3E3] border border-[#E87B39]/60 font-semibold text-[#102832]'
                            : 'bg-[#F7F2E8]/75 text-[#4E5E63] border border-[#E5DAC8]'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>{getDayOfWeekName(h.day_of_week)}</span>
                          {isToday && (
                            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#CB712D] text-white font-semibold uppercase tracking-wider">
                              Hôm nay
                            </span>
                          )}
                        </span>
                        <span className="font-medium text-[#102832]">
                          {h.open_time} – {h.close_time}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-[#4E5E63]">
                  Địa điểm mở cửa đón khách hàng ngày theo khung giờ tiêu chuẩn (08:00 – 22:00).
                </p>
              )}
            </div>

            {/* 4.7. Khu vực đánh giá khách hàng (Long API container) */}
            <ReviewSection
              placeId={String(place.place_id)}
              placeName={place.name}
              imageUrl={galleryImages[0] || place.cover_image || ''}
              onSummaryChange={handleReviewSummaryChange}
            />

            <AiReviewSummary key={place.place_id} placeId={place.place_id} />

            {/* 4.8. Carousel quán gần đây / quán tương tự */}
            <SimilarPlacesSection currentId={place.place_id} />
          </div>

          {/* ═══ CỘT PHẢI: STICKY SIDEBAR LIÊN HỆ & ĐẶT CHỖ (4 CỘT) ═══ */}
          <div className="lg:col-span-4 w-full lg:sticky lg:top-[124px]">
            <BookingSidebar place={place} onOpenMap={handleOpenDirections} />
          </div>
        </div>
      </main>

      {/* 5. DẢI CTA SÓNG BIỂN TRÔI LIÊN TỤC */}
      <PlaceCTA />

      {/* 6. FOOTER ĐẦY ĐỦ 4 CỘT CHUYÊN NGHIỆP */}
      <SiteFooter />

      {/* 7. NÚT LÊN ĐẦU TRANG VỚI VÒNG TIẾN ĐỘ CUỘN SVG */}
      <ScrollToTop />

      {/* 8. MODAL CHỈ ĐƯỜNG */}
      {place && (
        <RouteDirectionsModal
          isOpen={isDirectionsOpen}
          onClose={() => setIsDirectionsOpen(false)}
          destination={{
            place_id: place.place_id,
            name: place.name,
            address: place.address,
            latitude: place.latitude,
            longitude: place.longitude,
          }}
        />
      )}
    </div>
  );
}
