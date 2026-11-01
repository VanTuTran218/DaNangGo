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
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 mb-8 space-y-6">
      {/* HEADER SECTION: TIÊU ĐỀ & THANH TÌM KIẾM */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-orange-100 text-orange-600 rounded-xl shadow-sm">
              <Utensils size={18} />
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0f2942]">
              Thực đơn & Khẩu vị đặc trưng
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-500">
            {uniqueMenuItems.length > 0
              ? `Khám phá ${uniqueMenuItems.length} món ngon đang mở bán tại ${restaurantName}`
              : 'Các món ngon đang được nhà hàng cập nhật'}
          </p>
        </div>

        {/* Thanh tìm kiếm món ăn nhanh */}
        <div className="relative w-full sm:w-72">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Tìm theo tên món, nguyên liệu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white focus:border-orange-400 transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* PILLS BỘ LỌC KHẨU VỊ (CÓ HIỆU ỨNG TRƯỢT layoutId) */}
      {availableTastes.length > 0 && (
        <div className="relative flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none pt-1">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider shrink-0 mr-1">
            Khẩu vị:
          </span>

          {/* Nút "Tất cả" */}
          <button
            onClick={() => setActiveTaste('Tất cả')}
            className={`relative px-4 py-2 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${
              activeTaste === 'Tất cả' ? 'text-white' : 'text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {activeTaste === 'Tất cả' && (
              <motion.div
                layoutId="activeTastePill"
                className="absolute inset-0 bg-[#0f2942] rounded-full shadow-sm"
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
                className={`relative px-3.5 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? 'text-white'
                    : `${style.bg} ${style.text} border ${style.border} hover:opacity-90`
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="activeTastePill"
                    className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full shadow-md shadow-orange-500/20"
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
        <div className="py-16 text-center bg-gray-50/80 rounded-2xl border border-dashed border-gray-200 p-8">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-400 flex items-center justify-center mx-auto mb-3">
            <Salad size={32} />
          </div>
          <h3 className="text-base font-bold text-[#0f2942] mb-1">
            Không tìm thấy món ăn phù hợp
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
            Không có món ăn nào khớp với từ khóa &ldquo;{searchQuery}&rdquo; hoặc khẩu vị đang chọn.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setActiveTaste('Tất cả');
            }}
            className="px-4 py-2 bg-white border border-gray-200 text-xs font-semibold text-orange-600 rounded-xl hover:bg-orange-50 transition-all shadow-sm"
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
