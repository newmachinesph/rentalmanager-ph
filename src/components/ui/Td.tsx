'use client';

import { cn } from '@/lib/utils';

interface TdProps {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'right';
}

export function Td({ children, className, align = 'left' }: TdProps) {
  return (
    <td
      className={cn(
        'py-3 px-5 text-sm text-slate-700',
        align === 'right' && 'text-right',
        className
      )}
    >
      {children}
    </td>
  );
}
