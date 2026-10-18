'use client';

import { useState, useEffect } from 'react';
import {
  Settings,
  User,
  Users,
  Bell,
  Grid3X3,
  ChevronRight,
  ChevronLeft,
  Save,
  Check,
  Shield,
  Plus,
  Trash2,
} from 'lucide-react';
import { cn, INPUT_CLASS } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { ModalFooter } from '@/components/ui/ModalFooter';
import { FormField } from '@/components/ui/FormField';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SettingsItem {
  id: string;
  title: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}

interface SettingsSection {
  title: string;
  items: SettingsItem[];
}

const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    title: 'Settings',
    items: [
      { id: 'general', title: 'General', icon: Settings, iconBg: 'bg-teal-100', iconColor: 'text-teal-600' },
      { id: 'users', title: 'Users & Permissions', icon: Shield, iconBg: 'bg-teal-100', iconColor: 'text-teal-600' },
      { id: 'notifications', title: 'Notification preferences', icon: Bell, iconBg: 'bg-teal-100', iconColor: 'text-teal-600' },
      { id: 'categories', title: 'Categories', icon: Grid3X3, iconBg: 'bg-teal-100', iconColor: 'text-teal-600' },
    ],
  },
];

interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}


// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  /* ---- General settings ---- */
  const [generalSettings, setGeneralSettings] = useState({
    ownerName: '',
    ownerEmail: '',
    ownerTitle: '',
    companyName: '',
    companyAddress: '',
    companyDescription: '',
    companyTin: '',
    orgPhone: '',
    defaultCurrency: 'PHP',
    dateFormat: 'MM/DD/YYYY',
    timezone: 'Asia/Manila',
    defaultPaymentDueDay: 1,
    penaltyRatePerMonth: 3,
  });
  const [generalLoaded, setGeneralLoaded] = useState(false);

  /* ---- Users ---- */
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [addUserModal, setAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'admin' });
  const [addUserError, setAddUserError] = useState('');

  /* ---- Notifications ---- */
  const [preferences, setPreferences] = useState({
    paymentReminders: true,
    maintenanceAlerts: true,
    leaseExpiry: true,
  });
  const [notifLoaded, setNotifLoaded] = useState(false);

  /* ---- Categories ---- */
  const [paymentCategories, setPaymentCategories] = useState<string[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<string[]>([]);
  const [reminderCategories, setReminderCategories] = useState<string[]>([]);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);

  /* ---- Add category modal ---- */
  const [addCategoryModal, setAddCategoryModal] = useState<{
    open: boolean;
    group: 'payment' | 'expense' | 'reminder';
  } | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');

  /* ---- Load data when panel opens ---- */
  useEffect(() => {
    if (activePanel === 'general' && !generalLoaded) {
      fetch('/api/settings/general').then((r) => r.json()).then((d) => { setGeneralSettings((prev) => ({ ...prev, ...d })); setGeneralLoaded(true); });
    }
    if (activePanel === 'users' && !usersLoaded) {
      fetch('/api/users').then((r) => r.json()).then((d) => { setUsers(d); setUsersLoaded(true); });
    }
    if (activePanel === 'notifications' && !notifLoaded) {
      fetch('/api/settings/notifications').then((r) => r.json()).then((d) => { setPreferences(d); setNotifLoaded(true); });
    }
    if (activePanel === 'categories' && !categoriesLoaded) {
      Promise.all([
        fetch('/api/settings/categories/paymentCategories').then((r) => r.json()),
        fetch('/api/settings/categories/expenseCategories').then((r) => r.json()),
        fetch('/api/settings/categories/reminderCategories').then((r) => r.json()),
      ]).then(([pay, exp, rem]) => {
        setPaymentCategories(pay || []);
        setExpenseCategories(exp || []);
        setReminderCategories(rem || []);
        setCategoriesLoaded(true);
      });
    }
  }, [activePanel, generalLoaded, usersLoaded, notifLoaded, categoriesLoaded]);

  /* ---- Save handlers ---- */
  const handleSave = async () => {
    setSaving(true);
    if (activePanel === 'general') {
      await fetch('/api/settings/general', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(generalSettings) });
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  /* ---- Category helpers (auto-save on add/delete) ---- */
  async function saveCategoryGroup(group: 'payment' | 'expense' | 'reminder', items: string[]) {
    const key = group === 'payment' ? 'paymentCategories' : group === 'expense' ? 'expenseCategories' : 'reminderCategories';
    await fetch(`/api/settings/categories/${key}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(items) });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleAddCategory() {
    if (!addCategoryModal || !newCategoryName.trim()) return;
    const name = newCategoryName.trim();
    if (addCategoryModal.group === 'payment') {
      if (!paymentCategories.includes(name)) {
        const updated = [...paymentCategories, name].sort();
        setPaymentCategories(updated);
        saveCategoryGroup('payment', updated);
      }
    } else if (addCategoryModal.group === 'expense') {
      if (!expenseCategories.includes(name)) {
        const updated = [...expenseCategories, name].sort();
        setExpenseCategories(updated);
        saveCategoryGroup('expense', updated);
      }
    } else {
      if (!reminderCategories.includes(name)) {
        const updated = [...reminderCategories, name].sort();
        setReminderCategories(updated);
        saveCategoryGroup('reminder', updated);
      }
    }
    setNewCategoryName('');
    setAddCategoryModal(null);
  }

  function handleDeleteCategory(group: 'payment' | 'expense' | 'reminder', name: string) {
    if (group === 'payment') {
      const updated = paymentCategories.filter((c) => c !== name);
      setPaymentCategories(updated);
      saveCategoryGroup('payment', updated);
    } else if (group === 'expense') {
      const updated = expenseCategories.filter((c) => c !== name);
      setExpenseCategories(updated);
      saveCategoryGroup('expense', updated);
    } else {
      const updated = reminderCategories.filter((c) => c !== name);
      setReminderCategories(updated);
      saveCategoryGroup('reminder', updated);
    }
  }

  /* ---- User handlers ---- */
  async function handleAddUser() {
    if (!newUser.name.trim() || !newUser.email.trim() || !newUser.password.trim()) return;
    setAddUserError('');
    try {
      const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newUser) });
      const data = await res.json();
      if (!res.ok) { setAddUserError(data.error || 'Failed to add user'); return; }
      setUsers((prev) => [...prev, data]);
      setNewUser({ name: '', email: '', password: '', role: 'admin' });
      setAddUserModal(false);
    } catch {
      setAddUserError('Network error');
    }
  }

  async function handleDeleteUser(id: string) {
    if (!window.confirm('Are you sure you want to remove this user?')) return;
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } else {
      const data = await res.json();
      alert(data.error || 'Cannot delete user');
    }
  }

  // -----------------------------------------------------------------------
  // Panel content
  // -----------------------------------------------------------------------

  const renderPanelContent = () => {
    switch (activePanel) {
      case 'general':
        return (
          <div className="space-y-5">
            <h3 className="text-lg font-semibold text-slate-800">General Settings</h3>
            <div className="space-y-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider pt-1">Owner / Representative</p>
              <FormField label="Owner / Manager Name">
                <input type="text" value={generalSettings.ownerName} onChange={(e) => setGeneralSettings({ ...generalSettings, ownerName: e.target.value })} className={INPUT_CLASS} />
              </FormField>
              <FormField label="Owner Title">
                <input type="text" value={generalSettings.ownerTitle} onChange={(e) => setGeneralSettings({ ...generalSettings, ownerTitle: e.target.value })} className={INPUT_CLASS} placeholder="e.g. Property Owner/Manager" />
              </FormField>
              <FormField label="Owner Email">
                <input type="email" value={generalSettings.ownerEmail} onChange={(e) => setGeneralSettings({ ...generalSettings, ownerEmail: e.target.value })} className={INPUT_CLASS} />
              </FormField>

              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider pt-3">Company Information</p>
              <FormField label="Company Name">
                <input type="text" value={generalSettings.companyName} onChange={(e) => setGeneralSettings({ ...generalSettings, companyName: e.target.value })} className={INPUT_CLASS} />
              </FormField>
              <FormField label="Company Address">
                <input type="text" value={generalSettings.companyAddress} onChange={(e) => setGeneralSettings({ ...generalSettings, companyAddress: e.target.value })} className={INPUT_CLASS} placeholder="Full company address" />
              </FormField>
              <FormField label="Company Phone">
                <input type="tel" value={generalSettings.orgPhone} onChange={(e) => setGeneralSettings({ ...generalSettings, orgPhone: e.target.value })} className={INPUT_CLASS} placeholder="+63 XXX XXX XXXX" />
              </FormField>
              <FormField label="Company TIN">
                <input type="text" value={generalSettings.companyTin} onChange={(e) => setGeneralSettings({ ...generalSettings, companyTin: e.target.value })} className={INPUT_CLASS} placeholder="e.g. 000-000-000-000" />
              </FormField>
              <FormField label="Company Description">
                <textarea value={generalSettings.companyDescription} onChange={(e) => setGeneralSettings({ ...generalSettings, companyDescription: e.target.value })} className={INPUT_CLASS} rows={2} placeholder="e.g. a corporation duly organized under the laws of the Philippines" />
              </FormField>

              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider pt-3">Preferences</p>
              <FormField label="Default Currency">
                <select value={generalSettings.defaultCurrency} onChange={(e) => setGeneralSettings({ ...generalSettings, defaultCurrency: e.target.value })} className={INPUT_CLASS}>
                  <option value="PHP">PHP (₱)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </FormField>
              <FormField label="Timezone">
                <select value={generalSettings.timezone} onChange={(e) => setGeneralSettings({ ...generalSettings, timezone: e.target.value })} className={INPUT_CLASS}>
                  <option value="Asia/Manila">(UTC+08:00) Manila</option>
                  <option value="Asia/Singapore">(UTC+08:00) Singapore</option>
                  <option value="Europe/London">(UTC+00:00) London</option>
                  <option value="America/New_York">(UTC-05:00) Eastern Time</option>
                  <option value="America/Los_Angeles">(UTC-08:00) Pacific Time</option>
                  <option value="Asia/Tokyo">(UTC+09:00) Tokyo</option>
                </select>
              </FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Payment Due Day">
                  <input type="number" min={1} max={28} value={generalSettings.defaultPaymentDueDay} onChange={(e) => setGeneralSettings({ ...generalSettings, defaultPaymentDueDay: Number(e.target.value) })} className={INPUT_CLASS} />
                </FormField>
                <FormField label="Penalty Rate Per Month (%)">
                  <input type="number" min={0} max={100} step={0.001} value={generalSettings.penaltyRatePerMonth} onChange={(e) => setGeneralSettings({ ...generalSettings, penaltyRatePerMonth: Number(e.target.value) })} className={INPUT_CLASS} />
                </FormField>
              </div>
            </div>
          </div>
        );

      case 'users':
        return (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Users & Permissions</h3>
              <p className="text-sm text-slate-500 mt-1">Manage team members and access control</p>
            </div>
            <div className="space-y-3">
              {users.map((u) => (
                <div key={u.id} className="bg-white border border-slate-200 rounded-lg p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <User size={20} className="text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-800">{u.name}</h4>
                        <p className="text-xs text-slate-500">{u.email} &mdash; {u.role}</p>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteUser(u.id)} className="flex items-center justify-center w-8 h-8 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Remove user">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              {users.length === 0 && !usersLoaded && (
                <p className="text-sm text-slate-400 py-4 text-center">Loading users...</p>
              )}
            </div>
            <button onClick={() => { setAddUserModal(true); setAddUserError(''); }} className="border border-slate-300 text-slate-700 rounded-md px-4 py-2 text-sm font-medium hover:bg-slate-50 inline-flex items-center gap-1.5">
              <Users size={14} />
              Add User
            </button>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Notification Preferences</h3>
              <p className="text-sm text-slate-500 mt-1">Choose which alerts are active</p>
            </div>
            <div className="space-y-3">
              {[
                { key: 'paymentReminders', label: 'Payment Reminders', desc: 'Alert before payment due dates' },
                { key: 'maintenanceAlerts', label: 'Maintenance Alerts', desc: 'Get notified for new maintenance requests' },
                { key: 'leaseExpiry', label: 'Lease Expiry Alerts', desc: 'Notify before lease expiration' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-lg">
                  <div>
                    <h4 className="text-sm font-medium text-slate-800">{item.label}</h4>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => {
                      const updated = { ...preferences, [item.key]: !preferences[item.key as keyof typeof preferences] };
                      setPreferences(updated);
                      fetch('/api/settings/notifications', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) })
                        .then(() => { setSaved(true); setTimeout(() => setSaved(false), 2000); });
                    }}
                    className={`relative w-11 h-6 rounded-full transition-colors ${preferences[item.key as keyof typeof preferences] ? 'bg-blue-500' : 'bg-slate-300'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${preferences[item.key as keyof typeof preferences] ? 'translate-x-5' : ''}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      case 'categories':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Categories</h3>
              <p className="text-sm text-slate-500 mt-1">Manage payment, expense, and reminder categories</p>
            </div>
            <CategoryGroup title="Payment Categories" items={paymentCategories} onAdd={() => { setAddCategoryModal({ open: true, group: 'payment' }); setNewCategoryName(''); }} onDelete={(n) => handleDeleteCategory('payment', n)} />
            <CategoryGroup title="Expense Categories" items={expenseCategories} onAdd={() => { setAddCategoryModal({ open: true, group: 'expense' }); setNewCategoryName(''); }} onDelete={(n) => handleDeleteCategory('expense', n)} />
            <CategoryGroup title="Reminder Categories" items={reminderCategories} onAdd={() => { setAddCategoryModal({ open: true, group: 'reminder' }); setNewCategoryName(''); }} onDelete={(n) => handleDeleteCategory('reminder', n)} />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {activePanel ? (
        <div>
          <button onClick={() => setActivePanel(null)} className="text-sm text-blue-600 hover:text-blue-700 font-medium mb-4 inline-flex items-center gap-1">
            <ChevronLeft size={14} /> Back
          </button>

          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
            {renderPanelContent()}

            {activePanel === 'general' && (
              <div className="mt-6 pt-5 border-t border-slate-200 flex items-center justify-end gap-3">
                {saved && (
                  <span className="flex items-center gap-1.5 text-sm text-green-600">
                    <Check className="w-4 h-4" /> Settings saved
                  </span>
                )}
                <button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2 text-sm font-medium inline-flex items-center gap-1.5 disabled:opacity-50">
                  <Save size={14} /> {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {SETTINGS_SECTIONS.map((section) => (
            <div key={section.title}>
              <h2 className="text-xl font-semibold text-slate-800 mb-3">{section.title}</h2>
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                {section.items.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.id} onClick={() => setActivePanel(item.id)} className={`flex items-center justify-between px-5 py-4 hover:bg-slate-50 cursor-pointer transition-colors ${idx < section.items.length - 1 ? 'border-b border-slate-100' : ''}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${item.iconBg}`}>
                          <Icon size={16} className={item.iconColor} />
                        </div>
                        <span className="font-medium text-slate-700 text-sm">{item.title}</span>
                      </div>
                      <ChevronRight size={16} className="text-slate-400 shrink-0" />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Category Modal */}
      <Modal isOpen={addCategoryModal?.open ?? false} onClose={() => setAddCategoryModal(null)} title="Add Category" size="xs">
        <div className="space-y-4">
          <FormField label="Category Name">
            <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Enter category name" className={INPUT_CLASS} autoFocus onKeyDown={(e) => { if (e.key === 'Enter') handleAddCategory(); }} />
          </FormField>
          <ModalFooter onCancel={() => setAddCategoryModal(null)} onSubmit={handleAddCategory} submitLabel="Add" />
        </div>
      </Modal>

      {/* Add User Modal */}
      <Modal isOpen={addUserModal} onClose={() => setAddUserModal(false)} title="Add User" size="sm">
        <div className="space-y-4">
          {addUserError && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{addUserError}</div>}
          <FormField label="Full Name" required>
            <input type="text" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} className={INPUT_CLASS} placeholder="Enter full name" autoFocus />
          </FormField>
          <FormField label="Email" required>
            <input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} className={INPUT_CLASS} placeholder="Enter email address" />
          </FormField>
          <FormField label="Password" required>
            <input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} className={INPUT_CLASS} placeholder="Set a password" />
          </FormField>
          <FormField label="Role" required>
            <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className={INPUT_CLASS}>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="viewer">Viewer</option>
            </select>
          </FormField>
          <ModalFooter onCancel={() => setAddUserModal(false)} onSubmit={handleAddUser} submitLabel="Add User" />
        </div>
      </Modal>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CategoryGroup
// ---------------------------------------------------------------------------

function CategoryGroup({ title, items, onAdd, onDelete }: { title: string; items: string[]; onAdd: () => void; onDelete: (name: string) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-slate-800">{title} ({items.length})</h4>
        <button onClick={onAdd} className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </div>
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {items.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400">No categories added</div>
        ) : (
          items.map((item, idx) => (
            <div key={item} className={cn('flex items-center justify-between px-4 py-2.5', idx < items.length - 1 && 'border-b border-slate-100')}>
              <span className="text-sm text-slate-700">{item}</span>
              <button onClick={() => onDelete(item)} className="flex items-center justify-center w-7 h-7 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors" title={`Delete ${item}`}>
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
