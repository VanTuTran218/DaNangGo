'use client';

import { ReactNode, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getPartnerProfile } from '@/lib/api/partner';
import type { PartnerProfile } from '@/types/partner';
import { Clock, AlertTriangle } from 'lucide-react';
import PartnerSidebar from '@/components/partner/PartnerSidebar';
import PartnerHeader from '@/components/partner/PartnerHeader';

export default function PartnerDashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<PartnerProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

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

      getPartnerProfile()
        .then(setProfile)
        .catch(() => {})
        .finally(() => setLoadingProfile(false));
    }
  }, [user, authLoading, router]);

  if (authLoading || loadingProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-gray-600">Đang tải Kênh Quản Lý Đối Tác...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex">
      <PartnerSidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        <PartnerHeader profile={profile} onOpenMobileMenu={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {profile?.status === 'PENDING' && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900 shadow-xs">
              <div className="p-2 bg-amber-100 rounded-xl text-amber-700 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Hồ sơ đối tác đang chờ quản trị viên phê duyệt</h3>
                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                  Tài khoản của bạn đã được tiếp nhận. Trong thời gian này, bạn có thể hoàn thiện thông tin cơ sở và xem tổng quan. Các tính năng đăng bài và đón khách công khai sẽ tự động mở khi tài khoản được duyệt.
                </p>
              </div>
            </div>
          )}

          {profile?.status === 'REJECTED' && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-900 shadow-xs">
              <div className="p-2 bg-red-100 rounded-xl text-red-700 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Hồ sơ đối tác chưa được phê duyệt</h3>
                <p className="text-xs text-red-700 mt-1 leading-relaxed">
                  Hồ sơ đối tác của bạn không đủ điều kiện xét duyệt. Vui lòng cập nhật lại thông tin hồ sơ hoặc liên hệ ban quản trị qua email support@dananggo.vn.
                </p>
              </div>
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  );
}
