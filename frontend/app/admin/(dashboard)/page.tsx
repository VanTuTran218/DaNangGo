'use client';

import { useAsyncData } from '@/hooks/useAsyncData';
import { getAdminDashboardStats, getAdminUserDailyStats, getAdminTodos } from '@/lib/api/admin';
import ColumnChart from '@/components/ui/ColumnChart';
import SkeletonTable from '@/components/ui/SkeletonTable';
import { Users, Building2, Clock, MapPin, Star, ClipboardList, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const { data: stats, loading: loadingStats, error: errorStats, reload: reloadStats } = useAsyncData(getAdminDashboardStats);
  const { data: userChart, loading: loadingChart } = useAsyncData(getAdminUserDailyStats);
  const { data: todos, loading: loadingTodos } = useAsyncData(getAdminTodos);

  if (errorStats) {
    return (
      <div className="p-6 bg-red-50 rounded-2xl border border-red-200 text-red-700">
        <p className="font-semibold mb-2" role="alert">{errorStats}</p>
        <button
          onClick={reloadStats}
          className="px-4 py-2 bg-red-600 text-white rounded-xl font-semibold text-xs hover:bg-red-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  const statCards = [
    { title: 'Tổng người dùng', value: stats?.totalUsers ?? 0, icon: Users, color: 'text-blue-600 bg-blue-50' },
    { title: 'Tổng đối tác', value: stats?.totalPartners ?? 0, icon: Building2, color: 'text-teal-600 bg-teal-50' },
    { title: 'Đối tác chờ duyệt', value: stats?.pendingPartners ?? 0, icon: Clock, color: 'text-amber-600 bg-amber-50' },
    { title: 'Tổng địa điểm', value: stats?.totalPlaces ?? 0, icon: MapPin, color: 'text-emerald-600 bg-emerald-50' },
    { title: 'Tổng đánh giá', value: stats?.totalReviews ?? 0, icon: Star, color: 'text-purple-600 bg-purple-50' },
    { title: 'Khảo sát hoạt động', value: stats?.totalSurveys ?? 0, icon: ClipboardList, color: 'text-pink-600 bg-pink-50' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tổng quan Quản trị</h1>
        <p className="text-sm text-gray-500">Thống kê hoạt động toàn hệ thống DaNangGo.</p>
      </div>

      {/* Stat Cards */}
      {loadingStats ? (
        <SkeletonTable rows={2} cols={3} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

      {/* Chart & Todos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {loadingChart ? (
            <SkeletonTable rows={4} cols={1} />
          ) : (
            <ColumnChart
              data={userChart || []}
              title="Người dùng mới trong 7 ngày qua"
              subtitle="Số lượt đăng ký tài khoản mới theo ngày"
              barColor="#0d9488"
            />
          )}
        </div>

        {/* Todos Widget */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-gray-900">Việc cần xử lý ({todos?.length || 0})</h3>
          </div>

          {loadingTodos ? (
            <div className="animate-pulse space-y-3">
              <div className="h-12 bg-gray-100 rounded-xl" />
              <div className="h-12 bg-gray-100 rounded-xl" />
            </div>
          ) : !todos || todos.length === 0 ? (
            <p className="text-xs text-gray-500 py-6 text-center">Không có việc tồn đọng!</p>
          ) : (
            <div className="space-y-3 flex-1">
              {todos.map((todo) => (
                <div key={todo.id} className="p-3 bg-amber-50/60 rounded-xl border border-amber-100 text-xs text-gray-700 space-y-1">
                  <p className="font-bold text-gray-900">{todo.title}</p>
                  <p className="text-gray-600">{todo.description}</p>
                  <div className="pt-1 flex justify-end">
                    <Link
                      href={
                        todo.type === 'PENDING_PARTNER'
                          ? '/admin/doi-tac'
                          : todo.type === 'REPORTED_REVIEW'
                          ? '/admin/danh-gia'
                          : '/admin/dia-diem'
                      }
                      className="inline-flex items-center gap-1 font-bold text-teal-700 hover:underline"
                    >
                      Xử lý ngay <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
