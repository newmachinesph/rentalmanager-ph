'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Search,
  Zap,
  Droplets,
  Edit2,
  Trash2,
  X,
} from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';
import { Th } from '@/components/ui/Th';
import { Td } from '@/components/ui/Td';
import { TableWrapper } from '@/components/ui/TableWrapper';
import { EmptyState } from '@/components/ui/EmptyState';
import { DeleteConfirmDialog } from '@/components/organization/DeleteConfirmDialog';
import { BulkActionBar } from '@/components/ui/BulkActionBar';
import { useMultiSelect } from '@/hooks/useMultiSelect';
import {
  PageHeaderSkeleton,
  SearchBarSkeleton,
  TableSkeleton,
} from '@/components/ui/Skeleton';
import { UtilityReadingModal } from '@/components/utilities/UtilityReadingModal';
import type { UtilityFormData } from '@/components/utilities/UtilityReadingModal';
import { useUtilityStore } from '@/stores/utilityStore';
import { usePropertyStore } from '@/stores/propertyStore';
import { formatDate, cn, INPUT_CLASS } from '@/lib/utils';
import type { UtilityReading, UtilityType } from '@/lib/types';

/* ------------------------------------------------------------------ Constants */

type TypeTab = 'All' | 'Electricity' | 'Water';
const TYPE_TABS: TypeTab[] = ['All', 'Electricity', 'Water'];

const TYPE_BADGE: Record<string, string> = {
  Electricity: 'bg-yellow-100 text-yellow-700',
  Water: 'bg-cyan-100 text-cyan-700',
};

/* ============================================================== Main Page */

export default function UtilitiesPage() {
  /* ---- Hydrate stores ---- */
  const fetchReadings = useUtilityStore((s) => s.fetchReadings);
  const fetchProperties = usePropertyStore((s) => s.fetchProperties);
  useEffect(() => {
    fetchReadings();
    fetchProperties();
  }, [fetchReadings, fetchProperties]);

  /* ---- Store state ---- */
  const readings = useUtilityStore((s) => s.readings);
  const loading = useUtilityStore((s) => s.loading);
  const searchQuery = useUtilityStore((s) => s.searchQuery);
  const setSearchQuery = useUtilityStore((s) => s.setSearchQuery);
  const filterProperty = useUtilityStore((s) => s.filterProperty);
  const setFilterProperty = useUtilityStore((s) => s.setFilterProperty);
  const filterPaid = useUtilityStore((s) => s.filterPaid);
  const setFilterPaid = useUtilityStore((s) => s.setFilterPaid);
  const addReading = useUtilityStore((s) => s.addReading);
  const updateReading = useUtilityStore((s) => s.updateReading);
  const deleteReading = useUtilityStore((s) => s.deleteReading);
  const deleteMultiple = useUtilityStore((s) => s.deleteMultiple);

  const properties = usePropertyStore((s) => s.properties);

  /* ---- Local state ---- */
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<UtilityReading | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [activeTab, setActiveTab] = useState<TypeTab>('All');

  /* ---- Tab counts ---- */
  const tabCounts = useMemo(() => {
    const counts: Record<TypeTab, number> = { All: readings.length, Electricity: 0, Water: 0 };
    readings.forEach((r) => {
      if (r.utilityType === 'Electricity') counts.Electricity++;
      if (r.utilityType === 'Water') counts.Water++;
    });
    return counts;
  }, [readings]);

  /* ---- Filtered & paginated ---- */
  const filteredRecords = useMemo(() => {
    let result = readings;

    if (activeTab !== 'All') {
      result = result.filter((r) => r.utilityType === activeTab);
    }
    if (filterProperty && filterProperty !== 'All') {
      result = result.filter((r) => r.propertyId === filterProperty);
    }
    if (filterPaid === 'Paid') {
      result = result.filter((r) => r.isPaid);
    } else if (filterPaid === 'Unpaid') {
      result = result.filter((r) => !r.isPaid);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.property?.name.toLowerCase().includes(q) ||
          r.unit?.name.toLowerCase().includes(q) ||
          r.notes.toLowerCase().includes(q),
      );
    }

    result = [...result].sort(
      (a, b) => new Date(b.readingDate).getTime() - new Date(a.readingDate).getTime(),
    );
    return result;
  }, [readings, activeTab, filterProperty, filterPaid, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedRecords = filteredRecords.slice((safePage - 1) * pageSize, safePage * pageSize);

  /* ---- Multi-select ---- */
  const { selectedIds, toggleOne, toggleAll, clearSelection, allSelected, someSelected } =
    useMultiSelect(paginatedRecords);

  /* ---- Handlers ---- */
  function handleAddClick() {
    setEditingRecord(null);
    setIsFormOpen(true);
  }

  function handleEditClick(record: UtilityReading) {
    setEditingRecord(record);
    setIsFormOpen(true);
  }

  function handleSave(data: UtilityFormData) {
    if (editingRecord) {
      updateReading(editingRecord.id, data);
    } else {
      addReading(data as Omit<UtilityReading, 'id' | 'createdAt'>);
    }
    setIsFormOpen(false);
    setEditingRecord(null);
  }

  function handleDeleteRequest(record: UtilityReading) {
    setDeleteTarget({
      id: record.id,
      name: `${record.utilityType} reading - ${record.property?.name ?? 'Unknown'}`,
    });
  }

  function handleDeleteConfirm() {
    if (deleteTarget) {
      deleteReading(deleteTarget.id);
      setDeleteTarget(null);
    }
  }

  function formatCurrency(n: number) {
    return `PHP ${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  /* ---- Loading ---- */
  if (loading) {
    return (
      <div className="space-y-0">
        <PageHeaderSkeleton />
        <SearchBarSkeleton />
        <div className="mt-4">
          <TableSkeleton rows={5} cols={10} />
        </div>
      </div>
    );
  }

  /* ---- Render ---- */
  return (
    <div className="space-y-0">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[28px] font-bold text-slate-900">Utilities Tracker</h1>
        <button
          onClick={handleAddClick}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md h-10 px-5 text-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Reading
        </button>
      </div>

      {/* Type Tabs */}
      <div className="border-b border-slate-200 mb-4">
        <nav className="-mb-px flex gap-1" aria-label="Utility type filter">
          {TYPE_TABS.map((tab) => {
            const isActiveTab = activeTab === tab;
            const count = tabCounts[tab];
            const Icon = tab === 'Water' ? Droplets : Zap;
            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setCurrentPage(1);
                }}
                className={cn(
                  'relative flex items-center gap-2 whitespace-nowrap pb-3 px-3 text-sm font-medium transition-colors',
                  isActiveTab
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-slate-500 hover:text-slate-700',
                )}
              >
                {tab !== 'All' && <Icon className="h-3.5 w-3.5" />}
                {tab}
                <span
                  className={cn(
                    'inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold',
                    isActiveTab ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500',
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        {/* Search */}
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by property, unit, or notes"
            className="w-full rounded-md border border-slate-300 bg-slate-50 pl-3 pr-10 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
          />
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-9 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Property filter */}
          <select
            value={filterProperty}
            onChange={(e) => {
              setFilterProperty(e.target.value);
              setCurrentPage(1);
            }}
            className={cn(INPUT_CLASS, 'w-auto min-w-[180px]')}
          >
            <option value="All">All Properties</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Paid filter */}
          <select
            value={filterPaid}
            onChange={(e) => {
              setFilterPaid(e.target.value as 'All' | 'Paid' | 'Unpaid');
              setCurrentPage(1);
            }}
            className={cn(INPUT_CLASS, 'w-auto min-w-[120px]')}
          >
            <option value="All">All Status</option>
            <option value="Paid">Paid</option>
            <option value="Unpaid">Unpaid</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <TableWrapper>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <Th className="w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected; }}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              </Th>
              <Th>Property</Th>
              <Th className="hidden md:table-cell">Unit</Th>
              <Th>Type</Th>
              <Th>Date</Th>
              <Th align="right" className="hidden lg:table-cell">Prev</Th>
              <Th align="right" className="hidden lg:table-cell">Current</Th>
              <Th align="right">Consumption</Th>
              <Th align="right">Amount</Th>
              <Th>Status</Th>
              <Th align="right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {paginatedRecords.map((record) => (
              <tr
                key={record.id}
                className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <Td className="w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(record.id)}
                    onChange={() => toggleOne(record.id)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </Td>
                <Td>
                  <span className="font-medium text-slate-800">
                    {record.property?.name ?? 'Unknown'}
                  </span>
                </Td>
                <Td className="text-slate-600 hidden md:table-cell">
                  {record.unit?.name ?? 'Common area'}
                </Td>
                <Td>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium',
                      TYPE_BADGE[record.utilityType] || 'bg-slate-100 text-slate-700',
                    )}
                  >
                    {record.utilityType === 'Water' ? (
                      <Droplets className="h-3 w-3" />
                    ) : (
                      <Zap className="h-3 w-3" />
                    )}
                    {record.utilityType}
                  </span>
                </Td>
                <Td className="text-slate-600 whitespace-nowrap">
                  {formatDate(record.readingDate)}
                </Td>
                <Td align="right" className="text-slate-600 hidden lg:table-cell">
                  {record.previousReading.toFixed(2)}
                </Td>
                <Td align="right" className="text-slate-600 hidden lg:table-cell">
                  {record.currentReading.toFixed(2)}
                </Td>
                <Td align="right">
                  <span className="font-medium text-slate-800">
                    {record.consumption.toFixed(2)}
                  </span>
                </Td>
                <Td align="right">
                  <span className="font-bold text-slate-800">
                    {formatCurrency(record.amount)}
                  </span>
                </Td>
                <Td>
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                      record.isPaid
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700',
                    )}
                  >
                    {record.isPaid ? 'Paid' : 'Unpaid'}
                  </span>
                </Td>
                <Td>
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick(record);
                      }}
                      className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      aria-label="Edit reading"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRequest(record);
                      }}
                      className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      aria-label="Delete reading"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>

        {paginatedRecords.length === 0 && (
          <EmptyState
            icon={Zap}
            title="No utility readings found"
            description={
              searchQuery
                ? 'Try adjusting your search query or filters'
                : 'Get started by adding your first utility reading'
            }
            variant="inline"
            actionLabel={!searchQuery ? 'New Reading' : undefined}
            onAction={!searchQuery ? handleAddClick : undefined}
          />
        )}
      </TableWrapper>

      {/* Bulk Action Bar */}
      <BulkActionBar
        count={selectedIds.size}
        onDelete={async () => {
          const failures = await deleteMultiple(Array.from(selectedIds));
          clearSelection();
          if (failures > 0) alert(`${failures} record(s) could not be deleted.`);
        }}
        onClear={clearSelection}
        entityLabel="reading"
      />

      {/* Pagination */}
      {filteredRecords.length > 0 && (
        <div className="mt-3">
          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            totalItems={filteredRecords.length}
            pageSize={pageSize}
            onPageChange={(p) => setCurrentPage(p)}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setCurrentPage(1);
            }}
          />
        </div>
      )}

      {/* Form Modal */}
      <UtilityReadingModal
        isOpen={isFormOpen}
        editingRecord={editingRecord}
        onClose={() => {
          setIsFormOpen(false);
          setEditingRecord(null);
        }}
        onSave={handleSave}
        properties={properties}
        readings={readings}
      />

      {/* Delete Confirmation */}
      {deleteTarget && (
        <DeleteConfirmDialog
          itemLabel={deleteTarget.name}
          title="Delete Utility Reading"
          confirmLabel="Delete Reading"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
