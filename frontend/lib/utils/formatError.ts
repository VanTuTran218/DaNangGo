import { ApiError } from '../api/client';

/**
 * Phân tích và chuyển đổi mọi đối tượng lỗi thành thông điệp tiếng Việt thân thiện, rõ nghĩa.
 */
export function getFriendlyErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    const status = err.status;
    const msg = err.message || '';

    if (status === 400) {
      return msg || 'Dữ liệu nhập vào chưa hợp lệ. Vui lòng kiểm tra lại các trường thông tin.';
    }

    if (status === 401) {
      return 'Phiên đăng nhập đã hết hạn hoặc bạn chưa đăng nhập. Vui lòng đăng nhập lại để tiếp tục.';
    }

    if (status === 403) {
      if (msg.includes('LOCKED') || msg.toLowerCase().includes('khóa')) {
        return 'Địa điểm này đang bị Quản trị viên khóa (LOCKED). Chỉ Admin mới có quyền mở khóa hoặc chỉnh sửa.';
      }
      if (msg.includes('phê duyệt') || msg.includes('chưa được duyệt')) {
        return 'Tài khoản của bạn chưa được phê duyệt. Vui lòng đợi quản trị viên duyệt hồ sơ đối tác.';
      }
      return msg || 'Bạn không có quyền thực hiện thao tác này trên cơ sở được chỉ định.';
    }

    if (status === 404) {
      return msg || 'Không tìm thấy cơ sở ẩm thực hoặc dữ liệu yêu cầu không tồn tại.';
    }

    if (status >= 500) {
      return 'Máy chủ đang gặp sự cố hoặc gián đoạn kết nối. Vui lòng thử lại sau ít phút.';
    }

    return msg || 'Đã xảy ra lỗi trong quá trình xử lý yêu cầu.';
  }

  if (err instanceof Error) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng của bạn.';
    }
    return err.message;
  }

  return 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.';
}

/**
 * Trích xuất lỗi chi tiết cho từng trường (field-level validation error)
 * từ thông điệp phản hồi của backend.
 */
export function extractFieldErrors(err: unknown): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  if (!err) return fieldErrors;

  const message = err instanceof ApiError ? err.message : String((err as any)?.message || '');
  const lowerMsg = message.toLowerCase();

  // 1. Tên nhà hàng
  if (lowerMsg.includes('tên') || lowerMsg.includes('name')) {
    fieldErrors.name = message;
  }

  // 2. Địa chỉ
  if (lowerMsg.includes('địa chỉ') || lowerMsg.includes('address')) {
    fieldErrors.address = message;
  }

  // 3. URL Đặt bàn (booking_url)
  if (lowerMsg.includes('booking_url') || lowerMsg.includes('đặt bàn') || lowerMsg.includes('đặt chỗ')) {
    fieldErrors.bookingUrl = message;
  }

  // 4. Giá tối đa & tối thiểu
  if (lowerMsg.includes('price_max') || lowerMsg.includes('giá tối đa')) {
    fieldErrors.priceMax = message;
  } else if (lowerMsg.includes('price_min') || lowerMsg.includes('giá tối thiểu')) {
    fieldErrors.priceMin = message;
  }

  // 5. Quận / Huyện
  if (lowerMsg.includes('district') || lowerMsg.includes('quận')) {
    fieldErrors.districtId = message;
  }

  // 6. Loại ẩm thực
  if (lowerMsg.includes('cuisine') || lowerMsg.includes('ẩm thực')) {
    fieldErrors.cuisineId = message;
  }

  return fieldErrors;
}
