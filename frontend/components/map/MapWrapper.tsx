'use client';

import dynamic from 'next/dynamic';

const DynamicMap = dynamic(() => import('./MapClient'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500">
      Đang tải bản đồ...
    </div>
  ),
});

export default function MapWrapper(props: any) {
  return <DynamicMap {...props} />;
}
