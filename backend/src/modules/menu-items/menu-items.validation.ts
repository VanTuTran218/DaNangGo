export interface CreateMenuItemDto {
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_available?: boolean;
  taste_ids?: number[];
}

export interface UpdateMenuItemDto {
  name?: string;
  description?: string;
  price?: number;
  image_url?: string;
  is_available?: boolean;
  taste_ids?: number[];
}

/**
 * Validate dữ liệu khi tạo món ăn mới
 */
export function validateCreateMenuItem(body: Record<string, unknown>): string | null {
  if (!body['name'] || String(body['name']).trim() === '') {
    return 'Tên món ăn là bắt buộc';
  }
  if (String(body['name']).trim().length > 150) {
    return 'Tên món ăn không quá 150 ký tự';
  }

  if (body['price'] === undefined || body['price'] === null || isNaN(Number(body['price']))) {
    return 'Giá món ăn là bắt buộc và phải là số';
  }
  if (Number(body['price']) < 0) {
    return 'Giá món ăn không được là số âm';
  }

  if (body['description'] !== undefined && body['description'] !== null) {
    if (String(body['description']).length > 500) {
      return 'Mô tả món ăn tối đa 500 ký tự';
    }
  }

  if (body['image_url'] !== undefined && body['image_url'] !== null && String(body['image_url']).trim() !== '') {
    const url = String(body['image_url']).trim();
    if (url.length > 255) {
      return 'Đường dẫn ảnh món ăn tối đa 255 ký tự';
    }
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
      return 'Đường dẫn ảnh phải là URL hợp lệ (http://, https:// hoặc đường dẫn tương đối /)';
    }
  }

  if (body['taste_ids'] !== undefined && body['taste_ids'] !== null) {
    if (!Array.isArray(body['taste_ids'])) {
      return 'taste_ids phải là mảng chứa các id khẩu vị';
    }
    for (const tid of body['taste_ids']) {
      if (isNaN(Number(tid)) || Number(tid) <= 0) {
        return 'Mỗi taste_id phải là số nguyên dương';
      }
    }
  }

  return null;
}

/**
 * Validate dữ liệu khi cập nhật món ăn
 */
export function validateUpdateMenuItem(body: Record<string, unknown>): string | null {
  if (body['name'] !== undefined) {
    if (String(body['name']).trim() === '') {
      return 'Tên món ăn không được để trống';
    }
    if (String(body['name']).trim().length > 150) {
      return 'Tên món ăn không quá 150 ký tự';
    }
  }

  if (body['price'] !== undefined) {
    if (isNaN(Number(body['price'])) || Number(body['price']) < 0) {
      return 'Giá món ăn phải là số không âm (>= 0)';
    }
  }

  if (body['description'] !== undefined && body['description'] !== null) {
    if (String(body['description']).length > 500) {
      return 'Mô tả món ăn tối đa 500 ký tự';
    }
  }

  if (body['image_url'] !== undefined && body['image_url'] !== null && String(body['image_url']).trim() !== '') {
    const url = String(body['image_url']).trim();
    if (url.length > 255) {
      return 'Đường dẫn ảnh món ăn tối đa 255 ký tự';
    }
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
      return 'Đường dẫn ảnh phải là URL hợp lệ';
    }
  }

  if (body['taste_ids'] !== undefined && body['taste_ids'] !== null) {
    if (!Array.isArray(body['taste_ids'])) {
      return 'taste_ids phải là mảng chứa các id khẩu vị';
    }
    for (const tid of body['taste_ids']) {
      if (isNaN(Number(tid)) || Number(tid) <= 0) {
        return 'Mỗi taste_id phải là số nguyên dương';
      }
    }
  }

  return null;
}
