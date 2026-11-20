import { EventsRepository } from './events.repository';
import {
  CreateEventDTO,
  UpdateEventDTO,
  UpdateEventStatusDTO,
  EventFilterQuery,
  AdminEventFilterQuery,
  EventRecord,
  EventDetailResponse,
  EventMapItem,
  EventMapFilterQuery,
  EventNotificationRecord,
  CalendarLinksResponse,
  SubmitEventDTO,
  RejectEventDTO,
  NearbyPlaceItem,
  NearbyPlacesQuery,
} from './events.types';
import {
  validateCreateEvent,
  validateUpdateStatus,
  validateSubmitEvent,
  validateRejectEvent,
} from './events.validation';
import { getPool, sql } from '../../config/db';

export class EventsService {
  private repository: EventsRepository;

  constructor() {
    this.repository = new EventsRepository();
  }

  /**
   * Tính toán các mốc thời gian theo múi giờ Đà Nẵng (UTC+7)
   */
  private getDaNangTime(): { now: Date; today: { start: Date; end: Date }; weekend: { start: Date; end: Date } } {
    const utcNow = new Date();
    // Giờ Đà Nẵng = UTC + 7 tiếng
    const daNangOffsetMs = 7 * 60 * 60 * 1000;
    const daNangTime = new Date(utcNow.getTime() + daNangOffsetMs);

    const year = daNangTime.getUTCFullYear();
    const month = daNangTime.getUTCMonth();
    const date = daNangTime.getUTCDate();
    const dayOfWeek = daNangTime.getUTCDay(); // 0: Chủ Nhật, 1: Thứ 2, ..., 6: Thứ 7

    // Hôm nay: 00:00:00 -> 23:59:59 (theo giờ UTC lưu trong DB)
    const todayStartUtc = new Date(Date.UTC(year, month, date, 0, 0, 0, 0) - daNangOffsetMs);
    const todayEndUtc = new Date(Date.UTC(year, month, date, 23, 59, 59, 999) - daNangOffsetMs);

    // Tính cuối tuần này:
    // Từ Chiều Thứ Sáu 16:00 đến hết Chủ Nhật 23:59:59
    let daysUntilFriday = 5 - dayOfWeek;
    if (dayOfWeek === 0) {
      // Nếu hôm nay là Chủ Nhật -> Cuối tuần này chính là Chủ Nhật hôm nay
      daysUntilFriday = -2;
    } else if (dayOfWeek === 6) {
      // Nếu hôm nay là Thứ Bảy
      daysUntilFriday = -1;
    }

    const fridayDate = new Date(Date.UTC(year, month, date + daysUntilFriday, 16, 0, 0, 0) - daNangOffsetMs);
    const sundayDate = new Date(Date.UTC(year, month, date + daysUntilFriday + 2, 23, 59, 59, 999) - daNangOffsetMs);

    return {
      now: utcNow,
      today: { start: todayStartUtc, end: todayEndUtc },
      weekend: { start: fridayDate, end: sundayDate },
    };
  }

  /**
   * Tạo slug thân thiện từ tiêu đề tiếng Việt
   */
  private createSlug(str: string): string {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  /**
   * Chuyển đổi ngôn ngữ nội dung sự kiện theo tham số `lang` ('vi' | 'en')
   * Fallback thông minh: nếu trường tiếng Anh rỗng, tự động giữ nguyên tiếng Việt
   */
  public applyLanguage<T extends EventRecord>(event: T, lang?: string): T {
    if (!lang || lang.toLowerCase() !== 'en') {
      return event;
    }
    return {
      ...event,
      title: event.title_en || event.title,
      short_description: event.short_description_en || event.short_description,
      description: event.description_en || event.description,
      location_name: event.location_name_en || event.location_name,
      reschedule_notice: event.reschedule_notice_en || event.reschedule_notice,
    };
  }

  /**
   * 1. Lấy dữ liệu cho mục sự kiện trên Trang chủ
   */
  async getHomeEvents(lang?: string): Promise<{ title: string; is_weekend: boolean; events: EventRecord[] }> {
    const { now, weekend } = this.getDaNangTime();
    const result = await this.repository.getHomeEvents(weekend, now);
    const events = result.events.map((e) => this.applyLanguage(e, lang));
    let title = result.title;
    if (lang?.toLowerCase() === 'en') {
      title = result.is_weekend ? 'This Weekend in Da Nang' : 'Upcoming in Da Nang';
    }
    return {
      ...result,
      title,
      events,
    };
  }

  /**
   * 2. Lấy danh sách sự kiện kèm bộ lọc và tìm kiếm
   */
  async getPublicEvents(query: EventFilterQuery): Promise<{
    events: EventRecord[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(50, Number(query.limit) || 12));
    const offset = (page - 1) * limit;

    const { now, today, weekend } = this.getDaNangTime();
    let timeWindow: { start: Date; end: Date } | undefined;

    if (query.time_filter === 'today') {
      timeWindow = today;
    } else if (query.time_filter === 'this_weekend') {
      timeWindow = weekend;
    } else if (query.time_filter === 'custom' && query.start_date && query.end_date) {
      const daNangOffsetMs = 7 * 60 * 60 * 1000;
      const [sY, sM, sD] = query.start_date.split('-').map(Number);
      const [eY, eM, eD] = query.end_date.split('-').map(Number);
      if (!isNaN(sY) && !isNaN(eY)) {
        timeWindow = {
          start: new Date(Date.UTC(sY, sM - 1, sD, 0, 0, 0, 0) - daNangOffsetMs),
          end: new Date(Date.UTC(eY, eM - 1, eD, 23, 59, 59, 999) - daNangOffsetMs),
        };
      }
    }

    const categories = query.category ? query.category.split(',').map((c) => c.trim().toUpperCase()) : undefined;
    const districts = query.district ? query.district.split(',').map((d) => d.trim()) : undefined;

    const { events, total } = await this.repository.getPublicEvents({
      q: query.q,
      categories,
      districts,
      ticketType: query.ticket_type,
      timeWindow,
      now,
      offset,
      limit,
    });

    const mappedEvents = events.map((e) => this.applyLanguage(e, query.lang));

    return {
      events: mappedEvents,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * 3. Lấy chi tiết sự kiện
   */
  async getPublicEventDetail(idOrSlug: string, userId?: number, lang?: string): Promise<EventDetailResponse> {
    const event = await this.repository.getPublicEventByIdOrSlug(idOrSlug, userId);
    if (!event) {
      throw { statusCode: 404, message: 'Không tìm thấy sự kiện hoặc sự kiện chưa được công khai.' };
    }
    return this.applyLanguage(event, lang);
  }

  // ==================== CÁC PHƯƠNG THỨC ADMIN ====================

  /**
   * Lấy danh sách sự kiện cho Quản trị viên
   */
  async getAdminEvents(query: AdminEventFilterQuery): Promise<{
    events: EventRecord[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 15));
    const offset = (page - 1) * limit;

    const { events, total } = await this.repository.getAdminEvents({
      q: query.q,
      status: query.status,
      category: query.category,
      offset,
      limit,
    });

    return {
      events,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Lấy chi tiết một sự kiện để sửa trong Admin
   */
  async getAdminEventById(id: number): Promise<EventRecord> {
    const event = await this.repository.getAdminEventById(id);
    if (!event) {
      throw { statusCode: 404, message: 'Không tìm thấy sự kiện.' };
    }
    return event;
  }

  /**
   * Tạo mới một sự kiện (Admin)
   */
  async createEvent(data: CreateEventDTO): Promise<EventRecord> {
    // 1. Kiểm tra validation
    const validation = validateCreateEvent(data);
    if (!validation.valid) {
      throw { statusCode: 400, message: Object.values(validation.errors)[0], errors: validation.errors };
    }

    // 2. Kế thừa thông tin địa điểm nếu có place_id
    if (data.place_id) {
      const pool = getPool();
      const placeRes = await pool.request()
        .input('placeId', sql.Int, data.place_id)
        .query('SELECT name, address, latitude, longitude FROM dbo.places WHERE place_id = @placeId');
      
      const place = placeRes.recordset[0];
      if (place) {
        if (!data.location_name) data.location_name = place.name;
        if (!data.address) data.address = place.address;
        if (data.latitude === undefined || data.latitude === null) data.latitude = place.latitude;
        if (data.longitude === undefined || data.longitude === null) data.longitude = place.longitude;
      }
    }

    // 3. Tạo slug duy nhất
    let baseSlug = data.slug ? this.createSlug(data.slug) : this.createSlug(data.title);
    if (!baseSlug) baseSlug = `event-${Date.now()}`;

    let uniqueSlug = baseSlug;
    let counter = 1;
    while (await this.repository.checkSlugExists(uniqueSlug)) {
      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    return this.repository.createEvent({
      ...data,
      slug: uniqueSlug,
    });
  }

  /**
   * Cập nhật sự kiện (Admin)
   */
  async updateEvent(id: number, data: UpdateEventDTO): Promise<EventRecord> {
    const existing = await this.repository.getAdminEventById(id);
    if (!existing) {
      throw { statusCode: 404, message: 'Không tìm thấy sự kiện cần cập nhật.' };
    }

    if (existing.status === 'CANCELLED') {
      throw { statusCode: 400, message: 'Không thể chỉnh sửa sự kiện đã hủy.' };
    }

    const validation = validateCreateEvent({ ...existing, ...data } as any);
    if (!validation.valid) {
      throw { statusCode: 400, message: Object.values(validation.errors)[0], errors: validation.errors };
    }

    // Nếu có đổi thời gian, kiểm tra logic start_time <= end_time
    const newStart = data.start_time ? new Date(data.start_time) : existing.start_time;
    const newEnd = data.end_time ? new Date(data.end_time) : existing.end_time;
    if (newStart && newEnd && newEnd < newStart) {
      throw { statusCode: 400, message: 'Thời gian kết thúc không được sớm hơn thời gian bắt đầu.' };
    }

    const updated = await this.repository.updateEvent(id, data);
    if (!updated) {
      throw { statusCode: 500, message: 'Cập nhật sự kiện thất bại.' };
    }

    // Tự động thông báo khi có đổi ngày giờ tổ chức
    if (data.start_time || data.end_time) {
      const oldStart = existing.start_time ? new Date(existing.start_time).getTime() : 0;
      const newStart = data.start_time ? new Date(data.start_time).getTime() : oldStart;
      if (oldStart !== newStart) {
        await this.notifyInterestedUsers(
          id,
          `Thời gian tổ chức sự kiện "${existing.title}" đã thay đổi`,
          `Sự kiện "${existing.title}" đã được cập nhật thời gian tổ chức mới. Vui lòng kiểm tra lại lịch trình của bạn.`,
          'TIME_CHANGE'
        );
      }
    }

    return updated;
  }

  /**
   * Đổi trạng thái nhanh (Đổi lịch, Hủy, Xuất bản)
   */
  async updateEventStatus(id: number, dto: UpdateEventStatusDTO): Promise<EventRecord> {
    const validation = validateUpdateStatus(dto);
    if (!validation.valid) {
      throw { statusCode: 400, message: Object.values(validation.errors)[0], errors: validation.errors };
    }

    const existing = await this.repository.getAdminEventById(id);
    if (!existing) {
      throw { statusCode: 404, message: 'Không tìm thấy sự kiện.' };
    }

    if (existing.status === 'CANCELLED') {
      throw { statusCode: 400, message: 'Không thể chỉnh sửa sự kiện đã hủy.' };
    }

    if (dto.status === 'PUBLISHED') {
      const fullValidation = validateCreateEvent({
        ...existing,
        start_time: dto.start_time || (existing.start_time ? new Date(existing.start_time).toISOString() : undefined),
        end_time: dto.end_time || (existing.end_time ? new Date(existing.end_time).toISOString() : undefined),
        status: 'PUBLISHED',
      } as any);
      if (!fullValidation.valid) {
        throw {
          statusCode: 400,
          message: 'Dữ liệu không hợp lệ',
          errors: fullValidation.errors,
        };
      }
    }

    const updated = await this.repository.updateEventStatus(
      id,
      dto.status,
      dto.reschedule_notice,
      dto.start_time,
      dto.end_time
    );

    if (!updated) {
      throw { statusCode: 500, message: 'Đổi trạng thái sự kiện thất bại.' };
    }

    // Tự động gửi thông báo cho những người dùng đã quan tâm khi sự kiện đổi lịch, hoãn hoặc hủy
    if (['RESCHEDULED', 'POSTPONED', 'CANCELLED'].includes(dto.status)) {
      let notifTitle = `Sự kiện "${existing.title}" có cập nhật mới`;
      let notifMsg = `Trạng thái sự kiện "${existing.title}" đã được thay đổi.`;

      if (dto.status === 'CANCELLED') {
        notifTitle = `Sự kiện "${existing.title}" đã bị hủy`;
        notifMsg = `Sự kiện "${existing.title}" đã bị hủy bởi ban tổ chức.${dto.reschedule_notice ? ' Lý do: ' + dto.reschedule_notice : ''}`;
      } else if (dto.status === 'POSTPONED') {
        notifTitle = `Sự kiện "${existing.title}" đã tạm hoãn`;
        notifMsg = `Sự kiện "${existing.title}" đã tạm hoãn.${dto.reschedule_notice ? ' Thông báo: ' + dto.reschedule_notice : ''}`;
      } else if (dto.status === 'RESCHEDULED') {
        notifTitle = `Sự kiện "${existing.title}" đã dời lịch tổ chức`;
        notifMsg = `Sự kiện "${existing.title}" đã dời lịch.${dto.reschedule_notice ? ' Ghi chú: ' + dto.reschedule_notice : ''}`;
      }

      await this.notifyInterestedUsers(id, notifTitle, notifMsg, dto.status, dto.reschedule_notice);
    }

    return updated;
  }

  /**
   * Xóa sự kiện (Admin)
   */
  async deleteEvent(id: number): Promise<{ success: boolean; message: string }> {
    const existing = await this.repository.getAdminEventById(id);
    if (!existing) {
      throw { statusCode: 404, message: 'Không tìm thấy sự kiện cần xóa.' };
    }

    await this.repository.deleteEvent(id);
    return { success: true, message: 'Đã xóa sự kiện thành công.' };
  }

  // ==================== CÁC PHƯƠNG THỨC ĐỢT 2 ====================

  /**
   * Helper gửi thông báo cho những người dùng đã lưu/thêm lịch sự kiện
   */
  private async notifyInterestedUsers(
    eventId: number,
    title: string,
    message: string,
    type: string,
    notice?: string | null
  ): Promise<void> {
    try {
      const userIds = await this.repository.getUsersInterestedInEvent(eventId);
      for (const userId of userIds) {
        await this.repository.createEventNotification({
          userId,
          eventId,
          title,
          message,
          type,
          notice,
        });
      }
    } catch (err) {
      console.error('Lỗi khi gửi thông báo biến động sự kiện:', err);
    }
  }

  /**
   * Toggle lưu sự kiện yêu thích (Favorite/Bookmark)
   */
  async toggleFavorite(userId: number, eventId: number): Promise<{ favorited: boolean; message: string }> {
    const event = await this.repository.getPublicEventByIdOrSlug(eventId);
    if (!event) {
      throw { statusCode: 404, message: 'Sự kiện không tồn tại hoặc chưa được công khai.' };
    }

    const isFav = await this.repository.isEventFavorited(userId, eventId);
    if (isFav) {
      await this.repository.removeFavorite(userId, eventId);
      return { favorited: false, message: 'Đã bỏ lưu sự kiện khỏi danh sách yêu thích.' };
    } else {
      await this.repository.addFavorite(userId, eventId);
      return { favorited: true, message: 'Đã lưu sự kiện vào danh sách yêu thích.' };
    }
  }

  /**
   * Lấy danh sách sự kiện yêu thích của người dùng
   */
  async getUserFavorites(
    userId: number,
    query: { page?: number | string; limit?: number | string }
  ): Promise<{
    events: EventRecord[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(50, Number(query.limit) || 10));
    const offset = (page - 1) * limit;

    const { events, total } = await this.repository.getUserFavorites(userId, offset, limit);
    return {
      events,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Thêm sự kiện vào lịch cá nhân
   */
  async addToUserCalendar(userId: number, eventId: number): Promise<{ added: boolean; message: string }> {
    const event = await this.repository.getPublicEventByIdOrSlug(eventId);
    if (!event) {
      throw { statusCode: 404, message: 'Sự kiện không tồn tại hoặc chưa được công khai.' };
    }

    await this.repository.addToCalendar(userId, eventId);
    return { added: true, message: 'Đã thêm sự kiện vào lịch cá nhân.' };
  }

  /**
   * Xóa sự kiện khỏi lịch cá nhân
   */
  async removeFromUserCalendar(userId: number, eventId: number): Promise<{ removed: boolean; message: string }> {
    const removed = await this.repository.removeFromCalendar(userId, eventId);
    return { removed, message: 'Đã xóa sự kiện khỏi lịch cá nhân.' };
  }

  /**
   * Lấy danh sách sự kiện cho Bản đồ
   */
  async getEventsOnMap(query: EventMapFilterQuery): Promise<EventMapItem[]> {
    const { now, today, weekend } = this.getDaNangTime();
    let timeWindow: { start: Date; end: Date } | undefined;

    if (query.time_filter === 'today') {
      timeWindow = today;
    } else if (query.time_filter === 'this_weekend') {
      timeWindow = weekend;
    } else if (query.time_filter === 'custom' && query.start_date && query.end_date) {
      const daNangOffsetMs = 7 * 60 * 60 * 1000;
      const [sY, sM, sD] = query.start_date.split('-').map(Number);
      const [eY, eM, eD] = query.end_date.split('-').map(Number);
      if (!isNaN(sY) && !isNaN(eY)) {
        timeWindow = {
          start: new Date(Date.UTC(sY, sM - 1, sD, 0, 0, 0, 0) - daNangOffsetMs),
          end: new Date(Date.UTC(eY, eM - 1, eD, 23, 59, 59, 999) - daNangOffsetMs),
        };
      }
    }

    const categories = query.category ? query.category.split(',').map((c) => c.trim().toUpperCase()) : undefined;

    let bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number } | undefined;
    if (query.min_lat !== undefined && query.max_lat !== undefined && query.min_lng !== undefined && query.max_lng !== undefined) {
      bounds = {
        minLat: Number(query.min_lat),
        maxLat: Number(query.max_lat),
        minLng: Number(query.min_lng),
        maxLng: Number(query.max_lng),
      };
    }

    return this.repository.getEventsOnMap({
      categories,
      timeWindow,
      now,
      bounds,
    });
  }

  /**
   * Tạo file iCalendar (.ics) chuẩn RFC 5545 cho sự kiện
   */
  async generateIcsFile(eventId: number): Promise<{ filename: string; content: string }> {
    const event = await this.repository.getPublicEventByIdOrSlug(eventId);
    if (!event) {
      throw { statusCode: 404, message: 'Không tìm thấy sự kiện để xuất lịch.' };
    }

    const formatIcsDate = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const nowStr = formatIcsDate(new Date());
    const startStr = event.start_time ? formatIcsDate(new Date(event.start_time)) : nowStr;
    const endStr = event.end_time ? formatIcsDate(new Date(event.end_time)) : startStr;

    const escapeIcs = (str: string): string => {
      return (str || '')
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n');
    };

    const summary = escapeIcs(event.title);
    const description = escapeIcs(
      `${event.short_description || ''}\n\nLoại vé: ${event.ticket_price_display || event.ticket_type}\nNguồn: ${event.source_url || 'Da Nang Go Smart'}`
    );
    const location = escapeIcs(`${event.location_name || ''}, ${event.address || ''}, Đà Nẵng`);
    const status = event.status === 'CANCELLED' ? 'CANCELLED' : 'CONFIRMED';

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Da Nang Go Smart//Events Module//VI',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:dananggo-event-${event.event_id}@dananggo.vn`,
      `DTSTAMP:${nowStr}`,
      `DTSTART:${startStr}`,
      `DTEND:${endStr}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location}`,
      `STATUS:${status}`,
      `URL;VALUE=URI:https://dananggo.vn/events/${event.slug}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const filename = `event-${event.slug || event.event_id}.ics`;
    return { filename, content: icsContent };
  }

  /**
   * Tạo link thêm vào Google Calendar, Outlook, Yahoo
   */
  async getCalendarLinks(eventId: number): Promise<CalendarLinksResponse> {
    const event = await this.repository.getPublicEventByIdOrSlug(eventId);
    if (!event) {
      throw { statusCode: 404, message: 'Không tìm thấy sự kiện.' };
    }

    const formatGoogleDate = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const start = event.start_time ? new Date(event.start_time) : new Date();
    const end = event.end_time ? new Date(event.end_time) : new Date(start.getTime() + 2 * 60 * 60 * 1000);
    const dates = `${formatGoogleDate(start)}/${formatGoogleDate(end)}`;

    const details = `${event.short_description || ''}\n\nThông tin vé: ${event.ticket_price_display || event.ticket_type}\nChi tiết: https://dananggo.vn/events/${event.slug}`;
    const location = `${event.location_name || ''}, ${event.address || ''}, Đà Nẵng`;

    // Google Calendar Link
    const googleUrl = new URL('https://calendar.google.com/calendar/render');
    googleUrl.searchParams.set('action', 'TEMPLATE');
    googleUrl.searchParams.set('text', event.title);
    googleUrl.searchParams.set('dates', dates);
    googleUrl.searchParams.set('details', details);
    googleUrl.searchParams.set('location', location);

    // Outlook Web Link
    const outlookUrl = new URL('https://outlook.live.com/calendar/0/deeplink/compose');
    outlookUrl.searchParams.set('path', '/calendar/action/compose');
    outlookUrl.searchParams.set('rru', 'addevent');
    outlookUrl.searchParams.set('subject', event.title);
    outlookUrl.searchParams.set('startdt', start.toISOString());
    outlookUrl.searchParams.set('enddt', end.toISOString());
    outlookUrl.searchParams.set('body', details);
    outlookUrl.searchParams.set('location', location);

    // Yahoo Calendar Link
    const yahooUrl = new URL('https://calendar.yahoo.com/');
    yahooUrl.searchParams.set('v', '60');
    yahooUrl.searchParams.set('title', event.title);
    yahooUrl.searchParams.set('st', formatGoogleDate(start));
    yahooUrl.searchParams.set('et', formatGoogleDate(end));
    yahooUrl.searchParams.set('desc', details);
    yahooUrl.searchParams.set('in_loc', location);

    return {
      event_id: event.event_id,
      title: event.title,
      google_calendar_url: googleUrl.toString(),
      outlook_web_url: outlookUrl.toString(),
      yahoo_calendar_url: yahooUrl.toString(),
      ics_download_url: `/api/events/${event.event_id}/calendar/ics`,
    };
  }

  /**
   * Lấy danh sách thông báo sự kiện của người dùng
   */
  async getUserNotifications(
    userId: number,
    query: { page?: number | string; limit?: number | string }
  ): Promise<{
    notifications: EventNotificationRecord[];
    unreadCount: number;
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(50, Number(query.limit) || 15));
    const offset = (page - 1) * limit;

    const { notifications, total, unreadCount } = await this.repository.getUserNotifications(userId, offset, limit);
    return {
      notifications,
      unreadCount,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Đánh dấu 1 thông báo đã đọc
   */
  async markNotificationAsRead(userId: number, notificationId: number): Promise<{ success: boolean; message: string }> {
    const updated = await this.repository.markNotificationAsRead(userId, notificationId);
    if (!updated) {
      throw { statusCode: 404, message: 'Thông báo không tồn tại hoặc không thuộc về người dùng.' };
    }
    return { success: true, message: 'Đã đánh dấu thông báo là đã đọc.' };
  }

  /**
   * Đánh dấu tất cả thông báo sự kiện đã đọc
   */
  async markAllNotificationsAsRead(userId: number): Promise<{ success: boolean; count: number; message: string }> {
    const count = await this.repository.markAllNotificationsAsRead(userId);
    return { success: true, count, message: 'Đã đánh dấu tất cả thông báo là đã đọc.' };
  }

  // ==================== CÁC PHƯƠNG THỨC ĐỢT 3 ====================

  /**
   * Ban tổ chức gửi đề xuất sự kiện mới (Chờ duyệt)
   */
  async submitEvent(userId: number, data: SubmitEventDTO): Promise<EventRecord> {
    const validation = validateSubmitEvent(data);
    if (!validation.valid) {
      throw { statusCode: 400, message: Object.values(validation.errors)[0], errors: validation.errors };
    }

    // Tự động tạo slug
    let baseSlug = this.createSlug(data.title);
    if (!baseSlug) baseSlug = `event-sub-${Date.now()}`;
    let uniqueSlug = baseSlug;
    let counter = 1;
    while (await this.repository.checkSlugExists(uniqueSlug)) {
      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    return this.repository.submitEvent(userId, {
      ...data,
      slug: uniqueSlug,
    });
  }

  /**
   * Ban tổ chức xem các đề xuất sự kiện của chính mình
   */
  async getUserSubmissions(
    userId: number,
    query: { page?: number | string; limit?: number | string }
  ): Promise<{
    events: EventRecord[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(50, Number(query.limit) || 10));
    const offset = (page - 1) * limit;

    const { events, total } = await this.repository.getUserSubmissions(userId, offset, limit);
    return {
      events,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Admin lấy danh sách các sự kiện đang chờ duyệt (PENDING_REVIEW)
   */
  async getPendingSubmissions(
    query: { page?: number | string; limit?: number | string }
  ): Promise<{
    events: EventRecord[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(50, Number(query.limit) || 15));
    const offset = (page - 1) * limit;

    const { events, total } = await this.repository.getPendingSubmissions(offset, limit);
    return {
      events,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Admin phê duyệt đề xuất sự kiện
   */
  async approveSubmission(id: number, adminId: number): Promise<EventRecord> {
    const approved = await this.repository.approveSubmission(id, adminId);
    if (!approved) {
      throw { statusCode: 404, message: 'Không tìm thấy sự kiện chờ duyệt với ID này hoặc sự kiện đã được xử lý.' };
    }

    if (approved.submitted_by_user_id) {
      await this.repository.createEventNotification({
        userId: approved.submitted_by_user_id,
        eventId: approved.event_id,
        title: 'Đề xuất sự kiện đã được phê duyệt!',
        message: `Sự kiện "${approved.title}" của bạn đã được Admin phê duyệt và xuất bản lên Da Nang Go Smart.`,
        type: 'SUBMISSION_APPROVED',
      }).catch((err) => console.error('Lỗi khi gửi thông báo phê duyệt:', err));
    }

    return approved;
  }

  /**
   * Admin từ chối đề xuất sự kiện kèm lý do
   */
  async rejectSubmission(id: number, adminId: number, dto: RejectEventDTO): Promise<EventRecord> {
    const validation = validateRejectEvent(dto);
    if (!validation.valid) {
      throw { statusCode: 400, message: Object.values(validation.errors)[0], errors: validation.errors };
    }

    const rejected = await this.repository.rejectSubmission(id, adminId, dto.rejection_reason.trim());
    if (!rejected) {
      throw { statusCode: 404, message: 'Không tìm thấy sự kiện chờ duyệt với ID này hoặc sự kiện đã được xử lý.' };
    }

    if (rejected.submitted_by_user_id) {
      await this.repository.createEventNotification({
        userId: rejected.submitted_by_user_id,
        eventId: rejected.event_id,
        title: 'Đề xuất sự kiện chưa được phê duyệt',
        message: `Sự kiện "${rejected.title}" của bạn chưa được duyệt. Lý do: ${dto.rejection_reason.trim()}`,
        type: 'SUBMISSION_REJECTED',
        notice: dto.rejection_reason.trim(),
      }).catch((err) => console.error('Lỗi khi gửi thông báo từ chối:', err));
    }

    return rejected;
  }

  /**
   * Gợi ý quán ăn / điểm tham quan gần sự kiện theo khoảng cách địa lý (Haversine)
   */
  async getNearbyPlaces(eventId: number, query: NearbyPlacesQuery): Promise<NearbyPlaceItem[]> {
    const event = await this.repository.getPublicEventByIdOrSlug(eventId);
    if (!event) {
      throw { statusCode: 404, message: 'Không tìm thấy sự kiện.' };
    }

    if (event.latitude === null || event.longitude === null) {
      throw { statusCode: 400, message: 'Sự kiện này chưa có tọa độ GPS để gợi ý các địa điểm xung quanh.' };
    }

    const radiusKm = Math.max(0.5, Math.min(20, Number(query.radius_km || query.radius) || 3));
    const limit = Math.max(1, Math.min(30, Number(query.limit) || 10));

    return this.repository.getNearbyPlacesForEvent(eventId, radiusKm, query.place_type, limit);
  }

}
