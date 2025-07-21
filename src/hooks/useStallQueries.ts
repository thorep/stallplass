import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

// Direct Supabase types - Norwegian terminology
type Stall = Database['public']['Tables']['stables']['Row'];
type StallFasiliteter = Database['public']['Tables']['stall_fasiliteter']['Row'];
type Stallplass = Database['public']['Tables']['boxes']['Row'];
type Bruker = Database['public']['Tables']['users']['Row'];

// Extended types for relations - Norwegian terminology
type StallMedFasiliteter = Stall & {
  amenities: { amenity: StallFasiliteter }[];
  owner: Pick<Bruker, 'name' | 'email'>;
  boxes?: (Stallplass & { amenities: { amenity: Database['public']['Tables']['stallplass_fasiliteter']['Row'] }[] })[];
  faqs?: Database['public']['Tables']['stall_ofte_spurte_sporsmal']['Row'][];
};

type StallMedStallplassStatistikk = StallMedFasiliteter & {
  totalStallplasser: number;
  tilgjengeligeStallplasser: number;
  prisområde: { min: number; max: number };
};

// Search filters type - Norwegian terminology
type StallSøkefilter = {
  query?: string;
  lokasjon?: string;
  minPris?: number;
  maxPris?: number;
  fasiliteterIds?: string[];
  harTilgjengeligeStallplasser?: boolean;
  er_innendors?: boolean;
  har_vindu?: boolean;
  har_strom?: boolean;
  har_vann?: boolean;
  maks_hest_storrelse?: string;
};

/**
 * Hent alle offentlige staller (med aktiv annonsering)
 * Enkel hook som henter staller med grunnleggende relasjoner
 */
export function useStaller() {
  return useQuery({
    queryKey: ['stables', 'offentlig'],
    queryFn: async (): Promise<StallMedFasiliteter[]> => {
      const { data, error } = await supabase
        .from('stables')
        .select(`
          *,
          amenities:stall_fasilitet_lenker(
            amenity:stall_fasiliteter(*)
          ),
          owner:brukere!staller_eier_id_fkey(
            name,
            email
          )
        `)
        .eq('reklame_aktiv', true)
        .order('featured', { ascending: false })
        .order('opprettet_dato', { ascending: false });

      if (error) throw error;
      // Type assertion needed due to complex Supabase relation types
      return data as unknown as StallMedFasiliteter[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hent enkelt stall etter ID med full informasjon
 * Inkluderer stallplasser, FAQs, og alle relasjoner
 */
export function useStall(id?: string) {
  return useQuery({
    queryKey: ['stables', 'detalj', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('stables')
        .select(`
          *,
          stallplasser(*),
          owner:brukere!staller_eier_id_fkey(
            name,
            email
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hent staller med stallplass-statistikk
 * Brukes for listesider som viser tilgjengelighet og prising
 */
export function useStallerMedStatistikk() {
  return useQuery({
    queryKey: ['stables', 'medStatistikk'],
    queryFn: async (): Promise<StallMedStallplassStatistikk[]> => {
      const { data, error } = await supabase
        .from('stables')
        .select(`
          *,
          amenities:stall_fasilitet_lenker(
            amenity:stall_fasiliteter(*)
          ),
          stallplasser(*),
          owner:brukere!staller_eier_id_fkey(
            name,
            email
          )
        `)
        .order('featured', { ascending: false })
        .order('opprettet_dato', { ascending: false });

      if (error) throw error;

      // Kalkuler stallplass-statistikk
      const stallerMedStatistikk = data.map(stall => {
        const alleStallplasser = stall.stallplasser || [];
        const tilgjengeligeStallplasser = alleStallplasser.filter(stallplass => stallplass.er_tilgjengelig);
        const priser = alleStallplasser.map(stallplass => stallplass.grunnpris).filter(pris => pris > 0);
        
        return {
          ...stall,
          totalStallplasser: alleStallplasser.length,
          tilgjengeligeStallplasser: tilgjengeligeStallplasser.length,
          prisområde: priser.length > 0 
            ? { min: Math.min(...priser), max: Math.max(...priser) }
            : { min: 0, max: 0 }
        };
      });

      // Type assertion needed due to complex Supabase relation types  
      return stallerMedStatistikk as unknown as StallMedStallplassStatistikk[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Søk staller med filtre
 * Håndterer tekst-søk, lokasjon, pris, og fasilitetsfiltrering
 */
export function useStallSøk(filtre: StallSøkefilter = {}) {
  return useQuery({
    queryKey: ['stables', 'søk', filtre],
    queryFn: async (): Promise<StallMedFasiliteter[]> => {
      const { query, lokasjon, minPris, maxPris, fasiliteterIds, harTilgjengeligeStallplasser } = filtre;

      // Start med grunnleggende spørring
      let supabaseQuery = supabase
        .from('stables')
        .select(`
          *,
          amenities:stall_fasilitet_lenker(
            amenity:stall_fasiliteter(*)
          ),
          owner:brukere!staller_eier_id_fkey(
            name,
            email
          )
        `);

      // Tekst-søk
      if (query) {
        supabaseQuery = supabaseQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%,location.ilike.%${query}%`);
      }

      // Lokasjonssøk
      if (lokasjon) {
        supabaseQuery = supabaseQuery.or(`location.ilike.%${lokasjon}%,address.ilike.%${lokasjon}%,city.ilike.%${lokasjon}%`);
      }

      // For stallplass-nivå filtre, hent matchende stall-IDer først
      if (harTilgjengeligeStallplasser || minPris || maxPris) {
        let stallplassQuery = supabase.from('boxes').select('stall_id');
        
        if (harTilgjengeligeStallplasser) {
          stallplassQuery = stallplassQuery.eq('er_tilgjengelig', true);
        }
        if (minPris) {
          stallplassQuery = stallplassQuery.gte('price', minPris);
        }
        if (maxPris) {
          stallplassQuery = stallplassQuery.lte('price', maxPris);
        }

        const { data: matchendeStallplasser, error: stallplassError } = await stallplassQuery;
        if (stallplassError) throw stallplassError;

        const stallIds = [...new Set(matchendeStallplasser.map(stallplass => stallplass.stall_id))];
        if (stallIds.length === 0) return [];
        
        supabaseQuery = supabaseQuery.in('id', stallIds);
      }

      // Fasilitetsfiltre
      if (fasiliteterIds && fasiliteterIds.length > 0) {
        const { data: fasilitetsLenker, error: fasilitetsError } = await supabase
          .from('stall_fasilitet_lenker')
          .select('stall_id')
          .in('amenity_id', fasiliteterIds);

        if (fasilitetsError) throw fasilitetsError;

        const stallIds = [...new Set(fasilitetsLenker.map(lenke => lenke.stall_id))];
        if (stallIds.length === 0) return [];
        
        supabaseQuery = supabaseQuery.in('id', stallIds);
      }

      const { data, error } = await supabaseQuery
        .order('featured', { ascending: false })
        .order('opprettet_dato', { ascending: false });

      if (error) throw error;
      // Type assertion needed due to complex Supabase relation types
      return data as unknown as StallMedFasiliteter[];
    },
    enabled: Object.keys(filtre).length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes (kortere for søkeresultater)
  });
}

/**
 * Hent staller etter eier
 * Brukes i eier-dashbord og admin-visninger
 */
export function useStallerEtterEier(eierId?: string) {
  return useQuery({
    queryKey: ['stables', 'etterEier', eierId],
    queryFn: async (): Promise<StallMedFasiliteter[]> => {
      if (!eierId) return [];

      const { data, error } = await supabase
        .from('stables')
        .select(`
          *,
          amenities:stall_fasilitet_lenker(
            amenity:stall_fasiliteter(*)
          ),
          owner:brukere!staller_eier_id_fkey(
            name,
            email
          )
        `)
        .eq('eier_id', eierId)
        .order('opprettet_dato', { ascending: false });

      if (error) throw error;
      return data as StallMedFasiliteter[];
    },
    enabled: !!eierId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hent fremhevede staller for hjemmeside
 * Enkel spørring for markedsføringsinnhold
 */
export function useFremhevedeStaller() {
  return useQuery({
    queryKey: ['stables', 'fremhevede'],
    queryFn: async (): Promise<StallMedFasiliteter[]> => {
      const { data, error } = await supabase
        .from('stables')
        .select(`
          *,
          amenities:stall_fasilitet_lenker(
            amenity:stall_fasiliteter(*)
          ),
          owner:brukere!staller_eier_id_fkey(
            name,
            email
          )
        `)
        .eq('featured', true)
        .order('opprettet_dato', { ascending: false })
        .limit(6);

      if (error) throw error;
      return data as StallMedFasiliteter[];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (fremhevet innhold endres sjeldnere)
  });
}

// Export types for use in components
export type {
  Stall,
  StallFasiliteter,
  Stallplass,
  Bruker,
  StallMedFasiliteter,
  StallMedStallplassStatistikk,
  StallSøkefilter
};