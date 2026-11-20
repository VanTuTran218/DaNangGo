import { CreateEventDTO, EventCategory, EventTicketType, EventStatus, UpdateEventStatusDTO, SubmitEventDTO, RejectEventDTO } from './events.types';

const VALID_CATEGORIES: EventCategory[] = [
  'FESTIVAL',
  'MUSIC',
  'FOOD',
  'SPORTS',
  'EXHIBITION',
  'WORKSHOP',
  'FAMILY',
];

const VALID_TICKET_TYPES: EventTicketType[] = [
  'FREE_OPEN',
  'FREE_REGISTRATION',
  'PAID',
  'UNANNOUNCED',
];

const VALID_STATUSES: EventStatus[] = [
  'DRAFT',
  'PENDING_REVIEW',
  'PUBLISHED',
  'RESCHEDULED',
  'POSTPONED',
  'CANCELLED',
  'REJECTED',
];

export type EventValidationErrors = Record<string, string>;

export function validateCreateEvent(dto: Partial<CreateEventDTO>): { valid: boolean; errors: EventValidationErrors } {
  const errors: EventValidationErrors = {};

  if (!dto.title || dto.title.trim().length < 3 || dto.title.trim().length > 200) {
    errors.title = 'Tên sự kiện là bắt buộc, độ dài từ 3 đến 200 ký tự.';
  }

  if (dto.status === 'DRAFT') return { valid: Object.keys(errors).length === 0, errors };

  if (!dto.cover_image || dto.cover_image.trim().length === 0) {
    errors.cover_image = 'Ảnh bìa sự kiện là bắt buộc.';
  }

  if (!dto.short_description || dto.short_description.trim().length < 5 || dto.short_description.trim().length > 500) {
    errors.short_description = 'Mô tả ngắn là bắt buộc, từ 5 đến 500 ký tự.';
  }

  if (!dto.category || !VALID_CATEGORIES.includes(dto.category as EventCategory)) {
    errors.category = `Loại sự kiện không hợp lệ. Cho phép: ${VALID_CATEGORIES.join(', ')}.`;
  }

  const isStartValid = dto.start_time ? !isNaN(new Date(dto.start_time).getTime()) : false;
  if (!dto.start_time || !isStartValid) {
    errors.start_time = 'Thời gian bắt đầu không hợp lệ.';
  }

  const isEndValid = dto.end_time ? !isNaN(new Date(dto.end_time).getTime()) : false;
  if (!dto.end_time || !isEndValid) {
    errors.end_time = 'Thời gian kết thúc không hợp lệ.';
  }

  if (isStartValid && isEndValid) {
    if (new Date(dto.end_time!) < new Date(dto.start_time!)) {
      errors.end_time = 'Thời gian kết thúc không được sớm hơn thời gian bắt đầu';
    }
  }

  if (!dto.location_name || dto.location_name.trim().length === 0) {
    errors.location_name = 'Tên địa điểm là bắt buộc.';
  }

  if (!dto.address || dto.address.trim().length === 0) {
    errors.address = 'Địa chỉ cụ thể là bắt buộc.';
  }

  if (!dto.district || dto.district.trim().length === 0) {
    errors.district = 'Quận/huyện là bắt buộc.';
  }

  if (!dto.ticket_type || !VALID_TICKET_TYPES.includes(dto.ticket_type as EventTicketType)) {
    errors.ticket_type = `Loại vé không hợp lệ. Cho phép: ${VALID_TICKET_TYPES.join(', ')}.`;
  }

  if (dto.ticket_type === 'FREE_REGISTRATION' && (!dto.ticket_url || dto.ticket_url.trim().length === 0)) {
    errors.ticket_url = 'Sự kiện yêu cầu đăng ký cần cung cấp đường dẫn đăng ký tham gia.';
  }

  if (dto.status && !VALID_STATUSES.includes(dto.status as EventStatus)) {
    errors.status = `Trạng thái không hợp lệ. Cho phép: ${VALID_STATUSES.join(', ')}.`;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Kiểm tra dữ liệu Ban tổ chức gửi sự kiện đề xuất (Đợt 3)
 */
export function validateSubmitEvent(dto: Partial<SubmitEventDTO>): { valid: boolean; errors: EventValidationErrors } {
  const result = validateCreateEvent({
    ...dto,
    status: 'PUBLISHED', // Yêu cầu đầy đủ các trường như xuất bản
  });

  const errors = { ...result.errors };

  if (!dto.organizer_name || dto.organizer_name.trim().length === 0) {
    errors.organizer_name = 'Tên ban tổ chức / đơn vị phụ trách là bắt buộc.';
  }

  if (!dto.organizer_contact || dto.organizer_contact.trim().length === 0) {
    errors.organizer_contact = 'Thông tin liên hệ (Email/Số điện thoại) là bắt buộc.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Kiểm tra lý do từ chối sự kiện (Đợt 3)
 */
export function validateRejectEvent(dto: Partial<RejectEventDTO>): { valid: boolean; errors: EventValidationErrors } {
  const errors: EventValidationErrors = {};

  if (!dto.rejection_reason || dto.rejection_reason.trim().length < 5 || dto.rejection_reason.trim().length > 500) {
    errors.rejection_reason = 'Lý do từ chối là bắt buộc, độ dài từ 5 đến 500 ký tự.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateUpdateStatus(dto: Partial<UpdateEventStatusDTO>): { valid: boolean; errors: EventValidationErrors } {
  const errors: EventValidationErrors = {};

  if (!dto.status || !VALID_STATUSES.includes(dto.status as EventStatus)) {
    errors.status = `Trạng thái không hợp lệ. Cho phép: ${VALID_STATUSES.join(', ')}.`;
  }

  if (dto.status === 'RESCHEDULED') {
    if (dto.start_time && isNaN(Date.parse(dto.start_time))) {
      errors.start_time = 'Thời gian bắt đầu mới không hợp lệ.';
    }
    if (dto.end_time && isNaN(Date.parse(dto.end_time))) {
      errors.end_time = 'Thời gian kết thúc mới không hợp lệ.';
    }
    if (dto.start_time && dto.end_time && new Date(dto.end_time) < new Date(dto.start_time)) {
      errors.end_time = 'Thời gian kết thúc không được sớm hơn thời gian bắt đầu.';
    }
    if (!dto.reschedule_notice || dto.reschedule_notice.trim().length === 0) {
      errors.reschedule_notice = 'Khi dời lịch cần nhập ghi chú thông báo cho người tham gia.';
    }
  }

  if (dto.status === 'CANCELLED') {
    if (!dto.reschedule_notice || dto.reschedule_notice.trim().length === 0) {
      errors.reschedule_notice = 'Khi hủy sự kiện cần nhập lý do hủy để thông báo cho người tham gia.';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
