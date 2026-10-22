import { apiRequest } from './client';
import type {
  CreateSubscriptionResponse,
  PartnerCurrentSubscriptionResponse,
  PartnerSubscriptionItem,
  RevenueStats,
  SubscriptionPackage,
} from '@/types/subscription';

/**
 * Lấy danh sách các gói đăng ký đang hoạt động
 */
export async function getActivePackages(): Promise<SubscriptionPackage[]> {
  const res = await apiRequest<SubscriptionPackage[]>('/api/subscriptions/packages');
  return res.data ?? [];
}

/**
 * Lấy thông tin gói đang hoạt động của đối tác
 */
export async function getCurrentSubscription(): Promise<PartnerCurrentSubscriptionResponse> {
  const res = await apiRequest<PartnerCurrentSubscriptionResponse>('/api/subscriptions/current');
  return (
    res.data ?? {
      hasActiveSubscription: false,
      currentSubscription: null,
      daysRemaining: 0,
      isExpiringSoon: false,
    }
  );
}

/**
 * Lấy lịch sử đăng ký của đối tác
 */
export async function getMySubscriptions(): Promise<PartnerSubscriptionItem[]> {
  const res = await apiRequest<PartnerSubscriptionItem[]>('/api/subscriptions/my-subscriptions');
  return res.data ?? [];
}

/**
 * Đối tác tạo yêu cầu đăng ký gói
 */
export async function registerSubscription(
  packageId: number,
  isRenewal = false
): Promise<CreateSubscriptionResponse> {
  const res = await apiRequest<CreateSubscriptionResponse>('/api/subscriptions/register', {
    method: 'POST',
    body: JSON.stringify({ packageId, isRenewal }),
  });
  if (!res.data) throw new Error(res.message || 'Không thể tạo yêu cầu đăng ký gói.');
  return res.data;
}

/**
 * Đối tác gửi thông tin tham chiếu chuyển khoản
 */
export async function submitPaymentProof(
  subscriptionId: number,
  paymentReference?: string,
  paymentProofNote?: string
): Promise<PartnerSubscriptionItem> {
  const res = await apiRequest<PartnerSubscriptionItem>(`/api/subscriptions/${subscriptionId}/payment-proof`, {
    method: 'POST',
    body: JSON.stringify({ paymentReference, paymentProofNote }),
  });
  if (!res.data) throw new Error(res.message || 'Không thể gửi thông tin thanh toán.');
  return res.data;
}

// ==================== ADMIN APIS ====================

/**
 * Admin lấy danh sách toàn bộ gói
 */
export async function adminGetPackages(): Promise<SubscriptionPackage[]> {
  const res = await apiRequest<SubscriptionPackage[]>('/api/admin/subscriptions/packages');
  return res.data ?? [];
}

/**
 * Admin bật/tắt gói hoặc cập nhật thông tin
 */
export async function adminUpdatePackage(
  packageId: number,
  data: { isActive?: boolean; description?: string | null; name?: string }
): Promise<SubscriptionPackage> {
  const res = await apiRequest<SubscriptionPackage>(`/api/admin/subscriptions/packages/${packageId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!res.data) throw new Error(res.message || 'Không thể cập nhật gói.');
  return res.data;
}

/**
 * Admin lấy danh sách đăng ký kèm lọc
 */
export async function adminGetSubscriptions(params?: {
  status?: string;
  packageId?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}): Promise<PartnerSubscriptionItem[]> {
  const query = new URLSearchParams();
  if (params?.status && params.status !== 'ALL') query.set('status', params.status);
  if (params?.packageId) query.set('packageId', String(params.packageId));
  if (params?.search) query.set('search', params.search);
  if (params?.startDate) query.set('startDate', params.startDate);
  if (params?.endDate) query.set('endDate', params.endDate);

  const qs = query.toString() ? `?${query.toString()}` : '';
  const res = await apiRequest<PartnerSubscriptionItem[]>(`/api/admin/subscriptions${qs}`);
  return res.data ?? [];
}

/**
 * Admin xem chi tiết 1 đăng ký
 */
export async function adminGetSubscriptionDetail(subscriptionId: number): Promise<PartnerSubscriptionItem> {
  const res = await apiRequest<PartnerSubscriptionItem>(`/api/admin/subscriptions/${subscriptionId}`);
  if (!res.data) throw new Error(res.message || 'Không tìm thấy chi tiết đăng ký.');
  return res.data;
}

/**
 * Admin xác nhận thanh toán hợp lệ và kích hoạt gói
 */
export async function adminConfirmPayment(subscriptionId: number): Promise<PartnerSubscriptionItem> {
  const res = await apiRequest<PartnerSubscriptionItem>(`/api/admin/subscriptions/${subscriptionId}/confirm`, {
    method: 'PATCH',
  });
  if (!res.data) throw new Error(res.message || 'Không thể xác nhận thanh toán.');
  return res.data;
}

/**
 * Admin từ chối thanh toán kèm lý do
 */
export async function adminRejectPayment(subscriptionId: number, reason: string): Promise<PartnerSubscriptionItem> {
  const res = await apiRequest<PartnerSubscriptionItem>(`/api/admin/subscriptions/${subscriptionId}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });
  if (!res.data) throw new Error(res.message || 'Không thể từ chối thanh toán.');
  return res.data;
}

/**
 * Admin Dashboard thống kê doanh thu phí đăng ký gói
 */
export async function adminGetRevenueStats(params?: {
  startDate?: string;
  endDate?: string;
  packageId?: number;
}): Promise<RevenueStats> {
  const query = new URLSearchParams();
  if (params?.startDate) query.set('startDate', params.startDate);
  if (params?.endDate) query.set('endDate', params.endDate);
  if (params?.packageId) query.set('packageId', String(params.packageId));

  const qs = query.toString() ? `?${query.toString()}` : '';
  const res = await apiRequest<RevenueStats>(`/api/admin/subscriptions/revenue-stats${qs}`);
  if (!res.data) throw new Error(res.message || 'Không thể tải thống kê doanh thu.');
  return res.data;
}

/**
 * Lấy URL xuất file CSV
 */
export function getAdminExportCsvUrl(params?: {
  status?: string;
  packageId?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}): string {
  const query = new URLSearchParams();
  if (params?.status && params.status !== 'ALL') query.set('status', params.status);
  if (params?.packageId) query.set('packageId', String(params.packageId));
  if (params?.search) query.set('search', params.search);
  if (params?.startDate) query.set('startDate', params.startDate);
  if (params?.endDate) query.set('endDate', params.endDate);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const qs = query.toString() ? `?${query.toString()}` : '';
  return `${baseUrl.replace(/\/$/, '')}/api/admin/subscriptions/export-csv${qs}`;
}
