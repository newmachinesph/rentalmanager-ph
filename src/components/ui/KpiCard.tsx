'use client';

import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string;
  change: number;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'blue' | 'emerald' | 'amber' | 'red' | 'purple';
  onClick?: () => void;
}

const colorMap = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    icon: 'text-blue-600 dark:text-blue-400',
    ring: 'ring-blue-100 dark:ring-blue-800/40',
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    icon: 'text-emerald-600 dark:text-emerald-400',
    ring: 'ring-emerald-100 dark:ring-emerald-800/40',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    icon: 'text-amber-600 dark:text-amber-400',
    ring: 'ring-amber-100 dark:ring-amber-800/40',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    icon: 'text-red-600 dark:text-red-400',
    ring: 'ring-red-100 dark:ring-red-800/40',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    icon: 'text-purple-600 dark:text-purple-400',
    ring: 'ring-purple-100 dark:ring-purple-800/40',
  },
};

export function KpiCard({
  title,
  value,
  change,
  icon: Icon,
  trend = 'neutral',
  color = 'blue',
  onClick,
}: KpiCardProps) {
  const colors = colorMap[color];

  const trendConfig = {
    up: {
      icon: TrendingUp,
      text: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
    down: {
      icon: TrendingDown,
      text: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/20',
    },
    neutral: {
      icon: Minus,
      text: 'text-gray-500 dark:text-gray-400',
      bg: 'bg-gray-50 dark:bg-gray-800',
    },
  };

  const trendInfo = trendConfig[trend];
  const TrendIcon = trendInfo.icon;

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-xl border border-gray-200 shadow-sm p-5',
        'dark:bg-gray-900 dark:border-gray-800',
        onClick && 'cursor-pointer hover:border-blue-300 hover:shadow-md transition-all'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
            {title}
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {value}
          </p>
          <div className="mt-2 flex items-center gap-1.5">
            <span
              className={cn(
                'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-xs font-medium',
                trendInfo.bg,
                trendInfo.text
              )}
            >
              <TrendIcon size={12} />
              {Math.abs(change)}%
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">vs last month</span>
          </div>
        </div>
        <div
          className={cn(
            'flex items-center justify-center w-11 h-11 rounded-lg ring-1',
            colors.bg,
            colors.ring
          )}
        >
          <Icon size={22} className={colors.icon} />
        </div>
      </div>
    </div>
  );
}
