'use client';

import { cn } from '@/lib/utils';

interface Tab<T extends string> {
  key: T;
  label: string;
  count?: number;
}

interface TabNavProps<T extends string> {
  tabs: Tab<T>[];
  activeTab: T;
  onTabChange: (tab: T) => void;
  variant?: 'simple' | 'counted';
  ariaLabel?: string;
}

export function TabNav<T extends string>({
  tabs,
  activeTab,
  onTabChange,
  variant = 'simple',
  ariaLabel = 'Tabs',
}: TabNavProps<T>) {
  return (
    <div className="border-b border-slate-200">
      <nav className="flex gap-6" aria-label={ariaLabel}>
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={cn(
                'pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                isActive
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              )}
            >
              {tab.label}
              {variant === 'counted' && tab.count !== undefined && (
                <span
                  className={cn(
                    'ml-1.5 inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-medium',
                    isActive
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-slate-100 text-slate-500'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
