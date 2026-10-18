import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <h1 className="text-6xl font-bold text-slate-200 mb-2">404</h1>
      <h2 className="text-lg font-semibold text-slate-800 mb-1">
        Page not found
      </h2>
      <p className="text-sm text-slate-500 max-w-sm mb-6">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
