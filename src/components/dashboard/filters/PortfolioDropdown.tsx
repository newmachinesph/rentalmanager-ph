'use client';

import { useState, useRef } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClickOutside } from '@/lib/hooks';
import { RadioDot } from '@/components/ui/RadioDot';

const PORTFOLIOS = ['Organization'];

interface Props {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onSelect: (value: string | null) => void;
}

export function PortfolioDropdown({ open, onToggle, onClose, onSelect }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  // Click outside
  useClickOutside(ref, onClose);

  const filtered = PORTFOLIOS.filter((p) =>
    p.toLowerCase().includes(search.toLowerCase())
  );

  const selectAll = () => {
    setSelected(null);
    onSelect(null);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={onToggle}
        className="inline-flex items-center gap-1.5 h-9 px-3.5 text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 transition-colors"
      >
        Portfolio
        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 text-slate-400 transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-lg z-20">
          {/* Search */}
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search"
                className="w-full h-8 pl-3 pr-8 text-sm border border-slate-200 rounded-md bg-white text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
              <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>

          {/* Select all */}
          <div className="flex justify-end px-4 py-2">
            <button
              onClick={selectAll}
              className="text-xs font-medium text-blue-500 hover:text-blue-600"
            >
              Select all
            </button>
          </div>

          {/* List */}
          <div className="max-h-60 overflow-y-auto px-2 pb-3">
            {filtered.map((item) => (
              <label
                key={item}
                className="flex items-center gap-3 px-2 py-2 rounded-md cursor-pointer hover:bg-slate-50"
                onClick={() => { setSelected(item); onSelect(item); }}
              >
                <RadioDot active={selected === item} />
                <span className="text-sm text-slate-700">{item}</span>
              </label>
            ))}
            {filtered.length === 0 && (
              <p className="px-2 py-4 text-xs text-slate-400 text-center">
                No results
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
