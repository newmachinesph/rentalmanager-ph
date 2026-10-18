'use client';

import { useState, useEffect, useMemo } from 'react';
import { Modal } from '@/components/ui/Modal';
import { ModalFooter } from '@/components/ui/ModalFooter';
import { FormField } from '@/components/ui/FormField';
import { cn, INPUT_CLASS } from '@/lib/utils';
import type { UtilityReading, UtilityType, Property } from '@/lib/types';

export interface UtilityFormData {
  propertyId: string;
  unitId: string | null;
  utilityType: UtilityType;
  readingDate: string;
  previousReading: number;
  currentReading: number;
  ratePerUnit: number;
  isPaid: boolean;
  paidDate: string | null;
  notes: string;
}

export function UtilityReadingModal({
  isOpen,
  editingRecord,
  onClose,
  onSave,
  properties,
  readings,
}: {
  isOpen: boolean;
  editingRecord: UtilityReading | null;
  onClose: () => void;
  onSave: (data: UtilityFormData) => void;
  properties: Property[];
  readings: UtilityReading[];
}) {
  const [propertyId, setPropertyId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [utilityType, setUtilityType] = useState<UtilityType>('Electricity');
  const [readingDate, setReadingDate] = useState('');
  const [previousReading, setPreviousReading] = useState(0);
  const [currentReading, setCurrentReading] = useState(0);
  const [ratePerUnit, setRatePerUnit] = useState(0);
  const [isPaid, setIsPaid] = useState(false);
  const [paidDate, setPaidDate] = useState('');
  const [notes, setNotes] = useState('');

  const selectedProperty = useMemo(
    () => properties.find((p) => p.id === propertyId),
    [properties, propertyId],
  );

  const units = selectedProperty?.units ?? [];

  // Auto-fill previous reading from latest reading for same property/unit/type
  useEffect(() => {
    if (editingRecord) return;
    const match = readings.find(
      (r) =>
        r.propertyId === propertyId &&
        (r.unitId || '') === unitId &&
        r.utilityType === utilityType,
    );
    if (match) {
      setPreviousReading(match.currentReading);
    } else {
      setPreviousReading(0);
    }
  }, [propertyId, unitId, utilityType, readings, editingRecord]);

  // Populate when editing
  useEffect(() => {
    if (editingRecord) {
      setPropertyId(editingRecord.propertyId);
      setUnitId(editingRecord.unitId || '');
      setUtilityType(editingRecord.utilityType);
      setReadingDate(editingRecord.readingDate);
      setPreviousReading(editingRecord.previousReading);
      setCurrentReading(editingRecord.currentReading);
      setRatePerUnit(editingRecord.ratePerUnit);
      setIsPaid(editingRecord.isPaid);
      setPaidDate(editingRecord.paidDate || '');
      setNotes(editingRecord.notes);
    } else {
      setPropertyId('');
      setUnitId('');
      setUtilityType('Electricity');
      setReadingDate(new Date().toISOString().slice(0, 10));
      setPreviousReading(0);
      setCurrentReading(0);
      setRatePerUnit(0);
      setIsPaid(false);
      setPaidDate('');
      setNotes('');
    }
  }, [editingRecord, isOpen]);

  const consumption = Math.max(0, currentReading - previousReading);
  const amount = consumption * ratePerUnit;

  function handleSave() {
    if (!propertyId || !readingDate) return;
    onSave({
      propertyId,
      unitId: unitId || null,
      utilityType,
      readingDate,
      previousReading,
      currentReading,
      ratePerUnit,
      isPaid,
      paidDate: isPaid && paidDate ? paidDate : null,
      notes,
    });
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingRecord ? 'Edit Utility Reading' : 'New Utility Reading'}
    >
      <div className="space-y-4">
        {/* Property */}
        <FormField label="Property" required>
          <select
            value={propertyId}
            onChange={(e) => {
              setPropertyId(e.target.value);
              setUnitId('');
            }}
            className={INPUT_CLASS}
          >
            <option value="">Select property...</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </FormField>

        {/* Unit (optional) */}
        {units.length > 0 && (
          <FormField label="Unit">
            <select
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
              className={INPUT_CLASS}
            >
              <option value="">Common area / Whole property</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </FormField>
        )}

        {/* Utility Type */}
        <FormField label="Utility Type" required>
          <select
            value={utilityType}
            onChange={(e) => setUtilityType(e.target.value as UtilityType)}
            className={INPUT_CLASS}
          >
            <option value="Electricity">Electricity</option>
            <option value="Water">Water</option>
          </select>
        </FormField>

        {/* Reading Date */}
        <FormField label="Reading Date" required>
          <input
            type="date"
            value={readingDate}
            onChange={(e) => setReadingDate(e.target.value)}
            className={INPUT_CLASS}
          />
        </FormField>

        {/* Readings row */}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Previous Reading">
            <input
              type="number"
              step="0.01"
              min="0"
              value={previousReading}
              onChange={(e) => setPreviousReading(parseFloat(e.target.value) || 0)}
              className={INPUT_CLASS}
            />
          </FormField>
          <FormField label="Current Reading">
            <input
              type="number"
              step="0.01"
              min="0"
              value={currentReading}
              onChange={(e) => setCurrentReading(parseFloat(e.target.value) || 0)}
              className={INPUT_CLASS}
            />
          </FormField>
        </div>

        {/* Rate */}
        <FormField label="Rate per Unit">
          <input
            type="number"
            step="0.01"
            min="0"
            value={ratePerUnit}
            onChange={(e) => setRatePerUnit(parseFloat(e.target.value) || 0)}
            className={INPUT_CLASS}
          />
        </FormField>

        {/* Computed values */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-md bg-slate-50 border border-slate-200 px-3 py-2">
            <p className="text-xs text-slate-500">Consumption</p>
            <p className="text-sm font-semibold text-slate-800">{consumption.toFixed(2)}</p>
          </div>
          <div className="rounded-md bg-slate-50 border border-slate-200 px-3 py-2">
            <p className="text-xs text-slate-500">Amount</p>
            <p className="text-sm font-semibold text-slate-800">PHP {amount.toFixed(2)}</p>
          </div>
        </div>

        {/* Paid */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={isPaid}
              onChange={(e) => setIsPaid(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            Paid
          </label>
          {isPaid && (
            <input
              type="date"
              value={paidDate}
              onChange={(e) => setPaidDate(e.target.value)}
              className={cn(INPUT_CLASS, 'w-auto')}
              placeholder="Paid date"
            />
          )}
        </div>

        {/* Notes */}
        <FormField label="Notes">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className={cn(INPUT_CLASS, 'resize-none')}
            placeholder="Optional notes..."
          />
        </FormField>

        <ModalFooter
          onCancel={onClose}
          onSubmit={handleSave}
          submitLabel={editingRecord ? 'Update' : 'Save'}
          submitDisabled={!propertyId || !readingDate}
        />
      </div>
    </Modal>
  );
}
