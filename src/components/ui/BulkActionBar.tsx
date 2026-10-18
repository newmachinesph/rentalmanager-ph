'use client';

import { useState } from 'react';
import { Trash2, X, Loader2 } from 'lucide-react';
import { DeleteConfirmDialog } from '@/components/organization/DeleteConfirmDialog';

export function BulkActionBar({
  count,
  onDelete,
  onClear,
  entityLabel = 'record',
}: {
  count: number;
  onDelete: () => Promise<void>;
  onClear: () => void;
  entityLabel?: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleConfirm() {
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  }

  if (count === 0) return null;

  const plural = count === 1 ? entityLabel : `${entityLabel}s`;

  return (
    <>
      <div className="sticky bottom-4 z-30 mx-auto w-fit animate-in slide-in-from-bottom-4 fade-in duration-200">
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2.5 shadow-lg">
          <span className="text-sm font-medium text-slate-700">
            {count} {plural} selected
          </span>
          <button
            onClick={() => setConfirming(true)}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {deleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            Delete
          </button>
          <button
            onClick={onClear}
            className="p-1 rounded text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Clear selection"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {confirming && (
        <DeleteConfirmDialog
          itemLabel={`${count} ${plural}`}
          title={`Delete ${count} ${plural}`}
          confirmLabel={deleting ? 'Deleting...' : `Delete ${count} ${plural}`}
          onConfirm={handleConfirm}
          onCancel={() => setConfirming(false)}
        />
      )}
    </>
  );
}
