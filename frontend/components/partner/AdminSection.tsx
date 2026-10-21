'use client';

import { ShieldAlert, Users, CheckCircle } from 'lucide-react';
import type { PartnerPlaceStatus } from '@/types/partner';

interface AdminSectionProps {
  partnerId: number | null;
  onPartnerIdChange: (id: number | null) => void;
  status: PartnerPlaceStatus;
  onStatusChange: (status: PartnerPlaceStatus) => void;
}

export default function AdminSection({
  partnerId,
  onPartnerIdChange,
  status,
  onStatusChange,
}: AdminSectionProps) {
  return (
    <div className="space-y-4">
      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 leading-relaxed font-medium">
        Khu vực dành riêng cho Quản trị viên (Admin Portal). Bạn có quyền gán đối tác sở hữu và thiết lập trạng thái đặc biệt (bao gồm khóa cơ sở <strong>LOCKED</strong>).
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Partner ID */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-orange-600" />
            ID Đối tác sở hữu (Partner ID)
          </label>
          <input
            type="number"
            value={partnerId ?? ''}
            onChange={(e) => onPartnerIdChange(e.target.value ? Number(e.target.value) : null)}
            placeholder="VD: 1, 2, 3..."
            className="w-full px-4 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 font-mono transition-all"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-orange-600" />
            Trạng thái phê duyệt / Khóa
          </label>
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value as PartnerPlaceStatus)}
            className="w-full px-4 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 font-bold transition-all"
          >
            <option value="ACTIVE">Đang hoạt động (ACTIVE)</option>
            <option value="HIDDEN">Đã ẩn (HIDDEN)</option>
            <option value="PENDING">Chờ duyệt (PENDING)</option>
            <option value="LOCKED">Khóa cơ sở (LOCKED) - Chỉ Admin</option>
          </select>
        </div>
      </div>
    </div>
  );
}
