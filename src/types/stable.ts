import type {
  box_amenities,
  boxes,
  BoxType,
  ConversationStatus,
  counties,
  municipalities,
  Prisma,
  stable_amenities,
  stable_faqs,
  stables,
} from "@/generated/prisma";

// Use Prisma-generated types directly
export type Stable = stables;
export type StableInsert = Prisma.stablesCreateInput;
export type StableUpdate = Prisma.stablesUpdateInput;

export type Box = boxes & {
  advertisingDaysRemaining?: number;
  boostDaysRemaining?: number;
};
export type BoxInsert = Prisma.boxesCreateInput;
export type BoxUpdate = Prisma.boxesUpdateInput;

export type StableAmenity = stable_amenities;
export type BoxAmenity = box_amenities;
export type StableFAQ = stable_faqs;

// Type aliases for enums
export type { BoxType, ConversationStatus };

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
  availableBoxes?: number;
  priceRange?: {
    min: number;
    max: number;
  };
  boxes?: BoxWithDaysRemaining[];
  amenities?: {
    amenity: StableAmenity;
  }[];
  owner?: {
    name: string | null;
    email: string;
  };
  location?: string;
  counties?: counties | null;
  municipalities?: municipalities | null;
};

export type BoxWithAmenities = Box & {
  amenities: {
    amenity: BoxAmenity;
  }[];
};

export type BoxWithDaysRemaining = Box & {
  amenities: {
    amenity: BoxAmenity;
  }[];
  advertisingDaysRemaining: number;
  boostDaysRemaining: number;
};

export type BoxWithStable = Box & {
  stable: Stable;
};

export type BoxWithStablePreview = Box & {
  amenities: {
    amenity: BoxAmenity;
  }[];
  stable: {
    id: string;
    name: string;
    location: string;
    city: string | null;
    county: string | null;
    rating: number | null;
    reviewCount: number | null;
    images: string[];
    imageDescriptions: string[];
    owner?: {
      id: string;
      name: string | null;
      email: string;
    };
  };
};

// Search filters interface
export interface StableSearchFilters {
  query?: string;
  fylkeId?: string;
  kommuneId?: string;
  location?: string; // General location search
  minPrice?: number;
  maxPrice?: number;
  amenityIds?: string[];
  hasAvailableBoxes?: boolean;
  maxHorseSize?: string;
  // Box-specific filters
  isIndoor?: boolean;
  hasWindow?: boolean;
  hasElectricity?: boolean;
  hasWater?: boolean;
  limit?: number;
}
