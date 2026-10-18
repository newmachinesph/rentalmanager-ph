'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Building2,
  ChevronRight,
  Plus,
  Receipt,
  Calendar,
  Navigation,
  FileText,
  ScrollText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClickOutside } from '@/lib/hooks';
import type { Property } from '@/lib/types';

/* ------------------------------------------------------------------ types */

interface PropertyHeaderProps {
  property: Property;
  onAddExpense: () => void;
  onAddReminder: () => void;
  onAddMileage: () => void;
  onAddNote: () => void;
  onCreateLease: () => void;
}

/* ========================================================= PropertyHeader */

export function PropertyHeader({
  property,
  onAddExpense,
  onAddReminder,
  onAddMileage,
  onAddNote,
  onCreateLease,
}: PropertyHeaderProps) {
  /* ----- dropdown state ----- */
  const [addOpen, setAddOpen] = useState(false);
  const addRef = useRef<HTMLDivElement>(null);

  useClickOutside(addRef, () => setAddOpen(false));

  /* Escape to close dropdown */
  const handleKeyboard = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && addOpen) {
        setAddOpen(false);
      }
    },
    [addOpen]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyboard);
    return () => document.removeEventListener('keydown', handleKeyboard);
  }, [handleKeyboard]);

  /* ----- Add menu items ----- */
  const addItems = [
    { icon: ScrollText, label: 'Lease', action: onCreateLease },
    { icon: Receipt, label: 'Expense', action: onAddExpense },
    { icon: Calendar, label: 'Reminder', action: onAddReminder },
    { icon: Navigation, label: 'Mileage', action: onAddMileage },
    { icon: FileText, label: 'Note', action: onAddNote },
  ];

  /* ----- Derive breadcrumb label from address ----- */
  const addressFirstPart = property.address.split(',')[0].trim();

  /* ----- Full address string ----- */
  const fullAddress = `${property.address}, ${property.barangay}, ${property.city}, ${property.province} ${property.zipCode}`;

  return (
    <div className="space-y-3">
      {/* ==================== Breadcrumb ==================== */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-gray-400">
        <Link
          href="/properties"
          className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          Properties
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-slate-800 dark:text-white">{addressFirstPart}</span>
      </nav>

      {/* ==================== Header row ==================== */}
      <div className="flex items-start justify-between gap-4">
        {/* ---------- Left: icon + title + subtitle ---------- */}
        <div className="flex items-start gap-3.5">
          {/* Blue circle icon */}
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-500">
            <Building2 className="h-5 w-5 text-white" />
          </div>

          {/* Title row + address subtitle */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">
                {property.name}
              </h1>

              {/* Edit property link */}
              <Link
                href={`/properties?edit=${property.id}`}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              >
                Edit property
              </Link>
            </div>

            <p className="text-sm text-slate-500 dark:text-gray-400">
              {fullAddress}
            </p>
          </div>
        </div>

        {/* ---------- Right: + Add button ---------- */}
        <div ref={addRef} className="relative shrink-0">
          <button
            onClick={() => setAddOpen(!addOpen)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors',
              'hover:bg-blue-700 active:bg-blue-800',
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
    </div>
  );
}
