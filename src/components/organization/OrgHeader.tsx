'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Building2,
  MoreVertical,
  Plus,
  Pencil,
  CreditCard,
  Receipt,
  Calendar,
  Navigation,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClickOutside } from '@/lib/hooks';

/* ------------------------------------------------------------------ types */

interface OrgHeaderProps {
  orgName: string;
  orgAddress: string;
  onAddPayment: () => void;
  onAddExpense: () => void;
  onAddReminder: () => void;
  onAddMileage: () => void;
  onAddNote: () => void;
  onEditOrganization: () => void;
}

/* ================================================================ OrgHeader */

export function OrgHeader({
  orgName,
  orgAddress,
  onAddPayment,
  onAddExpense,
  onAddReminder,
  onAddMileage,
  onAddNote,
  onEditOrganization,
}: OrgHeaderProps) {
  /* ----- dropdown state ----- */
  const [menuOpen, setMenuOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const addRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, () => setMenuOpen(false));
  useClickOutside(addRef, () => setAddOpen(false));

  /* Escape to close any open dropdown */
  const handleKeyboard = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (menuOpen) setMenuOpen(false);
        if (addOpen) setAddOpen(false);
      }
    },
    [menuOpen, addOpen]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyboard);
    return () => document.removeEventListener('keydown', handleKeyboard);
  }, [handleKeyboard]);

  /* ----- Add menu items ----- */
  const addItems = [
    { icon: CreditCard, label: 'Payment', action: onAddPayment },
    { icon: Receipt, label: 'Expense', action: onAddExpense },
    { icon: Calendar, label: 'Reminder', action: onAddReminder },
    { icon: Navigation, label: 'Mileage', action: onAddMileage },
    { icon: FileText, label: 'Note', action: onAddNote },
  ];

  return (
    <div className="flex items-start justify-between gap-4">
      {/* ==================== Left: org info ==================== */}
      <div className="flex items-start gap-3.5">
        {/* Blue circle icon */}
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-500">
          <Building2 className="h-5 w-5 text-white" />
        </div>

        {/* Title row + subtitle */}
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              {orgName}
            </h1>

            {/* Three-dot menu */}
            <div ref={menuRef} className="relative">
              <button
                onClick={() => {
                  setMenuOpen(!menuOpen);
                  setAddOpen(false);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                aria-label="Organization menu"
              >
                <MoreVertical className="h-4.5 w-4.5" />
              </button>

              {menuOpen && (
                <div className="absolute left-0 top-full mt-1 w-48 rounded-lg border border-slate-200 bg-white shadow-lg z-50 overflow-hidden dark:border-gray-700 dark:bg-gray-800">
                  <button
                    onClick={() => { onEditOrganization(); setMenuOpen(false); }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <Pencil className="h-4 w-4 text-slate-400 dark:text-gray-500" />
                    Edit organization
                  </button>
                </div>
              )}
            </div>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            {orgAddress}
          </p>
        </div>
      </div>

      {/* ==================== Right: + Add button ==================== */}
      <div ref={addRef} className="relative shrink-0">
        <button
          onClick={() => {
            setAddOpen(!addOpen);
            setMenuOpen(false);
          }}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors',
            'hover:bg-blue-600 active:bg-blue-700',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50'
          )}
        >
          <Plus className="h-4 w-4" />
          Add
        </button>

        {addOpen && (
          <div className="absolute right-0 top-full mt-1 w-44 rounded-lg border border-slate-200 bg-white shadow-lg z-50 overflow-hidden dark:border-gray-700 dark:bg-gray-800">
            <div className="py-1">
              {addItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    item.action();
                    setAddOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <item.icon className="h-4 w-4 text-slate-400 dark:text-gray-500" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
