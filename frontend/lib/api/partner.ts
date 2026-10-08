import type {
  PartnerDashboardStats,
  PartnerPlace,
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

function delay(ms = 400) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// TODO: GET /api/partner/profile
export async function getPartnerProfile(): Promise<PartnerProfile> {
  await delay();
  return { ...mockPartnerProfile };
}

// TODO: PUT /api/partner/profile
export async function updatePartnerProfile(
  data: Partial<PartnerProfile>
): Promise<PartnerProfile> {
  await delay();
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

// TODO: GET /api/partner/places
export async function getPartnerPlaces(params?: {
  category?: string;
  status?: string;
}): Promise<PartnerPlace[]> {
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

// TODO: GET /api/partner/places/:id
export async function getPartnerPlaceById(id: string): Promise<PartnerPlace | null> {
  await delay();
  const place = mockPartnerPlaces.find((p) => p.id === id);
  return place ? { ...place } : null;
}

// TODO: POST /api/partner/places
export async function createPartnerPlace(
  data: Omit<PartnerPlace, 'id' | 'createdAt' | 'status'>,
  isSubmitForReview: boolean
): Promise<PartnerPlace> {
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

// TODO: PUT /api/partner/places/:id
export async function updatePartnerPlace(
  id: string,
  data: Partial<PartnerPlace>,
  isSubmitForReview?: boolean
): Promise<PartnerPlace> {
  await delay();
  const place = mockPartnerPlaces.find((p) => p.id === id);
  if (!place) throw new Error('Không tìm thấy cơ sở');
  Object.assign(place, data);
  if (isSubmitForReview) {
    place.status = 'PENDING';
  }
  return { ...place };
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
