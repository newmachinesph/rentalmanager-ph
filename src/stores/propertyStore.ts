import { create } from 'zustand';
import { authFetch } from '@/lib/fetchWithAuth';
import { Property, PropertyType, Unit, ViewMode } from '@/lib/types';

interface PropertyState {
  properties: Property[];
  selectedProperty: Property | null;
  viewMode: ViewMode;
  searchQuery: string;
  filterType: PropertyType | 'All';
  loading: boolean;
  error: string | null;

  fetchProperties: () => Promise<void>;
  setProperties: (properties: Property[]) => void;
  addProperty: (property: Omit<Property, 'id' | 'createdAt'>) => Promise<void>;
  updateProperty: (id: string, updates: Partial<Property>) => Promise<void>;
  deleteProperty: (id: string) => Promise<void>;
  deleteMultiple: (ids: string[]) => Promise<number>;
  selectProperty: (property: Property | null) => void;

  addUnit: (propertyId: string, unit: Omit<Unit, 'id' | 'propertyId'>) => Promise<void>;
  updateUnit: (propertyId: string, unitId: string, updates: Partial<Unit>) => Promise<void>;
  deleteUnit: (propertyId: string, unitId: string) => Promise<void>;

  setViewMode: (viewMode: ViewMode) => void;
  setSearchQuery: (searchQuery: string) => void;
  setFilterType: (filterType: PropertyType | 'All') => void;
}

export const usePropertyStore = create<PropertyState>((set) => ({
  properties: [],
  selectedProperty: null,
  viewMode: 'card',
  searchQuery: '',
  filterType: 'All',
  loading: false,
  error: null,

  fetchProperties: async () => {
    set({ loading: true, error: null });
    try {
      const res = await authFetch('/api/properties');
      if (!res.ok) throw new Error('Failed to fetch properties');
      const json = await res.json();
      set({ properties: json.data, loading: false });
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : 'Failed to fetch properties' });
    }
  },

  setProperties: (properties) => set({ properties }),

  addProperty: async (property) => {
    const res = await authFetch('/api/properties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(property),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create property');
    }
    const created = await res.json();
    set((state) => ({ properties: [created, ...state.properties] }));
  },

  updateProperty: async (id, updates) => {
    const res = await authFetch(`/api/properties/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update property');
    }
    const updated = await res.json();
    set((state) => ({
      properties: state.properties.map((p) => (p.id === id ? updated : p)),
      selectedProperty: state.selectedProperty?.id === id ? updated : state.selectedProperty,
    }));
  },

  deleteProperty: async (id) => {
    const res = await authFetch(`/api/properties/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete property');
    }
    set((state) => ({
      properties: state.properties.filter((p) => p.id !== id),
      selectedProperty: state.selectedProperty?.id === id ? null : state.selectedProperty,
    }));
  },

  deleteMultiple: async (ids) => {
    const results = await Promise.allSettled(
      ids.map((id) => authFetch(`/api/properties/${id}`, { method: 'DELETE' }))
    );
    const deletedIds = ids.filter((_, i) => results[i].status === 'fulfilled' && (results[i] as PromiseFulfilledResult<Response>).value.ok);
    set((state) => ({
      properties: state.properties.filter((p) => !deletedIds.includes(p.id)),
      selectedProperty: state.selectedProperty && deletedIds.includes(state.selectedProperty.id) ? null : state.selectedProperty,
    }));
    return ids.length - deletedIds.length;
  },

  selectProperty: (property) => set({ selectedProperty: property }),

  addUnit: async (propertyId, unit) => {
    set({ error: null });
    try {
      const res = await authFetch(`/api/properties/${propertyId}/units`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(unit),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create unit');
      }
      const created = await res.json();
      set((state) => ({
        properties: state.properties.map((p) =>
          p.id === propertyId ? { ...p, units: [...p.units, created] } : p
        ),
      }));
    } catch (e) {
      set({ error: (e as Error).message });
      throw e;
    }
  },

  updateUnit: async (propertyId, unitId, updates) => {
    set({ error: null });
    try {
      const res = await authFetch(`/api/properties/${propertyId}/units/${unitId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update unit');
      }
      const updated = await res.json();
      set((state) => ({
        properties: state.properties.map((p) =>
          p.id === propertyId
            ? { ...p, units: p.units.map((u) => (u.id === unitId ? updated : u)) }
            : p
        ),
      }));
    } catch (e) {
      set({ error: (e as Error).message });
      throw e;
    }
  },

  deleteUnit: async (propertyId, unitId) => {
    set({ error: null });
    try {
      const res = await authFetch(`/api/properties/${propertyId}/units/${unitId}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete unit');
      }
      set((state) => ({
        properties: state.properties.map((p) =>
          p.id === propertyId
            ? { ...p, units: p.units.filter((u) => u.id !== unitId) }
            : p
        ),
      }));
    } catch (e) {
      set({ error: (e as Error).message });
      throw e;
    }
  },

  setViewMode: (viewMode) => set({ viewMode }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setFilterType: (filterType) => set({ filterType }),
}));
