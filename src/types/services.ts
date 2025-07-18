// Service layer types
import { Stable, StableAmenity, BoxAmenity, Box } from '@prisma/client';

// Stable Service Types
export type StableWithAmenities = Stable & {
  amenities: {
    amenity: StableAmenity;
  }[];
  boxes?: (Box & {
    amenities: {
      amenity: BoxAmenity;
    }[];
  })[];
  owner: {
    name: string | null;
    email: string;
  };
};

export type CreateStableData = {
  name: string;
  description: string;
  address: string;
  city: string;
  postalCode: string;
  county?: string;
  latitude?: number;
  longitude?: number;
  images: string[];
  amenityIds: string[]; // Array of amenity IDs
  ownerId: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  featured?: boolean;
};

export type UpdateStableData = Partial<Omit<CreateStableData, 'ownerId'>>;

export interface StableSearchFilters {
  query?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  amenityIds?: string[];
  hasAvailableBoxes?: boolean;
  isIndoor?: boolean;
  hasWindow?: boolean;
  hasElectricity?: boolean;
  hasWater?: boolean;
  maxHorseSize?: string;
}

// Box Service Types
export interface CreateBoxData {
  name: string;
  description?: string;
  price: number;
  size?: number;
  isAvailable?: boolean;
  isActive?: boolean;
  isIndoor?: boolean;
  hasWindow?: boolean;
  hasDoor?: boolean;
  hasElectricity?: boolean;
  hasWater?: boolean;
  maxHorseSize?: string;
  specialNotes?: string;
  images?: string[];
  amenityIds?: string[];
  stableId: string;
}

export interface UpdateBoxData extends Partial<CreateBoxData> {
  id: string;
}

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
export interface CreateUserData {
  firebaseId: string;
  email: string;
  name?: string;
  phone?: string;
  bio?: string;
  avatar?: string;
}

export interface UpdateUserData {
  name?: string;
  phone?: string;
  bio?: string;
  avatar?: string;
}