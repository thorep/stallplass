'use client';

import { useState, useEffect, useMemo } from 'react';
import { SearchPageClientProps, SearchFilters } from '@/types/components';
import SearchFiltersComponent from '@/components/organisms/SearchFilters';
import StableListingCard from '@/components/molecules/StableListingCard';
import BoxListingCard from '@/components/molecules/BoxListingCard';
import SearchResultsMap from '@/components/molecules/SearchResultsMap';
import RealTimeSearchSort, { sortBoxes } from '@/components/molecules/RealTimeSearchSort';
import { AdjustmentsHorizontalIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Button from '@/components/atoms/Button';
import { useRealTimeBoxes, useRealTimeSponsoredPlacements } from '@/hooks/useRealTimeBoxes';
import { useRealTimeStables } from '@/hooks/useRealTimeStables';
import { StableWithBoxStats } from '@/types/stable';

type SearchMode = 'stables' | 'boxes';
type SortOption = 'newest' | 'oldest' | 'price_low' | 'price_high' | 'rating_high' | 'rating_low' | 'available_high' | 'available_low' | 'featured_first' | 'sponsored_first' | 'name_asc' | 'name_desc';

export default function SearchPageClient({ 
  stables: initialStables, 
  stableAmenities, 
  boxAmenities 
}: SearchPageClientProps) {
  const [searchMode, setSearchMode] = useState<SearchMode>('boxes');
  const [showFilters, setShowFilters] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [filters, setFilters] = useState<SearchFilters>({
    fylkeId: '',
    kommuneId: '',
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

  // Convert filters to service formats
  const stableFilters = {
    fylkeId: filters.fylkeId || undefined,
    kommuneId: filters.kommuneId || undefined,
    minPrice: filters.minPrice ? parseInt(filters.minPrice) : undefined,
    maxPrice: filters.maxPrice ? parseInt(filters.maxPrice) : undefined,
    amenityIds: filters.selectedStableAmenityIds.length > 0 ? filters.selectedStableAmenityIds : undefined,
    hasAvailableBoxes: filters.availableSpaces !== 'any',
  };

  const boxFilters = {
    fylkeId: filters.fylkeId || undefined,
    kommuneId: filters.kommuneId || undefined,
    is_available: filters.occupancyStatus === 'available' ? true : filters.occupancyStatus === 'occupied' ? false : undefined,
    minPrice: filters.minPrice ? parseInt(filters.minPrice) : undefined,
    maxPrice: filters.maxPrice ? parseInt(filters.maxPrice) : undefined,
    is_indoor: filters.boxType === 'indoor' ? true : filters.boxType === 'outdoor' ? false : undefined,
    max_horse_size: filters.horseSize !== 'any' ? filters.horseSize : undefined,
    amenityIds: filters.selectedBoxAmenityIds.length > 0 ? filters.selectedBoxAmenityIds : undefined,
  };

  // Use real-time stables hook
  const { 
    stables: realTimeStables, 
    isLoading: isLoadingStables, 
    error: stableError,
    refresh: refreshStables
  } = useRealTimeStables({
    filters: stableFilters,
    enabled: searchMode === 'stables',
    withBoxStats: true
  });

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

  // Use realTimeBoxes directly since location filtering is now done at the database level
  const locationFilteredBoxes = realTimeBoxes;

  // Refresh data when filters or search mode change
  useEffect(() => {
    if (searchMode === 'boxes' && refreshBoxes) {
      refreshBoxes();
    } else if (searchMode === 'stables' && refreshStables) {
      refreshStables();
    }
  }, [searchMode, filters, refreshBoxes, refreshStables]);

  // Apply additional client-side filtering for real-time updates
  const filteredStables = useMemo(() => {
    const locationFilteredStables = searchMode === 'stables' ? realTimeStables : [];
    
    if (!locationFilteredStables || !Array.isArray(locationFilteredStables)) {
      return [];
    }
    
    // For real-time data, rely on server-side filtering and just apply sorting
    return (locationFilteredStables || []).slice();
  }, [searchMode, realTimeStables]);

  // Apply additional filtering and sorting to boxes
  const filteredBoxes = useMemo(() => {
    const filtered = locationFilteredBoxes.map(box => {
      // Apply real-time sponsored status updates
      const sponsoredStatus = getSponsoredStatus(box.id);
      if (sponsoredStatus && typeof sponsoredStatus === 'object') {
        return {
          ...box,
          is_sponsored: sponsoredStatus.is_sponsored,
          sponsored_until: sponsoredStatus.sponsored_until
        };
      }
      return box;
    });

    // Apply sorting
    return sortBoxes(filtered, sortOption);
  }, [locationFilteredBoxes, getSponsoredStatus, sortOption]);

  const isStableMode = searchMode === 'stables';
  const currentItems = isStableMode ? filteredStables : filteredBoxes;
  const isLoading = isStableMode ? isLoadingStables : isLoadingBoxes;
  const error = isStableMode ? stableError : boxError;
  const refresh = isStableMode ? refreshStables : refreshBoxes;

  // Auto-hide filters on mobile when search mode changes (optional UX improvement)
  const handleSearchModeChange = (mode: 'stables' | 'boxes') => {
    setSearchMode(mode);
    // Reset map view when switching to boxes mode (map only works for stables)
    if (mode === 'boxes') {
      setShowMap(false);
    }
    // Optionally hide filters on mobile after selection
    if (isMobile) {
      setShowFilters(false);
    }
  };

  // Handle map toggle
  const handleToggleMap = () => {
    setShowMap(!showMap);
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
            totalResults={currentItems.length}
          />
        </div>

        {/* Results List */}
        <div className="lg:col-span-3 order-2">
          {/* Real-time search sorting */}
          <RealTimeSearchSort
            searchMode={searchMode}
            onSortChange={setSortOption}
            currentSort={sortOption}
            totalResults={currentItems.length}
            isLoading={isLoading}
            isRealTime={true}
            showMap={showMap}
            onToggleMap={handleToggleMap}
          />

          {/* Error state */}
          {error && (
            <div className="text-center py-12">
              <div className="text-red-500 text-lg mb-4">
                Feil ved lasting av {isStableMode ? 'staller' : 'bokser'}
              </div>
              <p className="text-gray-400 mb-4">{error}</p>
              <Button onClick={refresh} variant="outline">
                Prøv igjen
              </Button>
            </div>
          )}

          {isLoading && !error ? (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-4">
                Laster {isStableMode ? 'staller' : 'bokser'}...
              </div>
            </div>
          ) : currentItems.length === 0 && !error ? (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-4">
                Ingen {isStableMode ? 'staller' : 'bokser'} funnet
              </div>
              <p className="text-gray-400">
                Prøv å justere søkekriteriene dine
              </p>
            </div>
          ) : (
            <div>
              {/* Show map view for stables or regular list view */}
              {isStableMode && showMap ? (
                <SearchResultsMap 
                  stables={filteredStables as StableWithBoxStats[]}
                  className="w-full h-96 md:h-[500px] lg:h-[600px]"
                />
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  {isStableMode ? (
                    filteredStables.map((stable) => (
                      <StableListingCard key={stable.id} stable={stable as StableWithBoxStats} />
                    ))
                  ) : (
                    filteredBoxes.map((box) => (
                      <BoxListingCard key={box.id} box={box} />
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}