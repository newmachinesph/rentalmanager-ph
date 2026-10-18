'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  CreditCard,
  Receipt,
} from 'lucide-react';
import { Pagination, usePagination } from '@/components/ui/Pagination';
import { useIncomeStore } from '@/stores/incomeStore';
import { useExpenseStore } from '@/stores/expenseStore';
import { useTenantStore } from '@/stores/tenantStore';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { TableWrapper } from '@/components/ui/TableWrapper';
import { Td } from '@/components/ui/Td';
import type { IncomeRecord, ExpenseRecord } from '@/lib/types';

/* ================================================================== Types */

type OverviewSubTab = 'Payments' | 'Expenses';
type ExpenseViewMode = 'expenses' | 'recurring';

interface OverviewTabProps {
  onAddPayment: () => void;
  onEditPayment: (record: IncomeRecord) => void;
  onDeletePayment: (id: string, label: string) => void;
  onAddExpense: () => void;
  onEditExpense: (record: ExpenseRecord) => void;
  onDeleteExpense: (id: string, label: string) => void;
}

/* ================================================================== Component */

export function OverviewTab({
  onAddPayment,
  onEditPayment,
  onDeletePayment,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
}: OverviewTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<OverviewSubTab>('Payments');

  return (
    <div className="space-y-4">
      {/* Sub-tab bar */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex gap-1" aria-label="Overview sub-tabs">
          {(['Payments', 'Expenses'] as OverviewSubTab[]).map((tab) => {
            const isActive = activeSubTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveSubTab(tab)}
                className={cn(
                  'whitespace-nowrap pb-3 px-4 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {tab}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sub-tab content */}
      {activeSubTab === 'Payments' && (
        <PaymentsSubTab
          onAdd={onAddPayment}
          onEdit={onEditPayment}
          onDelete={onDeletePayment}
        />
      )}
      {activeSubTab === 'Expenses' && (
        <ExpensesSubTab
          onAdd={onAddExpense}
          onEdit={onEditExpense}
          onDelete={onDeleteExpense}
        />
      )}
    </div>
  );
}

/* ================================================================== Payments Sub-Tab */

function PaymentsSubTab({
  onAdd,
  onEdit,
  onDelete,
}: {
  onAdd: () => void;
  onEdit: (record: IncomeRecord) => void;
  onDelete: (id: string, label: string) => void;
}) {
  const incomeRecords = useIncomeStore((s) => s.records);
  const tenants = useTenantStore((s) => s.tenants);

  const [searchQuery, setSearchQuery] = useState('');

  /* Lookup maps */
  const tenantMap = useMemo(() => {
    const map: Record<string, string> = {};
    tenants.forEach((t) => {
      map[t.id] = `${t.firstName} ${t.lastName}`;
    });
    return map;
  }, [tenants]);

  const getTenantName = (id: string | null) => (id && tenantMap[id]) || 'Unknown Tenant';

  /* Filter + search */
  const filteredRecords = useMemo(() => {
    let result = [...incomeRecords];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.category.toLowerCase().includes(q) ||
          r.notes.toLowerCase().includes(q) ||
          r.referenceNo.toLowerCase().includes(q)
      );
    }

    // Sort by due date descending
    result.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
    return result;
  }, [incomeRecords, searchQuery]);

  const {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedItems,
    onPageChange,
    onPageSizeChange,
  } = usePagination(filteredRecords, 10);

  return (
    <div className="space-y-4">
      {/* Search + Add button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search payments..."
            className="w-full rounded-md border border-slate-300 bg-slate-50 pl-3 pr-10 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
          />
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md h-[38px] px-4 text-sm font-medium transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" />
          New
        </button>
      </div>

      {/* Table */}
      <TableWrapper>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-3 px-5 text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                  Date
                </th>
                <th className="text-left py-3 px-5 text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                  Category
                </th>
                <th className="text-left py-3 px-5 text-[11px] uppercase tracking-wider font-semibold text-slate-400 hidden md:table-cell">
                  Notes
                </th>
                <th className="text-right py-3 px-5 text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                  Amount
                </th>
                <th className="text-right py-3 px-5 text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((record) => (
                <tr
                  key={record.id}
                  className="group border-b border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <Td className="text-slate-600 whitespace-nowrap">
                    {formatDate(record.dueDate)}
                  </Td>
                  <Td>
                    {record.category}
                  </Td>
                  <Td className="text-slate-600 hidden md:table-cell">
                    <span className="truncate block max-w-[250px]">
                      {record.notes || '-'}
                    </span>
                  </Td>
                  <Td className="text-right font-semibold text-slate-800 whitespace-nowrap">
                    {formatCurrency(record.amount)}
                  </Td>
                  <Td>
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEdit(record)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        aria-label="Edit payment"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() =>
                          onDelete(
                            record.id,
                            `${formatCurrency(record.amount)} payment from ${getTenantName(record.tenantId)}`
                          )
                        }
                        className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        aria-label="Delete payment"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>

          {paginatedItems.length === 0 && (
            <div className="py-16 text-center">
              <CreditCard className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No payments found</p>
              <p className="text-sm text-slate-400 mt-1">
                {searchQuery
                  ? 'Try adjusting your search'
                  : 'Get started by adding your first payment'}
              </p>
            </div>
          )}
      </TableWrapper>

      {/* Pagination */}
      {totalItems > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </div>
  );
}

/* ================================================================== Expenses Sub-Tab */

function ExpensesSubTab({
  onAdd,
  onEdit,
  onDelete,
}: {
  onAdd: () => void;
  onEdit: (record: ExpenseRecord) => void;
  onDelete: (id: string, label: string) => void;
}) {
  const expenseRecords = useExpenseStore((s) => s.records);

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ExpenseViewMode>('expenses');

  /* Filter + search (normal expenses) */
  const filteredRecords = useMemo(() => {
    let result = [...expenseRecords];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.description.toLowerCase().includes(q) ||
          r.vendor.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q)
      );
    }

    // Sort by date descending
    result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return result;
  }, [expenseRecords, searchQuery]);

  const {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedItems,
    onPageChange,
    onPageSizeChange,
  } = usePagination(filteredRecords, 10);

  /* Recurring expenses placeholder (no recurring data exists) */
  const recurringExpenses: ExpenseRecord[] = [];

  return (
    <div className="space-y-4">
      {/* Search + View toggle + Add button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search expenses..."
            className="w-full rounded-md border border-slate-300 bg-slate-50 pl-3 pr-10 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
          />
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>

        {/* Segmented toggle: Expenses | Recurring expenses */}
        <div className="inline-flex rounded-md border border-slate-300 bg-white overflow-hidden shrink-0">
          <button
            onClick={() => setViewMode('expenses')}
            className={cn(
              'px-3 py-2 text-sm font-medium transition-colors',
              viewMode === 'expenses'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            )}
          >
            Expenses
          </button>
          <button
            onClick={() => setViewMode('recurring')}
            className={cn(
              'px-3 py-2 text-sm font-medium transition-colors border-l border-slate-300',
              viewMode === 'recurring'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            )}
          >
            Recurring expenses
          </button>
        </div>

        {/* Add button with dropdown arrow */}
        <div className="relative shrink-0">
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md h-[38px] pl-4 pr-2 text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            New
            <ChevronDown className="h-3.5 w-3.5 ml-1" />
          </button>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'expenses' ? (
        <>
          {/* Normal expenses table */}
          <TableWrapper>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left py-3 px-5 text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                      Date
                    </th>
                    <th className="text-left py-3 px-5 text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                      Category
                    </th>
                    <th className="text-left py-3 px-5 text-[11px] uppercase tracking-wider font-semibold text-slate-400 hidden md:table-cell">
                      Description
                    </th>
                    <th className="text-right py-3 px-5 text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                      Amount
                    </th>
                    <th className="text-right py-3 px-5 text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((record) => (
                    <tr
                      key={record.id}
                      className="group border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <Td className="text-slate-600 whitespace-nowrap">
                        {formatDate(record.date)}
                      </Td>
                      <Td>
                        {record.category}
                      </Td>
                      <Td className="text-slate-600 hidden md:table-cell">
                        <span className="truncate block max-w-[250px]">
                          {record.description || '-'}
                        </span>
                      </Td>
                      <Td className="text-right font-semibold text-red-600 whitespace-nowrap">
                        {formatCurrency(record.amount)}
                      </Td>
                      <Td>
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onEdit(record)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            aria-label="Edit expense"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() =>
                              onDelete(
                                record.id,
                                `${formatCurrency(record.amount)} expense - ${record.description}`
                              )
                            }
                            className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            aria-label="Delete expense"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {paginatedItems.length === 0 && (
                <div className="py-16 text-center">
                  <Receipt className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No expenses found</p>
                  <p className="text-sm text-slate-400 mt-1">
                    {searchQuery
                      ? 'Try adjusting your search'
                      : 'Get started by adding your first expense'}
                  </p>
                </div>
              )}
          </TableWrapper>

          {/* Pagination */}
          {totalItems > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
            />
          )}
        </>
      ) : (
        /* Recurring expenses view */
        <TableWrapper>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left py-3 px-5 text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                    Next Due Date
                  </th>
                  <th className="text-left py-3 px-5 text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                    Category
                  </th>
                  <th className="text-left py-3 px-5 text-[11px] uppercase tracking-wider font-semibold text-slate-400 hidden md:table-cell">
                    Description
                  </th>
                  <th className="text-right py-3 px-5 text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                    Amount
                  </th>
                  <th className="text-right py-3 px-5 text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Currently no recurring expense data */}
              </tbody>
            </table>

            {recurringExpenses.length === 0 && (
              <div className="py-16 text-center">
                <Receipt className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No recurring expenses</p>
                <p className="text-sm text-slate-400 mt-1">
                  Recurring expenses will appear here once added
                </p>
              </div>
            )}
        </TableWrapper>
      )}
    </div>
  );
}
