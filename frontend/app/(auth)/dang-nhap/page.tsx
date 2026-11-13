'use client';
import Link from 'next/link';
import { redirect, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import AuthCard from '@/components/auth/AuthCard';

function AuthContent() {
  const params = useSearchParams();
  const tab = params.get('tab') === 'dang-ky' ? 'register' : 'login';
  const rawRedirect = params.get('redirect');
  const redirectTo = rawRedirect && rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') && !rawRedirect.startsWith('/\\')
    ? rawRedirect
    : '/';
  if (/^\/admin(?:\/|\?|#|$)/.test(redirectTo)) redirect('/admin/login');

  return (
    <>
      <AuthCard initialTab={tab} redirectTo={redirectTo} />
      <div className="pb-6 text-center">
        <Link href="/admin/login" className="text-sm font-semibold text-teal-700 hover:underline">
          Đăng nhập quản trị
        </Link>
      </div>
    </>
  );
}

export default function DangNhapPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <AuthContent />
    </Suspense>
  );
}
