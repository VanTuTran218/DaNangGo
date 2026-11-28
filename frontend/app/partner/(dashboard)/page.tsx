'use client';

import { motion } from 'framer-motion';
import { useAsyncData } from '@/hooks/useAsyncData';
import {
  getPartnerProfile,
  getPartnerDashboardStats,
  getPartnerDailyBookings,
  getPartnerReviews,
} from '@/lib/api/partner';
import { getCurrentSubscription } from '@/lib/api/subscription';
import PartnerColumnChart from '@/components/partner/PartnerColumnChart';
import SkeletonTable from '@/components/ui/SkeletonTable';
import {
  Building,
  Eye,
  CalendarCheck,
  Star,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  CreditCard,
  Crown,
  MessageSquare,
  Compass,
} from 'lucide-react';
import Link from 'next/link';

export default function PartnerDashboardPage() {
  const { data: profile } = useAsyncData(getPartnerProfile);
  const { data: subData } = useAsyncData(getCurrentSubscription);
  const {
    data: stats,
    loading: loadingStats,
    error: errorStats,
    reload: reloadStats,
  } = useAsyncData(getPartnerDashboardStats);
  const { data: chartData, loading: loadingChart } = useAsyncData(getPartnerDailyBookings);
  const { data: reviews, loading: loadingReviews } = useAsyncData(() =>
    getPartnerReviews({ rating: 'ALL' })
  );

  if (errorStats) {
    return (
      <div className="p-6 bg-rose-50 rounded-[20px] border border-rose-200 text-rose-700">
        <p className="font-semibold mb-2" role="alert">
          {errorStats}
        </p>
        <button
          onClick={reloadStats}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold text-xs transition-colors"
        >
          Thử lại
        </button>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Số cơ sở kinh doanh',
      value: stats?.totalPlaces ?? 0,
      icon: Building,
      iconStyle: 'bg-[#E9F8F5] text-[#008F89] border-[#BDE8E0]',
      accentBar: 'bg-[#008F89]',
    },
    {
      title: 'Tổng lượt xem',
      value: stats?.totalViews ?? 0,
      icon: Eye,
      iconStyle: 'bg-sky-50 text-[#087CB2] border-sky-200/80',
      accentBar: 'bg-[#087CB2]',
    },
    {
      title: 'Tổng đơn đặt',
      value: stats?.totalBookings ?? 0,
      icon: CalendarCheck,
      iconStyle: 'bg-emerald-50 text-emerald-600 border-emerald-200/80',
      accentBar: 'bg-emerald-500',
    },
    {
      title: 'Đánh giá trung bình',
      value: `${stats?.avgRating ?? 0} ⭐`,
      icon: Star,
      iconStyle: 'bg-amber-50 text-[#FF8A24] border-amber-200/80',
      accentBar: 'bg-[#FF8A24]',
    },
  ];

  return (
    <div className="space-y-7">
      {/* A. Hero Chào mừng Đà Nẵng */}
      <div
        className="relative overflow-hidden rounded-[22px] min-h-[188px] md:min-h-[208px] flex items-center p-6 sm:p-8 md:p-10 shadow-md border border-[#073B3A]/20 bg-[#073B3A]"
        style={{
          backgroundImage: `url('/images/partner/danang-my-khe-aerial.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 35%',
        }}
      >
        {/* Lớp phủ Gradient Deep Ocean giúp chữ nổi bật */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#052E2D]/95 via-[#073B3A]/88 to-[#087CB2]/65" />

        {/* Họa tiết đường sóng tinh tế bên phải */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-25 overflow-hidden">
          <svg
            className="w-full h-full text-[#14B8A6]"
            viewBox="0 0 500 220"
            preserveAspectRatio="none"
          >
            <path
              d="M80,220 C160,120 260,180 360,70 C410,15 460,40 500,10 L500,220 Z"
              fill="currentColor"
            />
            <path
              d="M160,220 C230,150 320,190 420,95 C460,55 485,65 500,45 L500,220 Z"
              fill="currentColor"
              opacity="0.5"
            />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 w-full">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/12 border border-white/15 text-[#6EE7B7] text-xs font-semibold backdrop-blur-xs">
              <Compass className="w-3.5 h-3.5 text-[#FF8A24]" />
              <span>DanangGo Coastal Partner Hub</span>
            </div>
            <h1 className="text-[28px] sm:text-[32px] font-extrabold text-white tracking-tight leading-tight">
              Tổng quan Cơ sở
            </h1>
            <p className="text-sm sm:text-[15px] text-teal-50/90 leading-relaxed">
              Chào mừng trở lại{profile?.businessName ? `, ${profile.businessName}` : ''}! Theo dõi lượt đặt và nhận xét của khách hàng.
            </p>
          </div>

          <div className="hidden lg:flex items-center gap-3 shrink-0">
            <Link
              href="/partner/co-so"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/12 hover:bg-white/20 text-white border border-white/20 text-xs font-bold backdrop-blur-xs transition-all"
            >
              <Building className="w-4 h-4 text-[#6EE7B7]" />
              <span>Quản lý cơ sở</span>
            </Link>
            <Link
              href="/partner/don-dat"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF8A24] hover:bg-[#f07b16] text-white text-xs font-bold shadow-sm transition-all"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Xem đơn đặt</span>
            </Link>
          </div>
        </div>
      </div>

      {/* B. Trạng thái gói hiện tại */}
      {profile?.status === 'APPROVED' && !subData?.hasActiveSubscription && (
        <div
          role="alert"
          className="p-5 bg-gradient-to-r from-amber-50 to-orange-50/80 border border-amber-200/90 rounded-[20px] text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs"
        >
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-amber-100 rounded-xl text-amber-700 shrink-0 mt-0.5">
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-base text-[#14233B]">
                Chưa kích hoạt gói hoạt động
              </h3>
              <p className="text-xs text-amber-800 leading-relaxed">
                Để đăng tải và vận hành cơ sở kinh doanh trên DaNangGo, bạn cần đăng ký và kích hoạt gói dịch vụ đối tác.
              </p>
            </div>
          </div>
          <Link
            href="/partner/goi-dich-vu"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#FF8A24] hover:bg-[#f07b16] text-white rounded-xl text-xs font-bold transition shrink-0 shadow-xs"
          >
            Đăng ký gói ngay <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {profile?.status === 'APPROVED' &&
        subData?.hasActiveSubscription &&
        subData.currentSubscription &&
        subData.isExpiringSoon && (
          <div
            role="alert"
            className="p-5 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/90 rounded-[20px] text-orange-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs"
          >
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-orange-100 rounded-xl text-orange-700 shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base text-[#14233B]">
                  Gói {subData.currentSubscription.packageName} sắp hết hạn (còn{' '}
                  {subData.daysRemaining} ngày)
                </h3>
                <p className="text-xs text-orange-800 leading-relaxed">
                  Hạn sử dụng kết thúc vào ngày{' '}
                  {subData.currentSubscription.endDate
                    ? new Date(subData.currentSubscription.endDate).toLocaleDateString('vi-VN')
                    : '---'}
                  . Hãy gia hạn sớm để tránh gián đoạn hiển thị địa điểm.
                </p>
              </div>
            </div>
            <Link
              href="/partner/goi-dich-vu"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#FF8A24] hover:bg-[#f07b16] text-white rounded-xl text-xs font-bold transition shrink-0 shadow-xs"
            >
              Gia hạn gói <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

      {profile?.status === 'APPROVED' &&
        subData?.hasActiveSubscription &&
        subData.currentSubscription &&
        !subData.isExpiringSoon && (
          <div className="px-5 py-4 bg-[#E9F8F5] border border-[#BDE8E0] rounded-[18px] text-[#073B3A] flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 text-xs shadow-2xs">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="w-8 h-8 rounded-xl bg-[#008F89] text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Crown className="w-4 h-4 text-[#FF8A24] fill-current" />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white text-[#008F89] font-bold text-[11px] border border-[#BDE8E0]">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  Đang hoạt động
                </span>
                <span className="font-bold text-[#14233B] text-sm">
                  {subData.currentSubscription.packageName}
                </span>
                <span className="text-[#68798A] font-medium">
                  • Còn <strong className="text-[#073B3A]">{subData.daysRemaining} ngày</strong> •
                  Hết hạn:{' '}
                  <strong className="text-[#14233B]">
                    {subData.currentSubscription.endDate
                      ? new Date(subData.currentSubscription.endDate).toLocaleDateString('vi-VN')
                      : '---'}
                  </strong>
                </span>
              </div>
            </div>

            <Link
              href="/partner/goi-dich-vu"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#008F89] text-[#008F89] hover:text-white border border-[#BDE8E0] font-bold text-xs transition-all shrink-0 self-start sm:self-auto shadow-2xs"
            >
              <span>Chi tiết gói</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

      {/* C. KPI Cards */}
      {loadingStats ? (
        <SkeletonTable rows={1} cols={4} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {statCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.06 }}
                className="group relative bg-white rounded-[20px] p-5 sm:p-6 border border-[#E2ECEC] hover:border-[#BDE8E0] shadow-xs hover:shadow-md hover:-translate-y-[3px] transition-all duration-200 flex items-center justify-between overflow-hidden"
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${card.accentBar} opacity-80`} />
                <div className="pl-1">
                  <p className="text-xs font-semibold text-[#68798A] uppercase tracking-wider">
                    {card.title}
                  </p>
                  <p className="text-[28px] sm:text-[32px] font-extrabold text-[#14233B] mt-1.5 leading-none">
                    {typeof card.value === 'number'
                      ? card.value.toLocaleString('vi-VN')
                      : card.value}
                  </p>
                </div>
                <div
                  className={`w-13 h-13 rounded-2xl border flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${card.iconStyle}`}
                >
                  <Icon className="w-6 h-6" />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* D & E. Biểu đồ đặt chỗ & Đánh giá mới nhất */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-7">
        <div className="lg:col-span-2">
          {loadingChart ? (
            <SkeletonTable rows={4} cols={1} />
          ) : (
            <PartnerColumnChart
              data={chartData || []}
              title="Lượt đơn đặt trong 7 ngày qua"
              subtitle="Thống kê khách đặt chỗ qua website DaNangGo"
            />
          )}
        </div>

        {/* E. Đánh giá mới nhất */}
        <div className="bg-white rounded-[20px] border border-[#E2ECEC] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#E2ECEC]/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#E9F8F5] border border-[#BDE8E0] text-[#008F89] flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <h3 className="text-[17px] font-bold text-[#14233B]">Đánh giá mới nhất</h3>
              </div>
              <Link
                href="/partner/danh-gia"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#008F89] hover:text-[#073B3A] transition-colors"
              >
                <span>Xem tất cả</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loadingReviews ? (
              <div className="animate-pulse space-y-3">
                <div className="h-16 bg-[#F6FAFA] rounded-2xl" />
                <div className="h-16 bg-[#F6FAFA] rounded-2xl" />
              </div>
            ) : !reviews || reviews.length === 0 ? (
              <div className="py-10 px-4 text-center flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-[#E9F8F5] border border-[#BDE8E0] text-[#008F89] flex items-center justify-center mb-3">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-[#14233B]">Chưa có đánh giá nào</p>
                <p className="text-xs text-[#68798A] mt-1 max-w-[220px] leading-relaxed">
                  Các nhận xét mới từ khách du lịch sẽ xuất hiện tại đây.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {reviews.slice(0, 3).map((r) => (
                  <div
                    key={r.id}
                    className="p-3.5 bg-[#F6FAFA] hover:bg-[#E9F8F5]/40 rounded-2xl border border-[#E2ECEC] transition-colors text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-[#14233B] truncate">{r.customerName}</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200/80 text-amber-600 font-bold text-[11px] shrink-0">
                        ⭐ {r.rating}
                      </span>
                    </div>
                    <p className="text-[#68798A] line-clamp-2 leading-relaxed">{r.comment}</p>
                    {r.reply && (
                      <div className="text-[11px] text-[#073B3A] bg-[#E9F8F5] border border-[#BDE8E0]/70 p-2 rounded-xl font-medium mt-1">
                        <span className="font-bold text-[#008F89]">Phản hồi: </span>
                        {r.reply.content}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-[#E2ECEC]/60">
            <Link
              href="/partner/danh-gia"
              className="w-full py-2.5 px-4 rounded-xl bg-[#F6FAFA] hover:bg-[#E9F8F5] border border-[#E2ECEC] text-[#14233B] hover:text-[#008F89] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Quản lý tất cả đánh giá</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
