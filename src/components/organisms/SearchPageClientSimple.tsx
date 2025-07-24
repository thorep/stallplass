"use client";

import Button from "@/components/atoms/Button";
import BoxListingCard from "@/components/molecules/BoxListingCard";
import SearchResultsMap from "@/components/molecules/SearchResultsMap";
import SearchSort from "@/components/molecules/SearchSort";
import StableListingCard from "@/components/molecules/StableListingCard";
import SearchFiltersComponent from "@/components/organisms/SearchFilters";
import { useBoxSearch } from "@/hooks/useBoxQueries";
import { useStableSearch } from "@/hooks/useStableQueries";
import { SearchFilters, SearchPageClientProps } from "@/types/components";
import { StableSearchFilters, StableWithBoxStats } from "@/types/stable";
import { AdjustmentsHorizontalIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useMemo, useState } from "react";

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
  | "featured_first"
  | "sponsored_first"
  | "name_asc"
  | "name_desc";

export default function SearchPageClientSimple({
  stableAmenities,
  boxAmenities,
}: SearchPageClientProps) {
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

  // Convert SearchFilters to StableSearchFilters format for TanStack Query
  const stableSearchFilters: StableSearchFilters = useMemo(
    () => ({
      minPrice: filters.minPrice ? parseInt(filters.minPrice) : undefined,
      maxPrice: filters.maxPrice ? parseInt(filters.maxPrice) : undefined,
      amenityIds:
        filters.selectedStableAmenityIds.length > 0 ? filters.selectedStableAmenityIds : undefined,
      hasAvailableBoxes: filters.availableSpaces !== "any",
      isIndoor:
        filters.boxType === "indoor" ? true : filters.boxType === "outdoor" ? false : undefined,
      maxHorseSize: filters.horseSize !== "any" ? filters.horseSize : undefined,
    }),
    [filters]
  );

  // Use TanStack Query hook for stable search
  const {
    data: stables = [],
    isLoading: stablesLoading,
    error: stablesError,
    refetch: refetchStables,
  } = useStableSearch(searchMode === "stables" ? stableSearchFilters : {});

  // Convert SearchFilters to useBoxSearch format
  const boxSearchFilters = useMemo(
    () => ({
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
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });
      case "oldest":
        return sorted.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
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
          const aSpon = "is_sponsored" in a ? (a.is_sponsored ? 1 : 0) : 0;
          const bSpon = "is_sponsored" in b ? (b.is_sponsored ? 1 : 0) : 0;
          return bSpon - aSpon;
        });
      case "available_high":
        if (searchMode === "boxes") {
          return sorted.sort((a, b) => {
            const aAvail = "is_available" in a ? (a.is_available ? 1 : 0) : 0;
            const bAvail = "is_available" in b ? (b.is_available ? 1 : 0) : 0;
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
                    ? stables.map((stable) => (
                        <StableListingCard key={stable.id} stable={stable as StableWithBoxStats} />
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
