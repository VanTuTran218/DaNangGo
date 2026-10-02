'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import AuthCard from '@/components/auth/AuthCard';

function AuthContent() {
  const params = useSearchParams();
  const tab = params.get('tab') === 'dang-ky' ? 'register' : 'login';
  const redirectTo = params.get('redirect') || '/';
  return <AuthCard initialTab={tab} redirectTo={redirectTo} />;
}

export default function DangNhapPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <AuthContent />
    </Suspense>
  );
}
