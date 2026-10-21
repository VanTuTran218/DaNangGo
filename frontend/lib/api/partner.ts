import type {
  PartnerDashboardStats,
  PartnerPlace,
  PartnerPlaceStatus,
  PartnerBooking,
  PartnerReview,
  PartnerProfile,
  DailyBookingStat,
  BookingStatus,
} from '@/types/partner';

import {
  mockPartnerProfile,
  mockPartnerPlaces,
  mockPartnerBookings,
  mockPartnerReviews,
  mockPartnerDailyBookings,
} from '@/lib/mock/partner';
import { mockAdminPlaces } from '@/lib/mock/admin';

function delay(ms = 400) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

import { apiRequest, apiPost, apiPut, apiPatch, ApiError } from './client';

// GET /api/partner/profile
export async function getPartnerProfile(): Promise<PartnerProfile> {
  try {
    const res = await apiRequest<PartnerProfile>('/api/partner/profile');
    if (res.data) return res.data;
  } catch (error) {
    // Fallback sang mock nếu chưa có dữ liệu DB hoặc đang dùng tài khoản demo
  }
  return { ...mockPartnerProfile };
}

// PUT /api/partner/profile
export async function updatePartnerProfile(
  data: Partial<PartnerProfile>
): Promise<PartnerProfile> {
  try {
    const res = await apiPut<PartnerProfile>('/api/partner/profile', data);
    if (res.data) return res.data;
  } catch (error) {
    // Fallback
  }
  Object.assign(mockPartnerProfile, data);
  return { ...mockPartnerProfile };
}

// TODO: GET /api/partner/stats
export async function getPartnerDashboardStats(): Promise<PartnerDashboardStats> {
  await delay();
  const totalBookings = mockPartnerBookings.length;
  const avgRating =
    mockPartnerReviews.length > 0
      ? mockPartnerReviews.reduce((sum, r) => sum + r.rating, 0) / mockPartnerReviews.length
      : 5.0;

  return {
    totalPlaces: mockPartnerPlaces.length,
    totalViews: 1420,
    totalBookings,
    avgRating: Number(avgRating.toFixed(1)),
  };
}

// TODO: GET /api/partner/stats/bookings-chart
export async function getPartnerDailyBookings(): Promise<DailyBookingStat[]> {
  await delay();
  return [...mockPartnerDailyBookings];
}

// GET /api/partner/places
export async function getPartnerPlaces(params?: {
  category?: string;
  status?: string;
}): Promise<PartnerPlace[]> {
  try {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'ALL') query.set('status', params.status);
    const url = `/api/partner/places${query.toString() ? `?${query.toString()}` : ''}`;
    const res = await apiRequest<PartnerPlace[]>(url);
    if (res.data) {
      let result = res.data;
      if (params?.category && params.category !== 'ALL') {
        result = result.filter((p) => p.category === params.category);
      }
      return result;
    }
  } catch (error) {
    // Fallback sang mock nếu chưa có dữ liệu DB hoặc demo
  }

  await delay();
  let result = [...mockPartnerPlaces];
  if (params?.category && params.category !== 'ALL') {
    result = result.filter((p) => p.category === params.category);
  }
  if (params?.status && params.status !== 'ALL') {
    result = result.filter((p) => p.status === params.status);
  }
  return result;
}

// GET /api/partner/places/:id hoặc /api/restaurants/:id
export async function getPartnerPlaceById(id: string): Promise<PartnerPlace | null> {
  const numericId = parseInt(id);
  if (!isNaN(numericId)) {
    try {
      // 1. Thử gọi /api/restaurants/:id trước (Hỗ trợ cả Admin và Partner xem thông tin nhà hàng thực)
      const res = await apiRequest<any>(`/api/restaurants/${numericId}`);
      if (res.data) {
        return {
          id: String(res.data.place_id),
          placeId: res.data.place_id,
          name: res.data.name,
          category: 'amthuc',
          description: res.data.description || '',
          address: res.data.address || '',
          area: res.data.district_name || 'Đà Nẵng',
          districtId: res.data.district_id,
          cuisineId: res.data.cuisine_id,
          cuisineName: res.data.cuisine_name,
          priceMin: res.data.price_min ?? 0,
          priceMax: res.data.price_max,
          priceUnit: 'món',
          openHours: res.data.open_hours || '08:00 - 22:00',
          openDays: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'],
          amenities: ['Wifi miễn phí', 'Điều hòa'],
          images: res.data.cover_image ? [res.data.cover_image] : [],
          lat: Number(res.data.latitude) || 16.0544,
          lng: Number(res.data.longitude) || 108.2022,
          status: res.data.status,
          partnerId: res.data.partner_id,
          viewCount: res.data.view_count || 0,
          bookingUrl: res.data.booking_url || '',
          createdAt: res.data.created_at ? new Date(res.data.created_at).toISOString() : new Date().toISOString(),
        };
      }
    } catch {
      try {
        const res = await apiRequest<PartnerPlace>(`/api/partner/places/${numericId}`);
        if (res.data) return res.data;
      } catch {
        // Fallback sang mock
      }
    }
  }

  await delay();
  const place = mockPartnerPlaces.find((p) => p.id === id);
  if (place) return { ...place };

  // Fallback sang mockAdminPlaces nếu id thuộc danh sách quản lý của Admin (VD: 'place-1', 'place-2', 'place-3')
  const adminPlace = mockAdminPlaces.find((p) => p.id === id);
  if (adminPlace) {
    return {
      id: adminPlace.id,
      name: adminPlace.name,
      category: (adminPlace.category as any) || 'amthuc',
      description: `Mô tả chi tiết và dịch vụ tiêu chuẩn của ${adminPlace.name} tại Đà Nẵng.`,
      address: adminPlace.address,
      area: 'Đà Nẵng',
      districtId: 1,
      cuisineId: 1,
      priceMin: 50000,
      priceMax: 500000,
      priceUnit: adminPlace.category === 'luutru' ? 'đêm' : 'món',
      openHours: '08:00 - 22:00',
      openDays: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'],
      amenities: ['Wifi miễn phí', 'Điều hòa', 'Đỗ xe'],
      images: adminPlace.imageUrl ? [adminPlace.imageUrl] : [],
      lat: 16.0544,
      lng: 108.2022,
      status: adminPlace.status as any,
      partnerId: adminPlace.partnerId ? Number(adminPlace.partnerId.replace('p-', '')) || 1 : undefined,
      createdAt: adminPlace.createdAt,
    };
  }

  return null;
}

// PATCH /api/places/:id/status
export async function updatePlaceStatus(
  id: string | number,
  status: 'ACTIVE' | 'HIDDEN' | 'PENDING' | 'LOCKED'
): Promise<{ success: boolean; message: string; data?: any }> {
  const numericId = typeof id === 'string' && id.startsWith('pp-') ? null : parseInt(String(id));
  if (numericId && !isNaN(numericId)) {
    const res = await apiPatch<any>(`/api/places/${numericId}/status`, { status });
    return { success: true, message: res.message || 'Cập nhật trạng thái thành công', data: res.data };
  }
  const place = mockPartnerPlaces.find((p) => p.id === String(id));
  if (place) {
    place.status = status as any;
    return { success: true, message: 'Cập nhật trạng thái thành công' };
  }
  throw new Error('Không tìm thấy cơ sở');
}

// POST /api/restaurants
export async function createPartnerPlace(
  data: Omit<PartnerPlace, 'id' | 'createdAt' | 'status'> & { partnerId?: number; status?: PartnerPlaceStatus },
  isSubmitForReview: boolean
): Promise<PartnerPlace> {
  try {
    const payload = {
      name: data.name,
      description: data.description,
      address: data.address,
      district_id: data.districtId,
      latitude: data.lat,
      longitude: data.lng,
      phone: (data as any).phone,
      website: (data as any).website,
      booking_url: data.bookingUrl,
      cuisine_id: data.cuisineId,
      price_min: data.priceMin,
      price_max: data.priceMax,
      images: data.images,
      partner_id: data.partnerId,
      status: data.status || (isSubmitForReview ? 'PENDING' : 'HIDDEN'),
    };
    const res = await apiPost<any>('/api/restaurants', payload);
    if (res.data) {
      return {
        id: String(res.data.place_id),
        placeId: res.data.place_id,
        name: res.data.name,
        category: 'amthuc',
        description: res.data.description || '',
        address: res.data.address || '',
        area: res.data.district_name || 'Đà Nẵng',
        districtId: res.data.district_id,
        cuisineId: res.data.cuisine_id,
        cuisineName: res.data.cuisine_name,
        priceMin: res.data.price_min ?? 0,
        priceMax: res.data.price_max,
        priceUnit: 'món',
        openHours: '08:00 - 22:00',
        openDays: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'],
        amenities: ['Wifi miễn phí', 'Điều hòa'],
        images: res.data.cover_image ? [res.data.cover_image] : data.images,
        lat: Number(res.data.latitude) || 16.0544,
        lng: Number(res.data.longitude) || 108.2022,
        status: res.data.status || (isSubmitForReview ? 'PENDING' : 'HIDDEN'),
        viewCount: res.data.view_count || 0,
        bookingUrl: res.data.booking_url || '',
        createdAt: res.data.created_at ? new Date(res.data.created_at).toISOString() : new Date().toISOString(),
      };
    }
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
  }

  await delay();
  const newPlace: PartnerPlace = {
    ...data,
    id: `pp-${Date.now()}`,
    status: isSubmitForReview ? 'PENDING' : 'HIDDEN',
    createdAt: new Date().toISOString(),
  };
  mockPartnerPlaces.unshift(newPlace);
  return newPlace;
}

// PUT /api/restaurants/:id
export async function updatePartnerPlace(
  id: string,
  data: Partial<PartnerPlace> & { partnerId?: number; districtId?: number; cuisineId?: number; bookingUrl?: string; phone?: string; website?: string },
  isSubmitForReview?: boolean
): Promise<PartnerPlace> {
  const numericId = typeof id === 'string' && id.startsWith('pp-') ? null : parseInt(String(id));
  if (numericId && !isNaN(numericId)) {
    try {
      const payload: Record<string, unknown> = {};
      if (data.name !== undefined) payload.name = data.name;
      if (data.description !== undefined) payload.description = data.description;
      if (data.address !== undefined) payload.address = data.address;
      if (data.districtId !== undefined) payload.district_id = data.districtId;
      if (data.lat !== undefined) payload.latitude = data.lat;
      if (data.lng !== undefined) payload.longitude = data.lng;
      if (data.phone !== undefined) payload.phone = data.phone;
      if (data.website !== undefined) payload.website = data.website;
      if (data.bookingUrl !== undefined) payload.booking_url = data.bookingUrl;
      if (data.cuisineId !== undefined) payload.cuisine_id = data.cuisineId;
      if (data.priceMin !== undefined) payload.price_min = data.priceMin;
      if (data.priceMax !== undefined) payload.price_max = data.priceMax;
      if (data.images !== undefined) payload.images = data.images;
      if (data.partnerId !== undefined) payload.partner_id = data.partnerId;
      if (data.status !== undefined) payload.status = data.status;

      const res = await apiPut<any>(`/api/restaurants/${numericId}`, payload);
      if (res.data) {
        return {
          id: String(res.data.place_id),
          placeId: res.data.place_id,
          name: res.data.name,
          category: 'amthuc',
          description: res.data.description || '',
          address: res.data.address || '',
          area: res.data.district_name || 'Đà Nẵng',
          districtId: res.data.district_id,
          cuisineId: res.data.cuisine_id,
          cuisineName: res.data.cuisine_name,
          priceMin: res.data.price_min ?? 0,
          priceMax: res.data.price_max,
          priceUnit: 'món',
          openHours: '08:00 - 22:00',
          openDays: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'],
          amenities: ['Wifi miễn phí', 'Điều hòa'],
          images: res.data.cover_image ? [res.data.cover_image] : (data.images || []),
          lat: Number(res.data.latitude) || 16.0544,
          lng: Number(res.data.longitude) || 108.2022,
          status: res.data.status,
          viewCount: res.data.view_count || 0,
          bookingUrl: res.data.booking_url || '',
          createdAt: res.data.created_at ? new Date(res.data.created_at).toISOString() : new Date().toISOString(),
        };
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
    }
  }

  await delay();
  const place = mockPartnerPlaces.find((p) => p.id === id);
  if (place) {
    Object.assign(place, data);
    if (isSubmitForReview) {
      place.status = 'PENDING';
    }
    return { ...place };
  }

  // Cập nhật mockAdminPlaces nếu thuộc danh sách của Admin
  const adminPlace = mockAdminPlaces.find((p) => p.id === id);
  if (adminPlace) {
    if (data.name) adminPlace.name = data.name;
    if (data.address) adminPlace.address = data.address;
    if (data.status) adminPlace.status = data.status as any;
    return {
      id: adminPlace.id,
      name: adminPlace.name,
      category: (adminPlace.category as any) || 'amthuc',
      description: data.description || '',
      address: adminPlace.address,
      area: 'Đà Nẵng',
      districtId: data.districtId || 1,
      cuisineId: data.cuisineId || 1,
      priceMin: data.priceMin ?? 50000,
      priceMax: data.priceMax ?? 500000,
      priceUnit: 'món',
      openHours: '08:00 - 22:00',
      openDays: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'],
      amenities: ['Wifi miễn phí', 'Điều hòa'],
      images: data.images || (adminPlace.imageUrl ? [adminPlace.imageUrl] : []),
      lat: data.lat || 16.0544,
      lng: data.lng || 108.2022,
      status: (data.status as any) || adminPlace.status,
      partnerId: data.partnerId,
      createdAt: adminPlace.createdAt,
    };
  }

  throw new Error('Không tìm thấy cơ sở');
}

// TODO: GET /api/partner/bookings
export async function getPartnerBookings(params?: {
  status?: BookingStatus | 'ALL';
  search?: string;
}): Promise<PartnerBooking[]> {
  await delay();
  let result = [...mockPartnerBookings];
  if (params?.status && params.status !== 'ALL') {
    result = result.filter((b) => b.status === params.status);
  }
  if (params?.search) {
    const s = params.search.toLowerCase();
    result = result.filter(
      (b) =>
        b.bookingCode.toLowerCase().includes(s) ||
        b.customerName.toLowerCase().includes(s) ||
        b.customerPhone.includes(s)
    );
  }
  return result;
}

// TODO: PATCH /api/partner/bookings/:id/status
export async function updatePartnerBookingStatus(
  bookingId: string,
  status: BookingStatus
): Promise<{ success: boolean; message: string }> {
  await delay();
  const booking = mockPartnerBookings.find((b) => b.id === bookingId);
  if (!booking) throw new Error('Không tìm thấy đơn đặt');
  booking.status = status;
  return { success: true, message: `Cập nhật đơn đặt ${booking.bookingCode} thành công.` };
}

// TODO: GET /api/partner/reviews
export async function getPartnerReviews(params?: {
  rating?: number | 'ALL';
}): Promise<PartnerReview[]> {
  await delay();
  let result = [...mockPartnerReviews];
  if (params?.rating && params.rating !== 'ALL') {
    result = result.filter((r) => r.rating === Number(params.rating));
  }
  return result;
}

// TODO: POST /api/partner/reviews/:id/reply
export async function replyPartnerReview(
  reviewId: string,
  content: string
): Promise<{ success: boolean; message: string }> {
  await delay();
  const review = mockPartnerReviews.find((r) => r.id === reviewId);
  if (!review) throw new Error('Không tìm thấy đánh giá');
  review.reply = {
    content,
    createdAt: new Date().toISOString(),
  };
  return { success: true, message: 'Đã phản hồi đánh giá thành công.' };
}
