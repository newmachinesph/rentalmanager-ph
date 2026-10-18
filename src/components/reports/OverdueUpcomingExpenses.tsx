'use client';

import { useState, useMemo } from 'react';
import { FileText } from 'lucide-react';
import { usePropertyStore } from '@/stores/propertyStore';
import { useExpenseStore } from '@/stores/expenseStore';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Th } from '@/components/ui/Th';
import { Td } from '@/components/ui/Td';
import { TableWrapper } from '@/components/ui/TableWrapper';
import { EmptyState } from '@/components/ui/EmptyState';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { getReportDefaultDates } from '@/lib/reportConfig';

export function OverdueUpcomingExpenses() {
  const [propertyId, setPropertyId] = useState('all');
  const reportDates = getReportDefaultDates();
  const [startDate, setStartDate] = useState(reportDates.startDate);
  const [endDate, setEndDate] = useState(reportDates.endDate);

  const { properties } = usePropertyStore();
  const { records } = useExpenseStore();

  const propertyMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of properties) {
      map[p.id] = p.name;
    }
    return map;
  }, [properties]);

  const filteredRecords = useMemo(() => {
    return records
      .filter((r) => {
        if (propertyId !== 'all' && r.propertyId !== propertyId) return false;
        if (r.date < startDate || r.date > endDate) return false;
        return true;
      })
      .sort((a, b) => (a.date > b.date ? -1 : a.date < b.date ? 1 : 0));
  }, [records, propertyId, startDate, endDate]);

  const totalAmount = useMemo(() => {
    return filteredRecords.reduce((sum, r) => sum + r.amount, 0);
  }, [filteredRecords]);

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
        {filteredRecords.length === 0 ? (
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
                <Th>Date</Th>
                <Th>Category</Th>
                <Th>Vendor</Th>
                <Th>Property</Th>
                <Th>Description</Th>
                <Th align="right">Amount</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <Td>{formatDate(r.date)}</Td>
                  <Td>{r.category}</Td>
                  <Td>{r.vendor}</Td>
                  <Td>
                    {propertyMap[r.propertyId] || 'Unknown'}
                  </Td>
                  <Td>{r.description}</Td>
                  <Td align="right">
                    {formatCurrency(r.amount)}
                  </Td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-semibold">
                <td colSpan={5} className="py-3 px-5 text-sm text-slate-800">
                  Total
                </td>
                <Td align="right" className="text-slate-800">
                  {formatCurrency(totalAmount)}
                </Td>
              </tr>
            </tbody>
          </table>
        )}
      </TableWrapper>
    </div>
  );
}
