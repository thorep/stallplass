'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useIsAdmin } from '@/hooks/useAdminQueries';

export interface AdminHorseBreed {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHorseBreedData {
  name: string;
  isActive?: boolean;
}

export interface UpdateHorseBreedData {
  name?: string;
  isActive?: boolean;
}

// Get all horse breeds (admin)
export function useAdminHorseBreeds() {
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ['admin', 'horse-breeds'],
    queryFn: async (): Promise<AdminHorseBreed[]> => {
      const res = await fetch('/api/admin/horse-breeds', { credentials: 'include' });
      if (!res.ok) {
        throw new Error('Kunne ikke hente hesteraser');
      }
      const json = await res.json();
      return json.data as AdminHorseBreed[];
    },
    enabled: !!isAdmin,
    staleTime: 10 * 60 * 1000,
    throwOnError: false,
  });
}

// Create horse breed
export function useCreateHorseBreed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateHorseBreedData): Promise<AdminHorseBreed> => {
      const res = await fetch('/api/admin/horse-breeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Kunne ikke opprette hesterase');
      }
      const json = await res.json();
      return json.data as AdminHorseBreed;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'horse-breeds'] });
    },
    throwOnError: false,
  });
}

// Update horse breed
export function useUpdateHorseBreed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateHorseBreedData }): Promise<AdminHorseBreed> => {
      const res = await fetch(`/api/admin/horse-breeds/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Kunne ikke oppdatere hesterase');
      }
      const json = await res.json();
      return json.data as AdminHorseBreed;
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'horse-breeds'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'horse-breeds', id] });
    },
    throwOnError: false,
  });
}

// Delete horse breed
export function useDeleteHorseBreed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const res = await fetch(`/api/admin/horse-breeds/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Kunne ikke slette hesterase');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'horse-breeds'] });
    },
    throwOnError: false,
  });
}

