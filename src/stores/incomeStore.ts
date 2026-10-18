import { create } from 'zustand';
import { authFetch } from '@/lib/fetchWithAuth';
import { IncomeRecord, PaymentStatus, ViewMode } from '@/lib/types';

interface IncomeState {
  records: IncomeRecord[];
  selectedRecord: IncomeRecord | null;
  viewMode: ViewMode;
  searchQuery: string;
  filterStatus: PaymentStatus | 'All';
  filterProperty: string;
  loading: boolean;
  error: string | null;

  fetchRecords: () => Promise<void>;
  setRecords: (records: IncomeRecord[]) => void;
  addRecord: (record: Omit<IncomeRecord, 'id' | 'createdAt'>) => Promise<void>;
  updateRecord: (id: string, updates: Partial<IncomeRecord>) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  deleteMultiple: (ids: string[]) => Promise<number>;
  selectRecord: (record: IncomeRecord | null) => void;
  setViewMode: (viewMode: ViewMode) => void;
  setSearchQuery: (searchQuery: string) => void;
  setFilterStatus: (filterStatus: PaymentStatus | 'All') => void;
  setFilterProperty: (filterProperty: string) => void;
}

export const useIncomeStore = create<IncomeState>((set) => ({
  records: [],
  selectedRecord: null,
  viewMode: 'table',
  searchQuery: '',
  filterStatus: 'All',
  filterProperty: 'All',
  loading: false,
  error: null,

  fetchRecords: async () => {
    set({ loading: true, error: null });
    try {
      const res = await authFetch('/api/income');
      if (!res.ok) throw new Error('Failed to fetch income records');
      const json = await res.json();
      set({ records: json.data, loading: false });
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : 'Failed to fetch income records' });
    }
  },

  setRecords: (records) => set({ records }),

  addRecord: async (record) => {
    const res = await authFetch('/api/income', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create income record');
    }
    const created = await res.json();
    set((state) => ({ records: [created, ...state.records] }));
  },

  updateRecord: async (id, updates) => {
    const res = await authFetch(`/api/income/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update income record');
    }
    const updated = await res.json();
    set((state) => ({
      records: state.records.map((r) => (r.id === id ? updated : r)),
      selectedRecord: state.selectedRecord?.id === id ? updated : state.selectedRecord,
    }));
  },

  deleteRecord: async (id) => {
    const res = await authFetch(`/api/income/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete income record');
    }
    set((state) => ({
      records: state.records.filter((r) => r.id !== id),
      selectedRecord: state.selectedRecord?.id === id ? null : state.selectedRecord,
    }));
  },

  deleteMultiple: async (ids) => {
    const results = await Promise.allSettled(
      ids.map((id) => authFetch(`/api/income/${id}`, { method: 'DELETE' }))
    );
    const deletedIds = ids.filter((_, i) => results[i].status === 'fulfilled' && (results[i] as PromiseFulfilledResult<Response>).value.ok);
    set((state) => ({
      records: state.records.filter((r) => !deletedIds.includes(r.id)),
      selectedRecord: state.selectedRecord && deletedIds.includes(state.selectedRecord.id) ? null : state.selectedRecord,
    }));
    return ids.length - deletedIds.length;
  },

  selectRecord: (record) => set({ selectedRecord: record }),
  setViewMode: (viewMode) => set({ viewMode }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setFilterStatus: (filterStatus) => set({ filterStatus }),
  setFilterProperty: (filterProperty) => set({ filterProperty }),
}));
