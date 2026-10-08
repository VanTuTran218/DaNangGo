'use client';

import { Menu, LogOut, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { adminLogout } from '@/lib/api/auth';
import type { User as UserType } from '@/types/user';

interface AdminHeaderProps {
  user: UserType | null;
  onOpenMobileMenu: () => void;
}

export default function AdminHeader({ user, onOpenMobileMenu }: AdminHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await adminLogout();
    } finally {
      router.replace('/admin/login');
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-100 shadow-xs px-4 md:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          aria-label="Mở menu quản trị"
          className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-gray-900 hidden sm:block">Hệ Thống Quản Trị DanangGo</h2>
          <span className="text-xs text-gray-500 sm:hidden font-bold">Admin Portal</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-2.5 px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-100">
            <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 font-bold flex items-center justify-center text-sm">
              <User className="w-4 h-4" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-gray-900 leading-tight">{user.name}</p>
              <p className="text-[10px] text-gray-500">{user.email}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          aria-label="Đăng xuất quản trị"
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-600 font-semibold text-xs transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Đăng xuất</span>
        </button>
      </div>
    </header>
  );
}
