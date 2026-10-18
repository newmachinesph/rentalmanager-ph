'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Menu, Bell, Calendar, ChevronDown,
  Settings, LogOut,
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { useAppStore } from '@/stores/appStore';
import { useRouter } from 'next/navigation';
import { useClickOutside } from '@/lib/hooks';
import { useSessionStore } from '@/lib/session';

/* ================================================================= Header */

export default function Header() {
  const setSidebarMobileOpen = useAppStore((s) => s.setSidebarMobileOpen);
  const setCalendarPanelOpen = useAppStore((s) => s.setCalendarPanelOpen);
  const setRemindersPanelOpen = useAppStore((s) => s.setRemindersPanelOpen);

  const { user, fetchUser, loaded } = useSessionStore();
  useEffect(() => { if (!loaded) fetchUser(); }, [loaded, fetchUser]);

  const displayName = user?.name ?? 'User';
  const displayEmail = user?.email ?? '';
  const nameParts = displayName.split(' ');
  const initials = nameParts.length >= 2
    ? getInitials(nameParts[0], nameParts[nameParts.length - 1])
    : displayName.slice(0, 2).toUpperCase();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);

  useClickOutside(userRef, () => setUserMenuOpen(false));

  // Escape to close dropdowns
  const handleKeyboard = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && userMenuOpen) setUserMenuOpen(false);
    },
    [userMenuOpen]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyboard);
    return () => document.removeEventListener('keydown', handleKeyboard);
  }, [handleKeyboard]);

  const router = useRouter();

  return (
    <header className="sticky top-0 z-30 flex h-[60px] items-center justify-between border-b border-[#E0E0E0] bg-white px-4 sm:px-6">
      {/* Left side - hamburger */}
      <div className="flex items-center">
        <button
          onClick={() => setSidebarMobileOpen(true)}
          className="flex lg:hidden h-9 w-9 items-center justify-center rounded-md text-[#333] hover:text-[#111] hover:bg-slate-100 transition-colors"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* ============== Calendar ============== */}
        <button
          onClick={() => { setCalendarPanelOpen(true); setUserMenuOpen(false); }}
          className="flex h-9 w-9 items-center justify-center rounded-md text-[#555] hover:text-[#333] hover:bg-slate-100 transition-colors"
          aria-label="Calendar"
        >
          <Calendar className="h-5 w-5" />
        </button>

        {/* ============== Reminders (Bell) ============== */}
        <button
          onClick={() => { setRemindersPanelOpen(true); setUserMenuOpen(false); }}
          className="flex h-9 w-9 items-center justify-center rounded-md text-[#555] hover:text-[#333] hover:bg-slate-100 transition-colors"
          aria-label="Reminders"
        >
          <Bell className="h-5 w-5" />
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200" />

        {/* ============== User Menu ============== */}
        <div ref={userRef} className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-slate-100 transition-colors"
          >
            {/* Avatar with initials */}
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
              {initials}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-[#333] leading-tight">{displayName}</p>
              {user?.role && <p className="text-[11px] text-slate-400 leading-tight capitalize">{user.role}</p>}
            </div>
            <ChevronDown className={cn('hidden md:block h-4 w-4 text-slate-400 transition-transform', userMenuOpen && 'rotate-180')} />
          </button>

          {/* User Dropdown */}
          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-lg bg-white border border-slate-200 shadow-lg overflow-hidden z-50">
              {/* User info */}
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{displayName}</p>
                    <p className="text-xs text-slate-500">{displayEmail}</p>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div className="py-1">
                {[
                  { icon: Settings, label: 'Account Settings', href: '/account' },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => { router.push(item.href); setUserMenuOpen(false); }}
                    className="flex w-full items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <item.icon className="w-4 h-4 text-slate-400" />
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Divider + Logout */}
              <div className="border-t border-slate-100 py-1">
                <button
                  onClick={async () => { setUserMenuOpen(false); await fetch('/api/auth/logout', { method: 'POST' }); useSessionStore.getState().clearUser(); router.push('/login'); }}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
