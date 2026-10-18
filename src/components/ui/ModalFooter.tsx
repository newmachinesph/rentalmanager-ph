'use client';

import { cn } from '@/lib/utils';

interface ModalFooterProps {
  onCancel: () => void;
  onSubmit?: () => void;
  cancelLabel?: string;
  submitLabel?: string;
  submitVariant?: 'primary' | 'danger';
  submitType?: 'button' | 'submit';
  submitDisabled?: boolean;
}

export function ModalFooter({
  onCancel,
  onSubmit,
  cancelLabel = 'Cancel',
  submitLabel = 'Save',
  submitVariant = 'primary',
  submitType = 'button',
  submitDisabled = false,
}: ModalFooterProps) {
  return (
    <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200">
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
      >
        {cancelLabel}
      </button>
      <button
        type={submitType}
        onClick={submitType === 'button' ? onSubmit : undefined}
        disabled={submitDisabled}
        className={cn(
          'rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors',
          submitVariant === 'danger'
            ? 'bg-red-600 hover:bg-red-700'
            : 'bg-blue-600 hover:bg-blue-700',
          submitDisabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {submitLabel}
      </button>
    </div>
  );
}
