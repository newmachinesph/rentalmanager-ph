import { create } from 'zustand';
import { authFetch } from '@/lib/fetchWithAuth';
import { UtilityReading, UtilityType } from '@/lib/types';

interface UtilityState {
  readings: UtilityReading[];
  selectedReading: UtilityReading | null;
  searchQuery: string;
  filterType: UtilityType | 'All';
  filterProperty: string;
  filterPaid: 'All' | 'Paid' | 'Unpaid';
  loading: boolean;
  error: string | null;

  fetchReadings: () => Promise<void>;
  addReading: (reading: Omit<UtilityReading, 'id' | 'createdAt'>) => Promise<void>;
  updateReading: (id: string, updates: Partial<UtilityReading>) => Promise<void>;
  deleteReading: (id: string) => Promise<void>;
  deleteMultiple: (ids: string[]) => Promise<number>;
  selectReading: (reading: UtilityReading | null) => void;
  setSearchQuery: (searchQuery: string) => void;
  setFilterType: (filterType: UtilityType | 'All') => void;
  setFilterProperty: (filterProperty: string) => void;
  setFilterPaid: (filterPaid: 'All' | 'Paid' | 'Unpaid') => void;
}

export const useUtilityStore = create<UtilityState>((set) => ({
  readings: [],
  selectedReading: null,
  searchQuery: '',
  filterType: 'All',
  filterProperty: 'All',
  filterPaid: 'All',
  loading: false,
  error: null,

  fetchReadings: async () => {
    set({ loading: true, error: null });
    try {
      const res = await authFetch('/api/utilities');
      if (!res.ok) throw new Error('Failed to fetch utility readings');
      const json = await res.json();
      set({ readings: json.data, loading: false });
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : 'Failed to fetch utility readings' });
    }
  },

  addReading: async (reading) => {
    const res = await authFetch('/api/utilities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reading),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create utility reading');
    }
    const created = await res.json();
    set((state) => ({ readings: [created, ...state.readings] }));
  },

  updateReading: async (id, updates) => {
    const res = await authFetch(`/api/utilities/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update utility reading');
    }
    const updated = await res.json();
    set((state) => ({
      readings: state.readings.map((r) => (r.id === id ? updated : r)),
      selectedReading: state.selectedReading?.id === id ? updated : state.selectedReading,
    }));
  },

  deleteReading: async (id) => {
    const res = await authFetch(`/api/utilities/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete utility reading');
    }
    set((state) => ({
      readings: state.readings.filter((r) => r.id !== id),
      selectedReading: state.selectedReading?.id === id ? null : state.selectedReading,
    }));
  },

  deleteMultiple: async (ids) => {
    const results = await Promise.allSettled(
      ids.map((id) => authFetch(`/api/utilities/${id}`, { method: 'DELETE' }))
    );
    const deletedIds = ids.filter((_, i) => results[i].status === 'fulfilled' && (results[i] as PromiseFulfilledResult<Response>).value.ok);
    set((state) => ({
      readings: state.readings.filter((r) => !deletedIds.includes(r.id)),
      selectedReading: state.selectedReading && deletedIds.includes(state.selectedReading.id) ? null : state.selectedReading,
    }));
    return ids.length - deletedIds.length;
  },

  selectReading: (reading) => set({ selectedReading: reading }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setFilterType: (filterType) => set({ filterType }),
  setFilterProperty: (filterProperty) => set({ filterProperty }),
  setFilterPaid: (filterPaid) => set({ filterPaid }),
}));
