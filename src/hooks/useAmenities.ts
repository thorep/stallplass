// TanStack Query hooks for amenity data
import { useQuery } from '@tanstack/react-query';
import { StableAmenity, BoxAmenity } from '@/types';

// Query Keys
export const amenityKeys = {
  all: ['amenities'] as const,
  stable: () => [...amenityKeys.all, 'stable'] as const,
  box: () => [...amenityKeys.all, 'box'] as const,
};

// Amenity API functions
async function fetchStableAmenities(): Promise<StableAmenity[]> {
  const response = await fetch('/api/stable-amenities');
  if (!response.ok) throw new Error('Failed to fetch stable amenities');
  return response.json();
}

async function fetchBoxAmenities(): Promise<BoxAmenity[]> {
  const response = await fetch('/api/box-amenities');
  if (!response.ok) throw new Error('Failed to fetch box amenities');
  return response.json();
}

// Hooks
export function useStableAmenities(enabled = true) {
  return useQuery({
    queryKey: amenityKeys.stable(),
    queryFn: fetchStableAmenities,
    enabled,
    staleTime: 30 * 60 * 1000, // 30 minutes - amenities don't change often
  });
}

export function useBoxAmenities(enabled = true) {
  return useQuery({
    queryKey: amenityKeys.box(),
    queryFn: fetchBoxAmenities,
    enabled,
    staleTime: 30 * 60 * 1000, // 30 minutes - amenities don't change often
  });
}

export function useAllAmenities(enabled = true) {
  const stableAmenities = useStableAmenities(enabled);
  const boxAmenities = useBoxAmenities(enabled);
  
  return {
    stableAmenities: stableAmenities.data || [],
    boxAmenities: boxAmenities.data || [],
    isLoading: stableAmenities.isLoading || boxAmenities.isLoading,
    isError: stableAmenities.isError || boxAmenities.isError,
    error: stableAmenities.error || boxAmenities.error,
  };
}