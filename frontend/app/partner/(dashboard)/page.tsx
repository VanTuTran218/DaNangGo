'use client';

import { useAsyncData } from '@/hooks/useAsyncData';
import {
  getPartnerProfile,
  getPartnerDashboardStats,
  getPartnerDailyBookings,
  getPartnerReviews,
} from '@/lib/api/partner';
import ColumnChart from '@/components/ui/ColumnChart';
import SkeletonTable from '@/components/ui/SkeletonTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { Building, Eye, CalendarCheck, Star, AlertTriangle, ShieldAlert, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function PartnerDashboardPage() {
  const { data: profile } = useAsyncData(getPartnerProfile);
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
