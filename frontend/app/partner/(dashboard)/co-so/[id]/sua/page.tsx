'use client';

import { use } from 'react';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getPartnerPlaceById } from '@/lib/api/partner';
import PlaceForm from '@/components/partner/PlaceForm';

export default function EditPartnerPlacePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { data: place, loading, error, reload } = useAsyncData(
    () => getPartnerPlaceById(resolvedParams.id),
    [resolvedParams.id]
  );

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500 font-semibold">
        Đang tải thông tin cơ sở...
      </div>
    );
  }

  if (error || !place) {
    return (
      <div className="p-6 bg-red-50 rounded-2xl border border-red-200 text-red-700">
        <p className="font-semibold mb-2" role="alert">{error || 'Không tìm thấy cơ sở dịch vụ.'}</p>
        <button onClick={reload} className="px-4 py-2 bg-red-600 text-white rounded-xl font-semibold text-xs">
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa cơ sở: {place.name}</h1>
        <p className="text-sm text-gray-500">Cập nhật thông tin hình ảnh, dịch vụ và vị trí cơ sở.</p>
      </div>
      <PlaceForm initialData={place} />
    </div>
  );
}
