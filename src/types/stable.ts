import { Tables, TablesInsert, TablesUpdate, Enums } from './supabase';

// Use Supabase-generated types directly with modern syntax
export type Stable = Tables<'stables'>;
export type StableInsert = TablesInsert<'stables'>;
export type StableUpdate = TablesUpdate<'stables'>;

export type Box = Tables<'boxes'>;
export type BoxInsert = TablesInsert<'boxes'>;
export type BoxUpdate = TablesUpdate<'boxes'>;

export type StableAmenity = Tables<'stable_amenities'>;
export type BoxAmenity = Tables<'box_amenities'>;
export type StableFAQ = Tables<'stable_faqs'>;

// Type aliases for enums
export type BoxType = Enums<'box_type'>;
export type ConversationStatus = Enums<'conversation_status'>;
export type PaymentStatus = Enums<'payment_status'>;
export type RentalStatus = Enums<'rental_status'>;

// Extended types for complex queries (only when needed)
export type StableWithAmenities = Stable & {
  amenities: {
    amenity: StableAmenity;
  }[];
  boxes?: Box[];
  faqs?: StableFAQ[];
  owner: {
    name: string | null;
    email: string;
  };
};

export type StableWithBoxStats = Stable & {
  totalBoxes: number;
  availableBoxes: number;
  priceRange: {
    min: number;
    max: number;
  };
  boxes?: Box[];
  amenities?: {
    amenity: StableAmenity;
  }[];
  owner?: {
    name: string | null;
    email: string;
  };
};

export type BoxWithAmenities = Box & {
  amenities: {
    amenity: BoxAmenity;
  }[];
};

export type BoxWithStable = Box & {
  stable: Stable;
};