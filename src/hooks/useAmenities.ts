'use client';

import { useQuery } from '@tanstack/react-query';
import { getAllStableAmenities, getAllBoxAmenities } from '@/services/amenity-service';

/**
 * TanStack Query hooks for amenity data fetching
 * These hooks provide caching, loading states, and error handling for amenity operations
 */

// Query key factory for amenity queries
export const amenityKeys = {
  all: ['amenities'] as const,
  stableAmenities: () => [...amenityKeys.all, 'stable'] as const,
  boxAmenities: () => [...amenityKeys.all, 'box'] as const,
};

/**
 * Get all stable amenities
 */
export function useStableAmenities() {
  return useQuery({
    queryKey: amenityKeys.stableAmenities(),
    queryFn: () => getAllStableAmenities(),
    staleTime: 60 * 60 * 1000, // 1 hour - amenities rarely change
    retry: 3,
    throwOnError: false,
  });
}

/**
 * Get all box amenities
 */
export function useBoxAmenities() {
  return useQuery({
    queryKey: amenityKeys.boxAmenities(),
    queryFn: () => getAllBoxAmenities(),
    staleTime: 60 * 60 * 1000, // 1 hour - amenities rarely change
    retry: 3,
    throwOnError: false,
  });
}

/**
 * Get all amenities (both stable and box)
 */
export function useAllAmenities() {
  const stableAmenitiesQuery = useStableAmenities();
  const boxAmenitiesQuery = useBoxAmenities();

  return {
    stableAmenities: stableAmenitiesQuery.data || [],
    boxAmenities: boxAmenitiesQuery.data || [],
    isLoading: stableAmenitiesQuery.isLoading || boxAmenitiesQuery.isLoading,
    isError: stableAmenitiesQuery.isError || boxAmenitiesQuery.isError,
    error: stableAmenitiesQuery.error || boxAmenitiesQuery.error,
  };
}