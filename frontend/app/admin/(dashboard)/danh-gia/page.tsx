'use client';

import { useState } from 'react';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getAdminReviews, updateAdminReviewStatus, deleteAdminReview } from '@/lib/api/admin';
import type { AdminReviewItem } from '@/types/admin';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Eye, EyeOff, Trash2, AlertTriangle, Star, X } from 'lucide-react';

export default function AdminReviewsPage() {
  const [starFilter, setStarFilter] = useState<number | 'ALL'>('ALL');
  const [reportedOnly, setReportedOnly] = useState(false);
  const [deletingReview, setDeletingReview] = useState<AdminReviewItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const { data: reviews, loading, error, reload } = useAsyncData(
    () => getAdminReviews({ rating: starFilter, isReportedOnly: reportedOnly }),
    [starFilter, reportedOnly]
  );

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggleStatus = async (review: AdminReviewItem) => {
    setActionLoading(true);
    try {
      const nextStatus = review.status === 'ACTIVE' ? 'HIDDEN' : 'ACTIVE';
      const res = await updateAdminReviewStatus(review.id, nextStatus);
      showToast(res.message);
      reload();
    } catch (err: any) {
      showToast(err?.message || 'Thao tác thất bại', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingReview) return;
    setActionLoading(true);
    try {
      const res = await deleteAdminReview(deletingReview.id);
      showToast(res.message);
      setDeletingReview(null);
      reload();
    } catch (err: any) {
      showToast(err?.message || 'Xóa thất bại', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const columns: Column<AdminReviewItem>[] = [
    {
      key: 'placeName',
      header: 'Địa điểm & Người dùng',
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
      render: (r) => (
        <div>
          <p className="text-xs text-gray-800 line-clamp-2">{r.comment}</p>
          {r.isReported && (
            <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 p-1 rounded-md">
              <AlertTriangle className="w-3 h-3 flex-shrink-0" />
              <span>Báo cáo: {r.reportReason || 'Nội dung vi phạm'}</span>
            </div>
          )}
        </div>
      ),
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
          <button
            onClick={() => handleToggleStatus(r)}
            disabled={actionLoading}
            title={r.status === 'ACTIVE' ? 'Ẩn đánh giá' : 'Hiện đánh giá'}
            className={`p-1.5 rounded-lg transition-colors ${
              r.status === 'ACTIVE' ? 'text-amber-600 hover:bg-amber-50' : 'text-teal-600 hover:bg-teal-50'
            }`}
          >
            {r.status === 'ACTIVE' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setDeletingReview(r)}
            title="Xóa vĩnh viễn"
            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Kiểm duyệt đánh giá</h1>
        <p className="text-sm text-gray-500">Quản lý nhận xét và phản hồi các báo cáo vi phạm nội dung.</p>
      </div>

      {toast && (
        <div
          role="alert"
          className={`p-4 rounded-xl border text-sm font-semibold flex items-center justify-between ${
            toast.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-teal-50 text-teal-700 border-teal-200'
          }`}
        >
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)}>
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
          filterSlot={
            <>
              <select
                value={starFilter}
                onChange={(e) => setStarFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                className="px-3 py-2 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="ALL">Tất cả sao</option>
                <option value="5">5 sao</option>
                <option value="4">4 sao</option>
                <option value="3">3 sao</option>
                <option value="2">2 sao</option>
                <option value="1">1 sao</option>
              </select>

              <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700">
                <input
                  type="checkbox"
                  checked={reportedOnly}
                  onChange={(e) => setReportedOnly(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded-md focus:ring-teal-500"
                />
                <span>Chỉ hiện bị báo cáo</span>
              </label>
            </>
          }
        />
      )}

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingReview)}
        onClose={() => setDeletingReview(null)}
        onConfirm={handleDeleteConfirm}
        title="Xóa đánh giá"
        description="Bạn có chắc chắn muốn xóa vĩnh viễn đánh giá này? Thao tác không thể hoàn tác."
        variant="danger"
        confirmText="Xóa đánh giá"
        loading={actionLoading}
      />
    </div>
  );
}
