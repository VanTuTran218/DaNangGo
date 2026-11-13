'use client';

export type PartnerStatusType =
  | 'ACTIVE'
  | 'LOCKED'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'HIDDEN'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'PAID'
  | 'EXPIRED'
  | string;

interface PartnerStatusBadgeProps {
  status: PartnerStatusType;
  customLabel?: string;
  size?: 'sm' | 'md';
}

const STATUS_MAP: Record<
  string,
  { label: string; className: string; dotClass: string; pulse?: boolean }
> = {
  ACTIVE: {
    label: 'Đang hoạt động',
    className: 'bg-emerald-50/90 text-emerald-700 border-emerald-200/90',
    dotClass: 'bg-emerald-500',
    pulse: true,
  },
  APPROVED: {
    label: 'Đã duyệt',
    className: 'bg-[#E9F8F5] text-[#008F89] border-[#BDE8E0]',
    dotClass: 'bg-[#14B8A6]',
  },
  PENDING: {
    label: 'Chờ duyệt',
    className: 'bg-amber-50/95 text-amber-700 border-amber-200/90',
    dotClass: 'bg-amber-500',
  },
  REJECTED: {
    label: 'Từ chối',
    className: 'bg-rose-50/90 text-rose-700 border-rose-200/90',
    dotClass: 'bg-rose-500',
  },
  LOCKED: {
    label: 'Đã khóa',
    className: 'bg-red-50/90 text-red-700 border-red-200/90',
    dotClass: 'bg-red-500',
  },
  HIDDEN: {
    label: 'Đã ẩn',
    className: 'bg-slate-100 text-slate-600 border-slate-200',
    dotClass: 'bg-slate-400',
  },
  CONFIRMED: {
    label: 'Đã xác nhận',
    className: 'bg-sky-50/95 text-[#087CB2] border-sky-200/90',
    dotClass: 'bg-[#087CB2]',
  },
  COMPLETED: {
    label: 'Hoàn thành',
    className: 'bg-emerald-50/95 text-emerald-700 border-emerald-200/90',
    dotClass: 'bg-emerald-500',
  },
  CANCELLED: {
    label: 'Đã hủy',
    className: 'bg-slate-100/90 text-slate-600 border-slate-200/90',
    dotClass: 'bg-slate-400',
  },
  PAID: {
    label: 'Đã thanh toán',
    className: 'bg-[#E9F8F5] text-[#008F89] border-[#BDE8E0]',
    dotClass: 'bg-[#14B8A6]',
  },
  EXPIRED: {
    label: 'Hết hạn',
    className: 'bg-slate-100 text-slate-600 border-slate-200',
    dotClass: 'bg-slate-400',
  },
};

export default function PartnerStatusBadge({
  status,
  customLabel,
  size = 'md',
}: PartnerStatusBadgeProps) {
  const config = STATUS_MAP[status] || {
    label: customLabel || status,
    className: 'bg-slate-100 text-slate-700 border-slate-200',
    dotClass: 'bg-slate-500',
  };

  const sizeClass =
    size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold border shadow-2xs transition-colors whitespace-nowrap ${sizeClass} ${config.className}`}
    >
      <span className="relative flex h-1.5 w-1.5">
        {config.pulse && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.dotClass}`}
          />
        )}
        <span
          className={`relative inline-flex rounded-full h-1.5 w-1.5 ${config.dotClass}`}
        />
      </span>
      <span>{customLabel || config.label}</span>
    </span>
  );
}
