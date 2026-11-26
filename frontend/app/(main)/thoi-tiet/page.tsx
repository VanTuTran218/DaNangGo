"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Cloud,
  CloudDrizzle,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSun,
  Compass,
  Droplets,
  Info,
  MapPin,
  Moon,
  RefreshCw,
  ShieldCheck,
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
    return "Chưa có";
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
    hourCycle: "h23",
  });
  return Number(str);
}

function isNightHour(hour: number): boolean {
  return hour < 6 || hour >= 18;
}

function WeatherCodeIcon({
  code,
  isNight = false,
  className = "w-6 h-6",
}: {
  code: number | null;
  isNight?: boolean;
  className?: string;
}) {
  if (code === null || code === undefined) {
    return <Cloud className={`${className} text-[#CBD5E1]`} />;
  }
  if (code === 0 || code === 1) {
    if (isNight) return <Moon className={`${className} text-[#E6D9B7]`} />;
    return <Sun className={`${className} text-[#FBBF24]`} />;
  }
  if (code === 2) {
    if (isNight) return <CloudMoon className={`${className} text-[#E6D9B7]`} />;
    return <CloudSun className={`${className} text-[#FCD34D]`} />;
  }
  if (code === 3 || code === 45 || code === 48) {
    return <Cloud className={`${className} text-[#CBD5E1]`} />;
  }
  if (code >= 51 && code <= 57) {
    return <CloudDrizzle className={`${className} text-[#7DD3FC]`} />;
  }
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
    return <CloudRain className={`${className} text-[#38BDF8]`} />;
  }
  if (code >= 95) {
    return <CloudLightning className={`${className} text-[#A5B4FC]`} />;
  }
  return <Cloud className={`${className} text-[#5EEAD4]`} />;
}

function getTravelReadiness(
  weather: NormalizedWeatherResponse,
  rainProb: number | null,
): { badge: string; title: string; advice: string; tone: "rain" | "hot" | "good" } {
  const code = weather.current?.weatherCode ?? weather.daily[0]?.weatherCode ?? null;
  const temp = weather.current?.temperature ?? weather.daily[0]?.tempMax ?? null;
  const wind = weather.current?.windSpeed ?? null;

  const isStorm = code !== null && code >= 95;
  const isRainy =
    (code !== null && ((code >= 51 && code <= 67) || (code >= 80 && code <= 82))) ||
    (rainProb !== null && rainProb >= 55);

  if (isStorm) {
    return {
      badge: "Cần thận trọng",
      title: "Hạn chế hoạt động ngoài trời & ven biển",
      advice:
        "Có dấu hiệu mưa giông. Nên ưu tiên bảo tàng, quán cà phê hoặc ẩm thực trong nhà và kiểm tra đường trước khi di chuyển.",
      tone: "rain",
    };
  }
  if (isRainy) {
    return {
      badge: "Chuẩn bị che mưa",
      title: "Mang theo ô gọn hoặc áo mưa nhẹ",
      advice:
        "Khả năng mưa cao trong khung giờ tới. Phù hợp kết hợp ẩm thực đặc sản, Bảo tàng Chăm hoặc dạo phố ngắn giữa các đợt tạnh.",
      tone: "rain",
    };
  }
  if (temp !== null && temp >= 33) {
    return {
      badge: "Nắng ấm cao",
      title: "Bổ sung nước & chống nắng khi ra ngoài",
      advice:
        "Nhiệt độ ngoài trời cao. Nên tham quan Bà Nà Hills, biển Mỹ Khê vào sáng sớm hoặc chiều muộn sau 16:00.",
      tone: "hot",
    };
  }
  if (wind !== null && wind >= 30) {
    return {
      badge: "Gió biển khá mạnh",
      title: "Chú ý gió khi di chuyển ven biển & Sơn Trà",
      advice:
        "Gió ven biển đang thổi mạnh; thích hợp dạo ngắm cảnh nhưng nên mặc thêm áo khoác mỏng vào buổi tối.",
      tone: "good",
    };
  }
  return {
    badge: "Thuận lợi khám phá",
    title: "Thời tiết đẹp cho hành trình ngoài trời",
    advice:
      "Điều kiện dễ chịu để tắm biển Mỹ Khê, chạy cung đường bán đảo Sơn Trà và ngắm Cầu Rồng về đêm.",
    tone: "good",
  };
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

  const hourlyScrollRef = useRef<HTMLDivElement | null>(null);
  const currentHourCardRef = useRef<HTMLDivElement | null>(null);
  const stationScrollRef = useRef<HTMLDivElement | null>(null);

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
            : "Không tải được dữ liệu thời tiết. Vui lòng thử lại.",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
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

  // Auto-scroll hourly strip to highlight current hour ("Bây giờ") when viewing today
  useEffect(() => {
    const container = hourlyScrollRef.current;
    const currentCard = currentHourCardRef.current;
    if (!container) return;
    if (currentCard) {
      const targetLeft = Math.max(0, currentCard.offsetLeft - 36);
      container.scrollTo({ left: targetLeft, behavior: "smooth" });
    } else {
      container.scrollTo({ left: 0, behavior: "smooth" });
    }
  }, [selectedDate, weather?.location.name]);

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
    if (
      weather?.current?.precipitationProbability !== null &&
      weather?.current?.precipitationProbability !== undefined
    ) {
      return weather.current.precipitationProbability;
    }
    const vnHour = getVietnamHour();
    const todayDate = weather?.daily[0]?.date;
    const matchHour = weather?.hourly.find(
      (h) => h.date === todayDate && h.hour === vnHour,
    );
    if (
      matchHour?.precipitationProbability !== null &&
      matchHour?.precipitationProbability !== undefined
    ) {
      return matchHour.precipitationProbability;
    }
    return weather?.daily[0]?.precipitationProbabilityMax ?? null;
  }, [weather]);

  const vnHour = getVietnamHour();
  const current = weather?.current;
  const isNight =
    current?.isDay == null
      ? isNightHour(current ? Number(current.time.slice(11, 13)) : vnHour)
      : !current.isDay;
  const activeAtmosphere: WeatherAtmosphere =
    previewMode !== "auto"
      ? previewMode
      : resolveAtmosphere(
          weather?.current?.weatherCode ?? todayDaily?.weatherCode,
          isNight,
        );

  const readiness = weather
    ? getTravelReadiness(weather, effectiveRainProb)
    : null;

  const handleSelectPreset = (preset: WeatherPlacePreset) => {
    setSelectedPlace(preset.name);
    setSelectedPlaceId(preset.placeId);
  };

  const scrollHourly = (delta: number) => {
    hourlyScrollRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  };

  const scrollStations = (delta: number) => {
    stationScrollRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <div
      data-navbar-overlay="true"
      className="relative flex min-h-screen flex-col text-[#FFFDF5]"
    >
      <WeatherBackdrop atmosphere={activeAtmosphere} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-24 pb-16 sm:px-6 lg:px-8">
        {/* Observatory Top Command Bar */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-[#E6D9B7]/26 bg-[#061822]/75 px-3.5 py-1.5 text-xs font-semibold text-[#E6D9B7] backdrop-blur-xl">
            <span className="h-2 w-2 rounded-full bg-[#2DD4BF] shadow-[0_0_8px_#2DD4BF]" />
            <Compass className="h-3.5 w-3.5 text-[#E87B39]" />
            <span>Giờ Việt Nam (UTC+7) · Dự báo 7 ngày</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Atmosphere Preview Switcher */}
            <div className="inline-flex items-center gap-0.5 rounded-full border border-[#E6D9B7]/22 bg-[#061822]/75 p-1 backdrop-blur-xl">
              {ATMOSPHERE_OPTIONS.map((opt) => {
                const isSelected = previewMode === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setPreviewMode(opt.key)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#E6D9B7] text-[#05141C] shadow-sm"
                        : "text-[#B4CED4] hover:text-[#FFFDF5]"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => void loadWeather(selectedPlace, selectedPlaceId)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#E6D9B7]/26 bg-[#061822]/78 px-3.5 py-1.5 text-xs font-semibold text-[#FFFDF5] backdrop-blur-xl transition-colors hover:border-[#2DD4BF]/55 hover:bg-[#092331]/90 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-[#2DD4BF] ${loading ? "animate-spin" : ""}`} />
              Làm mới
            </button>
          </div>
        </div>

        {/* Station Selector Ribbon */}
        {places.length > 0 && (
          <div className="mb-6 flex items-center gap-1.5 rounded-2xl border border-[#E6D9B7]/18 bg-[#061822]/64 p-2 backdrop-blur-xl">
            <div
              ref={stationScrollRef}
              className="hide-scrollbar flex flex-1 items-center gap-1.5 overflow-x-auto pb-0.5"
            >
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
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? "border-[#E87B39]/80 bg-gradient-to-r from-[#E87B39] to-[#D46525] text-[#FFFDF5] shadow-[0_6px_18px_rgba(232,123,57,0.32)]"
                        : "border-transparent bg-white/[0.04] text-[#C6DCE1] hover:border-[#E6D9B7]/26 hover:bg-white/[0.08] hover:text-[#FFFDF5]"
                    }`}
                  >
                    <MapPin
                      className={`h-3.5 w-3.5 ${
                        isActive ? "text-[#FFFDF5]" : "text-[#2DD4BF]"
                      }`}
                    />
                    {preset.name}
                  </button>
                );
              })}
            </div>
            <div className="hidden shrink-0 items-center gap-1 border-l border-[#E6D9B7]/14 pl-2 sm:flex">
              <button
                type="button"
                aria-label="Cuộn danh sách địa điểm sang trái"
                onClick={() => scrollStations(-260)}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#E6D9B7]/18 bg-white/[0.04] text-[#D6E6EA] transition-colors hover:border-[#2DD4BF]/50 hover:bg-[#2DD4BF]/12 hover:text-[#FFFDF5] cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Cuộn danh sách địa điểm sang phải"
                onClick={() => scrollStations(260)}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#E6D9B7]/18 bg-white/[0.04] text-[#D6E6EA] transition-colors hover:border-[#2DD4BF]/50 hover:bg-[#2DD4BF]/12 hover:text-[#FFFDF5] cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && !weather && (
          <div className="space-y-5 animate-pulse">
            <div className="h-64 rounded-[28px] border border-[#E6D9B7]/16 bg-[#061822]/65 backdrop-blur-xl" />
            <div className="h-44 rounded-[24px] border border-[#E6D9B7]/16 bg-[#061822]/65 backdrop-blur-xl" />
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
              <div className="h-80 rounded-[24px] bg-[#061822]/65 lg:col-span-7" />
              <div className="h-80 rounded-[24px] bg-[#061822]/65 lg:col-span-5" />
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="mb-6 flex flex-col justify-between gap-4 rounded-3xl border border-rose-300/35 bg-rose-950/70 p-6 text-white backdrop-blur-xl sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-300" />
              <div>
                <h2 className="text-base font-bold">
                  Không tải được dữ liệu thời tiết
                </h2>
                <p className="mt-1 text-sm text-rose-100">{error}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void loadWeather(selectedPlace, selectedPlaceId)}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-rose-950 transition-colors hover:bg-rose-50 cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              Thử lại
            </button>
          </div>
        )}

        {weather && (
          <div className="space-y-5">
            {/* Hero Telemetry Observatory Stage */}
            <section className="relative overflow-hidden rounded-[28px] border border-[#E6D9B7]/24 bg-[#061822]/68 p-6 sm:p-8 shadow-[0_28px_80px_rgba(0,0,0,0.42)] backdrop-blur-2xl">
              {/* Leica architectural corner hairlines */}
              <div className="pointer-events-none absolute top-4 left-4 h-3.5 w-3.5 rounded-tl-[4px] border-t border-l border-[#E6D9B7]/42" />
              <div className="pointer-events-none absolute top-4 right-4 h-3.5 w-3.5 rounded-tr-[4px] border-t border-r border-[#E6D9B7]/42" />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_at_top_left,rgba(45,212,191,0.12),transparent_60%)]" />

              <div className="relative grid grid-cols-1 gap-7 lg:grid-cols-12 lg:items-center">
                {/* Left: Monumental Live Reading */}
                <div className="lg:col-span-7">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E6D9B7]/28 bg-[#E6D9B7]/10 px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[#E6D9B7]">
                      {weather.location.scope === "PLACE"
                        ? "Tọa độ điểm du lịch"
                        : "Mốc trung tâm thành phố"}
                    </span>
                    <span className="rounded-full border border-[#2DD4BF]/25 bg-[#2DD4BF]/10 px-2.5 py-1 font-mono text-[10.5px] text-[#5EEAD4]">
                      {weather.location.latitude.toFixed(4)}° N ·{" "}
                      {weather.location.longitude.toFixed(4)}° E
                    </span>
                  </div>

                  <h1 className="cinematic-condensed mt-3 text-3xl font-bold uppercase tracking-tight text-[#FFFDF5] sm:text-4xl lg:text-[46px] leading-[1.06]">
                    {weather.location.name}
                  </h1>

                  {weather.current ? (
                    <div className="mt-5 flex flex-wrap items-center gap-5 sm:gap-7">
                      <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#E6D9B7]/22 bg-[#041118]/75 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:h-20 sm:w-20">
                          <WeatherCodeIcon
                            code={weather.current.weatherCode}
                            isNight={isNight}
                            className="h-10 w-10 sm:h-12 sm:w-12"
                          />
                        </div>
                        <span className="text-7xl font-extralight leading-none tracking-tighter text-[#FFFDF5] tabular-nums sm:text-[84px]">
                          {weather.current.temperature !== null
                            ? `${Math.round(weather.current.temperature)}°`
                            : "—"}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xl font-bold text-[#FFFDF5] sm:text-2xl">
                          {weather.current.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                          {todayDaily && (
                            <span className="rounded-full border border-white/14 bg-white/[0.06] px-3 py-1 text-[#E4F0F2]">
                              Cao{" "}
                              <b className="text-[#F0B47C]">
                                {todayDaily.tempMax !== null
                                  ? `${Math.round(todayDaily.tempMax)}°`
                                  : "—"}
                              </b>{" "}
                              · Thấp{" "}
                              <b className="text-[#7DD3FC]">
                                {todayDaily.tempMin !== null
                                  ? `${Math.round(todayDaily.tempMin)}°`
                                  : "—"}
                              </b>
                            </span>
                          )}
                          {weather.current.apparentTemperature !== null && (
                            <span className="rounded-full border border-[#E6D9B7]/22 bg-[#E6D9B7]/10 px-3 py-1 text-[#E6D9B7]">
                              Cảm giác như{" "}
                              {Math.round(weather.current.apparentTemperature)}°
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-[#B4CED4]">
                      Hiện chưa có dữ liệu thời tiết hiện tại từ nhà cung cấp.
                    </p>
                  )}

                  <p className="mt-5 text-xs text-[#9AB6BF]">
                    {weather.location.areaLabel} · Cập nhật lúc{" "}
                    <span className="font-semibold text-[#D6E6EA]">
                      {formatViDateTime(weather.fetchedAt)}
                    </span>
                  </p>
                </div>

                {/* Right: Travel Readiness + Quick Readout Grid */}
                <div className="space-y-3 lg:col-span-5">
                  {readiness && (
                    <div
                      className={`rounded-2xl border p-4 backdrop-blur-xl ${
                        readiness.tone === "rain"
                          ? "border-sky-300/30 bg-[#072030]/82"
                          : readiness.tone === "hot"
                            ? "border-[#E87B39]/38 bg-[#22160E]/75"
                            : "border-[#2DD4BF]/32 bg-[#072329]/80"
                      }`}
                    >
                      <div className="mb-1.5 flex items-center gap-2">
                        <ShieldCheck
                          className={`h-4 w-4 ${
                            readiness.tone === "rain"
                              ? "text-[#7DD3FC]"
                              : readiness.tone === "hot"
                                ? "text-[#F0B47C]"
                                : "text-[#5EEAD4]"
                          }`}
                        />
                        <span className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-[#E6D9B7]">
                          {readiness.badge}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-[#FFFDF5]">
                        {readiness.title}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-[#B4CED4]">
                        {readiness.advice}
                      </p>
                    </div>
                  )}

                  {/* Quick-glance 4-stat telemetry bar */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-xl border border-[#E6D9B7]/14 bg-[#041118]/75 px-3.5 py-2.5">
                      <span className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#8FB0BA]">
                        <Umbrella className="h-3.5 w-3.5 text-[#7DD3FC]" />
                        Xác suất mưa
                      </span>
                      <p className="mt-1 text-lg font-bold text-[#FFFDF5] tabular-nums">
                        {effectiveRainProb !== null
                          ? `${Math.round(effectiveRainProb)}%`
                          : "—"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#E6D9B7]/14 bg-[#041118]/75 px-3.5 py-2.5">
                      <span className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#8FB0BA]">
                        <Droplets className="h-3.5 w-3.5 text-[#5EEAD4]" />
                        Độ ẩm
                      </span>
                      <p className="mt-1 text-lg font-bold text-[#FFFDF5] tabular-nums">
                        {formatNumber(weather.current?.humidity, "%")}
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#E6D9B7]/14 bg-[#041118]/75 px-3.5 py-2.5">
                      <span className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#8FB0BA]">
                        <Wind className="h-3.5 w-3.5 text-[#E6D9B7]" />
                        Tốc độ gió
                      </span>
                      <p className="mt-1 text-lg font-bold text-[#FFFDF5] tabular-nums">
                        {weather.current?.windSpeed !== null &&
                        weather.current?.windSpeed !== undefined
                          ? `${Math.round(weather.current.windSpeed)} km/h`
                          : "—"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#E6D9B7]/14 bg-[#041118]/75 px-3.5 py-2.5">
                      <span className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#8FB0BA]">
                        <CloudRain className="h-3.5 w-3.5 text-[#F0B47C]" />
                        Mưa cả ngày
                      </span>
                      <p className="mt-1 text-lg font-bold text-[#FFFDF5] tabular-nums">
                        {formatNumber(todayDaily?.precipitationSum, " mm")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Stale Cache Banner */}
            {weather.stale && (
              <div className="flex items-start gap-3 rounded-2xl border border-amber-300/35 bg-amber-950/55 px-4 py-3 text-sm text-amber-100 backdrop-blur-xl">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                <div>
                  <span className="font-semibold">
                    Đang hiển thị dữ liệu cache cũ:{" "}
                  </span>
                  {weather.staleReason ??
                    `Dữ liệu được lấy lúc ${formatViDateTime(weather.fetchedAt)}.`}
                </div>
              </div>
            )}

            {/* 3-State Alert Banner */}
            {weather.alerts.state === "ACTIVE" && (
              <div className="rounded-3xl border border-rose-300/40 bg-rose-950/65 p-5 text-white backdrop-blur-xl">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-300" />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-bold">
                        Cảnh báo thời tiết nguy hiểm
                      </span>
                      <span className="rounded-full bg-rose-500/40 px-2.5 py-0.5 text-xs font-semibold">
                        {weather.alerts.scope}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-rose-100">
                      {weather.alerts.message}
                    </p>
                    <div className="mt-3 space-y-2">
                      {weather.alerts.items.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-2xl border border-white/10 bg-black/25 p-3 text-sm"
                        >
                          <p className="font-semibold">
                            {item.event} — {item.area}
                          </p>
                          <p className="mt-0.5 text-xs text-rose-200">
                            Hiệu lực: {formatViDateTime(item.effectiveFrom)} →{" "}
                            {formatViDateTime(item.effectiveTo)} · Nguồn:{" "}
                            {item.source}
                          </p>
                          {item.description && (
                            <p className="mt-1 text-white/90">
                              {item.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {weather.alerts.state === "NONE" && (
              <div className="flex items-center gap-3 rounded-2xl border border-[#2DD4BF]/30 bg-[#062024]/75 px-4 py-3 text-xs text-[#CCFBF1] backdrop-blur-xl sm:text-sm">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#2DD4BF]" />
                <span>
                  {weather.alerts.message} (Nguồn: {weather.alerts.source})
                </span>
              </div>
            )}

            {weather.alerts.state === "UNAVAILABLE" && (
              <div className="flex items-start gap-3 rounded-2xl border border-[#E6D9B7]/18 bg-[#061822]/72 px-4 py-3 text-xs text-[#C6DCE1] backdrop-blur-xl sm:text-sm">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#7DD3FC]" />
                <div>
                  <span className="font-semibold text-[#FFFDF5]">
                    Cảnh báo thiên tai:{" "}
                  </span>
                  {weather.alerts.message}
                </div>
              </div>
            )}

            {/* Hourly Forecast Frosted Observatory Strip */}
            <section className="rounded-[24px] border border-[#E6D9B7]/20 bg-[#061822]/74 p-4 sm:p-5 shadow-[0_20px_50px_rgba(0,0,0,0.34)] backdrop-blur-2xl">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#E6D9B7]/14 pb-3">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-[#E6D9B7]">
                    Dự báo theo giờ{" "}
                    {selectedDaily ? `· ${selectedDaily.dayLabel}` : ""}
                  </h2>
                  {selectedDaily && (
                    <p className="mt-1 text-xs text-[#9AB6BF]">
                      Tổng mưa ngày:{" "}
                      <b className="text-[#FFFDF5]">
                        {formatNumber(selectedDaily.precipitationSum, " mm")}
                      </b>{" "}
                      · Gió tối đa:{" "}
                      <b className="text-[#FFFDF5]">
                        {formatNumber(selectedDaily.windSpeedMax, " km/h")}
                      </b>
                    </p>
                  )}
                </div>

                {/* Desktop horizontal scroll controls */}
                <div className="hidden items-center gap-1.5 sm:flex">
                  <button
                    type="button"
                    aria-label="Cuộn sang trái"
                    onClick={() => scrollHourly(-320)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E6D9B7]/22 bg-white/[0.04] text-[#D6E6EA] transition-colors hover:border-[#2DD4BF]/50 hover:bg-[#2DD4BF]/12 hover:text-[#FFFDF5] cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Cuộn sang phải"
                    onClick={() => scrollHourly(320)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E6D9B7]/22 bg-white/[0.04] text-[#D6E6EA] transition-colors hover:border-[#2DD4BF]/50 hover:bg-[#2DD4BF]/12 hover:text-[#FFFDF5] cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {hourlyForSelectedDate.length === 0 ? (
                <p className="py-6 text-center text-sm text-[#9AB6BF]">
                  Không có dữ liệu theo giờ cho ngày đã chọn.
                </p>
              ) : (
                <div
                  ref={hourlyScrollRef}
                  className="hide-scrollbar flex gap-2.5 overflow-x-auto pb-1"
                >
                  {hourlyForSelectedDate.map((h) => {
                    const isCurrentHour =
                      h.date === weather.daily[0]?.date && h.hour === vnHour;
                    const rainChance =
                      h.precipitationProbability !== null
                        ? Math.round(h.precipitationProbability)
                        : 0;
                    return (
                      <div
                        key={h.time}
                        ref={isCurrentHour ? currentHourCardRef : undefined}
                        className={`flex min-w-[88px] shrink-0 flex-col items-center rounded-2xl border px-3 py-3.5 text-center transition-all ${
                          isCurrentHour
                            ? "border-[#E87B39]/80 bg-[#E87B39]/18 shadow-[0_10px_24px_rgba(232,123,57,0.22)]"
                            : "border-white/[0.08] bg-[#041118]/72 hover:border-[#E6D9B7]/30 hover:bg-[#09202D]/85"
                        }`}
                      >
                        <span
                          className={`text-xs font-bold ${
                            isCurrentHour ? "text-[#F0B47C]" : "text-[#FFFDF5]"
                          }`}
                        >
                          {isCurrentHour ? "Bây giờ" : h.hourLabel}
                        </span>
                        <span className="mt-0.5 text-[10.5px] font-medium text-[#8FB0BA]">
                          {PERIOD_LABEL[h.period]}
                        </span>

                        <div className="my-2.5">
                          <WeatherCodeIcon
                            code={h.weatherCode}
                            isNight={
                              h.isDay == null ? isNightHour(h.hour) : !h.isDay
                            }
                            className="h-7 w-7"
                          />
                        </div>

                        {/* Visual Rain Probability Bar */}
                        <div className="mb-1.5 w-full space-y-1">
                          <span
                            className={`block text-[11px] font-bold tabular-nums ${
                              rainChance > 0
                                ? "text-[#7DD3FC]"
                                : "text-transparent"
                            }`}
                          >
                            {rainChance}%
                          </span>
                          <div className="mx-auto h-1 w-10 overflow-hidden rounded-full bg-white/[0.08]">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#38BDF8] to-[#2DD4BF]"
                              style={{ width: `${rainChance}%` }}
                            />
                          </div>
                        </div>

                        <span className="text-base font-extrabold text-[#FFFDF5] tabular-nums">
                          {h.temperature !== null
                            ? `${Math.round(h.temperature)}°`
                            : "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* 2-Column Bento Observatory: 7-Day Forecast + Detailed Telemetry */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
              {/* Left: 7-Day Forecast */}
              <section className="rounded-[24px] border border-[#E6D9B7]/20 bg-[#061822]/76 p-4 sm:p-5 shadow-[0_20px_50px_rgba(0,0,0,0.34)] backdrop-blur-2xl lg:col-span-7">
                <div className="mb-3 flex items-center justify-between border-b border-[#E6D9B7]/14 pb-3">
                  <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#E6D9B7]">
                    <Calendar className="h-4 w-4 text-[#E87B39]" />
                    Dự báo {weather.daily.length} ngày tới
                  </h2>
                  <span className="text-xs text-[#8FB0BA]">
                    Bấm chọn ngày để xem theo giờ
                  </span>
                </div>

                <div className="space-y-1.5">
                  {weather.daily.map((day) => {
                    const isSelected = day.date === selectedDaily?.date;
                    const minVal = day.tempMin ?? tempBounds.min;
                    const maxVal = day.tempMax ?? tempBounds.max;
                    const span = tempBounds.max - tempBounds.min;
                    const leftPct = Math.max(
                      0,
                      Math.min(100, ((minVal - tempBounds.min) / span) * 100),
                    );
                    const widthPct = Math.max(
                      10,
                      Math.min(100 - leftPct, ((maxVal - minVal) / span) * 100),
                    );

                    return (
                      <button
                        key={day.date}
                        type="button"
                        onClick={() => setSelectedDate(day.date)}
                        className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all cursor-pointer ${
                          isSelected
                            ? "border-[#E87B39]/65 bg-[#E87B39]/14 shadow-[0_6px_20px_rgba(232,123,57,0.16)]"
                            : "border-transparent bg-white/[0.02] hover:border-[#E6D9B7]/20 hover:bg-white/[0.06]"
                        }`}
                      >
                        <div className="w-24 shrink-0 sm:w-28">
                          <div className="truncate text-sm font-bold text-[#FFFDF5]">
                            {day.dayLabel.split("(")[0]?.trim()}
                          </div>
                          <div className="text-[11px] font-medium text-[#8FB0BA]">
                            {formatShortDate(day.date)}
                          </div>
                        </div>

                        <div className="flex w-20 shrink-0 items-center gap-2">
                          <WeatherCodeIcon
                            code={day.weatherCode}
                            className="h-6 w-6 shrink-0"
                          />
                          <span className="text-xs font-bold text-[#7DD3FC] tabular-nums">
                            {day.precipitationProbabilityMax !== null
                              ? `${Math.round(day.precipitationProbabilityMax)}%`
                              : "—"}
                          </span>
                        </div>

                        <div className="flex min-w-0 flex-1 items-center gap-2.5">
                          <span className="w-8 shrink-0 text-right text-sm font-semibold text-[#9AB6BF] tabular-nums">
                            {day.tempMin !== null
                              ? `${Math.round(day.tempMin)}°`
                              : "—"}
                          </span>
                          <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-[#041017]/90">
                            <div
                              className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-[#38BDF8] via-[#E6D9B7] to-[#E87B39]"
                              style={{
                                left: `${leftPct}%`,
                                width: `${widthPct}%`,
                              }}
                            />
                          </div>
                          <span className="w-8 shrink-0 text-sm font-extrabold text-[#FFFDF5] tabular-nums">
                            {day.tempMax !== null
                              ? `${Math.round(day.tempMax)}°`
                              : "—"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Right: Detailed Atmospheric Telemetry + Ask Gô */}
              <section className="grid grid-cols-2 content-start gap-3.5 lg:col-span-5">
                {/* Rain Probability Tile */}
                <div className="rounded-2xl border border-[#E6D9B7]/18 bg-[#061822]/78 p-4 backdrop-blur-2xl">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#E6D9B7]/85">
                    <Umbrella className="h-3.5 w-3.5 text-[#7DD3FC]" />
                    Khả năng mưa
                  </div>
                  <div className="mt-2 text-3xl font-extrabold text-[#FFFDF5] tabular-nums">
                    {effectiveRainProb !== null
                      ? `${Math.round(effectiveRainProb)}%`
                      : "—"}
                  </div>
                  <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#38BDF8] to-[#2DD4BF]"
                      style={{
                        width: `${Math.min(100, Math.max(0, effectiveRainProb ?? 0))}%`,
                      }}
                    />
                  </div>
                  <p className="mt-2 text-[11.5px] text-[#8FB0BA]">
                    {weather.current?.precipitationProbability === null &&
                    effectiveRainProb !== null
                      ? "Theo khung giờ hiện tại"
                      : "Xác suất có mưa"}
                  </p>
                </div>

                {/* Rainfall Tile */}
                <div className="rounded-2xl border border-[#E6D9B7]/18 bg-[#061822]/78 p-4 backdrop-blur-2xl">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#E6D9B7]/85">
                    <CloudRain className="h-3.5 w-3.5 text-[#38BDF8]" />
                    Lượng mưa
                  </div>
                  <div className="mt-2 text-3xl font-extrabold text-[#FFFDF5] tabular-nums">
                    {formatNumber(weather.current?.precipitation, " mm")}
                  </div>
                  <p className="mt-3 text-[11.5px] text-[#9AB6BF]">
                    Cả ngày:{" "}
                    <b className="text-[#FFFDF5]">
                      {formatNumber(todayDaily?.precipitationSum, " mm")}
                    </b>
                  </p>
                </div>

                {/* Wind Tile */}
                <div className="rounded-2xl border border-[#E6D9B7]/18 bg-[#061822]/78 p-4 backdrop-blur-2xl">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#E6D9B7]/85">
                    <Wind className="h-3.5 w-3.5 text-[#5EEAD4]" />
                    Gió
                  </div>
                  <div className="mt-2 text-3xl font-extrabold text-[#FFFDF5] tabular-nums">
                    {weather.current?.windSpeed !== null &&
                    weather.current?.windSpeed !== undefined
                      ? `${Math.round(weather.current.windSpeed)} km/h`
                      : "—"}
                  </div>
                  <p className="mt-3 text-[11.5px] text-[#9AB6BF]">
                    Gió giật:{" "}
                    <b className="text-[#FFFDF5]">
                      {formatNumber(weather.current?.windGusts, " km/h")}
                    </b>
                  </p>
                </div>

                {/* Humidity Tile */}
                <div className="rounded-2xl border border-[#E6D9B7]/18 bg-[#061822]/78 p-4 backdrop-blur-2xl">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#E6D9B7]/85">
                    <Droplets className="h-3.5 w-3.5 text-[#2DD4BF]" />
                    Độ ẩm
                  </div>
                  <div className="mt-2 text-3xl font-extrabold text-[#FFFDF5] tabular-nums">
                    {formatNumber(weather.current?.humidity, "%")}
                  </div>
                  <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#2DD4BF] to-[#E6D9B7]"
                      style={{
                        width: `${Math.min(100, Math.max(0, weather.current?.humidity ?? 0))}%`,
                      }}
                    />
                  </div>
                  <p className="mt-2 flex items-center gap-1 text-[11.5px] text-[#8FB0BA]">
                    <Thermometer className="h-3 w-3 text-[#F0B47C]" />
                    Cảm giác:{" "}
                    <b className="text-[#FFFDF5]">
                      {weather.current?.apparentTemperature !== null &&
                      weather.current?.apparentTemperature !== undefined
                        ? `${Math.round(weather.current.apparentTemperature)}°C`
                        : "—"}
                    </b>
                  </p>
                </div>

                {/* Ask Gô Weather Concierge Card */}
                <div className="col-span-2 flex flex-col justify-between gap-4 rounded-2xl border border-[#E87B39]/35 bg-gradient-to-br from-[#0A2230]/92 via-[#091D29]/92 to-[#171B20]/90 p-5 shadow-[0_16px_38px_rgba(0,0,0,0.34)] backdrop-blur-2xl sm:flex-row sm:items-center">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.18em] text-[#E6D9B7]">
                      <Sparkles className="h-3.5 w-3.5 text-[#E87B39]" />
                      Trợ lý du lịch Gô
                    </div>
                    <p className="mt-1.5 text-sm font-semibold leading-snug text-[#FFFDF5]">
                      Cần đổi lịch trình sang điểm trong nhà hoặc hỏi mang gì khi
                      đi Đà Nẵng?
                    </p>
                  </div>
                  <Link
                    href="/chat"
                    className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#E87B39] to-[#D46525] px-4 py-2.5 text-sm font-bold text-[#FFFDF5] shadow-[0_10px_24px_rgba(232,123,57,0.32)] transition-all hover:brightness-110"
                  >
                    Hỏi trợ lý Gô
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </section>
            </div>

            {/* Attribution & Metadata */}
            <div className="pt-3 text-center text-xs text-[#9AB6BF]">
              <a
                href={weather.source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-[#E6D9B7]/40 transition-colors hover:text-[#FFFDF5]"
              >
                {weather.source.attribution}
              </a>{" "}
              ({weather.source.license}) · Tọa độ:{" "}
              {weather.location.latitude.toFixed(4)},{" "}
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
