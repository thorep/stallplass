'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/supabase-auth-context';

/**
 * TanStack Query hooks for pricing management (admin only)
 */

// Query key factory
export const pricingKeys = {
  all: ['pricing'] as const,
  base: () => [...pricingKeys.all, 'base'] as const,
  sponsored: () => [...pricingKeys.all, 'sponsored'] as const,
  discounts: () => [...pricingKeys.all, 'discounts'] as const,
};

/**
 * Get base pricing
 */
export function useGetBasePricing() {
  const { getIdToken } = useAuth();

  return useQuery({
    queryKey: pricingKeys.base(),
    queryFn: async () => {
      const token = await getIdToken();
      const response = await fetch('/api/admin/pricing/base', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to fetch base pricing: ${response.statusText}`);
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Update base pricing
 */
export function usePutBasePricing() {
  const { getIdToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { stableAdvertising: number; boxAdvertising: number; serviceAdvertising: number }) => {
      const token = await getIdToken();
      const response = await fetch('/api/admin/pricing/base', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to update base pricing: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingKeys.base() });
    }
  });
}

/**
 * Get sponsored pricing
 */
export function useGetSponsoredPricing() {
  const { getIdToken } = useAuth();

  return useQuery({
    queryKey: pricingKeys.sponsored(),
    queryFn: async () => {
      const token = await getIdToken();
      const response = await fetch('/api/admin/pricing/sponsored', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to fetch sponsored pricing: ${response.statusText}`);
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Update sponsored pricing
 */
export function usePutSponsoredPricing() {
  const { getIdToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { price: number }) => {
      const token = await getIdToken();
      const response = await fetch('/api/admin/pricing/sponsored', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to update sponsored pricing: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingKeys.sponsored() });
    }
  });
}

/**
 * Get discounts
 */
export function useGetDiscounts() {
  const { getIdToken } = useAuth();

  return useQuery({
    queryKey: pricingKeys.discounts(),
    queryFn: async () => {
      const token = await getIdToken();
      const response = await fetch('/api/admin/pricing/discounts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to fetch discounts: ${response.statusText}`);
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Create discount
 */
export function usePostDiscount() {
  const { getIdToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; percentage: number; validUntil: string }) => {
      const token = await getIdToken();
      const response = await fetch('/api/admin/pricing/discounts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to create discount: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingKeys.discounts() });
    }
  });
}

/**
 * Delete discount
 */
export function useDeleteDiscount() {
  const { getIdToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getIdToken();
      const response = await fetch(`/api/admin/pricing/discounts?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to delete discount: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingKeys.discounts() });
    }
  });
}