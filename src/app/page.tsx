'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Home, CalendarDays, AlertCircle, ChevronDown, ChevronLeft, ChevronRight,
  TrendingUp, TrendingDown, Building2,
} from 'lucide-react';
import { cn, formatCurrency, calculatePenalty } from '@/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { usePropertyStore } from '@/stores/propertyStore';
import { useIncomeStore } from '@/stores/incomeStore';
import { useExpenseStore } from '@/stores/expenseStore';
import { useLeaseStore } from '@/stores/leaseStore';
import { useAppStore } from '@/stores/appStore';
import { useSessionStore } from '@/lib/session';
import { CashflowChart } from '@/components/dashboard/CashflowChart';
import { IncomeBreakdown } from '@/components/dashboard/IncomeBreakdown';
import { PropertiesDropdown } from '@/components/dashboard/filters/PropertiesDropdown';
import { CategoriesDropdown } from '@/components/dashboard/filters/CategoriesDropdown';
import { KpiCardSkeleton, ChartSkeleton, Skeleton } from '@/components/ui/Skeleton';

/* ---- Calendar event types (matches CalendarPanel) ---- */
type EventType = 'rent-due' | 'lease-expiry' | 'maintenance' | 'inspection';

interface CalendarEvent {
  id: string;
  title: string;
  date: string; // 'YYYY-MM-DD'
  type: EventType;
}

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

/* ========================================================================
   Main Dashboard Page
   ======================================================================== */
export default function DashboardPage() {
  /* ---- Zustand store data ---- */
  const properties = usePropertyStore((s) => s.properties);
  const fetchProperties = usePropertyStore((s) => s.fetchProperties);
  const allIncomeRecords = useIncomeStore((s) => s.records);
  const fetchIncomeRecords = useIncomeStore((s) => s.fetchRecords);
  const allExpenseRecords = useExpenseStore((s) => s.records);
  const fetchExpenseRecords = useExpenseStore((s) => s.fetchRecords);
  const leases = useLeaseStore((s) => s.leases);
  const fetchLeases = useLeaseStore((s) => s.fetchLeases);
  const propertyLoading = usePropertyStore((s) => s.loading);
  const incomeLoading = useIncomeStore((s) => s.loading);
  const setCalendarPanelOpen = useAppStore((s) => s.setCalendarPanelOpen);
  const dashboardLoading = propertyLoading || incomeLoading;
  const sessionUser = useSessionStore((s) => s.user);
  const fetchUser = useSessionStore((s) => s.fetchUser);
  const sessionLoaded = useSessionStore((s) => s.loaded);

  const [penaltyRate, setPenaltyRate] = useState(0.01);

  useEffect(() => {
    fetchProperties();
    fetchIncomeRecords();
    fetchExpenseRecords();
    fetchLeases();
    if (!sessionLoaded) fetchUser();
    fetch('/api/settings/general')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.penaltyRatePerMonth != null) setPenaltyRate(data.penaltyRatePerMonth); })
      .catch(() => {});
  }, [fetchProperties, fetchIncomeRecords, fetchExpenseRecords, fetchLeases, sessionLoaded, fetchUser]);

  /* ---- Filter state ---- */
  const [filterProperties, setFilterProperties] = useState<Set<string>>(new Set());
  const [filterCategories, setFilterCategories] = useState<Set<string>>(new Set());

  /* ---- Build set of all unitIds belonging to a property (for property-level filter) ---- */
  const unitIdsForProperty = useMemo(() => {
    const map = new Map<string, Set<string>>();
    properties.forEach((p) => {
      const ids = new Set(p.units.map((u) => u.id));
      map.set(p.id, ids);
    });
    return map;
  }, [properties]);

  /* ---- Filtered income/expense records ---- */
  const incomeRecords = useMemo(() => {
    let filtered = allIncomeRecords;

    if (filterProperties.size > 0) {
      filtered = filtered.filter((r) => {
        for (const id of filterProperties) {
          if (r.propertyId === id) return true;
          if (r.unitId === id) return true;
          const unitSet = unitIdsForProperty.get(id);
          if (r.unitId && unitSet && unitSet.has(r.unitId)) return true;
        }
        return false;
      });
    }

    if (filterCategories.size > 0) {
      filtered = filtered.filter((r) => filterCategories.has(r.category));
    }

    return filtered;
  }, [allIncomeRecords, filterProperties, filterCategories, unitIdsForProperty]);

  const expenseRecords = useMemo(() => {
    let filtered = allExpenseRecords;

    if (filterProperties.size > 0) {
      filtered = filtered.filter((r) => {
        for (const id of filterProperties) {
          if (r.propertyId === id) return true;
          if (r.unitId === id) return true;
          const unitSet = unitIdsForProperty.get(id);
          if (unitSet && r.unitId && unitSet.has(r.unitId)) return true;
        }
        return false;
      });
    }

    if (filterCategories.size > 0) {
      filtered = filtered.filter((r) => filterCategories.has(r.category));
    }

    return filtered;
  }, [allExpenseRecords, filterProperties, filterCategories, unitIdsForProperty]);

  /* ---- Payment summary (derived from income store) ---- */
  const payment = useMemo(() => {
    let paidTotal = 0;
    let overdueTotal = 0;
    let overdueCount = 0;
    let upcomingTotal = 0;
    let upcomingCount = 0;
    let penaltyTotal = 0;

    incomeRecords.forEach((r) => {
      if (r.status === 'Paid') paidTotal += r.amount;
      if (r.status === 'Overdue') {
        overdueTotal += r.amount;
        overdueCount++;
        if (r.category === 'Rent') {
          const { penaltyAmount } = calculatePenalty(r.amount, r.dueDate, penaltyRate);
          penaltyTotal += penaltyAmount;
        }
      }
      if (r.status === 'Pending') {
        upcomingTotal += r.amount;
        upcomingCount++;
      }
    });

    return { paidTotal, overdueTotal, overdueCount, upcomingTotal, upcomingCount, penaltyTotal };
  }, [incomeRecords, penaltyRate]);

  /* ---- Property type counts (derived from property store) ---- */
  const propTypes = useMemo(() => {
    const counts: Record<string, number> = {};
    properties.forEach((p) => {
      counts[p.type] = (counts[p.type] || 0) + 1;
    });
    return counts;
  }, [properties]);

  /* ---- Occupancy (derived from property store) ---- */
  const allUnits = useMemo(() => properties.flatMap((p) => p.units), [properties]);
  const occupiedUnits = allUnits.filter((u) => u.status === 'Occupied').length;
  const occupancyPct = allUnits.length > 0
    ? Math.round((occupiedUnits / allUnits.length) * 100)
    : 0;

  /* ---- Rent received last month (paid records from previous calendar month) ---- */
  const rentReceivedLastMonth = useMemo(() => {
    const now = new Date();
    const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const monthStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}`;

    return incomeRecords
      .filter((r) => r.status === 'Paid' && (r.paidDate || r.dueDate).startsWith(monthStr))
      .reduce((sum, r) => sum + r.amount, 0);
  }, [incomeRecords]);

  /* ---- Cash on Cash Return (trailing 12 months) ---- */
  const cashOnCash = useMemo(() => {
    const totalIncome = incomeRecords
      .filter((r) => r.status === 'Paid')
      .reduce((sum, r) => sum + r.amount, 0);
    const totalExpenses = expenseRecords.reduce((sum, r) => sum + r.amount, 0);
    const netIncome = totalIncome - totalExpenses;
    // Total cash invested = sum of security deposits + advance payments from leases
    const totalInvested = leases.reduce(
      (sum, l) => sum + (l.securityDeposit || 0) + (l.advancePayment || 0),
      0
    );
    if (totalInvested === 0) return 0;
    return Math.round((netIncome / totalInvested) * 1000) / 10; // one decimal
  }, [incomeRecords, expenseRecords, leases]);

  /* ---- Calendar state ---- */
  const now = new Date();
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [calYear, setCalYear] = useState(now.getFullYear());

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(calYear, calMonth, 1).getDay();

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  function handlePrevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
    else setCalMonth(calMonth - 1);
  }
  function handleNextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
    else setCalMonth(calMonth + 1);
  }

  /* ---- Calendar events (derived from store data) ---- */
  const unitNameMap = useMemo(() => {
    const map = new Map<string, string>();
    allUnits.forEach((u) => map.set(u.id, u.name));
    return map;
  }, [allUnits]);

  const calendarEvents = useMemo<CalendarEvent[]>(() => {
    const events: CalendarEvent[] = [];

    // Income due dates -> rent-due events
    allIncomeRecords.forEach((r) => {
      if (r.status === 'Pending' || r.status === 'Overdue') {
        const unitName = r.unitId ? unitNameMap.get(r.unitId) : null;
        const label = r.referenceNo || unitName || r.category;
        events.push({
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
        events.push({
          id: `lease-${l.id}`,
          title: `Lease expires - ${unitName}`,
          date: l.endDate,
          type: 'lease-expiry',
        });
      }
    });

    return events;
  }, [allIncomeRecords, leases, unitNameMap]);

  /* ---- Calendar events for the currently viewed month ---- */
  const calMonthEvents = useMemo(() => {
    const monthStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`;
    return calendarEvents.filter((evt) => evt.date.startsWith(monthStr));
  }, [calendarEvents, calYear, calMonth]);

  /* ---- Map of day -> event types for dot rendering ---- */
  const dayEventTypesMap = useMemo(() => {
    const map = new Map<number, Set<EventType>>();
    for (const evt of calMonthEvents) {
      const d = parseInt(evt.date.split('-')[2], 10);
      if (!map.has(d)) map.set(d, new Set());
      map.get(d)!.add(evt.type);
    }
    return map;
  }, [calMonthEvents]);

  /* ---- Dropdown states ---- */
  const [propertiesOpen, setPropertiesOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  /* ---- Properties donut data ---- */
  const TYPE_COLORS: Record<string, string> = {
    Condominium: '#10B981',
    Apartment: '#3B82F6',
    Townhouse: '#F97316',
    House: '#8B5CF6',
    Commercial: '#EF4444',
    'Boarding House': '#EC4899',
    Dormitory: '#F59E0B',
  };
  const propertyTypeEntries = Object.entries(propTypes);
  const totalProperties = propertyTypeEntries.reduce((sum, [, count]) => sum + count, 0);
  const propertiesDonutData = totalProperties === 0
    ? [{ name: 'Empty', value: 1 }]
    : propertyTypeEntries.map(([type, count]) => ({ name: type, value: count }));
  const propertiesDonutColors = totalProperties === 0
    ? ['#e2e8f0']
    : propertyTypeEntries.map(([type]) => TYPE_COLORS[type] || '#94A3B8');

  /* ---- Occupancy donut data ---- */
  const occupancyDonutData = [
    { name: 'Occupied', value: occupancyPct || 0.001 },
    { name: 'Vacant', value: (100 - occupancyPct) || 0.001 },
  ];
  const occupancyDonutColors = ['#10B981', '#e2e8f0'];

  if (dashboardLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton variant="rectangular" className="h-10 w-32" />
            <Skeleton variant="rectangular" className="h-10 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><ChartSkeleton /></div>
          <ChartSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ================================================================
          1. GREETING ROW
          ================================================================ */}
      <div className="flex items-center justify-between">
        <h1 className="text-[28px] font-bold text-slate-800">
          Hello{sessionUser?.name ? ` ${sessionUser.name.split(' ')[0]}` : ''},
        </h1>
        <div className="flex items-center gap-2">
          <PropertiesDropdown
            open={propertiesOpen}
            onToggle={() => { setPropertiesOpen(!propertiesOpen); setCategoriesOpen(false); }}
            onClose={() => setPropertiesOpen(false)}
            onSwitchToCategories={() => { setPropertiesOpen(false); setCategoriesOpen(true); }}
            selected={filterProperties}
            onChange={setFilterProperties}
          />
          <CategoriesDropdown
            open={categoriesOpen}
            onToggle={() => { setCategoriesOpen(!categoriesOpen); setPropertiesOpen(false); }}
            onClose={() => setCategoriesOpen(false)}
            selected={filterCategories}
            onChange={setFilterCategories}
          />
        </div>
      </div>

      {/* ================================================================
          2. THREE STAT CARDS
          ================================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Rent Received */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <Home className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Rent received</p>
              <p className="text-2xl font-bold text-slate-800">
                {formatCurrency(payment.paidTotal)}
              </p>
              <p className="text-xs text-slate-400">
                {formatCurrency(rentReceivedLastMonth)} Received last month
              </p>
            </div>
          </div>
        </div>

        {/* Upcoming Payments */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <CalendarDays className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Upcoming payments</p>
              <p className="text-2xl font-bold text-slate-800">
                {formatCurrency(payment.upcomingTotal)}
              </p>
              <p className="text-xs text-slate-400">
                {payment.upcomingCount} payment{payment.upcomingCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Rent Overdue */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Rent overdue</p>
              <p className="text-2xl font-bold text-slate-800">
                {formatCurrency(payment.overdueTotal)}
              </p>
              <p className="text-xs text-slate-400">
                {payment.overdueCount} overdue{payment.penaltyTotal > 0 ? ` · ${formatCurrency(payment.penaltyTotal)} penalty` : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================
          3. CASHFLOW + CALENDAR  (2/3 | 1/3)
          ================================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CashflowChart />
        </div>
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              <h3 className="text-base font-semibold text-slate-800">
                {monthNames[calMonth]} {calYear}
              </h3>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-0">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={`${day}-${i}`} className="text-center text-xs font-medium text-slate-400 py-1.5">
                {day}
              </div>
            ))}
            {calendarDays.map((day, idx) => {
              const isToday =
                day === now.getDate() &&
                calMonth === now.getMonth() &&
                calYear === now.getFullYear();
              const dotTypes = day !== null ? dayEventTypesMap.get(day) : undefined;
              return (
                <div
                  key={idx}
                  className="flex flex-col items-center"
                >
                  <div
                    className={`text-center text-sm py-1.5 w-7 h-7 flex items-center justify-center ${
                      day === null
                        ? ''
                        : isToday
                        ? 'bg-slate-800 text-white rounded-full font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 rounded-full cursor-pointer'
                    }`}
                  >
                    {day ?? ''}
                  </div>
                  {dotTypes && dotTypes.size > 0 && (
                    <div className="flex gap-[2px] mt-[1px]">
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
          <div className="mt-3 space-y-1.5">
            {calMonthEvents.length === 0 ? (
              <p className="text-xs text-slate-400 text-center">No events for the selected month</p>
            ) : (
              <ul className="space-y-1">
                {calMonthEvents.slice(0, 3).map((evt) => (
                  <li key={evt.id} className="flex items-center gap-2 px-1 py-1 rounded hover:bg-slate-50">
                    <span className={cn('block h-1.5 w-1.5 rounded-full flex-shrink-0', EVENT_DOT_COLORS[evt.type])} />
                    <span className="text-xs text-slate-600 truncate">{evt.title}</span>
                    <span className={cn('text-[10px] ml-auto flex-shrink-0', EVENT_TEXT_COLORS[evt.type])}>
                      {evt.date.split('-')[2]}/{evt.date.split('-')[1]}
                    </span>
                  </li>
                ))}
                {calMonthEvents.length > 3 && (
                  <p className="text-[10px] text-slate-400 text-center">
                    +{calMonthEvents.length - 3} more event{calMonthEvents.length - 3 !== 1 ? 's' : ''}
                  </p>
                )}
              </ul>
            )}
            <div className="text-center">
              <button
                onClick={() => setCalendarPanelOpen(true)}
                className="text-xs font-medium text-teal-600 hover:text-teal-700"
              >
                Open calendar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================
          4. PAYMENT STATUS + CASH ON CASH  (2/3 | 1/3)
          ================================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <IncomeBreakdown />
        </div>
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
          <h3 className="text-base font-semibold text-slate-800 mb-3">Cash on Cash Return</h3>
          <div className="flex items-center gap-3">
            <div className="text-3xl font-bold text-slate-800">{cashOnCash}%</div>
            <div className={`flex items-center gap-0.5 text-xs font-medium ${cashOnCash >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {cashOnCash >= 0
                ? <TrendingUp className="w-3.5 h-3.5" />
                : <TrendingDown className="w-3.5 h-3.5" />
              }
              trailing 12 months
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">Based on net income vs total deposits</p>
        </div>
      </div>

      {/* ================================================================
          5. PROPERTIES + OCCUPANCY  (1/2 | 1/2)
          ================================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Properties Donut */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Properties</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-2">
              {propertyTypeEntries.map(([type, count]) => (
                <div key={type} className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: TYPE_COLORS[type] || '#94A3B8' }}
                  />
                  <span className="text-sm text-slate-600">{type} {count}</span>
                </div>
              ))}
            </div>
            <div className="relative w-[100px] h-[100px] flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={propertiesDonutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={45}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {propertiesDonutData.map((_, i) => (
                      <Cell key={i} fill={propertiesDonutColors[i]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[9px] font-medium text-slate-400 uppercase">TOTAL</span>
                <span className="text-sm font-bold text-slate-800">{totalProperties}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Occupancy Donut */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Occupancy</h3>
          <div className="flex items-center justify-center">
            <div className="relative w-[120px] h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={occupancyDonutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={36}
                    outerRadius={54}
                    paddingAngle={1}
                    dataKey="value"
                    stroke="none"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {occupancyDonutData.map((_, i) => (
                      <Cell key={i} fill={occupancyDonutColors[i]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[9px] font-medium text-slate-400 uppercase">OCCUPIED</span>
                <span className="text-base font-bold text-slate-800">{occupancyPct}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
