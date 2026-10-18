import { create } from 'zustand';
import { authFetch } from '@/lib/fetchWithAuth';
import { Lease, LeaseStatus, ViewMode } from '@/lib/types';

interface LeaseState {
  leases: Lease[];
  selectedLease: Lease | null;
  viewMode: ViewMode;
  searchQuery: string;
  filterStatus: LeaseStatus | 'All';
  loading: boolean;
  error: string | null;

  fetchLeases: () => Promise<void>;
  setLeases: (leases: Lease[]) => void;
  addLease: (lease: Omit<Lease, 'id' | 'createdAt'>) => Promise<void>;
  updateLease: (id: string, updates: Partial<Lease>) => Promise<void>;
  deleteLease: (id: string) => Promise<void>;
  deleteMultiple: (ids: string[]) => Promise<number>;
  selectLease: (lease: Lease | null) => void;
  setViewMode: (viewMode: ViewMode) => void;
  setSearchQuery: (searchQuery: string) => void;
  setFilterStatus: (filterStatus: LeaseStatus | 'All') => void;
}

export const useLeaseStore = create<LeaseState>((set) => ({
  leases: [],
  selectedLease: null,
  viewMode: 'table',
  searchQuery: '',
  filterStatus: 'All',
  loading: false,
  error: null,

  fetchLeases: async () => {
    set({ loading: true, error: null });
    try {
      const res = await authFetch('/api/leases');
      if (!res.ok) throw new Error('Failed to fetch leases');
      const json = await res.json();
      set({ leases: json.data, loading: false });
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : 'Failed to fetch leases' });
    }
  },

  setLeases: (leases) => set({ leases }),

  addLease: async (lease) => {
    const res = await authFetch('/api/leases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lease),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create lease');
    }
    const created = await res.json();
    set((state) => ({ leases: [created, ...state.leases] }));
  },

  updateLease: async (id, updates) => {
    const res = await authFetch(`/api/leases/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update lease');
    }
    const updated = await res.json();
    set((state) => ({
      leases: state.leases.map((l) => (l.id === id ? updated : l)),
      selectedLease: state.selectedLease?.id === id ? updated : state.selectedLease,
    }));
  },

  deleteLease: async (id) => {
    const res = await authFetch(`/api/leases/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete lease');
    }
    set((state) => ({
      leases: state.leases.filter((l) => l.id !== id),
      selectedLease: state.selectedLease?.id === id ? null : state.selectedLease,
    }));
  },

  deleteMultiple: async (ids) => {
    const results = await Promise.allSettled(
      ids.map((id) => authFetch(`/api/leases/${id}`, { method: 'DELETE' }))
    );
    const deletedIds = ids.filter((_, i) => results[i].status === 'fulfilled' && (results[i] as PromiseFulfilledResult<Response>).value.ok);
    set((state) => ({
      leases: state.leases.filter((l) => !deletedIds.includes(l.id)),
      selectedLease: state.selectedLease && deletedIds.includes(state.selectedLease.id) ? null : state.selectedLease,
    }));
    return ids.length - deletedIds.length;
  },

  selectLease: (lease) => set({ selectedLease: lease }),
  setViewMode: (viewMode) => set({ viewMode }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setFilterStatus: (filterStatus) => set({ filterStatus }),
}));
