"use client";

import Link from "next/link";
import { Compass, MapPin } from "lucide-react";

export default function MapMiniPreview({
  locations,
  theme = "light",
}: {
  locations: string[];
  theme?: "light" | "dark";
}) {
  const uniqueLocations = [...new Set(locations)].filter(Boolean);
  const isDark = theme === "dark";

  if (isDark) {
    return (
      <div className="w-full min-h-44 rounded-2xl border border-[#E6D9B7]/14 bg-[#05141C]/85 p-4">
        <div className="mb-3.5 flex items-center justify-between gap-2">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#E6D9B7]/80">
            Tọa độ trong ngày
          </p>
          <span className="rounded-full border border-[#2DD4BF]/25 bg-[#2DD4BF]/10 px-2 py-0.5 text-[10px] font-semibold text-[#5EEAD4]">
            {uniqueLocations.length} điểm
          </span>
        </div>

        {uniqueLocations.length > 0 ? (
          <ul className="relative space-y-3 pl-1">
            {uniqueLocations.length > 1 && (
              <div className="pointer-events-none absolute left-[13px] top-3 bottom-3 w-px border-l border-dashed border-[#E6D9B7]/25" />
            )}
            {uniqueLocations.map((location, idx) => (
              <li
                key={location}
                className="relative flex items-start gap-2.5 text-[13px] leading-snug text-[#D6E6EA]"
              >
                <span className="relative z-10 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#E87B39]/45 bg-[#091E2A] text-[10px] font-bold text-[#F0B47C]">
                  {idx + 1}
                </span>
                <span className="min-w-0 flex-1">{location}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <MapPin className="mb-2 h-5 w-5 text-[#7DA0AC]/60" />
            <p className="text-xs text-[#8FB0BA]">
              Chọn quán ăn hoặc điểm đến để hiện tuyến tọa độ trong ngày.
            </p>
          </div>
        )}

        <Link
          href="/bando"
          className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#E6D9B7]/18 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-[#E6D9B7] transition-colors hover:border-[#2DD4BF]/45 hover:bg-[#2DD4BF]/10 hover:text-[#FFFDF5]"
        >
          <Compass className="h-3.5 w-3.5 text-[#2DD4BF]" />
          Mở bản đồ khám phá Đà Nẵng
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full min-h-48 bg-gray-50 rounded-xl border border-gray-200 p-4">
      <p className="text-xs font-semibold text-gray-500 mb-3">
        Khu vực trong lịch trình
      </p>
      <ul className="space-y-3">
        {uniqueLocations.map((location) => (
          <li key={location} className="flex items-center gap-2 text-sm text-gray-700">
            <MapPin className="w-4 h-4 flex-shrink-0 text-orange-500" />
            {location}
          </li>
        ))}
        {uniqueLocations.length === 0 && (
          <li className="text-sm text-gray-500">Chưa có địa điểm cho ngày này.</li>
        )}
      </ul>
    </div>
  );
}
