'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getPartnerPlaces, getPartnerProfile, updatePlaceStatus } from '@/lib/api/partner';
import type { PartnerPlace, PartnerPlaceStatus } from '@/types/partner';
import PartnerPageHeader from '@/components/partner/PartnerPageHeader';
import StatsRow from '@/components/partner/StatsRow';
import StatusFilterPills, { type StatusFilterValue } from '@/components/partner/StatusFilterPills';
import PlacesTable from '@/components/partner/PlacesTable';
import CtaBanner from '@/components/partner/CtaBanner';
import ScrollToTop from '@/components/partner/ScrollToTop';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import StatusBadge from '@/components/ui/StatusBadge';
import ToastNotification, { type ToastItem } from '@/components/ui/ToastNotification';
import { getFriendlyErrorMessage } from '@/lib/utils/formatError';
import { Plus, Search, MapPin, X, CheckCircle2, AlertCircle } from 'lucide-react';
import Image from 'next/image';

export default function PartnerPlacesPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('ALL');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<PartnerPlace | null>(null);

  // State cho Confirm Dialog đổi trạng thái Ẩn / Hiện
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    place: PartnerPlace | null;
    targetStatus: 'ACTIVE' | 'HIDDEN';
  }>({
    isOpen: false,
    place: null,
    targetStatus: 'HIDDEN',
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<ToastItem | null>(null);

  const { data: profile } = useAsyncData(getPartnerProfile);
  const { data: rawPlaces, loading, error, reload } = useAsyncData(
    () => getPartnerPlaces({ status: statusFilter === 'ALL' ? undefined : statusFilter }),
    [statusFilter]
  );

  const isLocked = profile?.status === 'PENDING' || profile?.status === 'REJECTED';
  const allPlaces = rawPlaces || [];

  // Filter client-side by keyword
  const filteredPlaces = useMemo(() => {
    if (!searchKeyword.trim()) return allPlaces;
    const kw = searchKeyword.toLowerCase().trim();
    return allPlaces.filter(
      (p) =>
        p.name.toLowerCase().includes(kw) ||
        (p.address && p.address.toLowerCase().includes(kw)) ||
        (p.area && p.area.toLowerCase().includes(kw))
    );
  }, [allPlaces, searchKeyword]);

  // Metric stats
  const stats = useMemo(() => {
    const total = allPlaces.length;
    const active = allPlaces.filter((p) => p.status === 'ACTIVE' || p.status === 'APPROVED').length;
    const pending = allPlaces.filter((p) => p.status === 'PENDING').length;
    const locked = allPlaces.filter((p) => p.status === 'LOCKED').length;
    return { total, active, pending, locked };
  }, [allPlaces]);

  // Counts for filter pills
  const filterCounts = useMemo(() => {
    return {
      ALL: allPlaces.length,
      ACTIVE: allPlaces.filter((p) => p.status === 'ACTIVE' || p.status === 'APPROVED').length,
      HIDDEN: allPlaces.filter((p) => p.status === 'HIDDEN').length,
      PENDING: allPlaces.filter((p) => p.status === 'PENDING').length,
      LOCKED: allPlaces.filter((p) => p.status === 'LOCKED').length,
    };
  }, [allPlaces]);

  const openToggleConfirm = (place: PartnerPlace, targetStatus: 'ACTIVE' | 'HIDDEN') => {
    setConfirmDialog({
      isOpen: true,
      place,
      targetStatus,
    });
  };

  const handleConfirmToggleStatus = async () => {
    if (!confirmDialog.place) return;
    setActionLoading(true);
    try {
      const res = await updatePlaceStatus(confirmDialog.place.id, confirmDialog.targetStatus);
      setToast({
        type: 'success',
        title: 'Thành công',
        message: res.message || 'Cập nhật trạng thái thành công.',
      });
      setConfirmDialog({ isOpen: false, place: null, targetStatus: 'HIDDEN' });
      await reload();
    } catch (err: any) {
      const msg = getFriendlyErrorMessage(err);
      setToast({
        type: 'error',
        title: 'Không thể thay đổi trạng thái',
        message: msg,
        action:
          err?.status === 401
            ? {
                label: 'Đăng nhập lại',
                href: '/dang-nhap?redirect=/partner/co-so',
              }
            : undefined,
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <ToastNotification toast={toast} onClose={() => setToast(null)} />

      {/* 1. Header dùng chung */}
      <PartnerPageHeader
        breadcrumbs={[
          { label: 'Partner', href: '/partner' },
          { label: 'Cơ sở của tôi' },
        ]}
        title="Danh sách quán của tôi"
        description="Theo dõi hoạt động, quản lý hiển thị và cập nhật thông tin các quán ăn, nhà hàng của bạn."
        action={
          !isLocked
            ? {
                label: '+ Thêm quán mới',
                href: '/partner/co-so/tao-moi',
                icon: <Plus className="w-4 h-4" />,
              }
            : undefined
        }
      />

      {/* 2. Hàng thống kê chỉ số count-up */}
      <StatsRow
        total={stats.total}
        active={stats.active}
        pending={stats.pending}
        locked={stats.locked}
      />

      {/* 3. Thanh tìm kiếm và bộ lọc trạng thái */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
        {/* Ô tìm kiếm */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="Tìm kiếm theo tên quán, địa chỉ..."
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Pill lọc theo trạng thái */}
        <StatusFilterPills
          current={statusFilter}
          onChange={setStatusFilter}
          counts={filterCounts}
        />
      </div>

      {/* 4. Bảng danh sách cơ sở */}
      <PlacesTable
        places={filteredPlaces}
        loading={loading}
        error={error}
        onReload={reload}
        isAccountLocked={isLocked}
        onSelectDetail={setSelectedPlace}
        onToggleStatus={openToggleConfirm}
      />

      {/* 5. Dải Banner CTA */}
      <CtaBanner />

      {/* 6. Nút Lên đầu trang có vòng tròn tiến độ cuộn */}
      <ScrollToTop />

      {/* 7. Dialog xác nhận Ẩn / Hiện */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, place: null, targetStatus: 'HIDDEN' })}
        onConfirm={handleConfirmToggleStatus}
        loading={actionLoading}
        title={confirmDialog.targetStatus === 'HIDDEN' ? 'Ẩn quán ăn này' : 'Mở hiển thị quán ăn'}
        description={
          confirmDialog.targetStatus === 'HIDDEN'
            ? `Bạn có chắc chắn muốn ẩn cơ sở "${confirmDialog.place?.name}"? Địa điểm này sẽ tạm ngừng xuất hiện trên các trang tìm kiếm công khai của du khách.`
            : `Bạn có muốn mở hiển thị lại cơ sở "${confirmDialog.place?.name}" trên DaNangGo để khách du lịch tìm kiếm và đặt bàn?`
        }
        confirmText={confirmDialog.targetStatus === 'HIDDEN' ? 'Xác nhận Ẩn' : 'Mở hiển thị'}
        cancelText="Hủy bỏ"
        variant={confirmDialog.targetStatus === 'HIDDEN' ? 'warning' : 'teal'}
      />

      {/* 8. Modal xem chi tiết cơ sở */}
      <AnimatePresence>
        {selectedPlace && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative space-y-5 max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setSelectedPlace(null)}
                className="absolute right-5 top-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
                <div className="flex-1 pr-6">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">{selectedPlace.name}</h3>
                    <StatusBadge status={selectedPlace.status} />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedPlace.area || 'Đà Nẵng'} • {selectedPlace.address}
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs sm:text-sm text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p>
                  <span className="font-bold text-slate-500">Mô tả:</span>{' '}
                  {selectedPlace.description || 'Chưa có mô tả chi tiết.'}
                </p>
                <p>
                  <span className="font-bold text-slate-500">Khoảng giá:</span>{' '}
                  <span className="font-bold text-orange-600">
                    ₫{selectedPlace.priceMin?.toLocaleString('vi-VN') || 0}{' '}
                    {selectedPlace.priceMax ? `- ₫${selectedPlace.priceMax.toLocaleString('vi-VN')}` : ''}
                  </span>
                </p>
                <p>
                  <span className="font-bold text-slate-500">Giờ mở cửa:</span>{' '}
                  {selectedPlace.openHours}
                </p>
                <p>
                  <span className="font-bold text-slate-500">Lượt xem:</span>{' '}
                  {(selectedPlace.viewCount ?? 0).toLocaleString('vi-VN')} lượt
                </p>
                {selectedPlace.bookingUrl && (
                  <p>
                    <span className="font-bold text-slate-500">URL đặt bàn:</span>{' '}
                    <a
                      href={selectedPlace.bookingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-teal-600 underline font-semibold break-all"
                    >
                      {selectedPlace.bookingUrl}
                    </a>
                  </p>
                )}
              </div>

              {selectedPlace.images && selectedPlace.images.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-700">
                    Hình ảnh ({selectedPlace.images.length})
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedPlace.images.map((url, idx) => (
                      <div
                        key={idx}
                        className="relative h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200"
                      >
                        <Image src={url} alt={`Ảnh ${idx + 1}`} fill className="object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedPlace(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
