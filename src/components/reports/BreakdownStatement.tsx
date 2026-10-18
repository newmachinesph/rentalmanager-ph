'use client';

import { useState, useMemo } from 'react';
import { FileText } from 'lucide-react';
import { usePropertyStore } from '@/stores/propertyStore';
import { useIncomeStore } from '@/stores/incomeStore';
import { useExpenseStore } from '@/stores/expenseStore';
import { formatCurrency } from '@/lib/utils';
import { IncomeCategory, ExpenseCategory } from '@/lib/types';
import { Th } from '@/components/ui/Th';
import { Td } from '@/components/ui/Td';
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

export function BreakdownStatement() {
  const [propertyId, setPropertyId] = useState('all');
  const reportDates = getReportDefaultDates();
  const [startDate, setStartDate] = useState(reportDates.startDate);
  const [endDate, setEndDate] = useState(reportDates.endDate);
  const [category, setCategory] = useState('all');

  const { properties } = usePropertyStore();
  const { records: incomeRecords } = useIncomeStore();
  const { records: expenseRecords } = useExpenseStore();

  const filteredProperties = useMemo(() => {
    if (propertyId === 'all') return properties;
    return properties.filter((p) => p.id === propertyId);
  }, [properties, propertyId]);

  const data = useMemo(() => {
    return filteredProperties.map((property) => {
      const propIncome = incomeRecords.filter((r) => {
        if (r.propertyId !== property.id) return false;
        if (r.dueDate < startDate || r.dueDate > endDate) return false;
        if (category !== 'all' && r.category !== category) return false;
        return true;
      });

      const propExpenses = expenseRecords.filter((r) => {
        if (r.propertyId !== property.id) return false;
        if (r.date < startDate || r.date > endDate) return false;
        if (category !== 'all' && r.category !== category) return false;
        return true;
      });

      const incomeByCat: Record<string, number> = {};
      for (const r of propIncome) {
        incomeByCat[r.category] = (incomeByCat[r.category] || 0) + r.amount;
      }

      const expenseByCat: Record<string, number> = {};
      for (const r of propExpenses) {
        expenseByCat[r.category] = (expenseByCat[r.category] || 0) + r.amount;
      }

      const totalIncome = propIncome.reduce((sum, r) => sum + r.amount, 0);
      const totalExpenses = propExpenses.reduce((sum, r) => sum + r.amount, 0);

      return {
        property,
        incomeByCat,
        expenseByCat,
        totalIncome,
        totalExpenses,
        net: totalIncome - totalExpenses,
      };
    });
  }, [filteredProperties, incomeRecords, expenseRecords, startDate, endDate, category]);

  const hasData = data.some((d) => d.totalIncome > 0 || d.totalExpenses > 0);

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
        <div className="space-y-6">
          {data.map((item) => {
            if (item.totalIncome === 0 && item.totalExpenses === 0) return null;
            return (
              <div
                key={item.property.id}
                className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden"
              >
                <div className="bg-slate-50 border-b border-slate-200 px-5 py-3">
                  <h3 className="text-sm font-semibold text-slate-800">
                    {item.property.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {item.property.address}, {item.property.city}
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <Th>Category</Th>
                        <Th align="right">Amount</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Income section */}
                      <tr className="bg-emerald-50">
                        <td
                          colSpan={2}
                          className="py-2 px-5 text-xs font-bold uppercase tracking-wider text-emerald-700"
                        >
                          Income
                        </td>
                      </tr>
                      {INCOME_CATEGORIES.map((cat) => {
                        const amount = item.incomeByCat[cat];
                        if (!amount) return null;
                        return (
                          <tr
                            key={cat}
                            className="border-b border-slate-100 hover:bg-slate-50"
                          >
                            <Td>{cat}</Td>
                            <Td align="right">
                              {formatCurrency(amount)}
                            </Td>
                          </tr>
                        );
                      })}
                      <tr className="border-b border-slate-200 bg-slate-50 font-semibold">
                        <Td className="text-emerald-700">Total Income</Td>
                        <Td align="right" className="text-emerald-700">
                          {formatCurrency(item.totalIncome)}
                        </Td>
                      </tr>

                      {/* Expense section */}
                      <tr className="bg-red-50">
                        <td
                          colSpan={2}
                          className="py-2 px-5 text-xs font-bold uppercase tracking-wider text-red-700"
                        >
                          Expenses
                        </td>
                      </tr>
                      {EXPENSE_CATEGORIES.map((cat) => {
                        const amount = item.expenseByCat[cat];
                        if (!amount) return null;
                        return (
                          <tr
                            key={cat}
                            className="border-b border-slate-100 hover:bg-slate-50"
                          >
                            <Td>{cat}</Td>
                            <Td align="right">
                              {formatCurrency(amount)}
                            </Td>
                          </tr>
                        );
                      })}
                      <tr className="border-b border-slate-200 bg-slate-50 font-semibold">
                        <Td className="text-red-600">Total Expenses</Td>
                        <Td align="right" className="text-red-600">
                          {formatCurrency(item.totalExpenses)}
                        </Td>
                      </tr>

                      {/* Net */}
                      <tr className="bg-slate-100 font-bold">
                        <Td className="text-slate-900">Net</Td>
                        <Td
                          align="right"
                          className={item.net < 0 ? 'text-red-600' : 'text-emerald-600'}
                        >
                          {formatCurrency(item.net)}
                        </Td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
