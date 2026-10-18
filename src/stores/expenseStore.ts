import { create } from 'zustand';
import { authFetch } from '@/lib/fetchWithAuth';
import { ExpenseCategory, ExpenseRecord, ViewMode } from '@/lib/types';

interface ExpenseState {
  records: ExpenseRecord[];
  selectedRecord: ExpenseRecord | null;
  viewMode: ViewMode;
  searchQuery: string;
  filterCategory: ExpenseCategory | 'All';
  filterProperty: string;
  loading: boolean;
  error: string | null;

  fetchRecords: () => Promise<void>;
  setRecords: (records: ExpenseRecord[]) => void;
  addRecord: (record: Omit<ExpenseRecord, 'id' | 'createdAt'>) => Promise<void>;
  updateRecord: (id: string, updates: Partial<ExpenseRecord>) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  deleteMultiple: (ids: string[]) => Promise<number>;
  selectRecord: (record: ExpenseRecord | null) => void;
  setViewMode: (viewMode: ViewMode) => void;
  setSearchQuery: (searchQuery: string) => void;
  setFilterCategory: (filterCategory: ExpenseCategory | 'All') => void;
  setFilterProperty: (filterProperty: string) => void;
}

export const useExpenseStore = create<ExpenseState>((set) => ({
  records: [],
  selectedRecord: null,
  viewMode: 'table',
  searchQuery: '',
  filterCategory: 'All',
  filterProperty: 'All',
  loading: false,
  error: null,

  fetchRecords: async () => {
    set({ loading: true, error: null });
    try {
      const res = await authFetch('/api/expenses');
      if (!res.ok) throw new Error('Failed to fetch expense records');
      const json = await res.json();
      set({ records: json.data, loading: false });
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : 'Failed to fetch expense records' });
    }
  },

  setRecords: (records) => set({ records }),

  addRecord: async (record) => {
    const res = await authFetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create expense record');
    }
    const created = await res.json();
    set((state) => ({ records: [created, ...state.records] }));
  },

  updateRecord: async (id, updates) => {
    const res = await authFetch(`/api/expenses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update expense record');
    }
    const updated = await res.json();
    set((state) => ({
      records: state.records.map((r) => (r.id === id ? updated : r)),
      selectedRecord: state.selectedRecord?.id === id ? updated : state.selectedRecord,
    }));
  },

  deleteRecord: async (id) => {
    const res = await authFetch(`/api/expenses/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete expense record');
    }
    set((state) => ({
      records: state.records.filter((r) => r.id !== id),
      selectedRecord: state.selectedRecord?.id === id ? null : state.selectedRecord,
    }));
  },

  deleteMultiple: async (ids) => {
    const results = await Promise.allSettled(
      ids.map((id) => authFetch(`/api/expenses/${id}`, { method: 'DELETE' }))
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
  setFilterCategory: (filterCategory) => set({ filterCategory }),
  setFilterProperty: (filterProperty) => set({ filterProperty }),
}));
