'use client';

import { useAsyncData } from '@/hooks/useAsyncData';
import { getPartnerProfile } from '@/lib/api/partner';
import PlaceForm from '@/components/partner/PlaceForm';
import PartnerPageHeader from '@/components/partner/PartnerPageHeader';
import CtaBanner from '@/components/partner/CtaBanner';
import ScrollToTop from '@/components/partner/ScrollToTop';
import { getCurrentSubscription } from '@/lib/api/subscription';
import { Lock, ArrowLeft, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function CreatePartnerPlacePage() {
  const { data: profile, loading } = useAsyncData(getPartnerProfile);
  const { data: subData } = useAsyncData(getCurrentSubscription);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 font-semibold">
        <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Đang kiểm tra quyền đối tác...
      </div>
    );
  }

  // Chặn tạo cơ sở nếu hồ sơ chưa được duyệt (Cách của Tuấn)
  const isLocked = profile?.status === 'PENDING' || profile?.status === 'REJECTED';
  if (isLocked) {
    return (
      <div className="p-8 md:p-12 bg-white rounded-3xl border border-amber-200 text-center max-w-lg mx-auto shadow-xs space-y-4 my-8">
        <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Tính năng thêm cơ sở đang bị khóa</h2>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Hồ sơ đối tác của bạn đang ở trạng thái{' '}
            <span className="font-bold text-amber-700">
              {profile?.status === 'PENDING' ? 'Chờ phê duyệt' : 'Chưa được phê duyệt'}
            </span>
            . Bạn cần được Quản trị viên duyệt hồ sơ trước khi có thể đăng ký và tạo cơ sở dịch vụ mới.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/partner/co-so"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-teal-600/20 active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách cơ sở
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PartnerPageHeader
        breadcrumbs={[
          { label: 'Partner', href: '/partner' },
          { label: 'Cơ sở của tôi', href: '/partner/co-so' },
          { label: 'Thêm quán mới' },
        ]}
        title="Thêm cơ sở ẩm thực mới"
        description="Điền đầy đủ các thông tin chi tiết của quán ăn, nhà hàng để gửi Ban quản trị tiếp nhận và phê duyệt hiển thị."
        action={{
          label: 'Quay lại danh sách',
          href: '/partner/co-so',
          variant: 'secondary',
          icon: <ArrowLeft className="w-4 h-4" />,
        }}
      />

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

      <CtaBanner />
      <ScrollToTop />
    </div>
  );
}
