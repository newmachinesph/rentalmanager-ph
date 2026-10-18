'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { ActionsDropdown } from './ActionsDropdown';
import type { ReportDef } from '@/lib/reportConfig';

interface ReportPageLayoutProps {
  report: ReportDef;
  children: React.ReactNode;
}

export function ReportPageLayout({ report, children }: ReportPageLayoutProps) {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm">
        <Link
          href="/reports"
          className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          Reports
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        <span className="text-slate-600">{report.title}</span>
        {report.badge && (
          <span className="ml-1 px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-semibold rounded-full uppercase">
            {report.badge}
          </span>
        )}
      </div>

      {/* Header: title + actions */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">{report.title}</h1>
        <ActionsDropdown reportTitle={report.title} />
      </div>

      {/* Content */}
      {children}
    </div>
  );
}
