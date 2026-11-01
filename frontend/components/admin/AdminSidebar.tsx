'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Building2,
  MapPin,
  MessageSquare,
  ClipboardList,
  X,
  ShieldCheck,
} from 'lucide-react';

const ADMIN_NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/nguoi-dung', label: 'Quản lý người dùng', icon: Users },
  { href: '/admin/doi-tac', label: 'Quản lý đối tác', icon: Building2 },
  { href: '/admin/dia-diem', label: 'Quản lý nội dung', icon: MapPin },
  { href: '/admin/danh-gia', label: 'Kiểm duyệt review', icon: MessageSquare },
  { href: '/admin/khao-sat', label: 'Quản lý khảo sát', icon: ClipboardList },
];

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function AdminSidebar({ mobileOpen = false, onCloseMobile }: AdminSidebarProps) {
  const pathname = usePathname();

  const content = (
    <div className="flex flex-col h-full bg-slate-900 text-white w-64 p-4 border-r border-slate-800">
      <div className="flex items-center justify-between pb-6 pt-2 border-b border-slate-800">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-white block leading-tight">
              Danang<span className="text-orange-400">Go</span>
            </span>
            <span className="text-[10px] uppercase font-bold text-teal-400 tracking-wider">Admin Portal</span>
          </div>
        </Link>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            aria-label="Đóng menu"
            className="md:hidden text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 py-6 space-y-1.5 overflow-y-auto">
        {ADMIN_NAV.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === '/admin' ? pathname === '/admin' : pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-900/30'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-slate-800 text-xs text-slate-400 text-center">
        DaNangGo Administration v2.0
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:block fixed left-0 top-0 bottom-0 z-40 w-64">{content}</aside>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={onCloseMobile} />
          <div className="relative z-10 w-64 max-w-full">{content}</div>
        </div>
      )}
    </>
  );
}
