'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { FileText, Plus, Search, X, Upload, Trash2, Loader2 } from 'lucide-react';
import { cn, formatDate, INPUT_CLASS } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { ModalFooter } from '@/components/ui/ModalFooter';
import { FormField } from '@/components/ui/FormField';
import { Th } from '@/components/ui/Th';
import { TableWrapper } from '@/components/ui/TableWrapper';
import { Td } from '@/components/ui/Td';
import { EmptyState } from '@/components/ui/EmptyState';
import { useUpload } from '@/hooks/useUpload';
import type { OrgDocument } from '@/lib/types';

/* ================================================================== Upload Modal */

function UploadModal({
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleSave() {
    if (!file) return;
    onSave(description, file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  }

  /* Reset state when modal closes */
  useEffect(() => {
    if (!isOpen) {
      setDescription('');
      setFile(null);
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload document">
      <div className="space-y-4">
        {/* Drop zone */}
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
            disabled={isUploading}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
          >
            Browse files
          </button>
          <p className="text-xs text-slate-400 mt-3">
            Supported formats: PDF, DOC, DOCX, JPG, PNG
          </p>
        </div>

        {/* Description */}
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

        {/* Footer */}
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

/* ================================================================== PropertyDocumentsTab */

export function PropertyDocumentsTab({ propertyId, propertyName }: { propertyId: string; propertyName: string }) {
  const [documents, setDocuments] = useState<OrgDocument[]>([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { startUpload, isUploading } = useUpload(['Properties', propertyName, 'Documents']);

  /* Fetch documents from API */
  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/properties/${propertyId}/documents`);
      if (!res.ok) throw new Error('Failed to fetch documents');
      const data = await res.json();
      setDocuments(data);
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  /* Filter by search */
  const filteredDocuments = useMemo(() => {
    if (!search.trim()) return documents;
    const q = search.toLowerCase();
    return documents.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q)
    );
  }, [documents, search]);

  /* Save handler: upload via Google Drive, then persist to API */
  async function handleSave(description: string, file: File) {
    try {
      const uploadResult = await startUpload([file]);
      if (!uploadResult || uploadResult.length === 0) {
        throw new Error('Upload failed');
      }

      const uploadedFile = uploadResult[0];
      const url = uploadedFile.url;

      /* Persist document record via API */
      const res = await fetch(`/api/properties/${propertyId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: file.name,
          url,
          description,
        }),
      });

      if (!res.ok) throw new Error('Failed to save document record');

      const savedDoc: OrgDocument = await res.json();
      setDocuments((prev) => [savedDoc, ...prev]);
      setUploadOpen(false);
    } catch (err) {
      console.error('Error uploading document:', err);
      alert('Failed to upload document. Please try again.');
    }
  }

  /* Delete handler */
  async function handleDeleteDocument(id: string) {
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      setDeletingId(id);
      const res = await fetch(`/api/properties/${propertyId}/documents/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete document');

      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error('Error deleting document:', err);
      alert('Failed to delete document. Please try again.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Search + New button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents..."
            className="w-full rounded-md border border-slate-300 bg-slate-50 pl-3 pr-10 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
          />
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-9 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <button
          onClick={() => setUploadOpen(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" />
          New
        </button>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          <span className="ml-2 text-sm text-slate-500">Loading documents...</span>
        </div>
      ) : (
        <>
          {/* Table */}
          <TableWrapper>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <Th>File Name</Th>
                    <Th>Description</Th>
                    <Th>Date Uploaded</Th>
                    <Th>Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.map((doc) => (
                    <tr
                      key={doc.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <Td>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-slate-400 shrink-0" />
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
                      <Td>
                        {doc.description || '-'}
                      </Td>
                      <Td className="whitespace-nowrap">
                        {formatDate(doc.dateUploaded)}
                      </Td>
                      <Td>
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          disabled={deletingId === doc.id}
                          className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                          title="Delete document"
                        >
                          {deletingId === doc.id ? (
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

              {filteredDocuments.length === 0 && (
                <EmptyState
                  variant="inline"
                  icon={FileText}
                  title="No documents uploaded"
                  description="Upload your first document to get started"
                />
              )}
          </TableWrapper>
        </>
      )}

      {/* Upload Modal */}
      <UploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSave={handleSave}
        isUploading={isUploading}
      />
    </div>
  );
}
