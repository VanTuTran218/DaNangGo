"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, MapPin, Search, Star } from "lucide-react";
import { getPlaces, getTopPlaces, type PlaceListItem, type PlaceType } from "@/lib/api/places";

const directoryModes: { value: PlaceType | ''; label: string }[] = [
  { value: '', label: 'Tất cả địa điểm' },
  { value: 'RESTAURANT', label: 'Top nhà hàng' },
  { value: 'ACCOMMODATION', label: 'Top lưu trú' },
  { value: 'ATTRACTION', label: 'Top điểm du lịch' },
];

export default function PlaceDirectory() {
  const [places, setPlaces] = useState<PlaceListItem[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [topType, setTopType] = useState<PlaceType | ''>('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setPlaces([]);
    const request = topType ? getTopPlaces(topType) : getPlaces({ limit: 50 }).then(res => res.items);
    request
      .then((items) => {
        if (!cancelled) setPlaces(items.filter(place => place.status === 'ACTIVE'));
      })
      .catch((loadError: unknown) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Không thể tải danh sách địa điểm.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [topType]);

  const filteredPlaces = useMemo(() => {
    const normalized = keyword.trim().toLocaleLowerCase("vi");
    if (!normalized) return places;
    return places.filter((place) =>
      `${place.name} ${place.address ?? ""} ${place.place_type}`
        .toLocaleLowerCase("vi")
        .includes(normalized),
    );
  }, [keyword, places]);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 pb-16 pt-28">
      <div className="mb-8 flex flex-col gap-6 rounded-3xl border border-teal-100 bg-gradient-to-br from-teal-50 via-white to-cyan-50 p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between sm:p-8">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">
            Khám phá Đà Nẵng
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#0f2942] sm:text-4xl">
            Tìm địa điểm, đọc đánh giá
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Chọn nơi bạn muốn đến và xem trải nghiệm từ cộng đồng.
          </p>
        </div>
        <label className="relative block w-full sm:max-w-sm">
          <Search
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Tìm địa điểm..."
            aria-label="Tìm địa điểm"
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
          />
        </label>
      </div>

      <div className="mb-6 flex flex-wrap gap-2" aria-label="Chọn danh sách địa điểm">
        {directoryModes.map(mode => (
          <button key={mode.value} type="button" aria-pressed={topType === mode.value}
            onClick={() => { setTopType(mode.value); setKeyword(''); }}
            className={`rounded-xl border px-4 py-2 text-sm font-semibold ${topType === mode.value ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-teal-500'}`}>
            {mode.label}
          </button>
        ))}
      </div>
      {topType ? <p className="mb-6 text-sm text-slate-600">Top 10 địa điểm có ít nhất 3 đánh giá đã duyệt. Xếp theo điểm giảm dần; cùng điểm ưu tiên nơi có nhiều đánh giá hơn.</p> : null}
      {loading ? (
        <p className="py-10 text-center text-gray-500">Đang tải địa điểm...</p>
      ) : null}
      {error ? (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}
      {!loading && !error && filteredPlaces.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-gray-600 shadow-sm">
          {places.length === 0
            ? topType ? "Chưa có địa điểm đủ điều kiện xếp hạng." : "Chưa có địa điểm ACTIVE trong cơ sở dữ liệu."
            : "Không tìm thấy địa điểm phù hợp."}
        </p>
      ) : null}
      <div className="grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filteredPlaces.map((place) => (
          <article
            key={place.place_id}
            className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-teal-200 hover:shadow-lg hover:shadow-teal-900/10"
          >
            <Link
              href={`/places/${place.place_id}`}
              aria-label={`Xem ${place.name}`}
              className="relative block aspect-[16/9] overflow-hidden bg-gradient-to-br from-teal-100 via-cyan-50 to-sky-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600"
            >
              {place.cover_image ? (
                <Image
                  src={place.cover_image}
                  alt={place.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                />
              ) : null}
              {!place.cover_image ? (
                <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-teal-800/70">
                  <MapPin size={30} aria-hidden="true" />
                  <span className="text-xs font-semibold">
                    Địa điểm Đà Nẵng
                  </span>
                </span>
              ) : null}
              <span className="absolute left-3 top-3 rounded-full border border-white/70 bg-white/90 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-teal-800 shadow-sm">
                {place.place_type}
              </span>
            </Link>
            <div className="flex flex-1 flex-col p-5">
              <h2 className="line-clamp-2 min-h-14 text-lg font-bold leading-7 text-[#0f2942]">
                {place.name}
              </h2>
              <p className="mt-1 flex min-h-10 items-start gap-1.5 text-sm leading-5 text-slate-500">
                <MapPin
                  size={15}
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-teal-600"
                />
                <span className="line-clamp-2">
                  {place.address || "Chưa có địa chỉ"}
                </span>
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-sm">
                <Star
                  size={16}
                  aria-hidden="true"
                  className="fill-amber-400 text-amber-400"
                />
                <span className="font-bold text-slate-800">
                  {Number(place.avg_rating).toFixed(1)}
                </span>
                <span className="text-slate-500">
                  · {place.review_count} đánh giá
                </span>
              </div>
              <Link
                href={`/places/${place.place_id}`}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
              >
                Xem chi tiết & đánh giá{" "}
                <ArrowRight
                  size={16}
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
