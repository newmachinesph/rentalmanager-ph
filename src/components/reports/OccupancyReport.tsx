'use client';

import { useState, useMemo } from 'react';
import { usePropertyStore } from '@/stores/propertyStore';
import { FileText } from 'lucide-react';
import { Th } from '@/components/ui/Th';
import { Td } from '@/components/ui/Td';
import { TableWrapper } from '@/components/ui/TableWrapper';
import { EmptyState } from '@/components/ui/EmptyState';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { getReportDefaultDates } from '@/lib/reportConfig';

export function OccupancyReport() {
  const [propertyId, setPropertyId] = useState('all');
  const reportDates = getReportDefaultDates();
  const [startDate, setStartDate] = useState(reportDates.startDate);
  const [endDate, setEndDate] = useState(reportDates.endDate);

  const { properties } = usePropertyStore();

  const filteredProperties = useMemo(() => {
    if (propertyId === 'all') return properties;
    return properties.filter((p) => p.id === propertyId);
  }, [properties, propertyId]);

  const occupancyData = useMemo(() => {
    return filteredProperties.map((property) => {
      const total = property.units.length;
      const occupied = property.units.filter((u) => u.status === 'Occupied').length;
      const vacant = property.units.filter((u) => u.status === 'Vacant').length;
      const underMaintenance = property.units.filter(
        (u) => u.status === 'Under Maintenance'
      ).length;
      const rate = total > 0 ? ((occupied / total) * 100).toFixed(1) : '0.0';
      return {
        name: property.name,
        total,
        occupied,
        vacant,
        underMaintenance,
        rate,
      };
    });
  }, [filteredProperties]);

  const grandTotal = useMemo(() => {
    const total = occupancyData.reduce((sum, row) => sum + row.total, 0);
    const occupied = occupancyData.reduce((sum, row) => sum + row.occupied, 0);
    const vacant = occupancyData.reduce((sum, row) => sum + row.vacant, 0);
    const underMaintenance = occupancyData.reduce((sum, row) => sum + row.underMaintenance, 0);
    const rate = total > 0 ? ((occupied / total) * 100).toFixed(1) : '0.0';
    return { total, occupied, vacant, underMaintenance, rate };
  }, [occupancyData]);

  const hasData = occupancyData.length > 0;

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
                <Th align="right">Total Units</Th>
                <Th align="right">Occupied</Th>
                <Th align="right">Vacant</Th>
                <Th align="right">Under Maintenance</Th>
                <Th align="right">Occupancy Rate</Th>
              </tr>
            </thead>
            <tbody>
              {occupancyData.map((row, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                  <Td>{row.name}</Td>
                  <Td align="right">{row.total}</Td>
                  <Td align="right">{row.occupied}</Td>
                  <Td align="right">{row.vacant}</Td>
                  <Td align="right">{row.underMaintenance}</Td>
                  <Td align="right" className="font-medium">{row.rate}%</Td>
                </tr>
              ))}

              {/* Grand Total Row */}
              <tr className="border-t-2 border-slate-300 bg-slate-50 font-semibold">
                <td className="py-3 px-5 text-sm text-slate-800">Grand Total</td>
                <td className="py-3 px-5 text-sm text-slate-800 text-right">
                  {grandTotal.total}
                </td>
                <td className="py-3 px-5 text-sm text-slate-800 text-right">
                  {grandTotal.occupied}
                </td>
                <td className="py-3 px-5 text-sm text-slate-800 text-right">
                  {grandTotal.vacant}
                </td>
                <td className="py-3 px-5 text-sm text-slate-800 text-right">
                  {grandTotal.underMaintenance}
                </td>
                <td className="py-3 px-5 text-sm text-slate-800 text-right">
                  {grandTotal.rate}%
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </TableWrapper>
    </div>
  );
}
