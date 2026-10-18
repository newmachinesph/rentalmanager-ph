'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, FileText, Upload, ShieldCheck, Pencil, Trash2, Loader2 } from 'lucide-react';
import { cn, formatDate, INPUT_CLASS } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { ModalFooter } from '@/components/ui/ModalFooter';
import { FormField } from '@/components/ui/FormField';
import { Th } from '@/components/ui/Th';
import { TableWrapper } from '@/components/ui/TableWrapper';
import { Td } from '@/components/ui/Td';
import { EmptyState } from '@/components/ui/EmptyState';
import { useUpload } from '@/hooks/useUpload';
import type { OrgNote, OrgDocument } from '@/lib/types';

/* ================================================================== Add Note Modal */

function AddNoteModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  isSaving,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: Omit<OrgNote, 'id' | 'createdAt'>) => void;
  initialData?: OrgNote | null;
  isSaving: boolean;
}) {
  const [content, setContent] = useState('');
  const [date, setDate] = useState('');

  /* Sync form when initialData changes (open for edit vs. add) */
  const [prevInitialData, setPrevInitialData] = useState(initialData);
  if (initialData !== prevInitialData) {
    setPrevInitialData(initialData);
    if (initialData) {
      setContent(initialData.content);
      setDate(initialData.date);
    } else {
      setContent('');
      setDate('');
    }
  }

  function handleSave() {
    onSave({
      date: date || new Date().toISOString().split('T')[0],
      content,
    });
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit note' : 'Add note'}>
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

        <ModalFooter
          onCancel={onClose}
          onSubmit={handleSave}
          submitLabel={isSaving ? 'Saving...' : 'Save'}
          submitDisabled={!content.trim() || isSaving}
        />
      </div>
    </Modal>
  );
}

/* ================================================================== Insurance Drop Zone */

function InsuranceDropZone({
  file,
  onFileSelect,
  disabled,
}: {
  file: File | null;
  onFileSelect: (file: File) => void;
  disabled: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) onFileSelect(selected);
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 py-10 px-6 text-center">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        className="hidden"
        onChange={handleFileChange}
      />
      <Upload className="h-10 w-10 text-slate-400 mb-3" />
      {file ? (
        <p className="text-sm font-medium text-slate-700">{file.name}</p>
      ) : (
        <p className="text-sm font-medium text-slate-700">Drag your file here</p>
      )}
      <p className="text-xs text-slate-400 my-2">OR</p>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
      >
        Browse files
      </button>
      <p className="text-xs text-slate-400 mt-3">Supported formats: PDF, DOC, DOCX, JPG, PNG</p>
    </div>
  );
}

/* ================================================================== Upload Insurance Modal */

function UploadInsuranceModal({
  isOpen,
  onClose,
  onSave,
  isUploading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (description: string, file: File) => void;
  isUploading: boolean;
}) {
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);

  /* Reset state when modal closes */
  useEffect(() => {
    if (!isOpen) {
      setDescription('');
      setFile(null);
    }
  }, [isOpen]);

  function handleSave() {
    if (!file) return;
    onSave(description, file);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload insurance document">
      <div className="space-y-4">
        {/* Drop zone */}
        <InsuranceDropZone
          file={file}
          onFileSelect={setFile}
          disabled={isUploading}
        />

        <FormField label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className={cn(INPUT_CLASS, 'resize-none')}
            placeholder="Optional description..."
          />
        </FormField>

        {/* Upload progress indicator */}
        {isUploading && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Uploading file...</span>
          </div>
        )}

        <ModalFooter
          onCancel={onClose}
          onSubmit={handleSave}
          submitLabel={isUploading ? 'Uploading...' : 'Upload'}
          submitDisabled={!file || isUploading}
        />
      </div>
    </Modal>
  );
}

/* ================================================================== PropertyOtherTab */

export function PropertyOtherTab({ propertyId, propertyName }: { propertyId: string; propertyName: string }) {
  /* ---- Notes state ---- */
  const [notes, setNotes] = useState<OrgNote[]>([]);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<OrgNote | null>(null);
  const [notesLoading, setNotesLoading] = useState(true);
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteDeletingId, setNoteDeletingId] = useState<string | null>(null);

  /* ---- Insurance state ---- */
  const [insurance, setInsurance] = useState<OrgDocument[]>([]);
  const [insuranceModalOpen, setInsuranceModalOpen] = useState(false);
  const [insuranceLoading, setInsuranceLoading] = useState(true);
  const [insuranceDeletingId, setInsuranceDeletingId] = useState<string | null>(null);

  const { startUpload, isUploading } = useUpload(['Properties', propertyName, 'Insurance']);

  /* ================================================================== Fetchers */

  const fetchNotes = useCallback(async () => {
    try {
      setNotesLoading(true);
      const res = await fetch(`/api/properties/${propertyId}/notes`);
      if (!res.ok) throw new Error('Failed to fetch notes');
      const data = await res.json();
      setNotes(data);
    } catch (err) {
      console.error('Error fetching notes:', err);
    } finally {
      setNotesLoading(false);
    }
  }, [propertyId]);

  const fetchInsurance = useCallback(async () => {
    try {
      setInsuranceLoading(true);
      const res = await fetch(`/api/properties/${propertyId}/documents`);
      if (!res.ok) throw new Error('Failed to fetch insurance documents');
      const data = await res.json();
      /* Filter to insurance documents only (name or description contains "insurance") */
      const insuranceDocs = data.filter(
        (d: OrgDocument) =>
          d.name.toLowerCase().includes('insurance') ||
          d.description.toLowerCase().includes('insurance')
      );
      setInsurance(insuranceDocs);
    } catch (err) {
      console.error('Error fetching insurance documents:', err);
    } finally {
      setInsuranceLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchNotes();
    fetchInsurance();
  }, [fetchNotes, fetchInsurance]);

  /* ================================================================== Notes handlers */

  /* Add note */
  async function handleAddNote(data: Omit<OrgNote, 'id' | 'createdAt'>) {
    try {
      setNoteSaving(true);
      const res = await fetch(`/api/properties/${propertyId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create note');
      const savedNote: OrgNote = await res.json();
      setNotes((prev) => [savedNote, ...prev]);
      setNoteModalOpen(false);
    } catch (err) {
      console.error('Error creating note:', err);
      alert('Failed to save note. Please try again.');
    } finally {
      setNoteSaving(false);
    }
  }

  /* Edit note */
  async function handleEditNote(data: Omit<OrgNote, 'id' | 'createdAt'>) {
    if (!editingNote) return;
    try {
      setNoteSaving(true);
      const res = await fetch(`/api/properties/${propertyId}/notes/${editingNote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update note');
      const updatedNote: OrgNote = await res.json();
      setNotes((prev) =>
        prev.map((n) => (n.id === editingNote.id ? updatedNote : n))
      );
      setEditingNote(null);
    } catch (err) {
      console.error('Error updating note:', err);
      alert('Failed to update note. Please try again.');
    } finally {
      setNoteSaving(false);
    }
  }

  /* Delete note */
  async function handleDeleteNote(id: string) {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    try {
      setNoteDeletingId(id);
      const res = await fetch(`/api/properties/${propertyId}/notes/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete note');
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error('Error deleting note:', err);
      alert('Failed to delete note. Please try again.');
    } finally {
      setNoteDeletingId(null);
    }
  }

  /* ================================================================== Insurance handlers */

  /* Upload + persist insurance document */
  async function handleAddInsurance(description: string, file: File) {
    try {
      const uploadResult = await startUpload([file]);
      if (!uploadResult || uploadResult.length === 0) {
        throw new Error('Upload failed');
      }

      const uploadedFile = uploadResult[0];
      const url = uploadedFile.url;

      /* Persist document record via API — mark as insurance in name */
      const docName = file.name.toLowerCase().includes('insurance')
        ? file.name
        : `Insurance - ${file.name}`;

      const res = await fetch(`/api/properties/${propertyId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: docName,
          url,
          description: description || 'Insurance document',
        }),
      });

      if (!res.ok) throw new Error('Failed to save document record');

      const savedDoc: OrgDocument = await res.json();
      setInsurance((prev) => [savedDoc, ...prev]);
      setInsuranceModalOpen(false);
    } catch (err) {
      console.error('Error uploading insurance document:', err);
      alert('Failed to upload insurance document. Please try again.');
    }
  }

  /* Delete insurance document */
  async function handleDeleteInsurance(id: string) {
    if (!window.confirm('Are you sure you want to delete this insurance document?')) return;
    try {
      setInsuranceDeletingId(id);
      const res = await fetch(`/api/properties/${propertyId}/documents/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete document');
      setInsurance((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error('Error deleting insurance document:', err);
      alert('Failed to delete insurance document. Please try again.');
    } finally {
      setInsuranceDeletingId(null);
    }
  }

  return (
    <div className="space-y-8">
      {/* ==================== Notes Section ==================== */}
      <div className="space-y-4">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-800">Notes</h3>
          <button
            onClick={() => setNoteModalOpen(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            New
          </button>
        </div>

        {/* Notes Table */}
        {notesLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            <span className="ml-2 text-sm text-slate-500">Loading notes...</span>
          </div>
        ) : (
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
                            onClick={() => setEditingNote(note)}
                            className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Edit note"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            disabled={noteDeletingId === note.id}
                            className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                            title="Delete note"
                          >
                            {noteDeletingId === note.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
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
        )}
      </div>

      {/* ==================== Insurance Section ==================== */}
      <div className="space-y-4">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-800">Insurance</h3>
          <button
            onClick={() => setInsuranceModalOpen(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            <Upload className="h-4 w-4" />
            Upload
          </button>
        </div>

        {/* Insurance Table */}
        {insuranceLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            <span className="ml-2 text-sm text-slate-500">Loading insurance documents...</span>
          </div>
        ) : (
          <TableWrapper>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <Th>File Name</Th>
                    <Th>Date Uploaded</Th>
                    <Th>Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {insurance.map((doc) => (
                    <tr
                      key={doc.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <Td>
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-slate-400 shrink-0" />
                          {doc.url ? (
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline"
                            >
                              {doc.name}
                            </a>
                          ) : (
                            <span className="text-sm text-slate-700">{doc.name}</span>
                          )}
                        </div>
                      </Td>
                      <Td className="whitespace-nowrap">
                        {formatDate(doc.dateUploaded)}
                      </Td>
                      <Td>
                        <button
                          onClick={() => handleDeleteInsurance(doc.id)}
                          disabled={insuranceDeletingId === doc.id}
                          className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                          title="Delete insurance document"
                        >
                          {insuranceDeletingId === doc.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {insurance.length === 0 && (
                <EmptyState
                  variant="inline"
                  icon={ShieldCheck}
                  title="No insurance documents"
                  description="Upload insurance documents for this property"
                />
              )}
          </TableWrapper>
        )}
      </div>

      {/* Modals */}
      <AddNoteModal
        isOpen={noteModalOpen}
        onClose={() => setNoteModalOpen(false)}
        onSave={handleAddNote}
        isSaving={noteSaving}
      />
      <AddNoteModal
        isOpen={!!editingNote}
        onClose={() => setEditingNote(null)}
        onSave={handleEditNote}
        initialData={editingNote}
        isSaving={noteSaving}
      />
      <UploadInsuranceModal
        isOpen={insuranceModalOpen}
        onClose={() => setInsuranceModalOpen(false)}
        onSave={handleAddInsurance}
        isUploading={isUploading}
      />
    </div>
  );
}
