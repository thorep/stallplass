'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/supabase-auth-context';
import { type InvoiceItemType, type InvoiceRequestStatus } from '@/generated/prisma';

// Interface for admin invoice request filters
export interface InvoiceRequestFilters {
  status?: InvoiceRequestStatus;
  sortBy?: 'createdAt' | 'amount' | 'fullName' | 'status';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

/**
 * TanStack Query hooks for invoice request management
 */

// Query key factory
export const invoiceRequestKeys = {
  all: ['invoice-requests'] as const,
  lists: () => [...invoiceRequestKeys.all, 'list'] as const,
  detail: (id: string) => [...invoiceRequestKeys.all, 'detail', id] as const,
  admin: (filters?: InvoiceRequestFilters) => [...invoiceRequestKeys.all, 'admin', filters] as const,
};

/**
 * Get all invoice requests (admin only) with filtering, sorting, and pagination
 */
export function useGetInvoiceRequests(filters: InvoiceRequestFilters = {}) {
  const { getIdToken } = useAuth();

  return useQuery({
    queryKey: invoiceRequestKeys.admin(filters),
    queryFn: async () => {
      const token = await getIdToken();
      
      // Build query parameters
      const searchParams = new URLSearchParams({ admin: 'true' });
      
      if (filters.status) searchParams.set('status', filters.status);
      if (filters.sortBy) searchParams.set('sortBy', filters.sortBy);
      if (filters.sortOrder) searchParams.set('sortOrder', filters.sortOrder);
      if (filters.page) searchParams.set('page', filters.page.toString());
      if (filters.pageSize) searchParams.set('pageSize', filters.pageSize.toString());
      
      const response = await fetch(`/api/invoice-requests?${searchParams.toString()}`, {
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
 * Get invoice requests for current profile
 */
export function useGetProfileInvoiceRequests() {
  const { getIdToken } = useAuth();

  return useQuery({
    queryKey: [...invoiceRequestKeys.all, 'profile'],
    queryFn: async () => {
      const token = await getIdToken();
      const response = await fetch('/api/invoice-requests/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to fetch profile invoice requests: ${response.statusText}`);
      }
      const data = await response.json();
      return data.invoiceRequests || [];
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
      slots?: number;
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
      queryClient.invalidateQueries({ queryKey: invoiceRequestKeys.all });
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
      queryClient.invalidateQueries({ queryKey: invoiceRequestKeys.all });
    }
  });
}

// Legacy alias for backward compatibility during migration
export function useGetUserInvoiceRequests() {
  return useGetProfileInvoiceRequests();
}