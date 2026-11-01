'use client';

import { ReactNode, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import { adminGetSession } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import type { User } from '@/types/user';

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    adminGetSession()
      .then((u) => {
        if (!u) {
          router.replace('/admin/login');
        } else {
          setUser(u);
        }
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 401) {
          router.replace('/admin/login');
          return;
        }
        setSessionError(error instanceof Error ? error.message : 'Không thể kiểm tra phiên Admin.');
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-gray-600">Đang kiểm tra quyền truy cập Admin...</p>
        </div>
      </div>
    );
  }

  if (sessionError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div role="alert" className="max-w-lg rounded-2xl border border-amber-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-bold text-gray-900">Không thể kiểm tra phiên Admin</h1>
          <p className="mt-2 text-sm text-gray-600">{sessionError}</p>
          <p className="mt-1 text-sm text-gray-500">Kiểm tra backend và SQL Server, sau đó tải lại trang.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-5 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex">
      <AdminSidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        <AdminHeader user={user} onOpenMobileMenu={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
