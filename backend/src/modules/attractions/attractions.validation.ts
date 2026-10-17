export interface CreateAttractionDto {
  name: string;
  description?: string;
  address: string;
  district_id: number;
  category_id?: number;
  ticket_price?: number;
  visit_duration_minutes?: number;
  latitude?: number;
  longitude?: number;
  phone?: string;
  website?: string;
  booking_url?: string;
  promo_label?: string;
}

export interface UpdateAttractionDto extends Partial<CreateAttractionDto> {}

/**
 * Validate dữ liệu khi thêm mới điểm du lịch (chỉ Admin)
 * @returns string chứa thông báo lỗi nếu không hợp lệ, null nếu hợp lệ
 */
export const validateCreateAttraction = (
  body: Record<string, unknown>
): string | null => {
  // 1. Tên điểm du lịch (bắt buộc)
  if (!body['name'] || String(body['name']).trim() === '') {
    return 'Tên điểm du lịch là bắt buộc';
  }
  if (String(body['name']).trim().length > 200) {
    return 'Tên điểm du lịch không quá 200 ký tự';
  }

  // 2. Địa chỉ (bắt buộc)
  if (!body['address'] || String(body['address']).trim() === '') {
    return 'Địa chỉ điểm du lịch là bắt buộc';
  }
  if (String(body['address']).trim().length > 255) {
    return 'Địa chỉ không quá 255 ký tự';
  }

  // 3. Quận/huyện (bắt buộc)
  if (
    body['district_id'] === undefined ||
    body['district_id'] === null ||
    isNaN(Number(body['district_id'])) ||
    Number(body['district_id']) <= 0
  ) {
    return 'district_id phải là số nguyên dương hợp lệ';
  }

  // 4. Loại danh mục điểm du lịch (nếu có)
  if (body['category_id'] !== undefined && body['category_id'] !== null) {
    if (isNaN(Number(body['category_id'])) || Number(body['category_id']) <= 0) {
      return 'category_id phải là số nguyên dương';
    }
  }

  // 5. Giá vé vào cổng (không âm: >= 0)
  if (body['ticket_price'] !== undefined && body['ticket_price'] !== null) {
    const price = Number(body['ticket_price']);
    if (isNaN(price) || price < 0) {
      return 'Giá vé tham quan (ticket_price) phải là số không âm (>= 0)';
    }
  }

  // 6. Thời lượng tham quan (phải là số dương: > 0)
  if (
    body['visit_duration_minutes'] !== undefined &&
    body['visit_duration_minutes'] !== null
  ) {
    const duration = Number(body['visit_duration_minutes']);
    if (isNaN(duration) || duration <= 0 || !Number.isInteger(duration)) {
      return 'Thời lượng tham quan (visit_duration_minutes) phải là số nguyên dương (> 0 phút)';
    }
  }

  // 7. Tọa độ (latitude / longitude)
  if (body['latitude'] !== undefined && body['latitude'] !== null) {
    const lat = Number(body['latitude']);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      return 'latitude phải nằm trong khoảng -90 đến 90';
    }
  }

  if (body['longitude'] !== undefined && body['longitude'] !== null) {
    const lon = Number(body['longitude']);
    if (isNaN(lon) || lon < -180 || lon > 180) {
      return 'longitude phải nằm trong khoảng -180 đến 180';
    }
  }

  // 8. Link đặt chỗ / mua vé trực tuyến (booking_url)
  if (
    body['booking_url'] !== undefined &&
    body['booking_url'] !== null &&
    String(body['booking_url']).trim() !== ''
  ) {
    const url = String(body['booking_url']).trim();
    if (url.length > 500) {
      return 'booking_url không quá 500 ký tự';
    }
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return 'booking_url phải bắt đầu bằng http:// hoặc https://';
    }
  }

  return null;
};

/**
 * Validate dữ liệu khi cập nhật điểm du lịch (chỉ Admin)
 */
export const validateUpdateAttraction = (
  body: Record<string, unknown>
): string | null => {
  if (body['name'] !== undefined) {
    if (String(body['name']).trim() === '') {
      return 'Tên điểm du lịch không được để trống';
    }
    if (String(body['name']).trim().length > 200) {
      return 'Tên điểm du lịch không quá 200 ký tự';
    }
  }

  if (body['address'] !== undefined) {
    if (String(body['address']).trim() === '') {
      return 'Địa chỉ không được để trống';
    }
    if (String(body['address']).trim().length > 255) {
      return 'Địa chỉ không quá 255 ký tự';
    }
  }

  if (body['district_id'] !== undefined) {
    if (isNaN(Number(body['district_id'])) || Number(body['district_id']) <= 0) {
      return 'district_id phải là số nguyên dương hợp lệ';
    }
  }

  if (body['category_id'] !== undefined && body['category_id'] !== null) {
    if (isNaN(Number(body['category_id'])) || Number(body['category_id']) <= 0) {
      return 'category_id phải là số nguyên dương';
    }
  }

  if (body['ticket_price'] !== undefined && body['ticket_price'] !== null) {
    const price = Number(body['ticket_price']);
    if (isNaN(price) || price < 0) {
      return 'Giá vé tham quan (ticket_price) phải là số không âm (>= 0)';
    }
  }

  if (
    body['visit_duration_minutes'] !== undefined &&
    body['visit_duration_minutes'] !== null
  ) {
    const duration = Number(body['visit_duration_minutes']);
    if (isNaN(duration) || duration <= 0 || !Number.isInteger(duration)) {
      return 'Thời lượng tham quan (visit_duration_minutes) phải là số nguyên dương (> 0 phút)';
    }
  }

  if (body['latitude'] !== undefined && body['latitude'] !== null) {
    const lat = Number(body['latitude']);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      return 'latitude phải nằm trong khoảng -90 đến 90';
    }
  }

  if (body['longitude'] !== undefined && body['longitude'] !== null) {
    const lon = Number(body['longitude']);
    if (isNaN(lon) || lon < -180 || lon > 180) {
      return 'longitude phải nằm trong khoảng -180 đến 180';
    }
  }

  if (
    body['booking_url'] !== undefined &&
    body['booking_url'] !== null &&
    String(body['booking_url']).trim() !== ''
  ) {
    const url = String(body['booking_url']).trim();
    if (url.length > 500) {
      return 'booking_url không quá 500 ký tự';
    }
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return 'booking_url phải bắt đầu bằng http:// hoặc https://';
    }
  }

  return null;
};
