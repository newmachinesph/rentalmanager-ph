'use client';

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import {
  Plus, Search, X, Trash2, Eye, Download, ScrollText,
  FileCheck, FilePen, FileSignature, Calendar, Building2, PenLine, Save,
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
import {
  PageHeaderSkeleton, KpiCardSkeleton, TabsSkeleton, SearchBarSkeleton, TableSkeleton,
} from '@/components/ui/Skeleton';
import { DeleteConfirmDialog } from '@/components/organization/DeleteConfirmDialog';
import { useContractStore } from '@/stores/contractStore';
import { useLeaseStore } from '@/stores/leaseStore';
import { usePropertyStore } from '@/stores/propertyStore';
import { useTenantStore } from '@/stores/tenantStore';
import { formatDate, formatCurrency, cn, INPUT_CLASS } from '@/lib/utils';
import type { Contract, ContractStatus } from '@/lib/types';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

type ContractFilter = 'All' | ContractStatus;
const CONTRACT_FILTERS: ContractFilter[] = ['All', 'Draft', 'Final', 'Signed'];

interface GenerateForm {
  leaseId: string;
  /* Execution */
  contractDate: string;
  contractLocation: string;
  /* Lessor */
  lessorCompany: string;
  lessorDescription: string;
  lessorAddress: string;
  lessorRepName: string;
  lessorRepTitle: string;
  lessorTin: string;
  /* Lessee */
  lesseeName: string;
  lesseeAddress: string;
  /* Property */
  propertyName: string;
  propertyFullAddress: string;
  unitName: string;
  purpose: string;
  /* Lease terms */
  startDate: string;
  endDate: string;
  leaseTerm: string;
  monthlyRent: string;
  securityDeposit: string;
  advancePayment: string;
  paymentDueDay: string;
  penaltyRate: string;
  /* Signatories */
  witnessName1: string;
  witnessName2: string;
  notes: string;
}

const todayFormatted = () => {
  const d = new Date();
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const emptyForm: GenerateForm = {
  leaseId: '',
  contractDate: todayFormatted(),
  contractLocation: '',
  lessorCompany: '',
  lessorDescription: 'a duly organized entity existing under the laws of the Philippines',
  lessorAddress: '',
  lessorRepName: '',
  lessorRepTitle: 'Property Owner/Manager',
  lessorTin: '',
  lesseeName: '',
  lesseeAddress: '',
  propertyName: '',
  propertyFullAddress: '',
  unitName: '',
  purpose: 'Residential',
  startDate: '',
  endDate: '',
  leaseTerm: '',
  monthlyRent: '',
  securityDeposit: '',
  advancePayment: '',
  paymentDueDay: '',
  penaltyRate: '3',
  witnessName1: '',
  witnessName2: '',
  notes: '',
};

/* ================================================================== */
/*  Page                                                              */
/* ================================================================== */

export default function ContractsPage() {
  const { contracts, loading, fetchContracts, createContract, updateContract, deleteContract } = useContractStore();
  const { leases, fetchLeases } = useLeaseStore();
  const { properties, fetchProperties } = usePropertyStore();
  const { tenants, fetchTenants } = useTenantStore();

  const [activeFilter, setActiveFilter] = useState<ContractFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* Dialogs */
  const [showGenerate, setShowGenerate] = useState(false);
  const [form, setForm] = useState<GenerateForm>(emptyForm);
  const [generating, setGenerating] = useState(false);
  const [formError, setFormError] = useState('');

  const [viewContract, setViewContract] = useState<Contract | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Contract | null>(null);

  /* Edit mode */
  const [isEditing, setIsEditing] = useState(false);
  const [editingContent, setEditingContent] = useState('');
  const [saving, setSaving] = useState(false);
  const contentEditableRef = useRef<HTMLDivElement>(null);

  /* Fetch data */
  useEffect(() => {
    fetchContracts();
    fetchLeases();
    fetchProperties();
    fetchTenants();
  }, [fetchContracts, fetchLeases, fetchProperties, fetchTenants]);

  /* Pre-fill form from settings */
  useEffect(() => {
    fetch('/api/settings/general')
      .then(r => r.json())
      .then(data => {
        setForm(prev => ({
          ...prev,
          lessorCompany: data?.companyName || prev.lessorCompany,
          lessorRepName: data?.ownerName || prev.lessorRepName,
          lessorRepTitle: data?.ownerTitle || prev.lessorRepTitle,
          lessorAddress: data?.companyAddress || prev.lessorAddress,
          lessorTin: data?.companyTin || prev.lessorTin,
          lessorDescription: data?.companyDescription || prev.lessorDescription,
          penaltyRate: data?.penaltyRatePerMonth != null ? String(data.penaltyRatePerMonth) : prev.penaltyRate,
        }));
      })
      .catch(() => {});
  }, []);

  /* Build lookup maps */
  const propertyMap = useMemo(() => new Map(properties.map(p => [p.id, p])), [properties]);
  const tenantMap = useMemo(() => new Map(tenants.map(t => [t.id, t])), [tenants]);
  const unitMap = useMemo(() => {
    const m = new Map<string, string>();
    properties.forEach(p => p.units?.forEach(u => m.set(u.id, u.name)));
    return m;
  }, [properties]);

  /* Existing contract leaseIds */
  const contractLeaseIds = useMemo(() => new Set(contracts.map(c => c.leaseId)), [contracts]);

  /* Available leases for generation (active/pending without existing contract) */
  const availableLeases = useMemo(
    () => leases.filter(l => ['Active', 'Pending'].includes(l.status) && !contractLeaseIds.has(l.id)),
    [leases, contractLeaseIds],
  );

  /* Filtered + searched contracts */
  const filteredContracts = useMemo(() => {
    let result = [...contracts];
    if (activeFilter !== 'All') result = result.filter(c => c.status === activeFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => {
        const t = c.lease?.tenant;
        const p = c.lease?.property;
        const u = c.lease?.unit;
        return (
          (t && `${t.firstName} ${t.lastName}`.toLowerCase().includes(q)) ||
          (p && p.name.toLowerCase().includes(q)) ||
          (u && u.name.toLowerCase().includes(q)) ||
          c.id.toLowerCase().includes(q)
        );
      });
    }
    return result;
  }, [contracts, activeFilter, searchQuery]);

  /* Filter counts */
  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = { All: contracts.length };
    CONTRACT_FILTERS.forEach(f => { if (f !== 'All') counts[f] = contracts.filter(c => c.status === f).length; });
    return counts;
  }, [contracts]);

  /* Pagination */
  const totalPages = Math.ceil(filteredContracts.length / pageSize);
  const pagedContracts = filteredContracts.slice((page - 1) * pageSize, page * pageSize);

  /* Auto-fill form when lease changes */
  const handleLeaseChange = useCallback((leaseId: string) => {
    setForm(prev => {
      const lease = leases.find(l => l.id === leaseId);
      if (!lease) return { ...prev, leaseId };
      const prop = propertyMap.get(lease.propertyId);
      const tenant = tenantMap.get(lease.tenantId);
      const uName = unitMap.get(lease.unitId);
      const fullAddr = [prop?.address, prop?.barangay, prop?.city, prop?.province].filter(Boolean).join(', ');
      const fmtDate = (ds: string) => {
        const d = new Date(ds + 'T00:00:00');
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      };
      // Compute lease term
      const start = new Date(lease.startDate + 'T00:00:00');
      const end = new Date(lease.endDate + 'T00:00:00');
      let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      const daysDiff = end.getDate() - start.getDate();
      if (daysDiff > 0) months++;
      let termStr = '';
      const numWord = (n: number) => {
        const w = ['Zero','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve'];
        return n <= 12 ? w[n] : String(n);
      };
      if (months >= 12) {
        const years = Math.floor(months / 12);
        const rem = months % 12;
        termStr = `${numWord(years).toUpperCase()} (${years}) YEAR${years > 1 ? 'S' : ''}`;
        if (rem > 0) termStr += ` AND ${numWord(rem).toUpperCase()} (${rem}) MONTH${rem > 1 ? 'S' : ''}`;
      } else {
        termStr = `${numWord(months).toUpperCase()} (${months}) MONTH${months > 1 ? 'S' : ''}`;
      }
      return {
        ...prev,
        leaseId,
        contractLocation: prop?.city || prev.contractLocation,
        lesseeName: tenant ? `${tenant.firstName} ${tenant.lastName}` : prev.lesseeName,
        propertyName: prop?.name || prev.propertyName,
        propertyFullAddress: fullAddr || prev.propertyFullAddress,
        unitName: uName || prev.unitName,
        startDate: fmtDate(lease.startDate),
        endDate: fmtDate(lease.endDate),
        leaseTerm: termStr,
        monthlyRent: String(lease.monthlyRent),
        securityDeposit: String(lease.securityDeposit),
        advancePayment: String(lease.advancePayment ?? 0),
        paymentDueDay: String(lease.paymentDueDay),
      };
    });
  }, [leases, propertyMap, tenantMap, unitMap]);

  /* Generate contract */
  const handleGenerate = async () => {
    if (!form.leaseId) { setFormError('Please select a lease'); return; }
    setGenerating(true);
    setFormError('');
    try {
      const { leaseId, notes, ...meta } = form;
      await createContract(leaseId, { ...meta, notes });
      setShowGenerate(false);
      setForm(prev => ({
        ...emptyForm,
        lessorCompany: prev.lessorCompany,
        lessorRepName: prev.lessorRepName,
        lessorRepTitle: prev.lessorRepTitle,
        lessorAddress: prev.lessorAddress,
        lessorTin: prev.lessorTin,
        lessorDescription: prev.lessorDescription,
        penaltyRate: prev.penaltyRate,
      }));
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Failed to generate contract');
    } finally {
      setGenerating(false);
    }
  };

  /* Status change */
  const handleStatusChange = async (contract: Contract, newStatus: ContractStatus) => {
    const updates: Record<string, unknown> = { status: newStatus };
    if (newStatus === 'Signed') updates.signedDate = new Date().toISOString().split('T')[0];
    await updateContract(contract.id, updates as { status: ContractStatus; signedDate?: string });
    if (viewContract?.id === contract.id) {
      setViewContract({ ...contract, ...updates } as Contract);
    }
  };

  /* Download DOCX */
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const handleDownloadDocx = async (contract: Contract) => {
    setDownloadingId(contract.id);
    try {
      const res = await fetch(`/api/contracts/${contract.id}/docx`);
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const tenant = contract.lease?.tenant;
      const tenantName = tenant ? `${tenant.firstName}-${tenant.lastName}` : 'contract';
      a.download = `Contract-${tenantName}-${contract.status}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('DOCX download failed:', e);
    } finally {
      setDownloadingId(null);
    }
  };

  /* Edit mode handlers */
  const handleStartEdit = () => {
    if (!viewContract) return;
    setEditingContent(viewContract.content);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingContent('');
  };

  const handleSaveContent = async () => {
    if (!viewContract || !contentEditableRef.current) return;
    setSaving(true);
    try {
      const newContent = contentEditableRef.current.innerHTML;
      await updateContract(viewContract.id, { content: newContent });
      setViewContract({ ...viewContract, content: newContent });
      setIsEditing(false);
      setEditingContent('');
    } catch (e) {
      console.error('Failed to save contract content:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleCloseView = () => {
    if (isEditing) {
      if (!window.confirm('You have unsaved changes. Are you sure you want to close?')) return;
    }
    setViewContract(null);
    setIsEditing(false);
    setEditingContent('');
  };

  /* Delete */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteContract(deleteTarget.id);
    setDeleteTarget(null);
    if (viewContract?.id === deleteTarget.id) setViewContract(null);
  };

  /* ---- Loading skeleton ---- */
  if (loading && contracts.length === 0) {
    return (
      <div className="space-y-0">
        <PageHeaderSkeleton />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"><KpiCardSkeleton /><KpiCardSkeleton /><KpiCardSkeleton /><KpiCardSkeleton /></div>
        <TabsSkeleton />
        <SearchBarSkeleton />
        <TableSkeleton />
      </div>
    );
  }

  /* ---- Empty state ---- */
  if (!loading && contracts.length === 0 && leases.length > 0) {
    return (
      <div className="space-y-0">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[28px] font-bold text-slate-900">Contracts</h1>
          <button onClick={() => setShowGenerate(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            <Plus className="h-4 w-4" /> Generate Contract
          </button>
        </div>
        <EmptyState icon={ScrollText} title="No contracts yet" description="Generate a contract from an existing lease to get started." actionLabel="Generate Contract" onAction={() => setShowGenerate(true)} />
        {renderGenerateModal()}
      </div>
    );
  }

  /* ---- Main render ---- */
  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[28px] font-bold text-slate-900">Contracts</h1>
        <button onClick={() => setShowGenerate(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4" /> Generate Contract
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard title="Total Contracts" value={String(contracts.length)} change={0} icon={ScrollText} trend="neutral" color="blue" onClick={() => { setActiveFilter('All'); setPage(1); }} />
        <KpiCard title="Draft" value={String(filterCounts['Draft'] || 0)} change={0} icon={FilePen} trend="neutral" color="amber" onClick={() => { setActiveFilter('Draft'); setPage(1); }} />
        <KpiCard title="Finalized" value={String(filterCounts['Final'] || 0)} change={0} icon={FileCheck} trend="neutral" color="emerald" onClick={() => { setActiveFilter('Final'); setPage(1); }} />
        <KpiCard title="Signed" value={String(filterCounts['Signed'] || 0)} change={0} icon={FileSignature} trend="neutral" color="purple" onClick={() => { setActiveFilter('Signed'); setPage(1); }} />
      </div>

      {/* Filter tabs */}
      <div className="border-b border-slate-200 mb-4">
        <nav className="-mb-px flex gap-1">
          {CONTRACT_FILTERS.map(f => (
            <button key={f} onClick={() => { setActiveFilter(f); setPage(1); }}
              className={cn('px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors',
                activeFilter === f ? 'border-b-2 border-blue-500 text-blue-600' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {f}
              <span className={cn('ml-1.5 text-xs px-1.5 py-0.5 rounded-full', activeFilter === f ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500')}>
                {filterCounts[f] || 0}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Search */}
      <div className="mb-4 relative w-full sm:w-96">
        <input type="text" placeholder="Search by tenant, property, unit..." value={searchQuery}
          onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
          className={cn(INPUT_CLASS, 'pr-8')}
        />
        {searchQuery ? (
          <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
        ) : (
          <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        )}
      </div>

      {/* Table */}
      {filteredContracts.length === 0 ? (
        <EmptyState icon={ScrollText} title="No contracts found" description="Try adjusting your filters or search query." />
      ) : (
        <TableWrapper>
          <table className="w-full text-sm">
            <thead>
              <tr>
                <Th>Tenant</Th>
                <Th>Property / Unit</Th>
                <Th>Lease Period</Th>
                <Th align="right">Monthly Rent</Th>
                <Th>Status</Th>
                <Th>Created</Th>
                <Th align="right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {pagedContracts.map(c => {
                const t = c.lease?.tenant;
                const p = c.lease?.property;
                const u = c.lease?.unit;
                return (
                  <tr key={c.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => { setViewContract(c); setIsEditing(false); setEditingContent(''); }}>
                    <Td>{t ? `${t.firstName} ${t.lastName}` : '—'}</Td>
                    <Td>
                      <div className="font-medium text-slate-900">{p?.name || '—'}</div>
                      <div className="text-xs text-slate-500">{u?.name || '—'}</div>
                    </Td>
                    <Td>
                      <div className="text-xs">{formatDate(c.lease?.startDate || '')} — {formatDate(c.lease?.endDate || '')}</div>
                    </Td>
                    <Td align="right">{formatCurrency(c.lease?.monthlyRent || 0)}</Td>
                    <Td>
                      <StatusBadge status={c.status} />
                    </Td>
                    <Td>{formatDate(c.createdAt)}</Td>
                    <Td align="right">
                      <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setViewContract(c)} className="p-1.5 rounded hover:bg-blue-50 text-slate-400 hover:text-blue-600" title="View"><Eye className="h-4 w-4" /></button>
                        <button onClick={() => handleDownloadDocx(c)} disabled={downloadingId === c.id} className="p-1.5 rounded hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 disabled:opacity-50" title="Download DOCX"><Download className="h-4 w-4" /></button>
                        <button onClick={() => setDeleteTarget(c)} className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600" title="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableWrapper>
      )}

      {/* Pagination */}
      {filteredContracts.length > 0 && (
        <div className="mt-4">
          <Pagination currentPage={page} pageSize={pageSize} totalItems={filteredContracts.length} totalPages={totalPages} onPageChange={setPage} onPageSizeChange={(s: number) => { setPageSize(s); setPage(1); }} />
        </div>
      )}

      {/* ---- Modals ---- */}
      {renderGenerateModal()}
      {renderViewModal()}
      {deleteTarget && (
        <DeleteConfirmDialog
          itemLabel={`contract for ${deleteTarget.lease?.tenant ? `${deleteTarget.lease.tenant.firstName} ${deleteTarget.lease.tenant.lastName}` : 'this lease'}`}
          title="Delete Contract"
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );

  /* ================================================================ */
  /*  Generate modal                                                  */
  /* ================================================================ */

  function renderGenerateModal() {
    if (!showGenerate) return null;
    const f = (field: keyof GenerateForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }));
    return (
      <Modal isOpen={showGenerate} onClose={() => setShowGenerate(false)} title="Generate Contract" size="lg">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {formError && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{formError}</div>}

          <FormField label="Lease *">
            <select value={form.leaseId} onChange={e => handleLeaseChange(e.target.value)} className={INPUT_CLASS}>
              <option value="">— Select Lease —</option>
              {availableLeases.map(l => {
                const t = tenantMap.get(l.tenantId);
                const p = propertyMap.get(l.propertyId);
                const uName = unitMap.get(l.unitId);
                return (
                  <option key={l.id} value={l.id}>
                    {t ? `${t.firstName} ${t.lastName}` : 'Unknown'} — {p?.name || '?'} / {uName || '?'} ({formatDate(l.startDate)} to {formatDate(l.endDate)})
                  </option>
                );
              })}
            </select>
          </FormField>

          {/* Contract Details */}
          <div className="border-t border-slate-200 pt-4">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Contract Details</p>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Contract Date">
                <input type="text" value={form.contractDate} onChange={f('contractDate')} className={INPUT_CLASS} placeholder="e.g. March 4, 2026" />
              </FormField>
              <FormField label="Contract Location">
                <input type="text" value={form.contractLocation} onChange={f('contractLocation')} className={INPUT_CLASS} placeholder="e.g. Quezon City" />
              </FormField>
              <FormField label="Purpose">
                <select value={form.purpose} onChange={f('purpose')} className={INPUT_CLASS}>
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                </select>
              </FormField>
            </div>
          </div>

          {/* Lessor Information */}
          <div className="border-t border-slate-200 pt-4">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Lessor Information</p>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Company Name">
                <input type="text" value={form.lessorCompany} onChange={f('lessorCompany')} className={INPUT_CLASS} />
              </FormField>
              <FormField label="Representative Name">
                <input type="text" value={form.lessorRepName} onChange={f('lessorRepName')} className={INPUT_CLASS} />
              </FormField>
              <FormField label="Representative Title">
                <input type="text" value={form.lessorRepTitle} onChange={f('lessorRepTitle')} className={INPUT_CLASS} />
              </FormField>
              <FormField label="Company Address">
                <input type="text" value={form.lessorAddress} onChange={f('lessorAddress')} className={INPUT_CLASS} />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <FormField label="Company TIN">
                <input type="text" value={form.lessorTin} onChange={f('lessorTin')} className={INPUT_CLASS} placeholder="e.g. 000-000-000-000" />
              </FormField>
              <FormField label="Company Description">
                <input type="text" value={form.lessorDescription} onChange={f('lessorDescription')} className={INPUT_CLASS} placeholder="a corporation duly organized..." />
              </FormField>
            </div>
          </div>

          {/* Lessee Information */}
          <div className="border-t border-slate-200 pt-4">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Lessee Information</p>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Lessee Name">
                <input type="text" value={form.lesseeName} onChange={f('lesseeName')} className={INPUT_CLASS} placeholder="Auto-filled from lease" />
              </FormField>
              <FormField label="Lessee Address">
                <input type="text" value={form.lesseeAddress} onChange={f('lesseeAddress')} className={INPUT_CLASS} placeholder="Lessee home address" />
              </FormField>
            </div>
          </div>

          {/* Property Information */}
          <div className="border-t border-slate-200 pt-4">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Property Information</p>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Property Name">
                <input type="text" value={form.propertyName} onChange={f('propertyName')} className={INPUT_CLASS} placeholder="Auto-filled from lease" />
              </FormField>
              <FormField label="Unit Name">
                <input type="text" value={form.unitName} onChange={f('unitName')} className={INPUT_CLASS} placeholder="Auto-filled from lease" />
              </FormField>
            </div>
            <div className="mt-3">
              <FormField label="Full Property Address">
                <input type="text" value={form.propertyFullAddress} onChange={f('propertyFullAddress')} className={INPUT_CLASS} placeholder="Auto-filled from lease" />
              </FormField>
            </div>
          </div>

          {/* Lease Terms */}
          <div className="border-t border-slate-200 pt-4">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Lease Terms</p>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Start Date">
                <input type="text" value={form.startDate} onChange={f('startDate')} className={INPUT_CLASS} placeholder="Auto-filled from lease" />
              </FormField>
              <FormField label="End Date">
                <input type="text" value={form.endDate} onChange={f('endDate')} className={INPUT_CLASS} placeholder="Auto-filled from lease" />
              </FormField>
              <FormField label="Lease Term">
                <input type="text" value={form.leaseTerm} onChange={f('leaseTerm')} className={INPUT_CLASS} placeholder='e.g. ONE (1) YEAR' />
              </FormField>
              <FormField label="Payment Due Day">
                <input type="text" value={form.paymentDueDay} onChange={f('paymentDueDay')} className={INPUT_CLASS} placeholder="e.g. 5" />
              </FormField>
              <FormField label="Monthly Rent (PHP)">
                <input type="text" value={form.monthlyRent} onChange={f('monthlyRent')} className={INPUT_CLASS} placeholder="Auto-filled from lease" />
              </FormField>
              <FormField label="Security Deposit (PHP)">
                <input type="text" value={form.securityDeposit} onChange={f('securityDeposit')} className={INPUT_CLASS} placeholder="Auto-filled from lease" />
              </FormField>
              <FormField label="Advance Payment (PHP)">
                <input type="text" value={form.advancePayment} onChange={f('advancePayment')} className={INPUT_CLASS} placeholder="0 if none" />
              </FormField>
              <FormField label="Penalty Rate (% per month)">
                <input type="text" value={form.penaltyRate} onChange={f('penaltyRate')} className={INPUT_CLASS} placeholder="e.g. 3" />
              </FormField>
            </div>
          </div>

          {/* Witnesses */}
          <div className="border-t border-slate-200 pt-4">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Witnesses</p>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Witness 1 Name">
                <input type="text" value={form.witnessName1} onChange={f('witnessName1')} className={INPUT_CLASS} />
              </FormField>
              <FormField label="Witness 2 Name">
                <input type="text" value={form.witnessName2} onChange={f('witnessName2')} className={INPUT_CLASS} />
              </FormField>
            </div>
          </div>

          <FormField label="Notes">
            <textarea value={form.notes} onChange={f('notes')} className={cn(INPUT_CLASS, 'h-20 resize-none')} />
          </FormField>
        </div>

        <ModalFooter onCancel={() => setShowGenerate(false)} submitLabel={generating ? 'Generating...' : 'Generate Contract'} onSubmit={handleGenerate} />
      </Modal>
    );
  }

  /* ================================================================ */
  /*  View modal (full-screen overlay)                                */
  /* ================================================================ */

  function renderViewModal() {
    if (!viewContract) return null;
    const c = viewContract;
    return (
      <div className="fixed inset-0 z-50 flex justify-end" onClick={handleCloseView}>
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative w-full max-w-4xl bg-white shadow-xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Contract — {c.lease?.tenant ? `${c.lease.tenant.firstName} ${c.lease.tenant.lastName}` : 'Unknown'}
              </h2>
              <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> {c.lease?.property?.name} / {c.lease?.unit?.name}</span>
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {formatDate(c.createdAt)}</span>
                <StatusBadge status={c.status} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Edit / Save / Cancel — only for Draft contracts */}
              {c.status === 'Draft' && !isEditing && (
                <button onClick={handleStartEdit} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors">
                  <PenLine className="h-4 w-4" /> Edit Content
                </button>
              )}
              {isEditing && (
                <>
                  <button onClick={handleCancelEdit} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-slate-50 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">
                    <X className="h-4 w-4" /> Cancel
                  </button>
                  <button onClick={handleSaveContent} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                    <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save'}
                  </button>
                </>
              )}

              {/* Status actions — hidden during edit mode */}
              {!isEditing && c.status === 'Draft' && (
                <button onClick={() => handleStatusChange(c, 'Final')} className="px-3 py-1.5 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">Mark Final</button>
              )}
              {!isEditing && c.status === 'Final' && (
                <button onClick={() => handleStatusChange(c, 'Signed')} className="px-3 py-1.5 text-sm font-medium bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors">Mark Signed</button>
              )}
              <button onClick={() => handleDownloadDocx(c)} disabled={downloadingId === c.id} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-slate-50 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50" title="Download DOCX">
                <Download className="h-4 w-4" /> {downloadingId === c.id ? 'Downloading...' : 'Download DOCX'}
              </button>
              <button onClick={handleCloseView} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Contract content */}
          <div className="flex-1 overflow-auto bg-slate-100 p-6">
            {isEditing && (
              <div className="mb-3 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 max-w-[8.5in] mx-auto">
                <PenLine className="h-4 w-4 shrink-0" />
                <span>You are editing this contract. Click directly on the text to make changes. Click <strong>Save</strong> when done.</span>
              </div>
            )}
            <div className="bg-white shadow-md rounded-lg max-w-[8.5in] mx-auto">
              {isEditing ? (
                <div
                  ref={contentEditableRef}
                  contentEditable
                  suppressContentEditableWarning
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(editingContent) }}
                  className="outline-none focus:ring-2 focus:ring-blue-300 focus:ring-inset rounded-lg min-h-[600px]"
                  style={{ cursor: 'text' }}
                />
              ) : (
                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(c.content) }} />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
