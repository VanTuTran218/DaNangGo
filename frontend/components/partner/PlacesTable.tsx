'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import type { PartnerPlace } from '@/types/partner';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  Eye,
  EyeOff,
  Edit3,
  Lock,
  Clock,
  MapPin,
  Utensils,
  UtensilsCrossed,
  Plus,
  RefreshCw,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface PlacesTableProps {
  places: PartnerPlace[];
  loading?: boolean;
  error?: string | null;
  onReload?: () => void;
  isAccountLocked?: boolean;
  onSelectDetail: (place: PartnerPlace) => void;
  onToggleStatus: (place: PartnerPlace, targetStatus: 'ACTIVE' | 'HIDDEN') => void;
}

export default function PlacesTable({
  places,
  loading = false,
  error = null,
  onReload,
  isAccountLocked = false,
  onSelectDetail,
  onToggleStatus,
}: PlacesTableProps) {
  const [lockedTooltipId, setLockedTooltipId] = useState<string | null>(null);

  // 1. LOADING SKELETON
  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/70 border border-slate-100 animate-pulse"
            >
              <div className="w-14 h-14 rounded-2xl bg-slate-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded-md w-1/3" />
                <div className="h-3 bg-slate-200 rounded-md w-1/2" />
              </div>
              <div className="h-7 bg-slate-200 rounded-full w-24 hidden md:block" />
              <div className="h-6 bg-slate-200 rounded-md w-16 hidden md:block" />
              <div className="h-8 bg-slate-200 rounded-xl w-24 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. ERROR STATE
  if (error) {
    return (
      <div className="bg-white rounded-3xl border border-rose-200/80 p-8 md:p-12 text-center shadow-xs space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div className="max-w-md mx-auto">
          <h3 className="text-base font-bold text-slate-900">Không thể tải danh sách cơ sở</h3>
          <p className="text-xs text-rose-700 mt-1">{error}</p>
        </div>
        {onReload && (
          <button
            onClick={onReload}
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-600/20 active:scale-95"
          >
            <RefreshCw className="w-4 h-4" /> Thử lại
          </button>
        )}
      </div>
    );
  }

  // 3. EMPTY STATE
  if (places.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-8 md:p-16 text-center shadow-xs space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center mx-auto">
          <Utensils className="w-8 h-8" />
        </div>
        <div className="max-w-md mx-auto">
          <h3 className="text-lg font-bold text-slate-900">Chưa có quán ăn nào</h3>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Bạn chưa đăng tải cơ sở nào trong danh mục hoặc trạng thái này. Hãy bắt đầu bằng cách thêm quán đầu tiên để đón khách du lịch Đà Nẵng!
          </p>
        </div>
        {!isAccountLocked && (
          <div className="pt-2">
            <Link
              href="/partner/co-so/tao-moi"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-teal-600/20 active:scale-95"
            >
              <Plus className="w-4 h-4" /> Thêm quán đầu tiên
            </Link>
          </div>
        )}
      </div>
    );
  }

  // 4. DATA TABLE (Desktop) + CARD LIST (Mobile)
  return (
    <div className="space-y-4">
      {/* ===== MOBILE CARDS (Hidden on MD+) ===== */}
      <div className="md:hidden space-y-3">
        <AnimatePresence>
          {places.map((place, idx) => {
            const isPlaceLocked = place.status === 'LOCKED';
            const isActive = place.status === 'ACTIVE' || place.status === 'APPROVED';
            const isHidden = place.status === 'HIDDEN';

            return (
              <motion.div
                key={place.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, delay: idx * 0.04 }}
                className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3"
              >
                <div className="flex items-start gap-3">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200/60">
                    {place.images && place.images[0] ? (
                      <Image src={place.images[0]} alt={place.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-teal-600 font-bold text-xs bg-teal-50">
                        IMG
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-slate-900 text-sm truncate">{place.name}</h4>
                      <StatusBadge status={place.status} />
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      {place.area || 'Đà Nẵng'} - {place.address}
                    </p>
                    <p className="text-xs font-semibold text-orange-600 mt-1">
                      ₫{place.priceMin?.toLocaleString('vi-VN') || 0}{' '}
                      {place.priceMax ? `- ₫${place.priceMax.toLocaleString('vi-VN')}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-1 text-slate-500 font-medium">
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                    <span>{(place.viewCount ?? 0).toLocaleString('vi-VN')} lượt xem</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Xem chi tiết */}
                    <button
                      onClick={() => onSelectDetail(place)}
                      type="button"
                      className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-teal-600 active:scale-95"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Sửa */}
                    {isPlaceLocked ? (
                      <button
                        disabled
                        title="Quán đang bị Admin khóa"
                        className="p-1.5 rounded-lg bg-rose-50 text-rose-400 cursor-not-allowed"
                      >
                        <Lock className="w-4 h-4" />
                      </button>
                    ) : isAccountLocked ? (
                      <button disabled className="p-1.5 rounded-lg bg-slate-100 text-slate-300 cursor-not-allowed">
                        <Lock className="w-4 h-4" />
                      </button>
                    ) : (
                      <Link
                        href={`/partner/co-so/${place.id}/sua`}
                        className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 active:scale-95"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Link>
                    )}

                    {/* Quản lý thực đơn */}
                    {!isAccountLocked && (
                      <Link
                        href={`/partner/co-so/${place.id}/sua?tab=menu`}
                        title="Quản lý thực đơn món ăn"
                        className="p-1.5 rounded-lg bg-teal-50 text-teal-600 hover:bg-teal-100 active:scale-95"
                      >
                        <UtensilsCrossed className="w-4 h-4" />
                      </Link>
                    )}

                    {/* Ẩn / Hiện */}
                    {isPlaceLocked || isAccountLocked ? (
                      <button disabled className="p-1.5 rounded-lg bg-slate-100 text-slate-300 cursor-not-allowed">
                        <Lock className="w-4 h-4" />
                      </button>
                    ) : isActive ? (
                      <button
                        onClick={() => onToggleStatus(place, 'HIDDEN')}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-700 font-semibold text-xs flex items-center gap-1 active:scale-95"
                      >
                        <EyeOff className="w-3.5 h-3.5" /> Ẩn
                      </button>
                    ) : isHidden ? (
                      <button
                        onClick={() => onToggleStatus(place, 'ACTIVE')}
                        className="px-2.5 py-1.5 rounded-lg bg-teal-50 text-teal-700 font-semibold text-xs flex items-center gap-1 active:scale-95"
                      >
                        <Eye className="w-3.5 h-3.5" /> Hiện
                      </button>
                    ) : null}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ===== DESKTOP TABLE (Hidden on Mobile) ===== */}
      <div className="hidden md:block bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/60 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
              <th className="py-4 px-6">Tên cơ sở / Ẩm thực</th>
              <th className="py-4 px-4 text-center">Trạng thái</th>
              <th className="py-4 px-4 text-center">Lượt xem</th>
              <th className="py-4 px-6 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            <AnimatePresence>
              {places.map((place, idx) => {
                const isPlaceLocked = place.status === 'LOCKED';
                const isActive = place.status === 'ACTIVE' || place.status === 'APPROVED';
                const isHidden = place.status === 'HIDDEN';

                return (
                  <motion.tr
                    key={place.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.25, delay: idx * 0.03 }}
                    className="hover:bg-teal-50/20 transition-all group"
                  >
                    {/* Cột 1: Tên cơ sở */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3.5">
                        <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200/70 shadow-xs">
                          {place.images && place.images[0] ? (
                            <Image src={place.images[0]} alt={place.name} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-teal-600 font-bold text-xs bg-teal-50">
                              IMG
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors text-sm truncate">
                            {place.name}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                            {place.area || 'Đà Nẵng'} • {place.address}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
                              ₫{place.priceMin?.toLocaleString('vi-VN') || 0}{' '}
                              {place.priceMax ? `- ₫${place.priceMax.toLocaleString('vi-VN')}` : ''}
                            </span>
                            {place.cuisineName && (
                              <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                {place.cuisineName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Cột 2: Trạng thái */}
                    <td className="py-4 px-4 text-center">
                      <StatusBadge status={place.status} />
                    </td>

                    {/* Cột 3: Lượt xem */}
                    <td className="py-4 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200/60 font-semibold text-xs text-slate-700">
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        <span>{(place.viewCount ?? 0).toLocaleString('vi-VN')}</span>
                      </div>
                    </td>

                    {/* Cột 4: Thao tác */}
                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {/* Nút Xem chi tiết */}
                        <button
                          onClick={() => onSelectDetail(place)}
                          title="Xem chi tiết"
                          type="button"
                          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-teal-700 active:scale-95 transition-all"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Nút Sửa cơ sở với Tooltip khi LOCKED */}
                        {isPlaceLocked ? (
                          <div className="relative inline-block">
                            <button
                              disabled
                              type="button"
                              onMouseEnter={() => setLockedTooltipId(place.id)}
                              onMouseLeave={() => setLockedTooltipId(null)}
                              className="p-2 rounded-xl bg-rose-50 text-rose-500 cursor-not-allowed"
                            >
                              <Lock className="w-4 h-4" />
                            </button>
                            <AnimatePresence>
                              {lockedTooltipId === place.id && (
                                <motion.div
                                  initial={{ opacity: 0, y: 6, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: 4, scale: 0.95 }}
                                  transition={{ duration: 0.15 }}
                                  className="absolute bottom-full right-0 mb-2 z-50 w-52 p-2.5 bg-slate-900 text-white text-[11px] font-semibold rounded-xl shadow-xl text-center leading-snug pointer-events-none"
                                >
                                  Quán đang bị Admin khóa - không thể chỉnh sửa
                                  <div className="absolute top-full right-3 border-4 border-transparent border-t-slate-900" />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ) : isAccountLocked ? (
                          <button
                            disabled
                            type="button"
                            title="Hồ sơ đối tác chưa được duyệt"
                            className="p-2 rounded-xl bg-slate-100 text-slate-300 cursor-not-allowed"
                          >
                            <Lock className="w-4 h-4" />
                          </button>
                        ) : (
                          <Link
                            href={`/partner/co-so/${place.id}/sua`}
                            title="Chỉnh sửa quán"
                            className="p-2 rounded-xl text-blue-600 hover:bg-blue-50 hover:text-blue-700 active:scale-95 transition-all"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Link>
                        )}

                        {/* Nút Quản lý thực đơn */}
                        {!isAccountLocked && (
                          <Link
                            href={`/partner/co-so/${place.id}/sua?tab=menu`}
                            title="Quản lý thực đơn món ăn (Tự động đồng bộ giá)"
                            className="p-2 rounded-xl text-teal-600 hover:bg-teal-50 hover:text-teal-700 active:scale-95 transition-all"
                          >
                            <UtensilsCrossed className="w-4 h-4" />
                          </Link>
                        )}

                        {/* Nút Ẩn / Hiện (Toggle Status) */}
                        {isPlaceLocked ? (
                          <button
                            disabled
                            type="button"
                            title="Quán đang bị Admin khóa - Chỉ Admin mới có quyền mở khóa"
                            className="p-2 rounded-xl bg-slate-100 text-slate-300 cursor-not-allowed"
                          >
                            <Lock className="w-4 h-4 text-slate-300" />
                          </button>
                        ) : isAccountLocked ? (
                          <button
                            disabled
                            type="button"
                            className="p-2 rounded-xl bg-slate-100 text-slate-300 cursor-not-allowed"
                          >
                            <Lock className="w-4 h-4" />
                          </button>
                        ) : isActive ? (
                          <button
                            onClick={() => onToggleStatus(place, 'HIDDEN')}
                            title="Ẩn quán này khỏi website"
                            type="button"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 font-bold text-xs transition-all active:scale-95"
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Ẩn</span>
                          </button>
                        ) : isHidden ? (
                          <button
                            onClick={() => onToggleStatus(place, 'ACTIVE')}
                            title="Mở hiển thị lại quán trên website"
                            type="button"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 font-bold text-xs transition-all active:scale-95"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Hiện</span>
                          </button>
                        ) : (
                          <button
                            disabled
                            type="button"
                            title="Quán đang chờ phê duyệt"
                            className="p-2 rounded-xl bg-amber-50 text-amber-400 cursor-not-allowed"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}
