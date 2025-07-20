import { Database } from './supabase';

// Use Supabase-generated types directly
export type Stable = Database['public']['Tables']['stables']['Row'];
export type StableInsert = Database['public']['Tables']['stables']['Insert'];
export type StableUpdate = Database['public']['Tables']['stables']['Update'];

export type Box = Database['public']['Tables']['boxes']['Row'];
export type BoxInsert = Database['public']['Tables']['boxes']['Insert'];
export type BoxUpdate = Database['public']['Tables']['boxes']['Update'];

export type StableAmenity = Database['public']['Tables']['stable_amenities']['Row'];
export type BoxAmenity = Database['public']['Tables']['box_amenities']['Row'];
export type StableFAQ = Database['public']['Tables']['stable_faqs']['Row'];

// Type aliases for enums
export type BoxType = Database['public']['Enums']['box_type'];
export type ConversationStatus = Database['public']['Enums']['conversation_status'];
export type PaymentStatus = Database['public']['Enums']['payment_status'];
export type RentalStatus = Database['public']['Enums']['rental_status'];

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

export type BoxWithStable = Box & {
  stable: {
    id: string;
    name: string;
    location: string;
    owner_name: string;
    rating: number | null;
    review_count: number | null;
    images: string[] | null;
    image_descriptions: string[] | null;
  };
};