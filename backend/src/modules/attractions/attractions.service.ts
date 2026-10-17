import {
  checkCategoryExists,
  checkDistrictExists,
  createAttractionTx,
  findAllAttractions,
  findAttractionById,
  incrementAttractionViewCount,
  softDeleteAttraction,
  updateAttractionTx,
  type AttractionRow,
} from './attractions.repository';
import {
  validateCreateAttraction,
  validateUpdateAttraction,
  type CreateAttractionDto,
  type UpdateAttractionDto,
} from './attractions.validation';
import { paginate, buildPaginatedResult, type PaginatedResult } from '../../utils/pagination';

export interface UserContext {
  role?: string;
  partner_id?: number;
  user_id?: number;
}

// ─── 1. Thêm điểm du lịch (Chỉ ADMIN) ────────────────────────────────────────

export const createAttraction = async (
  body: Record<string, unknown>,
  user?: UserContext
): Promise<AttractionRow> => {
  // 1. Phân quyền: Chỉ ADMIN có quyền tạo điểm du lịch
  if (user?.role !== 'ADMIN') {
    throw { status: 403, message: 'Chỉ Quản trị viên (ADMIN) mới có quyền thêm điểm du lịch' };
  }

  // 2. Validate dữ liệu đầu vào
  const validationError = validateCreateAttraction(body);
  if (validationError) throw { status: 400, message: validationError };

  const data = body as unknown as CreateAttractionDto;

  // 3. Kiểm tra district_id tồn tại
  const districtOk = await checkDistrictExists(Number(data.district_id));
  if (!districtOk) {
    throw { status: 400, message: 'district_id không tồn tại trong hệ thống' };
  }

  // 4. Kiểm tra category_id tồn tại nếu có truyền
  if (data.category_id !== undefined && data.category_id !== null) {
    const categoryOk = await checkCategoryExists(Number(data.category_id));
    if (!categoryOk) {
      throw { status: 400, message: 'category_id không tồn tại trong hệ thống' };
    }
  }

  // 5. Ghi vào DB trong transaction (places + attractions)
  return await createAttractionTx(data);
};

// ─── 2. Lấy danh sách điểm du lịch (Công khai, có phân trang & bộ lọc) ────────

export const getAttractions = async (
  query: Record<string, unknown>,
  userRole?: string
): Promise<PaginatedResult<AttractionRow>> => {
  const { page, limit, offset } = paginate(query['page'], query['limit']);

  const district_id = query['district_id'] ? Number(query['district_id']) : undefined;
  const category_id = query['category_id'] ? Number(query['category_id']) : undefined;
  const keyword = query['keyword'] ? String(query['keyword']) : undefined;

  // ADMIN có thể xem cả điểm du lịch trạng thái HIDDEN, người dùng thường chỉ xem ACTIVE
  const includeHidden = userRole === 'ADMIN';

  const { rows, total } = await findAllAttractions(
    offset,
    limit,
    district_id,
    category_id,
    keyword,
    includeHidden
  );

  return buildPaginatedResult(rows, total, page, limit);
};

// ─── 3. Lấy chi tiết điểm du lịch theo ID ─────────────────────────────────────

export const getAttractionById = async (
  place_id: number,
  userRole?: string
): Promise<AttractionRow> => {
  const attraction = await findAttractionById(place_id);

  if (!attraction) {
    throw { status: 404, message: 'Không tìm thấy điểm du lịch' };
  }

  // Điểm du lịch HIDDEN chỉ ADMIN mới được xem
  if (attraction.status === 'HIDDEN' && userRole !== 'ADMIN') {
    throw { status: 404, message: 'Không tìm thấy điểm du lịch' };
  }

  // Tăng view_count (fire-and-forget)
  incrementAttractionViewCount(place_id);

  return attraction;
};

// ─── 4. Cập nhật điểm du lịch (Chỉ ADMIN) ────────────────────────────────────

export const updateAttraction = async (
  place_id: number,
  body: Record<string, unknown>,
  user?: UserContext
): Promise<AttractionRow> => {
  // 1. Phân quyền: Chỉ ADMIN có quyền chỉnh sửa
  if (user?.role !== 'ADMIN') {
    throw { status: 403, message: 'Chỉ Quản trị viên (ADMIN) mới có quyền chỉnh sửa điểm du lịch' };
  }

  // 2. Validate dữ liệu đầu vào
  const validationError = validateUpdateAttraction(body);
  if (validationError) throw { status: 400, message: validationError };

  // 3. Kiểm tra điểm du lịch có tồn tại không
  const existing = await findAttractionById(place_id);
  if (!existing) {
    throw { status: 404, message: 'Không tìm thấy điểm du lịch' };
  }

  // 4. Kiểm tra district_id mới nếu có
  if (body['district_id'] !== undefined) {
    const districtOk = await checkDistrictExists(Number(body['district_id']));
    if (!districtOk) {
      throw { status: 400, message: 'district_id không tồn tại trong hệ thống' };
    }
  }

  // 5. Kiểm tra category_id mới nếu có và không null
  if (body['category_id'] !== undefined && body['category_id'] !== null) {
    const categoryOk = await checkCategoryExists(Number(body['category_id']));
    if (!categoryOk) {
      throw { status: 400, message: 'category_id không tồn tại trong hệ thống' };
    }
  }

  // 6. Cập nhật trong transaction 2 bảng
  return await updateAttractionTx(place_id, body as unknown as UpdateAttractionDto);
};

// ─── 5. Ẩn điểm du lịch (Soft Delete, status = 'HIDDEN', chỉ ADMIN) ──────────

export const deleteAttraction = async (
  place_id: number,
  user?: UserContext
): Promise<{ place_id: number; status: string; message: string }> => {
  // 1. Phân quyền: Chỉ ADMIN có quyền ẩn điểm du lịch
  if (user?.role !== 'ADMIN') {
    throw { status: 403, message: 'Chỉ Quản trị viên (ADMIN) mới có quyền ẩn điểm du lịch' };
  }

  // 2. Kiểm tra tồn tại
  const existing = await findAttractionById(place_id);
  if (!existing) {
    throw { status: 404, message: 'Không tìm thấy điểm du lịch' };
  }

  // 3. Đổi status thành 'HIDDEN'
  await softDeleteAttraction(place_id);

  return {
    place_id,
    status: 'HIDDEN',
    message: 'Đã ẩn điểm du lịch thành công',
  };
};
