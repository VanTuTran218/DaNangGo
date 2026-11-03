'use client';

import { useEffect, useState } from 'react';
import { fetchDrivingRoute, type Coordinates, type DrivingRoute, type MapPlace } from '@/lib/map-navigation';

type RouteState = {
  target: MapPlace;
  originLat: number;
  originLng: number;
  attempt: number;
  route?: DrivingRoute;
  error?: string;
};

export function useMapRouting(target: MapPlace | null, origin: Coordinates, attempt: number) {
  const [state, setState] = useState<RouteState | null>(null);
  const [originLat, originLng] = origin;

  useEffect(() => {
    if (!target) return;
    const controller = new AbortController();
    const context = { target, originLat, originLng, attempt };
    setState(context);
    fetchDrivingRoute([originLat, originLng], [target.lat, target.lng], controller.signal)
      .then(route => {
        if (!controller.signal.aborted) setState({ ...context, route });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const message = error instanceof Error && error.name === 'Error'
          ? error.message
          : 'Không thể tải tuyến đường. Kiểm tra kết nối mạng rồi thử lại hoặc mở Google Maps.';
        setState({ ...context, error: message });
      });
    return () => controller.abort();
  }, [target, originLat, originLng, attempt]);

  // Không hiển thị tuyến cũ trong lúc người dùng đổi điểm đến hoặc vị trí GPS.
  const current = target && state?.target === target
    && state.originLat === originLat && state.originLng === originLng && state.attempt === attempt ? state : null;
  return {
    route: current?.route ?? null,
    error: current?.error ?? null,
    loading: Boolean(target && !current?.route && !current?.error),
  };
}
