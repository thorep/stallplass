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
  amenities: string[];
  owner: {
    name: string;
    phone: string;
    email: string;
  };
  ownerId: string; // Firebase Auth UID
  createdAt: Date;
  featured: boolean;
}