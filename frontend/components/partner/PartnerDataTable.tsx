'use client';

import { ReactNode, useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Inbox } from 'lucide-react';
import SkeletonTable from '@/components/ui/SkeletonTable';

export interface PartnerColumn<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  sortable?: boolean;
  className?: string;
}

interface PartnerDataTableProps<T> {
  data: T[];
  columns: PartnerColumn<T>[];
  loading?: boolean;
  searchPlaceholder?: string;
  searchField?: (item: T) => string;
  initialSearch?: string;
  filterSlot?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: ReactNode;
  pageSize?: number;
  rowKey: (item: T) => string;
}

export default function PartnerDataTable<T>({
  data,
  columns,
  loading = false,
  searchPlaceholder = 'Tìm kiếm...',
  searchField,
  initialSearch = '',
  filterSlot,
  emptyTitle = 'Không có dữ liệu',
  emptyDescription = 'Hiện tại chưa có dữ liệu nào phù hợp trong danh sách này.',
  emptyIcon,
  pageSize = 8,
  rowKey,
}: PartnerDataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = useMemo(() => {
    let result = [...data];
    if (searchTerm.trim() && searchField) {
      const q = searchTerm.toLowerCase();
      result = result.filter((item) => searchField(item).toLowerCase().includes(q));
    }
    if (sortKey) {
      result.sort((a: any, b: any) => {
        const valA = a[sortKey];
        const valB = b[sortKey];
        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [data, searchTerm, searchField, sortKey, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const currentPageData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const handleSort = (key: string, sortable?: boolean) => {
    if (!sortable) return;
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  if (loading) return <SkeletonTable rows={pageSize} cols={columns.length} />;

  return (
    <div className="space-y-5">
      {/* Toolbar Search & Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5 bg-white p-4 rounded-[20px] border border-[#E2ECEC] shadow-xs">
        {searchField ? (
          <div className="relative flex-1 max-w-md min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#68798A] pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={searchPlaceholder}
              className="w-full pl-10 pr-4 py-2.5 text-sm text-[#14233B] placeholder:text-[#68798A]/80 bg-[#F6FAFA] border border-[#E2ECEC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/30 focus:border-[#14B8A6] focus:bg-white transition-all"
            />
          </div>
        ) : (
          <div />
        )}

        {filterSlot && <div className="flex items-center gap-2.5 flex-wrap">{filterSlot}</div>}
      </div>

      {/* Table / Empty Container */}
      <div className="bg-white rounded-[20px] border border-[#E2ECEC] shadow-xs overflow-hidden">
        {filteredData.length === 0 ? (
          <div className="relative overflow-hidden flex flex-col items-center justify-center py-16 px-6 text-center">
            {/* Họa tiết sóng biển tối giản ở đáy empty state */}
            <div className="absolute inset-x-0 bottom-0 pointer-events-none opacity-40">
              <svg
                className="w-full h-16 text-[#E9F8F5]"
                viewBox="0 0 1200 120"
                preserveAspectRatio="none"
              >
                <path
                  d="M0,40 C250,110 550,-20 850,60 C1050,110 1150,30 1200,50 L1200,120 L0,120 Z"
                  fill="currentColor"
                />
              </svg>
            </div>

            <div className="relative z-10 flex flex-col items-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-[#E9F8F5] border border-[#BDE8E0] text-[#008F89] flex items-center justify-center mb-4 shadow-2xs">
                {emptyIcon || <Inbox className="w-7 h-7" />}
              </div>
              <h3 className="text-lg font-bold text-[#14233B] mb-1.5">{emptyTitle}</h3>
              <p className="text-sm text-[#68798A] leading-relaxed">{emptyDescription}</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-[#EEF7F6]/90 border-b border-[#E2ECEC] text-[11px] font-bold text-[#073B3A] uppercase tracking-wider">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key, col.sortable)}
                      className={`px-5 py-4 select-none whitespace-nowrap ${
                        col.sortable ? 'cursor-pointer hover:text-[#008F89] transition-colors' : ''
                      } ${col.className || ''}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{col.header}</span>
                        {col.sortable && (
                          <ArrowUpDown
                            className={`w-3.5 h-3.5 ${
                              sortKey === col.key ? 'text-[#008F89]' : 'text-[#68798A]/70'
                            }`}
                          />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2ECEC]/80 text-[#14233B]">
                {currentPageData.map((item) => (
                  <tr
                    key={rowKey(item)}
                    className="hover:bg-[#F6FAFA] transition-colors duration-150"
                  >
                    {columns.map((col) => (
                      <td key={col.key} className={`px-5 py-4 align-middle ${col.className || ''}`}>
                        {col.render ? col.render(item) : String((item as any)[col.key] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {filteredData.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-[#E2ECEC] bg-[#F6FAFA]/70 text-xs text-[#68798A]">
            <div>
              Hiển thị{' '}
              <span className="font-bold text-[#14233B]">{(currentPage - 1) * pageSize + 1}</span> đến{' '}
              <span className="font-bold text-[#14233B]">
                {Math.min(currentPage * pageSize, filteredData.length)}
              </span>{' '}
              trong tổng số <span className="font-bold text-[#008F89]">{filteredData.length}</span> kết quả
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                aria-label="Trang trước"
                className="p-1.5 rounded-xl border border-[#E2ECEC] bg-white text-[#14233B] hover:bg-[#E9F8F5] hover:border-[#BDE8E0] hover:text-[#008F89] disabled:opacity-40 disabled:pointer-events-none transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                const isCurrent = currentPage === pageNum;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`min-w-[32px] h-8 px-2.5 rounded-xl text-xs font-bold transition-all ${
                      isCurrent
                        ? 'bg-[#008F89] text-white shadow-xs shadow-[#008F89]/25'
                        : 'bg-white border border-[#E2ECEC] text-[#14233B] hover:bg-[#E9F8F5]/60 hover:border-[#BDE8E0]'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                aria-label="Trang sau"
                className="p-1.5 rounded-xl border border-[#E2ECEC] bg-white text-[#14233B] hover:bg-[#E9F8F5] hover:border-[#BDE8E0] hover:text-[#008F89] disabled:opacity-40 disabled:pointer-events-none transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
