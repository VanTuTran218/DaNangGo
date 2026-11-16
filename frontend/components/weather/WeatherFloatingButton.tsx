"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cloud, CloudDrizzle, CloudLightning, CloudRain, CloudSun, Sun } from "lucide-react";
import { getWeather } from "@/lib/api/weather";
import type { NormalizedWeatherResponse } from "@/types/weather";

function MiniWeatherIcon({ code }: { code: number | null | undefined }) {
  if (code === null || code === undefined) return <CloudSun className="w-3.5 h-3.5 text-amber-400" />;
  if (code === 0 || code === 1) return <Sun className="w-3.5 h-3.5 text-amber-400" />;
  if (code === 2) return <CloudSun className="w-3.5 h-3.5 text-amber-400" />;
  if (code === 3 || code === 45 || code === 48) return <Cloud className="w-3.5 h-3.5 text-slate-300" />;
  if (code >= 51 && code <= 57) return <CloudDrizzle className="w-3.5 h-3.5 text-sky-300" />;
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return <CloudRain className="w-3.5 h-3.5 text-sky-400" />;
  if (code >= 95) return <CloudLightning className="w-3.5 h-3.5 text-indigo-300" />;
  return <CloudSun className="w-3.5 h-3.5 text-teal-300" />;
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

  const temp = weather?.current?.temperature;
  const desc = weather?.current?.description;

  return (
    <Link
      href="/thoi-tiet"
      aria-label="Xem thời tiết Đà Nẵng"
      title={desc ? `Thời tiết Đà Nẵng: ${desc}` : "Xem thời tiết Đà Nẵng"}
      className="fixed top-[72px] right-4 sm:right-6 z-40 inline-flex items-center gap-1.5 rounded-full bg-slate-900/55 backdrop-blur-md border border-white/20 px-2.5 py-1 text-white shadow-md shadow-black/20 hover:bg-slate-900/75 hover:border-teal-300/50 hover:-translate-y-0.5 transition-all group"
    >
      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-teal-400/20 border border-teal-300/30 group-hover:bg-teal-400/30 transition-colors">
        <MiniWeatherIcon code={weather?.current?.weatherCode} />
      </span>
      <div className="flex items-center gap-1 pr-0.5">
        <span className="text-[10px] font-medium text-white/75 uppercase tracking-wide hidden sm:inline">
          Thời tiết
        </span>
        <span className="text-xs font-bold text-white">
          {temp !== null && temp !== undefined ? `${Math.round(temp)}°C` : "Đà Nẵng"}
        </span>
      </div>
    </Link>
  );
}
