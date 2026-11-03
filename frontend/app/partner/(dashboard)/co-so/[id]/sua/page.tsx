'use client';

import { use, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getPartnerPlaceById, getPartnerProfile } from '@/lib/api/partner';
import PlaceForm from '@/components/partner/PlaceForm';
import MenuManager from '@/components/partner/MenuManager';
import AccommodationForm from '@/components/partner/AccommodationForm';
import RoomManager from '@/components/partner/RoomManager';
import PartnerPageHeader from '@/components/partner/PartnerPageHeader';
import CtaBanner from '@/components/partner/CtaBanner';
import ScrollToTop from '@/components/partner/ScrollToTop';
import {
  Lock,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  Store,
  UtensilsCrossed,
  Bed,
} from 'lucide-react';
import Link from 'next/link';

function EditPlaceContent({ placeId }: { placeId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { data: profile, loading: loadingProfile } = useAsyncData(getPartnerProfile);
  const { data: place, loading: loadingPlace, error, reload } = useAsyncData(
    () => getPartnerPlaceById(placeId),
    [placeId]
  );

  const loading = loadingProfile || loadingPlace;

  const isAccommodation = place?.category === 'luutru' || place?.placeType === 'ACCOMMODATION';
  const paramTab = searchParams.get('tab');
  const activeTab = paramTab === 'rooms' || paramTab === 'menu' ? paramTab : 'info';

  const handleTabChange = (tab: 'info' | 'menu' | 'rooms') => {
    router.replace(`/partner/co-so/${place?.id || placeId}/sua?tab=${tab}`, { scroll: false });
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-500 font-semibold">
        <div className="w-9 h-9 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Đang tải dữ liệu cơ sở dịch vụ...
      </div>
    );
  }

  // Chặn sửa cơ sở nếu hồ sơ đối tác chưa được duyệt
  const isAccountLocked = profile?.status === 'PENDING' || profile?.status === 'REJECTED';
  if (isAccountLocked) {
    return (
      <div className="p-8 md:p-12 bg-white rounded-3xl border border-amber-200 text-center max-w-lg mx-auto shadow-xs space-y-4 my-8">
        <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Thao tác chỉnh sửa cơ sở bị khóa</h2>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Hồ sơ đối tác của bạn đang ở trạng thái{' '}
            <span className="font-bold text-amber-700">
              {profile?.status === 'PENDING' ? 'Chờ phê duyệt' : 'Chưa được phê duyệt'}
            </span>
            . Chỉ tài khoản đối tác đã được duyệt mới có quyền chỉnh sửa cơ sở dịch vụ.
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

  if (error || !place) {
    return (
      <div className="p-8 md:p-12 bg-white rounded-3xl border border-rose-200 text-center max-w-lg mx-auto shadow-xs space-y-4 my-8">
        <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Không tìm thấy cơ sở</h2>
          <p className="text-xs text-rose-600 mt-1">
            {error || 'Cơ sở này không tồn tại hoặc bạn không có quyền truy cập.'}
          </p>
        </div>
        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            onClick={reload}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md shadow-rose-600/20 active:scale-95"
          >
            <RefreshCw className="w-4 h-4" /> Thử lại
          </button>
          <Link
            href="/partner/co-so"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
          >
            Quay lại
          </Link>
        </div>
      </div>
    );
  }

  const isPlaceLocked = place.status === 'LOCKED';
  const numericPlaceId = place.placeId ? place.placeId : parseInt(place.id) || 1;

  return (
    <div className="space-y-8">
      {/* Header trang */}
      <PartnerPageHeader
        breadcrumbs={[
          { label: 'Partner', href: '/partner' },
          { label: 'Cơ sở của tôi', href: '/partner/co-so' },
          { label: `Chỉnh sửa: ${place.name}` },
        ]}
        title={`Chỉnh sửa: ${place.name}`}
        description={
          isAccommodation
            ? 'Quản lý thông tin chi tiết nơi lưu trú, tiện nghi và thiết lập bảng giá từng loại phòng.'
            : 'Quản lý thông tin chi tiết, tọa độ bản đồ, và danh sách thực đơn món ăn tự động đồng bộ giá.'
        }
        action={{
          label: 'Quay lại danh sách',
          href: '/partner/co-so',
          variant: 'secondary',
          icon: <ArrowLeft className="w-4 h-4" />,
        }}
      />

      {/* THANH ĐIỀU HƯỚNG TABS */}
      <div className="bg-white rounded-3xl p-2 border border-slate-200/80 shadow-xs inline-flex items-center gap-1.5 max-w-full overflow-x-auto">
        <button
          onClick={() => handleTabChange('info')}
          type="button"
          className={`relative px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 select-none ${
            activeTab === 'info'
              ? 'text-teal-950'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          {activeTab === 'info' && (
            <motion.div
              layoutId="partnerEditActiveTab"
              className="absolute inset-0 bg-teal-50 border border-teal-200 rounded-2xl shadow-xs"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <Store className="w-4 h-4 relative z-10 text-teal-600" />
          <span className="relative z-10">
            {isAccommodation ? 'Thông tin nơi lưu trú' : 'Thông tin cơ sở ẩm thực'}
          </span>
        </button>

        {isAccommodation ? (
          <button
            onClick={() => handleTabChange('rooms')}
            type="button"
            className={`relative px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 select-none ${
              activeTab === 'rooms'
                ? 'text-teal-950'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {activeTab === 'rooms' && (
              <motion.div
                layoutId="partnerEditActiveTab"
                className="absolute inset-0 bg-teal-50 border border-teal-200 rounded-2xl shadow-xs"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <Bed className="w-4 h-4 relative z-10 text-teal-600" />
            <span className="relative z-10">Loại phòng & Bảng giá</span>
          </button>
        ) : (
          <button
            onClick={() => handleTabChange('menu')}
            type="button"
            className={`relative px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 select-none ${
              activeTab === 'menu'
                ? 'text-teal-950'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {activeTab === 'menu' && (
              <motion.div
                layoutId="partnerEditActiveTab"
                className="absolute inset-0 bg-teal-50 border border-teal-200 rounded-2xl shadow-xs"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <UtensilsCrossed className="w-4 h-4 relative z-10 text-teal-600" />
            <span className="relative z-10">Thực đơn món ăn</span>
          </button>
        )}
      </div>

      {/* NỘI DUNG THEO TAB ĐANG CHỌN */}
      {activeTab === 'info' ? (
        isAccommodation ? (
          <AccommodationForm initialData={place} />
        ) : (
          <PlaceForm initialData={place} />
        )
      ) : isAccommodation ? (
        <RoomManager placeId={numericPlaceId} isLocked={isPlaceLocked} />
      ) : (
        <MenuManager
          placeId={numericPlaceId}
          placeName={place.name}
          isLocked={isPlaceLocked}
        />
      )}

      <CtaBanner />
      <ScrollToTop />
    </div>
  );
}

export default function EditPartnerPlacePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);

  return (
    <Suspense
      fallback={
        <div className="p-16 text-center text-slate-500 font-semibold">
          <div className="w-9 h-9 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Đang tải thông tin quán...
        </div>
      }
    >
      <EditPlaceContent placeId={resolvedParams.id} />
    </Suspense>
  );
}
