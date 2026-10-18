'use client';

import { Filter } from 'lucide-react';
import { cn, INPUT_CLASS } from '@/lib/utils';
import { usePropertyStore } from '@/stores/propertyStore';

interface ReportFiltersProps {
  propertyId: string;
  onPropertyChange: (id: string) => void;
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
  category?: string;
  onCategoryChange?: (cat: string) => void;
  categories?: string[];
  onFilter: () => void;
}

export function ReportFilters({
  propertyId,
  onPropertyChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  category,
  onCategoryChange,
  categories,
  onFilter,
}: ReportFiltersProps) {
  const { properties } = usePropertyStore();

  return (
    <div className="flex flex-wrap items-end gap-3">
      {/* Properties */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-500">Properties</label>
        <select
          value={propertyId}
          onChange={(e) => onPropertyChange(e.target.value)}
          className={cn(INPUT_CLASS, 'w-44')}
        >
          <option value="all">All Properties</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Start Date */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-500">From</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className={cn(INPUT_CLASS, 'w-40')}
        />
      </div>

      {/* End Date */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-500">To</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          className={cn(INPUT_CLASS, 'w-40')}
        />
      </div>

      {/* Categories (optional) */}
      {categories && onCategoryChange && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500">Categories</label>
          <select
            value={category || 'all'}
            onChange={(e) => onCategoryChange(e.target.value)}
            className={cn(INPUT_CLASS, 'w-44')}
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Filter button */}
      <button
        onClick={onFilter}
        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
      >
        <Filter className="h-4 w-4" />
        Filter
      </button>
    </div>
  );
}
