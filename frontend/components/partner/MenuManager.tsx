'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UtensilsCrossed,
  Plus,
  Search,
  Edit3,
  Eye,
  EyeOff,
  Lock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Check,
  DollarSign,
  Tag,
  Flame,
  Clock,
  HelpCircle,
  Image as ImageIcon,
} from 'lucide-react';
import Image from 'next/image';
import {
  MenuItem,
  CreateMenuItemInput,
  UpdateMenuItemInput,
  getRestaurantMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from '@/lib/api/menu-items';
import { getTastes, type CategoryItem } from '@/lib/api/categories';
import { ApiError } from '@/lib/api/client';
import ToastNotification, { type ToastItem } from '@/components/ui/ToastNotification';
import { getFriendlyErrorMessage } from '@/lib/utils/formatError';

interface MenuManagerProps {
  placeId: number;
  placeName: string;
  isLocked?: boolean;
  onPriceRangeChange?: (priceMin: number | null, priceMax: number | null) => void;
}

export default function MenuManager({
  placeId,
  placeName,
  isLocked = false,
  onPriceRangeChange,
}: MenuManagerProps) {
  // Data State
  const [items, setItems] = useState<MenuItem[]>([]);
  const [tastes, setTastes] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'HIDDEN'>('ALL');
  const [selectedTasteId, setSelectedTasteId] = useState<number | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Confirm Dialog State (for toggle hide/active)
  const [confirmToggleItem, setConfirmToggleItem] = useState<{
    item: MenuItem;
    action: 'HIDE' | 'SHOW';
  } | null>(null);
  const [toggling, setToggling] = useState(false);

  // Toast Notification
  const [toast, setToast] = useState<ToastItem | null>(null);

  // Load menu items & tastes
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [menuData, tasteData] = await Promise.all([
        getRestaurantMenuItems(placeId),
        getTastes().catch(() => [] as CategoryItem[]),
      ]);
      setItems(menuData);
      setTastes(tasteData);

      // Tính khoảng giá tự động từ các món đang bán
      recalculatePriceRange(menuData);
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : 'Không thể tải danh sách thực đơn.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [placeId]);

  // Tự động tính toán khoảng giá từ các món đang bán (is_available = true)
  const recalculatePriceRange = (currentItems: MenuItem[]) => {
    const available = currentItems.filter((i) => i.is_available);
    if (available.length === 0) {
      if (onPriceRangeChange) onPriceRangeChange(null, null);
      return { min: null, max: null };
    }
    const prices = available.map((i) => i.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (onPriceRangeChange) onPriceRangeChange(min, max);
    return { min, max };
  };

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = items.length;
    const active = items.filter((i) => i.is_available).length;
    const hidden = total - active;
    const availableItems = items.filter((i) => i.is_available);
    const minPrice = availableItems.length > 0 ? Math.min(...availableItems.map((i) => i.price)) : null;
    const maxPrice = availableItems.length > 0 ? Math.max(...availableItems.map((i) => i.price)) : null;

    return { total, active, hidden, minPrice, maxPrice };
  }, [items]);

  // Lọc danh sách món ăn
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 1. Lọc từ khóa tìm kiếm
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = item.name.toLowerCase().includes(query);
        const matchDesc = item.description?.toLowerCase().includes(query) ?? false;
        if (!matchName && !matchDesc) return false;
      }

      // 2. Lọc trạng thái
      if (statusFilter === 'ACTIVE' && !item.is_available) return false;
      if (statusFilter === 'HIDDEN' && item.is_available) return false;

      // 3. Lọc khẩu vị
      if (selectedTasteId !== null) {
        const hasTaste = item.tastes.some((t) => t.taste_id === selectedTasteId);
        if (!hasTaste) return false;
      }

      return true;
    });
  }, [items, searchQuery, statusFilter, selectedTasteId]);

  // Mở modal thêm món
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  // Mở modal sửa món
  const handleOpenEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  // Đổi trạng thái Ẩn / Mở bán lại món ăn
  const handleConfirmToggle = async () => {
    if (!confirmToggleItem) return;
    try {
      setToggling(true);
      const { item, action } = confirmToggleItem;
      const newAvailable = action === 'SHOW';

      if (action === 'HIDE') {
        // Có thể dùng DELETE hoặc PUT is_available = false
        await updateMenuItem(item.menu_item_id, { is_available: false });
      } else {
        await updateMenuItem(item.menu_item_id, { is_available: true });
      }

      setToast({
        type: 'success',
        title: 'Thành công',
        message: newAvailable
          ? `Đã mở bán lại món "${item.name}"!`
          : `Đã tạm ngưng món "${item.name}" khỏi thực đơn!`,
      });

      // Cập nhật state local
      const updatedList = items.map((i) =>
        i.menu_item_id === item.menu_item_id ? { ...i, is_available: newAvailable } : i
      );
      setItems(updatedList);
      recalculatePriceRange(updatedList);
      setConfirmToggleItem(null);
    } catch (err: any) {
      const msg = getFriendlyErrorMessage(err);
      setToast({
        type: 'error',
        title: 'Không thể cập nhật món ăn',
        message: msg,
        action:
          err?.status === 401
            ? {
                label: 'Đăng nhập lại',
                href: '/dang-nhap?redirect=/partner/co-so',
              }
            : undefined,
      });
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast thông báo */}
      <ToastNotification toast={toast} onClose={() => setToast(null)} />

      {/* BANNER THỐNG KÊ NHANH & ĐỒNG BỘ KHOẢNG GIÁ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Tổng số món */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shrink-0">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Tổng món ăn</p>
            <p className="text-xl font-extrabold text-slate-900">{stats.total}</p>
          </div>
        </div>

        {/* Card 2: Đang phục vụ */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Đang phục vụ</p>
            <p className="text-xl font-extrabold text-emerald-600">{stats.active}</p>
          </div>
        </div>

        {/* Card 3: Tạm ngưng */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
            <EyeOff className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Tạm ngưng</p>
            <p className="text-xl font-extrabold text-slate-600">{stats.hidden}</p>
          </div>
        </div>

        {/* Card 4: Khoảng giá tự động tính */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-5 border border-amber-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <p className="text-xs font-bold text-amber-800">Khoảng giá quán</p>
              <span className="text-[10px] px-1.5 py-0.2 bg-orange-500 text-white rounded-md font-extrabold">
                Auto
              </span>
            </div>
            <p className="text-sm font-extrabold text-orange-600 truncate mt-0.5">
              {stats.minPrice !== null && stats.maxPrice !== null
                ? stats.minPrice === stats.maxPrice
                  ? `₫${stats.minPrice.toLocaleString('vi-VN')}`
                  : `₫${stats.minPrice.toLocaleString('vi-VN')} - ₫${stats.maxPrice.toLocaleString('vi-VN')}`
                : 'Chưa có món bán'}
            </p>
          </div>
        </div>
      </div>

      {/* THANH ĐIỀU KHIỂN & BỘ LỌC */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Ô tìm kiếm */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo tên món ăn, mô tả hương vị..."
              className="w-full pl-11 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 transition-all font-medium text-slate-800 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Nút Thêm món mới */}
          {isLocked ? (
            <div className="relative group">
              <button
                disabled
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-400 rounded-2xl text-xs font-bold cursor-not-allowed border border-slate-200"
              >
                <Lock className="w-4 h-4" /> + Thêm món mới
              </button>
              <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block z-50 w-56 p-2 bg-slate-900 text-white text-[11px] font-semibold rounded-xl shadow-lg text-center leading-snug">
                Quán đang bị Admin khóa - không thể thêm món
              </div>
            </div>
          ) : (
            <button
              onClick={handleOpenCreateModal}
              type="button"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-teal-600/20 active:scale-95"
            >
              <Plus className="w-4 h-4" /> Thêm món mới
            </button>
          )}
        </div>

        {/* Hàng bộ lọc: Trạng thái & Khẩu vị */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          {/* Pills Trạng thái */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl">
            {(
              [
                { key: 'ALL', label: `Tất cả (${stats.total})` },
                { key: 'ACTIVE', label: `Đang phục vụ (${stats.active})` },
                { key: 'HIDDEN', label: `Tạm ngưng (${stats.hidden})` },
              ] as const
            ).map((pill) => (
              <button
                key={pill.key}
                onClick={() => setStatusFilter(pill.key)}
                className={`relative px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === pill.key ? 'text-teal-900' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {statusFilter === pill.key && (
                  <motion.div
                    layoutId="menuStatusPill"
                    className="absolute inset-0 bg-white rounded-xl shadow-xs"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <span className="relative z-10">{pill.label}</span>
              </button>
            ))}
          </div>

          {/* Dropdown / Pills Khẩu vị */}
          {tastes.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
              <span className="text-[11px] font-bold text-slate-400 shrink-0 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-500" /> Khẩu vị:
              </span>
              <button
                onClick={() => setSelectedTasteId(null)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all shrink-0 ${
                  selectedTasteId === null
                    ? 'bg-amber-100 text-amber-800 font-bold border border-amber-300'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất cả
              </button>
              {tastes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTasteId(selectedTasteId === t.id ? null : t.id)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all shrink-0 ${
                    selectedTasteId === t.id
                      ? 'bg-amber-100 text-amber-800 font-bold border border-amber-300'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* DANH SÁCH MÓN ĂN (GRID CARDS) */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4 animate-pulse"
            >
              <div className="w-full h-44 bg-slate-100 rounded-2xl" />
              <div className="h-5 bg-slate-100 rounded-xl w-3/4" />
              <div className="h-4 bg-slate-100 rounded-xl w-1/2" />
              <div className="h-8 bg-slate-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200/80 shadow-xs text-center space-y-4">
          <div className="w-16 h-16 bg-slate-50 border border-slate-200 text-slate-400 rounded-3xl flex items-center justify-center mx-auto">
            <UtensilsCrossed className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-slate-900">
              {searchQuery || statusFilter !== 'ALL' || selectedTasteId !== null
                ? 'Không tìm thấy món ăn phù hợp'
                : 'Thực đơn của quán đang trống'}
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              {searchQuery || statusFilter !== 'ALL' || selectedTasteId !== null
                ? 'Hãy thử xóa từ khóa tìm kiếm hoặc bỏ chọn các bộ lọc khẩu vị để hiển thị đầy đủ món ăn.'
                : 'Hãy bắt đầu đăng các món ăn đặc sắc của quán kèm hình ảnh hấp dẫn và giá cả rõ ràng. Khoảng giá nhà hàng sẽ tự động đồng bộ theo các món bạn tạo.'}
            </p>
          </div>
          {!isLocked && items.length === 0 && (
            <button
              onClick={handleOpenCreateModal}
              type="button"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-teal-600/20 active:scale-95"
            >
              <Plus className="w-4 h-4" /> Thêm món đầu tiên
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredItems.map((item, idx) => (
              <motion.div
                key={item.menu_item_id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, delay: idx * 0.03 }}
                className={`group bg-white rounded-3xl border shadow-xs overflow-hidden flex flex-col justify-between transition-all hover:shadow-md ${
                  item.is_available
                    ? 'border-slate-200/90 hover:border-teal-300'
                    : 'border-slate-200/60 bg-slate-50/50 opacity-80'
                }`}
              >
                {/* Phần trên: Ảnh & Badges */}
                <div>
                  <div className="relative w-full h-44 bg-slate-100 overflow-hidden">
                    {item.image_url ? (
                      <Image
                        src={item.image_url}
                        alt={item.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100 gap-1.5">
                        <ImageIcon className="w-8 h-8 stroke-1" />
                        <span className="text-[11px] font-semibold">Chưa có ảnh món</span>
                      </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                    {/* Status Badge ở góc trên bên trái */}
                    <div className="absolute top-3 left-3">
                      {item.is_available ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500 text-white shadow-md">
                          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                          Đang bán
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-700/90 text-slate-200 shadow-md">
                          <EyeOff className="w-3 h-3" /> Tạm ngưng
                        </span>
                      )}
                    </div>

                    {/* Giá tiền ở góc dưới bên trái của ảnh */}
                    <div className="absolute bottom-3 left-3">
                      <span className="px-3 py-1 bg-white/95 backdrop-blur-md text-orange-600 rounded-xl font-extrabold text-sm shadow-md">
                        ₫{item.price.toLocaleString('vi-VN')}
                      </span>
                    </div>
                  </div>

                  {/* Nội dung thông tin món ăn */}
                  <div className="p-5 space-y-3">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-base leading-snug group-hover:text-teal-700 transition-colors">
                        {item.name}
                      </h4>
                      {item.description ? (
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 italic mt-1">Chưa có mô tả món</p>
                      )}
                    </div>

                    {/* Khẩu vị / Tastes tags */}
                    {item.tastes && item.tastes.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {item.tastes.map((taste) => (
                          <span
                            key={taste.taste_id}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80"
                          >
                            <Flame className="w-2.5 h-2.5 text-amber-600" />
                            {taste.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Phần dưới: Nút Thao tác (Sửa, Ẩn/Hiện) */}
                <div className="px-5 pb-5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400 font-medium">
                    ID: #{item.menu_item_id}
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Nút Sửa */}
                    {isLocked ? (
                      <button
                        disabled
                        title="Quán đang bị Admin khóa"
                        className="p-2 rounded-xl bg-slate-100 text-slate-300 cursor-not-allowed"
                      >
                        <Lock className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        type="button"
                        title="Chỉnh sửa món"
                        className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 active:scale-95 transition-all"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}

                    {/* Nút Ẩn / Mở bán lại */}
                    {isLocked ? (
                      <button
                        disabled
                        className="p-2 rounded-xl bg-slate-100 text-slate-300 cursor-not-allowed"
                      >
                        <Lock className="w-4 h-4" />
                      </button>
                    ) : item.is_available ? (
                      <button
                        onClick={() => setConfirmToggleItem({ item, action: 'HIDE' })}
                        type="button"
                        title="Tạm ngưng phục vụ món này"
                        className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all"
                      >
                        <EyeOff className="w-3.5 h-3.5" /> Tạm ngưng
                      </button>
                    ) : (
                      <button
                        onClick={() => setConfirmToggleItem({ item, action: 'SHOW' })}
                        type="button"
                        title="Mở bán lại món này"
                        className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" /> Bán lại
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL THÊM / CHỈNH SỬA MÓN ĂN */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isModalOpen && (
          <MenuItemModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            placeId={placeId}
            initialItem={editingItem}
            tastes={tastes}
            onSuccess={(savedItem) => {
              setIsModalOpen(false);
              setToast({
                type: 'success',
                title: 'Thành công',
                message: editingItem
                  ? `Đã cập nhật món "${savedItem.name}" thành công!`
                  : `Đã thêm món "${savedItem.name}" vào thực đơn!`,
              });

              // Cập nhật state danh sách món ăn
              let updatedList: MenuItem[];
              if (editingItem) {
                updatedList = items.map((i) =>
                  i.menu_item_id === savedItem.menu_item_id ? savedItem : i
                );
              } else {
                updatedList = [savedItem, ...items];
              }
              setItems(updatedList);
              recalculatePriceRange(updatedList);
            }}
          />
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL XÁC NHẬN ẨN / MỞ BÁN LẠI */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {confirmToggleItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmToggleItem(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200/80 space-y-4"
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  confirmToggleItem.action === 'HIDE'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-teal-100 text-teal-700'
                }`}
              >
                {confirmToggleItem.action === 'HIDE' ? (
                  <EyeOff className="w-6 h-6" />
                ) : (
                  <Eye className="w-6 h-6" />
                )}
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {confirmToggleItem.action === 'HIDE'
                    ? 'Tạm ngưng phục vụ món ăn?'
                    : 'Mở bán lại món ăn này?'}
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {confirmToggleItem.action === 'HIDE' ? (
                    <>
                      Bạn có chắc chắn muốn tạm ngưng món{' '}
                      <span className="font-bold text-slate-900">
                        &quot;{confirmToggleItem.item.name}&quot;
                      </span>
                      ? Khách hàng sẽ không thấy món này trên thực đơn công khai và khoảng giá của
                      nhà hàng sẽ tự động được tính lại từ các món còn bán.
                    </>
                  ) : (
                    <>
                      Món{' '}
                      <span className="font-bold text-slate-900">
                        &quot;{confirmToggleItem.item.name}&quot;
                      </span>{' '}
                      sẽ được mở bán lại trên thực đơn công khai và khoảng giá của quán sẽ tự động
                      được đồng bộ cập nhật.
                    </>
                  )}
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  disabled={toggling}
                  onClick={() => setConfirmToggleItem(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  disabled={toggling}
                  onClick={handleConfirmToggle}
                  className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold transition-all flex items-center gap-2 shadow-md ${
                    confirmToggleItem.action === 'HIDE'
                      ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                      : 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/20'
                  }`}
                >
                  {toggling && <Loader2 className="w-4 h-4 animate-spin" />}
                  {confirmToggleItem.action === 'HIDE' ? 'Tạm ngưng món' : 'Mở bán lại'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENT: MODAL THÊM / SỬA MÓN ĂN
// =============================================================================
interface MenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  placeId: number;
  initialItem: MenuItem | null;
  tastes: CategoryItem[];
  onSuccess: (saved: MenuItem) => void;
}

function MenuItemModal({
  isOpen,
  onClose,
  placeId,
  initialItem,
  tastes,
  onSuccess,
}: MenuItemModalProps) {
  const [name, setName] = useState(initialItem?.name || '');
  const [price, setPrice] = useState<number | ''>(initialItem?.price ?? 45000);
  const [description, setDescription] = useState(initialItem?.description || '');
  const [imageUrl, setImageUrl] = useState(initialItem?.image_url || '');
  const [isAvailable, setIsAvailable] = useState(initialItem?.is_available ?? true);
  const [selectedTasteIds, setSelectedTasteIds] = useState<number[]>(
    initialItem?.tastes ? initialItem.tastes.map((t) => t.taste_id) : []
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = 'Vui lòng nhập tên món ăn';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Tên món phải có ít nhất 2 ký tự';
    } else if (name.trim().length > 150) {
      newErrors.name = 'Tên món không được vượt quá 150 ký tự';
    }

    if (price === '' || isNaN(Number(price))) {
      newErrors.price = 'Vui lòng nhập giá món ăn';
    } else if (Number(price) < 0) {
      newErrors.price = 'Giá món ăn không thể là số âm';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleToggleTaste = (tasteId: number) => {
    setSelectedTasteIds((prev) =>
      prev.includes(tasteId) ? prev.filter((id) => id !== tasteId) : [...prev, tasteId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      const payload: CreateMenuItemInput = {
        name: name.trim(),
        price: Number(price),
        description: description.trim() || undefined,
        image_url: imageUrl.trim() || undefined,
        is_available: isAvailable,
        taste_ids: selectedTasteIds,
      };

      let saved: MenuItem;
      if (initialItem) {
        saved = await updateMenuItem(initialItem.menu_item_id, payload);
      } else {
        saved = await createMenuItem(placeId, payload);
      }
      onSuccess(saved);
    } catch (err: any) {
      const msg = getFriendlyErrorMessage(err);
      const lower = msg.toLowerCase();
      if (lower.includes('tên') || lower.includes('name')) {
        setErrors((prev) => ({ ...prev, name: msg }));
      } else if (lower.includes('giá') || lower.includes('price')) {
        setErrors((prev) => ({ ...prev, price: msg }));
      } else {
        setErrors((prev) => ({ ...prev, form: msg }));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
      />

      {/* Modal Box */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden my-8 z-10"
      >
        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                {initialItem ? 'Chỉnh sửa món ăn' : 'Thêm món mới vào thực đơn'}
              </h3>
              <p className="text-xs text-slate-500">
                Khoảng giá của quán sẽ tự động cập nhật sau khi lưu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {errors.form && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.form}</span>
            </div>
          )}

          {/* Tên món ăn */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Tên món ăn *</span>
              {name.trim() && !errors.name && (
                <span className="text-[11px] text-emerald-600 flex items-center gap-1 font-semibold">
                  <Check className="w-3.5 h-3.5" /> Hợp lệ
                </span>
              )}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
              }}
              placeholder="VD: Cơm Niêu Sườn Rim, Mì Quảng Tôm Thịt..."
              className={`w-full px-4 py-3 text-sm bg-slate-50 border rounded-2xl focus:bg-white focus:outline-none transition-all ${
                errors.name
                  ? 'border-rose-400 ring-2 ring-rose-400/20 bg-rose-50/20'
                  : 'border-slate-300 focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500'
              }`}
            />
            {errors.name && (
              <p className="text-xs text-rose-500 font-medium mt-1">{errors.name}</p>
            )}
          </div>

          {/* Giá bán & Trạng thái phục vụ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Giá bán */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Giá bán (VNĐ) *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-600 font-bold text-sm">
                  ₫
                </span>
                <input
                  type="number"
                  step="1000"
                  min="0"
                  value={price}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : Number(e.target.value);
                    setPrice(val);
                    if (errors.price) setErrors((prev) => ({ ...prev, price: '' }));
                  }}
                  className={`w-full pl-9 pr-4 py-3 text-sm bg-slate-50 border rounded-2xl focus:bg-white focus:outline-none transition-all font-semibold text-slate-900 ${
                    errors.price
                      ? 'border-rose-400 ring-2 ring-rose-400/20'
                      : 'border-slate-300 focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500'
                  }`}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Hiển thị: ₫{Number(price || 0).toLocaleString('vi-VN')}
              </p>
              {errors.price && (
                <p className="text-xs text-rose-500 font-medium mt-1">{errors.price}</p>
              )}
            </div>

            {/* Trạng thái mở bán */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Trạng thái món
              </label>
              <div
                onClick={() => setIsAvailable(!isAvailable)}
                className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between transition-all select-none ${
                  isAvailable
                    ? 'bg-emerald-50/60 border-emerald-300 text-emerald-900'
                    : 'bg-slate-50 border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                    }`}
                  />
                  <span className="text-xs font-bold">
                    {isAvailable ? 'Đang phục vụ' : 'Tạm ngưng'}
                  </span>
                </div>
                <div
                  className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${
                    isAvailable ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <motion.div
                    layout
                    className="w-4 h-4 bg-white rounded-full shadow-xs"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Link hình ảnh món ăn */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Link hình ảnh món (URL)</span>
              <span className="text-[11px] text-slate-400">Không bắt buộc</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-dish..."
                className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
              />
              {imageUrl && (
                <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                  <Image src={imageUrl} alt="Preview" fill className="object-cover" />
                </div>
              )}
            </div>
          </div>

          {/* Khẩu vị / Tastes */}
          {tastes.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-500" /> Khẩu vị & Đặc trưng món
              </label>
              <div className="flex flex-wrap gap-2">
                {tastes.map((taste) => {
                  const isChecked = selectedTasteIds.includes(taste.id);
                  return (
                    <button
                      key={taste.id}
                      type="button"
                      onClick={() => handleToggleTaste(taste.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 select-none ${
                        isChecked
                          ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/20'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {isChecked ? <Check className="w-3.5 h-3.5" /> : null}
                      {taste.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mô tả món ăn */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Mô tả ngắn hương vị / nguyên liệu</span>
              <span className="text-[11px] text-slate-400">{description.length}/500</span>
            </label>
            <textarea
              rows={3}
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="VD: Món cơm niêu chuẩn vị miền Trung, hạt cơm dẻo thơm, ăn kèm sườn non rim mặn ngọt đậm đà..."
              className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 leading-relaxed"
            />
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-md shadow-teal-600/20 flex items-center gap-2 active:scale-95"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {initialItem ? 'Cập nhật món' : 'Lưu món ăn'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
