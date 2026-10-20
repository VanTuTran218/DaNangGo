import type {
  AdminDashboardStats,
  AdminUserItem,
  AdminPartnerItem,
  AdminPlaceItem,
  AdminReviewItem,
  AdminSurveyItem,
  AdminTodoItem,
  DailyUserStat,
  UserAccountStatus,
  PartnerApprovalStatus,
  PlaceStatus,
  ReviewStatus,
} from '@/types/admin';
import { apiRequest } from './client';

import {
  mockAdminUsers,
  mockAdminPartners,
  mockAdminPlaces,
  mockAdminReviews,
  mockAdminSurveys,
  mockAdminTodos,
  mockDailyUserStats,
} from '@/lib/mock/admin';

function delay(ms = 400) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// TODO: GET /api/admin/stats
export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  await delay();
  return {
    totalUsers: mockAdminUsers.length,
    totalPartners: mockAdminPartners.length,
    pendingPartners: mockAdminPartners.filter((p) => p.status === 'PENDING').length,
    totalPlaces: mockAdminPlaces.length,
    totalReviews: mockAdminReviews.length,
    totalSurveys: mockAdminSurveys.length,
  };
}

// TODO: GET /api/admin/stats/users-chart
export async function getAdminUserDailyStats(): Promise<DailyUserStat[]> {
  await delay();
  return [...mockDailyUserStats];
}

// TODO: GET /api/admin/todos
export async function getAdminTodos(): Promise<AdminTodoItem[]> {
  await delay();
  return [...mockAdminTodos];
}

// TODO: GET /api/admin/users
export async function getAdminUsers(params?: {
  search?: string;
  role?: string;
  status?: string;
}): Promise<AdminUserItem[]> {
  await delay();
  let result = [...mockAdminUsers];
  if (params?.search) {
    const s = params.search.toLowerCase();
    result = result.filter(
      (u) => u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s)
    );
  }
  if (params?.role && params.role !== 'ALL') {
    result = result.filter((u) => u.role === params.role);
  }
  if (params?.status && params.status !== 'ALL') {
    result = result.filter((u) => u.status === params.status);
  }
  return result;
}

// TODO: PATCH /api/admin/users/:id/status
export async function updateAdminUserStatus(
  userId: string,
  status: UserAccountStatus
): Promise<{ success: boolean; message: string }> {
  await delay();
  const user = mockAdminUsers.find((u) => u.id === userId);
  if (!user) throw new Error('Không tìm thấy người dùng');
  user.status = status;
  return {
    success: true,
    message: status === 'LOCKED' ? 'Đã khóa tài khoản thành công.' : 'Đã mở khóa tài khoản.',
  };
}

// Admin partner workflows use the authenticated backend API and SQL Server data.
export async function getAdminPartners(params?: {
  status?: PartnerApprovalStatus | 'ALL';
  search?: string;
}): Promise<AdminPartnerItem[]> {
  const requestedStatus = params?.status;
  const apiStatus = requestedStatus === 'LOCKED' ? 'ALL' : requestedStatus;
  const query = apiStatus && apiStatus !== 'ALL' ? `?status=${encodeURIComponent(apiStatus)}` : '';
  const response = await apiRequest<{
    id: number;
    userId: number;
    user: { fullName: string; email: string; phone: string | null };
    businessName: string;
    serviceType: 'STAY' | 'TABLE' | 'TICKET' | null;
    taxCode: string | null;
    contactPhone: string | null;
    address: string | null;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    accountStatus: 'ACTIVE' | 'LOCKED';
    adminLocked: boolean;
    createdAt: string;
    reviewer: { id: number; fullName: string | null } | null;
    reviewedAt: string | null;
    rejectionReason: string | null;
  }[]>(`/api/admin/partners${query}`);

  let result: AdminPartnerItem[] = (response.data ?? []).map((partner) => ({
    id: String(partner.id),
    userId: String(partner.userId),
    userName: partner.user.fullName,
    businessName: partner.businessName,
    serviceType: partner.serviceType,
    taxCode: partner.taxCode,
    address: partner.address,
    phone: partner.contactPhone || partner.user.phone,
    email: partner.user.email,
    status: partner.status,
    adminLocked: partner.adminLocked,
    accountStatus: partner.accountStatus,
    reviewerName: partner.reviewer?.fullName ?? null,
    reviewedAt: partner.reviewedAt,
    rejectReason: partner.rejectionReason ?? undefined,
    createdAt: partner.createdAt,
  }));

  if (requestedStatus === 'LOCKED') result = result.filter((partner) => partner.adminLocked);
  if (params?.search) {
    const search = params.search.toLowerCase();
    result = result.filter((partner) =>
      partner.businessName.toLowerCase().includes(search) ||
      partner.userName?.toLowerCase().includes(search) ||
      partner.email.toLowerCase().includes(search) ||
      (partner.taxCode ?? '').toLowerCase().includes(search)
    );
  }
  return result;
}

export async function approveAdminPartner(partnerId: string): Promise<{ success: boolean; message: string }> {
  const response = await apiRequest<unknown>(`/api/admin/partners/${encodeURIComponent(partnerId)}/approval`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'APPROVED' }),
  });
  return { success: true, message: response.message || '\u0110\u00e3 duy\u1ec7t h\u1ed3 s\u01a1 \u0111\u1ed1i t\u00e1c.' };
}

export async function rejectAdminPartner(
  partnerId: string,
  reason: string
): Promise<{ success: boolean; message: string }> {
  const response = await apiRequest<unknown>(`/api/admin/partners/${encodeURIComponent(partnerId)}/approval`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'REJECTED', reason }),
  });
  return { success: true, message: response.message || '\u0110\u00e3 t\u1eeb ch\u1ed1i h\u1ed3 s\u01a1 \u0111\u1ed1i t\u00e1c.' };
}

export async function updateAdminPartnerStatus(
  partnerId: string,
  status: PartnerApprovalStatus
): Promise<{ success: boolean; message: string }> {
  if (status !== 'LOCKED' && status !== 'APPROVED') {
    throw new Error('Only an approved partner account can be locked or unlocked.');
  }
  const locked = status === 'LOCKED';
  const response = await apiRequest<unknown>(`/api/admin/partners/${encodeURIComponent(partnerId)}/lock`, {
    method: 'PATCH',
    body: JSON.stringify({ locked }),
  });
  return {
    success: true,
    message: response.message || (locked ? '\u0110\u00e3 kh\u00f3a t\u00e0i kho\u1ea3n \u0111\u1ed1i t\u00e1c.' : '\u0110\u00e3 m\u1edf kh\u00f3a t\u00e0i kho\u1ea3n \u0111\u1ed1i t\u00e1c.'),
  };
}

// TODO: GET /api/admin/places
export async function getAdminPlaces(params?: {
  category?: string;
  status?: string;
  search?: string;
}): Promise<AdminPlaceItem[]> {
  await delay();
  let result = [...mockAdminPlaces];
  if (params?.category && params.category !== 'ALL') {
    result = result.filter((p) => p.category === params.category);
  }
  if (params?.status && params.status !== 'ALL') {
    result = result.filter((p) => p.status === params.status);
  }
  if (params?.search) {
    const s = params.search.toLowerCase();
    result = result.filter(
      (p) => p.name.toLowerCase().includes(s) || p.address.toLowerCase().includes(s)
    );
  }
  return result;
}

// TODO: PATCH /api/admin/places/:id/status
export async function updateAdminPlaceStatus(
  placeId: string,
  status: PlaceStatus
): Promise<{ success: boolean; message: string }> {
  await delay();
  const place = mockAdminPlaces.find((p) => p.id === placeId);
  if (!place) throw new Error('Không tìm thấy địa điểm');
  place.status = status;
  return { success: true, message: `Đã cập nhật trạng thái địa điểm.` };
}

// TODO: DELETE /api/admin/places/:id
export async function deleteAdminPlace(placeId: string): Promise<{ success: boolean; message: string }> {
  await delay();
  const index = mockAdminPlaces.findIndex((p) => p.id === placeId);
  if (index !== -1) {
    mockAdminPlaces.splice(index, 1);
  }
  return { success: true, message: 'Đã xóa địa điểm khỏi hệ thống.' };
}

// TODO: GET /api/admin/reviews
export async function getAdminReviews(params?: {
  rating?: number | 'ALL';
  isReportedOnly?: boolean;
}): Promise<AdminReviewItem[]> {
  await delay();
  let result = [...mockAdminReviews];
  if (params?.isReportedOnly) {
    result = result.filter((r) => r.isReported);
  }
  if (params?.rating && params.rating !== 'ALL') {
    result = result.filter((r) => r.rating === Number(params.rating));
  }
  return result;
}

// TODO: PATCH /api/admin/reviews/:id/status
export async function updateAdminReviewStatus(
  reviewId: string,
  status: ReviewStatus
): Promise<{ success: boolean; message: string }> {
  await delay();
  const review = mockAdminReviews.find((r) => r.id === reviewId);
  if (!review) throw new Error('Không tìm thấy đánh giá');
  review.status = status;
  return { success: true, message: 'Đã cập nhật trạng thái đánh giá.' };
}

// TODO: DELETE /api/admin/reviews/:id
export async function deleteAdminReview(reviewId: string): Promise<{ success: boolean; message: string }> {
  await delay();
  const index = mockAdminReviews.findIndex((r) => r.id === reviewId);
  if (index !== -1) mockAdminReviews.splice(index, 1);
  return { success: true, message: 'Đã xóa đánh giá vi phạm.' };
}

// TODO: GET /api/admin/surveys
export async function getAdminSurveys(): Promise<AdminSurveyItem[]> {
  await delay();
  return [...mockAdminSurveys];
}

// TODO: POST /api/admin/surveys
export async function createAdminSurvey(
  survey: Omit<AdminSurveyItem, 'id' | 'createdAt' | 'responseCount'>
): Promise<AdminSurveyItem> {
  await delay();
  const newSurvey: AdminSurveyItem = {
    ...survey,
    id: `sur-${Date.now()}`,
    createdAt: new Date().toISOString(),
    responseCount: 0,
  };
  mockAdminSurveys.unshift(newSurvey);
  return newSurvey;
}

// TODO: PUT /api/admin/surveys/:id
export async function updateAdminSurvey(
  id: string,
  survey: Partial<AdminSurveyItem>
): Promise<AdminSurveyItem> {
  await delay();
  const target = mockAdminSurveys.find((s) => s.id === id);
  if (!target) throw new Error('Không tìm thấy khảo sát');
  Object.assign(target, survey);
  return target;
}

// TODO: DELETE /api/admin/surveys/:id
export async function deleteAdminSurvey(id: string): Promise<{ success: boolean; message: string }> {
  await delay();
  const index = mockAdminSurveys.findIndex((s) => s.id === id);
  if (index !== -1) mockAdminSurveys.splice(index, 1);
  return { success: true, message: 'Đã xóa khảo sát thành công.' };
}
