'use client';

import { useState, useMemo } from 'react';
import { usePropertyStore } from '@/stores/propertyStore';
import { useExpenseStore } from '@/stores/expenseStore';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Contact } from 'lucide-react';
import { Th } from '@/components/ui/Th';
import { Td } from '@/components/ui/Td';
import { TableWrapper } from '@/components/ui/TableWrapper';
import { EmptyState } from '@/components/ui/EmptyState';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { getReportDefaultDates } from '@/lib/reportConfig';

export function SupplierDirectory() {
  const [propertyId, setPropertyId] = useState('all');
  const reportDates = getReportDefaultDates();
  const [startDate, setStartDate] = useState(reportDates.startDate);
  const [endDate, setEndDate] = useState(reportDates.endDate);

  const { properties } = usePropertyStore();
  const { records: expenseRecords } = useExpenseStore();

  const filteredExpenses = useMemo(() => {
    return expenseRecords.filter((r) => {
      if (propertyId !== 'all' && r.propertyId !== propertyId) return false;
      if (r.date < startDate || r.date > endDate) return false;
      return true;
    });
  }, [expenseRecords, propertyId, startDate, endDate]);

  const supplierData = useMemo(() => {
    const grouped: Record<
      string,
      { vendor: string; totalSpent: number; propertyIds: Set<string>; lastDate: string }
    > = {};

    for (const r of filteredExpenses) {
      const vendor = r.vendor || 'Unknown Vendor';
      if (!grouped[vendor]) {
        grouped[vendor] = {
          vendor,
          totalSpent: 0,
          propertyIds: new Set<string>(),
          lastDate: r.date,
        };
      }
      grouped[vendor].totalSpent += r.amount;
      grouped[vendor].propertyIds.add(r.propertyId);
      if (r.date > grouped[vendor].lastDate) {
        grouped[vendor].lastDate = r.date;
      }
    }

    return Object.values(grouped)
      .map((item) => {
        const propertyNames = Array.from(item.propertyIds)
          .map((id) => properties.find((p) => p.id === id)?.name || 'Unknown')
          .join(', ');
        return {
          vendor: item.vendor,
          totalSpent: item.totalSpent,
          properties: propertyNames,
          lastTransaction: item.lastDate,
        };
      })
      .sort((a, b) => b.totalSpent - a.totalSpent);
  }, [filteredExpenses, properties]);

  const hasData = supplierData.length > 0;

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
        {!hasData ? (
          <EmptyState
            variant="inline"
            icon={Contact}
            title="No data for the selected period"
            description=""
          />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <Th>Supplier</Th>
                <Th align="right">Total Spent</Th>
                <Th>Properties</Th>
                <Th>Last Transaction</Th>
              </tr>
            </thead>
            <tbody>
              {supplierData.map((row, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                  <Td className="font-medium">{row.vendor}</Td>
                  <Td align="right">{formatCurrency(row.totalSpent)}</Td>
                  <Td>{row.properties}</Td>
                  <Td>{formatDate(row.lastTransaction)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TableWrapper>
    </div>
  );
}
