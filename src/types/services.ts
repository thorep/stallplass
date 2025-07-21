// Service layer types
import { Database } from './supabase';

// These types are already defined in stable.ts, so we re-export them
export type { StableWithAmenities } from './stable';

// Use Supabase Insert type and extend with additional fields
export type CreateStableData = Database['public']['Tables']['staller']['Insert'] & {
  amenityIds: string[]; // Array of amenity IDs for many-to-many relation
};

export type UpdateStableData = Database['public']['Tables']['staller']['Update'] & {
  amenityIds?: string[];
};

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
export type CreateBoxData = Database['public']['Tables']['stallplasser']['Insert'] & {
  amenityIds?: string[]; // Array of amenity IDs for many-to-many relation
};

export type UpdateBoxData = Database['public']['Tables']['stallplasser']['Update'] & {
  id: string;
  amenityIds?: string[];
};

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
export type CreateUserData = {
  firebase_id: string;
  email: string;
  name?: string;
  phone?: string;
  bio?: string;
  avatar?: string;
};

export type UpdateUserData = Database['public']['Tables']['brukere']['Update'];