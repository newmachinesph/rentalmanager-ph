'use client';

import { useState, useEffect, useMemo } from 'react';
import { Bell, Search, Plus, X, Calendar, MapPin } from 'lucide-react';
import { cn, INPUT_CLASS, formatDate } from '@/lib/utils';
import { useAppStore } from '@/stores/appStore';
import { Modal } from '@/components/ui/Modal';
import { ModalFooter } from '@/components/ui/ModalFooter';
import { FormField } from '@/components/ui/FormField';

type ReminderType = 'overdue' | 'upcoming' | 'scheduled';
type TabKey = 'all' | ReminderType;

interface Reminder {
  id: string;
  title: string;
  dueDate: string;
  type: ReminderType;
  property: string;
}

function classifyReminder(dateTime: string): ReminderType {
  const now = new Date();
  const d = new Date(dateTime);
  if (d < now) return 'overdue';
  const daysUntil = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (daysUntil <= 7) return 'upcoming';
  return 'scheduled';
}

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'overdue', label: 'OVERDUE' },
  { key: 'upcoming', label: 'UPCOMING' },
  { key: 'scheduled', label: 'SCHEDULED' },
];

const DOT_COLOR: Record<ReminderType, string> = {
  overdue: 'bg-red-500',
  upcoming: 'bg-amber-500',
  scheduled: 'bg-blue-500',
};

const TYPE_BADGE_CLASS: Record<ReminderType, string> = {
  overdue: 'text-red-600 bg-red-50',
  upcoming: 'text-amber-600 bg-amber-50',
  scheduled: 'text-blue-600 bg-blue-50',
};

const EMPTY_FORM = { title: '', dueDate: '', type: 'upcoming' as ReminderType, propertyId: '' };

interface PropertyOption {
  id: string;
  name: string;
}

export default function RemindersPanel() {
  const open = useAppStore((s) => s.remindersPanelOpen);
  const setOpen = useAppStore((s) => s.setRemindersPanelOpen);

  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [search, setSearch] = useState('');
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [properties, setProperties] = useState<PropertyOption[]>([]);

  // Fetch reminders and properties from API when panel opens
  useEffect(() => {
    if (open && !loaded) {
      Promise.all([
        fetch('/api/organization/reminders').then((r) => r.json()),
        fetch('/api/properties').then((r) => r.json()),
      ])
        .then(([remindersData, propertiesData]) => {
          if (Array.isArray(remindersData)) {
            const mapped: Reminder[] = remindersData.map((r: { id: string; notes: string; dateTime: string; category: string; property?: { name?: string } }) => ({
              id: r.id,
              title: r.notes || r.category || 'Reminder',
              dueDate: r.dateTime?.split(' ')[0] || r.dateTime,
              type: classifyReminder(r.dateTime),
              property: r.property?.name || 'Organization',
            }));
            setReminders(mapped);
          }
          const propsList = Array.isArray(propertiesData) ? propertiesData : propertiesData?.data;
          if (Array.isArray(propsList)) {
            setProperties(propsList.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })));
          }
          setLoaded(true);
        })
        .catch(() => setLoaded(true));
    }
  }, [open, loaded]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) setOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, setOpen]);

  // Counts per tab (computed from data)
  const counts = useMemo<Record<TabKey, number>>(() => {
    return {
      all: reminders.length,
      overdue: reminders.filter((r) => r.type === 'overdue').length,
      upcoming: reminders.filter((r) => r.type === 'upcoming').length,
      scheduled: reminders.filter((r) => r.type === 'scheduled').length,
    };
  }, [reminders]);

  // Filtered list
  const filtered = useMemo(() => {
    let list = reminders;
    if (activeTab !== 'all') {
      list = list.filter((r) => r.type === activeTab);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.property.toLowerCase().includes(q)
      );
    }
    return list;
  }, [reminders, activeTab, search]);

  // Add reminder handler
  async function handleAddReminder() {
    try {
      const res = await fetch('/api/organization/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateTime: form.dueDate,
          category: form.type,
          notes: form.title.trim(),
          propertyId: form.propertyId || 'Organization',
          isRecurring: false,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        alert(err?.error || 'Failed to create reminder');
        return;
      }

      const data = await res.json();

      const selectedProperty = properties.find((p) => p.id === form.propertyId);
      const newReminder: Reminder = {
        id: data.id,
        title: form.title.trim(),
        dueDate: form.dueDate,
        type: form.type,
        property: selectedProperty?.name || 'Organization',
      };

      setReminders((prev) => [...prev, newReminder]);
      setLoaded(false);
      setForm(EMPTY_FORM);
      setShowAddModal(false);
    } catch {
      alert('Failed to create reminder');
    }
  }

  function handleCancelAdd() {
    setForm(EMPTY_FORM);
    setShowAddModal(false);
  }

  const canSubmit = form.title.trim() !== '' && form.dueDate !== '';

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/20 transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setOpen(false)}
      />

      {/* Slide-over panel */}
      <div
        className={cn(
          'fixed top-0 right-0 z-50 h-full w-[380px] max-w-full bg-white shadow-2xl flex flex-col',
          'transform transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <Bell className="w-5 h-5 text-slate-700" />
            <h2 className="text-lg font-semibold text-slate-800">Reminders</h2>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close reminders"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 pt-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Find reminders"
              className="w-full h-9 pl-9 pr-3 rounded-md border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-6 py-3 border-b border-slate-100 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0',
                activeTab === tab.key
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              )}
            >
              {tab.label}
              <span
                className={cn(
                  'inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-semibold px-1',
                  activeTab === tab.key
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-200 text-slate-500'
                )}
              >
                {counts[tab.key]}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex-1 flex items-center justify-center px-6 h-full">
              <p className="text-sm text-slate-400 text-center">
                {search.trim() || activeTab !== 'all'
                  ? 'No matching reminders'
                  : 'No reminders yet'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filtered.map((reminder) => (
                <li
                  key={reminder.id}
                  className="px-6 py-3.5 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {/* Colored dot */}
                    <span
                      className={cn(
                        'mt-1.5 h-2.5 w-2.5 rounded-full flex-shrink-0',
                        DOT_COLOR[reminder.type]
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {reminder.title}
                      </p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(reminder.dueDate)}
                        </span>
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{reminder.property}</span>
                        </span>
                      </div>
                      <span
                        className={cn(
                          'mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize',
                          TYPE_BADGE_CLASS[reminder.type]
                        )}
                      >
                        {reminder.type}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer - New Reminder button */}
        <div className="px-6 py-4 border-t border-slate-100">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Reminder
          </button>
        </div>
      </div>

      {/* Add Reminder Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={handleCancelAdd}
        title="New Reminder"
        size="sm"
      >
        <div className="space-y-4">
          <FormField label="Title" required>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Lease renewal - Unit B-202"
              className={INPUT_CLASS}
            />
          </FormField>

          <FormField label="Due Date" required>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              className={INPUT_CLASS}
            />
          </FormField>

          <FormField label="Type" required>
            <select
              value={form.type}
              onChange={(e) =>
                setForm((f) => ({ ...f, type: e.target.value as ReminderType }))
              }
              className={INPUT_CLASS}
            >
              <option value="overdue">Overdue</option>
              <option value="upcoming">Upcoming</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </FormField>

          <FormField label="Property">
            <select
              value={form.propertyId}
              onChange={(e) =>
                setForm((f) => ({ ...f, propertyId: e.target.value }))
              }
              className={INPUT_CLASS}
            >
              <option value="">Organization (General)</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <ModalFooter
          onCancel={handleCancelAdd}
          onSubmit={handleAddReminder}
          submitLabel="Add Reminder"
          submitDisabled={!canSubmit}
        />
      </Modal>
    </>
  );
}
