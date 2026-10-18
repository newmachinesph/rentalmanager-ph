'use client';

import { useState, useMemo } from 'react';
import { FileText } from 'lucide-react';
import { usePropertyStore } from '@/stores/propertyStore';
import { useIncomeStore } from '@/stores/incomeStore';
import { useExpenseStore } from '@/stores/expenseStore';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Th } from '@/components/ui/Th';
import { Td } from '@/components/ui/Td';
import { TableWrapper } from '@/components/ui/TableWrapper';
import { EmptyState } from '@/components/ui/EmptyState';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { getReportDefaultDates } from '@/lib/reportConfig';

interface TransactionRow {
  date: string;
  description: string;
  propertyName: string;
  income: number;
  expense: number;
}

export function AccountTransactions() {
  const [propertyId, setPropertyId] = useState('all');
  const reportDates = getReportDefaultDates();
  const [startDate, setStartDate] = useState(reportDates.startDate);
  const [endDate, setEndDate] = useState(reportDates.endDate);

  const { properties } = usePropertyStore();
  const { records: incomeRecords } = useIncomeStore();
  const { records: expenseRecords } = useExpenseStore();

  const propertyMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of properties) {
      map[p.id] = p.name;
    }
    return map;
  }, [properties]);

  const transactions = useMemo(() => {
    const rows: TransactionRow[] = [];

    // Only include paid income records
    const filteredIncome = incomeRecords.filter((r) => {
      if (r.status !== 'Paid') return false;
      if (propertyId !== 'all' && r.propertyId !== propertyId) return false;
      const date = r.paidDate || r.dueDate;
      if (date < startDate || date > endDate) return false;
      return true;
    });

    for (const r of filteredIncome) {
      const desc = r.notes ? `${r.category} - ${r.notes}` : r.category;
      rows.push({
        date: r.paidDate || r.dueDate,
        description: desc,
        propertyName: propertyMap[r.propertyId] || 'Unknown',
        income: r.amount,
        expense: 0,
      });
    }

    const filteredExpenses = expenseRecords.filter((r) => {
      if (propertyId !== 'all' && r.propertyId !== propertyId) return false;
      if (r.date < startDate || r.date > endDate) return false;
      return true;
    });

    for (const r of filteredExpenses) {
      const desc = r.vendor
        ? `${r.category} - ${r.vendor}`
        : r.notes
          ? `${r.category} - ${r.notes}`
          : r.category;
      rows.push({
        date: r.date,
        description: desc,
        propertyName: propertyMap[r.propertyId] || 'Unknown',
        income: 0,
        expense: r.amount,
      });
    }

    // Sort by date ascending
    rows.sort((a, b) => a.date.localeCompare(b.date));

    return rows;
  }, [incomeRecords, expenseRecords, propertyId, startDate, endDate, propertyMap]);

  const hasData = transactions.length > 0;

  // Compute running balance
  const transactionsWithBalance = useMemo(() => {
    let balance = 0;
    return transactions.map((t) => {
      balance += t.income - t.expense;
      return { ...t, balance };
    });
  }, [transactions]);

  return (
    <div className="space-y-6">
      <ReportFilters
        propertyId={propertyId}
        onPropertyChange={setPropertyId}
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
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
                <Th>Date</Th>
                <Th>Description</Th>
                <Th>Property</Th>
                <Th align="right">Income</Th>
                <Th align="right">Expense</Th>
                <Th align="right">Balance</Th>
              </tr>
            </thead>
            <tbody>
              {transactionsWithBalance.map((t, idx) => (
                <tr
                  key={idx}
                  className="border-b border-slate-100 hover:bg-slate-50"
                >
                  <Td className="whitespace-nowrap">
                    {formatDate(t.date)}
                  </Td>
                  <Td>{t.description}</Td>
                  <Td>{t.propertyName}</Td>
                  <Td align="right">
                    {t.income > 0 ? (
                      <span className="text-emerald-600">{formatCurrency(t.income)}</span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </Td>
                  <Td align="right">
                    {t.expense > 0 ? (
                      <span className="text-red-600">{formatCurrency(t.expense)}</span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </Td>
                  <Td
                    align="right"
                    className={`font-medium ${
                      t.balance < 0 ? 'text-red-600' : ''
                    }`}
                  >
                    {formatCurrency(t.balance)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrapper>
      )}
    </div>
  );
}
