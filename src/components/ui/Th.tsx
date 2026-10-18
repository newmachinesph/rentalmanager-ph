'use client';

import { cn } from '@/lib/utils';

interface ThProps {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'right';
}

export function Th({ children, className, align = 'left' }: ThProps) {
  return (
    <th
      className={cn(
        'py-3 px-5 text-[11px] uppercase tracking-wider font-semibold text-slate-400',
        align === 'right' ? 'text-right' : 'text-left',
        className
      )}
    >
      {children}
    </th>
  );
}
