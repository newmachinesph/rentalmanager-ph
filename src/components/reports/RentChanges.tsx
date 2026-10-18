'use client';

import { useState, useMemo } from 'react';
import { FileText } from 'lucide-react';
import { usePropertyStore } from '@/stores/propertyStore';
import { useTenantStore } from '@/stores/tenantStore';
import { useLeaseStore } from '@/stores/leaseStore';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Th } from '@/components/ui/Th';
import { Td } from '@/components/ui/Td';
import { TableWrapper } from '@/components/ui/TableWrapper';
import { EmptyState } from '@/components/ui/EmptyState';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { getReportDefaultDates } from '@/lib/reportConfig';

export function RentChanges() {
  const [propertyId, setPropertyId] = useState('all');
  const reportDates = getReportDefaultDates();
  const [startDate, setStartDate] = useState(reportDates.startDate);
  const [endDate, setEndDate] = useState(reportDates.endDate);

  const { leases } = useLeaseStore();
  const { properties } = usePropertyStore();
  const { tenants } = useTenantStore();

  const rows = useMemo(() => {
    return leases
      .filter((lease) => {
        if (propertyId !== 'all' && lease.propertyId !== propertyId) return false;
        if (lease.startDate < startDate || lease.startDate > endDate) return false;
        return true;
      })
      .map((lease) => {
        const property = properties.find((p) => p.id === lease.propertyId);
        const tenant = tenants.find((t) => t.id === lease.tenantId);

        return {
          id: lease.id,
          propertyName: property ? property.name : 'Unknown',
          tenantName: tenant ? `${tenant.firstName} ${tenant.lastName}` : 'Unknown',
          previousRent: 0,
          newRent: lease.monthlyRent,
          change: lease.monthlyRent,
          effectiveDate: lease.startDate,
        };
      });
  }, [leases, properties, tenants, propertyId, startDate, endDate]);

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
                <Th>Tenant</Th>
                <Th align="right">Previous Rent</Th>
                <Th align="right">New Rent</Th>
                <Th align="right">Change</Th>
                <Th>Effective Date</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                  <Td>{row.propertyName}</Td>
                  <Td>{row.tenantName}</Td>
                  <Td align="right" className="text-slate-400">N/A</Td>
                  <Td align="right">
                    {formatCurrency(row.newRent)}
                  </Td>
                  <Td align="right" className="text-emerald-600 font-medium">
                    +{formatCurrency(row.change)}
                  </Td>
                  <Td>
                    {formatDate(row.effectiveDate)}
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
