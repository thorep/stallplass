/**
 * Stable query hooks using English terminology and Supabase types
 * Simple, direct queries for stable data operations
 */

import { useQuery } from '@tanstack/react-query';
import { 
  getAllStables,
  getStableById,
  searchStables,
  getFeaturedStables,
  getStablesByOwner,
  getAllStablesWithBoxStats
} from '@/services/stable-service';
import { StableWithAmenities, StableWithBoxStats, StableSearchFilters } from '@/types/stable';

/**
 * Get all public stables (with active advertising)
 */
export function useStables() {
  return useQuery({
    queryKey: ['stables'],
    queryFn: () => getAllStables(false),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get single stable by ID with full details
 */
export function useStable(id?: string) {
  return useQuery({
    queryKey: ['stable', id],
    queryFn: () => id ? getStableById(id) : Promise.resolve(null),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Get stables with box statistics
 */
export function useStablesWithStats() {
  return useQuery({
    queryKey: ['stables', 'withStats'],
    queryFn: () => getAllStablesWithBoxStats(),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Search stables with filters
 */
export function useStableSearch(filters: StableSearchFilters = {}) {
  return useQuery({
    queryKey: ['stables', 'search', filters],
    queryFn: () => searchStables(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
  });
}

/**
 * Get stables by owner
 */
export function useStablesByOwner(ownerId?: string) {
  return useQuery({
    queryKey: ['stables', 'owner', ownerId],
    queryFn: () => ownerId ? getStablesByOwner(ownerId) : Promise.resolve([]),
    enabled: !!ownerId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get featured stables for homepage
 */
export function useFeaturedStables() {
  return useQuery({
    queryKey: ['stables', 'featured'],
    queryFn: getFeaturedStables,
    staleTime: 10 * 60 * 1000, // 10 minutes for featured content
  });
}

// Export types
export type { StableWithAmenities, StableWithBoxStats };