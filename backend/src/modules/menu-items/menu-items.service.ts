import { getPool, sql } from '../../config/db';
import * as repo from './menu-items.repository';
import {
  validateCreateMenuItem,
  validateUpdateMenuItem,
  type CreateMenuItemDto,
  type UpdateMenuItemDto,
} from './menu-items.validation';

interface UserContext {
  role: string;
  partner_id?: number;
}

/**
 * Helper: Kiểm tra tồn tại và quyền sở hữu nhà hàng
 */
async function getRestaurantContext(place_id: number) {
  const pool = getPool();
  const res = await pool
    .request()
    .input('place_id', sql.Int, place_id)
    .query<{ place_id: number; partner_id: number | null; status: string }>(`
      SELECT place_id, partner_id, status
      FROM places
      WHERE place_id = @place_id AND place_type = 'RESTAURANT'
    `);

  return res.recordset[0] || null;
}

/**
 * 1. Lấy danh sách thực đơn của nhà hàng
 * - Khách vãng lai: chỉ thấy món đang bán (is_available = 1)
 * - Chủ quán / Admin: thấy toàn bộ món (cả món đã ẩn)
 */
export async function getMenuItems(place_id: number, user?: UserContext) {
  const restaurant = await getRestaurantContext(place_id);
  if (!restaurant) {
    throw { status: 404, message: 'Không tìm thấy nhà hàng' };
  }

  // Quán đang HIDDEN chỉ Admin hoặc chính chủ mới xem được
  if (restaurant.status === 'HIDDEN' && user?.role !== 'ADMIN' && restaurant.partner_id !== user?.partner_id) {
    throw { status: 404, message: 'Không tìm thấy nhà hàng' };
  }

  const isOwnerOrAdmin = user && (user.role === 'ADMIN' || (restaurant.partner_id && restaurant.partner_id === user.partner_id));
  const onlyAvailable = !isOwnerOrAdmin;

  return repo.findMenuItemsByPlaceId(place_id, onlyAvailable);
}

/**
 * 2. Lấy chi tiết 1 món ăn
 */
export async function getMenuItemById(menu_item_id: number) {
  const item = await repo.findMenuItemById(menu_item_id);
  if (!item) {
    throw { status: 404, message: 'Không tìm thấy món ăn' };
  }
  return item;
}

/**
 * 3. Thêm món ăn mới vào thực đơn
 */
export async function createMenuItem(
  place_id: number,
  body: Record<string, unknown>,
  user: UserContext
) {
  // 1. Validate dữ liệu đầu vào
  const validationError = validateCreateMenuItem(body);
  if (validationError) {
    throw { status: 400, message: validationError };
  }

  // 2. Kiểm tra tồn tại nhà hàng
  const restaurant = await getRestaurantContext(place_id);
  if (!restaurant) {
    throw { status: 404, message: 'Không tìm thấy nhà hàng' };
  }

  // 3. Quán đang LOCKED thì Partner không được thêm món
  if (restaurant.status === 'LOCKED' && user.role !== 'ADMIN') {
    throw { status: 403, message: 'Nhà hàng đang bị khóa (LOCKED), bạn không thể thêm món ăn' };
  }

  // 4. Kiểm tra quyền sở hữu
  if (user.role !== 'ADMIN' && restaurant.partner_id !== user.partner_id) {
    throw { status: 403, message: 'Bạn không có quyền quản lý thực đơn của nhà hàng này' };
  }

  const data = body as unknown as CreateMenuItemDto;

  // 5. Kiểm tra danh sách khẩu vị nếu có
  if (data.taste_ids && data.taste_ids.length > 0) {
    const tastesOk = await repo.checkTastesExist(data.taste_ids);
    if (!tastesOk) {
      throw { status: 400, message: 'Một hoặc nhiều khẩu vị (taste_id) không tồn tại trong hệ thống' };
    }
  }

  return repo.createMenuItemTx(place_id, data);
}

/**
 * 4. Cập nhật món ăn
 */
export async function updateMenuItem(
  menu_item_id: number,
  body: Record<string, unknown>,
  user: UserContext
) {
  // 1. Validate
  const validationError = validateUpdateMenuItem(body);
  if (validationError) {
    throw { status: 400, message: validationError };
  }

  // 2. Tìm thông tin món và quán
  const context = await repo.findMenuItemContext(menu_item_id);
  if (!context) {
    throw { status: 404, message: 'Không tìm thấy món ăn' };
  }

  // 3. Quán đang LOCKED thì Partner không được sửa món
  if (context.place_status === 'LOCKED' && user.role !== 'ADMIN') {
    throw { status: 403, message: 'Nhà hàng đang bị khóa (LOCKED), bạn không thể chỉnh sửa món ăn' };
  }

  // 4. Kiểm tra quyền sở hữu
  if (user.role !== 'ADMIN' && context.partner_id !== user.partner_id) {
    throw { status: 403, message: 'Bạn không có quyền chỉnh sửa món ăn này' };
  }

  const data = body as unknown as UpdateMenuItemDto;

  // 5. Kiểm tra taste_ids nếu có truyền
  if (data.taste_ids && data.taste_ids.length > 0) {
    const tastesOk = await repo.checkTastesExist(data.taste_ids);
    if (!tastesOk) {
      throw { status: 400, message: 'Một hoặc nhiều khẩu vị (taste_id) không tồn tại' };
    }
  }

  return repo.updateMenuItemTx(menu_item_id, context.place_id, data);
}

/**
 * 5. Ẩn món ăn (soft delete: is_available = 0)
 */
export async function deleteMenuItem(menu_item_id: number, user: UserContext) {
  const context = await repo.findMenuItemContext(menu_item_id);
  if (!context) {
    throw { status: 404, message: 'Không tìm thấy món ăn' };
  }

  // Quán đang LOCKED thì Partner không được tự ẩn
  if (context.place_status === 'LOCKED' && user.role !== 'ADMIN') {
    throw { status: 403, message: 'Nhà hàng đang bị khóa (LOCKED), bạn không thể ẩn món ăn' };
  }

  // Kiểm tra quyền sở hữu
  if (user.role !== 'ADMIN' && context.partner_id !== user.partner_id) {
    throw { status: 403, message: 'Bạn không có quyền xóa món ăn này' };
  }

  await repo.softDeleteMenuItemTx(menu_item_id, context.place_id);

  return {
    menu_item_id,
    is_available: false,
    message: 'Đã ẩn món ăn khỏi thực đơn thành công',
  };
}
