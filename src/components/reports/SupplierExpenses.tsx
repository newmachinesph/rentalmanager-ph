'use client';

import { useState, useMemo } from 'react';
import { useExpenseStore } from '@/stores/expenseStore';
import { formatCurrency } from '@/lib/utils';
import { FileText } from 'lucide-react';
import { Th } from '@/components/ui/Th';
import { Td } from '@/components/ui/Td';
import { TableWrapper } from '@/components/ui/TableWrapper';
import { EmptyState } from '@/components/ui/EmptyState';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { getReportDefaultDates } from '@/lib/reportConfig';

interface SupplierSummary {
  vendor: string;
  totalExpenses: number;
  transactionCount: number;
  averagePerTransaction: number;
}

export function SupplierExpenses() {
  const [propertyId, setPropertyId] = useState('all');
  const reportDates = getReportDefaultDates();
  const [startDate, setStartDate] = useState(reportDates.startDate);
  const [endDate, setEndDate] = useState(reportDates.endDate);

  const { records } = useExpenseStore();

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (propertyId !== 'all' && r.propertyId !== propertyId) return false;
      if (r.date < startDate || r.date > endDate) return false;
      return true;
    });
  }, [records, propertyId, startDate, endDate]);

  const supplierSummaries = useMemo(() => {
    const grouped: Record<string, { total: number; count: number }> = {};

    for (const r of filteredRecords) {
      const vendor = r.vendor || 'Unknown';
      if (!grouped[vendor]) {
        grouped[vendor] = { total: 0, count: 0 };
      }
      grouped[vendor].total += r.amount;
      grouped[vendor].count += 1;
    }

    const summaries: SupplierSummary[] = Object.entries(grouped).map(
      ([vendor, data]) => ({
        vendor,
        totalExpenses: data.total,
        transactionCount: data.count,
        averagePerTransaction: data.total / data.count,
      })
    );

    return summaries.sort((a, b) => b.totalExpenses - a.totalExpenses);
  }, [filteredRecords]);

  const grandTotal = useMemo(() => {
    return supplierSummaries.reduce((sum, s) => sum + s.totalExpenses, 0);
  }, [supplierSummaries]);

  const grandTransactionCount = useMemo(() => {
    return supplierSummaries.reduce((sum, s) => sum + s.transactionCount, 0);
  }, [supplierSummaries]);

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

      <TableWrapper>
        {supplierSummaries.length === 0 ? (
          <EmptyState
            variant="inline"
            icon={FileText}
            title="No data for the selected period"
            description=""
          />
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/60">
              <tr>
                <Th>Supplier</Th>
                <Th align="right">Total Expenses</Th>
                <Th align="right">Number of Transactions</Th>
                <Th align="right">Average per Transaction</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {supplierSummaries.map((s) => (
                <tr key={s.vendor} className="hover:bg-slate-50 transition-colors">
                  <Td>{s.vendor}</Td>
                  <Td align="right">{formatCurrency(s.totalExpenses)}</Td>
                  <Td align="right">{s.transactionCount}</Td>
                  <Td align="right">{formatCurrency(s.averagePerTransaction)}</Td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-semibold">
                <td className="py-3 px-5 text-sm text-slate-800">Grand Total</td>
                <td className="py-3 px-5 text-sm text-slate-800 text-right">
                  {formatCurrency(grandTotal)}
                </td>
                <td className="py-3 px-5 text-sm text-slate-800 text-right">
                  {grandTransactionCount}
                </td>
                <td className="py-3 px-5 text-sm text-slate-800 text-right">
                  {grandTransactionCount > 0
                    ? formatCurrency(grandTotal / grandTransactionCount)
                    : formatCurrency(0)}
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </TableWrapper>
    </div>
  );
}
