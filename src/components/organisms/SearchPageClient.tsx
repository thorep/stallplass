'use client';

import { useState } from 'react';
import { SearchPageClientProps, SearchFilters } from '@/types/components';
import SearchFiltersComponent from '@/components/organisms/SearchFilters';
import StableListingCard from '@/components/molecules/StableListingCard';
import BoxListingCard from '@/components/molecules/BoxListingCard';

type SearchMode = 'stables' | 'boxes';

export default function SearchPageClient({ 
  stables, 
  stableAmenities, 
  boxAmenities 
}: SearchPageClientProps) {
  const [searchMode, setSearchMode] = useState<SearchMode>('stables');
  const [filters, setFilters] = useState<SearchFilters>({
    location: '',
    minPrice: '',
    maxPrice: '',
    selectedStableAmenityIds: [],
    selectedBoxAmenityIds: [],
    availableSpaces: 'any',
    boxSize: 'any',
    boxType: 'any',
    horseSize: 'any'
  });

  // Filter stables based on current filters
  const filteredStables = stables.filter(stable => {
    // Location filter
    if (filters.location) {
      const locationMatch = 
        stable.location.toLowerCase().includes(filters.location.toLowerCase()) ||
        stable.address?.toLowerCase().includes(filters.location.toLowerCase()) ||
        stable.city?.toLowerCase().includes(filters.location.toLowerCase()) ||
        stable.county?.toLowerCase().includes(filters.location.toLowerCase());
      
      if (!locationMatch) return false;
    }

    // Price range filter
    if (filters.minPrice || filters.maxPrice) {
      const minPrice = filters.minPrice ? parseInt(filters.minPrice) : 0;
      const maxPrice = filters.maxPrice ? parseInt(filters.maxPrice) : Infinity;
      
      if (stable.priceRange.min > maxPrice || stable.priceRange.max < minPrice) {
        return false;
      }
    }

    // Available spaces filter
    if (filters.availableSpaces !== 'any') {
      if (filters.availableSpaces === 'none' && stable.availableBoxes > 0) return false;
      if (filters.availableSpaces === 'few' && stable.availableBoxes === 0) return false;
    }

    // Stable amenities filter
    if (filters.selectedStableAmenityIds.length > 0) {
      const stableAmenityIds = stable.amenities.map(a => a.amenity.id);
      const hasRequiredAmenities = filters.selectedStableAmenityIds.every(id => 
        stableAmenityIds.includes(id)
      );
      if (!hasRequiredAmenities) return false;
    }

    return true;
  });

  // Get all available boxes from filtered stables
  const allBoxes = filteredStables.flatMap(stable => 
    stable.boxes?.filter(box => box.isAvailable && box.isActive)?.map(box => ({
      ...box,
      stable: {
        id: stable.id,
        name: stable.name,
        location: stable.location,
        ownerName: stable.ownerName,
        rating: stable.rating,
        reviewCount: stable.reviewCount
      }
    })) || []
  );

  const isStableMode = searchMode === 'stables';
  const currentItems = isStableMode ? filteredStables : allBoxes;

  return (
    <>
      {/* Mobile-first layout */}
      <div className="flex flex-col lg:grid lg:grid-cols-4 lg:gap-8">
        {/* Mobile: Filters above results */}
        <div className="lg:col-span-1 order-1">
          <SearchFiltersComponent 
            stableAmenities={stableAmenities} 
            boxAmenities={boxAmenities}
            searchMode={searchMode}
            onSearchModeChange={setSearchMode}
            filters={filters}
            onFiltersChange={setFilters}
          />
        </div>

        {/* Results List */}
        <div className="lg:col-span-3 order-2">
          {/* Mobile-optimized controls */}
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-sm text-gray-500">
              {currentItems.length} {isStableMode ? 'staller' : 'bokser'} funnet
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-500 hidden sm:block">Sorter etter:</label>
              <select className="border border-gray-300 rounded-md px-3 py-2 text-sm flex-1 sm:flex-none">
                <option>Nyeste først</option>
                <option>Pris: Lav til høy</option>
                <option>Pris: Høy til lav</option>
                {isStableMode && <option>Flest ledige plasser</option>}
                <option>Høyest vurdert</option>
              </select>
            </div>
          </div>

          {currentItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-4">
                Ingen {isStableMode ? 'staller' : 'bokser'} funnet
              </div>
              <p className="text-gray-400">
                Prøv å justere søkekriteriene dine
              </p>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {isStableMode ? (
                filteredStables.map((stable) => (
                  <StableListingCard key={stable.id} stable={stable} />
                ))
              ) : (
                allBoxes.map((box) => (
                  <BoxListingCard key={box.id} box={box} />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}