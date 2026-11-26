import { z } from 'zod';
import { EVENT_TYPES, TICKET_TYPES, type Event } from '@/types/event';

export function isHttpUrl(value: string) {
  try { return ['http:', 'https:'].includes(new URL(value).protocol); } catch { return false; }
}

const optionalUrl = z.string().trim().max(500).refine(v => !v || isHttpUrl(v), 'Nhập URL hợp lệ (http hoặc https).');

export function isLocalDateTime(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return false;
  const date = new Date(`${value}:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 16) === value;
}

const optionalDate = z.string().refine(v => !v || isLocalDateTime(v), 'Thời gian không hợp lệ.');
const fields = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên sự kiện.').max(200),
  imageUrl: optionalUrl,
  shortDescription: z.string().trim().max(500),
  description: z.string().trim(),
  eventType: z.string().refine(v => !v || Object.hasOwn(EVENT_TYPES, v), 'Loại sự kiện không hợp lệ.'),
  startAt: optionalDate,
  endAt: optionalDate,
  isAllDay: z.boolean(),
  placeMode: z.enum(['existing', 'new']),
  placeId: z.string(),
  locationName: z.string().trim().max(200),
  address: z.string().trim().max(300),
  district: z.string().trim().max(100),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  ticketType: z.enum(Object.keys(TICKET_TYPES) as (keyof typeof TICKET_TYPES)[]),
  ticketPriceDisplay: z.string().trim().max(100),
  ticketUrl: optionalUrl,
  registrationDeadline: optionalDate,
  organizerName: z.string().trim().max(200),
  organizerContact: z.string().trim().max(255),
  officialSourceUrl: optionalUrl,
  isFeatured: z.boolean(),
});

export type EventFormValues = z.infer<typeof fields>;

export function hasInvalidDateRange(start: string, end: string) {
  return isLocalDateTime(start) && isLocalDateTime(end) && end <= start;
}

export const draftSchema = fields.superRefine((data, ctx) => {
  if (hasInvalidDateRange(data.startAt, data.endAt)) {
    ctx.addIssue({ code: 'custom', path: ['endAt'], message: 'Giờ kết thúc phải sau giờ bắt đầu.' });
  }
  if (data.placeMode === 'existing' && data.placeId && !/^[1-9]\d*$/.test(data.placeId)) {
    ctx.addIssue({ code: 'custom', path: ['placeId'], message: 'Vui lòng chọn lại địa điểm.' });
  }
});

export const eventSchema = draftSchema.superRefine((data, ctx) => {
  const required = (key: keyof EventFormValues, message: string) => {
    if (!data[key]) ctx.addIssue({ code: 'custom', path: [key], message });
  };
  required('imageUrl', 'Vui lòng nhập URL ảnh bìa.');
  required('shortDescription', 'Vui lòng nhập mô tả ngắn.');
  required('eventType', 'Vui lòng chọn loại sự kiện.');
  required('startAt', 'Vui lòng chọn thời gian bắt đầu.');
  required('endAt', 'Vui lòng chọn thời gian kết thúc.');
  if (data.placeMode === 'existing') required('placeId', 'Vui lòng chọn địa điểm.');
  required('locationName', 'Vui lòng nhập tên địa điểm.');
  required('address', 'Vui lòng nhập địa chỉ.');
  required('district', 'Vui lòng nhập quận/huyện.');
  if (data.ticketType === 'FREE_REGISTRATION') required('ticketUrl', 'Vui lòng nhập link đăng ký.');
});

export const changeSchema = z.object({
  startAt: z.string(),
  endAt: z.string(),
  changeNote: z.string().trim().min(1, 'Vui lòng nhập ghi chú để người xem biết lý do.').max(500),
});

export const rescheduleSchema = changeSchema.superRefine((data, ctx) => {
  for (const field of ['startAt', 'endAt'] as const) {
    if (!isLocalDateTime(data[field])) ctx.addIssue({ code: 'custom', path: [field], message: 'Vui lòng chọn thời gian hợp lệ.' });
  }
  if (hasInvalidDateRange(data.startAt, data.endAt)) {
    ctx.addIssue({ code: 'custom', path: ['endAt'], message: 'Giờ kết thúc phải sau giờ bắt đầu.' });
  }
});

export type ChangeValues = z.infer<typeof changeSchema>;

// DATETIME2 không có offset được đọc theo giờ Đà Nẵng.
export function parseEventDate(value?: string | null) {
  if (!value) return '';
  const iso = value.replace(' ', 'T');
  const date = new Date(/[zZ]$|[+-]\d{2}:?\d{2}$/.test(iso) ? iso : `${iso}+07:00`);
  return Number.isFinite(date.getTime()) ? date.toISOString() : '';
}

export function toLocalInput(iso?: string) {
  const timestamp = Date.parse(iso ?? '');
  return Number.isFinite(timestamp) ? new Date(timestamp + 7 * 3_600_000).toISOString().slice(0, 16) : '';
}

export function toISO(value: string) {
  return isLocalDateTime(value) ? new Date(`${value}:00+07:00`).toISOString() : '';
}

export function toFormValues(event?: Event): EventFormValues {
  return {
    name: event?.name ?? '', imageUrl: event?.imageUrl ?? '', shortDescription: event?.shortDescription ?? '',
    description: event?.description ?? '', eventType: event?.eventType ?? '',
    startAt: toLocalInput(event?.startAt), endAt: toLocalInput(event?.endAt), isAllDay: event?.isAllDay ?? false,
    placeMode: event?.placeId || !event ? 'existing' : 'new', placeId: event?.placeId ?? '',
    locationName: event?.locationName ?? '', address: event?.address ?? '', district: event?.district ?? '',
    latitude: event?.latitude, longitude: event?.longitude,
    ticketType: event?.ticketType ?? 'FREE_OPEN', ticketPriceDisplay: event?.ticketPriceDisplay ?? '',
    ticketUrl: event?.ticketUrl ?? '', registrationDeadline: toLocalInput(event?.registrationDeadline),
    organizerName: event?.organizerName ?? '', organizerContact: event?.organizerContact ?? '',
    officialSourceUrl: event?.officialSourceUrl ?? '', isFeatured: event?.isFeatured ?? false,
  };
}

export function toEvent(values: EventFormValues, previous?: Event): Event {
  const { placeMode, placeId, ...fields } = values;
  const lockedSchedule = previous && previous.status !== 'DRAFT';
  return {
    ...previous,
    ...fields,
    startAt: lockedSchedule ? previous.startAt : toISO(values.startAt),
    endAt: lockedSchedule ? previous.endAt : toISO(values.endAt),
    registrationDeadline: toISO(values.registrationDeadline),
    placeId: placeMode === 'existing' ? placeId || undefined : undefined,
    status: previous?.status ?? 'DRAFT',
  };
}

export function formatEventDate(value: string) {
  return value && Number.isFinite(Date.parse(value))
    ? new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
    : '—';
}
