export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'RESCHEDULED' | 'POSTPONED' | 'CANCELLED';
export type EventAction = 'reschedule' | 'postpone' | 'cancel';

export const STATUS_LABELS: Record<EventStatus, string> = {
  DRAFT: 'Bản nháp',
  PUBLISHED: 'Đã đăng',
  RESCHEDULED: 'Đã đổi lịch',
  POSTPONED: 'Tạm hoãn',
  CANCELLED: 'Đã hủy',
};

export const EVENT_TYPES = {
  FESTIVAL: 'Lễ hội',
  MUSIC: 'Âm nhạc',
  FOOD: 'Ẩm thực',
  SPORTS: 'Thể thao',
  EXHIBITION: 'Triển lãm',
  WORKSHOP: 'Workshop',
  FAMILY: 'Gia đình',
};

export const TICKET_TYPES = {
  FREE_OPEN: 'Miễn phí, vào tự do',
  FREE_REGISTRATION: 'Miễn phí, cần đăng ký',
  PAID: 'Có phí',
  UNANNOUNCED: 'Chưa công bố',
};

export type TicketType = keyof typeof TICKET_TYPES;

export type Place = {
  id: string;
  name: string;
  address: string;
  district?: string;
  latitude?: number;
  longitude?: number;
};

export type Event = {
  id?: string;
  slug?: string;
  name: string;
  imageUrl: string;
  shortDescription: string;
  description: string;
  eventType: string;
  startAt: string;
  endAt: string;
  isAllDay: boolean;
  placeId?: string;
  locationName: string;
  address: string;
  district: string;
  latitude?: number;
  longitude?: number;
  ticketType: TicketType;
  ticketPriceDisplay: string;
  ticketUrl: string;
  registrationDeadline: string;
  organizerName: string;
  organizerContact: string;
  officialSourceUrl: string;
  isFeatured: boolean;
  status: EventStatus;
  changeNote?: string;
  updatedAt?: string;
};

export function canChangeStatus(status: EventStatus, action: EventAction) {
  if (action === 'postpone') return status === 'PUBLISHED' || status === 'RESCHEDULED';
  return status === 'PUBLISHED' || status === 'RESCHEDULED' || status === 'POSTPONED';
}
