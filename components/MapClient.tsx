'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix icon lỗi mặc định của leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component tự pan tới marker khi marker được chọn
function MapAutoPan({ selectedId, locations }: { selectedId: number | null, locations: any[] }) {
  const map = useMap();
  useEffect(() => {
    if (selectedId) {
      const loc = locations.find(l => l.id === selectedId);
      if (loc) {
        map.flyTo([loc.lat, loc.lng], 15, { duration: 1 });
      }
    }
  }, [selectedId, locations, map]);
  return null;
}

export default function MapClient({
  locations,
  selectedId,
  onSelect,
  zoomLevel,
  radius,
}: {
  locations: any[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  zoomLevel: number;
  radius: number;
}) {
  const mapRef = useRef<L.Map>(null);
  const center: [number, number] = [16.0544, 108.2022]; // Đà Nẵng Center

  // Cập nhật zoom từ bên ngoài nếu cần
  useEffect(() => {
    if (mapRef.current) {
      const currentZoom = mapRef.current.getZoom();
      // Ta mapping logic zoomLevel (0.5 -> 2) của UX cũ sang Zoom của Leaflet (12-16)
      const targetLeafletZoom = 13 + (zoomLevel - 1) * 2;
      if (Math.abs(currentZoom - targetLeafletZoom) > 0.5) {
        mapRef.current.setZoom(targetLeafletZoom);
      }
    }
  }, [zoomLevel]);

  // Tạo html marker custom
  const createCustomIcon = (loc: any, isSelected: boolean) => {
    const bg = loc.category === 'luutru' ? 'bg-blue-500' :
               loc.category === 'amthuc' ? 'bg-orange-500' :
               loc.category === 'diemdulich' ? 'bg-green-500' : 'bg-pink-500';
    const emoji = loc.category === 'luutru' ? '🏨' :
                  loc.category === 'amthuc' ? '🍜' :
                  loc.category === 'cafe' ? '☕' : '🗺️';
    
    // Scale marker khi selected
    const scaleClass = isSelected ? 'scale-125 z-50' : 'scale-100 hover:scale-110';
    const ringHtml = isSelected ? `<div class="absolute inset-0 rounded-full ${bg} opacity-40 animate-[ping_1.5s_ease-out_infinite]" style="transform: scale(2);"></div>` : '';
    const labelHtml = isSelected ? `<div class="absolute top-8 left-1/2 -translate-x-1/2 mt-1 bg-white text-[#0f2942] text-[10px] font-bold px-2 py-0.5 rounded shadow-md whitespace-nowrap">${loc.name}</div>` : '';

    const html = `
      <div class="relative flex flex-col items-center ${scaleClass} transition-transform duration-300">
        ${ringHtml}
        <div class="w-8 h-8 rounded-full ${bg} border-2 border-white shadow-lg flex items-center justify-center relative z-10">
          <span class="text-xs">${emoji}</span>
        </div>
        ${labelHtml}
      </div>
    `;

    return L.divIcon({
      html,
      className: 'custom-leaflet-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  };

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ width: '100%', height: '100%', zIndex: 0 }}
      ref={mapRef}
      zoomControl={false} // Tắt zoom control mặc định, dùng cái custom ở ngoài
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      
      {/* Vòng tròn bán kính */}
      <Marker position={center} opacity={0} /> 
      {/* (Có thể dùng L.circle nhưng CSS Radius ở ngoài UI layer overlay đã làm tốt việc này) */}

      <MapAutoPan selectedId={selectedId} locations={locations} />

      {locations.map((loc) => (
        <Marker
          key={loc.id}
          position={[loc.lat, loc.lng]}
          icon={createCustomIcon(loc, selectedId === loc.id)}
          eventHandlers={{
            click: () => onSelect(loc.id),
          }}
        />
      ))}
    </MapContainer>
  );
}
