/**
 * English stable management hooks using Supabase types
 * Comprehensive stable CRUD operations with real-time features
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  getAllStablesWithBoxStats,
  getStablesByOwner, 
  getStableById,
  createStable,
  updateStable,
  deleteStable,
  searchStables
} from '@/services/stable-service';
import { TablesInsert, TablesUpdate } from '@/types/supabase';

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
    queryFn: getAllStablesWithBoxStats,
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
    queryFn: () => searchStables(filters),
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
  });
}

/**
 * Create new stable mutation
 */
export function useCreateStable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStable,
    onSuccess: (data) => {
      // Invalidate and refetch stable queries
      queryClient.invalidateQueries({ queryKey: stableKeys.all });
      // Add the new stable to cache
      queryClient.setQueryData(stableKeys.byId(data.id), data);
    },
    onError: (error) => {
      console.error('Error creating stable:', error);
    },
  });
}

/**
 * Update stable mutation
 */
export function useUpdateStable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & UpdateStableData) => 
      updateStable(id, data),
    onSuccess: (data) => {
      // Update specific stable in cache
      queryClient.setQueryData(stableKeys.byId(data.id), data);
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: stableKeys.all });
      if (data.owner_id) {
        queryClient.invalidateQueries({ queryKey: stableKeys.byOwner(data.owner_id) });
      }
    },
    onError: (error) => {
      console.error('Error updating stable:', error);
    },
  });
}

/**
 * Delete stable mutation
 */
export function useDeleteStable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteStable,
    onSuccess: (_, stableId) => {
      // Remove stable from cache
      queryClient.removeQueries({ queryKey: stableKeys.byId(stableId) });
      // Invalidate all stable lists
      queryClient.invalidateQueries({ queryKey: stableKeys.all });
    },
    onError: (error) => {
      console.error('Error deleting stable:', error);
    },
  });
}