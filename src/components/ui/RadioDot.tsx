'use client';

import { cn } from '@/lib/utils';

interface RadioDotProps {
  active: boolean;
  className?: string;
}

export function RadioDot({ active, className }: RadioDotProps) {
  return (
    <span
      className={cn(
        'flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center',
        active ? 'border-blue-500' : 'border-slate-300',
        className
      )}
    >
      {active && <span className="w-2 h-2 rounded-full bg-blue-500" />}
    </span>
  );
}
