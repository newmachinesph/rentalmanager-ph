'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getReportBySlug } from '@/lib/reportConfig';
import { ReportPageLayout } from '@/components/reports/ReportPageLayout';
import { usePropertyStore } from '@/stores/propertyStore';
import { useIncomeStore } from '@/stores/incomeStore';
import { useExpenseStore } from '@/stores/expenseStore';
import { useLeaseStore } from '@/stores/leaseStore';
import { useTenantStore } from '@/stores/tenantStore';
import { useMaintenanceStore } from '@/stores/maintenanceStore';
import { Skeleton, TableSkeleton } from '@/components/ui/Skeleton';

/* ---- Report content components ---- */
import { IncomeExpenseStatement } from '@/components/reports/IncomeExpenseStatement';
import { BreakdownStatement } from '@/components/reports/BreakdownStatement';
import { PropertyIncomeExpenseSummary } from '@/components/reports/PropertyIncomeExpenseSummary';
import { AccountTransactions } from '@/components/reports/AccountTransactions';
import { PLSummary } from '@/components/reports/PLSummary';
import { RentLedger } from '@/components/reports/RentLedger';
import { OverdueRentPayments } from '@/components/reports/OverdueRentPayments';
import { RentPaymentDifference } from '@/components/reports/RentPaymentDifference';
import { RentChanges } from '@/components/reports/RentChanges';
import { OverdueUpcomingExpenses } from '@/components/reports/OverdueUpcomingExpenses';
import { MileageReport } from '@/components/reports/MileageReport';
import { SupplierExpenses } from '@/components/reports/SupplierExpenses';
import { RemindersReport } from '@/components/reports/RemindersReport';
import { TenantLedger } from '@/components/reports/TenantLedger';
import { OccupancyReport } from '@/components/reports/OccupancyReport';
import { RentRoll } from '@/components/reports/RentRoll';
import { LeaseExpiry } from '@/components/reports/LeaseExpiry';
import { MaintenanceReport } from '@/components/reports/MaintenanceReport';
import { PropertyDirectory } from '@/components/reports/PropertyDirectory';
import { SupplierDirectory } from '@/components/reports/SupplierDirectory';

/* ---- Slug → component mapping ---- */
const REPORT_COMPONENTS: Record<string, React.ComponentType> = {
  'income-expense-statement': IncomeExpenseStatement,
  'breakdown-statement': BreakdownStatement,
  'property-income-expense-summary': PropertyIncomeExpenseSummary,
  'account-transactions': AccountTransactions,
  'pl-summary': PLSummary,
  'rent-ledger': RentLedger,
  'overdue-rent-payments': OverdueRentPayments,
  'rent-payment-difference': RentPaymentDifference,
  'rent-changes': RentChanges,
  'overdue-upcoming-expenses': OverdueUpcomingExpenses,
  'mileage': MileageReport,
  'supplier-expenses': SupplierExpenses,
  'reminders': RemindersReport,
  'tenant-ledger': TenantLedger,
  'occupancy': OccupancyReport,
  'rent-roll': RentRoll,
  'lease-expiry': LeaseExpiry,
  'maintenance-report': MaintenanceReport,
  'property-directory': PropertyDirectory,
  'supplier-directory': SupplierDirectory,
};

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  /* Hydrate all stores so report components have data */
  const fetchProperties = usePropertyStore((s) => s.fetchProperties);
  const fetchIncome = useIncomeStore((s) => s.fetchRecords);
  const fetchExpenses = useExpenseStore((s) => s.fetchRecords);
  const fetchLeases = useLeaseStore((s) => s.fetchLeases);
  const fetchTenants = useTenantStore((s) => s.fetchTenants);
  const fetchMaintenance = useMaintenanceStore((s) => s.fetchRequests);
  useEffect(() => {
    fetchProperties();
    fetchIncome();
    fetchExpenses();
    fetchLeases();
    fetchTenants();
    fetchMaintenance();
  }, [fetchProperties, fetchIncome, fetchExpenses, fetchLeases, fetchTenants, fetchMaintenance]);

  const propertyLoading = usePropertyStore((s) => s.loading);
  const incomeLoading = useIncomeStore((s) => s.loading);
  const reportLoading = propertyLoading || incomeLoading;

  const report = getReportBySlug(slug);

  if (!report) {
    router.push('/reports');
    return null;
  }

  const ReportContent = REPORT_COMPONENTS[slug];

  if (reportLoading) {
    return (
      <ReportPageLayout report={report}>
        <div className="space-y-4">
          <div className="flex gap-3">
            <Skeleton variant="rectangular" className="h-10 w-40" />
            <Skeleton variant="rectangular" className="h-10 w-40" />
          </div>
          <TableSkeleton rows={8} cols={6} />
        </div>
      </ReportPageLayout>
    );
  }

  return (
    <ReportPageLayout report={report}>
      {ReportContent ? <ReportContent /> : null}
    </ReportPageLayout>
  );
}
