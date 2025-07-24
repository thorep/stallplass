import type { 
  stables, 
  boxes, 
  stable_amenities, 
  box_amenities, 
  stable_faqs,
  users,
  BoxType,
  ConversationStatus,
  PaymentStatus,
  RentalStatus,
  Prisma
} from '@/generated/prisma';

// Use Prisma-generated types directly
export type Stable = stables;
export type StableInsert = Prisma.stablesCreateInput;
export type StableUpdate = Prisma.stablesUpdateInput;

export type Box = boxes;
export type BoxInsert = Prisma.boxesCreateInput;
export type BoxUpdate = Prisma.boxesUpdateInput;

export type StableAmenity = stable_amenities;
export type BoxAmenity = box_amenities;
export type StableFAQ = stable_faqs;

// Type aliases for enums
export type { BoxType, ConversationStatus, PaymentStatus, RentalStatus };

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
  totalBoxes?: number;
  availableBoxes?: number;
  priceRange?: {
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

export type BoxWithStablePreview = Box & {
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
    advertisingActive: boolean | null;
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
  limit?: number;
}