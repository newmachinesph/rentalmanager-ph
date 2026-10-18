'use client';

import { useId, cloneElement, isValidElement, type ReactElement } from 'react';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  required = false,
  error,
  children,
  className,
}: FormFieldProps) {
  const autoId = useId();

  // Clone the first child element to inject the generated id
  const enhancedChildren = isValidElement(children)
    ? cloneElement(children as ReactElement<{ id?: string }>, { id: autoId })
    : children;

  return (
    <div className={className}>
      <label htmlFor={autoId} className="block text-sm font-medium text-slate-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {enhancedChildren}
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}
