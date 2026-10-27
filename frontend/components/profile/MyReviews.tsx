"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ReviewPhotoGrid from "@/components/places/ReviewPhotoGrid";
import { getMyReviews, type MyReview } from "@/lib/api/reviews";

const statusLabel = {
  PENDING: "Đang chờ duyệt",
  APPROVED: "Đã duyệt",
  HIDDEN: "Đang ẩn",
};

export default function MyReviews() {
  const [reviews, setReviews] = useState<MyReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function reload() {
    setLoading(true);
    try {
      setReviews(await getMyReviews());
      setError("");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Không thể tải đánh giá.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void reload(); }, []);

  if (loading) return <p className="py-10 text-center text-gray-500">Đang tải đánh giá...</p>;
  if (error) return (
    <p role="alert" className="py-10 text-center text-red-600">
      {error} <button onClick={() => void reload()} className="underline">Thử lại</button>
    </p>
  );
  if (!reviews.length) return <p className="py-10 text-center text-gray-500">Bạn chưa có đánh giá nào.</p>;

  return (
    <div className="space-y-5">
      {reviews.map((review) => (
        <article key={review.review_id} className="rounded-xl border border-gray-100 p-4">
          <Link href={`/places/${review.place_id}#danh-gia`} className="font-semibold text-teal-700 hover:underline">
            {review.place_name}
          </Link>
          <p className="mt-1 text-sm text-gray-500">
            {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)} · {statusLabel[review.status]}
          </p>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-700">{review.comment}</p>
          <ReviewPhotoGrid images={review.images ?? []} />
        </article>
      ))}
    </div>
  );
}
