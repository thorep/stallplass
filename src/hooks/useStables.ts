'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { StableSearchFilters } from '@/types/services';
import type { StableWithBoxStats, StableWithAmenities } from '@/types/stable';

/**
 * API client functions for stables
 */
async function getAllStables(): Promise<StableWithAmenities[]> {
  const response = await fetch('/api/stables');
  if (!response.ok) {
    throw new Error(`Failed to fetch stables: ${response.statusText}`);
  }
  return response.json();
}

async function getStableById(id: string): Promise<StableWithAmenities | null> {
  const response = await fetch(`/api/stables/${id}`);
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Failed to fetch stable: ${response.statusText}`);
  }
  return response.json();
}

async function getStablesByOwner(ownerId: string): Promise<StableWithBoxStats[]> {
  const response = await fetch(`/api/stables?ownerId=${encodeURIComponent(ownerId)}&withBoxStats=true`);
  if (!response.ok) {
    throw new Error(`Failed to fetch stables by owner: ${response.statusText}`);
  }
  return response.json();
}

async function getAllStablesWithBoxStats(): Promise<StableWithBoxStats[]> {
  const response = await fetch('/api/stables?withBoxStats=true');
  if (!response.ok) {
    throw new Error(`Failed to fetch stables with box stats: ${response.statusText}`);
  }
  return response.json();
}

async function searchStables(filters: StableSearchFilters): Promise<StableWithBoxStats[]> {
  const searchParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  
  const response = await fetch(`/api/stables/search?${searchParams.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to search stables: ${response.statusText}`);
  }
  return response.json();
}

/**
 * TanStack Query hooks for stable data fetching and management
 * These hooks provide caching, loading states, and error handling for stable operations
 */

// Query key factory for consistent cache management
export const stableKeys = {
  all: ['stables'] as const,
  lists: () => [...stableKeys.all, 'list'] as const,
  list: (filters?: StableSearchFilters) => [...stableKeys.lists(), { filters }] as const,
  details: () => [...stableKeys.all, 'detail'] as const,
  detail: (id: string) => [...stableKeys.details(), id] as const,
  byOwner: (ownerId: string) => [...stableKeys.all, 'by-owner', ownerId] as const,
  withBoxes: (id: string) => [...stableKeys.detail(id), 'with-boxes'] as const,
  withStats: () => [...stableKeys.all, 'with-stats'] as const,
  search: (query: string) => [...stableKeys.all, 'search', query] as const,
};

/**
 * Get all stables
 */
export function useStables() {
  return useQuery({
    queryKey: stableKeys.list(),
    queryFn: () => getAllStables(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    throwOnError: false,
  });
}

/**
 * Get a single stable by ID
 */
export function useStable(id: string | undefined) {
  return useQuery({
    queryKey: stableKeys.detail(id || ''),
    queryFn: () => getStableById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    throwOnError: false,
  });
}

/**
 * Get stables by owner ID
 */
export function useStablesByOwner(ownerId: string | undefined) {
  return useQuery({
    queryKey: stableKeys.byOwner(ownerId || ''),
    queryFn: () => getStablesByOwner(ownerId!),
    enabled: !!ownerId && ownerId.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    throwOnError: false,
    refetchOnWindowFocus: true, // Allow background refetch when switching browser tabs
    refetchOnMount: true, // Always refetch when component mounts
  });
}

/**
 * Get a stable with its boxes (uses existing stable + boxes query)
 */
export function useStableWithBoxes(id: string | undefined) {
  return useQuery({
    queryKey: stableKeys.withBoxes(id || ''),
    queryFn: () => getStableById(id!),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes - boxes change frequently
    retry: 3,
    throwOnError: false,
  });
}

/**
 * Search stables
 */
export function useStableSearch(filters: StableSearchFilters) {
  return useQuery({
    queryKey: stableKeys.search(JSON.stringify(filters)),
    queryFn: () => searchStables(filters),
    enabled: Object.keys(filters).length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 3,
    throwOnError: false,
  });
}

/**
 * Get stables with box statistics for search page
 */
export function useStablesWithBoxStats() {
  return useQuery({
    queryKey: [...stableKeys.lists(), 'with-box-stats'],
    queryFn: () => getAllStablesWithBoxStats(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 3,
    throwOnError: false,
  });
}

/**
 * Prefetch stable data (useful for preloading)
 */
export function usePrefetchStable() {
  const queryClient = useQueryClient();
  
  return {
    prefetchStable: (id: string) =>
      queryClient.prefetchQuery({
        queryKey: stableKeys.detail(id),
        queryFn: () => getStableById(id),
        staleTime: 5 * 60 * 1000, // 5 minutes
      }),
  };
}