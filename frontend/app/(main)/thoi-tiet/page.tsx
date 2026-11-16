"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Cloud,
  CloudDrizzle,
  CloudLightning,
  CloudRain,
  CloudSun,
  Compass,
  Droplets,
  Info,
  MapPin,
  RefreshCw,
  Sparkles,
  Sun,
  Thermometer,
  Umbrella,
  Wind,
} from "lucide-react";
import { useNavbarHero } from "@/contexts/NavbarHeroContext";
import Footer from "@/components/layout/Footer";
import WeatherBackdrop, {
  resolveAtmosphere,
  type WeatherAtmosphere,
} from "@/components/weather/WeatherBackdrop";
import { getWeather, getWeatherPlaces } from "@/lib/api/weather";
import type {
  NormalizedWeatherResponse,
  WeatherDailyItem,
  WeatherHourlyItem,
  WeatherPlacePreset,
} from "@/types/weather";

function formatNumber(val: number | null | undefined, suffix = ""): string {
  if (val === null || val === undefined || Number.isNaN(val)) {
    return "Chưa có dữ liệu";
  }
  return `${Math.round(val * 10) / 10}${suffix}`;
}

function formatViDateTime(iso: string | null | undefined): string {
  if (!iso) return "Chưa có dữ liệu";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Chưa có dữ liệu";
  return d.toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatShortDate(dateStr: string): string {
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}`;
}

function getVietnamHour(): number {
  const str = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    hour12: false,
  });
  return Number(str) || 12;
}

function WeatherCodeIcon({
  code,
  className = "w-6 h-6",
}: {
  code: number | null;
  className?: string;
}) {
  if (code === null || code === undefined) {
    return <Cloud className={`${className} text-white/80`} />;
  }
  if (code === 0 || code === 1) {
    return <Sun className={`${className} text-amber-300`} />;
  }
  if (code === 2) {
    return <CloudSun className={`${className} text-amber-200`} />;
  }
  if (code === 3 || code === 45 || code === 48) {
    return <Cloud className={`${className} text-slate-200`} />;
  }
  if (code >= 51 && code <= 57) {
    return <CloudDrizzle className={`${className} text-sky-200`} />;
  }
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
    return <CloudRain className={`${className} text-sky-300`} />;
  }
  if (code >= 95) {
    return <CloudLightning className={`${className} text-indigo-200`} />;
  }
  return <CloudSun className={`${className} text-teal-200`} />;
}

const PERIOD_LABEL: Record<WeatherHourlyItem["period"], string> = {
  MORNING: "Sáng",
  NOON: "Trưa",
  AFTERNOON: "Chiều",
  EVENING: "Tối",
  NIGHT: "Đêm",
};

const ATMOSPHERE_OPTIONS: { key: "auto" | WeatherAtmosphere; label: string }[] = [
  { key: "auto", label: "Tự động" },
  { key: "sunny", label: "Nắng" },
  { key: "cloudy", label: "Nhiều mây" },
  { key: "rain", label: "Mưa" },
  { key: "thunder", label: "Giông" },
];

export default function WeatherPage() {
  useNavbarHero();

  const [places, setPlaces] = useState<WeatherPlacePreset[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<string>("Đà Nẵng");
  const [selectedPlaceId, setSelectedPlaceId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [weather, setWeather] = useState<NormalizedWeatherResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"auto" | WeatherAtmosphere>("auto");

  useEffect(() => {
    let active = true;
    getWeatherPlaces()
      .then((list) => {
        if (active && list.length > 0) setPlaces(list);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const loadWeather = useCallback(
    async (placeName: string, placeId: number | null) => {
      setLoading(true);
      setError(null);
      try {
        const data = await getWeather({
          placeId: placeId ?? undefined,
          place: placeId ? undefined : placeName,
          days: 7,
        });
        setWeather(data);
        setSelectedDate((prev) => {
          if (prev && data.daily.some((d) => d.date === prev)) return prev;
          return data.daily[0]?.date ?? "";
        });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Không tải được dữ liệu thời tiết. Vui lòng thử lại."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadWeather(selectedPlace, selectedPlaceId);
  }, [loadWeather, selectedPlace, selectedPlaceId]);

  const hourlyForSelectedDate = useMemo(() => {
    if (!weather) return [];
    const target = selectedDate || weather.daily[0]?.date;
    if (!target) return weather.hourly.slice(0, 24);
    return weather.hourly.filter((h) => h.date === target);
  }, [weather, selectedDate]);

  const selectedDaily: WeatherDailyItem | undefined = useMemo(() => {
    if (!weather) return undefined;
    return weather.daily.find((d) => d.date === selectedDate) ?? weather.daily[0];
  }, [weather, selectedDate]);

  const todayDaily = weather?.daily[0];

  const tempBounds = useMemo(() => {
    if (!weather || weather.daily.length === 0) return { min: 20, max: 35 };
    const mins = weather.daily
      .map((d) => d.tempMin)
      .filter((v): v is number => v !== null && !Number.isNaN(v));
    const maxs = weather.daily
      .map((d) => d.tempMax)
      .filter((v): v is number => v !== null && !Number.isNaN(v));
    const min = mins.length ? Math.min(...mins) : 20;
    const max = maxs.length ? Math.max(...maxs) : 35;
    return { min, max: max <= min ? min + 1 : max };
  }, [weather]);

  const effectiveRainProb = useMemo(() => {
    if (weather?.current?.precipitationProbability !== null && weather?.current?.precipitationProbability !== undefined) {
      return weather.current.precipitationProbability;
    }
    const vnHour = getVietnamHour();
    const todayDate = weather?.daily[0]?.date;
    const matchHour = weather?.hourly.find((h) => h.date === todayDate && h.hour === vnHour);
    if (matchHour?.precipitationProbability !== null && matchHour?.precipitationProbability !== undefined) {
      return matchHour.precipitationProbability;
    }
    return weather?.daily[0]?.precipitationProbabilityMax ?? null;
  }, [weather]);

  const vnHour = getVietnamHour();
  const isNight = vnHour >= 19 || vnHour < 5;
  const activeAtmosphere: WeatherAtmosphere =
    previewMode !== "auto"
      ? previewMode
      : resolveAtmosphere(weather?.current?.weatherCode ?? todayDaily?.weatherCode, isNight);

  const handleSelectPreset = (preset: WeatherPlacePreset) => {
    setSelectedPlace(preset.name);
    setSelectedPlaceId(preset.placeId);
  };

  return (
    <div className="min-h-screen relative text-white flex flex-col">
      <WeatherBackdrop atmosphere={activeAtmosphere} />

      <main className="flex-1 pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        {/* Top Utility Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-medium text-white/95">
            <Compass className="w-3.5 h-3.5" />
            <span>Giờ Việt Nam (UTC+7) · Dự báo 7 ngày</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Effect Preview Switcher */}
            <div className="inline-flex items-center gap-1 rounded-full bg-black/20 backdrop-blur-md border border-white/15 p-1">
              {ATMOSPHERE_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setPreviewMode(opt.key)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    previewMode === opt.key
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => void loadWeather(selectedPlace, selectedPlaceId)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-semibold hover:bg-white/25 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Làm mới
            </button>
          </div>
        </div>

        {/* Location Selector Pills */}
        {places.length > 0 && (
          <div className="mb-8 flex flex-wrap justify-center gap-2">
            {places.map((preset) => {
              const isActive =
                preset.placeId !== null
                  ? preset.placeId === selectedPlaceId
                  : selectedPlaceId === null && preset.name === selectedPlace;
              return (
                <button
                  key={`${preset.placeId ?? "city"}-${preset.name}`}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all backdrop-blur-md border ${
                    isActive
                      ? "bg-white text-slate-900 border-white shadow-md"
                      : "bg-white/12 text-white/90 border-white/20 hover:bg-white/20"
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  {preset.name}
                </button>
              );
            })}
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && !weather && (
          <div className="space-y-6 animate-pulse">
            <div className="h-52 rounded-3xl bg-white/15 backdrop-blur-md" />
            <div className="h-40 rounded-3xl bg-white/15 backdrop-blur-md" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="h-80 rounded-3xl bg-white/15 backdrop-blur-md" />
              <div className="h-80 rounded-3xl bg-white/15 backdrop-blur-md" />
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="rounded-3xl border border-rose-300/40 bg-rose-950/60 backdrop-blur-md p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-300 shrink-0 mt-0.5" />
              <div>
                <h2 className="font-bold text-base">Không tải được dữ liệu thời tiết</h2>
                <p className="text-sm text-rose-100 mt-1">{error}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void loadWeather(selectedPlace, selectedPlaceId)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-rose-900 text-sm font-bold hover:bg-rose-50 transition-colors shrink-0"
            >
              <RefreshCw className="w-4 h-4" />
              Thử lại
            </button>
          </div>
        )}

        {weather && (
          <div className="space-y-5">
            {/* Apple Weather Style Centered Hero */}
            <section className="text-center py-4 sm:py-6">
              <p className="text-sm uppercase tracking-widest text-white/80 font-semibold">
                {weather.location.scope === "PLACE"
                  ? "Tọa độ điểm du lịch"
                  : "Mốc trung tâm thành phố"}
              </p>
              <h1 className="text-2xl sm:text-4xl font-bold tracking-tight mt-1 drop-shadow-sm">
                {weather.location.name}
              </h1>

              {weather.current ? (
                <>
                  <div className="mt-2 flex items-center justify-center gap-4">
                    <WeatherCodeIcon
                      code={weather.current.weatherCode}
                      className="w-14 h-14 sm:w-16 sm:h-16 drop-shadow"
                    />
                    <span className="text-7xl sm:text-8xl font-extralight tracking-tighter leading-none drop-shadow-sm">
                      {weather.current.temperature !== null
                        ? `${Math.round(weather.current.temperature)}°`
                        : "—"}
                    </span>
                  </div>
                  <p className="text-lg sm:text-xl font-medium text-white/95 mt-2">
                    {weather.current.description}
                  </p>
                  <div className="flex items-center justify-center gap-4 text-sm font-medium text-white/85 mt-1">
                    {todayDaily && (
                      <span>
                        C: {todayDaily.tempMax !== null ? `${Math.round(todayDaily.tempMax)}°` : "—"} · T:{" "}
                        {todayDaily.tempMin !== null ? `${Math.round(todayDaily.tempMin)}°` : "—"}
                      </span>
                    )}
                    {weather.current.apparentTemperature !== null && (
                      <span>
                        Cảm giác như {Math.round(weather.current.apparentTemperature)}°
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-white/80 mt-4">
                  Hiện chưa có dữ liệu thời tiết hiện tại từ nhà cung cấp.
                </p>
              )}

              <p className="text-xs text-white/65 mt-3">
                {weather.location.areaLabel} · Cập nhật lúc {formatViDateTime(weather.fetchedAt)}
              </p>
            </section>

            {/* Stale Cache Banner */}
            {weather.stale && (
              <div className="rounded-2xl border border-amber-300/40 bg-amber-950/50 backdrop-blur-md px-4 py-3 text-amber-100 flex items-start gap-3 text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Đang hiển thị dữ liệu cache cũ: </span>
                  {weather.staleReason ??
                    `Dữ liệu được lấy lúc ${formatViDateTime(weather.fetchedAt)}.`}
                </div>
              </div>
            )}

            {/* 3-State Alert Banner */}
            {weather.alerts.state === "ACTIVE" && (
              <div className="rounded-3xl border border-rose-300/40 bg-rose-950/60 backdrop-blur-md p-5 text-white">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-300 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-base">Cảnh báo thời tiết nguy hiểm</span>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/40">
                        {weather.alerts.scope}
                      </span>
                    </div>
                    <p className="text-sm text-rose-100 mt-1">{weather.alerts.message}</p>
                    <div className="mt-3 space-y-2">
                      {weather.alerts.items.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-2xl bg-black/25 border border-white/10 p-3 text-sm"
                        >
                          <p className="font-semibold">
                            {item.event} — {item.area}
                          </p>
                          <p className="text-xs text-rose-200 mt-0.5">
                            Hiệu lực: {formatViDateTime(item.effectiveFrom)} →{" "}
                            {formatViDateTime(item.effectiveTo)} · Nguồn: {item.source}
                          </p>
                          {item.description && (
                            <p className="text-white/90 mt-1">{item.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {weather.alerts.state === "NONE" && (
              <div className="rounded-2xl border border-emerald-300/30 bg-emerald-950/35 backdrop-blur-md px-4 py-3 text-emerald-100 flex items-center gap-3 text-xs sm:text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>
                  {weather.alerts.message} (Nguồn: {weather.alerts.source})
                </span>
              </div>
            )}

            {weather.alerts.state === "UNAVAILABLE" && (
              <div className="rounded-2xl border border-white/15 bg-black/20 backdrop-blur-md px-4 py-3 text-white/85 flex items-start gap-3 text-xs sm:text-sm">
                <Info className="w-4 h-4 text-sky-200 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white">Cảnh báo thiên tai: </span>
                  {weather.alerts.message}
                </div>
              </div>
            )}

            {/* Hourly Forecast Frosted Strip */}
            <section className="rounded-3xl bg-white/12 backdrop-blur-xl border border-white/20 p-4 sm:p-5 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-white/15">
                <h2 className="text-xs font-bold uppercase tracking-wider text-white/80">
                  Dự báo theo giờ{" "}
                  {selectedDaily ? `· ${selectedDaily.dayLabel}` : ""}
                </h2>
                {selectedDaily && (
                  <span className="text-xs text-white/75">
                    Tổng mưa ngày: {formatNumber(selectedDaily.precipitationSum, " mm")} · Gió tối đa:{" "}
                    {formatNumber(selectedDaily.windSpeedMax, " km/h")}
                  </span>
                )}
              </div>

              {hourlyForSelectedDate.length === 0 ? (
                <p className="text-sm text-white/75 py-6 text-center">
                  Không có dữ liệu theo giờ cho ngày đã chọn.
                </p>
              ) : (
                <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-1">
                  {hourlyForSelectedDate.map((h) => {
                    const isCurrentHour =
                      h.date === weather.daily[0]?.date && h.hour === vnHour;
                    return (
                      <div
                        key={h.time}
                        className={`min-w-[82px] shrink-0 rounded-2xl px-3 py-3 flex flex-col items-center text-center transition-colors ${
                          isCurrentHour
                            ? "bg-white/25 border border-white/40"
                            : "bg-white/5 hover:bg-white/15"
                        }`}
                      >
                        <span className="text-xs font-semibold text-white/90">
                          {isCurrentHour ? "Bây giờ" : h.hourLabel}
                        </span>
                        <span className="text-[10px] text-white/65 mt-0.5">
                          {PERIOD_LABEL[h.period]}
                        </span>
                        <div className="my-2.5">
                          <WeatherCodeIcon code={h.weatherCode} className="w-7 h-7" />
                        </div>
                        {h.precipitationProbability !== null &&
                        h.precipitationProbability > 0 ? (
                          <span className="text-[11px] font-bold text-sky-200 mb-1">
                            {Math.round(h.precipitationProbability)}%
                          </span>
                        ) : (
                          <span className="text-[11px] text-transparent mb-1">0%</span>
                        )}
                        <span className="text-base font-bold">
                          {h.temperature !== null ? `${Math.round(h.temperature)}°` : "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* 2-Column Bento Grid: 7-Day Forecast + Detailed Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left: 7-Day Forecast List with Temperature Range Bar */}
              <section className="lg:col-span-7 rounded-3xl bg-white/12 backdrop-blur-xl border border-white/20 p-4 sm:p-5 shadow-lg">
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/15">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-white/80 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Dự báo {weather.daily.length} ngày tới
                  </h2>
                  <span className="text-xs text-white/70">Bấm chọn ngày</span>
                </div>

                <div className="divide-y divide-white/10">
                  {weather.daily.map((day) => {
                    const isSelected = day.date === selectedDaily?.date;
                    const minVal = day.tempMin ?? tempBounds.min;
                    const maxVal = day.tempMax ?? tempBounds.max;
                    const span = tempBounds.max - tempBounds.min;
                    const leftPct = Math.max(
                      0,
                      Math.min(100, ((minVal - tempBounds.min) / span) * 100)
                    );
                    const widthPct = Math.max(
                      8,
                      Math.min(100 - leftPct, ((maxVal - minVal) / span) * 100)
                    );

                    return (
                      <button
                        key={day.date}
                        type="button"
                        onClick={() => setSelectedDate(day.date)}
                        className={`w-full flex items-center gap-3 px-2.5 py-3 rounded-xl transition-colors text-left ${
                          isSelected ? "bg-white/20" : "hover:bg-white/10"
                        }`}
                      >
                        <div className="w-24 sm:w-28 shrink-0">
                          <div className="text-sm font-bold truncate">
                            {day.dayLabel.split("(")[0]?.trim()}
                          </div>
                          <div className="text-[11px] text-white/65">
                            {formatShortDate(day.date)}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-20 shrink-0">
                          <WeatherCodeIcon code={day.weatherCode} className="w-6 h-6 shrink-0" />
                          <span className="text-xs font-semibold text-sky-200">
                            {day.precipitationProbabilityMax !== null
                              ? `${Math.round(day.precipitationProbabilityMax)}%`
                              : "—"}
                          </span>
                        </div>

                        <div className="flex-1 flex items-center gap-2.5 min-w-0">
                          <span className="text-sm font-medium text-white/75 w-8 text-right shrink-0">
                            {day.tempMin !== null ? `${Math.round(day.tempMin)}°` : "—"}
                          </span>
                          <div className="flex-1 h-1.5 rounded-full bg-black/25 overflow-hidden relative">
                            <div
                              className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-cyan-300 via-amber-300 to-orange-400"
                              style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold w-8 shrink-0">
                            {day.tempMax !== null ? `${Math.round(day.tempMax)}°` : "—"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Right: Bento Metric Tiles + Ask Gô */}
              <section className="lg:col-span-5 grid grid-cols-2 gap-3.5 content-start">
                <div className="rounded-3xl bg-white/12 backdrop-blur-xl border border-white/20 p-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white/75">
                    <Umbrella className="w-3.5 h-3.5" />
                    Khả năng mưa
                  </div>
                  <div className="text-3xl font-bold mt-2">
                    {effectiveRainProb !== null ? `${Math.round(effectiveRainProb)}%` : "Chưa có"}
                  </div>
                  <p className="text-xs text-white/70 mt-1">
                    {weather.current?.precipitationProbability === null && effectiveRainProb !== null
                      ? "Theo khung giờ hiện tại"
                      : "Xác suất có mưa"}
                  </p>
                </div>

                <div className="rounded-3xl bg-white/12 backdrop-blur-xl border border-white/20 p-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white/75">
                    <CloudRain className="w-3.5 h-3.5" />
                    Lượng mưa
                  </div>
                  <div className="text-3xl font-bold mt-2">
                    {formatNumber(weather.current?.precipitation, " mm")}
                  </div>
                  <p className="text-xs text-white/70 mt-1">
                    Cả ngày: {formatNumber(todayDaily?.precipitationSum, " mm")}
                  </p>
                </div>

                <div className="rounded-3xl bg-white/12 backdrop-blur-xl border border-white/20 p-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white/75">
                    <Wind className="w-3.5 h-3.5" />
                    Gió
                  </div>
                  <div className="text-3xl font-bold mt-2">
                    {weather.current?.windSpeed !== null && weather.current?.windSpeed !== undefined
                      ? `${Math.round(weather.current.windSpeed)} km/h`
                      : "—"}
                  </div>
                  <p className="text-xs text-white/70 mt-1">
                    Gió giật: {formatNumber(weather.current?.windGusts, " km/h")}
                  </p>
                </div>

                <div className="rounded-3xl bg-white/12 backdrop-blur-xl border border-white/20 p-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white/75">
                    <Droplets className="w-3.5 h-3.5" />
                    Độ ẩm
                  </div>
                  <div className="text-3xl font-bold mt-2">
                    {formatNumber(weather.current?.humidity, "%")}
                  </div>
                  <p className="text-xs text-white/70 mt-1 flex items-center gap-1">
                    <Thermometer className="w-3 h-3" />
                    Cảm giác:{" "}
                    {weather.current?.apparentTemperature !== null &&
                    weather.current?.apparentTemperature !== undefined
                      ? `${Math.round(weather.current.apparentTemperature)}°C`
                      : "—"}
                  </p>
                </div>

                {/* Ask Gô Weather Card */}
                <div className="col-span-2 rounded-3xl bg-white/15 backdrop-blur-xl border border-white/25 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-200">
                      <Sparkles className="w-3.5 h-3.5" />
                      Trợ lý du lịch Gô
                    </div>
                    <p className="text-sm font-medium text-white mt-1">
                      Cần đổi lịch trình sang điểm trong nhà hoặc hỏi mang gì khi đi Đà Nẵng?
                    </p>
                  </div>
                  <Link
                    href="/chat"
                    className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-white text-slate-900 text-sm font-bold hover:bg-teal-50 transition-colors shrink-0 shadow-sm"
                  >
                    Hỏi trợ lý Gô →
                  </Link>
                </div>
              </section>
            </div>

            {/* Attribution & Metadata */}
            <div className="text-center text-xs text-white/70 pt-3">
              <a
                href={weather.source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-white transition-colors"
              >
                {weather.source.attribution}
              </a>{" "}
              ({weather.source.license}) · Tọa độ: {weather.location.latitude.toFixed(4)},{" "}
              {weather.location.longitude.toFixed(4)}
              {weather.providerUpdatedAt
                ? ` · Nguồn cập nhật: ${formatViDateTime(weather.providerUpdatedAt)}`
                : ""}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
