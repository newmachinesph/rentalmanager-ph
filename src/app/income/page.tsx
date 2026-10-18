'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  DollarSign,
  Clock,
  AlertTriangle,
  TrendingUp,
  Edit2,
  Trash2,
  X,
} from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';
import { Th } from '@/components/ui/Th';
import { Td } from '@/components/ui/Td';
import { TableWrapper } from '@/components/ui/TableWrapper';
import { KpiCard } from '@/components/ui/KpiCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { BulkActionBar } from '@/components/ui/BulkActionBar';
import { DeleteConfirmDialog } from '@/components/organization/DeleteConfirmDialog';
import { PaymentFormModal } from '@/components/organization/PaymentFormModal';
import { useMultiSelect } from '@/hooks/useMultiSelect';
import type { PaymentFormData } from '@/components/organization/PaymentFormModal';
import {
  PageHeaderSkeleton,
  KpiCardSkeleton,
  TabsSkeleton,
  SearchBarSkeleton,
  TableSkeleton,
} from '@/components/ui/Skeleton';
import { useIncomeStore } from '@/stores/incomeStore';
import { usePropertyStore } from '@/stores/propertyStore';
import { useTenantStore } from '@/stores/tenantStore';
import { formatDate, formatCurrency, cn, INPUT_CLASS } from '@/lib/utils';
import type { IncomeRecord, PaymentStatus } from '@/lib/types';

/* ------------------------------------------------------------------ Constants */

type StatusTab = 'All' | PaymentStatus;

const STATUS_TABS: StatusTab[] = [
  'All',
  'Paid',
  'Pending',
  'Overdue',
  'Partially Paid',
  'Unpaid',
];

/* ============================================================== Main Page */

export default function IncomePage() {
  /* ---- Hydrate stores from API ---- */
  const fetchRecords = useIncomeStore((s) => s.fetchRecords);
  const fetchProperties = usePropertyStore((s) => s.fetchProperties);
  const fetchTenants = useTenantStore((s) => s.fetchTenants);

  useEffect(() => {
    fetchRecords();
    fetchProperties();
    fetchTenants();
  }, [fetchRecords, fetchProperties, fetchTenants]);

  /* ---- Store state ---- */
  const records = useIncomeStore((s) => s.records);
  const loading = useIncomeStore((s) => s.loading);
  const searchQuery = useIncomeStore((s) => s.searchQuery);
  const setSearchQuery = useIncomeStore((s) => s.setSearchQuery);
  const filterProperty = useIncomeStore((s) => s.filterProperty);
  const setFilterProperty = useIncomeStore((s) => s.setFilterProperty);
  const addRecord = useIncomeStore((s) => s.addRecord);
  const updateRecord = useIncomeStore((s) => s.updateRecord);
  const deleteRecord = useIncomeStore((s) => s.deleteRecord);
  const deleteMultiple = useIncomeStore((s) => s.deleteMultiple);

  const properties = usePropertyStore((s) => s.properties);
  const tenants = useTenantStore((s) => s.tenants);

  /* ---- Local state ---- */
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<IncomeRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [activeTab, setActiveTab] = useState<StatusTab>('All');

  /* ---- Lookups ---- */
  const getPropertyName = useCallback((propertyId: string): string => {
    return properties.find((p) => p.id === propertyId)?.name ?? '—';
  }, [properties]);

  const getUnitName = useCallback((propertyId: string, unitId: string | null): string => {
    if (!unitId) return '—';
    const property = properties.find((p) => p.id === propertyId);
    return property?.units.find((u) => u.id === unitId)?.name ?? '—';
  }, [properties]);

  const getTenantName = useCallback((tenantId: string | null): string => {
    if (!tenantId) return '—';
    const tenant = tenants.find((t) => t.id === tenantId);
    return tenant ? `${tenant.firstName} ${tenant.lastName}` : '—';
  }, [tenants]);

  /* ---- KPI calculations ---- */
  const kpis = useMemo(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Total Collected this month — paid records with paidDate in current month
    const paidThisMonth = records.filter(
      (r) => r.status === 'Paid' && r.paidDate && r.paidDate.startsWith(currentMonth)
    );
    const totalCollected = paidThisMonth.reduce((sum, r) => sum + r.amount, 0);

    // Pending payments
    const pendingRecords = records.filter((r) => r.status === 'Pending');
    const pendingSum = pendingRecords.reduce((sum, r) => sum + r.amount, 0);
    const pendingCount = pendingRecords.length;

    // Overdue payments
    const overdueRecords = records.filter((r) => r.status === 'Overdue');
    const overdueSum = overdueRecords.reduce((sum, r) => sum + r.amount, 0);
    const overdueCount = overdueRecords.length;

    // Collection rate — based on current month records (by dueDate)
    const currentMonthRecords = records.filter((r) => r.dueDate.startsWith(currentMonth));
    const paidCount = currentMonthRecords.filter((r) => r.status === 'Paid').length;
    const totalCount = currentMonthRecords.length;
    const collectionRate = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;

    return {
      totalCollected,
      pendingSum,
      pendingCount,
      overdueSum,
      overdueCount,
      collectionRate,
    };
  }, [records]);

  /* ---- Filter counts ---- */
  const filterCounts = useMemo(() => {
    const counts: Record<StatusTab, number> = {
      All: records.length,
      Paid: 0,
      Pending: 0,
      Overdue: 0,
      'Partially Paid': 0,
      Unpaid: 0,
    };
    records.forEach((r) => {
      if (counts[r.status as StatusTab] !== undefined) {
        counts[r.status as StatusTab]++;
      }
    });
    return counts;
  }, [records]);

  /* ---- Filtered + paginated records ---- */
  const filteredRecords = useMemo(() => {
    let result = records;

    // Status tab filter
    if (activeTab !== 'All') {
      result = result.filter((r) => r.status === activeTab);
    }

    // Property filter
    if (filterProperty && filterProperty !== 'All') {
      result = result.filter((r) => r.propertyId === filterProperty);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((r) => {
        const propertyName = getPropertyName(r.propertyId).toLowerCase();
        const unitName = getUnitName(r.propertyId, r.unitId).toLowerCase();
        const tenantName = getTenantName(r.tenantId).toLowerCase();
        return (
          propertyName.includes(q) ||
          unitName.includes(q) ||
          tenantName.includes(q) ||
          r.category.toLowerCase().includes(q) ||
          r.referenceNo.toLowerCase().includes(q) ||
          r.status.toLowerCase().includes(q)
        );
      });
    }

    return result;
  }, [records, activeTab, filterProperty, searchQuery, getPropertyName, getUnitName, getTenantName]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedRecords = filteredRecords.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  const { selectedIds, toggleOne, toggleAll, clearSelection, allSelected, someSelected } = useMultiSelect(paginatedRecords);

  /* ---- Handlers ---- */
  function handleAddClick() {
    setEditingRecord(null);
    setIsFormOpen(true);
  }

  function handleEditClick(record: IncomeRecord) {
    setEditingRecord(record);
    setIsFormOpen(true);
  }

  async function handleSave(data: PaymentFormData) {
    if (editingRecord) {
      await updateRecord(editingRecord.id, data);
    } else {
      await addRecord(data);
    }
  }

  function handleDeleteRequest(record: IncomeRecord) {
    const tenantName = getTenantName(record.tenantId);
    const label = `${record.category} — ${tenantName} (${formatCurrency(record.amount)})`;
    setDeleteTarget({ id: record.id, label });
  }

  function handleDeleteConfirm() {
    if (deleteTarget) {
      deleteRecord(deleteTarget.id);
      setDeleteTarget(null);
    }
  }

  /* ---- Loading skeleton ---- */
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
          <TableSkeleton rows={5} cols={8} />
        </div>
      </div>
    );
  }

  /* ---- Render ---- */
  return (
    <div className="space-y-0">
      {/* ---- Page Header ---- */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[28px] font-bold text-slate-900">Income</h1>
        <button
          onClick={handleAddClick}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md h-10 px-5 text-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          Record Payment
        </button>
      </div>

      {/* ---- KPI Row ---- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          title="Total Collected"
          value={formatCurrency(kpis.totalCollected)}
          change={0}
          icon={DollarSign}
          trend="neutral"
          color="emerald"
        />
        <KpiCard
          title="Pending Payments"
          value={formatCurrency(kpis.pendingSum)}
          change={0}
          icon={Clock}
          trend="neutral"
          color="amber"
        />
        <KpiCard
          title="Overdue Payments"
          value={formatCurrency(kpis.overdueSum)}
          change={0}
          icon={AlertTriangle}
          trend="neutral"
          color="red"
        />
        <KpiCard
          title="Collection Rate"
          value={`${kpis.collectionRate}%`}
          change={0}
          icon={TrendingUp}
          trend="neutral"
          color="blue"
        />
      </div>

      {/* ---- Filter Tabs (underline style) ---- */}
      <div className="border-b border-slate-200 mb-4">
        <nav className="-mb-px flex gap-1" aria-label="Payment status filter">
          {STATUS_TABS.map((tab) => {
            const isActive = activeTab === tab;
            const count = filterCounts[tab];
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
            placeholder="Search by property, tenant, category..."
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
              <Th>Due Date</Th>
              <Th>Property</Th>
              <Th>Unit</Th>
              <Th>Tenant</Th>
              <Th>Category</Th>
              <Th align="right">Amount</Th>
              <Th>Status</Th>
              <Th>Paid Date</Th>
              <Th>Method</Th>
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
                <Td className="text-slate-600">{formatDate(record.dueDate)}</Td>
                <Td className="text-slate-800 font-medium">
                  {getPropertyName(record.propertyId)}
                </Td>
                <Td className="text-slate-600">
                  {getUnitName(record.propertyId, record.unitId)}
                </Td>
                <Td className="text-slate-800">
                  {getTenantName(record.tenantId)}
                </Td>
                <Td className="text-slate-600">{record.category}</Td>
                <Td align="right" className="text-slate-800 font-bold">
                  {formatCurrency(record.amount)}
                </Td>
                <Td>
                  <StatusBadge status={record.status} />
                </Td>
                <Td className="text-slate-600">
                  {record.paidDate ? formatDate(record.paidDate) : '—'}
                </Td>
                <Td className="text-slate-600">
                  {record.paymentMethod ?? '—'}
                </Td>
                <Td>
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleEditClick(record)}
                      className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      aria-label="Edit payment"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteRequest(record)}
                      className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      aria-label="Delete payment"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Empty state */}
        {paginatedRecords.length === 0 && (
          <EmptyState
            icon={DollarSign}
            title="No income records found"
            description={
              searchQuery || activeTab !== 'All' || filterProperty !== 'All'
                ? 'Try adjusting your filters or search query'
                : 'Get started by recording your first payment'
            }
            variant="inline"
            actionLabel={
              !searchQuery && activeTab === 'All' && filterProperty === 'All'
                ? 'Record Payment'
                : undefined
            }
            onAction={
              !searchQuery && activeTab === 'All' && filterProperty === 'All'
                ? handleAddClick
                : undefined
            }
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
        entityLabel="record"
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

      {/* ---- Add/Edit Modal (reuse PaymentFormModal) ---- */}
      <PaymentFormModal
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
          itemLabel={deleteTarget.label}
          title="Delete Payment"
          confirmLabel="Delete Payment"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
