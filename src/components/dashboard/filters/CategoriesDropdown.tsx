'use client';

import { useState, useRef } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClickOutside } from '@/lib/hooks';

/* ---- Category lists ---- */
const PAYMENT_CATEGORIES = [
  'Rent',
  'Security Deposit',
  'Advance Payment',
  'Late Fee',
  'Parking',
  'Utilities Reimbursement',
  'Association Dues',
  'Other Income',
];

const EXPENSE_CATEGORIES = [
  'Advertising',
  'Cleaning',
  'HOA/Association Dues',
  'Insurance',
  'Landscaping',
  'Legal Fees',
  'Maintenance',
  'Management Fee',
  'Other Expense',
  'Pest Control',
  'Property Tax',
  'Repairs',
  'Supplies',
  'Utilities',
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
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  selected: Set<string>;
  onChange: (values: Set<string>) => void;
}

export function CategoriesDropdown({ open, onToggle, onClose, selected, onChange }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState('');
  const [paymentExpanded, setPaymentExpanded] = useState(true);
  const [expenseExpanded, setExpenseExpanded] = useState(true);

  useClickOutside(ref, onClose);

  const q = search.toLowerCase();
  const filteredPayment = PAYMENT_CATEGORIES.filter((c) =>
    c.toLowerCase().includes(q)
  );
  const filteredExpense = EXPENSE_CATEGORIES.filter((c) =>
    c.toLowerCase().includes(q)
  );

  function toggle(cat: string) {
    const next = new Set(selected);
    if (next.has(cat)) next.delete(cat);
    else next.add(cat);
    onChange(next);
  }

  function toggleSection(cats: string[]) {
    const allSelected = cats.every((c) => selected.has(c));
    const next = new Set(selected);
    if (allSelected) {
      cats.forEach((c) => next.delete(c));
    } else {
      cats.forEach((c) => next.add(c));
    }
    onChange(next);
  }

  function clearAll() {
    onChange(new Set());
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={onToggle}
        className={cn(
          'inline-flex items-center gap-1.5 h-9 px-3.5 text-sm font-medium rounded-md transition-colors',
          selected.size > 0
            ? 'text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100'
            : 'text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100'
        )}
      >
        Categories{selected.size > 0 ? ` (${selected.size})` : ''}
        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 text-slate-400 transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-72 bg-white border border-slate-200 rounded-lg shadow-lg z-20">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800">Categories</h3>
            {selected.size > 0 && (
              <button
                onClick={clearAll}
                className="text-xs font-medium text-blue-500 hover:text-blue-600"
              >
                Clear all
              </button>
            )}
          </div>

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

          {/* Scrollable content */}
          <div className="max-h-80 overflow-y-auto">
            {/* Payment section */}
            {filteredPayment.length > 0 && (
              <div>
                <button
                  onClick={() => setPaymentExpanded(!paymentExpanded)}
                  className="flex items-center justify-between w-full px-4 py-2.5 hover:bg-slate-50"
                >
                  <div className="flex items-center gap-2">
                    <ChevronDown
                      className={cn(
                        'w-3.5 h-3.5 text-slate-400 transition-transform',
                        !paymentExpanded && '-rotate-90'
                      )}
                    />
                    <span className="text-sm font-semibold text-slate-800">
                      Payment
                    </span>
                  </div>
                  <span
                    onClick={(e) => { e.stopPropagation(); toggleSection(filteredPayment); }}
                    className="text-xs font-medium text-blue-500 hover:text-blue-600 cursor-pointer"
                  >
                    {filteredPayment.every((c) => selected.has(c)) ? 'Deselect all' : 'Select all'}
                  </span>
                </button>

                {paymentExpanded && (
                  <div className="px-2 pb-2">
                    {filteredPayment.map((cat) => (
                      <label
                        key={cat}
                        onClick={() => toggle(cat)}
                        className="flex items-center gap-3 px-4 py-1.5 rounded-md cursor-pointer hover:bg-slate-50"
                      >
                        <Checkbox checked={selected.has(cat)} />
                        <span className="text-sm text-slate-700">{cat}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Expense section */}
            {filteredExpense.length > 0 && (
              <div>
                <button
                  onClick={() => setExpenseExpanded(!expenseExpanded)}
                  className="flex items-center justify-between w-full px-4 py-2.5 hover:bg-slate-50"
                >
                  <div className="flex items-center gap-2">
                    <ChevronDown
                      className={cn(
                        'w-3.5 h-3.5 text-slate-400 transition-transform',
                        !expenseExpanded && '-rotate-90'
                      )}
                    />
                    <span className="text-sm font-semibold text-slate-800">
                      Expense
                    </span>
                  </div>
                  <span
                    onClick={(e) => { e.stopPropagation(); toggleSection(filteredExpense); }}
                    className="text-xs font-medium text-blue-500 hover:text-blue-600 cursor-pointer"
                  >
                    {filteredExpense.every((c) => selected.has(c)) ? 'Deselect all' : 'Select all'}
                  </span>
                </button>

                {expenseExpanded && (
                  <div className="px-2 pb-2">
                    {filteredExpense.map((cat) => (
                      <label
                        key={cat}
                        onClick={() => toggle(cat)}
                        className="flex items-center gap-3 px-4 py-1.5 rounded-md cursor-pointer hover:bg-slate-50"
                      >
                        <Checkbox checked={selected.has(cat)} />
                        <span className="text-sm text-slate-700">{cat}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {filteredPayment.length === 0 && filteredExpense.length === 0 && (
              <p className="px-4 py-6 text-xs text-slate-400 text-center">
                No results
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
