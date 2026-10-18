'use client';

import { Trash2 } from 'lucide-react';

/* ================================================================== Component */

export function DeleteConfirmDialog({
  itemLabel,
  onConfirm,
  onCancel,
  title = 'Delete Record',
  message,
  confirmLabel = 'Delete',
}: {
  itemLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-red-100">
            <Trash2 className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">{title}</h3>
            <p className="text-sm text-slate-500">This action cannot be undone.</p>
          </div>
        </div>
        <p className="text-sm text-slate-600 mb-5">
          {message || (
            <>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-slate-800">{itemLabel}</span>? This record will be
              permanently removed.
            </>
          )}
        </p>
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
