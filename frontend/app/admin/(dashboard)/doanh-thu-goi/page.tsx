'use client';

import { useState } from 'react';
import { useAsyncData } from '@/hooks/useAsyncData';
import {
  adminConfirmPayment,
  adminGetPackages,
  adminGetRevenueStats,
  adminGetSubscriptions,
  adminRejectPayment,
  adminUpdatePackage,
  getAdminExportCsvUrl,
} from '@/lib/api/subscription';
import type {
  PartnerSubscriptionItem,
  RevenueStats,
  SubscriptionPackage,
  SubscriptionPaymentStatus,
} from '@/types/subscription';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import ColumnChart from '@/components/ui/ColumnChart';
import {
  AlertCircle,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Download,
  Eye,
  Filter,
  Package,
  RefreshCw,
  Search,
  SlidersHorizontal,
  TrendingUp,
  X,
  XCircle,
} from 'lucide-react';

const TABS = [
  { key: 'REVENUE', label: 'Báo cáo doanh thu phí gói' },
  { key: 'SUBSCRIPTIONS', label: 'Duyệt thanh toán đối tác' },
  { key: 'PACKAGES', label: 'Quản lý bảng giá gói' },
] as const;

export default function AdminSubscriptionRevenuePage() {
  const [activeTab, setActiveTab] = useState<'REVENUE' | 'SUBSCRIPTIONS' | 'PACKAGES'>('REVENUE');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [packageFilter, setPackageFilter] = useState<number | undefined>(undefined);
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState<string>('');

  const [selectedSub, setSelectedSub] = useState<PartnerSubscriptionItem | null>(null);
  const [confirmingSub, setConfirmingSub] = useState<PartnerSubscriptionItem | null>(null);
  const [rejectingSub, setRejectingSub] = useState<PartnerSubscriptionItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Revenue stats async data
  const {
    data: stats,
    loading: loadingStats,
    error: errorStats,
    reload: reloadStats,
  } = useAsyncData(
    () =>
      adminGetRevenueStats({
        startDate: startDateFilter || undefined,
        endDate: endDateFilter || undefined,
        packageId: packageFilter,
      }),
    [startDateFilter, endDateFilter, packageFilter]
  );

  // Subscriptions async data
  const {
    data: subscriptions,
    loading: loadingSubs,
    error: errorSubs,
    reload: reloadSubs,
  } = useAsyncData(
    () =>
      adminGetSubscriptions({
        status: statusFilter,
        packageId: packageFilter,
        search: searchFilter || undefined,
        startDate: startDateFilter || undefined,
        endDate: endDateFilter || undefined,
      }),
    [statusFilter, packageFilter, searchFilter, startDateFilter, endDateFilter]
  );

  // Packages async data
  const {
    data: packages,
    loading: loadingPackages,
    reload: reloadPackages,
  } = useAsyncData(adminGetPackages);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleConfirmPayment = async () => {
    if (!confirmingSub) return;
    setActionLoading(true);
    try {
      await adminConfirmPayment(confirmingSub.id);
      showToast(`Đã xác nhận thanh toán mã ${confirmingSub.transactionCode}. Gói đã được kích hoạt.`);
      setConfirmingSub(null);
      reloadSubs();
      reloadStats();
    } catch (err: any) {
      showToast(err?.message || 'Không thể xác nhận thanh toán.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectPaymentConfirm = async (reason?: string) => {
    if (!rejectingSub || !reason) return;
    setActionLoading(true);
    try {
      await adminRejectPayment(rejectingSub.id, reason);
      showToast(`Đã từ chối giao dịch ${rejectingSub.transactionCode}.`);
      setRejectingSub(null);
      reloadSubs();
      reloadStats();
    } catch (err: any) {
      showToast(err?.message || 'Không thể từ chối giao dịch.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTogglePackageStatus = async (pkg: SubscriptionPackage) => {
    try {
      await adminUpdatePackage(pkg.package_id, { isActive: !pkg.is_active });
      showToast(`Đã ${!pkg.is_active ? 'bật' : 'tắt'} phát hành ${pkg.name}.`);
      reloadPackages();
    } catch (err: any) {
      showToast(err?.message || 'Không thể cập nhật trạng thái gói.', 'error');
    }
  };

  const columns: Column<PartnerSubscriptionItem>[] = [
    {
      key: 'transactionCode',
      header: 'Mã GD / Doanh nghiệp',
      sortable: true,
      render: (s) => (
        <div>
          <p className="font-mono font-bold text-gray-900">{s.transactionCode}</p>
          <p className="text-xs text-gray-600 font-semibold">{s.businessName || 'Đối tác'}</p>
          <p className="text-[11px] text-gray-400">{s.partnerEmail}</p>
        </div>
      ),
    },
    {
      key: 'packageName',
      header: 'Gói đăng ký',
      render: (s) => (
        <div>
          <span className="font-bold text-gray-800">{s.packageName}</span>
          <span className="block text-xs text-teal-600 font-semibold">{s.durationMonths} tháng</span>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Số tiền',
      sortable: true,
      render: (s) => (
        <span className="font-bold text-gray-900">{Number(s.price).toLocaleString('vi-VN')} đ</span>
      ),
    },
    {
      key: 'paymentStatus',
      header: 'Thanh toán',
      render: (s) => (
        <div>
          <StatusBadge
            status={s.paymentStatus}
            customLabel={
              s.paymentStatus === 'PAID'
                ? 'Đã thu tiền'
                : s.paymentStatus === 'REJECTED'
                ? 'Đã từ chối'
                : 'Chờ đối soát'
            }
          />
          {s.paymentReference && (
            <span className="block text-[11px] text-gray-500 font-mono mt-0.5">
              Ref: {s.paymentReference}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'subscriptionStatus',
      header: 'Trạng thái gói',
      render: (s) => (
        <div>
          <StatusBadge
            status={s.subscriptionStatus}
            customLabel={
              s.subscriptionStatus === 'ACTIVE'
                ? 'Đang hoạt động'
                : s.subscriptionStatus === 'EXPIRED'
                ? 'Hết hạn'
                : s.subscriptionStatus === 'REJECTED'
                ? 'Từ chối'
                : 'Chờ duyệt'
            }
          />
          {s.endDate && (
            <span className="block text-[10px] text-gray-400 mt-0.5">
              Hạn: {new Date(s.endDate).toLocaleDateString('vi-VN')}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Thời điểm',
      render: (s) => (
        <div className="text-[11px] text-gray-500">
          <p>Tạo: {new Date(s.createdAt).toLocaleString('vi-VN')}</p>
          {s.confirmedAt && <p className="text-emerald-700">Duyệt: {new Date(s.confirmedAt).toLocaleString('vi-VN')}</p>}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      render: (s) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSelectedSub(s)}
            title="Xem chi tiết giao dịch"
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-teal-600"
          >
            <Eye className="w-4 h-4" />
          </button>
          {s.paymentStatus === 'PENDING' && (
            <>
              <button
                onClick={() => setConfirmingSub(s)}
                disabled={actionLoading}
                title="Xác nhận đã nhận chuyển khoản"
                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => setRejectingSub(s)}
                disabled={actionLoading}
                title="Từ chối giao dịch"
                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  const exportUrl = getAdminExportCsvUrl({
    status: statusFilter,
    packageId: packageFilter,
    search: searchFilter || undefined,
    startDate: startDateFilter || undefined,
    endDate: endDateFilter || undefined,
  });
  const statsAuthError = Boolean(errorStats && /đăng nhập|phiên.*hết hạn|phiên.*không hợp lệ/i.test(errorStats));

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CircleDollarSign className="w-7 h-7 text-teal-600" />
            Doanh thu & Gói đăng ký đối tác
          </h1>
          <p className="text-sm text-gray-500">
            Quản lý các gói hoạt động, đối soát giao dịch chuyển khoản và theo dõi doanh thu phí nền tảng DaNangGo.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          <a
            href={exportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-teal-600" />
            Xuất file CSV
          </a>
          <button
            onClick={() => {
              reloadStats();
              reloadSubs();
              reloadPackages();
            }}
            className="p-2 bg-white border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 shadow-xs"
            title="Tải lại dữ liệu"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          role="alert"
          className={`p-4 rounded-xl border text-sm font-semibold flex items-center justify-between ${
            toast.type === 'error'
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-teal-50 text-teal-700 border-teal-200'
          }`}
        >
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Tabs */}
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

      {/* ==================== TAB 1: REVENUE DASHBOARD ==================== */}
      {activeTab === 'REVENUE' && (
        <div className="space-y-6">
          {errorStats && (
            <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="flex-1">
                <p className="font-bold">Không tải được báo cáo doanh thu</p>
                <p className="mt-1">
                  {statsAuthError
                    ? `${errorStats}. Hãy đăng nhập lại tài khoản Admin rồi tải lại báo cáo.`
                    : `${errorStats}. Hãy kiểm tra backend/API và kết nối SQL Server, sau đó tải lại báo cáo.`}
                </p>
              </div>
              <button onClick={reloadStats} className="shrink-0 font-bold underline">Thử lại</button>
            </div>
          )}

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-gray-700">
              <Filter className="w-4 h-4 text-teal-600" />
              <span>Bộ lọc thời gian:</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-gray-500 font-semibold">Từ ngày:</span>
              <input
                type="date"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
                className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-gray-800 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-gray-500 font-semibold">Đến ngày:</span>
              <input
                type="date"
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
                className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-gray-800 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-gray-500 font-semibold">Loại gói:</span>
              <select
                value={packageFilter || ''}
                onChange={(e) => setPackageFilter(e.target.value ? Number(e.target.value) : undefined)}
                className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-gray-800 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="">Tất cả các gói</option>
                {(packages || []).map((p) => (
                  <option key={p.package_id} value={p.package_id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {(startDateFilter || endDateFilter || packageFilter) && (
              <button
                onClick={() => {
                  setStartDateFilter('');
                  setEndDateFilter('');
                  setPackageFilter(undefined);
                }}
                className="text-rose-600 hover:underline font-bold text-xs ml-auto"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>

          {/* KPI Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-teal-100 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500">Tổng phí gói đã thu</p>
                <p className="text-2xl font-black text-teal-700 mt-1">
                  {errorStats ? '—' : Number(stats?.totalRevenue ?? 0).toLocaleString('vi-VN')}{' '}
                  <span className="text-xs font-bold text-gray-500">VNĐ</span>
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">Chỉ tính giao dịch đã xác nhận</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-teal-50 text-teal-600">
                <CircleDollarSign className="w-7 h-7" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500">Giao dịch đã xác nhận</p>
                <p className="text-2xl font-black text-emerald-700 mt-1">{errorStats ? '—' : stats?.totalConfirmedCount ?? 0}</p>
                <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Đã kích hoạt gói</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="w-7 h-7" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-amber-100 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500">Chờ đối soát chuyển khoản</p>
                <p className="text-2xl font-black text-amber-700 mt-1">{errorStats ? '—' : stats?.totalPendingCount ?? 0}</p>
                <p className="text-[11px] text-amber-600 font-semibold mt-0.5">Yêu cầu cần Admin kiểm tra</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-600">
                <Clock className="w-7 h-7" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-rose-100 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500">Giao dịch từ chối</p>
                <p className="text-2xl font-black text-rose-700 mt-1">{errorStats ? '—' : stats?.totalRejectedCount ?? 0}</p>
                <p className="text-[11px] text-rose-500 mt-0.5">Sai mã hoặc không hợp lệ</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-rose-50 text-rose-600">
                <XCircle className="w-7 h-7" />
              </div>
            </div>
          </div>

          {/* Package Lifecycle Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-900 block">Gói đang hoạt động</span>
                <span className="text-xs text-emerald-700">Đối tác có quyền tạo & quản lý cơ sở</span>
              </div>
              <span className="text-2xl font-black text-emerald-800">{stats?.activePackagesCount ?? 0}</span>
            </div>

            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-900 block">Gói sắp hết hạn (≤ 7 ngày)</span>
                <span className="text-xs text-amber-700">Cần nhắc đối tác gia hạn</span>
              </div>
              <span className="text-2xl font-black text-amber-800">{stats?.expiringSoonCount ?? 0}</span>
            </div>

            <div className="bg-gray-100 border border-gray-200 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-800 block">Gói đã hết hạn</span>
                <span className="text-xs text-gray-500">Bị chặn thao tác đăng cơ sở mới</span>
              </div>
              <span className="text-2xl font-black text-gray-800">{stats?.expiredCount ?? 0}</span>
            </div>
          </div>

          {/* Breakdown & Daily Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue by Package */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-1">Doanh thu theo loại gói</h3>
                <p className="text-xs text-gray-500 mb-4">Phân bổ doanh thu giữa gói 1 tháng, 6 tháng và 1 năm</p>

                <div className="space-y-3">
                  {(stats?.byPackage || []).length === 0 ? (
                    <p className="text-xs text-gray-400 py-4 text-center">Chưa có giao dịch thanh toán nào.</p>
                  ) : (
                    stats?.byPackage.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-xs text-gray-900">{item.packageName}</p>
                          <p className="text-[11px] text-gray-500">{item.count} lượt đăng ký thành công</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-xs text-teal-700">
                            {Number(item.revenue).toLocaleString('vi-VN')} đ
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-400 flex items-center justify-between">
                <span>Dữ liệu xác thực từ SQL Server</span>
                <Package className="w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Daily Chart */}
            <div className="lg:col-span-2">
              <ColumnChart
                data={(stats?.byDay || []).map((d) => ({ date: d.date, count: d.revenue }))}
                title="Biểu đồ doanh thu phí gói theo ngày (VNĐ)"
                subtitle="Chỉ tính các giao dịch đã hoàn tất thanh toán hợp lệ"
                barColor="#0d9488"
              />
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: SUBSCRIPTION APPROVAL & TRANSACTIONS ==================== */}
      {activeTab === 'SUBSCRIPTIONS' && (
        <div className="space-y-6">
          {/* Filter Subscriptions */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === 'ALL' ? 'bg-white shadow-xs text-gray-900' : 'text-gray-600'
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setStatusFilter('PENDING')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === 'PENDING' ? 'bg-amber-500 text-white shadow-xs' : 'text-gray-600'
                }`}
              >
                Chờ duyệt thanh toán
              </button>
              <button
                onClick={() => setStatusFilter('PAID')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === 'PAID' ? 'bg-teal-600 text-white shadow-xs' : 'text-gray-600'
                }`}
              >
                Đã thanh toán
              </button>
              <button
                onClick={() => setStatusFilter('REJECTED')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === 'REJECTED' ? 'bg-rose-600 text-white shadow-xs' : 'text-gray-600'
                }`}
              >
                Từ chối
              </button>
            </div>

            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm mã GD, tên đối tác, email, mã tham chiếu..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          {errorSubs ? (
            <div className="p-6 bg-red-50 rounded-2xl border border-red-200 text-red-700">
              <p className="font-semibold mb-2">{errorSubs}</p>
              <button onClick={reloadSubs} className="px-4 py-2 bg-red-600 text-white rounded-xl font-semibold text-xs">
                Thử lại
              </button>
            </div>
          ) : (
            <DataTable
              data={subscriptions || []}
              columns={columns}
              loading={loadingSubs}
              searchPlaceholder="Tìm kiếm..."
              searchField={(s) =>
                `${s.transactionCode} ${s.businessName || ''} ${s.partnerEmail || ''} ${s.paymentReference || ''}`
              }
              rowKey={(s) => String(s.id)}
            />
          )}
        </div>
      )}

      {/* ==================== TAB 3: PACKAGE MANAGEMENT ==================== */}
      {activeTab === 'PACKAGES' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">Danh sách các gói dịch vụ đối tác</h2>
              <p className="text-xs text-gray-500">
                Bật/tắt phát hành các gói giá trong hệ thống SQL Server. Không xóa cứng gói đã có dữ liệu giao dịch.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(packages || []).map((pkg) => (
              <div
                key={pkg.package_id}
                className={`bg-white rounded-2xl p-6 border transition-all ${
                  pkg.is_active ? 'border-gray-200 shadow-xs' : 'border-gray-200 opacity-60 bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-base text-gray-900">{pkg.name}</h3>
                    <span className="text-xs font-mono text-gray-400">{pkg.package_code}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      pkg.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {pkg.is_active ? 'Đang mở bán' : 'Tạm tắt'}
                  </span>
                </div>

                <div className="py-2 space-y-1">
                  <p className="text-2xl font-black text-gray-900">
                    {Number(pkg.price).toLocaleString('vi-VN')} <span className="text-xs font-semibold">VNĐ</span>
                  </p>
                  <p className="text-xs text-gray-500">Thời hạn: {pkg.duration_months} tháng sử dụng</p>
                  <p className="text-xs text-gray-600 mt-2">{pkg.description}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <button
                    onClick={() => handleTogglePackageStatus(pkg)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors ${
                      pkg.is_active
                        ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    {pkg.is_active ? 'Tắt phát hành gói' : 'Mở lại gói này'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View Detail Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 relative space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedSub(null)}
              className="absolute right-4 top-4 p-1 text-gray-400 hover:text-gray-600 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selectedSub.businessName || 'Thông tin đối tác'}</h3>
                <p className="text-xs text-gray-500 font-mono">Mã GD: {selectedSub.transactionCode}</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-gray-700 pt-3 border-t border-gray-100">
              <p>
                <span className="font-bold text-gray-500">Gói đăng ký:</span> {selectedSub.packageName} (
                {selectedSub.durationMonths} tháng)
              </p>
              <p>
                <span className="font-bold text-gray-500">Mức phí:</span>{' '}
                <span className="font-extrabold text-teal-700">
                  {Number(selectedSub.price).toLocaleString('vi-VN')} VNĐ
                </span>
              </p>
              <p>
                <span className="font-bold text-gray-500">Người đăng ký:</span> {selectedSub.partnerUserName} (
                {selectedSub.partnerEmail})
              </p>
              <p>
                <span className="font-bold text-gray-500">Số điện thoại:</span>{' '}
                {selectedSub.contactPhone || 'Chưa cung cấp'}
              </p>
              <p>
                <span className="font-bold text-gray-500">Phương thức:</span> Chuyển khoản ngân hàng (MB Bank)
              </p>
              <p>
                <span className="font-bold text-gray-500">Mã tham chiếu ngân hàng:</span>{' '}
                <span className="font-mono font-bold text-gray-900">
                  {selectedSub.paymentReference || 'Chưa cung cấp'}
                </span>
              </p>
              {selectedSub.paymentProofNote && (
                <p>
                  <span className="font-bold text-gray-500">Ghi chú đối tác:</span> {selectedSub.paymentProofNote}
                </p>
              )}
              <p>
                <span className="font-bold text-gray-500">Trạng thái thanh toán:</span>{' '}
                <StatusBadge status={selectedSub.paymentStatus} />
              </p>
              <p>
                <span className="font-bold text-gray-500">Trạng thái gói:</span>{' '}
                <StatusBadge status={selectedSub.subscriptionStatus} />
              </p>
              {selectedSub.startDate && selectedSub.endDate && (
                <p>
                  <span className="font-bold text-gray-500">Thời hạn sử dụng:</span>{' '}
                  {new Date(selectedSub.startDate).toLocaleDateString('vi-VN')} đến{' '}
                  {new Date(selectedSub.endDate).toLocaleDateString('vi-VN')}
                </p>
              )}
              {selectedSub.adminName && (
                <p>
                  <span className="font-bold text-gray-500">Admin xử lý:</span> {selectedSub.adminName} (
                  {selectedSub.confirmedAt ? new Date(selectedSub.confirmedAt).toLocaleString('vi-VN') : ''})
                </p>
              )}
              {selectedSub.rejectionReason && (
                <p className="p-3 bg-red-50 text-red-700 rounded-xl font-medium">
                  <span className="font-bold">Lý do từ chối:</span> {selectedSub.rejectionReason}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => setSelectedSub(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Payment Dialog */}
      <ConfirmDialog
        isOpen={Boolean(confirmingSub)}
        onClose={() => setConfirmingSub(null)}
        onConfirm={handleConfirmPayment}
        title="Xác nhận thanh toán phí gói"
        description={`Bạn đã kiểm tra tài khoản ngân hàng và xác nhận đối tác ${
          confirmingSub?.businessName
        } đã thanh toán số tiền ${Number(confirmingSub?.price || 0).toLocaleString(
          'vi-VN'
        )} VNĐ? Gói sẽ được kích hoạt ngay lập tức cho đối tác.`}
        variant="teal"
        confirmText="Xác nhận & Kích hoạt gói"
        loading={actionLoading}
      />

      {/* Reject Payment Dialog */}
      <ConfirmDialog
        isOpen={Boolean(rejectingSub)}
        onClose={() => setRejectingSub(null)}
        onConfirm={handleRejectPaymentConfirm}
        title="Từ chối thanh toán phí gói"
        description={`Vui lòng nhập lý do từ chối giao dịch của đối tác ${rejectingSub?.businessName}:`}
        variant="danger"
        confirmText="Từ chối giao dịch"
        requireReason={true}
        reasonPlaceholder="Không tìm thấy tiền vào tài khoản, sai mã giao dịch..."
        loading={actionLoading}
      />
    </div>
  );
}
