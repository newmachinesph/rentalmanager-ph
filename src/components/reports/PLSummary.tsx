'use client';

import { useState, useMemo } from 'react';
import { FileText } from 'lucide-react';
import { usePropertyStore } from '@/stores/propertyStore';
import { useIncomeStore } from '@/stores/incomeStore';
import { useExpenseStore } from '@/stores/expenseStore';
import { formatCurrency } from '@/lib/utils';
import { Th } from '@/components/ui/Th';
import { Td } from '@/components/ui/Td';
import { TableWrapper } from '@/components/ui/TableWrapper';
import { EmptyState } from '@/components/ui/EmptyState';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { getReportDefaultDates } from '@/lib/reportConfig';

export function PLSummary() {
  const [propertyId, setPropertyId] = useState('all');
  const reportDates = getReportDefaultDates();
  const [startDate, setStartDate] = useState(reportDates.startDate);
  const [endDate, setEndDate] = useState(reportDates.endDate);

  const { properties } = usePropertyStore();
  const { records: incomeRecords } = useIncomeStore();
  const { records: expenseRecords } = useExpenseStore();

  const filteredProperties = useMemo(() => {
    if (propertyId === 'all') return properties;
    return properties.filter((p) => p.id === propertyId);
  }, [properties, propertyId]);

  const data = useMemo(() => {
    return filteredProperties.map((property) => {
      const totalIncome = incomeRecords
        .filter(
          (r) =>
            r.propertyId === property.id &&
            r.dueDate >= startDate &&
            r.dueDate <= endDate
        )
        .reduce((sum, r) => sum + r.amount, 0);

      const totalExpenses = expenseRecords
        .filter(
          (r) =>
            r.propertyId === property.id &&
            r.date >= startDate &&
            r.date <= endDate
        )
        .reduce((sum, r) => sum + r.amount, 0);

      const netProfit = totalIncome - totalExpenses;
      const margin =
        totalIncome > 0 ? (netProfit / totalIncome * 100).toFixed(1) + '%' : '-';

      return {
        property,
        totalIncome,
        totalExpenses,
        netProfit,
        margin,
      };
    });
  }, [filteredProperties, incomeRecords, expenseRecords, startDate, endDate]);

  const hasData = data.some((d) => d.totalIncome > 0 || d.totalExpenses > 0);

  const grandIncome = data.reduce((sum, d) => sum + d.totalIncome, 0);
  const grandExpenses = data.reduce((sum, d) => sum + d.totalExpenses, 0);
  const grandNet = grandIncome - grandExpenses;
  const grandMargin =
    grandIncome > 0 ? (grandNet / grandIncome * 100).toFixed(1) + '%' : '-';

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
                <Th>Property</Th>
                <Th align="right">Total Income</Th>
                <Th align="right">Total Expenses</Th>
                <Th align="right">Net Profit</Th>
                <Th align="right">Margin %</Th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr
                  key={item.property.id}
                  className="border-b border-slate-100 hover:bg-slate-50"
                >
                  <Td>
                    {item.property.name}
                  </Td>
                  <Td align="right">
                    {formatCurrency(item.totalIncome)}
                  </Td>
                  <Td align="right">
                    {formatCurrency(item.totalExpenses)}
                  </Td>
                  <Td
                    align="right"
                    className={`font-medium ${
                      item.netProfit < 0 ? 'text-red-600' : 'text-emerald-600'
                    }`}
                  >
                    {formatCurrency(item.netProfit)}
                  </Td>
                  <Td align="right">
                    {item.margin}
                  </Td>
                </tr>
              ))}

              {/* Grand Total */}
              <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                <Td className="text-slate-900">Grand Total</Td>
                <Td align="right" className="text-emerald-700">
                  {formatCurrency(grandIncome)}
                </Td>
                <Td align="right" className="text-red-600">
                  {formatCurrency(grandExpenses)}
                </Td>
                <Td
                  align="right"
                  className={grandNet < 0 ? 'text-red-600' : 'text-emerald-600'}
                >
                  {formatCurrency(grandNet)}
                </Td>
                <Td align="right" className="text-slate-900">
                  {grandMargin}
                </Td>
              </tr>
            </tbody>
          </table>
        </TableWrapper>
      )}
    </div>
  );
}
