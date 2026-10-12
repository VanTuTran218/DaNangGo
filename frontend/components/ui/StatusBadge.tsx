'use client';

export type StatusType =
  | 'ACTIVE'
  | 'LOCKED'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'HIDDEN'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | string;

interface StatusBadgeProps {
  status: StatusType;
  customLabel?: string;
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: 'Đang hoạt động', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  APPROVED: { label: 'Đã duyệt', className: 'bg-teal-50 text-teal-700 border-teal-200' },
  PENDING: { label: 'Chờ duyệt', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  REJECTED: { label: 'Từ chối', className: 'bg-rose-50 text-rose-700 border-rose-200' },
  LOCKED: { label: 'Đã khóa', className: 'bg-red-50 text-red-700 border-red-200' },
  HIDDEN: { label: 'Đã ẩn', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  CONFIRMED: { label: 'Đã xác nhận', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  COMPLETED: { label: 'Hoàn thành', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  CANCELLED: { label: 'Đã hủy', className: 'bg-gray-100 text-gray-500 border-gray-200' },
};

export default function StatusBadge({ status, customLabel }: StatusBadgeProps) {
  const config = STATUS_MAP[status] || {
    label: customLabel || status,
    className: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${config.className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
      {customLabel || config.label}
    </span>
  );
}
