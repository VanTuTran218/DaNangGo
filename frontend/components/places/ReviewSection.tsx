'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Star, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/lib/api/client';
import { createPlaceReview, getPlaceReviews, type PlaceReview, type PlaceReviewsResponse } from '@/lib/api/reviews';

export default function ReviewSection({ placeId }: { placeId: string }) {
  const { user, loading: authLoading } = useAuth();
  const [result, setResult] = useState<PlaceReviewsResponse | null>(null);
  const [page, setPage] = useState(1);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pendingReview, setPendingReview] = useState(false);
  const [pendingDialogOpen, setPendingDialogOpen] = useState(false);
  const [error, setError] = useState('');

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      setResult(await getPlaceReviews(placeId, page));
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải đánh giá.');
    } finally {
      setLoading(false);
    }
  }, [placeId, page]);

  useEffect(() => { void loadReviews(); }, [loadReviews]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!rating) {
      setError('Vui lòng chọn số sao.');
      return;
    }
    if (!comment.trim()) {
      setError('Vui lòng nhập nội dung đánh giá.');
      return;
    }
    setSubmitting(true);
    try {
      await createPlaceReview(placeId, rating, comment.trim());
      setPendingReview(true);
      setPendingDialogOpen(true);
      setRating(0);
      setComment('');
    } catch (submitError) {
      if (submitError instanceof ApiError && submitError.status === 401) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để gửi đánh giá.');
      } else if (submitError instanceof ApiError
        && submitError.status === 409
        && submitError.message.toLocaleLowerCase('vi').includes('đang chờ phê duyệt')) {
        setPendingReview(true);
        setPendingDialogOpen(true);
        setRating(0);
        setComment('');
      } else {
        setError(submitError instanceof Error ? submitError.message : 'Không thể gửi đánh giá.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const average = result?.avg_rating ?? 0;

  return (
    <section id="danh-gia" className="mt-12 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#0f2942]">Đánh giá</h2>
          <p className="mt-1 text-sm text-gray-500">Chia sẻ trải nghiệm của bạn về địa điểm này.</p>
        </div>
        <div className="flex items-center gap-2" aria-label={`Điểm trung bình ${average.toFixed(1)} trên 5`}>
          <Star size={22} className="fill-amber-400 text-amber-400" />
          <span className="text-2xl font-bold text-[#0f2942]">{average.toFixed(1)}</span>
          <span className="text-sm text-gray-500">({result?.review_count ?? 0} đánh giá)</span>
        </div>
      </div>

      <div className="grid gap-8 pt-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
        <div>
          <h3 className="mb-4 font-semibold text-gray-900">Đánh giá đã duyệt</h3>
          {loading ? <p className="text-sm text-gray-500">Đang tải đánh giá...</p> : null}
          {!loading && result?.reviews.length === 0 ? <p className="text-sm text-gray-500">Chưa có đánh giá nào được duyệt.</p> : null}
          <div className="space-y-5">
            {result?.reviews.map((review: PlaceReview) => (
              <article key={review.review_id} className="border-b border-gray-100 pb-5 last:border-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-gray-900">{review.reviewer_name}</p>
                  <time className="text-xs text-gray-500" dateTime={review.created_at}>
                    {new Date(review.created_at).toLocaleDateString('vi-VN')}
                  </time>
                </div>
                <p className="mt-1 text-sm text-amber-500" aria-label={`${review.rating} trên 5 sao`}>
                  {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">{review.comment}</p>
              </article>
            ))}
          </div>
          {result && result.pagination.total_pages > 1 ? (
            <div className="mt-5 flex items-center gap-3">
              <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40">Trước</button>
              <span className="text-sm text-gray-500">Trang {page}/{result.pagination.total_pages}</span>
              <button type="button" disabled={page >= result.pagination.total_pages || loading} onClick={() => setPage((value) => value + 1)} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40">Tiếp</button>
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl bg-gray-50 p-5">
          <h3 className="font-semibold text-gray-900">Viết đánh giá</h3>
          {authLoading ? <p className="mt-3 text-sm text-gray-500">Đang kiểm tra đăng nhập...</p> : null}
          {!authLoading && !user ? (
            <Link href="/dang-nhap" className="mt-4 inline-flex rounded-xl bg-[#0f2942] px-4 py-3 text-sm font-semibold text-white hover:bg-[#1a3f5c]">
              Đăng nhập để đánh giá
            </Link>
          ) : null}
          {!authLoading && user && user.role !== 'USER' ? <p className="mt-3 text-sm text-gray-500">Chỉ tài khoản người dùng mới có thể gửi đánh giá.</p> : null}
          {!authLoading && user?.role === 'USER' && pendingReview ? (
            <div role="status" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-semibold">Đánh giá của bạn đang chờ phê duyệt.</p>
              <p className="mt-1">Sau khi admin duyệt, đánh giá sẽ hiển thị trên trang chi tiết địa điểm.</p>
            </div>
          ) : null}
          {!authLoading && user?.role === 'USER' && !pendingReview ? (
            <form onSubmit={submit} className="mt-4 space-y-4">
              <fieldset>
                <legend className="mb-2 text-sm text-gray-600">Số sao</legend>
                <div className="flex gap-1" role="radiogroup" aria-label="Chọn số sao">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button key={value} type="button" role="radio" aria-checked={rating === value} aria-label={`${value} sao`} onClick={() => setRating(value)} className="rounded p-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500">
                      <Star size={26} className={value <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} />
                    </button>
                  ))}
                </div>
              </fieldset>
              <label className="block text-sm text-gray-600" htmlFor="review-comment">Nội dung</label>
              <textarea id="review-comment" value={comment} onChange={(event) => setComment(event.target.value)} maxLength={1000} rows={4} className="w-full resize-y rounded-xl border border-gray-200 bg-white p-3 text-sm outline-none focus:border-teal-500" placeholder="Chia sẻ trải nghiệm của bạn..." />
              <p className="text-right text-xs text-gray-400">{comment.length}/1000</p>
              {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}
              <button type="submit" disabled={submitting} className="w-full rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60">
                {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
              </button>
            </form>
          ) : null}
        </div>
      </div>

      {pendingDialogOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setPendingDialogOpen(false);
        }}>
          <div role="dialog" aria-modal="true" aria-labelledby="review-pending-title" aria-describedby="review-pending-description" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <CheckCircle2 size={24} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 id="review-pending-title" className="text-lg font-bold text-slate-900">Đánh giá đang chờ phê duyệt</h3>
                <p id="review-pending-description" className="mt-2 text-sm leading-6 text-slate-600">
                  Đánh giá của bạn đang chờ admin duyệt. Sau khi được duyệt, đánh giá sẽ hiển thị trên trang chi tiết địa điểm.
                </p>
              </div>
              <button type="button" onClick={() => setPendingDialogOpen(false)} aria-label="Đóng thông báo" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <button type="button" autoFocus onClick={() => setPendingDialogOpen(false)} className="mt-6 w-full rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-700">
              Đã hiểu
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
