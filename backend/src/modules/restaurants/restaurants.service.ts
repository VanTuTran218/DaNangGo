import {
  checkCuisineExists,
  checkDistrictExists,
  createRestaurantTx,
  findAllRestaurants,
  findRestaurantById,
  incrementViewCount,
  softDeleteRestaurant,
  updateRestaurantTx,
  type RestaurantRow,
} from './restaurants.repository';
import {
  validateCreateRestaurant,
  validateUpdateRestaurant,
  type CreateRestaurantDto,
  type UpdateRestaurantDto,
} from './restaurants.validation';
import { paginate, buildPaginatedResult, type PaginatedResult } from '../../utils/pagination';

// Tính is_open dựa trên opening_hours (mở rộng sau khi có bảng opening_hours có dữ liệu)
// Tạm thời trả về null — sẽ bổ sung sau
const attachIsOpen = (restaurant: RestaurantRow) => ({
  ...restaurant,
  is_open: null as boolean | null,
});

// ─── 1. Tạo nhà hàng ─────────────────────────────────────────────────────────

export const createRestaurant = async (
  body: Record<string, unknown>,
  user: { partner_id?: number }
) => {
  // 1. Validate dữ liệu vào
  const validationError = validateCreateRestaurant(body);
  if (validationError) throw { status: 400, message: validationError };

  const data = body as unknown as CreateRestaurantDto;

  // 2. Kiểm tra district_id tồn tại
  const districtOk = await checkDistrictExists(Number(data.district_id));
  if (!districtOk) throw { status: 400, message: 'district_id không tồn tại trong hệ thống' };

  // 3. Kiểm tra cuisine_id nếu có
  if (data.cuisine_id) {
    const cuisineOk = await checkCuisineExists(Number(data.cuisine_id));
    if (!cuisineOk) throw { status: 400, message: 'cuisine_id không tồn tại trong hệ thống' };
  }

  // 4. Ghi vào DB (transaction)
  const partner_id = user.partner_id ?? 1;
  const restaurant = await createRestaurantTx(data, partner_id);
  return attachIsOpen(restaurant);
};

// ─── 2. Lấy danh sách nhà hàng ───────────────────────────────────────────────

export const getRestaurants = async (
  query: Record<string, unknown>
): Promise<PaginatedResult<ReturnType<typeof attachIsOpen>>> => {
  const { page, limit, offset } = paginate(query['page'], query['limit']);

  const district_id = query['district_id'] ? Number(query['district_id']) : undefined;
  const cuisine_id = query['cuisine_id'] ? Number(query['cuisine_id']) : undefined;
  const keyword = query['keyword'] ? String(query['keyword']) : undefined;

  const { rows, total } = await findAllRestaurants(offset, limit, district_id, cuisine_id, keyword);

  return buildPaginatedResult(rows.map(attachIsOpen), total, page, limit);
};

// ─── 3. Lấy chi tiết 1 nhà hàng ─────────────────────────────────────────────

export const getRestaurantById = async (
  place_id: number,
  role?: string
) => {
  const restaurant = await findRestaurantById(place_id);

  if (!restaurant) throw { status: 404, message: 'Không tìm thấy nhà hàng' };

  // Địa điểm HIDDEN chỉ Admin mới xem được
  if (restaurant.status === 'HIDDEN' && role !== 'ADMIN') {
    throw { status: 404, message: 'Không tìm thấy nhà hàng' };
  }

  // Tăng view_count (fire-and-forget, không await)
  incrementViewCount(place_id);

  return attachIsOpen(restaurant);
};

// ─── 4. Cập nhật nhà hàng ────────────────────────────────────────────────────

export const updateRestaurant = async (
  place_id: number,
  body: Record<string, unknown>,
  user: { partner_id?: number; role: string }
) => {
  // 1. Validate
  const validationError = validateUpdateRestaurant(body);
  if (validationError) throw { status: 400, message: validationError };

  // 2. Kiểm tra tồn tại
  const restaurant = await findRestaurantById(place_id);
  if (!restaurant) throw { status: 404, message: 'Không tìm thấy nhà hàng' };

  // 3. Kiểm tra quyền: chỉ Partner sở hữu hoặc Admin
  if (user.role !== 'ADMIN' && restaurant.partner_id !== user.partner_id) {
    throw { status: 403, message: 'Bạn không có quyền sửa nhà hàng này' };
  }

  // 4. Kiểm tra district_id mới nếu có
  if (body['district_id']) {
    const districtOk = await checkDistrictExists(Number(body['district_id']));
    if (!districtOk) throw { status: 400, message: 'district_id không tồn tại trong hệ thống' };
  }

  // 5. Kiểm tra cuisine_id mới nếu có
  if (body['cuisine_id']) {
    const cuisineOk = await checkCuisineExists(Number(body['cuisine_id']));
    if (!cuisineOk) throw { status: 400, message: 'cuisine_id không tồn tại trong hệ thống' };
  }

  await updateRestaurantTx(place_id, body as unknown as UpdateRestaurantDto);

  // Trả về bản ghi đã cập nhật
  const updated = await findRestaurantById(place_id);
  return attachIsOpen(updated!);
};

// ─── 5. Xóa mềm nhà hàng ────────────────────────────────────────────────────

export const deleteRestaurant = async (
  place_id: number,
  user: { partner_id?: number; role: string }
) => {
  const restaurant = await findRestaurantById(place_id);
  if (!restaurant) throw { status: 404, message: 'Không tìm thấy nhà hàng' };

  if (user.role !== 'ADMIN' && restaurant.partner_id !== user.partner_id) {
    throw { status: 403, message: 'Bạn không có quyền xóa nhà hàng này' };
  }

  await softDeleteRestaurant(place_id);
  return { place_id, status: 'HIDDEN', message: 'Đã ẩn nhà hàng thành công' };
};
