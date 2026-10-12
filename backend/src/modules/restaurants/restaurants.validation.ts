export interface CreateRestaurantDto {
  name: string;
  description?: string;
  address: string;
  district_id: number;
  latitude?: number;
  longitude?: number;
  phone?: string;
  website?: string;
  cuisine_id?: number;
  price_min?: number;
  price_max?: number;
  promo_label?: string;
}

export interface UpdateRestaurantDto extends Partial<CreateRestaurantDto> {}

/** Trả về chuỗi lỗi nếu dữ liệu không hợp lệ, null nếu hợp lệ */
export const validateCreateRestaurant = (
  body: Record<string, unknown>
): string | null => {
  if (!body['name'] || String(body['name']).trim() === '')
    return 'Tên nhà hàng là bắt buộc';
  if (String(body['name']).length > 200)
    return 'Tên nhà hàng không quá 200 ký tự';

  if (!body['address'] || String(body['address']).trim() === '')
    return 'Địa chỉ là bắt buộc';

  if (!body['district_id'] || isNaN(Number(body['district_id'])) || Number(body['district_id']) <= 0)
    return 'district_id phải là số nguyên dương';

  if (body['latitude'] !== undefined && body['latitude'] !== null) {
    const lat = Number(body['latitude']);
    if (isNaN(lat) || lat < -90 || lat > 90)
      return 'latitude phải nằm trong khoảng -90 đến 90';
  }

  if (body['longitude'] !== undefined && body['longitude'] !== null) {
    const lon = Number(body['longitude']);
    if (isNaN(lon) || lon < -180 || lon > 180)
      return 'longitude phải nằm trong khoảng -180 đến 180';
  }

  if (body['price_min'] !== undefined && body['price_min'] !== null) {
    const min = Number(body['price_min']);
    if (isNaN(min) || min < 0)
      return 'price_min phải >= 0';
  }

  if (body['price_max'] !== undefined && body['price_max'] !== null) {
    const max = Number(body['price_max']);
    if (isNaN(max) || max < 0)
      return 'price_max phải >= 0';
    const min = Number(body['price_min'] ?? 0);
    if (max < min)
      return 'price_max phải >= price_min';
  }

  if (body['cuisine_id'] !== undefined && body['cuisine_id'] !== null) {
    if (isNaN(Number(body['cuisine_id'])) || Number(body['cuisine_id']) <= 0)
      return 'cuisine_id phải là số nguyên dương';
  }

  return null;
};

export const validateUpdateRestaurant = (
  body: Record<string, unknown>
): string | null => {
  // Khi update, không bắt buộc có name/address — chỉ validate những gì được truyền vào
  if (body['name'] !== undefined && String(body['name']).trim() === '')
    return 'Tên nhà hàng không được để trống';

  if (body['price_min'] !== undefined && Number(body['price_min']) < 0)
    return 'price_min phải >= 0';

  if (body['price_max'] !== undefined) {
    const max = Number(body['price_max']);
    const min = Number(body['price_min'] ?? 0);
    if (max < 0) return 'price_max phải >= 0';
    if (max < min) return 'price_max phải >= price_min';
  }

  return null;
};
