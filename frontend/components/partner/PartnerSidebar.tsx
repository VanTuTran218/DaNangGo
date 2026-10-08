'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building,
  CalendarCheck,
  Star,
  UserCheck,
  X,
  Store,
} from 'lucide-react';

const PARTNER_NAV = [
  { href: '/partner', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/partner/co-so', label: 'Cơ sở dịch vụ', icon: Building },
  { href: '/partner/don-dat', label: 'Quản lý đơn đặt', icon: CalendarCheck },
  { href: '/partner/danh-gia', label: 'Đánh giá & Khách hàng', icon: Star },
  { href: '/partner/ho-so', label: 'Hồ sơ doanh nghiệp', icon: UserCheck },
];

interface PartnerSidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function PartnerSidebar({ mobileOpen = false, onCloseMobile }: PartnerSidebarProps) {
  const pathname = usePathname();

  const content = (
    <div className="flex flex-col h-full bg-teal-950 text-white w-64 p-4 border-r border-teal-900">
      <div className="flex items-center justify-between pb-6 pt-2 border-b border-teal-900">
        <Link href="/partner" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white shadow-md">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-white block leading-tight">
              Danang<span className="text-orange-400">Go</span>
            </span>
            <span className="text-[10px] uppercase font-bold text-teal-300 tracking-wider">Partner Hub</span>
          </div>
        </Link>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            aria-label="Đóng menu đối tác"
            className="md:hidden text-teal-300 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 py-6 space-y-1.5 overflow-y-auto">
        {PARTNER_NAV.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === '/partner' ? pathname === '/partner' : pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-900/30'
                  : 'text-teal-200 hover:bg-teal-900/60 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-teal-300'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-teal-900 text-xs text-teal-300 text-center">
        Dành cho Đối tác Kinh doanh
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden md:block fixed left-0 top-0 bottom-0 z-40 w-64">{content}</aside>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={onCloseMobile} />
          <div className="relative z-10 w-64 max-w-full">{content}</div>
        </div>
      )}
    </>
  );
}
