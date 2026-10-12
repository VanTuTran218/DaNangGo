'use client';

import { Menu, LogOut, Store } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { PartnerProfile } from '@/types/partner';
import StatusBadge from '@/components/ui/StatusBadge';

interface PartnerHeaderProps {
  profile: PartnerProfile | null;
  onOpenMobileMenu: () => void;
}

export default function PartnerHeader({ profile, onOpenMobileMenu }: PartnerHeaderProps) {
  const { logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-100 shadow-xs px-4 md:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          aria-label="Mở menu đối tác"
          className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-gray-900 hidden sm:block">Kênh Quản Lý Đối Tác</h2>
          <span className="text-xs text-gray-500 sm:hidden font-bold">Partner Hub</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {profile && (
          <div className="flex items-center gap-2.5 px-3 py-1.5 bg-teal-50/60 rounded-xl border border-teal-100">
            <div className="w-8 h-8 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-sm">
              <Store className="w-4 h-4" />
            </div>
            <div className="hidden sm:block text-left">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-gray-900 leading-tight">{profile.businessName}</p>
                <StatusBadge status={profile.status} />
              </div>
              <p className="text-[10px] text-gray-500">{profile.email}</p>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          aria-label="Đăng xuất khỏi tài khoản đối tác"
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-600 font-semibold text-xs transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Đăng xuất</span>
        </button>
      </div>
    </header>
  );
}
