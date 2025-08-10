import { useQuery } from '@tanstack/react-query';

export interface PublicServiceType {
  id: string;
  name: string;
  displayName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Hook to fetch active service types for public use (filtering, forms, etc.)
 */
export function useActiveServiceTypes() {
  return useQuery({
    queryKey: ['active-service-types'],
    queryFn: async (): Promise<PublicServiceType[]> => {
      const response = await fetch('/api/service-types', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch service types');
      }
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    throwOnError: false,
  });
}