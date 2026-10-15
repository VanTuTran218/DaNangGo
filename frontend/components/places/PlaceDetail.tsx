'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { getPlace, type PlaceDetail as PlaceDetailData } from '@/lib/api/places';
import ReviewSection from './ReviewSection';

export default function PlaceDetail({ id }: { id: string }) {
  const [place, setPlace] = useState<PlaceDetailData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getPlace(id)
      .then(setPlace)
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : 'Không thể tải địa điểm.'));
  }, [id]);

  if (error) return (
    <section className="mx-auto max-w-5xl px-5 py-16 text-center">
      <p role="alert" className="text-gray-700">{error}</p>
      <Link href="/places" className="mt-5 inline-block text-teal-700 underline">Quay lại danh sách địa điểm</Link>
    </section>
  );
  if (!place) return <p className="mx-auto max-w-5xl px-5 py-16 text-center text-gray-500">Đang tải địa điểm...</p>;

  const fallbackPhotos = [
    'photo-1500530855697-b586d89ba3ee', 'photo-1519046904884-53103b34b206',
    'photo-1501785888041-af3ef285b470', 'photo-1470770841072-f978cf4d019e',
    'photo-1518837695005-2083093ee35b', 'photo-1464822759023-fed622ff2c3b',
  ];
  const imageUrl = place.image_url || `https://images.unsplash.com/${fallbackPhotos[Math.abs(place.place_id) % fallbackPhotos.length]}?auto=format&fit=crop&w=1600&q=85`;

  return (
    <section className="mx-auto max-w-5xl px-5 pb-16 pt-28">
      <Link href="/places" className="text-sm font-medium text-teal-700 hover:underline">← Tất cả địa điểm</Link>
      <article className="mt-5 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        <div className="relative h-64 bg-slate-200 sm:h-80">
          <Image src={imageUrl} alt={`Hình ảnh ${place.name}`} fill unoptimized preload sizes="(max-width: 1024px) 100vw, 1024px" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f2942]/85 via-[#0f2942]/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-9">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-200">{place.place_type}</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{place.name}</h1>
            {place.address ? <p className="mt-2 flex items-center gap-2 text-sm text-white/85">⌖ {place.address}</p> : null}
          </div>
        </div>
        <div className="p-6 sm:p-9">
          {place.description ? <p className="whitespace-pre-wrap leading-7 text-gray-700">{place.description}</p> : null}
          <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">★ {Number(place.avg_rating).toFixed(1)} <span className="font-normal text-gray-600">({place.review_count} đánh giá đã duyệt)</span></p>
        </div>
      </article>
      <ReviewSection placeId={id} placeName={place.name} imageUrl={imageUrl} />
    </section>
  );
}
