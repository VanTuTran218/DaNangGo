'use client';

import PlaceForm from '@/components/partner/PlaceForm';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getCurrentSubscription } from '@/lib/api/subscription';
import { AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function CreatePartnerPlacePage() {
  const { data: subData } = useAsyncData(getCurrentSubscription);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Thêm cơ sở dịch vụ mới</h1>
        <p className="text-sm text-gray-500">Nhập đầy đủ thông tin để gửi ban quản trị phê duyệt hiển thị.</p>
      </div>

      {subData && !subData.hasActiveSubscription && (
        <div role="alert" className="p-5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-gray-900">Yêu cầu gói hoạt động còn hiệu lực</h4>
              <p className="text-xs text-amber-800 leading-relaxed">
                Để đăng tải và đưa cơ sở dịch vụ vào hoạt động trên hệ thống DaNangGo, bạn cần có gói dịch vụ đối tác đang hoạt động.
              </p>
            </div>
          </div>
          <Link
            href="/partner/goi-dich-vu"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex-shrink-0"
          >
            Đăng ký gói <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      <PlaceForm />
    </div>
  );
}
