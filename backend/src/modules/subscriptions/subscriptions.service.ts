import { AuthError } from '../auth/auth.errors';
import {
  adminConfirmSubscriptionPayment,
  adminListSubscriptions,
  adminRejectSubscriptionPayment,
  checkPartnerActiveSubscriptionExists,
  createSubscriptionRecord,
  getPackageById,
  getPartnerActiveSubscription,
  getPartnerSubscriptionsList,
  getRevenueStats,
  getSubscriptionDetailById,
  listActivePackages,
  listAllPackages,
  submitPaymentProofRecord,
  updatePackage,
  type PartnerSubscriptionRow,
  type SubscriptionPackageRow,
  type RevenueStats,
} from './subscriptions.repository';

// Thông tin tài khoản ngân hàng nhận chuyển khoản của DaNangGo
export const DANANGGO_BANK_INFO = {
  bankName: 'MB Bank (Ngân hàng Quân Đội)',
  accountNumber: '999988886868',
  accountHolder: 'DANANGGO TRAVEL CO LTD',
  branch: 'Chi nhánh Đà Nẵng',
};

function generateTransactionCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `DNG-SUB-${timestamp}-${randomPart}`;
}

export function calculateRemainingDays(endDate: Date | null): number {
  if (!endDate) return 0;
  const now = new Date();
  const diffTime = new Date(endDate).getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
}

export interface FormattedSubscription {
  id: number;
  transactionCode: string;
  partnerId: number;
  packageId: number;
  packageName: string;
  durationMonths: number;
  price: number;
  subscriptionStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  paymentReference: string | null;
  paymentProofNote: string | null;
  paymentSubmittedAt: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  daysRemaining: number;
  isExpiringSoon: boolean;
  confirmedBy: number | null;
  confirmedAt: string | null;
  adminName?: string | null | undefined;
  rejectionReason: string | null;
  isRenewal: boolean;
  businessName?: string | undefined;
  contactPhone?: string | null | undefined;
  partnerEmail?: string | undefined;
  partnerUserName?: string | undefined;
}

export function formatSubscription(row: PartnerSubscriptionRow): FormattedSubscription {
  const daysRemaining = calculateRemainingDays(row.end_date);
  const isExpiringSoon = row.subscription_status === 'ACTIVE' && daysRemaining > 0 && daysRemaining <= 7;

  return {
    id: row.subscription_id,
    transactionCode: row.transaction_code,
    partnerId: row.partner_id,
    packageId: row.package_id,
    packageName: row.package_name,
    durationMonths: row.duration_months,
    price: Number(row.price),
    subscriptionStatus: row.subscription_status,
    paymentStatus: row.payment_status,
    paymentMethod: row.payment_method,
    paymentReference: row.payment_reference,
    paymentProofNote: row.payment_proof_note,
    paymentSubmittedAt: row.payment_submitted_at ? new Date(row.payment_submitted_at).toISOString() : null,
    startDate: row.start_date ? new Date(row.start_date).toISOString() : null,
    endDate: row.end_date ? new Date(row.end_date).toISOString() : null,
    createdAt: new Date(row.created_at).toISOString(),
    daysRemaining,
    isExpiringSoon,
    confirmedBy: row.confirmed_by,
    confirmedAt: row.confirmed_at ? new Date(row.confirmed_at).toISOString() : null,
    adminName: row.admin_name ?? null,
    rejectionReason: row.rejection_reason,
    isRenewal: Boolean(row.is_renewal),
    businessName: row.business_name,
    contactPhone: row.contact_phone,
    partnerEmail: row.partner_email,
    partnerUserName: row.partner_user_name,
  };
}

/**
 * Lấy danh sách gói giá cho đối tác
 */
export async function getActivePackagesService(): Promise<SubscriptionPackageRow[]> {
  return listActivePackages();
}

/**
 * Lấy danh sách toàn bộ gói cho admin
 */
export async function getAllPackagesAdminService(): Promise<SubscriptionPackageRow[]> {
  return listAllPackages();
}

/**
 * Admin bật/tắt hoặc cập nhật gói
 */
export async function updatePackageAdminService(
  packageId: number,
  data: { isActive?: boolean | undefined; description?: string | null | undefined; name?: string | undefined }
): Promise<SubscriptionPackageRow> {
  const existing = await getPackageById(packageId);
  if (!existing) throw new AuthError(404, 'Không tìm thấy gói đăng ký.');

  const updated = await updatePackage(packageId, data);
  if (!updated) throw new AuthError(500, 'Không thể cập nhật gói đăng ký.');
  return updated;
}

/**
 * Đối tác tạo yêu cầu đăng ký gói
 * Giá và thời hạn được lấy trực tiếp từ SQL Server, tuyệt đối không tin client!
 */
export async function createSubscriptionService(
  partnerProfileId: number,
  packageId: number,
  isRenewal = false
): Promise<{
  subscription: FormattedSubscription;
  bankInfo: typeof DANANGGO_BANK_INFO;
  transferSyntax: string;
}> {
  if (!Number.isSafeInteger(packageId) || packageId < 1) {
    throw new AuthError(400, 'Gói đăng ký không hợp lệ.');
  }

  // Đọc thông tin gói từ database
  const pkg = await getPackageById(packageId);
  if (!pkg) {
    throw new AuthError(404, 'Không tìm thấy gói đăng ký trong hệ thống.');
  }
  if (!pkg.is_active) {
    throw new AuthError(400, 'Gói đăng ký này hiện đang tạm ngừng phát hành.');
  }

  // Tìm gói active gần nhất nếu là gia hạn
  const currentActive = await getPartnerActiveSubscription(partnerProfileId);

  const transactionCode = generateTransactionCode();
  const createdRecord = await createSubscriptionRecord({
    transactionCode,
    partnerId: partnerProfileId,
    packageId: pkg.package_id,
    packageName: pkg.name,
    durationMonths: pkg.duration_months,
    price: pkg.price,
    isRenewal,
    renewedFromId: currentActive ? currentActive.subscription_id : null,
  });

  const formatted = formatSubscription(createdRecord);
  const transferSyntax = `DANANGGO ${transactionCode}`;

  return {
    subscription: formatted,
    bankInfo: DANANGGO_BANK_INFO,
    transferSyntax,
  };
}

/**
 * Đối tác gửi thông tin tham chiếu chuyển khoản để Admin đối soát
 */
export async function submitPaymentProofService(
  subscriptionId: number,
  partnerProfileId: number,
  data: { paymentReference: string; paymentProofNote?: string | null | undefined }
): Promise<FormattedSubscription> {
  if (!Number.isSafeInteger(subscriptionId) || subscriptionId < 1) {
    throw new AuthError(400, 'Mã yêu cầu đăng ký không hợp lệ.');
  }

  const trimmedRef = data.paymentReference?.trim();
  if (!trimmedRef) {
    throw new AuthError(400, 'Vui lòng cung cấp mã giao dịch ngân hàng hoặc nội dung chuyển khoản.');
  }
  if (trimmedRef.length > 100) {
    throw new AuthError(400, 'Mã tham chiếu tối đa 100 ký tự.');
  }

  const updated = await submitPaymentProofRecord(subscriptionId, partnerProfileId, {
    paymentReference: trimmedRef,
    paymentProofNote: data.paymentProofNote?.trim().slice(0, 500) || null,
  });

  if (!updated) {
    throw new AuthError(400, 'Không tìm thấy yêu cầu đăng ký hợp lệ hoặc giao dịch đã được xử lý trước đó.');
  }

  return formatSubscription(updated);
}

/**
 * Lấy thông tin gói hiện tại của đối tác
 */
export async function getPartnerCurrentSubscriptionService(
  partnerProfileId: number
): Promise<{
  hasActiveSubscription: boolean;
  currentSubscription: FormattedSubscription | null;
  daysRemaining: number;
  isExpiringSoon: boolean;
}> {
  const current = await getPartnerActiveSubscription(partnerProfileId);
  if (!current) {
    return {
      hasActiveSubscription: false,
      currentSubscription: null,
      daysRemaining: 0,
      isExpiringSoon: false,
    };
  }

  const formatted = formatSubscription(current);
  return {
    hasActiveSubscription: true,
    currentSubscription: formatted,
    daysRemaining: formatted.daysRemaining,
    isExpiringSoon: formatted.isExpiringSoon,
  };
}

/**
 * Lấy lịch sử đăng ký của đối tác
 */
export async function getPartnerSubscriptionsHistoryService(
  partnerProfileId: number
): Promise<FormattedSubscription[]> {
  const records = await getPartnerSubscriptionsList(partnerProfileId);
  return records.map(formatSubscription);
}

/**
 * Admin lấy danh sách đăng ký kèm lọc
 */
export async function adminListSubscriptionsService(filters: {
  status?: string | undefined;
  packageId?: number | undefined;
  search?: string | undefined;
  startDate?: string | undefined;
  endDate?: string | undefined;
}): Promise<FormattedSubscription[]> {
  const records = await adminListSubscriptions(filters);
  return records.map(formatSubscription);
}

/**
 * Admin xem chi tiết 1 đăng ký
 */
export async function adminGetSubscriptionDetailService(subscriptionId: number): Promise<FormattedSubscription> {
  const record = await getSubscriptionDetailById(subscriptionId);
  if (!record) throw new AuthError(404, 'Không tìm thấy thông tin đăng ký gói.');
  return formatSubscription(record);
}

/**
 * Admin duyệt xác nhận thanh toán hợp lệ
 */
export async function adminConfirmPaymentService(
  subscriptionId: number,
  adminUserId: number
): Promise<FormattedSubscription> {
  if (!Number.isSafeInteger(subscriptionId) || subscriptionId < 1) {
    throw new AuthError(400, 'ID đăng ký không hợp lệ.');
  }

  const result = await adminConfirmSubscriptionPayment(subscriptionId, adminUserId);
  if (result.outcome === 'NOT_FOUND') {
    throw new AuthError(404, 'Không tìm thấy yêu cầu đăng ký gói.');
  }
  if (result.outcome === 'ALREADY_PROCESSED') {
    throw new AuthError(409, `Giao dịch này đã được xử lý trước đó với trạng thái: ${result.currentStatus}.`);
  }

  return formatSubscription(result.subscription);
}

/**
 * Admin từ chối thanh toán
 */
export async function adminRejectPaymentService(
  subscriptionId: number,
  adminUserId: number,
  reason: string
): Promise<FormattedSubscription> {
  if (!Number.isSafeInteger(subscriptionId) || subscriptionId < 1) {
    throw new AuthError(400, 'ID đăng ký không hợp lệ.');
  }
  const trimmedReason = reason?.trim();
  if (!trimmedReason) {
    throw new AuthError(400, 'Vui lòng nhập lý do từ chối giao dịch.');
  }
  if (trimmedReason.length > 500) {
    throw new AuthError(400, 'Lý do từ chối tối đa 500 ký tự.');
  }

  const result = await adminRejectSubscriptionPayment(subscriptionId, adminUserId, trimmedReason);
  if (result.outcome === 'NOT_FOUND') {
    throw new AuthError(404, 'Không tìm thấy yêu cầu đăng ký gói.');
  }
  if (result.outcome === 'ALREADY_PROCESSED') {
    throw new AuthError(409, `Giao dịch này đã được xử lý trước đó với trạng thái: ${result.currentStatus}.`);
  }

  return formatSubscription(result.subscription);
}

/**
 * Admin Dashboard thống kê doanh thu
 */
export async function adminGetRevenueStatsService(filters: {
  startDate?: string | undefined;
  endDate?: string | undefined;
  packageId?: number | undefined;
}): Promise<RevenueStats> {
  return getRevenueStats(filters);
}

/**
 * Xuất file CSV danh sách giao dịch đăng ký gói cho Admin
 */
export async function adminExportCsvService(filters: {
  status?: string | undefined;
  packageId?: number | undefined;
  search?: string | undefined;
  startDate?: string | undefined;
  endDate?: string | undefined;
}): Promise<string> {
  const records = await adminListSubscriptions(filters);

  const headers = [
    'Mã giao dịch',
    'Tên doanh nghiệp',
    'Tên gói',
    'Thời hạn (tháng)',
    'Số tiền (VNĐ)',
    'Trạng thái thanh toán',
    'Trạng thái gói',
    'Mã tham chiếu',
    'Ngày đăng ký',
    'Ngày bắt đầu',
    'Ngày hết hạn',
    'Admin duyệt',
    'Thời điểm duyệt',
  ];

  const escapeCsv = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = records.map((r) => [
    escapeCsv(r.transaction_code),
    escapeCsv(r.business_name),
    escapeCsv(r.package_name),
    escapeCsv(r.duration_months),
    escapeCsv(r.price),
    escapeCsv(r.payment_status),
    escapeCsv(r.subscription_status),
    escapeCsv(r.payment_reference || ''),
    escapeCsv(new Date(r.created_at).toLocaleString('vi-VN')),
    escapeCsv(r.start_date ? new Date(r.start_date).toLocaleDateString('vi-VN') : ''),
    escapeCsv(r.end_date ? new Date(r.end_date).toLocaleDateString('vi-VN') : ''),
    escapeCsv(r.admin_name || ''),
    escapeCsv(r.confirmed_at ? new Date(r.confirmed_at).toLocaleString('vi-VN') : ''),
  ]);

  // Thêm UTF-8 BOM để Excel hiển thị đúng tiếng Việt
  const bom = '\uFEFF';
  const csvContent = [headers.map((h) => `"${h}"`).join(','), ...rows.map((row) => row.join(','))].join('\r\n');
  return bom + csvContent;
}

/**
 * Kiểm tra xem đối tác có gói đang hoạt động hay không
 */
export async function hasActiveSubscription(partnerProfileId: number): Promise<boolean> {
  return checkPartnerActiveSubscriptionExists(partnerProfileId);
}
