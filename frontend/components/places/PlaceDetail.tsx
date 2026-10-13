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
    getPlace(id).then(setPlace).catch((loadError: unknown) => {
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải thông tin địa điểm.');
    });
  }, [id]);

  if (error) {
    return <main className="mx-auto max-w-5xl px-5 py-16 text-center"><p className="text-gray-700">{error}</p><Link href="/" className="mt-5 inline-block text-teal-700 underline">Về trang chủ</Link></main>;
  }
  if (!place) return <main className="mx-auto max-w-5xl px-5 py-16 text-center text-gray-500">Đang tải địa điểm...</main>;

  return (
    <main className="mx-auto max-w-5xl px-5 py-12">
      <Link href="/" className="text-sm font-medium text-teal-700 hover:underline">← Trang chủ</Link>
      <article className="mt-5 rounded-3xl bg-white p-6 shadow-sm sm:p-10">
        {place.cover_image ? (
          <div className="relative mb-7 h-64 overflow-hidden rounded-2xl bg-gray-100 sm:h-96">
            <Image src={place.cover_image} alt={place.name} fill sizes="(max-width: 1024px) 100vw, 960px" className="object-cover" priority />
          </div>
        ) : null}
        <p className="text-xs font-bold uppercase tracking-widest text-teal-700">{place.place_type}</p>
        <h1 className="mt-2 text-3xl font-bold text-[#0f2942]">{place.name}</h1>
        {place.address ? <p className="mt-3 text-gray-600">{place.address}</p> : null}
        {place.description ? <p className="mt-6 whitespace-pre-wrap leading-7 text-gray-700">{place.description}</p> : null}
      </article>
      <ReviewSection placeId={id} />
    </main>
  );
}
