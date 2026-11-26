"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  Cloud,
  CloudDrizzle,
  CloudLightning,
  CloudRain,
  CloudSun,
  Droplets,
  Sun,
  Wind,
} from "lucide-react";
import { getWeather } from "@/lib/api/weather";
import type { NormalizedWeatherResponse } from "@/types/weather";

function MiniWeatherIcon({
  code,
  className = "w-4 h-4",
}: {
  code: number | null | undefined;
  className?: string;
}) {
  if (code === null || code === undefined) {
    return <CloudSun className={`${className} text-[#FBBF24]`} />;
  }
  if (code === 0 || code === 1) {
    return <Sun className={`${className} text-[#FBBF24]`} />;
  }
  if (code === 2) {
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
  return <CloudSun className={`${className} text-[#5EEAD4]`} />;
}

function getIconHaloStyle(code: number | null | undefined): string {
  if (code === 0 || code === 1 || code === 2) {
    return "bg-amber-400/18 border-amber-300/40";
  }
  if ((code !== null && code !== undefined && code >= 51 && code <= 82)) {
    return "bg-sky-400/18 border-sky-300/40";
  }
  if (code !== null && code !== undefined && code >= 95) {
    return "bg-indigo-400/20 border-indigo-300/40";
  }
  return "bg-[#2DD4BF]/18 border-[#2DD4BF]/38";
}

export default function WeatherFloatingButton() {
  const pathname = usePathname();
  const [weather, setWeather] = useState<NormalizedWeatherResponse | null>(null);

  useEffect(() => {
    let active = true;
    getWeather({ days: 1 })
      .then((res) => {
        if (active) setWeather(res);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  if (pathname === "/thoi-tiet" || pathname === "/chat") {
    return null;
  }

  const current = weather?.current;
  const today = weather?.daily?.[0];
  const temp = current?.temperature;
  const desc = current?.description;
  const isHomePage = pathname === "/";

  return (
    <div
      className={`group z-40 ${
        isHomePage
          ? "absolute top-[82px] right-4 sm:top-[90px] sm:right-6 lg:top-[96px] lg:right-[68px]"
          : "fixed top-[74px] right-4 sm:right-6"
      }`}
    >
      <Link
        href="/thoi-tiet"
        aria-label={
          desc && temp !== null && temp !== undefined
            ? `Thời tiết Đà Nẵng ${Math.round(temp)}°C, ${desc}. Bấm để xem chi tiết.`
            : "Xem thời tiết Đà Nẵng"
        }
        className="inline-flex items-center gap-2 rounded-full border border-[#E6D9B7]/45 bg-[#061822]/92 py-1.5 pl-1.5 pr-3 text-[#FFFDF5] shadow-[0_10px_28px_rgba(0,0,0,0.44),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-xl transition-all duration-250 hover:-translate-y-0.5 hover:border-[#2DD4BF]/70 hover:bg-[#081F2C]/96 hover:shadow-[0_14px_34px_rgba(0,0,0,0.52),0_0_20px_rgba(45,212,191,0.16)]"
      >
        {/* Glowing Weather Medallion */}
        <span
          className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-transform duration-250 group-hover:scale-105 ${getIconHaloStyle(
            current?.weatherCode,
          )}`}
        >
          <MiniWeatherIcon code={current?.weatherCode} className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#2DD4BF] ring-2 ring-[#061822]" />
        </span>

        {/* Crisp Temperature + Condition */}
        <div className="flex items-center gap-2">
          <span className="text-[13.5px] font-extrabold tracking-tight text-[#FFFDF5] tabular-nums">
            {temp !== null && temp !== undefined
              ? `${Math.round(temp)}°C`
              : "Đà Nẵng"}
          </span>

          <span className="hidden h-3.5 w-px bg-[#E6D9B7]/28 sm:block" />

          <span className="hidden max-w-[120px] truncate text-[11.5px] font-semibold text-[#E6D9B7] sm:inline">
            {desc || "Thời tiết"}
          </span>
        </div>

        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#2DD4BF] transition-transform duration-200 group-hover:translate-x-0.5" />
      </Link>

      {/* Bespoke Frosted Smoked-Glass Hover Popover (replaces native browser gray tooltip) */}
      <div
        role="tooltip"
        className="pointer-events-none invisible absolute top-full right-0 mt-2.5 w-64 origin-top-right translate-y-1.5 scale-[0.98] rounded-2xl border border-[#E6D9B7]/32 bg-[#061822]/96 p-3.5 text-left opacity-0 shadow-[0_22px_54px_rgba(0,0,0,0.62)] backdrop-blur-2xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:scale-100 group-focus-within:opacity-100"
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#E6D9B7]/85">
            Đà Nẵng · Hiện tại
          </span>
          <span className="rounded-full border border-[#2DD4BF]/30 bg-[#2DD4BF]/12 px-2 py-0.5 text-[9.5px] font-semibold text-[#5EEAD4]">
            Trực tiếp
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-2xl font-extrabold leading-none text-[#FFFDF5] tabular-nums">
              {temp !== null && temp !== undefined ? `${Math.round(temp)}°C` : "—"}
            </div>
            <p className="mt-1 text-xs font-semibold text-[#D6E6EA]">
              {desc || "Đang cập nhật thời tiết"}
            </p>
          </div>
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${getIconHaloStyle(
              current?.weatherCode,
            )}`}
          >
            <MiniWeatherIcon code={current?.weatherCode} className="h-6 w-6" />
          </div>
        </div>

        {(today || current?.humidity !== null || current?.windSpeed !== null) && (
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#E6D9B7]/14 pt-2.5 text-[11px] text-[#9AB6BF]">
            {today && (
              <div className="col-span-2 flex items-center justify-between text-[#D6E6EA]">
                <span>Biên độ ngày</span>
                <span className="font-bold text-[#E6D9B7] tabular-nums">
                  {today.tempMin !== null ? `${Math.round(today.tempMin)}°` : "—"} –{" "}
                  {today.tempMax !== null ? `${Math.round(today.tempMax)}°` : "—"}
                </span>
              </div>
            )}
            {current?.humidity !== null && current?.humidity !== undefined && (
              <div className="flex items-center gap-1">
                <Droplets className="h-3 w-3 text-[#7DD3FC]" />
                <span>Ẩm {Math.round(current.humidity)}%</span>
              </div>
            )}
            {current?.windSpeed !== null && current?.windSpeed !== undefined && (
              <div className="flex items-center justify-end gap-1">
                <Wind className="h-3 w-3 text-[#5EEAD4]" />
                <span>{Math.round(current.windSpeed)} km/h</span>
              </div>
            )}
          </div>
        )}

        <div className="mt-2.5 flex items-center justify-between border-t border-[#E6D9B7]/14 pt-2 text-[11px] font-semibold text-[#F0B47C]">
          <span>Xem dự báo 7 ngày</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </div>
  );
}
