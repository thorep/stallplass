import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/supabase-auth-context';
import { Tables } from '@/types/supabase';

// Helper function to get auth headers
const useAuthHeaders = () => {
  const { user, getIdToken } = useAuth();
  
  const getAuthHeaders = async () => {
    if (!user) throw new Error('Not authenticated');
    const token = await getIdToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };
  
  return getAuthHeaders;
};

// Base Supabase types - Norwegian terminology
type Utleie = Tables<'utleie'>;
type Stallplass = Tables<'stallplasser'>;
type Stall = Tables<'staller'>;
type Bruker = Tables<'brukere'>;

// API response types based on Supabase types - Norwegian terminology
export type UtleieMedRelasjoner = Utleie & {
  box: Pick<Stallplass, 'id' | 'name' | 'description' | 'price' | 'size' | 'er_innendors' | 'har_vindu' | 'har_strom' | 'har_vann' | 'maks_hest_storrelse' | 'images'>;
  stable: Pick<Stall, 'id' | 'name' | 'location' | 'eier_navn' | 'owner_phone' | 'owner_email'>;
  rider?: Pick<Bruker, 'id' | 'name' | 'email'>;
};

// MERK: Typen bruker nå riktige Supabase snake_case feltnavn (start_date, end_date, monthly_price, osv.)
// Komponenter som bruker denne typen må oppdateres til å bruke snake_case egenskaper:
// - startDate → start_date
// - endDate → end_date  
// - monthlyPrice → monthly_price
// - box.isIndoor → box.er_innendors
// - box.hasWindow → box.har_vindu
// - box.hasElectricity → box.har_strom
// - box.hasWater → box.har_vann
// - box.maxHorseSize → box.maks_hest_storrelse
// - stable.ownerName → stable.eier_navn
// - stable.ownerPhone → stable.owner_phone
// - stable.ownerEmail → stable.owner_email

/**
 * Hook for å hente utleier hvor brukeren er leietaker
 */
export function useMineUtleier(brukerId: string | undefined) {
  const getAuthHeaders = useAuthHeaders();
  
  return useQuery({
    queryKey: ['utleier', 'leietaker', brukerId],
    queryFn: async (): Promise<UtleieMedRelasjoner[]> => {
      if (!brukerId) throw new Error('Bruker-ID er påkrevd');
      
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/rentals?userId=${brukerId}&type=renter`, {
        headers
      });
      if (!response.ok) {
        throw new Error('Kunne ikke hente utleier');
      }
      return response.json();
    },
    enabled: !!brukerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for å hente utleier hvor brukeren er stalleier
 */
export function useStallUtleier(brukerId: string | undefined) {
  const getAuthHeaders = useAuthHeaders();
  
  return useQuery({
    queryKey: ['utleier', 'eier', brukerId],
    queryFn: async (): Promise<UtleieMedRelasjoner[]> => {
      if (!brukerId) throw new Error('Bruker-ID er påkrevd');
      
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/rentals?userId=${brukerId}&type=owner`, {
        headers
      });
      if (!response.ok) {
        throw new Error('Kunne ikke hente utleier');
      }
      return response.json();
    },
    enabled: !!brukerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for å hente både leietaker- og eier-utleier
 */
export function useAlleUtleier(brukerId: string | undefined) {
  const mineUtleier = useMineUtleier(brukerId);
  const stallUtleier = useStallUtleier(brukerId);
  
  return {
    mineUtleier,
    stallUtleier,
    isLoading: mineUtleier.isLoading || stallUtleier.isLoading,
    error: mineUtleier.error || stallUtleier.error,
  };
}

// Export types for use in components
export type {
  Utleie,
  Stallplass,
  Stall,
  Bruker
};