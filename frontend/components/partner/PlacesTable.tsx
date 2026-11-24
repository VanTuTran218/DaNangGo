'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import type { PartnerPlace, ServiceType } from '@/types/partner';
import PartnerStatusBadge from '@/components/partner/PartnerStatusBadge';
import {
  Eye,
  EyeOff,
  Edit3,
  Lock,
  Clock,
  MapPin,
  Utensils,
  UtensilsCrossed,
  Bed,
  Plus,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

interface PlacesTableProps {
  places: PartnerPlace[];
  loading?: boolean;
  error?: string | null;
  onReload?: () => void;
  isAccountLocked?: boolean;
  serviceType?: ServiceType;
  onSelectDetail: (place: PartnerPlace) => void;
  onToggleStatus: (place: PartnerPlace, targetStatus: 'ACTIVE' | 'HIDDEN') => void;
}

export default function PlacesTable({
  places,
  loading = false,
  error = null,
  onReload,
  isAccountLocked = false,
  serviceType = 'TABLE',
  onSelectDetail,
  onToggleStatus,
}: PlacesTableProps) {
  const [lockedTooltipId, setLockedTooltipId] = useState<string | null>(null);

  // 1. LOADING SKELETON
  if (loading) {
    return (
      <div className="bg-white rounded-[20px] border border-[#E2ECEC] shadow-xs overflow-hidden">
        <div className="p-6 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-4 rounded-2xl bg-[#F6FAFA] border border-[#E2ECEC] animate-pulse"
            >
              <div className="w-16 h-16 rounded-2xl bg-slate-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded-md w-1/3" />
                <div className="h-3 bg-slate-200 rounded-md w-1/2" />
              </div>
              <div className="h-7 bg-slate-200 rounded-full w-24 hidden md:block" />
              <div className="h-6 bg-slate-200 rounded-md w-16 hidden md:block" />
              <div className="h-9 bg-slate-200 rounded-xl w-28 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. ERROR STATE
  if (error) {
    return (
      <div className="bg-white rounded-[20px] border border-rose-200/80 p-8 md:p-12 text-center shadow-xs space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div className="max-w-md mx-auto">
          <h3 className="text-base font-bold text-[#14233B]">Không thể tải danh sách cơ sở</h3>
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
      <div className="relative overflow-hidden bg-white rounded-[20px] border border-[#E2ECEC] p-10 md:p-16 text-center shadow-xs space-y-4">
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

        <div className="relative z-10 w-16 h-16 rounded-full bg-[#E9F8F5] border border-[#BDE8E0] text-[#008F89] flex items-center justify-center mx-auto">
          {serviceType === 'STAY' ? <Bed className="w-7 h-7" /> : <Utensils className="w-7 h-7" />}
        </div>
        <div className="relative z-10 max-w-md mx-auto">
          <h3 className="text-lg font-bold text-[#14233B]">
            {serviceType === 'STAY'
              ? 'Chưa có cơ sở lưu trú nào'
              : serviceType === 'TICKET'
              ? 'Chưa có điểm tham quan nào'
              : 'Chưa có quán ăn nào'}
          </h3>
          <p className="text-xs sm:text-sm text-[#68798A] mt-1.5 leading-relaxed">
            {serviceType === 'STAY'
              ? 'Bạn chưa đăng tải cơ sở lưu trú nào trong danh mục hoặc trạng thái này. Hãy bắt đầu bằng cách thêm nơi lưu trú đầu tiên để đón khách du lịch Đà Nẵng!'
              : 'Bạn chưa đăng tải cơ sở nào trong danh mục hoặc trạng thái này. Hãy bắt đầu bằng cách thêm cơ sở đầu tiên để đón khách du lịch Đà Nẵng!'}
          </p>
        </div>
        {!isAccountLocked && (
          <div className="relative z-10 pt-2">
            <Link
              href="/partner/co-so/tao-moi"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF8A24] hover:bg-[#f07b16] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#FF8A24]/20 active:scale-95"
            >
              <Plus className="w-4 h-4" />{' '}
              {serviceType === 'STAY' ? 'Thêm cơ sở lưu trú đầu tiên' : 'Thêm quán đầu tiên'}
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
      <div className="md:hidden space-y-3.5">
        <AnimatePresence>
          {places.map((place, idx) => {
            const isPlaceLocked = place.status === 'LOCKED';
            const isActive = place.status === 'ACTIVE' || place.status === 'APPROVED';
            const isHidden = place.status === 'HIDDEN';
            const isAcc = place.category === 'luutru' || place.placeType === 'ACCOMMODATION';

            return (
              <motion.div
                key={place.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, delay: idx * 0.04 }}
                className="bg-white rounded-[20px] p-4 border border-[#E2ECEC] shadow-xs space-y-3.5"
              >
                <div className="flex items-start gap-3.5">
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-[#F6FAFA] shrink-0 border border-[#E2ECEC]">
                    {place.images && place.images[0] ? (
                      <Image src={place.images[0]} alt={place.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#008F89] font-bold text-xs bg-[#E9F8F5]">
                        {isAcc ? <Bed className="w-5 h-5" /> : <Utensils className="w-5 h-5" />}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-[#14233B] text-sm truncate">{place.name}</h4>
                      <PartnerStatusBadge status={place.status} size="sm" />
                    </div>
                    <p className="text-xs text-[#68798A] mt-1 line-clamp-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#008F89] shrink-0" />
                      {place.area || 'Đà Nẵng'} - {place.address}
                    </p>
                    <p className="text-xs font-bold text-[#FF8A24] mt-1">
                      ₫{place.priceMin?.toLocaleString('vi-VN') || 0}{' '}
                      {place.priceMax ? `- ₫${place.priceMax.toLocaleString('vi-VN')}` : ''}
                      {isAcc ? ' / đêm' : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-[#E2ECEC] text-xs">
                  <div className="flex items-center gap-1.5 text-[#68798A] font-medium">
                    <Eye className="w-3.5 h-3.5 text-[#008F89]" />
                    <span>{(place.viewCount ?? 0).toLocaleString('vi-VN')} lượt xem</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onSelectDetail(place)}
                      type="button"
                      className="p-2 rounded-xl bg-[#F6FAFA] border border-[#E2ECEC] text-[#14233B] hover:text-[#008F89] active:scale-95"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {isPlaceLocked ? (
                      <button
                        disabled
                        title="Cơ sở đang bị Admin khóa"
                        className="p-2 rounded-xl bg-rose-50 text-rose-400 cursor-not-allowed"
                      >
                        <Lock className="w-4 h-4" />
                      </button>
                    ) : isAccountLocked ? (
                      <button
                        disabled
                        className="p-2 rounded-xl bg-slate-100 text-slate-300 cursor-not-allowed"
                      >
                        <Lock className="w-4 h-4" />
                      </button>
                    ) : (
                      <Link
                        href={`/partner/co-so/${place.id}/sua`}
                        className="p-2 rounded-xl bg-sky-50 text-[#087CB2] hover:bg-sky-100 active:scale-95"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Link>
                    )}

                    {!isAccountLocked && (
                      <Link
                        href={`/partner/co-so/${place.id}/sua?tab=${isAcc ? 'rooms' : 'menu'}`}
                        title={isAcc ? 'Quản lý loại phòng & bảng giá' : 'Quản lý thực đơn món ăn'}
                        className="p-2 rounded-xl bg-[#E9F8F5] text-[#008F89] hover:bg-[#BDE8E0]/50 active:scale-95"
                      >
                        {isAcc ? <Bed className="w-4 h-4" /> : <UtensilsCrossed className="w-4 h-4" />}
                      </Link>
                    )}

                    {isPlaceLocked || isAccountLocked ? (
                      <button
                        disabled
                        className="p-2 rounded-xl bg-slate-100 text-slate-300 cursor-not-allowed"
                      >
                        <Lock className="w-4 h-4" />
                      </button>
                    ) : isActive ? (
                      <button
                        onClick={() => onToggleStatus(place, 'HIDDEN')}
                        className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-700 font-bold text-xs flex items-center gap-1 active:scale-95"
                      >
                        <EyeOff className="w-3.5 h-3.5" /> Ẩn
                      </button>
                    ) : isHidden ? (
                      <button
                        onClick={() => onToggleStatus(place, 'ACTIVE')}
                        className="px-3 py-1.5 rounded-xl bg-[#E9F8F5] border border-[#BDE8E0] text-[#008F89] font-bold text-xs flex items-center gap-1 active:scale-95"
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
      <div className="hidden md:block bg-white rounded-[20px] border border-[#E2ECEC] shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E2ECEC] bg-[#EEF7F6]/90 text-[#073B3A] uppercase text-[11px] font-bold tracking-wider">
              <th className="py-4 px-6">Tên cơ sở & Phân loại</th>
              <th className="py-4 px-4 text-center">Trạng thái</th>
              <th className="py-4 px-4 text-center">Lượt xem</th>
              <th className="py-4 px-6 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2ECEC]/80 text-sm">
            <AnimatePresence>
              {places.map((place, idx) => {
                const isPlaceLocked = place.status === 'LOCKED';
                const isActive = place.status === 'ACTIVE' || place.status === 'APPROVED';
                const isHidden = place.status === 'HIDDEN';
                const isAcc = place.category === 'luutru' || place.placeType === 'ACCOMMODATION';

                return (
                  <motion.tr
                    key={place.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.25, delay: idx * 0.03 }}
                    className="hover:bg-[#F6FAFA] transition-colors group"
                  >
                    {/* Cột 1: Tên cơ sở */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-4">
                        <div className="relative w-15 h-15 rounded-2xl overflow-hidden bg-[#F6FAFA] shrink-0 border border-[#E2ECEC] shadow-2xs">
                          {place.images && place.images[0] ? (
                            <Image
                              src={place.images[0]}
                              alt={place.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#008F89] font-bold text-xs bg-[#E9F8F5]">
                              {isAcc ? <Bed className="w-5 h-5" /> : <Utensils className="w-5 h-5" />}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-[#14233B] group-hover:text-[#008F89] transition-colors text-[15px] truncate">
                            {place.name}
                          </p>
                          <p className="text-xs text-[#68798A] mt-0.5 line-clamp-1 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#008F89] shrink-0" />
                            <span>
                              {place.area || 'Đà Nẵng'} • {place.address}
                            </span>
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[11px] font-bold text-[#FF8A24] bg-amber-50 border border-amber-200/70 px-2.5 py-0.5 rounded-lg">
                              ₫{place.priceMin?.toLocaleString('vi-VN') || 0}{' '}
                              {place.priceMax
                                ? `- ₫${place.priceMax.toLocaleString('vi-VN')}`
                                : ''}
                              {isAcc ? ' / đêm' : ''}
                            </span>
                            {place.cuisineName ? (
                              <span className="text-[11px] font-semibold text-[#008F89] bg-[#E9F8F5] border border-[#BDE8E0]/80 px-2.5 py-0.5 rounded-lg">
                                {place.cuisineName}
                              </span>
                            ) : isAcc ? (
                              <span className="text-[11px] font-semibold text-[#008F89] bg-[#E9F8F5] border border-[#BDE8E0]/80 px-2.5 py-0.5 rounded-lg">
                                {place.accommodationType === 'HOMESTAY'
                                  ? 'Homestay'
                                  : place.accommodationType === 'RESORT'
                                  ? 'Resort'
                                  : place.accommodationType === 'HOSTEL'
                                  ? 'Hostel'
                                  : place.accommodationType === 'APARTMENT'
                                  ? 'Căn hộ'
                                  : 'Khách sạn'}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Cột 2: Trạng thái */}
                    <td className="py-4 px-4 text-center">
                      <PartnerStatusBadge status={place.status} />
                    </td>

                    {/* Cột 3: Lượt xem */}
                    <td className="py-4 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F6FAFA] border border-[#E2ECEC] font-bold text-xs text-[#14233B]">
                        <Eye className="w-3.5 h-3.5 text-[#008F89]" />
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
                          className="w-9 h-9 rounded-xl inline-flex items-center justify-center text-[#68798A] bg-[#F6FAFA] border border-[#E2ECEC] hover:bg-[#E9F8F5] hover:border-[#BDE8E0] hover:text-[#008F89] active:scale-95 transition-all"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Nút Sửa cơ sở */}
                        {isPlaceLocked ? (
                          <div className="relative inline-block">
                            <button
                              disabled
                              type="button"
                              onMouseEnter={() => setLockedTooltipId(place.id)}
                              onMouseLeave={() => setLockedTooltipId(null)}
                              className="w-9 h-9 rounded-xl inline-flex items-center justify-center bg-rose-50 border border-rose-200 text-rose-500 cursor-not-allowed"
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
                                  className="absolute bottom-full right-0 mb-2 z-50 w-52 p-2.5 bg-[#14233B] text-white text-[11px] font-semibold rounded-xl shadow-xl text-center leading-snug pointer-events-none"
                                >
                                  Cơ sở đang bị Admin khóa - không thể chỉnh sửa
                                  <div className="absolute top-full right-3 border-4 border-transparent border-t-[#14233B]" />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ) : isAccountLocked ? (
                          <button
                            disabled
                            type="button"
                            title="Hồ sơ đối tác chưa được duyệt"
                            className="w-9 h-9 rounded-xl inline-flex items-center justify-center bg-slate-100 text-slate-300 cursor-not-allowed"
                          >
                            <Lock className="w-4 h-4" />
                          </button>
                        ) : (
                          <Link
                            href={`/partner/co-so/${place.id}/sua`}
                            title="Chỉnh sửa cơ sở"
                            className="w-9 h-9 rounded-xl inline-flex items-center justify-center text-[#087CB2] bg-sky-50 border border-sky-200/80 hover:bg-sky-100 active:scale-95 transition-all"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Link>
                        )}

                        {/* Nút Quản lý thực đơn hoặc loại phòng */}
                        {!isAccountLocked && (
                          <Link
                            href={`/partner/co-so/${place.id}/sua?tab=${isAcc ? 'rooms' : 'menu'}`}
                            title={isAcc ? 'Quản lý loại phòng & bảng giá' : 'Quản lý thực đơn món ăn (Tự động đồng bộ giá)'}
                            className="w-9 h-9 rounded-xl inline-flex items-center justify-center text-[#008F89] bg-[#E9F8F5] border border-[#BDE8E0] hover:bg-[#008F89] hover:text-white active:scale-95 transition-all"
                          >
                            {isAcc ? <Bed className="w-4 h-4" /> : <UtensilsCrossed className="w-4 h-4" />}
                          </Link>
                        )}

                        {/* Nút Ẩn / Hiện */}
                        {isPlaceLocked ? (
                          <button
                            disabled
                            type="button"
                            title="Cơ sở đang bị Admin khóa - Chỉ Admin mới có quyền mở khóa"
                            className="w-9 h-9 rounded-xl inline-flex items-center justify-center bg-slate-100 text-slate-300 cursor-not-allowed"
                          >
                            <Lock className="w-4 h-4 text-slate-300" />
                          </button>
                        ) : isAccountLocked ? (
                          <button
                            disabled
                            type="button"
                            className="w-9 h-9 rounded-xl inline-flex items-center justify-center bg-slate-100 text-slate-300 cursor-not-allowed"
                          >
                            <Lock className="w-4 h-4" />
                          </button>
                        ) : isActive ? (
                          <button
                            onClick={() => onToggleStatus(place, 'HIDDEN')}
                            title="Ẩn cơ sở này khỏi website"
                            type="button"
                            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-amber-50 border border-amber-200/90 text-amber-700 hover:bg-amber-100 font-bold text-xs transition-all active:scale-95"
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Ẩn</span>
                          </button>
                        ) : isHidden ? (
                          <button
                            onClick={() => onToggleStatus(place, 'ACTIVE')}
                            title="Mở hiển thị lại cơ sở trên website"
                            type="button"
                            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-[#E9F8F5] border border-[#BDE8E0] text-[#008F89] hover:bg-[#008F89] hover:text-white font-bold text-xs transition-all active:scale-95"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Hiện</span>
                          </button>
                        ) : (
                          <button
                            disabled
                            type="button"
                            title="Cơ sở đang chờ phê duyệt"
                            className="w-9 h-9 rounded-xl inline-flex items-center justify-center bg-amber-50 text-amber-400 cursor-not-allowed"
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
