// TanStack Query hooks for stable data
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StableWithBoxStats, StableWithAmenities, CreateStableData, UpdateStableData } from '@/types';
import { QUERY_STALE_TIMES } from '@/utils';

// Query Keys
export const stableKeys = {
  all: ['stables'] as const,
  withBoxStats: () => [...stableKeys.all, 'withBoxStats'] as const,
  byOwner: (ownerId: string) => [...stableKeys.all, 'byOwner', ownerId] as const,
  byId: (id: string) => [...stableKeys.all, 'byId', id] as const,
  search: (filters: Record<string, unknown>) => [...stableKeys.all, 'search', filters] as const,
};

// Stable API functions
async function fetchStablesWithBoxStats(): Promise<StableWithBoxStats[]> {
  const response = await fetch('/api/stables?withBoxStats=true');
  if (!response.ok) throw new Error('Failed to fetch stables');
  return response.json();
}

async function fetchStablesByOwner(ownerId: string): Promise<StableWithAmenities[]> {
  const response = await fetch(`/api/stables?ownerId=${ownerId}`);
  if (!response.ok) throw new Error('Failed to fetch stables');
  return response.json();
}

async function fetchStableById(id: string): Promise<StableWithAmenities> {
  const response = await fetch(`/api/stables/${id}`);
  if (!response.ok) throw new Error('Failed to fetch stable');
  return response.json();
}

async function createStable(data: CreateStableData): Promise<StableWithAmenities> {
  const response = await fetch('/api/stables', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create stable');
  return response.json();
}

async function updateStable(id: string, data: UpdateStableData): Promise<StableWithAmenities> {
  const response = await fetch(`/api/stables/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update stable');
  return response.json();
}

async function deleteStable(id: string): Promise<void> {
  const response = await fetch(`/api/stables/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete stable');
}

// Hooks
export function useStablesWithBoxStats(enabled = true) {
  return useQuery({
    queryKey: stableKeys.withBoxStats(),
    queryFn: fetchStablesWithBoxStats,
    enabled,
    staleTime: QUERY_STALE_TIMES.STABLE_DATA,
  });
}

export function useStablesByOwner(ownerId?: string, enabled = true) {
  return useQuery({
    queryKey: stableKeys.byOwner(ownerId || ''),
    queryFn: () => fetchStablesByOwner(ownerId!),
    enabled: enabled && !!ownerId,
    staleTime: QUERY_STALE_TIMES.STABLE_DATA,
  });
}

export function useStableById(id?: string, enabled = true) {
  return useQuery({
    queryKey: stableKeys.byId(id || ''),
    queryFn: () => fetchStableById(id!),
    enabled: enabled && !!id,
    staleTime: QUERY_STALE_TIMES.STABLE_DATA,
  });
}

export function useCreateStable() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createStable,
    onSuccess: () => {
      // Invalidate and refetch stables
      queryClient.invalidateQueries({ queryKey: stableKeys.all });
    },
  });
}

export function useUpdateStable() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStableData }) => 
      updateStable(id, data),
    onSuccess: (data, variables) => {
      // Update specific stable in cache
      queryClient.setQueryData(stableKeys.byId(variables.id), data);
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: stableKeys.all });
    },
  });
}

export function useDeleteStable() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteStable,
    onSuccess: () => {
      // Invalidate and refetch stables
      queryClient.invalidateQueries({ queryKey: stableKeys.all });
    },
  });
}