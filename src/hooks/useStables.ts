/**
 * English stable management hooks using Supabase types
 * Comprehensive stable CRUD operations with real-time features
 */

import { useQuery } from '@tanstack/react-query';
import { TablesInsert, TablesUpdate } from '@/types/supabase';
import { getStablesByOwner, getStableById } from '@/services/stable-service-client';
// Note: createStable, updateStable, deleteStable require server-side operations via API routes

// Query Keys
export const stableKeys = {
  all: ['stables'] as const,
  withBoxStats: () => [...stableKeys.all, 'withBoxStats'] as const,
  byOwner: (ownerId: string) => [...stableKeys.all, 'byOwner', ownerId] as const,
  byId: (id: string) => [...stableKeys.all, 'byId', id] as const,
  search: (filters: Record<string, unknown>) => [...stableKeys.all, 'search', filters] as const,
};

// Type aliases
export type CreateStableData = TablesInsert<'stables'> & {
  amenityIds?: string[];
};
export type UpdateStableData = TablesUpdate<'stables'> & {
  id: string;
  amenityIds?: string[];
};

/**
 * Get all stables with box statistics
 */
export function useStablesWithBoxStats(enabled = true) {
  return useQuery({
    queryKey: stableKeys.withBoxStats(),
    queryFn: async () => {
      const { getAllStablesWithBoxStats } = await import('@/services/stable-service-client');
      return getAllStablesWithBoxStats();
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get stables by owner ID
 */
export function useStablesByOwner(ownerId?: string, enabled = true) {
  return useQuery({
    queryKey: stableKeys.byOwner(ownerId || ''),
    queryFn: () => ownerId ? getStablesByOwner(ownerId) : Promise.resolve([]),
    enabled: enabled && !!ownerId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get stable by ID
 */
export function useStableById(id?: string, enabled = true) {
  return useQuery({
    queryKey: stableKeys.byId(id || ''),
    queryFn: () => id ? getStableById(id) : Promise.resolve(null),
    enabled: enabled && !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes for individual stables
  });
}

/**
 * Search stables with filters
 */
export function useStableSearch(filters: Record<string, unknown> = {}, enabled = true) {
  return useQuery({
    queryKey: stableKeys.search(filters),
    queryFn: async () => {
      const { stables } = await import('@/services/api-client');
      return stables.search(filters);
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
  });
}

// Mutation hooks for stable operations
// Note: These require server-side operations via API routes

/**
 * Create new stable mutation - TODO: Implement via API route
 */
// export function useCreateStable() {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: async (data: CreateStableData) => {
//       const response = await fetch('/api/stables', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(data)
//       });
//       if (!response.ok) throw new Error('Failed to create stable');
//       return response.json();
//     },
//     onSuccess: (data) => {
//       queryClient.invalidateQueries({ queryKey: stableKeys.all });
//       queryClient.setQueryData(stableKeys.byId(data.id), data);
//     },
//   });
// }

/**
 * Update stable mutation - TODO: Implement via API route
 */
// export function useUpdateStable() {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: async ({ id, ...data }: { id: string } & UpdateStableData) => {
//       const response = await fetch(`/api/stables/${id}`, {
//         method: 'PUT',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(data)
//       });
//       if (!response.ok) throw new Error('Failed to update stable');
//       return response.json();
//     },
//     onSuccess: (data) => {
//       queryClient.setQueryData(stableKeys.byId(data.id), data);
//       queryClient.invalidateQueries({ queryKey: stableKeys.all });
//       if (data.owner_id) {
//         queryClient.invalidateQueries({ queryKey: stableKeys.byOwner(data.owner_id) });
//       }
//     },
//   });
// }

/**
 * Delete stable mutation - TODO: Implement via API route
 */
// export function useDeleteStable() {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: async (stableId: string) => {
//       const response = await fetch(`/api/stables/${stableId}`, {
//         method: 'DELETE'
//       });
//       if (!response.ok) throw new Error('Failed to delete stable');
//     },
//     onSuccess: (_, stableId) => {
//       queryClient.removeQueries({ queryKey: stableKeys.byId(stableId) });
//       queryClient.invalidateQueries({ queryKey: stableKeys.all });
//     },
//   });
// }