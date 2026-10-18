'use client';

import { useState, useMemo } from 'react';
import { FileText } from 'lucide-react';
import { usePropertyStore } from '@/stores/propertyStore';
import { useIncomeStore } from '@/stores/incomeStore';
import { useTenantStore } from '@/stores/tenantStore';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Th } from '@/components/ui/Th';
import { Td } from '@/components/ui/Td';
import { TableWrapper } from '@/components/ui/TableWrapper';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { getReportDefaultDates } from '@/lib/reportConfig';

export function RentLedger() {
  const [propertyId, setPropertyId] = useState('all');
  const reportDates = getReportDefaultDates();
  const [startDate, setStartDate] = useState(reportDates.startDate);
  const [endDate, setEndDate] = useState(reportDates.endDate);

  const { records } = useIncomeStore();
  const { properties } = usePropertyStore();
  const { tenants } = useTenantStore();

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (r.category !== 'Rent') return false;
      if (propertyId !== 'all' && r.propertyId !== propertyId) return false;
      if (r.dueDate < startDate || r.dueDate > endDate) return false;
      return true;
    });
  }, [records, propertyId, startDate, endDate]);

  const rows = useMemo(() => {
    return filteredRecords.map((r) => {
      const tenant = tenants.find((t) => t.id === r.tenantId);
      const property = properties.find((p) => p.id === r.propertyId);
      const amountDue = r.amount;
      let amountPaid = 0;
      if (r.status === 'Paid') {
        amountPaid = r.amount;
      } else if (r.status === 'Partially Paid') {
        amountPaid = r.amount * 0.5;
      }
      const balance = amountDue - amountPaid;

      return {
        id: r.id,
        dueDate: r.dueDate,
        tenantName: tenant ? `${tenant.firstName} ${tenant.lastName}` : 'Unknown',
        propertyName: property ? property.name : 'Unknown',
        amountDue,
        amountPaid,
        status: r.status,
        balance,
      };
    });
  }, [filteredRecords, tenants, properties]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => ({
        amountDue: acc.amountDue + row.amountDue,
        amountPaid: acc.amountPaid + row.amountPaid,
        balance: acc.balance + row.balance,
      }),
      { amountDue: 0, amountPaid: 0, balance: 0 }
    );
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
        <TableWrapper>
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <Th>Due Date</Th>
                <Th>Tenant</Th>
                <Th>Property</Th>
                <Th align="right">Amount Due</Th>
                <Th align="right">Amount Paid</Th>
                <Th>Status</Th>
                <Th align="right">Balance</Th>
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
                    {formatCurrency(row.amountDue)}
                  </Td>
                  <Td align="right">
                    {formatCurrency(row.amountPaid)}
                  </Td>
                  <Td>
                    <StatusBadge status={row.status} />
                  </Td>
                  <Td align="right">
                    {formatCurrency(row.balance)}
                  </Td>
                </tr>
              ))}

              {/* Summary row */}
              <tr className="bg-slate-50 font-semibold border-t-2 border-slate-300">
                <td className="py-3 px-5 text-sm text-slate-800" colSpan={3}>
                  Total ({rows.length} records)
                </td>
                <Td align="right" className="text-slate-800">
                  {formatCurrency(totals.amountDue)}
                </Td>
                <Td align="right" className="text-slate-800">
                  {formatCurrency(totals.amountPaid)}
                </Td>
                <td className="py-3 px-5 text-sm text-slate-700" />
                <Td align="right" className="text-slate-800">
                  {formatCurrency(totals.balance)}
                </Td>
              </tr>
            </tbody>
          </table>
        </TableWrapper>
      )}
    </div>
  );
}
