'use client';

import { useQuery } from '@tanstack/react-query';

/**
 * TanStack Query hooks for location data (Norwegian geographical data)
 * 
 * Note: Location services are not yet migrated to Prisma.
 * These hooks provide the structure and can be updated when
 * location data is migrated from Supabase.
 */

// Types for Norwegian location data
export interface Fylke {
  id: string;
  navn: string;
  nummer: string;
}

export interface Kommune {
  id: string;
  navn: string;
  nummer: string;
  fylkeId: string;
}

export interface KommuneWithFylke extends Kommune {
  fylke: Fylke;
}

export interface Tettsted {
  id: string;
  navn: string;
  kommuneId: string;
}

export interface TettstedWithKommune extends Tettsted {
  kommune: KommuneWithFylke;
}

// Query key factory for location queries
export const locationKeys = {
  all: ['locations'] as const,
  fylker: () => [...locationKeys.all, 'fylker'] as const,
  kommuner: (fylkeId?: string) => [...locationKeys.all, 'kommuner', fylkeId || 'all'] as const,
  tettsteder: (kommuneId?: string) => [...locationKeys.all, 'tettsteder', kommuneId || 'all'] as const,
  lookup: (query: string) => [...locationKeys.all, 'lookup', query] as const,
};

/**
 * Get all fylker (Norwegian counties)
 */
export function useFylker() {
  return useQuery({
    queryKey: locationKeys.fylker(),
    queryFn: async (): Promise<Fylke[]> => {
      // TODO: Implement when location service is migrated to Prisma
      // For now, return Norwegian counties as placeholder
      return [
        { id: '1', navn: 'Agder', nummer: '42' },
        { id: '2', navn: 'Innlandet', nummer: '34' },
        { id: '3', navn: 'Møre og Romsdal', nummer: '15' },
        { id: '4', navn: 'Nordland', nummer: '18' },
        { id: '5', navn: 'Oslo', nummer: '03' },
        { id: '6', navn: 'Rogaland', nummer: '11' },
        { id: '7', navn: 'Telemark', nummer: '40' },
        { id: '8', navn: 'Troms og Finnmark', nummer: '54' },
        { id: '9', navn: 'Trøndelag', nummer: '50' },
        { id: '10', navn: 'Vestfold og Telemark', nummer: '38' },
        { id: '11', navn: 'Vestland', nummer: '46' },
        { id: '12', navn: 'Viken', nummer: '30' },
      ];
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - geographical data rarely changes
    retry: 3,
    throwOnError: false,
  });
}

/**
 * Get kommuner (Norwegian municipalities), optionally filtered by fylke
 */
export function useKommuner(fylkeId?: string) {
  return useQuery({
    queryKey: locationKeys.kommuner(fylkeId),
    queryFn: async (): Promise<KommuneWithFylke[]> => {
      // TODO: Implement when location service is migrated to Prisma
      // For now, return placeholder data
      const allKommuner: KommuneWithFylke[] = [
        {
          id: '1',
          navn: 'Oslo',
          nummer: '0301',
          fylkeId: '5',
          fylke: { id: '5', navn: 'Oslo', nummer: '03' }
        },
        {
          id: '2',
          navn: 'Bergen',
          nummer: '4601',
          fylkeId: '11',
          fylke: { id: '11', navn: 'Vestland', nummer: '46' }
        },
        {
          id: '3',
          navn: 'Trondheim',
          nummer: '5001',
          fylkeId: '9',
          fylke: { id: '9', navn: 'Trøndelag', nummer: '50' }
        },
        {
          id: '4',
          navn: 'Stavanger',
          nummer: '1103',
          fylkeId: '6',
          fylke: { id: '6', navn: 'Rogaland', nummer: '11' }
        },
      ];
      
      if (fylkeId) {
        return allKommuner.filter(k => k.fylkeId === fylkeId);
      }
      
      return allKommuner;
    },
    enabled: true, // Always enabled, filter is handled in queryFn
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    retry: 3,
    throwOnError: false,
  });
}

/**
 * Get tettsteder (urban areas), optionally filtered by kommune
 */
export function useTettsteder(kommuneId?: string) {
  return useQuery({
    queryKey: locationKeys.tettsteder(kommuneId),
    queryFn: async (): Promise<TettstedWithKommune[]> => {
      // TODO: Implement when location service is migrated to Prisma
      // For now, return placeholder data
      const allTettsteder: TettstedWithKommune[] = [
        {
          id: '1',
          navn: 'Sentrum',
          kommuneId: '1',
          kommune: {
            id: '1',
            navn: 'Oslo',
            nummer: '0301',
            fylkeId: '5',
            fylke: { id: '5', navn: 'Oslo', nummer: '03' }
          }
        },
        {
          id: '2',
          navn: 'Grünerløkka',
          kommuneId: '1',
          kommune: {
            id: '1',
            navn: 'Oslo',
            nummer: '0301',
            fylkeId: '5',
            fylke: { id: '5', navn: 'Oslo', nummer: '03' }
          }
        },
      ];
      
      if (kommuneId) {
        return allTettsteder.filter(t => t.kommuneId === kommuneId);
      }
      
      return allTettsteder;
    },
    enabled: true,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    retry: 3,
    throwOnError: false,
  });
}

/**
 * Location lookup by search term
 */
export function useLocationLookup(searchTerm: string) {
  return useQuery({
    queryKey: locationKeys.lookup(searchTerm),
    queryFn: async () => {
      if (searchTerm.length < 2) return [];
      
      // TODO: Implement location search when service is migrated to Prisma
      // For now, return placeholder search results
      
      // Mock search results
      const mockLocations = [
        { id: '1', name: 'Oslo', type: 'fylke' as const, fullName: 'Oslo' },
        { id: '2', name: 'Bergen', type: 'kommune' as const, fullName: 'Bergen, Vestland' },
        { id: '3', name: 'Trondheim', type: 'kommune' as const, fullName: 'Trondheim, Trøndelag' },
        { id: '4', name: 'Stavanger', type: 'kommune' as const, fullName: 'Stavanger, Rogaland' },
      ];
      
      return mockLocations
        .filter(loc => loc.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .slice(0, 10);
    },
    enabled: searchTerm.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    throwOnError: false,
  });
}

/**
 * Get location details by ID and type
 */
export function useLocationDetails(id: string | undefined, type: 'fylke' | 'kommune' | 'tettsted') {
  return useQuery({
    queryKey: [...locationKeys.all, 'details', type, id || ''],
    queryFn: async () => {
      if (!id) return null;
      
      // TODO: Implement detailed location fetching
      // For now, return placeholder data based on type
      switch (type) {
        case 'fylke':
          return { id, navn: 'Oslo', nummer: '03' };
        case 'kommune':
          return { 
            id, 
            navn: 'Oslo', 
            nummer: '0301', 
            fylkeId: '5',
            fylke: { id: '5', navn: 'Oslo', nummer: '03' }
          };
        case 'tettsted':
          return { 
            id, 
            navn: 'Sentrum', 
            kommuneId: '1',
            kommune: {
              id: '1',
              navn: 'Oslo',
              nummer: '0301',
              fylkeId: '5',
              fylke: { id: '5', navn: 'Oslo', nummer: '03' }
            }
          };
        default:
          return null;
      }
    },
    enabled: !!id,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    retry: 3,
    throwOnError: false,
  });
}

/**
 * Location hierarchy hook - gets the full hierarchy for a location
 */
export function useLocationHierarchy(kommuneId: string | undefined) {
  const kommunerQuery = useKommuner();
  
  const hierarchy = kommunerQuery.data?.find(k => k.id === kommuneId);
  
  return {
    kommune: hierarchy || null,
    fylke: hierarchy?.fylke || null,
    isLoading: kommunerQuery.isLoading,
    error: kommunerQuery.error,
  };
}

/**
 * Location suggestions for forms
 */
export function useLocationSuggestions() {
  const fylkerQuery = useFylker();
  const kommunerQuery = useKommuner();
  
  const suggestions = {
    fylker: fylkerQuery.data || [],
    popularKommuner: kommunerQuery.data?.slice(0, 10) || [], // Top 10 most popular
    isLoading: fylkerQuery.isLoading || kommunerQuery.isLoading,
    error: fylkerQuery.error || kommunerQuery.error,
  };
  
  return suggestions;
}

/**
 * Distance calculation helper (placeholder)
 */
export function useDistanceCalculation() {
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    // Haversine formula for calculating distance between two points
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  };
  
  return { calculateDistance };
}

/**
 * Postal code lookup (placeholder)
 */
export function usePostalCodeLookup(postalCode: string) {
  return useQuery({
    queryKey: [...locationKeys.all, 'postal-code', postalCode],
    queryFn: async () => {
      if (postalCode.length !== 4) return null;
      
      // TODO: Implement postal code lookup when service is available
      // For now, return placeholder
      return {
        postalCode,
        place: 'Unknown',
        kommune: 'Unknown',
        fylke: 'Unknown',
      };
    },
    enabled: postalCode.length === 4,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    retry: 2,
    throwOnError: false,
  });
}