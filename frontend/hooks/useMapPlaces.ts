'use client';

import { useEffect, useState } from 'react';
import { getPlaces } from '@/lib/api/places';
import { loadMapPlaces, mapApiPlace, type MapLocation } from '@/lib/map-places';

export function useMapPlaces() {
  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [missingCoordinates, setMissingCoordinates] = useState(0);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    loadMapPlaces((query, signal) => getPlaces(query, AbortSignal.any([signal!, AbortSignal.timeout(15_000)])), controller.signal).then(places => {
      const mapped = places.map(place => mapApiPlace(place, process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'));
      setLocations(mapped.filter((place): place is MapLocation => place !== null));
      setMissingCoordinates(places.filter((place, index) => place.status === 'ACTIVE' && !mapped[index]).length);
    }).catch(() => {
      if (!controller.signal.aborted) setError('Không tải được địa điểm. Vui lòng kiểm tra kết nối máy chủ rồi thử lại.');
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [attempt]);
  return { locations, loading, error, missingCoordinates, reload: () => setAttempt(value => value + 1) };
}
