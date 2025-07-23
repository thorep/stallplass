import { useQuery } from '@tanstack/react-query';
import type { Fylke, KommuneWithFylke, TettstedWithKommune } from '@/services/location-service';

/**
 * Fetch all fylker (counties)
 */
export function useFylker() {
  return useQuery<Fylke[]>({
    queryKey: ['fylker'],
    queryFn: async () => {
      const response = await fetch('/api/locations/fylker');
      if (!response.ok) {
        throw new Error('Failed to fetch fylker');
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

/**
 * Fetch kommuner (municipalities), optionally filtered by fylke
 */
export function useKommuner(fylkeId?: string) {
  return useQuery<KommuneWithFylke[]>({
    queryKey: ['kommuner', fylkeId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (fylkeId) {
        params.append('fylke_id', fylkeId);
      }
      
      const response = await fetch(`/api/locations/kommuner?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch kommuner');
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

/**
 * Fetch tettsteder (urban settlements), optionally filtered by kommune
 */
export function useTettsteder(kommuneId?: string) {
  return useQuery<TettstedWithKommune[]>({
    queryKey: ['tettsteder', kommuneId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (kommuneId) {
        params.append('kommune_id', kommuneId);
      }
      
      const response = await fetch(`/api/locations/tettsteder?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tettsteder');
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

/**
 * Search locations by name
 */
export function useLocationSearch(searchTerm: string | null) {
  return useQuery<{
    fylker: Fylke[];
    kommuner: KommuneWithFylke[];
    tettsteder: TettstedWithKommune[];
  }>({
    queryKey: ['location-search', searchTerm],
    queryFn: async () => {
      if (!searchTerm) {
        return { fylker: [], kommuner: [], tettsteder: [] };
      }
      
      const params = new URLSearchParams({ q: searchTerm });
      const response = await fetch(`/api/locations/search?${params}`);
      if (!response.ok) {
        throw new Error('Failed to search locations');
      }
      return response.json();
    },
    enabled: !!searchTerm && searchTerm.length >= 2,
    staleTime: 1000 * 60 * 5, // 5 minutes for search results
  });
}