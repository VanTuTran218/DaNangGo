'use client';

import { use, Suspense } from 'react';
import Link from 'next/link';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getPartnerPlaceById } from '@/lib/api/partner';
import PlaceForm from '@/components/partner/PlaceForm';
import {
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

function AdminEditPlaceContent({ placeId }: { placeId: string }) {
  const { data: place, loading, error, reload } = useAsyncData(
    () => getPartnerPlaceById(placeId),
    [placeId]
  );

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-500 font-semibold">
        <div className="w-9 h-9 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Đang tải thông tin địa điểm (Admin Mode)...
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
          <h2 className="text-lg font-bold text-slate-900">Không tìm thấy địa điểm</h2>
          <p className="text-xs text-rose-600 mt-1">
            {error || 'Địa điểm không tồn tại hoặc hệ thống gặp sự cố khi tải dữ liệu.'}
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
            href="/admin/dia-diem"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
          >
            Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Admin */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-1">
            <Link href="/admin/dia-diem" className="hover:text-teal-600 transition-colors">
              Quản lý địa điểm
            </Link>
            <span>›</span>
            <span className="text-slate-700">Chỉnh sửa (Admin Portal)</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Chỉnh sửa: {place.name}</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin Portal
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tái sử dụng PlaceForm với quyền Quản trị viên (cho phép can thiệp quán bị khóa LOCKED và đổi Partner sở hữu).
          </p>
        </div>

        <Link
          href="/admin/dia-diem"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs transition-all self-start sm:self-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại</span>
        </Link>
      </div>

      {/* Tái sử dụng PlaceForm với prop isAdminMode={true} */}
      <PlaceForm initialData={place} isAdminMode={true} />
    </div>
  );
}

export default function AdminEditPlacePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);

  return (
    <Suspense
      fallback={
        <div className="p-16 text-center text-slate-500 font-semibold">
          <div className="w-9 h-9 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Đang nạp biểu mẫu...
        </div>
      }
    >
      <AdminEditPlaceContent placeId={resolvedParams.id} />
    </Suspense>
  );
}
