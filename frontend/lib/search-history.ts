import type { CatalogPlaceKind } from './api/search';

const STORAGE_KEY = 'dananggo.search-history.v1';
export const SEARCH_HISTORY_LIMIT = 10;

export interface SearchHistoryEntry {
  query: string;
  kind: CatalogPlaceKind | '';
  minPrice?: number;
  maxPrice?: number;
  searchedAt: number;
}

function isCatalogPlaceKind(value: unknown): value is CatalogPlaceKind {
  return value === 'STAY' || value === 'FOOD' || value === 'ATTRACTION' || value === 'ENTERTAINMENT';
}

function isSearchHistoryEntry(value: unknown): value is SearchHistoryEntry {
  if (typeof value !== 'object' || value === null) return false;
  const entry = value as Record<string, unknown>;
  return typeof entry.query === 'string'
    && (entry.kind === '' || isCatalogPlaceKind(entry.kind))
    && (entry.minPrice === undefined || (typeof entry.minPrice === 'number' && Number.isFinite(entry.minPrice) && entry.minPrice >= 0))
    && (entry.maxPrice === undefined || (typeof entry.maxPrice === 'number' && Number.isFinite(entry.maxPrice) && entry.maxPrice >= 0))
    && typeof entry.searchedAt === 'number'
    && Number.isFinite(entry.searchedAt);
}

function readHistory(): SearchHistoryEntry[] {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === null) return [];

  const parsed: unknown = JSON.parse(stored);
  if (!Array.isArray(parsed) || !parsed.every(isSearchHistoryEntry)) {
    throw new Error('Lịch sử tìm kiếm đã lưu không đúng định dạng. Hãy xóa lịch sử để tiếp tục.');
  }
  return parsed.slice(0, SEARCH_HISTORY_LIMIT);
}

function writeHistory(entries: SearchHistoryEntry[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function searchKey(entry: Omit<SearchHistoryEntry, 'searchedAt'>): string {
  return JSON.stringify([
    entry.query.trim().toLocaleLowerCase('vi'),
    entry.kind,
    entry.minPrice ?? null,
    entry.maxPrice ?? null,
  ]);
}

export function getSearchHistory(): SearchHistoryEntry[] {
  return readHistory();
}

export function recordSearchHistory(
  search: Omit<SearchHistoryEntry, 'searchedAt'>,
): SearchHistoryEntry[] {
  const normalized: Omit<SearchHistoryEntry, 'searchedAt'> = {
    query: search.query.trim(),
    kind: search.kind,
    ...(search.minPrice === undefined ? {} : { minPrice: search.minPrice }),
    ...(search.maxPrice === undefined ? {} : { maxPrice: search.maxPrice }),
  };
  if (!normalized.query && !normalized.kind && normalized.minPrice === undefined && normalized.maxPrice === undefined) {
    return readHistory();
  }

  const key = searchKey(normalized);
  const entries = readHistory().filter((entry) => searchKey(entry) !== key);
  const nextHistory = [
    { ...normalized, searchedAt: Date.now() },
    ...entries,
  ].slice(0, SEARCH_HISTORY_LIMIT);
  writeHistory(nextHistory);
  return nextHistory;
}

export function clearSearchHistory(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}

/** Xóa một mục lịch sử theo timestamp. Trả về danh sách còn lại. */
export function removeSearchHistoryEntry(searchedAt: number): SearchHistoryEntry[] {
  const next = readHistory().filter((e) => e.searchedAt !== searchedAt);
  writeHistory(next);
  return next;
}
