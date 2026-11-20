import { getPool, sql } from '../../config/db';
import {
  EventRecord,
  EventDetailResponse,
  CreateEventDTO,
  UpdateEventDTO,
  EventMapItem,
  EventNotificationRecord,
  SubmitEventDTO,
  NearbyPlaceItem,
} from './events.types';

export class EventsRepository {
  /**
   * Lấy sự kiện cho trang chủ:
   * Ưu tiên các sự kiện cuối tuần; nếu không có sự kiện cuối tuần thì lấy sự kiện sắp diễn ra.
   */
  async getHomeEvents(weekendWindow: { start: Date; end: Date }, now: Date): Promise<{ title: string; is_weekend: boolean; events: EventRecord[] }> {
    const pool = getPool();

    // 1. Tìm sự kiện diễn ra trong cuối tuần này
    const weekendQuery = `
      SELECT TOP 4 e.*
      FROM dbo.events e
      WHERE e.status IN ('PUBLISHED', 'RESCHEDULED', 'POSTPONED')
        AND e.start_time <= @weekendEnd
        AND e.end_time >= @weekendStart
      ORDER BY e.is_featured DESC, e.start_time ASC
    `;

    const weekendResult = await pool.request()
      .input('weekendStart', sql.DateTime2, weekendWindow.start)
      .input('weekendEnd', sql.DateTime2, weekendWindow.end)
      .query<EventRecord>(weekendQuery);

    if (weekendResult.recordset.length > 0) {
      return {
        title: 'Cuối tuần này ở Đà Nẵng',
        is_weekend: true,
        events: weekendResult.recordset,
      };
    }

    // 2. Fallback: Lấy các sự kiện sắp diễn ra
    const upcomingQuery = `
      SELECT TOP 4 e.*
      FROM dbo.events e
      WHERE e.status IN ('PUBLISHED', 'RESCHEDULED', 'POSTPONED')
        AND e.end_time >= @now
      ORDER BY e.is_featured DESC, e.start_time ASC
    `;

    const upcomingResult = await pool.request()
      .input('now', sql.DateTime2, now)
      .query<EventRecord>(upcomingQuery);

    return {
      title: 'Sắp diễn ra ở Đà Nẵng',
      is_weekend: false,
      events: upcomingResult.recordset,
    };
  }

  /**
   * Lấy danh sách sự kiện công khai (kèm lọc, tìm kiếm và phân trang).
   * Không bao gồm DRAFT và CANCELLED.
   */
  async getPublicEvents(params: {
    q?: string;
    categories?: string[];
    districts?: string[];
    ticketType?: string;
    timeWindow?: { start: Date; end: Date };
    now: Date;
    offset: number;
    limit: number;
  }): Promise<{ events: EventRecord[]; total: number }> {
    const pool = getPool();
    const req = pool.request();

    const whereClauses: string[] = ["e.status IN ('PUBLISHED', 'RESCHEDULED', 'POSTPONED')"];

    req.input('now', sql.DateTime2, params.now);

    // Tìm kiếm từ khóa
    if (params.q && params.q.trim().length > 0) {
      req.input('q', sql.NVarChar(200), `%${params.q.trim()}%`);
      whereClauses.push('(e.title LIKE @q OR e.location_name LIKE @q OR e.address LIKE @q OR e.short_description LIKE @q)');
    }

    // Lọc theo loại sự kiện
    if (params.categories && params.categories.length > 0) {
      const catPlaceholders = params.categories.map((cat, idx) => {
        const paramName = `cat_${idx}`;
        req.input(paramName, sql.VarChar(50), cat);
        return `@${paramName}`;
      });
      whereClauses.push(`e.category IN (${catPlaceholders.join(',')})`);
    }

    // Lọc theo khu vực (quận/huyện)
    if (params.districts && params.districts.length > 0) {
      const distPlaceholders = params.districts.map((dist, idx) => {
        const paramName = `dist_${idx}`;
        req.input(paramName, sql.NVarChar(100), dist);
        return `@${paramName}`;
      });
      whereClauses.push(`e.district IN (${distPlaceholders.join(',')})`);
    }

    // Lọc theo vé
    if (params.ticketType) {
      const typeUpper = params.ticketType.toUpperCase();
      if (typeUpper === 'FREE') {
        whereClauses.push("e.ticket_type IN ('FREE_OPEN', 'FREE_REGISTRATION')");
      } else if (typeUpper === 'PAID') {
        whereClauses.push("e.ticket_type = 'PAID'");
      } else if (typeUpper === 'UNANNOUNCED') {
        whereClauses.push("e.ticket_type = 'UNANNOUNCED'");
      }
    }

    // Lọc theo khoảng thời gian
    if (params.timeWindow) {
      req.input('windowStart', sql.DateTime2, params.timeWindow.start);
      req.input('windowEnd', sql.DateTime2, params.timeWindow.end);
      // Sự kiện xuất hiện nếu còn ít nhất 1 phần thời gian giao thoa với khoảng lọc
      whereClauses.push('e.start_time <= @windowEnd AND e.end_time >= @windowStart');
    } else {
      // Mặc định: chỉ hiển thị sự kiện chưa kết thúc
      whereClauses.push('e.end_time >= @now');
    }

    const whereSql = whereClauses.join(' AND ');

    // Đếm tổng số bản ghi
    const countQuery = `SELECT COUNT(*) AS total FROM dbo.events e WHERE ${whereSql}`;
    const countResult = await req.query<{ total: number }>(countQuery);
    const total = countResult.recordset[0]?.total || 0;

    // Lấy dữ liệu với phân trang
    req.input('offset', sql.Int, params.offset);
    req.input('limit', sql.Int, params.limit);

    // Thứ tự sắp xếp: Đang diễn ra xếp trước, sau đó tới sắp diễn ra theo start_time gần nhất
    const listQuery = `
      SELECT e.*
      FROM dbo.events e
      WHERE ${whereSql}
      ORDER BY 
        CASE WHEN e.start_time <= @now AND e.end_time >= @now THEN 0 ELSE 1 END ASC,
        e.start_time ASC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `;

    const listResult = await req.query<EventRecord>(listQuery);

    return {
      events: listResult.recordset,
      total,
    };
  }

  /**
   * Lấy chi tiết sự kiện theo ID hoặc Slug (Công khai).
   * Không hiển thị DRAFT cho người dùng thông thường, nhưng hiển thị CANCELLED để xem thông báo.
   */
  async getPublicEventByIdOrSlug(idOrSlug: string | number, userId?: number): Promise<EventDetailResponse | null> {
    const pool = getPool();
    const req = pool.request();

    let whereClause = '';
    if (typeof idOrSlug === 'number' || !isNaN(Number(idOrSlug))) {
      req.input('eventId', sql.Int, Number(idOrSlug));
      whereClause = 'e.event_id = @eventId';
    } else {
      req.input('slug', sql.VarChar(230), idOrSlug);
      whereClause = 'e.slug = @slug';
    }

    const query = `
      SELECT 
        e.*,
        p.name AS place_name,
        p.place_type,
        p.address AS place_address,
        p.avg_rating AS place_avg_rating,
        p.promo_label AS place_promo
      FROM dbo.events e
      LEFT JOIN dbo.places p ON p.place_id = e.place_id
      WHERE ${whereClause} AND e.status != 'DRAFT'
    `;

    const result = await req.query<any>(query);
    if (result.recordset.length === 0) return null;

    const row = result.recordset[0];

    let isFavorite = false;
    let isInCalendar = false;

    if (userId) {
      try {
        const favCheck = await pool.request()
          .input('f_userId', sql.Int, userId)
          .input('f_evId', sql.Int, row.event_id)
          .query('SELECT 1 FROM dbo.event_favorites WHERE user_id = @f_userId AND event_id = @f_evId');
        isFavorite = favCheck.recordset.length > 0;

        const calCheck = await pool.request()
          .input('c_userId', sql.Int, userId)
          .input('c_evId', sql.Int, row.event_id)
          .query('SELECT 1 FROM dbo.event_user_calendar WHERE user_id = @c_userId AND event_id = @c_evId');
        isInCalendar = calCheck.recordset.length > 0;
      } catch {
        // Ignored if phase 2 tables not yet migrated
      }
    }

    const event: EventDetailResponse = {
      ...row,
      place: row.place_id ? {
        place_id: row.place_id,
        name: row.place_name,
        place_type: row.place_type,
        address: row.place_address,
        avg_rating: row.place_avg_rating,
      } : null,
      is_favorite: isFavorite,
      is_in_calendar: isInCalendar,
    };

    return event;
  }

  // ==================== CÁC PHƯƠNG THỨC ADMIN ====================

  /**
   * Lấy danh sách sự kiện cho Quản trị viên (Xem được cả DRAFT, CANCELLED).
   */
  async getAdminEvents(params: {
    q?: string;
    status?: string;
    category?: string;
    offset: number;
    limit: number;
  }): Promise<{ events: EventRecord[]; total: number }> {
    const pool = getPool();
    const req = pool.request();

    const whereClauses: string[] = ['1=1'];

    if (params.q && params.q.trim().length > 0) {
      req.input('q', sql.NVarChar(200), `%${params.q.trim()}%`);
      whereClauses.push('(e.title LIKE @q OR e.location_name LIKE @q OR e.address LIKE @q)');
    }

    if (params.status && params.status !== 'ALL') {
      req.input('status', sql.VarChar(30), params.status);
      whereClauses.push('e.status = @status');
    }

    if (params.category && params.category !== 'ALL') {
      req.input('category', sql.VarChar(50), params.category);
      whereClauses.push('e.category = @category');
    }

    const whereSql = whereClauses.join(' AND ');

    const countQuery = `SELECT COUNT(*) AS total FROM dbo.events e WHERE ${whereSql}`;
    const countResult = await req.query<{ total: number }>(countQuery);
    const total = countResult.recordset[0]?.total || 0;

    req.input('offset', sql.Int, params.offset);
    req.input('limit', sql.Int, params.limit);

    const listQuery = `
      SELECT e.*
      FROM dbo.events e
      WHERE ${whereSql}
      ORDER BY e.updated_at DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `;

    const listResult = await req.query<EventRecord>(listQuery);

    return {
      events: listResult.recordset,
      total,
    };
  }

  /**
   * Lấy chi tiết sự kiện cho Quản trị viên theo ID.
   */
  async getAdminEventById(id: number): Promise<EventRecord | null> {
    const pool = getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query<EventRecord>('SELECT * FROM dbo.events WHERE event_id = @id');

    return result.recordset[0] || null;
  }

  /**
   * Tạo sự kiện mới.
   */
  async createEvent(data: CreateEventDTO & { slug: string }): Promise<EventRecord> {
    const pool = getPool();
    const query = `
      INSERT INTO dbo.events (
        title, slug, cover_image, short_description, description,
        category, start_time, end_time, is_all_day,
        place_id, location_name, address, district, latitude, longitude,
        ticket_type, ticket_price_display, ticket_url, registration_deadline,
        organizer_name, organizer_contact, source_url,
        is_featured, status, reschedule_notice,
        title_en, short_description_en, description_en, location_name_en, reschedule_notice_en,
        submitted_by_user_id,
        created_at, updated_at
      )
      OUTPUT INSERTED.*
      VALUES (
        @title, @slug, @cover_image, @short_description, @description,
        @category, @start_time, @end_time, @is_all_day,
        @place_id, @location_name, @address, @district, @latitude, @longitude,
        @ticket_type, @ticket_price_display, @ticket_url, @registration_deadline,
        @organizer_name, @organizer_contact, @source_url,
        @is_featured, @status, @reschedule_notice,
        @title_en, @short_description_en, @description_en, @location_name_en, @reschedule_notice_en,
        @submitted_by_user_id,
        SYSUTCDATETIME(), SYSUTCDATETIME()
      )
    `;

    const req = pool.request()
      .input('title', sql.NVarChar(200), data.title)
      .input('slug', sql.VarChar(230), data.slug)
      .input('cover_image', sql.NVarChar(500), data.cover_image ?? null)
      .input('short_description', sql.NVarChar(500), data.short_description ?? null)
      .input('description', sql.NVarChar(sql.MAX), data.description || null)
      .input('category', sql.VarChar(50), data.category)
      .input('start_time', sql.DateTime2, data.start_time ? new Date(data.start_time) : null)
      .input('end_time', sql.DateTime2, data.end_time ? new Date(data.end_time) : null)
      .input('is_all_day', sql.Bit, data.is_all_day ? 1 : 0)
      .input('place_id', sql.Int, data.place_id || null)
      .input('location_name', sql.NVarChar(200), data.location_name ?? null)
      .input('address', sql.NVarChar(300), data.address ?? null)
      .input('district', sql.NVarChar(100), data.district ?? null)
      .input('latitude', sql.Decimal(9, 6), data.latitude || null)
      .input('longitude', sql.Decimal(9, 6), data.longitude || null)
      .input('ticket_type', sql.VarChar(30), data.ticket_type ?? null)
      .input('ticket_price_display', sql.NVarChar(100), data.ticket_price_display || null)
      .input('ticket_url', sql.NVarChar(500), data.ticket_url || null)
      .input('registration_deadline', sql.DateTime2, data.registration_deadline ? new Date(data.registration_deadline) : null)
      .input('organizer_name', sql.NVarChar(200), data.organizer_name || null)
      .input('organizer_contact', sql.NVarChar(255), data.organizer_contact || null)
      .input('source_url', sql.NVarChar(500), data.source_url || null)
      .input('is_featured', sql.Bit, data.is_featured ? 1 : 0)
      .input('status', sql.VarChar(30), data.status || 'DRAFT')
      .input('reschedule_notice', sql.NVarChar(500), data.reschedule_notice || null)
      .input('title_en', sql.NVarChar(200), data.title_en ?? null)
      .input('short_description_en', sql.NVarChar(500), data.short_description_en ?? null)
      .input('description_en', sql.NVarChar(sql.MAX), data.description_en ?? null)
      .input('location_name_en', sql.NVarChar(200), data.location_name_en ?? null)
      .input('reschedule_notice_en', sql.NVarChar(500), data.reschedule_notice_en ?? null)
      .input('submitted_by_user_id', sql.Int, data.submitted_by_user_id ?? null);

    const result = await req.query<EventRecord>(query);
    return result.recordset[0];
  }

  /**
   * Cập nhật toàn bộ thông tin sự kiện.
   */
  async updateEvent(id: number, data: UpdateEventDTO): Promise<EventRecord | null> {
    const pool = getPool();
    const query = `
      UPDATE dbo.events
      SET
        title = COALESCE(@title, title),
        cover_image = COALESCE(@cover_image, cover_image),
        short_description = COALESCE(@short_description, short_description),
        description = @description,
        category = COALESCE(@category, category),
        start_time = COALESCE(@start_time, start_time),
        end_time = COALESCE(@end_time, end_time),
        is_all_day = COALESCE(@is_all_day, is_all_day),
        place_id = @place_id,
        location_name = COALESCE(@location_name, location_name),
        address = COALESCE(@address, address),
        district = COALESCE(@district, district),
        latitude = @latitude,
        longitude = @longitude,
        ticket_type = COALESCE(@ticket_type, ticket_type),
        ticket_price_display = @ticket_price_display,
        ticket_url = @ticket_url,
        registration_deadline = @registration_deadline,
        organizer_name = @organizer_name,
        organizer_contact = @organizer_contact,
        source_url = @source_url,
        is_featured = COALESCE(@is_featured, is_featured),
        status = COALESCE(@status, status),
        reschedule_notice = @reschedule_notice,
        title_en = COALESCE(@title_en, title_en),
        short_description_en = COALESCE(@short_description_en, short_description_en),
        description_en = @description_en,
        location_name_en = COALESCE(@location_name_en, location_name_en),
        reschedule_notice_en = @reschedule_notice_en,
        updated_at = SYSUTCDATETIME()
      OUTPUT INSERTED.*
      WHERE event_id = @id
    `;

    const req = pool.request()
      .input('id', sql.Int, id)
      .input('title', sql.NVarChar(200), data.title ?? null)
      .input('cover_image', sql.NVarChar(500), data.cover_image ?? null)
      .input('short_description', sql.NVarChar(500), data.short_description ?? null)
      .input('description', sql.NVarChar(sql.MAX), data.description ?? null)
      .input('category', sql.VarChar(50), data.category ?? null)
      .input('start_time', sql.DateTime2, data.start_time ? new Date(data.start_time) : null)
      .input('end_time', sql.DateTime2, data.end_time ? new Date(data.end_time) : null)
      .input('is_all_day', sql.Bit, data.is_all_day !== undefined ? (data.is_all_day ? 1 : 0) : null)
      .input('place_id', sql.Int, data.place_id !== undefined ? data.place_id : null)
      .input('location_name', sql.NVarChar(200), data.location_name ?? null)
      .input('address', sql.NVarChar(300), data.address ?? null)
      .input('district', sql.NVarChar(100), data.district ?? null)
      .input('latitude', sql.Decimal(9, 6), data.latitude !== undefined ? data.latitude : null)
      .input('longitude', sql.Decimal(9, 6), data.longitude !== undefined ? data.longitude : null)
      .input('ticket_type', sql.VarChar(30), data.ticket_type ?? null)
      .input('ticket_price_display', sql.NVarChar(100), data.ticket_price_display ?? null)
      .input('ticket_url', sql.NVarChar(500), data.ticket_url ?? null)
      .input('registration_deadline', sql.DateTime2, data.registration_deadline ? new Date(data.registration_deadline) : null)
      .input('organizer_name', sql.NVarChar(200), data.organizer_name ?? null)
      .input('organizer_contact', sql.NVarChar(255), data.organizer_contact ?? null)
      .input('source_url', sql.NVarChar(500), data.source_url ?? null)
      .input('is_featured', sql.Bit, data.is_featured !== undefined ? (data.is_featured ? 1 : 0) : null)
      .input('status', sql.VarChar(30), data.status ?? null)
      .input('reschedule_notice', sql.NVarChar(500), data.reschedule_notice ?? null)
      .input('title_en', sql.NVarChar(200), data.title_en ?? null)
      .input('short_description_en', sql.NVarChar(500), data.short_description_en ?? null)
      .input('description_en', sql.NVarChar(sql.MAX), data.description_en ?? null)
      .input('location_name_en', sql.NVarChar(200), data.location_name_en ?? null)
      .input('reschedule_notice_en', sql.NVarChar(500), data.reschedule_notice_en ?? null);

    const result = await req.query<EventRecord>(query);
    return result.recordset[0] || null;
  }

  /**
   * Cập nhật trạng thái sự kiện nhanh (Đổi lịch, Hủy, Đăng).
   */
  async updateEventStatus(
    id: number,
    status: string,
    rescheduleNotice?: string,
    startTime?: string,
    endTime?: string
  ): Promise<EventRecord | null> {
    const pool = getPool();
    const req = pool.request()
      .input('id', sql.Int, id)
      .input('status', sql.VarChar(30), status)
      .input('notice', sql.NVarChar(500), rescheduleNotice || null);

    let extraSet = '';
    if (startTime) {
      req.input('startTime', sql.DateTime2, new Date(startTime));
      extraSet += ', start_time = @startTime';
    }
    if (endTime) {
      req.input('endTime', sql.DateTime2, new Date(endTime));
      extraSet += ', end_time = @endTime';
    }

    const query = `
      UPDATE dbo.events
      SET
        status = @status,
        reschedule_notice = CASE WHEN @status = 'PUBLISHED' THEN NULL ELSE @notice END,
        updated_at = SYSUTCDATETIME()
        ${extraSet}
      OUTPUT INSERTED.*
      WHERE event_id = @id AND status <> 'CANCELLED'
    `;

    const result = await req.query<EventRecord>(query);
    return result.recordset[0] || null;
  }

  /**
   * Xóa sự kiện.
   */
  async deleteEvent(id: number): Promise<boolean> {
    const pool = getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM dbo.events WHERE event_id = @id');
    return (result.rowsAffected[0] || 0) > 0;
  }

  /**
   * Kiểm tra trùng slug.
   */
  async checkSlugExists(slug: string, excludeId?: number): Promise<boolean> {
    const pool = getPool();
    const req = pool.request().input('slug', sql.VarChar(230), slug);
    let query = 'SELECT COUNT(*) AS count FROM dbo.events WHERE slug = @slug';
    if (excludeId) {
      req.input('excludeId', sql.Int, excludeId);
      query += ' AND event_id != @excludeId';
    }
    const result = await req.query<{ count: number }>(query);
    return (result.recordset[0]?.count || 0) > 0;
  }

  // ==================== CÁC PHƯƠNG THỨC ĐỢT 2 ====================

  /**
   * Thêm sự kiện vào danh sách yêu thích
   */
  async addFavorite(userId: number, eventId: number): Promise<boolean> {
    const pool = getPool();
    const query = `
      IF NOT EXISTS (SELECT 1 FROM dbo.event_favorites WHERE user_id = @userId AND event_id = @eventId)
      BEGIN
        INSERT INTO dbo.event_favorites (user_id, event_id, created_at)
        VALUES (@userId, @eventId, SYSUTCDATETIME());
      END
    `;
    await pool.request()
      .input('userId', sql.Int, userId)
      .input('eventId', sql.Int, eventId)
      .query(query);
    return true;
  }

  /**
   * Xóa sự kiện khỏi danh sách yêu thích
   */
  async removeFavorite(userId: number, eventId: number): Promise<boolean> {
    const pool = getPool();
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .input('eventId', sql.Int, eventId)
      .query('DELETE FROM dbo.event_favorites WHERE user_id = @userId AND event_id = @eventId');
    return (result.rowsAffected[0] || 0) > 0;
  }

  /**
   * Kiểm tra đã yêu thích hay chưa
   */
  async isEventFavorited(userId: number, eventId: number): Promise<boolean> {
    const pool = getPool();
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .input('eventId', sql.Int, eventId)
      .query('SELECT 1 FROM dbo.event_favorites WHERE user_id = @userId AND event_id = @eventId');
    return result.recordset.length > 0;
  }

  /**
   * Lấy danh sách sự kiện yêu thích của người dùng
   */
  async getUserFavorites(userId: number, offset: number, limit: number): Promise<{ events: EventRecord[]; total: number }> {
    const pool = getPool();
    const countRes = await pool.request()
      .input('userId', sql.Int, userId)
      .query<{ total: number }>(`
        SELECT COUNT(*) AS total
        FROM dbo.event_favorites ef
        INNER JOIN dbo.events e ON e.event_id = ef.event_id
        WHERE ef.user_id = @userId AND e.status != 'DRAFT'
      `);
    const total = countRes.recordset[0]?.total || 0;

    const listRes = await pool.request()
      .input('userId', sql.Int, userId)
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, limit)
      .query<EventRecord>(`
        SELECT e.*
        FROM dbo.event_favorites ef
        INNER JOIN dbo.events e ON e.event_id = ef.event_id
        WHERE ef.user_id = @userId AND e.status != 'DRAFT'
        ORDER BY ef.created_at DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);

    return { events: listRes.recordset, total };
  }

  /**
   * Thêm sự kiện vào lịch cá nhân (theo dõi)
   */
  async addToCalendar(userId: number, eventId: number): Promise<boolean> {
    const pool = getPool();
    const query = `
      IF NOT EXISTS (SELECT 1 FROM dbo.event_user_calendar WHERE user_id = @userId AND event_id = @eventId)
      BEGIN
        INSERT INTO dbo.event_user_calendar (user_id, event_id, added_at)
        VALUES (@userId, @eventId, SYSUTCDATETIME());
      END
    `;
    await pool.request()
      .input('userId', sql.Int, userId)
      .input('eventId', sql.Int, eventId)
      .query(query);
    return true;
  }

  /**
   * Xóa khỏi lịch cá nhân
   */
  async removeFromCalendar(userId: number, eventId: number): Promise<boolean> {
    const pool = getPool();
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .input('eventId', sql.Int, eventId)
      .query('DELETE FROM dbo.event_user_calendar WHERE user_id = @userId AND event_id = @eventId');
    return (result.rowsAffected[0] || 0) > 0;
  }

  /**
   * Lấy danh sách sự kiện trên Bản đồ (có tọa độ lat/lng và status công khai)
   */
  async getEventsOnMap(params: {
    categories?: string[];
    timeWindow?: { start: Date; end: Date };
    now: Date;
    bounds?: { minLat: number; maxLat: number; minLng: number; maxLng: number };
  }): Promise<EventMapItem[]> {
    const pool = getPool();
    const req = pool.request();

    const whereClauses: string[] = [
      "e.status IN ('PUBLISHED', 'RESCHEDULED', 'POSTPONED')",
      "e.latitude IS NOT NULL",
      "e.longitude IS NOT NULL"
    ];

    req.input('now', sql.DateTime2, params.now);

    if (params.categories && params.categories.length > 0) {
      const catPlaceholders = params.categories.map((cat, idx) => {
        const paramName = `m_cat_${idx}`;
        req.input(paramName, sql.VarChar(50), cat);
        return `@${paramName}`;
      });
      whereClauses.push(`e.category IN (${catPlaceholders.join(',')})`);
    }

    if (params.timeWindow) {
      req.input('m_windowStart', sql.DateTime2, params.timeWindow.start);
      req.input('m_windowEnd', sql.DateTime2, params.timeWindow.end);
      whereClauses.push('e.start_time <= @m_windowEnd AND e.end_time >= @m_windowStart');
    } else {
      whereClauses.push('e.end_time >= @now');
    }

    if (params.bounds) {
      req.input('minLat', sql.Decimal(9, 6), params.bounds.minLat);
      req.input('maxLat', sql.Decimal(9, 6), params.bounds.maxLat);
      req.input('minLng', sql.Decimal(9, 6), params.bounds.minLng);
      req.input('maxLng', sql.Decimal(9, 6), params.bounds.maxLng);
      whereClauses.push('e.latitude BETWEEN @minLat AND @maxLat AND e.longitude BETWEEN @minLng AND @maxLng');
    }

    const whereSql = whereClauses.join(' AND ');
    const query = `
      SELECT 
        e.event_id,
        e.title,
        e.slug,
        e.category,
        e.cover_image,
        e.latitude,
        e.longitude,
        e.location_name,
        e.address,
        e.district,
        e.start_time,
        e.end_time,
        e.ticket_type,
        e.ticket_price_display,
        e.status,
        e.is_featured
      FROM dbo.events e
      WHERE ${whereSql}
      ORDER BY e.start_time ASC
    `;

    const result = await req.query<EventMapItem>(query);
    return result.recordset;
  }

  /**
   * Lấy danh sách ID người dùng đã lưu (yêu thích hoặc thêm lịch) sự kiện này
   */
  async getUsersInterestedInEvent(eventId: number): Promise<number[]> {
    const pool = getPool();
    const query = `
      SELECT DISTINCT user_id FROM (
        SELECT user_id FROM dbo.event_favorites WHERE event_id = @eventId
        UNION
        SELECT user_id FROM dbo.event_user_calendar WHERE event_id = @eventId
      ) u
    `;
    const result = await pool.request()
      .input('eventId', sql.Int, eventId)
      .query<{ user_id: number }>(query);
    return result.recordset.map((r) => r.user_id);
  }

  /**
   * Tạo thông báo biến động sự kiện cho người dùng
   */
  async createEventNotification(data: {
    userId: number;
    eventId: number;
    title: string;
    message: string;
    type: string;
    notice?: string | null;
  }): Promise<void> {
    const pool = getPool();
    const query = `
      INSERT INTO dbo.event_notifications (user_id, event_id, title, message, type, notice, is_read, created_at)
      VALUES (@userId, @eventId, @title, @message, @type, @notice, 0, SYSUTCDATETIME())
    `;
    await pool.request()
      .input('userId', sql.Int, data.userId)
      .input('eventId', sql.Int, data.eventId)
      .input('title', sql.NVarChar(200), data.title)
      .input('message', sql.NVarChar(500), data.message)
      .input('type', sql.VarChar(30), data.type)
      .input('notice', sql.NVarChar(500), data.notice || null)
      .query(query);
  }

  /**
   * Lấy danh sách thông báo sự kiện của người dùng
   */
  async getUserNotifications(userId: number, offset: number, limit: number): Promise<{
    notifications: EventNotificationRecord[];
    total: number;
    unreadCount: number;
  }> {
    const pool = getPool();
    const unreadRes = await pool.request()
      .input('userId', sql.Int, userId)
      .query<{ unread: number }>('SELECT COUNT(*) AS unread FROM dbo.event_notifications WHERE user_id = @userId AND is_read = 0');
    const unreadCount = unreadRes.recordset[0]?.unread || 0;

    const countRes = await pool.request()
      .input('userId', sql.Int, userId)
      .query<{ total: number }>('SELECT COUNT(*) AS total FROM dbo.event_notifications WHERE user_id = @userId');
    const total = countRes.recordset[0]?.total || 0;

    const listRes = await pool.request()
      .input('userId', sql.Int, userId)
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, limit)
      .query<EventNotificationRecord>(`
        SELECT 
          en.*,
          e.title AS event_title,
          e.slug AS event_slug
        FROM dbo.event_notifications en
        LEFT JOIN dbo.events e ON e.event_id = en.event_id
        WHERE en.user_id = @userId
        ORDER BY en.created_at DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);

    return {
      notifications: listRes.recordset,
      total,
      unreadCount,
    };
  }

  /**
   * Đánh dấu 1 thông báo đã đọc
   */
  async markNotificationAsRead(userId: number, notificationId: number): Promise<boolean> {
    const pool = getPool();
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .input('notificationId', sql.Int, notificationId)
      .query('UPDATE dbo.event_notifications SET is_read = 1 WHERE notification_id = @notificationId AND user_id = @userId');
    return (result.rowsAffected[0] || 0) > 0;
  }

  /**
   * Đánh dấu tất cả thông báo của người dùng đã đọc
   */
  async markAllNotificationsAsRead(userId: number): Promise<number> {
    const pool = getPool();
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query('UPDATE dbo.event_notifications SET is_read = 1 WHERE user_id = @userId AND is_read = 0');
    return result.rowsAffected[0] || 0;
  }

  // ==================== CÁC PHƯƠNG THỨC ĐỢT 3 ====================

  /**
   * Ban tổ chức gửi đề xuất sự kiện chờ duyệt (PENDING_REVIEW)
   */
  async submitEvent(userId: number, data: SubmitEventDTO & { slug: string }): Promise<EventRecord> {
    const pool = getPool();
    const query = `
      INSERT INTO dbo.events (
        title, slug, cover_image, short_description, description,
        category, start_time, end_time, is_all_day,
        location_name, address, district, latitude, longitude,
        ticket_type, ticket_price_display, ticket_url, registration_deadline,
        organizer_name, organizer_contact, source_url,
        title_en, short_description_en, description_en, location_name_en,
        status, submitted_by_user_id,
        created_at, updated_at
      )
      OUTPUT INSERTED.*
      VALUES (
        @title, @slug, @cover_image, @short_description, @description,
        @category, @start_time, @end_time, @is_all_day,
        @location_name, @address, @district, @latitude, @longitude,
        @ticket_type, @ticket_price_display, @ticket_url, @registration_deadline,
        @organizer_name, @organizer_contact, @source_url,
        @title_en, @short_description_en, @description_en, @location_name_en,
        'PENDING_REVIEW', @userId,
        SYSUTCDATETIME(), SYSUTCDATETIME()
      )
    `;

    const req = pool.request()
      .input('title', sql.NVarChar(200), data.title)
      .input('slug', sql.VarChar(230), data.slug)
      .input('cover_image', sql.NVarChar(500), data.cover_image)
      .input('short_description', sql.NVarChar(500), data.short_description)
      .input('description', sql.NVarChar(sql.MAX), data.description || null)
      .input('category', sql.VarChar(50), data.category)
      .input('start_time', sql.DateTime2, new Date(data.start_time))
      .input('end_time', sql.DateTime2, new Date(data.end_time))
      .input('is_all_day', sql.Bit, data.is_all_day ? 1 : 0)
      .input('location_name', sql.NVarChar(200), data.location_name)
      .input('address', sql.NVarChar(300), data.address)
      .input('district', sql.NVarChar(100), data.district)
      .input('latitude', sql.Decimal(9, 6), data.latitude || null)
      .input('longitude', sql.Decimal(9, 6), data.longitude || null)
      .input('ticket_type', sql.VarChar(30), data.ticket_type)
      .input('ticket_price_display', sql.NVarChar(100), data.ticket_price_display || null)
      .input('ticket_url', sql.NVarChar(500), data.ticket_url || null)
      .input('registration_deadline', sql.DateTime2, data.registration_deadline ? new Date(data.registration_deadline) : null)
      .input('organizer_name', sql.NVarChar(200), data.organizer_name)
      .input('organizer_contact', sql.NVarChar(255), data.organizer_contact)
      .input('source_url', sql.NVarChar(500), data.source_url || null)
      .input('title_en', sql.NVarChar(200), data.title_en || null)
      .input('short_description_en', sql.NVarChar(500), data.short_description_en || null)
      .input('description_en', sql.NVarChar(sql.MAX), data.description_en || null)
      .input('location_name_en', sql.NVarChar(200), data.location_name_en || null)
      .input('userId', sql.Int, userId);

    const result = await req.query<EventRecord>(query);
    return result.recordset[0];
  }

  /**
   * Ban tổ chức xem danh sách sự kiện do chính mình gửi
   */
  async getUserSubmissions(userId: number, offset: number, limit: number): Promise<{ events: EventRecord[]; total: number }> {
    const pool = getPool();
    const countRes = await pool.request()
      .input('userId', sql.Int, userId)
      .query<{ total: number }>('SELECT COUNT(*) AS total FROM dbo.events WHERE submitted_by_user_id = @userId');
    const total = countRes.recordset[0]?.total || 0;

    const listRes = await pool.request()
      .input('userId', sql.Int, userId)
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, limit)
      .query<EventRecord>(`
        SELECT * FROM dbo.events
        WHERE submitted_by_user_id = @userId
        ORDER BY created_at DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);

    return { events: listRes.recordset, total };
  }

  /**
   * Admin lấy danh sách các sự kiện đang chờ duyệt (PENDING_REVIEW)
   */
  async getPendingSubmissions(offset: number, limit: number): Promise<{ events: EventRecord[]; total: number }> {
    const pool = getPool();
    const countRes = await pool.request()
      .query<{ total: number }>("SELECT COUNT(*) AS total FROM dbo.events WHERE status = 'PENDING_REVIEW'");
    const total = countRes.recordset[0]?.total || 0;

    const listRes = await pool.request()
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, limit)
      .query<EventRecord>(`
        SELECT e.*, u.email AS submitter_email, u.full_name AS submitter_name
        FROM dbo.events e
        LEFT JOIN dbo.users u ON u.user_id = e.submitted_by_user_id
        WHERE e.status = 'PENDING_REVIEW'
        ORDER BY e.created_at ASC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);

    return { events: listRes.recordset, total };
  }

  /**
   * Admin duyệt xuất bản sự kiện (Approve)
   */
  async approveSubmission(id: number, adminId: number): Promise<EventRecord | null> {
    const pool = getPool();
    const query = `
      UPDATE dbo.events
      SET
        status = 'PUBLISHED',
        reviewed_by = @adminId,
        reviewed_at = SYSUTCDATETIME(),
        rejection_reason = NULL,
        updated_at = SYSUTCDATETIME()
      OUTPUT INSERTED.*
      WHERE event_id = @id AND status = 'PENDING_REVIEW'
    `;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('adminId', sql.Int, adminId)
      .query<EventRecord>(query);
    return result.recordset[0] || null;
  }

  /**
   * Admin từ chối sự kiện (Reject)
   */
  async rejectSubmission(id: number, adminId: number, reason: string): Promise<EventRecord | null> {
    const pool = getPool();
    const query = `
      UPDATE dbo.events
      SET
        status = 'REJECTED',
        rejection_reason = @reason,
        reviewed_by = @adminId,
        reviewed_at = SYSUTCDATETIME(),
        updated_at = SYSUTCDATETIME()
      OUTPUT INSERTED.*
      WHERE event_id = @id AND status = 'PENDING_REVIEW'
    `;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('adminId', sql.Int, adminId)
      .input('reason', sql.NVarChar(500), reason)
      .query<EventRecord>(query);
    return result.recordset[0] || null;
  }

  /**
   * Gợi ý quán ăn / quán cà phê / điểm tham quan gần sự kiện theo công thức Haversine
   */
  async getNearbyPlacesForEvent(
    eventId: number,
    radiusKm: number,
    placeType?: string,
    limit: number = 5
  ): Promise<NearbyPlaceItem[]> {
    const pool = getPool();

    const evRes = await pool.request()
      .input('id', sql.Int, eventId)
      .query<{ latitude: number | null; longitude: number | null }>('SELECT latitude, longitude FROM dbo.events WHERE event_id = @id');

    const event = evRes.recordset[0];
    if (!event || event.latitude === null || event.longitude === null) {
      return [];
    }

    const evLat = Number(event.latitude);
    const evLng = Number(event.longitude);

    const req = pool.request()
      .input('evLat', sql.Float, evLat)
      .input('evLng', sql.Float, evLng)
      .input('radiusKm', sql.Float, radiusKm)
      .input('limit', sql.Int, limit);

    let typeFilter = '';
    if (placeType && placeType.trim().length > 0) {
      req.input('placeType', sql.VarChar(50), placeType.trim().toUpperCase());
      typeFilter = 'AND p.place_type = @placeType';
    }

    const query = `
      WITH PlacesWithDistance AS (
        SELECT 
          p.place_id,
          p.name,
          p.place_type,
          p.address,
          d.name AS district,
          (SELECT TOP 1 image_url FROM dbo.place_images WHERE place_id = p.place_id AND is_cover = 1) AS cover_image,
          ISNULL(CAST(p.avg_rating AS float), 0) AS avg_rating,
          CAST(p.latitude AS float) AS latitude,
          CAST(p.longitude AS float) AS longitude,
          ROUND(
            6371 * ACOS(
              CASE 
                WHEN (
                  COS(RADIANS(@evLat)) * COS(RADIANS(CAST(p.latitude AS float))) *
                  COS(RADIANS(CAST(p.longitude AS float)) - RADIANS(@evLng)) +
                  SIN(RADIANS(@evLat)) * SIN(RADIANS(CAST(p.latitude AS float)))
                ) > 1.0 THEN 1.0
                WHEN (
                  COS(RADIANS(@evLat)) * COS(RADIANS(CAST(p.latitude AS float))) *
                  COS(RADIANS(CAST(p.longitude AS float)) - RADIANS(@evLng)) +
                  SIN(RADIANS(@evLat)) * SIN(RADIANS(CAST(p.latitude AS float)))
                ) < -1.0 THEN -1.0
                ELSE (
                  COS(RADIANS(@evLat)) * COS(RADIANS(CAST(p.latitude AS float))) *
                  COS(RADIANS(CAST(p.longitude AS float)) - RADIANS(@evLng)) +
                  SIN(RADIANS(@evLat)) * SIN(RADIANS(CAST(p.latitude AS float)))
                )
              END
            ), 2
          ) AS distance_km
        FROM dbo.places p
        LEFT JOIN dbo.districts d ON d.district_id = p.district_id
        WHERE p.latitude IS NOT NULL 
          AND p.longitude IS NOT NULL
          ${typeFilter}
      )
      SELECT 
        pwd.*,
        CAST(pwd.distance_km * 1000 AS INT) AS distance_meters
      FROM PlacesWithDistance pwd
      WHERE pwd.distance_km <= @radiusKm
      ORDER BY pwd.distance_km ASC, pwd.avg_rating DESC
      OFFSET 0 ROWS FETCH NEXT @limit ROWS ONLY
    `;

    const result = await req.query<NearbyPlaceItem>(query);
    return result.recordset;
  }
}
