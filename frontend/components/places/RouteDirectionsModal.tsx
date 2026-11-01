'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Navigation,
  MapPin,
  Clock,
  Coins,
  Footprints,
  Bike,
  Car,
  Bus,
  ExternalLink,
  Loader2,
  AlertCircle,
  LocateFixed,
} from 'lucide-react';
import { getRouteDirections, TravelOption, TravelMode } from '@/lib/api/routes';

interface RouteDirectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  destination: {
    place_id: number;
    name: string;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  };
}

// Các điểm mốc phổ biến ở Đà Nẵng để test hoặc người dùng chọn nhanh
const POPULAR_ORIGINS = [
  { label: 'Sân bay Quốc tế Đà Nẵng', coords: '16.0538,108.2022' },
  { label: 'Cầu Rồng Đà Nẵng', coords: '16.0610,108.2208' },
  { label: 'Ga Đà Nẵng', coords: '16.0718,108.2120' },
  { label: 'Bến xe Trung tâm', coords: '16.0592,108.1726' },
  { label: 'Cầu Sông Hàn', coords: '16.0722,108.2272' },
];

const MODE_CONFIG: Record<
  TravelMode,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string; googleMode: string }
> = {
  WALK: {
    label: 'Đi bộ',
    icon: Footprints,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50 border-emerald-200',
    googleMode: 'walking',
  },
  MOTORBIKE: {
    label: 'Xe máy',
    icon: Bike,
    color: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200',
    googleMode: 'two-wheeler',
  },
  CAR: {
    label: 'Ô tô riêng',
    icon: Car,
    color: 'text-blue-700',
    bg: 'bg-blue-50 border-blue-200',
    googleMode: 'driving',
  },
  TAXI: {
    label: 'Taxi / Công nghệ',
    icon: Car,
    color: 'text-indigo-700',
    bg: 'bg-indigo-50 border-indigo-200',
    googleMode: 'driving',
  },
  BUS: {
    label: 'Xe buýt Danabus',
    icon: Bus,
    color: 'text-purple-700',
    bg: 'bg-purple-50 border-purple-200',
    googleMode: 'transit',
  },
};

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} phút`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}p` : `${h} giờ`;
}

function formatCost(cost: number): string {
  if (cost === 0) return 'Miễn phí';
  return `${new Intl.NumberFormat('vi-VN').format(cost)}đ`;
}

export default function RouteDirectionsModal({
  isOpen,
  onClose,
  destination,
}: RouteDirectionsModalProps) {
  const [originType, setOriginType] = useState<'current' | 'preset'>('current');
  const [selectedPreset, setSelectedPreset] = useState(POPULAR_ORIGINS[1].coords);
  const [userCoords, setUserCoords] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<TravelOption[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Lấy vị trí GPS của người dùng
  const detectUserLocation = () => {
    if (!navigator.geolocation) {
      setError('Trình duyệt của bạn không hỗ trợ định vị GPS.');
      setOriginType('preset');
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = `${pos.coords.latitude.toFixed(6)},${pos.coords.longitude.toFixed(6)}`;
        setUserCoords(coords);
        setLocating(false);
        fetchRoute(coords);
      },
      (err) => {
        setLocating(false);
        // Fallback sang Cầu Rồng nếu người dùng từ chối quyền định vị
        setError('Không lấy được GPS (' + err.message + '). Đang dùng vị trí Cầu Rồng Đà Nẵng làm điểm mốc.');
        setOriginType('preset');
        fetchRoute(selectedPreset);
      },
      { timeout: 7000 }
    );
  };

  const fetchRoute = async (originCoords: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRouteDirections({
        toPlaceId: destination.place_id,
        from: originCoords,
      });
      setOptions(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tính toán tuyến đường.';
      setError(msg);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (originType === 'current') {
        detectUserLocation();
      } else {
        fetchRoute(selectedPreset);
      }
    }
  }, [isOpen, originType, selectedPreset]);

  if (!isOpen) return null;

  const currentOriginCoords = originType === 'current' ? userCoords || selectedPreset : selectedPreset;

  const googleMapsUrl = (googleMode = 'driving') => {
    const dest = destination.latitude && destination.longitude
      ? `${destination.latitude},${destination.longitude}`
      : `${destination.name}, ${destination.address || 'Đà Nẵng'}`;
    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(currentOriginCoords)}&destination=${encodeURIComponent(dest)}&travelmode=${googleMode}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-slate-50/70 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-sm shadow-teal-500/30">
              <Navigation className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Chỉ đường & So sánh phương tiện</h3>
              <p className="text-xs text-gray-500">Đến: {destination.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[80vh] overflow-y-auto p-6 space-y-6">
          {/* Lựa chọn điểm xuất phát */}
          <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Điểm xuất phát (Điểm đi)
            </label>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setOriginType('current');
                  detectUserLocation();
                }}
                disabled={locating}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                  originType === 'current'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LocateFixed className="h-3.5 w-3.5" />}
                {locating ? 'Đang xác định GPS...' : 'Vị trí hiện tại của tôi'}
              </button>

              <button
                type="button"
                onClick={() => setOriginType('preset')}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                  originType === 'preset'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <MapPin className="h-3.5 w-3.5" />
                Chọn địa điểm mốc tại Đà Nẵng
              </button>
            </div>

            {originType === 'preset' ? (
              <div className="mt-3">
                <select
                  value={selectedPreset}
                  onChange={(e) => setSelectedPreset(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-medium text-gray-800 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  {POPULAR_ORIGINS.map((item) => (
                    <option key={item.coords} value={item.coords}>
                      {item.label} ({item.coords})
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {userCoords && originType === 'current' ? (
              <p className="mt-2 text-xs text-teal-700">
                ✓ Đã lấy tọa độ GPS của bạn: <span className="font-mono font-medium">{userCoords}</span>
              </p>
            ) : null}
          </div>

          {/* Thông báo lỗi nếu có */}
          {error ? (
            <div className="flex items-start gap-2 rounded-2xl bg-amber-50 p-4 text-xs text-amber-800 border border-amber-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <div>{error}</div>
            </div>
          ) : null}

          {/* Bảng so sánh các phương tiện */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-gray-900">So sánh 5 phương tiện di chuyển</h4>
              {options.length > 0 && options[0].distanceKm ? (
                <span className="text-xs font-semibold text-gray-500">
                  Quãng đường: ~{options[0].distanceKm} km
                </span>
              ) : null}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                <p className="mt-3 text-xs font-medium">Đang tính toán khoảng cách và giá cước...</p>
              </div>
            ) : options.length > 0 ? (
              <div className="space-y-2.5">
                {options.map((opt) => {
                  const cfg = MODE_CONFIG[opt.mode];
                  const Icon = cfg?.icon || Navigation;
                  return (
                    <div
                      key={opt.mode}
                      className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3.5 transition hover:shadow-sm ${
                        cfg?.bg || 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-xs ${cfg?.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-900">{cfg?.label || opt.mode}</span>
                            {opt.cached ? (
                              <span className="rounded bg-gray-200/70 px-1.5 py-0.5 text-[10px] text-gray-600">
                                Cache
                              </span>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                            <span className="flex items-center gap-1 font-medium text-gray-700">
                              <Clock className="h-3.5 w-3.5 text-gray-400" />
                              {formatDuration(opt.durationMinutes)}
                            </span>
                            <span>•</span>
                            <span>{opt.distanceKm} km</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 ml-auto">
                        <div className="text-right">
                          <div className="text-xs text-gray-400">Chi phí ước tính</div>
                          <div className="text-sm font-bold text-gray-900 flex items-center justify-end gap-1">
                            <Coins className="h-3.5 w-3.5 text-amber-500" />
                            {formatCost(opt.estimatedCost)}
                          </div>
                        </div>

                        <a
                          href={googleMapsUrl(cfg?.googleMode)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Mở Google Maps chỉ đường bằng phương tiện này"
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-600 transition hover:bg-gray-50 hover:text-teal-600"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : !loading && !error ? (
              <p className="text-center py-8 text-xs text-gray-500">
                Chọn điểm xuất phát để xem thời gian và chi phí từng phương tiện.
              </p>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-6 py-4">
          <p className="text-[11px] text-gray-500">
            Dữ liệu tính toán dựa trên dịch vụ định tuyến OSRM và cước vận tải Đà Nẵng.
          </p>
          <a
            href={googleMapsUrl('driving')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-teal-700"
          >
            <Navigation className="h-3.5 w-3.5" />
            Mở Google Maps
          </a>
        </div>
      </div>
    </div>
  );
}
