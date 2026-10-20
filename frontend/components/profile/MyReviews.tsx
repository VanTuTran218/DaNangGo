"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ReviewPhotoGrid from "@/components/places/ReviewPhotoGrid";
import ReviewImageEditor, {
  type PendingReviewImage,
} from "@/components/places/ReviewImageEditor";
import {
  deletePlaceReview,
  getMyReviews,
  type MyReview,
  updatePlaceReview,
} from "@/lib/api/reviews";

const statusLabel = {
  PENDING: "Đang chờ duyệt",
  APPROVED: "Đã duyệt",
  HIDDEN: "Đang ẩn",
};

export default function MyReviews() {
  const [reviews, setReviews] = useState<MyReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [keptImages, setKeptImages] = useState<MyReview["images"]>([]);
  const [newImages, setNewImages] = useState<PendingReviewImage[]>([]);
  const objectUrls = useRef(new Set<string>());

  useEffect(
    () => () => {
      for (const url of objectUrls.current) URL.revokeObjectURL(url);
    },
    [],
  );

  function clearNewImages() {
    for (const image of newImages) {
      URL.revokeObjectURL(image.url);
      objectUrls.current.delete(image.url);
    }
    setNewImages([]);
  }

  async function reload() {
    setLoading(true);
    try {
      setReviews(await getMyReviews());
      setError("");
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Không thể tải đánh giá.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  function startEdit(review: MyReview) {
    clearNewImages();
    setEditing(review.review_id);
    setRating(review.rating);
    setComment(review.comment ?? "");
    setKeptImages(review.images ?? []);
    setError("");
  }

  function addImages(files: File[]) {
    const accepted: PendingReviewImage[] = [];
    let message = "";
    for (const file of files) {
      if (keptImages.length + newImages.length + accepted.length >= 5) {
        message = "Mỗi đánh giá chỉ được đính kèm tối đa 5 ảnh.";
        break;
      }
      if (file.size > 5 * 1024 * 1024) {
        message = `${file.name}: dung lượng ảnh không được vượt quá 5 MB.`;
        continue;
      }
      const extension = file.name.split(".").pop()?.toLowerCase();
      const allowed: Record<string, string> = {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        webp: "image/webp",
      };
      if (
        !extension ||
        !allowed[extension] ||
        (file.type && file.type !== allowed[extension])
      ) {
        message = `${file.name}: chỉ chấp nhận ảnh JPG, PNG hoặc WEBP.`;
        continue;
      }
      const url = URL.createObjectURL(file);
      objectUrls.current.add(url);
      accepted.push({ file, url });
    }
    if (accepted.length) setNewImages((current) => [...current, ...accepted]);
    setError(message);
  }

  function removeNewImage(url: string) {
    URL.revokeObjectURL(url);
    objectUrls.current.delete(url);
    setNewImages((current) => current.filter((image) => image.url !== url));
  }

  async function save(reviewId: number) {
    if (!rating || !comment.trim()) {
      setError("Vui lòng chọn số sao và nhập nội dung đánh giá.");
      return;
    }
    setSaving(true);
    try {
      const review = reviews.find((item) => item.review_id === reviewId);
      const keptIds = keptImages.map((image) => image.image_id);
      const originalIds = (review?.images ?? []).map((image) => image.image_id);
      const imagesChanged =
        newImages.length > 0 ||
        keptIds.length !== originalIds.length ||
        keptIds.some((imageId, index) => imageId !== originalIds[index]);
      await updatePlaceReview(
        reviewId,
        rating,
        comment.trim(),
        imagesChanged ? keptIds : undefined,
        newImages.map((image) => image.file),
      );
      setEditing(null);
      clearNewImages();
      await reload();
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Không thể cập nhật đánh giá.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove(reviewId: number) {
    if (!window.confirm("Bạn có chắc muốn xóa đánh giá này?")) return;
    try {
      await deletePlaceReview(reviewId);
      await reload();
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Không thể xóa đánh giá.",
      );
    }
  }

  if (loading)
    return (
      <p className="py-10 text-center text-gray-500">Đang tải đánh giá...</p>
    );
  if (error && reviews.length === 0)
    return (
      <p role="alert" className="py-10 text-center text-red-600">
        {error}{" "}
        <button onClick={() => void reload()} className="underline">
          Thử lại
        </button>
      </p>
    );
  if (!reviews.length)
    return (
      <p className="py-10 text-center text-gray-500">
        Bạn chưa có đánh giá nào.
      </p>
    );

  return (
    <div className="space-y-5">
      {error ? (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : null}
      {reviews.map((review) => (
        <article
          key={review.review_id}
          className="rounded-xl border border-gray-100 p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Link
                href={`/places/${review.place_id}#danh-gia`}
                className="font-semibold text-teal-700 hover:underline"
              >
                {review.place_name}
              </Link>
              <p className="mt-1 text-sm text-gray-500">
                {"★".repeat(review.rating)}
                {"☆".repeat(5 - review.rating)} · {statusLabel[review.status]}
              </p>
            </div>
            {editing !== review.review_id ? (
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(review)}
                  className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
                >
                  Sửa
                </button>
                <button
                  onClick={() => void remove(review.review_id)}
                  className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
                >
                  Xóa
                </button>
              </div>
            ) : null}
          </div>
          {editing === review.review_id ? (
            <div className="mt-4 space-y-3">
              <fieldset>
                <legend className="mb-2 text-sm text-gray-600">Số sao</legend>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <label key={value} className="cursor-pointer">
                      <input
                        type="radio"
                        name={`rating-${review.review_id}`}
                        value={value}
                        checked={rating === value}
                        onChange={() => setRating(value)}
                        className="sr-only"
                        aria-label={`${value} sao`}
                      />
                      <span
                        aria-hidden="true"
                        className={
                          value <= rating
                            ? "text-2xl text-amber-400"
                            : "text-2xl text-gray-300"
                        }
                      >
                        ★
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                maxLength={1000}
                rows={4}
                className="w-full rounded-xl border border-gray-200 p-3 text-sm"
                aria-label="Nội dung đánh giá"
              />
              <ReviewImageEditor
                images={keptImages}
                selected={newImages}
                disabled={saving}
                onSelect={addImages}
                onRemoveExisting={(imageId) =>
                  setKeptImages((current) =>
                    current.filter((image) => image.image_id !== imageId),
                  )
                }
                onRemoveSelected={removeNewImage}
              />
              <div className="flex gap-2">
                <button
                  disabled={saving}
                  onClick={() => void save(review.review_id)}
                  className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {saving ? "Đang lưu..." : "Lưu"}
                </button>
                <button
                  disabled={saving}
                  onClick={() => {
                    clearNewImages();
                    setEditing(null);
                  }}
                  className="rounded-lg border px-4 py-2 text-sm"
                >
                  Hủy
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                {review.comment}
              </p>
              <ReviewPhotoGrid images={review.images ?? []} />
            </>
          )}
        </article>
      ))}
    </div>
  );
}
