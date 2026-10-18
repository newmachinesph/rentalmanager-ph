'use client';

import { cn } from '@/lib/utils';

interface TableWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function TableWrapper({ children, className }: TableWrapperProps) {
  return (
    <div
      className={cn(
        'bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden',
        className
      )}
    >
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}
