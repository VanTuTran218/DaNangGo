import type { Request, Response } from 'express';
import * as service from './attractions.service';
import { ok, created, badRequest, notFound, forbidden, serverError } from '../../utils/response';

// Xử lý lỗi tập trung cho controller
const handleError = (res: Response, err: unknown) => {
  const e = err as { status?: number; message?: string };
  if (e.status === 400) return badRequest(res, e.message ?? 'Dữ liệu không hợp lệ');
  if (e.status === 403) return forbidden(res, e.message ?? 'Bạn không có quyền thực hiện thao tác này');
  if (e.status === 404) return notFound(res, e.message ?? 'Không tìm thấy tài nguyên');
  return serverError(res, err);
};

// ─── GET /api/attractions ─────────────────────────────────────────────────────
// Lấy danh sách điểm du lịch (công khai, hỗ trợ lọc và phân trang)
export const getAll = async (req: Request, res: Response) => {
  try {
    const result = await service.getAttractions(
      req.query as Record<string, unknown>,
      req.user?.role
    );
    return ok(res, result);
  } catch (err) {
    return handleError(res, err);
  }
};

// ─── GET /api/attractions/:id ─────────────────────────────────────────────────
// Lấy chi tiết điểm du lịch (công khai, điểm HIDDEN chỉ ADMIN mới xem được)
export const getOne = async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params['id'] ?? ''));
    if (isNaN(id)) return badRequest(res, 'ID điểm du lịch không hợp lệ');

    const data = await service.getAttractionById(id, req.user?.role);
    return ok(res, data);
  } catch (err) {
    return handleError(res, err);
  }
};

// ─── POST /api/attractions ────────────────────────────────────────────────────
// Tạo mới điểm du lịch (chỉ ADMIN)
export const create = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return forbidden(res, 'Vui lòng đăng nhập với tài khoản Quản trị viên');
    }
    const data = await service.createAttraction(
      req.body as Record<string, unknown>,
      req.user
    );
    return created(res, data);
  } catch (err) {
    return handleError(res, err);
  }
};

// ─── PUT /api/attractions/:id ─────────────────────────────────────────────────
// Cập nhật điểm du lịch (chỉ ADMIN)
export const update = async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params['id'] ?? ''));
    if (isNaN(id)) return badRequest(res, 'ID điểm du lịch không hợp lệ');

    if (!req.user) {
      return forbidden(res, 'Vui lòng đăng nhập với tài khoản Quản trị viên');
    }

    const data = await service.updateAttraction(
      id,
      req.body as Record<string, unknown>,
      req.user
    );
    return ok(res, data);
  } catch (err) {
    return handleError(res, err);
  }
};

// ─── DELETE /api/attractions/:id ──────────────────────────────────────────────
// Ẩn điểm du lịch (Soft Delete status = 'HIDDEN', chỉ ADMIN)
export const remove = async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params['id'] ?? ''));
    if (isNaN(id)) return badRequest(res, 'ID điểm du lịch không hợp lệ');

    if (!req.user) {
      return forbidden(res, 'Vui lòng đăng nhập với tài khoản Quản trị viên');
    }

    const result = await service.deleteAttraction(id, req.user);
    return ok(res, result);
  } catch (err) {
    return handleError(res, err);
  }
};
