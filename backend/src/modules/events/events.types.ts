export type EventCategory =
  | 'FESTIVAL'
  | 'MUSIC'
  | 'FOOD'
  | 'SPORTS'
  | 'EXHIBITION'
  | 'WORKSHOP'
  | 'FAMILY';

export type EventTicketType =
  | 'FREE_OPEN'
  | 'FREE_REGISTRATION'
  | 'PAID'
  | 'UNANNOUNCED';

export type EventStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'PUBLISHED'
  | 'RESCHEDULED'
  | 'POSTPONED'
  | 'CANCELLED'
  | 'REJECTED';

export interface EventRecord {
  event_id: number;
  title: string;
  slug: string;
  cover_image: string | null;
  short_description: string | null;
  description: string | null;
  category: EventCategory | null;
  start_time: Date | null;
  end_time: Date | null;
  is_all_day: boolean;
  place_id: number | null;
  location_name: string | null;
  address: string | null;
  district: string | null;
  latitude: number | null;
  longitude: number | null;
  ticket_type: EventTicketType | null;
  ticket_price_display: string | null;
  ticket_url: string | null;
  registration_deadline: Date | null;
  organizer_name: string | null;
  organizer_contact: string | null;
  source_url: string | null;
  is_featured: boolean;
  status: EventStatus;
  reschedule_notice: string | null;
  created_at: Date;
  updated_at: Date;

  // Kiểm duyệt Ban tổ chức (Đợt 3)
  submitted_by_user_id: number | null;
  rejection_reason: string | null;
  reviewed_by: number | null;
  reviewed_at: Date | null;

  // Song ngữ Tiếng Anh (Đợt 3)
  title_en: string | null;
  short_description_en: string | null;
  description_en: string | null;
  location_name_en: string | null;
  reschedule_notice_en: string | null;
}

export interface EventDetailResponse extends EventRecord {
  place?: {
    place_id: number;
    name: string;
    place_type: string;
    address: string | null;
    avg_rating: number;
    cover_image?: string | null;
  } | null;
  is_favorite?: boolean;
  is_in_calendar?: boolean;
}

export interface EventFavoriteRecord {
  id: number;
  user_id: number;
  event_id: number;
  created_at: Date;
  event?: EventRecord;
}

export interface EventUserCalendarRecord {
  id: number;
  user_id: number;
  event_id: number;
  added_at: Date;
}

export type EventNotificationType = 'RESCHEDULED' | 'POSTPONED' | 'CANCELLED' | 'TIME_CHANGE' | 'GENERAL';

export interface EventNotificationRecord {
  notification_id: number;
  user_id: number;
  event_id: number;
  title: string;
  message: string;
  type: EventNotificationType;
  notice: string | null;
  is_read: boolean;
  created_at: Date;
  event_title?: string;
  event_slug?: string;
}

export interface EventMapItem {
  event_id: number;
  title: string;
  slug: string;
  category: EventCategory | null;
  cover_image: string | null;
  latitude: number;
  longitude: number;
  location_name: string | null;
  address: string | null;
  district: string | null;
  start_time: Date | null;
  end_time: Date | null;
  ticket_type: EventTicketType | null;
  ticket_price_display: string | null;
  status: EventStatus;
  is_featured: boolean;
}

export interface CalendarLinksResponse {
  event_id: number;
  title: string;
  google_calendar_url: string;
  outlook_web_url: string;
  yahoo_calendar_url: string;
  ics_download_url: string;
}

export interface EventMapFilterQuery {
  category?: string;
  time_filter?: 'today' | 'this_weekend' | 'upcoming' | 'custom';
  start_date?: string;
  end_date?: string;
  min_lat?: number | string;
  max_lat?: number | string;
  min_lng?: number | string;
  max_lng?: number | string;
}

export interface CreateEventDTO {
  title: string;
  slug?: string | null;
  cover_image?: string | null;
  short_description?: string | null;
  description?: string | null;
  category?: EventCategory | null;
  start_time?: string | null; // ISO date string
  end_time?: string | null;   // ISO date string
  is_all_day?: boolean | null;
  place_id?: number | null;
  location_name?: string | null;
  address?: string | null;
  district?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  ticket_type?: EventTicketType | null;
  ticket_price_display?: string | null;
  ticket_url?: string | null;
  registration_deadline?: string | null;
  organizer_name?: string | null;
  organizer_contact?: string | null;
  source_url?: string | null;
  is_featured?: boolean | null;
  status?: EventStatus | null;
  reschedule_notice?: string | null;

  // Song ngữ Tiếng Anh (Đợt 3)
  title_en?: string | null;
  short_description_en?: string | null;
  description_en?: string | null;
  location_name_en?: string | null;
  reschedule_notice_en?: string | null;
  submitted_by_user_id?: number | null;
  rejection_reason?: string | null;
}

export interface SubmitEventDTO {
  title: string;
  cover_image: string;
  short_description: string;
  description?: string;
  category: EventCategory;
  start_time: string;
  end_time: string;
  is_all_day?: boolean;
  location_name: string;
  address: string;
  district: string;
  latitude?: number;
  longitude?: number;
  ticket_type: EventTicketType;
  ticket_price_display?: string;
  ticket_url?: string;
  registration_deadline?: string;
  organizer_name: string;
  organizer_contact: string;
  source_url?: string;
  // Tiếng Anh
  title_en?: string;
  short_description_en?: string;
  description_en?: string;
  location_name_en?: string;
}

export interface RejectEventDTO {
  rejection_reason: string;
}

export interface NearbyPlaceItem {
  place_id: number;
  name: string;
  slug?: string;
  place_type: string;
  address: string | null;
  district?: string | null;
  cover_image: string | null;
  avg_rating: number;
  latitude: number | null;
  longitude: number | null;
  distance_km: number;
  distance_meters: number;
}

export interface NearbyPlacesQuery {
  radius?: number | string;
  radius_km?: number | string;
  place_type?: string;
  limit?: number | string;
}

export interface UpdateEventDTO extends Partial<CreateEventDTO> {}

export interface UpdateEventStatusDTO {
  status: EventStatus;
  start_time?: string;
  end_time?: string;
  reschedule_notice?: string;
}

export interface EventFilterQuery {
  q?: string;
  time_filter?: 'today' | 'this_weekend' | 'upcoming' | 'custom';
  start_date?: string; // YYYY-MM-DD
  end_date?: string;   // YYYY-MM-DD
  category?: string;   // comma separated or single
  district?: string;   // comma separated or single
  ticket_type?: 'FREE' | 'PAID' | 'UNANNOUNCED' | string;
  lang?: 'vi' | 'en' | string;
  page?: number | string;
  limit?: number | string;
}

export interface AdminEventFilterQuery {
  q?: string;
  status?: EventStatus | 'ALL';
  category?: string;
  page?: number | string;
  limit?: number | string;
}
