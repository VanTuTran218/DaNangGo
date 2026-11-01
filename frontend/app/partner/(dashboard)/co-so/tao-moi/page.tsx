'use client';

import PlaceForm from '@/components/partner/PlaceForm';

export default function CreatePartnerPlacePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Thêm cơ sở dịch vụ mới</h1>
        <p className="text-sm text-gray-500">Nhập đầy đủ thông tin để gửi ban quản trị phê duyệt hiển thị.</p>
      </div>
      <PlaceForm />
    </div>
  );
}
