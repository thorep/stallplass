"use client";

import Button from "@/components/atoms/Button";
import BoxListingCard from "@/components/molecules/BoxListingCard";
import SearchResultsMap from "@/components/molecules/SearchResultsMap";
import SearchSort from "@/components/molecules/SearchSort";
import StableListingCard from "@/components/molecules/StableListingCard";
import SearchFiltersComponent from "@/components/organisms/SearchFilters";
import { useBoxSearch } from "@/hooks/useBoxes";
import { useStableSearch } from "@/hooks/useStables";
import { SearchFilters, SearchPageClientProps } from "@/types/components";
import { StableSearchFilters, StableWithBoxStats } from "@/types/stable";
import { AdjustmentsHorizontalIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

type SearchMode = "stables" | "boxes";
type SortOption =
  | "newest"
  | "oldest"
  | "price_low"
  | "price_high"
  | "rating_high"
  | "rating_low"
  | "available_high"
  | "available_low"
  | "sponsored_first"
  | "name_asc"
  | "name_desc";

export default function SearchPageClientSimple({
  stableAmenities,
  boxAmenities,
}: SearchPageClientProps) {
  // URL parameter hooks
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const [searchMode, setSearchMode] = useState<SearchMode>("boxes");
  const [showFilters, setShowFilters] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>("newest");

  const [filters, setFilters] = useState<SearchFilters>({
    fylkeId: "",
    kommuneId: "",
    minPrice: "",
    maxPrice: "",
    selectedStableAmenityIds: [],
    selectedBoxAmenityIds: [],
    availableSpaces: "any",
    boxSize: "any",
    boxType: "any",
    horseSize: "any",
    occupancyStatus: "available", // Default to available boxes only
  });

  // Initialize state from URL parameters on mount
  useEffect(() => {
    const mode = searchParams.get('mode') as SearchMode;
    const sort = searchParams.get('sort') as SortOption;
    
    if (mode === 'stables' || mode === 'boxes') {
      setSearchMode(mode);
    }
    
    if (sort) {
      setSortOption(sort);
    }

    // Initialize filters from URL
    const urlFilters: SearchFilters = {
      fylkeId: searchParams.get('fylkeId') || "",
      kommuneId: searchParams.get('kommuneId') || "",
      minPrice: searchParams.get('minPrice') || "",
      maxPrice: searchParams.get('maxPrice') || "",
      selectedStableAmenityIds: searchParams.get('stableAmenities')?.split(',').filter(Boolean) || [],
      selectedBoxAmenityIds: searchParams.get('boxAmenities')?.split(',').filter(Boolean) || [],
      availableSpaces: searchParams.get('availableSpaces') || "any",
      boxSize: searchParams.get('boxSize') || "any",
      boxType: searchParams.get('boxType') || "any",
      horseSize: searchParams.get('horseSize') || "any",
      occupancyStatus: searchParams.get('occupancyStatus') || "available",
    };

    setFilters(urlFilters);
  }, [searchParams]); // Run when URL parameters change

  // Update URL when filters, search mode, or sort changes (debounced for price inputs)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams();
      
      // Add search mode and sort
      if (searchMode !== 'boxes') params.set('mode', searchMode);
      if (sortOption !== 'newest') params.set('sort', sortOption);
      
      // Add filters to URL (only if they have non-default values)
      if (filters.fylkeId) params.set('fylkeId', filters.fylkeId);
      if (filters.kommuneId) params.set('kommuneId', filters.kommuneId);
      if (filters.minPrice) params.set('minPrice', filters.minPrice);
      if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
      if (filters.selectedStableAmenityIds.length > 0) {
        params.set('stableAmenities', filters.selectedStableAmenityIds.join(','));
      }
      if (filters.selectedBoxAmenityIds.length > 0) {
        params.set('boxAmenities', filters.selectedBoxAmenityIds.join(','));
      }
      if (filters.availableSpaces !== 'any') params.set('availableSpaces', filters.availableSpaces);
      if (filters.boxSize !== 'any') params.set('boxSize', filters.boxSize);
      if (filters.boxType !== 'any') params.set('boxType', filters.boxType);
      if (filters.horseSize !== 'any') params.set('horseSize', filters.horseSize);
      if (filters.occupancyStatus !== 'available') params.set('occupancyStatus', filters.occupancyStatus);

      // Update URL without causing a navigation
      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.replace(newUrl, { scroll: false });
    }, 300); // 300ms debounce to avoid excessive URL updates while typing in price fields

    return () => clearTimeout(timeoutId);
  }, [filters, searchMode, sortOption, pathname, router]);

  // Convert SearchFilters to StableSearchFilters format for TanStack Query
  const stableSearchFilters: StableSearchFilters = useMemo(
    () => ({
      fylkeId: filters.fylkeId || undefined,
      kommuneId: filters.kommuneId || undefined,
      minPrice: filters.minPrice ? parseInt(filters.minPrice) : undefined,
      maxPrice: filters.maxPrice ? parseInt(filters.maxPrice) : undefined,
      amenityIds:
        filters.selectedStableAmenityIds.length > 0 ? filters.selectedStableAmenityIds : undefined,
      hasAvailableBoxes: filters.availableSpaces === "available" ? true : undefined,
      isIndoor:
        filters.boxType === "indoor" ? true : filters.boxType === "outdoor" ? false : undefined,
      maxHorseSize: filters.horseSize !== "any" ? filters.horseSize : undefined,
    }),
    [filters]
  );

  // Use TanStack Query hook for stable search
  const {
    data: stables = [] as StableWithBoxStats[],
    isLoading: stablesLoading,
    error: stablesError,
    refetch: refetchStables,
  } = useStableSearch(searchMode === "stables" ? stableSearchFilters : {});

  // Convert SearchFilters to useBoxSearch format
  const boxSearchFilters = useMemo(
    () => ({
      fylkeId: filters.fylkeId || undefined,
      kommuneId: filters.kommuneId || undefined,
      minPrice: filters.minPrice ? parseInt(filters.minPrice) : undefined,
      maxPrice: filters.maxPrice ? parseInt(filters.maxPrice) : undefined,
      isIndoor:
        filters.boxType === "indoor" ? true : filters.boxType === "outdoor" ? false : undefined,
      amenityIds:
        filters.selectedBoxAmenityIds.length > 0 ? filters.selectedBoxAmenityIds : undefined,
    }),
    [filters]
  );

  // Use TanStack Query hook for box search
  const {
    data: boxes = [],
    isLoading: boxesLoading,
    error: boxesError,
    refetch: refetchBoxes,
  } = useBoxSearch(searchMode === "boxes" ? boxSearchFilters : {});

  // Detect mobile screen size
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  // Determine current loading and error states
  const isLoading = searchMode === "stables" ? stablesLoading : boxesLoading;
  const error =
    searchMode === "stables"
      ? stablesError
        ? stablesError.message
        : null
      : boxesError
      ? boxesError.message
      : null;

  // Apply sorting
  const sortedResults = useMemo(() => {
    const items = searchMode === "stables" ? stables : boxes;
    const sorted = [...items];

    switch (sortOption) {
      case "newest":
        return sorted.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
      case "oldest":
        return sorted.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateA - dateB;
        });
      case "price_low":
        return sorted.sort((a, b) => {
          const priceA = "price" in a ? a.price || 0 : 0;
          const priceB = "price" in b ? b.price || 0 : 0;
          return priceA - priceB;
        });
      case "price_high":
        return sorted.sort((a, b) => {
          const priceA = "price" in a ? a.price || 0 : 0;
          const priceB = "price" in b ? b.price || 0 : 0;
          return priceB - priceA;
        });
      case "name_asc":
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case "name_desc":
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      case "sponsored_first":
        return sorted.sort((a, b) => {
          const aSpon = "isSponsored" in a ? (a.isSponsored ? 1 : 0) : 0;
          const bSpon = "isSponsored" in b ? (b.isSponsored ? 1 : 0) : 0;
          return bSpon - aSpon;
        });
      case "available_high":
        if (searchMode === "boxes") {
          return sorted.sort((a, b) => {
            const aAvail = "isAvailable" in a ? (a.isAvailable ? 1 : 0) : 0;
            const bAvail = "isAvailable" in b ? (b.isAvailable ? 1 : 0) : 0;
            return bAvail - aAvail;
          });
        }
        return sorted;
      default:
        return sorted;
    }
  }, [searchMode, stables, boxes, sortOption]);

  const currentItems = sortedResults;

  // Auto-hide filters on mobile when search mode changes
  const handleSearchModeChange = (mode: "stables" | "boxes") => {
    setSearchMode(mode);
    // Reset map view when switching to boxes mode
    if (mode === "boxes") {
      setShowMap(false);
    }
    // Optionally hide filters on mobile after selection
    if (isMobile) {
      setShowFilters(false);
    }
  };

  const handleToggleMap = () => {
    setShowMap(!showMap);
  };

  const handleRefresh = () => {
    if (searchMode === "stables") {
      refetchStables();
    } else {
      refetchBoxes();
    }
  };

  return (
    <>
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

        {/* Filters */}
        <div className={`lg:col-span-1 order-1 ${showFilters ? "block" : "hidden lg:block"}`}>
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
          {/* Search sorting */}
          <SearchSort
            searchMode={searchMode}
            onSortChange={setSortOption}
            currentSort={sortOption}
            totalResults={currentItems.length}
            isLoading={isLoading}
            showMap={showMap}
            onToggleMap={handleToggleMap}
          />

          {/* Error state */}
          {error && (
            <div className="text-center py-12">
              <div className="text-red-500 text-lg mb-4">
                Feil ved lasting av {searchMode === "stables" ? "staller" : "bokser"}
              </div>
              <p className="text-gray-400 mb-4">{error}</p>
              <Button onClick={handleRefresh} variant="outline">
                Prøv igjen
              </Button>
            </div>
          )}

          {isLoading && !error ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <div className="text-gray-500 text-lg">
                Laster {searchMode === "stables" ? "staller" : "bokser"}...
              </div>
            </div>
          ) : currentItems.length === 0 && !error ? (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-4">
                Ingen {searchMode === "stables" ? "staller" : "bokser"} funnet
              </div>
              <p className="text-gray-400">Prøv å justere søkekriteriene dine</p>
            </div>
          ) : (
            <div>
              {/* Show map view for stables or regular list view */}
              {searchMode === "stables" && showMap ? (
                <SearchResultsMap
                  stables={stables as StableWithBoxStats[]}
                  className="w-full h-96 md:h-[500px] lg:h-[600px]"
                />
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  {searchMode === "stables"
                    ? stables.map((stable: StableWithBoxStats) => (
                        <StableListingCard key={stable.id} stable={stable} />
                      ))
                    : boxes.map((box) => <BoxListingCard key={box.id} box={box} />)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
