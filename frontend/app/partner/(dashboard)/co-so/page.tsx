'use client';

import { useState } from 'react';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getPartnerPlaces, getPartnerProfile } from '@/lib/api/partner';
import type { PartnerPlace } from '@/types/partner';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { Plus, Edit3, Eye, Lock, MapPin, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function PartnerPlacesPage() {
  const [catFilter, setCatFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedPlace, setSelectedPlace] = useState<PartnerPlace | null>(null);

  const { data: profile } = useAsyncData(getPartnerProfile);
  const { data: places, loading, error, reload } = useAsyncData(
    () => getPartnerPlaces({ category: catFilter, status: statusFilter }),
    [catFilter, statusFilter]
  );

  const isLocked = profile?.status === 'PENDING' || profile?.status === 'REJECTED';

  const columns: Column<PartnerPlace>[] = [
    {
      key: 'name',
      header: 'Tên cơ sở',
      sortable: true,
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
            {p.images[0] ? (
              <Image src={p.images[0]} alt={p.name} fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold text-xs">
                IMG
              </div>
            )}
          </div>
          <div>
            <p className="font-bold text-gray-900">{p.name}</p>
            <p className="text-xs text-gray-500">{p.area} - {p.address}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Loại hình',
      render: (p) => (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700">
          {p.category === 'luutru' ? 'Lưu trú' : p.category === 'amthuc' ? 'Ẩm thực' : 'Điểm tham quan'}
        </span>
      ),
    },
    {
      key: 'price',
      header: 'Giá dịch vụ',
      render: (p) => (
        <span className="font-semibold text-gray-800">
          {p.priceMin.toLocaleString('vi-VN')} {p.priceMax ? `- ${p.priceMax.toLocaleString('vi-VN')}` : ''} VNĐ /{p.priceUnit || 'lượt'}
        </span>
      ),
    },
    { key: 'status', header: 'Trạng thái', render: (p) => <StatusBadge status={p.status} /> },
    {
      key: 'actions',
      header: 'Thao tác',
      render: (p) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedPlace(p)}
            title="Xem chi tiết"
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-teal-600"
          >
            <Eye className="w-4 h-4" />
          </button>
          {isLocked ? (
            <button
              disabled
              title="Thao tác bị khóa do hồ sơ chưa phê duyệt"
              className="p-1.5 rounded-lg text-gray-300 cursor-not-allowed"
            >
              <Lock className="w-4 h-4" />
            </button>
          ) : (
            <Link
              href={`/partner/co-so/${p.id}/sua`}
              title="Chỉnh sửa cơ sở"
              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
            </Link>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Danh sách cơ sở dịch vụ</h1>
          <p className="text-sm text-gray-500">Quản lý thông tin các điểm lưu trú, ẩm thực của doanh nghiệp.</p>
        </div>

        {isLocked ? (
          <button
            disabled
            title="Thao tác bị khóa do hồ sơ doanh nghiệp chưa phê duyệt"
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-200 text-gray-500 font-bold text-xs rounded-xl cursor-not-allowed"
          >
            <Lock className="w-4 h-4" />
            Thêm cơ sở mới (Khóa)
          </button>
        ) : (
          <Link
            href="/partner/co-so/tao-moi"
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl transition-colors shadow-md shadow-orange-500/20"
          >
            <Plus className="w-4 h-4" />
            Thêm cơ sở mới
          </Link>
        )}
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
          searchPlaceholder="Tìm theo tên cơ sở, khu vực..."
          searchField={(p) => `${p.name} ${p.address} ${p.area}`}
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
                <option value="diemdulich">Điểm tham quan</option>
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
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100 relative space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedPlace(null)}
              className="absolute right-4 top-4 p-1 text-gray-400 hover:text-gray-600 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <MapPin className="w-6 h-6 text-teal-600" />
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selectedPlace.name}</h3>
                <StatusBadge status={selectedPlace.status} />
              </div>
            </div>
            <div className="space-y-2 text-sm text-gray-700">
              <p><span className="font-semibold text-gray-500">Mô tả:</span> {selectedPlace.description}</p>
              <p><span className="font-semibold text-gray-500">Địa chỉ:</span> {selectedPlace.address}</p>
              <p><span className="font-semibold text-gray-500">Giờ mở cửa:</span> {selectedPlace.openHours}</p>
              <p><span className="font-semibold text-gray-500">Ngày hoạt động:</span> {selectedPlace.openDays.join(', ')}</p>
              <p><span className="font-semibold text-gray-500">Tiện ích:</span> {selectedPlace.amenities.join(', ')}</p>
            </div>

            {selectedPlace.images.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-700">Hình ảnh ({selectedPlace.images.length})</p>
                <div className="grid grid-cols-3 gap-2">
                  {selectedPlace.images.map((url, idx) => (
                    <div key={idx} className="relative h-20 rounded-lg overflow-hidden bg-gray-100">
                      <Image src={url} alt={`Preview ${idx}`} fill className="object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

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
    </div>
  );
}
