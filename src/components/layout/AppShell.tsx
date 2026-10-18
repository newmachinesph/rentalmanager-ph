'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';
import CalendarPanel from './CalendarPanel';
import RemindersPanel from './RemindersPanel';
import { useAppStore } from '@/stores/appStore';

interface AppShellProps {
  children: React.ReactNode;
}

const PUBLIC_ROUTES = ['/login'];

export default function AppShell({ children }: AppShellProps) {
  const theme = useAppStore((s) => s.theme);
  const pathname = usePathname();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  /* Skip shell for public routes (login) */
  if (PUBLIC_ROUTES.includes(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Sidebar - fixed 220px on desktop */}
      <Sidebar />

      {/* Main area: offset by sidebar width on desktop */}
      <div className="flex flex-col lg:ml-[220px]">
        {/* Header - sticky top */}
        <Header />

        {/* Page content */}
        <main className="flex-1 p-6">{children}</main>
      </div>

      {/* Slide-over panels */}
      <CalendarPanel />
      <RemindersPanel />
    </div>
  );
}
