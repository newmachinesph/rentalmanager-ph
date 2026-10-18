import { create } from 'zustand';
import { authFetch } from '@/lib/fetchWithAuth';
import type { Contract, ContractStatus } from '@/lib/types';

interface ContractState {
  contracts: Contract[];
  loading: boolean;
  error: string | null;

  fetchContracts: () => Promise<void>;
  createContract: (leaseId: string, meta: Record<string, string>) => Promise<Contract>;
  updateContract: (id: string, updates: Partial<{ status: ContractStatus; signedDate: string; notes: string; content: string }>) => Promise<void>;
  deleteContract: (id: string) => Promise<void>;
}

export const useContractStore = create<ContractState>((set) => ({
  contracts: [],
  loading: false,
  error: null,

  fetchContracts: async () => {
    set({ loading: true, error: null });
    try {
      const res = await authFetch('/api/contracts');
      if (!res.ok) throw new Error('Failed to fetch contracts');
      const json = await res.json();
      set({ contracts: json.data, loading: false });
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : 'Failed to fetch contracts' });
    }
  },

  createContract: async (leaseId, meta) => {
    const res = await authFetch('/api/contracts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leaseId, ...meta }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create contract');
    }
    const created = await res.json();
    set((state) => ({ contracts: [created, ...state.contracts] }));
    return created;
  },

  updateContract: async (id, updates) => {
    const res = await authFetch(`/api/contracts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update contract');
    }
    const updated = await res.json();
    set((state) => ({
      contracts: state.contracts.map((c) => (c.id === id ? updated : c)),
    }));
  },

  deleteContract: async (id) => {
    const res = await authFetch(`/api/contracts/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete contract');
    }
    set((state) => ({ contracts: state.contracts.filter((c) => c.id !== id) }));
  },
}));
