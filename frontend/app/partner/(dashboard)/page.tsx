'use client';

import { useAsyncData } from '@/hooks/useAsyncData';
import {
  getPartnerProfile,
  getPartnerDashboardStats,
  getPartnerDailyBookings,
  getPartnerReviews,
} from '@/lib/api/partner';
import { getCurrentSubscription } from '@/lib/api/subscription';
import ColumnChart from '@/components/ui/ColumnChart';
import SkeletonTable from '@/components/ui/SkeletonTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { Building, Eye, CalendarCheck, Star, AlertTriangle, ShieldAlert, ArrowRight, CreditCard, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function PartnerDashboardPage() {
  const { data: profile } = useAsyncData(getPartnerProfile);
  const { data: subData } = useAsyncData(getCurrentSubscription);
  const { data: stats, loading: loadingStats, error: errorStats, reload: reloadStats } = useAsyncData(getPartnerDashboardStats);
  const { data: chartData, loading: loadingChart } = useAsyncData(getPartnerDailyBookings);
  const { data: reviews, loading: loadingReviews } = useAsyncData(() => getPartnerReviews({ rating: 'ALL' }));

  if (errorStats) {
    return (
      <div className="p-6 bg-red-50 rounded-2xl border border-red-200 text-red-700">
        <p className="font-semibold mb-2" role="alert">{errorStats}</p>
        <button onClick={reloadStats} className="px-4 py-2 bg-red-600 text-white rounded-xl font-semibold text-xs">
          Thử lại
        </button>
      </div>
    );
  }

  const isLockedAction = profile?.status === 'PENDING' || profile?.status === 'REJECTED';

  const statCards = [
    { title: 'Số cơ sở kinh doanh', value: stats?.totalPlaces ?? 0, icon: Building, color: 'text-teal-600 bg-teal-50' },
    { title: 'Tổng lượt xem', value: stats?.totalViews ?? 0, icon: Eye, color: 'text-blue-600 bg-blue-50' },
    { title: 'Tổng đơn đặt', value: stats?.totalBookings ?? 0, icon: CalendarCheck, color: 'text-emerald-600 bg-emerald-50' },
    { title: 'Đánh giá trung bình', value: `${stats?.avgRating ?? 5.0} ⭐`, icon: Star, color: 'text-amber-600 bg-amber-50' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tổng quan Cơ sở</h1>
        <p className="text-sm text-gray-500">Chào mừng trở lại! Theo dõi lượt đặt và nhận xét của khách hàng.</p>
      </div>

      {/* Profile Warning Banner */}
      {profile?.status === 'PENDING' && (
        <div role="alert" className="p-5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-bold text-base">Hồ sơ đối tác đang CHỜ XÉT DUYỆT</h3>
            <p className="text-xs text-amber-800 leading-relaxed">
              Ban quản trị DaNangGo đang kiểm tra thông tin doanh nghiệp của bạn. Thao tác đăng cơ sở mới hoặc chỉnh sửa cơ sở hiện bị khóa tạm thời cho đến khi hồ sơ được phê duyệt.
            </p>
          </div>
        </div>
      )}

      {profile?.status === 'REJECTED' && (
        <div role="alert" className="p-5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 flex items-start gap-3 shadow-xs">
          <ShieldAlert className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-bold text-base">Hồ sơ đối tác BỊ TỪ CHỐI</h3>
            <p className="text-xs text-rose-800 leading-relaxed">
              Lý do từ chối: <span className="font-bold">{profile.rejectReason || 'Thông tin chưa hợp lệ.'}</span>. Vui lòng cập nhật lại thông tin hồ sơ doanh nghiệp.
            </p>
            <div className="pt-2">
              <Link href="/partner/ho-so" className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 underline">
                Cập nhật hồ sơ ngay <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Status Banners */}
      {profile?.status === 'APPROVED' && !subData?.hasActiveSubscription && (
        <div role="alert" className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-amber-100 rounded-xl text-amber-700 flex-shrink-0 mt-0.5">
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-base text-gray-900">Chưa kích hoạt gói hoạt động</h3>
              <p className="text-xs text-amber-800 leading-relaxed">
                Để đăng tải và vận hành cơ sở kinh doanh trên DaNangGo, bạn cần đăng ký và kích hoạt gói dịch vụ đối tác.
              </p>
            </div>
          </div>
          <Link
            href="/partner/goi-dich-vu"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex-shrink-0 shadow-xs"
          >
            Đăng ký gói ngay <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {profile?.status === 'APPROVED' && subData?.hasActiveSubscription && subData.currentSubscription && subData.isExpiringSoon && (
        <div role="alert" className="p-5 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl text-orange-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-orange-100 rounded-xl text-orange-700 flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-base text-gray-900">
                Gói {subData.currentSubscription.packageName} sắp hết hạn (còn {subData.daysRemaining} ngày)
              </h3>
              <p className="text-xs text-orange-800 leading-relaxed">
                Hạn sử dụng kết thúc vào ngày {subData.currentSubscription.endDate ? new Date(subData.currentSubscription.endDate).toLocaleDateString('vi-VN') : '---'}. Hãy gia hạn sớm để tránh gián đoạn hiển thị địa điểm.
              </p>
            </div>
          </div>
          <Link
            href="/partner/goi-dich-vu"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition flex-shrink-0 shadow-xs"
          >
            Gia hạn gói <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {profile?.status === 'APPROVED' && subData?.hasActiveSubscription && subData.currentSubscription && !subData.isExpiringSoon && (
        <div className="px-5 py-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-gray-800">
              Đang hoạt động: <span className="font-bold text-emerald-700">{subData.currentSubscription.packageName}</span> ({subData.daysRemaining} ngày còn lại • Hết hạn: {subData.currentSubscription.endDate ? new Date(subData.currentSubscription.endDate).toLocaleDateString('vi-VN') : '---'})
            </span>
          </div>
          <Link
            href="/partner/goi-dich-vu"
            className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline inline-flex items-center gap-1"
          >
            Chi tiết gói <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Stat Cards */}
      {loadingStats ? (
        <SkeletonTable rows={1} cols={4} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div key={idx} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500">{card.title}</p>
                  <p className="text-2xl font-extrabold text-gray-900 mt-1">{card.value}</p>
                </div>
                <div className={`p-3.5 rounded-2xl ${card.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Charts & Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {loadingChart ? (
            <SkeletonTable rows={4} cols={1} />
          ) : (
            <ColumnChart
              data={chartData || []}
              title="Lượt đơn đặt trong 7 ngày qua"
              subtitle="Thống kê khách đặt chỗ qua website DaNangGo"
              barColor="#059669"
            />
          )}
        </div>

        {/* Latest Reviews Widget */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900">Đánh giá mới nhất</h3>
            <Link href="/partner/danh-gia" className="text-xs font-bold text-teal-600 hover:underline">
              Xem tất cả
            </Link>
          </div>

          {loadingReviews ? (
            <div className="animate-pulse space-y-3">
              <div className="h-14 bg-gray-100 rounded-xl" />
              <div className="h-14 bg-gray-100 rounded-xl" />
            </div>
          ) : !reviews || reviews.length === 0 ? (
            <p className="text-xs text-gray-500 py-6 text-center">Chưa có đánh giá nào.</p>
          ) : (
            <div className="space-y-3 flex-1">
              {reviews.slice(0, 3).map((r) => (
                <div key={r.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">{r.customerName}</span>
                    <span className="text-amber-500 font-bold">⭐ {r.rating}</span>
                  </div>
                  <p className="text-gray-600 line-clamp-2">{r.comment}</p>
                  {r.reply && (
                    <p className="text-[11px] text-teal-700 bg-teal-50 p-1.5 rounded-md font-medium mt-1">
                      Phản hồi của bạn: {r.reply.content}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
