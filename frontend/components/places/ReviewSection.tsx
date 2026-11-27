"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, Star, X } from "lucide-react";
import ReviewPhotoGrid from "./ReviewPhotoGrid";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api/client";
import SurveyInviteAfterReview from "@/components/survey/SurveyInviteAfterReview";
import SurveyQuickSheet from "@/components/survey/SurveyQuickSheet";
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
  onSummaryChange,
}: {
  placeId: string;
  placeName: string;
  imageUrl?: string;
  onSummaryChange?: (summary: { avg_rating: number; review_count: number }) => void;
}) {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<PlaceReviewsResponse | null>(null);
  const [page, setPage] = useState(1);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [surveySheetOpen, setSurveySheetOpen] = useState(false);
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
      onSummaryChange?.({
        avg_rating: placeReviews.avg_rating,
        review_count: placeReviews.review_count,
      });
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
  }, [placeId, page, user?.id, user?.role, onSummaryChange]);

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
        ).message ?? "Đánh giá đã được đăng.",
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
      className="mb-8 rounded-[16px] border border-[#E5DAC8] bg-[#FFFDF9] p-6 sm:p-8 shadow-[0_14px_38px_rgba(16,40,50,0.05)]"
    >
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#E8DDCF] pb-6">
        <div className="flex min-w-0 items-center gap-4">
          {imageUrl ? (
            <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-[10px] border border-[#E5DAC8] bg-[#091E27] sm:h-20 sm:w-28">
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
            <div className="relative flex h-16 w-20 shrink-0 items-center justify-center rounded-[10px] bg-[#F6EFE2] text-[#738086] sm:h-20 sm:w-28">
              <span className="text-xs">Không có ảnh</span>
            </div>
          )}
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[#216B70] mb-1">
              Trải nghiệm thực tế
            </p>
            <h2 className="home-serif text-2xl sm:text-[26px] font-semibold text-[#102832]">
              Đánh giá
            </h2>
            <p className="mt-0.5 text-xs sm:text-sm text-[#4F5D63]">
              Chia sẻ cảm nhận tại{" "}
              <span className="font-semibold text-[#102832]">{placeName}</span>.
            </p>
          </div>
        </div>
        <div
          className="inline-flex items-center gap-2 rounded-full bg-[#F7F2E8] border border-[#E5DAC8] px-4 py-2"
          aria-label={`Điểm trung bình ${Number(data?.avg_rating ?? 0).toFixed(1)} trên 5`}
        >
          <Star size={19} className="fill-[#E87B39] text-[#E87B39]" />
          <span className="home-serif text-2xl font-semibold text-[#102832]">
            {Number(data?.avg_rating ?? 0).toFixed(1)}
          </span>
          <span className="text-xs sm:text-sm text-[#4F5D63]">
            ({data?.review_count ?? 0} đánh giá)
          </span>
        </div>
      </div>

      <div className="grid gap-6 pt-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
        <div>
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#216B70]">
            Nhận xét từ du khách
          </h3>
          {loading ? (
            <p className="text-sm text-[#738086]">Đang tải đánh giá...</p>
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
            <p className="text-sm text-[#738086]">
              Chưa có đánh giá nào.
            </p>
          ) : null}
          <div className="space-y-3.5">
            {ownApprovedReview ? (
              <article className="rounded-[12px] border border-[#C9B580] bg-[#F7F2E8] p-4 sm:p-5">
                <p className="font-semibold text-[#102832]">{user?.name ?? "Bạn"} · Đánh giá của bạn</p>
                <time className="mt-1 block text-xs text-[#738086]" dateTime={ownApprovedReview.created_at}>{new Date(ownApprovedReview.created_at).toLocaleDateString("vi-VN")}</time>
                <p className="mt-2 text-[#E87B39]" aria-label={`${ownApprovedReview.rating} trên 5 sao`}>{"★".repeat(ownApprovedReview.rating)}{"☆".repeat(5 - ownApprovedReview.rating)}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#202B30]">{ownApprovedReview.comment}</p>
                <ReviewPhotoGrid images={ownApprovedReview.images ?? []} />
                {ownApprovedReview.partner_reply && <div className="mt-3 rounded-[8px] border-l-2 border-[#216B70] bg-white p-3 text-sm"><p className="font-semibold text-[#216B70]">Phản hồi từ cơ sở</p><p className="mt-1 whitespace-pre-wrap">{ownApprovedReview.partner_reply}</p></div>}
              </article>
            ) : null}
            {data?.reviews
              .filter(
                (review) => review.review_id !== ownApprovedReview?.review_id,
              )
              .map((review: PlaceReview) => (
                <article
                  key={review.review_id}
                  className="rounded-[12px] border border-[#E5DAC8] bg-[#F7F2E8]/65 p-4 sm:p-5 transition-colors hover:border-[#C9B580]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-full bg-[#091E27] text-[#E6D9B7] text-xs font-semibold flex items-center justify-center shrink-0">
                        {(review.reviewer_name || "K").trim().charAt(0).toUpperCase()}
                      </span>
                      <p className="font-semibold text-sm text-[#102832]">
                        {review.reviewer_name}
                      </p>
                    </div>
                    <time
                      className="text-xs text-[#6E7D82]"
                      dateTime={review.created_at}
                    >
                      {new Date(review.created_at).toLocaleDateString("vi-VN")}
                    </time>
                  </div>
                  <p
                    className="mt-2 text-sm text-[#E87B39] tracking-wide"
                    aria-label={`${review.rating} trên 5 sao`}
                  >
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </p>
                  {review.comment ? (
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#2C3B40]">
                      {review.comment}
                    </p>
                  ) : null}
                  <ReviewPhotoGrid images={review.images ?? []} />
                  {review.partner_reply && <div className="mt-3 rounded-[8px] border-l-2 border-[#216B70] bg-[#FFFDF9] p-3 text-sm"><p className="font-semibold text-[#216B70]">Phản hồi từ cơ sở</p><p className="mt-1 whitespace-pre-wrap text-[#202B30]">{review.partner_reply}</p></div>}
                </article>
              ))}
          </div>
          {data && data.pagination.total_pages > 1 ? (
            <div className="mt-5 flex items-center gap-3">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((value) => value - 1)}
                className="rounded-full border border-[#E5DAC8] bg-white px-4 py-1.5 text-xs font-semibold text-[#102832] hover:border-[#C9B580] disabled:opacity-40 cursor-pointer"
              >
                Trước
              </button>
              <span className="text-xs font-medium text-[#4F5D63]">
                Trang {page}/{data.pagination.total_pages}
              </span>
              <button
                type="button"
                disabled={page >= data.pagination.total_pages || loading}
                onClick={() => setPage((value) => value + 1)}
                className="rounded-full border border-[#E5DAC8] bg-white px-4 py-1.5 text-xs font-semibold text-[#102832] hover:border-[#C9B580] disabled:opacity-40 cursor-pointer"
              >
                Tiếp
              </button>
            </div>
          ) : null}
        </div>

        <div className="rounded-[14px] border border-[#E5DAC8] bg-[#F7F2E8]/80 p-5 sm:p-6 self-start">
          <h3 className="home-serif text-lg font-semibold text-[#102832]">Viết đánh giá</h3>
          {!authLoading && user?.role === "USER" ? (
            <p className="mt-1 text-xs leading-5 text-[#4F5D63]">
              Bạn có thể gửi nhiều đánh giá, kể cả cho cùng địa điểm. Mỗi địa
              điểm cần cách nhau đúng 7 ngày giữa các lần gửi.
            </p>
          ) : null}
          {notice ? (
            <>
              <p
                role="status"
                className="mt-3 rounded-[8px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
              >
                {notice}
              </p>
              <SurveyInviteAfterReview
                placeName={placeName}
                onOpenQuickSheet={() => setSurveySheetOpen(true)}
              />
            </>
          ) : null}
          {error ? (
            <p
              role="alert"
              className="mt-3 rounded-[8px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </p>
          ) : null}
          {authLoading ? (
            <p className="mt-3 text-sm text-[#738086]">
              Đang kiểm tra đăng nhập...
            </p>
          ) : null}
          {!authLoading && !user ? (
            <div className="mt-4 space-y-3">
              <p className="text-xs leading-relaxed text-[#4F5D63]">
                Đăng nhập tài khoản du khách để chia sẻ cảm nhận và đính kèm hình ảnh thực tế.
              </p>
              <Link
                href={`/dang-nhap?redirect=${encodeURIComponent(`/places/${placeId}#danh-gia`)}`}
                className="inline-flex w-full items-center justify-center rounded-full bg-[#091E27] px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#FFFDF5] hover:bg-[#216B70] transition-colors"
              >
                Đăng nhập để đánh giá
              </Link>
            </div>
          ) : null}
          {!authLoading && user && user.role !== "USER" ? (
            <p className="mt-3 text-sm text-[#4F5D63]">
              Chỉ tài khoản khách du lịch mới có thể gửi đánh giá.
            </p>
          ) : null}
          {!authLoading && user?.role === "USER" && myReview && myReview.status !== "APPROVED" ? (
            <article className="mt-4 rounded-[4px] border border-[#DEDAD2] bg-white p-4">
              <p className="text-sm font-semibold text-[#102832]">{myReview.status === "PENDING" ? "Đánh giá cũ chưa được chuyển trạng thái" : "Đang ẩn"}</p>
              <p className="mt-2 text-[#E87B39]">{"★".repeat(myReview.rating)}{"☆".repeat(5 - myReview.rating)}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#202B30]">{myReview.comment}</p>
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
          ) : null}
          {!authLoading && user?.role === "USER" && waiting && !loadError && !(myReview && myReview.status !== "APPROVED") ? (
            <p role="status" className="mt-4 rounded-[2px] border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              Bạn cần chờ đủ 7 ngày kể từ lần đánh giá trước. Có thể đánh giá lại sau{" "}
              <time dateTime={new Date(nextReviewAt).toISOString()}>
                {new Date(nextReviewAt).toLocaleString("vi-VN")}
              </time>.
            </p>
          ) : null}
          {!authLoading && user?.role === "USER" && !waiting && !loading && !loadError ? (
            <form onSubmit={submit} className="mt-4 space-y-4">
              <fieldset>
                <legend className="mb-2 text-sm text-[#4F5D63]">Số sao</legend>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <label
                      key={value}
                      className="cursor-pointer rounded p-1 focus-within:outline focus-within:outline-2 focus-within:outline-[#E87B39]"
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
                            ? "fill-[#E87B39] text-[#E87B39]"
                            : "text-[#DEDAD2]"
                        }
                      />
                    </label>
                  ))}
                </div>
              </fieldset>
              <div>
                <label
                  className="mb-2 block text-sm text-[#4F5D63]"
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
                  className="w-full resize-y rounded-[2px] border border-[#DEDAD2] bg-white p-3 text-sm outline-none focus:border-[#216B70]"
                  placeholder="Chia sẻ trải nghiệm của bạn..."
                />
                <p className="text-right text-xs text-[#738086]">
                  {comment.length}/1000
                </p>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-[2px] border border-[#DEDAD2] bg-white px-3 py-2 text-sm font-medium text-[#102832] hover:border-[#216B70] hover:bg-[#F1EFE7]">
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
                  <span className="text-xs text-[#738086]">
                    Tối đa 5 ảnh, mỗi ảnh không quá 5 MB
                  </span>
                </div>
                {selectedImages.length ? (
                  <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {selectedImages.map(({ file, url }) => (
                      <div
                        key={url}
                        className="relative aspect-square overflow-hidden rounded-[2px] bg-[#E7E2D6]"
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
                className="w-full rounded-full bg-[#091E27] px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#FFFDF5] hover:bg-[#216B70] transition-colors disabled:opacity-60 cursor-pointer"
              >
                {submitting ? "Đang gửi..." : "Gửi đánh giá"}
              </button>
            </form>
          ) : null}
        </div>
      </div>

      <SurveyQuickSheet
        isOpen={surveySheetOpen}
        onClose={() => setSurveySheetOpen(false)}
      />
    </section>
  );
}
