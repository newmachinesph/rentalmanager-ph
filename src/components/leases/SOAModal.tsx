'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Printer, Loader2 } from 'lucide-react';
import { formatCurrency, formatDate, cn, INPUT_CLASS } from '@/lib/utils';

/* ------------------------------------------------------------------ Types */

interface SOATransaction {
  id: string;
  dueDate: string;
  category: string;
  amount: number;
  status: string;
  paidDate: string | null;
  paymentMethod: string | null;
  referenceNo: string;
  penalty: number;
  daysOverdue: number;
}

interface SOAData {
  lease: {
    id: string;
    startDate: string;
    endDate: string;
    monthlyRent: number;
    securityDeposit: number;
    advancePayment: number;
    paymentDueDay: number;
    status: string;
  };
  property: {
    id: string;
    name: string;
    address: string;
    city: string;
    province: string;
  };
  unit: { id: string; name: string } | null;
  tenant: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  transactions: SOATransaction[];
  summary: {
    totalCharges: number;
    totalPaid: number;
    totalPartial: number;
    totalPenalty: number;
    outstandingBalance: number;
  };
}

/* ------------------------------------------------------------------ Props */

interface SOAModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaseId: string;
}

/* ------------------------------------------------------------------ Status colors */

const STATUS_COLORS: Record<string, string> = {
  Paid: 'text-emerald-700 bg-emerald-50',
  Pending: 'text-amber-700 bg-amber-50',
  Overdue: 'text-red-700 bg-red-50',
  'Partially Paid': 'text-blue-700 bg-blue-50',
  Unpaid: 'text-slate-700 bg-slate-100',
};

/* ------------------------------------------------------------------ Shared th style */

const TH_STYLE: React.CSSProperties = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  padding: '8px 10px',
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#64748b',
  fontWeight: 600,
  textAlign: 'left',
};

const TD_STYLE: React.CSSProperties = {
  border: '1px solid #e2e8f0',
  padding: '7px 10px',
  fontSize: 11,
};

/* ================================================================ Component */

export function SOAModal({ isOpen, onClose, leaseId }: SOAModalProps) {
  const [data, setData] = useState<SOAData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  const fetchSOA = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ leaseId });
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);

      const res = await fetch(`/api/soa?${params}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to fetch SOA');
      }
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [leaseId, fromDate, toDate]);

  useEffect(() => {
    if (isOpen && leaseId) fetchSOA();
  }, [isOpen, leaseId, fetchSOA]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  function handlePrint() {
    if (!printRef.current) return;
    const printContent = printRef.current.innerHTML;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Statement of Account</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1e293b; padding: 32px; font-size: 12px; }
          .soa-header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #0f2847; padding-bottom: 16px; }
          .soa-header h1 { font-size: 20px; font-weight: 700; color: #0f2847; margin-bottom: 4px; }
          .soa-header p { font-size: 11px; color: #64748b; }
          .soa-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
          .soa-info-box { border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; }
          .soa-info-box h3 { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 8px; font-weight: 600; }
          .soa-info-row { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 3px; }
          .soa-info-label { color: #64748b; }
          .soa-info-value { font-weight: 500; color: #1e293b; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px 10px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 600; text-align: left; }
          th.right { text-align: right; }
          td { border: 1px solid #e2e8f0; padding: 7px 10px; font-size: 11px; }
          td.right { text-align: right; }
          .status { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; }
          .status-Paid { background: #ecfdf5; color: #047857; }
          .status-Pending { background: #fffbeb; color: #b45309; }
          .status-Overdue { background: #fef2f2; color: #b91c1c; }
          .status-Unpaid { background: #f1f5f9; color: #475569; }
          .summary-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 20px; }
          .summary-box { border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; text-align: center; }
          .summary-box .value { font-size: 16px; font-weight: 700; margin-bottom: 2px; }
          .summary-box .label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; }
          .summary-box.outstanding { border-color: #fca5a5; background: #fef2f2; }
          .summary-box.outstanding .value { color: #dc2626; }
          .summary-box.paid .value { color: #059669; }
          .footer { text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; }
          @media print { body { padding: 16px; } }
        </style>
      </head>
      <body>${printContent}</body>
      </html>
    `);
    win.document.close();
    win.print();
  }

  if (!isOpen) return null;

  const today = new Date().toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-5xl max-h-[90vh] rounded-lg bg-white shadow-lg flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <h2 className="text-lg font-semibold text-slate-800">
            Statement of Account
          </h2>
          <div className="flex items-center gap-2">
            {data && (
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-blue-600 border border-blue-200 hover:bg-blue-50 transition-colors"
              >
                <Printer className="h-4 w-4" />
                Print
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Date filters */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-100 bg-slate-50 shrink-0">
          <span className="text-sm text-slate-500 font-medium">Period:</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className={cn(INPUT_CLASS, 'w-auto')}
            placeholder="From"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className={cn(INPUT_CLASS, 'w-auto')}
            placeholder="To"
          />
          {(fromDate || toDate) && (
            <button
              onClick={() => { setFromDate(''); setToDate(''); }}
              className="text-xs text-blue-500 hover:text-blue-700"
            >
              Clear
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              <span className="ml-2 text-sm text-slate-500">Loading SOA...</span>
            </div>
          )}

          {error && (
            <div className="text-center py-20">
              <p className="text-sm text-red-500">{error}</p>
              <button
                onClick={fetchSOA}
                className="mt-2 text-sm text-blue-500 hover:underline"
              >
                Retry
              </button>
            </div>
          )}

          {data && !loading && (
            <div ref={printRef}>
              {/* Printable SOA content */}
              <div className="soa-header" style={{ textAlign: 'center', marginBottom: 24, borderBottom: '2px solid #0f2847', paddingBottom: 16 }}>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f2847', marginBottom: 4 }}>
                  STATEMENT OF ACCOUNT
                </h1>
                <p style={{ fontSize: 11, color: '#64748b' }}>
                  {data.property.name} — {data.property.address}, {data.property.city}, {data.property.province}
                </p>
                <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                  Generated on {today}
                </p>
              </div>

              {/* Info Grid */}
              <div className="soa-info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                {/* Tenant Info */}
                <div className="soa-info-box" style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: 12 }}>
                  <h3 style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: 8, fontWeight: 600 }}>
                    Tenant Information
                  </h3>
                  <div style={{ fontSize: 11, marginBottom: 3 }}>
                    <span style={{ color: '#64748b' }}>Name: </span>
                    <span style={{ fontWeight: 500 }}>{data.tenant.firstName} {data.tenant.lastName}</span>
                  </div>
                  <div style={{ fontSize: 11, marginBottom: 3 }}>
                    <span style={{ color: '#64748b' }}>Email: </span>
                    <span style={{ fontWeight: 500 }}>{data.tenant.email}</span>
                  </div>
                  <div style={{ fontSize: 11, marginBottom: 3 }}>
                    <span style={{ color: '#64748b' }}>Phone: </span>
                    <span style={{ fontWeight: 500 }}>{data.tenant.phone}</span>
                  </div>
                  <div style={{ fontSize: 11 }}>
                    <span style={{ color: '#64748b' }}>Unit: </span>
                    <span style={{ fontWeight: 500 }}>{data.unit?.name ?? 'N/A'}</span>
                  </div>
                </div>

                {/* Lease Info */}
                <div className="soa-info-box" style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: 12 }}>
                  <h3 style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: 8, fontWeight: 600 }}>
                    Lease Details
                  </h3>
                  <div style={{ fontSize: 11, marginBottom: 3 }}>
                    <span style={{ color: '#64748b' }}>Period: </span>
                    <span style={{ fontWeight: 500 }}>{formatDate(data.lease.startDate)} — {formatDate(data.lease.endDate)}</span>
                  </div>
                  <div style={{ fontSize: 11, marginBottom: 3 }}>
                    <span style={{ color: '#64748b' }}>Monthly Rent: </span>
                    <span style={{ fontWeight: 500 }}>{formatCurrency(data.lease.monthlyRent)}</span>
                  </div>
                  <div style={{ fontSize: 11, marginBottom: 3 }}>
                    <span style={{ color: '#64748b' }}>Security Deposit: </span>
                    <span style={{ fontWeight: 500 }}>{formatCurrency(data.lease.securityDeposit)}</span>
                  </div>
                  <div style={{ fontSize: 11 }}>
                    <span style={{ color: '#64748b' }}>Advance Payment: </span>
                    <span style={{ fontWeight: 500 }}>{formatCurrency(data.lease.advancePayment)}</span>
                  </div>
                </div>
              </div>

              {/* Summary boxes */}
              <div className="summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>
                    {formatCurrency(data.summary.totalCharges)}
                  </div>
                  <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>
                    Total Charges
                  </div>
                </div>
                <div className="paid" style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#059669', marginBottom: 2 }}>
                    {formatCurrency(data.summary.totalPaid)}
                  </div>
                  <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>
                    Total Paid
                  </div>
                </div>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#3b82f6', marginBottom: 2 }}>
                    {data.transactions.length}
                  </div>
                  <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>
                    Transactions
                  </div>
                </div>
                <div style={{ border: '1px solid #f59e0b', borderRadius: 6, padding: 12, textAlign: 'center', background: '#fffbeb' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#d97706', marginBottom: 2 }}>
                    {formatCurrency(data.summary.totalPenalty)}
                  </div>
                  <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>
                    Total Penalty
                  </div>
                </div>
                <div className="outstanding" style={{ border: '1px solid #fca5a5', borderRadius: 6, padding: 12, textAlign: 'center', background: '#fef2f2' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#dc2626', marginBottom: 2 }}>
                    {formatCurrency(data.summary.outstandingBalance)}
                  </div>
                  <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>
                    Outstanding
                  </div>
                </div>
              </div>

              {/* Transactions table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
                <thead>
                  <tr>
                    <th style={TH_STYLE}>Due Date</th>
                    <th style={TH_STYLE}>Category</th>
                    <th style={TH_STYLE}>Reference</th>
                    <th style={{ ...TH_STYLE, textAlign: 'right' }}>Amount</th>
                    <th style={{ ...TH_STYLE, textAlign: 'right' }}>Penalty</th>
                    <th style={TH_STYLE}>Status</th>
                    <th style={TH_STYLE}>Paid Date</th>
                    <th style={TH_STYLE}>Method</th>
                  </tr>
                </thead>
                <tbody>
                  {data.transactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ ...TD_STYLE, padding: '20px 10px', textAlign: 'center', color: '#94a3b8' }}>
                        No transactions found for the selected period.
                      </td>
                    </tr>
                  ) : (
                    data.transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td style={TD_STYLE}>
                          {formatDate(tx.dueDate)}
                        </td>
                        <td style={TD_STYLE}>
                          {tx.category}
                        </td>
                        <td style={{ ...TD_STYLE, color: '#64748b' }}>
                          {tx.referenceNo || '—'}
                        </td>
                        <td style={{ ...TD_STYLE, textAlign: 'right', fontWeight: 600 }}>
                          {formatCurrency(tx.amount)}
                        </td>
                        <td style={{ ...TD_STYLE, textAlign: 'right', color: tx.penalty > 0 ? '#d97706' : '#94a3b8' }}>
                          {tx.penalty > 0 ? formatCurrency(tx.penalty) : '—'}
                          {tx.daysOverdue > 0 && (
                            <div style={{ fontSize: 9, color: '#94a3b8' }}>
                              {tx.daysOverdue}d late
                            </div>
                          )}
                        </td>
                        <td style={TD_STYLE}>
                          <span
                            className={cn('status', `status-${tx.status.replace(/\s/g, '')}`)}
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontSize: 10,
                              fontWeight: 600,
                              ...(tx.status === 'Paid' ? { background: '#ecfdf5', color: '#047857' } :
                                tx.status === 'Overdue' ? { background: '#fef2f2', color: '#b91c1c' } :
                                tx.status === 'Pending' ? { background: '#fffbeb', color: '#b45309' } :
                                { background: '#f1f5f9', color: '#475569' }),
                            }}
                          >
                            {tx.status}
                          </span>
                        </td>
                        <td style={{ ...TD_STYLE, color: '#64748b' }}>
                          {tx.paidDate ? formatDate(tx.paidDate) : '—'}
                        </td>
                        <td style={{ ...TD_STYLE, color: '#64748b' }}>
                          {tx.paymentMethod || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Running balance */}
              {data.transactions.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
                  <div style={{ width: 300 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '4px 0', borderBottom: '1px solid #e2e8f0' }}>
                      <span style={{ color: '#64748b' }}>Total Charges:</span>
                      <span style={{ fontWeight: 500 }}>{formatCurrency(data.summary.totalCharges)}</span>
                    </div>
                    {data.summary.totalPenalty > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '4px 0', borderBottom: '1px solid #e2e8f0' }}>
                        <span style={{ color: '#d97706' }}>Total Penalty (interest + penalty/mo):</span>
                        <span style={{ fontWeight: 500, color: '#d97706' }}>{formatCurrency(data.summary.totalPenalty)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '4px 0', borderBottom: '1px solid #e2e8f0' }}>
                      <span style={{ color: '#059669' }}>Total Paid:</span>
                      <span style={{ fontWeight: 500, color: '#059669' }}>({formatCurrency(data.summary.totalPaid)})</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '8px 0', fontWeight: 700, borderTop: '2px solid #1e293b', marginTop: 4 }}>
                      <span>Outstanding Balance:</span>
                      <span style={{ color: data.summary.outstandingBalance > 0 ? '#dc2626' : '#059669' }}>
                        {formatCurrency(data.summary.outstandingBalance)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="footer" style={{ textAlign: 'center', marginTop: 32, paddingTop: 16, borderTop: '1px solid #e2e8f0', fontSize: 10, color: '#94a3b8' }}>
                This is a system-generated Statement of Account. For questions, please contact the property management office.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
