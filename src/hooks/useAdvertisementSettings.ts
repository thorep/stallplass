import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface AdvertisementSettings {
  advertisementChance: number;
  advertisementMinPos: number;
  advertisementMaxPos: number;
}

// Hook for fetching advertisement settings
export function useAdvertisementSettings() {
  return useQuery({
    queryKey: ['advertisement-settings'],
    queryFn: async (): Promise<AdvertisementSettings> => {
      const response = await fetch('/api/admin/advertisement-settings', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch advertisement settings');
      }
      
      const result = await response.json();
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

// Hook for updating advertisement settings
export function useUpdateAdvertisementSettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (settings: AdvertisementSettings): Promise<AdvertisementSettings> => {
      const response = await fetch('/api/admin/advertisement-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(settings),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update advertisement settings');
      }
      
      const result = await response.json();
      return result.data;
    },
    onSuccess: () => {
      // Invalidate and refetch settings
      queryClient.invalidateQueries({ queryKey: ['advertisement-settings'] });
    },
  });
}