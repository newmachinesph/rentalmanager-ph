'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Users, Pencil, Trash2 } from 'lucide-react';
import { INPUT_CLASS } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { ModalFooter } from '@/components/ui/ModalFooter';
import { FormField } from '@/components/ui/FormField';
import { Th } from '@/components/ui/Th';
import { TableWrapper } from '@/components/ui/TableWrapper';
import { Td } from '@/components/ui/Td';
import type { PropertyOwner } from '@/lib/types';

/* ================================================================== UFO Empty State Illustration */

function UfoIllustration() {
  return (
    <svg
      width="120"
      height="100"
      viewBox="0 0 120 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mx-auto mb-4"
    >
      {/* Beam lines */}
      <line x1="45" y1="55" x2="30" y2="90" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3" />
      <line x1="60" y1="55" x2="60" y2="92" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3" />
      <line x1="75" y1="55" x2="90" y2="90" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3" />

      {/* UFO body - ellipse */}
      <ellipse cx="60" cy="45" rx="35" ry="12" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />

      {/* UFO dome */}
      <ellipse cx="60" cy="38" rx="18" ry="14" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.5" />

      {/* Dome window */}
      <circle cx="60" cy="34" r="5" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />

      {/* Lights on the body */}
      <circle cx="40" cy="45" r="3" fill="#93c5fd" />
      <circle cx="52" cy="48" r="3" fill="#93c5fd" />
      <circle cx="68" cy="48" r="3" fill="#93c5fd" />
      <circle cx="80" cy="45" r="3" fill="#93c5fd" />

      {/* Antenna */}
      <line x1="60" y1="24" x2="60" y2="16" stroke="#94a3b8" strokeWidth="1.5" />
      <circle cx="60" cy="14" r="3" fill="#fca5a5" stroke="#94a3b8" strokeWidth="1" />

      {/* Small stars */}
      <circle cx="15" cy="20" r="1.5" fill="#cbd5e1" />
      <circle cx="100" cy="15" r="1.5" fill="#cbd5e1" />
      <circle cx="105" cy="35" r="1" fill="#cbd5e1" />
      <circle cx="10" cy="50" r="1" fill="#cbd5e1" />
    </svg>
  );
}

/* ================================================================== Add Owner Modal */

function AddOwnerModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (owner: Omit<PropertyOwner, 'id'>) => Promise<void>;
  initialData?: PropertyOwner | null;
}) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [email, setEmail] = useState(initialData?.email ?? '');
  const [phone, setPhone] = useState(initialData?.phone ?? '');

  /* Sync form when initialData changes (open for edit vs. add) */
  const [prevInitialData, setPrevInitialData] = useState(initialData);
  if (initialData !== prevInitialData) {
    setPrevInitialData(initialData);
    setName(initialData?.name ?? '');
    setEmail(initialData?.email ?? '');
    setPhone(initialData?.phone ?? '');
  }

  async function handleSave() {
    await onSave({ name, email, phone });
    setName('');
    setEmail('');
    setPhone('');
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit owner' : 'Add owner'}>
      <div className="space-y-4">
        <FormField label="Name">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className={INPUT_CLASS}
          />
        </FormField>

        <FormField label="Email">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            className={INPUT_CLASS}
          />
        </FormField>

        <FormField label="Phone">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+63 9XX XXX XXXX"
            className={INPUT_CLASS}
          />
        </FormField>

        <ModalFooter onCancel={onClose} onSubmit={handleSave} />
      </div>
    </Modal>
  );
}

/* ================================================================== PropertyContactsTab */

export function PropertyContactsTab({ propertyId }: { propertyId: string }) {
  const [owners, setOwners] = useState<PropertyOwner[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOwner, setEditingOwner] = useState<PropertyOwner | null>(null);

  /* ================================================================== Fetch contacts on mount */
  const fetchContacts = useCallback(async () => {
    try {
      const res = await fetch(`/api/properties/${propertyId}/contacts`);
      if (!res.ok) throw new Error('Failed to fetch contacts');
      const data = await res.json();
      setOwners(data);
    } catch (err) {
      console.error('Error fetching contacts:', err);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  /* Handler — Add */
  async function handleAddOwner(data: Omit<PropertyOwner, 'id'>) {
    try {
      const res = await fetch(`/api/properties/${propertyId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create contact');
      const savedContact: PropertyOwner = await res.json();
      setOwners((prev) => [savedContact, ...prev]);
    } catch (err) {
      console.error('Error creating contact:', err);
      alert('Failed to save contact. Please try again.');
    }
  }

  /* Handler — Edit */
  async function handleEditOwner(data: Omit<PropertyOwner, 'id'>) {
    if (!editingOwner) return;
    try {
      const res = await fetch(`/api/properties/${propertyId}/contacts/${editingOwner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update contact');
      const updatedContact: PropertyOwner = await res.json();
      setOwners((prev) =>
        prev.map((o) => (o.id === editingOwner.id ? updatedContact : o))
      );
      setEditingOwner(null);
    } catch (err) {
      console.error('Error updating contact:', err);
      alert('Failed to update contact. Please try again.');
    }
  }

  /* Handler — Delete */
  async function handleDeleteOwner(id: string) {
    if (!window.confirm('Are you sure you want to delete this owner?')) return;
    try {
      const res = await fetch(`/api/properties/${propertyId}/contacts/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete contact');
      setOwners((prev) => prev.filter((o) => o.id !== id));
    } catch (err) {
      console.error('Error deleting contact:', err);
      alert('Failed to delete contact. Please try again.');
    }
  }

  /* Open edit modal */
  function openEditModal(owner: PropertyOwner) {
    setEditingOwner(owner);
  }

  return (
    <div className="space-y-4">
      {/* ==================== Owners Section ==================== */}
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-800">Owners</h3>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          New
        </button>
      </div>

      {/* Table */}
      <TableWrapper>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Phone</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {owners.map((owner) => (
                <tr
                  key={owner.id}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <Td>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-slate-400 shrink-0" />
                      <span className="text-sm text-slate-700">{owner.name}</span>
                    </div>
                  </Td>
                  <Td>{owner.email || '-'}</Td>
                  <Td className="whitespace-nowrap">
                    {owner.phone || '-'}
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(owner)}
                        className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit owner"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteOwner(owner.id)}
                        className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete owner"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>

          {owners.length === 0 && (
            <div className="py-16 text-center">
              <UfoIllustration />
              <p className="text-slate-500 font-medium">You have no owners added</p>
              <button
                onClick={() => setModalOpen(true)}
                className="text-sm text-blue-600 hover:text-blue-700 mt-1 hover:underline transition-colors"
              >
                Add and assign an owner to this property
              </button>
            </div>
          )}
      </TableWrapper>

      {/* Add Owner Modal */}
      <AddOwnerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleAddOwner}
      />

      {/* Edit Owner Modal */}
      <AddOwnerModal
        isOpen={!!editingOwner}
        onClose={() => setEditingOwner(null)}
        onSave={handleEditOwner}
        initialData={editingOwner}
      />
    </div>
  );
}
