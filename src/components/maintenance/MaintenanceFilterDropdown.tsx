'use client';

import { useState, useRef } from 'react';
import { ChevronDown, Search, SlidersHorizontal, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClickOutside } from '@/lib/hooks';
import { RadioDot } from '@/components/ui/RadioDot';
import type { Priority } from '@/lib/types';
import type { CompletedInFilter } from '@/stores/maintenanceStore';

const PRIORITIES: Priority[] = ['Low', 'Medium', 'High', 'Urgent'];

const COMPLETED_IN_OPTIONS: { key: CompletedInFilter; label: string }[] = [
  { key: '60d', label: 'Last 60 days' },
  { key: '90d', label: 'Last 90 days' },
  { key: '12m', label: 'Last 12 months' },
  { key: '2y', label: 'Last 2 years' },
  { key: 'all', label: 'All time' },
];

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        'flex h-4 w-4 items-center justify-center rounded border flex-shrink-0 transition-colors',
        checked ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'
      )}
    >
      {checked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
    </span>
  );
}

interface Props {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  priorities: Set<Priority>;
  onPrioritiesChange: (value: Set<Priority>) => void;
  completedIn: CompletedInFilter;
  onCompletedInChange: (value: CompletedInFilter) => void;
}

export function MaintenanceFilterDropdown({
  searchQuery,
  onSearchChange,
  priorities,
  onPrioritiesChange,
  completedIn,
  onCompletedInChange,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [prioritiesOpen, setPrioritiesOpen] = useState(true);
  const [completedInOpen, setCompletedInOpen] = useState(true);

  useClickOutside(ref, () => setOpen(false));

  const activeCount = priorities.size + (completedIn !== '60d' ? 1 : 0) + (searchQuery ? 1 : 0);

  function togglePriority(p: Priority) {
    const next = new Set(priorities);
    if (next.has(p)) next.delete(p);
    else next.add(p);
    onPrioritiesChange(next);
  }

  function toggleAllPriorities() {
    if (priorities.size === PRIORITIES.length) {
      onPrioritiesChange(new Set());
    } else {
      onPrioritiesChange(new Set(PRIORITIES));
    }
  }

  const clearAll = () => {
    onSearchChange('');
    onPrioritiesChange(new Set());
    onCompletedInChange('60d');
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'inline-flex items-center gap-1.5 h-9 px-3.5 text-sm font-medium rounded-md transition-colors',
          activeCount > 0
            ? 'text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100'
            : 'text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100'
        )}
      >
        <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
        Filter{activeCount > 0 ? ` (${activeCount})` : ''}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-lg z-20">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <span className="text-sm font-semibold text-slate-800">Filter</span>
            <button
              onClick={clearAll}
              className="text-xs font-medium text-blue-500 hover:text-blue-600"
            >
              Clear all
            </button>
          </div>

          {/* Search */}
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search"
                className="w-full h-8 pl-3 pr-8 text-sm border border-slate-200 rounded-md bg-slate-50 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
              <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {/* Priorities section — multi-check */}
            <div className="border-b border-slate-100">
              <button
                onClick={() => setPrioritiesOpen(!prioritiesOpen)}
                className="flex items-center justify-between w-full px-4 py-2.5"
              >
                <div className="flex items-center gap-1.5">
                  <ChevronDown
                    className={cn(
                      'w-3.5 h-3.5 text-slate-400 transition-transform',
                      !prioritiesOpen && '-rotate-90'
                    )}
                  />
                  <span className="text-sm font-semibold text-slate-800">Priorities</span>
                </div>
                <span
                  onClick={(e) => { e.stopPropagation(); toggleAllPriorities(); }}
                  className="text-xs font-medium text-blue-500 hover:text-blue-600 cursor-pointer"
                >
                  {priorities.size === PRIORITIES.length ? 'Deselect all' : 'Select all'}
                </span>
              </button>

              {prioritiesOpen && (
                <div className="px-4 pb-3 space-y-1">
                  {PRIORITIES.map((p) => (
                    <label
                      key={p}
                      className="flex items-center gap-3 px-2 py-1.5 rounded-md cursor-pointer hover:bg-slate-50"
                      onClick={() => togglePriority(p)}
                    >
                      <Checkbox checked={priorities.has(p)} />
                      <span className="text-sm text-slate-700">{p}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Completed in section — single-select (radio) */}
            <div>
              <button
                onClick={() => setCompletedInOpen(!completedInOpen)}
                className="flex items-center gap-1.5 w-full px-4 py-2.5"
              >
                <ChevronDown
                  className={cn(
                    'w-3.5 h-3.5 text-slate-400 transition-transform',
                    !completedInOpen && '-rotate-90'
                  )}
                />
                <span className="text-sm font-semibold text-slate-800">Completed in</span>
              </button>

              {completedInOpen && (
                <div className="px-4 pb-3 space-y-1">
                  {COMPLETED_IN_OPTIONS.map((opt) => (
                    <label
                      key={opt.key}
                      className="flex items-center gap-3 px-2 py-1.5 rounded-md cursor-pointer hover:bg-slate-50"
                      onClick={() => onCompletedInChange(opt.key)}
                    >
                      <RadioDot active={completedIn === opt.key} />
                      <span className="text-sm text-slate-700">{opt.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
