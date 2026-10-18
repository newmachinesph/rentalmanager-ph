'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, FileText, Pencil, Trash2 } from 'lucide-react';
import { cn, formatDate, INPUT_CLASS } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { ModalFooter } from '@/components/ui/ModalFooter';
import { FormField } from '@/components/ui/FormField';
import { Th } from '@/components/ui/Th';
import { TableWrapper } from '@/components/ui/TableWrapper';
import { Td } from '@/components/ui/Td';
import { EmptyState } from '@/components/ui/EmptyState';
import type { OrgNote } from '@/lib/types';

/* ================================================================== Add Note Modal */

function AddNoteModal({
  isOpen,
  onClose,
  onSave,
  initial,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: Omit<OrgNote, 'id' | 'createdAt'>) => void | Promise<void>;
  initial?: OrgNote | null;
}) {
  const [content, setContent] = useState(initial?.content ?? '');
  const [date, setDate] = useState(initial?.date ?? '');

  async function handleSave() {
    await onSave({
      date: date || new Date().toISOString().split('T')[0],
      content,
    });
    // Reset form
    setContent('');
    setDate('');
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initial ? 'Edit note' : 'Add note'}>
      <div className="space-y-4">
        <FormField label="Note">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className={cn(INPUT_CLASS, 'resize-none')}
            placeholder="Write your note..."
          />
        </FormField>

        <FormField label="Date">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={INPUT_CLASS}
          />
        </FormField>

        <ModalFooter onCancel={onClose} onSubmit={handleSave} />
      </div>
    </Modal>
  );
}

/* ================================================================== OtherTab */

export function OtherTab() {
  const [notes, setNotes] = useState<OrgNote[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<OrgNote | null>(null);

  // Fetch notes from API on mount
  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch('/api/organization/notes');
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) {
        const mapped: OrgNote[] = data.map((n: { id: string; date: string; content: string; createdAt?: string }) => ({
          id: n.id,
          date: n.date,
          content: n.content,
          createdAt: n.createdAt || new Date().toISOString(),
        }));
        setNotes(mapped);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  /* Handlers */
  async function handleSaveNote(data: Omit<OrgNote, 'id' | 'createdAt'>) {
    try {
      if (editingNote) {
        const res = await fetch(`/api/organization/notes/${editingNote.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to update note');
        const updated = await res.json();
        setNotes((prev) =>
          prev.map((n) => n.id === editingNote.id ? { ...n, ...updated } : n)
        );
        setEditingNote(null);
      } else {
        const res = await fetch('/api/organization/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to create note');
        const created = await res.json();
        const newNote: OrgNote = {
          id: created.id,
          date: created.date,
          content: created.content,
          createdAt: created.createdAt || new Date().toISOString(),
        };
        setNotes((prev) => [newNote, ...prev]);
      }
    } catch (err) {
      console.error('Error saving note:', err);
      alert('Failed to save note. Please try again.');
    }
  }

  async function handleDeleteNote(id: string) {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    try {
      const res = await fetch(`/api/organization/notes/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete note');
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error('Error deleting note:', err);
      alert('Failed to delete note. Please try again.');
    }
  }

  function handleEditNote(note: OrgNote) {
    setEditingNote(note);
    setModalOpen(true);
  }

  return (
    <div className="space-y-4">
      {/* ==================== Notes Section ==================== */}
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-800">Notes</h3>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          New
        </button>
      </div>

      {/* Notes Table */}
      <TableWrapper>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <Th>Date</Th>
                <Th>Note</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {notes.map((note) => (
                <tr
                  key={note.id}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <Td className="whitespace-nowrap">
                    {formatDate(note.date)}
                  </Td>
                  <Td>{note.content}</Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditNote(note)}
                        className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        aria-label="Edit note"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        aria-label="Delete note"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>

          {notes.length === 0 && (
            <EmptyState
              variant="inline"
              icon={FileText}
              title="No notes"
              description="Add a note to keep track of important information"
            />
          )}
      </TableWrapper>

      {/* Add / Edit Note Modal */}
      <AddNoteModal
        key={editingNote?.id ?? 'new-note'}
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingNote(null); }}
        onSave={handleSaveNote}
        initial={editingNote}
      />
    </div>
  );
}
