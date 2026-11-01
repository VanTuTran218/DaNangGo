'use client';

import { useState } from 'react';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getAdminUsers, updateAdminUserStatus } from '@/lib/api/admin';
import type { AdminUserItem } from '@/types/admin';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Eye, Lock, Unlock, X } from 'lucide-react';

export default function AdminUsersPage() {
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);
  const [confirmUser, setConfirmUser] = useState<AdminUserItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const { data: users, loading, error, reload } = useAsyncData(
    () => getAdminUsers({ role: roleFilter, status: statusFilter }),
    [roleFilter, statusFilter]
  );

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggleLock = async () => {
    if (!confirmUser) return;
    setActionLoading(true);
    try {
      const newStatus = confirmUser.status === 'LOCKED' ? 'ACTIVE' : 'LOCKED';
      const res = await updateAdminUserStatus(confirmUser.id, newStatus);
      showToast(res.message);
      setConfirmUser(null);
      reload();
    } catch (err: any) {
      showToast(err?.message || 'Thao tác thất bại.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const columns: Column<AdminUserItem>[] = [
    {
      key: 'name',
      header: 'Họ và tên',
      sortable: true,
      render: (u) => (
        <div>
          <p className="font-bold text-gray-900">{u.name}</p>
          <p className="text-xs text-gray-500">{u.email}</p>
        </div>
      ),
    },
    { key: 'phone', header: 'Số điện thoại', render: (u) => u.phone || '-' },
    {
      key: 'role',
      header: 'Vai trò',
      render: (u) => (
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            u.role === 'ADMIN'
              ? 'bg-purple-100 text-purple-700'
              : u.role === 'PARTNER'
              ? 'bg-teal-100 text-teal-700'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {u.role === 'ADMIN' ? 'Quản trị' : u.role === 'PARTNER' ? 'Đối tác' : 'Người dùng'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (u) => <StatusBadge status={u.status} />,
    },
    {
      key: 'createdAt',
      header: 'Ngày tạo',
      sortable: true,
      render: (u) => new Date(u.createdAt).toLocaleDateString('vi-VN'),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      render: (u) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedUser(u)}
            title="Xem chi tiết"
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-teal-600 transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          {u.role !== 'ADMIN' && (
            <button
              onClick={() => setConfirmUser(u)}
              title={u.status === 'LOCKED' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
              className={`p-1.5 rounded-lg transition-colors ${
                u.status === 'LOCKED'
                  ? 'text-emerald-600 hover:bg-emerald-50'
                  : 'text-rose-600 hover:bg-rose-50'
              }`}
            >
              {u.status === 'LOCKED' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý người dùng</h1>
        <p className="text-sm text-gray-500">Danh sách tài khoản và phân quyền trên hệ thống.</p>
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
          data={users || []}
          columns={columns}
          loading={loading}
          searchPlaceholder="Tìm theo tên hoặc email..."
          searchField={(u) => `${u.name} ${u.email}`}
          rowKey={(u) => u.id}
          filterSlot={
            <>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="ALL">Tất cả vai trò</option>
                <option value="USER">Người dùng</option>
                <option value="PARTNER">Đối tác</option>
                <option value="ADMIN">Quản trị</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="ACTIVE">Hoạt động</option>
                <option value="LOCKED">Đã khóa</option>
              </select>
            </>
          }
        />
      )}

      {/* Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 relative space-y-4">
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute right-4 top-4 p-1 text-gray-400 hover:text-gray-600 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-gray-900">Chi tiết người dùng</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p><span className="font-semibold text-gray-500">ID:</span> {selectedUser.id}</p>
              <p><span className="font-semibold text-gray-500">Họ tên:</span> {selectedUser.name}</p>
              <p><span className="font-semibold text-gray-500">Email:</span> {selectedUser.email}</p>
              <p><span className="font-semibold text-gray-500">SĐT:</span> {selectedUser.phone || 'Chưa cập nhật'}</p>
              <p><span className="font-semibold text-gray-500">Vai trò:</span> {selectedUser.role}</p>
              <p><span className="font-semibold text-gray-500">Trạng thái:</span> <StatusBadge status={selectedUser.status} /></p>
              <p><span className="font-semibold text-gray-500">Ngày tạo:</span> {new Date(selectedUser.createdAt).toLocaleString('vi-VN')}</p>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs rounded-xl"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lock/Unlock Dialog */}
      <ConfirmDialog
        isOpen={Boolean(confirmUser)}
        onClose={() => setConfirmUser(null)}
        onConfirm={handleToggleLock}
        loading={actionLoading}
        title={confirmUser?.status === 'LOCKED' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
        description={`Bạn có chắc chắn muốn ${
          confirmUser?.status === 'LOCKED' ? 'mở khóa' : 'khóa'
        } tài khoản của ${confirmUser?.name} (${confirmUser?.email})?`}
        variant={confirmUser?.status === 'LOCKED' ? 'teal' : 'danger'}
        confirmText={confirmUser?.status === 'LOCKED' ? 'Mở khóa' : 'Khóa tài khoản'}
      />
    </div>
  );
}
