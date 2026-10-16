'use client';

import { useState } from 'react';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getContentReviews, moderateContentReview } from '@/lib/api/admin-content';
import type { ContentReviewItem, ContentReviewStatus } from '@/types/admin-content';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { Check, EyeOff, Star, X } from 'lucide-react';

const selectClass =
  'px-3 py-2 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500';

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

export default function AdminReviewsPage() {
  const [statusFilter, setStatusFilter] = useState<ContentReviewStatus | 'ALL'>('PENDING');
  const [starFilter, setStarFilter] = useState<number | 'ALL'>('ALL');
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const { data: reviews, loading, error, reload } = useAsyncData(
    () => getContentReviews({ status: statusFilter, rating: starFilter }),
    [statusFilter, starFilter],
  );

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleModerate = async (review: ContentReviewItem, action: 'APPROVE' | 'HIDE') => {
    setActionLoading(true);
    try {
      showToast(await moderateContentReview(review.id, action));
      reload();
    } catch (err) {
      showToast(errorMessage(err, 'Thao tác thất bại'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const columns: Column<ContentReviewItem>[] = [
    {
      key: 'placeName',
      header: 'Địa điểm & Người viết',
      sortable: true,
      render: (r) => (
        <div>
          <p className="font-bold text-gray-900">{r.placeName}</p>
          <p className="text-xs text-gray-500">Người viết: {r.userName}</p>
        </div>
      ),
    },
    {
      key: 'rating',
      header: 'Đánh giá',
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-1 text-amber-500 font-bold">
          <span>{r.rating}</span>
          <Star className="w-4 h-4 fill-current" />
        </div>
      ),
    },
    {
      key: 'comment',
      header: 'Nội dung nhận xét',
      className: 'max-w-xs',
      render: (r) => <p className="text-xs text-gray-800 line-clamp-2">{r.comment || '(Không có nội dung)'}</p>,
    },
    { key: 'status', header: 'Trạng thái', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'createdAt',
      header: 'Ngày đăng',
      sortable: true,
      render: (r) => new Date(r.createdAt).toLocaleDateString('vi-VN'),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      render: (r) => (
        <div className="flex items-center gap-1.5">
          {r.status !== 'APPROVED' && (
            <button
              onClick={() => handleModerate(r, 'APPROVE')}
              disabled={actionLoading}
              title="Duyệt đánh giá"
              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
            </button>
          )}
          {r.status !== 'HIDDEN' && (
            <button
              onClick={() => handleModerate(r, 'HIDE')}
              disabled={actionLoading}
              title="Ẩn đánh giá"
              className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 disabled:opacity-50"
            >
              <EyeOff className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Kiểm duyệt đánh giá</h1>
        <p className="text-sm text-gray-500">Duyệt hoặc ẩn đánh giá của người dùng. Điểm trung bình của địa điểm được tính lại tự động.</p>
      </div>

      {toast && (
        <div
          role="alert"
          className={`p-4 rounded-xl border text-sm font-semibold flex items-center justify-between ${
            toast.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-teal-50 text-teal-700 border-teal-200'
          }`}
        >
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} aria-label="Đóng thông báo">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error ? (
        <div className="p-6 bg-red-50 rounded-2xl border border-red-200 text-red-700">
          <p className="font-semibold mb-2" role="alert">{error}</p>
          <button onClick={reload} className="px-4 py-2 bg-red-600 text-white rounded-xl font-semibold text-xs">
            Thử lại
          </button>
        </div>
      ) : (
        <DataTable
          data={reviews || []}
          columns={columns}
          loading={loading}
          searchPlaceholder="Tìm theo tên địa điểm, người viết..."
          searchField={(r) => `${r.placeName} ${r.userName} ${r.comment}`}
          rowKey={(r) => r.id}
          emptyTitle="Không có đánh giá nào"
          emptyDescription="Thử đổi bộ lọc trạng thái hoặc số sao."
          filterSlot={
            <>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ContentReviewStatus | 'ALL')}
                className={selectClass}
              >
                <option value="PENDING">Chờ duyệt</option>
                <option value="APPROVED">Đã duyệt</option>
                <option value="HIDDEN">Đã ẩn</option>
                <option value="ALL">Tất cả trạng thái</option>
              </select>
              <select
                value={starFilter}
                onChange={(e) => setStarFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                className={selectClass}
              >
                <option value="ALL">Tất cả sao</option>
                <option value="5">5 sao</option>
                <option value="4">4 sao</option>
                <option value="3">3 sao</option>
                <option value="2">2 sao</option>
                <option value="1">1 sao</option>
              </select>
            </>
          }
        />
      )}
    </div>
  );
}
