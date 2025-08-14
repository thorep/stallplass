import { useQuery } from '@tanstack/react-query';

export interface AdvertisementSettings {
  advertisementChance: number;
  advertisementMinPos: number;
  advertisementMaxPos: number;
}

// Public hook for fetching advertisement settings (no auth required)
export function usePublicAdvertisementSettings() {
  return useQuery({
    queryKey: ['public-advertisement-settings'],
    queryFn: async (): Promise<AdvertisementSettings> => {
      const response = await fetch('/api/advertisement-settings');
      
      if (!response.ok) {
        // Return default values if API fails
        return {
          advertisementChance: 50,
          advertisementMinPos: 1,
          advertisementMaxPos: 40,
        };
      }
      
      const result = await response.json();
      return result.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
}