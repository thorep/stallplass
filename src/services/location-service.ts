import { supabase } from '@/lib/supabase';
import type { counties, municipalities } from '@/generated/prisma';

export type County = counties;
export type Municipality = municipalities;

export interface MunicipalityWithCounty extends Municipality {
  county: County;
}

class LocationService {
  private supabase = supabase;

  /**
   * Get all counties
   */
  async getCounties(): Promise<County[]> {
    const { data, error } = await this.supabase
      .from('counties')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching counties:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get all municipalities, optionally filtered by county
   */
  async getMunicipalities(countyId?: string): Promise<MunicipalityWithCounty[]> {
    let query = this.supabase
      .from('municipalities')
      .select(`
        *,
        county:counties(*)
      `)
      .order('name');

    if (countyId) {
      query = query.eq('countyId', countyId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching municipalities:', error);
      throw error;
    }

    return data || [];
  }

  // Note: tettsteder (urban settlements) not implemented in current schema

  /**
   * Get a specific county by ID
   */
  async getCounty(id: string): Promise<County | null> {
    const { data, error } = await this.supabase
      .from('counties')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching county:', error);
      throw error;
    }

    return data;
  }

  /**
   * Get a specific municipality by ID with county relationship
   */
  async getMunicipality(id: string): Promise<MunicipalityWithCounty | null> {
    const { data, error } = await this.supabase
      .from('municipalities')
      .select(`
        *,
        county:counties(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching municipality:', error);
      throw error;
    }

    return data;
  }

  // Note: getTettsted not implemented - tettsteder not in current schema

  /**
   * Search for locations by name (fuzzy search across counties and municipalities)
   */
  async searchLocations(searchTerm: string): Promise<{
    counties: County[];
    municipalities: MunicipalityWithCounty[];
  }> {
    const searchPattern = `%${searchTerm}%`;

    // Search counties
    const { data: counties } = await this.supabase
      .from('counties')
      .select('*')
      .ilike('name', searchPattern)
      .order('name');

    // Search municipalities
    const { data: municipalities } = await this.supabase
      .from('municipalities')
      .select(`
        *,
        county:counties(*)
      `)
      .ilike('name', searchPattern)
      .order('name');

    return {
      counties: counties || [],
      municipalities: municipalities || [],
    };
  }

  /**
   * Find county and municipality IDs by municipality number from Geonorge API
   * This is the most reliable way to match location data
   */
  async findLocationIdsByMunicipalityNumber(municipalityNumber: string): Promise<{
    county_id: string | null;
    municipality_id: string | null;
    county_name: string | null;
    municipality_name: string | null;
  }> {
    console.log('LocationService: Looking up municipality number:', municipalityNumber);
    
    if (!municipalityNumber) {
      console.log('LocationService: No municipalityNumber provided');
      return {
        county_id: null,
        municipality_id: null, 
        county_name: null,
        municipality_name: null
      };
    }

    const { data, error } = await this.supabase
      .from('municipalities')
      .select(`
        id,
        name,
        municipalityNumber,
        countyId,
        county:counties(id, name, countyNumber)
      `)
      .eq('municipalityNumber', municipalityNumber)
      .limit(1) as { data: Array<{
        id: string;
        name: string;
        municipalityNumber: string;
        countyId: string;
        county: {
          id: string;
          name: string;
          countyNumber: string;
        };
      }> | null; error: Error | null };

    if (error) {
      console.error('LocationService: Error finding location by municipality number:', error, municipalityNumber);
      return {
        county_id: null,
        municipality_id: null,
        county_name: null,
        municipality_name: null
      };
    }

    if (!data || data.length === 0) {
      console.warn(`LocationService: Municipality not found for number: ${municipalityNumber}`);
      return {
        county_id: null,
        municipality_id: null,
        county_name: null,
        municipality_name: null
      };
    }

    const municipality = data[0];
    console.log('LocationService: Found municipality data:', {
      municipality_id: municipality.id,
      municipality_name: municipality.name,
      county_id: municipality.countyId,
      county_name: municipality.county?.name || null
    });
    
    return {
      county_id: municipality.countyId,
      municipality_id: municipality.id,
      county_name: municipality.county?.name || null,
      municipality_name: municipality.name
    };
  }

  // Backward compatibility methods with Norwegian naming
  async getFylker(): Promise<County[]> {
    return this.getCounties();
  }

  async getKommuner(fylkeId?: string): Promise<MunicipalityWithCounty[]> {
    return this.getMunicipalities(fylkeId);
  }

  async getFylke(id: string): Promise<County | null> {
    return this.getCounty(id);
  }

  async getKommune(id: string): Promise<MunicipalityWithCounty | null> {
    return this.getMunicipality(id);
  }

  async findLocationIdsByKommuneNumber(kommuneNumber: string): Promise<{
    fylke_id: string | null;
    kommune_id: string | null;
    fylke_navn: string | null;
    kommune_navn: string | null;
  }> {
    const result = await this.findLocationIdsByMunicipalityNumber(kommuneNumber);
    return {
      fylke_id: result.county_id,
      kommune_id: result.municipality_id,
      fylke_navn: result.county_name,
      kommune_navn: result.municipality_name,
    };
  }
}

export const locationService = new LocationService();