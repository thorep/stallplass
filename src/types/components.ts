// Component prop types
import { StableWithBoxStats, BoxWithStable } from './stable';
import { StableAmenity, BoxAmenity } from './index';

// Search and Filter Types
export interface SearchFilters {
  fylkeId: string;
  kommuneId: string;
  minPrice: string;
  maxPrice: string;
  // For horse page: 'salg' (sell) vs 'kjop' (buy)
  horseTrade?: 'sell' | 'buy';
  selectedStableAmenityIds: string[];
  selectedBoxAmenityIds: string[];
  availableSpaces: string;
  boxSize: string;
  boxType: string;
  horseSize: string;
  occupancyStatus: string; // 'all', 'available', 'occupied'
  dagsleie: string; // 'any', 'yes', 'no'
  // Separate price filters for each view
  stableMinPrice: string;
  stableMaxPrice: string;
  boxMinPrice: string;
  boxMaxPrice: string;
  // Service-specific filters
  serviceType: string; // 'any', 'veterinarian', 'farrier', 'trainer'
  // Horse sales-specific filters
  breedId: string;
  disciplineId: string;
  gender: string; // 'HOPPE', 'HINGST', 'VALLACH'
  minAge: string;
  maxAge: string;
  horseSalesSize: string; // 'KATEGORI_4', 'KATEGORI_3', etc.
  // Horse buy-specific extra filters
  minHeight?: string;
  maxHeight?: string;
}

export interface SearchPageClientProps {
  stableAmenities: StableAmenity[];
  boxAmenities: BoxAmenity[];
}

export interface SearchFiltersProps {
  stableAmenities: StableAmenity[];
  boxAmenities: BoxAmenity[];
  searchMode: 'stables' | 'boxes' | 'services' | 'forhest' | 'horse_sales';
  onSearchModeChange: (mode: 'stables' | 'boxes' | 'services' | 'forhest' | 'horse_sales') => void;
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
}

// Card Component Props
export interface StableCardProps {
  stable: StableWithBoxStats;
}

export interface StableListingCardProps {
  stable: StableWithBoxStats;
}

export interface BoxListingCardProps {
  box: BoxWithStable;
}

// Modal and Form Props
export interface AddressSearchProps {
  value?: string;
  onChange: (address: string, coordinates?: { lat: number; lon: number }) => void;
  placeholder?: string;
  className?: string;
}
