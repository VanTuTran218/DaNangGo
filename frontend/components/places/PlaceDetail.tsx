"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  getPlace,
  type PlaceDetail as PlaceDetailData,
} from "@/lib/api/places";
import ReviewSection from "./ReviewSection";
import RouteDirectionsModal from "./RouteDirectionsModal";
import {
  MapPin,
  Navigation,
  ExternalLink,
  Clock,
  Bed,
  Users,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

const ACCOMMODATION_TYPE_LABEL: Record<string, string> = {
  HOTEL: "Khách sạn",
  HOMESTAY: "Homestay",
  RESORT: "Khu nghỉ dưỡng (Resort)",
  HOSTEL: "Nhà nghỉ tập thể (Hostel)",
  APARTMENT: "Căn hộ (Apartment)",
};

const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(n);

export default function PlaceDetail({ id }: { id: string }) {
  const [place, setPlace] = useState<PlaceDetailData | null>(null);
  const [error, setError] = useState("");
  const [isDirectionsOpen, setIsDirectionsOpen] = useState(false);

  useEffect(() => {
    getPlace(id)
      .then(setPlace)
      .catch((loadError: unknown) =>
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Không thể tải địa điểm.",
        ),
      );
  }, [id]);

  if (error) {
    return (
      <section className="mx-auto max-w-5xl px-5 py-16 text-center">
        <p role="alert" className="text-gray-700">
          {error}
        </p>
        <Link
          href="/places"
          className="mt-5 inline-block text-teal-700 underline"
        >
          Quay lại danh sách địa điểm
        </Link>
      </section>
    );
  }
  if (!place) {
    return (
      <p className="mx-auto max-w-5xl px-5 py-16 text-center text-gray-500">
        Đang tải địa điểm...
      </p>
    );
  }

  const fallbackPhotos = [
    "photo-1500530855697-b586d89ba3ee",
    "photo-1519046904884-53103b34b206",
    "photo-1501785888041-af3ef285b470",
    "photo-1470770841072-f978cf4d019e",
    "photo-1518837695005-2083093ee35b",
    "photo-1464822759023-fed622ff2c3b",
  ];
  const imageUrl =
    place.cover_image ||
    place.image_url ||
    `https://images.unsplash.com/${fallbackPhotos[Math.abs(place.place_id) % fallbackPhotos.length]}?auto=format&fit=crop&w=1600&q=85`;

  const isAccommodation = place.place_type === "ACCOMMODATION";

  return (
    <section className="mx-auto max-w-5xl px-5 pb-16 pt-28">
      <div className="flex items-center justify-between">
        <Link
          href="/places"
          className="text-sm font-medium text-teal-700 hover:underline"
        >
          ← Tất cả địa điểm
        </Link>
        <button
          type="button"
          onClick={() => setIsDirectionsOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-teal-50 px-3.5 py-1.5 text-xs font-semibold text-teal-700 transition hover:bg-teal-100 shadow-xs cursor-pointer"
        >
          <Navigation className="h-3.5 w-3.5" />
          Chỉ đường đến đây
        </button>
      </div>

      <article className="mt-5 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        <div className="relative h-64 bg-slate-200 sm:h-80">
          <Image
            src={imageUrl}
            alt={`Hình ảnh ${place.name}`}
            fill
            unoptimized
            priority
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f2942]/85 via-[#0f2942]/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-9">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-teal-500/80 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                {isAccommodation && place.accommodation_type
                  ? ACCOMMODATION_TYPE_LABEL[place.accommodation_type] ||
                    place.accommodation_type
                  : place.place_type}
              </span>
              {isAccommodation && place.star_rating ? (
                <span className="rounded-full bg-amber-400/90 px-2.5 py-0.5 text-xs font-bold text-gray-900">
                  {"★".repeat(place.star_rating)} ({place.star_rating} sao)
                </span>
              ) : null}
            </div>

            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
              {place.name}
            </h1>
            {place.address ? (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-white/90">
                <MapPin className="h-4 w-4 shrink-0 text-teal-300" />
                {place.address}
                {place.district_name ? `, ${place.district_name}` : ""}
              </p>
            ) : null}
          </div>
        </div>

        <div className="p-6 sm:p-9">
          {/* Thông tin nhanh: Đánh giá, Giờ checkin/out, Đặt chỗ */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
              ★ {Number(place.avg_rating).toFixed(1)}{" "}
              <span className="font-normal text-gray-600">
                ({place.review_count} đánh giá)
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {isAccommodation &&
              (place.check_in_time || place.check_out_time) ? (
                <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-xl">
                  <Clock className="h-4 w-4 text-teal-600" />
                  <span>
                    Nhận phòng: <b>{place.check_in_time || "14:00"}</b>
                  </span>
                  <span className="text-gray-300">|</span>
                  <span>
                    Trả phòng: <b>{place.check_out_time || "12:00"}</b>
                  </span>
                </div>
              ) : null}

              {place.booking_url ? (
                <a
                  href={place.booking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600"
                >
                  <ExternalLink className="h-4 w-4" />
                  Đặt chỗ ngay
                </a>
              ) : null}
            </div>
          </div>

          {/* Mô tả */}
          {place.description ? (
            <div className="mt-6">
              <h2 className="text-lg font-bold text-gray-900">Giới thiệu</h2>
              <p className="mt-2 whitespace-pre-wrap leading-7 text-gray-700">
                {place.description}
              </p>
            </div>
          ) : null}

          {/* Tiện nghi cơ sở lưu trú */}
          {isAccommodation && place.amenities && place.amenities.length > 0 ? (
            <div className="mt-8 border-t border-gray-100 pt-6">
              <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                <Sparkles className="h-5 w-5 text-teal-600" />
                Tiện nghi nổi bật
              </h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {place.amenities.map((amenity) => (
                  <div
                    key={amenity.amenity_id}
                    className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-sm font-medium text-gray-700 border border-slate-100"
                  >
                    <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                    <span>{amenity.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Danh sách loại phòng */}
          {isAccommodation && place.rooms && place.rooms.length > 0 ? (
            <div className="mt-8 border-t border-gray-100 pt-6">
              <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                <Bed className="h-5 w-5 text-teal-600" />
                Bảng giá và các loại phòng
              </h2>
              <div className="mt-4 space-y-3">
                {place.rooms.map((room) => (
                  <div
                    key={room.room_type_id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-teal-200 hover:shadow-md"
                  >
                    <div>
                      <h3 className="text-base font-bold text-gray-900">
                        {room.name}
                      </h3>
                      <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-gray-400" />
                          Tối đa: {room.capacity} khách
                        </span>
                        <span>•</span>
                        <span>Số phòng: {room.room_count}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-50">
                      <div className="text-right">
                        {room.original_price &&
                        room.original_price > room.price_per_night ? (
                          <p className="text-xs text-gray-400 line-through">
                            {fmt(room.original_price)}đ
                          </p>
                        ) : null}
                        <p className="text-lg font-extrabold text-teal-700">
                          {fmt(room.price_per_night)}đ
                          <span className="text-xs font-normal text-gray-500">
                            {" "}
                            / đêm
                          </span>
                        </p>
                      </div>

                      {place.booking_url ? (
                        <a
                          href={place.booking_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-teal-700"
                        >
                          Chọn phòng
                        </a>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </article>

      {/* Đánh giá */}
      <ReviewSection placeId={id} placeName={place.name} imageUrl={imageUrl} />

      {/* Modal chỉ đường & so sánh 5 phương tiện */}
      <RouteDirectionsModal
        isOpen={isDirectionsOpen}
        onClose={() => setIsDirectionsOpen(false)}
        destination={{
          place_id: place.place_id,
          name: place.name,
          address: place.address,
          latitude: place.latitude,
          longitude: place.longitude,
        }}
      />
    </section>
  );
}
