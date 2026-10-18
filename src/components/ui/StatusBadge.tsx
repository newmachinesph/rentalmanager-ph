'use client';

import { cn, getStatusColor } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'px-2 py-0.5 rounded-full text-xs font-medium',
        getStatusColor(status),
        className
      )}
    >
      {status}
    </span>
  );
}
