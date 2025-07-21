/**
 * Enkle, direkte Supabase-spørringer for stallplass-data
 * Følger techlead.md "Direkte og Enkel" prinsipper
 */

import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase";
import { useQuery } from "@tanstack/react-query";

// Bruk Supabase-typer som grunnlag - Norwegian terminology
type Stallplass = Database["public"]["Tables"]["boxes"]["Row"];
type StallplassMedStall = Stallplass & {
  stable: Database["public"]["Tables"]["stables"]["Row"];
};

/**
 * Hent alle tilgjengelige boxes med grunnleggende stallinformasjon
 */
export function useStallplasser() {
  return useQuery({
    queryKey: ["boxes"],
    queryFn: async (): Promise<StallplassMedStall[]> => {
      const { data, error } = await supabase
        .from("boxes")
        .select(
          `
          *,
          stable:stables(*)
        `
        )
        .eq("is_available", true)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hent enkelt stallplass med full informasjon
 */
export function useStallplass(id: string) {
  return useQuery({
    queryKey: ["stallplass", id],
    queryFn: async (): Promise<Stallplass | null> => {
      if (!id) return null;

      const { data, error } = await supabase.from("boxes").select("*").eq("id", id).single();

      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!id,
  });
}

/**
 * Søk boxes med filtre
 */
export function useStallplassSøk(
  filtre: {
    query?: string;
    minPris?: number;
    maxPris?: number;
    erInnendørs?: boolean;
    harVindu?: boolean;
    fasiliteterIds?: string[];
  } = {}
) {
  return useQuery({
    queryKey: ["boxes", "søk", filtre],
    queryFn: async (): Promise<StallplassMedStall[]> => {
      let spørring = supabase
        .from("boxes")
        .select(
          `
          *,
          stable:stables(*)
        `
        )
        .eq("is_available", true)
        .eq("is_active", true);

      // Anvendelse av filtre
      if (filtre.query) {
        spørring = spørring.or(`name.ilike.%${filtre.query}%,description.ilike.%${filtre.query}%`);
      }
      if (filtre.minPris) {
        spørring = spørring.gte("price", filtre.minPris);
      }
      if (filtre.maxPris) {
        spørring = spørring.lte("price", filtre.maxPris);
      }
      if (filtre.erInnendørs !== undefined) {
        spørring = spørring.eq("is_indoor", filtre.erInnendørs);
      }
      if (filtre.harVindu !== undefined) {
        spørring = spørring.eq("has_window", filtre.harVindu);
      }

      spørring = spørring.order("price", { ascending: true });

      const { data, error } = await spørring;
      if (error) throw error;
      return data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for søkeresultater
  });
}

/**
 * Hent alle boxes for en spesifikk stall
 */
export function useStallplasserEtterStall(stallId: string) {
  return useQuery({
    queryKey: ["boxes", "stall", stallId],
    queryFn: async (): Promise<Stallplass[]> => {
      if (!stallId) return [];

      const { data, error } = await supabase
        .from("boxes")
        .select("*")
        .eq("stable_id", stallId)
        .order("name", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!stallId,
  });
}

/**
 * Hent fremhevede/sponsede boxes for hjemmeside
 */
export function useFremhevedeStallplasser() {
  return useQuery({
    queryKey: ["boxes", "fremhevede"],
    queryFn: async (): Promise<StallplassMedStall[]> => {
      const { data, error } = await supabase
        .from("boxes")
        .select(
          `
          *,
          stable:stables(*)
        `
        )
        .eq("is_available", true)
        .eq("is_active", true)
        .eq("is_sponsored", true)
        .order("sponsored_until", { ascending: false })
        .limit(6);

      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Export types for use in components
export type { Stallplass, StallplassMedStall };
