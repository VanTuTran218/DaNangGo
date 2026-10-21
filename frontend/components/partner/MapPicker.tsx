'use client';

import MapWrapper from '@/components/map/MapWrapper';
import { MapPin, Navigation } from 'lucide-react';

interface MapPickerProps {
  lat: number;
  lng: number;
  placeName?: string;
  onLatChange: (lat: number) => void;
  onLngChange: (lng: number) => void;
}

export default function MapPicker({
  lat,
  lng,
  placeName,
  onLatChange,
  onLngChange,
}: MapPickerProps) {
  return (
    <div className="space-y-4">
      {/* Ô nhập tọa độ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-teal-600" />
            Vĩ độ (Latitude)
          </label>
          <input
            type="number"
            step="0.000001"
            value={lat}
            onChange={(e) => onLatChange(Number(e.target.value))}
            placeholder="16.0544"
            className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-teal-600" />
            Kinh độ (Longitude)
          </label>
          <input
            type="number"
            step="0.000001"
            value={lng}
            onChange={(e) => onLngChange(Number(e.target.value))}
            placeholder="108.2022"
            className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all font-mono"
          />
        </div>
      </div>

      {/* Bản đồ Leaflet mini */}
      <div className="h-72 rounded-2xl overflow-hidden border border-slate-200/90 shadow-xs relative">
        <MapWrapper
          locations={[
            {
              id: 1,
              name: placeName || 'Vị trí cơ sở',
              lat,
              lng,
              category: 'amthuc',
            },
          ]}
          selectedId={1}
          onSelect={() => {}}
          zoomLevel={1}
          radius={5}
        />
        <div className="absolute top-3 left-3 z-[1000] bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm text-[11px] font-bold text-slate-700 flex items-center gap-1.5 pointer-events-none">
          <MapPin className="w-3.5 h-3.5 text-teal-600" />
          <span>Vị trí ghim trên bản đồ Đà Nẵng</span>
        </div>
      </div>
    </div>
  );
}
