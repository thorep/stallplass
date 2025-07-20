// Service layer types
import { Stable, StableAmenity, BoxAmenity, Box } from './index';

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
  total_boxes?: number | null;
  address: string;
  city: string;
  postal_code: string;
  county?: string;
  latitude?: number;
  longitude?: number;
  images: string[];
  image_descriptions?: string[]; // Array of descriptions matching images array order
  amenityIds: string[]; // Array of amenity IDs
  owner_id: string;
  owner_name: string;
  owner_phone: string;
  owner_email: string;
  featured?: boolean;
};

export type UpdateStableData = Partial<Omit<CreateStableData, 'owner_id'>>;

export interface StableSearchFilters {
  query?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  amenityIds?: string[];
  hasAvailableBoxes?: boolean;
  is_indoor?: boolean;
  has_window?: boolean;
  has_electricity?: boolean;
  has_water?: boolean;
  max_horse_size?: string;
}

// Box Service Types
export interface CreateBoxData {
  name: string;
  description?: string;
  price: number;
  size?: number;
  is_available?: boolean;
  is_active?: boolean;
  is_indoor?: boolean;
  has_window?: boolean;
  has_electricity?: boolean;
  has_water?: boolean;
  max_horse_size?: string;
  special_notes?: string;
  images?: string[];
  image_descriptions?: string[];
  amenityIds?: string[];
  stable_id: string;
}

export interface UpdateBoxData extends Partial<CreateBoxData> {
  id: string;
}

export interface BoxFilters {
  stable_id?: string;
  is_available?: boolean;
  is_active?: boolean;
  minPrice?: number;
  maxPrice?: number;
  is_indoor?: boolean;
  has_window?: boolean;
  has_electricity?: boolean;
  has_water?: boolean;
  max_horse_size?: string;
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