'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  Briefcase,
  Building2,
  Edit2,
  Trash2,
  X,
  User,
  FileText,
  Calendar,
} from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';
import { Modal } from '@/components/ui/Modal';
import { ModalFooter } from '@/components/ui/ModalFooter';
import { FormField } from '@/components/ui/FormField';
import { Th } from '@/components/ui/Th';
import { Td } from '@/components/ui/Td';
import { TableWrapper } from '@/components/ui/TableWrapper';
import { BulkActionBar } from '@/components/ui/BulkActionBar';
import { DeleteConfirmDialog } from '@/components/organization/DeleteConfirmDialog';
import { PageHeaderSkeleton, TabsSkeleton, SearchBarSkeleton, TableSkeleton } from '@/components/ui/Skeleton';
import { useTenantStore } from '@/stores/tenantStore';
import { useLeaseStore } from '@/stores/leaseStore';
import { usePropertyStore } from '@/stores/propertyStore';
import { useIncomeStore } from '@/stores/incomeStore';
import { useMultiSelect } from '@/hooks/useMultiSelect';
import { formatDate, cn, getInitials, formatCurrency, INPUT_CLASS } from '@/lib/utils';
import type { Tenant } from '@/lib/types';

/* ------------------------------------------------------------------ Constants */

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

const ID_TYPES = [
  'Philippine ID',
  'Drivers License',
  'Passport',
  'SSS ID',
  'TIN ID',
  'Company ID',
] as const;

type TenantFilter = 'All' | 'Current' | 'Past Tenants' | 'Prospective';

const TENANT_FILTERS: TenantFilter[] = ['All', 'Current', 'Past Tenants', 'Prospective'];

/* ------------------------------------------------------------------ Helpers */

function getAvatarColor(firstName: string, lastName: string): string {
  const hash = (firstName.charCodeAt(0) || 0) + (lastName.charCodeAt(0) || 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

const EMPTY_FORM: Omit<Tenant, 'id' | 'createdAt'> = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  emergencyContact: '',
  emergencyPhone: '',
  idType: 'Philippine ID',
  idNumber: '',
  occupation: '',
  employer: '',
  avatar: '',
  notes: '',
  dateOfBirth: '',
  tenantType: 'Person',
};

function getTenantStatus(
  tenantId: string,
  activeLeaseIds: Set<string>,
  pastLeaseIds: Set<string>
): 'Current' | 'Past Tenants' | 'Prospective' {
  if (activeLeaseIds.has(tenantId)) return 'Current';
  if (pastLeaseIds.has(tenantId)) return 'Past Tenants';
  return 'Prospective';
}

function getStatusBadgeClasses(status: 'Current' | 'Past Tenants' | 'Prospective'): string {
  switch (status) {
    case 'Current':
      return 'border-emerald-500 text-emerald-600';
    case 'Past Tenants':
      return 'border-slate-400 text-slate-600';
    case 'Prospective':
      return 'border-amber-500 text-amber-600';
  }
}

function getStatusLabel(status: 'Current' | 'Past Tenants' | 'Prospective'): string {
  switch (status) {
    case 'Current':
      return 'CURRENT';
    case 'Past Tenants':
      return 'PAST';
    case 'Prospective':
      return 'PROSPECT';
  }
}

/* ============================================================= TenantAvatar */

function TenantAvatar({
  tenant,
  size = 'md',
}: {
  tenant: Tenant;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-16 w-16 text-xl',
  };

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full font-medium text-white shrink-0',
        getAvatarColor(tenant.firstName, tenant.lastName),
        sizeClasses[size]
      )}
    >
      {getInitials(tenant.firstName, tenant.lastName)}
    </div>
  );
}

/* ======================================================= Add/Edit Modal */

function TenantFormModal({
  isOpen,
  editingTenant,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  editingTenant: Tenant | null;
  onClose: () => void;
  onSave: (data: Omit<Tenant, 'id' | 'createdAt'>) => void;
}) {
  const [form, setForm] = useState<Omit<Tenant, 'id' | 'createdAt'>>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formKey = isOpen ? (editingTenant?.id ?? 'new') : 'closed';
  const [prevFormKey, setPrevFormKey] = useState(formKey);

  if (formKey !== prevFormKey) {
    setPrevFormKey(formKey);
    if (isOpen) {
      if (editingTenant) {
        const { id: _id, createdAt: _ca, ...rest } = editingTenant;
        setForm(rest);
      } else {
        setForm(EMPTY_FORM);
      }
      setErrors({});
    }
  }

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  const isCompany = form.tenantType === 'Company';

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (isCompany) {
      if (!form.firstName.trim()) newErrors.firstName = 'Company name is required';
    } else {
      if (!form.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!form.lastName.trim()) newErrors.lastName = 'Last name is required';
    }
    if (!form.email.trim()) newErrors.email = 'Email is required';
    if (!form.phone.trim()) newErrors.phone = 'Phone is required';
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
    <Modal isOpen={isOpen} onClose={onClose} title={editingTenant ? 'Edit Tenant' : 'Add new tenant'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tenant type toggle */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Tenant type</label>
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-full w-fit">
            {(['Company', 'Person'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => updateField('tenantType', type)}
                className={cn(
                  'px-4 py-1.5 text-sm font-medium rounded-full transition-colors inline-flex items-center gap-2',
                  form.tenantType === type
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                <span className={cn('w-3.5 h-3.5 rounded-full border-2', form.tenantType === type ? 'border-white bg-white/30' : 'border-slate-400')} />
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Name fields — conditional on type */}
        {isCompany ? (
          <FormField label="Company name" required error={errors.firstName}>
            <input
              type="text"
              value={form.firstName}
              onChange={(e) => updateField('firstName', e.target.value)}
              placeholder="e.g. ABC Corp"
              className={cn(INPUT_CLASS, errors.firstName && 'border-red-400')}
            />
          </FormField>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <FormField label="First name" required error={errors.firstName}>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => updateField('firstName', e.target.value)}
                placeholder="e.g. Maria"
                className={cn(INPUT_CLASS, errors.firstName && 'border-red-400')}
              />
            </FormField>
            <FormField label="Last name" required error={errors.lastName}>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => updateField('lastName', e.target.value)}
                placeholder="e.g. Santos"
                className={cn(INPUT_CLASS, errors.lastName && 'border-red-400')}
              />
            </FormField>
          </div>
        )}

        {/* Email address */}
        <FormField label="Email address" required error={errors.email}>
          <input
            type="email"
            value={form.email}
            onChange={(e) => updateField('email', e.target.value)}
            placeholder="email@example.com"
            className={cn(INPUT_CLASS, errors.email && 'border-red-400')}
          />
        </FormField>

        {/* Phone */}
        <FormField label="Phone number" required error={errors.phone}>
          <input
            type="text"
            value={form.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            placeholder="+63 917 123 4567"
            className={cn(INPUT_CLASS, errors.phone && 'border-red-400')}
          />
        </FormField>

        {/* Person-only: Date of birth, ID, Occupation */}
        {!isCompany && (
          <>
            <FormField label="Date of birth">
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => updateField('dateOfBirth', e.target.value)}
                className={INPUT_CLASS}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="ID type">
                <select
                  value={form.idType}
                  onChange={(e) => updateField('idType', e.target.value)}
                  className={INPUT_CLASS}
                >
                  {ID_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="ID number">
                <input
                  type="text"
                  value={form.idNumber}
                  onChange={(e) => updateField('idNumber', e.target.value)}
                  placeholder="e.g. 1234-5678-9012"
                  className={INPUT_CLASS}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Occupation">
                <input
                  type="text"
                  value={form.occupation}
                  onChange={(e) => updateField('occupation', e.target.value)}
                  placeholder="e.g. Software Engineer"
                  className={INPUT_CLASS}
                />
              </FormField>
              <FormField label="Employer">
                <input
                  type="text"
                  value={form.employer}
                  onChange={(e) => updateField('employer', e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className={INPUT_CLASS}
                />
              </FormField>
            </div>
          </>
        )}

        {/* Emergency Contact */}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Emergency contact">
            <input
              type="text"
              value={form.emergencyContact}
              onChange={(e) => updateField('emergencyContact', e.target.value)}
              placeholder="e.g. Juan Santos"
              className={INPUT_CLASS}
            />
          </FormField>
          <FormField label="Emergency phone">
            <input
              type="text"
              value={form.emergencyPhone}
              onChange={(e) => updateField('emergencyPhone', e.target.value)}
              placeholder="+63 918 765 4321"
              className={INPUT_CLASS}
            />
          </FormField>
        </div>

        {/* Notes */}
        <FormField label="Notes">
          <textarea
            value={form.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            rows={3}
            className={cn(INPUT_CLASS, 'resize-none')}
            placeholder="Additional notes about this tenant..."
          />
        </FormField>

        {/* Footer */}
        <ModalFooter
          onCancel={onClose}
          submitLabel={editingTenant ? 'Save Changes' : 'Save'}
          submitType="submit"
        />
      </form>
    </Modal>
  );
}

/* ====================================================== Detail Panel */

function TenantDetailPanel({
  tenant,
  onClose,
  onEdit,
  onDelete,
}: {
  tenant: Tenant;
  onClose: () => void;
  onEdit: (t: Tenant) => void;
  onDelete: (id: string) => void;
}) {
  const leases = useLeaseStore((s) => s.leases);
  const properties = usePropertyStore((s) => s.properties);
  const incomeRecords = useIncomeStore((s) => s.records);

  const tenantLeases = leases.filter(
    (l) => l.tenantId === tenant.id && l.status === 'Active'
  );

  const tenantPayments = incomeRecords.filter((r) => r.tenantId === tenant.id);

  const totalPaid = tenantPayments
    .filter((r) => r.status === 'Paid')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalPending = tenantPayments
    .filter((r) => r.status === 'Pending' || r.status === 'Unpaid')
    .reduce((sum, r) => sum + r.amount, 0);

  function getPropertyName(propertyId: string): string {
    return properties.find((p) => p.id === propertyId)?.name ?? 'Unknown Property';
  }

  function getUnitName(propertyId: string, unitId: string): string {
    const property = properties.find((p) => p.id === propertyId);
    return property?.units.find((u) => u.id === unitId)?.name ?? 'Unknown Unit';
  }

  function handleDelete() {
    if (
      window.confirm(
        `Are you sure you want to delete ${tenant.firstName} ${tenant.lastName}? This action cannot be undone.`
      )
    ) {
      onDelete(tenant.id);
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-white shadow-lg overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-800">Tenant Details</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Profile Header */}
          <div className="flex items-center gap-4">
            <TenantAvatar tenant={tenant} size="lg" />
            <div>
              <h3 className="text-xl font-bold text-slate-800">
                {tenant.firstName} {tenant.lastName}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {tenant.tenantType}
                </span>
                <span className="text-sm text-slate-500">
                  Since {formatDate(tenant.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Contact Information
            </h4>
            <DetailRow icon={Mail} label="Email" value={tenant.email} />
            <DetailRow icon={Phone} label="Phone" value={tenant.phone} />
            {tenant.emergencyContact && (
              <DetailRow
                icon={User}
                label="Emergency Contact"
                value={`${tenant.emergencyContact} (${tenant.emergencyPhone})`}
              />
            )}
          </div>

          {/* Personal Details */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Personal Details
            </h4>
            {tenant.dateOfBirth && (
              <DetailRow icon={Calendar} label="Date of Birth" value={formatDate(tenant.dateOfBirth)} />
            )}
            {(tenant.idType || tenant.idNumber) && (
              <DetailRow
                icon={FileText}
                label="ID"
                value={`${tenant.idType} - ${tenant.idNumber}`}
              />
            )}
            <DetailRow icon={Briefcase} label="Occupation" value={tenant.occupation || '-'} />
            <DetailRow icon={Building2} label="Employer" value={tenant.employer || '-'} />
            {tenant.notes && (
              <div className="pt-2">
                <p className="text-xs font-medium text-slate-500 mb-1">Notes</p>
                <p className="text-sm text-slate-700 bg-slate-50 rounded-md p-3">
                  {tenant.notes}
                </p>
              </div>
            )}
          </div>

          {/* Active Leases */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Leases ({tenantLeases.length})
            </h4>
            {tenantLeases.length > 0 ? (
              <div className="space-y-3">
                {tenantLeases.map((lease) => (
                  <div
                    key={lease.id}
                    className="rounded-md border border-slate-100 bg-slate-50 p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-blue-500" />
                        <span className="font-medium text-sm text-slate-800">
                          {getPropertyName(lease.propertyId)}
                        </span>
                      </div>
                      <span className="border border-emerald-400 text-emerald-600 rounded-full px-3 py-0.5 text-xs font-medium">
                        Active
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                      <div>
                        <span className="text-slate-400">Unit: </span>
                        {getUnitName(lease.propertyId, lease.unitId)}
                      </div>
                      <div>
                        <span className="text-slate-400">Rent: </span>
                        {formatCurrency(lease.monthlyRent)}
                      </div>
                      <div>
                        <span className="text-slate-400">Start: </span>
                        {formatDate(lease.startDate)}
                      </div>
                      <div>
                        <span className="text-slate-400">End: </span>
                        {formatDate(lease.endDate)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 py-2">No active leases for this tenant.</p>
            )}
          </div>

          {/* Payment Summary */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Payment Summary
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center rounded-md bg-slate-50 p-3">
                <p className="text-lg font-bold text-slate-800">{tenantPayments.length}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                  Total Records
                </p>
              </div>
              <div className="text-center rounded-md bg-emerald-50 p-3">
                <p className="text-lg font-bold text-emerald-600">{formatCurrency(totalPaid)}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Total Paid</p>
              </div>
              <div className="text-center rounded-md bg-amber-50 p-3">
                <p className="text-lg font-bold text-amber-600">
                  {formatCurrency(totalPending)}
                </p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Pending</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => {
                onClose();
                setTimeout(() => onEdit(tenant), 200);
              }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-blue-600 border border-blue-200 hover:bg-blue-50 transition-colors"
            >
              <Edit2 className="h-4 w-4" />
              Edit Tenant
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ DetailRow */

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

/* ============================================================== Main Page */

export default function TenantsPage() {
  /* ---- Hydrate stores from API ---- */
  const fetchTenants = useTenantStore((s) => s.fetchTenants);
  const fetchLeases = useLeaseStore((s) => s.fetchLeases);
  const fetchProperties = usePropertyStore((s) => s.fetchProperties);
  const fetchIncome = useIncomeStore((s) => s.fetchRecords);
  useEffect(() => {
    fetchTenants();
    fetchLeases();
    fetchProperties();
    fetchIncome();
  }, [fetchTenants, fetchLeases, fetchProperties, fetchIncome]);

  /* ---- Store state ---- */
  const tenants = useTenantStore((s) => s.tenants);
  const loading = useTenantStore((s) => s.loading);
  const searchQuery = useTenantStore((s) => s.searchQuery);
  const setSearchQuery = useTenantStore((s) => s.setSearchQuery);
  const addTenant = useTenantStore((s) => s.addTenant);
  const updateTenant = useTenantStore((s) => s.updateTenant);
  const deleteTenant = useTenantStore((s) => s.deleteTenant);
  const deleteMultiple = useTenantStore((s) => s.deleteMultiple);

  const leases = useLeaseStore((s) => s.leases);

  /* ---- Local state ---- */
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [detailTenant, setDetailTenant] = useState<Tenant | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [activeFilter, setActiveFilter] = useState<TenantFilter>('All');

  /* ---- Derived data ---- */
  const activeLeaseIds = useMemo(() => {
    return new Set(leases.filter((l) => l.status === 'Active').map((l) => l.tenantId));
  }, [leases]);

  const pastLeaseIds = useMemo(() => {
    return new Set(
      leases
        .filter((l) => l.status === 'Expired' || l.status === 'Terminated')
        .map((l) => l.tenantId)
    );
  }, [leases]);

  const filteredTenants = useMemo(() => {
    let result = tenants;

    // Apply status filter
    if (activeFilter !== 'All') {
      result = result.filter((t) => {
        const status = getTenantStatus(t.id, activeLeaseIds, pastLeaseIds);
        return status === activeFilter;
      });
    }

    // Apply search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.firstName.toLowerCase().includes(q) ||
          t.lastName.toLowerCase().includes(q) ||
          t.email.toLowerCase().includes(q) ||
          t.phone.includes(q) ||
          t.occupation.toLowerCase().includes(q) ||
          t.employer.toLowerCase().includes(q)
      );
    }

    return result;
  }, [tenants, searchQuery, activeFilter, activeLeaseIds, pastLeaseIds]);

  // Filter counts
  const filterCounts = useMemo(() => {
    const counts: Record<TenantFilter, number> = {
      All: tenants.length,
      Current: 0,
      'Past Tenants': 0,
      Prospective: 0,
    };
    tenants.forEach((t) => {
      const status = getTenantStatus(t.id, activeLeaseIds, pastLeaseIds);
      counts[status]++;
    });
    return counts;
  }, [tenants, activeLeaseIds, pastLeaseIds]);

  const totalPages = Math.max(1, Math.ceil(filteredTenants.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedTenants = filteredTenants.slice((safePage - 1) * pageSize, safePage * pageSize);

  const { selectedIds, toggleOne, toggleAll, clearSelection, allSelected, someSelected } = useMultiSelect(paginatedTenants);

  /* ---- Handlers ---- */
  function handleAddClick() {
    setEditingTenant(null);
    setIsFormOpen(true);
  }

  function handleEditClick(tenant: Tenant) {
    setEditingTenant(tenant);
    setIsFormOpen(true);
  }

  function handleSave(data: Omit<Tenant, 'id' | 'createdAt'>) {
    if (editingTenant) {
      updateTenant(editingTenant.id, data);
    } else {
      addTenant(data);
    }
  }

  function handleDeleteRequest(id: string) {
    const tenant = tenants.find((t) => t.id === id);
    if (tenant) {
      setDeleteTarget({ id, name: `${tenant.firstName} ${tenant.lastName}` });
    }
  }

  function handleDeleteConfirm() {
    if (deleteTarget) {
      deleteTenant(deleteTarget.id);
      setDeleteTarget(null);
    }
  }

  function handleRowClick(tenant: Tenant) {
    setDetailTenant(tenant);
  }

  /* ---- Render ---- */

  if (loading) {
    return (
      <div className="space-y-0">
        <PageHeaderSkeleton />
        <TabsSkeleton count={4} />
        <SearchBarSkeleton />
        <div className="mt-4">
          <TableSkeleton rows={6} cols={5} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* ---- Page Header ---- */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[28px] font-bold text-slate-900">Tenants</h1>
        <button
          onClick={handleAddClick}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md h-10 px-5 text-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          New tenant
        </button>
      </div>

      {/* ---- Filter Tabs (underline style) ---- */}
      <div className="border-b border-slate-200 mb-4">
        <nav className="-mb-px flex gap-1" aria-label="Tenant filter">
          {TENANT_FILTERS.map((filter) => {
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
            placeholder="Search by name, phone, email"
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
              <Th>Name</Th>
              <Th className="hidden sm:table-cell">Email</Th>
              <Th className="hidden md:table-cell">Mobile</Th>
              <Th>Status</Th>
              <Th align="right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {paginatedTenants.map((tenant) => {
              const status = getTenantStatus(tenant.id, activeLeaseIds, pastLeaseIds);
              return (
                <tr
                  key={tenant.id}
                  onClick={() => handleRowClick(tenant)}
                  className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <Td className="w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(tenant.id)}
                      onChange={() => toggleOne(tenant.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </Td>
                  <Td>
                    <div className="flex items-center gap-3">
                      <TenantAvatar tenant={tenant} size="md" />
                      <span className="font-bold text-slate-800">
                        {tenant.firstName} {tenant.lastName}
                      </span>
                    </div>
                  </Td>
                  <Td className="text-slate-600 hidden sm:table-cell">
                    {tenant.email}
                  </Td>
                  <Td className="text-slate-600 hidden md:table-cell">
                    {tenant.phone}
                  </Td>
                  <Td>
                    <span
                      className={cn(
                        'border rounded-md px-2.5 py-0.5 text-xs font-semibold bg-transparent uppercase',
                        getStatusBadgeClasses(status)
                      )}
                    >
                      {getStatusLabel(status)}
                    </span>
                  </Td>
                  <Td>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(tenant);
                        }}
                        className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        aria-label="Edit tenant"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRequest(tenant.id);
                        }}
                        className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        aria-label="Delete tenant"
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

        {paginatedTenants.length === 0 && (
          <div className="py-16 text-center">
            <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No tenants found</p>
            <p className="text-sm text-slate-400 mt-1">
              {searchQuery
                ? 'Try adjusting your search query'
                : 'Get started by adding your first tenant'}
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
        entityLabel="tenant"
      />

      {/* ---- Pagination ---- */}
      {filteredTenants.length > 0 && (
        <div className="mt-3">
          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            totalItems={filteredTenants.length}
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
      <TenantFormModal
        isOpen={isFormOpen}
        editingTenant={editingTenant}
        onClose={() => {
          setIsFormOpen(false);
          setEditingTenant(null);
        }}
        onSave={handleSave}
      />

      {/* ---- Detail Panel ---- */}
      {detailTenant && (
        <TenantDetailPanel
          tenant={detailTenant}
          onClose={() => setDetailTenant(null)}
          onEdit={(t) => {
            setDetailTenant(null);
            handleEditClick(t);
          }}
          onDelete={(id) => {
            setDetailTenant(null);
            handleDeleteRequest(id);
          }}
        />
      )}

      {/* ---- Delete Confirmation ---- */}
      {deleteTarget && (
        <DeleteConfirmDialog
          itemLabel={deleteTarget.name}
          title="Delete Tenant"
          confirmLabel="Delete Tenant"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
