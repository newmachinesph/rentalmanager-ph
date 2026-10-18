'use client';

import { useState } from 'react';
import { usePropertyStore } from '@/stores/propertyStore';
import { cn, INPUT_CLASS } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { ModalFooter } from '@/components/ui/ModalFooter';
import { FormField } from '@/components/ui/FormField';
import type { ExpenseRecord, ExpenseCategory } from '@/lib/types';

/* ================================================================== Constants */

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Maintenance',
  'Repairs',
  'Utilities',
  'Insurance',
  'Property Tax',
  'HOA/Association Dues',
  'Management Fee',
  'Cleaning',
  'Pest Control',
  'Landscaping',
  'Legal Fees',
  'Advertising',
  'Supplies',
  'Other Expense',
];

/* ================================================================== Types */

export type ExpenseFormData = Omit<ExpenseRecord, 'id' | 'createdAt'>;

const EMPTY_EXPENSE_FORM: ExpenseFormData = {
  propertyId: '',
  unitId: null,
  category: 'Maintenance',
  amount: 0,
  date: '',
  vendor: '',
  description: '',
  notes: '',
};

/* ================================================================== Component */

export function ExpenseFormModal({
  isOpen,
  editingRecord,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  editingRecord: ExpenseRecord | null;
  onClose: () => void;
  onSave: (data: ExpenseFormData) => void;
}) {
  const properties = usePropertyStore((s) => s.properties);

  const [form, setForm] = useState<ExpenseFormData>(EMPTY_EXPENSE_FORM);
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
        setForm(EMPTY_EXPENSE_FORM);
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
    if (!form.amount || form.amount <= 0) newErrors.amount = 'Valid amount is required';
    if (!form.date) newErrors.date = 'Date is required';
    if (!form.description.trim()) newErrors.description = 'Description is required';
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
    <Modal isOpen={isOpen} onClose={onClose} title={editingRecord ? 'Edit Expense' : 'Add Expense'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Property */}
        <FormField label="Property" required error={errors.propertyId}>
          <select
            value={form.propertyId}
            onChange={(e) => {
              updateField('propertyId', e.target.value);
              updateField('unitId', null);
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
            value={form.unitId || ''}
            onChange={(e) => updateField('unitId', e.target.value || null)}
            className={INPUT_CLASS}
            disabled={!form.propertyId}
          >
            <option value="">All / Common area</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
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
              {EXPENSE_CATEGORIES.map((cat) => (
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

        {/* Date */}
        <FormField label="Date" required error={errors.date}>
          <input
            type="date"
            value={form.date}
            onChange={(e) => updateField('date', e.target.value)}
            className={cn(INPUT_CLASS, errors.date && 'border-red-400')}
          />
        </FormField>

        {/* Vendor */}
        <FormField label="Vendor">
          <input
            type="text"
            value={form.vendor}
            onChange={(e) => updateField('vendor', e.target.value)}
            placeholder="e.g. Mang Tonio Plumbing"
            className={INPUT_CLASS}
          />
        </FormField>

        {/* Description */}
        <FormField label="Description" required error={errors.description}>
          <input
            type="text"
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="e.g. Fixed leaking faucet"
            className={cn(INPUT_CLASS, errors.description && 'border-red-400')}
          />
        </FormField>

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

        {/* Footer */}
        <ModalFooter
          onCancel={onClose}
          submitLabel={editingRecord ? 'Save Changes' : 'Add Expense'}
          submitType="submit"
        />
      </form>
    </Modal>
  );
}
