'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/supabase-auth-context';
import { type Prisma, type InvoiceItemType } from '@/generated/prisma';

/**
 * TanStack Query hooks for invoice request management
 */

// Query key factory
export const invoiceRequestKeys = {
  all: ['invoice-requests'] as const,
  lists: () => [...invoiceRequestKeys.all, 'list'] as const,
  detail: (id: string) => [...invoiceRequestKeys.all, 'detail', id] as const,
  admin: () => [...invoiceRequestKeys.all, 'admin'] as const,
};

/**
 * Get all invoice requests (admin only)
 */
export function useGetInvoiceRequests() {
  const { getIdToken } = useAuth();

  return useQuery({
    queryKey: invoiceRequestKeys.lists(),
    queryFn: async () => {
      const token = await getIdToken();
      const response = await fetch('/api/invoice-requests', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to fetch invoice requests: ${response.statusText}`);
      }
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Get invoice requests for current user
 */
export function useGetUserInvoiceRequests() {
  const { getIdToken } = useAuth();

  return useQuery({
    queryKey: [...invoiceRequestKeys.all, 'user'],
    queryFn: async () => {
      const token = await getIdToken();
      const response = await fetch('/api/invoice-requests/user', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to fetch user invoice requests: ${response.statusText}`);
      }
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Create a new invoice request
 */
export function usePostInvoiceRequest() {
  const { getIdToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      itemType: InvoiceItemType;
      amount: number;
      discount: number;
      description: string;
      months?: number;
      days?: number;
      stableId?: string;
      serviceId?: string;
      boxId?: string;
      fullName: string;
      address: string;
      postalCode: string;
      city: string;
      phone: string;
      email: string;
    }) => {
      const token = await getIdToken();
      const response = await fetch('/api/invoice-requests/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to create invoice request: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceRequestKeys.lists() });
    }
  });
}

/**
 * Update invoice request status (admin only)
 */
export function usePutInvoiceRequestStatus() {
  const { getIdToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const token = await getIdToken();
      const response = await fetch(`/api/admin/invoice-requests/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to update invoice request: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceRequestKeys.lists() });
    }
  });
}