import { Request, Response, NextFunction } from 'express';
import { EventsService } from './events.service';

const eventsService = new EventsService();

// ==================== PUBLIC CONTROLLERS ====================

export async function getHomeEventsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const lang = typeof req.query.lang === 'string' ? req.query.lang : undefined;
    const data = await eventsService.getHomeEvents(lang);
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPublicEventsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await eventsService.getPublicEvents(req.query);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function getEventDetailHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const idOrSlug = String(req.params['idOrSlug'] ?? req.params.idOrSlug ?? '');
    const userId = res.locals.authUserId || (req as any).user?.id || (req as any).authenticatedUser?.id;
    const lang = typeof req.query.lang === 'string' ? req.query.lang : undefined;
    const data = await eventsService.getPublicEventDetail(idOrSlug, userId ? Number(userId) : undefined, lang);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

// ==================== ADMIN CONTROLLERS ====================

export async function getAdminEventsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await eventsService.getAdminEvents(req.query as any);
    res.json({ success: true, data: { items: data.events, total: data.pagination.total, page: data.pagination.page, limit: data.pagination.limit } });
  } catch (error) {
    next(error);
  }
}

export async function getAdminEventByIdHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawId = req.params['id'] ?? req.params.id ?? '';
    const id = parseInt(String(rawId), 10);
    if (isNaN(id)) {
      res.status(400).json({ message: 'ID sự kiện không hợp lệ.' });
      return;
    }
    const data = await eventsService.getAdminEventById(id);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function createEventHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await eventsService.createEvent(req.body);
    res.status(201).json({
      success: true,
      message: 'Tạo sự kiện thành công.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateEventHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawId = req.params['id'] ?? req.params.id ?? '';
    const id = parseInt(String(rawId), 10);
    if (isNaN(id)) {
      res.status(400).json({ message: 'ID sự kiện không hợp lệ.' });
      return;
    }
    const data = await eventsService.updateEvent(id, req.body);
    res.json({
      success: true,
      message: 'Cập nhật sự kiện thành công.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateEventStatusHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawId = req.params['id'] ?? req.params.id ?? '';
    const id = parseInt(String(rawId), 10);
    if (isNaN(id)) {
      res.status(400).json({ message: 'ID sự kiện không hợp lệ.' });
      return;
    }
    const data = await eventsService.updateEventStatus(id, req.body);
    res.json({
      success: true,
      message: 'Cập nhật trạng thái sự kiện thành công.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteEventHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawId = req.params['id'] ?? req.params.id ?? '';
    const id = parseInt(String(rawId), 10);
    if (isNaN(id)) {
      res.status(400).json({ message: 'ID sự kiện không hợp lệ.' });
      return;
    }
    const result = await eventsService.deleteEvent(id);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

// ==================== CÁC CONTROLLER ĐỢT 2 ====================

/**
 * POST /api/events/:id/favorite - Toggle lưu/bỏ lưu sự kiện yêu thích
 */
export async function toggleFavoriteHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = res.locals.authUserId || (req as any).user?.id || (req as any).authenticatedUser?.id;
    const rawId = req.params['id'] ?? req.params.id ?? '';
    const eventId = parseInt(String(rawId), 10);
    if (isNaN(eventId)) {
      res.status(400).json({ success: false, message: 'ID sự kiện không hợp lệ.' });
      return;
    }
    const result = await eventsService.toggleFavorite(Number(userId), eventId);
    res.json({
      success: true,
      message: result.message,
      data: { favorited: result.favorited },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/events/favorites - Danh sách sự kiện người dùng đã lưu
 */
export async function getUserFavoritesHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = res.locals.authUserId || (req as any).user?.id || (req as any).authenticatedUser?.id;
    const result = await eventsService.getUserFavorites(Number(userId), req.query);
    res.json({
      success: true,
      data: result.events,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/events/map - Danh sách sự kiện hiển thị trên bản đồ
 */
export async function getEventsOnMapHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const events = await eventsService.getEventsOnMap(req.query);
    res.json({
      success: true,
      data: events,
      count: events.length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/events/:id/calendar/ics - Tải file iCalendar (.ics)
 */
export async function exportEventIcsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawId = req.params['id'] ?? req.params.id ?? '';
    const eventId = parseInt(String(rawId), 10);
    if (isNaN(eventId)) {
      res.status(400).json({ success: false, message: 'ID sự kiện không hợp lệ.' });
      return;
    }
    const { filename, content } = await eventsService.generateIcsFile(eventId);
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(content);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/events/:id/calendar/links - Lấy link thêm nhanh vào Google / Outlook / Yahoo Calendar
 */
export async function getCalendarLinksHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawId = req.params['id'] ?? req.params.id ?? '';
    const eventId = parseInt(String(rawId), 10);
    if (isNaN(eventId)) {
      res.status(400).json({ success: false, message: 'ID sự kiện không hợp lệ.' });
      return;
    }
    const data = await eventsService.getCalendarLinks(eventId);
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/events/:id/calendar - Đánh dấu thêm vào lịch cá nhân
 */
export async function addToUserCalendarHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = res.locals.authUserId || (req as any).user?.id || (req as any).authenticatedUser?.id;
    const rawId = req.params['id'] ?? req.params.id ?? '';
    const eventId = parseInt(String(rawId), 10);
    if (isNaN(eventId)) {
      res.status(400).json({ success: false, message: 'ID sự kiện không hợp lệ.' });
      return;
    }
    const result = await eventsService.addToUserCalendar(Number(userId), eventId);
    res.json({
      success: true,
      message: result.message,
      data: { added: result.added },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/events/:id/calendar - Bỏ khỏi lịch cá nhân
 */
export async function removeFromUserCalendarHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = res.locals.authUserId || (req as any).user?.id || (req as any).authenticatedUser?.id;
    const rawId = req.params['id'] ?? req.params.id ?? '';
    const eventId = parseInt(String(rawId), 10);
    if (isNaN(eventId)) {
      res.status(400).json({ success: false, message: 'ID sự kiện không hợp lệ.' });
      return;
    }
    const result = await eventsService.removeFromUserCalendar(Number(userId), eventId);
    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/events/notifications - Danh sách thông báo biến động sự kiện
 */
export async function getUserNotificationsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = res.locals.authUserId || (req as any).user?.id || (req as any).authenticatedUser?.id;
    const result = await eventsService.getUserNotifications(Number(userId), req.query);
    res.json({
      success: true,
      data: result.notifications,
      unread_count: result.unreadCount,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/events/notifications/:id/read - Đánh dấu 1 thông báo đã đọc
 */
export async function markNotificationReadHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = res.locals.authUserId || (req as any).user?.id || (req as any).authenticatedUser?.id;
    const rawId = req.params['id'] ?? req.params.id ?? '';
    const notificationId = parseInt(String(rawId), 10);
    if (isNaN(notificationId)) {
      res.status(400).json({ success: false, message: 'ID thông báo không hợp lệ.' });
      return;
    }
    const result = await eventsService.markNotificationAsRead(Number(userId), notificationId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/events/notifications/read-all - Đánh dấu tất cả thông báo đã đọc
 */
export async function markAllNotificationsReadHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = res.locals.authUserId || (req as any).user?.id || (req as any).authenticatedUser?.id;
    const result = await eventsService.markAllNotificationsAsRead(Number(userId));
    res.json(result);
  } catch (error) {
    next(error);
  }
}

// ==================== CÁC CONTROLLER ĐỢT 3 ====================

/**
 * POST /api/events/submissions - Ban tổ chức gửi đề xuất sự kiện
 */
export async function submitEventHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = res.locals.authUserId || (req as any).user?.id || (req as any).authenticatedUser?.id;
    const data = await eventsService.submitEvent(Number(userId), req.body);
    res.status(201).json({
      success: true,
      message: 'Gửi đề xuất sự kiện thành công. Sự kiện đang chờ Ban quản trị xét duyệt.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/events/my-submissions - Ban tổ chức xem danh sách sự kiện mình đã gửi
 */
export async function getUserSubmissionsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = res.locals.authUserId || (req as any).user?.id || (req as any).authenticatedUser?.id;
    const result = await eventsService.getUserSubmissions(Number(userId), req.query);
    res.json({
      success: true,
      data: result.events,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/events/pending - Admin lấy danh sách sự kiện chờ duyệt
 */
export async function getPendingSubmissionsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await eventsService.getPendingSubmissions(req.query);
    res.json({
      success: true,
      data: result.events,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/events/:id/approve - Admin phê duyệt đề xuất sự kiện
 */
export async function approveSubmissionHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const adminId = res.locals.authUserId || (req as any).user?.id || (req as any).authenticatedUser?.id;
    const rawId = req.params['id'] ?? req.params.id ?? '';
    const id = parseInt(String(rawId), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'ID sự kiện không hợp lệ.' });
      return;
    }
    const data = await eventsService.approveSubmission(id, Number(adminId));
    res.json({
      success: true,
      message: 'Phê duyệt và xuất bản sự kiện thành công.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/events/:id/reject - Admin từ chối đề xuất sự kiện
 */
export async function rejectSubmissionHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const adminId = res.locals.authUserId || (req as any).user?.id || (req as any).authenticatedUser?.id;
    const rawId = req.params['id'] ?? req.params.id ?? '';
    const id = parseInt(String(rawId), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'ID sự kiện không hợp lệ.' });
      return;
    }
    const data = await eventsService.rejectSubmission(id, Number(adminId), req.body);
    res.json({
      success: true,
      message: 'Đã từ chối đề xuất sự kiện.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/events/:id/nearby-places - Gợi ý địa điểm tham quan / ăn uống gần sự kiện
 */
export async function getNearbyPlacesHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawId = req.params['id'] ?? req.params.id ?? '';
    const eventId = parseInt(String(rawId), 10);
    if (isNaN(eventId)) {
      res.status(400).json({ success: false, message: 'ID sự kiện không hợp lệ.' });
      return;
    }
    const places = await eventsService.getNearbyPlaces(eventId, req.query as any);
    res.json({
      success: true,
      data: places,
      count: places.length,
    });
  } catch (error) {
    next(error);
  }
}
