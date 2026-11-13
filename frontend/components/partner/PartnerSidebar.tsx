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
  Compass,
  CreditCard,
  Sparkles,
} from 'lucide-react';

const PARTNER_NAV = [
  { href: '/partner', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/partner/goi-dich-vu', label: 'Gói hoạt động', icon: CreditCard },
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
    <div className="relative flex flex-col h-full w-64 bg-gradient-to-b from-[#052E2D] via-[#073B3A] to-[#063231] text-white border-r border-white/10 shadow-xl overflow-hidden select-none">
      {/* Họa tiết ánh sáng và sóng biển mờ dưới chân Sidebar */}
      <div className="pointer-events-none absolute -top-20 -left-20 w-56 h-56 rounded-full bg-[#14B8A6]/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 opacity-15">
        <svg className="w-full h-28 text-[#14B8A6]" viewBox="0 0 400 120" preserveAspectRatio="none">
          <path
            d="M0,45 C100,95 220,0 400,55 L400,120 L0,120 Z"
            fill="currentColor"
          />
          <path
            d="M0,75 C140,30 260,105 400,65 L400,120 L0,120 Z"
            fill="currentColor"
            opacity="0.6"
          />
        </svg>
      </div>

      {/* Khu vực Thương hiệu (Brand Header) */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-6 pb-5 border-b border-white/10">
        <Link href="/partner" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#14B8A6] to-[#008F89] flex items-center justify-center text-white shadow-md shadow-black/25 ring-1 ring-white/20 group-hover:scale-105 transition-transform duration-200">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-extrabold text-lg tracking-tight text-white leading-none">
                Danang<span className="text-[#FF8A24]">Go</span>
              </span>
            </div>
            <span className="inline-flex items-center gap-1 mt-1 text-[10px] uppercase font-bold text-[#6EE7B7] tracking-widest">
              <Sparkles className="w-2.5 h-2.5 text-[#FF8A24]" />
              Partner Hub
            </span>
          </div>
        </Link>

        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            aria-label="Đóng menu đối tác"
            className="md:hidden text-teal-200/80 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nhãn phân nhóm điều hướng */}
      <div className="relative z-10 px-5 pt-5 pb-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-teal-200/50">
          Quản lý vận hành
        </p>
      </div>

      {/* Danh sách Menu */}
      <nav className="relative z-10 flex-1 px-3.5 py-2 space-y-1.5 overflow-y-auto">
        {PARTNER_NAV.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/partner'
              ? pathname === '/partner'
              : pathname?.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={`group relative flex items-center gap-3 px-3.5 py-3 rounded-xl text-[13.5px] font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-[#008F89] to-[#14B8A6] text-white shadow-md shadow-black/20'
                  : 'text-teal-100/80 hover:bg-white/[0.08] hover:text-white hover:translate-x-0.5'
              }`}
            >
              {/* Thanh indicator nhận diện trang đang mở */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-[#FF8A24] shadow-xs" />
              )}

              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-200 ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-white/[0.04] text-[#5EEAD4] group-hover:bg-white/10 group-hover:text-white'
                }`}
              >
                <Icon className="w-[18px] h-[18px]" strokeWidth={2.1} />
              </div>

              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Chân Sidebar */}
      <div className="relative z-10 p-4 mx-3.5 mb-4 rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-[#14B8A6] animate-pulse shrink-0" />
          <p className="text-xs font-bold text-white truncate">Cổng Đối Tác Đà Nẵng</p>
        </div>
        <p className="text-[11px] text-teal-100/70 mt-1 leading-relaxed">
          Hệ sinh thái du lịch thông minh DanangGo Coastal SaaS
        </p>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden md:block fixed left-0 top-0 bottom-0 z-40 w-64">
        {content}
      </aside>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-[#073B3A]/65 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 w-64 max-w-full">{content}</div>
        </div>
      )}
    </>
  );
}
