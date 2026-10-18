'use client';

import { useState, useRef, useCallback } from 'react';
import { ChevronDown, Download, ExternalLink, Printer } from 'lucide-react';
import { useClickOutside } from '@/lib/hooks';

/* ------------------------------------------------------------------ helpers */

/** Slugify a report title for filenames, e.g. "Rent Roll" → "rent-roll" */
function slugify(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/** Read the first <table> inside the report content area and return { headers, rows } */
function extractTableData(): { headers: string[]; rows: string[][] } | null {
  // Look for tables inside the report layout (skip the filters area)
  const tables = document.querySelectorAll('table');
  if (tables.length === 0) return null;

  // Use the last/main table (some reports may have filter elements that look like tables)
  const table = tables[tables.length - 1];

  const headers: string[] = [];
  const headerCells = table.querySelectorAll('thead th');
  headerCells.forEach((th) => {
    headers.push((th.textContent || '').trim());
  });

  const rows: string[][] = [];
  const bodyRows = table.querySelectorAll('tbody tr');
  bodyRows.forEach((tr) => {
    const cells: string[] = [];
    tr.querySelectorAll('td').forEach((td) => {
      cells.push((td.textContent || '').trim());
    });
    if (cells.length > 0) rows.push(cells);
  });

  if (headers.length === 0 && rows.length === 0) return null;
  return { headers, rows };
}

/** Escape a CSV cell value (quote if it contains comma, quote, or newline) */
function escapeCsvCell(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/* ------------------------------------------------------------------ CSV */

function downloadCSV(reportTitle: string) {
  const data = extractTableData();
  if (!data || (data.headers.length === 0 && data.rows.length === 0)) {
    alert('No table data found to export.');
    return;
  }

  const lines: string[] = [];
  if (data.headers.length > 0) {
    lines.push(data.headers.map(escapeCsvCell).join(','));
  }
  for (const row of data.rows) {
    lines.push(row.map(escapeCsvCell).join(','));
  }

  const csvContent = lines.join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${slugify(reportTitle)}-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/* ------------------------------------------------------------------ Org */

interface OrgInfo {
  companyName: string;
  companyAddress: string;
  companyTin: string;
  orgPhone: string;
  ownerEmail: string;
}

async function fetchOrgInfo(): Promise<OrgInfo> {
  try {
    const res = await fetch('/api/settings/general');
    if (res.ok) {
      const data = await res.json();
      return {
        companyName: data.companyName || '',
        companyAddress: data.companyAddress || data.orgAddress || '',
        companyTin: data.companyTin || '',
        orgPhone: data.orgPhone || '',
        ownerEmail: data.ownerEmail || '',
      };
    }
  } catch { /* ignore */ }
  return { companyName: '', companyAddress: '', companyTin: '', orgPhone: '', ownerEmail: '' };
}

/* ------------------------------------------------------------------ PDF */

async function downloadPDF(reportTitle: string) {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const data = extractTableData();
  if (!data || (data.headers.length === 0 && data.rows.length === 0)) {
    alert('No table data found to export.');
    return;
  }

  const org = await fetchOrgInfo();

  const doc = new jsPDF({
    orientation: data.headers.length > 6 ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 14;

  // ---- Company letterhead ----
  if (org.companyName) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(org.companyName, pageWidth / 2, y, { align: 'center' });
    y += 5;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80);

    if (org.companyAddress) {
      doc.text(org.companyAddress, pageWidth / 2, y, { align: 'center' });
      y += 4;
    }

    const contactParts: string[] = [];
    if (org.orgPhone) contactParts.push(org.orgPhone);
    if (org.ownerEmail) contactParts.push(org.ownerEmail);
    if (org.companyTin) contactParts.push(`TIN: ${org.companyTin}`);
    if (contactParts.length > 0) {
      doc.text(contactParts.join('  |  '), pageWidth / 2, y, { align: 'center' });
      y += 4;
    }

    // Divider line
    doc.setDrawColor(200);
    doc.setLineWidth(0.3);
    doc.line(14, y, pageWidth - 14, y);
    y += 6;

    doc.setTextColor(0);
  }

  // ---- Report title ----
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(reportTitle, 14, y);
  y += 7;

  // ---- Date ----
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}`, 14, y);
  doc.setTextColor(0);
  y += 6;

  // Replace ₱ with PHP (Helvetica doesn't support the peso sign)
  const sanitize = (text: string) => text.replace(/₱/g, 'PHP ');
  const pdfHeaders = data.headers.map(sanitize);
  const pdfRows = data.rows.map((row) => row.map(sanitize));

  // Table
  autoTable(doc, {
    startY: y,
    head: [pdfHeaders],
    body: pdfRows,
    theme: 'grid',
    headStyles: {
      fillColor: [51, 65, 85],   // slate-700
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7.5,
      cellPadding: 2.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
    },
    styles: {
      lineColor: [226, 232, 240], // slate-200
      lineWidth: 0.2,
      overflow: 'linebreak',
    },
    margin: { left: 14, right: 14 },
    didParseCell: (hookData) => {
      // Right-align numeric cells (currency, numbers)
      const text = hookData.cell.text.join('');
      if (/^(PHP |₱|\$)/.test(text) || /^-?[\d,.]+%?$/.test(text)) {
        hookData.cell.styles.halign = 'right';
      }
    },
  });

  // Footer
  const footerName = org.companyName || 'RentaHub PH';
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(`${footerName} — ${reportTitle}`, 14, pageHeight - 8);
    doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.getWidth() - 14, pageHeight - 8, { align: 'right' });
  }

  doc.save(`${slugify(reportTitle)}-${new Date().toISOString().split('T')[0]}.pdf`);
}

/* ------------------------------------------------------------------ Print */

async function printReport(reportTitle: string) {
  const org = await fetchOrgInfo();
  const table = document.querySelector('table');
  if (!table) {
    alert('No table data found to print.');
    return;
  }

  const letterhead = org.companyName
    ? `<div style="text-align:center;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid #ccc">
        <div style="font-size:18px;font-weight:bold">${org.companyName}</div>
        ${org.companyAddress ? `<div style="font-size:11px;color:#555;margin-top:2px">${org.companyAddress}</div>` : ''}
        ${[org.orgPhone, org.ownerEmail, org.companyTin ? `TIN: ${org.companyTin}` : ''].filter(Boolean).join('  |  ')
          ? `<div style="font-size:10px;color:#777;margin-top:2px">${[org.orgPhone, org.ownerEmail, org.companyTin ? `TIN: ${org.companyTin}` : ''].filter(Boolean).join('  |  ')}</div>` : ''}
       </div>`
    : '';

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.write(`<!DOCTYPE html><html><head><title>${reportTitle}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
      h1 { font-size: 20px; margin: 0 0 4px; }
      .date { font-size: 11px; color: #888; margin-bottom: 16px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th { background: #334155; color: #fff; font-weight: 600; }
      th, td { padding: 6px 8px; border: 1px solid #e2e8f0; text-align: left; }
      tr:nth-child(even) td { background: #f8fafc; }
      @media print { body { margin: 0; } }
    </style></head><body>
    ${letterhead}
    <h1>${reportTitle}</h1>
    <div class="date">Generated: ${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
    ${table.outerHTML}
  </body></html>`);
  printWindow.document.close();
  printWindow.onload = () => { printWindow.print(); };
}

/* ------------------------------------------------------------------ Component */

const ACTIONS = [
  { label: 'Print', icon: Printer },
  { label: 'Download as PDF', icon: Download },
  { label: 'Download as CSV', icon: Download },
  { label: 'Open in tab', icon: ExternalLink },
] as const;

export function ActionsDropdown({ reportTitle }: { reportTitle: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close);

  function handleAction(label: string) {
    switch (label) {
      case 'Print':
        printReport(reportTitle);
        break;
      case 'Download as PDF':
        downloadPDF(reportTitle);
        break;
      case 'Download as CSV':
        downloadCSV(reportTitle);
        break;
      case 'Open in tab':
        window.open(window.location.href, '_blank');
        break;
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
      >
        Actions
        <ChevronDown className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-30 py-1">
          {ACTIONS.map(({ label, icon: Icon }) => (
            <button
              key={label}
              onClick={() => {
                handleAction(label);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Icon className="h-4 w-4 text-slate-400" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
