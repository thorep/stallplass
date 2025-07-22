import { supabase } from '@/lib/supabase';
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
}

  /**\n   * Find fylke and kommune IDs by kommune number from Geonorge API\n   * This is the most reliable way to match location data\n   */\n  async findLocationIdsByKommuneNumber(kommuneNumber: string): Promise<{\n    fylke_id: string | null;\n    kommune_id: string | null;\n    fylke_navn: string | null;\n    kommune_navn: string | null;\n  }> {\n    if (!kommuneNumber) {\n      return {\n        fylke_id: null,\n        kommune_id: null, \n        fylke_navn: null,\n        kommune_navn: null\n      };\n    }\n\n    const { data, error } = await this.supabase\n      .from('kommuner')\n      .select(`\n        id,\n        navn,\n        kommune_nummer,\n        fylke_id,\n        fylke:fylker(id, navn, fylke_nummer)\n      `)\n      .eq('kommune_nummer', kommuneNumber)\n      .limit(1);\n\n    if (error) {\n      console.error('Error finding location by kommune number:', error, kommuneNumber);\n      return {\n        fylke_id: null,\n        kommune_id: null,\n        fylke_navn: null,\n        kommune_navn: null\n      };\n    }\n\n    if (!data || data.length === 0) {\n      console.warn(`Kommune not found for number: ${kommuneNumber}`);\n      return {\n        fylke_id: null,\n        kommune_id: null,\n        fylke_navn: null,\n        kommune_navn: null\n      };\n    }\n\n    const kommune = data[0];\n    return {\n      fylke_id: kommune.fylke_id,\n      kommune_id: kommune.id,\n      fylke_navn: kommune.fylke?.navn || null,\n      kommune_navn: kommune.navn\n    };\n  }\n}\n\nexport const locationService = new LocationService();