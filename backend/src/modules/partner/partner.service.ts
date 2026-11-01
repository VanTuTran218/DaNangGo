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
  return {
    id: String(row.place_id),
    placeId: row.place_id,
    name: row.name,
    category: 'amthuc' as const,
    placeType: 'RESTAURANT',
    description: row.description || '',
    address: row.address || '',
    area: row.district_name || 'Đà Nẵng',
    districtId: row.district_id,
    cuisineId: row.cuisine_id,
    cuisineName: row.cuisine_name,
    priceMin: row.price_min ?? 0,
    priceMax: row.price_max ?? undefined,
    priceUnit: 'món',
    openHours: '08:00 - 22:00',
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
