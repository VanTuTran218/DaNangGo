import { apiRequest } from './client';

export interface TasteItem {
  taste_id: number;
  name: string;
}

export interface MenuItem {
  menu_item_id: number;
  place_id: number;
  name: string;
  description: string | null;
  price: number;
  is_available: boolean;
  image_url: string | null;
  updated_at: string | null;
  tastes: TasteItem[];
}

export interface CreateMenuItemInput {
  name: string;
  price: number;
  description?: string;
  image_url?: string;
  is_available?: boolean;
  taste_ids?: number[];
}

export interface UpdateMenuItemInput {
  name?: string;
  price?: number;
  description?: string;
  image_url?: string;
  is_available?: boolean;
  taste_ids?: number[];
}

/**
 * Lấy danh sách thực đơn của nhà hàng
 */
export async function getRestaurantMenuItems(placeId: number): Promise<MenuItem[]> {
  const res = await apiRequest<MenuItem[]>(`/api/restaurants/${placeId}/menu-items`);
  return res.data || [];
}

/**
 * Lấy thông tin chi tiết 1 món ăn
 */
export async function getMenuItemById(menuItemId: number): Promise<MenuItem | null> {
  const res = await apiRequest<MenuItem>(`/api/menu-items/${menuItemId}`);
  return res.data || null;
}

/**
 * Thêm món ăn mới vào thực đơn (Partner/Admin)
 */
export async function createMenuItem(
  placeId: number,
  data: CreateMenuItemInput
): Promise<MenuItem> {
  const res = await apiRequest<MenuItem>(`/api/restaurants/${placeId}/menu-items`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.data!;
}

/**
 * Cập nhật món ăn
 */
export async function updateMenuItem(
  menuItemId: number,
  data: UpdateMenuItemInput
): Promise<MenuItem> {
  const res = await apiRequest<MenuItem>(`/api/menu-items/${menuItemId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.data!;
}

/**
 * Ẩn món ăn khỏi thực đơn (Soft delete)
 */
export async function deleteMenuItem(menuItemId: number): Promise<void> {
  await apiRequest(`/api/menu-items/${menuItemId}`, {
    method: 'DELETE',
  });
}
