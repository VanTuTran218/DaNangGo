'use client';

import { ReactNode, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getPartnerProfile } from '@/lib/api/partner';
import type { PartnerProfile } from '@/types/partner';
import { Clock, AlertTriangle, CheckCircle2, X, ArrowRight } from 'lucide-react';
import PartnerSidebar from '@/components/partner/PartnerSidebar';
import PartnerHeader from '@/components/partner/PartnerHeader';
import ScrollProgress from '@/components/partner/ScrollProgress';

export default function PartnerDashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<PartnerProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [approvalBannerDismissed, setApprovalBannerDismissed] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/dang-nhap?redirect=/partner');
        return;
      }
      if (user.role !== 'PARTNER') {
        router.replace('/');
        return;
      }

      const fetchProfile = () => {
        getPartnerProfile()
          .then((p) => {
            setProfile(p);
            try {
              const key = `partner_approved_banner_dismissed_${p.id}`;
              if (localStorage.getItem(key) === '1') {
                setApprovalBannerDismissed(true);
              }
            } catch {
              // Ignore localStorage access error
            }
          })
          .catch(() => {})
          .finally(() => setLoadingProfile(false));
      };

      fetchProfile();
      window.addEventListener('partner-profile-updated', fetchProfile);
      return () => window.removeEventListener('partner-profile-updated', fetchProfile);
    }
  }, [user, authLoading, router]);

  const handleDismissApprovalBanner = () => {
    setApprovalBannerDismissed(true);
    if (profile) {
      try {
        localStorage.setItem(`partner_approved_banner_dismissed_${profile.id}`, '1');
      } catch {
        // Ignore
      }
    }
  };

  if (authLoading || loadingProfile) {
    return (
      <div className="min-h-screen bg-[#F6FAFA] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3.5">
          <div className="w-11 h-11 border-4 border-[#008F89] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-[#14233B]">
            Đang tải Kênh Quản Lý Đối Tác...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#F6FAFA] text-[#14233B] flex overflow-x-hidden">
      {/* Họa tiết đường sóng biển rất nhẹ ở góc trang (không đè lên bảng dữ liệu) */}
      <div className="pointer-events-none fixed right-0 top-16 w-[480px] h-[320px] opacity-35 z-0 overflow-hidden">
        <svg viewBox="0 0 500 300" fill="none" className="w-full h-full text-[#E9F8F5]">
          <path
            d="M120 -20C180 80 340 40 520 160"
            stroke="currentColor"
            strokeWidth="2.5"
          />
          <path
            d="M180 -40C240 60 380 20 540 130"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      </div>

      <ScrollProgress />
      <PartnerSidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      <div className="relative z-10 flex-1 md:pl-64 flex flex-col min-w-0">
        <PartnerHeader profile={profile} onOpenMobileMenu={() => setMobileOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          {profile?.status === 'PENDING' && (
            <div className="mb-6 p-4 sm:p-5 bg-amber-50/95 border border-amber-200/90 rounded-[20px] flex items-start gap-3.5 text-amber-950 shadow-2xs">
              <div className="p-2.5 bg-amber-100 rounded-xl text-amber-700 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-amber-950">
                  Hồ sơ đối tác đang chờ quản trị viên phê duyệt
                </h3>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  Tài khoản của bạn đã được tiếp nhận. Trong thời gian này, bạn có thể hoàn thiện thông tin cơ sở và xem tổng quan. Các tính năng đăng bài và đón khách công khai sẽ tự động mở khi tài khoản được duyệt.
                </p>
              </div>
            </div>
          )}

          {profile?.status === 'APPROVED' && !approvalBannerDismissed && (
            <div className="mb-6 p-4 sm:p-5 bg-emerald-50/95 border border-emerald-200/90 rounded-[20px] flex items-start justify-between gap-3.5 text-emerald-950 shadow-2xs">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-700 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-emerald-950">
                    Thông báo: Hồ sơ đối tác đã được quản trị viên phê duyệt! 🎉
                  </h3>
                  <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                    Tài khoản đối tác <strong>{profile.businessName}</strong> hiện đã hoạt động chính thức trên hệ thống DanangGo. Bạn có thể đăng tải và quản lý công khai các cơ sở lưu trú, ẩm thực, vé tham quan của mình.
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismissApprovalBanner}
                title="Đã hiểu"
                className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-100 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {profile?.status === 'REJECTED' && (
            <div className="mb-6 p-4 sm:p-5 bg-rose-50/95 border border-rose-200/90 rounded-[20px] flex items-start gap-3.5 text-rose-950 shadow-2xs">
              <div className="p-2.5 bg-rose-100 rounded-xl text-rose-700 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm text-rose-950">
                  Thông báo: Hồ sơ đối tác bị từ chối phê duyệt
                </h3>
                <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                  Hồ sơ đăng ký của <strong>{profile.businessName}</strong> chưa đáp ứng điều kiện xét duyệt từ quản trị viên.
                </p>
                {profile.rejectReason && (
                  <div className="mt-2.5 p-3 bg-white/80 border border-rose-200 rounded-xl text-xs text-rose-900">
                    <span className="font-bold text-rose-700">Lý do từ chối: </span>
                    {profile.rejectReason}
                  </div>
                )}
                <div className="mt-3">
                  <Link
                    href="/partner/ho-so"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors"
                  >
                    Cập nhật hồ sơ & gửi duyệt lại
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  );
}
