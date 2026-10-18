import {
  FileText,
  PieChart,
  Building2,
  Receipt,
  TrendingUp,
  BookOpen,
  AlertCircle,
  ArrowUpDown,
  DollarSign,
  Clock,
  Car,
  CreditCard,
  Bell,
  Users,
  Percent,
  Calendar,
  Wrench,
  Contact,
} from 'lucide-react';

/* ------------------------------------------------------------------ Types */

export interface ReportDef {
  slug: string;
  title: string;
  description: string;
  icon: React.ElementType;
  section: ReportSection;
  sectionColor: string;
  sectionTextColor: string;
  badge?: string;
}

export type ReportSection =
  | 'ACCOUNTING'
  | 'RENT PAYMENTS'
  | 'EXPENSES'
  | 'PROPERTY MANAGEMENT';

/* ------------------------------------------------------------------ Data */

export const REPORTS: ReportDef[] = [
  /* ---- ACCOUNTING ---- */
  {
    slug: 'income-expense-statement',
    title: 'Income Expense Statement',
    description:
      'This is a profit and loss report that shows a complete breakdown of all of your income and expenses over a specified time period.',
    icon: FileText,
    section: 'ACCOUNTING',
    sectionColor: 'bg-blue-500',
    sectionTextColor: 'text-white',
  },
  {
    slug: 'breakdown-statement',
    title: 'Breakdown Statement',
    description:
      'This report shows the income and expenses assigned to each property grouped.',
    icon: PieChart,
    section: 'ACCOUNTING',
    sectionColor: 'bg-blue-500',
    sectionTextColor: 'text-white',
  },
  {
    slug: 'property-income-expense-summary',
    title: 'Property Income & Expense Summary',
    description:
      'This is a profit and loss report that groups multi-units and displays your income & expenses by category.',
    icon: Building2,
    section: 'ACCOUNTING',
    sectionColor: 'bg-blue-500',
    sectionTextColor: 'text-white',
  },
  {
    slug: 'account-transactions',
    title: 'Account Transactions',
    description:
      'This report shows details of income & expenses (incl. running balance) assigned to each property.',
    icon: Receipt,
    section: 'ACCOUNTING',
    sectionColor: 'bg-blue-500',
    sectionTextColor: 'text-white',
  },
  {
    slug: 'pl-summary',
    title: 'P&L Summary',
    description:
      'This report shows a one line summary of the total income and expense assigned to a property.',
    icon: TrendingUp,
    section: 'ACCOUNTING',
    sectionColor: 'bg-blue-500',
    sectionTextColor: 'text-white',
  },
  /* ---- RENT PAYMENTS ---- */
  {
    slug: 'rent-ledger',
    title: 'Rent Ledger',
    description:
      'Provides a complete list of payments due versus payments logged over a specified time period. Unlike other reports which are cash basis, this report is generated on accrual basis.',
    icon: BookOpen,
    section: 'RENT PAYMENTS',
    sectionColor: 'bg-emerald-500',
    sectionTextColor: 'text-white',
  },
  {
    slug: 'overdue-rent-payments',
    title: 'Overdue Rent Payments',
    description:
      'This report shows a list of all overdue rent payments and late fees in your selected time period.',
    icon: AlertCircle,
    section: 'RENT PAYMENTS',
    sectionColor: 'bg-emerald-500',
    sectionTextColor: 'text-white',
  },
  {
    slug: 'rent-payment-difference',
    title: 'Rent Payment Difference',
    description:
      'View a summary of missed and overdue rent payments to spot income transaction discrepancies.',
    icon: ArrowUpDown,
    section: 'RENT PAYMENTS',
    sectionColor: 'bg-emerald-500',
    sectionTextColor: 'text-white',
  },
  {
    slug: 'rent-changes',
    title: 'Rent Changes',
    description:
      'This report shows all past and scheduled changes to rent amounts for the selected properties.',
    icon: DollarSign,
    section: 'RENT PAYMENTS',
    sectionColor: 'bg-emerald-500',
    sectionTextColor: 'text-white',
  },

  /* ---- EXPENSES ---- */
  {
    slug: 'overdue-upcoming-expenses',
    title: 'Overdue & Upcoming Expenses',
    description:
      'This report shows a list of unpaid expenses in your selected time period.',
    icon: Clock,
    section: 'EXPENSES',
    sectionColor: 'bg-amber-500',
    sectionTextColor: 'text-white',
  },
  {
    slug: 'mileage',
    title: 'Mileage',
    description:
      'Displays a summary of all mileage for the properties selected.',
    icon: Car,
    section: 'EXPENSES',
    sectionColor: 'bg-amber-500',
    sectionTextColor: 'text-white',
  },
  {
    slug: 'supplier-expenses',
    title: 'Supplier Expenses',
    description:
      'View a list of your suppliers and a breakdown of the expenses assigned to them over a specified time period.',
    icon: CreditCard,
    section: 'EXPENSES',
    sectionColor: 'bg-amber-500',
    sectionTextColor: 'text-white',
  },

  /* ---- PROPERTY MANAGEMENT ---- */
  {
    slug: 'reminders',
    title: 'Reminders',
    description:
      'Displays a summary of all reminders for the specified period.',
    icon: Bell,
    section: 'PROPERTY MANAGEMENT',
    sectionColor: 'bg-red-500',
    sectionTextColor: 'text-white',
  },
  {
    slug: 'tenant-ledger',
    title: 'Tenant Ledger',
    description:
      'Provides a complete list of payments due vs payments logged for a specific tenant.',
    icon: Users,
    section: 'PROPERTY MANAGEMENT',
    sectionColor: 'bg-red-500',
    sectionTextColor: 'text-white',
  },
  {
    slug: 'occupancy',
    title: 'Occupancy',
    description:
      'Provides an occupancy summary for the specified period.',
    icon: Percent,
    section: 'PROPERTY MANAGEMENT',
    sectionColor: 'bg-red-500',
    sectionTextColor: 'text-white',
  },
  {
    slug: 'rent-roll',
    title: 'Rent Roll',
    description:
      'Display a summary of your expected rental income on a given date.',
    icon: DollarSign,
    section: 'PROPERTY MANAGEMENT',
    sectionColor: 'bg-red-500',
    sectionTextColor: 'text-white',
  },
  {
    slug: 'lease-expiry',
    title: 'Lease Expiry',
    description:
      'Display a summary of all the leases expiring within a selected time period and their end dates.',
    icon: Calendar,
    section: 'PROPERTY MANAGEMENT',
    sectionColor: 'bg-red-500',
    sectionTextColor: 'text-white',
  },
  {
    slug: 'maintenance-report',
    title: 'Maintenance',
    description:
      'Displays a summary of all maintenance requests for the properties selected.',
    icon: Wrench,
    section: 'PROPERTY MANAGEMENT',
    sectionColor: 'bg-red-500',
    sectionTextColor: 'text-white',
  },
  {
    slug: 'property-directory',
    title: 'Property Directory',
    description: 'List of properties and details.',
    icon: Building2,
    section: 'PROPERTY MANAGEMENT',
    sectionColor: 'bg-red-500',
    sectionTextColor: 'text-white',
  },
  {
    slug: 'supplier-directory',
    title: 'Supplier Directory',
    description: 'List of suppliers and their contact details.',
    icon: Contact,
    section: 'PROPERTY MANAGEMENT',
    sectionColor: 'bg-red-500',
    sectionTextColor: 'text-white',
  },
];

/* ------------------------------------------------------------------ Helpers */

export function getReportBySlug(slug: string): ReportDef | undefined {
  return REPORTS.find((r) => r.slug === slug);
}

export function getReportsBySection(section: ReportSection): ReportDef[] {
  return REPORTS.filter((r) => r.section === section);
}

export const REPORT_SECTIONS_ORDER: {
  title: ReportSection;
  circleBg: string;
  circleText: string;
}[] = [
  { title: 'ACCOUNTING', circleBg: 'bg-blue-500', circleText: 'text-white' },
  { title: 'RENT PAYMENTS', circleBg: 'bg-emerald-500', circleText: 'text-white' },
  { title: 'EXPENSES', circleBg: 'bg-amber-500', circleText: 'text-white' },
  { title: 'PROPERTY MANAGEMENT', circleBg: 'bg-red-500', circleText: 'text-white' },
];

/* ---------------------------------------------- Report Settings (localStorage) */

const REPORT_SETTINGS_KEY = 'rentahub-report-settings';

export interface ReportSettings {
  defaultDateRange: string;
  defaultPropertyId: string;
}

const DEFAULT_REPORT_SETTINGS: ReportSettings = {
  defaultDateRange: 'this-year',
  defaultPropertyId: 'all',
};

export function loadReportSettings(): ReportSettings {
  if (typeof window === 'undefined') return DEFAULT_REPORT_SETTINGS;
  try {
    const raw = localStorage.getItem(REPORT_SETTINGS_KEY);
    if (!raw) return DEFAULT_REPORT_SETTINGS;
    return { ...DEFAULT_REPORT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_REPORT_SETTINGS;
  }
}

export function saveReportSettings(settings: ReportSettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(REPORT_SETTINGS_KEY, JSON.stringify(settings));
}

/** Returns { startDate, endDate } strings (YYYY-MM-DD) based on saved report settings. */
export function getReportDefaultDates(): { startDate: string; endDate: string } {
  const settings = loadReportSettings();
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const today = `${yyyy}-${mm}-${dd}`;

  switch (settings.defaultDateRange) {
    case 'last-30':
      return { startDate: offsetDate(now, -30), endDate: today };
    case 'last-90':
      return { startDate: offsetDate(now, -90), endDate: today };
    case 'this-year':
      return { startDate: `${yyyy}-01-01`, endDate: `${yyyy}-12-31` };
    case 'last-year':
      return { startDate: `${yyyy - 1}-01-01`, endDate: `${yyyy - 1}-12-31` };
    default:
      return { startDate: `${yyyy}-01-01`, endDate: `${yyyy}-12-31` };
  }
}

function offsetDate(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
