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
  discounts: () => [...pricingKeys.all, 'discounts'] as const,
  boxQuantityDiscounts: () => [...pricingKeys.all, 'box-quantity-discounts'] as const,
  calculate: (boxes: number, months: number) => [...pricingKeys.all, 'calculate', boxes, months] as const,
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
    mutationFn: async (data: { boxAdvertising: number; boxBoost: number; serviceBase: number }) => {
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
    mutationFn: async (data: { type: 'box' | 'service' | 'boost'; months?: number; days?: number; percentage: number; isActive?: boolean }) => {
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
 * Update discount
 */
export function usePutDiscount() {
  const { getIdToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; type: 'box' | 'service' | 'boost'; months?: number; days?: number; percentage: number; isActive?: boolean }) => {
      const token = await getIdToken();
      const response = await fetch('/api/admin/pricing/discounts', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to update discount: ${response.statusText}`);
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
    mutationFn: async (data: { id: string; type: 'box' | 'service' | 'boost' }) => {
      const token = await getIdToken();
      const response = await fetch(`/api/admin/pricing/discounts?id=${data.id}&type=${data.type}`, {
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

/**
 * Get box quantity discounts
 */
export function useGetBoxQuantityDiscounts() {
  const { getIdToken } = useAuth();

  return useQuery({
    queryKey: pricingKeys.boxQuantityDiscounts(),
    queryFn: async () => {
      const token = await getIdToken();
      const response = await fetch('/api/admin/pricing/box-quantity-discounts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to fetch box quantity discounts: ${response.statusText}`);
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Create box quantity discount
 */
export function usePostBoxQuantityDiscount() {
  const { getIdToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { minBoxes: number; maxBoxes: number | null; discountPercentage: number; isActive?: boolean }) => {
      const token = await getIdToken();
      const response = await fetch('/api/admin/pricing/box-quantity-discounts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to create box quantity discount: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingKeys.boxQuantityDiscounts() });
    }
  });
}

/**
 * Update box quantity discount
 */
export function usePutBoxQuantityDiscount() {
  const { getIdToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; minBoxes: number; maxBoxes: number | null; discountPercentage: number; isActive?: boolean }) => {
      const token = await getIdToken();
      const response = await fetch('/api/admin/pricing/box-quantity-discounts', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to update box quantity discount: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingKeys.boxQuantityDiscounts() });
    }
  });
}

/**
 * Delete box quantity discount
 */
export function useDeleteBoxQuantityDiscount() {
  const { getIdToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getIdToken();
      const response = await fetch(`/api/admin/pricing/box-quantity-discounts?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to delete box quantity discount: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingKeys.boxQuantityDiscounts() });
    }
  });
}

/**
 * Calculate pricing with discounts (public endpoint, no auth needed)
 */
export function useCalculatePricing(boxes: number, months: number) {
  return useQuery({
    queryKey: pricingKeys.calculate(boxes, months),
    queryFn: async () => {
      const response = await fetch(`/api/pricing/calculate?boxes=${boxes}&months=${months}`);
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to calculate pricing: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: boxes > 0 && months > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Get public pricing discounts (public endpoint, no auth needed)
 */
export function useGetPublicDiscounts() {
  return useQuery({
    queryKey: [...pricingKeys.discounts(), 'public'],
    queryFn: async () => {
      const response = await fetch('/api/pricing/discounts');
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to fetch public discounts: ${response.statusText}`);
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get public box quantity discounts (public endpoint, no auth needed)
 */
export function useGetPublicBoxQuantityDiscounts() {
  return useQuery({
    queryKey: [...pricingKeys.boxQuantityDiscounts(), 'public'],
    queryFn: async () => {
      const response = await fetch('/api/pricing/box-quantity-discounts-public');
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to fetch public box quantity discounts: ${response.statusText}`);
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}