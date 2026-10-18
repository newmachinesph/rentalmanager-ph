'use client';

import { useState } from 'react';
import { usePropertyStore } from '@/stores/propertyStore';
import { useTenantStore } from '@/stores/tenantStore';
import { cn, INPUT_CLASS } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { ModalFooter } from '@/components/ui/ModalFooter';
import { FormField } from '@/components/ui/FormField';
import type {
  IncomeRecord,
  IncomeCategory,
  PaymentMethod,
  PaymentStatus,
} from '@/lib/types';

/* ================================================================== Constants */

const INCOME_CATEGORIES: IncomeCategory[] = [
  'Rent',
  'Parking',
  'Utilities Reimbursement',
  'Association Dues',
  'Late Fee',
  'Security Deposit',
  'Advance Payment',
  'Other Income',
];

const PAYMENT_METHODS: PaymentMethod[] = [
  'Cash',
  'Bank Transfer',
  'GCash',
  'Maya',
  'Check',
];

const PAYMENT_STATUSES: PaymentStatus[] = [
  'Paid',
  'Partially Paid',
  'Unpaid',
  'Overdue',
  'Pending',
];

/* ================================================================== Types */

export type PaymentFormData = Omit<IncomeRecord, 'id' | 'createdAt'>;

const EMPTY_PAYMENT_FORM: PaymentFormData = {
  propertyId: '',
  unitId: '',
  tenantId: '',
  leaseId: '',
  category: 'Rent',
  amount: 0,
  dueDate: '',
  paidDate: null,
  paymentMethod: null,
  status: 'Pending',
  referenceNo: '',
  notes: '',
};

/* ================================================================== Component */

export function PaymentFormModal({
  isOpen,
  editingRecord,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  editingRecord: IncomeRecord | null;
  onClose: () => void;
  onSave: (data: PaymentFormData) => void | Promise<void>;
}) {
  const properties = usePropertyStore((s) => s.properties);
  const tenants = useTenantStore((s) => s.tenants);

  const [form, setForm] = useState<PaymentFormData>(EMPTY_PAYMENT_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formKey = isOpen ? (editingRecord?.id ?? 'new') : 'closed';
  const [prevFormKey, setPrevFormKey] = useState(formKey);

  if (formKey !== prevFormKey) {
    setPrevFormKey(formKey);
    if (isOpen) {
      if (editingRecord) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id: _id, createdAt: _ca, ...rest } = editingRecord;
        setForm(rest);
      } else {
        setForm(EMPTY_PAYMENT_FORM);
      }
      setErrors({});
    }
  }

  const selectedProperty = properties.find((p) => p.id === form.propertyId);
  const units = selectedProperty?.units ?? [];

  function updateField(field: string, value: string | number | null) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!form.propertyId) newErrors.propertyId = 'Property is required';
    if (!form.tenantId) newErrors.tenantId = 'Tenant is required';
    if (!form.amount || form.amount <= 0) newErrors.amount = 'Valid amount is required';
    if (!form.dueDate) newErrors.dueDate = 'Due date is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    try {
      await onSave(form);
      onClose();
    } catch {
      setErrors({ form: 'Failed to save. Ensure tenant has an active lease for the selected property.' });
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingRecord ? 'Edit Payment' : 'Add Payment'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Property */}
        <FormField label="Property" required error={errors.propertyId}>
          <select
            value={form.propertyId}
            onChange={(e) => {
              updateField('propertyId', e.target.value);
              updateField('unitId', '');
            }}
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
        <FormField label="Unit">
          <select
            value={form.unitId ?? ''}
            onChange={(e) => updateField('unitId', e.target.value || null)}
            className={INPUT_CLASS}
            disabled={!form.propertyId}
          >
            <option value="">Select unit</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </FormField>

        {/* Tenant */}
        <FormField label="Tenant" required error={errors.tenantId}>
          <select
            value={form.tenantId ?? ''}
            onChange={(e) => updateField('tenantId', e.target.value || null)}
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

        {/* Category + Amount */}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Category">
            <select
              value={form.category}
              onChange={(e) => updateField('category', e.target.value)}
              className={INPUT_CLASS}
            >
              {INCOME_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Amount (PHP)" required error={errors.amount}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                &#8369;
              </span>
              <input
                type="number"
                value={form.amount || ''}
                onChange={(e) => updateField('amount', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className={cn(INPUT_CLASS, 'pl-7', errors.amount && 'border-red-400')}
              />
            </div>
          </FormField>
        </div>

        {/* Status */}
        <FormField label="Status">
          <select
            value={form.status}
            onChange={(e) => updateField('status', e.target.value)}
            className={INPUT_CLASS}
          >
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </FormField>

        {/* Due Date + Paid Date */}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Due Date" required error={errors.dueDate}>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => updateField('dueDate', e.target.value)}
              className={cn(INPUT_CLASS, errors.dueDate && 'border-red-400')}
            />
          </FormField>
          <FormField label="Paid Date">
            <input
              type="date"
              value={form.paidDate || ''}
              onChange={(e) => updateField('paidDate', e.target.value || null)}
              className={INPUT_CLASS}
            />
          </FormField>
        </div>

        {/* Payment Method + Reference No */}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Payment Method">
            <select
              value={form.paymentMethod || ''}
              onChange={(e) => updateField('paymentMethod', e.target.value || null)}
              className={INPUT_CLASS}
            >
              <option value="">None</option>
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Reference No">
            <input
              type="text"
              value={form.referenceNo}
              onChange={(e) => updateField('referenceNo', e.target.value)}
              placeholder="e.g. REF-12345"
              className={INPUT_CLASS}
            />
          </FormField>
        </div>

        {/* Notes */}
        <FormField label="Notes">
          <textarea
            value={form.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            rows={2}
            className={cn(INPUT_CLASS, 'resize-none')}
            placeholder="Optional notes..."
          />
        </FormField>

        {/* Form-level error */}
        {errors.form && (
          <p className="text-sm text-red-500">{errors.form}</p>
        )}

        {/* Footer */}
        <ModalFooter
          onCancel={onClose}
          submitLabel={editingRecord ? 'Save Changes' : 'Add Payment'}
          submitType="submit"
        />
      </form>
    </Modal>
  );
}
