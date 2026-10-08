'use client';

import { useState } from 'react';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getPartnerReviews, replyPartnerReview } from '@/lib/api/partner';
import type { PartnerReview } from '@/types/partner';
import DataTable, { Column } from '@/components/ui/DataTable';
import { MessageSquare, Star, Send, X } from 'lucide-react';

export default function PartnerReviewsPage() {
  const [starFilter, setStarFilter] = useState<number | 'ALL'>('ALL');
  const [replyingReview, setReplyingReview] = useState<PartnerReview | null>(null);
  const [replyText, setReplyText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const { data: reviews, loading, error, reload } = useAsyncData(
    () => getPartnerReviews({ rating: starFilter }),
    [starFilter]
  );

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingReview || !replyText.trim()) return;
    setActionLoading(true);
    try {
      const res = await replyPartnerReview(replyingReview.id, replyText.trim());
      showToast(res.message);
      setReplyingReview(null);
      setReplyText('');
      reload();
    } catch (err: any) {
      showToast(err?.message || 'Gửi phản hồi thất bại', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const columns: Column<PartnerReview>[] = [
    {
      key: 'placeName',
      header: 'Cơ sở dịch vụ & Khách hàng',
      sortable: true,
      render: (r) => (
        <div>
          <p className="font-bold text-gray-900">{r.placeName}</p>
          <p className="text-xs text-gray-500">Khách: {r.customerName}</p>
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
      header: 'Nội dung nhận xét & Phản hồi',
      className: 'max-w-md',
      render: (r) => (
        <div className="space-y-1.5">
          <p className="text-xs text-gray-800">{r.comment}</p>
          {r.reply ? (
            <div className="p-2.5 bg-teal-50 border border-teal-100 rounded-xl text-xs text-teal-800">
              <span className="font-bold block text-teal-900">Phản hồi của bạn:</span>
              <p className="mt-0.5">{r.reply.content}</p>
            </div>
          ) : (
            <span className="inline-block text-[11px] text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-md">
              Chưa phản hồi
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Ngày gửi',
      sortable: true,
      render: (r) => new Date(r.createdAt).toLocaleDateString('vi-VN'),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      render: (r) => (
        <button
          onClick={() => {
            setReplyingReview(r);
            setReplyText(r.reply?.content || '');
          }}
          className="flex items-center gap-1 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-xs rounded-xl transition-colors"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          {r.reply ? 'Sửa phản hồi' : 'Gửi phản hồi'}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Đánh giá & Phản hồi khách hàng</h1>
        <p className="text-sm text-gray-500">Lắng nghe ý kiến đóng góp và trả lời trực tiếp cho từng khách hàng.</p>
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
          searchPlaceholder="Tìm theo tên cơ sở, tên khách..."
          searchField={(r) => `${r.placeName} ${r.customerName} ${r.comment}`}
          rowKey={(r) => r.id}
          filterSlot={
            <select
              value={starFilter}
              onChange={(e) => setStarFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              className="px-3 py-2 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="ALL">Tất cả số sao</option>
              <option value="5">5 sao</option>
              <option value="4">4 sao</option>
              <option value="3">3 sao</option>
              <option value="2">2 sao</option>
              <option value="1">1 sao</option>
            </select>
          }
        />
      )}

      {/* Reply Modal */}
      {replyingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 relative space-y-4">
            <button
              onClick={() => setReplyingReview(null)}
              className="absolute right-4 top-4 p-1 text-gray-400 hover:text-gray-600 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-gray-900">Phản hồi khách hàng</h3>
            <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-700 space-y-1">
              <p className="font-bold text-gray-900">{replyingReview.customerName} ⭐ {replyingReview.rating}</p>
              <p className="italic text-gray-600">&ldquo;{replyingReview.comment}&rdquo;</p>
            </div>

            <form onSubmit={handleSendReply} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nội dung phản hồi *</label>
                <textarea
                  rows={4}
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Cảm ơn quý khách đã ghé thăm..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setReplyingReview(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-bold text-xs rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  {actionLoading ? 'Đang gửi...' : 'Gửi phản hồi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
