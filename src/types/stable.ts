export interface Amenity {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Stable {
  id: string;
  name: string;
  description: string;
  location: string;
  price: number;
  availableSpaces: number;
  totalSpaces: number;
  rating: number;
  reviewCount: number;
  images: string[];
  amenities: {
    amenity: Amenity;
  }[];
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