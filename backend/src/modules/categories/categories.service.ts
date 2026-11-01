import {
  findDistricts,
  findCuisines,
  findTastes,
  findAttractionCategories,
  type CategoryItem,
} from './categories.repository';

// TTL cache in-memory 10 phút (600,000ms)
const CACHE_TTL_MS = 10 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
}

const cache: {
  districts?: CacheEntry<CategoryItem[]>;
  cuisines?: CacheEntry<CategoryItem[]>;
  tastes?: CacheEntry<CategoryItem[]>;
  attractionCategories?: CacheEntry<CategoryItem[]>;
} = {};

function isCacheValid<T>(entry?: CacheEntry<T>): entry is CacheEntry<T> {
  if (!entry) return false;
  return Date.now() - entry.cachedAt < CACHE_TTL_MS;
}

/**
 * Lấy danh sách quận/huyện (có server cache)
 */
export async function getDistricts(): Promise<CategoryItem[]> {
  if (isCacheValid(cache.districts)) {
    return cache.districts.data;
  }
  const data = await findDistricts();
  cache.districts = { data, cachedAt: Date.now() };
  return data;
}

/**
 * Lấy danh sách loại ẩm thực (có server cache)
 */
export async function getCuisines(): Promise<CategoryItem[]> {
  if (isCacheValid(cache.cuisines)) {
    return cache.cuisines.data;
  }
  const data = await findCuisines();
  cache.cuisines = { data, cachedAt: Date.now() };
  return data;
}

/**
 * Lấy danh sách khẩu vị (có server cache)
 */
export async function getTastes(): Promise<CategoryItem[]> {
  if (isCacheValid(cache.tastes)) {
    return cache.tastes.data;
  }
  const data = await findTastes();
  cache.tastes = { data, cachedAt: Date.now() };
  return data;
}

/**
 * Lấy danh mục điểm tham quan (có server cache)
 */
export async function getAttractionCategories(): Promise<CategoryItem[]> {
  if (isCacheValid(cache.attractionCategories)) {
    return cache.attractionCategories.data;
  }
  const data = await findAttractionCategories();
  cache.attractionCategories = { data, cachedAt: Date.now() };
  return data;
}

/**
 * Xóa cache thủ công khi có thay đổi danh mục (nếu cần)
 */
export function clearCategoryCache(): void {
  delete cache.districts;
  delete cache.cuisines;
  delete cache.tastes;
  delete cache.attractionCategories;
}
