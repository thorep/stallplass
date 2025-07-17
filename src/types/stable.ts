export interface Amenity {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Box {
  id: string;
  name: string;
  description: string | null;
  price: number;
  size: number | null;
  isAvailable: boolean;
  isIndoor: boolean;
  hasWindow: boolean;
  hasDoor: boolean;
  hasElectricity: boolean;
  hasWater: boolean;
  maxHorseSize: string | null;
  specialNotes: string | null;
  images: string[];
  stableId: string;
  amenities: {
    amenity: Amenity;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Stable {
  id: string;
  name: string;
  description: string;
  location: string;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  county?: string | null;
  rating: number;
  reviewCount: number;
  images: string[];
  amenities: {
    amenity: Amenity;
  }[];
  boxes?: Box[];
  owner: {
    name: string | null;
    email: string;
  };
  ownerId: string; // Firebase Auth UID
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  createdAt: Date;
  featured: boolean;
}

// Helper interfaces for API responses
export interface StableWithBoxStats extends Omit<Stable, 'boxes'> {
  totalBoxes: number;
  availableBoxes: number;
  priceRange: {
    min: number;
    max: number;
  };
  boxes?: Box[];
}

export interface BoxWithStable extends Box {
  stable: Pick<Stable, 'id' | 'name' | 'location' | 'ownerName' | 'ownerPhone' | 'ownerEmail'>;
}