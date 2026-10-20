"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, Pencil, Star, Trash2, X } from "lucide-react";
import ReviewPhotoGrid from "./ReviewPhotoGrid";
import ReviewImageEditor, {
  type PendingReviewImage,
} from "./ReviewImageEditor";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api/client";
import {
  createPlaceReviewWithImages,
  deletePlaceReview,
  getMyReviews,
  getPlaceReviews,
  type MyReview,
  type PlaceReview,
  type PlaceReviewsResponse,
  updatePlaceReview,
} from "@/lib/api/reviews";

type SelectedReviewImage = { file: File; url: string };

export default function ReviewSection({
  placeId,
  placeName,
  imageUrl,
}: {
  placeId: string;
  placeName: string;
  imageUrl: string;
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
  const [editingOwnReview, setEditingOwnReview] = useState(false);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState("");
  const [editImages, setEditImages] = useState<MyReview["images"]>([]);
  const [editSelectedImages, setEditSelectedImages] = useState<
    PendingReviewImage[]
  >([]);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingReview, setDeletingReview] = useState(false);
  const [confirmDeleteReview, setConfirmDeleteReview] = useState(false);
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
      const [placeReviews, myReviews] = await Promise.all([
        getPlaceReviews(placeId, page),
        user?.role === "USER" ? getMyReviews() : Promise.resolve([]),
      ]);
      setData(placeReviews);
      const ownReview =
        myReviews.find((review) => String(review.place_id) === placeId) ?? null;
      setMyReview(ownReview);
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

  function startEditOwnReview() {
    if (!myReview) return;
    setEditRating(myReview.rating);
    setEditComment(myReview.comment ?? "");
    setEditImages(myReview.images ?? []);
    clearEditSelectedImages();
    setEditingOwnReview(true);
    setError("");
  }

  function clearEditSelectedImages() {
    for (const { url } of editSelectedImages) {
      URL.revokeObjectURL(url);
      imageUrls.current.delete(url);
    }
    setEditSelectedImages([]);
  }

  function cancelEdit() {
    clearEditSelectedImages();
    setEditingOwnReview(false);
  }

  function addEditImages(files: File[]) {
    const accepted: PendingReviewImage[] = [];
    let message = "";
    for (const file of files) {
      if (
        editImages.length + editSelectedImages.length + accepted.length >=
        5
      ) {
        message = "Mỗi đánh giá chỉ được đính kèm tối đa 5 ảnh.";
        break;
      }
      if (file.size > 5 * 1024 * 1024) {
        message = `${file.name}: dung lượng ảnh không được vượt quá 5 MB.`;
        continue;
      }
      const extension = file.name.split(".").pop()?.toLowerCase();
      const mimeByExtension: Record<string, string> = {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        webp: "image/webp",
      };
      if (
        !extension ||
        !mimeByExtension[extension] ||
        (file.type && file.type !== mimeByExtension[extension])
      ) {
        message = `${file.name}: chỉ chấp nhận ảnh JPG, PNG hoặc WEBP.`;
        continue;
      }
      const url = URL.createObjectURL(file);
      imageUrls.current.add(url);
      accepted.push({ file, url });
    }
    if (accepted.length)
      setEditSelectedImages((current) => [...current, ...accepted]);
    setError(message);
  }

  function removeEditImage(imageId: number) {
    setEditImages((current) =>
      current.filter((image) => image.image_id !== imageId),
    );
  }

  function removeEditSelectedImage(url: string) {
    URL.revokeObjectURL(url);
    imageUrls.current.delete(url);
    setEditSelectedImages((current) =>
      current.filter((image) => image.url !== url),
    );
  }

  async function saveOwnReview() {
    if (!myReview || !editRating || !editComment.trim()) {
      setError("Vui lòng chọn số sao và nhập nội dung đánh giá.");
      return;
    }
    setSavingEdit(true);
    setError("");
    try {
      const keptIds = editImages.map((image) => image.image_id);
      const originalIds = (myReview.images ?? []).map(
        (image) => image.image_id,
      );
      const imagesChanged =
        editSelectedImages.length > 0 ||
        keptIds.length !== originalIds.length ||
        keptIds.some((imageId, index) => imageId !== originalIds[index]);
      // Giữ request JSON tương thích khi người dùng chỉ sửa sao hoặc nội dung.
      await updatePlaceReview(
        myReview.review_id,
        editRating,
        editComment.trim(),
        imagesChanged ? keptIds : undefined,
        editSelectedImages.map((image) => image.file),
      );
      setEditingOwnReview(false);
      clearEditSelectedImages();
      setNotice("Đánh giá đã cập nhật và đang chờ admin duyệt lại.");
      await loadReviews();
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Không thể cập nhật đánh giá.",
      );
    } finally {
      setSavingEdit(false);
    }
  }

  async function removeOwnReview() {
    if (!myReview || deletingReview) return;
    setDeletingReview(true);
    setError("");
    try {
      await deletePlaceReview(myReview.review_id);
      setConfirmDeleteReview(false);
      setNotice("Đã xóa đánh giá của bạn.");
      setEditingOwnReview(false);
      await loadReviews();
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Không thể xóa đánh giá.",
      );
      setConfirmDeleteReview(false);
    } finally {
      setDeletingReview(false);
    }
  }

  return (
    <section
      id="danh-gia"
      className="mt-10 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-gray-100 pb-6">
        <div className="flex min-w-0 items-center gap-4">
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
              <article
                key={ownApprovedReview.review_id}
                className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50/50 to-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-gray-900">
                        {user?.name ?? "Bạn"}
                      </p>
                      <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[11px] font-semibold text-teal-800">
                        Đánh giá của bạn
                      </span>
                    </div>
                    <time
                      className="mt-1 block text-xs text-gray-500"
                      dateTime={ownApprovedReview.created_at}
                    >
                      {new Date(
                        ownApprovedReview.created_at,
                      ).toLocaleDateString("vi-VN")}
                    </time>
                  </div>
                  {!editingOwnReview ? (
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={startEditOwnReview}
                        title="Sửa đánh giá"
                        aria-label="Sửa đánh giá"
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-white hover:text-teal-700"
                      >
                        <Pencil size={15} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        disabled={deletingReview}
                        onClick={() => setConfirmDeleteReview(true)}
                        title="Xóa đánh giá"
                        aria-label="Xóa đánh giá"
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      >
                        <Trash2 size={15} aria-hidden="true" />
                      </button>
                    </div>
                  ) : null}
                </div>
                {editingOwnReview ? (
                  <div className="mt-3 space-y-3">
                    <fieldset>
                      <legend className="mb-2 text-sm text-gray-600">
                        Chỉnh số sao
                      </legend>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <label
                            key={value}
                            className="cursor-pointer rounded p-1 focus-within:outline focus-within:outline-2 focus-within:outline-amber-500"
                          >
                            <input
                              type="radio"
                              name="edit-review-rating"
                              value={value}
                              checked={editRating === value}
                              onChange={() => setEditRating(value)}
                              className="sr-only"
                              aria-label={`${value} sao`}
                            />
                            <Star
                              size={24}
                              aria-hidden="true"
                              className={
                                value <= editRating
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
                        htmlFor="edit-approved-review-comment"
                        className="mb-2 block text-sm text-gray-600"
                      >
                        Nội dung đánh giá
                      </label>
                      <textarea
                        id="edit-approved-review-comment"
                        value={editComment}
                        onChange={(event) => setEditComment(event.target.value)}
                        maxLength={1000}
                        rows={4}
                        className="w-full resize-y rounded-xl border border-gray-200 bg-white p-3 text-sm outline-none focus:border-teal-500"
                      />
                      <p className="text-right text-xs text-gray-400">
                        {editComment.length}/1000
                      </p>
                    </div>
                    <ReviewImageEditor
                      images={editImages}
                      selected={editSelectedImages}
                      disabled={savingEdit}
                      onSelect={addEditImages}
                      onRemoveExisting={removeEditImage}
                      onRemoveSelected={removeEditSelectedImage}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={savingEdit}
                        onClick={() => void saveOwnReview()}
                        className="rounded-lg bg-teal-600 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
                      >
                        {savingEdit ? "Đang lưu..." : "Lưu"}
                      </button>
                      <button
                        type="button"
                        disabled={savingEdit}
                        onClick={cancelEdit}
                        className="rounded-lg border px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p
                      className="mt-1 text-sm tracking-wide text-amber-500"
                      aria-label={`${ownApprovedReview.rating} trên 5 sao`}
                    >
                      {"★".repeat(ownApprovedReview.rating)}
                      {"☆".repeat(5 - ownApprovedReview.rating)}
                    </p>
                    {ownApprovedReview.comment ? (
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                        {ownApprovedReview.comment}
                      </p>
                    ) : null}
                    <ReviewPhotoGrid images={ownApprovedReview.images ?? []} />
                  </>
                )}
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
              điểm cần cách nhau 5 phút giữa các lần gửi.
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
          {!authLoading && user?.role === "USER" && ownApprovedReview ? (
            <p className="mt-4 rounded-xl border border-teal-100 bg-teal-50/70 p-3 text-sm leading-6 text-teal-900">
              Bạn đã đánh giá địa điểm này. Dùng các biểu tượng ở góc thẻ bên
              trái để sửa hoặc xóa đánh giá.
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
          {!authLoading &&
          user?.role === "USER" &&
          myReview &&
          myReview.status !== "APPROVED" ? (
            <article className="mt-4 rounded-2xl border border-teal-100 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${myReview.status === "PENDING" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}
                  >
                    {myReview.status === "PENDING"
                      ? "Đang chờ duyệt"
                      : "Đang ẩn"}
                  </span>
                  <p
                    className="mt-2 text-lg tracking-wide text-amber-500"
                    aria-label={`${myReview.rating} trên 5 sao`}
                  >
                    {"★".repeat(myReview.rating)}
                    {"☆".repeat(5 - myReview.rating)}
                  </p>
                </div>
                {!editingOwnReview ? (
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={startEditOwnReview}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-teal-300 hover:bg-teal-50"
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      disabled={deletingReview}
                      onClick={() => setConfirmDeleteReview(true)}
                      className="rounded-lg border border-red-100 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      Xóa
                    </button>
                  </div>
                ) : null}
              </div>
              {editingOwnReview ? (
                <div className="mt-4 space-y-3">
                  <fieldset>
                    <legend className="mb-2 text-sm text-gray-600">
                      Chỉnh số sao
                    </legend>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <label
                          key={value}
                          className="cursor-pointer rounded p-1 focus-within:outline focus-within:outline-2 focus-within:outline-amber-500"
                        >
                          <input
                            type="radio"
                            name="edit-review-rating"
                            value={value}
                            checked={editRating === value}
                            onChange={() => setEditRating(value)}
                            className="sr-only"
                            aria-label={`${value} sao`}
                          />
                          <Star
                            size={25}
                            aria-hidden="true"
                            className={
                              value <= editRating
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
                      htmlFor="edit-review-comment"
                      className="mb-2 block text-sm text-gray-600"
                    >
                      Nội dung đánh giá
                    </label>
                    <textarea
                      id="edit-review-comment"
                      value={editComment}
                      onChange={(event) => setEditComment(event.target.value)}
                      maxLength={1000}
                      rows={4}
                      className="w-full resize-y rounded-xl border border-gray-200 bg-white p-3 text-sm outline-none focus:border-teal-500"
                    />
                    <p className="text-right text-xs text-gray-400">
                      {editComment.length}/1000
                    </p>
                  </div>
                  <ReviewImageEditor
                    images={editImages}
                    selected={editSelectedImages}
                    disabled={savingEdit}
                    onSelect={addEditImages}
                    onRemoveExisting={removeEditImage}
                    onRemoveSelected={removeEditSelectedImage}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={savingEdit}
                      onClick={() => void saveOwnReview()}
                      className="flex-1 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
                    >
                      {savingEdit ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                    <button
                      type="button"
                      disabled={savingEdit}
                      onClick={cancelEdit}
                      className="rounded-xl border px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                    {myReview.comment}
                  </p>
                  <ReviewPhotoGrid images={myReview.images ?? []} />
                </>
              )}
            </article>
          ) : null}
          {!authLoading && user?.role === "USER" ? (
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
      <ConfirmDialog
        isOpen={confirmDeleteReview}
        onClose={() => {
          if (!deletingReview) setConfirmDeleteReview(false);
        }}
        onConfirm={removeOwnReview}
        title="Xóa đánh giá?"
        description="Đánh giá và ảnh đính kèm sẽ bị xóa vĩnh viễn. Bạn không thể hoàn tác thao tác này."
        confirmText="Xóa đánh giá"
        cancelText="Giữ lại"
        variant="danger"
        loading={deletingReview}
      />
    </section>
  );
}
