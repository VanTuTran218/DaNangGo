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
  const res = await apiRequest<PartnerProfile>('/api/partner/profile');
  if (!res.data) {
    throw new Error(res.message || 'Không tìm thấy hồ sơ đối tác.');
  }
  return res.data;
}

// PUT /api/partner/profile
export async function updatePartnerProfile(
  data: Partial<PartnerProfile>
): Promise<PartnerProfile> {
  const res = await apiPut<PartnerProfile>('/api/partner/profile', data);
  if (!res.data) {
    throw new Error(res.message || 'Không thể cập nhật hồ sơ đối tác.');
  }
  return res.data;
}

// GET /api/partner/stats
export async function getPartnerDashboardStats(): Promise<PartnerDashboardStats> {
  const res = await apiRequest<PartnerDashboardStats>('/api/partner/stats');
  return (
    res.data ?? {
      totalPlaces: 0,
      totalViews: 0,
      totalBookings: 0,
      avgRating: 0,
    }
  );
}

// GET /api/partner/stats/bookings-chart
export async function getPartnerDailyBookings(): Promise<DailyBookingStat[]> {
  const res = await apiRequest<DailyBookingStat[]>('/api/partner/stats/bookings-chart');
  return res.data ?? [];
}

// GET /api/partner/places
export async function getPartnerPlaces(params?: {
  category?: string;
  status?: string;
}): Promise<PartnerPlace[]> {
  const query = new URLSearchParams();
  if (params?.status && params.status !== 'ALL') query.set('status', params.status);
  const url = `/api/partner/places${query.toString() ? `?${query.toString()}` : ''}`;
  const [res, accRes] = await Promise.all([
    apiRequest<PartnerPlace[]>(url),
    apiRequest<{ place_id: number; price_from: number | null; accommodation_type?: string | null }[]>(
      '/api/accommodations/mine'
    ).catch(() => null),
  ]);
  if (res.data) {
    const accMap = new Map((accRes?.data ?? []).map((a) => [String(a.place_id), a]));
    let result = res.data.map((p) => {
      const acc = accMap.get(String(p.placeId ?? p.id));
      if (!acc && p.placeType !== 'ACCOMMODATION' && p.category !== 'luutru') return p;
      return {
        ...p,
        category: 'luutru' as const,
        placeType: 'ACCOMMODATION' as const,
        accommodationType: (acc?.accommodation_type as any) || p.accommodationType || 'HOTEL',
        cuisineName: undefined,
        priceMin: acc ? Number(acc.price_from) || 0 : p.priceMin || 0,
        priceMax: undefined,
        priceUnit: 'đêm',
      };
    });
    if (params?.category && params.category !== 'ALL') {
      result = result.filter((p) => p.category === params.category);
    }
    return result;
  }
  return [];
}

// GET /api/partner/places/:id hoặc /api/places/:id hoặc /api/restaurants/:id
export async function getPartnerPlaceById(id: string): Promise<PartnerPlace | null> {
  const numericId = parseInt(id);
  if (!isNaN(numericId)) {
    // 0. Cơ sở lưu trú: lấy chi tiết từ /api/places/:id (chủ sở hữu xem được cả khi HIDDEN/LOCKED)
    try {
      const detail = await apiRequest<any>(`/api/places/${numericId}`);
      const p = detail.data;
      if (p && p.place_type === 'ACCOMMODATION') {
        const rooms = p.rooms ?? p.room_types ?? [];
        return {
          id: String(p.place_id),
          placeId: p.place_id,
          name: p.name,
          category: 'luutru',
          placeType: 'ACCOMMODATION',
          description: p.description || '',
          address: p.address || '',
          area: p.district_name || 'Đà Nẵng',
          districtId: p.district_id ?? undefined,
          accommodationType: p.accommodation_type || 'HOTEL',
          starRating: p.star_rating ?? undefined,
          checkInTime: p.check_in_time ? String(p.check_in_time).slice(0, 5) : undefined,
          checkOutTime: p.check_out_time ? String(p.check_out_time).slice(0, 5) : undefined,
          priceMin: Number(p.price_min) || 0,
          priceMax: p.price_max ? Number(p.price_max) : undefined,
          priceUnit: 'đêm',
          openHours: '24/7',
          openDays: [],
          amenities: (p.amenities ?? []).map((a: any) => a.name),
          amenityIds: (p.amenities ?? []).map((a: any) => Number(a.amenity_id)),
          images: (p.images ?? []).map((img: any) => (typeof img === 'string' ? img : img.image_url)),
          lat: Number(p.latitude) || 16.0544,
          lng: Number(p.longitude) || 108.2022,
          status: p.status,
          partnerId: p.partner_id ?? undefined,
          viewCount: p.view_count || 0,
          bookingUrl: p.booking_url || '',
          phone: p.phone || '',
          website: p.website || '',
          roomCount: rooms.length,
          createdAt: p.created_at ? new Date(p.created_at).toISOString() : new Date().toISOString(),
        };
      }
    } catch {
      // Không phải lưu trú hoặc lỗi mạng → thử nhánh nhà hàng bên dưới
    }

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

// GET /api/partner/bookings
export async function getPartnerBookings(params?: {
  status?: BookingStatus | 'ALL';
  search?: string;
}): Promise<PartnerBooking[]> {
  const query = new URLSearchParams();
  if (params?.status && params.status !== 'ALL') query.set('status', params.status);
  if (params?.search && params.search.trim()) query.set('search', params.search.trim());
  const url = `/api/partner/bookings${query.toString() ? `?${query.toString()}` : ''}`;
  const res = await apiRequest<PartnerBooking[]>(url);
  return res.data ?? [];
}

// PATCH /api/partner/bookings/:id/status
export async function updatePartnerBookingStatus(
  bookingId: string,
  status: BookingStatus
): Promise<{ success: boolean; message: string }> {
  const res = await apiPatch<{ id: string; status: BookingStatus }>(
    `/api/partner/bookings/${encodeURIComponent(bookingId)}/status`,
    { status }
  );
  return {
    success: true,
    message: res.message || 'Cập nhật trạng thái đơn đặt thành công.',
  };
}

// Đánh giá thật thuộc các cơ sở của đối tác đã đăng nhập.
export async function getPartnerReviews(params?: { rating?: number | 'ALL' }): Promise<PartnerReview[]> {
  const query = params?.rating && params.rating !== 'ALL' ? `?rating=${params.rating}` : '';
  const res = await apiRequest<PartnerReview[]>(`/api/ai/partner/reviews${query}`);
  return res.data ?? [];
}

export async function replyPartnerReview(reviewId: string, content: string): Promise<{success:boolean;message:string}> {
  const res = await apiPost<{message:string}>(`/api/ai/partner/reviews/${encodeURIComponent(reviewId)}/reply`, {content});
  return { success: true, message: res.data?.message ?? 'Đã lưu phản hồi đánh giá.' };
}
