import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useIsAdmin } from '@/hooks/useAdminQueries';

export interface ServiceType {
  id: string;
  name: string;
  displayName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceTypeData {
  name: string;
  displayName: string;
  isActive?: boolean;
}

export interface UpdateServiceTypeData {
  name?: string;
  displayName?: string;
  isActive?: boolean;
}

// Get all service types
export function useGetServiceTypes() {
  const { data: isAdmin } = useIsAdmin();
  
  return useQuery({
    queryKey: ['service-types'],
    queryFn: async (): Promise<ServiceType[]> => {
      const response = await fetch('/api/admin/service-types', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch service types');
      }
      return response.json();
    },
    enabled: !!isAdmin,
    staleTime: 10 * 60 * 1000,
    throwOnError: false,
  });
}

// Get single service type
export function useGetServiceType(id: string) {
  const { data: isAdmin } = useIsAdmin();
  
  return useQuery({
    queryKey: ['service-types', id],
    queryFn: async (): Promise<ServiceType> => {
      const response = await fetch(`/api/admin/service-types/${id}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch service type');
      }
      return response.json();
    },
    enabled: !!id && !!isAdmin,
    throwOnError: false,
  });
}

// Create service type
export function useCreateServiceType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateServiceTypeData): Promise<ServiceType> => {
      const response = await fetch('/api/admin/service-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to create service type');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-types'] });
    },
    throwOnError: false,
  });
}

// Update service type
export function useUpdateServiceType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateServiceTypeData }): Promise<ServiceType> => {
      const response = await fetch(`/api/admin/service-types/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to update service type');
      }

      return response.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['service-types'] });
      queryClient.invalidateQueries({ queryKey: ['service-types', id] });
    },
    throwOnError: false,
  });
}

// Delete service type
export function useDeleteServiceType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/admin/service-types/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to delete service type');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-types'] });
    },
    throwOnError: false,
  });
}