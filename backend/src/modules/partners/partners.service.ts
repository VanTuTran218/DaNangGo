import { AuthError } from '../auth/auth.errors';
import {
  findApprovedPartnerProfileId,
  listPartnerProfiles,
  reviewPendingPartnerProfile,
  setPartnerAdminLock,
  type PartnerApprovalStatus,
  type PartnerProfileRow,
} from './partners.repository';

export interface AdminPartnerProfile {
  id: number;
  userId: number;
  user: { fullName: string; email: string; phone: string | null };
  businessName: string;
  serviceType: string | null;
  taxCode: string | null;
  contactPhone: string | null;
  address: string | null;
  status: PartnerApprovalStatus;
  accountStatus: string;
  adminLocked: boolean;
  createdAt: string;
  reviewer: { id: number; fullName: string | null } | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
}

function toAdminPartner(row: PartnerProfileRow): AdminPartnerProfile {
  return {
    id: row.partner_id,
    userId: row.user_id,
    user: { fullName: row.full_name, email: row.email, phone: row.user_phone },
    businessName: row.business_name,
    serviceType: row.service_type,
    taxCode: row.tax_code,
    contactPhone: row.contact_phone,
    address: row.address,
    status: row.approval_status,
    accountStatus: row.account_status,
    adminLocked: row.admin_locked,
    createdAt: row.created_at.toISOString(),
    reviewer: row.approved_by === null ? null : { id: row.approved_by, fullName: row.reviewer_name },
    reviewedAt: row.approved_at?.toISOString() ?? null,
    rejectionReason: row.rejection_reason,
  };
}

export async function listAdminPartners(rawStatus: unknown): Promise<AdminPartnerProfile[]> {
  let status: PartnerApprovalStatus | undefined;
  if (rawStatus !== undefined) {
    if (typeof rawStatus !== 'string' || !['ALL', 'PENDING', 'APPROVED', 'REJECTED'].includes(rawStatus)) {
      throw new AuthError(400, 'Trạng thái lọc hồ sơ đối tác không hợp lệ.');
    }
    if (rawStatus !== 'ALL') status = rawStatus as PartnerApprovalStatus;
  }
  return (await listPartnerProfiles(status)).map(toAdminPartner);
}

export async function reviewPartner(input: {
  partnerId: number;
  adminUserId: number;
  status: unknown;
  reason?: unknown;
}) {
  if (!Number.isSafeInteger(input.partnerId) || input.partnerId < 1) {
    throw new AuthError(400, 'ID hồ sơ đối tác không hợp lệ.');
  }
  if (!Number.isSafeInteger(input.adminUserId) || input.adminUserId < 1) {
    throw new AuthError(401, 'Không xác định được tài khoản Admin đang đăng nhập.');
  }
  if (input.status !== 'APPROVED' && input.status !== 'REJECTED') {
    throw new AuthError(400, 'Trạng thái xét duyệt chỉ được là APPROVED hoặc REJECTED.');
  }
  let reason: string | null = null;
  if (input.status === 'REJECTED') {
    if (typeof input.reason !== 'string' || !input.reason.trim()) {
      throw new AuthError(400, 'Khi từ chối phải nhập lý do.');
    }
    reason = input.reason.trim();
    if (reason.length > 500) throw new AuthError(400, 'Lý do từ chối tối đa 500 ký tự.');
  }

  const result = await reviewPendingPartnerProfile({
    partnerId: input.partnerId,
    adminUserId: input.adminUserId,
    status: input.status,
    reason,
  });
  if (result.outcome === 'NOT_FOUND') throw new AuthError(404, 'Không tìm thấy hồ sơ đối tác.');
  if (result.outcome === 'NOT_PENDING') throw new AuthError(409, 'Hồ sơ này đã được xử lý, không thể xét duyệt lại.');
  return {
    id: input.partnerId,
    status: result.status,
    reviewedBy: input.adminUserId,
    reviewedAt: result.reviewedAt.toISOString(),
    rejectionReason: reason,
  };
}

export async function setPartnerLock(input: { partnerId: number; locked: boolean }) {
  if (!Number.isSafeInteger(input.partnerId) || input.partnerId < 1) {
    throw new AuthError(400, 'ID hồ sơ đối tác không hợp lệ.');
  }
  const result = await setPartnerAdminLock(input.partnerId, input.locked);
  if (result.outcome === 'NOT_FOUND') throw new AuthError(404, 'Không tìm thấy hồ sơ đối tác.');
  return { id: input.partnerId, accountStatus: result.accountStatus, adminLocked: result.adminLocked };
}

export function getApprovedPartnerProfileId(userId: number): Promise<number | null> {
  return findApprovedPartnerProfileId(userId);
}
