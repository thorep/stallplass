'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { 
  ServiceWithDetails,
  ServiceSearchFilters
} from '@/types/service';

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
  byLocation: (countyId: string, municipalityId?: string) => [...serviceKeys.all, 'by-location', countyId, municipalityId] as const,
};

/**
 * Get services by area (county and optional municipality)
 */
export function useServicesForArea(county: string, municipality?: string) {
  return useQuery({
    queryKey: [...serviceKeys.all, 'area', county, municipality],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      queryParams.append('county', county);
      if (municipality) {
        queryParams.append('municipality', municipality);
      }

      const response = await fetch(`/api/services?${queryParams}`);
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to fetch services: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!county,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    throwOnError: false,
  });
}

/**
 * GET services for a stable's location with hierarchical matching
 * 
 * This hook uses advanced location matching logic:
 * - Exact municipality match: Service covers "Vestfold->Sandefjord" → matches stable in "Vestfold->Sandefjord"  
 * - County-wide coverage: Service covers "Telemark" → matches any stable in Telemark county
 * 
 * Use this hook to display relevant services on stable detail pages.
 */
export function useServicesForStable(countyId: string | undefined, municipalityId?: string) {
  return useQuery({
    queryKey: serviceKeys.byLocation(countyId || '', municipalityId),
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      queryParams.append('countyId', countyId!);
      if (municipalityId) {
        queryParams.append('municipalityId', municipalityId);
      }

      const response = await fetch(`/api/services/by-location?${queryParams}`);
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to fetch services for stable location: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!countyId,
    staleTime: 5 * 60 * 1000, // 5 minutes - services don't change frequently
    retry: 3,
    throwOnError: false,
  });
}

/**
 * Get all active services
 */
export function useServices() {
  return useQuery({
    queryKey: serviceKeys.lists(),
    queryFn: async () => {
      const response = await fetch('/api/services');
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to fetch services: ${response.statusText}`);
      }
      return response.json();
    },
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
    queryFn: async () => {
      const response = await fetch(`/api/services/${id}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to fetch service: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!id,
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
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
      
      const response = await fetch(`/api/services/search?${searchParams.toString()}`);
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to search services: ${response.statusText}`);
      }
      return response.json();
    },
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
        queryFn: async () => {
          const response = await fetch(`/api/services/${id}`);
          if (!response.ok) {
            if (response.status === 404) return null;
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || `Failed to fetch service: ${response.statusText}`);
          }
          return response.json();
        },
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
      return service.areas.some((area: { county: string; municipality?: string }) => 
        area.county === county && 
        (!municipality || area.municipality === municipality)
      );
    },
  };
}