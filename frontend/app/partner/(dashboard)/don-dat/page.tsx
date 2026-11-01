'use client';

import { useState } from 'react';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getPartnerBookings, updatePartnerBookingStatus } from '@/lib/api/partner';
import type { PartnerBooking, BookingStatus } from '@/types/partner';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { CheckCircle, XCircle, Clock, Check, Eye, X } from 'lucide-react';

export default function PartnerBookingsPage() {
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'ALL'>('ALL');
  const [selectedBooking, setSelectedBooking] = useState<PartnerBooking | null>(null);
  const [confirmingBooking, setConfirmingBooking] = useState<{ booking: PartnerBooking; nextStatus: BookingStatus } | null>(null);
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
      const res = await updatePartnerBookingStatus(confirmingBooking.booking.id, confirmingBooking.nextStatus);
      showToast(res.message);
      setConfirmingBooking(null);
      reload();
    } catch (err: any) {
      showToast(err?.message || 'Cập nhật thất bại', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const columns: Column<PartnerBooking>[] = [
    {
      key: 'bookingCode',
      header: 'Mã đơn & Cơ sở',
      sortable: true,
      render: (b) => (
        <div>
          <p className="font-extrabold text-teal-700">{b.bookingCode}</p>
          <p className="text-xs text-gray-800 font-semibold">{b.placeName}</p>
        </div>
      ),
    },
    {
      key: 'customerName',
      header: 'Khách hàng',
      sortable: true,
      render: (b) => (
        <div>
          <p className="font-bold text-gray-900">{b.customerName}</p>
          <p className="text-xs text-gray-500">{b.customerPhone}</p>
        </div>
      ),
    },
    { key: 'date', header: 'Ngày nhận chỗ', render: (b) => `${b.date} (${b.numGuests} khách)` },
    {
      key: 'totalPrice',
      header: 'Tổng tiền',
      sortable: true,
      render: (b) => (
        <div>
          <p className="font-bold text-gray-900">{b.totalPrice.toLocaleString('vi-VN')} VNĐ</p>
          <p className="text-[10px] text-gray-500 font-semibold">
            {b.paymentMethod === 'TRANSFER' ? 'Chuyển khoản' : 'Tiền mặt'}
          </p>
        </div>
      ),
    },
    { key: 'status', header: 'Trạng thái', render: (b) => <StatusBadge status={b.status} /> },
    {
      key: 'actions',
      header: 'Thao tác',
      render: (b) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSelectedBooking(b)}
            title="Xem chi tiết"
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-teal-600"
          >
            <Eye className="w-4 h-4" />
          </button>
          {b.status === 'PENDING' && (
            <>
              <button
                onClick={() => setConfirmingBooking({ booking: b, nextStatus: 'CONFIRMED' })}
                title="Xác nhận đơn"
                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => setConfirmingBooking({ booking: b, nextStatus: 'CANCELLED' })}
                title="Hủy đơn"
                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
          {b.status === 'CONFIRMED' && (
            <button
              onClick={() => setConfirmingBooking({ booking: b, nextStatus: 'COMPLETED' })}
              title="Đánh dấu Hoàn thành"
              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50"
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý đơn đặt chỗ</h1>
        <p className="text-sm text-gray-500">Theo dõi, xác nhận và quản lý trạng thái đặt phòng/bàn của khách.</p>
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
          data={bookings || []}
          columns={columns}
          loading={loading}
          searchPlaceholder="Tìm theo mã đơn DNG-..., tên khách, SĐT..."
          searchField={(b) => `${b.bookingCode} ${b.customerName} ${b.customerPhone}`}
          rowKey={(b) => b.id}
          filterSlot={
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 relative space-y-4">
            <button
              onClick={() => setSelectedBooking(null)}
              className="absolute right-4 top-4 p-1 text-gray-400 hover:text-gray-600 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-teal-600" />
              <div>
                <h3 className="text-lg font-bold text-gray-900">Chi tiết đơn đặt: {selectedBooking.bookingCode}</h3>
                <StatusBadge status={selectedBooking.status} />
              </div>
            </div>
            <div className="space-y-2 text-sm text-gray-700">
              <p><span className="font-semibold text-gray-500">Cơ sở:</span> {selectedBooking.placeName}</p>
              <p><span className="font-semibold text-gray-500">Khách hàng:</span> {selectedBooking.customerName}</p>
              <p><span className="font-semibold text-gray-500">Số điện thoại:</span> {selectedBooking.customerPhone}</p>
              <p><span className="font-semibold text-gray-500">Email:</span> {selectedBooking.customerEmail}</p>
              <p><span className="font-semibold text-gray-500">Ngày dịch vụ:</span> {selectedBooking.date}</p>
              <p><span className="font-semibold text-gray-500">Số lượng khách:</span> {selectedBooking.numGuests} người</p>
              <p><span className="font-semibold text-gray-500">Tổng thanh toán:</span> {selectedBooking.totalPrice.toLocaleString('vi-VN')} VNĐ</p>
              <p><span className="font-semibold text-gray-500">Phương thức:</span> {selectedBooking.paymentMethod === 'TRANSFER' ? 'Chuyển khoản' : 'Tiền mặt'}</p>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs rounded-xl"
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
