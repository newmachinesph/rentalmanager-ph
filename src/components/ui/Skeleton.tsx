'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
}: SkeletonProps) {
  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={cn(
        'animate-pulse bg-slate-200 dark:bg-slate-700',
        variant === 'text' && 'h-4 rounded',
        variant === 'circular' && 'rounded-full',
        variant === 'rectangular' && 'rounded-lg',
        className
      )}
      style={style}
    />
  );
}

/* ---- Compound skeletons ---- */

export function KpiCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 dark:bg-gray-900 dark:border-gray-800">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton variant="rectangular" className="w-11 h-11" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="px-4 py-3 text-left">
                  <Skeleton className="h-3.5 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rowIdx) => (
              <tr key={rowIdx} className="border-b border-slate-100">
                {Array.from({ length: cols }).map((_, colIdx) => (
                  <td key={colIdx} className="px-4 py-3.5">
                    <Skeleton
                      className={cn(
                        'h-4',
                        colIdx === 0 ? 'w-36' : colIdx === cols - 1 ? 'w-16' : 'w-24'
                      )}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function TabsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="border-b border-slate-200 mb-4">
      <div className="flex gap-1 -mb-px">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 pb-3 px-3">
            <Skeleton className="h-4 w-16" />
            <Skeleton variant="circular" className="h-5 w-5" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SearchBarSkeleton() {
  return <Skeleton variant="rectangular" className="h-10 w-full sm:w-96" />;
}

export function KanbanSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, col) => (
        <div key={col} className="space-y-3">
          <Skeleton className="h-5 w-28 mb-4" />
          {Array.from({ length: col === 0 ? 3 : col === 1 ? 2 : 2 }).map((_, card) => (
            <div
              key={card}
              className="bg-white border border-slate-200 rounded-lg p-4 space-y-3"
            >
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3.5 w-1/2" />
              <div className="flex gap-2">
                <Skeleton variant="rectangular" className="h-5 w-14" />
                <Skeleton variant="rectangular" className="h-5 w-14" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="flex items-center justify-between mb-6">
      <Skeleton className="h-8 w-40" />
      <Skeleton variant="rectangular" className="h-10 w-32" />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 dark:bg-gray-900 dark:border-gray-800">
      <Skeleton className="h-5 w-32 mb-4" />
      <Skeleton variant="rectangular" className="h-64 w-full" />
    </div>
  );
}
