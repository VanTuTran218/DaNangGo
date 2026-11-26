'use client';

import dynamic from 'next/dynamic';
import type { MapClientProps } from './MapClient';

const DynamicMap = dynamic(() => import('./MapClient'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-[#071821] text-[#E6D9B7]">
      <div className="w-9 h-9 rounded-full border-2 border-[#E6D9B7]/25 border-t-[#E87B39] animate-spin" />
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#CBD9DA]/80">
        Đang khởi tạo bản đồ Đà Nẵng…
      </span>
    </div>
  ),
});

export default function MapWrapper(props: MapClientProps) {
  return <DynamicMap {...props} />;
}
