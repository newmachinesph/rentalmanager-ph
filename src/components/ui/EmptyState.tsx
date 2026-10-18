'use client';

import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  variant?: 'default' | 'inline';
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
  variant = 'default',
}: EmptyStateProps) {
  if (variant === 'inline') {
    return (
      <div className={cn('py-16 text-center', className)}>
        <Icon className="h-10 w-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 font-medium">{title}</p>
        <p className="text-sm text-slate-400 mt-1">{description}</p>
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="text-sm text-blue-600 hover:text-blue-700 mt-1 hover:underline transition-colors"
          >
            {actionLabel}
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6 text-center',
        className
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center w-16 h-16 rounded-full mb-4',
          'bg-gray-100 dark:bg-gray-800'
        )}
      >
        <Icon size={28} className="text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
        {title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
