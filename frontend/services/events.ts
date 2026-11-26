import { ApiError, apiPatch, apiPost, apiPut, apiRequest } from '@/lib/api/client';
import { parseEventDate, toISO, type ChangeValues } from '@/lib/events/schema';
import type { Event, EventStatus, Place, TicketType } from '@/types/event';

const eventsPath = '/api/admin/events';
const eventPath = (id: string) => `${eventsPath}/${encodeURIComponent(id)}`;

type EventRecord = {
  event_id: number;
  slug?: string;
  title?: string;
  cover_image?: string | null;
  short_description?: string | null;
  description?: string | null;
  category?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  is_all_day?: boolean;
  place_id?: number | null;
  location_name?: string | null;
  address?: string | null;
  district?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  ticket_type?: TicketType;
  ticket_price_display?: string | null;
  ticket_url?: string | null;
  registration_deadline?: string | null;
  organizer_name?: string | null;
  organizer_contact?: string | null;
  source_url?: string | null;
  is_featured?: boolean;
  status: EventStatus;
  reschedule_notice?: string | null;
  updated_at?: string | null;
};

type EventPage = {
  items: EventRecord[];
  total?: number;
  limit?: number;
  total_pages?: number;
  totalPages?: number;
};

function fromRecord(record: EventRecord): Event {
  if (!Number.isInteger(record?.event_id) || record.event_id < 1) {
    throw new Error('Máy chủ không trả về ID sự kiện hợp lệ.');
  }
  return {
    id: String(record.event_id), slug: record.slug,
    name: record.title ?? '', imageUrl: record.cover_image ?? '', shortDescription: record.short_description ?? '',
    description: record.description ?? '', eventType: record.category ?? '',
    startAt: parseEventDate(record.start_time), endAt: parseEventDate(record.end_time),
    isAllDay: Boolean(record.is_all_day), placeId: record.place_id == null ? undefined : String(record.place_id),
    locationName: record.location_name ?? '', address: record.address ?? '', district: record.district ?? '',
    latitude: record.latitude ?? undefined, longitude: record.longitude ?? undefined,
    ticketType: record.ticket_type ?? 'FREE_OPEN', ticketPriceDisplay: record.ticket_price_display ?? '',
    ticketUrl: record.ticket_url ?? '', registrationDeadline: parseEventDate(record.registration_deadline),
    organizerName: record.organizer_name ?? '', organizerContact: record.organizer_contact ?? '',
    officialSourceUrl: record.source_url ?? '', isFeatured: Boolean(record.is_featured),
    status: record.status, changeNote: record.reschedule_notice ?? undefined,
    updatedAt: parseEventDate(record.updated_at) || undefined,
  };
}

function apiDate(iso: string) {
  const timestamp = Date.parse(iso);
  return Number.isFinite(timestamp)
    ? new Date(timestamp + 7 * 3_600_000).toISOString().slice(0, 23).replace(/\.000$/, '')
    : null;
}

function toPayload(event: Event) {
  return {
    title: event.name,
    cover_image: event.imageUrl || null,
    short_description: event.shortDescription || null,
    description: event.description || null,
    category: event.eventType || null,
    start_time: apiDate(event.startAt),
    end_time: apiDate(event.endAt),
    is_all_day: event.isAllDay,
    place_id: event.placeId ? Number(event.placeId) : null,
    location_name: event.locationName || null,
    address: event.address || null,
    district: event.district || null,
    latitude: event.latitude ?? null,
    longitude: event.longitude ?? null,
    ticket_type: event.ticketType,
    ticket_price_display: event.ticketPriceDisplay || null,
    ticket_url: event.ticketUrl || null,
    registration_deadline: apiDate(event.registrationDeadline),
    organizer_name: event.organizerName || null,
    organizer_contact: event.organizerContact || null,
    source_url: event.officialSourceUrl || null,
    is_featured: event.isFeatured,
  };
}

const errorFields: Record<string, string> = {
  title: 'name', cover_image: 'imageUrl', short_description: 'shortDescription', category: 'eventType',
  start_time: 'startAt', end_time: 'endAt', is_all_day: 'isAllDay', place_id: 'placeId',
  location_name: 'locationName', ticket_type: 'ticketType', ticket_price_display: 'ticketPriceDisplay',
  ticket_url: 'ticketUrl', registration_deadline: 'registrationDeadline', organizer_name: 'organizerName',
  organizer_contact: 'organizerContact', source_url: 'officialSourceUrl', is_featured: 'isFeatured',
  reschedule_notice: 'changeNote',
};

export function eventFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError)) return {};
  const details = error.raw?.errors ?? error.raw?.details;
  const entries: [string, unknown][] = Array.isArray(details)
    ? details.flatMap(issue => {
        const field = Array.isArray(issue?.path) ? issue.path.join('.') : issue?.path ?? issue?.field;
        return typeof field === 'string' ? [[field, issue.message] as [string, unknown]] : [];
      })
    : details && typeof details === 'object'
      ? Object.entries('fieldErrors' in details && details.fieldErrors && typeof details.fieldErrors === 'object'
        ? details.fieldErrors : details)
      : [];
  return Object.fromEntries(entries.flatMap(([field, value]) => {
    const message = Array.isArray(value) ? value[0] : value;
    const key = field.replace(/^body\./, '');
    return typeof message === 'string' ? [[errorFields[key] ?? key, message]] : [];
  }));
}

export async function listEvents(status: EventStatus | 'ALL', page: number, signal?: AbortSignal) {
  const query = new URLSearchParams({ status, page: String(page) });
  const result = await apiRequest<EventRecord[] | EventPage>(`${eventsPath}?${query}`, { signal, cache: 'no-store' });
  const data = result.data;
  const items = Array.isArray(data) ? data : data?.items;
  if (!Array.isArray(items)) throw new Error('Phản hồi danh sách sự kiện không hợp lệ.');
  const paging = Array.isArray(data) ? undefined : data;
  const totalPages = result.pagination?.totalPages ?? paging?.total_pages ?? paging?.totalPages
    ?? (paging?.limit && paging.total !== undefined ? Math.ceil(paging.total / paging.limit) : 1);
  return { events: items.map(fromRecord), totalPages: Math.max(1, totalPages) };
}

export async function getEvent(id: string, signal?: AbortSignal) {
  const result = await apiRequest<EventRecord>(eventPath(id), { cache: 'no-store', signal });
  if (!result.data) throw new Error('Máy chủ không trả về dữ liệu sự kiện.');
  return fromRecord(result.data);
}

export async function createEvent(event: Event, status: 'DRAFT' | 'PUBLISHED') {
  const result = await apiPost<EventRecord>(eventsPath, { ...toPayload(event), status });
  if (!result.data) throw new Error('Máy chủ không trả về sự kiện vừa tạo. Kiểm tra danh sách trước khi thử lại.');
  return fromRecord(result.data);
}

export async function updateEvent(id: string, event: Event) {
  const result = await apiPut<EventRecord>(eventPath(id), toPayload(event));
  return result.data?.event_id ? fromRecord(result.data) : getEvent(id);
}

export async function changeEventStatus(id: string, status: Exclude<EventStatus, 'DRAFT'>, values?: ChangeValues) {
  const result = await apiPatch<EventRecord>(`${eventPath(id)}/status`, {
    status,
    ...(values && { reschedule_notice: values.changeNote }),
    ...(status === 'RESCHEDULED' && values && {
      start_time: apiDate(toISO(values.startAt)),
      end_time: apiDate(toISO(values.endAt)),
    }),
  });
  return result.data?.event_id ? fromRecord(result.data) : getEvent(id);
}

type PlaceRecord = {
  place_id: number;
  name: string;
  address: string | null;
  district_name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

function fromPlace(record: PlaceRecord): Place {
  return {
    id: String(record.place_id), name: record.name, address: record.address ?? '',
    district: record.district_name ?? undefined,
    latitude: record.latitude ?? undefined, longitude: record.longitude ?? undefined,
  };
}

export async function fetchPlaces(keyword: string, signal?: AbortSignal) {
  const query = new URLSearchParams({ limit: '30' });
  if (keyword.trim()) query.set('q', keyword.trim());
  const result = await apiRequest<{ items: PlaceRecord[] }>(`/api/places?${query}`, { signal });
  if (!result.data) throw new Error('Máy chủ không trả về danh sách địa điểm.');
  return result.data.items.map(fromPlace);
}
