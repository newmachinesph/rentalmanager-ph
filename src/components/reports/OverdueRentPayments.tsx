'use client';

import { useState, useMemo, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { usePropertyStore } from '@/stores/propertyStore';
import { useIncomeStore } from '@/stores/incomeStore';
import { useTenantStore } from '@/stores/tenantStore';
import { formatCurrency, formatDate, calculatePenalty } from '@/lib/utils';
import { Th } from '@/components/ui/Th';
import { Td } from '@/components/ui/Td';
import { TableWrapper } from '@/components/ui/TableWrapper';
import { EmptyState } from '@/components/ui/EmptyState';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { getReportDefaultDates } from '@/lib/reportConfig';

export function OverdueRentPayments() {
  const [propertyId, setPropertyId] = useState('all');
  const reportDates = getReportDefaultDates();
  const [startDate, setStartDate] = useState(reportDates.startDate);
  const [endDate, setEndDate] = useState(reportDates.endDate);
  const [nowTimestamp] = useState(() => Date.now());
  const [penaltyRate, setPenaltyRate] = useState(0.01);

  const { records } = useIncomeStore();
  const { properties } = usePropertyStore();
  const { tenants } = useTenantStore();

  // Fetch penalty rate from settings
  useEffect(() => {
    fetch('/api/settings/general')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.penaltyRatePerMonth != null) setPenaltyRate(data.penaltyRatePerMonth);
      })
      .catch(() => {});
  }, []);

  const rows = useMemo(() => {
    return records
      .filter((r) => {
        if (r.status !== 'Overdue') return false;
        if (r.category !== 'Rent') return false;
        if (propertyId !== 'all' && r.propertyId !== propertyId) return false;
        if (r.dueDate < startDate || r.dueDate > endDate) return false;
        return true;
      })
      .map((r) => {
        const tenant = tenants.find((t) => t.id === r.tenantId);
        const property = properties.find((p) => p.id === r.propertyId);
        const daysOverdue = Math.floor(
          (nowTimestamp - new Date(r.dueDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        const { penaltyAmount } = calculatePenalty(r.amount, r.dueDate, penaltyRate);

        return {
          id: r.id,
          dueDate: r.dueDate,
          tenantName: tenant ? `${tenant.firstName} ${tenant.lastName}` : 'Unknown',
          propertyName: property ? property.name : 'Unknown',
          amount: r.amount,
          daysOverdue,
          penaltyAmount,
        };
      });
  }, [records, propertyId, startDate, endDate, tenants, properties, nowTimestamp, penaltyRate]);

  const totalOverdue = useMemo(() => {
    return rows.reduce((sum, row) => sum + row.amount, 0);
  }, [rows]);

  const totalPenalty = useMemo(() => {
    return rows.reduce((sum, row) => sum + row.penaltyAmount, 0);
  }, [rows]);

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
        <>
          {/* Summary */}
          <div className="flex gap-4">
            <div className="bg-white border border-slate-200 rounded-lg px-5 py-3 shadow-sm">
              <p className="text-xs text-slate-500 font-medium">Total Overdue</p>
              <p className="text-lg font-bold text-red-600">{formatCurrency(totalOverdue)}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg px-5 py-3 shadow-sm">
              <p className="text-xs text-slate-500 font-medium">Total Penalty</p>
              <p className="text-lg font-bold text-amber-600">{formatCurrency(totalPenalty)}</p>
              <p className="text-[10px] text-slate-400">{penaltyRate}% interest + {penaltyRate}% penalty /mo</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg px-5 py-3 shadow-sm">
              <p className="text-xs text-slate-500 font-medium">Overdue Payments</p>
              <p className="text-lg font-bold text-slate-800">{rows.length}</p>
            </div>
          </div>

          <TableWrapper>
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <Th>Due Date</Th>
                  <Th>Tenant</Th>
                  <Th>Property</Th>
                  <Th align="right">Amount</Th>
                  <Th align="right">Penalty</Th>
                  <Th align="right">Days Overdue</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <Td>
                      {formatDate(row.dueDate)}
                    </Td>
                    <Td>{row.tenantName}</Td>
                    <Td>{row.propertyName}</Td>
                    <Td align="right">
                      {formatCurrency(row.amount)}
                    </Td>
                    <Td align="right" className="text-amber-600 font-medium">
                      {row.penaltyAmount > 0 ? formatCurrency(row.penaltyAmount) : '—'}
                    </Td>
                    <Td align="right" className="text-red-600 font-medium">
                      {row.daysOverdue} days
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrapper>
        </>
      )}
    </div>
  );
}
