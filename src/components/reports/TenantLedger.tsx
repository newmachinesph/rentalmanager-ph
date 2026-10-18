'use client';

import { useState, useMemo } from 'react';
import { usePropertyStore } from '@/stores/propertyStore';
import { useIncomeStore } from '@/stores/incomeStore';
import { useTenantStore } from '@/stores/tenantStore';
import { formatCurrency } from '@/lib/utils';
import { FileText } from 'lucide-react';
import { Th } from '@/components/ui/Th';
import { Td } from '@/components/ui/Td';
import { TableWrapper } from '@/components/ui/TableWrapper';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { getReportDefaultDates } from '@/lib/reportConfig';

export function TenantLedger() {
  const [propertyId, setPropertyId] = useState('all');
  const reportDates = getReportDefaultDates();
  const [startDate, setStartDate] = useState(reportDates.startDate);
  const [endDate, setEndDate] = useState(reportDates.endDate);

  const { properties } = usePropertyStore();
  const { records: incomeRecords } = useIncomeStore();
  const { tenants } = useTenantStore();

  const filteredRecords = useMemo(() => {
    return incomeRecords.filter((r) => {
      if (propertyId !== 'all' && r.propertyId !== propertyId) return false;
      if (r.dueDate < startDate || r.dueDate > endDate) return false;
      return true;
    });
  }, [incomeRecords, propertyId, startDate, endDate]);

  const ledgerData = useMemo(() => {
    const grouped: Record<
      string,
      { tenantId: string; propertyId: string; totalDue: number; totalPaid: number }
    > = {};

    for (const r of filteredRecords) {
      const key = r.tenantId ?? 'unknown';
      if (!grouped[key]) {
        grouped[key] = {
          tenantId: r.tenantId ?? '',
          propertyId: r.propertyId,
          totalDue: 0,
          totalPaid: 0,
        };
      }
      grouped[key].totalDue += r.amount;
      if (r.status === 'Paid') {
        grouped[key].totalPaid += r.amount;
      }
    }

    return Object.values(grouped).map((item) => {
      const tenant = tenants.find((t) => t.id === item.tenantId);
      const property = properties.find((p) => p.id === item.propertyId);
      const outstanding = item.totalDue - item.totalPaid;
      return {
        tenantName: tenant ? `${tenant.firstName} ${tenant.lastName}` : 'Unknown Tenant',
        propertyName: property?.name || 'Unknown Property',
        totalDue: item.totalDue,
        totalPaid: item.totalPaid,
        outstanding,
        status: outstanding > 0 ? 'Outstanding' : 'Settled',
      };
    });
  }, [filteredRecords, tenants, properties]);

  const hasData = ledgerData.length > 0;

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
            icon={FileText}
            title="No data for the selected period"
            description=""
          />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <Th>Tenant</Th>
                <Th>Property</Th>
                <Th align="right">Total Due</Th>
                <Th align="right">Total Paid</Th>
                <Th align="right">Outstanding</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {ledgerData.map((row, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                  <Td>{row.tenantName}</Td>
                  <Td>{row.propertyName}</Td>
                  <Td align="right">{formatCurrency(row.totalDue)}</Td>
                  <Td align="right">{formatCurrency(row.totalPaid)}</Td>
                  <Td align="right">{formatCurrency(row.outstanding)}</Td>
                  <Td>
                    <StatusBadge status={row.status} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TableWrapper>
    </div>
  );
}
