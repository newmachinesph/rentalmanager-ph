'use client';

import { useState, useMemo } from 'react';
import { FileText } from 'lucide-react';
import { useIncomeStore } from '@/stores/incomeStore';
import { useExpenseStore } from '@/stores/expenseStore';
import { formatCurrency, getMonthName } from '@/lib/utils';
import { IncomeCategory, ExpenseCategory } from '@/lib/types';
import { Th } from '@/components/ui/Th';
import { Td } from '@/components/ui/Td';
import { TableWrapper } from '@/components/ui/TableWrapper';
import { EmptyState } from '@/components/ui/EmptyState';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { getReportDefaultDates } from '@/lib/reportConfig';

const INCOME_CATEGORIES: IncomeCategory[] = [
  'Rent',
  'Parking',
  'Utilities Reimbursement',
  'Association Dues',
  'Late Fee',
  'Security Deposit',
  'Advance Payment',
  'Other Income',
];

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Maintenance',
  'Repairs',
  'Utilities',
  'Insurance',
  'Property Tax',
  'HOA/Association Dues',
  'Management Fee',
  'Cleaning',
  'Pest Control',
  'Landscaping',
  'Legal Fees',
  'Advertising',
  'Supplies',
  'Other Expense',
];

const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

export function IncomeExpenseStatement() {
  const [propertyId, setPropertyId] = useState('all');
  const reportDates = getReportDefaultDates();
  const [startDate, setStartDate] = useState(reportDates.startDate);
  const [endDate, setEndDate] = useState(reportDates.endDate);
  const [category, setCategory] = useState('all');

  const { records: incomeRecords } = useIncomeStore();
  const { records: expenseRecords } = useExpenseStore();

  const months = useMemo(() => {
    const result: { year: number; month: number }[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const current = new Date(start.getFullYear(), start.getMonth(), 1);
    while (current <= end) {
      result.push({ year: current.getFullYear(), month: current.getMonth() });
      current.setMonth(current.getMonth() + 1);
    }
    return result;
  }, [startDate, endDate]);

  const filteredIncome = useMemo(() => {
    return incomeRecords.filter((r) => {
      if (propertyId !== 'all' && r.propertyId !== propertyId) return false;
      if (r.dueDate < startDate || r.dueDate > endDate) return false;
      if (category !== 'all' && r.category !== category) return false;
      return true;
    });
  }, [incomeRecords, propertyId, startDate, endDate, category]);

  const filteredExpenses = useMemo(() => {
    return expenseRecords.filter((r) => {
      if (propertyId !== 'all' && r.propertyId !== propertyId) return false;
      if (r.date < startDate || r.date > endDate) return false;
      if (category !== 'all' && r.category !== category) return false;
      return true;
    });
  }, [expenseRecords, propertyId, startDate, endDate, category]);

  const data = useMemo(() => {
    const incomeByCategory: Record<string, Record<string, number>> = {};
    const expenseByCategory: Record<string, Record<string, number>> = {};

    for (const cat of INCOME_CATEGORIES) {
      incomeByCategory[cat] = {};
    }
    for (const cat of EXPENSE_CATEGORIES) {
      expenseByCategory[cat] = {};
    }

    for (const r of filteredIncome) {
      const d = new Date(r.dueDate);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!incomeByCategory[r.category]) incomeByCategory[r.category] = {};
      incomeByCategory[r.category][key] = (incomeByCategory[r.category][key] || 0) + r.amount;
    }

    for (const r of filteredExpenses) {
      const d = new Date(r.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!expenseByCategory[r.category]) expenseByCategory[r.category] = {};
      expenseByCategory[r.category][key] = (expenseByCategory[r.category][key] || 0) + r.amount;
    }

    return { incomeByCategory, expenseByCategory };
  }, [filteredIncome, filteredExpenses]);

  const hasData = filteredIncome.length > 0 || filteredExpenses.length > 0;

  const getMonthKey = (m: { year: number; month: number }) => `${m.year}-${m.month}`;

  const getCategoryMonthTotal = (
    catMap: Record<string, Record<string, number>>,
    cat: string,
    monthKey: string
  ) => catMap[cat]?.[monthKey] || 0;

  const getCategoryTotal = (
    catMap: Record<string, Record<string, number>>,
    cat: string
  ) => months.reduce((sum, m) => sum + getCategoryMonthTotal(catMap, cat, getMonthKey(m)), 0);

  const getMonthIncomeTotal = (monthKey: string) =>
    INCOME_CATEGORIES.reduce(
      (sum, cat) => sum + getCategoryMonthTotal(data.incomeByCategory, cat, monthKey),
      0
    );

  const getMonthExpenseTotal = (monthKey: string) =>
    EXPENSE_CATEGORIES.reduce(
      (sum, cat) => sum + getCategoryMonthTotal(data.expenseByCategory, cat, monthKey),
      0
    );

  const grandTotalIncome = months.reduce((sum, m) => sum + getMonthIncomeTotal(getMonthKey(m)), 0);
  const grandTotalExpenses = months.reduce((sum, m) => sum + getMonthExpenseTotal(getMonthKey(m)), 0);
  const grandNetProfit = grandTotalIncome - grandTotalExpenses;

  return (
    <div className="space-y-6">
      <ReportFilters
        propertyId={propertyId}
        onPropertyChange={setPropertyId}
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        category={category}
        onCategoryChange={setCategory}
        categories={ALL_CATEGORIES}
        onFilter={() => {}}
      />

      {!hasData ? (
        <EmptyState
          variant="inline"
          icon={FileText}
          title="No data for the selected period"
          description=""
        />
      ) : (
        <TableWrapper>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <Th>Category</Th>
                {months.map((m) => (
                  <Th key={getMonthKey(m)} align="right">
                    {getMonthName(m.month)} {m.year}
                  </Th>
                ))}
                <Th align="right">Total</Th>
              </tr>
            </thead>
            <tbody>
              {/* Income Categories */}
              <tr className="bg-emerald-50">
                <td
                  colSpan={months.length + 2}
                  className="py-2 px-5 text-xs font-bold uppercase tracking-wider text-emerald-700"
                >
                  Income
                </td>
              </tr>
              {INCOME_CATEGORIES.map((cat) => {
                const total = getCategoryTotal(data.incomeByCategory, cat);
                if (total === 0) return null;
                return (
                  <tr key={cat} className="border-b border-slate-100 hover:bg-slate-50">
                    <Td>{cat}</Td>
                    {months.map((m) => (
                      <Td key={getMonthKey(m)} align="right">
                        {formatCurrency(
                          getCategoryMonthTotal(data.incomeByCategory, cat, getMonthKey(m))
                        )}
                      </Td>
                    ))}
                    <Td align="right" className="font-medium">
                      {formatCurrency(total)}
                    </Td>
                  </tr>
                );
              })}

              {/* Expense Categories */}
              <tr className="bg-red-50">
                <td
                  colSpan={months.length + 2}
                  className="py-2 px-5 text-xs font-bold uppercase tracking-wider text-red-700"
                >
                  Expenses
                </td>
              </tr>
              {EXPENSE_CATEGORIES.map((cat) => {
                const total = getCategoryTotal(data.expenseByCategory, cat);
                if (total === 0) return null;
                return (
                  <tr key={cat} className="border-b border-slate-100 hover:bg-slate-50">
                    <Td>{cat}</Td>
                    {months.map((m) => (
                      <Td key={getMonthKey(m)} align="right">
                        {formatCurrency(
                          getCategoryMonthTotal(data.expenseByCategory, cat, getMonthKey(m))
                        )}
                      </Td>
                    ))}
                    <Td align="right" className="font-medium">
                      {formatCurrency(total)}
                    </Td>
                  </tr>
                );
              })}

              {/* Summary Rows */}
              <tr className="border-t-2 border-slate-300 bg-slate-50 font-semibold">
                <Td className="text-slate-800">Total Income</Td>
                {months.map((m) => (
                  <Td key={getMonthKey(m)} align="right" className="text-emerald-700">
                    {formatCurrency(getMonthIncomeTotal(getMonthKey(m)))}
                  </Td>
                ))}
                <Td align="right" className="text-emerald-700">
                  {formatCurrency(grandTotalIncome)}
                </Td>
              </tr>
              <tr className="bg-slate-50 font-semibold">
                <Td className="text-slate-800">Total Expenses</Td>
                {months.map((m) => (
                  <Td key={getMonthKey(m)} align="right" className="text-red-600">
                    {formatCurrency(getMonthExpenseTotal(getMonthKey(m)))}
                  </Td>
                ))}
                <Td align="right" className="text-red-600">
                  {formatCurrency(grandTotalExpenses)}
                </Td>
              </tr>
              <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                <Td className="text-slate-900">Net Profit</Td>
                {months.map((m) => {
                  const net =
                    getMonthIncomeTotal(getMonthKey(m)) - getMonthExpenseTotal(getMonthKey(m));
                  return (
                    <Td
                      key={getMonthKey(m)}
                      align="right"
                      className={net < 0 ? 'text-red-600' : 'text-emerald-600'}
                    >
                      {formatCurrency(net)}
                    </Td>
                  );
                })}
                <Td
                  align="right"
                  className={grandNetProfit < 0 ? 'text-red-600' : 'text-emerald-600'}
                >
                  {formatCurrency(grandNetProfit)}
                </Td>
              </tr>
            </tbody>
          </table>
        </TableWrapper>
      )}
    </div>
  );
}
