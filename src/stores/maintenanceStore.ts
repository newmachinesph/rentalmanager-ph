import { create } from 'zustand';
import { authFetch } from '@/lib/fetchWithAuth';
import { MaintenanceRequest, MaintenanceStatus, Priority, ViewMode } from '@/lib/types';

export type CompletedInFilter = '60d' | '90d' | '12m' | '2y' | 'all';

interface MaintenanceState {
  requests: MaintenanceRequest[];
  selectedRequest: MaintenanceRequest | null;
  viewMode: ViewMode;
  searchQuery: string;
  filterStatus: MaintenanceStatus | 'All';
  filterPriorities: Set<Priority>;
  filterProperties: Set<string>;
  filterCompletedIn: CompletedInFilter;
  loading: boolean;
  error: string | null;

  fetchRequests: () => Promise<void>;
  setRequests: (requests: MaintenanceRequest[]) => void;
  addRequest: (request: Omit<MaintenanceRequest, 'id' | 'createdAt'>) => Promise<void>;
  updateRequest: (id: string, updates: Partial<MaintenanceRequest>) => Promise<void>;
  deleteRequest: (id: string) => Promise<void>;
  deleteMultiple: (ids: string[]) => Promise<number>;
  selectRequest: (request: MaintenanceRequest | null) => void;
  setViewMode: (viewMode: ViewMode) => void;
  setSearchQuery: (searchQuery: string) => void;
  setFilterStatus: (filterStatus: MaintenanceStatus | 'All') => void;
  setFilterPriorities: (filterPriorities: Set<Priority>) => void;
  setFilterProperties: (filterProperties: Set<string>) => void;
  setFilterCompletedIn: (filterCompletedIn: CompletedInFilter) => void;
}

export const useMaintenanceStore = create<MaintenanceState>((set) => ({
  requests: [],
  selectedRequest: null,
  viewMode: 'table',
  searchQuery: '',
  filterStatus: 'All',
  filterPriorities: new Set<Priority>(),
  filterProperties: new Set<string>(),
  filterCompletedIn: '60d' as CompletedInFilter,
  loading: false,
  error: null,

  fetchRequests: async () => {
    set({ loading: true, error: null });
    try {
      const res = await authFetch('/api/maintenance');
      if (!res.ok) throw new Error('Failed to fetch maintenance requests');
      const json = await res.json();
      set({ requests: json.data, loading: false });
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : 'Failed to fetch maintenance requests' });
    }
  },

  setRequests: (requests) => set({ requests }),

  addRequest: async (request) => {
    const res = await authFetch('/api/maintenance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create maintenance request');
    }
    const created = await res.json();
    set((state) => ({ requests: [created, ...state.requests] }));
  },

  updateRequest: async (id, updates) => {
    const res = await authFetch(`/api/maintenance/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update maintenance request');
    }
    const updated = await res.json();
    set((state) => ({
      requests: state.requests.map((r) => (r.id === id ? updated : r)),
      selectedRequest: state.selectedRequest?.id === id ? updated : state.selectedRequest,
    }));
  },

  deleteRequest: async (id) => {
    const res = await authFetch(`/api/maintenance/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete maintenance request');
    }
    set((state) => ({
      requests: state.requests.filter((r) => r.id !== id),
      selectedRequest: state.selectedRequest?.id === id ? null : state.selectedRequest,
    }));
  },

  deleteMultiple: async (ids) => {
    const results = await Promise.allSettled(
      ids.map((id) => authFetch(`/api/maintenance/${id}`, { method: 'DELETE' }))
    );
    const deletedIds = ids.filter((_, i) => results[i].status === 'fulfilled' && (results[i] as PromiseFulfilledResult<Response>).value.ok);
    set((state) => ({
      requests: state.requests.filter((r) => !deletedIds.includes(r.id)),
      selectedRequest: state.selectedRequest && deletedIds.includes(state.selectedRequest.id) ? null : state.selectedRequest,
    }));
    return ids.length - deletedIds.length;
  },

  selectRequest: (request) => set({ selectedRequest: request }),
  setViewMode: (viewMode) => set({ viewMode }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setFilterStatus: (filterStatus) => set({ filterStatus }),
  setFilterPriorities: (filterPriorities) => set({ filterPriorities }),
  setFilterProperties: (filterProperties) => set({ filterProperties }),
  setFilterCompletedIn: (filterCompletedIn) => set({ filterCompletedIn }),
}));
