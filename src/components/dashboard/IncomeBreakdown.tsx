'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Clock, CheckCircle2, CalendarDays } from 'lucide-react';
import { useIncomeStore } from '@/stores/incomeStore';
import { formatCurrency } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

export function IncomeBreakdown() {
  const incomeRecords = useIncomeStore((s) => s.records);

  /* ---- Derive payment status totals from store records ---- */
  const { overdue, paid, upcoming, dateRange } = useMemo(() => {
    let o = 0;
    let p = 0;
    let u = 0;
    let earliest: string | null = null;
    let latest: string | null = null;

    incomeRecords.forEach((record) => {
      if (record.status === 'Overdue') o += record.amount;
      else if (record.status === 'Paid') p += record.amount;
      else if (record.status === 'Pending') u += record.amount;

      const date = record.dueDate;
      if (!earliest || date < earliest) earliest = date;
      if (!latest || date > latest) latest = date;
    });

    const formatLabel = (iso: string | null) => {
      if (!iso) return '—';
      try {
        return format(parseISO(iso), 'd MMM yyyy');
      } catch {
        return iso;
      }
    };

    return {
      overdue: o,
      paid: p,
      upcoming: u,
      dateRange: { from: formatLabel(earliest), to: formatLabel(latest) },
    };
  }, [incomeRecords]);

  const total = overdue + paid + upcoming;

  /* Donut data - gray ring when all zero, otherwise proportional */
  const donutData =
    total === 0
      ? [{ name: 'Empty', value: 1 }]
      : [
          { name: 'Overdue', value: overdue },
          { name: 'Paid', value: paid },
          { name: 'Upcoming', value: upcoming },
        ];

  const donutColors =
    total === 0
      ? ['#e2e8f0']
      : ['#EF4444', '#10B981', '#3B82F6'];

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold text-slate-800">
          Payment Status
        </h3>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-3 py-1 text-xs font-medium text-slate-600 bg-slate-100 rounded-full">
            {dateRange.from}
          </span>
          <span className="text-xs text-slate-400">|</span>
          <span className="inline-flex items-center px-3 py-1 text-xs font-medium text-slate-600 bg-slate-100 rounded-full">
            {dateRange.to}
          </span>
        </div>
      </div>

      {/* Content: donut + breakdown */}
      <div className="flex items-center gap-8">
        {/* Donut chart */}
        <div className="relative w-[160px] h-[160px] flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donutData}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={72}
                paddingAngle={total === 0 ? 0 : 2}
                dataKey="value"
                stroke="none"
              >
                {donutData.map((_, i) => (
                  <Cell key={i} fill={donutColors[i % donutColors.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">
              TOTAL
            </span>
            <span className="text-sm font-bold text-slate-800">
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        {/* Breakdown items */}
        <div className="flex-1 space-y-4">
          {/* Overdue */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-red-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-700">Overdue</p>
            </div>
            <span className="text-sm font-semibold text-red-500">
              {formatCurrency(overdue)}
            </span>
          </div>

          {/* Paid */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-700">Paid</p>
            </div>
            <span className="text-sm font-semibold text-emerald-500">
              {formatCurrency(paid)}
            </span>
          </div>

          {/* Upcoming */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
              <CalendarDays className="w-4 h-4 text-blue-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-700">Upcoming</p>
            </div>
            <span className="text-sm font-semibold text-blue-500">
              {formatCurrency(upcoming)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
