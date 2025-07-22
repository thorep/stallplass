// Service layer types
import { Database } from './supabase';

// These types are already defined in stable.ts, so we re-export them
export type { StableWithAmenities, StableSearchFilters } from './stable';

// Use Supabase Insert type and extend with additional fields
export type CreateStableData = Database['public']['Tables']['stables']['Insert'] & {
  amenityIds: string[]; // Array of amenity IDs for many-to-many relation
  kommuneNumber?: string; // Kommune number from Geonorge API for location mapping
  municipality?: string; // Municipality name for proper location display
};

export type UpdateStableData = Database['public']['Tables']['stables']['Update'] & {
  amenityIds?: string[];
};


// Box Service Types
export type CreateBoxData = Database['public']['Tables']['boxes']['Insert'] & {
  amenityIds?: string[]; // Array of amenity IDs for many-to-many relation
};

export type UpdateBoxData = Database['public']['Tables']['boxes']['Update'] & {
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
  id: string;
  email: string;
  name?: string;
  phone?: string;
  bio?: string;
  avatar?: string;
};

export type UpdateUserData = Database['public']['Tables']['users']['Update'];