'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { Clock3, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/lib/api/client';
import { createPlaceReview, getPlaceReviews, type PlaceReview, type PlaceReviewsResponse } from '@/lib/api/reviews';

export default function ReviewSection({ placeId, placeName, imageUrl }: { placeId: string; placeName: string; imageUrl: string }) {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<PlaceReviewsResponse | null>(null);
  const [page, setPage] = useState(1);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pendingReview, setPendingReview] = useState(false);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [notice, setNotice] = useState('');

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      setData(await getPlaceReviews(placeId, page));
      setLoadError('');
    } catch (loadFailure) {
      setLoadError(loadFailure instanceof Error ? loadFailure.message : 'Không thể tải đánh giá.');
    } finally {
      setLoading(false);
    }
  }, [placeId, page]);

  useEffect(() => { void loadReviews(); }, [loadReviews]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');
    if (!rating) { setError('Vui lòng chọn số sao.'); return; }
    if (!comment.trim()) { setError('Vui lòng nhập nội dung đánh giá.'); return; }

    setSubmitting(true);
    try {
      setNotice(await createPlaceReview(placeId, rating, comment.trim()));
      setPendingReview(true);
      setRating(0);
      setComment('');
    } catch (submitError) {
      if (submitError instanceof ApiError && submitError.status === 401) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else if (submitError instanceof ApiError && submitError.status === 409 && submitError.message.includes('đang chờ')) {
        setPendingReview(true);
        setNotice(submitError.message);
      } else {
        setError(submitError instanceof Error ? submitError.message : 'Không thể gửi đánh giá.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="danh-gia" className="mt-10 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-gray-100 pb-6">
        <div className="flex min-w-0 items-center gap-4">
          <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-200 sm:h-20 sm:w-28">
            <Image src={imageUrl} alt={`Hình ảnh ${placeName}`} fill unoptimized sizes="112px" className="object-cover" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#0f2942]">Đánh giá</h2>
            <p className="mt-1 text-sm text-gray-500">Chia sẻ trải nghiệm tại <span className="font-medium text-gray-700">{placeName}</span>.</p>
          </div>
        </div>
        <div className="flex items-center gap-2" aria-label={`Điểm trung bình ${Number(data?.avg_rating ?? 0).toFixed(1)} trên 5`}>
          <Star size={22} className="fill-amber-400 text-amber-400" />
          <span className="text-2xl font-bold text-[#0f2942]">{Number(data?.avg_rating ?? 0).toFixed(1)}</span>
          <span className="text-sm text-gray-500">({data?.review_count ?? 0} đánh giá)</span>
        </div>
      </div>

      <div className="grid gap-8 pt-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
        <div>
          <h3 className="mb-4 font-semibold text-gray-900">Nhận xét đã được duyệt</h3>
          {loading ? <p className="text-sm text-gray-500">Đang tải đánh giá...</p> : null}
          {loadError ? <p role="alert" className="text-sm text-red-600">{loadError} <button type="button" onClick={() => void loadReviews()} className="underline">Thử lại</button></p> : null}
          {!loading && !loadError && data?.reviews.length === 0 ? <p className="text-sm text-gray-500">Chưa có đánh giá nào được duyệt.</p> : null}
          <div className="space-y-5">
            {data?.reviews.map((review: PlaceReview) => (
              <article key={review.review_id} className="border-b border-gray-100 pb-5 last:border-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-gray-900">{review.reviewer_name}</p>
                  <time className="text-xs text-gray-500" dateTime={review.created_at}>{new Date(review.created_at).toLocaleDateString('vi-VN')}</time>
                </div>
                <p className="mt-1 text-sm text-amber-500" aria-label={`${review.rating} trên 5 sao`}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</p>
                {review.comment ? <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">{review.comment}</p> : null}
              </article>
            ))}
          </div>
          {data && data.pagination.total_pages > 1 ? (
            <div className="mt-5 flex items-center gap-3">
              <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40">Trước</button>
              <span className="text-sm text-gray-500">Trang {page}/{data.pagination.total_pages}</span>
              <button type="button" disabled={page >= data.pagination.total_pages || loading} onClick={() => setPage((value) => value + 1)} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40">Tiếp</button>
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl bg-gray-50 p-5">
          <h3 className="font-semibold text-gray-900">Viết đánh giá</h3>
          {authLoading ? <p className="mt-3 text-sm text-gray-500">Đang kiểm tra đăng nhập...</p> : null}
          {!authLoading && !user ? (
            <Link href={`/dang-nhap?redirect=${encodeURIComponent(`/places/${placeId}#danh-gia`)}`} className="mt-4 inline-flex rounded-xl bg-[#0f2942] px-4 py-3 text-sm font-semibold text-white hover:bg-[#1a3f5c]">Đăng nhập để đánh giá</Link>
          ) : null}
          {!authLoading && user && user.role !== 'USER' ? <p className="mt-3 text-sm text-gray-500">Chỉ tài khoản khách du lịch mới có thể gửi đánh giá.</p> : null}
          {!authLoading && user?.role === 'USER' && pendingReview ? (
            <div role="status" className="mt-4 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950 shadow-sm">
              <Clock3 size={21} aria-hidden="true" className="mt-0.5 shrink-0 text-amber-600" />
              <div>
                <p className="font-semibold">Đánh giá đang chờ duyệt</p>
                <p className="mt-1 text-sm leading-6">{notice || 'Đánh giá của bạn đã được gửi và đang chờ admin phê duyệt.'}</p>
              </div>
            </div>
          ) : null}
          {!authLoading && user?.role === 'USER' && !pendingReview ? (
            <form onSubmit={submit} className="mt-4 space-y-4">
              <fieldset>
                <legend className="mb-2 text-sm text-gray-600">Số sao</legend>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <label key={value} className="cursor-pointer rounded p-1 focus-within:outline focus-within:outline-2 focus-within:outline-amber-500">
                      <input type="radio" name="rating" value={value} checked={rating === value} onChange={() => setRating(value)} className="sr-only" aria-label={`${value} sao`} />
                      <Star size={26} aria-hidden="true" className={value <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} />
                    </label>
                  ))}
                </div>
              </fieldset>
              <div>
                <label className="mb-2 block text-sm text-gray-600" htmlFor="review-comment">Nội dung đánh giá</label>
                <textarea id="review-comment" value={comment} onChange={(event) => setComment(event.target.value)} maxLength={1000} rows={4} required className="w-full resize-y rounded-xl border border-gray-200 bg-white p-3 text-sm outline-none focus:border-teal-500" placeholder="Chia sẻ trải nghiệm của bạn..." />
                <p className="text-right text-xs text-gray-400">{comment.length}/1000</p>
              </div>
              {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}
              <button type="submit" disabled={submitting} className="w-full rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60">{submitting ? 'Đang gửi...' : 'Gửi đánh giá'}</button>
            </form>
          ) : null}
        </div>
      </div>
    </section>
  );
}
