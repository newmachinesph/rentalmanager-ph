'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePropertyStore } from '@/stores/propertyStore';
import { useExpenseStore } from '@/stores/expenseStore';
import type { ExpenseRecord } from '@/lib/types';

import { TabNav } from '@/components/ui/TabNav';
import { PropertyHeader } from '@/components/property/PropertyHeader';
import { PropertyOverviewTab } from '@/components/property/PropertyOverviewTab';
import { PropertyContactsTab } from '@/components/property/PropertyContactsTab';
import { PropertyDocumentsTab } from '@/components/property/PropertyDocumentsTab';
import { PropertyMileageRemindersTab } from '@/components/property/PropertyMileageRemindersTab';
import { PropertyOtherTab } from '@/components/property/PropertyOtherTab';
import { ExpenseFormModal } from '@/components/organization/ExpenseFormModal';
import type { ExpenseFormData } from '@/components/organization/ExpenseFormModal';
import { DeleteConfirmDialog } from '@/components/organization/DeleteConfirmDialog';

/* ================================================================== Constants */

type PropertyTab = 'Overview' | 'Contacts' | 'Documents' | 'Mileage & Reminders' | 'Other';
const TABS: { key: PropertyTab; label: string }[] = [
  { key: 'Overview', label: 'Overview' },
  { key: 'Contacts', label: 'Contacts' },
  { key: 'Documents', label: 'Documents' },
  { key: 'Mileage & Reminders', label: 'Mileage & Reminders' },
  { key: 'Other', label: 'Other' },
];

/* ================================================================== Page */

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;

  /* ---- Hydrate stores from API ---- */
  const fetchProperties = usePropertyStore((s) => s.fetchProperties);
  const fetchExpenses = useExpenseStore((s) => s.fetchRecords);
  useEffect(() => {
    fetchProperties();
    fetchExpenses();
  }, [fetchProperties, fetchExpenses]);

  /* ---- Store data ---- */
  const property = usePropertyStore((s) => s.properties.find((p) => p.id === propertyId));
  const addExpense = useExpenseStore((s) => s.addRecord);
  const updateExpense = useExpenseStore((s) => s.updateRecord);
  const deleteExpense = useExpenseStore((s) => s.deleteRecord);

  /* ---- Tab state ---- */
  const [activeTab, setActiveTab] = useState<PropertyTab>('Overview');

  /* ---- Expense modal state ---- */
  const [expenseFormOpen, setExpenseFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);

  /* ---- Delete confirm state ---- */
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    label: string;
  } | null>(null);

  /* ---- Redirect if property not found ---- */
  if (!property) {
    router.push('/properties');
    return null;
  }

  /* ---- Expense handlers ---- */
  const handleAddExpense = () => {
    setEditingExpense(null);
    setExpenseFormOpen(true);
    setActiveTab('Overview');
  };

  const handleEditExpense = (record: ExpenseRecord) => {
    setEditingExpense(record);
    setExpenseFormOpen(true);
  };

  const handleSaveExpense = (data: ExpenseFormData) => {
    if (editingExpense) {
      updateExpense(editingExpense.id, data);
    } else {
      addExpense({ ...data, propertyId: property.id });
    }
    setExpenseFormOpen(false);
    setEditingExpense(null);
  };

  const handleDeleteExpense = (id: string) => {
    setDeleteTarget({ id, label: 'this expense' });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteExpense(deleteTarget.id);
    setDeleteTarget(null);
  };

  /* ---- + Add header actions (switch tab) ---- */
  const handleAddReminder = () => setActiveTab('Mileage & Reminders');
  const handleAddMileage = () => setActiveTab('Mileage & Reminders');
  const handleAddNote = () => setActiveTab('Other');

  return (
    <div className="space-y-6">
      {/* Property Header */}
      <PropertyHeader
        property={property}
        onAddExpense={handleAddExpense}
        onAddReminder={handleAddReminder}
        onAddMileage={handleAddMileage}
        onAddNote={handleAddNote}
        onCreateLease={() => router.push(`/properties/${propertyId}/create-lease`)}
      />

      {/* Tab Navigation */}
      <TabNav
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        ariaLabel="Property tabs"
      />

      {/* Tab Content */}
      {activeTab === 'Overview' && (
        <PropertyOverviewTab
          property={property}
          onAddExpense={handleAddExpense}
          onEditExpense={handleEditExpense}
          onDeleteExpense={handleDeleteExpense}
        />
      )}
      {activeTab === 'Contacts' && <PropertyContactsTab propertyId={propertyId} />}
      {activeTab === 'Documents' && <PropertyDocumentsTab propertyId={propertyId} propertyName={property.name} />}
      {activeTab === 'Mileage & Reminders' && <PropertyMileageRemindersTab propertyId={propertyId} />}
      {activeTab === 'Other' && <PropertyOtherTab propertyId={propertyId} propertyName={property.name} />}

      {/* Expense Form Modal */}
      {expenseFormOpen && (
        <ExpenseFormModal
          isOpen={expenseFormOpen}
          editingRecord={editingExpense}
          onClose={() => {
            setExpenseFormOpen(false);
            setEditingExpense(null);
          }}
          onSave={handleSaveExpense}
        />
      )}

      {/* Delete Confirm Dialog */}
      {deleteTarget && (
        <DeleteConfirmDialog
          itemLabel={deleteTarget.label}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
