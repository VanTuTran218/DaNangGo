'use client';

import { useState } from 'react';
import { AiReplyAssistant } from '@/components/ai/AiTools';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getPartnerReviews, replyPartnerReview } from '@/lib/api/partner';
import type { PartnerReview } from '@/types/partner';
import PartnerDataTable, { PartnerColumn } from '@/components/partner/PartnerDataTable';
import { MessageSquare, Star, Send, X, Building, User } from 'lucide-react';

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

  const columns: PartnerColumn<PartnerReview>[] = [
    {
      key: 'placeName',
      header: 'Cơ sở dịch vụ & Khách hàng',
      sortable: true,
      render: (r) => (
        <div className="space-y-1">
          <p className="font-bold text-[#14233B] flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-[#008F89] shrink-0" />
            <span>{r.placeName}</span>
          </p>
          <p className="text-xs text-[#68798A] flex items-center gap-1.5 font-medium">
            <User className="w-3.5 h-3.5 text-[#68798A]/70 shrink-0" />
            <span>Khách: {r.customerName}</span>
          </p>
        </div>
      ),
    },
    {
      key: 'rating',
      header: 'Đánh giá',
      sortable: true,
      render: (r) => (
        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-600 font-bold text-xs">
          <span>{r.rating}</span>
          <Star className="w-3.5 h-3.5 fill-current text-[#FF8A24]" />
        </div>
      ),
    },
    {
      key: 'comment',
      header: 'Nội dung nhận xét & Phản hồi',
      className: 'max-w-md',
      render: (r) => (
        <div className="space-y-2">
          <p className="text-xs sm:text-[13px] text-[#14233B] leading-relaxed">{r.comment}</p>
          {r.reply ? (
            <div className="p-3 bg-[#E9F8F5] border border-[#BDE8E0] rounded-xl text-xs text-[#073B3A]">
              <span className="font-bold block text-[#008F89]">Phản hồi của bạn:</span>
              <p className="mt-1 leading-relaxed">{r.reply.content}</p>
            </div>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 font-semibold bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
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
      render: (r) => (
        <span className="text-xs font-semibold text-[#68798A]">
          {new Date(r.createdAt).toLocaleDateString('vi-VN')}
        </span>
      ),
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
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#E9F8F5] hover:bg-[#008F89] text-[#008F89] hover:text-white border border-[#BDE8E0] font-bold text-xs rounded-xl transition-all active:scale-95 whitespace-nowrap"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          {r.reply ? 'Sửa phản hồi' : 'Gửi phản hồi'}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Trang */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] sm:text-[30px] font-extrabold text-[#14233B] flex items-center gap-2.5 tracking-tight">
            <span className="w-10 h-10 rounded-xl bg-[#E9F8F5] border border-[#BDE8E0] text-[#008F89] inline-flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5" />
            </span>
            <span>Đánh giá & Phản hồi khách hàng</span>
          </h1>
          <p className="text-sm text-[#68798A] mt-1.5">
            Lắng nghe ý kiến đóng góp và trả lời trực tiếp cho từng khách hàng trải nghiệm tại cơ sở.
          </p>
        </div>
      </div>

      {toast && (
        <div
          role="alert"
          className={`p-4 rounded-2xl border text-sm font-semibold flex items-center justify-between shadow-xs ${
            toast.type === 'error'
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : 'bg-[#E9F8F5] text-[#073B3A] border-[#BDE8E0]'
          }`}
        >
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="p-1 rounded-lg hover:bg-black/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error ? (
        <div className="p-6 bg-rose-50 rounded-[20px] border border-rose-200 text-rose-700">
          <p className="font-semibold mb-2" role="alert">
            {error}
          </p>
          <button
            onClick={reload}
            className="px-4 py-2 bg-rose-600 text-white rounded-xl font-semibold text-xs"
          >
            Thử lại
          </button>
        </div>
      ) : (
        <PartnerDataTable
          data={reviews || []}
          columns={columns}
          loading={loading}
          searchPlaceholder="Tìm theo tên cơ sở, tên khách..."
          searchField={(r) => `${r.placeName} ${r.customerName} ${r.comment}`}
          rowKey={(r) => r.id}
          emptyTitle="Không có dữ liệu"
          emptyDescription="Hiện tại chưa có đánh giá nào từ khách hàng khớp với bộ lọc đã chọn."
          emptyIcon={<MessageSquare className="w-7 h-7" />}
          filterSlot={
            <select
              value={starFilter}
              onChange={(e) =>
                setStarFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
              }
              className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#14233B] bg-[#F6FAFA] border border-[#E2ECEC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/30 focus:border-[#14B8A6] focus:bg-white transition-all cursor-pointer"
            >
              <option value="ALL">Tất cả số sao</option>
              <option value="5">5 sao ⭐⭐⭐⭐⭐</option>
              <option value="4">4 sao ⭐⭐⭐⭐</option>
              <option value="3">3 sao ⭐⭐⭐</option>
              <option value="2">2 sao ⭐⭐</option>
              <option value="1">1 sao ⭐</option>
            </select>
          }
        />
      )}

      {/* Reply Modal */}
      {replyingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#073B3A]/60 backdrop-blur-xs">
          <div className="bg-white rounded-[24px] max-w-md w-full p-6 sm:p-7 shadow-2xl border border-[#E2ECEC] relative space-y-4">
            <button
              onClick={() => setReplyingReview(null)}
              className="absolute right-4 top-4 p-1.5 text-[#68798A] hover:text-[#14233B] hover:bg-[#F6FAFA] rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E9F8F5] border border-[#BDE8E0] text-[#008F89] flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#14233B]">Phản hồi khách hàng</h3>
            </div>

            <div className="p-4 bg-[#F6FAFA] border border-[#E2ECEC] rounded-2xl text-xs text-[#14233B] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#14233B]">{replyingReview.customerName}</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-600 font-bold">
                  ⭐ {replyingReview.rating}
                </span>
              </div>
              <p className="italic text-[#68798A] leading-relaxed">
                &ldquo;{replyingReview.comment}&rdquo;
              </p>
            </div>

            <AiReplyAssistant
              key={replyingReview.id}
              reviewId={replyingReview.id}
              onApply={setReplyText}
            />

            <form onSubmit={handleSendReply} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#14233B] mb-1.5">
                  Nội dung phản hồi *
                </label>
                <textarea
                  maxLength={800}
                  rows={4}
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Cảm ơn quý khách đã ghé thăm và để lại nhận xét..."
                  className="w-full px-3.5 py-2.5 text-sm text-[#14233B] bg-[#F6FAFA] border border-[#E2ECEC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/30 focus:border-[#14B8A6] focus:bg-white transition-all"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E2ECEC]">
                <button
                  type="button"
                  onClick={() => setReplyingReview(null)}
                  className="px-4 py-2.5 bg-[#F6FAFA] hover:bg-slate-100 border border-[#E2ECEC] text-[#14233B] font-bold text-xs rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-[#008F89] hover:bg-[#073B3A] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all active:scale-[0.98]"
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
