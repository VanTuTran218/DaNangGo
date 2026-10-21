import type { Request, Response } from 'express';
import * as service from './menu-items.service';
import { ok, created, badRequest, notFound, forbidden, unauthorized, serverError } from '../../utils/response';

const handleError = (res: Response, err: unknown) => {
  const e = err as { status?: number; message?: string };
  if (e.status === 400) return badRequest(res, e.message ?? 'Dữ liệu không hợp lệ');
  if (e.status === 401) return unauthorized(res, e.message ?? 'Vui lòng đăng nhập để tiếp tục');
  if (e.status === 403) return forbidden(res, e.message ?? 'Bạn không có quyền thực hiện thao tác này');
  if (e.status === 404) return notFound(res, e.message ?? 'Không tìm thấy món ăn');
  return serverError(res, err);
};

/**
 * GET /api/restaurants/:id/menu-items
 * Lấy danh sách món ăn của 1 nhà hàng
 */
export async function getByRestaurant(req: Request, res: Response) {
  try {
    const place_id = parseInt(String(req.params['id'] ?? ''));
    if (isNaN(place_id)) return badRequest(res, 'ID nhà hàng không hợp lệ');

    const data = await service.getMenuItems(place_id, req.user);
    return ok(res, data, 'Lấy danh sách món ăn thành công');
  } catch (err) {
    return handleError(res, err);
  }
}

/**
 * GET /api/menu-items/:id
 * Lấy chi tiết 1 món ăn
 */
export async function getOne(req: Request, res: Response) {
  try {
    const id = parseInt(String(req.params['id'] ?? ''));
    if (isNaN(id)) return badRequest(res, 'ID món ăn không hợp lệ');

    const data = await service.getMenuItemById(id);
    return ok(res, data, 'Lấy chi tiết món ăn thành công');
  } catch (err) {
    return handleError(res, err);
  }
}

/**
 * POST /api/restaurants/:id/menu-items
 * Thêm món ăn mới vào thực đơn (Partner hoặc Admin)
 */
export async function create(req: Request, res: Response) {
  try {
    if (!req.user) return unauthorized(res, 'Vui lòng đăng nhập để tiếp tục');
    const place_id = parseInt(String(req.params['id'] ?? ''));
    if (isNaN(place_id)) return badRequest(res, 'ID nhà hàng không hợp lệ');

    const data = await service.createMenuItem(
      place_id,
      req.body as Record<string, unknown>,
      req.user
    );
    return created(res, data);
  } catch (err) {
    return handleError(res, err);
  }
}

/**
 * PUT /api/menu-items/:id
 * Cập nhật món ăn
 */
export async function update(req: Request, res: Response) {
  try {
    if (!req.user) return unauthorized(res, 'Vui lòng đăng nhập để tiếp tục');
    const id = parseInt(String(req.params['id'] ?? ''));
    if (isNaN(id)) return badRequest(res, 'ID món ăn không hợp lệ');

    const data = await service.updateMenuItem(
      id,
      req.body as Record<string, unknown>,
      req.user
    );
    return ok(res, data, 'Cập nhật món ăn thành công');
  } catch (err) {
    return handleError(res, err);
  }
}

/**
 * DELETE /api/menu-items/:id
 * Ẩn món ăn khỏi thực đơn
 */
export async function remove(req: Request, res: Response) {
  try {
    if (!req.user) return unauthorized(res, 'Vui lòng đăng nhập để tiếp tục');
    const id = parseInt(String(req.params['id'] ?? ''));
    if (isNaN(id)) return badRequest(res, 'ID món ăn không hợp lệ');

    const data = await service.deleteMenuItem(id, req.user);
    return ok(res, data, 'Đã ẩn món ăn khỏi thực đơn thành công');
  } catch (err) {
    return handleError(res, err);
  }
}
