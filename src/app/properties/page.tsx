'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Plus,
  Search,
  ChevronDown,
  Home,
} from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';
import { Th } from '@/components/ui/Th';
import { Td } from '@/components/ui/Td';
import { TableWrapper } from '@/components/ui/TableWrapper';
import { FormField } from '@/components/ui/FormField';
import { BulkActionBar } from '@/components/ui/BulkActionBar';
import { useMultiSelect } from '@/hooks/useMultiSelect';
import { usePropertyStore } from '@/stores/propertyStore';
import { useLeaseStore } from '@/stores/leaseStore';
import { useTenantStore } from '@/stores/tenantStore';
import { useIncomeStore } from '@/stores/incomeStore';
import { formatCurrency, formatDate, cn, INPUT_CLASS } from '@/lib/utils';
import { PropertyType, Property, Unit } from '@/lib/types';
import { PageHeaderSkeleton, TabsSkeleton, SearchBarSkeleton, TableSkeleton } from '@/components/ui/Skeleton';

/* Hydrate stores from API on mount */
function useHydrateStores() {
  const fetchProperties = usePropertyStore((s) => s.fetchProperties);
  const fetchLeases = useLeaseStore((s) => s.fetchLeases);
  const fetchTenants = useTenantStore((s) => s.fetchTenants);
  const fetchIncome = useIncomeStore((s) => s.fetchRecords);
  useEffect(() => {
    fetchProperties();
    fetchLeases();
    fetchTenants();
    fetchIncome();
  }, [fetchProperties, fetchLeases, fetchTenants, fetchIncome]);
}

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

const PROPERTY_TYPES: PropertyType[] = [
  'Apartment',
  'Condominium',
  'Townhouse',
  'House',
  'Commercial',
  'Boarding House',
  'Dormitory',
];

const EMPTY_PROPERTY_FORM = {
  name: '',
  type: 'Apartment' as PropertyType,
  address: '',
  city: '',
  province: '',
  zipCode: '',
  barangay: '',
  monthlyTarget: 0,
  units: [] as Unit[],
  bedrooms: 0,
  bathrooms: 0,
  areaSqm: 0,
};

/* -------------------------------------------------------------------------- */
/*  Filter tab types                                                           */
/* -------------------------------------------------------------------------- */

type FilterTab =
  | 'All'
  | 'Rent overdue'
  | 'Rent due soon'
  | 'Rent due later'
  | 'Vacant'
  | 'Multi-Unit';

const FILTER_TABS: FilterTab[] = [
  'All',
  'Rent overdue',
  'Rent due soon',
  'Rent due later',
  'Vacant',
  'Multi-Unit',
];

/* -------------------------------------------------------------------------- */
/*  Helper: outlined status badge                                              */
/* -------------------------------------------------------------------------- */

function getOutlinedStatusColor(status: string): string {
  const colors: Record<string, string> = {
    Vacant: 'border-blue-500 text-blue-600',
    Occupied: 'border-emerald-500 text-emerald-600',
    'Under Maintenance': 'border-amber-500 text-amber-600',
    Reserved: 'border-purple-500 text-purple-600',
  };
  return colors[status] || 'border-slate-300 text-slate-500';
}

/* -------------------------------------------------------------------------- */
/*  View type                                                                  */
/* -------------------------------------------------------------------------- */

type PageView = 'list' | 'add' | 'edit';

/* ========================================================================== */
/*  Main Component                                                             */
/* ========================================================================== */

export default function PropertiesPage() {
  useHydrateStores();

  /* -- Stores ------------------------------------------------------------- */
  const {
    properties,
    searchQuery,
    loading,
    addProperty,
    updateProperty,
    deleteProperty,
    setSearchQuery,
  } = usePropertyStore();
  const deleteMultiple = usePropertyStore((s) => s.deleteMultiple);

  const router = useRouter();
  const leases = useLeaseStore((s) => s.leases);
  const tenants = useTenantStore((s) => s.tenants);
  const incomeRecords = useIncomeStore((s) => s.records);

  /* -- Local state -------------------------------------------------------- */
  const [pageView, setPageView] = useState<PageView>('list');
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [formData, setFormData] = useState(EMPTY_PROPERTY_FORM);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [activeTab, setActiveTab] = useState<FilterTab>('All');
  const [expandedProperties, setExpandedProperties] = useState<Set<string>>(new Set());

  /* -- Property type selection for add form ------------------------------- */
  const [propertyTypeSelection, setPropertyTypeSelection] = useState<'single' | 'multi'>('single');

  /* -- Tab counts --------------------------------------------------------- */
  const tabCounts = useMemo(() => {
    const vacantCount = properties.filter(
      (p) => p.units.some((u) => u.status === 'Vacant') || p.units.length === 0
    ).length;
    const multiUnitCount = properties.filter((p) => p.units.length > 1).length;

    // For rent status, check income records
    const now = new Date();
    let overdueCount = 0;
    let dueSoonCount = 0;
    let dueLaterCount = 0;

    properties.forEach((p) => {
      const propertyIncome = incomeRecords.filter(
        (r) => r.propertyId === p.id && (r.status === 'Unpaid' || r.status === 'Overdue' || r.status === 'Pending')
      );
      if (propertyIncome.some((r) => r.status === 'Overdue')) {
        overdueCount++;
      } else if (propertyIncome.some((r) => {
        const due = new Date(r.dueDate);
        const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 7;
      })) {
        dueSoonCount++;
      } else if (propertyIncome.some((r) => {
        const due = new Date(r.dueDate);
        const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays > 7;
      })) {
        dueLaterCount++;
      }
    });

    return {
      All: properties.length,
      'Rent overdue': overdueCount,
      'Rent due soon': dueSoonCount,
      'Rent due later': dueLaterCount,
      Vacant: vacantCount,
      'Multi-Unit': multiUnitCount,
    };
  }, [properties, incomeRecords]);

  /* -- Filtered + paginated ----------------------------------------------- */
  const filteredProperties = useMemo(() => {
    let result = properties;

    if (activeTab === 'Vacant') {
      result = result.filter(
        (p) => p.units.some((u) => u.status === 'Vacant') || p.units.length === 0
      );
    } else if (activeTab === 'Multi-Unit') {
      result = result.filter((p) => p.units.length > 1);
    } else if (activeTab === 'Rent overdue') {
      result = result.filter((p) =>
        incomeRecords.some((r) => r.propertyId === p.id && r.status === 'Overdue')
      );
    } else if (activeTab === 'Rent due soon') {
      const now = new Date();
      result = result.filter((p) =>
        incomeRecords.some((r) => {
          if (r.propertyId !== p.id || r.status === 'Paid') return false;
          const due = new Date(r.dueDate);
          const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return diffDays >= 0 && diffDays <= 7;
        })
      );
    } else if (activeTab === 'Rent due later') {
      const now = new Date();
      result = result.filter((p) =>
        incomeRecords.some((r) => {
          if (r.propertyId !== p.id || r.status === 'Paid') return false;
          const due = new Date(r.dueDate);
          const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return diffDays > 7;
        })
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q) ||
          p.province.toLowerCase().includes(q) ||
          p.barangay.toLowerCase().includes(q) ||
          p.units.some((u) => u.name.toLowerCase().includes(q))
      );
    }

    return result;
  }, [properties, activeTab, searchQuery, incomeRecords]);

  const totalPages = Math.max(1, Math.ceil(filteredProperties.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedProperties = filteredProperties.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  const { selectedIds, toggleOne, toggleAll, clearSelection, allSelected, someSelected } = useMultiSelect(paginatedProperties);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  /* -- Get tenant names for a property ----------------------------------- */
  function getPropertyTenants(propertyId: string): string[] {
    const activeLeases = leases.filter(
      (l) => l.propertyId === propertyId && l.status === 'Active'
    );
    return activeLeases.map((l) => {
      const tenant = tenants.find((t) => t.id === l.tenantId);
      return tenant ? `${tenant.firstName} ${tenant.lastName}` : '';
    }).filter(Boolean);
  }

  /* -- Get due date for a property ---------------------------------------- */
  function getPropertyDueDate(propertyId: string): string | null {
    const pendingIncome = incomeRecords
      .filter((r) => r.propertyId === propertyId && r.status !== 'Paid')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    return pendingIncome.length > 0 ? pendingIncome[0].dueDate : null;
  }

  /* -- Get rent due for a property ---------------------------------------- */
  function getPropertyRentDue(propertyId: string): number {
    return incomeRecords
      .filter((r) => r.propertyId === propertyId && r.status !== 'Paid')
      .reduce((sum, r) => sum + r.amount, 0);
  }

  /* -- Get unit status summary -------------------------------------------- */
  function getPropertyStatus(property: Property): { label: string; classes: string } {
    const vacantCount = property.units.filter((u) => u.status === 'Vacant').length;
    if (vacantCount > 0) {
      return { label: 'VACANT', classes: 'border-blue-500 text-blue-600' };
    }
    if (property.units.length > 0) {
      return { label: 'OCCUPIED', classes: 'border-emerald-500 text-emerald-600' };
    }
    return { label: 'NO UNITS', classes: 'border-slate-300 text-slate-500' };
  }

  /* -- Toggle expanded ---------------------------------------------------- */
  function toggleExpanded(propertyId: string) {
    setExpandedProperties((prev) => {
      const next = new Set(prev);
      if (next.has(propertyId)) next.delete(propertyId);
      else next.add(propertyId);
      return next;
    });
  }

  /* -- Navigation handlers ------------------------------------------------ */
  function openAddPage() {
    setEditingProperty(null);
    setFormData(EMPTY_PROPERTY_FORM);
    setPropertyTypeSelection('single');
    setPageView('add');
  }

  function openEditPage(property: Property) {
    setEditingProperty(property);
    setFormData({
      name: property.name,
      type: property.type,
      address: property.address,
      city: property.city,
      province: property.province,
      zipCode: property.zipCode,
      barangay: property.barangay,
      monthlyTarget: property.monthlyTarget,
      units: property.units,
      bedrooms: property.units[0]?.bedrooms ?? 0,
      bathrooms: property.units[0]?.bathrooms ?? 0,
      areaSqm: property.units[0]?.areaSqm ?? 0,
    });
    setPropertyTypeSelection(property.units.length > 1 ? 'multi' : 'single');
    setPageView('edit');
  }

  function openDetailPage(property: Property) {
    router.push(`/properties/${property.id}`);
  }

  function backToList() {
    setPageView('list');
    setEditingProperty(null);
    setDeleteConfirmId(null);
  }

  /* -- Form handlers ------------------------------------------------------ */
  function handleFormChange(field: string, value: string | number) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingProperty) {
      updateProperty(editingProperty.id, {
        name: formData.name,
        type: formData.type,
        address: formData.address,
        city: formData.city,
        province: formData.province,
        zipCode: formData.zipCode,
        barangay: formData.barangay,
        monthlyTarget: formData.monthlyTarget,
      });
    } else {
      addProperty({
        name: formData.name,
        type: formData.type,
        address: formData.address,
        city: formData.city,
        province: formData.province,
        zipCode: formData.zipCode,
        barangay: formData.barangay,
        monthlyTarget: formData.monthlyTarget,
        units: [],
      });
    }

    backToList();
  }

  function handleDelete(id: string) {
    deleteProperty(id);
    setDeleteConfirmId(null);
  }

  /* ======================================================================== */
  /*  ADD / EDIT PROPERTY (FULL PAGE)                                          */
  /* ======================================================================== */

  if (pageView === 'add' || pageView === 'edit') {
    return (
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={backToList}
            className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            Properties
          </button>
          <span className="text-slate-400">/</span>
          <span className="text-slate-600">
            {editingProperty ? 'Edit Property' : 'Add Property'}
          </span>
        </div>

        {/* Page title */}
        <h1 className="text-[28px] font-bold text-slate-900">
          {editingProperty ? 'Edit Property' : 'Add Property'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* GENERAL INFORMATION */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-5">
              General Information
            </h2>

            <div className="space-y-4">
              {/* Property Name */}
              <FormField label="Property Name" required>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  placeholder="e.g. Sunrise Apartments"
                  className={INPUT_CLASS}
                />
              </FormField>

              {/* Street Address */}
              <FormField label="Street Address" required>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => handleFormChange('address', e.target.value)}
                  placeholder="e.g. 123 Rizal Avenue"
                  className={INPUT_CLASS}
                />
              </FormField>

              {/* Barangay */}
              <FormField label="Barangay">
                <input
                  type="text"
                  value={formData.barangay}
                  onChange={(e) => handleFormChange('barangay', e.target.value)}
                  placeholder="e.g. Brgy. San Lorenzo"
                  className={INPUT_CLASS}
                />
              </FormField>

              {/* City + Province */}
              <div className="grid grid-cols-2 gap-4">
                <FormField label="City" required>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => handleFormChange('city', e.target.value)}
                    placeholder="e.g. Makati City"
                    className={INPUT_CLASS}
                  />
                </FormField>
                <FormField label="State / Province" required>
                  <input
                    type="text"
                    required
                    value={formData.province}
                    onChange={(e) => handleFormChange('province', e.target.value)}
                    placeholder="e.g. Metro Manila"
                    className={INPUT_CLASS}
                  />
                </FormField>
              </div>

              {/* Zip + Monthly Target */}
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Zip Code">
                  <input
                    type="text"
                    value={formData.zipCode}
                    onChange={(e) => handleFormChange('zipCode', e.target.value)}
                    placeholder="e.g. 1226"
                    className={INPUT_CLASS}
                  />
                </FormField>
                <FormField label="Monthly Target (PHP)">
                  <input
                    type="number"
                    min="0"
                    value={formData.monthlyTarget || ''}
                    onChange={(e) =>
                      handleFormChange('monthlyTarget', Number(e.target.value) || 0)
                    }
                    placeholder="0"
                    className={INPUT_CLASS}
                  />
                </FormField>
              </div>
            </div>
          </div>

          {/* PROPERTY TYPE */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-5">
              Property Type
            </h2>

            <div className="grid grid-cols-2 gap-4">
              {/* Single Family Home */}
              <button
                type="button"
                onClick={() => {
                  setPropertyTypeSelection('single');
                  handleFormChange('type', 'House');
                }}
                className={cn(
                  'flex flex-col items-center gap-3 rounded-lg border-2 p-6 transition-colors',
                  propertyTypeSelection === 'single'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                )}
              >
                <div
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-lg',
                    propertyTypeSelection === 'single'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-slate-100 text-slate-500'
                  )}
                >
                  <Home className="h-6 w-6" />
                </div>
                <span
                  className={cn(
                    'text-sm font-medium',
                    propertyTypeSelection === 'single' ? 'text-blue-700' : 'text-slate-700'
                  )}
                >
                  Single Family Home
                </span>
              </button>

              {/* Multi-unit */}
              <button
                type="button"
                onClick={() => {
                  setPropertyTypeSelection('multi');
                  handleFormChange('type', 'Apartment');
                }}
                className={cn(
                  'flex flex-col items-center gap-3 rounded-lg border-2 p-6 transition-colors',
                  propertyTypeSelection === 'multi'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                )}
              >
                <div
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-lg',
                    propertyTypeSelection === 'multi'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-slate-100 text-slate-500'
                  )}
                >
                  <Building2 className="h-6 w-6" />
                </div>
                <span
                  className={cn(
                    'text-sm font-medium',
                    propertyTypeSelection === 'multi' ? 'text-blue-700' : 'text-slate-700'
                  )}
                >
                  Multi-unit
                </span>
              </button>
            </div>

            {/* Specific type selector */}
            <FormField label="Specific Type" className="mt-4">
              <select
                value={formData.type}
                onChange={(e) => handleFormChange('type', e.target.value)}
                className={INPUT_CLASS}
              >
                {PROPERTY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          {/* FEATURES */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-5">
              Features
            </h2>

            <div className="grid grid-cols-3 gap-4">
              <FormField label="Area (sqm)">
                <input
                  type="number"
                  min="0"
                  value={formData.areaSqm || ''}
                  onChange={(e) => handleFormChange('areaSqm', Number(e.target.value) || 0)}
                  placeholder="0"
                  className={INPUT_CLASS}
                />
              </FormField>
              <FormField label="Bedrooms">
                <input
                  type="number"
                  min="0"
                  value={formData.bedrooms || ''}
                  onChange={(e) => handleFormChange('bedrooms', Number(e.target.value) || 0)}
                  placeholder="0"
                  className={INPUT_CLASS}
                />
              </FormField>
              <FormField label="Bathrooms">
                <input
                  type="number"
                  min="0"
                  value={formData.bathrooms || ''}
                  onChange={(e) => handleFormChange('bathrooms', Number(e.target.value) || 0)}
                  placeholder="0"
                  className={INPUT_CLASS}
                />
              </FormField>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={backToList}
              className="rounded-md border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              {editingProperty ? 'Save Changes' : 'Add Property'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  /* Property detail page is now at /properties/[id] */
  /* ======================================================================== */
  /*  LIST VIEW (DEFAULT)                                                      */
  /* ======================================================================== */

  if (loading) {
    return (
      <div className="space-y-0">
        <PageHeaderSkeleton />
        <TabsSkeleton count={6} />
        <SearchBarSkeleton />
        <div className="mt-4">
          <TableSkeleton rows={6} cols={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[28px] font-bold text-slate-900">Properties</h1>
        <button
          onClick={openAddPage}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 h-10 px-5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add property
        </button>
      </div>

      {/* Filter Tabs - underline style */}
      <div className="border-b border-slate-200 mb-4">
        <nav className="-mb-px flex gap-1 overflow-x-auto" aria-label="Property filter">
          {FILTER_TABS.map((tab) => {
            const isActive = activeTab === tab;
            const count = tabCounts[tab];
            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setCurrentPage(1);
                }}
                className={cn(
                  'relative flex items-center gap-2 whitespace-nowrap pb-3 px-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {tab}
                <span
                  className={cn(
                    'inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold',
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-500'
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            placeholder="Search address or tenants"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-md border border-slate-300 bg-slate-50 py-2 pl-3 pr-10 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          />
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      {/* Table */}
      <TableWrapper>
        {filteredProperties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-slate-100">
              <Building2 className="h-7 w-7 text-slate-400" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-800">No properties found</h3>
            <p className="mt-1 text-sm text-slate-500">
              {searchQuery || activeTab !== 'All'
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by adding your first property.'}
            </p>
            {!searchQuery && activeTab === 'All' && (
              <button
                onClick={openAddPage}
                className="mt-4 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add property
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <Th className="w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected; }}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </Th>
                <Th className="whitespace-nowrap">Address</Th>
                <Th className="whitespace-nowrap">Tenants</Th>
                <Th className="whitespace-nowrap">Due Date</Th>
                <Th className="whitespace-nowrap">Rent Due</Th>
                <Th className="whitespace-nowrap">Status</Th>
              </tr>
            </thead>
            <tbody>
              {paginatedProperties.map((property) => {
                const isExpanded = expandedProperties.has(property.id);
                const propTenants = getPropertyTenants(property.id);
                const dueDate = getPropertyDueDate(property.id);
                const rentDue = getPropertyRentDue(property.id);
                const status = getPropertyStatus(property);

                return (
                  <PropertyRowGroup
                    key={property.id}
                    property={property}
                    tenantNames={propTenants}
                    dueDate={dueDate}
                    rentDue={rentDue}
                    status={status}
                    isExpanded={isExpanded}
                    onToggle={() => toggleExpanded(property.id)}
                    onRowClick={() => openDetailPage(property)}
                    leases={leases}
                    tenants={tenants}
                    incomeRecords={incomeRecords}
                    isSelected={selectedIds.has(property.id)}
                    onToggleSelect={() => toggleOne(property.id)}
                  />
                );
              })}
            </tbody>
          </table>
        )}
      </TableWrapper>

      {/* Pagination */}
      {filteredProperties.length > 0 && (
        <div className="mt-3">
          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            totalItems={filteredProperties.length}
            pageSize={pageSize}
            onPageChange={(p) => setCurrentPage(p)}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setCurrentPage(1);
            }}
          />
        </div>
      )}

      {/* Bulk Action Bar */}
      <BulkActionBar
        count={selectedIds.size}
        onDelete={async () => {
          const failures = await deleteMultiple(Array.from(selectedIds));
          clearSelection();
          if (failures > 0) alert(`${failures} record(s) could not be deleted.`);
        }}
        onClear={clearSelection}
        entityLabel="property"
      />
    </div>
  );
}

/* ========================================================================== */
/*  PropertyRowGroup - parent row + child unit rows                            */
/* ========================================================================== */

function PropertyRowGroup({
  property,
  tenantNames,
  dueDate,
  rentDue,
  status,
  isExpanded,
  onToggle,
  onRowClick,
  leases,
  tenants,
  incomeRecords,
  isSelected,
  onToggleSelect,
}: {
  property: Property;
  tenantNames: string[];
  dueDate: string | null;
  rentDue: number;
  status: { label: string; classes: string };
  isExpanded: boolean;
  onToggle: () => void;
  onRowClick: () => void;
  leases: { unitId: string; tenantId: string; status: string; propertyId: string }[];
  tenants: { id: string; firstName: string; lastName: string }[];
  incomeRecords: { unitId: string | null; propertyId: string; status: string; dueDate: string; amount: number }[];
  isSelected: boolean;
  onToggleSelect: () => void;
}) {
  return (
    <>
      {/* Parent property row */}
      <tr
        className="cursor-pointer border-b border-slate-100 hover:bg-slate-50 transition-colors"
        onClick={(e) => {
          // If user clicks the expand chevron area, toggle expansion; otherwise navigate to detail
          onRowClick();
        }}
      >
        {/* Checkbox */}
        <Td className="w-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
        </Td>
        {/* Address */}
        <Td className="whitespace-nowrap py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-800">{property.name}</p>
              <p className="text-xs text-slate-500">
                {property.address}, {property.city}
              </p>
            </div>
            {property.units.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle();
                }}
                className="ml-1 p-0.5 rounded hover:bg-slate-200 transition-colors"
              >
                <ChevronDown
                  className={cn(
                    'h-4 w-4 text-slate-400 transition-transform',
                    isExpanded && 'rotate-180'
                  )}
                />
              </button>
            )}
          </div>
        </Td>

        {/* Tenants */}
        <Td className="whitespace-nowrap py-3.5 text-slate-600">
          {tenantNames.length > 0 ? (
            <div>
              {tenantNames.slice(0, 2).map((name, i) => (
                <p key={i} className={i === 0 ? 'text-slate-800' : 'text-slate-500 text-xs'}>
                  {name}
                </p>
              ))}
              {tenantNames.length > 2 && (
                <p className="text-xs text-slate-400">+{tenantNames.length - 2} more</p>
              )}
            </div>
          ) : (
            <span className="text-slate-400">-</span>
          )}
        </Td>

        {/* Due Date */}
        <Td className="whitespace-nowrap py-3.5 text-slate-600">
          {dueDate ? formatDate(dueDate) : <span className="text-slate-400">-</span>}
        </Td>

        {/* Rent Due */}
        <Td className="whitespace-nowrap py-3.5 font-medium text-slate-800">
          {rentDue > 0 ? formatCurrency(rentDue) : <span className="text-slate-400">-</span>}
        </Td>

        {/* Status */}
        <Td className="whitespace-nowrap py-3.5">
          <span
            className={cn(
              'inline-block rounded-md border px-2.5 py-0.5 text-xs font-semibold uppercase',
              status.classes
            )}
          >
            {status.label}
          </span>
        </Td>
      </tr>

      {/* Child unit rows (expanded) */}
      {isExpanded &&
        property.units.map((unit) => {
          // Find active lease for this unit
          const unitLease = leases.find(
            (l) => l.unitId === unit.id && l.propertyId === property.id && l.status === 'Active'
          );
          const unitTenant = unitLease
            ? tenants.find((t) => t.id === unitLease.tenantId)
            : null;

          // Find pending income for this unit
          const unitIncome = incomeRecords.filter(
            (r) => r.unitId === unit.id && r.propertyId === property.id && r.status !== 'Paid'
          );
          const unitDueDate = unitIncome.length > 0
            ? unitIncome.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0].dueDate
            : null;
          const unitRentDue = unitIncome.reduce((sum, r) => sum + r.amount, 0);

          return (
            <tr
              key={unit.id}
              className="border-b border-slate-50 bg-slate-50/50 hover:bg-slate-100/60 transition-colors"
            >
              {/* Empty cell for checkbox column alignment */}
              <Td className="w-10">{null}</Td>
              {/* Address - indented */}
              <Td className="whitespace-nowrap py-2.5 pl-14">
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100">
                    <Home className="h-3.5 w-3.5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{unit.name}</p>
                    <p className="text-xs text-slate-400">
                      {property.address}, {property.city}
                    </p>
                  </div>
                </div>
              </Td>

              {/* Tenants */}
              <Td className="whitespace-nowrap py-2.5 text-slate-600">
                {unitTenant ? (
                  <span className="text-slate-700">{unitTenant.firstName} {unitTenant.lastName}</span>
                ) : (
                  <span className="text-slate-400">-</span>
                )}
              </Td>

              {/* Due Date */}
              <Td className="whitespace-nowrap py-2.5 text-slate-600">
                {unitDueDate ? formatDate(unitDueDate) : <span className="text-slate-400">-</span>}
              </Td>

              {/* Rent */}
              <Td className="whitespace-nowrap py-2.5 font-medium text-slate-800">
                {unitRentDue > 0 ? formatCurrency(unitRentDue) : formatCurrency(unit.monthlyRent)}
              </Td>

              {/* Status */}
              <Td className="whitespace-nowrap py-2.5">
                <span
                  className={cn(
                    'inline-block rounded-md border px-2.5 py-0.5 text-xs font-semibold uppercase',
                    getOutlinedStatusColor(unit.status)
                  )}
                >
                  {unit.status.toUpperCase()}
                </span>
              </Td>
            </tr>
          );
        })}
    </>
  );
}
