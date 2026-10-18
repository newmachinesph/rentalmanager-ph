'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn, INPUT_CLASS, formatCurrency } from '@/lib/utils';
import { FormField } from '@/components/ui/FormField';
import { usePropertyStore } from '@/stores/propertyStore';
import { useTenantStore } from '@/stores/tenantStore';
import { useLeaseStore } from '@/stores/leaseStore';

/* ================================================================ */

export default function CreateLeasePage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;

  /* ---- Hydrate stores ---- */
  const fetchProperties = usePropertyStore((s) => s.fetchProperties);
  const fetchTenants = useTenantStore((s) => s.fetchTenants);
  const properties = usePropertyStore((s) => s.properties);
  const tenants = useTenantStore((s) => s.tenants);
  const addLease = useLeaseStore((s) => s.addLease);

  useEffect(() => {
    fetchProperties();
    fetchTenants();
  }, [fetchProperties, fetchTenants]);

  const property = properties.find((p) => p.id === propertyId);
  const units = useMemo(() => property?.units ?? [], [property]);

  /* ---- Section open/close ---- */
  const [leaseOpen, setLeaseOpen] = useState(true);
  const [additionalOpen, setAdditionalOpen] = useState(true);

  /* ---- Form state ---- */
  const [form, setForm] = useState({
    unitId: '',
    tenantId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    monthlyRent: 0,
    paymentDueDay: 1,
    securityDeposit: 0,
    advancePayment: 0,
    notes: '',
    status: 'Active' as const,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function updateField<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-fill rent from unit when unitId changes
      if (field === 'unitId' && value) {
        const unit = units.find((u) => u.id === value);
        if (unit) {
          next.monthlyRent = unit.monthlyRent;
        }
      }
      return next;
    });
    if (errors[field]) {
      setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
    }
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.unitId) e.unitId = 'Select a unit';
    if (!form.tenantId) e.tenantId = 'Select a tenant';
    if (!form.startDate) e.startDate = 'Start date is required';
    if (form.monthlyRent <= 0) e.monthlyRent = 'Rent must be greater than 0';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await addLease({
        propertyId,
        unitId: form.unitId,
        tenantId: form.tenantId,
        startDate: form.startDate,
        endDate: form.endDate || '',
        monthlyRent: form.monthlyRent,
        paymentDueDay: form.paymentDueDay,
        securityDeposit: form.securityDeposit,
        advancePayment: form.advancePayment,
        notes: form.notes,
        status: form.status,
      });
      router.push(`/properties/${propertyId}`);
    } catch {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <button onClick={() => router.push('/properties')} className="hover:text-blue-600 transition-colors">Properties</button>
        <span>/</span>
        <button onClick={() => router.push(`/properties/${propertyId}`)} className="hover:text-blue-600 transition-colors">{property?.name ?? 'Property'}</button>
        <span>/</span>
        <span className="text-slate-800 font-medium">Create lease</span>
      </div>

      <h1 className="text-2xl font-bold text-slate-900">Create lease</h1>

      {/* ===== Section 1: Lease details ===== */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <button
          onClick={() => setLeaseOpen(!leaseOpen)}
          className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-blue-500 text-white text-sm font-bold flex items-center justify-center">1</span>
            <span className="text-base font-semibold text-slate-800">Lease details</span>
          </div>
          {leaseOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>

        {leaseOpen && (
          <div className="px-6 pb-6 space-y-4">
            {/* Unit + Tenant selection */}
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Unit" required error={errors.unitId}>
                <select value={form.unitId} onChange={(e) => updateField('unitId', e.target.value)} className={cn(INPUT_CLASS, errors.unitId && 'border-red-400')}>
                  <option value="">Select unit</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} {u.status !== 'Vacant' ? `(${u.status})` : ''}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Tenant" required error={errors.tenantId}>
                <select value={form.tenantId} onChange={(e) => updateField('tenantId', e.target.value)} className={cn(INPUT_CLASS, errors.tenantId && 'border-red-400')}>
                  <option value="">Select tenant</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
                  ))}
                </select>
              </FormField>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Start date" required error={errors.startDate}>
                <input type="date" value={form.startDate} onChange={(e) => updateField('startDate', e.target.value)} className={cn(INPUT_CLASS, errors.startDate && 'border-red-400')} />
              </FormField>
              <FormField label="End date (Optional)">
                <input type="date" value={form.endDate} onChange={(e) => updateField('endDate', e.target.value)} className={INPUT_CLASS} />
              </FormField>
            </div>

            {/* Rent amount */}
            <FormField label="Rent amount" required error={errors.monthlyRent}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">₱</span>
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={form.monthlyRent}
                  onChange={(e) => updateField('monthlyRent', Number(e.target.value))}
                  className={cn(INPUT_CLASS, 'pl-8', errors.monthlyRent && 'border-red-400')}
                />
              </div>
            </FormField>

            {/* Payment day */}
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Payment day">
                <select value={form.paymentDueDay} onChange={(e) => updateField('paymentDueDay', Number(e.target.value))} className={INPUT_CLASS}>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>{d}{d === 1 ? 'st' : d === 2 ? 'nd' : d === 3 ? 'rd' : 'th'}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Status">
                <select value={form.status} onChange={(e) => updateField('status', e.target.value as 'Active')} className={INPUT_CLASS}>
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                </select>
              </FormField>
            </div>

            {/* Deposit */}
            <FormField label="Security deposit">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">₱</span>
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={form.securityDeposit}
                  onChange={(e) => updateField('securityDeposit', Number(e.target.value))}
                  className={cn(INPUT_CLASS, 'pl-8')}
                />
              </div>
            </FormField>

            {/* Advance */}
            <FormField label="Advance payment">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">₱</span>
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={form.advancePayment}
                  onChange={(e) => updateField('advancePayment', Number(e.target.value))}
                  className={cn(INPUT_CLASS, 'pl-8')}
                />
              </div>
            </FormField>
          </div>
        )}
      </div>

      {/* ===== Section 2: Notes / Additional ===== */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <button
          onClick={() => setAdditionalOpen(!additionalOpen)}
          className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-blue-500 text-white text-sm font-bold flex items-center justify-center">2</span>
            <span className="text-base font-semibold text-slate-800">Additional information</span>
          </div>
          {additionalOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>

        {additionalOpen && (
          <div className="px-6 pb-6 space-y-4">
            <FormField label="Notes">
              <textarea
                value={form.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                rows={4}
                className={cn(INPUT_CLASS, 'resize-none')}
                placeholder="Any additional notes about this lease..."
              />
            </FormField>
          </div>
        )}
      </div>

      {/* ===== Submit ===== */}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {submitting ? 'Creating...' : 'Create lease'}
        </button>
      </div>
    </div>
  );
}
