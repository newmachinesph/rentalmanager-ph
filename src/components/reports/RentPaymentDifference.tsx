'use client';

import { useState, useMemo } from 'react';
import { FileText } from 'lucide-react';
import { usePropertyStore } from '@/stores/propertyStore';
import { useIncomeStore } from '@/stores/incomeStore';
import { formatCurrency } from '@/lib/utils';
import { Th } from '@/components/ui/Th';
import { Td } from '@/components/ui/Td';
import { TableWrapper } from '@/components/ui/TableWrapper';
import { EmptyState } from '@/components/ui/EmptyState';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { getReportDefaultDates } from '@/lib/reportConfig';

export function RentPaymentDifference() {
  const [propertyId, setPropertyId] = useState('all');
  const reportDates = getReportDefaultDates();
  const [startDate, setStartDate] = useState(reportDates.startDate);
  const [endDate, setEndDate] = useState(reportDates.endDate);

  const { records } = useIncomeStore();
  const { properties } = usePropertyStore();

  const rows = useMemo(() => {
    // Filter rent records within date range
    const rentRecords = records.filter((r) => {
      if (r.category !== 'Rent') return false;
      if (propertyId !== 'all' && r.propertyId !== propertyId) return false;
      if (r.dueDate < startDate || r.dueDate > endDate) return false;
      return true;
    });

    // Group by property
    const grouped = new Map<string, { expected: number; received: number }>();

    for (const r of rentRecords) {
      const current = grouped.get(r.propertyId) || { expected: 0, received: 0 };
      current.expected += r.amount;
      if (r.status === 'Paid') {
        current.received += r.amount;
      }
      grouped.set(r.propertyId, current);
    }

    return Array.from(grouped.entries()).map(([propId, data]) => {
      const property = properties.find((p) => p.id === propId);
      const difference = data.received - data.expected;
      const variance =
        data.expected !== 0
          ? ((data.received - data.expected) / data.expected) * 100
          : 0;

      return {
        propertyId: propId,
        propertyName: property ? property.name : 'Unknown',
        expected: data.expected,
        received: data.received,
        difference,
        variance,
      };
    });
  }, [records, properties, propertyId, startDate, endDate]);

  const grandTotal = useMemo(() => {
    return rows.reduce(
      (acc, row) => ({
        expected: acc.expected + row.expected,
        received: acc.received + row.received,
        difference: acc.difference + row.difference,
      }),
      { expected: 0, received: 0, difference: 0 }
    );
  }, [rows]);

  const grandVariance =
    grandTotal.expected !== 0
      ? ((grandTotal.received - grandTotal.expected) / grandTotal.expected) * 100
      : 0;

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

      {rows.length === 0 ? (
        <EmptyState
          variant="inline"
          icon={FileText}
          title="No data for the selected period"
          description=""
        />
      ) : (
        <TableWrapper>
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <Th>Property</Th>
                <Th align="right">Expected</Th>
                <Th align="right">Received</Th>
                <Th align="right">Difference</Th>
                <Th align="right">Variance %</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.propertyId} className="hover:bg-slate-50 transition-colors">
                  <Td>{row.propertyName}</Td>
                  <Td align="right">
                    {formatCurrency(row.expected)}
                  </Td>
                  <Td align="right">
                    {formatCurrency(row.received)}
                  </Td>
                  <Td
                    align="right"
                    className={`font-medium ${
                      row.difference < 0 ? 'text-red-600' : 'text-emerald-600'
                    }`}
                  >
                    {formatCurrency(row.difference)}
                  </Td>
                  <Td
                    align="right"
                    className={`font-medium ${
                      row.variance < 0 ? 'text-red-600' : 'text-emerald-600'
                    }`}
                  >
                    {row.variance.toFixed(1)}%
                  </Td>
                </tr>
              ))}

              {/* Grand total row */}
              <tr className="bg-slate-50 font-semibold border-t-2 border-slate-300">
                <Td className="text-slate-800">
                  Grand Total ({rows.length} properties)
                </Td>
                <Td align="right" className="text-slate-800">
                  {formatCurrency(grandTotal.expected)}
                </Td>
                <Td align="right" className="text-slate-800">
                  {formatCurrency(grandTotal.received)}
                </Td>
                <Td
                  align="right"
                  className={`font-semibold ${
                    grandTotal.difference < 0 ? 'text-red-600' : 'text-emerald-600'
                  }`}
                >
                  {formatCurrency(grandTotal.difference)}
                </Td>
                <Td
                  align="right"
                  className={`font-semibold ${
                    grandVariance < 0 ? 'text-red-600' : 'text-emerald-600'
                  }`}
                >
                  {grandVariance.toFixed(1)}%
                </Td>
              </tr>
            </tbody>
          </table>
        </TableWrapper>
      )}
    </div>
  );
}
