// Component prop types
import { StableWithBoxStats, BoxWithStable, BoxWithStablePreview } from './stable';
import { StableAmenity, BoxAmenity } from './index';

// Search and Filter Types
export interface SearchFilters {
  location: string;
  minPrice: string;
  maxPrice: string;
  selectedStableAmenityIds: string[];
  selectedBoxAmenityIds: string[];
  availableSpaces: string;
  boxSize: string;
  boxType: string;
  horseSize: string;
  occupancyStatus: string; // 'all', 'available', 'occupied'
}

export interface SearchPageClientProps {
  stables: StableWithBoxStats[];
  stableAmenities: StableAmenity[];
  boxAmenities: BoxAmenity[];
}

export interface SearchFiltersProps {
  stableAmenities: StableAmenity[];
  boxAmenities: BoxAmenity[];
  searchMode: 'stables' | 'boxes';
  onSearchModeChange: (mode: 'stables' | 'boxes') => void;
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

export interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  maxFileSize?: number;
}