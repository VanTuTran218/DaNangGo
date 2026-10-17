import type { Request, Response } from 'express';
import * as service from './categories.service';
import { ok, serverError } from '../../utils/response';

/**
 * GET /districts (hoặc /api/districts)
 * Lấy danh sách quận/huyện
 */
export async function getDistricts(_req: Request, res: Response) {
  try {
    const data = await service.getDistricts();
    return ok(res, data, 'Lấy danh sách quận/huyện thành công');
  } catch (err) {
    return serverError(res, err);
  }
}

/**
 * GET /cuisines (hoặc /api/cuisines)
 * Lấy danh sách loại hình ẩm thực
 */
export async function getCuisines(_req: Request, res: Response) {
  try {
    const data = await service.getCuisines();
    return ok(res, data, 'Lấy danh sách loại ẩm thực thành công');
  } catch (err) {
    return serverError(res, err);
  }
}

/**
 * GET /tastes (hoặc /api/tastes)
 * Lấy danh sách khẩu vị món ăn
 */
export async function getTastes(_req: Request, res: Response) {
  try {
    const data = await service.getTastes();
    return ok(res, data, 'Lấy danh sách khẩu vị thành công');
  } catch (err) {
    return serverError(res, err);
  }
}

/**
 * GET /attraction-categories (hoặc /api/attraction-categories)
 * Lấy danh mục điểm tham quan
 */
export async function getAttractionCategories(_req: Request, res: Response) {
  try {
    const data = await service.getAttractionCategories();
    return ok(res, data, 'Lấy danh mục điểm tham quan thành công');
  } catch (err) {
    return serverError(res, err);
  }
}
