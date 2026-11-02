"use client";

import { MapPin } from "lucide-react";

export default function MapMiniPreview({ locations }: { locations: string[] }) {
  const uniqueLocations = [...new Set(locations)].filter(Boolean);
  return (
    <div className="w-full min-h-48 bg-gray-50 rounded-xl border border-gray-200 p-4">
      <p className="text-xs font-semibold text-gray-500 mb-3">Khu vực trong lịch trình</p>
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
