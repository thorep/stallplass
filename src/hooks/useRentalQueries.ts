'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getStableOwnerRentals,
  getStableRentals,
  createRental,
  updateRentalStatus,
  getStableOwnerRentalStats
} from '@/services/rental-service';
import type { 
  CreateRentalData
} from '@/services/rental-service';
import type { RentalStatus } from '@/generated/prisma';

/**
 * TanStack Query hooks for rental data fetching and management
 * These hooks use Prisma-generated types for type safety
 */

// Query key factory for consistent cache management
export const rentalKeys = {
  all: ['rentals'] as const,
  lists: () => [...rentalKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...rentalKeys.lists(), { filters }] as const,
  details: () => [...rentalKeys.all, 'detail'] as const,
  detail: (id: string) => [...rentalKeys.details(), id] as const,
  byOwner: (ownerId: string) => [...rentalKeys.all, 'by-owner', ownerId] as const,
  byRenter: (renterId: string) => [...rentalKeys.all, 'by-renter', renterId] as const,
  byStable: (stableId: string) => [...rentalKeys.all, 'by-stable', stableId] as const,
  byBox: (boxId: string) => [...rentalKeys.all, 'by-box', boxId] as const,
  active: () => [...rentalKeys.all, 'active'] as const,
};

/**
 * Get all rentals for a user (as stable owner)
 * Note: Currently only supports stable owner view, not renter view
 */
export function useAllRentals(userId: string | undefined) {
  return useQuery({
    queryKey: [...rentalKeys.all, 'by-user', userId || ''],
    queryFn: async () => {
      if (!userId) return [];
      return getStableOwnerRentals(userId);
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 3,
    throwOnError: false,
  });
}

/**
 * Get rentals for a stable owner
 */
export function useStableOwnerRentals(ownerId: string | undefined) {
  return useQuery({
    queryKey: rentalKeys.byOwner(ownerId || ''),
    queryFn: () => getStableOwnerRentals(ownerId!),
    enabled: !!ownerId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 3,
    throwOnError: false,
  });
}

/**
 * Get rentals by stable
 */
export function useRentalsByStable(stableId: string | undefined) {
  return useQuery({
    queryKey: rentalKeys.byStable(stableId || ''),
    queryFn: () => getStableRentals(stableId!),
    enabled: !!stableId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 3,
    throwOnError: false,
  });
}

/**
 * Create a new rental mutation
 */
export function useCreateRental() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateRentalData) => createRental(data),
    onSuccess: (newRental) => {
      // Invalidate all rental queries
      queryClient.invalidateQueries({ queryKey: rentalKeys.all });
      
      // Set the new rental in cache
      queryClient.setQueryData(rentalKeys.detail(newRental.id), newRental);
      
      // Invalidate box and stable queries since availability changed
      queryClient.invalidateQueries({ queryKey: ['boxes', 'detail', newRental.boxId] });
      queryClient.invalidateQueries({ queryKey: ['stables', 'detail', newRental.stableId] });
    },
    onError: (error) => {
      console.error('Failed to create rental:', error);
    },
    throwOnError: false,
  });
}

/**
 * Update rental status mutation
 */
export function useUpdateRentalStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: RentalStatus }) =>
      updateRentalStatus(id, status),
    onSuccess: (updatedRental, variables) => {
      // Update the specific rental in cache
      queryClient.setQueryData(rentalKeys.detail(variables.id), updatedRental);
      
      // Invalidate rental lists
      queryClient.invalidateQueries({ queryKey: rentalKeys.lists() });
      
      // If ending rental, invalidate box availability
      if (variables.status === 'ENDED' || variables.status === 'CANCELLED') {
        queryClient.invalidateQueries({ queryKey: ['boxes', 'detail', updatedRental.boxId] });
      }
    },
    onError: (error) => {
      console.error('Failed to update rental status:', error);
    },
    throwOnError: false,
  });
}


/**
 * Get active rentals count for a stable
 */
export function useActiveRentalsCount(stableId: string | undefined) {
  return useQuery({
    queryKey: [...rentalKeys.byStable(stableId || ''), 'count', 'active'],
    queryFn: async () => {
      if (!stableId) return 0;
      const rentals = await getStableRentals(stableId);
      return rentals.filter(r => r.status === 'ACTIVE').length;
    },
    enabled: !!stableId,
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: 3,
    throwOnError: false,
  });
}

/**
 * Rental statistics for dashboard using the dedicated stats function
 */
export function useRentalStats(userId: string | undefined) {
  return useQuery({
    queryKey: [...rentalKeys.all, 'stats', userId || ''],
    queryFn: () => getStableOwnerRentalStats(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    throwOnError: false,
  });
}

/**
 * Missing rental functions referenced in build errors
 */

// Review-related functions
export function useReviewableRentals() {
  return useQuery({
    queryKey: [...rentalKeys.all, 'reviewable'],
    queryFn: async () => {
      // TODO: Implement reviewable rentals fetching
      return [];
    },
    staleTime: 5 * 60 * 1000,
    throwOnError: false,
  });
}

export function useReviews() {
  return useQuery({
    queryKey: ['reviews'],
    queryFn: async () => {
      // TODO: Implement reviews fetching
      return [];
    },
    staleTime: 5 * 60 * 1000,
    throwOnError: false,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      // TODO: Implement review creation
      throw new Error('Review creation not yet implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
    throwOnError: false,
  });
}

export function useUpdateReview() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      // TODO: Implement review update
      throw new Error('Review update not yet implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
    throwOnError: false,
  });
}