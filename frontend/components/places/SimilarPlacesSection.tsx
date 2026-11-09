"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { similarPlaces } from "@/lib/api/ai";
import { useAiAction } from "@/hooks/useAiAction";
import type { ChatPlaceCard } from "@/types/chat";
function PlaceImage({ src, name }: { src?: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  const image = src?.startsWith("/uploads/")
    ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}${src}`
    : src;
  return (
    <img
      src={failed || !image ? "/images/place-placeholder.svg" : image}
      onError={() => setFailed(true)}
      alt={name}
      loading="lazy"
      className="h-36 w-full rounded-xl bg-teal-50 object-cover"
    />
  );
}
export default function SimilarPlacesSection({
  currentId,
}: {
  currentId: number;
}) {
  const action = useAiAction<{
    items: (ChatPlaceCard & { method: string; reason: string })[];
    method: string;
  }>();
  useEffect(() => {
    action.run((signal) => similarPlaces(currentId, signal));
    return action.clear;
  }, [currentId, action.run, action.clear]);
  return (
    <section className="mb-8 space-y-4 rounded-3xl border border-gray-100 bg-white p-6">
      <h3 className="text-lg font-bold text-[#0f2942]">
        Gợi ý địa điểm tương tự
      </h3>
      {action.loading && (
        <p role="status" className="text-sm text-slate-500">
          Đang tìm địa điểm công khai tương tự…
        </p>
      )}
      {action.error && (
        <p role="alert" className="text-sm text-red-700">
          {action.error}
          <button
            className="ml-2 underline"
            onClick={() =>
              action.run((signal) => similarPlaces(currentId, signal))
            }
          >
            Thử lại
          </button>
        </p>
      )}
      {action.data && !action.data.items.length && (
        <p className="text-sm text-slate-500">
          Chưa có địa điểm cùng loại để gợi ý.
        </p>
      )}
      <div className="flex gap-4 overflow-x-auto pb-2">
        {action.data?.items.map((place) => (
          <Link
            key={place.placeId}
            href={`/places/${place.placeId}`}
            className="w-64 shrink-0 space-y-2 rounded-2xl border bg-gray-50 p-3 hover:border-teal-300"
          >
            <PlaceImage src={place.imageUrl} name={place.name} />
            <h4 className="truncate text-sm font-bold">{place.name}</h4>
            <p className="text-xs text-slate-600">
              {place.districtName || "Đà Nẵng"} ·{" "}
              {place.reviewCount > 0
                ? `${place.rating} sao`
                : "Chưa có đánh giá"}
            </p>
            <p className="text-xs font-semibold text-teal-700">
              {place.priceText || "Chưa cập nhật giá"}
            </p>
            <p className="text-xs text-slate-500">{place.reason}</p>
          </Link>
        ))}
      </div>
      <Link
        className="inline-block text-xs font-semibold text-teal-700"
        href="/places"
      >
        Xem tất cả địa điểm →
      </Link>
    </section>
  );
}
