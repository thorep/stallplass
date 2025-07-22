import { supabase } from '@/lib/supabase';
import { supabaseServer } from '@/lib/supabase-server';
import type { Tables } from '@/types/supabase';

export type Fylke = Tables<'fylker'>;
export type Kommune = Tables<'kommuner'>;
export type Tettsted = Tables<'tettsteder'>;

export interface KommuneWithFylke extends Kommune {
  fylke: Fylke;
}

export interface TettstedWithKommune extends Tettsted {
  kommune: KommuneWithFylke;
}

class LocationService {
  private supabase = supabase;

  /**
   * Get all fylker (counties)
   */
  async getFylker(): Promise<Fylke[]> {
    const { data, error } = await this.supabase
      .from('fylker')
      .select('*')
      .order('navn');

    if (error) {
      console.error('Error fetching fylker:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get all kommuner (municipalities), optionally filtered by fylke
   */
  async getKommuner(fylkeId?: string): Promise<KommuneWithFylke[]> {
    let query = this.supabase
      .from('kommuner')
      .select(`
        *,
        fylke:fylker(*)
      `)
      .order('navn');

    if (fylkeId) {
      query = query.eq('fylke_id', fylkeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching kommuner:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get all tettsteder (urban settlements), optionally filtered by kommune
   */
  async getTettsteder(kommuneId?: string): Promise<TettstedWithKommune[]> {
    let query = this.supabase
      .from('tettsteder')
      .select(`
        *,
        kommune:kommuner(
          *,
          fylke:fylker(*)
        )
      `)
      .order('navn');

    if (kommuneId) {
      query = query.eq('kommune_id', kommuneId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching tettsteder:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get a specific fylke by ID
   */
  async getFylke(id: string): Promise<Fylke | null> {
    const { data, error } = await this.supabase
      .from('fylker')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching fylke:', error);
      throw error;
    }

    return data;
  }

  /**
   * Get a specific kommune by ID with fylke relationship
   */
  async getKommune(id: string): Promise<KommuneWithFylke | null> {
    const { data, error } = await this.supabase
      .from('kommuner')
      .select(`
        *,
        fylke:fylker(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching kommune:', error);
      throw error;
    }

    return data;
  }

  /**
   * Get a specific tettsted by ID with kommun and fylke relationships
   */
  async getTettsted(id: string): Promise<TettstedWithKommune | null> {
    const { data, error } = await this.supabase
      .from('tettsteder')
      .select(`
        *,
        kommune:kommuner(
          *,
          fylke:fylker(*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching tettsted:', error);
      throw error;
    }

    return data;
  }

  /**
   * Search for locations by name (fuzzy search across all levels)
   */
  async searchLocations(searchTerm: string): Promise<{
    fylker: Fylke[];
    kommuner: KommuneWithFylke[];
    tettsteder: TettstedWithKommune[];
  }> {
    const searchPattern = `%${searchTerm}%`;

    // Search fylker
    const { data: fylker } = await this.supabase
      .from('fylker')
      .select('*')
      .ilike('navn', searchPattern)
      .order('navn');

    // Search kommuner
    const { data: kommuner } = await this.supabase
      .from('kommuner')
      .select(`
        *,
        fylke:fylker(*)
      `)
      .ilike('navn', searchPattern)
      .order('navn');

    // Search tettsteder
    const { data: tettsteder } = await this.supabase
      .from('tettsteder')
      .select(`
        *,
        kommune:kommuner(
          *,
          fylke:fylker(*)
        )
      `)
      .ilike('navn', searchPattern)
      .order('navn');

    return {
      fylker: fylker || [],
      kommuner: kommuner || [],
      tettsteder: tettsteder || [],
    };
  }

  /**
   * Find fylke and kommune IDs by kommune number from Geonorge API
   * This is the most reliable way to match location data
   */
  async findLocationIdsByKommuneNumber(kommuneNumber: string): Promise<{
    fylke_id: string | null;
    kommune_id: string | null;
    fylke_navn: string | null;
    kommune_navn: string | null;
  }> {
    console.log('LocationService: Looking up kommunenummer:', kommuneNumber);
    
    if (!kommuneNumber) {
      console.log('LocationService: No kommuneNumber provided');
      return {
        fylke_id: null,
        kommune_id: null, 
        fylke_navn: null,
        kommune_navn: null
      };
    }

    // Use supabaseServer for server-side operations to bypass RLS
    const { data, error } = await supabaseServer
      .from('kommuner')
      .select(`
        id,
        navn,
        kommune_nummer,
        fylke_id,
        fylke:fylker(id, navn, fylke_nummer)
      `)
      .eq('kommune_nummer', kommuneNumber)
      .limit(1);

    if (error) {
      console.error('LocationService: Error finding location by kommune number:', error, kommuneNumber);
      return {
        fylke_id: null,
        kommune_id: null,
        fylke_navn: null,
        kommune_navn: null
      };
    }

    if (!data || data.length === 0) {
      console.warn(`LocationService: Kommune not found for number: ${kommuneNumber}`);
      return {
        fylke_id: null,
        kommune_id: null,
        fylke_navn: null,
        kommune_navn: null
      };
    }

    const kommune = data[0];
    console.log('LocationService: Found kommune data:', {
      kommune_id: kommune.id,
      kommune_navn: kommune.navn,
      fylke_id: kommune.fylke_id,
      fylke_navn: kommune.fylke?.navn
    });
    
    return {
      fylke_id: kommune.fylke_id,
      kommune_id: kommune.id,
      fylke_navn: kommune.fylke?.navn || null,
      kommune_navn: kommune.navn
    };
  }
}

export const locationService = new LocationService();