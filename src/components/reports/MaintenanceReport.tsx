'use client';

import { useState, useMemo } from 'react';
import { usePropertyStore } from '@/stores/propertyStore';
import { useMaintenanceStore } from '@/stores/maintenanceStore';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Wrench } from 'lucide-react';
import { Th } from '@/components/ui/Th';
import { Td } from '@/components/ui/Td';
import { TableWrapper } from '@/components/ui/TableWrapper';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { getReportDefaultDates } from '@/lib/reportConfig';

export function MaintenanceReport() {
  const [propertyId, setPropertyId] = useState('all');
  const reportDates = getReportDefaultDates();
  const [startDate, setStartDate] = useState(reportDates.startDate);
  const [endDate, setEndDate] = useState(reportDates.endDate);

  const { properties } = usePropertyStore();
  const { requests } = useMaintenanceStore();

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (propertyId !== 'all' && r.propertyId !== propertyId) return false;
      if (r.dateReported < startDate || r.dateReported > endDate) return false;
      return true;
    });
  }, [requests, propertyId, startDate, endDate]);

  const maintenanceData = useMemo(() => {
    return filteredRequests.map((r) => {
      const property = properties.find((p) => p.id === r.propertyId);
      return {
        dateReported: r.dateReported,
        propertyName: property?.name || 'Unknown Property',
        title: r.title,
        category: r.category,
        priority: r.priority,
        status: r.status,
        estimatedCost: r.estimatedCost,
        actualCost: r.actualCost,
      };
    });
  }, [filteredRequests, properties]);

  const totals = useMemo(() => {
    const totalEstimated = maintenanceData.reduce((sum, row) => sum + row.estimatedCost, 0);
    const totalActual = maintenanceData.reduce(
      (sum, row) => sum + (row.actualCost || 0),
      0
    );
    return { totalEstimated, totalActual };
  }, [maintenanceData]);

  const hasData = maintenanceData.length > 0;

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
            icon={Wrench}
            title="No data for the selected period"
            description=""
          />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <Th>Date Reported</Th>
                <Th>Property</Th>
                <Th>Title</Th>
                <Th>Category</Th>
                <Th>Priority</Th>
                <Th>Status</Th>
                <Th align="right">Est. Cost</Th>
                <Th align="right">Actual Cost</Th>
              </tr>
            </thead>
            <tbody>
              {maintenanceData.map((row, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                  <Td>{formatDate(row.dateReported)}</Td>
                  <Td>{row.propertyName}</Td>
                  <Td>{row.title}</Td>
                  <Td>{row.category}</Td>
                  <Td>
                    <StatusBadge status={row.priority} />
                  </Td>
                  <Td>
                    <StatusBadge status={row.status} />
                  </Td>
                  <Td align="right">{formatCurrency(row.estimatedCost)}</Td>
                  <Td align="right">
                    {row.actualCost != null ? formatCurrency(row.actualCost) : '--'}
                  </Td>
                </tr>
              ))}

              {/* Summary Row */}
              <tr className="border-t-2 border-slate-300 bg-slate-50 font-semibold">
                <td colSpan={6} className="py-3 px-5 text-sm text-slate-800">
                  Total ({maintenanceData.length} requests)
                </td>
                <td className="py-3 px-5 text-sm text-slate-800 text-right">
                  {formatCurrency(totals.totalEstimated)}
                </td>
                <td className="py-3 px-5 text-sm text-slate-800 text-right">
                  {formatCurrency(totals.totalActual)}
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </TableWrapper>
    </div>
  );
}
