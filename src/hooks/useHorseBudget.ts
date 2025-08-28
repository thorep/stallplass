'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export type BudgetOccurrence = {
  budgetItemId: string;
  title: string;
  category: string;
  emoji?: string | null;
  baseAmount: number;
  amount: number;
  isRecurring: boolean;
  month: string; // YYYY-MM
  hasOverride: boolean;
  skipped: boolean;
  intervalMonths?: number | null;
  note?: string | null;
  day: number;
};

export type BudgetMonth = {
  month: string; // YYYY-MM
  total: number;
  items: BudgetOccurrence[];
};

export const budgetKeys = {
  all: ['budget'] as const,
  range: (horseId: string, from: string, to: string) => [...budgetKeys.all, horseId, from, to] as const,
};

export type CreateBudgetItemInput = {
  title: string;
  category: string;
  amount: number;
  isRecurring?: boolean;
  startMonth: string;
  endMonth?: string | null;
  intervalMonths?: number | null;
  intervalWeeks?: number | null;
  weekday?: number | null;
  anchorDay?: number | null;
  notes?: string | null;
  emoji?: string | null;
};

export type UpdateBudgetItemInput = Partial<CreateBudgetItemInput>;

export function useBudgetRange(horseId: string | undefined, from: string, to: string) {
  return useQuery({
    queryKey: budgetKeys.range(horseId || '', from, to),
    queryFn: async () => {
      if (!horseId) return null;
      const res = await fetch(`/api/horses/${horseId}/budget?from=${from}&to=${to}`, { credentials: 'include' });
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error(`Failed to fetch budget: ${res.statusText}`);
      }
      return (await res.json()) as { months: BudgetMonth[] };
    },
    enabled: !!horseId,
    staleTime: 60_000,
  });
}

export function useCreateBudgetItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ horseId, data }: { horseId: string; data: CreateBudgetItemInput }) => {
      const res = await fetch(`/api/horses/${horseId}/budget/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const e = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(e?.error || 'Failed to create budget item');
      }
      return res.json();
    },
    onSuccess: () => {
      // Invalidate any cached ranges for this horse
      qc.invalidateQueries({ queryKey: budgetKeys.all });
    },
  });
}

export function useUpdateBudgetItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ horseId, itemId, data }: { horseId: string; itemId: string; data: UpdateBudgetItemInput }) => {
      const res = await fetch(`/api/horses/${horseId}/budget/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const e = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(e?.error || 'Failed to update budget item');
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: budgetKeys.all });
    },
  });
}

export function useDeleteBudgetItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ horseId, itemId }: { horseId: string; itemId: string }) => {
      const res = await fetch(`/api/horses/${horseId}/budget/items/${itemId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || 'Failed to delete budget item');
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: budgetKeys.all });
    },
  });
}

export function useUpsertOverride() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ horseId, data }: { horseId: string; data: { budgetItemId: string; month: string; overrideAmount?: number | null; skip?: boolean; note?: string | null } }) => {
      const res = await fetch(`/api/horses/${horseId}/budget/overrides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || 'Failed to set override');
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: budgetKeys.all });
    },
  });
}

export function useDeleteOverride() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ horseId, data }: { horseId: string; data: { budgetItemId: string; month: string } }) => {
      const res = await fetch(`/api/horses/${horseId}/budget/overrides`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || 'Failed to delete override');
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: budgetKeys.all });
    },
  });
}
