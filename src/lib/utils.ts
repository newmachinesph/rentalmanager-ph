import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export const INPUT_CLASS =
  'w-full px-3 py-2 text-sm rounded-md border border-slate-300 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-colors';

export function formatCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat('en', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  return `₱${formatted}`;
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    Paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    'Partially Paid': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    Unpaid: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    Overdue: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    Pending: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    Active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    Expired: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    Terminated: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    Vacant: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    Occupied: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    'Under Maintenance': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    Reserved: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    Open: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'In Progress': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    Completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    'On Hold': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    Cancelled: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    Low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    Medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    High: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    Urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };
  return colors[status] || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
}

export function calculatePenalty(
  amount: number,
  dueDate: string,
  ratePerMonth: number,
  paidDate?: string | null,
): { daysOverdue: number; penaltyAmount: number } {
  const due = new Date(dueDate);
  const end = paidDate ? new Date(paidDate) : new Date();
  const diffMs = end.getTime() - due.getTime();
  const daysOverdue = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  if (daysOverdue === 0) return { daysOverdue, penaltyAmount: 0 };

  // Contract clause 3.1: interest (rate%) + penalty (rate%) per month, prorated daily
  // Walk month-by-month from due date, using actual days in each month
  const combinedMonthlyRate = (ratePerMonth * 2) / 100; // e.g. 3% × 2 = 6%
  let penalty = 0;
  let cursor = new Date(due);
  let remainingDays = daysOverdue;

  while (remainingDays > 0) {
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const daysThisPeriod = Math.min(remainingDays, daysInMonth);
    const dailyRate = combinedMonthlyRate / daysInMonth;
    penalty += amount * dailyRate * daysThisPeriod;
    remainingDays -= daysThisPeriod;
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }

  return { daysOverdue, penaltyAmount: Math.round(penalty * 100) / 100 };
}

export function getMonthName(month: number): string {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return months[month] || '';
}
