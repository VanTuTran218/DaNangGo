"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, Star, X } from "lucide-react";
import ReviewPhotoGrid from "./ReviewPhotoGrid";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api/client";
import {
  createPlaceReviewWithImages,
  getMyReviews,
  getReviewEligibility,
  getPlaceReviews,
  type MyReview,
  type PlaceReview,
  type PlaceReviewsResponse,
} from "@/lib/api/reviews";

type SelectedReviewImage = { file: File; url: string };

export default function ReviewSection({
  placeId,
  placeName,
  imageUrl = '',
}: {
  placeId: string;
  placeName: string;
  imageUrl?: string;
}) {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<PlaceReviewsResponse | null>(null);
  const [page, setPage] = useState(1);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [selectedImages, setSelectedImages] = useState<SelectedReviewImage[]>(
    [],
  );
  const imageUrls = useRef(new Set<string>());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [myReview, setMyReview] = useState<MyReview | null>(null);
  const [nextReviewAt, setNextReviewAt] = useState(0);
  const [now, setNow] = useState(0);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const ownApprovedReview = myReview?.status === "APPROVED" ? myReview : null;

  // Thu hồi thumbnail tạm khi ảnh bị bỏ hoặc component rời trang.
  useEffect(
    () => () => {
      for (const url of imageUrls.current) URL.revokeObjectURL(url);
      imageUrls.current.clear();
    },
    [],
  );

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const [placeReviews, myReviews, eligibility] = await Promise.all([
        getPlaceReviews(placeId, page),
        user?.role === "USER" ? getMyReviews() : Promise.resolve([]),
        user?.role === "USER" ? getReviewEligibility(placeId) : Promise.resolve({ retry_after_ms: 0 }),
      ]);
      setData(placeReviews);
      const ownReview =
        myReviews.find((review) => String(review.place_id) === placeId) ?? null;
      setMyReview(ownReview);
      setNextReviewAt(Date.now() + eligibility.retry_after_ms);
      setNow(Date.now());
      setLoadError("");
    } catch (loadFailure) {
      setLoadError(
        loadFailure instanceof Error
          ? loadFailure.message
          : "Không thể tải đánh giá.",
      );
    } finally {
      setLoading(false);
    }
  }, [placeId, page, user?.id, user?.role]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    if (!nextReviewAt || nextReviewAt <= now) return;
    const timer = setTimeout(() => setNow(Date.now()), Math.max(0, nextReviewAt - Date.now()));
    return () => clearTimeout(timer);
  }, [nextReviewAt, now]);

  const waiting = nextReviewAt > now;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError("");
    setNotice("");
    if (!rating) {
      setError("Vui lòng chọn số sao.");
      return;
    }
    if (!comment.trim()) {
      setError("Vui lòng nhập nội dung đánh giá.");
      return;
    }

    setSubmitting(true);
    try {
      setNotice(
        (
          await createPlaceReviewWithImages(
            placeId,
            rating,
            comment.trim(),
            selectedImages.map(({ file }) => file),
          )
        ).message ?? "Đánh giá đã được gửi.",
      );
      setRating(0);
      setComment("");
      clearSelectedImages();
      await loadReviews();
    } catch (submitError) {
      if (submitError instanceof ApiError && submitError.status === 401) {
        setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      } else {
        if (submitError instanceof ApiError && submitError.status === 429) void loadReviews();
        setError(
          submitError instanceof Error
            ? submitError.message
            : "Không thể gửi đánh giá.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  function clearSelectedImages() {
    for (const { url } of selectedImages) {
      URL.revokeObjectURL(url);
      imageUrls.current.delete(url);
    }
    setSelectedImages([]);
  }

  function chooseImages(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;
    const accepted: SelectedReviewImage[] = [];
    let message = "";
    for (const file of files) {
      if (selectedImages.length + accepted.length >= 5) {
        message = "Mỗi đánh giá chỉ được chọn tối đa 5 ảnh.";
        break;
      }
      if (file.size > 5 * 1024 * 1024) {
        message = `${file.name}: dung lượng ảnh không được vượt quá 5 MB.`;
        continue;
      }
      const extension = file.name.split(".").pop()?.toLowerCase();
      const expectedMime: Record<string, string> = {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        webp: "image/webp",
      };
      if (
        !extension ||
        !expectedMime[extension] ||
        (file.type && file.type !== expectedMime[extension])
      ) {
        message = `${file.name}: chỉ chấp nhận ảnh JPG, PNG hoặc WEBP.`;
        continue;
      }
      const url = URL.createObjectURL(file);
      imageUrls.current.add(url);
      accepted.push({ file, url });
    }
    if (accepted.length)
      setSelectedImages((current) => [...current, ...accepted]);
    setError(message);
  }

  function removeSelectedImage(url: string) {
    URL.revokeObjectURL(url);
    imageUrls.current.delete(url);
    setSelectedImages((current) =>
      current.filter((image) => image.url !== url),
    );
  }


  return (
    <section
      id="danh-gia"
      className="mt-10 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-gray-100 pb-6">
        <div className="flex min-w-0 items-center gap-4">
          {imageUrl ? (
            <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-200 sm:h-20 sm:w-28">
              <Image
                src={imageUrl}
                alt={`Hình ảnh ${placeName}`}
                fill
                unoptimized
                sizes="112px"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="relative flex h-16 w-20 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400 sm:h-20 sm:w-28">
              <span className="text-xs">Không có ảnh</span>
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold text-[#0f2942]">Đánh giá</h2>
            <p className="mt-1 text-sm text-gray-500">
              Chia sẻ trải nghiệm tại{" "}
              <span className="font-medium text-gray-700">{placeName}</span>.
            </p>
          </div>
        </div>
        <div
          className="flex items-center gap-2"
          aria-label={`Điểm trung bình ${Number(data?.avg_rating ?? 0).toFixed(1)} trên 5`}
        >
          <Star size={22} className="fill-amber-400 text-amber-400" />
          <span className="text-2xl font-bold text-[#0f2942]">
            {Number(data?.avg_rating ?? 0).toFixed(1)}
          </span>
          <span className="text-sm text-gray-500">
            ({data?.review_count ?? 0} đánh giá)
          </span>
        </div>
      </div>

      <div className="grid gap-6 pt-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
        <div>
          <h3 className="mb-4 font-semibold text-gray-900">
            Nhận xét đã được duyệt
          </h3>
          {loading ? (
            <p className="text-sm text-gray-500">Đang tải đánh giá...</p>
          ) : null}
          {loadError ? (
            <p role="alert" className="text-sm text-red-600">
              {loadError}{" "}
              <button
                type="button"
                onClick={() => void loadReviews()}
                className="underline"
              >
                Thử lại
              </button>
            </p>
          ) : null}
          {!loading &&
          !loadError &&
          data?.reviews.length === 0 &&
          !ownApprovedReview ? (
            <p className="text-sm text-gray-500">
              Chưa có đánh giá nào được duyệt.
            </p>
          ) : null}
          <div className="space-y-3">
            {ownApprovedReview ? (
              <article className="rounded-2xl border border-teal-200 bg-teal-50/50 p-4 shadow-sm">
                <p className="font-semibold text-gray-900">{user?.name ?? "Bạn"} · Đánh giá của bạn</p>
                <time className="mt-1 block text-xs text-gray-500" dateTime={ownApprovedReview.created_at}>{new Date(ownApprovedReview.created_at).toLocaleDateString("vi-VN")}</time>
                <p className="mt-2 text-amber-500" aria-label={`${ownApprovedReview.rating} trên 5 sao`}>{"★".repeat(ownApprovedReview.rating)}{"☆".repeat(5 - ownApprovedReview.rating)}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">{ownApprovedReview.comment}</p>
                <ReviewPhotoGrid images={ownApprovedReview.images ?? []} />
              </article>
            ) : null}
            {data?.reviews
              .filter(
                (review) => review.review_id !== ownApprovedReview?.review_id,
              )
              .map((review: PlaceReview) => (
                <article
                  key={review.review_id}
                  className="rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50/80 p-4 shadow-sm transition hover:border-teal-100"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-gray-900">
                      {review.reviewer_name}
                    </p>
                    <time
                      className="text-xs text-gray-500"
                      dateTime={review.created_at}
                    >
                      {new Date(review.created_at).toLocaleDateString("vi-VN")}
                    </time>
                  </div>
                  <p
                    className="mt-1 text-sm text-amber-500"
                    aria-label={`${review.rating} trên 5 sao`}
                  >
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </p>
                  {review.comment ? (
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                      {review.comment}
                    </p>
                  ) : null}
                  <ReviewPhotoGrid images={review.images ?? []} />
                </article>
              ))}
          </div>
          {data && data.pagination.total_pages > 1 ? (
            <div className="mt-5 flex items-center gap-3">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((value) => value - 1)}
                className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40"
              >
                Trước
              </button>
              <span className="text-sm text-gray-500">
                Trang {page}/{data.pagination.total_pages}
              </span>
              <button
                type="button"
                disabled={page >= data.pagination.total_pages || loading}
                onClick={() => setPage((value) => value + 1)}
                className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40"
              >
                Tiếp
              </button>
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-slate-100 bg-gradient-to-b from-slate-50 to-white p-5 shadow-sm sm:p-6">
          <h3 className="font-semibold text-gray-900">Viết đánh giá</h3>
          {!authLoading && user?.role === "USER" ? (
            <p className="mt-1 text-xs leading-5 text-gray-500">
              Bạn có thể gửi nhiều đánh giá, kể cả cho cùng địa điểm. Mỗi địa
              điểm cần cách nhau đúng 7 ngày giữa các lần gửi.
            </p>
          ) : null}
          {notice ? (
            <p
              role="status"
              className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
            >
              {notice}
            </p>
          ) : null}
          {error ? (
            <p
              role="alert"
              className="mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </p>
          ) : null}
          {authLoading ? (
            <p className="mt-3 text-sm text-gray-500">
              Đang kiểm tra đăng nhập...
            </p>
          ) : null}
          {!authLoading && !user ? (
            <Link
              href={`/dang-nhap?redirect=${encodeURIComponent(`/places/${placeId}#danh-gia`)}`}
              className="mt-4 inline-flex rounded-xl bg-[#0f2942] px-4 py-3 text-sm font-semibold text-white hover:bg-[#1a3f5c]"
            >
              Đăng nhập để đánh giá
            </Link>
          ) : null}
          {!authLoading && user && user.role !== "USER" ? (
            <p className="mt-3 text-sm text-gray-500">
              Chỉ tài khoản khách du lịch mới có thể gửi đánh giá.
            </p>
          ) : null}
          {!authLoading && user?.role === "USER" && myReview && myReview.status !== "APPROVED" ? (
            <article className="mt-4 rounded-2xl border border-teal-100 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-gray-700">{myReview.status === "PENDING" ? "Đang chờ duyệt" : "Đang ẩn"}</p>
              <p className="mt-2 text-amber-500">{"★".repeat(myReview.rating)}{"☆".repeat(5 - myReview.rating)}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">{myReview.comment}</p>
              <ReviewPhotoGrid images={myReview.images ?? []} />
              {waiting ? (
                <p className="mt-3 text-xs text-amber-700">
                  Có thể gửi đánh giá tiếp theo sau{" "}
                  <time dateTime={new Date(nextReviewAt).toISOString()}>
                    {new Date(nextReviewAt).toLocaleString("vi-VN")}
                  </time>.
                </p>
              ) : null}
            </article>
          ) : !authLoading && user?.role === "USER" && waiting && !loadError ? (
            <p role="status" className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-900">
              Bạn cần chờ đủ 7 ngày kể từ lần đánh giá trước. Có thể đánh giá lại sau{" "}
              <time dateTime={new Date(nextReviewAt).toISOString()}>
                {new Date(nextReviewAt).toLocaleString("vi-VN")}
              </time>.
            </p>
          ) : !authLoading && user?.role === "USER" && !loading && !loadError ? (
            <form onSubmit={submit} className="mt-4 space-y-4">
              <fieldset>
                <legend className="mb-2 text-sm text-gray-600">Số sao</legend>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <label
                      key={value}
                      className="cursor-pointer rounded p-1 focus-within:outline focus-within:outline-2 focus-within:outline-amber-500"
                    >
                      <input
                        type="radio"
                        name="rating"
                        value={value}
                        checked={rating === value}
                        onChange={() => setRating(value)}
                        className="sr-only"
                        aria-label={`${value} sao`}
                      />
                      <Star
                        size={26}
                        aria-hidden="true"
                        className={
                          value <= rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-gray-300"
                        }
                      />
                    </label>
                  ))}
                </div>
              </fieldset>
              <div>
                <label
                  className="mb-2 block text-sm text-gray-600"
                  htmlFor="review-comment"
                >
                  Nội dung đánh giá
                </label>
                <textarea
                  id="review-comment"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  maxLength={1000}
                  rows={4}
                  required
                  className="w-full resize-y rounded-xl border border-gray-200 bg-white p-3 text-sm outline-none focus:border-teal-500"
                  placeholder="Chia sẻ trải nghiệm của bạn..."
                />
                <p className="text-right text-xs text-gray-400">
                  {comment.length}/1000
                </p>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:border-teal-300 hover:bg-teal-50">
                    <ImagePlus size={17} aria-hidden="true" /> Chọn ảnh
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      multiple
                      disabled={submitting || selectedImages.length >= 5}
                      onChange={chooseImages}
                      className="sr-only"
                    />
                  </label>
                  <span className="text-xs text-gray-500">
                    Tối đa 5 ảnh, mỗi ảnh không quá 5 MB
                  </span>
                </div>
                {selectedImages.length ? (
                  <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {selectedImages.map(({ file, url }) => (
                      <div
                        key={url}
                        className="relative aspect-square overflow-hidden rounded-xl bg-slate-100"
                      >
                        <Image
                          src={url}
                          alt={`Ảnh xem trước: ${file.name}`}
                          fill
                          unoptimized
                          sizes="(max-width: 640px) 33vw, 120px"
                          className="object-cover"
                        />
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => removeSelectedImage(url)}
                          aria-label={`Bỏ ảnh ${file.name}`}
                          className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white hover:bg-black"
                        >
                          <X size={14} aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
              >
                {submitting ? "Đang gửi..." : "Gửi đánh giá"}
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </section>
  );
}
