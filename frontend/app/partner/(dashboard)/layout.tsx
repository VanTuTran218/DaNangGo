'use client';

import { ReactNode, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getPartnerProfile } from '@/lib/api/partner';
import type { PartnerProfile } from '@/types/partner';
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
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
