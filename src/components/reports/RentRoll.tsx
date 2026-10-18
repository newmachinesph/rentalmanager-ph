'use client';

import { useState, useMemo } from 'react';
import { usePropertyStore } from '@/stores/propertyStore';
import { useLeaseStore } from '@/stores/leaseStore';
import { useTenantStore } from '@/stores/tenantStore';
import { formatCurrency, formatDate } from '@/lib/utils';
import { FileText } from 'lucide-react';
import { Th } from '@/components/ui/Th';
import { Td } from '@/components/ui/Td';
import { TableWrapper } from '@/components/ui/TableWrapper';
import { EmptyState } from '@/components/ui/EmptyState';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { getReportDefaultDates } from '@/lib/reportConfig';

export function RentRoll() {
  const [propertyId, setPropertyId] = useState('all');
  const reportDates = getReportDefaultDates();
  const [startDate, setStartDate] = useState(reportDates.startDate);
  const [endDate, setEndDate] = useState(reportDates.endDate);

  const { properties } = usePropertyStore();
  const { leases } = useLeaseStore();
  const { tenants } = useTenantStore();

  const activeLeases = useMemo(() => {
    return leases.filter((lease) => {
      if (lease.status !== 'Active') return false;
      if (propertyId !== 'all' && lease.propertyId !== propertyId) return false;
      return true;
    });
  }, [leases, propertyId]);

  const rentRollData = useMemo(() => {
    return activeLeases.map((lease) => {
      const property = properties.find((p) => p.id === lease.propertyId);
      const unit = property?.units.find((u) => u.id === lease.unitId);
      const tenant = tenants.find((t) => t.id === lease.tenantId);
      const monthlyRent = lease.monthlyRent;
      const annualRent = monthlyRent * 12;

      return {
        propertyName: property?.name || 'Unknown Property',
        unitName: unit?.name || 'Unknown Unit',
        tenantName: tenant ? `${tenant.firstName} ${tenant.lastName}` : 'Unknown Tenant',
        monthlyRent,
        annualRent,
        leaseEnd: lease.endDate,
      };
    });
  }, [activeLeases, properties, tenants]);

  const totals = useMemo(() => {
    const totalMonthly = rentRollData.reduce((sum, row) => sum + row.monthlyRent, 0);
    const totalAnnual = rentRollData.reduce((sum, row) => sum + row.annualRent, 0);
    return { totalMonthly, totalAnnual };
  }, [rentRollData]);

  const hasData = rentRollData.length > 0;

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
                <Th>Property</Th>
                <Th>Unit</Th>
                <Th>Tenant</Th>
                <Th align="right">Monthly Rent</Th>
                <Th align="right">Annual Rent</Th>
                <Th>Lease End</Th>
              </tr>
            </thead>
            <tbody>
              {rentRollData.map((row, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                  <Td>{row.propertyName}</Td>
                  <Td>{row.unitName}</Td>
                  <Td>{row.tenantName}</Td>
                  <Td align="right">{formatCurrency(row.monthlyRent)}</Td>
                  <Td align="right">{formatCurrency(row.annualRent)}</Td>
                  <Td>{formatDate(row.leaseEnd)}</Td>
                </tr>
              ))}

              {/* Summary Row */}
              <tr className="border-t-2 border-slate-300 bg-slate-50 font-semibold">
                <td colSpan={3} className="py-3 px-5 text-sm text-slate-800">
                  Total ({rentRollData.length} active leases)
                </td>
                <td className="py-3 px-5 text-sm text-slate-800 text-right">
                  {formatCurrency(totals.totalMonthly)}
                </td>
                <td className="py-3 px-5 text-sm text-slate-800 text-right">
                  {formatCurrency(totals.totalAnnual)}
                </td>
                <td className="py-3 px-5 text-sm text-slate-700" />
              </tr>
            </tbody>
          </table>
        )}
      </TableWrapper>
    </div>
  );
}
