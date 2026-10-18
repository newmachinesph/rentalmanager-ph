'use client';

import { useState, useRef } from 'react';
import { ChevronDown, Search, Building2, LayoutGrid, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePropertyStore } from '@/stores/propertyStore';
import { useClickOutside } from '@/lib/hooks';

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
  selected: Set<string>;
  onChange: (values: Set<string>) => void;
}

export function MaintenancePropertiesDropdown({ selected, onChange }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const properties = usePropertyStore((s) => s.properties);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  useClickOutside(ref, () => setOpen(false));

  const q = search.toLowerCase();
  const filteredProps = properties.filter((p) => {
    if (!q) return true;
    if (p.name.toLowerCase().includes(q)) return true;
    if (p.address.toLowerCase().includes(q)) return true;
    return p.units.some((u) => u.name.toLowerCase().includes(q));
  });

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  }

  function clearAll() {
    onChange(new Set());
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'inline-flex items-center gap-1.5 h-9 px-3.5 text-sm font-medium rounded-md transition-colors',
          selected.size > 0
            ? 'text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100'
            : 'text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100'
        )}
      >
        Properties{selected.size > 0 ? ` (${selected.size})` : ''}
        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 text-slate-400 transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-72 bg-white border border-slate-200 rounded-lg shadow-lg z-20">
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

          {/* Clear all */}
          {selected.size > 0 && (
            <div className="flex justify-end px-4 py-2">
              <button
                onClick={clearAll}
                className="text-xs font-medium text-blue-500 hover:text-blue-600"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Hierarchical list */}
          <div className="max-h-72 overflow-y-auto px-2 pb-3">
            {filteredProps.map((prop) => (
              <div key={prop.id}>
                {/* Property row */}
                <label
                  className="flex items-center gap-3 pl-2 pr-2 py-2 rounded-md cursor-pointer hover:bg-slate-50"
                  onClick={() => toggle(prop.id)}
                >
                  <Checkbox checked={selected.has(prop.id)} />
                  <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-sm text-slate-700 truncate">{prop.name}</span>
                </label>

                {/* Unit rows */}
                {prop.units
                  .filter(
                    (u) =>
                      !q ||
                      u.name.toLowerCase().includes(q) ||
                      prop.name.toLowerCase().includes(q) ||
                      prop.address.toLowerCase().includes(q)
                  )
                  .map((unit) => (
                    <label
                      key={unit.id}
                      className="flex items-center gap-3 pl-10 pr-2 py-1.5 rounded-md cursor-pointer hover:bg-slate-50"
                      onClick={() => toggle(unit.id)}
                    >
                      <Checkbox checked={selected.has(unit.id)} />
                      <LayoutGrid className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="text-sm text-slate-600 truncate">{unit.name}</span>
                    </label>
                  ))}
              </div>
            ))}

            {filteredProps.length === 0 && (
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
