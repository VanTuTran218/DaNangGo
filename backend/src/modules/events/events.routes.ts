import { Router } from 'express';
import {
  getHomeEventsHandler,
  getPublicEventsHandler,
  getEventDetailHandler,
  getAdminEventsHandler,
  getAdminEventByIdHandler,
  createEventHandler,
  updateEventHandler,
  updateEventStatusHandler,
  deleteEventHandler,
  // Đợt 2: Yêu thích, Lịch cá nhân, Thông báo, Bản đồ
  toggleFavoriteHandler,
  getUserFavoritesHandler,
  getEventsOnMapHandler,
  exportEventIcsHandler,
  getCalendarLinksHandler,
  addToUserCalendarHandler,
  removeFromUserCalendarHandler,
  getUserNotificationsHandler,
  markNotificationReadHandler,
  markAllNotificationsReadHandler,
  getNearbyPlacesHandler,
} from './events.controller';
import { requireAuth, requireRole, optionalAuth } from '../../middleware/auth.middleware';

// Router dành cho người dùng công khai (Public) & Cá nhân hóa
export const eventsPublicRouter = Router();

// 1. Nhóm tĩnh và Bản đồ (Đặt trước các route tham số :idOrSlug)
// GET /api/events/home - Lấy 3-4 sự kiện cuối tuần này / sắp diễn ra cho trang chủ
eventsPublicRouter.get('/home', getHomeEventsHandler);

// GET /api/events/map - Xem các sự kiện trên bản đồ (có tọa độ lat/lng và bộ lọc)
eventsPublicRouter.get('/map', getEventsOnMapHandler);

// 2. Nhóm tính năng cá nhân người dùng (yêu cầu đăng nhập User)
// GET /api/events/favorites - Danh sách sự kiện người dùng đã lưu
eventsPublicRouter.get('/favorites', requireAuth('USER'), getUserFavoritesHandler);

// GET /api/events/notifications - Danh sách thông báo biến động sự kiện đã lưu
eventsPublicRouter.get('/notifications', requireAuth('USER'), getUserNotificationsHandler);

// PATCH /api/events/notifications/read-all - Đánh dấu đã đọc tất cả thông báo
eventsPublicRouter.patch('/notifications/read-all', requireAuth('USER'), markAllNotificationsReadHandler);

// PATCH /api/events/notifications/:id/read - Đánh dấu 1 thông báo đã đọc
eventsPublicRouter.patch('/notifications/:id/read', requireAuth('USER'), markNotificationReadHandler);


// 3. Nhóm hành động với từng sự kiện cụ thể
// POST /api/events/:id/favorite - Lưu / Bỏ lưu sự kiện yêu thích (Toggle)
eventsPublicRouter.post('/:id/favorite', requireAuth('USER'), toggleFavoriteHandler);

// POST /api/events/:id/calendar - Đánh dấu thêm vào lịch cá nhân
eventsPublicRouter.post('/:id/calendar', requireAuth('USER'), addToUserCalendarHandler);

// DELETE /api/events/:id/calendar - Bỏ khỏi lịch cá nhân
eventsPublicRouter.delete('/:id/calendar', requireAuth('USER'), removeFromUserCalendarHandler);

// GET /api/events/:id/calendar/ics - Tải file iCalendar (.ics) cho Apple/Google/Outlook Calendar
eventsPublicRouter.get('/:id/calendar/ics', exportEventIcsHandler);

// GET /api/events/:id/calendar/links - Lấy link thêm nhanh Google / Outlook / Yahoo Calendar
eventsPublicRouter.get('/:id/calendar/links', getCalendarLinksHandler);

// Đợt 3: Gợi ý điểm ăn uống / tham quan gần sự kiện theo tọa độ địa lý
// GET /api/events/:id/nearby-places - Gợi ý địa điểm lân cận trong bán kính
eventsPublicRouter.get('/:id/nearby-places', getNearbyPlacesHandler);

// GET /api/events - Danh sách sự kiện, tìm kiếm và lọc đa điều kiện
eventsPublicRouter.get('/', getPublicEventsHandler);

// GET /api/events/:idOrSlug - Chi tiết sự kiện (hỗ trợ cả slug và ID, dùng optionalAuth để biết user đã lưu chưa)
eventsPublicRouter.get('/:idOrSlug', optionalAuth('USER'), getEventDetailHandler);

// Router dành riêng cho Quản trị viên (Admin CMS)
export const eventsAdminRouter = Router();

// Bắt buộc phiên đăng nhập Admin và Role Admin
eventsAdminRouter.use(requireAuth('ADMIN'), requireRole('ADMIN'));

// GET /api/admin/events - Danh sách sự kiện quản trị (kèm phân trang, lọc status, DRAFT, CANCELLED)
eventsAdminRouter.get('/', getAdminEventsHandler);

// POST /api/admin/events - Tạo mới sự kiện (hoặc lưu nháp)
eventsAdminRouter.post('/', createEventHandler);

// GET /api/admin/events/:id - Xem chi tiết sự kiện để chỉnh sửa
eventsAdminRouter.get('/:id', getAdminEventByIdHandler);

// PUT /api/admin/events/:id - Cập nhật toàn bộ thông tin sự kiện
eventsAdminRouter.put('/:id', updateEventHandler);

// PATCH /api/admin/events/:id/status - Cập nhật nhanh trạng thái (Dời lịch, Hủy, Xuất bản)
eventsAdminRouter.patch('/:id/status', updateEventStatusHandler);

// DELETE /api/admin/events/:id - Xóa sự kiện
eventsAdminRouter.delete('/:id', deleteEventHandler);

export default eventsPublicRouter;
