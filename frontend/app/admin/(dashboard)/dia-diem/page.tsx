'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getAdminPlaces, updateAdminPlaceStatus, deleteAdminPlace } from '@/lib/api/admin';
import type { AdminPlaceItem, PlaceStatus } from '@/types/admin';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  Eye,
  Check,
  EyeOff,
  Trash2,
  X,
  MapPin,
  Pencil,
  Unlock,
  Building2,
  AlertCircle,
  CheckCircle2,
  Store,
  Filter,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const STATUS_TABS = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'PENDING', label: 'Chờ duyệt' },
  { key: 'APPROVED', label: 'Đang hoạt động' },
  { key: 'HIDDEN', label: 'Đã ẩn' },
  { key: 'LOCKED', label: 'Bị khóa' },
];

function AdminPlacesContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams?.get('status') || 'ALL';
  const initialSearch = searchParams?.get('search') || '';

  const [catFilter, setCatFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [selectedPlace, setSelectedPlace] = useState<AdminPlaceItem | null>(null);
  const [deletingPlace, setDeletingPlace] = useState<AdminPlaceItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const { data: places, loading, error, reload } = useAsyncData(
    () => getAdminPlaces({ category: catFilter, status: statusFilter }),
    [catFilter, statusFilter]
  );

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleUpdateStatus = async (placeId: string, status: PlaceStatus) => {
    setActionLoading(true);
    try {
      const res = await updateAdminPlaceStatus(placeId, status);
      showToast(res.message);
      if (selectedPlace && selectedPlace.id === placeId) {
        setSelectedPlace(null);
      }
      reload();
    } catch (err: any) {
      showToast(err?.message || 'Thao tác thất bại', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingPlace) return;
    setActionLoading(true);
    try {
      const res = await deleteAdminPlace(deletingPlace.id);
      showToast(res.message);
      setDeletingPlace(null);
      reload();
    } catch (err: any) {
      showToast(err?.message || 'Xóa thất bại', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Tính số lượng cơ sở chờ duyệt
  const pendingCount = useMemo(() => {
    if (!places) return 0;
    return places.filter((p) => p.status === 'PENDING').length;
  }, [places]);

  const columns: Column<AdminPlaceItem>[] = [
    {
      key: 'name',
      header: 'Cơ sở & Địa điểm',
      sortable: true,
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100 shadow-2xs">
            <Image src={p.imageUrl} alt={p.name} fill className="object-cover" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">{p.name}</p>
            <p className="text-xs text-gray-500 line-clamp-1">{p.address}</p>
            {p.partnerName ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md mt-1 border border-teal-100/60">
                <Building2 className="w-3 h-3 text-teal-600" /> {p.partnerName}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-md mt-1">
                Hệ thống tự tạo
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Phân loại',
      render: (p) => (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
          {p.category === 'luutru' ? '🏨 Lưu trú' : p.category === 'amthuc' ? '🍲 Ẩm thực' : '🎡 Điểm du lịch'}
        </span>
      ),
    },
    { key: 'priceText', header: 'Khoảng giá', render: (p) => <span className="text-xs font-medium text-slate-700">{p.priceText}</span> },
    { key: 'status', header: 'Trạng thái', render: (p) => <StatusBadge status={p.status} /> },
    {
      key: 'actions',
      header: 'Thao tác kiểm duyệt',
      render: (p) => (
        <div className="flex items-center gap-1.5">
          {/* Nút phê duyệt nổi bật cho quán PENDING */}
          {p.status === 'PENDING' && (
            <button
              onClick={() => handleUpdateStatus(p.id, 'APPROVED')}
              disabled={actionLoading}
              title="Phê duyệt cơ sở này (Chuyển sang ACTIVE để hiển thị)"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-all active:scale-95"
            >
              <Check className="w-3.5 h-3.5" /> Duyệt
            </button>
          )}

          {/* Nút mở khóa cho quán LOCKED */}
          {p.status === 'LOCKED' && (
            <button
              onClick={() => handleUpdateStatus(p.id, 'APPROVED')}
              disabled={actionLoading}
              title="Mở khóa cơ sở"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
            >
              <Unlock className="w-3.5 h-3.5" /> Mở khóa
            </button>
          )}

          {/* Xem chi tiết */}
          <button
            onClick={() => setSelectedPlace(p)}
            title="Xem chi tiết cơ sở"
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-teal-600 transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* Chỉnh sửa */}
          <Link
            href={`/admin/dia-diem/${p.id}/sua`}
            title="Chỉnh sửa thông tin cơ sở"
            className="p-1.5 rounded-lg text-slate-500 hover:bg-teal-50 hover:text-teal-600 transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </Link>

          {/* Ẩn / Hiện */}
          {p.status === 'APPROVED' || p.status === 'ACTIVE' ? (
            <button
              onClick={() => handleUpdateStatus(p.id, 'HIDDEN')}
              disabled={actionLoading}
              title="Tạm ẩn cơ sở"
              className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
            >
              <EyeOff className="w-4 h-4" />
            </button>
          ) : p.status === 'HIDDEN' ? (
            <button
              onClick={() => handleUpdateStatus(p.id, 'APPROVED')}
              disabled={actionLoading}
              title="Hiển thị lại cơ sở"
              className="p-1.5 rounded-lg text-teal-600 hover:bg-teal-50 transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
          ) : null}

          {/* Xóa */}
          <button
            onClick={() => setDeletingPlace(p)}
            title="Xóa vĩnh viễn cơ sở"
            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý & Duyệt cơ sở dịch vụ</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Kiểm duyệt các cơ sở ẩm thực, lưu trú do đối tác gửi lên và quản trị địa điểm toàn hệ thống DaNangGo.
          </p>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          role="alert"
          className={`p-4 rounded-xl border text-sm font-semibold flex items-center justify-between ${
            toast.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-teal-50 text-teal-700 border-teal-200'
          }`}
        >
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Alert Banner: Có cơ sở đối tác đang chờ duyệt */}
      {statusFilter !== 'PENDING' && pendingCount > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold">
                Có <span className="underline decoration-amber-500 decoration-2">{pendingCount} cơ sở mới</span> do đối tác gửi lên đang chờ kiểm duyệt
              </p>
              <p className="text-xs text-amber-700">
                Vui lòng kiểm tra thông tin để phê duyệt hiển thị trên bản đồ và ứng dụng du khách.
              </p>
            </div>
          </div>
          <button
            onClick={() => setStatusFilter('PENDING')}
            className="px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-all shadow-xs shrink-0 active:scale-95 cursor-pointer"
          >
            Lọc danh sách chờ duyệt ({pendingCount})
          </button>
        </div>
      )}

      {/* Tabs Filter theo trạng thái */}
      <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto pb-1">
        {STATUS_TABS.map((tab) => {
          const isPendingTab = tab.key === 'PENDING';
          const isActive = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span>{tab.label}</span>
              {isPendingTab && pendingCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    isActive ? 'bg-white text-teal-800' : 'bg-amber-500 text-white animate-pulse'
                  }`}
                >
                  {pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {error ? (
        <div className="p-6 bg-red-50 rounded-2xl border border-red-200 text-red-700">
          <p className="font-semibold mb-2" role="alert">{error}</p>
          <button onClick={reload} className="px-4 py-2 bg-red-600 text-white rounded-xl font-semibold text-xs">
            Thử lại
          </button>
        </div>
      ) : (
        <DataTable
          data={places || []}
          columns={columns}
          loading={loading}
          searchPlaceholder="Tìm theo tên cơ sở, địa chỉ, tên đối tác..."
          searchField={(p) => `${p.name} ${p.address} ${p.partnerName || ''}`}
          initialSearch={initialSearch}
          rowKey={(p) => p.id}
          filterSlot={
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium hidden sm:inline flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Lọc theo loại hình:
              </span>
              <select
                value={catFilter}
                onChange={(e) => setCatFilter(e.target.value)}
                className="px-3 py-2 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
              >
                <option value="ALL">Tất cả loại hình</option>
                <option value="amthuc">🍲 Ẩm thực</option>
                <option value="luutru">🏨 Lưu trú</option>
                <option value="diemdulich">🎡 Điểm du lịch</option>
              </select>
            </div>
          }
        />
      )}

      {/* Detail Modal */}
      {selectedPlace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-gray-100 relative space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedPlace(null)}
              className="absolute right-4 top-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-gray-100 mb-2">
              <Image src={selectedPlace.imageUrl} alt={selectedPlace.name} fill className="object-cover" />
              <div className="absolute top-3 left-3">
                <StatusBadge status={selectedPlace.status} />
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-teal-50 text-teal-600 shrink-0">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selectedPlace.name}</h3>
                <p className="text-xs text-teal-700 font-semibold mt-0.5">
                  Phân loại: {selectedPlace.category === 'amthuc' ? 'Ẩm thực' : selectedPlace.category === 'luutru' ? 'Lưu trú' : 'Điểm du lịch'}
                </p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-gray-700 pt-2 border-t border-gray-100">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
                <p className="flex items-center gap-1.5">
                  <span className="font-semibold text-gray-500 w-24">Doanh nghiệp:</span>
                  <span className="font-bold text-gray-900">{selectedPlace.partnerName || 'Chưa liên kết đối tác'}</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <span className="font-semibold text-gray-500 w-24">Địa chỉ:</span>
                  <span className="text-gray-900">{selectedPlace.address}</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <span className="font-semibold text-gray-500 w-24">Khoảng giá:</span>
                  <span className="text-teal-700 font-semibold">{selectedPlace.priceText}</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <span className="font-semibold text-gray-500 w-24">Đánh giá:</span>
                  <span>⭐ {selectedPlace.rating} ({selectedPlace.reviewCount} lượt đánh giá)</span>
                </p>
              </div>
            </div>

            {/* Thao tác duyệt ngay trong modal */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-100">
              <Link
                href={`/admin/dia-diem/${selectedPlace.id}/sua`}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors inline-flex items-center gap-1"
              >
                <Pencil className="w-3.5 h-3.5" /> Chỉnh sửa
              </Link>

              <div className="flex items-center gap-2">
                {selectedPlace.status === 'PENDING' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedPlace.id, 'APPROVED')}
                    disabled={actionLoading}
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Phê duyệt ngay
                  </button>
                )}
                <button
                  onClick={() => setSelectedPlace(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs rounded-xl cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingPlace)}
        onClose={() => setDeletingPlace(null)}
        onConfirm={handleDelete}
        title="Xóa địa điểm"
        description={`Bạn có chắc chắn muốn xóa địa điểm "${deletingPlace?.name}" khỏi hệ thống? Thao tác này không thể hoàn tác.`}
        variant="danger"
        confirmText="Xóa địa điểm"
        loading={actionLoading}
      />
    </div>
  );
}

export default function AdminPlacesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-gray-500">Đang tải danh sách cơ sở...</div>}>
      <AdminPlacesContent />
    </Suspense>
  );
}
