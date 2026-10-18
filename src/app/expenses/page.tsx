'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Search,
  Receipt,
  Calculator,
  Tag,
  Building2,
  Edit2,
  Trash2,
  X,
} from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';
import { Th } from '@/components/ui/Th';
import { Td } from '@/components/ui/Td';
import { TableWrapper } from '@/components/ui/TableWrapper';
import { KpiCard } from '@/components/ui/KpiCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { BulkActionBar } from '@/components/ui/BulkActionBar';
import { DeleteConfirmDialog } from '@/components/organization/DeleteConfirmDialog';
import { ExpenseFormModal } from '@/components/organization/ExpenseFormModal';
import { useMultiSelect } from '@/hooks/useMultiSelect';
import {
  PageHeaderSkeleton,
  KpiCardSkeleton,
  TabsSkeleton,
  SearchBarSkeleton,
  TableSkeleton,
} from '@/components/ui/Skeleton';
import { useExpenseStore } from '@/stores/expenseStore';
import { usePropertyStore } from '@/stores/propertyStore';
import { formatCurrency, formatDate, cn, INPUT_CLASS } from '@/lib/utils';
import type { ExpenseRecord } from '@/lib/types';
import type { ExpenseFormData } from '@/components/organization/ExpenseFormModal';

/* ------------------------------------------------------------------ Constants */

type CategoryTab = 'All' | 'Maintenance' | 'Repairs' | 'Utilities' | 'Insurance' | 'Property Tax';

const CATEGORY_TABS: CategoryTab[] = [
  'All',
  'Maintenance',
  'Repairs',
  'Utilities',
  'Insurance',
  'Property Tax',
];

const CATEGORY_BADGE_COLORS: Record<string, string> = {
  Maintenance: 'bg-blue-100 text-blue-700',
  Repairs: 'bg-orange-100 text-orange-700',
  Utilities: 'bg-cyan-100 text-cyan-700',
  Insurance: 'bg-emerald-100 text-emerald-700',
  'Property Tax': 'bg-red-100 text-red-700',
  'HOA/Association Dues': 'bg-purple-100 text-purple-700',
  'Management Fee': 'bg-indigo-100 text-indigo-700',
  Cleaning: 'bg-teal-100 text-teal-700',
  'Pest Control': 'bg-amber-100 text-amber-700',
  Landscaping: 'bg-lime-100 text-lime-700',
  'Legal Fees': 'bg-rose-100 text-rose-700',
  Advertising: 'bg-pink-100 text-pink-700',
  Supplies: 'bg-yellow-100 text-yellow-700',
  'Other Expense': 'bg-slate-100 text-slate-700',
};

/* ============================================================== Main Page */

export default function ExpensesPage() {
  /* ---- Hydrate stores on mount ---- */
  const fetchRecords = useExpenseStore((s) => s.fetchRecords);
  const fetchProperties = usePropertyStore((s) => s.fetchProperties);
  useEffect(() => {
    fetchRecords();
    fetchProperties();
  }, [fetchRecords, fetchProperties]);

  /* ---- Store state ---- */
  const records = useExpenseStore((s) => s.records);
  const loading = useExpenseStore((s) => s.loading);
  const searchQuery = useExpenseStore((s) => s.searchQuery);
  const setSearchQuery = useExpenseStore((s) => s.setSearchQuery);
  const filterProperty = useExpenseStore((s) => s.filterProperty);
  const setFilterProperty = useExpenseStore((s) => s.setFilterProperty);
  const addRecord = useExpenseStore((s) => s.addRecord);
  const updateRecord = useExpenseStore((s) => s.updateRecord);
  const deleteRecord = useExpenseStore((s) => s.deleteRecord);
  const deleteMultiple = useExpenseStore((s) => s.deleteMultiple);

  const properties = usePropertyStore((s) => s.properties);

  /* ---- Local state ---- */
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ExpenseRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [activeTab, setActiveTab] = useState<CategoryTab>('All');

  /* ---- KPI calculations ---- */
  const kpis = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Total expenses this month
    const thisMonthTotal = records
      .filter((r) => {
        const d = new Date(r.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, r) => sum + r.amount, 0);

    // Average monthly expense
    const monthSet = new Set(
      records.map((r) => {
        const d = new Date(r.date);
        return `${d.getFullYear()}-${d.getMonth()}`;
      })
    );
    const uniqueMonths = Math.max(monthSet.size, 1);
    const totalAll = records.reduce((sum, r) => sum + r.amount, 0);
    const avgMonthly = totalAll / uniqueMonths;

    // Top category
    const categoryTotals: Record<string, number> = {};
    records.forEach((r) => {
      categoryTotals[r.category] = (categoryTotals[r.category] || 0) + r.amount;
    });
    const topCategory =
      Object.entries(categoryTotals).sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';

    // Unique properties with expenses
    const uniqueProperties = new Set(records.map((r) => r.propertyId)).size;

    return { thisMonthTotal, avgMonthly, topCategory, uniqueProperties };
  }, [records]);

  /* ---- Filter counts for tabs ---- */
  const tabCounts = useMemo(() => {
    const counts: Record<CategoryTab, number> = {
      All: records.length,
      Maintenance: 0,
      Repairs: 0,
      Utilities: 0,
      Insurance: 0,
      'Property Tax': 0,
    };
    records.forEach((r) => {
      if (r.category in counts) {
        counts[r.category as CategoryTab]++;
      }
    });
    return counts;
  }, [records]);

  /* ---- Filtered & paginated records ---- */
  const filteredRecords = useMemo(() => {
    let result = records;

    // Category tab filter
    if (activeTab !== 'All') {
      result = result.filter((r) => r.category === activeTab);
    }

    // Property filter
    if (filterProperty && filterProperty !== 'All') {
      result = result.filter((r) => r.propertyId === filterProperty);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.vendor.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q)
      );
    }

    // Sort by date descending
    result = [...result].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return result;
  }, [records, activeTab, filterProperty, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedRecords = filteredRecords.slice((safePage - 1) * pageSize, safePage * pageSize);

  const { selectedIds, toggleOne, toggleAll, clearSelection, allSelected, someSelected } = useMultiSelect(paginatedRecords);

  /* ---- Helpers ---- */
  function getPropertyName(propertyId: string): string {
    return properties.find((p) => p.id === propertyId)?.name ?? 'Unknown Property';
  }

  function getUnitName(propertyId: string, unitId: string | null): string {
    if (!unitId) return 'Common area';
    const property = properties.find((p) => p.id === propertyId);
    return property?.units.find((u) => u.id === unitId)?.name ?? 'Common area';
  }

  /* ---- Handlers ---- */
  function handleAddClick() {
    setEditingRecord(null);
    setIsFormOpen(true);
  }

  function handleEditClick(record: ExpenseRecord) {
    setEditingRecord(record);
    setIsFormOpen(true);
  }

  function handleSave(data: ExpenseFormData) {
    if (editingRecord) {
      updateRecord(editingRecord.id, data);
    } else {
      addRecord(data);
    }
  }

  function handleDeleteRequest(record: ExpenseRecord) {
    setDeleteTarget({ id: record.id, name: `${record.description} (${formatCurrency(record.amount)})` });
  }

  function handleDeleteConfirm() {
    if (deleteTarget) {
      deleteRecord(deleteTarget.id);
      setDeleteTarget(null);
    }
  }

  /* ---- Loading state ---- */
  if (loading) {
    return (
      <div className="space-y-0">
        <PageHeaderSkeleton />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCardSkeleton />
          <KpiCardSkeleton />
          <KpiCardSkeleton />
          <KpiCardSkeleton />
        </div>
        <TabsSkeleton count={6} />
        <SearchBarSkeleton />
        <div className="mt-4">
          <TableSkeleton rows={5} cols={7} />
        </div>
      </div>
    );
  }

  /* ---- Render ---- */
  return (
    <div className="space-y-0">
      {/* ---- Page Header ---- */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[28px] font-bold text-slate-900">Expenses</h1>
        <button
          onClick={handleAddClick}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md h-10 px-5 text-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Expense
        </button>
      </div>

      {/* ---- KPI Row ---- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          title="Total Expenses"
          value={formatCurrency(kpis.thisMonthTotal)}
          change={0}
          trend="neutral"
          icon={Receipt}
          color="red"
        />
        <KpiCard
          title="Avg Monthly"
          value={formatCurrency(kpis.avgMonthly)}
          change={0}
          trend="neutral"
          icon={Calculator}
          color="amber"
        />
        <KpiCard
          title="Top Category"
          value={kpis.topCategory}
          change={0}
          trend="neutral"
          icon={Tag}
          color="purple"
        />
        <KpiCard
          title="Properties"
          value={String(kpis.uniqueProperties)}
          change={0}
          trend="neutral"
          icon={Building2}
          color="blue"
        />
      </div>

      {/* ---- Category Filter Tabs ---- */}
      <div className="border-b border-slate-200 mb-4">
        <nav className="-mb-px flex gap-1" aria-label="Expense category filter">
          {CATEGORY_TABS.map((tab) => {
            const isActive = activeTab === tab;
            const count = tabCounts[tab];
            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setCurrentPage(1);
                }}
                className={cn(
                  'relative flex items-center gap-2 whitespace-nowrap pb-3 px-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {tab}
                <span
                  className={cn(
                    'inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold',
                    isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* ---- Toolbar Row ---- */}
      <div className="flex items-center justify-between gap-4 mb-4">
        {/* Search */}
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by vendor or description"
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
      </div>

      {/* ---- Data Table ---- */}
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
              <Th>Date</Th>
              <Th>Property</Th>
              <Th className="hidden md:table-cell">Unit</Th>
              <Th>Category</Th>
              <Th align="right">Amount</Th>
              <Th className="hidden lg:table-cell">Vendor</Th>
              <Th className="hidden lg:table-cell">Description</Th>
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
                <Td className="text-slate-600 whitespace-nowrap">
                  {formatDate(record.date)}
                </Td>
                <Td>
                  <span className="font-medium text-slate-800">
                    {getPropertyName(record.propertyId)}
                  </span>
                </Td>
                <Td className="text-slate-600 hidden md:table-cell">
                  {getUnitName(record.propertyId, record.unitId)}
                </Td>
                <Td>
                  <span
                    className={cn(
                      'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
                      CATEGORY_BADGE_COLORS[record.category] || 'bg-slate-100 text-slate-700'
                    )}
                  >
                    {record.category}
                  </span>
                </Td>
                <Td align="right">
                  <span className="font-bold text-slate-800">
                    {formatCurrency(record.amount)}
                  </span>
                </Td>
                <Td className="text-slate-600 hidden lg:table-cell">
                  {record.vendor || '\u2014'}
                </Td>
                <Td className="text-slate-600 hidden lg:table-cell">
                  <span className="block max-w-[200px] truncate">
                    {record.description}
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
                      aria-label="Edit expense"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRequest(record);
                      }}
                      className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      aria-label="Delete expense"
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
            icon={Receipt}
            title="No expenses found"
            description={
              searchQuery
                ? 'Try adjusting your search query or filters'
                : 'Get started by adding your first expense'
            }
            variant="inline"
            actionLabel={!searchQuery ? 'Add Expense' : undefined}
            onAction={!searchQuery ? handleAddClick : undefined}
          />
        )}
      </TableWrapper>

      <BulkActionBar
        count={selectedIds.size}
        onDelete={async () => {
          const failures = await deleteMultiple(Array.from(selectedIds));
          clearSelection();
          if (failures > 0) alert(`${failures} record(s) could not be deleted.`);
        }}
        onClear={clearSelection}
        entityLabel="expense"
      />

      {/* ---- Pagination ---- */}
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

      {/* ---- Add/Edit Modal ---- */}
      <ExpenseFormModal
        isOpen={isFormOpen}
        editingRecord={editingRecord}
        onClose={() => {
          setIsFormOpen(false);
          setEditingRecord(null);
        }}
        onSave={handleSave}
      />

      {/* ---- Delete Confirmation ---- */}
      {deleteTarget && (
        <DeleteConfirmDialog
          itemLabel={deleteTarget.name}
          title="Delete Expense"
          confirmLabel="Delete Expense"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
