// Service layer types
import type { Prisma } from '@/generated/prisma';

// These types are already defined in stable.ts, so we re-export them
export type { StableWithAmenities, StableSearchFilters } from './stable';

// Use Prisma UncheckedCreateInput type to allow direct foreign key assignment
export type CreateStableData = Prisma.stablesUncheckedCreateInput & {
  amenityIds?: string[]; // Array of amenity IDs for many-to-many relation
  kommuneNumber?: string; // Kommune number from Geonorge API for location mapping (kommunenummer)
  postnummer?: string; // Postal number from address API response  
  poststed?: string; // Postal place from address API response
  countyId?: string; // County ID after lookup
  municipalityId?: string; // Municipality ID after lookup
};

export type UpdateStableData = Prisma.stablesUncheckedUpdateInput & {
  amenityIds?: string[]; // Array of amenity IDs for many-to-many relation
  kommuneNumber?: string; // Kommune number from Geonorge API for location mapping (kommunenummer)
  postnummer?: string; // Postal number from address API response  
  poststed?: string; // Postal place from address API response
  countyId?: string; // County ID after lookup
  municipalityId?: string; // Municipality ID after lookup
  county?: string; // County name (temporary field for lookup)
  municipality?: string; // Municipality name (temporary field for lookup)
};


// Box Service Types
export type CreateBoxData = Prisma.boxesCreateInput & {
  amenityIds?: string[]; // Array of amenity IDs for many-to-many relation
};

export type UpdateBoxData = Prisma.boxesUpdateInput & {
  id: string;
  amenityIds?: string[];
};

export interface BoxFilters {
  stableId?: string;
  isAvailable?: boolean;
  isActive?: boolean;
  minPrice?: number;
  maxPrice?: number;
  isIndoor?: boolean;
  hasWindow?: boolean;
  hasElectricity?: boolean;
  hasWater?: boolean;
  maxHorseSize?: string;
  amenityIds?: string[];
}

// Profile Service Types
export type CreateProfileData = {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  bio?: string;
  avatar?: string;
};

export type UpdateProfileData = Prisma.profilesUpdateInput;