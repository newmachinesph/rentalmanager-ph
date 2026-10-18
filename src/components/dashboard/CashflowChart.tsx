'use client';

import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { useIncomeStore } from '@/stores/incomeStore';
import { useExpenseStore } from '@/stores/expenseStore';
import type { ChartDataPoint } from '@/lib/types';

/* ---- Month helpers ---- */
const MONTH_LABELS = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
] as const;

/** Turn "YYYY-MM" into a readable label like "Jul 24" */
function formatMonthKey(key: string): string {
  const [yearStr, monthStr] = key.split('-');
  const monthIndex = parseInt(monthStr, 10) - 1;
  const shortMonth = MONTH_LABELS[monthIndex];
  const shortYear = yearStr.slice(2); // "2024" → "24"
  return `${shortMonth[0]}${shortMonth.slice(1).toLowerCase()} ${shortYear}`;
}

/** Turn "YYYY-MM" into a display date like "1 Jul 2024" (first of month) */
function formatRangeDate(key: string, last: boolean): string {
  const [yearStr, monthStr] = key.split('-');
  const monthIndex = parseInt(monthStr, 10) - 1;
  const shortMonth = MONTH_LABELS[monthIndex];
  const monthName = `${shortMonth[0]}${shortMonth.slice(1).toLowerCase()}`;

  if (!last) {
    return `1 ${monthName} ${yearStr}`;
  }
  // Last day of the month
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const lastDay = new Date(year, month, 0).getDate();
  return `${lastDay} ${monthName} ${yearStr}`;
}

/* ---- Compute cashflow data from stores ---- */
function useCashflowData(): { data: ChartDataPoint[]; rangeStart: string; rangeEnd: string } {
  const incomeRecords = useIncomeStore((s) => s.records);
  const expenseRecords = useExpenseStore((s) => s.records);

  return useMemo(() => {
    const monthlyIncome: Record<string, number> = {};
    const monthlyExpenses: Record<string, number> = {};

    // Group income by month using dueDate (YYYY-MM-DD → YYYY-MM)
    for (const record of incomeRecords) {
      const monthKey = record.dueDate.slice(0, 7); // "2024-08-05" → "2024-08"
      monthlyIncome[monthKey] = (monthlyIncome[monthKey] ?? 0) + record.amount;
    }

    // Group expenses by month using date (YYYY-MM-DD → YYYY-MM)
    for (const record of expenseRecords) {
      const monthKey = record.date.slice(0, 7);
      monthlyExpenses[monthKey] = (monthlyExpenses[monthKey] ?? 0) + record.amount;
    }

    // Collect all unique month keys and sort chronologically
    const allMonths = Array.from(
      new Set([...Object.keys(monthlyIncome), ...Object.keys(monthlyExpenses)])
    ).sort();

    if (allMonths.length === 0) {
      return { data: [], rangeStart: '', rangeEnd: '' };
    }

    // Build chart data points
    const data: ChartDataPoint[] = allMonths.map((monthKey) => {
      const income = monthlyIncome[monthKey] ?? 0;
      const expenses = monthlyExpenses[monthKey] ?? 0;
      return {
        month: formatMonthKey(monthKey),
        income,
        expenses,
        net: income - expenses,
      };
    });

    return {
      data,
      rangeStart: formatRangeDate(allMonths[0], false),
      rangeEnd: formatRangeDate(allMonths[allMonths.length - 1], true),
    };
  }, [incomeRecords, expenseRecords]);
}

/* ---- Custom tooltip ---- */
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload) return null;
  return (
    <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-3 min-w-[180px]">
      <p className="text-sm font-medium text-slate-500 mb-2">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-4 text-sm py-0.5">
          <span className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-slate-600">{entry.name}</span>
          </span>
          <span className="font-semibold text-slate-800">
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ---- Custom legend (dot + label) ---- */
function CustomLegend() {
  const items = [
    { color: '#F97316', label: 'INCOME' },
    { color: '#FBBF24', label: 'EXPENSES' },
    { color: '#1E293B', label: 'NET' },
  ];
  return (
    <div className="flex items-center justify-end gap-5 mt-2 mr-2">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}

export function CashflowChart() {
  const { data, rangeStart, rangeEnd } = useCashflowData();

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold text-slate-800">Cashflow</h3>
        {rangeStart && rangeEnd && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-3 py-1 text-xs font-medium text-slate-600 bg-slate-100 rounded-full">
              {rangeStart}
            </span>
            <span className="text-xs text-slate-400">|</span>
            <span className="inline-flex items-center px-3 py-1 text-xs font-medium text-slate-600 bg-slate-100 rounded-full">
              {rangeEnd}
            </span>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="h-[280px]">
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-slate-400">
            No income or expense records yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
              barCategoryGap="20%"
              barGap={2}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e2e8f0"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) =>
                  v === 0 ? '0' : `${(v / 1000).toFixed(0)}k`
                }
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(148,163,184,0.08)' }}
              />
              <Bar
                dataKey="income"
                name="Income"
                fill="#F97316"
                radius={[2, 2, 0, 0]}
                maxBarSize={18}
              />
              <Bar
                dataKey="expenses"
                name="Expenses"
                fill="#FBBF24"
                radius={[2, 2, 0, 0]}
                maxBarSize={18}
              />
              <Bar
                dataKey="net"
                name="Net"
                fill="#1E293B"
                radius={[2, 2, 0, 0]}
                maxBarSize={18}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend */}
      <CustomLegend />
    </div>
  );
}
