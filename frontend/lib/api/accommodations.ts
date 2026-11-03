import { apiRequest, apiPost, apiPut } from './client';

export type AccommodationType = 'HOTEL' | 'HOMESTAY' | 'RESORT' | 'HOSTEL' | 'APARTMENT';

/** Payload loại phòng gửi lên backend (khớp roomSchema trong accommodations.service.ts) */
export interface RoomInput {
  name: string;
  capacity: number;
  pricePerNight: number;
  originalPrice?: number | null;
  roomCount: number;
}

export interface RoomTypeItem extends RoomInput {
  room_type_id: number;
}

/** Payload tạo lưu trú (khớp createSchema) */
export interface CreateAccommodationInput {
  name: string;
  description?: string;
  address: string;
  districtId: number;
  latitude?: number;
  longitude?: number;
  phone?: string;
  website?: string;
  bookingUrl?: string;
  accommodationType: AccommodationType;
  starRating?: number | null;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  amenityIds: number[];
  images: string[];
  rooms?: RoomInput[];
}

export type UpdateAccommodationInput = Partial<Omit<CreateAccommodationInput, 'rooms'>>;

/** Một dòng trả về từ GET /api/accommodations/mine */
export interface MineAccommodationItem {
  place_id: number;
  name: string;
  status: string;
  view_count: number;
  avg_rating: number;
  review_count: number;
  price_from: number | null;
}

/** Danh mục tiện nghi (bảng dbo.amenities trong schema) */
export const AMENITY_LIST: { id: number; name: string }[] = [
  { id: 1, name: 'Wi-Fi miễn phí' },
  { id: 2, name: 'Hồ bơi' },
  { id: 3, name: 'Bữa sáng' },
  { id: 4, name: 'Điều hòa' },
  { id: 5, name: 'Đưa đón sân bay' },
  { id: 6, name: 'Chỗ đậu xe' },
  { id: 7, name: 'Gần biển' },
];

export const ACCOMMODATION_TYPE_OPTIONS: { value: AccommodationType; label: string }[] = [
  { value: 'HOTEL', label: 'Khách sạn' },
  { value: 'HOMESTAY', label: 'Homestay' },
  { value: 'RESORT', label: 'Resort' },
  { value: 'HOSTEL', label: 'Hostel' },
  { value: 'APARTMENT', label: 'Căn hộ' },
];

export function accommodationTypeLabel(type?: string | null): string {
  return ACCOMMODATION_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? 'Lưu trú';
}

// GET /api/accommodations/mine
export async function getMyAccommodations(): Promise<MineAccommodationItem[]> {
  const res = await apiRequest<MineAccommodationItem[]>('/api/accommodations/mine');
  return res.data ?? [];
}

// POST /api/accommodations
export async function createAccommodation(input: CreateAccommodationInput): Promise<number> {
  const res = await apiPost<{ placeId: number }>('/api/accommodations', input);
  if (!res.data) throw new Error('Không nhận được mã cơ sở lưu trú.');
  return res.data.placeId;
}

// PUT /api/accommodations/:id
export async function updateAccommodation(placeId: number, input: UpdateAccommodationInput): Promise<void> {
  await apiPut(`/api/accommodations/${placeId}`, input);
}

// POST /api/accommodations/:id/rooms
export async function addRoom(placeId: number, input: RoomInput): Promise<void> {
  await apiPost(`/api/accommodations/${placeId}/rooms`, input);
}

// PUT /api/accommodations/:id/rooms/:roomId
export async function updateRoom(placeId: number, roomId: number, input: RoomInput): Promise<void> {
  await apiPut(`/api/accommodations/${placeId}/rooms/${roomId}`, input);
}

// DELETE /api/accommodations/:id/rooms/:roomId (backend ẩn, không xóa)
export async function hideRoom(placeId: number, roomId: number): Promise<void> {
  await apiRequest(`/api/accommodations/${placeId}/rooms/${roomId}`, { method: 'DELETE' });
}

// GET /api/places/:id → lấy danh sách loại phòng đang hoạt động
export async function getRooms(placeId: number): Promise<RoomTypeItem[]> {
  const res = await apiRequest<Record<string, unknown>>(`/api/places/${placeId}`);
  const raw = ((res.data?.rooms ?? res.data?.room_types) || []) as Array<Record<string, unknown>>;
  return raw.map((r) => ({
    room_type_id: Number(r.room_type_id),
    name: String(r.name ?? ''),
    capacity: Number(r.capacity) || 1,
    pricePerNight: Number(r.price_per_night) || 0,
    originalPrice: r.original_price == null ? null : Number(r.original_price),
    roomCount: Number(r.room_count) || 1,
  }));
}
