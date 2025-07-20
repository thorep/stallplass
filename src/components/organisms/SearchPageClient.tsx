'use client';

import { useState, useEffect } from 'react';
import { SearchPageClientProps, SearchFilters } from '@/types/components';
import SearchFiltersComponent from '@/components/organisms/SearchFilters';
import StableListingCard from '@/components/molecules/StableListingCard';
import BoxListingCard from '@/components/molecules/BoxListingCard';
import { AdjustmentsHorizontalIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Button from '@/components/atoms/Button';
import { useRealTimeBoxes, useRealTimeSponsoredPlacements } from '@/hooks/useRealTimeBoxes';

type SearchMode = 'stables' | 'boxes';

export default function SearchPageClient({ 
  stables, 
  stableAmenities, 
  boxAmenities 
}: SearchPageClientProps) {
  const [searchMode, setSearchMode] = useState<SearchMode>('boxes');
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    location: '',
    minPrice: '',
    maxPrice: '',
    selectedStableAmenityIds: [],
    selectedBoxAmenityIds: [],
    availableSpaces: 'any',
    boxSize: 'any',
    boxType: 'any',
    horseSize: 'any',
    occupancyStatus: 'available' // Default to available boxes only
  });

  // Convert filters to box service format
  const boxFilters = {
    occupancyStatus: filters.occupancyStatus,
    minPrice: filters.minPrice ? parseInt(filters.minPrice) : undefined,
    maxPrice: filters.maxPrice ? parseInt(filters.maxPrice) : undefined,
    amenityIds: filters.selectedBoxAmenityIds.length > 0 ? filters.selectedBoxAmenityIds : undefined,
    is_indoor: filters.boxType === 'indoor' ? true : filters.boxType === 'outdoor' ? false : undefined,
    max_horse_size: filters.horseSize !== 'any' ? filters.horseSize : undefined,
  };

  // Use real-time boxes hook
  const { 
    boxes: realTimeBoxes, 
    isLoading: isLoadingBoxes, 
    error: boxError,
    refresh: refreshBoxes 
  } = useRealTimeBoxes({
    filters: boxFilters,
    enabled: searchMode === 'boxes'
  });

  // Use real-time sponsored placements
  const { getSponsoredStatus } = useRealTimeSponsoredPlacements(searchMode === 'boxes');

  // Detect mobile screen size
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Refresh boxes when filters change
  useEffect(() => {
    if (searchMode === 'boxes' && refreshBoxes) {
      refreshBoxes();
    }
  }, [searchMode, filters, refreshBoxes]);

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
      const stableAmenityIds = stable.amenities?.map(a => a.amenity.id) || [];
      const hasRequiredAmenities = filters.selectedStableAmenityIds.every(id => 
        stableAmenityIds.includes(id)
      );
      if (!hasRequiredAmenities) return false;
    }

    return true;
  });

  // Apply location filtering to real-time boxes (client-side since we can't easily join location search server-side)
  const allBoxes = realTimeBoxes.filter(box => {
    if (filters.location) {
      const locationMatch = 
        box.stable.location?.toLowerCase().includes(filters.location.toLowerCase());
      if (!locationMatch) return false;
    }
    return true;
  }).map(box => {
    // Apply real-time sponsored status updates
    const sponsoredStatus = getSponsoredStatus(box.id);
    if (sponsoredStatus) {
      return {
        ...box,
        is_sponsored: sponsoredStatus.is_sponsored,
        sponsored_until: sponsoredStatus.sponsored_until
      };
    }
    return box;
  });

  const isStableMode = searchMode === 'stables';
  const currentItems = isStableMode ? filteredStables : allBoxes;

  // Auto-hide filters on mobile when search mode changes (optional UX improvement)
  const handleSearchModeChange = (mode: 'stables' | 'boxes') => {
    setSearchMode(mode);
    // Optionally hide filters on mobile after selection
    if (isMobile) {
      setShowFilters(false);
    }
  };

  return (
    <>
      {/* Mobile-first layout */}
      <div className="flex flex-col lg:grid lg:grid-cols-4 lg:gap-8">
        {/* Mobile: Filter Toggle Button */}
        <div className="lg:hidden mb-4 order-0">
          <Button
            variant={showFilters ? "primary" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-center"
          >
            {showFilters ? (
              <>
                <XMarkIcon className="h-4 w-4 mr-2" />
                Skjul filtre
              </>
            ) : (
              <>
                <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
                Vis filtre
              </>
            )}
          </Button>
        </div>

        {/* Filters - Always visible on desktop, toggleable on mobile */}
        <div className={`lg:col-span-1 order-1 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <SearchFiltersComponent 
            stableAmenities={stableAmenities} 
            boxAmenities={boxAmenities}
            searchMode={searchMode}
            onSearchModeChange={handleSearchModeChange}
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
                <option>Nyeste første</option>
                <option>Pris: Lav til høy</option>
                <option>Pris: Høy til lav</option>
                {isStableMode && <option>Flest ledige plasser</option>}
                <option>Høyest vurdert</option>
              </select>
            </div>
          </div>

          {/* Error state for box loading */}
          {boxError && !isStableMode && (
            <div className="text-center py-12">
              <div className="text-red-500 text-lg mb-4">
                Feil ved lasting av bokser
              </div>
              <p className="text-gray-400 mb-4">{boxError}</p>
              <Button onClick={refreshBoxes} variant="outline">
                Prøv igjen
              </Button>
            </div>
          )}

          {isLoadingBoxes && !isStableMode && !boxError ? (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-4">
                Laster bokser...
              </div>
            </div>
          ) : currentItems.length === 0 && !boxError ? (
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