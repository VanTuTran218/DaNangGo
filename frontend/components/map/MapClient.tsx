'use client';

import { useEffect, useState } from 'react';
import { Circle, CircleMarker, MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { DANANG_CENTER, type Coordinates, type DrivingRoute, type MapLayer, type MapPlace } from '@/lib/map-navigation';

export interface MapClientProps {
  locations: MapPlace[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  zoomLevel: number;
  onZoomChange?: (zoom: number) => void;
  radius?: number;
  userPosition?: Coordinates | null;
  mapLayer?: MapLayer;
  route?: DrivingRoute | null;
  routeOrigin?: Coordinates;
  routeDestination?: MapPlace | null;
}

function MapResizeHandler() {
  const map = useMap();
  useEffect(() => {
    const resize = () => map.invalidateSize({ pan: false });
    const timer = window.setTimeout(resize, 200);
    // Cập nhật cả khi sidebar, breakpoint hoặc kích thước khung thay đổi.
    const observer = new ResizeObserver(resize);
    observer.observe(map.getContainer());
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [map]);
  return null;
}

function MapCamera({ selectedId, locations, userPosition, zoomLevel, onZoomChange, route }: MapClientProps) {
  const map = useMapEvents({ zoomend: () => onZoomChange?.(map.getZoom()) });
  const selected = locations.find(location => location.id === selectedId);
  const lat = selected?.lat;
  const lng = selected?.lng;

  useEffect(() => {
    if (map.getZoom() !== zoomLevel) map.setZoom(zoomLevel);
  }, [map, zoomLevel]);

  useEffect(() => {
    if (lat !== undefined && lng !== undefined) map.flyTo([lat, lng], 15, { duration: 1 });
  }, [map, lat, lng]);

  useEffect(() => {
    if (userPosition) map.flyTo(userPosition, 15, { duration: 1 });
  }, [map, userPosition]);

  useEffect(() => {
    if (!route) return;
    const fitRoute = () => {
      map.stop();
      map.fitBounds(L.latLngBounds(route.coordinates), {
        paddingTopLeft: [35, 180], paddingBottomRight: [60, 70], maxZoom: 16,
      });
    };
    fitRoute();
    map.on('resize', fitRoute);
    return () => { map.off('resize', fitRoute); };
  }, [map, route]);
  return null;
}

function BaseLayer({ layer }: { layer: MapLayer }) {
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [useFallback, setUseFallback] = useState(false);
  // CARTO yêu cầu khóa cho raster tiles; khi thiếu khóa dùng đường phố Esri.
  const cartoKey = process.env.NEXT_PUBLIC_CARTO_API_KEY?.trim();
  const useCarto = layer === 'street' && Boolean(cartoKey) && !useFallback;
  return (
    <>
      <TileLayer
        key={`${layer}-${useCarto}-${attempt}`}
        url={useCarto
          ? `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${encodeURIComponent(cartoKey!)}`
          : `https://server.arcgisonline.com/ArcGIS/rest/services/${layer === 'street' ? 'World_Street_Map' : 'World_Imagery'}/MapServer/tile/{z}/{y}/{x}`}
        subdomains={['a', 'b', 'c', 'd']}
        attribution={useCarto
          ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          : 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'}
        maxZoom={19}
        maxNativeZoom={useCarto ? 19 : 18}
        eventHandlers={{ tileerror: () => { if (useCarto) setUseFallback(true); else setFailed(true); } }}
      />
      {failed && (
        <div role="status" className="absolute bottom-12 left-3 right-16 z-[1000] rounded-xl bg-white/95 p-2 text-xs text-amber-800 shadow-md sm:right-auto sm:max-w-72">
          Một số ô bản đồ chưa tải được. Kiểm tra kết nối hoặc đổi lớp bản đồ.
          <button type="button" className="ml-2 font-bold underline" onClick={() => { setFailed(false); setAttempt(value => value + 1); }}>Tải lại</button>
        </div>
      )}
    </>
  );
}

function createPlaceIcon(place: MapPlace, selected: boolean) {
  const colors = { luutru: 'bg-blue-500', amthuc: 'bg-orange-500', diemdulich: 'bg-green-500', cafe: 'bg-pink-500' };
  const emoji = { luutru: '🏨', amthuc: '🍜', diemdulich: '🗺️', cafe: '☕' };
  const element = document.createElement('div');
  element.className = `relative flex flex-col items-center transition-transform ${selected ? 'scale-125' : 'hover:scale-110'}`;
  const pin = document.createElement('div');
  pin.className = `w-8 h-8 rounded-full ${colors[place.category]} border-2 border-white shadow-lg flex items-center justify-center text-xs`;
  pin.textContent = emoji[place.category];
  element.append(pin);
  if (selected) {
    const label = document.createElement('div');
    label.className = 'absolute top-9 left-1/2 -translate-x-1/2 bg-white text-[#0f2942] text-[10px] font-bold px-2 py-0.5 rounded shadow-md whitespace-nowrap';
    label.textContent = place.name;
    element.append(label);
  }
  return L.divIcon({ html: element, className: 'custom-leaflet-icon', iconSize: [32, 32], iconAnchor: [16, 16] });
}

export default function MapClient(props: MapClientProps) {
  const { locations, selectedId, onSelect, zoomLevel, radius, userPosition, mapLayer = 'street', route, routeOrigin, routeDestination } = props;
  const center = userPosition ?? DANANG_CENTER;
  const userIcon = L.divIcon({
    html: '<span class="map-user-dot"></span>', className: 'user-location-icon', iconSize: [18, 18], iconAnchor: [9, 9],
  });
  return (
    <MapContainer center={DANANG_CENTER} zoom={zoomLevel} minZoom={3} maxZoom={19} style={{ width: '100%', height: '100%', zIndex: 0 }} zoomControl={false}>
      <BaseLayer key={mapLayer} layer={mapLayer} />
      <MapResizeHandler />
      <MapCamera {...props} />
      {radius && <Circle center={center} radius={radius * 1000} pathOptions={{ color: '#0d9488', weight: 1.5, fillOpacity: 0.06, dashArray: '6 6', interactive: false }} />}
      {!userPosition && radius && <CircleMarker center={DANANG_CENTER} radius={5} pathOptions={{ color: 'white', fillColor: '#0f2942', fillOpacity: 1, weight: 2 }}><Tooltip>Trung tâm Đà Nẵng</Tooltip></CircleMarker>}
      {route && (
        <>
          <Polyline positions={route.coordinates} color="#0d9488" weight={5} opacity={0.9} />
          {routeOrigin && <CircleMarker center={routeOrigin} radius={6} pathOptions={{ color: 'white', fillColor: '#0d9488', fillOpacity: 1, weight: 2 }}><Tooltip>Điểm xuất phát</Tooltip></CircleMarker>}
        </>
      )}
      {userPosition && <Marker position={userPosition} icon={userIcon} title="Vị trí của bạn" zIndexOffset={1000}><Tooltip>Vị trí của bạn</Tooltip></Marker>}
      {locations.map(place => (
        <Marker key={place.id} position={[place.lat, place.lng]} title={place.name} alt={place.name} icon={createPlaceIcon(place, selectedId === place.id || routeDestination?.id === place.id)} zIndexOffset={selectedId === place.id ? 500 : 0} eventHandlers={{ click: () => onSelect(place.id) }} />
      ))}
      {routeDestination && !locations.some(place => place.id === routeDestination.id) && (
        <Marker position={[routeDestination.lat, routeDestination.lng]} title={routeDestination.name} icon={createPlaceIcon(routeDestination, true)}><Tooltip>Điểm đến: {routeDestination.name}</Tooltip></Marker>
      )}
    </MapContainer>
  );
}
