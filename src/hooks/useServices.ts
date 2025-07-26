'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  getAllServices,
  getServiceById,
  searchServices,
  getServicesForArea
} from '@/services/marketplace-service-client';
import type { 
  ServiceWithDetails,
  ServiceSearchFilters
} from '@/services/marketplace-service-client';

/**
 * TanStack Query hooks for marketplace service data fetching and management
 * 
 * Note: These hooks currently use Supabase-based service functions.
 * When services are migrated to Prisma, only the import statements and
 * function calls will need to be updated - the hook structure will remain the same.
 */

// Query key factory for consistent cache management
export const serviceKeys = {
  all: ['services'] as const,
  lists: () => [...serviceKeys.all, 'list'] as const,
  list: (filters: ServiceSearchFilters) => [...serviceKeys.lists(), { filters }] as const,
  details: () => [...serviceKeys.all, 'detail'] as const,
  detail: (id: string) => [...serviceKeys.details(), id] as const,
  byUser: (userId: string) => [...serviceKeys.all, 'by-user', userId] as const,
  search: (filters: ServiceSearchFilters) => [...serviceKeys.all, 'search', { filters }] as const,
};

/**
 * Get all active services
 */
export function useServices() {
  return useQuery({
    queryKey: serviceKeys.lists(),
    queryFn: getAllServices,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    throwOnError: false,
  });
}

/**
 * Get a single service by ID
 */
export function useService(id: string | undefined) {
  return useQuery({
    queryKey: serviceKeys.detail(id || ''),
    queryFn: () => getServiceById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    throwOnError: false,
  });
}

/**
 * Get services for a specific area
 */
export function useServicesForArea(county: string, municipality?: string) {
  return useQuery({
    queryKey: [...serviceKeys.all, 'by-area', county, municipality],
    queryFn: () => getServicesForArea(county, municipality),
    enabled: !!county,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    throwOnError: false,
  });
}

/**
 * Search services with filters
 */
export function useServiceSearch(filters: ServiceSearchFilters = {}) {
  return useQuery({
    queryKey: serviceKeys.search(filters),
    queryFn: () => searchServices(filters),
    enabled: true,
    staleTime: 3 * 60 * 1000, // 3 minutes
    retry: 3,
    throwOnError: false,
  });
}

/**
 * TODO: Service mutations will be implemented when marketplace service functions
 * are migrated to Prisma or when API endpoints are available for mutations
 */

// These mutation hooks are placeholders and will be implemented once
// the service layer supports CRUD operations

/**
 * Prefetch a service (useful for preloading)
 */
export function usePrefetchService() {
  const queryClient = useQueryClient();
  
  return {
    prefetchService: (id: string) =>
      queryClient.prefetchQuery({
        queryKey: serviceKeys.detail(id),
        queryFn: () => getServiceById(id),
        staleTime: 5 * 60 * 1000, // 5 minutes
      }),
  };
}

/**
 * Optimistic updates helper for service data
 */
export function useOptimisticServiceUpdate() {
  const queryClient = useQueryClient();
  
  return {
    updateServiceOptimistically: (
      serviceId: string, 
      updater: (old: ServiceWithDetails | undefined) => ServiceWithDetails | undefined
    ) => {
      queryClient.setQueryData(serviceKeys.detail(serviceId), updater);
    },
    revertServiceUpdate: (serviceId: string) => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.detail(serviceId) });
    },
  };
}

/**
 * Helper to get service types for filtering
 */
export const SERVICE_TYPES = ['veterinarian', 'farrier', 'trainer'] as const;
export type ServiceType = typeof SERVICE_TYPES[number];

/**
 * Service area management helpers
 */
export function useServiceAreas(serviceId: string | undefined) {
  const { data: service } = useService(serviceId);
  
  return {
    areas: service?.areas || [],
    hasArea: (county: string, municipality?: string) => {
      if (!service?.areas) return false;
      return service.areas.some(area => 
        area.county === county && 
        (!municipality || area.municipality === municipality)
      );
    },
  };
}