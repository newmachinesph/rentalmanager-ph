'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, Calendar, Navigation, Filter, Pencil, Trash2 } from 'lucide-react';
import { cn, formatDate, INPUT_CLASS } from '@/lib/utils';
import { useClickOutside } from '@/lib/hooks';
import { Modal } from '@/components/ui/Modal';
import { ModalFooter } from '@/components/ui/ModalFooter';
import { FormField } from '@/components/ui/FormField';
import { Th } from '@/components/ui/Th';
import { TableWrapper } from '@/components/ui/TableWrapper';
import { Td } from '@/components/ui/Td';
import { EmptyState } from '@/components/ui/EmptyState';
import type { OrgReminder, OrgMileage } from '@/lib/types';

/* ================================================================== Constants */

const DEFAULT_REMINDER_CATEGORIES = [
  'Electrical Safety Check', 'Fire Safety Check', 'Gas Safety Check',
  'Insurance Renewal', 'Lease Renewal', 'Other', 'Property Inspection', 'Tax Filing',
];

type ReminderView = 'reminders' | 'recurring';
type ReminderFilter = 'All' | 'One-time' | 'Recurring';
const FILTER_OPTIONS: ReminderFilter[] = ['All', 'One-time', 'Recurring'];

/* ================================================================== Add Reminder Modal */

interface PropertyOption {
  id: string;
  name: string;
}

function AddReminderModal({
  isOpen,
  onClose,
  onSave,
  initial,
  categories,
  properties,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reminder: Omit<OrgReminder, 'id' | 'createdAt'>) => void | Promise<void>;
  initial?: OrgReminder | null;
  categories: string[];
  properties: PropertyOption[];
}) {
  const [propertyScope, setPropertyScope] = useState(initial?.propertyId ?? 'Organization');
  const [dateTime, setDateTime] = useState(initial?.dateTime ?? '');
  const [category, setCategory] = useState(initial?.category ?? 'Other');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [isRecurring, setIsRecurring] = useState(initial?.isRecurring ?? false);

  async function handleSave() {
    await onSave({
      propertyId: propertyScope,
      dateTime: dateTime || new Date().toISOString(),
      category,
      notes,
      isRecurring,
    });
    // Reset form
    setPropertyScope('Organization');
    setDateTime('');
    setCategory('Other');
    setNotes('');
    setIsRecurring(false);
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initial ? 'Edit reminder' : 'Add reminder'}>
      <div className="space-y-4">
        <FormField label="Property / Organization">
          <select
            value={propertyScope}
            onChange={(e) => setPropertyScope(e.target.value)}
            className={INPUT_CLASS}
          >
            <option value="Organization">Organization (General)</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Date & Time">
          <input
            type="datetime-local"
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
            className={INPUT_CLASS}
          />
        </FormField>

        <FormField label="Category">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={INPUT_CLASS}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Notes">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className={cn(INPUT_CLASS, 'resize-none')}
            placeholder="Optional notes..."
          />
        </FormField>

        <FormField label="Is this a recurring reminder?">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="recurring"
                checked={isRecurring}
                onChange={() => setIsRecurring(true)}
                className="h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">Yes</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="recurring"
                checked={!isRecurring}
                onChange={() => setIsRecurring(false)}
                className="h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">No</span>
            </label>
          </div>
        </FormField>

        <ModalFooter onCancel={onClose} onSubmit={handleSave} />
      </div>
    </Modal>
  );
}

/* ================================================================== Add Mileage Modal */

function AddMileageModal({
  isOpen,
  onClose,
  onSave,
  initial,
  properties,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (mileage: Omit<OrgMileage, 'id' | 'createdAt'>) => void | Promise<void>;
  initial?: OrgMileage | null;
  properties: PropertyOption[];
}) {
  const [propertyId, setPropertyId] = useState(initial?.propertyId ?? '');
  const [startLocation, setStartLocation] = useState(initial?.startLocation ?? '');
  const [endLocation, setEndLocation] = useState(initial?.endLocation ?? '');
  const [startDateTime, setStartDateTime] = useState(initial?.date ?? '');
  const [endDateTime, setEndDateTime] = useState('');
  const [purpose, setPurpose] = useState(initial?.purpose ?? '');

  async function handleSave() {
    await onSave({
      propertyId: propertyId || undefined,
      date: startDateTime ? startDateTime.split('T')[0] : new Date().toISOString().split('T')[0],
      startLocation,
      endLocation,
      purpose,
      distance: 0,
    });
    // Reset form
    setPropertyId('');
    setStartLocation('');
    setEndLocation('');
    setStartDateTime('');
    setEndDateTime('');
    setPurpose('');
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initial ? 'Edit mileage' : 'Add mileage'}>
      <div className="space-y-4">
        <FormField label="Property">
          <select
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            className={INPUT_CLASS}
          >
            <option value="">Organization (General)</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Start location">
          <input
            type="text"
            value={startLocation}
            onChange={(e) => setStartLocation(e.target.value)}
            placeholder="e.g. Office, Quezon City"
            className={INPUT_CLASS}
          />
        </FormField>

        <FormField label="Next location">
          <input
            type="text"
            value={endLocation}
            onChange={(e) => setEndLocation(e.target.value)}
            placeholder="e.g. Property, Makati"
            className={INPUT_CLASS}
          />
        </FormField>

        <FormField label="Start date & time">
          <input
            type="datetime-local"
            value={startDateTime}
            onChange={(e) => setStartDateTime(e.target.value)}
            className={INPUT_CLASS}
          />
        </FormField>

        <FormField label="End date & time">
          <input
            type="datetime-local"
            value={endDateTime}
            onChange={(e) => setEndDateTime(e.target.value)}
            className={INPUT_CLASS}
          />
        </FormField>

        <FormField label="Purpose">
          <input
            type="text"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="e.g. Property inspection"
            className={INPUT_CLASS}
          />
        </FormField>

        <ModalFooter onCancel={onClose} onSubmit={handleSave} />
      </div>
    </Modal>
  );
}

/* ================================================================== MileageRemindersTab */

export function MileageRemindersTab() {
  const [reminderCategories, setReminderCategories] = useState<string[]>(DEFAULT_REMINDER_CATEGORIES);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [reminders, setReminders] = useState<OrgReminder[]>([]);
  const [mileage, setMileage] = useState<OrgMileage[]>([]);
  const [reminderView, setReminderView] = useState<ReminderView>('reminders');
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [mileageModalOpen, setMileageModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<OrgReminder | null>(null);
  const [editingMileage, setEditingMileage] = useState<OrgMileage | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [reminderFilter, setReminderFilter] = useState<ReminderFilter>('All');
  const filterRef = useRef<HTMLDivElement>(null);

  useClickOutside(filterRef, () => setFilterOpen(false));

  // Fetch reminder categories and properties
  useEffect(() => {
    fetch('/api/settings/categories/reminderCategories')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data) && data.length > 0) setReminderCategories(data); })
      .catch(() => {});
    fetch('/api/properties')
      .then((r) => r.json())
      .then((resp) => {
        const list = Array.isArray(resp) ? resp : resp?.data;
        if (Array.isArray(list)) {
          setProperties(list.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })));
        }
      })
      .catch(() => {});
  }, []);

  // Fetch reminders from API on mount
  const fetchReminders = useCallback(async () => {
    try {
      const res = await fetch('/api/organization/reminders');
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) {
        const mapped: OrgReminder[] = data.map((r: { id: string; propertyId?: string; property?: { name?: string }; dateTime: string; category: string; notes: string; isRecurring: boolean; createdAt?: string }) => ({
          id: r.id,
          propertyId: r.propertyId || '',
          propertyName: r.property?.name || '',
          dateTime: r.dateTime,
          category: r.category,
          notes: r.notes,
          isRecurring: r.isRecurring,
          createdAt: r.createdAt || new Date().toISOString(),
        }));
        setReminders(mapped);
      }
    } catch { /* ignore */ }
  }, []);

  // Fetch mileage from API on mount
  const fetchMileage = useCallback(async () => {
    try {
      const res = await fetch('/api/organization/mileage');
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) {
        const mapped: OrgMileage[] = data.map((m: { id: string; propertyId?: string; property?: { name?: string }; date: string; startLocation: string; endLocation: string; purpose: string; distance: number; createdAt?: string }) => ({
          id: m.id,
          propertyId: m.propertyId || '',
          propertyName: m.property?.name || '',
          date: m.date,
          startLocation: m.startLocation,
          endLocation: m.endLocation,
          purpose: m.purpose,
          distance: m.distance,
          createdAt: m.createdAt || new Date().toISOString(),
        }));
        setMileage(mapped);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchReminders();
    fetchMileage();
  }, [fetchReminders, fetchMileage]);

  /* Filtered reminders based on view toggle and category filter */
  const viewFiltered = reminderView === 'recurring'
    ? reminders.filter((r) => r.isRecurring)
    : reminders.filter((r) => !r.isRecurring);

  const displayedReminders = reminderFilter === 'All'
    ? viewFiltered
    : reminderFilter === 'Recurring'
    ? viewFiltered.filter((r) => r.isRecurring)
    : viewFiltered.filter((r) => !r.isRecurring);

  /* Handlers */
  async function handleSaveReminder(data: Omit<OrgReminder, 'id' | 'createdAt'>) {
    try {
      if (editingReminder) {
        const res = await fetch(`/api/organization/reminders/${editingReminder.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to update reminder');
        const updated = await res.json();
        setReminders((prev) =>
          prev.map((r) => r.id === editingReminder.id ? { ...r, ...updated } : r)
        );
        setEditingReminder(null);
      } else {
        const res = await fetch('/api/organization/reminders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to create reminder');
        const created = await res.json();
        const newReminder: OrgReminder = {
          id: created.id,
          propertyId: created.propertyId || '',
          propertyName: properties.find((p) => p.id === created.propertyId)?.name || '',
          dateTime: created.dateTime,
          category: created.category,
          notes: created.notes,
          isRecurring: created.isRecurring,
          createdAt: created.createdAt || new Date().toISOString(),
        };
        setReminders((prev) => [newReminder, ...prev]);
      }
    } catch (err) {
      console.error('Error saving reminder:', err);
      alert('Failed to save reminder. Please try again.');
    }
  }

  async function handleDeleteReminder(id: string) {
    if (!window.confirm('Are you sure you want to delete this reminder?')) return;
    try {
      const res = await fetch(`/api/organization/reminders/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete reminder');
      setReminders((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error('Error deleting reminder:', err);
      alert('Failed to delete reminder. Please try again.');
    }
  }

  function handleEditReminder(reminder: OrgReminder) {
    setEditingReminder(reminder);
    setReminderModalOpen(true);
  }

  async function handleSaveMileage(data: Omit<OrgMileage, 'id' | 'createdAt'>) {
    try {
      if (editingMileage) {
        const res = await fetch(`/api/organization/mileage/${editingMileage.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to update mileage');
        const updated = await res.json();
        setMileage((prev) =>
          prev.map((m) => m.id === editingMileage.id ? { ...m, ...updated } : m)
        );
        setEditingMileage(null);
      } else {
        const res = await fetch('/api/organization/mileage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to create mileage');
        const created = await res.json();
        const newMileage: OrgMileage = {
          id: created.id,
          propertyId: created.propertyId || '',
          propertyName: properties.find((p) => p.id === created.propertyId)?.name || '',
          date: created.date,
          startLocation: created.startLocation,
          endLocation: created.endLocation,
          purpose: created.purpose,
          distance: created.distance,
          createdAt: created.createdAt || new Date().toISOString(),
        };
        setMileage((prev) => [newMileage, ...prev]);
      }
    } catch (err) {
      console.error('Error saving mileage:', err);
      alert('Failed to save mileage. Please try again.');
    }
  }

  async function handleDeleteMileage(id: string) {
    if (!window.confirm('Are you sure you want to delete this mileage entry?')) return;
    try {
      const res = await fetch(`/api/organization/mileage/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete mileage');
      setMileage((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error('Error deleting mileage:', err);
      alert('Failed to delete mileage. Please try again.');
    }
  }

  function handleEditMileage(entry: OrgMileage) {
    setEditingMileage(entry);
    setMileageModalOpen(true);
  }

  return (
    <div className="space-y-8">
      {/* ==================== Reminders Section ==================== */}
      <div className="space-y-4">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-semibold text-slate-800">Reminders</h3>
            {/* Toggle buttons */}
            <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden">
              <button
                onClick={() => setReminderView('reminders')}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium transition-colors',
                  reminderView === 'reminders'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                )}
              >
                Reminders
              </button>
              <button
                onClick={() => setReminderView('recurring')}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium transition-colors border-l border-slate-200',
                  reminderView === 'recurring'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                )}
              >
                Recurring reminders
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div ref={filterRef} className="relative">
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className={cn(
                  'p-2 rounded-md transition-colors',
                  filterOpen || reminderFilter !== 'All'
                    ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                )}
                aria-label="Filter reminders"
              >
                <Filter className="h-4 w-4" />
              </button>
              {filterOpen && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1">
                  {FILTER_OPTIONS.map((option) => (
                    <button
                      key={option}
                      onClick={() => { setReminderFilter(option); setFilterOpen(false); }}
                      className={cn(
                        'w-full text-left px-3 py-2 text-sm transition-colors',
                        reminderFilter === option
                          ? 'bg-blue-50 text-blue-600 font-medium'
                          : 'text-slate-700 hover:bg-slate-50'
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => setReminderModalOpen(true)}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              <Plus className="h-4 w-4" />
              New
            </button>
          </div>
        </div>

        {/* Reminders Table */}
        <TableWrapper>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <Th>Date</Th>
                  <Th>Property</Th>
                  <Th>Category</Th>
                  <Th>Notes</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {displayedReminders.map((reminder) => (
                  <tr
                    key={reminder.id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <Td className="whitespace-nowrap">
                      {formatDate(reminder.dateTime)}
                    </Td>
                    <Td>
                      {reminder.propertyName || 'Organization'}
                    </Td>
                    <Td>{reminder.category}</Td>
                    <Td>{reminder.notes || '-'}</Td>
                    <Td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditReminder(reminder)}
                          className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          aria-label="Edit reminder"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteReminder(reminder.id)}
                          className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          aria-label="Delete reminder"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>

            {displayedReminders.length === 0 && (
              <EmptyState
                variant="inline"
                icon={Calendar}
                title="No reminders"
                description="Add a reminder to keep track of important dates"
              />
            )}
        </TableWrapper>
      </div>

      {/* ==================== Mileage Section ==================== */}
      <div className="space-y-4">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-800">Mileage</h3>
          <button
            onClick={() => setMileageModalOpen(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            New
          </button>
        </div>

        {/* Mileage Table */}
        <TableWrapper>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <Th>Date</Th>
                  <Th>Property</Th>
                  <Th>From</Th>
                  <Th>To</Th>
                  <Th>Purpose</Th>
                  <Th>Distance</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {mileage.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <Td className="whitespace-nowrap">
                      {formatDate(entry.date)}
                    </Td>
                    <Td>
                      {entry.propertyName || 'Organization'}
                    </Td>
                    <Td>{entry.startLocation}</Td>
                    <Td>{entry.endLocation}</Td>
                    <Td>{entry.purpose}</Td>
                    <Td>
                      {entry.distance > 0 ? `${entry.distance} km` : '-'}
                    </Td>
                    <Td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditMileage(entry)}
                          className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          aria-label="Edit mileage"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteMileage(entry.id)}
                          className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          aria-label="Delete mileage"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>

            {mileage.length === 0 && (
              <EmptyState
                variant="inline"
                icon={Navigation}
                title="No mileage"
                description="Track your trips by adding mileage entries"
              />
            )}
        </TableWrapper>
      </div>

      {/* Modals */}
      <AddReminderModal
        key={editingReminder?.id ?? 'new-reminder'}
        isOpen={reminderModalOpen}
        onClose={() => { setReminderModalOpen(false); setEditingReminder(null); }}
        onSave={handleSaveReminder}
        initial={editingReminder}
        categories={reminderCategories}
        properties={properties}
      />
      <AddMileageModal
        key={editingMileage?.id ?? 'new-mileage'}
        isOpen={mileageModalOpen}
        onClose={() => { setMileageModalOpen(false); setEditingMileage(null); }}
        onSave={handleSaveMileage}
        initial={editingMileage}
        properties={properties}
      />
    </div>
  );
}
