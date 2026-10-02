'use client';

import { Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { VipLanding } from '@/components/vip/VipLanding';
import { VipDashboard } from '@/components/vip/VipDashboard';

export default function VipPage() {
  const { user, updateUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || !user.membership?.isVip) {
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>}>
        <VipLanding user={user} updateUser={updateUser} />
      </Suspense>
    );
  }

  return <VipDashboard user={user} />;
}
