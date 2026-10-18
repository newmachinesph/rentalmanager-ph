'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, parseISO, isSameMonth, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/appStore';
import { useIncomeStore } from '@/stores/incomeStore';
import { useLeaseStore } from '@/stores/leaseStore';
import { usePropertyStore } from '@/stores/propertyStore';
import { useMaintenanceStore } from '@/stores/maintenanceStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EventType = 'rent-due' | 'lease-expiry' | 'maintenance' | 'inspection';

interface CalendarEvent {
  id: string;
  title: string;
  date: string; // 'YYYY-MM-DD'
  type: EventType;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const EVENT_DOT_COLORS: Record<EventType, string> = {
  'rent-due':     'bg-blue-500',
  'lease-expiry': 'bg-amber-500',
  'maintenance':  'bg-red-500',
  'inspection':   'bg-green-500',
};

const EVENT_TEXT_COLORS: Record<EventType, string> = {
  'rent-due':     'text-blue-500',
  'lease-expiry': 'text-amber-500',
  'maintenance':  'text-red-500',
  'inspection':   'text-green-500',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CalendarPanel() {
  const open = useAppStore((s) => s.calendarPanelOpen);
  const setOpen = useAppStore((s) => s.setCalendarPanelOpen);

  /* ---- Store data ---- */
  const incomeRecords = useIncomeStore((s) => s.records);
  const leases = useLeaseStore((s) => s.leases);
  const properties = usePropertyStore((s) => s.properties);
  const maintenanceRequests = useMaintenanceStore((s) => s.requests);

  // Map unitId -> unit name for friendly labels
  const unitNameMap = useMemo(() => {
    const map = new Map<string, string>();
    properties.forEach((p) => p.units.forEach((u) => map.set(u.id, u.name)));
    return map;
  }, [properties]);

  /* ---- Build events from real data ---- */
  const events = useMemo<CalendarEvent[]>(() => {
    const result: CalendarEvent[] = [];

    // Income due dates -> rent-due events
    incomeRecords.forEach((r) => {
      if (r.status === 'Pending' || r.status === 'Overdue' || r.status === 'Unpaid') {
        const unitName = r.unitId ? unitNameMap.get(r.unitId) : null;
        const label = r.referenceNo || unitName || r.category;
        result.push({
          id: `inc-${r.id}`,
          title: `${r.category} due - ${label}`,
          date: r.dueDate,
          type: 'rent-due',
        });
      }
    });

    // Lease end dates -> lease-expiry events
    leases.forEach((l) => {
      if (l.status === 'Active') {
        const unitName = unitNameMap.get(l.unitId) || 'Unit';
        result.push({
          id: `lease-${l.id}`,
          title: `Lease expires - ${unitName}`,
          date: l.endDate,
          type: 'lease-expiry',
        });
      }
    });

    // Maintenance requests -> maintenance events
    maintenanceRequests.forEach((m) => {
      if (m.status === 'Open' || m.status === 'In Progress') {
        const date = m.dateReported || m.createdAt?.split('T')[0] || '';
        if (date) {
          result.push({
            id: `maint-${m.id}`,
            title: `${m.title} - ${m.category}`,
            date,
            type: 'maintenance',
          });
        }
      }
    });

    return result;
  }, [incomeRecords, leases, maintenanceRequests, unitNameMap]);

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Reset to current month and clear selection when panel opens
  useEffect(() => {
    if (open) {
      setViewYear(today.getFullYear());
      setViewMonth(today.getMonth());
      setSelectedDay(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) setOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, setOpen]);

  // Clear day selection when navigating months
  const goToPrevMonth = () => {
    setSelectedDay(null);
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };

  const goToNextMonth = () => {
    setSelectedDay(null);
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  // Calendar grid
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isToday = (day: number) =>
    day === today.getDate() &&
    viewMonth === today.getMonth() &&
    viewYear === today.getFullYear();

  // Build a map of day -> event types for the current view month
  const viewDate = new Date(viewYear, viewMonth, 1);

  const eventsForMonth = useMemo(
    () => events.filter((evt) => evt.date && isSameMonth(parseISO(evt.date), viewDate)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [events, viewYear, viewMonth],
  );

  const dayEventTypesMap = useMemo(() => {
    const map = new Map<number, Set<EventType>>();
    for (const evt of eventsForMonth) {
      const d = parseISO(evt.date).getDate();
      if (!map.has(d)) map.set(d, new Set());
      map.get(d)!.add(evt.type);
    }
    return map;
  }, [eventsForMonth]);

  // Events to display below the calendar
  const displayedEvents = useMemo(() => {
    if (selectedDay !== null) {
      const selected = new Date(viewYear, viewMonth, selectedDay);
      return events.filter((evt) => evt.date && isSameDay(parseISO(evt.date), selected));
    }
    return eventsForMonth;
  }, [selectedDay, viewYear, viewMonth, eventsForMonth, events]);

  // Section heading
  const eventsHeading = selectedDay !== null
    ? format(new Date(viewYear, viewMonth, selectedDay), 'MMMM d, yyyy')
    : `${MONTH_NAMES[viewMonth]} ${viewYear}`;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/20 transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setOpen(false)}
      />

      {/* Slide-over panel */}
      <div
        className={cn(
          'fixed top-0 right-0 z-50 h-full w-[380px] max-w-full bg-white shadow-2xl',
          'transform transition-transform duration-300 ease-in-out flex flex-col',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <h2 className="text-lg font-semibold text-slate-800">Calendar</h2>
          <button
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close calendar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Calendar content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={goToPrevMonth}
              className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-base font-semibold text-slate-800">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button
              onClick={goToNextMonth}
              className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAY_LABELS.map((d, i) => (
              <div key={i} className="flex items-center justify-center h-10 text-xs font-medium text-slate-400">
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              if (day === null) return <div key={i} className="h-12" />;

              const dotTypes = dayEventTypesMap.get(day);
              const isSelected = selectedDay === day;

              return (
                <div key={i} className="flex flex-col items-center justify-center h-12">
                  <button
                    type="button"
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    className={cn(
                      'flex items-center justify-center h-9 w-9 rounded-full text-sm transition-colors',
                      isToday(day) && !isSelected && 'bg-[#1BD5A4] text-white font-bold',
                      isSelected && 'bg-blue-600 text-white font-bold',
                      !isToday(day) && !isSelected && 'text-slate-700 hover:bg-slate-100',
                    )}
                  >
                    {day}
                  </button>
                  {/* Event dots */}
                  {dotTypes && dotTypes.size > 0 && (
                    <div className="flex gap-[3px] mt-[2px]">
                      {Array.from(dotTypes).map((type) => (
                        <span
                          key={type}
                          className={cn('block h-1 w-1 rounded-full', EVENT_DOT_COLORS[type])}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Events section */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">
              Events &mdash; {eventsHeading}
            </h3>

            {displayedEvents.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">
                No events{selectedDay !== null ? ' for the selected day' : ' for this month'}
              </p>
            ) : (
              <ul className="space-y-2">
                {displayedEvents.map((evt) => (
                  <li
                    key={evt.id}
                    className="flex items-start gap-3 rounded-lg px-3 py-2 hover:bg-slate-50 transition-colors"
                  >
                    <span
                      className={cn(
                        'mt-[5px] block h-2 w-2 shrink-0 rounded-full',
                        EVENT_DOT_COLORS[evt.type],
                      )}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">
                        {evt.title}
                      </p>
                      <p className={cn('text-xs', EVENT_TEXT_COLORS[evt.type])}>
                        {format(parseISO(evt.date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
