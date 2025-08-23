'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useIsAdmin } from '@/hooks/useAdminQueries';

export interface AdminHorseDiscipline {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHorseDisciplineData {
  name: string;
  isActive?: boolean;
}

export interface UpdateHorseDisciplineData {
  name?: string;
  isActive?: boolean;
}

export function useAdminHorseDisciplines() {
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ['admin', 'horse-disciplines'],
    queryFn: async (): Promise<AdminHorseDiscipline[]> => {
      const res = await fetch('/api/admin/horse-disciplines', { credentials: 'include' });
      if (!res.ok) {
        throw new Error('Kunne ikke hente hestedisipliner');
      }
      const json = await res.json();
      return json.data as AdminHorseDiscipline[];
    },
    enabled: !!isAdmin,
    staleTime: 10 * 60 * 1000,
    throwOnError: false,
  });
}

export function useCreateHorseDiscipline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateHorseDisciplineData): Promise<AdminHorseDiscipline> => {
      const res = await fetch('/api/admin/horse-disciplines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Kunne ikke opprette hestedisiplin');
      }
      const json = await res.json();
      return json.data as AdminHorseDiscipline;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'horse-disciplines'] });
    },
    throwOnError: false,
  });
}

export function useUpdateHorseDiscipline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateHorseDisciplineData }): Promise<AdminHorseDiscipline> => {
      const res = await fetch(`/api/admin/horse-disciplines/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Kunne ikke oppdatere hestedisiplin');
      }
      const json = await res.json();
      return json.data as AdminHorseDiscipline;
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'horse-disciplines'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'horse-disciplines', id] });
    },
    throwOnError: false,
  });
}

export function useDeleteHorseDiscipline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const res = await fetch(`/api/admin/horse-disciplines/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Kunne ikke slette hestedisiplin');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'horse-disciplines'] });
    },
    throwOnError: false,
  });
}

