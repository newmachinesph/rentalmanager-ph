'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Wrench,
  Plus,
  Trash2,
  X,
  CheckCircle,
  Calendar,
  DollarSign,
  User,
  Building2,
  Phone,
  ChevronDown,
  Flag,
  Home,
  LayoutGrid,
  List,
} from 'lucide-react';
import { useMaintenanceStore } from '@/stores/maintenanceStore';
import { usePropertyStore } from '@/stores/propertyStore';
import { useTenantStore } from '@/stores/tenantStore';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { Th } from '@/components/ui/Th';
import { Td } from '@/components/ui/Td';
import { TableWrapper } from '@/components/ui/TableWrapper';
import { BulkActionBar } from '@/components/ui/BulkActionBar';
import { useMultiSelect } from '@/hooks/useMultiSelect';
import { MaintenancePropertiesDropdown } from '@/components/maintenance/MaintenancePropertiesDropdown';
import { MaintenanceFilterDropdown } from '@/components/maintenance/MaintenanceFilterDropdown';
import { PageHeaderSkeleton, KanbanSkeleton } from '@/components/ui/Skeleton';
import type {
  MaintenanceRequest,
  MaintenanceCategory,
  Priority,
  MaintenanceStatus,
} from '@/lib/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES: MaintenanceCategory[] = [
  'Plumbing',
  'Electrical',
  'HVAC',
  'Appliance',
  'Structural',
  'Painting',
  'Pest Control',
  'Cleaning',
  'Security',
  'Other',
];

const PRIORITIES: Priority[] = ['Low', 'Medium', 'High', 'Urgent'];

const STATUSES: MaintenanceStatus[] = [
  'Open',
  'In Progress',
  'Completed',
  'On Hold',
  'Cancelled',
];

const PRIORITY_BADGE: Record<Priority, string> = {
  Low: 'bg-green-50 text-green-700 border border-green-200',
  Medium: 'bg-amber-50 text-amber-700 border border-amber-200',
  High: 'bg-orange-50 text-orange-700 border border-orange-200',
  Urgent: 'bg-red-50 text-red-700 border border-red-200',
};

const PRIORITY_SELECT_BADGE: Record<Priority, string> = {
  Low: 'bg-green-100 text-green-700',
  Medium: 'bg-amber-100 text-amber-700',
  High: 'bg-orange-100 text-orange-700',
  Urgent: 'bg-red-100 text-red-700',
};

interface KanbanColumn {
  status: MaintenanceStatus;
  label: string;
}

const KANBAN_COLUMNS: KanbanColumn[] = [
  { status: 'Open', label: 'NEW' },
  { status: 'In Progress', label: 'IN PROGRESS' },
  { status: 'Completed', label: 'COMPLETED' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const emptyForm: Omit<MaintenanceRequest, 'id' | 'createdAt'> = {
  propertyId: '',
  unitId: '',
  tenantId: null,
  title: '',
  description: '',
  category: 'Plumbing',
  priority: 'Medium',
  status: 'Open',
  dateReported: new Date().toISOString().split('T')[0],
  dateCompleted: null,
  estimatedCost: 0,
  actualCost: null,
  contractor: '',
  contractorPhone: '',
  notes: '',
};

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function MaintenancePage() {
  // -- Hydrate stores from API ------------------------------------------------
  const fetchRequests = useMaintenanceStore((s) => s.fetchRequests);
  const fetchProperties = usePropertyStore((s) => s.fetchProperties);
  const fetchTenants = useTenantStore((s) => s.fetchTenants);
  useEffect(() => {
    fetchRequests();
    fetchProperties();
    fetchTenants();
  }, [fetchRequests, fetchProperties, fetchTenants]);

  // -- Stores ----------------------------------------------------------------
  const {
    requests,
    loading,
    searchQuery,
    filterStatus,
    filterPriorities,
    filterProperties,
    filterCompletedIn,
    setSearchQuery,
    setFilterStatus,
    setFilterPriorities,
    setFilterProperties,
    setFilterCompletedIn,
    addRequest,
    updateRequest,
    deleteRequest,
  } = useMaintenanceStore();
  const deleteMultiple = useMaintenanceStore((s) => s.deleteMultiple);

  const { properties } = usePropertyStore();
  const { tenants } = useTenantStore();

  // -- Local state -----------------------------------------------------------
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<MaintenanceRequest | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // -- Lookup helpers --------------------------------------------------------
  const propertyMap = useMemo(() => {
    const map: Record<string, { name: string; units: { id: string; name: string }[] }> = {};
    properties.forEach((p) => {
      map[p.id] = { name: p.name, units: p.units.map((u) => ({ id: u.id, name: u.name })) };
    });
    return map;
  }, [properties]);

  const tenantMap = useMemo(() => {
    const map: Record<string, string> = {};
    tenants.forEach((t) => {
      map[t.id] = `${t.firstName} ${t.lastName}`;
    });
    return map;
  }, [tenants]);

  const getPropertyName = useCallback((id: string) => propertyMap[id]?.name ?? 'Unknown Property', [propertyMap]);
  const getUnitName = useCallback((propertyId: string, unitId: string) =>
    propertyMap[propertyId]?.units.find((u) => u.id === unitId)?.name ?? 'Unknown Unit', [propertyMap]);
  const getTenantName = useCallback((id: string | null) => (id ? tenantMap[id] ?? 'Unknown Tenant' : ''), [tenantMap]);

  // -- "Completed in" cutoff date --------------------------------------------
  const completedCutoff = useMemo(() => {
    if (filterCompletedIn === 'all') return null;
    const now = new Date();
    switch (filterCompletedIn) {
      case '60d': return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 60);
      case '90d': return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90);
      case '12m': return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      case '2y': return new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
      default: return null;
    }
  }, [filterCompletedIn]);

  // -- Filtered requests -----------------------------------------------------
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const matchesSearch =
        searchQuery === '' ||
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.contractor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getPropertyName(r.propertyId).toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = filterStatus === 'All' || r.status === filterStatus;
      const matchesPriority = filterPriorities.size === 0 || filterPriorities.has(r.priority);

      // Property filter: match property ID or unit ID (multi-select)
      let matchesProperty = filterProperties.size === 0;
      if (!matchesProperty) {
        for (const id of filterProperties) {
          if (r.propertyId === id) { matchesProperty = true; break; }
          if (r.unitId === id) { matchesProperty = true; break; }
          // Check if selected id is a property that owns this request's unit
          const prop = properties.find((p) => p.id === id);
          if (prop && prop.units.some((u) => u.id === r.unitId)) { matchesProperty = true; break; }
        }
      }

      // Completed in filter: only applies to completed requests
      let matchesCompleted = true;
      if (completedCutoff && r.status === 'Completed' && r.dateCompleted) {
        matchesCompleted = new Date(r.dateCompleted) >= completedCutoff;
      }

      return matchesSearch && matchesStatus && matchesPriority && matchesProperty && matchesCompleted;
    });
  }, [requests, searchQuery, filterStatus, filterPriorities, filterProperties, filterCompletedIn, completedCutoff, properties, getPropertyName]);

  // -- Modal handlers --------------------------------------------------------
  const openAddModal = () => {
    setEditingRequest(null);
    setFormData({ ...emptyForm, dateReported: new Date().toISOString().split('T')[0] });
    setIsModalOpen(true);
  };

  const openEditModal = (req: MaintenanceRequest) => {
    setEditingRequest(req);
    setFormData({
      propertyId: req.propertyId,
      unitId: req.unitId,
      tenantId: req.tenantId,
      title: req.title,
      description: req.description,
      category: req.category,
      priority: req.priority,
      status: req.status,
      dateReported: req.dateReported,
      dateCompleted: req.dateCompleted,
      estimatedCost: req.estimatedCost,
      actualCost: req.actualCost,
      contractor: req.contractor,
      contractorPhone: req.contractorPhone,
      notes: req.notes,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRequest(null);
  };

  const handleSave = () => {
    if (!formData.title.trim() || !formData.propertyId || !formData.unitId) return;
    if (editingRequest) {
      updateRequest(editingRequest.id, formData);
    } else {
      addRequest(formData);
    }
    closeModal();
  };

  const handleDelete = (id: string) => {
    deleteRequest(id);
    setDeleteConfirmId(null);
  };

  // -- Units filtered by selected property -----------------------------------
  const availableUnits = useMemo(() => {
    if (!formData.propertyId) return [];
    return propertyMap[formData.propertyId]?.units ?? [];
  }, [formData.propertyId, propertyMap]);

  // -- Kanban grouped --------------------------------------------------------
  const kanbanData = useMemo(() => {
    const grouped: Record<MaintenanceStatus, MaintenanceRequest[]> = {
      Open: [],
      'In Progress': [],
      'On Hold': [],
      Completed: [],
      Cancelled: [],
    };
    filteredRequests.forEach((r) => {
      if (grouped[r.status]) grouped[r.status].push(r);
    });
    return grouped;
  }, [filteredRequests]);

  // Check if all kanban columns are empty for the overall empty state
  const allColumnsEmpty = KANBAN_COLUMNS.every(
    (col) => (kanbanData[col.status] ?? []).length === 0
  );

  // -- Multi-select (table view only) ----------------------------------------
  const { selectedIds, toggleOne, toggleAll, clearSelection, allSelected, someSelected } = useMultiSelect(filteredRequests);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="space-y-5">
        <PageHeaderSkeleton />
        <KanbanSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ===== Header row: title left, controls right ===== */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Maintenance</h1>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center rounded-md border border-slate-200 bg-white">
            <button
              onClick={() => setViewMode('kanban')}
              className={cn(
                'inline-flex items-center justify-center h-9 w-9 rounded-l-md transition-colors',
                viewMode === 'kanban'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-400 hover:text-slate-600'
              )}
              aria-label="Kanban view"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                'inline-flex items-center justify-center h-9 w-9 rounded-r-md transition-colors',
                viewMode === 'table'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-400 hover:text-slate-600'
              )}
              aria-label="Table view"
            >
              <List size={16} />
            </button>
          </div>

          {/* Properties dropdown */}
          <MaintenancePropertiesDropdown
            selected={filterProperties}
            onChange={setFilterProperties}
          />

          {/* Filter dropdown */}
          <MaintenanceFilterDropdown
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            priorities={filterPriorities}
            onPrioritiesChange={setFilterPriorities}
            completedIn={filterCompletedIn}
            onCompletedInChange={setFilterCompletedIn}
          />

          {/* + New request button */}
          <button
            onClick={openAddModal}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-5 py-2 text-sm font-medium inline-flex items-center gap-1.5 shadow-sm"
          >
            <Plus size={16} />
            New request
          </button>
        </div>
      </div>

      {/* ===== Kanban Board ===== */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {KANBAN_COLUMNS.map((col) => {
            const items = kanbanData[col.status] ?? [];
            return (
              <div key={col.status} className="flex flex-col">
                {/* Column header */}
                <h3 className="text-sm uppercase tracking-wider font-bold text-slate-700 mb-3">
                  {col.label}
                </h3>

                {/* Column body */}
                <div className="bg-slate-100 rounded-lg p-3 flex-1 min-h-[400px]">
                  {/* Cards */}
                  <div className="space-y-3">
                    {items.map((req) => (
                      <div
                        key={req.id}
                        onClick={() => openEditModal(req)}
                        className="bg-white border border-slate-200 rounded-md p-4 shadow-sm hover:shadow-md cursor-pointer transition-shadow"
                      >
                        {/* Title + Priority */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="text-sm font-medium text-slate-800 leading-snug line-clamp-2">
                            {req.title}
                          </h4>
                          <span className={cn(
                            'shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide',
                            PRIORITY_BADGE[req.priority]
                          )}>
                            {req.priority}
                          </span>
                        </div>

                        {/* Property */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                          <Building2 size={12} className="shrink-0 text-slate-400" />
                          <span className="truncate">
                            {getPropertyName(req.propertyId)} - {getUnitName(req.propertyId, req.unitId)}
                          </span>
                        </div>

                        {/* Category */}
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600">
                          {req.category}
                        </span>

                        {/* Footer */}
                        <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-2 border-t border-slate-100">
                          <div className="flex items-center gap-1">
                            <Calendar size={11} />
                            <span>{formatDate(req.dateReported)}</span>
                          </div>
                          {(req.estimatedCost > 0 || (req.actualCost != null && req.actualCost > 0)) && (
                            <div className="flex items-center gap-1 font-medium text-slate-600">
                              <DollarSign size={11} />
                              <span>
                                {req.actualCost != null
                                  ? formatCurrency(req.actualCost)
                                  : formatCurrency(req.estimatedCost)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Delete in card */}
                        <div className="flex items-center justify-end mt-2 pt-1">
                          {deleteConfirmId === req.id ? (
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(req.id); }}
                                className="flex items-center justify-center w-7 h-7 rounded text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                              >
                                <CheckCircle size={13} />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(null); }}
                                className="flex items-center justify-center w-7 h-7 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                              >
                                <X size={13} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(req.id); }}
                              className="flex items-center justify-center w-7 h-7 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Empty column state -- show only when ALL columns are empty (LandlordStudio design) */}
                  {items.length === 0 && allColumnsEmpty && col.status === 'In Progress' && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      {/* Illustration placeholder (like LS houses/plants illustration) */}
                      <div className="mb-4">
                        <svg width="120" height="80" viewBox="0 0 120 80" fill="none" className="mx-auto">
                          {/* Simplified building/plant illustration */}
                          <rect x="25" y="30" width="20" height="30" rx="2" fill="#CBD5E1" />
                          <rect x="50" y="20" width="20" height="40" rx="2" fill="#94A3B8" />
                          <rect x="75" y="35" width="20" height="25" rx="2" fill="#CBD5E1" />
                          <rect x="30" y="38" width="4" height="5" rx="1" fill="#E2E8F0" />
                          <rect x="37" y="38" width="4" height="5" rx="1" fill="#E2E8F0" />
                          <rect x="30" y="48" width="4" height="5" rx="1" fill="#E2E8F0" />
                          <rect x="37" y="48" width="4" height="5" rx="1" fill="#E2E8F0" />
                          <rect x="55" y="26" width="4" height="5" rx="1" fill="#E2E8F0" />
                          <rect x="62" y="26" width="4" height="5" rx="1" fill="#E2E8F0" />
                          <rect x="55" y="36" width="4" height="5" rx="1" fill="#E2E8F0" />
                          <rect x="62" y="36" width="4" height="5" rx="1" fill="#E2E8F0" />
                          <rect x="55" y="46" width="4" height="5" rx="1" fill="#E2E8F0" />
                          <rect x="62" y="46" width="4" height="5" rx="1" fill="#E2E8F0" />
                          <rect x="80" y="42" width="4" height="5" rx="1" fill="#E2E8F0" />
                          <rect x="87" y="42" width="4" height="5" rx="1" fill="#E2E8F0" />
                          <rect x="80" y="50" width="4" height="5" rx="1" fill="#E2E8F0" />
                          <rect x="87" y="50" width="4" height="5" rx="1" fill="#E2E8F0" />
                          {/* Plants */}
                          <ellipse cx="18" cy="52" rx="6" ry="10" fill="#3B82F6" opacity="0.3" />
                          <ellipse cx="12" cy="48" rx="5" ry="8" fill="#3B82F6" opacity="0.4" />
                          <ellipse cx="102" cy="52" rx="6" ry="10" fill="#3B82F6" opacity="0.3" />
                          <ellipse cx="108" cy="48" rx="5" ry="8" fill="#3B82F6" opacity="0.4" />
                          <line x1="15" y1="60" x2="15" y2="65" stroke="#64748B" strokeWidth="1.5" />
                          <line x1="105" y1="60" x2="105" y2="65" stroke="#64748B" strokeWidth="1.5" />
                          {/* Ground */}
                          <rect x="0" y="60" width="120" height="2" rx="1" fill="#E2E8F0" />
                        </svg>
                      </div>
                      <p className="text-sm text-slate-500">You have no maintenance requests</p>
                    </div>
                  )}

                  {/* Per-column empty when there ARE items elsewhere */}
                  {items.length === 0 && !allColumnsEmpty && (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <Wrench size={20} className="text-slate-300 mb-2" />
                      <p className="text-xs text-slate-400">No requests</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===== Table View ===== */}
      {viewMode === 'table' && (
        <>
          <TableWrapper>
            {filteredRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-slate-100">
                  <Wrench className="h-7 w-7 text-slate-400" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-800">No maintenance requests found</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Try adjusting your search or filter criteria.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <Th className="w-10">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(el) => { if (el) el.indeterminate = someSelected; }}
                        onChange={toggleAll}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </Th>
                    <Th className="whitespace-nowrap">Title</Th>
                    <Th className="whitespace-nowrap">Property / Unit</Th>
                    <Th className="whitespace-nowrap">Category</Th>
                    <Th className="whitespace-nowrap">Priority</Th>
                    <Th className="whitespace-nowrap">Status</Th>
                    <Th className="whitespace-nowrap">Date Reported</Th>
                    <Th className="whitespace-nowrap" align="right">Cost</Th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((req) => (
                    <tr
                      key={req.id}
                      className="cursor-pointer border-b border-slate-100 hover:bg-slate-50 transition-colors"
                      onClick={() => openEditModal(req)}
                    >
                      <Td className="w-10">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(req.id)}
                          onChange={() => toggleOne(req.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </Td>
                      <Td className="whitespace-nowrap font-medium text-slate-800">
                        {req.title}
                      </Td>
                      <Td className="whitespace-nowrap text-slate-600">
                        {getPropertyName(req.propertyId)} - {getUnitName(req.propertyId, req.unitId)}
                      </Td>
                      <Td className="whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600">
                          {req.category}
                        </span>
                      </Td>
                      <Td className="whitespace-nowrap">
                        <span className={cn(
                          'inline-block rounded-md border px-2.5 py-0.5 text-xs font-semibold uppercase',
                          PRIORITY_BADGE[req.priority]
                        )}>
                          {req.priority}
                        </span>
                      </Td>
                      <Td className="whitespace-nowrap text-slate-600">
                        {req.status}
                      </Td>
                      <Td className="whitespace-nowrap text-slate-600">
                        {formatDate(req.dateReported)}
                      </Td>
                      <Td className="whitespace-nowrap text-right font-medium text-slate-800">
                        {req.actualCost != null
                          ? formatCurrency(req.actualCost)
                          : req.estimatedCost > 0
                            ? formatCurrency(req.estimatedCost)
                            : '\u2014'}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
            entityLabel="request"
          />
        </>
      )}

      {/* ================================================================== */}
      {/* Modal -- matches LandlordStudio add/edit modal                     */}
      {/* ================================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeModal}
          />

          {/* Modal panel */}
          <div className="relative w-full max-w-lg bg-white rounded-lg shadow-xl" role="dialog" aria-modal="true">
            {/* Header -- title input + close */}
            <div className="flex items-center justify-between px-6 pt-6 pb-2">
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter title"
                className="text-xl font-medium text-slate-800 placeholder-slate-400 border-none outline-none bg-transparent w-full focus:ring-0"
              />
              <button
                onClick={closeModal}
                className="flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0 ml-2"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 pb-4 max-h-[calc(100vh-12rem)] overflow-y-auto">
              {/* Property row */}
              <div className="flex items-center gap-3 py-3 border-b border-slate-100">
                <Home size={16} className="text-blue-500 shrink-0" />
                <span className="text-sm text-slate-500 w-24 shrink-0">Property</span>
                <div className="relative flex-1">
                  <select
                    value={formData.propertyId}
                    onChange={(e) => setFormData({ ...formData, propertyId: e.target.value, unitId: '' })}
                    className="w-full text-sm text-slate-700 bg-transparent border-none outline-none cursor-pointer appearance-none pr-6 focus:ring-0"
                  >
                    <option value="">Select property</option>
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Unit row */}
              {formData.propertyId && (
                <div className="flex items-center gap-3 py-3 border-b border-slate-100">
                  <Building2 size={16} className="text-blue-500 shrink-0" />
                  <span className="text-sm text-slate-500 w-24 shrink-0">Unit</span>
                  <div className="relative flex-1">
                    <select
                      value={formData.unitId}
                      onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                      className="w-full text-sm text-slate-700 bg-transparent border-none outline-none cursor-pointer appearance-none pr-6 focus:ring-0"
                    >
                      <option value="">Select unit</option>
                      {availableUnits.map((u) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Status row */}
              <div className="flex items-center gap-3 py-3 border-b border-slate-100">
                <LayoutGrid size={16} className="text-blue-500 shrink-0" />
                <span className="text-sm text-slate-500 w-24 shrink-0">Status</span>
                <div className="relative flex-1">
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as MaintenanceStatus })}
                    className="w-full text-sm text-slate-700 bg-transparent border-none outline-none cursor-pointer appearance-none pr-6 focus:ring-0"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s === 'Open' ? 'New' : s}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Due date row */}
              <div className="flex items-center gap-3 py-3 border-b border-slate-100">
                <Calendar size={16} className="text-blue-500 shrink-0" />
                <span className="text-sm text-slate-500 w-24 shrink-0">Due date</span>
                <input
                  type="date"
                  value={formData.dateReported}
                  onChange={(e) => setFormData({ ...formData, dateReported: e.target.value })}
                  className="flex-1 text-sm text-slate-700 bg-transparent border-none outline-none focus:ring-0"
                />
              </div>

              {/* Priority row */}
              <div className="flex items-center gap-3 py-3 border-b border-slate-100">
                <Flag size={16} className="text-blue-500 shrink-0" />
                <span className="text-sm text-slate-500 w-24 shrink-0">Priority</span>
                <div className="relative flex-1">
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                    className="w-full text-sm text-slate-700 bg-transparent border-none outline-none cursor-pointer appearance-none pr-6 focus:ring-0"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{p.toUpperCase()}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Category row */}
              <div className="flex items-center gap-3 py-3 border-b border-slate-100">
                <Wrench size={16} className="text-blue-500 shrink-0" />
                <span className="text-sm text-slate-500 w-24 shrink-0">Category</span>
                <div className="relative flex-1">
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as MaintenanceCategory })}
                    className="w-full text-sm text-slate-700 bg-transparent border-none outline-none cursor-pointer appearance-none pr-6 focus:ring-0"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Tenant row */}
              <div className="flex items-center gap-3 py-3 border-b border-slate-100">
                <User size={16} className="text-blue-500 shrink-0" />
                <span className="text-sm text-slate-500 w-24 shrink-0">Tenant</span>
                <div className="relative flex-1">
                  <select
                    value={formData.tenantId ?? ''}
                    onChange={(e) => setFormData({ ...formData, tenantId: e.target.value || null })}
                    className="w-full text-sm text-slate-700 bg-transparent border-none outline-none cursor-pointer appearance-none pr-6 focus:ring-0"
                  >
                    <option value="">No tenant</option>
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Contractor row */}
              <div className="flex items-center gap-3 py-3 border-b border-slate-100">
                <User size={16} className="text-blue-500 shrink-0" />
                <span className="text-sm text-slate-500 w-24 shrink-0">Contractor</span>
                <input
                  type="text"
                  value={formData.contractor}
                  onChange={(e) => setFormData({ ...formData, contractor: e.target.value })}
                  placeholder="Contractor name"
                  className="flex-1 text-sm text-slate-700 bg-transparent border-none outline-none placeholder-slate-400 focus:ring-0"
                />
              </div>

              {/* Contractor phone row */}
              <div className="flex items-center gap-3 py-3 border-b border-slate-100">
                <Phone size={16} className="text-blue-500 shrink-0" />
                <span className="text-sm text-slate-500 w-24 shrink-0">Phone</span>
                <input
                  type="text"
                  value={formData.contractorPhone}
                  onChange={(e) => setFormData({ ...formData, contractorPhone: e.target.value })}
                  placeholder="+63 XXX XXX XXXX"
                  className="flex-1 text-sm text-slate-700 bg-transparent border-none outline-none placeholder-slate-400 focus:ring-0"
                />
              </div>

              {/* Cost rows */}
              <div className="grid grid-cols-2 gap-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <DollarSign size={16} className="text-blue-500 shrink-0" />
                  <span className="text-sm text-slate-500 shrink-0">Est. Cost</span>
                  <input
                    type="number"
                    value={formData.estimatedCost || ''}
                    onChange={(e) => setFormData({ ...formData, estimatedCost: Number(e.target.value) || 0 })}
                    placeholder="0"
                    min={0}
                    className="flex-1 text-sm text-slate-700 bg-transparent border-none outline-none placeholder-slate-400 focus:ring-0 w-0"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign size={16} className="text-blue-500 shrink-0" />
                  <span className="text-sm text-slate-500 shrink-0">Actual</span>
                  <input
                    type="number"
                    value={formData.actualCost ?? ''}
                    onChange={(e) => setFormData({ ...formData, actualCost: e.target.value ? Number(e.target.value) : null })}
                    placeholder="0"
                    min={0}
                    className="flex-1 text-sm text-slate-700 bg-transparent border-none outline-none placeholder-slate-400 focus:ring-0 w-0"
                  />
                </div>
              </div>

              {/* Date completed */}
              {formData.status === 'Completed' && (
                <div className="flex items-center gap-3 py-3 border-b border-slate-100">
                  <Calendar size={16} className="text-blue-500 shrink-0" />
                  <span className="text-sm text-slate-500 w-24 shrink-0">Completed</span>
                  <input
                    type="date"
                    value={formData.dateCompleted ?? ''}
                    onChange={(e) => setFormData({ ...formData, dateCompleted: e.target.value || null })}
                    className="flex-1 text-sm text-slate-700 bg-transparent border-none outline-none focus:ring-0"
                  />
                </div>
              )}

              {/* Description tab area (like LandlordStudio) */}
              <div className="mt-4">
                <div className="border-b border-slate-200 mb-3">
                  <span className="text-sm font-medium text-blue-600 border-b-2 border-blue-600 pb-2 inline-block">
                    Description
                  </span>
                </div>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Enter description..."
                  className="w-full text-sm text-slate-700 bg-transparent border-none outline-none resize-none placeholder-slate-400 focus:ring-0"
                />
              </div>

              {/* Notes */}
              {(editingRequest || formData.notes) && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                    placeholder="Additional notes..."
                    className="w-full text-sm text-slate-700 border border-slate-200 rounded-md px-3 py-2 resize-none placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400"
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200">
              <button
                onClick={closeModal}
                className="text-slate-600 hover:text-slate-800 text-sm font-medium px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.title.trim() || !formData.propertyId || !formData.unitId}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-6 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
