'use client';

import { useState } from 'react';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getAdminPlaces, updateAdminPlaceStatus, deleteAdminPlace } from '@/lib/api/admin';
import type { AdminPlaceItem, PlaceStatus } from '@/types/admin';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Eye, Check, EyeOff, Trash2, X, MapPin } from 'lucide-react';
import Image from 'next/image';

export default function AdminPlacesPage() {
  const [catFilter, setCatFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
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

  const columns: Column<AdminPlaceItem>[] = [
    {
      key: 'name',
      header: 'Địa điểm',
      sortable: true,
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
            <Image src={p.imageUrl} alt={p.name} fill className="object-cover" />
          </div>
          <div>
            <p className="font-bold text-gray-900">{p.name}</p>
            <p className="text-xs text-gray-500">{p.address}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Phân loại',
      render: (p) => (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700">
          {p.category === 'luutru' ? 'Lưu trú' : p.category === 'amthuc' ? 'Ẩm thực' : 'Điểm du lịch'}
        </span>
      ),
    },
    { key: 'priceText', header: 'Khoảng giá' },
    { key: 'status', header: 'Trạng thái', render: (p) => <StatusBadge status={p.status} /> },
    {
      key: 'actions',
      header: 'Thao tác',
      render: (p) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSelectedPlace(p)}
            title="Xem chi tiết"
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-teal-600"
          >
            <Eye className="w-4 h-4" />
          </button>
          {p.status === 'PENDING' && (
            <button
              onClick={() => handleUpdateStatus(p.id, 'APPROVED')}
              disabled={actionLoading}
              title="Phê duyệt"
              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50"
            >
              <Check className="w-4 h-4" />
            </button>
          )}
          {p.status === 'APPROVED' ? (
            <button
              onClick={() => handleUpdateStatus(p.id, 'HIDDEN')}
              disabled={actionLoading}
              title="Ẩn địa điểm"
              className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50"
            >
              <EyeOff className="w-4 h-4" />
            </button>
          ) : p.status === 'HIDDEN' ? (
            <button
              onClick={() => handleUpdateStatus(p.id, 'APPROVED')}
              disabled={actionLoading}
              title="Hiện địa điểm"
              className="p-1.5 rounded-lg text-teal-600 hover:bg-teal-50"
            >
              <Eye className="w-4 h-4" />
            </button>
          ) : null}
          <button
            onClick={() => setDeletingPlace(p)}
            title="Xóa địa điểm"
            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý nội dung địa điểm</h1>
        <p className="text-sm text-gray-500">Duyệt, chỉnh sửa và quản lý danh sách địa điểm trên website.</p>
      </div>

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
          searchPlaceholder="Tìm theo tên địa điểm, địa chỉ..."
          searchField={(p) => `${p.name} ${p.address}`}
          rowKey={(p) => p.id}
          filterSlot={
            <>
              <select
                value={catFilter}
                onChange={(e) => setCatFilter(e.target.value)}
                className="px-3 py-2 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="ALL">Tất cả loại hình</option>
                <option value="luutru">Lưu trú</option>
                <option value="amthuc">Ẩm thực</option>
                <option value="diemdulich">Điểm du lịch</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="APPROVED">Đang hiển thị</option>
                <option value="PENDING">Chờ duyệt</option>
                <option value="HIDDEN">Đã ẩn</option>
              </select>
            </>
          }
        />
      )}

      {/* Detail Modal */}
      {selectedPlace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 relative space-y-4">
            <button
              onClick={() => setSelectedPlace(null)}
              className="absolute right-4 top-4 p-1 text-gray-400 hover:text-gray-600 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <MapPin className="w-6 h-6 text-teal-600" />
              <h3 className="text-lg font-bold text-gray-900">{selectedPlace.name}</h3>
            </div>
            <div className="space-y-2 text-sm text-gray-700">
              <p><span className="font-semibold text-gray-500">Đối tác:</span> {selectedPlace.partnerName || 'N/A'}</p>
              <p><span className="font-semibold text-gray-500">Địa chỉ:</span> {selectedPlace.address}</p>
              <p><span className="font-semibold text-gray-500">Khoảng giá:</span> {selectedPlace.priceText}</p>
              <p><span className="font-semibold text-gray-500">Đánh giá:</span> ⭐ {selectedPlace.rating} ({selectedPlace.reviewCount} đánh giá)</p>
              <p><span className="font-semibold text-gray-500">Trạng thái:</span> <StatusBadge status={selectedPlace.status} /></p>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedPlace(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs rounded-xl"
              >
                Đóng
              </button>
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
