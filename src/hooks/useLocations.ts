'use client';

import { useQuery } from '@tanstack/react-query';

/**
 * TanStack Query hooks for location search
 */

// Query key factory
export const locationKeys = {
  all: ['locations'] as const,
  search: (query: string) => [...locationKeys.all, 'search', query] as const,
  fylker: () => [...locationKeys.all, 'fylker'] as const,
  kommuner: (fylke?: string) => [...locationKeys.all, 'kommuner', fylke] as const,
  tettsteder: (kommune?: string) => [...locationKeys.all, 'tettsteder', kommune] as const,
};

/**
 * Search locations
 */
export function useSearchLocations(query: string) {
  return useQuery({
    queryKey: locationKeys.search(query),
    queryFn: async () => {
      const response = await fetch(`/api/locations/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to search locations: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: query.length > 2, // Only search with 3+ characters
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get all fylker (counties)
 */
export function useGetFylker() {
  return useQuery({
    queryKey: locationKeys.fylker(),
    queryFn: async () => {
      const response = await fetch('/api/locations/fylker');
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to fetch fylker: ${response.statusText}`);
      }
      return response.json();
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours (locations don't change often)
  });
}

/**
 * Get kommuner for a fylke
 */
export function useGetKommuner(fylke?: string) {
  return useQuery({
    queryKey: locationKeys.kommuner(fylke),
    queryFn: async () => {
      const url = fylke ? `/api/locations/kommuner?fylke=${encodeURIComponent(fylke)}` : '/api/locations/kommuner';
      const response = await fetch(url);
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to fetch kommuner: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: true, // Always enabled, fylke is optional
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
}

/**
 * Get tettsteder for a kommune
 */
export function useGetTettsteder(kommune?: string) {
  return useQuery({
    queryKey: locationKeys.tettsteder(kommune),
    queryFn: async () => {
      const url = kommune ? `/api/locations/tettsteder?kommune=${encodeURIComponent(kommune)}` : '/api/locations/tettsteder';
      const response = await fetch(url);
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to fetch tettsteder: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: true, // Always enabled, kommune is optional
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
}