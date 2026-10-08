import type { Request, Response } from 'express';
import * as service from './restaurants.service';
import { ok, created, badRequest, notFound, forbidden, serverError } from '../../utils/response';

// Hàm xử lý lỗi dùng chung trong controller
const handleError = (res: Response, err: unknown) => {
  const e = err as { status?: number; message?: string };
  if (e.status === 400) return badRequest(res, e.message ?? 'Dữ liệu không hợp lệ');
  if (e.status === 403) return forbidden(res, e.message);
  if (e.status === 404) return notFound(res, e.message);
  return serverError(res, err);
};

// ─── GET /api/restaurants ─────────────────────────────────────────────────────
export const getAll = async (req: Request, res: Response) => {
  try {
    const result = await service.getRestaurants(req.query as Record<string, unknown>);
    return ok(res, result);
  } catch (err) {
    return handleError(res, err);
  }
};

// ─── GET /api/restaurants/:id ─────────────────────────────────────────────────
export const getOne = async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params['id'] ?? ''));
    if (isNaN(id)) return badRequest(res, 'ID không hợp lệ');
    const data = await service.getRestaurantById(id, req.user?.role);
    return ok(res, data);
  } catch (err) {
    return handleError(res, err);
  }
};

// ─── POST /api/restaurants ────────────────────────────────────────────────────
export const create = async (req: Request, res: Response) => {
  try {
    const data = await service.createRestaurant(
      req.body as Record<string, unknown>,
      req.user ?? { partner_id: 1 }
    );
    return created(res, data);
  } catch (err) {
    return handleError(res, err);
  }
};

// ─── PUT /api/restaurants/:id ─────────────────────────────────────────────────
export const update = async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params['id'] ?? ''));
    if (isNaN(id)) return badRequest(res, 'ID không hợp lệ');
    const data = await service.updateRestaurant(
      id,
      req.body as Record<string, unknown>,
      req.user ?? { partner_id: 1, user_id: 1, role: 'PARTNER' as const }
    );
    return ok(res, data);
  } catch (err) {
    return handleError(res, err);
  }
};

// ─── DELETE /api/restaurants/:id ─────────────────────────────────────────────
export const remove = async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params['id'] ?? ''));
    if (isNaN(id)) return badRequest(res, 'ID không hợp lệ');
    const data = await service.deleteRestaurant(
      id,
      req.user ?? { partner_id: 1, user_id: 1, role: 'PARTNER' as const }
    );
    return ok(res, data);
  } catch (err) {
    return handleError(res, err);
  }
};
