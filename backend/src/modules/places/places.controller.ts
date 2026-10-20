import type { Request, Response } from 'express';
import * as placesService from './places.service';
import { validateSearchPlacesQuery, validatePlaceId, ALLOWED_PLACE_TYPES } from './places.validation';
import type { PlaceStatus } from './places.service';
import { ok, created, badRequest, notFound, forbidden, serverError } from '../../utils/response';

// Xử lý lỗi tập trung cho controller
const handleError = (res: Response, err: unknown) => {
  const e = err as { status?: number; message?: string };
  if (e.status === 400) return badRequest(res, e.message ?? 'Dữ liệu không hợp lệ');
  if (e.status === 403) return forbidden(res, e.message ?? 'Bạn không có quyền thực hiện thao tác này');
  if (e.status === 404) return notFound(res, e.message ?? 'Không tìm thấy địa điểm');
  return serverError(res, err);
};

/**
 * GET /api/places
 * Tìm kiếm và lọc danh sách địa điểm công khai
 * Query: q, type, district_id, min_price, max_price, min_rating, cuisine_id, taste_id, category_id, open_now, sort, page, limit
 */
export const getAll = async (req: Request, res: Response) => {
  try {
    const validation = validateSearchPlacesQuery(req.query as Record<string, unknown>);
    if (validation.error) {
      return badRequest(res, validation.error);
    }

    const includeHidden = req.user?.role === 'ADMIN' && req.query.include_hidden === 'true';
    const result = await placesService.getPlaces(validation.data!, includeHidden);

    return ok(res, result, 'Lấy danh sách địa điểm thành công');
  } catch (err) {
    return handleError(res, err);
  }
};

/**
 * GET /api/places/:id
 * Lấy thông tin chi tiết một địa điểm theo ID (kèm thực đơn món ăn/khẩu vị, giá vé, lưu trú, ảnh và giờ mở cửa)
 * Phân quyền: Địa điểm HIDDEN, LOCKED, PENDING chỉ ADMIN hoặc PARTNER sở hữu mới xem được.
 */
export const getOne = async (req: Request, res: Response) => {
  try {
    const validation = validatePlaceId(req.params['id']);
    if (validation.error) {
      return badRequest(res, validation.error);
    }
    const id = validation.data!;

    const place = await placesService.getPlaceDetail(id, req.user);
    return ok(res, place, 'Lấy thông tin địa điểm thành công');
  } catch (err) {
    return handleError(res, err);
  }
};


/**
 * PATCH /api/places/:id/status
 * Cập nhật trạng thái địa điểm (ACTIVE, HIDDEN, PENDING, LOCKED)
 * Quyền: PARTNER chỉ được đổi trạng thái cơ sở của mình, chỉ ADMIN mới được khóa/mở khóa (LOCKED)
 */
export const updateStatus = async (req: Request, res: Response) => {
  try {
    const rawId = req.params['id'];
    const id = parseInt(String(rawId ?? ''));
    if (isNaN(id) || id <= 0) {
      return badRequest(res, 'ID địa điểm không hợp lệ');
    }

    if (!req.user) {
      return forbidden(res, 'Vui lòng đăng nhập để thực hiện thao tác này');
    }

    const { status } = req.body;
    const allowedStatuses: PlaceStatus[] = ['ACTIVE', 'HIDDEN', 'PENDING', 'LOCKED'];
    if (!status || !allowedStatuses.includes(status)) {
      return badRequest(res, `Trạng thái không hợp lệ (chỉ chấp nhận: ${allowedStatuses.join(', ')})`);
    }

    const result = await placesService.updatePlaceStatus(id, status, req.user);
    return ok(res, result, result.message);
  } catch (err) {
    return handleError(res, err);
  }
};

/**
 * POST /api/places
 * Tạo địa điểm mới (tương thích ngược với endpoint cũ)
 */
export const create = async (req: Request, res: Response) => {
  try {
    const { name, description, address, category } = req.body;
    if (!name || String(name).trim() === '') {
      return badRequest(res, 'Tên địa điểm là bắt buộc');
    }

    const newPlace = await placesService.createPlace({
      name: String(name).trim(),
      description,
      address,
      category,
    });

    return created(res, newPlace);
  } catch (err) {
    return handleError(res, err);
  }
};
