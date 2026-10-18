'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatDate } from '@/lib/utils';
import { Bell } from 'lucide-react';
import { Th } from '@/components/ui/Th';
import { Td } from '@/components/ui/Td';
import { TableWrapper } from '@/components/ui/TableWrapper';
import { EmptyState } from '@/components/ui/EmptyState';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { getReportDefaultDates } from '@/lib/reportConfig';

interface ReminderEntry {
  id: string;
  dateTime: string;
  category: string;
  notes: string;
  isRecurring: boolean;
  property?: { name?: string };
}

export function RemindersReport() {
  const [propertyId, setPropertyId] = useState('all');
  const reportDates = getReportDefaultDates();
  const [startDate, setStartDate] = useState(reportDates.startDate);
  const [endDate, setEndDate] = useState(reportDates.endDate);
  const [entries, setEntries] = useState<ReminderEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (propertyId !== 'all') params.set('propertyId', propertyId);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      const res = await fetch(`/api/reports/reminders?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
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
            icon={Bell}
            title={loading ? 'Loading...' : 'No reminders for the selected period'}
            description=""
          />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <Th>Date</Th>
                <Th>Category</Th>
                <Th>Property</Th>
                <Th>Notes</Th>
                <Th>Recurring</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <Td>{formatDate(r.dateTime)}</Td>
                  <Td>{r.category}</Td>
                  <Td>{r.property?.name || 'Organization'}</Td>
                  <Td>{r.notes || '-'}</Td>
                  <Td>{r.isRecurring ? 'Yes' : 'No'}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TableWrapper>
    </div>
  );
}
