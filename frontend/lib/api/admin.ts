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
} from "@/types/admin";

import { apiPost, apiRequest } from "./client";

import {
  mockAdminUsers,
  mockAdminPartners,
  mockAdminPlaces,
  mockAdminReviews,
  mockAdminSurveys,
  mockAdminTodos,
  mockDailyUserStats,
} from "@/lib/mock/admin";
function delay(ms = 400) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// GET /api/admin/stats
export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  try {
    const [places, partners, reviews] = await Promise.all([
      getAdminPlaces().catch(() => mockAdminPlaces),
      getAdminPartners().catch(() => mockAdminPartners),
      getAdminReviews().catch(() => [] as AdminReviewItem[]),
    ]);
    return {
      totalUsers: mockAdminUsers.length,
      totalPartners: partners.length,
      pendingPartners: partners.filter((p) => p.status === 'PENDING').length,
      pendingPlaces: places.filter((p) => p.status === 'PENDING').length,
      totalPlaces: places.length,
      totalReviews: reviews.length,
      totalSurveys: mockAdminSurveys.length,
    };
  } catch {
    await delay();
    return {
      totalUsers: mockAdminUsers.length,
      totalPartners: mockAdminPartners.length,
      pendingPartners: mockAdminPartners.filter((p) => p.status === 'PENDING').length,
      pendingPlaces: mockAdminPlaces.filter((p) => p.status === 'PENDING').length,
      totalPlaces: mockAdminPlaces.length,
      totalReviews: mockAdminReviews.length,
      totalSurveys: mockAdminSurveys.length,
    };
  }
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
      (u) =>
        u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s),
    );
  }
  if (params?.role && params.role !== "ALL") {
    result = result.filter((u) => u.role === params.role);
  }
  if (params?.status && params.status !== "ALL") {
    result = result.filter((u) => u.status === params.status);
  }
  return result;
}

// TODO: PATCH /api/admin/users/:id/status
export async function updateAdminUserStatus(
  userId: string,
  status: UserAccountStatus,
): Promise<{ success: boolean; message: string }> {
  await delay();
  const user = mockAdminUsers.find((u) => u.id === userId);
  if (!user) throw new Error("Không tìm thấy người dùng");
  user.status = status;
  return {
    success: true,
    message:
      status === "LOCKED"
        ? "Đã khóa tài khoản thành công."
        : "Đã mở khóa tài khoản.",
  };
}

// GET /api/admin/partners — REAL API
export async function getAdminPartners(params?: {
  status?: PartnerApprovalStatus | "ALL";
  search?: string;
}): Promise<AdminPartnerItem[]> {
  const searchParams = new URLSearchParams();
  if (params?.status && params.status !== "ALL") {
    searchParams.set("status", params.status);
  }
  const qs = searchParams.toString();
  const response = await apiRequest<{
    partners: Array<{
      partner_id: number;
      user_id: number;
      public_id: string;
      full_name: string;
      email: string;
      phone: string | null;
      business_name: string;
      service_type: string;
      tax_code: string | null;
      address: string | null;
      approval_status: string;
      created_at: string;
    }>;
  }>(`/api/admin/partners${qs ? `?${qs}` : ""}`);
  const records = response.data?.partners ?? [];
  // Ánh xạ sang AdminPartnerItem (kiểu FE cũ)
  return records.map((r) => ({
    id: String(r.partner_id),
    userId: r.public_id,
    name: r.full_name,
    email: r.email,
    phone: r.phone ?? "",
    businessName: r.business_name,
    serviceType: r.service_type as "STAY" | "TABLE" | "TICKET",
    taxCode: r.tax_code ?? "",
    address: r.address ?? "",
    status: (r.approval_status === "PENDING_APPROVAL" || r.approval_status === "PENDING"
      ? "PENDING"
      : r.approval_status === "ACTIVE" || r.approval_status === "APPROVED"
        ? "APPROVED"
        : r.approval_status === "REJECTED"
          ? "REJECTED"
          : "LOCKED") as PartnerApprovalStatus,
    createdAt: r.created_at,
    rejectReason: undefined,
  }));
}

// POST /api/admin/partners/:id/approve — REAL API
export async function approveAdminPartner(
  partnerId: string,
): Promise<{ success: boolean; message: string }> {
  const response = await apiPost<never>(
    `/api/admin/partners/${partnerId}/approve`,
    {},
  );
  return {
    success: true,
    message: response.message ?? "Đã phê duyệt hồ sơ đối tác.",
  };
}

// POST /api/admin/partners/:id/reject — REAL API
export async function rejectAdminPartner(
  partnerId: string,
  _reason?: string,
): Promise<{ success: boolean; message: string }> {
  const response = await apiPost<never>(
    `/api/admin/partners/${partnerId}/reject`,
    {},
  );
  return {
    success: true,
    message: response.message ?? "Đã từ chối hồ sơ đối tác.",
  };
}

// TODO: PATCH /api/admin/partners/:id/status
export async function updateAdminPartnerStatus(
  partnerId: string,
  status: PartnerApprovalStatus,
): Promise<{ success: boolean; message: string }> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const partner = mockAdminPartners.find((p) => p.id === partnerId);
  if (!partner) throw new Error("Không tìm thấy đối tác");
  partner.status = status;
  return {
    success: true,
    message: `Cập nhật trạng thái đối tác sang ${status}.`,
  };
}

// GET /api/admin/places — REAL API + mock fallback
export async function getAdminPlaces(params?: {
  category?: string;
  status?: string;
  search?: string;
}): Promise<AdminPlaceItem[]> {
  try {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'ALL') query.set('category', params.category);
    if (params?.status && params.status !== 'ALL') query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    const url = `/api/admin/places${query.toString() ? `?${query.toString()}` : ''}`;
    const res = await apiRequest<AdminPlaceItem[]>(url);
    if (res.data) {
      return res.data;
    }
  } catch (error) {
    // Fallback sang mock nếu chưa có API hoặc phiên demo
  }

  await delay();
  let result = [...mockAdminPlaces];
  if (params?.category && params.category !== "ALL") {
    result = result.filter((p) => p.category === params.category);
  }
  if (params?.status && params.status !== "ALL") {
    result = result.filter((p) => p.status === params.status);
  }
  if (params?.search) {
    const s = params.search.toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(s) || p.address.toLowerCase().includes(s),
    );
  }
  return result;
}

// PATCH /api/admin/places/:id/status
export async function updateAdminPlaceStatus(
  placeId: string,
  status: PlaceStatus,
): Promise<{ success: boolean; message: string }> {
  const normalizedStatus = status === 'APPROVED' ? 'ACTIVE' : status;
  try {
    const res = await apiRequest<{ success: boolean; message: string }>(
      `/api/admin/places/${placeId}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status: normalizedStatus }),
      }
    );
    const place = mockAdminPlaces.find((p) => p.id === placeId);
    if (place) place.status = status;
    return { success: true, message: res.message || 'Cập nhật trạng thái địa điểm thành công.' };
  } catch (err) {
    const place = mockAdminPlaces.find((p) => p.id === placeId);
    if (place) place.status = status;
    throw err;
  }
}

// DELETE /api/admin/places/:id — REAL API + mock fallback
export async function deleteAdminPlace(placeId: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await apiRequest<{ success: boolean; message: string }>(
      `/api/admin/places/${placeId}`,
      { method: 'DELETE' }
    );
    const index = mockAdminPlaces.findIndex((p) => p.id === placeId);
    if (index !== -1) mockAdminPlaces.splice(index, 1);
    return { success: true, message: res.message || 'Đã xóa địa điểm khỏi hệ thống.' };
  } catch (err) {
    const index = mockAdminPlaces.findIndex((p) => p.id === placeId);
    if (index !== -1) {
      mockAdminPlaces.splice(index, 1);
    }
    return { success: true, message: 'Đã xóa địa điểm khỏi hệ thống.' };
  }
}

export async function getAdminReviews(params?: {
  rating?: number | "ALL";
  status?: ReviewStatus | "ALL";
}): Promise<AdminReviewItem[]> {
  const query = new URLSearchParams();
  if (params?.rating && params.rating !== "ALL")
    query.set("rating", String(params.rating));
  if (params?.status && params.status !== "ALL")
    query.set("status", params.status);
  const response = await apiRequest<
    Array<{
      review_id: number;
      place_id: number;
      place_name: string;
      user_name: string;
      rating: number;
      comment: string | null;
      status: ReviewStatus;
      created_at: string;
      images: { image_id: number; image_url: string }[];
    }>
  >(`/api/admin/reviews${query.size ? `?${query}` : ""}`);
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  return (response.data ?? []).map((review) => ({
    id: String(review.review_id),
    placeId: String(review.place_id),
    placeName: review.place_name,
    userName: review.user_name,
    rating: review.rating,
    comment: review.comment ?? "",
    isReported: false,
    status: review.status,
    createdAt: review.created_at,
    images: (review.images ?? []).map((image) => ({
      ...image,
      image_url: `${apiBase.replace(/\/$/, "")}${image.image_url}`,
    })),
  }));
}

export async function updateAdminReviewStatus(
  reviewId: string,
  status: Exclude<ReviewStatus, "PENDING">,
): Promise<{ success: boolean; message: string }> {
  const response = await apiRequest<void>(
    `/api/admin/reviews/${encodeURIComponent(reviewId)}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
  );
  return {
    success: true,
    message: response.message ?? "Đã cập nhật trạng thái đánh giá.",
  };
}

export async function editAdminReview(reviewId: string, comment: string) {
  const response = await apiRequest<void>(
    `/api/admin/reviews/${encodeURIComponent(reviewId)}/content`,
    { method: "PATCH", body: JSON.stringify({ comment }) },
  );
  return response.message ?? "Đã chỉnh sửa đánh giá.";
}

export async function deleteAdminReview(
  reviewId: string,
): Promise<{ success: boolean; message: string }> {
  const response = await apiRequest<void>(
    `/api/admin/reviews/${encodeURIComponent(reviewId)}`,
    { method: "DELETE" },
  );
  return { success: true, message: response.message ?? "Đã xóa đánh giá." };
}

// TODO: GET /api/admin/surveys
export async function getAdminSurveys(): Promise<AdminSurveyItem[]> {
  await delay();
  return [...mockAdminSurveys];
}

// TODO: POST /api/admin/surveys
export async function createAdminSurvey(
  survey: Omit<AdminSurveyItem, "id" | "createdAt" | "responseCount">,
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
  survey: Partial<AdminSurveyItem>,
): Promise<AdminSurveyItem> {
  await delay();
  const target = mockAdminSurveys.find((s) => s.id === id);
  if (!target) throw new Error("Không tìm thấy khảo sát");
  Object.assign(target, survey);
  return target;
}

// TODO: DELETE /api/admin/surveys/:id
export async function deleteAdminSurvey(
  id: string,
): Promise<{ success: boolean; message: string }> {
  await delay();
  const index = mockAdminSurveys.findIndex((s) => s.id === id);
  if (index !== -1) mockAdminSurveys.splice(index, 1);
  return { success: true, message: "Đã xóa khảo sát thành công." };
}
