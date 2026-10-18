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

export function LeaseExpiry() {
  const [propertyId, setPropertyId] = useState('all');
  const reportDates = getReportDefaultDates();
  const [startDate, setStartDate] = useState(reportDates.startDate);
  const [endDate, setEndDate] = useState(reportDates.endDate);
  const [nowTimestamp] = useState(() => Date.now());

  const { properties } = usePropertyStore();
  const { leases } = useLeaseStore();
  const { tenants } = useTenantStore();

  const expiringLeases = useMemo(() => {
    return leases
      .filter((lease) => {
        if (propertyId !== 'all' && lease.propertyId !== propertyId) return false;
        if (lease.endDate < startDate || lease.endDate > endDate) return false;
        return true;
      })
      .sort((a, b) => a.endDate.localeCompare(b.endDate));
  }, [leases, propertyId, startDate, endDate]);

  const expiryData = useMemo(() => {
    return expiringLeases.map((lease) => {
      const property = properties.find((p) => p.id === lease.propertyId);
      const unit = property?.units.find((u) => u.id === lease.unitId);
      const tenant = tenants.find((t) => t.id === lease.tenantId);
      const daysUntilExpiry = Math.ceil(
        (new Date(lease.endDate).getTime() - nowTimestamp) / (1000 * 60 * 60 * 24)
      );

      return {
        propertyName: property?.name || 'Unknown Property',
        unitName: unit?.name || 'Unknown Unit',
        tenantName: tenant ? `${tenant.firstName} ${tenant.lastName}` : 'Unknown Tenant',
        leaseStart: lease.startDate,
        leaseEnd: lease.endDate,
        monthlyRent: lease.monthlyRent,
        daysUntilExpiry,
      };
    });
  }, [expiringLeases, properties, tenants, nowTimestamp]);

  const hasData = expiryData.length > 0;

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
                <Th>Lease Start</Th>
                <Th>Lease End</Th>
                <Th align="right">Monthly Rent</Th>
                <Th align="right">Days Until Expiry</Th>
              </tr>
            </thead>
            <tbody>
              {expiryData.map((row, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                  <Td>{row.propertyName}</Td>
                  <Td>{row.unitName}</Td>
                  <Td>{row.tenantName}</Td>
                  <Td>{formatDate(row.leaseStart)}</Td>
                  <Td>{formatDate(row.leaseEnd)}</Td>
                  <Td align="right">{formatCurrency(row.monthlyRent)}</Td>
                  <td className="py-3 px-5 text-sm text-right">
                    {row.daysUntilExpiry < 0 ? (
                      <span className="text-red-600 font-medium">Expired</span>
                    ) : (
                      <span
                        className={
                          row.daysUntilExpiry <= 30
                            ? 'text-amber-600 font-medium'
                            : 'text-slate-700'
                        }
                      >
                        {row.daysUntilExpiry} days
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TableWrapper>
    </div>
  );
}
