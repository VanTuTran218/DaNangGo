'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Utensils, Search, Sparkles, X, Salad } from 'lucide-react';
import type { MenuItemDetail } from '@/lib/api/places';
import MenuCard, { TASTE_CONFIG, DEFAULT_TASTE_STYLE } from './MenuCard';

interface MenuSectionProps {
  menuItems: MenuItemDetail[];
  restaurantName: string;
}

export default function MenuSection({
  menuItems,
  restaurantName,
}: MenuSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTaste, setActiveTaste] = useState<string>('Tất cả');

  // 1. Loại bỏ món ăn trùng lặp (Deduplicate theo menu_item_id và name chuẩn hóa)
  const uniqueMenuItems = useMemo(() => {
    if (!menuItems || menuItems.length === 0) return [];
    const seenIds = new Set<number>();
    const seenNames = new Set<string>();
    const result: MenuItemDetail[] = [];

    for (const item of menuItems) {
      const normalizedName = item.name.trim().toLowerCase();
      if (!seenIds.has(item.menu_item_id) && !seenNames.has(normalizedName)) {
        seenIds.add(item.menu_item_id);
        seenNames.add(normalizedName);
        result.push(item);
      }
    }
    return result;
  }, [menuItems]);

  // 2. Thu thập danh sách các khẩu vị có trong thực đơn quán
  const availableTastes = useMemo(() => {
    const set = new Set<string>();
    uniqueMenuItems.forEach((item) => {
      item.tastes?.forEach((t) => {
        if (t.name) set.add(t.name.trim());
      });
    });
    return Array.from(set);
  }, [uniqueMenuItems]);

  // 3. Lọc danh sách món theo từ khóa tìm kiếm và pill khẩu vị
  const filteredItems = useMemo(() => {
    return uniqueMenuItems.filter((item) => {
      const matchKeyword =
        !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
        (item.description &&
          item.description.toLowerCase().includes(searchQuery.trim().toLowerCase()));

      const matchTaste =
        activeTaste === 'Tất cả' ||
        (item.tastes &&
          item.tastes.some((t) => t.name.toLowerCase() === activeTaste.toLowerCase()));

      return matchKeyword && matchTaste;
    });
  }, [uniqueMenuItems, searchQuery, activeTaste]);

  return (
    <div className="bg-[#FFFDF9] rounded-[16px] p-6 sm:p-8 border border-[#E5DAC8] shadow-[0_14px_38px_rgba(16,40,50,0.05)] mb-8 space-y-6">
      {/* HEADER SECTION: TIÊU ĐỀ & THANH TÌM KIẾM */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8DDCF] pb-5">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="w-9 h-9 rounded-full bg-[#091E27] text-[#E6D9B7] flex items-center justify-center shrink-0">
              <Utensils size={16} />
            </span>
            <h2 className="home-serif text-xl sm:text-2xl font-semibold text-[#102832]">
              Thực đơn &amp; Khẩu vị đặc trưng
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#4F5D63] pl-12">
            {uniqueMenuItems.length > 0
              ? `Khám phá ${uniqueMenuItems.length} món ngon đang mở bán tại ${restaurantName}`
              : 'Các món ngon đang được nhà hàng cập nhật'}
          </p>
        </div>

        {/* Thanh tìm kiếm món ăn nhanh */}
        <div className="relative w-full sm:w-72">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#216B70]"
          />
          <input
            type="text"
            placeholder="Tìm theo tên món, nguyên liệu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-[#F7F2E8] border border-[#E5DAC8] rounded-full text-[#102832] placeholder-[#6E7D82] focus:outline-none focus:bg-white focus:border-[#C9B580] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#738086] hover:text-[#102832] p-0.5 cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* PILLS BỘ LỌC KHẨU VỊ (CÓ HIỆU ỨNG TRƯỢT layoutId) */}
      {availableTastes.length > 0 && (
        <div className="relative flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none pt-1">
          <span className="text-[11px] font-semibold text-[#6E7D82] uppercase tracking-[0.16em] shrink-0 mr-1">
            Khẩu vị:
          </span>

          {/* Nút "Tất cả" */}
          <button
            onClick={() => setActiveTaste('Tất cả')}
            className={`relative px-4 py-2 rounded-full text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              activeTaste === 'Tất cả' ? 'text-[#FFFDF5]' : 'text-[#4F5D63] hover:text-[#102832] bg-[#F7F2E8] border border-[#E5DAC8] hover:border-[#C9B580]'
            }`}
          >
            {activeTaste === 'Tất cả' && (
              <motion.div
                layoutId="activeTastePill"
                className="absolute inset-0 bg-[#091E27] rounded-full"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">Tất cả ({uniqueMenuItems.length})</span>
          </button>

          {/* Các khẩu vị riêng biệt */}
          {availableTastes.map((taste) => {
            const isSelected = activeTaste === taste;
            const style = TASTE_CONFIG[taste] || DEFAULT_TASTE_STYLE;

            return (
              <button
                key={taste}
                onClick={() => setActiveTaste(taste)}
                className={`relative px-3.5 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'text-white'
                    : `${style.bg} ${style.text} border ${style.border} hover:opacity-90`
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="activeTastePill"
                    className="absolute inset-0 bg-[#CB712D] rounded-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1">
                  <Sparkles size={11} className={isSelected ? 'text-white' : style.text} />
                  <span>{taste}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* LƯỚI THỰC ĐƠN CÂN XỨNG (ITEMS-STRETCH) */}
      {filteredItems.length === 0 ? (
        // Empty state khi không tìm thấy món phù hợp
        <div className="py-16 text-center bg-[#F8F8F4] rounded-[4px] border border-dashed border-[#DEDAD2] p-8">
          <div className="w-16 h-16 rounded-[4px] bg-[#E87B39]/12 text-[#E87B39] flex items-center justify-center mx-auto mb-3">
            <Salad size={32} />
          </div>
          <h3 className="text-base font-bold text-[#102832] mb-1">
            Không tìm thấy món ăn phù hợp
          </h3>
          <p className="text-xs text-[#4F5D63] max-w-sm mx-auto mb-4">
            Không có món ăn nào khớp với từ khóa &ldquo;{searchQuery}&rdquo; hoặc khẩu vị đang chọn.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setActiveTaste('Tất cả');
            }}
            className="px-4 py-2 bg-white border border-[#DEDAD2] text-xs font-semibold text-[#E87B39] rounded-[2px] hover:bg-[#F1EFE7] transition-all"
          >
            Xóa bộ lọc tìm kiếm
          </button>
        </div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch"
        >
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, index) => (
              <MenuCard key={item.menu_item_id} item={item} index={index} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
