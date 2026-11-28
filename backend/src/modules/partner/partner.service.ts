import * as repo from './partner.repository';
import type { PartnerPlaceRow } from './partner.repository';

export interface PartnerProfileDto {
  id: string;
  partnerId: number;
  businessName: string;
  serviceType: string;
  taxCode: string;
  address: string;
  phone: string;
  email: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'LOCKED';
  rejectReason?: string | undefined;
  reviewedAt?: string | undefined;
  createdAt: string;
}

export function mapApprovalStatus(status: string): 'PENDING' | 'APPROVED' | 'REJECTED' | 'LOCKED' {
  const upper = String(status || '').toUpperCase().trim();
  if (upper === 'APPROVED' || upper === 'ACTIVE') return 'APPROVED';
  if (upper === 'REJECTED') return 'REJECTED';
  if (upper === 'LOCKED') return 'LOCKED';
  return 'PENDING';
}

export async function getPartnerProfile(userId: number): Promise<PartnerProfileDto | null> {
  const row = await repo.findPartnerProfileByUserId(userId);
  if (!row) return null;

  return {
    id: `partner-${row.partner_id}`,
    partnerId: row.partner_id,
    businessName: row.business_name,
    serviceType: row.service_type || 'TABLE',
    taxCode: row.tax_code || '',
    address: row.address || '',
    phone: row.contact_phone || '',
    email: row.email,
    status: mapApprovalStatus(row.approval_status),
    ...(row.rejection_reason ? { rejectReason: row.rejection_reason } : {}),
    ...(row.approved_at ? { reviewedAt: row.approved_at.toISOString() } : {}),
    createdAt: row.created_at.toISOString(),
  };
}

export async function updatePartnerProfile(
  userId: number,
  data: {
    businessName?: string;
    serviceType?: string;
    taxCode?: string;
    address?: string;
    contactPhone?: string;
  }
): Promise<PartnerProfileDto> {
  await repo.updatePartnerProfile(userId, data);
  const updated = await getPartnerProfile(userId);
  if (!updated) throw new Error('Không tìm thấy hồ sơ đối tác sau khi cập nhật.');
  return updated;
}

export function mapPartnerPlace(row: PartnerPlaceRow) {
  const isAccommodation = row.place_type === 'ACCOMMODATION';
  const isAttraction = row.place_type === 'ATTRACTION';
  return {
    id: String(row.place_id),
    placeId: row.place_id,
    name: row.name,
    category: isAccommodation ? ('luutru' as const) : isAttraction ? ('diemdulich' as const) : ('amthuc' as const),
    placeType: (row.place_type || 'RESTAURANT') as 'RESTAURANT' | 'ACCOMMODATION' | 'ATTRACTION',
    accommodationType: isAccommodation ? (row.accommodation_type || 'HOTEL') : undefined,
    starRating: isAccommodation ? (row.star_rating ?? undefined) : undefined,
    description: row.description || '',
    address: row.address || '',
    area: row.district_name || 'Đà Nẵng',
    districtId: row.district_id,
    cuisineId: row.cuisine_id,
    cuisineName: row.cuisine_name,
    priceMin: isAccommodation ? Number(row.acc_price_from ?? row.price_min ?? 0) : (row.price_min ?? 0),
    priceMax: isAccommodation ? undefined : (row.price_max ?? undefined),
    priceUnit: isAccommodation ? 'đêm' : 'món',
    openHours: isAccommodation ? '24/7' : '08:00 - 22:00',
    openDays: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'],
    amenities: ['Wifi miễn phí', 'Điều hòa', 'Thanh toán thẻ'],
    images:
      row.images && row.images.length > 0
        ? row.images
        : ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80'],
    lat: Number(row.latitude) || 16.0544,
    lng: Number(row.longitude) || 108.2022,
    status: row.status,
    viewCount: row.view_count || 0,
    bookingUrl: row.booking_url || '',
    phone: row.phone || '',
    website: row.website || '',
    partnerId: row.partner_id,
    createdAt: row.created_at.toISOString(),
  };
}

/** Lấy danh sách quán thuộc đối tác (có lọc status nếu có) */
export async function getPlaces(userId: number, statusFilter?: string | null) {
  const profile = await repo.findPartnerProfileByUserId(userId);
  if (!profile) return [];
  const rows = await repo.findPlacesByPartnerId(profile.partner_id, statusFilter);
  return rows.map(mapPartnerPlace);
}

/** Lấy chi tiết 1 cơ sở thuộc đối tác */
export async function getPlaceById(userId: number, placeId: number) {
  const profile = await repo.findPartnerProfileByUserId(userId);
  if (!profile) return null;
  const row = await repo.findPlaceByPartnerAndPlaceId(profile.partner_id, placeId);
  if (!row) return null;
  return mapPartnerPlace(row);
}

/** Lấy thống kê tổng quan cho đối tác đang đăng nhập */
export async function getDashboardStats(userId: number) {
  const profile = await repo.findPartnerProfileByUserId(userId);
  if (!profile) {
    return { totalPlaces: 0, totalViews: 0, totalBookings: 0, avgRating: 0 };
  }
  return repo.getPartnerDashboardStatsByPartnerId(profile.partner_id);
}

/** Lấy thống kê lượt đặt 7 ngày qua cho đối tác đang đăng nhập */
export async function getDailyBookings(userId: number) {
  const profile = await repo.findPartnerProfileByUserId(userId);
  if (!profile) {
    const days: { date: string; count: number }[] = [];
    const now = new Date();
    for (let offset = 6; offset >= 0; offset -= 1) {
      const d = new Date(now);
      d.setDate(now.getDate() - offset);
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      days.push({ date: `${dd}/${mm}`, count: 0 });
    }
    return days;
  }
  return repo.getPartnerDailyBookingsByPartnerId(profile.partner_id);
}

/** Lấy danh sách đơn đặt chỗ của các cơ sở thuộc đối tác đang đăng nhập */
export async function getBookings(userId: number, statusFilter?: string | null, search?: string | null) {
  const profile = await repo.findPartnerProfileByUserId(userId);
  if (!profile) return [];
  const rows = await repo.findBookingsByPartnerId(profile.partner_id, statusFilter, search);
  return rows.map((row) => {
    const dateVal = row.visit_date || row.created_at;
    const yyyy = dateVal.getFullYear();
    const mm = String(dateVal.getMonth() + 1).padStart(2, '0');
    const dd = String(dateVal.getDate()).padStart(2, '0');
    const upperMethod = String(row.payment_method || '').toUpperCase();
    const paymentMethod = upperMethod.includes('CASH') ? 'CASH' : 'TRANSFER';
    const upperStatus = String(row.status || 'PENDING').toUpperCase();
    const status =
      upperStatus === 'CONFIRMED' || upperStatus === 'COMPLETED' || upperStatus === 'CANCELLED'
        ? upperStatus
        : 'PENDING';

    return {
      id: String(row.booking_id),
      bookingCode: `DNG-${String(row.booking_id).padStart(6, '0')}`,
      placeId: String(row.place_id),
      placeName: row.place_name,
      customerName: row.contact_name,
      customerPhone: row.contact_phone,
      customerEmail: row.user_email || '',
      date: `${yyyy}-${mm}-${dd}`,
      numGuests: Number(row.num_guests ?? 1),
      totalPrice: Number(row.total_amount ?? 0),
      paymentMethod,
      status,
      createdAt: row.created_at.toISOString(),
    };
  });
}

/** Cập nhật trạng thái đơn đặt chỗ thuộc cơ sở của đối tác */
export async function updateBookingStatus(userId: number, bookingId: number, status: string) {
  const profile = await repo.findPartnerProfileByUserId(userId);
  if (!profile) return false;
  return repo.updateBookingStatusByPartner(profile.partner_id, bookingId, userId, status);
}

