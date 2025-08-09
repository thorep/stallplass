"use client";

import Button from "@/components/atoms/Button";
import BoxListingCard from "@/components/molecules/BoxListingCard";
import PromotionalBanner from "@/components/molecules/PromotionalBanner";
import SearchResultsMap from "@/components/molecules/SearchResultsMap";
import SearchSort from "@/components/molecules/SearchSort";
import StableListingCard from "@/components/molecules/StableListingCard";
import SearchFiltersComponent from "@/components/organisms/SearchFilters";
import { useKampanjeFlag } from "@/hooks/useKampanjeFlag";
import { useInfiniteBoxSearch, useInfiniteStableSearch } from "@/hooks/useUnifiedSearch";
import { cn } from "@/lib/utils";
import { SearchFilters, SearchPageClientProps } from "@/types/components";
import { StableWithBoxStats } from "@/types/stable";
import {
  AdjustmentsHorizontalIcon,
  BuildingOffice2Icon,
  CubeIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
  const isKampanjeActive = useKampanjeFlag();

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
    // Separate price filters for each view
    stableMinPrice: "",
    stableMaxPrice: "",
    boxMinPrice: "",
    boxMaxPrice: "",
  });

  // Initialize state from URL parameters on mount
  useEffect(() => {
    const mode = searchParams.get("mode") as SearchMode;
    const sort = searchParams.get("sort") as SortOption;

    if (mode === "stables" || mode === "boxes") {
      setSearchMode(mode);
    }

    if (sort) {
      setSortOption(sort);
    }

    // Initialize filters from URL
    const urlFilters: SearchFilters = {
      fylkeId: searchParams.get("fylkeId") || "",
      kommuneId: searchParams.get("kommuneId") || "",
      minPrice: searchParams.get("minPrice") || "",
      maxPrice: searchParams.get("maxPrice") || "",
      selectedStableAmenityIds:
        searchParams.get("stableAmenities")?.split(",").filter(Boolean) || [],
      selectedBoxAmenityIds: searchParams.get("boxAmenities")?.split(",").filter(Boolean) || [],
      availableSpaces: searchParams.get("availableSpaces") || "any",
      boxSize: searchParams.get("boxSize") || "any",
      boxType: searchParams.get("boxType") || "any",
      horseSize: searchParams.get("horseSize") || "any",
      occupancyStatus: searchParams.get("occupancyStatus") || "available",
      // Separate price filters from URL
      stableMinPrice: searchParams.get("stableMinPrice") || "",
      stableMaxPrice: searchParams.get("stableMaxPrice") || "",
      boxMinPrice: searchParams.get("boxMinPrice") || "",
      boxMaxPrice: searchParams.get("boxMaxPrice") || "",
    };

    setFilters(urlFilters);
  }, [searchParams]); // Run when URL parameters change

  // Update URL when filters, search mode, or sort changes (debounced for price inputs)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams();

      // Add search mode and sort
      if (searchMode !== "boxes") params.set("mode", searchMode);
      if (sortOption !== "newest") params.set("sort", sortOption);

      // Add filters to URL (only if they have non-default values)
      if (filters.fylkeId) params.set("fylkeId", filters.fylkeId);
      if (filters.kommuneId) params.set("kommuneId", filters.kommuneId);
      if (filters.minPrice) params.set("minPrice", filters.minPrice);
      if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);

      // Add separate price filters
      if (filters.stableMinPrice) params.set("stableMinPrice", filters.stableMinPrice);
      if (filters.stableMaxPrice) params.set("stableMaxPrice", filters.stableMaxPrice);
      if (filters.boxMinPrice) params.set("boxMinPrice", filters.boxMinPrice);
      if (filters.boxMaxPrice) params.set("boxMaxPrice", filters.boxMaxPrice);

      if (filters.selectedStableAmenityIds.length > 0) {
        params.set("stableAmenities", filters.selectedStableAmenityIds.join(","));
      }
      if (filters.selectedBoxAmenityIds.length > 0) {
        params.set("boxAmenities", filters.selectedBoxAmenityIds.join(","));
      }
      if (filters.availableSpaces !== "any") params.set("availableSpaces", filters.availableSpaces);
      if (filters.boxSize !== "any") params.set("boxSize", filters.boxSize);
      if (filters.boxType !== "any") params.set("boxType", filters.boxType);
      if (filters.horseSize !== "any") params.set("horseSize", filters.horseSize);
      if (filters.occupancyStatus !== "available")
        params.set("occupancyStatus", filters.occupancyStatus);

      // Update URL without causing a navigation
      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.replace(newUrl, { scroll: false });
    }, 300); // 300ms debounce to avoid excessive URL updates while typing in price fields

    return () => clearTimeout(timeoutId);
  }, [filters, searchMode, sortOption, pathname, router]);

  // Convert SearchFilters to unified search format
  const searchFilters = useMemo(
    () => ({
      fylkeId: filters.fylkeId || undefined,
      kommuneId: filters.kommuneId || undefined,
      minPrice:
        searchMode === "stables"
          ? filters.stableMinPrice
            ? parseInt(filters.stableMinPrice)
            : undefined
          : filters.boxMinPrice
          ? parseInt(filters.boxMinPrice)
          : undefined,
      maxPrice:
        searchMode === "stables"
          ? filters.stableMaxPrice
            ? parseInt(filters.stableMaxPrice)
            : undefined
          : filters.boxMaxPrice
          ? parseInt(filters.boxMaxPrice)
          : undefined,
      amenityIds:
        searchMode === "stables"
          ? filters.selectedStableAmenityIds.length > 0
            ? filters.selectedStableAmenityIds
            : undefined
          : filters.selectedBoxAmenityIds.length > 0
          ? filters.selectedBoxAmenityIds
          : undefined,

      // Pass stable amenity IDs separately for box search
      stableAmenityIds:
        searchMode === "boxes" && filters.selectedStableAmenityIds.length > 0
          ? filters.selectedStableAmenityIds
          : undefined,

      // Box-specific filters (ignored when mode is 'stables')
      occupancyStatus: filters.occupancyStatus as "all" | "available" | "occupied" | undefined,
      boxSize: filters.boxSize !== "any" ? filters.boxSize : undefined,
      boxType: filters.boxType !== "any" ? (filters.boxType as "boks" | "utegang") : undefined,
      horseSize: filters.horseSize !== "any" ? filters.horseSize : undefined,

      // Stable-specific filters (ignored when mode is 'boxes')
      availableSpaces:
        filters.availableSpaces !== "any" ? (filters.availableSpaces as "available") : undefined,
    }),
    [filters, searchMode]
  );

  // Add sortBy to searchFilters
  const searchFiltersWithSort = useMemo(
    () => ({
      ...searchFilters,
      sortBy: sortOption,
    }),
    [searchFilters, sortOption]
  );

  // Use infinite search hooks
  const {
    data: stablesData,
    isLoading: stablesLoading,
    error: stablesError,
    fetchNextPage: fetchNextStablesPage,
    hasNextPage: hasNextStablesPage,
    isFetchingNextPage: isFetchingNextStablesPage,
    refetch: refetchStables,
  } = useInfiniteStableSearch(searchMode === "stables" ? searchFiltersWithSort : {});

  const {
    data: boxesData,
    isLoading: boxesLoading,
    error: boxesError,
    fetchNextPage: fetchNextBoxesPage,
    hasNextPage: hasNextBoxesPage,
    isFetchingNextPage: isFetchingNextBoxesPage,
    refetch: refetchBoxes,
  } = useInfiniteBoxSearch(searchMode === "boxes" ? searchFiltersWithSort : {});

  // Flatten paginated data
  const stables = useMemo(
    () => stablesData?.pages?.flatMap((page) => page.items) || [],
    [stablesData]
  );

  const boxes = useMemo(() => boxesData?.pages?.flatMap((page) => page.items) || [], [boxesData]);

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

  // Current items are already sorted by the API
  const currentItems = searchMode === "stables" ? stables : boxes;

  // Infinite scroll handler
  const handleLoadMore = useCallback(() => {
    if (searchMode === "stables" && hasNextStablesPage && !isFetchingNextStablesPage) {
      fetchNextStablesPage();
    } else if (searchMode === "boxes" && hasNextBoxesPage && !isFetchingNextBoxesPage) {
      fetchNextBoxesPage();
    }
  }, [
    searchMode,
    hasNextStablesPage,
    isFetchingNextStablesPage,
    fetchNextStablesPage,
    hasNextBoxesPage,
    isFetchingNextBoxesPage,
    fetchNextBoxesPage,
  ]);

  // Check if we can load more
  const canLoadMore = searchMode === "stables" ? hasNextStablesPage : hasNextBoxesPage;
  const isLoadingMore =
    searchMode === "stables" ? isFetchingNextStablesPage : isFetchingNextBoxesPage;

  // Intersection observer for automatic infinite scroll
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const observerCallback = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && canLoadMore && !isLoadingMore) {
        handleLoadMore();
      }
    },
    [canLoadMore, isLoadingMore, handleLoadMore]
  );

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(observerCallback, {
      threshold: 0.1,
    });

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [observerCallback]);

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
    <div className="flex flex-col lg:grid lg:grid-cols-4 lg:gap-8 lg:items-start">
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

        {/* Mobile: Search Mode Toggle - Outside expandable filters */}
        <div className="mt-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleSearchModeChange("boxes")}
              className={cn(
                "flex items-center justify-center px-4 py-3 text-button rounded-xl border-2 transition-all duration-200 touch-manipulation",
                searchMode === "boxes"
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300"
              )}
            >
              {/* <CubeIcon className="h-4 w-4 mr-2" /> */}
              Stallplasser
            </button>
            <button
              onClick={() => handleSearchModeChange("stables")}
              className={cn(
                "flex items-center justify-center px-4 py-3 text-button rounded-xl border-2 transition-all duration-200 touch-manipulation",
                searchMode === "stables"
                  ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300"
              )}
            >
              {/* <BuildingOffice2Icon className="h-4 w-4 mr-2" /> */}
              Staller
            </button>
          </div>
        </div>
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
        />
      </div>

      {/* Results List */}
      <div className="lg:col-span-3 order-2 min-h-0">
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

        {/* Desktop banner - only show on desktop */}
        {!isKampanjeActive && (
          <div className="hidden sm:block mb-4">
            <PromotionalBanner />
          </div>
        )}

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
                      <StableListingCard
                        key={stable.id}
                        stable={stable}
                        highlightedAmenityIds={filters.selectedStableAmenityIds}
                      />
                    ))
                  : boxes.map((box) => (
                      <BoxListingCard
                        key={box.id}
                        box={box}
                        highlightedBoxAmenityIds={filters.selectedBoxAmenityIds}
                        highlightedStableAmenityIds={filters.selectedStableAmenityIds}
                      />
                    ))}

                {/* Infinite Scroll Trigger */}
                {canLoadMore && (
                  <div ref={loadMoreRef} className="flex justify-center py-8">
                    {isLoadingMore ? (
                      <div className="flex items-center text-gray-500">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mr-3"></div>
                        Laster flere {searchMode === "stables" ? "staller" : "bokser"}...
                      </div>
                    ) : (
                      <Button onClick={handleLoadMore} variant="outline" className="min-w-[200px]">
                        Last flere {searchMode === "stables" ? "staller" : "bokser"}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
