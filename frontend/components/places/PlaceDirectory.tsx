'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { getPlaces, type PlaceListItem } from '@/lib/api/places';

export default function PlaceDirectory() {
  const [places, setPlaces] = useState<PlaceListItem[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getPlaces()
      .then((items) => setPlaces(items.filter((place) => place.status === 'ACTIVE')))
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : 'Không thể tải danh sách địa điểm.'))
      .finally(() => setLoading(false));
  }, []);

  const filteredPlaces = useMemo(() => {
    const normalized = keyword.trim().toLocaleLowerCase('vi');
    if (!normalized) return places;
    return places.filter((place) => `${place.name} ${place.address ?? ''} ${place.place_type}`.toLocaleLowerCase('vi').includes(normalized));
  }, [keyword, places]);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 pb-16 pt-28">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-teal-700">Dữ liệu địa điểm</p>
          <h1 className="mt-2 text-3xl font-bold text-[#0f2942]">Chọn địa điểm để xem đánh giá</h1>
          <p className="mt-2 text-sm text-gray-600">Danh sách này lấy từ các địa điểm ACTIVE trong hệ thống.</p>
        </div>
        <input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="Tìm theo tên, địa chỉ, loại..."
          aria-label="Tìm địa điểm"
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal-500 sm:max-w-xs"
        />
      </div>

      {loading ? <p className="py-10 text-center text-gray-500">Đang tải địa điểm...</p> : null}
      {error ? <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}
      {!loading && !error && filteredPlaces.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-gray-600 shadow-sm">
          {places.length === 0 ? 'Chưa có địa điểm ACTIVE trong cơ sở dữ liệu.' : 'Không tìm thấy địa điểm phù hợp.'}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredPlaces.map((place) => (
          <Link key={place.place_id} href={`/places/${place.place_id}`} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="relative h-48 bg-gray-100">
              {place.cover_image ? <Image src={place.cover_image} alt={place.name} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover" /> : null}
            </div>
            <div className="p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-teal-700">{place.place_type}</p>
              <h2 className="mt-2 text-lg font-bold text-[#0f2942]">{place.name}</h2>
              <p className="mt-1 min-h-5 text-sm text-gray-500">{place.address || 'Chưa có địa chỉ'}</p>
              <p className="mt-4 text-sm text-amber-600">★ {Number(place.avg_rating).toFixed(1)} <span className="text-gray-500">({place.review_count} đánh giá)</span></p>
              <p className="mt-4 text-sm font-semibold text-teal-700">Xem chi tiết và đánh giá →</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
