'use client';

import { useState } from 'react';
import { useAsyncData } from '@/hooks/useAsyncData';
import {
  getAdminPartners,
  approveAdminPartner,
  rejectAdminPartner,
  updateAdminPartnerStatus,
} from '@/lib/api/admin';
import type { AdminPartnerItem, PartnerApprovalStatus } from '@/types/admin';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Check, X, Lock, Eye, Building2 } from 'lucide-react';

const TABS: { key: PartnerApprovalStatus | 'ALL'; label: string }[] = [
  { key: 'PENDING', label: 'Chờ duyệt' },
  { key: 'APPROVED', label: 'Đang hoạt động' },
  { key: 'REJECTED', label: 'Bị từ chối' },
  { key: 'LOCKED', label: 'Bị khóa' },
  { key: 'ALL', label: 'Tất cả' },
];

export default function AdminPartnersPage() {
  const [activeTab, setActiveTab] = useState<PartnerApprovalStatus | 'ALL'>('PENDING');
  const [selectedPartner, setSelectedPartner] = useState<AdminPartnerItem | null>(null);
  const [rejectingPartner, setRejectingPartner] = useState<AdminPartnerItem | null>(null);
  const [lockingPartner, setLockingPartner] = useState<AdminPartnerItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const { data: partners, loading, error, reload } = useAsyncData(
    () => getAdminPartners({ status: activeTab }),
    [activeTab]
  );

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleApprove = async (partner: AdminPartnerItem) => {
    setActionLoading(true);
    try {
      const res = await approveAdminPartner(partner.id);
      showToast(res.message);
      reload();
    } catch (err: any) {
      showToast(err?.message || 'Thao tác thất bại', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async (reason?: string) => {
    if (!rejectingPartner || !reason) return;
    setActionLoading(true);
    try {
      const res = await rejectAdminPartner(rejectingPartner.id, reason);
      showToast(res.message);
      setRejectingPartner(null);
      reload();
    } catch (err: any) {
      showToast(err?.message || 'Thao tác thất bại', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLockToggle = async () => {
    if (!lockingPartner) return;
    setActionLoading(true);
    try {
      const nextStatus = lockingPartner.status === 'LOCKED' ? 'APPROVED' : 'LOCKED';
      const res = await updateAdminPartnerStatus(lockingPartner.id, nextStatus);
      showToast(res.message);
      setLockingPartner(null);
      reload();
    } catch (err: any) {
      showToast(err?.message || 'Thao tác thất bại', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const columns: Column<AdminPartnerItem>[] = [
    {
      key: 'businessName',
      header: 'Tên doanh nghiệp',
      sortable: true,
      render: (p) => (
        <div>
          <p className="font-bold text-gray-900">{p.businessName}</p>
          <p className="text-xs text-gray-500">MST: {p.taxCode}</p>
        </div>
      ),
    },
    {
      key: 'serviceType',
      header: 'Loại dịch vụ',
      render: (p) => (
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
          {p.serviceType === 'STAY' ? 'Lưu trú' : p.serviceType === 'TABLE' ? 'Ẩm thực' : 'Vé/Tour'}
        </span>
      ),
    },
    { key: 'phone', header: 'Liên hệ', render: (p) => `${p.phone} (${p.email})` },
    { key: 'status', header: 'Trạng thái', render: (p) => <StatusBadge status={p.status} /> },
    {
      key: 'actions',
      header: 'Thao tác',
      render: (p) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSelectedPartner(p)}
            title="Xem hồ sơ"
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-teal-600"
          >
            <Eye className="w-4 h-4" />
          </button>
          {p.status === 'PENDING' && (
            <>
              <button
                onClick={() => handleApprove(p)}
                disabled={actionLoading}
                title="Duyệt đối tác"
                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => setRejectingPartner(p)}
                disabled={actionLoading}
                title="Từ chối đối tác"
                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
          {p.status === 'APPROVED' && (
            <button
              onClick={() => setLockingPartner(p)}
              title="Khóa đối tác"
              className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50"
            >
              <Lock className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý đối tác</h1>
        <p className="text-sm text-gray-500">Duyệt và kiểm soát tài khoản các bên cung cấp dịch vụ.</p>
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

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
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
          data={partners || []}
          columns={columns}
          loading={loading}
          searchPlaceholder="Tìm theo tên doanh nghiệp, MST, email..."
          searchField={(p) => `${p.businessName} ${p.taxCode} ${p.email}`}
          rowKey={(p) => p.id}
        />
      )}

      {/* View Partner Profile Modal */}
      {selectedPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100 relative space-y-4">
            <button
              onClick={() => setSelectedPartner(null)}
              className="absolute right-4 top-4 p-1 text-gray-400 hover:text-gray-600 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selectedPartner.businessName}</h3>
                <p className="text-xs text-gray-500">Mã hồ sơ: {selectedPartner.id}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-700 pt-2 border-t border-gray-100">
              <p><span className="font-semibold text-gray-500">Loại dịch vụ:</span> {selectedPartner.serviceType}</p>
              <p><span className="font-semibold text-gray-500">Mã số thuế:</span> {selectedPartner.taxCode}</p>
              <p><span className="font-semibold text-gray-500">Địa chỉ kinh doanh:</span> {selectedPartner.address}</p>
              <p><span className="font-semibold text-gray-500">Số điện thoại:</span> {selectedPartner.phone}</p>
              <p><span className="font-semibold text-gray-500">Email:</span> {selectedPartner.email}</p>
              <p><span className="font-semibold text-gray-500">Trạng thái:</span> <StatusBadge status={selectedPartner.status} /></p>
              {selectedPartner.rejectReason && (
                <p className="p-3 bg-red-50 text-red-700 text-xs rounded-xl font-medium">
                  <span className="font-bold">Lý do từ chối:</span> {selectedPartner.rejectReason}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => setSelectedPartner(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs rounded-xl"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      <ConfirmDialog
        isOpen={Boolean(rejectingPartner)}
        onClose={() => setRejectingPartner(null)}
        onConfirm={handleRejectConfirm}
        title="Từ chối hồ sơ đối tác"
        description={`Vui lòng nhập lý do từ chối hồ sơ của ${rejectingPartner?.businessName}:`}
        variant="danger"
        confirmText="Từ chối hồ sơ"
        requireReason={true}
        reasonPlaceholder="Mã số thuế không đúng, địa chỉ chưa chính xác..."
        loading={actionLoading}
      />

      {/* Lock Dialog */}
      <ConfirmDialog
        isOpen={Boolean(lockingPartner)}
        onClose={() => setLockingPartner(null)}
        onConfirm={handleLockToggle}
        title="Khóa tài khoản đối tác"
        description={`Bạn có chắc chắn muốn khóa tài khoản đối tác ${lockingPartner?.businessName}?`}
        variant="danger"
        confirmText="Khóa tài khoản"
        loading={actionLoading}
      />
    </div>
  );
}
