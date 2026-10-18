'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authFetch } from '@/lib/fetchWithAuth';

async function apiFetch<T>(url: string): Promise<T> {
  const res = await authFetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

async function apiMutate<T>(url: string, options: RequestInit): Promise<T> {
  const res = await authFetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

// ─── Properties ─────────────────────────────────────────────
export function useProperties() {
  return useQuery({
    queryKey: ['properties'],
    queryFn: () => apiFetch<{ data: any[]; total: number }>('/api/properties'),
    select: (res) => res.data,
  });
}

export function usePropertyMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['properties'] });

  const create = useMutation({
    mutationFn: (data: any) => apiMutate('/api/properties', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, ...data }: any) => apiMutate(`/api/properties/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiMutate(`/api/properties/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}

// ─── Tenants ────────────────────────────────────────────────
export function useTenants() {
  return useQuery({
    queryKey: ['tenants'],
    queryFn: () => apiFetch<{ data: any[]; total: number }>('/api/tenants'),
    select: (res) => res.data,
  });
}

export function useTenantMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['tenants'] });

  const create = useMutation({
    mutationFn: (data: any) => apiMutate('/api/tenants', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, ...data }: any) => apiMutate(`/api/tenants/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiMutate(`/api/tenants/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}

// ─── Leases ─────────────────────────────────────────────────
export function useLeases() {
  return useQuery({
    queryKey: ['leases'],
    queryFn: () => apiFetch<{ data: any[]; total: number }>('/api/leases'),
    select: (res) => res.data,
  });
}

export function useLeaseMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['leases'] });
    qc.invalidateQueries({ queryKey: ['income'] });
  };

  const create = useMutation({
    mutationFn: (data: any) => apiMutate('/api/leases', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, ...data }: any) => apiMutate(`/api/leases/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiMutate(`/api/leases/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}

// ─── Income ─────────────────────────────────────────────────
export function useIncome() {
  return useQuery({
    queryKey: ['income'],
    queryFn: () => apiFetch<{ data: any[]; total: number; summary: any }>('/api/income'),
    select: (res) => res.data,
  });
}

export function useIncomeMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['income'] });

  const create = useMutation({
    mutationFn: (data: any) => apiMutate('/api/income', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, ...data }: any) => apiMutate(`/api/income/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiMutate(`/api/income/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}

// ─── Expenses ───────────────────────────────────────────────
export function useExpenses() {
  return useQuery({
    queryKey: ['expenses'],
    queryFn: () => apiFetch<{ data: any[]; total: number }>('/api/expenses'),
    select: (res) => res.data,
  });
}

export function useExpenseMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['expenses'] });

  const create = useMutation({
    mutationFn: (data: any) => apiMutate('/api/expenses', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, ...data }: any) => apiMutate(`/api/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiMutate(`/api/expenses/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}

// ─── Maintenance ────────────────────────────────────────────
export function useMaintenance() {
  return useQuery({
    queryKey: ['maintenance'],
    queryFn: () => apiFetch<{ data: any[]; total: number }>('/api/maintenance'),
    select: (res) => res.data,
  });
}

export function useMaintenanceMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['maintenance'] });

  const create = useMutation({
    mutationFn: (data: any) => apiMutate('/api/maintenance', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, ...data }: any) => apiMutate(`/api/maintenance/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiMutate(`/api/maintenance/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}

// ─── Utilities ──────────────────────────────────────────────
export function useUtilities() {
  return useQuery({
    queryKey: ['utilities'],
    queryFn: () => apiFetch<{ data: any[]; total: number }>('/api/utilities'),
    select: (res) => res.data,
  });
}

export function useUtilityMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['utilities'] });

  const create = useMutation({
    mutationFn: (data: any) => apiMutate('/api/utilities', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, ...data }: any) => apiMutate(`/api/utilities/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiMutate(`/api/utilities/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}

// ─── Contracts ──────────────────────────────────────────────
export function useContracts() {
  return useQuery({
    queryKey: ['contracts'],
    queryFn: () => apiFetch<{ data: any[]; total: number }>('/api/contracts'),
    select: (res) => res.data,
  });
}

export function useContractMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['contracts'] });

  const create = useMutation({
    mutationFn: (data: any) => apiMutate('/api/contracts', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, ...data }: any) => apiMutate(`/api/contracts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiMutate(`/api/contracts/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}

// ─── Dashboard ──────────────────────────────────────────────
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => apiFetch<any>('/api/dashboard/stats'),
  });
}

export function useDashboardCashflow(months?: number) {
  return useQuery({
    queryKey: ['dashboard', 'cashflow', months],
    queryFn: () => apiFetch<any>(`/api/dashboard/cashflow${months ? `?months=${months}` : ''}`),
  });
}

export function useDashboardActivity() {
  return useQuery({
    queryKey: ['dashboard', 'activity'],
    queryFn: () => apiFetch<any>('/api/dashboard/activity'),
  });
}

export function useDashboardCalendar(month?: string) {
  return useQuery({
    queryKey: ['dashboard', 'calendar', month],
    queryFn: () => apiFetch<any>(`/api/dashboard/calendar${month ? `?month=${month}` : ''}`),
  });
}

// ─── Settings ───────────────────────────────────────────────
export function useSettings(key: string) {
  return useQuery({
    queryKey: ['settings', key],
    queryFn: () => apiFetch<any>(`/api/settings/${key}`),
  });
}

// ─── Users ──────────────────────────────────────────────────
export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => apiFetch<any[]>('/api/users'),
  });
}
