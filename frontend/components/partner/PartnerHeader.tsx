'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Menu,
  LogOut,
  Store,
  MapPin,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { PartnerProfile } from '@/types/partner';
import PartnerStatusBadge from '@/components/partner/PartnerStatusBadge';

interface PartnerHeaderProps {
  profile: PartnerProfile | null;
  onOpenMobileMenu: () => void;
}

export default function PartnerHeader({ profile, onOpenMobileMenu }: PartnerHeaderProps) {
  const { logout } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHasUnread(true);
  }, [profile?.status, profile?.rejectReason]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notifOpen]);

  const formattedReviewedAt = profile?.reviewedAt
    ? new Date(profile.reviewedAt).toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : null;

  return (
    <header className="sticky top-0 z-30 h-[68px] bg-white/95 backdrop-blur-md border-b border-[#E2ECEC] shadow-2xs px-4 md:px-8 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          aria-label="Mở menu đối tác"
          className="md:hidden p-2 text-[#14233B] hover:bg-[#E9F8F5] hover:text-[#008F89] rounded-xl transition-colors shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-[17px] font-bold text-[#14233B] truncate">
              Kênh Quản Lý Đối Tác
            </h2>
            <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#E9F8F5] text-[#008F89] text-[11px] font-semibold">
              <MapPin className="w-3 h-3" /> Đà Nẵng
            </span>
          </div>
          <p className="text-[11px] text-[#68798A] hidden sm:block truncate">
            Quản trị dịch vụ lưu trú, ẩm thực & trải nghiệm du lịch
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        {/* Chuông thông báo trạng thái xét duyệt từ Admin */}
        {profile && (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => {
                setNotifOpen((prev) => !prev);
                setHasUnread(false);
              }}
              aria-label="Thông báo đối tác"
              title="Thông báo từ Quản trị viên"
              className="relative p-2.5 rounded-xl bg-[#F6FAFA] hover:bg-[#E9F8F5] border border-[#E2ECEC] text-[#14233B] hover:text-[#008F89] transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {hasUnread && (
                <span
                  className={`absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                    profile.status === 'REJECTED'
                      ? 'bg-rose-500 animate-pulse'
                      : profile.status === 'APPROVED'
                      ? 'bg-emerald-500'
                      : 'bg-amber-500 animate-pulse'
                  }`}
                />
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-[#E2ECEC] shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 bg-[#F6FAFA] border-b border-[#E2ECEC] flex items-center justify-between">
                  <span className="text-xs font-bold text-[#14233B] uppercase tracking-wider">
                    Thông báo từ Quản trị viên
                  </span>
                  <PartnerStatusBadge status={profile.status} size="sm" />
                </div>

                <div className="p-4">
                  {profile.status === 'APPROVED' && (
                    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-50/90 border border-emerald-200/80 text-emerald-950">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="space-y-1 text-xs">
                        <p className="font-bold text-emerald-950">
                          Hồ sơ đối tác đã được phê duyệt ✅
                        </p>
                        <p className="text-emerald-800 leading-relaxed">
                          Tài khoản đối tác <strong>{profile.businessName}</strong> đã được Admin xét duyệt thành công. Bạn có thể đăng tải và quản lý dịch vụ công khai trên DanangGo.
                        </p>
                        {formattedReviewedAt && (
                          <p className="text-[11px] text-emerald-700/80 pt-1">
                            Thời gian duyệt: {formattedReviewedAt}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {profile.status === 'REJECTED' && (
                    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-50/90 border border-rose-200/80 text-rose-950">
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div className="space-y-1.5 text-xs flex-1">
                        <p className="font-bold text-rose-950">
                          Hồ sơ đối tác bị từ chối phê duyệt
                        </p>
                        <p className="text-rose-800 leading-relaxed">
                          Hồ sơ của <strong>{profile.businessName}</strong> chưa được Admin chấp thuận.
                        </p>
                        {profile.rejectReason && (
                          <div className="p-2.5 bg-white rounded-lg border border-rose-200 text-rose-900">
                            <span className="font-bold text-rose-700">Lý do: </span>
                            {profile.rejectReason}
                          </div>
                        )}
                        {formattedReviewedAt && (
                          <p className="text-[11px] text-rose-700/80">
                            Thời gian phản hồi: {formattedReviewedAt}
                          </p>
                        )}
                        <div className="pt-1">
                          <Link
                            href="/partner/ho-so"
                            onClick={() => setNotifOpen(false)}
                            className="inline-flex items-center gap-1 font-bold text-rose-700 hover:text-rose-800 underline"
                          >
                            Cập nhật hồ sơ & gửi duyệt lại <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}

                  {profile.status === 'PENDING' && (
                    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50/90 border border-amber-200/80 text-amber-950">
                      <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-1 text-xs">
                        <p className="font-bold text-amber-950">
                          Hồ sơ đang chờ Admin xét duyệt ⏳
                        </p>
                        <p className="text-amber-800 leading-relaxed">
                          Yêu cầu đăng ký của <strong>{profile.businessName}</strong> đã được tiếp nhận. Hệ thống sẽ gửi thông báo qua email và tại đây ngay khi Admin phê duyệt hoặc phản hồi.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {profile && (
          <div className="flex items-center gap-3 pl-2.5 pr-3.5 py-1.5 bg-[#F6FAFA] hover:bg-[#E9F8F5]/60 rounded-2xl border border-[#E2ECEC] transition-colors max-w-[240px] sm:max-w-[340px]">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#008F89] to-[#073B3A] text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-2xs">
              <Store className="w-4 h-4" />
            </div>

            <div className="hidden sm:block text-left min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p
                  title={profile.businessName}
                  className="text-xs font-bold text-[#14233B] leading-tight truncate max-w-[140px] lg:max-w-[200px]"
                >
                  {profile.businessName}
                </p>
                <PartnerStatusBadge status={profile.status} size="sm" />
              </div>
              <p className="text-[11px] text-[#68798A] truncate mt-0.5">{profile.email}</p>
            </div>

            <div className="sm:hidden">
              <PartnerStatusBadge status={profile.status} size="sm" />
            </div>
          </div>
        )}

        <button
          onClick={logout}
          aria-label="Đăng xuất khỏi tài khoản đối tác"
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#F6FAFA] hover:bg-rose-50 border border-[#E2ECEC] hover:border-rose-200 text-[#14233B] hover:text-rose-600 font-semibold text-xs transition-all duration-150 active:scale-[0.98]"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Đăng xuất</span>
        </button>
      </div>
    </header>
  );
}
