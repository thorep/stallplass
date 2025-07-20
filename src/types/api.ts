// API and data fetching types

// Common API Response Types
export interface APIResponse<T> {
  data: T;
  error?: string;
  success: boolean;
}

export interface APIError {
  error: string;
  message: string;
  statusCode: number;
}

// Pagination Types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// TanStack Query Hook Types
export interface UseStablesOptions {
  withBoxStats?: boolean;
  ownerId?: string;
  enabled?: boolean;
}

export interface UseBoxesOptions {
  stableId?: string;
  isAvailable?: boolean;
  enabled?: boolean;
}

export interface UseAmenitiesOptions {
  type?: 'stable' | 'box';
  enabled?: boolean;
}

// Form Data Types
export interface StableFormData {
  name: string;
  description: string;
  address: string;
  city: string;
  postal_code: string;
  county?: string;
  coordinates?: { lat: number; lon: number };
  images: string[];
  amenityIds: string[];
  owner_name: string;
  owner_phone: string;
  owner_email: string;
  featured?: boolean;
}

export interface BoxFormData {
  name: string;
  description?: string;
  price: number;
  size?: number;
  is_available?: boolean;
  is_active?: boolean;
  is_indoor?: boolean;
  has_window?: boolean;
  has_electricity?: boolean;
  has_water?: boolean;
  max_horse_size?: string;
  special_notes?: string;
  images?: string[];
  amenityIds?: string[];
}

// Search and Filter Types
export interface SearchParams {
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
  page?: number;
  limit?: number;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}