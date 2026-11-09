'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { MapPin, Star } from 'lucide-react';
import { getFavorites, type FavoritePlace, type FavoriteType } from '@/lib/api/favorites';
import { useFavorites } from '@/contexts/FavoritesContext';

const PAGE_SIZE = 9;
const TYPE_LABELS: Record<FavoriteType, string> = {
  ALL: 'Tất cả',
  RESTAURANT: 'Ẩm thực',
  ACCOMMODATION: 'Lưu trú',
  ATTRACTION: 'Điểm du lịch',
};

function imageUrl(image: string | null): string | null {
  if (!image) return null;
  if (/^https?:\/\//i.test(image)) return image;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  return `${apiUrl.replace(/\/$/, '')}/${image.replace(/^\//, '')}`;
}

export default function FavoritePlacesTab() {
  const { toggle } = useFavorites();
  const [type, setType] = useState<FavoriteType>('ALL');
  const [page, setPage] = useState(1);
  const [places, setPlaces] = useState<FavoritePlace[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    getFavorites({ type, page, limit: PAGE_SIZE })
      .then((result) => {
        if (!active) return;
        setPlaces(result.data);
        setTotal(result.pagination.total);
        setTotalPages(result.pagination.totalPages);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(reason instanceof Error ? reason.message : 'Không tải được địa điểm đã lưu.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [page, refreshKey, type]);

  const handleRemove = async (placeId: number) => {
    setRemovingId(placeId);
    const removed = await toggle(placeId);
    setRemovingId(null);
    if (!removed) return;
    setPlaces((current) => current.filter((place) => place.place_id !== placeId));
    const nextTotal = Math.max(0, total - 1);
    setTotal(nextTotal);
    setTotalPages(Math.ceil(nextTotal / PAGE_SIZE));
    if (places.length === 1 && page > 1) setPage((current) => current - 1);
  };

  return (
    <section aria-label="Địa điểm yêu thích" className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Địa điểm đã lưu</h3>
          <p className="text-sm text-gray-500">Bạn đã lưu {total} địa điểm.</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <span>Lọc loại:</span>
          <select
            value={type}
            onChange={(event) => { setType(event.target.value as FavoriteType); setPage(1); }}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-700 focus:border-teal-500 focus:outline-none"
          >
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
          <button type="button" onClick={() => setRefreshKey((current) => current + 1)} className="ml-3 font-semibold underline">Thử lại</button>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm text-gray-500">Đang tải địa điểm đã lưu...</div>
      ) : error ? null : places.length === 0 ? (
        <div className="rounded-xl bg-gray-50 py-12 text-center text-gray-500">
          Bạn chưa lưu địa điểm nào. Hãy khám phá Đà Nẵng ngay!
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {places.map((place) => {
              const image = imageUrl(place.cover_image);
              return (
                <article key={place.place_id} className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                  <Link href={`/places/${place.place_id}`} className="block">
                    <div className="relative h-40 bg-gradient-to-br from-teal-100 to-cyan-50">
                      {image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={image} alt={place.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-teal-600"><MapPin size={32} /></div>
                      )}
                      <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-teal-800">
                        {TYPE_LABELS[place.place_type]}
                      </span>
                    </div>
                    <div className="space-y-2 p-4">
                      <h4 className="line-clamp-1 font-bold text-gray-800">{place.name}</h4>
                      <p className="line-clamp-1 flex items-center gap-1 text-sm text-gray-500">
                        <MapPin size={14} className="shrink-0" />{place.address || 'Đà Nẵng'}
                      </p>
                      <p className="flex items-center gap-1 text-sm text-amber-600">
                        <Star size={14} className="fill-amber-400 text-amber-400" />
                        {Number(place.avg_rating || 0).toFixed(1)}
                        <span className="text-gray-400">({place.review_count} đánh giá)</span>
                      </p>
                    </div>
                  </Link>
                  <div className="px-4 pb-4">
                    <button
                      type="button"
                      onClick={() => void handleRemove(place.place_id)}
                      disabled={removingId === place.place_id}
                      className="w-full rounded-lg border border-rose-200 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
                    >
                      {removingId === place.place_id ? 'Đang bỏ lưu...' : 'Bỏ lưu'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-2">
              <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40">Trang trước</button>
              <span className="text-sm text-gray-600">{page} / {totalPages}</span>
              <button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40">Trang sau</button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
