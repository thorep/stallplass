// Service layer types
import type { Prisma } from '@/generated/prisma';

// These types are already defined in stable.ts, so we re-export them
export type { StableWithAmenities, StableSearchFilters } from './stable';

// Use Prisma CreateInput type and extend with additional fields
export type CreateStableData = Prisma.stablesCreateInput & {
  amenityIds: string[]; // Array of amenity IDs for many-to-many relation
  kommuneNumber?: string; // Kommune number from Geonorge API for location mapping
  municipality?: string; // Municipality name for proper location display
};

export type UpdateStableData = Prisma.stablesUpdateInput & {
  amenityIds?: string[];
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

// User Service Types
export type CreateUserData = {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  bio?: string;
  avatar?: string;
};

export type UpdateUserData = Prisma.usersUpdateInput;