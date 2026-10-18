'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  FileText,
  Plus,
  Search,
  Clock,
  DollarSign,
  Calendar,
  Edit2,
  Trash2,
  X,
  Building2,
  Mail,
  Phone,
  ScrollText,
  AlertTriangle,
} from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';
import { Modal } from '@/components/ui/Modal';
import { ModalFooter } from '@/components/ui/ModalFooter';
import { FormField } from '@/components/ui/FormField';
import { Th } from '@/components/ui/Th';
import { Td } from '@/components/ui/Td';
import { TableWrapper } from '@/components/ui/TableWrapper';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { KpiCard } from '@/components/ui/KpiCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { BulkActionBar } from '@/components/ui/BulkActionBar';
import { DeleteConfirmDialog } from '@/components/organization/DeleteConfirmDialog';
import {
  PageHeaderSkeleton,
  KpiCardSkeleton,
  TabsSkeleton,
  SearchBarSkeleton,
  TableSkeleton,
} from '@/components/ui/Skeleton';
import { useLeaseStore } from '@/stores/leaseStore';
import { usePropertyStore } from '@/stores/propertyStore';
import { useTenantStore } from '@/stores/tenantStore';
import { useIncomeStore } from '@/stores/incomeStore';
import { useMultiSelect } from '@/hooks/useMultiSelect';
import { SOAModal } from '@/components/leases/SOAModal';
import { formatDate, formatCurrency, cn, getInitials, INPUT_CLASS, calculatePenalty } from '@/lib/utils';
import type { Lease, LeaseStatus } from '@/lib/types';

/* ------------------------------------------------------------------ Constants */

const LEASE_STATUSES: LeaseStatus[] = ['Active', 'Expired', 'Terminated', 'Pending'];

type LeaseFilter = 'All' | LeaseStatus | 'Expiring Soon' | 'Overdue';

const LEASE_FILTERS: LeaseFilter[] = ['All', 'Active', 'Pending', 'Expiring Soon', 'Overdue', 'Expired', 'Terminated'];

const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-purple-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-indigo-500',
  'bg-pink-500',
] as const;

const EMPTY_FORM: Omit<Lease, 'id' | 'createdAt'> = {
  propertyId: '',
  unitId: '',
  tenantId: '',
  startDate: '',
  endDate: '',
  monthlyRent: 0,
  securityDeposit: 0,
  advancePayment: 0,
  paymentDueDay: 1,
  status: 'Pending',
  notes: '',
};

/* ------------------------------------------------------------------ Helpers */

function getAvatarColor(firstName: string, lastName: string): string {
  const hash = (firstName.charCodeAt(0) || 0) + (lastName.charCodeAt(0) || 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((new Date(b).getTime() - new Date(a).getTime()) / msPerDay);
}

function monthsBetween(a: string, b: string): number {
  const start = new Date(a);
  const end = new Date(b);
  return (
    (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
  );
}

/* ======================================================= LeaseFormModal */

function LeaseFormModal({
  isOpen,
  editingLease,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  editingLease: Lease | null;
  onClose: () => void;
  onSave: (data: Omit<Lease, 'id' | 'createdAt'>) => void;
}) {
  const properties = usePropertyStore((s) => s.properties);
  const tenants = useTenantStore((s) => s.tenants);

  const [form, setForm] = useState<Omit<Lease, 'id' | 'createdAt'>>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formKey = isOpen ? (editingLease?.id ?? 'new') : 'closed';
  const [prevFormKey, setPrevFormKey] = useState(formKey);

  if (formKey !== prevFormKey) {
    setPrevFormKey(formKey);
    if (isOpen) {
      if (editingLease) {
        const { id: _id, createdAt: _ca, ...rest } = editingLease;
        setForm(rest);
      } else {
        setForm(EMPTY_FORM);
      }
      setErrors({});
    }
  }

  /* Units filtered by selected property */
  const availableUnits = useMemo(() => {
    const property = properties.find((p) => p.id === form.propertyId);
    return property?.units ?? [];
  }, [properties, form.propertyId]);

  function updateField(field: string, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function handlePropertyChange(propertyId: string) {
    updateField('propertyId', propertyId);
    // Reset unit when property changes
    setForm((prev) => ({ ...prev, propertyId, unitId: '' }));
  }

  function handleUnitChange(unitId: string) {
    updateField('unitId', unitId);
    // Auto-fill monthly rent from unit
    const unit = availableUnits.find((u) => u.id === unitId);
    if (unit && !editingLease) {
      setForm((prev) => ({ ...prev, unitId, monthlyRent: unit.monthlyRent }));
    }
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!form.propertyId) newErrors.propertyId = 'Property is required';
    if (!form.unitId) newErrors.unitId = 'Unit is required';
    if (!form.tenantId) newErrors.tenantId = 'Tenant is required';
    if (!form.startDate) newErrors.startDate = 'Start date is required';
    if (!form.endDate) newErrors.endDate = 'End date is required';
    if (!form.monthlyRent || form.monthlyRent <= 0)
      newErrors.monthlyRent = 'Monthly rent is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSave(form);
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingLease ? 'Edit Lease' : 'New Lease'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Property */}
        <FormField label="Property" required error={errors.propertyId}>
          <select
            value={form.propertyId}
            onChange={(e) => handlePropertyChange(e.target.value)}
            className={cn(INPUT_CLASS, errors.propertyId && 'border-red-400')}
          >
            <option value="">Select property</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </FormField>

        {/* Unit */}
        <FormField label="Unit" required error={errors.unitId}>
          <select
            value={form.unitId}
            onChange={(e) => handleUnitChange(e.target.value)}
            className={cn(INPUT_CLASS, errors.unitId && 'border-red-400')}
            disabled={!form.propertyId}
          >
            <option value="">
              {form.propertyId ? 'Select unit' : 'Select a property first'}
            </option>
            {availableUnits.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} — {formatCurrency(u.monthlyRent)}/mo
              </option>
            ))}
          </select>
        </FormField>

        {/* Tenant */}
        <FormField label="Tenant" required error={errors.tenantId}>
          <select
            value={form.tenantId}
            onChange={(e) => updateField('tenantId', e.target.value)}
            className={cn(INPUT_CLASS, errors.tenantId && 'border-red-400')}
          >
            <option value="">Select tenant</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.firstName} {t.lastName}
              </option>
            ))}
          </select>
        </FormField>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Start Date" required error={errors.startDate}>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => updateField('startDate', e.target.value)}
              className={cn(INPUT_CLASS, errors.startDate && 'border-red-400')}
            />
          </FormField>
          <FormField label="End Date" required error={errors.endDate}>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => updateField('endDate', e.target.value)}
              className={cn(INPUT_CLASS, errors.endDate && 'border-red-400')}
            />
          </FormField>
        </div>

        {/* Monthly Rent */}
        <FormField label="Monthly Rent (PHP)" required error={errors.monthlyRent}>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
              ₱
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.monthlyRent || ''}
              onChange={(e) => updateField('monthlyRent', parseFloat(e.target.value) || 0)}
              className={cn(INPUT_CLASS, 'pl-7', errors.monthlyRent && 'border-red-400')}
              placeholder="0.00"
            />
          </div>
        </FormField>

        {/* Security Deposit + Advance Payment */}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Security Deposit (PHP)">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                ₱
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.securityDeposit || ''}
                onChange={(e) =>
                  updateField('securityDeposit', parseFloat(e.target.value) || 0)
                }
                className={cn(INPUT_CLASS, 'pl-7')}
                placeholder="0.00"
              />
            </div>
          </FormField>
          <FormField label="Advance Payment (PHP)">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                ₱
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.advancePayment || ''}
                onChange={(e) =>
                  updateField('advancePayment', parseFloat(e.target.value) || 0)
                }
                className={cn(INPUT_CLASS, 'pl-7')}
                placeholder="0.00"
              />
            </div>
          </FormField>
        </div>

        {/* Payment Due Day */}
        <FormField label="Payment Due Day">
          <input
            type="number"
            min="1"
            max="28"
            value={form.paymentDueDay}
            onChange={(e) =>
              updateField(
                'paymentDueDay',
                Math.min(28, Math.max(1, parseInt(e.target.value) || 1))
              )
            }
            className={INPUT_CLASS}
            placeholder="1"
          />
        </FormField>

        {/* Status */}
        <FormField label="Status">
          <select
            value={form.status}
            onChange={(e) => updateField('status', e.target.value)}
            className={INPUT_CLASS}
          >
            {LEASE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </FormField>

        {/* Notes */}
        <FormField label="Notes">
          <textarea
            value={form.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            rows={3}
            className={cn(INPUT_CLASS, 'resize-none')}
            placeholder="Additional notes about this lease..."
          />
        </FormField>

        {/* Footer */}
        <ModalFooter
          onCancel={onClose}
          submitLabel={editingLease ? 'Save Changes' : 'Save'}
          submitType="submit"
        />
      </form>
    </Modal>
  );
}

/* ====================================================== DetailRow */

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 text-slate-400 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm text-slate-800 truncate">{value}</p>
      </div>
    </div>
  );
}

/* ====================================================== LeaseDetailPanel */

function LeaseDetailPanel({
  lease,
  onClose,
  onEdit,
  onDelete,
  onGenerateSOA,
}: {
  lease: Lease;
  onClose: () => void;
  onEdit: (l: Lease) => void;
  onDelete: (id: string) => void;
  onGenerateSOA: (leaseId: string) => void;
}) {
  const properties = usePropertyStore((s) => s.properties);
  const tenants = useTenantStore((s) => s.tenants);
  const incomeRecords = useIncomeStore((s) => s.records);

  const property = properties.find((p) => p.id === lease.propertyId);
  const unit = property?.units.find((u) => u.id === lease.unitId);
  const tenant = tenants.find((t) => t.id === lease.tenantId);

  const leasePayments = incomeRecords.filter((r) => r.leaseId === lease.id);
  const totalPaid = leasePayments
    .filter((r) => r.status === 'Paid')
    .reduce((sum, r) => sum + r.amount, 0);
  const pendingCount = leasePayments.filter(
    (r) => r.status === 'Pending' || r.status === 'Unpaid'
  ).length;
  const overdueCount = leasePayments.filter((r) => r.status === 'Overdue').length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-white shadow-lg overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-800">Lease Details</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Lease Status + Period Header */}
          <div className="flex items-center gap-3">
            <StatusBadge status={lease.status} />
            <span className="text-sm text-slate-500">
              {formatDate(lease.startDate)} — {formatDate(lease.endDate)}
            </span>
          </div>

          {/* Property / Unit Info */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Property & Unit
            </h4>
            <DetailRow
              icon={Building2}
              label="Property"
              value={property?.name ?? 'Unknown Property'}
            />
            <DetailRow
              icon={Building2}
              label="Unit"
              value={unit?.name ?? 'Unknown Unit'}
            />
            {unit && (
              <DetailRow
                icon={Building2}
                label="Details"
                value={`${unit.bedrooms} bed / ${unit.bathrooms} bath — ${unit.areaSqm} sqm`}
              />
            )}
          </div>

          {/* Tenant Info */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tenant
            </h4>
            {tenant ? (
              <>
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex items-center justify-center rounded-full font-medium text-white shrink-0 h-10 w-10 text-sm',
                      getAvatarColor(tenant.firstName, tenant.lastName)
                    )}
                  >
                    {getInitials(tenant.firstName, tenant.lastName)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {tenant.firstName} {tenant.lastName}
                    </p>
                    <p className="text-xs text-slate-500">{tenant.email}</p>
                  </div>
                </div>
                <DetailRow icon={Phone} label="Phone" value={tenant.phone} />
                <DetailRow icon={Mail} label="Email" value={tenant.email} />
              </>
            ) : (
              <p className="text-sm text-slate-400">Tenant not found</p>
            )}
          </div>

          {/* Financial Details */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Financial Details
            </h4>
            <DetailRow
              icon={DollarSign}
              label="Monthly Rent"
              value={formatCurrency(lease.monthlyRent)}
            />
            <DetailRow
              icon={DollarSign}
              label="Security Deposit"
              value={formatCurrency(lease.securityDeposit)}
            />
            <DetailRow
              icon={DollarSign}
              label="Advance Payment"
              value={formatCurrency(lease.advancePayment)}
            />
            <DetailRow
              icon={Calendar}
              label="Payment Due Day"
              value={`Every ${lease.paymentDueDay}${getOrdinalSuffix(lease.paymentDueDay)} of the month`}
            />
          </div>

          {/* Payment Summary */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Payment Summary
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center rounded-md bg-emerald-50 p-3">
                <p className="text-lg font-bold text-emerald-600">
                  {formatCurrency(totalPaid)}
                </p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                  Total Paid
                </p>
              </div>
              <div className="text-center rounded-md bg-amber-50 p-3">
                <p className="text-lg font-bold text-amber-600">{pendingCount}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                  Pending
                </p>
              </div>
              <div className="text-center rounded-md bg-red-50 p-3">
                <p className="text-lg font-bold text-red-600">{overdueCount}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                  Overdue
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {lease.notes && (
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Notes
              </h4>
              <p className="text-sm text-slate-700 bg-slate-50 rounded-md p-3">
                {lease.notes}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => {
                onClose();
                setTimeout(() => onGenerateSOA(lease.id), 200);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <ScrollText className="h-4 w-4" />
              Generate SOA
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  onClose();
                  setTimeout(() => onEdit(lease), 200);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-blue-600 border border-blue-200 hover:bg-blue-50 transition-colors"
              >
                <Edit2 className="h-4 w-4" />
                Edit Lease
              </button>
              <button
                onClick={() => {
                  onClose();
                  setTimeout(() => onDelete(lease.id), 200);
                }}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Small util */

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

/* ============================================================== Main Page */

export default function LeasesPage() {
  /* ---- Hydrate stores from API ---- */
  const fetchLeases = useLeaseStore((s) => s.fetchLeases);
  const fetchProperties = usePropertyStore((s) => s.fetchProperties);
  const fetchTenants = useTenantStore((s) => s.fetchTenants);
  const fetchIncome = useIncomeStore((s) => s.fetchRecords);
  useEffect(() => {
    fetchLeases();
    fetchProperties();
    fetchTenants();
    fetchIncome();
  }, [fetchLeases, fetchProperties, fetchTenants, fetchIncome]);

  /* ---- Store state ---- */
  const leases = useLeaseStore((s) => s.leases);
  const loading = useLeaseStore((s) => s.loading);
  const searchQuery = useLeaseStore((s) => s.searchQuery);
  const setSearchQuery = useLeaseStore((s) => s.setSearchQuery);
  const addLease = useLeaseStore((s) => s.addLease);
  const updateLease = useLeaseStore((s) => s.updateLease);
  const deleteLease = useLeaseStore((s) => s.deleteLease);
  const deleteMultiple = useLeaseStore((s) => s.deleteMultiple);

  const properties = usePropertyStore((s) => s.properties);
  const tenants = useTenantStore((s) => s.tenants);
  const incomeRecords = useIncomeStore((s) => s.records);

  /* ---- Penalty rate ---- */
  const [penaltyRate, setPenaltyRate] = useState(0.01);
  useEffect(() => {
    fetch('/api/settings/general')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.penaltyRatePerMonth != null) setPenaltyRate(data.penaltyRatePerMonth);
      })
      .catch(() => {});
  }, []);

  /* ---- Local state ---- */
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLease, setEditingLease] = useState<Lease | null>(null);
  const [detailLease, setDetailLease] = useState<Lease | null>(null);
  const [soaLeaseId, setSoaLeaseId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [activeFilter, setActiveFilter] = useState<LeaseFilter>('All');

  /* ---- Lookup helpers ---- */
  const getPropertyName = useCallback((propertyId: string): string => {
    return properties.find((p) => p.id === propertyId)?.name ?? 'Unknown Property';
  }, [properties]);

  const getUnitName = useCallback((propertyId: string, unitId: string): string => {
    const property = properties.find((p) => p.id === propertyId);
    return property?.units.find((u) => u.id === unitId)?.name ?? 'Unknown Unit';
  }, [properties]);

  const getTenantName = useCallback((tenantId: string): string => {
    const tenant = tenants.find((t) => t.id === tenantId);
    return tenant ? `${tenant.firstName} ${tenant.lastName}` : 'Unknown Tenant';
  }, [tenants]);

  /* ---- KPI calculations ---- */
  const kpis = useMemo(() => {
    const now = new Date();
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);

    const activeLeases = leases.filter((l) => l.status === 'Active');
    const activeCount = activeLeases.length;

    const expiringSoon = activeLeases.filter((l) => {
      const end = new Date(l.endDate);
      return end >= now && end <= in30Days;
    }).length;

    const monthlyRevenue = activeLeases.reduce((sum, l) => sum + l.monthlyRent, 0);

    const totalMonths = leases.reduce((sum, l) => {
      const months = monthsBetween(l.startDate, l.endDate);
      return sum + Math.max(months, 0);
    }, 0);
    const avgDuration = leases.length > 0 ? Math.round(totalMonths / leases.length) : 0;

    return { activeCount, expiringSoon, monthlyRevenue, avgDuration };
  }, [leases]);

  /* ---- Overdue lease info (from income records) ---- */
  const overdueLeaseInfo = useMemo(() => {
    const map = new Map<string, { overdueCount: number; overdueAmount: number; penaltyAmount: number }>();
    incomeRecords.forEach((r) => {
      if (r.status === 'Overdue' && r.leaseId) {
        const existing = map.get(r.leaseId) || { overdueCount: 0, overdueAmount: 0, penaltyAmount: 0 };
        existing.overdueCount++;
        existing.overdueAmount += r.amount;
        if (r.category === 'Rent') {
          existing.penaltyAmount += calculatePenalty(r.amount, r.dueDate, penaltyRate).penaltyAmount;
        }
        map.set(r.leaseId, existing);
      }
    });
    return map;
  }, [incomeRecords, penaltyRate]);

  /* ---- Filtered / searched leases ---- */
  const filteredLeases = useMemo(() => {
    let result = leases;

    // Apply status filter
    if (activeFilter === 'Expiring Soon') {
      const now = new Date();
      const in30Days = new Date();
      in30Days.setDate(in30Days.getDate() + 30);
      result = result.filter((l) => {
        if (l.status !== 'Active') return false;
        const end = new Date(l.endDate);
        return end >= now && end <= in30Days;
      });
    } else if (activeFilter === 'Overdue') {
      result = result.filter((l) => overdueLeaseInfo.has(l.id));
    } else if (activeFilter !== 'All') {
      result = result.filter((l) => l.status === activeFilter);
    }

    // Apply search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((l) => {
        const propName = getPropertyName(l.propertyId).toLowerCase();
        const unitName = getUnitName(l.propertyId, l.unitId).toLowerCase();
        const tenantName = getTenantName(l.tenantId).toLowerCase();
        return (
          propName.includes(q) ||
          unitName.includes(q) ||
          tenantName.includes(q)
        );
      });
    }

    return result;
  }, [leases, activeFilter, searchQuery, getPropertyName, getUnitName, getTenantName, overdueLeaseInfo]);

  /* ---- Filter counts ---- */
  const filterCounts = useMemo(() => {
    const now = new Date();
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);

    const counts: Record<LeaseFilter, number> = {
      All: leases.length,
      Active: 0,
      Pending: 0,
      'Expiring Soon': 0,
      Overdue: 0,
      Expired: 0,
      Terminated: 0,
    };
    leases.forEach((l) => {
      if (l.status in counts) counts[l.status as LeaseStatus]++;
      // Count expiring soon (Active leases ending within 30 days)
      if (l.status === 'Active') {
        const end = new Date(l.endDate);
        if (end >= now && end <= in30Days) counts['Expiring Soon']++;
      }
      // Count overdue (leases with overdue income records)
      if (overdueLeaseInfo.has(l.id)) counts['Overdue']++;
    });
    return counts;
  }, [leases, overdueLeaseInfo]);

  /* ---- Pagination ---- */
  const totalPages = Math.max(1, Math.ceil(filteredLeases.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedLeases = filteredLeases.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  const { selectedIds, toggleOne, toggleAll, clearSelection, allSelected, someSelected } = useMultiSelect(paginatedLeases);

  /* ---- Handlers ---- */
  function handleAddClick() {
    setEditingLease(null);
    setIsFormOpen(true);
  }

  function handleEditClick(lease: Lease) {
    setEditingLease(lease);
    setIsFormOpen(true);
  }

  function handleSave(data: Omit<Lease, 'id' | 'createdAt'>) {
    if (editingLease) {
      updateLease(editingLease.id, data);
    } else {
      addLease(data);
    }
  }

  function handleDeleteRequest(id: string) {
    const lease = leases.find((l) => l.id === id);
    if (lease) {
      const propName = getPropertyName(lease.propertyId);
      const unitName = getUnitName(lease.propertyId, lease.unitId);
      setDeleteTarget({ id, name: `${propName} — ${unitName}` });
    }
  }

  function handleDeleteConfirm() {
    if (deleteTarget) {
      deleteLease(deleteTarget.id);
      setDeleteTarget(null);
    }
  }

  function handleRowClick(lease: Lease) {
    setDetailLease(lease);
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
        <TabsSkeleton />
        <div className="mb-4">
          <SearchBarSkeleton />
        </div>
        <TableSkeleton rows={5} cols={7} />
      </div>
    );
  }

  /* ---- Empty state (no leases at all) ---- */
  if (leases.length === 0) {
    return (
      <div className="space-y-0">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[28px] font-bold text-slate-900">Leases</h1>
          <button
            onClick={handleAddClick}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md h-10 px-5 text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Lease
          </button>
        </div>

        <EmptyState
          icon={FileText}
          title="No leases yet"
          description="Get started by creating your first lease agreement."
          actionLabel="New Lease"
          onAction={handleAddClick}
        />

        <LeaseFormModal
          isOpen={isFormOpen}
          editingLease={editingLease}
          onClose={() => {
            setIsFormOpen(false);
            setEditingLease(null);
          }}
          onSave={handleSave}
        />
      </div>
    );
  }

  /* ---- Render ---- */
  return (
    <div className="space-y-0">
      {/* ---- Page Header ---- */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[28px] font-bold text-slate-900">Leases</h1>
        <button
          onClick={handleAddClick}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md h-10 px-5 text-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Lease
        </button>
      </div>

      {/* ---- KPI Row ---- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          title="Active Leases"
          value={String(kpis.activeCount)}
          change={0}
          icon={FileText}
          trend="neutral"
          color="blue"
          onClick={() => { setActiveFilter('Active'); setCurrentPage(1); }}
        />
        <KpiCard
          title="Expiring Soon"
          value={String(kpis.expiringSoon)}
          change={0}
          icon={Clock}
          trend="neutral"
          color="amber"
          onClick={() => { setActiveFilter('Expiring Soon'); setCurrentPage(1); }}
        />
        <KpiCard
          title="Monthly Revenue"
          value={formatCurrency(kpis.monthlyRevenue)}
          change={0}
          icon={DollarSign}
          trend="neutral"
          color="emerald"
        />
        <KpiCard
          title="Overdue"
          value={String(overdueLeaseInfo.size)}
          change={0}
          icon={AlertTriangle}
          trend="neutral"
          color="red"
          onClick={() => { setActiveFilter('Overdue'); setCurrentPage(1); }}
        />
      </div>

      {/* ---- Filter Tabs (underline style) ---- */}
      <div className="border-b border-slate-200 mb-4">
        <nav className="-mb-px flex gap-1" aria-label="Lease filter">
          {LEASE_FILTERS.map((filter) => {
            const isActive = activeFilter === filter;
            const count = filterCounts[filter];
            return (
              <button
                key={filter}
                onClick={() => {
                  setActiveFilter(filter);
                  setCurrentPage(1);
                }}
                className={cn(
                  'relative flex items-center gap-2 whitespace-nowrap pb-3 px-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {filter}
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

      {/* ---- Search Bar ---- */}
      <div className="mb-4">
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by tenant, property..."
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
      </div>

      {/* ---- Table ---- */}
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
              <Th>Unit</Th>
              <Th>Tenant</Th>
              <Th align="right">Monthly Rent</Th>
              <Th>Period</Th>
              <Th>Progress</Th>
              <Th>Status</Th>
              {activeFilter === 'Overdue' && (
                <>
                  <Th align="right">Overdue Amt</Th>
                  <Th align="right">Penalty</Th>
                </>
              )}
              <Th align="right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {paginatedLeases.map((lease) => {
              const now = new Date();
              const start = new Date(lease.startDate);
              const end = new Date(lease.endDate);
              const totalDays = daysBetween(lease.startDate, lease.endDate);
              const daysElapsed = daysBetween(
                lease.startDate,
                now.toISOString().split('T')[0]
              );
              const progress =
                totalDays > 0
                  ? Math.max(0, Math.min(100, Math.round((daysElapsed / totalDays) * 100)))
                  : 0;
              const daysLeft = Math.max(
                0,
                daysBetween(now.toISOString().split('T')[0], lease.endDate)
              );
              const monthsLeft = Math.max(0, Math.round(daysLeft / 30));

              let progressColor = 'bg-emerald-500';
              if (progress > 95) progressColor = 'bg-red-500';
              else if (progress >= 80) progressColor = 'bg-amber-500';

              return (
                <tr
                  key={lease.id}
                  onClick={() => handleRowClick(lease)}
                  className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <Td className="w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(lease.id)}
                      onChange={() => toggleOne(lease.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </Td>
                  <Td>
                    <span className="font-medium text-slate-800">
                      {getPropertyName(lease.propertyId)}
                    </span>
                  </Td>
                  <Td>
                    <span className="text-slate-600">
                      {getUnitName(lease.propertyId, lease.unitId)}
                    </span>
                  </Td>
                  <Td>
                    <span className="text-slate-700">
                      {getTenantName(lease.tenantId)}
                    </span>
                  </Td>
                  <Td>
                    <span className="text-slate-800 font-medium text-right block">
                      {formatCurrency(lease.monthlyRent)}
                    </span>
                  </Td>
                  <Td>
                    <span className="text-slate-600 text-xs whitespace-nowrap">
                      {formatDate(lease.startDate)} — {formatDate(lease.endDate)}
                    </span>
                  </Td>
                  <Td>
                    <div className="min-w-[100px]">
                      <div className="h-1.5 w-full rounded-full bg-slate-200">
                        <div
                          className={cn('h-1.5 rounded-full transition-all', progressColor)}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {lease.status === 'Active'
                          ? `${monthsLeft} month${monthsLeft !== 1 ? 's' : ''} left`
                          : lease.status === 'Expired'
                            ? 'Ended'
                            : lease.status === 'Terminated'
                              ? 'Terminated'
                              : 'Not started'}
                      </p>
                    </div>
                  </Td>
                  <Td>
                    <StatusBadge status={lease.status} />
                  </Td>
                  {activeFilter === 'Overdue' && (() => {
                    const info = overdueLeaseInfo.get(lease.id);
                    return (
                      <>
                        <Td align="right">
                          <span className="text-red-600 font-medium">
                            {info ? formatCurrency(info.overdueAmount) : '—'}
                          </span>
                          {info && (
                            <p className="text-[11px] text-slate-400">{info.overdueCount} payment{info.overdueCount !== 1 ? 's' : ''}</p>
                          )}
                        </Td>
                        <Td align="right">
                          <span className="text-amber-600 font-medium">
                            {info && info.penaltyAmount > 0 ? formatCurrency(info.penaltyAmount) : '—'}
                          </span>
                        </Td>
                      </>
                    );
                  })()}
                  <Td>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSoaLeaseId(lease.id);
                        }}
                        className="p-1.5 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                        aria-label="Generate SOA"
                        title="Generate SOA"
                      >
                        <ScrollText className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(lease);
                        }}
                        className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        aria-label="Edit lease"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRequest(lease.id);
                        }}
                        className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        aria-label="Delete lease"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {paginatedLeases.length === 0 && (
          <div className="py-16 text-center">
            <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No leases found</p>
            <p className="text-sm text-slate-400 mt-1">
              {searchQuery
                ? 'Try adjusting your search query'
                : 'No leases match the current filter'}
            </p>
          </div>
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
        entityLabel="lease"
      />

      {/* ---- Pagination ---- */}
      {filteredLeases.length > 0 && (
        <div className="mt-3">
          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            totalItems={filteredLeases.length}
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
      <LeaseFormModal
        isOpen={isFormOpen}
        editingLease={editingLease}
        onClose={() => {
          setIsFormOpen(false);
          setEditingLease(null);
        }}
        onSave={handleSave}
      />

      {/* ---- Detail Panel ---- */}
      {detailLease && (
        <LeaseDetailPanel
          lease={detailLease}
          onClose={() => setDetailLease(null)}
          onEdit={(l) => {
            setDetailLease(null);
            handleEditClick(l);
          }}
          onDelete={(id) => {
            setDetailLease(null);
            handleDeleteRequest(id);
          }}
          onGenerateSOA={(id) => {
            setDetailLease(null);
            setSoaLeaseId(id);
          }}
        />
      )}

      {/* ---- SOA Modal ---- */}
      {soaLeaseId && (
        <SOAModal
          isOpen={!!soaLeaseId}
          onClose={() => setSoaLeaseId(null)}
          leaseId={soaLeaseId}
        />
      )}

      {/* ---- Delete Confirmation ---- */}
      {deleteTarget && (
        <DeleteConfirmDialog
          itemLabel={deleteTarget.name}
          title="Delete Lease"
          confirmLabel="Delete Lease"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
