'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
        <AlertTriangle className="w-8 h-8 text-red-600" />
      </div>
      <h2 className="text-lg font-semibold text-slate-800 mb-1">
        Something went wrong
      </h2>
      <p className="text-sm text-slate-500 max-w-sm mb-6">
        An unexpected error occurred. Please try again or contact support if the
        problem persists.
      </p>
      <button
        onClick={reset}
        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Try again
      </button>
    </div>
  );
}
