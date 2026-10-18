'use client';

import { useState, useMemo } from 'react';
import { usePropertyStore } from '@/stores/propertyStore';
import { formatCurrency } from '@/lib/utils';
import { Building2 } from 'lucide-react';
import { Th } from '@/components/ui/Th';
import { Td } from '@/components/ui/Td';
import { TableWrapper } from '@/components/ui/TableWrapper';
import { EmptyState } from '@/components/ui/EmptyState';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { getReportDefaultDates } from '@/lib/reportConfig';

export function PropertyDirectory() {
  const [propertyId, setPropertyId] = useState('all');
  const reportDates = getReportDefaultDates();
  const [startDate, setStartDate] = useState(reportDates.startDate);
  const [endDate, setEndDate] = useState(reportDates.endDate);

  const { properties } = usePropertyStore();

  const filteredProperties = useMemo(() => {
    if (propertyId === 'all') return properties;
    return properties.filter((p) => p.id === propertyId);
  }, [properties, propertyId]);

  const hasData = filteredProperties.length > 0;

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
            icon={Building2}
            title="No data for the selected period"
            description=""
          />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <Th>Property</Th>
                <Th>Type</Th>
                <Th>Address</Th>
                <Th>City</Th>
                <Th>Province</Th>
                <Th align="right">Units</Th>
                <Th align="right">Monthly Target</Th>
              </tr>
            </thead>
            <tbody>
              {filteredProperties.map((property) => (
                <tr
                  key={property.id}
                  className="border-b border-slate-100 hover:bg-slate-50"
                >
                  <Td className="font-medium">{property.name}</Td>
                  <Td>{property.type}</Td>
                  <Td>{property.address}</Td>
                  <Td>{property.city}</Td>
                  <Td>{property.province}</Td>
                  <Td align="right">{property.units.length}</Td>
                  <Td align="right">{formatCurrency(property.monthlyTarget)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TableWrapper>
    </div>
  );
}
