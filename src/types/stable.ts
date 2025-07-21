import { Database } from './supabase';

// Use Supabase-generated types directly
export type Stable = Database['public']['Tables']['staller']['Row'];
export type StableInsert = Database['public']['Tables']['staller']['Insert'];
export type StableUpdate = Database['public']['Tables']['staller']['Update'];

export type Box = Database['public']['Tables']['stallplasser']['Row'];
export type BoxInsert = Database['public']['Tables']['stallplasser']['Insert'];
export type BoxUpdate = Database['public']['Tables']['stallplasser']['Update'];

export type StableAmenity = Database['public']['Tables']['stall_fasiliteter']['Row'];
export type BoxAmenity = Database['public']['Tables']['stallplass_fasiliteter']['Row'];
export type StableFAQ = Database['public']['Tables']['stall_ofte_spurte_sporsmal']['Row'];

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

export type BoxWithAmenities = Box & {
  amenities: {
    amenity: BoxAmenity;
  }[];
};

export type BoxWithStable = Box & {
  stable: {
    id: string;
    name: string;
    location: string;
    eier_navn: string;
    rating: number | null;
    antall_anmeldelser: number | null;
    images: string[] | null;
    bilde_beskrivelser: string[] | null;
  };
};