'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { Pencil, Star, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/lib/api/client';
import { createPlaceReview, deletePlaceReview, getMyReviews, getPlaceReviews, type MyReview, type PlaceReview, type PlaceReviewsResponse, updatePlaceReview } from '@/lib/api/reviews';

export default function ReviewSection({ placeId, placeName, imageUrl = '' }: { placeId: string; placeName: string; imageUrl?: string }) {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<PlaceReviewsResponse | null>(null);
  const [page, setPage] = useState(1);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [myReview, setMyReview] = useState<MyReview | null>(null);
  const [editingOwnReview, setEditingOwnReview] = useState(false);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingReview, setDeletingReview] = useState(false);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [notice, setNotice] = useState('');
  const ownApprovedReview = myReview?.status === 'APPROVED' ? myReview : null;

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const [placeReviews, myReviews] = await Promise.all([
        getPlaceReviews(placeId, page),
        user?.role === 'USER' ? getMyReviews() : Promise.resolve([]),
      ]);
      setData(placeReviews);
      const ownReview = myReviews.find((review) => String(review.place_id) === placeId) ?? null;
      setMyReview(ownReview);
      setLoadError('');
    } catch (loadFailure) {
      setLoadError(loadFailure instanceof Error ? loadFailure.message : 'Không thể tải đánh giá.');
    } finally {
      setLoading(false);
    }
  }, [placeId, page, user?.id, user?.role]);

  useEffect(() => { void loadReviews(); }, [loadReviews]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');
    if (!rating) { setError('Vui lòng chọn số sao.'); return; }
    if (!comment.trim()) { setError('Vui lòng nhập nội dung đánh giá.'); return; }

    setSubmitting(true);
    try {
      setNotice((await createPlaceReview(placeId, rating, comment.trim())).message ?? 'Đánh giá đã được gửi.');
      setRating(0);
      setComment('');
      await loadReviews();
    } catch (submitError) {
      if (submitError instanceof ApiError && submitError.status === 401) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else {
        setError(submitError instanceof Error ? submitError.message : 'Không thể gửi đánh giá.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  function startEditOwnReview() {
    if (!myReview) return;
    setEditRating(myReview.rating);
    setEditComment(myReview.comment ?? '');
    setEditingOwnReview(true);
    setError('');
  }

  async function saveOwnReview() {
    if (!myReview || !editRating || !editComment.trim()) {
      setError('Vui lòng chọn số sao và nhập nội dung đánh giá.');
      return;
    }
    setSavingEdit(true);
    setError('');
    try {
      await updatePlaceReview(myReview.review_id, editRating, editComment.trim());
      setEditingOwnReview(false);
      setNotice('Đánh giá đã cập nhật và đang chờ admin duyệt lại.');
      await loadReviews();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Không thể cập nhật đánh giá.');
    } finally {
      setSavingEdit(false);
    }
  }

  async function removeOwnReview() {
    if (!myReview || !window.confirm('Bạn có chắc muốn xóa đánh giá này?')) return;
    setDeletingReview(true);
    setError('');
    try {
      await deletePlaceReview(myReview.review_id);
      setNotice('Đã xóa đánh giá của bạn.');
      setEditingOwnReview(false);
      await loadReviews();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Không thể xóa đánh giá.');
    } finally {
      setDeletingReview(false);
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

      <div className="grid gap-6 pt-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
        <div>
          <h3 className="mb-4 font-semibold text-gray-900">Nhận xét đã được duyệt</h3>
          {loading ? <p className="text-sm text-gray-500">Đang tải đánh giá...</p> : null}
          {loadError ? <p role="alert" className="text-sm text-red-600">{loadError} <button type="button" onClick={() => void loadReviews()} className="underline">Thử lại</button></p> : null}
          {!loading && !loadError && data?.reviews.length === 0 && !ownApprovedReview ? <p className="text-sm text-gray-500">Chưa có đánh giá nào được duyệt.</p> : null}
          <div className="space-y-3">
            {ownApprovedReview ? <article key={ownApprovedReview.review_id} className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50/50 to-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-gray-900">{user?.name ?? 'Bạn'}</p><span className="rounded-full bg-teal-100 px-2 py-0.5 text-[11px] font-semibold text-teal-800">Đánh giá của bạn</span></div>
                  <time className="mt-1 block text-xs text-gray-500" dateTime={ownApprovedReview.created_at}>{new Date(ownApprovedReview.created_at).toLocaleDateString('vi-VN')}</time>
                </div>
                {!editingOwnReview ? <div className="flex shrink-0 gap-1">
                  <button type="button" onClick={startEditOwnReview} title="Sửa đánh giá" aria-label="Sửa đánh giá" className="rounded-lg p-2 text-slate-500 transition hover:bg-white hover:text-teal-700"><Pencil size={15} aria-hidden="true" /></button>
                  <button type="button" disabled={deletingReview} onClick={() => void removeOwnReview()} title="Xóa đánh giá" aria-label="Xóa đánh giá" className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"><Trash2 size={15} aria-hidden="true" /></button>
                </div> : null}
              </div>
              {editingOwnReview ? <div className="mt-3 space-y-3">
                <fieldset><legend className="mb-2 text-sm text-gray-600">Chỉnh số sao</legend><div className="flex gap-1">{[1, 2, 3, 4, 5].map((value) => <label key={value} className="cursor-pointer rounded p-1 focus-within:outline focus-within:outline-2 focus-within:outline-amber-500"><input type="radio" name="edit-review-rating" value={value} checked={editRating === value} onChange={() => setEditRating(value)} className="sr-only" aria-label={`${value} sao`} /><Star size={24} aria-hidden="true" className={value <= editRating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} /></label>)}</div></fieldset>
                <div><label htmlFor="edit-approved-review-comment" className="mb-2 block text-sm text-gray-600">Nội dung đánh giá</label><textarea id="edit-approved-review-comment" value={editComment} onChange={(event) => setEditComment(event.target.value)} maxLength={1000} rows={4} className="w-full resize-y rounded-xl border border-gray-200 bg-white p-3 text-sm outline-none focus:border-teal-500" /><p className="text-right text-xs text-gray-400">{editComment.length}/1000</p></div>
                <div className="flex gap-2"><button type="button" disabled={savingEdit} onClick={() => void saveOwnReview()} className="rounded-lg bg-teal-600 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60">{savingEdit ? 'Đang lưu...' : 'Lưu'}</button><button type="button" disabled={savingEdit} onClick={() => setEditingOwnReview(false)} className="rounded-lg border px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">Hủy</button></div>
              </div> : <><p className="mt-1 text-sm tracking-wide text-amber-500" aria-label={`${ownApprovedReview.rating} trên 5 sao`}>{'★'.repeat(ownApprovedReview.rating)}{'☆'.repeat(5 - ownApprovedReview.rating)}</p>{ownApprovedReview.comment ? <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">{ownApprovedReview.comment}</p> : null}</>}
            </article> : null}
            {data?.reviews.filter((review) => review.review_id !== ownApprovedReview?.review_id).map((review: PlaceReview) => (
              <article key={review.review_id} className="rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50/80 p-4 shadow-sm transition hover:border-teal-100">
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

        <div className="rounded-2xl border border-slate-100 bg-gradient-to-b from-slate-50 to-white p-5 shadow-sm sm:p-6">
          <h3 className="font-semibold text-gray-900">Viết đánh giá</h3>
          {!authLoading && user?.role === 'USER' ? <p className="mt-1 text-xs leading-5 text-gray-500">Bạn có thể gửi nhiều đánh giá, kể cả cho cùng địa điểm. Mỗi lần gửi cần cách nhau 5 phút để hạn chế spam.</p> : null}
          {notice ? <p role="status" className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</p> : null}
          {error ? <p role="alert" className="mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          {!authLoading && user?.role === 'USER' && ownApprovedReview ? <p className="mt-4 rounded-xl border border-teal-100 bg-teal-50/70 p-3 text-sm leading-6 text-teal-900">Bạn đã đánh giá địa điểm này. Dùng các biểu tượng ở góc thẻ bên trái để sửa hoặc xóa đánh giá.</p> : null}
          {authLoading ? <p className="mt-3 text-sm text-gray-500">Đang kiểm tra đăng nhập...</p> : null}
          {!authLoading && !user ? (
            <Link href={`/dang-nhap?redirect=${encodeURIComponent(`/places/${placeId}#danh-gia`)}`} className="mt-4 inline-flex rounded-xl bg-[#0f2942] px-4 py-3 text-sm font-semibold text-white hover:bg-[#1a3f5c]">Đăng nhập để đánh giá</Link>
          ) : null}
          {!authLoading && user && user.role !== 'USER' ? <p className="mt-3 text-sm text-gray-500">Chỉ tài khoản khách du lịch mới có thể gửi đánh giá.</p> : null}
          {!authLoading && user?.role === 'USER' && myReview && myReview.status !== 'APPROVED' ? (
            <article className="mt-4 rounded-2xl border border-teal-100 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${myReview.status === 'PENDING' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                    {myReview.status === 'PENDING' ? 'Đang chờ duyệt' : 'Đang ẩn'}
                  </span>
                  <p className="mt-2 text-lg tracking-wide text-amber-500" aria-label={`${myReview.rating} trên 5 sao`}>{'★'.repeat(myReview.rating)}{'☆'.repeat(5 - myReview.rating)}</p>
                </div>
                {!editingOwnReview ? <div className="flex shrink-0 gap-2">
                  <button type="button" onClick={startEditOwnReview} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-teal-300 hover:bg-teal-50">Sửa</button>
                  <button type="button" disabled={deletingReview} onClick={() => void removeOwnReview()} className="rounded-lg border border-red-100 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50">{deletingReview ? 'Đang xóa...' : 'Xóa'}</button>
                </div> : null}
              </div>
              {editingOwnReview ? <div className="mt-4 space-y-3">
                <fieldset>
                  <legend className="mb-2 text-sm text-gray-600">Chỉnh số sao</legend>
                  <div className="flex gap-1">{[1, 2, 3, 4, 5].map((value) => <label key={value} className="cursor-pointer rounded p-1 focus-within:outline focus-within:outline-2 focus-within:outline-amber-500"><input type="radio" name="edit-review-rating" value={value} checked={editRating === value} onChange={() => setEditRating(value)} className="sr-only" aria-label={`${value} sao`} /><Star size={25} aria-hidden="true" className={value <= editRating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} /></label>)}</div>
                </fieldset>
                <div>
                  <label htmlFor="edit-review-comment" className="mb-2 block text-sm text-gray-600">Nội dung đánh giá</label>
                  <textarea id="edit-review-comment" value={editComment} onChange={(event) => setEditComment(event.target.value)} maxLength={1000} rows={4} className="w-full resize-y rounded-xl border border-gray-200 bg-white p-3 text-sm outline-none focus:border-teal-500" />
                  <p className="text-right text-xs text-gray-400">{editComment.length}/1000</p>
                </div>
                <div className="flex gap-2"><button type="button" disabled={savingEdit} onClick={() => void saveOwnReview()} className="flex-1 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60">{savingEdit ? 'Đang lưu...' : 'Lưu thay đổi'}</button><button type="button" disabled={savingEdit} onClick={() => setEditingOwnReview(false)} className="rounded-xl border px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Hủy</button></div>
              </div> : <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">{myReview.comment}</p>}
            </article>
          ) : null}
          {!authLoading && user?.role === 'USER' ? (
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
              <button type="submit" disabled={submitting} className="w-full rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60">{submitting ? 'Đang gửi...' : 'Gửi đánh giá'}</button>
            </form>
          ) : null}
        </div>
      </div>
    </section>
  );
}
