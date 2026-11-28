'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getPartnerPlaces, getPartnerProfile, updatePlaceStatus } from '@/lib/api/partner';
import type { PartnerPlace } from '@/types/partner';
import PartnerPageHeader from '@/components/partner/PartnerPageHeader';
import StatsRow from '@/components/partner/StatsRow';
import StatusFilterPills, { type StatusFilterValue } from '@/components/partner/StatusFilterPills';
import PlacesTable from '@/components/partner/PlacesTable';
import CtaBanner from '@/components/partner/CtaBanner';
import ScrollToTop from '@/components/partner/ScrollToTop';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import PartnerStatusBadge from '@/components/partner/PartnerStatusBadge';
import ToastNotification, { type ToastItem } from '@/components/ui/ToastNotification';
import { getFriendlyErrorMessage } from '@/lib/utils/formatError';
import { Plus, Search, MapPin, X } from 'lucide-react';
import Image from 'next/image';

export default function PartnerPlacesPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('ALL');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<PartnerPlace | null>(null);

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

  const stats = useMemo(() => {
    const total = allPlaces.length;
    const active = allPlaces.filter((p) => p.status === 'ACTIVE' || p.status === 'APPROVED').length;
    const pending = allPlaces.filter((p) => p.status === 'PENDING').length;
    const locked = allPlaces.filter((p) => p.status === 'LOCKED').length;
    return { total, active, pending, locked };
  }, [allPlaces]);

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

  const isStayPartner = profile?.serviceType === 'STAY';
  const isTicketPartner = profile?.serviceType === 'TICKET';
  const isSelectedAccommodation =
    selectedPlace?.category === 'luutru' || selectedPlace?.placeType === 'ACCOMMODATION';

  return (
    <div className="space-y-6">
      <ToastNotification toast={toast} onClose={() => setToast(null)} />

      {/* 1. Hero Banner Cơ sở dịch vụ */}
      <PartnerPageHeader
        breadcrumbs={[
          { label: 'Partner', href: '/partner' },
          { label: 'Cơ sở của tôi' },
        ]}
        title={
          isStayPartner
            ? 'Danh sách cơ sở lưu trú'
            : isTicketPartner
            ? 'Danh sách điểm tham quan'
            : 'Danh sách cơ sở của tôi'
        }
        description={
          isStayPartner
            ? 'Theo dõi hoạt động, quản lý hiển thị và cập nhật thông tin các khách sạn, homestay, resort của bạn.'
            : isTicketPartner
            ? 'Theo dõi hoạt động, quản lý hiển thị và cập nhật thông tin các điểm tham quan, trải nghiệm du lịch của bạn.'
            : 'Theo dõi hoạt động, quản lý hiển thị và cập nhật thông tin các cơ sở dịch vụ ẩm thực, lưu trú của bạn.'
        }
        backgroundImage="/images/partner/danang-dragon-bridge-night.jpg"
        action={
          !isLocked
            ? {
                label: isStayPartner ? '+ Thêm nơi lưu trú mới' : '+ Thêm cơ sở mới',
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
        serviceType={profile?.serviceType}
      />

      {/* 3. Thanh tìm kiếm và bộ lọc trạng thái */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white p-4 rounded-[20px] border border-[#E2ECEC] shadow-xs">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder={
              isStayPartner
                ? 'Tìm kiếm theo tên khách sạn, nơi lưu trú, địa chỉ...'
                : 'Tìm kiếm theo tên cơ sở, địa chỉ...'
            }
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#14233B] placeholder:text-[#68798A]/80 bg-[#F6FAFA] border border-[#E2ECEC] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/30 focus:border-[#14B8A6] transition-all"
          />
          <Search className="w-4 h-4 text-[#68798A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

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
        serviceType={profile?.serviceType}
        onSelectDetail={setSelectedPlace}
        onToggleStatus={openToggleConfirm}
      />

      {/* 5. Dải Banner CTA hỗ trợ đối tác */}
      <CtaBanner />

      {/* 6. Nút Lên đầu trang */}
      <ScrollToTop />

      {/* 7. Dialog xác nhận Ẩn / Hiện */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, place: null, targetStatus: 'HIDDEN' })}
        onConfirm={handleConfirmToggleStatus}
        loading={actionLoading}
        title={confirmDialog.targetStatus === 'HIDDEN' ? 'Ẩn cơ sở này' : 'Mở hiển thị cơ sở'}
        description={
          confirmDialog.targetStatus === 'HIDDEN'
            ? `Bạn có chắc chắn muốn ẩn cơ sở "${confirmDialog.place?.name}"? Địa điểm này sẽ tạm ngừng xuất hiện trên các trang tìm kiếm công khai của du khách.`
            : `Bạn có muốn mở hiển thị lại cơ sở "${confirmDialog.place?.name}" trên DaNangGo để khách du lịch tìm kiếm và đặt chỗ?`
        }
        confirmText={confirmDialog.targetStatus === 'HIDDEN' ? 'Xác nhận Ẩn' : 'Mở hiển thị'}
        cancelText="Hủy bỏ"
        variant={confirmDialog.targetStatus === 'HIDDEN' ? 'warning' : 'teal'}
      />

      {/* 8. Modal xem chi tiết cơ sở */}
      <AnimatePresence>
        {selectedPlace && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#073B3A]/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              className="bg-white rounded-[24px] max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#E2ECEC] relative space-y-5 max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setSelectedPlace(null)}
                className="absolute right-5 top-5 p-1.5 text-[#68798A] hover:text-[#14233B] rounded-xl hover:bg-[#F6FAFA] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#E9F8F5] border border-[#BDE8E0] flex items-center justify-center text-[#008F89] shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
                <div className="flex-1 pr-6">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-bold text-[#14233B]">{selectedPlace.name}</h3>
                    <PartnerStatusBadge status={selectedPlace.status} />
                  </div>
                  <p className="text-xs text-[#68798A] mt-0.5">
                    {selectedPlace.area || 'Đà Nẵng'} • {selectedPlace.address}
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs sm:text-sm text-[#14233B] bg-[#F6FAFA] p-4 rounded-2xl border border-[#E2ECEC]">
                <p>
                  <span className="font-bold text-[#68798A]">Mô tả:</span>{' '}
                  {selectedPlace.description || 'Chưa có mô tả chi tiết.'}
                </p>
                <p>
                  <span className="font-bold text-[#68798A]">
                    {isSelectedAccommodation ? 'Giá từ:' : 'Khoảng giá:'}
                  </span>{' '}
                  <span className="font-bold text-[#FF8A24]">
                    ₫{selectedPlace.priceMin?.toLocaleString('vi-VN') || 0}{' '}
                    {selectedPlace.priceMax
                      ? `- ₫${selectedPlace.priceMax.toLocaleString('vi-VN')}`
                      : ''}
                    {isSelectedAccommodation ? ' / đêm' : ''}
                  </span>
                </p>
                <p>
                  <span className="font-bold text-[#68798A]">Giờ phục vụ:</span>{' '}
                  {selectedPlace.openHours}
                </p>
                <p>
                  <span className="font-bold text-[#68798A]">Lượt xem:</span>{' '}
                  {(selectedPlace.viewCount ?? 0).toLocaleString('vi-VN')} lượt
                </p>
                {selectedPlace.bookingUrl && (
                  <p>
                    <span className="font-bold text-[#68798A]">
                      {isSelectedAccommodation ? 'URL đặt phòng:' : 'URL đặt bàn:'}
                    </span>{' '}
                    <a
                      href={selectedPlace.bookingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#008F89] underline font-semibold break-all"
                    >
                      {selectedPlace.bookingUrl}
                    </a>
                  </p>
                )}
              </div>

              {selectedPlace.images && selectedPlace.images.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-[#14233B]">
                    Hình ảnh ({selectedPlace.images.length})
                  </p>
                  <div className="grid grid-cols-3 gap-2.5">
                    {selectedPlace.images.map((url, idx) => (
                      <div
                        key={idx}
                        className="relative h-20 rounded-xl overflow-hidden bg-[#F6FAFA] border border-[#E2ECEC]"
                      >
                        <Image src={url} alt={`Ảnh ${idx + 1}`} fill unoptimized className="object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2 border-t border-[#E2ECEC]">
                <button
                  type="button"
                  onClick={() => setSelectedPlace(null)}
                  className="px-5 py-2.5 bg-[#F6FAFA] hover:bg-[#E9F8F5] border border-[#E2ECEC] text-[#14233B] font-bold text-xs rounded-xl transition-colors"
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
