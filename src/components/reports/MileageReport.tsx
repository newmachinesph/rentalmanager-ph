'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatDate } from '@/lib/utils';
import { Car } from 'lucide-react';
import { Th } from '@/components/ui/Th';
import { Td } from '@/components/ui/Td';
import { TableWrapper } from '@/components/ui/TableWrapper';
import { EmptyState } from '@/components/ui/EmptyState';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { getReportDefaultDates } from '@/lib/reportConfig';

interface MileageEntry {
  id: string;
  date: string;
  startLocation: string;
  endLocation: string;
  purpose: string;
  distance: number;
  property?: { name?: string };
}

export function MileageReport() {
  const [propertyId, setPropertyId] = useState('all');
  const reportDates = getReportDefaultDates();
  const [startDate, setStartDate] = useState(reportDates.startDate);
  const [endDate, setEndDate] = useState(reportDates.endDate);
  const [entries, setEntries] = useState<MileageEntry[]>([]);
  const [totalDistance, setTotalDistance] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (propertyId !== 'all') params.set('propertyId', propertyId);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      const res = await fetch(`/api/reports/mileage?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
        setTotalDistance(data.totalDistance || 0);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [propertyId, startDate, endDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const hasData = entries.length > 0;

  return (
    <div className="space-y-6">
      <ReportFilters
        propertyId={propertyId}
        onPropertyChange={setPropertyId}
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        onFilter={fetchData}
      />

      <TableWrapper>
        {!hasData ? (
          <EmptyState
            variant="inline"
            icon={Car}
            title={loading ? 'Loading...' : 'No mileage records for the selected period'}
            description=""
          />
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/60">
              <tr>
                <Th>Date</Th>
                <Th>Property</Th>
                <Th>From</Th>
                <Th>To</Th>
                <Th>Purpose</Th>
                <Th align="right">Distance (km)</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <Td>{formatDate(r.date)}</Td>
                  <Td>{r.property?.name || 'Organization'}</Td>
                  <Td>{r.startLocation}</Td>
                  <Td>{r.endLocation}</Td>
                  <Td>{r.purpose}</Td>
                  <Td align="right">{r.distance.toFixed(1)}</Td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-semibold">
                <td colSpan={5} className="px-4 py-3 text-sm text-slate-700">Total</td>
                <td className="px-4 py-3 text-sm text-slate-700 text-right">{totalDistance.toFixed(1)} km</td>
              </tr>
            </tfoot>
          </table>
        )}
      </TableWrapper>
    </div>
  );
}
