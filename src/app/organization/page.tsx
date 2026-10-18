'use client';

import { useState, useEffect } from 'react';
import { INPUT_CLASS } from '@/lib/utils';
import { useIncomeStore } from '@/stores/incomeStore';
import { useExpenseStore } from '@/stores/expenseStore';
import type { IncomeRecord, ExpenseRecord } from '@/lib/types';

import { OrgHeader } from '@/components/organization/OrgHeader';
import { OverviewTab } from '@/components/organization/OverviewTab';
import { DocumentsTab } from '@/components/organization/DocumentsTab';
import { MileageRemindersTab } from '@/components/organization/MileageRemindersTab';
import { OtherTab } from '@/components/organization/OtherTab';
import { PaymentFormModal } from '@/components/organization/PaymentFormModal';
import type { PaymentFormData } from '@/components/organization/PaymentFormModal';
import { ExpenseFormModal } from '@/components/organization/ExpenseFormModal';
import type { ExpenseFormData } from '@/components/organization/ExpenseFormModal';
import { DeleteConfirmDialog } from '@/components/organization/DeleteConfirmDialog';
import { TabNav } from '@/components/ui/TabNav';
import { Modal } from '@/components/ui/Modal';
import { ModalFooter } from '@/components/ui/ModalFooter';
import { FormField } from '@/components/ui/FormField';
import { PageHeaderSkeleton, TabsSkeleton, TableSkeleton, Skeleton } from '@/components/ui/Skeleton';

/* ================================================================== Constants */

type OrgTab = 'Overview' | 'Documents' | 'Mileage & Reminders' | 'Other';
const ORG_TABS: { key: OrgTab; label: string }[] = [
  { key: 'Overview', label: 'Overview' },
  { key: 'Documents', label: 'Documents' },
  { key: 'Mileage & Reminders', label: 'Mileage & Reminders' },
  { key: 'Other', label: 'Other' },
];

/* ================================================================== Page */

export default function OrganizationPage() {
  const [activeTab, setActiveTab] = useState<OrgTab>('Overview');

  /* ---- Hydrate stores from API ---- */
  const fetchIncome = useIncomeStore((s) => s.fetchRecords);
  const fetchExpenses = useExpenseStore((s) => s.fetchRecords);
  const incomeLoading = useIncomeStore((s) => s.loading);
  const expenseLoading = useExpenseStore((s) => s.loading);
  const orgLoading = incomeLoading || expenseLoading;
  useEffect(() => {
    fetchIncome();
    fetchExpenses();
  }, [fetchIncome, fetchExpenses]);

  /* ---- Store actions ---- */
  const addIncome = useIncomeStore((s) => s.addRecord);
  const updateIncome = useIncomeStore((s) => s.updateRecord);
  const deleteIncome = useIncomeStore((s) => s.deleteRecord);
  const addExpense = useExpenseStore((s) => s.addRecord);
  const updateExpense = useExpenseStore((s) => s.updateRecord);
  const deleteExpense = useExpenseStore((s) => s.deleteRecord);

  /* ---- Payment modal state ---- */
  const [paymentFormOpen, setPaymentFormOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<IncomeRecord | null>(null);

  /* ---- Expense modal state ---- */
  const [expenseFormOpen, setExpenseFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);

  /* ---- Delete confirm state ---- */
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    label: string;
    type: 'payment' | 'expense';
  } | null>(null);

  /* ---- Edit organization modal state ---- */
  const [editOrgOpen, setEditOrgOpen] = useState(false);
  const [orgForm, setOrgForm] = useState({
    name: '',
    address: '',
  });
  const [orgLoaded, setOrgLoaded] = useState(false);

  useEffect(() => {
    if (!orgLoaded) {
      fetch('/api/settings/general')
        .then((r) => r.json())
        .then((data) => {
          setOrgForm({
            name: data.companyName || '',
            address: data.orgAddress || '',
          });
          setOrgLoaded(true);
        });
    }
  }, [orgLoaded]);

  const handleSaveOrg = async () => {
    await fetch('/api/settings/general', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName: orgForm.name,
      }),
    });
    setEditOrgOpen(false);
  };

  /* ---- Handlers ---- */
  const handleAddPayment = () => {
    setEditingPayment(null);
    setPaymentFormOpen(true);
    setActiveTab('Overview');
  };

  const handleEditPayment = (record: IncomeRecord) => {
    setEditingPayment(record);
    setPaymentFormOpen(true);
  };

  const handleSavePayment = (data: PaymentFormData) => {
    if (editingPayment) {
      updateIncome(editingPayment.id, data);
    } else {
      addIncome({ ...data });
    }
    setPaymentFormOpen(false);
    setEditingPayment(null);
  };

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
      addExpense({ ...data });
    }
    setExpenseFormOpen(false);
    setEditingExpense(null);
  };

  const handleDeletePayment = (id: string, label: string) => {
    setDeleteTarget({ id, label, type: 'payment' });
  };

  const handleDeleteExpense = (id: string, label: string) => {
    setDeleteTarget({ id, label, type: 'expense' });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'payment') deleteIncome(deleteTarget.id);
    else deleteExpense(deleteTarget.id);
    setDeleteTarget(null);
  };

  /* ---- + Add header actions (switch tab & open modal) ---- */
  const handleAddReminder = () => setActiveTab('Mileage & Reminders');
  const handleAddMileage = () => setActiveTab('Mileage & Reminders');
  const handleAddNote = () => setActiveTab('Other');

  if (orgLoading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="rectangular" className="h-24 w-full" />
        <TabsSkeleton count={4} />
        <TableSkeleton rows={5} cols={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Org Header */}
      <OrgHeader
        orgName={orgForm.name || 'My Organization'}
        orgAddress={orgForm.address || ''}
        onAddPayment={handleAddPayment}
        onAddExpense={handleAddExpense}
        onAddReminder={handleAddReminder}
        onAddMileage={handleAddMileage}
        onAddNote={handleAddNote}
        onEditOrganization={() => setEditOrgOpen(true)}
      />

      {/* Tab Navigation */}
      <TabNav
        tabs={ORG_TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        ariaLabel="Organization tabs"
      />

      {/* Tab Content */}
      {activeTab === 'Overview' && (
        <OverviewTab
          onAddPayment={handleAddPayment}
          onEditPayment={handleEditPayment}
          onDeletePayment={handleDeletePayment}
          onAddExpense={handleAddExpense}
          onEditExpense={handleEditExpense}
          onDeleteExpense={handleDeleteExpense}
        />
      )}
      {activeTab === 'Documents' && <DocumentsTab />}
      {activeTab === 'Mileage & Reminders' && <MileageRemindersTab />}
      {activeTab === 'Other' && <OtherTab />}

      {/* Payment Form Modal */}
      {paymentFormOpen && (
        <PaymentFormModal
          isOpen={paymentFormOpen}
          editingRecord={editingPayment}
          onClose={() => {
            setPaymentFormOpen(false);
            setEditingPayment(null);
          }}
          onSave={handleSavePayment}
        />
      )}

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

      {/* Edit Organization Modal */}
      {editOrgOpen && (
        <Modal
          isOpen={editOrgOpen}
          onClose={() => setEditOrgOpen(false)}
          title="Edit Organization"
          size="sm"
        >
          <div className="space-y-4">
            <FormField label="Organization Name" required>
              <input
                type="text"
                className={INPUT_CLASS}
                value={orgForm.name}
                onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                placeholder="Organization name"
              />
            </FormField>

            <ModalFooter
              onCancel={() => setEditOrgOpen(false)}
              onSubmit={handleSaveOrg}
              submitLabel="Save Changes"
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
