'use client';

import { useState } from 'react';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getPartnerBookings, updatePartnerBookingStatus } from '@/lib/api/partner';
import type { PartnerBooking, BookingStatus } from '@/types/partner';
import PartnerDataTable, { PartnerColumn } from '@/components/partner/PartnerDataTable';
import PartnerStatusBadge from '@/components/partner/PartnerStatusBadge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  CheckCircle,
  XCircle,
  Clock,
  Check,
  Eye,
  X,
  CalendarCheck,
  Users,
  Phone,
  Mail,
  CreditCard,
} from 'lucide-react';

export default function PartnerBookingsPage() {
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'ALL'>('ALL');
  const [selectedBooking, setSelectedBooking] = useState<PartnerBooking | null>(null);
  const [confirmingBooking, setConfirmingBooking] = useState<{
    booking: PartnerBooking;
    nextStatus: BookingStatus;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const { data: bookings, loading, error, reload } = useAsyncData(
    () => getPartnerBookings({ status: statusFilter }),
    [statusFilter]
  );

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleStatusChange = async () => {
    if (!confirmingBooking) return;
    setActionLoading(true);
    try {
      const res = await updatePartnerBookingStatus(
        confirmingBooking.booking.id,
        confirmingBooking.nextStatus
      );
      showToast(res.message);
      setConfirmingBooking(null);
      reload();
    } catch (err: any) {
      showToast(err?.message || 'Cập nhật thất bại', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const columns: PartnerColumn<PartnerBooking>[] = [
    {
      key: 'bookingCode',
      header: 'Mã đơn & Cơ sở',
      sortable: true,
      render: (b) => (
        <div className="space-y-0.5">
          <p className="font-mono font-extrabold text-[#008F89] text-xs sm:text-sm">
            {b.bookingCode}
          </p>
          <p className="text-xs text-[#14233B] font-semibold line-clamp-1">{b.placeName}</p>
        </div>
      ),
    },
    {
      key: 'customerName',
      header: 'Khách hàng',
      sortable: true,
      render: (b) => (
        <div className="space-y-0.5">
          <p className="font-bold text-[#14233B]">{b.customerName}</p>
          <p className="text-xs text-[#68798A] font-medium">{b.customerPhone}</p>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Ngày nhận chỗ',
      render: (b) => (
        <div className="space-y-0.5">
          <p className="font-semibold text-[#14233B] text-xs sm:text-sm">{b.date}</p>
          <span className="inline-flex items-center gap-1 text-[11px] text-[#68798A] font-medium">
            <Users className="w-3 h-3 text-[#008F89]" />
            {b.numGuests} khách
          </span>
        </div>
      ),
    },
    {
      key: 'totalPrice',
      header: 'Tổng tiền',
      sortable: true,
      render: (b) => (
        <div className="space-y-0.5">
          <p className="font-extrabold text-[#14233B] whitespace-nowrap">
            {b.totalPrice.toLocaleString('vi-VN')} <span className="text-xs font-bold text-[#68798A]">VNĐ</span>
          </p>
          <p className="text-[11px] text-[#68798A] font-medium">
            {b.paymentMethod === 'TRANSFER' ? 'Chuyển khoản' : 'Tiền mặt'}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (b) => <PartnerStatusBadge status={b.status} />,
    },
    {
      key: 'actions',
      header: 'Thao tác',
      render: (b) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSelectedBooking(b)}
            title="Xem chi tiết"
            className="w-9 h-9 rounded-xl inline-flex items-center justify-center text-[#68798A] bg-[#F6FAFA] border border-[#E2ECEC] hover:bg-[#E9F8F5] hover:border-[#BDE8E0] hover:text-[#008F89] transition-all active:scale-95"
          >
            <Eye className="w-4 h-4" />
          </button>
          {b.status === 'PENDING' && (
            <>
              <button
                onClick={() => setConfirmingBooking({ booking: b, nextStatus: 'CONFIRMED' })}
                title="Xác nhận đơn"
                className="w-9 h-9 rounded-xl inline-flex items-center justify-center text-emerald-600 bg-emerald-50 border border-emerald-200/80 hover:bg-emerald-600 hover:text-white transition-all active:scale-95"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => setConfirmingBooking({ booking: b, nextStatus: 'CANCELLED' })}
                title="Hủy đơn"
                className="w-9 h-9 rounded-xl inline-flex items-center justify-center text-rose-600 bg-rose-50 border border-rose-200/80 hover:bg-rose-600 hover:text-white transition-all active:scale-95"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
          {b.status === 'CONFIRMED' && (
            <button
              onClick={() => setConfirmingBooking({ booking: b, nextStatus: 'COMPLETED' })}
              title="Đánh dấu Hoàn thành"
              className="w-9 h-9 rounded-xl inline-flex items-center justify-center text-[#087CB2] bg-sky-50 border border-sky-200/80 hover:bg-[#087CB2] hover:text-white transition-all active:scale-95"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Trang */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] sm:text-[30px] font-extrabold text-[#14233B] flex items-center gap-2.5 tracking-tight">
            <span className="w-10 h-10 rounded-xl bg-[#E9F8F5] border border-[#BDE8E0] text-[#008F89] inline-flex items-center justify-center shrink-0">
              <CalendarCheck className="w-5 h-5" />
            </span>
            <span>Quản lý đơn đặt chỗ</span>
          </h1>
          <p className="text-sm text-[#68798A] mt-1.5">
            Theo dõi, xác nhận và quản lý trạng thái đặt phòng/bàn của khách du lịch.
          </p>
        </div>
      </div>

      {toast && (
        <div
          role="alert"
          className={`p-4 rounded-2xl border text-sm font-semibold flex items-center justify-between shadow-xs ${
            toast.type === 'error'
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : 'bg-[#E9F8F5] text-[#073B3A] border-[#BDE8E0]'
          }`}
        >
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="p-1 rounded-lg hover:bg-black/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error ? (
        <div className="p-6 bg-rose-50 rounded-[20px] border border-rose-200 text-rose-700">
          <p className="font-semibold mb-2" role="alert">
            {error}
          </p>
          <button
            onClick={reload}
            className="px-4 py-2 bg-rose-600 text-white rounded-xl font-semibold text-xs"
          >
            Thử lại
          </button>
        </div>
      ) : (
        <PartnerDataTable
          data={bookings || []}
          columns={columns}
          loading={loading}
          searchPlaceholder="Tìm theo mã đơn DNG-..., tên khách, SĐT..."
          searchField={(b) => `${b.bookingCode} ${b.customerName} ${b.customerPhone}`}
          rowKey={(b) => b.id}
          emptyTitle="Chưa có đơn đặt chỗ"
          emptyDescription="Các đơn đặt bàn và đặt phòng từ du khách sẽ được liệt kê chi tiết tại đây."
          emptyIcon={<CalendarCheck className="w-7 h-7" />}
          filterSlot={
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#14233B] bg-[#F6FAFA] border border-[#E2ECEC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/30 focus:border-[#14B8A6] focus:bg-white transition-all cursor-pointer"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PENDING">Chờ xác nhận</option>
              <option value="CONFIRMED">Đã xác nhận</option>
              <option value="COMPLETED">Hoàn thành</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
          }
        />
      )}

      {/* Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#073B3A]/60 backdrop-blur-xs">
          <div className="bg-white rounded-[24px] max-w-md w-full p-6 sm:p-7 shadow-2xl border border-[#E2ECEC] relative space-y-5">
            <button
              onClick={() => setSelectedBooking(null)}
              className="absolute right-4 top-4 p-1.5 text-[#68798A] hover:text-[#14233B] hover:bg-[#F6FAFA] rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#E9F8F5] border border-[#BDE8E0] text-[#008F89] flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#14233B]">
                  Chi tiết đơn: <span className="font-mono text-[#008F89]">{selectedBooking.bookingCode}</span>
                </h3>
                <div className="mt-1">
                  <PartnerStatusBadge status={selectedBooking.status} size="sm" />
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-[#14233B] bg-[#F6FAFA] p-4 rounded-2xl border border-[#E2ECEC]">
              <div className="flex justify-between gap-2 pb-2 border-b border-[#E2ECEC]">
                <span className="text-[#68798A] font-medium">Cơ sở dịch vụ:</span>
                <span className="font-bold text-right">{selectedBooking.placeName}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#68798A] font-medium">Khách hàng:</span>
                <span className="font-bold">{selectedBooking.customerName}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#68798A] font-medium flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-[#008F89]" /> Số điện thoại:
                </span>
                <span className="font-semibold">{selectedBooking.customerPhone}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#68798A] font-medium flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-[#008F89]" /> Email:
                </span>
                <span className="font-medium truncate max-w-[200px]">{selectedBooking.customerEmail}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#68798A] font-medium">Ngày nhận chỗ:</span>
                <span className="font-bold text-[#008F89]">{selectedBooking.date}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#68798A] font-medium">Số lượng khách:</span>
                <span className="font-semibold">{selectedBooking.numGuests} người</span>
              </div>
              <div className="flex justify-between gap-2 pt-2 border-t border-[#E2ECEC]">
                <span className="text-[#68798A] font-bold flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-[#FF8A24]" /> Tổng thanh toán:
                </span>
                <span className="font-extrabold text-[#FF8A24]">
                  {selectedBooking.totalPrice.toLocaleString('vi-VN')} VNĐ
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#68798A] font-medium">Phương thức:</span>
                <span className="font-semibold">
                  {selectedBooking.paymentMethod === 'TRANSFER' ? 'Chuyển khoản' : 'Tiền mặt'}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-5 py-2.5 bg-[#F6FAFA] hover:bg-[#E9F8F5] border border-[#E2ECEC] text-[#14233B] font-bold text-xs rounded-xl transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Action Dialog */}
      {confirmingBooking && (
        <ConfirmDialog
          isOpen={Boolean(confirmingBooking)}
          onClose={() => setConfirmingBooking(null)}
          onConfirm={handleStatusChange}
          title={`Chuyển trạng thái đơn ${confirmingBooking.booking.bookingCode}`}
          description={`Bạn có chắc muốn chuyển trạng thái đơn hàng sang "${
            confirmingBooking.nextStatus === 'CONFIRMED'
              ? 'Đã xác nhận'
              : confirmingBooking.nextStatus === 'COMPLETED'
              ? 'Hoàn thành'
              : 'Đã hủy'
          }"?`}
          variant={confirmingBooking.nextStatus === 'CANCELLED' ? 'danger' : 'teal'}
          confirmText="Đồng ý chuyển"
          loading={actionLoading}
        />
      )}
    </div>
  );
}
