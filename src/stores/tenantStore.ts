import { create } from 'zustand';
import { authFetch } from '@/lib/fetchWithAuth';
import { Tenant, ViewMode } from '@/lib/types';

interface TenantState {
  tenants: Tenant[];
  selectedTenant: Tenant | null;
  viewMode: ViewMode;
  searchQuery: string;
  loading: boolean;
  error: string | null;

  fetchTenants: () => Promise<void>;
  setTenants: (tenants: Tenant[]) => void;
  addTenant: (tenant: Omit<Tenant, 'id' | 'createdAt'>) => Promise<void>;
  updateTenant: (id: string, updates: Partial<Tenant>) => Promise<void>;
  deleteTenant: (id: string) => Promise<void>;
  deleteMultiple: (ids: string[]) => Promise<number>;
  selectTenant: (tenant: Tenant | null) => void;
  setViewMode: (viewMode: ViewMode) => void;
  setSearchQuery: (searchQuery: string) => void;
}

export const useTenantStore = create<TenantState>((set) => ({
  tenants: [],
  selectedTenant: null,
  viewMode: 'table',
  searchQuery: '',
  loading: false,
  error: null,

  fetchTenants: async () => {
    set({ loading: true, error: null });
    try {
      const res = await authFetch('/api/tenants');
      if (!res.ok) throw new Error('Failed to fetch tenants');
      const json = await res.json();
      set({ tenants: json.data, loading: false });
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : 'Failed to fetch tenants' });
    }
  },

  setTenants: (tenants) => set({ tenants }),

  addTenant: async (tenant) => {
    const res = await authFetch('/api/tenants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tenant),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create tenant');
    }
    const created = await res.json();
    set((state) => ({ tenants: [created, ...state.tenants] }));
  },

  updateTenant: async (id, updates) => {
    const res = await authFetch(`/api/tenants/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update tenant');
    }
    const updated = await res.json();
    set((state) => ({
      tenants: state.tenants.map((t) => (t.id === id ? updated : t)),
      selectedTenant: state.selectedTenant?.id === id ? updated : state.selectedTenant,
    }));
  },

  deleteTenant: async (id) => {
    const res = await authFetch(`/api/tenants/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete tenant');
    }
    set((state) => ({
      tenants: state.tenants.filter((t) => t.id !== id),
      selectedTenant: state.selectedTenant?.id === id ? null : state.selectedTenant,
    }));
  },

  deleteMultiple: async (ids) => {
    const results = await Promise.allSettled(
      ids.map((id) => authFetch(`/api/tenants/${id}`, { method: 'DELETE' }))
    );
    const deletedIds = ids.filter((_, i) => results[i].status === 'fulfilled' && (results[i] as PromiseFulfilledResult<Response>).value.ok);
    set((state) => ({
      tenants: state.tenants.filter((t) => !deletedIds.includes(t.id)),
      selectedTenant: state.selectedTenant && deletedIds.includes(state.selectedTenant.id) ? null : state.selectedTenant,
    }));
    return ids.length - deletedIds.length;
  },

  selectTenant: (tenant) => set({ selectedTenant: tenant }),
  setViewMode: (viewMode) => set({ viewMode }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
}));
