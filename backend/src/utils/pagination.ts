export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

/**
 * Tính các thông số phân trang từ query params.
 * - page tối thiểu là 1
 * - limit tối đa là 50, mặc định là 10
 */
export const paginate = (
  rawPage: unknown,
  rawLimit: unknown
): PaginationParams => {
  const page = Math.max(1, parseInt(String(rawPage ?? '1')));
  const limit = Math.min(50, Math.max(1, parseInt(String(rawLimit ?? '10'))));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

/**
 * Đóng gói danh sách kết quả kèm thông tin phân trang.
 */
export const buildPaginatedResult = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResult<T> => ({
  data,
  total,
  page,
  limit,
  total_pages: Math.ceil(total / limit),
});
