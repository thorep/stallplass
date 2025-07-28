import { prisma } from './prisma';
import type { counties, municipalities } from '@/generated/prisma';

export type County = counties;
export type Municipality = municipalities;

export interface MunicipalityWithCounty extends Municipality {
  counties: County;
}

class LocationService {

  /**
   * Get all counties
   */
  async getCounties(): Promise<County[]> {
    try {
      const counties = await prisma.counties.findMany({
        orderBy: {
          name: 'asc'
        }
      });
      return counties;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all municipalities, optionally filtered by county
   */
  async getMunicipalities(countyId?: string): Promise<MunicipalityWithCounty[]> {
    try {
      const municipalities = await prisma.municipalities.findMany({
        where: countyId ? { countyId } : undefined,
        include: {
          counties: true
        },
        orderBy: {
          name: 'asc'
        }
      });
      return municipalities;
    } catch (error) {
      throw error;
    }
  }

  // Note: tettsteder (urban settlements) not implemented in current schema

  /**
   * Get a specific county by ID
   */
  async getCounty(id: string): Promise<County | null> {
    try {
      const county = await prisma.counties.findUnique({
        where: { id }
      });
      return county;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get a specific municipality by ID with county relationship
   */
  async getMunicipality(id: string): Promise<MunicipalityWithCounty | null> {
    try {
      const municipality = await prisma.municipalities.findUnique({
        where: { id },
        include: {
          counties: true
        }
      });
      return municipality;
    } catch (error) {
      throw error;
    }
  }

  // Note: getTettsted not implemented - tettsteder not in current schema

  /**
   * Search for locations by name (fuzzy search across counties and municipalities)
   */
  async searchLocations(searchTerm: string): Promise<{
    counties: County[];
    municipalities: MunicipalityWithCounty[];
  }> {
    try {
      // Search counties
      const counties = await prisma.counties.findMany({
        where: {
          name: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        },
        orderBy: {
          name: 'asc'
        }
      });

      // Search municipalities
      const municipalities = await prisma.municipalities.findMany({
        where: {
          name: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        },
        include: {
          counties: true
        },
        orderBy: {
          name: 'asc'
        }
      });

      return {
        counties,
        municipalities,
      };
    } catch (error) {
      return {
        counties: [],
        municipalities: [],
      };
    }
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
    
    if (!municipalityNumber) {
      return {
        county_id: null,
        municipality_id: null, 
        county_name: null,
        municipality_name: null
      };
    }

    try {
      const municipality = await prisma.municipalities.findFirst({
        where: {
          municipalityNumber: municipalityNumber
        },
        include: {
          counties: true
        }
      });

      if (!municipality) {
        return {
          county_id: null,
          municipality_id: null,
          county_name: null,
          municipality_name: null
        };
      }
      
      return {
        county_id: municipality.countyId,
        municipality_id: municipality.id,
        county_name: municipality.counties?.name || null,
        municipality_name: municipality.name
      };
    } catch (error) {
      return {
        county_id: null,
        municipality_id: null,
        county_name: null,
        municipality_name: null
      };
    }
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