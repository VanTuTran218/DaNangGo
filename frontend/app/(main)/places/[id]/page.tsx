'use client';

import { useState, useEffect, useMemo } from 'react';
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
import SimilarPlacesSection from '@/components/places/SimilarPlacesSection';
import PlaceCTA from '@/components/places/PlaceCTA';
import SiteFooter from '@/components/places/SiteFooter';
import ScrollToTop from '@/components/places/ScrollToTop';

export default function PlaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.['id'];

  const [place, setPlace] = useState<PlaceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States tương tác
  const [isSaved, setIsSaved] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

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

  // 4. Mở Google Maps chỉ đường
  const handleOpenGoogleMaps = () => {
    if (!place) return;
    let url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      place.name + ' ' + (place.address || 'Đà Nẵng')
    )}`;
    if (place.latitude && place.longitude) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // ─────────────────────────────────────────────────────────────────────────
  // GIAO DIỆN SKELETON KHI ĐANG TẢI (LOADING SHIMMER)
  // ─────────────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Breadcrumb Skeleton */}
          <div className="h-4 w-48 bg-gray-200 rounded-lg animate-pulse mb-6" />

          {/* Hero Bento Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 mb-8">
            <div className="lg:col-span-8 h-[360px] sm:h-[460px] bg-gray-200 rounded-3xl animate-pulse" />
            <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-3">
              <div className="h-44 sm:h-52 lg:h-[220px] bg-gray-200 rounded-2xl animate-pulse" />
              <div className="h-44 sm:h-52 lg:h-[220px] bg-gray-200 rounded-2xl animate-pulse" />
            </div>
          </div>

          {/* Layout 12 cột Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-6">
              <div className="h-28 bg-gray-200 rounded-3xl animate-pulse" />
              <div className="h-64 bg-gray-200 rounded-3xl animate-pulse" />
              <div className="h-96 bg-gray-200 rounded-3xl animate-pulse" />
            </div>
            <div className="lg:col-span-4 h-96 bg-gray-200 rounded-3xl animate-pulse" />
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
      <div className="min-h-screen bg-slate-50 pt-32 pb-20 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-6 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-rose-50 text-rose-500 flex items-center justify-center shadow-inner">
            <AlertCircle size={40} />
          </div>
          <h2 className="text-2xl font-extrabold text-[#0f2942] mb-3">
            Địa điểm không khả dụng
          </h2>
          <p className="text-sm text-gray-500 mb-8 leading-relaxed">
            {error || 'Địa điểm bạn đang tìm kiếm không tồn tại, đã bị ẩn hoặc đang chờ kiểm duyệt.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-100 transition-all text-sm"
            >
              <ArrowLeft size={16} /> Quay lại trang trước
            </button>
            <Link
              href="/amthuc"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold transition-all text-sm shadow-md shadow-orange-500/20"
            >
              Khám phá Ẩm thực
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

  return (
    <div className="min-h-screen bg-slate-50 text-gray-800 selection:bg-orange-500 selection:text-white">
      {/* 1. THANH TIẾN ĐỘ CUỘN MỎNG Ở ĐỈNH TRANG */}
      <ScrollProgressBar />

      {/* 2. HERO BANNER BENTO GRID & LIGHTBOX & TOP ACTIONS */}
      <PlaceHero
        place={place}
        images={galleryImages}
        isSaved={isSaved}
        onToggleSave={() => setIsSaved(!isSaved)}
        onShare={handleShare}
        copiedLink={copiedLink}
      />

      {/* 3. BREADCRUMB LIÊN KẾT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <nav className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
          <Link href="/" className="hover:text-cyan-600 transition-colors">
            Trang chủ
          </Link>
          <ChevronRight size={14} className="text-gray-400" />
          <Link href={parentUrl} className="hover:text-cyan-600 transition-colors font-medium">
            {parentLabel}
          </Link>
          <ChevronRight size={14} className="text-gray-400" />
          <span className="font-bold text-[#0f2942] truncate max-w-[200px] sm:max-w-xs">
            {place.name}
          </span>
        </nav>
      </div>

      {/* 4. LAYOUT 12 CỘT CÂN XỨNG: NỘI DUNG CHÍNH (8 CỘT) + SIDEBAR STICKY (4 CỘT) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ═══ CỘT TRÁI: NỘI DUNG CHÍNH (8 CỘT) ═══ */}
          <div className="lg:col-span-8 w-full">
            {/* 4.1. Thanh thống kê 3 ô bằng nhau (Rating, Khoảng giá, Lượt xem) */}
            <PlaceStats
              avgRating={place.avg_rating}
              reviewCount={place.review_count}
              viewCount={place.view_count}
              priceMin={place.price_min}
              priceMax={place.price_max}
              ticketPrice={place.ticket_price}
            />

            {/* 4.2. Khối 2 ô cân đối: Địa chỉ & Giờ mở cửa hôm nay + Giới thiệu */}
            <PlaceInfo place={place} onOpenMap={handleOpenGoogleMaps} />

            {/* 4.3. THỰC ĐƠN MÓN ĂN & KHẨU VỊ (NHÀ HÀNG - RESTAURANT) */}
            {place.place_type === 'RESTAURANT' && (
              <MenuSection
                menuItems={place.menu_items || []}
                restaurantName={place.name}
              />
            )}

            {/* 4.4. THÔNG TIN DU LỊCH (ĐIỂM THAM QUAN - ATTRACTION) */}
            {place.place_type === 'ATTRACTION' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 mb-8 space-y-6">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-blue-100 text-blue-600 rounded-xl shadow-sm">
                    <Ticket size={18} />
                  </span>
                  <h3 className="text-xl font-extrabold text-[#0f2942]">
                    Thông tin tham quan & Vé vào cổng
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-100">
                    <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">
                      Giá vé tham quan
                    </p>
                    <p className="text-2xl font-black text-[#0f2942]">
                      {place.ticket_price !== null && place.ticket_price !== undefined
                        ? place.ticket_price === 0
                          ? 'Miễn phí vé vào cửa'
                          : formatCurrency(place.ticket_price)
                        : 'Đang cập nhật'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Áp dụng cho khách tham quan trong ngày
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-teal-50/60 border border-teal-100">
                    <p className="text-xs text-teal-600 font-bold uppercase tracking-wider mb-1">
                      Thời lượng tham quan ước tính
                    </p>
                    <p className="text-2xl font-black text-[#0f2942]">
                      {formatDuration(place.visit_duration_minutes)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Thời gian lý tưởng để trải nghiệm trọn vẹn
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 4.5. THÔNG TIN LƯU TRÚ (KHÁCH SẠN - ACCOMMODATION) */}
            {place.place_type === 'ACCOMMODATION' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 mb-8 space-y-6">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-teal-100 text-teal-600 rounded-xl shadow-sm">
                    <Hotel size={18} />
                  </span>
                  <h3 className="text-xl font-extrabold text-[#0f2942]">
                    Tiện ích & Danh sách phòng nghỉ
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 text-sm">
                  <div>
                    <span className="text-xs text-gray-500 block">Giờ nhận phòng:</span>
                    <span className="font-bold text-gray-800">
                      {place.check_in_time || '14:00'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Giờ trả phòng:</span>
                    <span className="font-bold text-gray-800">
                      {place.check_out_time || '12:00'}
                    </span>
                  </div>
                </div>

                {place.amenities && place.amenities.length > 0 && (
                  <div>
                    <h4 className="font-bold text-sm text-[#0f2942] mb-3">Tiện nghi nổi bật</h4>
                    <div className="flex flex-wrap gap-2">
                      {place.amenities.map((a) => (
                        <span
                          key={a.amenity_id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-semibold"
                        >
                          <CheckCircle2 size={13} className="text-teal-600" />
                          {a.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4.6. Lịch mở cửa chi tiết trong tuần */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 mb-8 space-y-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-orange-100 text-orange-600 rounded-xl shadow-sm">
                  <Calendar size={18} />
                </span>
                <h3 className="text-lg sm:text-xl font-extrabold text-[#0f2942]">
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
                        className={`flex items-center justify-between px-4 py-3 rounded-2xl transition-all ${
                          isToday
                            ? 'bg-orange-50 border-2 border-orange-300 font-extrabold text-orange-800 shadow-sm'
                            : 'bg-gray-50 text-gray-600 border border-gray-100'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>{getDayOfWeekName(h.day_of_week)}</span>
                          {isToday && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500 text-white font-bold">
                              Hôm nay
                            </span>
                          )}
                        </span>
                        <span>
                          {h.open_time} – {h.close_time}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Địa điểm mở cửa đón khách hàng ngày theo khung giờ tiêu chuẩn (08:00 – 22:00).
                </p>
              )}
            </div>

            {/* 4.7. Khu vực đánh giá khách hàng (Long API container) */}
            <ReviewSection
              avgRating={place.avg_rating}
              reviewCount={place.review_count}
              placeName={place.name}
            />

            {/* 4.8. Carousel quán gần đây / quán tương tự */}
            <SimilarPlacesSection currentId={place.place_id} />
          </div>

          {/* ═══ CỘT PHẢI: STICKY SIDEBAR LIÊN HỆ & ĐẶT CHỖ (4 CỘT) ═══ */}
          <div className="lg:col-span-4 w-full">
            <BookingSidebar place={place} onOpenMap={handleOpenGoogleMaps} />
          </div>
        </div>
      </main>

      {/* 5. DẢI CTA SÓNG BIỂN TRÔI LIÊN TỤC */}
      <PlaceCTA />

      {/* 6. FOOTER ĐẦY ĐỦ 4 CỘT CHUYÊN NGHIỆP */}
      <SiteFooter />

      {/* 7. NÚT LÊN ĐẦU TRANG VỚI VÒNG TIẾN ĐỘ CUỘN SVG */}
      <ScrollToTop />
    </div>
  );
}
