'use client';

import { useState, useMemo } from 'react';
import {
  Plus,
  Home,
  Search,
  Trash2,
  X,
  Bed,
  Bath,
  Maximize,
  Receipt,
} from 'lucide-react';
import { Property, Unit, UnitStatus, ExpenseRecord } from '@/lib/types';
import { usePropertyStore } from '@/stores/propertyStore';
import { useExpenseStore } from '@/stores/expenseStore';
import { cn, formatCurrency, formatDate, INPUT_CLASS } from '@/lib/utils';
import { Td } from '@/components/ui/Td';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Props {
  property: Property;
  onAddExpense: () => void;
  onEditExpense: (expense: ExpenseRecord) => void;
  onDeleteExpense: (id: string) => void;
}

type ExpenseSubTab = 'Expenses' | 'Recurring expenses';

interface UnitFormData {
  name: string;
  floor: string;
  bedrooms: number;
  bathrooms: number;
  areaSqm: number;
  monthlyRent: number;
  status: UnitStatus;
}

const UNIT_STATUS_OPTIONS: UnitStatus[] = [
  'Vacant',
  'Occupied',
  'Under Maintenance',
  'Reserved',
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getUnitStatusColor(status: UnitStatus): string {
  const map: Record<UnitStatus, string> = {
    Vacant: 'bg-green-50 text-green-700 border-green-200',
    Occupied: 'bg-blue-50 text-blue-700 border-blue-200',
    'Under Maintenance': 'bg-amber-50 text-amber-700 border-amber-200',
    Reserved: 'bg-slate-50 text-slate-700 border-slate-200',
  };
  return map[status] ?? 'bg-slate-50 text-slate-700 border-slate-200';
}

function emptyUnitForm(): UnitFormData {
  return {
    name: '',
    floor: '',
    bedrooms: 0,
    bathrooms: 0,
    areaSqm: 0,
    monthlyRent: 0,
    status: 'Vacant',
  };
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function PropertyOverviewTab({
  property,
  onAddExpense,
  onEditExpense,
}: Props) {
  /* ---- stores ---- */
  const { addUnit, updateUnit, deleteUnit } = usePropertyStore();
  const expenseRecords = useExpenseStore((s) => s.records);

  /* ---- unit modal state ---- */
  const [unitModalOpen, setUnitModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [unitForm, setUnitForm] = useState<UnitFormData>(emptyUnitForm());
  const [deleteUnitConfirmId, setDeleteUnitConfirmId] = useState<string | null>(null);

  /* ---- expense section state ---- */
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseSubTab, setExpenseSubTab] = useState<ExpenseSubTab>('Expenses');

  /* ---- derived data ---- */
  const propertyExpenses = useMemo(
    () => expenseRecords.filter((e) => e.propertyId === property.id),
    [expenseRecords, property.id]
  );

  const filteredExpenses = useMemo(() => {
    if (!expenseSearch.trim()) return propertyExpenses;
    const q = expenseSearch.toLowerCase();
    return propertyExpenses.filter(
      (e) =>
        e.category.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.vendor.toLowerCase().includes(q)
    );
  }, [propertyExpenses, expenseSearch]);

  /* ---- unit modal handlers ---- */
  function openAddUnitModal() {
    setEditingUnit(null);
    setUnitForm(emptyUnitForm());
    setUnitModalOpen(true);
  }

  function openEditUnitModal(unit: Unit) {
    setEditingUnit(unit);
    setUnitForm({
      name: unit.name,
      floor: unit.floor ?? '',
      bedrooms: unit.bedrooms,
      bathrooms: unit.bathrooms,
      areaSqm: unit.areaSqm,
      monthlyRent: unit.monthlyRent,
      status: unit.status,
    });
    setUnitModalOpen(true);
  }

  function closeUnitModal() {
    setUnitModalOpen(false);
    setEditingUnit(null);
    setUnitForm(emptyUnitForm());
  }

  function handleUnitSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!unitForm.name.trim()) return;

    if (editingUnit) {
      updateUnit(property.id, editingUnit.id, {
        name: unitForm.name.trim(),
        floor: unitForm.floor.trim() || undefined,
        bedrooms: Number(unitForm.bedrooms),
        bathrooms: Number(unitForm.bathrooms),
        areaSqm: Number(unitForm.areaSqm),
        monthlyRent: Number(unitForm.monthlyRent),
        status: unitForm.status,
      });
    } else {
      addUnit(property.id, {
        name: unitForm.name.trim(),
        floor: unitForm.floor.trim() || undefined,
        bedrooms: Number(unitForm.bedrooms),
        bathrooms: Number(unitForm.bathrooms),
        areaSqm: Number(unitForm.areaSqm),
        monthlyRent: Number(unitForm.monthlyRent),
        status: unitForm.status,
      });
    }

    closeUnitModal();
  }

  function handleDeleteUnit(unitId: string) {
    deleteUnit(property.id, unitId);
    setDeleteUnitConfirmId(null);
  }

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */

  return (
    <div className="space-y-6">
      {/* ============================================================ */}
      {/* UNITS / ROOMS SECTION                                        */}
      {/* ============================================================ */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-800">
            Units ({property.units.length})
          </h3>
          <button
            onClick={openAddUnitModal}
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            New
          </button>
        </div>

        {/* Unit cards grid */}
        {property.units.length === 0 ? (
          <div className="py-12 text-center">
            <Home className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm text-slate-500">No units added yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
            {property.units.map((unit) => (
              <div
                key={unit.id}
                onClick={() => openEditUnitModal(unit)}
                className="relative group border border-slate-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
              >
                {/* Delete button */}
                {deleteUnitConfirmId === unit.id ? (
                  <div
                    className="absolute top-2 right-2 flex items-center gap-1 z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => handleDeleteUnit(unit.id)}
                      className="rounded-md bg-red-500 px-2 py-1 text-xs font-medium text-white hover:bg-red-600"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setDeleteUnitConfirmId(null)}
                      className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteUnitConfirmId(unit.id);
                    }}
                    className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-slate-200 hover:text-red-600 transition-all"
                    title="Delete unit"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}

                {/* Unit name */}
                <p className="text-sm font-bold text-slate-800">{unit.name}</p>

                {/* Status badge */}
                <span
                  className={cn(
                    'mt-2 inline-block rounded-md border px-2.5 py-0.5 text-xs font-semibold',
                    getUnitStatusColor(unit.status)
                  )}
                >
                  {unit.status}
                </span>

                {/* Details row */}
                <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
                  {unit.floor && <span>Floor {unit.floor}</span>}
                  {unit.bedrooms > 0 && (
                    <span className="flex items-center gap-1">
                      <Bed className="h-3 w-3" /> {unit.bedrooms}BR
                    </span>
                  )}
                  {unit.bathrooms > 0 && (
                    <span className="flex items-center gap-1">
                      <Bath className="h-3 w-3" /> {unit.bathrooms}BA
                    </span>
                  )}
                  {unit.areaSqm > 0 && (
                    <span className="flex items-center gap-1">
                      <Maximize className="h-3 w-3" /> {unit.areaSqm} sqm
                    </span>
                  )}
                </div>

                {/* Monthly rent */}
                <p className="mt-3 text-sm font-semibold text-slate-800">
                  {formatCurrency(unit.monthlyRent)}
                  <span className="font-normal text-slate-400">/mo</span>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* UNIT ADD / EDIT MODAL                                        */}
      {/* ============================================================ */}
      {unitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeUnitModal}
          />

          {/* Modal content */}
          <div className="relative z-10 w-full max-w-md mx-4 bg-white rounded-xl shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-base font-semibold text-slate-800">
                {editingUnit ? 'Edit Unit' : 'Add Unit'}
              </h3>
              <button
                onClick={closeUnitModal}
                className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUnitSubmit} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Unit Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={unitForm.name}
                  onChange={(e) =>
                    setUnitForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder='e.g. "#1A", "Room 201"'
                  className={INPUT_CLASS}
                  autoFocus
                  required
                />
              </div>

              {/* Floor */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Floor
                </label>
                <input
                  type="text"
                  value={unitForm.floor}
                  onChange={(e) =>
                    setUnitForm((f) => ({ ...f, floor: e.target.value }))
                  }
                  placeholder="e.g. 1, Ground, Basement"
                  className={INPUT_CLASS}
                />
              </div>

              {/* Bedrooms & Bathrooms */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Bedrooms
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={unitForm.bedrooms}
                    onChange={(e) =>
                      setUnitForm((f) => ({
                        ...f,
                        bedrooms: parseInt(e.target.value) || 0,
                      }))
                    }
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Bathrooms
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={unitForm.bathrooms}
                    onChange={(e) =>
                      setUnitForm((f) => ({
                        ...f,
                        bathrooms: parseInt(e.target.value) || 0,
                      }))
                    }
                    className={INPUT_CLASS}
                  />
                </div>
              </div>

              {/* Area */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Area (sqm)
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={unitForm.areaSqm}
                  onChange={(e) =>
                    setUnitForm((f) => ({
                      ...f,
                      areaSqm: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className={INPUT_CLASS}
                />
              </div>

              {/* Monthly Rent */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Monthly Rent (PHP)
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={unitForm.monthlyRent}
                  onChange={(e) =>
                    setUnitForm((f) => ({
                      ...f,
                      monthlyRent: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className={INPUT_CLASS}
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Status
                </label>
                <select
                  value={unitForm.status}
                  onChange={(e) =>
                    setUnitForm((f) => ({
                      ...f,
                      status: e.target.value as UnitStatus,
                    }))
                  }
                  className={INPUT_CLASS}
                >
                  {UNIT_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeUnitModal}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  {editingUnit ? 'Save Changes' : 'Add Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* EXPENSES SECTION                                             */}
      {/* ============================================================ */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
        {/* Header with search, toggle, and + New */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={expenseSearch}
                onChange={(e) => setExpenseSearch(e.target.value)}
                placeholder="Search expenses..."
                className="pl-8 pr-3 py-1.5 text-sm rounded-md border border-slate-300 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 w-48"
              />
            </div>

            {/* Sub-tab toggle */}
            <div className="flex gap-4">
              {(['Expenses', 'Recurring expenses'] as const).map((sub) => (
                <button
                  key={sub}
                  onClick={() => setExpenseSubTab(sub)}
                  className={cn(
                    'text-sm font-medium pb-0 transition-colors whitespace-nowrap',
                    expenseSubTab === sub
                      ? 'text-blue-600'
                      : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={onAddExpense}
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors self-end sm:self-auto"
          >
            <Plus className="h-3.5 w-3.5" />
            New
          </button>
        </div>

        {/* Body */}
        {expenseSubTab === 'Recurring expenses' ? (
          <div className="py-12 text-center">
            <Receipt className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm text-slate-500">
              No recurring expenses.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Date
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Category
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Description
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-12 text-center text-sm text-slate-400"
                    >
                      No expenses recorded.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((expense) => (
                    <tr
                      key={expense.id}
                      onClick={() => onEditExpense(expense)}
                      className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                    >
                      <Td className="text-slate-600">
                        {formatDate(expense.date)}
                      </Td>
                      <Td className="text-slate-800 font-medium">
                        {expense.category}
                      </Td>
                      <Td className="text-slate-500">
                        {expense.description || '-'}
                      </Td>
                      <Td>
                        <span className="inline-block rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600">
                          Paid
                        </span>
                      </Td>
                      <Td className="text-right font-semibold text-slate-800">
                        {formatCurrency(expense.amount)}
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
