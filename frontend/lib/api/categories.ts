import { apiRequest } from './client';
import { repairTextEncoding } from '@/lib/utils/repair-text-encoding';

export interface CategoryItem {
  id: number;
  name: string;
}

function repairCategoryNames(items: CategoryItem[]): CategoryItem[] {
  return items.map((item) => ({ ...item, name: repairTextEncoding(item.name) }));
}

/**
 * Lấy danh sách quận/huyện tại Đà Nẵng
 */
export async function getDistricts(): Promise<CategoryItem[]> {
  const res = await apiRequest<CategoryItem[]>('/api/districts');
  return repairCategoryNames(res.data || []);
}

/**
 * Lấy danh sách các loại hình ẩm thực
 */
export async function getCuisines(): Promise<CategoryItem[]> {
  const res = await apiRequest<CategoryItem[]>('/api/cuisines');
  return repairCategoryNames(res.data || []);
}

/**
 * Lấy danh sách khẩu vị món ăn
 */
export async function getTastes(): Promise<CategoryItem[]> {
  const res = await apiRequest<CategoryItem[]>('/api/tastes');
  return repairCategoryNames(res.data || []);
}

/**
 * Lấy danh mục điểm du lịch/tham quan
 */
export async function getAttractionCategories(): Promise<CategoryItem[]> {
  const res = await apiRequest<CategoryItem[]>('/api/attraction-categories');
  return repairCategoryNames(res.data || []);
}
