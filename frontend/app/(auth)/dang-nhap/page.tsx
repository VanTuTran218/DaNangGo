'use client';

import { redirect, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import AuthCard from '@/components/auth/AuthCard';

function AuthContent() {
  const params = useSearchParams();
  const tab = params.get('tab') === 'dang-ky' ? 'register' : 'login';
  const rawRedirect = params.get('redirect');
  const redirectTo =
    rawRedirect && rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') && !rawRedirect.startsWith('/\\')
      ? rawRedirect
      : '/';
  if (/^\/admin(?:\/|\?|#|$)/.test(redirectTo)) redirect('/admin/login');

  return <AuthCard initialTab={tab} redirectTo={redirectTo} />;
}

export default function DangNhapPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#041017]" />}>
      <AuthContent />
    </Suspense>
  );
}
