'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building,
  Home,
  Users,
  BarChart3,
  Wrench,
  MoreHorizontal,
  X,
  FileText,
  DollarSign,
  Receipt,
  Zap,
  ScrollText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/appStore';

/* ------------------------------------------------------------------ Types */

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

/* ---------------------------------------------------------- Nav definitions */

const mainNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Properties', href: '/properties', icon: Home },
  { label: 'Leases', href: '/leases', icon: FileText },
  { label: 'Contracts', href: '/contracts', icon: ScrollText },
  { label: 'Tenants', href: '/tenants', icon: Users },
  { label: 'Income', href: '/income', icon: DollarSign },
  { label: 'Expenses', href: '/expenses', icon: Receipt },
  { label: 'Maintenance', href: '/maintenance', icon: Wrench },
  { label: 'Utilities', href: '/utilities', icon: Zap },
  { label: 'Organization', href: '/organization', icon: Building },
  { label: 'Reports', href: '/reports', icon: BarChart3 },
];

const bottomNavItems: NavItem[] = [
  { label: 'More', href: '/settings', icon: MoreHorizontal },
];

/* --------------------------------------------------------- Helper: isActive */

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname.startsWith(href);
}

/* ------------------------------------------------------------ Logo */

function SidebarLogo() {
  return (
    <div className="flex items-center gap-3 px-4 py-5 shrink-0">
      {/* Geometric teal logo icon */}
      <div className="flex items-center justify-center h-8 w-8 shrink-0 rounded-lg bg-[#1BD5A4]">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3 9.5L12 4L21 9.5V19C21 19.5523 20.5523 20 20 20H4C3.44772 20 3 19.5523 3 19V9.5Z"
            fill="white"
            fillOpacity="0.9"
          />
          <path
            d="M9 20V14H15V20"
            stroke="#1BD5A4"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <span className="text-[15px] font-semibold text-white tracking-tight">
        Rental Manager
      </span>
    </div>
  );
}

/* ------------------------------------------------------------ NavItemLink */

function NavItemLink({
  item,
  closeMobile,
}: {
  item: NavItem;
  closeMobile: () => void;
}) {
  const pathname = usePathname();
  const highlighted = isActive(pathname, item.href);

  return (
    <Link href={item.href} onClick={closeMobile}>
      <div
        className={cn(
          'group relative flex items-center gap-3 h-[42px] text-[14px] font-medium transition-colors cursor-pointer',
          highlighted
            ? 'bg-[#1a3a5c] text-white'
            : 'text-white/80 hover:text-white hover:bg-[#1a3a5c]/50',
          highlighted
            ? 'border-l-[4px] border-[#1BD5A4] pl-[12px]'
            : 'border-l-[4px] border-transparent pl-[12px]',
          'pr-3'
        )}
      >
        <item.icon className="h-5 w-5 shrink-0" />
        <span className="truncate flex-1">{item.label}</span>
      </div>
    </Link>
  );
}

/* ================================================================ Sidebar */

export default function Sidebar() {
  const sidebarMobileOpen = useAppStore((s) => s.sidebarMobileOpen);
  const setSidebarMobileOpen = useAppStore((s) => s.setSidebarMobileOpen);
  const pathname = usePathname();

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarMobileOpen(false);
  }, [pathname, setSidebarMobileOpen]);

  // Close mobile sidebar on Escape
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && sidebarMobileOpen) {
        setSidebarMobileOpen(false);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [sidebarMobileOpen, setSidebarMobileOpen]);

  const closeMobile = () => setSidebarMobileOpen(false);

  /* ---- Shared inner content ---- */
  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#0F2847]">
      {/* Logo */}
      <SidebarLogo />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto space-y-0.5">
        {/* Main nav */}
        {mainNavItems.map((item) => (
          <NavItemLink key={item.label} item={item} closeMobile={closeMobile} />
        ))}

        {/* Separator */}
        <div className="mx-4 my-3 h-px bg-[#1a3a52]" />

        {/* Bottom nav */}
        {bottomNavItems.map((item) => (
          <NavItemLink key={item.label} item={item} closeMobile={closeMobile} />
        ))}
      </nav>
    </div>
  );

  return (
    <>
      {/* =========== Desktop Sidebar =========== */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden lg:flex flex-col w-[220px]">
        {sidebarContent}
      </aside>

      {/* =========== Mobile Backdrop =========== */}
      {sidebarMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* =========== Mobile Sidebar =========== */}
      {sidebarMobileOpen && (
        <aside className="fixed inset-y-0 left-0 z-50 flex w-[220px] flex-col lg:hidden shadow-xl">
          {/* Close button */}
          <button
            onClick={() => setSidebarMobileOpen(false)}
            className="absolute top-4 right-3 z-10 flex h-7 w-7 items-center justify-center rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>

          {sidebarContent}
        </aside>
      )}
    </>
  );
}
